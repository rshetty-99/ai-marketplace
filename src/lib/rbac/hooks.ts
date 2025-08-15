'use client';

import { useUser, useSession } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { User, Permission } from './types';
import { PermissionManager } from './permissions';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  parseSessionToken, 
  hasPermission as tokenHasPermission,
  hasAnyPermission as tokenHasAnyPermission,
  hasAllPermissions as tokenHasAllPermissions,
  hasRole,
  isOnboardingComplete,
  needsOnboarding,
  isFreelancer,
  isVendorCompany,
  isCustomerOrganization,
  isOrganizationOwner,
  canInviteUsers as tokenCanInviteUsers,
  getMaxBudgetApproval,
  isFeatureEnabled,
  type ParsedSessionToken 
} from '@/lib/auth/session-tokens';

/**
 * Enhanced permissions hook using session tokens for faster access
 * Falls back to Firestore data if session token is not available
 */
export function usePermissions() {
  const { user: clerkUser } = useUser();
  const { session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<ParsedSessionToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [useSessionData, setUseSessionData] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      if (!clerkUser) {
        setUser(null);
        setSessionToken(null);
        setLoading(false);
        return;
      }

      // Try to use session token first for faster access
      if (session?.publicUserData) {
        try {
          const parsedToken = parseSessionToken(session as any);
          setSessionToken(parsedToken);
          setUseSessionData(true);
          setLoading(false);
          return;
        } catch (error) {
          console.warn('Failed to parse session token, falling back to Firestore:', error);
        }
      }

      // Fallback to Firestore if session token is not available
      try {
        const userDoc = await getDoc(doc(db, 'users', clerkUser.id));
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser(userData);
          setUseSessionData(false);
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
  }, [clerkUser, session]);

  const hasPermission = (permission: Permission, resourceId?: string): boolean => {
    if (useSessionData && sessionToken) {
      return tokenHasPermission(sessionToken, permission);
    }
    if (!user) return false;
    return PermissionManager.hasPermission(user, permission, resourceId);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (useSessionData && sessionToken) {
      return tokenHasAnyPermission(sessionToken, permissions);
    }
    if (!user) return false;
    return PermissionManager.hasAnyPermission(user, permissions);
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (useSessionData && sessionToken) {
      return tokenHasAllPermissions(sessionToken, permissions);
    }
    if (!user) return false;
    return PermissionManager.hasAllPermissions(user, permissions);
  };

  const hasUserRole = (roleName: string): boolean => {
    if (useSessionData && sessionToken) {
      return hasRole(sessionToken, roleName);
    }
    if (!user) return false;
    return user.roles.some(role => role.name.toLowerCase() === roleName.toLowerCase());
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
    if (useSessionData && sessionToken) {
      return sessionToken.freelancerTier || null;
    }
    if (!user) return null;
    return PermissionManager.getMaxFreelancerTier(user);
  };

  const canInviteUsers = (): boolean => {
    if (useSessionData && sessionToken) {
      return tokenCanInviteUsers(sessionToken);
    }
    return hasPermission(Permission.MANAGE_TEAM);
  };

  const getMaxBudgetApprovalAmount = (): number => {
    if (useSessionData && sessionToken) {
      return getMaxBudgetApproval(sessionToken);
    }
    return 0; // Default fallback
  };

  const checkFeatureFlag = (featureName: string): boolean => {
    if (useSessionData && sessionToken) {
      return isFeatureEnabled(sessionToken, featureName);
    }
    return false; // Default fallback
  };

  return {
    user,
    sessionToken,
    loading,
    useSessionData,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole: hasUserRole,
    canManageUser,
    canAccessProject,
    canModifyProject,
    getFreelancerTier,
    canInviteUsers,
    getMaxBudgetApprovalAmount,
    isFeatureEnabled: checkFeatureFlag,
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

/**
 * Hook for onboarding status and management
 */
export function useOnboardingStatus() {
  const { sessionToken, loading } = usePermissions();

  if (loading || !sessionToken) {
    return {
      loading: true,
      isComplete: false,
      needsOnboarding: false,
      currentStep: 0,
      status: 'not_started' as const,
      userType: null,
      redirectPath: '/onboarding'
    };
  }

  return {
    loading: false,
    isComplete: isOnboardingComplete(sessionToken),
    needsOnboarding: needsOnboarding(sessionToken),
    currentStep: sessionToken.onboardingCurrentStep,
    status: sessionToken.onboardingStatus,
    userType: sessionToken.userType,
    redirectPath: needsOnboarding(sessionToken) ? `/onboarding?type=${sessionToken.userType}&step=${sessionToken.onboardingCurrentStep}` : '/dashboard'
  };
}

/**
 * Hook for user type checks
 */
export function useUserType() {
  const { sessionToken, loading } = usePermissions();

  if (loading || !sessionToken) {
    return {
      loading: true,
      userType: null,
      isFreelancer: false,
      isVendorCompany: false,
      isCustomerOrganization: false
    };
  }

  return {
    loading: false,
    userType: sessionToken.userType,
    isFreelancer: isFreelancer(sessionToken),
    isVendorCompany: isVendorCompany(sessionToken),
    isCustomerOrganization: isCustomerOrganization(sessionToken)
  };
}

/**
 * Hook for organization management
 */
export function useOrganization() {
  const { sessionToken, loading } = usePermissions();

  if (loading || !sessionToken) {
    return {
      loading: true,
      organization: null,
      isInOrganization: false,
      isOwner: false,
      canInviteUsers: false,
      maxBudgetApproval: 0
    };
  }

  return {
    loading: false,
    organization: sessionToken.organization,
    isInOrganization: !!sessionToken.organizationId,
    isOwner: isOrganizationOwner(sessionToken),
    canInviteUsers: tokenCanInviteUsers(sessionToken),
    maxBudgetApproval: getMaxBudgetApproval(sessionToken),
    organizationId: sessionToken.organizationId,
    organizationName: sessionToken.organizationName,
    organizationRole: sessionToken.organizationRole
  };
}

/**
 * Hook for freelancer-specific data
 */
export function useFreelancerData() {
  const { sessionToken, loading } = usePermissions();

  if (loading || !sessionToken || !isFreelancer(sessionToken)) {
    return {
      loading: loading,
      isFreelancer: false,
      tier: null,
      isVerified: false,
      rating: null
    };
  }

  return {
    loading: false,
    isFreelancer: true,
    tier: sessionToken.freelancerTier,
    isVerified: sessionToken.freelancerVerified,
    rating: sessionToken.freelancerRating
  };
}

/**
 * Hook for feature flags
 */
export function useFeatureFlags() {
  const { sessionToken, loading } = usePermissions();

  const checkFeature = (featureName: string): boolean => {
    if (!sessionToken) return false;
    return isFeatureEnabled(sessionToken, featureName);
  };

  return {
    loading,
    isEnabled: checkFeature,
    features: sessionToken?.featureFlags || {}
  };
}

/**
 * Hook for admin access
 */
export function useAdminAccess() {
  const { hasPermission, hasRole, loading } = usePermissions();

  if (loading) {
    return { loading: true, isAdmin: false, isSuperAdmin: false };
  }

  const isAdmin = hasPermission(Permission.PLATFORM_ADMIN) || hasRole('admin');
  const isSuperAdmin = hasRole('super_admin') || hasRole('SUPER_ADMIN');

  return {
    loading: false,
    isAdmin,
    isSuperAdmin,
    hasSystemAccess: isAdmin || isSuperAdmin
  };
}