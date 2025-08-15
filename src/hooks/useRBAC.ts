'use client';

import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { useUser, useOrganization } from '@clerk/nextjs';
import { 
  UserRole,
  RoleName,
  Permission,
  MARKETPLACE_ROLES,
  CORE_PERMISSIONS,
  getRolePermissions,
  hasPermission as checkPermission
} from '@/lib/firebase/rbac-schema';
import {
  getUserRole,
  getUserPermissions,
  userHasPermission,
  assignUserRole,
  removeUserRole,
  getOrganizationMembers,
  userCanManageOrganization,
  userCanInviteUsers,
  logAuditEvent
} from '@/lib/firebase/rbac-firestore';

// === SIMPLIFIED RBAC CONTEXT ===
interface RBACContextType {
  userRole: UserRole | null;
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;
  hasPermission: (permission: Permission) => boolean;
  canInvite: boolean;
  canManageOrg: boolean;
  isAdmin: boolean;
  refreshRole: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | null>(null);

export function RBACProvider({ 
  children, 
  organizationId 
}: { 
  children: React.ReactNode;
  organizationId?: string;
}) {
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserRole = useCallback(async () => {
    if (!user?.id || !isLoaded) return;

    try {
      setIsLoading(true);
      setError(null);

      const [role, userPermissions] = await Promise.all([
        getUserRole(user.id, organizationId),
        getUserPermissions(user.id, organizationId)
      ]);

      setUserRole(role);
      setPermissions(userPermissions);
    } catch (err) {
      console.error('Error loading user role:', err);
      setError(err instanceof Error ? err.message : 'Failed to load role');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isLoaded, organizationId]);

  useEffect(() => {
    loadUserRole();
  }, [loadUserRole]);

  const hasPermission = useCallback((permission: Permission) => {
    return permissions.includes(permission);
  }, [permissions]);

  const canInvite = hasPermission('team.invite');
  const canManageOrg = hasPermission('org.admin');
  const isAdmin = userRole?.role.includes('admin') || false;

  const refreshRole = useCallback(async () => {
    await loadUserRole();
  }, [loadUserRole]);

  return (
    <RBACContext.Provider value={{
      userRole,
      permissions,
      isLoading,
      error,
      hasPermission,
      canInvite,
      canManageOrg,
      isAdmin,
      refreshRole
    }}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
}

// === SIMPLIFIED PERMISSION CHECKING HOOK ===
export function usePermission(permission: Permission, organizationId?: string) {
  const { user } = useUser();
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkPermission() {
      if (!user?.id) {
        setHasPermission(false);
        setIsLoading(false);
        return;
      }

      try {
        const permitted = await userHasPermission(user.id, permission, organizationId);
        setHasPermission(permitted);
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkPermission();
  }, [user?.id, permission, organizationId]);

  return { hasPermission, isLoading };
}

// === ROLE MANAGEMENT HOOK ===
export function useRoleManagement(organizationId?: string) {
  const { user } = useUser();
  const [members, setMembers] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!organizationId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const orgMembers = await getOrganizationMembers(organizationId);
      setMembers(orgMembers);
    } catch (err) {
      console.error('Error loading members:', err);
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  const assignRole = useCallback(async (
    userId: string,
    role: RoleName
  ) => {
    if (!user?.id || !organizationId) throw new Error('Missing required data');

    try {
      setError(null);
      await assignUserRole(userId, role, user.id, organizationId);
      await loadMembers(); // Refresh the list
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to assign role';
      setError(error);
      throw new Error(error);
    }
  }, [user?.id, organizationId, loadMembers]);

  const removeRole = useCallback(async (userId: string) => {
    if (!user?.id || !organizationId) throw new Error('Missing required data');

    try {
      setError(null);
      await removeUserRole(userId, organizationId, user.id);
      await loadMembers(); // Refresh the list
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to remove role';
      setError(error);
      throw new Error(error);
    }
  }, [user?.id, organizationId, loadMembers]);

  return {
    members,
    isLoading,
    error,
    loadMembers,
    assignRole,
    removeRole
  };
}

// === PERMISSIONS UTILITIES HOOK ===
export function usePermissions() {
  const getPermissionsByGroup = useCallback((group: 'Personal' | 'Projects' | 'Team' | 'Organization') => {
    const groupMap = {
      'Personal': ['profile.edit', 'billing.manage'],
      'Projects': ['projects.create', 'projects.manage'], 
      'Team': ['team.invite', 'team.manage'],
      'Organization': ['org.settings', 'org.admin']
    };
    return groupMap[group] as Permission[];
  }, []);

  const getPermissionDescription = useCallback((permission: Permission) => {
    return CORE_PERMISSIONS[permission];
  }, []);

  const getRolePermissions = useCallback((role: RoleName) => {
    return MARKETPLACE_ROLES[role].permissions as Permission[];
  }, []);

  return {
    allPermissions: Object.keys(CORE_PERMISSIONS) as Permission[],
    getPermissionsByGroup,
    getPermissionDescription,
    getRolePermissions
  };
}

// === ORGANIZATION UTILITIES ===
export function useOrganizationRole() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const organizationId = organization?.id;

  const [canManage, setCanManage] = useState(false);
  const [canInvite, setCanInvite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkCapabilities() {
      if (!user?.id || !organizationId) {
        setCanManage(false);
        setCanInvite(false);
        setIsLoading(false);
        return;
      }

      try {
        const [canManageOrg, canInviteUsers] = await Promise.all([
          userCanManageOrganization(user.id, organizationId),
          userCanInviteUsers(user.id, organizationId)
        ]);

        setCanManage(canManageOrg);
        setCanInvite(canInviteUsers);
      } catch (error) {
        console.error('Error checking organization capabilities:', error);
        setCanManage(false);
        setCanInvite(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkCapabilities();
  }, [user?.id, organizationId]);

  return {
    canManage,
    canInvite,
    isLoading,
    organizationId
  };
}

// === AUDIT HOOK ===
export function useAuditLog(organizationId?: string) {
  const { user } = useUser();

  const logEvent = useCallback(async (
    action: 'role_assigned' | 'role_changed' | 'user_invited' | 'org_updated',
    resource: string,
    resourceId: string,
    metadata: Record<string, any> = {},
    targetUserId?: string
  ) => {
    if (!user?.id) return;

    try {
      await logAuditEvent({
        userId: user.id,
        targetUserId,
        action,
        resource,
        resourceId,
        organizationId,
        metadata
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }, [user?.id, organizationId]);

  return { logEvent };
}

// === SIMPLIFIED PERMISSION GUARD COMPONENT ===
interface PermissionGuardProps {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({ 
  permission, 
  fallback = null, 
  children 
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = useRBAC();

  if (isLoading) {
    return <div className="animate-pulse bg-muted h-4 w-full rounded" />;
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// === ROLE GUARD COMPONENT ===
interface RoleGuardProps {
  roles: RoleName[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGuard({ 
  roles, 
  requireAll = false, 
  fallback = null, 
  children 
}: RoleGuardProps) {
  const { userRole, isLoading } = useRBAC();

  if (isLoading) {
    return <div className="animate-pulse bg-muted h-4 w-full rounded" />;
  }

  if (!userRole) {
    return <>{fallback}</>;
  }

  const hasAccess = roles.includes(userRole.role);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// === ADMIN GUARD COMPONENT ===
interface AdminGuardProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminGuard({ fallback = null, children }: AdminGuardProps) {
  const { isAdmin, isLoading } = useRBAC();

  if (isLoading) {
    return <div className="animate-pulse bg-muted h-4 w-full rounded" />;
  }

  if (!isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}