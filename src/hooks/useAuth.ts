'use client';

import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  OptimizedJWTClaims, 
  ExpandedUserData, 
  expandJWTClaims,
  getJWTClaims,
  hasPermissionInClaims,
  hasRoleInClaims,
  needsOnboarding,
  getOnboardingRedirectUrl,
  getOrganizationFromClaims,
  getUserRolesFromClaims
} from '@/lib/auth/jwt-claims';
import { 
  ROLE_CATEGORIES,
  getRolePermissions,
  Permission,
  RoleName,
  MARKETPLACE_ROLES
} from '@/lib/firebase/rbac-schema';

/**
 * Get role category from role name
 */
function getRoleCategoryFromRole(roleName: string): string | null {
  for (const [category, roleList] of Object.entries(ROLE_CATEGORIES)) {
    if (roleList.includes(roleName as any)) {
      return category;
    }
  }
  return null;
}

export interface AuthState extends ExpandedUserData {
  isLoaded: boolean;
  isSignedIn: boolean;
  needsOnboarding: boolean;
  onboardingRedirectUrl: string;
  primaryRole?: string;
  roleCategory?: string;
}

/**
 * Enhanced authentication hook that works with optimized JWT claims
 */
export function useAuth(): AuthState & {
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  getOrganizationContext: () => { id?: string; role?: string; clerkOrgId?: string; clerkOrgRole?: string; };
  getUserRoleCategory: () => string | null;
  isAdminRole: () => boolean;
  canManageTeam: () => boolean;
  canAccessFinancials: () => boolean;
  refreshUser: () => Promise<void>;
} {
  const { user, isLoaded } = useUser();
  const clerkAuth = useClerkAuth();
  const [authState, setAuthState] = useState<AuthState>({
    userId: '',
    email: '',
    emailVerified: false,
    name: '',
    userType: 'freelancer',
    onboarding: {
      status: 'not_started',
      completed: false,
      currentStep: 0
    },
    roles: [],
    permissions: [],
    freelancer: { verified: false },
    isLoaded: false,
    isSignedIn: false,
    needsOnboarding: false,
    onboardingRedirectUrl: '/dashboard'
  });

  useEffect(() => {
    if (!isLoaded) {
      setAuthState(prev => {
        if (prev.isLoaded === false) return prev; // Prevent unnecessary updates
        return { ...prev, isLoaded: false };
      });
      return;
    }

    if (!user) {
      setAuthState(prev => {
        if (prev.isLoaded === true && prev.isSignedIn === false) return prev; // Prevent unnecessary updates
        return {
          ...prev,
          isLoaded: true,
          isSignedIn: false
        };
      });
      return;
    }

    // Get JWT claims from Clerk
    const claims = getJWTClaims(clerkAuth);
    
    if (claims && claims.uid) {
      // Use JWT claims for fast access
      const expandedData = expandJWTClaims(claims);
      const needsOnb = needsOnboarding(claims);
      
      // Calculate primary role and category
      const primaryRole = expandedData.roles.length > 0 ? expandedData.roles[0] : '';
      const roleCategory = getRoleCategoryFromRole(primaryRole);
      
      const newState = {
        ...expandedData,
        isLoaded: true,
        isSignedIn: true,
        needsOnboarding: needsOnb,
        onboardingRedirectUrl: getOnboardingRedirectUrl(claims),
        primaryRole,
        roleCategory
      };

      setAuthState(prev => {
        // Only update if data has actually changed
        if (prev.userId === newState.userId && 
            prev.primaryRole === newState.primaryRole &&
            prev.isLoaded === newState.isLoaded &&
            prev.isSignedIn === newState.isSignedIn) {
          return prev;
        }
        return newState;
      });
    } else {
      // Fallback to user metadata if JWT claims are not available
      const userType = user.publicMetadata.user_type as 'freelancer' | 'vendor' | 'customer' || 'freelancer';
      const onboardingCompleted = user.publicMetadata.onboarding_completed as boolean || false;
      const onboardingStatus = user.publicMetadata.onboarding_status as string || 'not_started';
      
      // Parse roles and calculate primary role and category for fallback
      let roles = [];
      try {
        roles = JSON.parse(user.publicMetadata.roles as string || '[]');
      } catch {
        roles = []; // Fallback if JSON parse fails
      }
      
      const primaryRole = roles.length > 0 ? (typeof roles[0] === 'string' ? roles[0] : roles[0].name) : userType;
      const roleCategory = getRoleCategoryFromRole(primaryRole) || (userType === 'freelancer' ? 'Independent' : 'Team Member');
      
      const newState = {
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        emailVerified: user.primaryEmailAddress?.verification?.status === 'verified',
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        userType,
        onboarding: {
          status: onboardingStatus as any,
          completed: onboardingCompleted,
          currentStep: user.publicMetadata.onboarding_current_step as number || 0
        },
        organization: user.publicMetadata.organization_id ? {
          id: user.publicMetadata.organization_id as string,
          name: user.publicMetadata.organization_name as string,
          slug: user.publicMetadata.organization_slug as string,
          role: user.publicMetadata.organization_role as string
        } : undefined,
        roles,
        permissions: [],
        userStatus: user.publicMetadata.user_status as string,
        freelancer: {
          tier: user.publicMetadata.freelancer_tier as string,
          verified: user.publicMetadata.freelancer_verified as boolean || false
        },
        apiAccessLevel: user.publicMetadata.api_access_level as string,
        primaryRole,
        roleCategory,
        isLoaded: true,
        isSignedIn: true,
        needsOnboarding: !onboardingCompleted || onboardingStatus !== 'completed',
        onboardingRedirectUrl: `/onboarding/${userType}`
      };

      setAuthState(prev => {
        // Only update if data has actually changed
        if (prev.userId === newState.userId && 
            prev.primaryRole === newState.primaryRole &&
            prev.isLoaded === newState.isLoaded &&
            prev.isSignedIn === newState.isSignedIn) {
          return prev;
        }
        return newState;
      });
    }
  }, [isLoaded, user?.id, user?.primaryEmailAddress?.emailAddress]); // Removed clerkAuth from dependencies

  const hasPermission = useCallback((permission: string): boolean => {
    const claims = getJWTClaims(clerkAuth);
    if (claims) {
      return hasPermissionInClaims(claims, permission);
    }
    return authState.permissions.includes(permission);
  }, [clerkAuth, authState.permissions]);

  const hasRole = useCallback((role: string): boolean => {
    const claims = getJWTClaims(clerkAuth);
    if (claims) {
      return hasRoleInClaims(claims, role);
    }
    return authState.roles.includes(role);
  }, [clerkAuth, authState.roles]);

  const getOrganizationContext = useCallback(() => {
    const claims = getJWTClaims(clerkAuth);
    if (claims) {
      return getOrganizationFromClaims(claims);
    }
    return authState.organization || {};
  }, [clerkAuth, authState.organization]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    const claims = getJWTClaims(clerkAuth);
    if (claims) {
      const userRoles = getUserRolesFromClaims(claims);
      return roles.some(role => userRoles.includes(role));
    }
    return roles.some(role => authState.roles.includes(role));
  }, [clerkAuth, authState.roles]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    const claims = getJWTClaims(clerkAuth);
    if (claims) {
      return permissions.every(permission => hasPermissionInClaims(claims, permission));
    }
    return permissions.every(permission => authState.permissions.includes(permission));
  }, [clerkAuth, authState.permissions]);

  const getUserRoleCategory = useCallback((): string | null => {
    return authState.roleCategory || null;
  }, [authState.roleCategory]);

  const isAdminRole = useCallback((): boolean => {
    return hasPermission('org.admin') || authState.primaryRole?.includes('admin') || false;
  }, [hasPermission, authState.primaryRole]);

  const canManageTeam = useCallback((): boolean => {
    return hasPermission('team.manage') || hasPermission('team.invite');
  }, [hasPermission]);

  const canAccessFinancials = useCallback((): boolean => {
    return hasPermission('billing.view') || hasPermission('billing.manage') || hasPermission('budget.approve');
  }, [hasPermission]);

  const refreshUser = useCallback(async (): Promise<void> => {
    if (user) {
      await user.reload();
    }
  }, [user]);

  return {
    ...authState,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllPermissions,
    getOrganizationContext,
    getUserRoleCategory,
    isAdminRole,
    canManageTeam,
    canAccessFinancials,
    refreshUser
  };
}

/**
 * Hook for checking specific permission
 */
export function usePermissionCheck(permission: string): {
  hasPermission: boolean;
  isLoading: boolean;
} {
  const { hasPermission, isLoaded } = useAuth();
  
  return {
    hasPermission: hasPermission(permission),
    isLoading: !isLoaded
  };
}

/**
 * Hook for checking specific role
 */
export function useRoleCheck(role: string): {
  hasRole: boolean;
  isLoading: boolean;
} {
  const { hasRole, isLoaded } = useAuth();
  
  return {
    hasRole: hasRole(role),
    isLoading: !isLoaded
  };
}

/**
 * Hook for organization context
 */
export function useOrganization(): {
  organizationId?: string;
  organizationName?: string;
  organizationSlug?: string;
  organizationRole?: string;
  hasOrganization: boolean;
  isLoading: boolean;
} {
  const { getOrganizationContext, isLoaded } = useAuth();
  const orgContext = getOrganizationContext();
  
  return {
    organizationId: orgContext.id,
    organizationName: orgContext.name,
    organizationSlug: orgContext.slug,
    organizationRole: orgContext.role,
    hasOrganization: !!orgContext.id,
    isLoading: !isLoaded
  };
}

/**
 * Hook for onboarding state
 */
export function useOnboarding(): {
  needsOnboarding: boolean;
  onboardingStatus: string;
  currentStep: number;
  redirectUrl: string;
  isLoading: boolean;
} {
  const { needsOnboarding, onboarding, onboardingRedirectUrl, isLoaded } = useAuth();
  
  return {
    needsOnboarding,
    onboardingStatus: onboarding.status,
    currentStep: onboarding.currentStep,
    redirectUrl: onboardingRedirectUrl,
    isLoading: !isLoaded
  };
}

/**
 * Hook for user type and verification status
 */
export function useUserType(): {
  userType: 'freelancer' | 'vendor' | 'customer';
  isFreelancer: boolean;
  isVendor: boolean;
  isCustomer: boolean;
  isVerified: boolean;
  tier?: string;
  isLoading: boolean;
} {
  const { userType, freelancer, emailVerified, isLoaded } = useAuth();
  
  return {
    userType,
    isFreelancer: userType === 'freelancer',
    isVendor: userType === 'vendor', 
    isCustomer: userType === 'customer',
    isVerified: emailVerified && (freelancer?.verified || false),
    tier: freelancer?.tier,
    isLoading: !isLoaded
  };
}