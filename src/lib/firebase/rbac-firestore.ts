// Simplified Firestore Database Operations for RBAC System
import { 
  doc, 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  addDoc,
  orderBy,
  Timestamp,
  WriteBatch,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase-config';
import { 
  Role, 
  UserRole, 
  RoleName,
  Permission,
  MARKETPLACE_ROLES,
  CORE_PERMISSIONS,
  getRolePermissions,
  hasPermission
} from './rbac-schema';

// === FIRESTORE COLLECTIONS ===
export const RBAC_COLLECTIONS = {
  USER_ROLES: 'user_roles',
  AUDIT_LOGS: 'rbac_audit_logs'
} as const;

// === FIRESTORE DOCUMENT INTERFACES ===
export interface UserRoleDocument extends Omit<UserRole, 'assignedAt'> {
  assignedAt: Timestamp;
}

export interface AuditLogDocument {
  id: string;
  userId: string;
  targetUserId?: string;
  action: 'role_assigned' | 'role_changed' | 'user_invited' | 'org_updated';
  resource: string;
  resourceId: string;
  organizationId?: string;
  metadata: Record<string, any>;
  timestamp: Timestamp;
}

// === USER ROLE MANAGEMENT ===

/**
 * Assign a role to a user (simplified)
 */
export async function assignUserRole(
  userId: string,
  role: RoleName,
  assignedBy: string,
  organizationId?: string
): Promise<string> {
  try {
    // Check if user already has a role in this context
    const existingRole = await getUserRole(userId, organizationId);
    
    const userRoleRef = doc(collection(db, RBAC_COLLECTIONS.USER_ROLES));
    const userRole: UserRoleDocument = {
      id: userRoleRef.id,
      userId,
      role,
      organizationId,
      assignedBy,
      assignedAt: Timestamp.now(),
      isActive: true
    };

    await setDoc(userRoleRef, userRole);

    // Log audit event
    await logAuditEvent({
      userId: assignedBy,
      targetUserId: userId,
      action: existingRole ? 'role_changed' : 'role_assigned',
      resource: 'user_role',
      resourceId: userRoleRef.id,
      organizationId,
      metadata: { 
        newRole: role, 
        previousRole: existingRole?.role,
        roleName: MARKETPLACE_ROLES[role].name 
      }
    });

    // If user had existing role, deactivate it
    if (existingRole) {
      await updateDoc(doc(db, RBAC_COLLECTIONS.USER_ROLES, existingRole.id), {
        isActive: false
      });
    }

    return userRoleRef.id;
  } catch (error) {
    console.error('Error assigning user role:', error);
    throw error;
  }
}

/**
 * Get user's current role
 */
export async function getUserRole(
  userId: string,
  organizationId?: string
): Promise<UserRole | null> {
  try {
    let q = query(
      collection(db, RBAC_COLLECTIONS.USER_ROLES),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );

    if (organizationId) {
      q = query(q, where('organizationId', '==', organizationId));
    }

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data() as UserRoleDocument;
    
    return {
      ...data,
      assignedAt: data.assignedAt.toDate()
    };
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Get all users with a specific role in an organization
 */
export async function getUsersWithRole(
  role: RoleName,
  organizationId?: string
): Promise<UserRole[]> {
  try {
    let q = query(
      collection(db, RBAC_COLLECTIONS.USER_ROLES),
      where('role', '==', role),
      where('isActive', '==', true)
    );

    if (organizationId) {
      q = query(q, where('organizationId', '==', organizationId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data() as UserRoleDocument;
      return {
        ...data,
        assignedAt: data.assignedAt.toDate()
      };
    });
  } catch (error) {
    console.error('Error getting users with role:', error);
    return [];
  }
}

/**
 * Remove user from organization (deactivate role)
 */
export async function removeUserRole(
  userId: string,
  organizationId: string,
  removedBy: string
): Promise<void> {
  try {
    const userRole = await getUserRole(userId, organizationId);
    if (!userRole) throw new Error('User role not found');

    await updateDoc(doc(db, RBAC_COLLECTIONS.USER_ROLES, userRole.id), {
      isActive: false
    });

    // Log audit event
    await logAuditEvent({
      userId: removedBy,
      targetUserId: userId,
      action: 'role_changed',
      resource: 'user_role',
      resourceId: userRole.id,
      organizationId,
      metadata: { 
        action: 'removed',
        previousRole: userRole.role,
        roleName: MARKETPLACE_ROLES[userRole.role].name 
      }
    });
  } catch (error) {
    console.error('Error removing user role:', error);
    throw error;
  }
}

// === PERMISSION CHECKING ===

/**
 * Check if user has specific permission (simplified)
 */
export async function userHasPermission(
  userId: string,
  permission: Permission,
  organizationId?: string
): Promise<boolean> {
  try {
    const userRole = await getUserRole(userId, organizationId);
    if (!userRole) return false;
    
    return hasPermission(userRole.role, permission);
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(
  userId: string,
  organizationId?: string
): Promise<Permission[]> {
  try {
    const userRole = await getUserRole(userId, organizationId);
    if (!userRole) return [];
    
    return getRolePermissions(userRole.role);
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

/**
 * Check if user can perform admin actions
 */
export async function userCanManageOrganization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  return await userHasPermission(userId, 'org.admin', organizationId);
}

/**
 * Check if user can invite team members
 */
export async function userCanInviteUsers(
  userId: string,
  organizationId: string
): Promise<boolean> {
  return await userHasPermission(userId, 'team.invite', organizationId);
}

// === ORGANIZATION HELPERS ===

/**
 * Get organization admin users
 */
export async function getOrganizationAdmins(organizationId: string): Promise<UserRole[]> {
  try {
    const vendorAdmins = await getUsersWithRole('vendor_admin', organizationId);
    const customerAdmins = await getUsersWithRole('customer_admin', organizationId);
    return [...vendorAdmins, ...customerAdmins];
  } catch (error) {
    console.error('Error getting organization admins:', error);
    return [];
  }
}

/**
 * Get all organization members
 */
export async function getOrganizationMembers(organizationId: string): Promise<UserRole[]> {
  try {
    const q = query(
      collection(db, RBAC_COLLECTIONS.USER_ROLES),
      where('organizationId', '==', organizationId),
      where('isActive', '==', true),
      orderBy('assignedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data() as UserRoleDocument;
      return {
        ...data,
        assignedAt: data.assignedAt.toDate()
      };
    });
  } catch (error) {
    console.error('Error getting organization members:', error);
    return [];
  }
}

/**
 * Check if user is first in organization (should be admin)
 */
export async function isFirstUserInOrganization(organizationId: string): Promise<boolean> {
  try {
    const members = await getOrganizationMembers(organizationId);
    return members.length === 0;
  } catch (error) {
    console.error('Error checking if first user:', error);
    return false;
  }
}

// === AUDIT LOGGING ===

/**
 * Log an audit event (simplified)
 */
export async function logAuditEvent(
  event: Omit<AuditLogDocument, 'id' | 'timestamp'>
): Promise<void> {
  try {
    const auditRef = doc(collection(db, RBAC_COLLECTIONS.AUDIT_LOGS));
    const auditLog: AuditLogDocument = {
      ...event,
      id: auditRef.id,
      timestamp: Timestamp.now()
    };

    await setDoc(auditRef, auditLog);
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't throw error for audit logging
  }
}

/**
 * Get recent audit logs for organization
 */
export async function getAuditLogs(
  organizationId?: string,
  limit: number = 50
): Promise<AuditLogDocument[]> {
  try {
    let q = query(
      collection(db, RBAC_COLLECTIONS.AUDIT_LOGS),
      orderBy('timestamp', 'desc')
    );

    if (organizationId) {
      q = query(q, where('organizationId', '==', organizationId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, limit).map(doc => doc.data() as AuditLogDocument);
  } catch (error) {
    console.error('Error getting audit logs:', error);
    return [];
  }
}

// === BULK OPERATIONS ===

/**
 * Bulk invite users to organization
 */
export async function bulkInviteUsers(
  invitations: Array<{
    userId: string;
    role: RoleName;
  }>,
  organizationId: string,
  invitedBy: string
): Promise<string[]> {
  try {
    const batch = writeBatch(db);
    const assignmentIds: string[] = [];

    for (const invitation of invitations) {
      const userRoleRef = doc(collection(db, RBAC_COLLECTIONS.USER_ROLES));
      const userRole: UserRoleDocument = {
        id: userRoleRef.id,
        userId: invitation.userId,
        role: invitation.role,
        organizationId,
        assignedBy: invitedBy,
        assignedAt: Timestamp.now(),
        isActive: true
      };

      batch.set(userRoleRef, userRole);
      assignmentIds.push(userRoleRef.id);
    }

    await batch.commit();

    // Log audit events
    for (const invitation of invitations) {
      await logAuditEvent({
        userId: invitedBy,
        targetUserId: invitation.userId,
        action: 'user_invited',
        resource: 'user_role',
        resourceId: assignmentIds[invitations.indexOf(invitation)],
        organizationId,
        metadata: { 
          role: invitation.role,
          roleName: MARKETPLACE_ROLES[invitation.role].name,
          bulkOperation: true 
        }
      });
    }

    return assignmentIds;
  } catch (error) {
    console.error('Error bulk inviting users:', error);
    throw error;
  }
}

// === ROLE UTILITIES ===

/**
 * Get role statistics for organization
 */
export async function getOrganizationRoleStats(organizationId: string) {
  try {
    const members = await getOrganizationMembers(organizationId);
    
    const stats = {
      totalMembers: members.length,
      admins: members.filter(m => m.role.includes('admin')).length,
      members: members.filter(m => m.role.includes('member')).length,
      roleBreakdown: {} as Record<RoleName, number>
    };

    // Count roles
    members.forEach(member => {
      stats.roleBreakdown[member.role] = (stats.roleBreakdown[member.role] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error getting role stats:', error);
    return {
      totalMembers: 0,
      admins: 0,
      members: 0,
      roleBreakdown: {}
    };
  }
}