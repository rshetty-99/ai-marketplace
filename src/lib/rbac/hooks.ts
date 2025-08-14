'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { User, Permission } from './types';
import { PermissionManager } from './permissions';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function usePermissions() {
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      if (!clerkUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', clerkUser.id));
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [clerkUser]);

  const hasPermission = (permission: Permission, resourceId?: string): boolean => {
    if (!user) return false;
    return PermissionManager.hasPermission(user, permission, resourceId);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return PermissionManager.hasAnyPermission(user, permissions);
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false;
    return PermissionManager.hasAllPermissions(user, permissions);
  };

  const canManageUser = (targetUser: User): boolean => {
    if (!user) return false;
    return PermissionManager.canManageUser(user, targetUser);
  };

  const canAccessProject = (projectId: string, projectOrgId: string): boolean => {
    if (!user) return false;
    return PermissionManager.canAccessProject(user, projectId, projectOrgId);
  };

  const canModifyProject = (projectId: string, projectOrgId: string): boolean => {
    if (!user) return false;
    return PermissionManager.canModifyProject(user, projectId, projectOrgId);
  };

  const getFreelancerTier = (): string | null => {
    if (!user) return null;
    return PermissionManager.getMaxFreelancerTier(user);
  };

  return {
    user,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageUser,
    canAccessProject,
    canModifyProject,
    getFreelancerTier,
  };
}

export function useRequirePermission(permission: Permission) {
  const { hasPermission, loading } = usePermissions();
  
  if (loading) {
    return { hasAccess: false, loading: true };
  }

  return { 
    hasAccess: hasPermission(permission), 
    loading: false 
  };
}