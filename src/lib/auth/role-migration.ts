/**
 * Role Migration Strategy
 * 
 * This module handles the migration from the simplified 2-role system 
 * to the enhanced 5-role system for both vendor and customer organizations.
 */

import { getAdminDb } from '@/lib/firebase';
import { logger } from '@/lib/utils/logger';
import { 
  MARKETPLACE_ROLES, 
  RoleName,
  getUserTypeRoles,
  getRolePermissions
} from '@/lib/firebase/rbac-schema';
import { 
  updateUserRolesInSession,
  syncUserToSessionClaims
} from '@/lib/auth/session-management';
import { 
  syncMarketplaceRoleToClerk,
  bulkSyncOrganizationMembers 
} from '@/lib/auth/role-mapping';

/**
 * Legacy role mapping to new role system
 */
export const LEGACY_ROLE_MAPPING = {
  // Vendor roles
  vendor_member: 'project_engineer', // Basic vendor members become project engineers
  vendor_admin: 'vendor_admin', // Admin stays admin
  
  // Customer roles  
  customer_member: 'project_lead_customer', // Basic customer members become project leads
  customer_admin: 'customer_admin', // Admin stays admin
  
  // Freelancer stays the same
  freelancer: 'freelancer'
} as const;

/**
 * Migration status tracking
 */
export interface MigrationStatus {
  userId: string;
  oldRole: string;
  newRole: RoleName;
  status: 'pending' | 'completed' | 'failed';
  migratedAt?: Date;
  error?: string;
}

/**
 * Migration report
 */
export interface MigrationReport {
  totalUsers: number;
  successful: number;
  failed: number;
  details: Array<{
    userId: string;
    email?: string;
    oldRole: string;
    newRole: RoleName;
    status: 'success' | 'failed';
    error?: string;
  }>;
  organizationBreakdown: Record<string, {
    orgName: string;
    orgType: string;
    userCount: number;
    successful: number;
    failed: number;
  }>;
}

/**
 * Migrate a single user from legacy role to new role system
 */
export async function migrateSingleUser(
  userId: string,
  organizationId?: string
): Promise<MigrationStatus> {
  try {
    const adminDb = await getAdminDb();
    
    // Get current user data
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error(`User ${userId} not found`);
    }

    const userData = userDoc.data()!;
    const oldRoles = userData.roles || [];
    
    // Determine current primary role
    let currentRole: string = 'freelancer';
    if (oldRoles.length > 0) {
      currentRole = typeof oldRoles[0] === 'string' ? oldRoles[0] : oldRoles[0].name;
    } else if (userData.userType) {
      // Fallback to user type for role assignment
      currentRole = userData.userType === 'vendor' ? 'vendor_member' : 
                   userData.userType === 'customer' ? 'customer_member' : 'freelancer';
    }

    // Map to new role
    const newRole = LEGACY_ROLE_MAPPING[currentRole as keyof typeof LEGACY_ROLE_MAPPING] as RoleName;
    if (!newRole) {
      throw new Error(`No migration mapping found for role: ${currentRole}`);
    }

    // Create new role object
    const roleData = {
      id: newRole,
      name: MARKETPLACE_ROLES[newRole].name,
      type: userData.organizationType || userData.userType || 'freelancer',
      permissions: getRolePermissions(newRole),
      organizationId: userData.organizationId || organizationId,
      tier: userData.userType === 'vendor' ? 'professional' : undefined
    };

    // Update user document with new role structure
    await adminDb.collection('users').doc(userId).update({
      roles: [roleData],
      migratedAt: new Date(),
      migrationVersion: '2.0',
      updatedAt: new Date()
    });

    // Update session claims
    await updateUserRolesInSession(userId, [roleData]);

    // Sync to Clerk if user is in an organization
    if (organizationId && newRole !== 'freelancer') {
      await syncMarketplaceRoleToClerk(userId, newRole, organizationId);
    }

    logger.info('Successfully migrated user role', {
      userId,
      oldRole: currentRole,
      newRole,
      organizationId
    });

    return {
      userId,
      oldRole: currentRole,
      newRole,
      status: 'completed',
      migratedAt: new Date()
    };

  } catch (error) {
    logger.error('Failed to migrate user role', error as Error, { userId });
    
    return {
      userId,
      oldRole: 'unknown',
      newRole: 'freelancer' as RoleName,
      status: 'failed',
      error: (error as Error).message
    };
  }
}

/**
 * Migrate all users in an organization
 */
export async function migrateOrganizationUsers(
  organizationId: string
): Promise<Array<MigrationStatus>> {
  try {
    const adminDb = await getAdminDb();
    
    // Get all users in organization
    const usersQuery = await adminDb
      .collection('users')
      .where('organizationId', '==', organizationId)
      .get();

    const migrationResults: Array<MigrationStatus> = [];
    
    // Process users in batches to avoid overwhelming the system
    const batchSize = 10;
    const users = usersQuery.docs;
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(userDoc => migrateSingleUser(userDoc.id, organizationId))
      );
      
      migrationResults.push(...batchResults);
      
      // Add delay between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logger.info('Organization migration completed', {
      organizationId,
      totalUsers: users.length,
      successful: migrationResults.filter(r => r.status === 'completed').length,
      failed: migrationResults.filter(r => r.status === 'failed').length
    });

    return migrationResults;

  } catch (error) {
    logger.error('Failed to migrate organization users', error as Error, { organizationId });
    throw error;
  }
}

/**
 * Run full system migration
 */
export async function runFullMigration(): Promise<MigrationReport> {
  try {
    const adminDb = await getAdminDb();
    
    // Get all users that need migration (those without migrationVersion)
    const usersQuery = await adminDb
      .collection('users')
      .where('migrationVersion', '==', null)
      .get();

    const allUsers = usersQuery.docs;
    const report: MigrationReport = {
      totalUsers: allUsers.length,
      successful: 0,
      failed: 0,
      details: [],
      organizationBreakdown: {}
    };

    logger.info('Starting full system role migration', { totalUsers: allUsers.length });

    // Group users by organization for better tracking
    const usersByOrg: Record<string, any[]> = {};
    const freelancers: any[] = [];

    allUsers.forEach(userDoc => {
      const userData = userDoc.data();
      if (userData.organizationId) {
        if (!usersByOrg[userData.organizationId]) {
          usersByOrg[userData.organizationId] = [];
        }
        usersByOrg[userData.organizationId].push({ id: userDoc.id, data: userData });
      } else {
        freelancers.push({ id: userDoc.id, data: userData });
      }
    });

    // Migrate organization users
    for (const [orgId, orgUsers] of Object.entries(usersByOrg)) {
      const orgData = orgUsers[0].data; // Get org info from first user
      
      report.organizationBreakdown[orgId] = {
        orgName: orgData.organizationName || 'Unknown',
        orgType: orgData.organizationType || 'unknown',
        userCount: orgUsers.length,
        successful: 0,
        failed: 0
      };

      const orgResults = await migrateOrganizationUsers(orgId);
      
      orgResults.forEach(result => {
        const userData = orgUsers.find(u => u.id === result.userId)?.data;
        
        report.details.push({
          userId: result.userId,
          email: userData?.email,
          oldRole: result.oldRole,
          newRole: result.newRole,
          status: result.status === 'completed' ? 'success' : 'failed',
          error: result.error
        });

        if (result.status === 'completed') {
          report.successful++;
          report.organizationBreakdown[orgId].successful++;
        } else {
          report.failed++;
          report.organizationBreakdown[orgId].failed++;
        }
      });
    }

    // Migrate freelancers
    for (const freelancer of freelancers) {
      const result = await migrateSingleUser(freelancer.id);
      
      report.details.push({
        userId: result.userId,
        email: freelancer.data.email,
        oldRole: result.oldRole,
        newRole: result.newRole,
        status: result.status === 'completed' ? 'success' : 'failed',
        error: result.error
      });

      if (result.status === 'completed') {
        report.successful++;
      } else {
        report.failed++;
      }
    }

    // Log migration summary
    logger.info('Full migration completed', {
      totalUsers: report.totalUsers,
      successful: report.successful,
      failed: report.failed,
      organizations: Object.keys(report.organizationBreakdown).length
    });

    return report;

  } catch (error) {
    logger.error('Full migration failed', error as Error);
    throw error;
  }
}

/**
 * Rollback migration for a user (emergency use)
 */
export async function rollbackUserMigration(userId: string): Promise<void> {
  try {
    const adminDb = await getAdminDb();
    
    // Get user document
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error(`User ${userId} not found`);
    }

    const userData = userDoc.data()!;
    
    // Only rollback if user was migrated
    if (!userData.migratedAt || !userData.migrationVersion) {
      throw new Error('User was not migrated');
    }

    // Reset to simple role structure
    const userType = userData.userType || 'freelancer';
    let legacyRole: string;
    
    switch (userType) {
      case 'freelancer':
        legacyRole = 'freelancer';
        break;
      case 'vendor':
        legacyRole = userData.organizationRole === 'org:admin' ? 'vendor_admin' : 'vendor_member';
        break;
      case 'customer':
        legacyRole = userData.organizationRole === 'org:admin' ? 'customer_admin' : 'customer_member';
        break;
      default:
        legacyRole = 'freelancer';
    }

    // Update user document
    await adminDb.collection('users').doc(userId).update({
      roles: [legacyRole],
      migratedAt: null,
      migrationVersion: null,
      rolledBackAt: new Date(),
      updatedAt: new Date()
    });

    // Sync session claims
    await syncUserToSessionClaims(userId);

    logger.info('User migration rolled back', {
      userId,
      legacyRole,
      rolledBackAt: new Date()
    });

  } catch (error) {
    logger.error('Failed to rollback user migration', error as Error, { userId });
    throw error;
  }
}

/**
 * Check migration status for the system
 */
export async function checkMigrationStatus(): Promise<{
  totalUsers: number;
  migratedUsers: number;
  unmigartedUsers: number;
  migrationProgress: number;
}> {
  try {
    const adminDb = await getAdminDb();
    
    // Get total users
    const totalUsersQuery = await adminDb.collection('users').get();
    const totalUsers = totalUsersQuery.size;
    
    // Get migrated users
    const migratedUsersQuery = await adminDb
      .collection('users')
      .where('migrationVersion', '==', '2.0')
      .get();
    const migratedUsers = migratedUsersQuery.size;
    
    const unmigratedUsers = totalUsers - migratedUsers;
    const migrationProgress = totalUsers > 0 ? (migratedUsers / totalUsers) * 100 : 100;
    
    return {
      totalUsers,
      migratedUsers,
      unmigartedUsers: unmigratedUsers,
      migrationProgress: Math.round(migrationProgress * 100) / 100
    };

  } catch (error) {
    logger.error('Failed to check migration status', error as Error);
    throw error;
  }
}

/**
 * Preview migration changes without applying them
 */
export async function previewMigration(organizationId?: string): Promise<Array<{
  userId: string;
  email?: string;
  currentRole: string;
  proposedRole: RoleName;
  changeSummary: string;
}>> {
  try {
    const adminDb = await getAdminDb();
    
    let usersQuery = adminDb.collection('users');
    
    if (organizationId) {
      usersQuery = usersQuery.where('organizationId', '==', organizationId);
    }
    
    const usersSnapshot = await usersQuery
      .where('migrationVersion', '==', null)
      .get();

    const preview = usersSnapshot.docs.map(userDoc => {
      const userData = userDoc.data();
      const oldRoles = userData.roles || [];
      
      let currentRole: string = 'freelancer';
      if (oldRoles.length > 0) {
        currentRole = typeof oldRoles[0] === 'string' ? oldRoles[0] : oldRoles[0].name;
      } else if (userData.userType) {
        currentRole = userData.userType === 'vendor' ? 'vendor_member' : 
                     userData.userType === 'customer' ? 'customer_member' : 'freelancer';
      }

      const proposedRole = LEGACY_ROLE_MAPPING[currentRole as keyof typeof LEGACY_ROLE_MAPPING] as RoleName;
      
      let changeSummary = '';
      if (currentRole === proposedRole) {
        changeSummary = 'No change (role remains the same)';
      } else {
        const oldPerms = userData.permissions || [];
        const newPerms = getRolePermissions(proposedRole);
        const addedPerms = newPerms.filter(p => !oldPerms.includes(p));
        const removedPerms = oldPerms.filter((p: string) => !newPerms.includes(p as any));
        
        changeSummary = `Role: ${currentRole} → ${proposedRole}`;
        if (addedPerms.length > 0) {
          changeSummary += ` | +${addedPerms.length} permissions`;
        }
        if (removedPerms.length > 0) {
          changeSummary += ` | -${removedPerms.length} permissions`;
        }
      }

      return {
        userId: userDoc.id,
        email: userData.email,
        currentRole,
        proposedRole,
        changeSummary
      };
    });

    return preview;

  } catch (error) {
    logger.error('Failed to preview migration', error as Error);
    throw error;
  }
}

// Export types
export type { MigrationStatus, MigrationReport };