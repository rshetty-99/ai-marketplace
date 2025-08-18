/**
 * React hook for fetching RBAC data from Firestore collections
 * Replaces hard-coded role and permission lists with dynamic Firestore queries
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  RBACCollectionManager, 
  RoleDocument, 
  PermissionDocument, 
  PermissionGroupDocument, 
  RoleCategoryDocument 
} from '../lib/firebase/rbac-collections';

export interface UseRBACDataOptions {
  userType?: 'platform' | 'freelancer' | 'vendor' | 'customer';
  category?: string;
  includePermissions?: boolean;
  includeGroups?: boolean;
  includeCategories?: boolean;
}

export interface RBACData {
  roles: RoleDocument[];
  permissions: PermissionDocument[];
  permissionGroups: PermissionGroupDocument[];
  roleCategories: RoleCategoryDocument[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRBACData(options: UseRBACDataOptions = {}): RBACData {
  const {
    userType,
    category,
    includePermissions = false,
    includeGroups = false,
    includeCategories = false
  } = options;

  const [roles, setRoles] = useState<RoleDocument[]>([]);
  const [permissions, setPermissions] = useState<PermissionDocument[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroupDocument[]>([]);
  const [roleCategories, setRoleCategories] = useState<RoleCategoryDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const promises = [
        RBACCollectionManager.getRoles(userType),
        ...(includePermissions ? [RBACCollectionManager.getPermissions()] : [Promise.resolve([])]),
        ...(includeGroups ? [RBACCollectionManager.getPermissionGroups()] : [Promise.resolve([])]),
        ...(includeCategories ? [RBACCollectionManager.getRoleCategories()] : [Promise.resolve([])])
      ];

      const [rolesData, permissionsData, groupsData, categoriesData] = await Promise.all(promises);

      setRoles(rolesData);
      setPermissions(permissionsData);
      setPermissionGroups(groupsData);
      setRoleCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch RBAC data');
      console.error('Error fetching RBAC data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userType, category, includePermissions, includeGroups, includeCategories]);

  // Filter roles by category if specified
  const filteredRoles = useMemo(() => {
    if (!category) return roles;
    return roles.filter(role => role.category === category);
  }, [roles, category]);

  return {
    roles: filteredRoles,
    permissions,
    permissionGroups,
    roleCategories,
    isLoading,
    error,
    refetch: fetchData
  };
}

// Specialized hooks for common use cases
export function useRolesForUserType(userType: 'platform' | 'freelancer' | 'vendor' | 'customer') {
  return useRBACData({ userType });
}

export function useRoleCategories() {
  return useRBACData({ includeCategories: true });
}

export function usePermissionGroups() {
  return useRBACData({ includeGroups: true });
}

export function usePermissions() {
  return useRBACData({ includePermissions: true });
}

// Helper hook for role selection dropdowns
export function useRoleOptions(userType?: 'platform' | 'freelancer' | 'vendor' | 'customer') {
  const { roles, isLoading, error } = useRBACData({ userType });

  const roleOptions = useMemo(() => {
    return roles.map(role => ({
      value: role.id,
      label: role.displayName,
      description: role.description,
      category: role.category,
      hierarchyLevel: role.hierarchyLevel,
      isDefault: role.isDefault
    }));
  }, [roles]);

  // Group options by category for organized display
  const groupedRoleOptions = useMemo(() => {
    const groups: Record<string, typeof roleOptions> = {};
    
    roleOptions.forEach(option => {
      if (!groups[option.category]) {
        groups[option.category] = [];
      }
      groups[option.category].push(option);
    });

    // Sort options within each group by hierarchy level (descending)
    Object.keys(groups).forEach(category => {
      groups[category].sort((a, b) => b.hierarchyLevel - a.hierarchyLevel);
    });

    return groups;
  }, [roleOptions]);

  return {
    roleOptions,
    groupedRoleOptions,
    isLoading,
    error
  };
}