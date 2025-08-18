/**
 * React Hook for Profile RBAC Permissions
 * Manages role-based access control for profile features
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  ProfileRBACService, 
  UserProfilePermissions,
  ProfileAccessContext
} from '@/lib/profile/rbac-integration-service';
import { useToast } from '@/hooks/use-toast';

interface UseProfilePermissionsProps {
  profileId?: string;
  autoLoad?: boolean;
}

interface UseProfilePermissionsReturn {
  // Permission data
  permissions: UserProfilePermissions | null;
  isOwner: boolean;
  
  // Loading states
  isLoading: boolean;
  
  // Permission checks
  canEdit: boolean;
  canPublish: boolean;
  canAccessAnalytics: boolean;
  canCustomizeTheme: boolean;
  canAccessOptimization: boolean;
  canVerifyProfile: boolean;
  canModerateProfiles: boolean;
  
  // Action methods
  checkPermission: (action: string) => boolean;
  validateAction: (action: string, metadata?: any) => Promise<boolean>;
  refreshPermissions: () => Promise<void>;
  
  // Dashboard configuration
  dashboardConfig: {
    availableSections: string[];
    uiConfiguration: {
      showOptimization: boolean;
      showAnalytics: boolean;
      showBranding: boolean;
      showPublishing: boolean;
      showVerification: boolean;
    };
  } | null;
  
  // Restrictions
  hasRestrictions: boolean;
  restrictions: UserProfilePermissions['restrictions'] | null;
}

export function useProfilePermissions({
  profileId,
  autoLoad = true
}: UseProfilePermissionsProps = {}): UseProfilePermissionsReturn {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  
  const [permissions, setPermissions] = useState<UserProfilePermissions | null>(null);
  const [dashboardConfig, setDashboardConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load permissions
  const loadPermissions = useCallback(async () => {
    if (!user?.id || !isLoaded) return;

    setIsLoading(true);
    try {
      const userPermissions = await ProfileRBACService.getUserProfilePermissions(
        user.id,
        profileId
      );
      setPermissions(userPermissions);

      // Load dashboard configuration
      const config = await ProfileRBACService.getDashboardConfiguration(user.id);
      setDashboardConfig(config);
    } catch (error) {
      console.error('Error loading profile permissions:', error);
      toast({
        title: 'Permission Error',
        description: 'Failed to load profile permissions. Some features may not be available.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isLoaded, profileId, toast]);

  // Check if user has a specific permission
  const checkPermission = useCallback((action: string): boolean => {
    if (!permissions) return false;
    
    return permissions.permissions.includes(action) || 
           permissions.profileSpecificPermissions.includes(action);
  }, [permissions]);

  // Validate action with full context checking
  const validateAction = useCallback(async (action: string, metadata?: any): Promise<boolean> => {
    if (!user?.id || !permissions) return false;

    try {
      const result = await ProfileRBACService.validateProfileAction(
        user.id,
        profileId || user.id,
        action,
        metadata
      );

      if (!result.success) {
        toast({
          title: 'Action Not Allowed',
          description: result.message,
          variant: 'destructive'
        });
      }

      return result.success;
    } catch (error) {
      console.error('Error validating action:', error);
      toast({
        title: 'Validation Error',
        description: 'Unable to validate action permissions.',
        variant: 'destructive'
      });
      return false;
    }
  }, [user?.id, permissions, profileId, toast]);

  // Refresh permissions
  const refreshPermissions = useCallback(async () => {
    await loadPermissions();
  }, [loadPermissions]);

  // Load permissions on mount and when dependencies change
  useEffect(() => {
    if (autoLoad && isLoaded) {
      loadPermissions();
    }
  }, [autoLoad, isLoaded, loadPermissions]);

  // Derived values
  const isOwner = permissions?.isProfileOwner ?? false;
  const canEdit = permissions?.canEditProfile ?? false;
  const canPublish = permissions?.canPublishProfile ?? false;
  const canAccessAnalytics = permissions?.canAccessAnalytics ?? false;
  const canCustomizeTheme = permissions?.canCustomizeTheme ?? false;
  const canAccessOptimization = permissions?.canAccessOptimization ?? false;
  const canVerifyProfile = permissions?.canVerifyProfile ?? false;
  const canModerateProfiles = checkPermission('profile.moderate');
  const hasRestrictions = permissions ? 
    (permissions.restrictions.publicProfileRequired || 
     permissions.restrictions.verificationRequired ||
     permissions.restrictions.completionThreshold > 50) : false;

  return {
    permissions,
    isOwner,
    isLoading,
    canEdit,
    canPublish,
    canAccessAnalytics,
    canCustomizeTheme,
    canAccessOptimization,
    canVerifyProfile,
    canModerateProfiles,
    checkPermission,
    validateAction,
    refreshPermissions,
    dashboardConfig,
    hasRestrictions,
    restrictions: permissions?.restrictions ?? null
  };
}

/**
 * Hook for checking access to multiple profiles
 */
interface UseMultipleProfilePermissionsProps {
  profileIds: string[];
  action: string;
}

export function useMultipleProfilePermissions({
  profileIds,
  action
}: UseMultipleProfilePermissionsProps) {
  const { user } = useUser();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const checkAllPermissions = useCallback(async () => {
    if (!user?.id || profileIds.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const permissionChecks = await Promise.all(
        profileIds.map(async (profileId) => {
          const userPermissions = await ProfileRBACService.getUserProfilePermissions(
            user.id,
            profileId
          );
          
          const hasPermission = userPermissions.permissions.includes(action) ||
                               userPermissions.profileSpecificPermissions.includes(action);
          
          return { profileId, hasPermission };
        })
      );

      const permissionMap = permissionChecks.reduce((acc, { profileId, hasPermission }) => {
        acc[profileId] = hasPermission;
        return acc;
      }, {} as Record<string, boolean>);

      setPermissions(permissionMap);
    } catch (error) {
      console.error('Error checking multiple profile permissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, profileIds, action]);

  useEffect(() => {
    checkAllPermissions();
  }, [checkAllPermissions]);

  return {
    permissions,
    isLoading,
    hasAnyAccess: Object.values(permissions).some(Boolean),
    hasAllAccess: Object.values(permissions).every(Boolean),
    getPermission: (profileId: string) => permissions[profileId] ?? false
  };
}

/**
 * Hook for role-based feature flags
 */
export function useProfileFeatureFlags() {
  const { permissions, isLoading } = useProfilePermissions();

  const features = {
    // Core features
    profileEdit: permissions?.canEditProfile ?? false,
    profilePublish: permissions?.canPublishProfile ?? false,
    
    // Analytics features
    basicAnalytics: permissions?.canAccessAnalytics ?? false,
    advancedAnalytics: permissions?.canAccessAnalytics && 
                      (permissions?.userType === 'vendor' || permissions?.userType === 'organization'),
    
    // Customization features
    basicTheme: permissions?.canCustomizeTheme ?? false,
    advancedTheme: permissions?.canCustomizeTheme && 
                   (permissions?.userType !== 'freelancer'),
    customCSS: permissions?.canCustomizeTheme && 
               permissions?.roles?.includes('premium_user'),
    
    // Optimization features
    basicOptimization: permissions?.canAccessOptimization ?? false,
    aiOptimization: permissions?.canAccessOptimization && 
                    permissions?.roles?.some(role => role.includes('premium')),
    
    // Verification features
    selfVerification: permissions?.canVerifyProfile ?? false,
    verificationBadge: permissions?.canVerifyProfile,
    
    // Platform features
    moderation: permissions?.permissions?.includes('profile.moderate') ?? false,
    platformAnalytics: permissions?.permissions?.includes('platform.monitor') ?? false,
    
    // Export/Import features
    basicExport: permissions?.profileSpecificPermissions?.includes('profile.export') ?? false,
    bulkExport: permissions?.permissions?.includes('data.export') ?? false,
    profileImport: permissions?.profileSpecificPermissions?.includes('profile.import') ?? false,
    
    // Advanced features based on user type and roles
    teamManagement: permissions?.userType === 'organization' && 
                   permissions?.permissions?.includes('team.manage'),
    multipleProfiles: permissions?.userType === 'vendor' || permissions?.userType === 'organization',
    whiteLabel: permissions?.roles?.includes('enterprise_user'),
    apiAccess: permissions?.permissions?.includes('platform.admin') ||
               permissions?.roles?.includes('developer'),
    
    // Restrictions
    hasCompletionRequirement: permissions?.restrictions?.completionThreshold > 50,
    requiresVerification: permissions?.restrictions?.verificationRequired,
    requiresPublicProfile: permissions?.restrictions?.publicProfileRequired
  };

  return {
    features,
    isLoading,
    hasFeature: (featureName: keyof typeof features) => features[featureName],
    
    // Helper methods
    canAccessFeature: (featureName: keyof typeof features, showToast = false) => {
      const hasAccess = features[featureName];
      
      if (!hasAccess && showToast) {
        // This would trigger in the component using the hook
        return false;
      }
      
      return hasAccess;
    },
    
    getFeatureInfo: (featureName: keyof typeof features) => ({
      enabled: features[featureName],
      userType: permissions?.userType,
      roles: permissions?.roles,
      restrictions: permissions?.restrictions
    })
  };
}

/**
 * Hook for tracking permission changes
 */
export function usePermissionTracker(trackingId: string) {
  const { permissions } = useProfilePermissions();
  const [permissionHistory, setPermissionHistory] = useState<Array<{
    timestamp: Date;
    permissions: string[];
    roles: string[];
    userType: string;
  }>>([]);

  useEffect(() => {
    if (permissions) {
      setPermissionHistory(prev => [
        ...prev,
        {
          timestamp: new Date(),
          permissions: [...permissions.permissions, ...permissions.profileSpecificPermissions],
          roles: permissions.roles,
          userType: permissions.userType
        }
      ].slice(-10)); // Keep only last 10 changes
    }
  }, [permissions]);

  return {
    permissionHistory,
    hasPermissionChanged: permissionHistory.length > 1,
    latestChange: permissionHistory[permissionHistory.length - 1],
    previousChange: permissionHistory[permissionHistory.length - 2]
  };
}