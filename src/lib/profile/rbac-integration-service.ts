/**
 * RBAC Integration Service for Profiles
 * Connects profile system with existing RBAC permissions and role management
 */

import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { RBACCollectionManager, PermissionDocument, RoleDocument, PermissionId } from '@/lib/firebase/rbac-collections';

// Profile-specific permissions that extend the existing RBAC system
export const PROFILE_PERMISSIONS = {
  // Profile management permissions
  'profile.publish': {
    displayName: 'Publish Profile',
    description: 'Publish profile to make it publicly visible',
    category: 'personal',
    group: 'profile',
    resource: 'profile',
    action: 'publish',
    isCore: true,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Globe' }
  },
  'profile.unpublish': {
    displayName: 'Unpublish Profile',
    description: 'Remove profile from public visibility',
    category: 'personal',
    group: 'profile',
    resource: 'profile',
    action: 'unpublish',
    isCore: true,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'EyeOff' }
  },
  'profile.analytics': {
    displayName: 'View Profile Analytics',
    description: 'Access profile performance analytics and insights',
    category: 'personal',
    group: 'profile',
    resource: 'profile',
    action: 'view_analytics',
    isCore: true,
    metadata: { riskLevel: 'low' as const, uiIcon: 'BarChart3' }
  },
  'profile.customize': {
    displayName: 'Customize Profile Theme',
    description: 'Customize profile branding and theme',
    category: 'personal',
    group: 'profile',
    resource: 'profile',
    action: 'customize',
    isCore: true,
    metadata: { riskLevel: 'low' as const, uiIcon: 'Palette' }
  },
  'profile.optimize': {
    displayName: 'Access Profile Optimization',
    description: 'Access AI-powered profile optimization suggestions',
    category: 'personal',
    group: 'profile',
    resource: 'profile',
    action: 'optimize',
    isCore: false,
    metadata: { riskLevel: 'low' as const, uiIcon: 'Zap' }
  },
  'profile.verify': {
    displayName: 'Profile Verification',
    description: 'Verify profile authenticity and credentials',
    category: 'personal',
    group: 'profile',
    resource: 'profile',
    action: 'verify',
    isCore: false,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'BadgeCheck' }
  },
  'profile.moderate': {
    displayName: 'Moderate Profiles',
    description: 'Review and moderate user profiles for platform compliance',
    category: 'platform',
    group: 'moderation',
    resource: 'profile',
    action: 'moderate',
    isCore: false,
    metadata: { riskLevel: 'high' as const, uiIcon: 'Shield' }
  },
  'profile.backup': {
    displayName: 'Backup Profile Data',
    description: 'Create and manage profile data backups',
    category: 'personal',
    group: 'profile',
    resource: 'profile',
    action: 'backup',
    isCore: false,
    metadata: { riskLevel: 'low' as const, uiIcon: 'Download' }
  },
  'profile.export': {
    displayName: 'Export Profile Data',
    description: 'Export profile data in various formats',
    category: 'personal',
    group: 'profile',
    resource: 'profile',
    action: 'export',
    isCore: false,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Share' }
  },
  'profile.import': {
    displayName: 'Import Profile Data',
    description: 'Import profile data from external sources',
    category: 'personal',
    group: 'profile',
    resource: 'profile',
    action: 'import',
    isCore: false,
    metadata: { riskLevel: 'medium' as const, uiIcon: 'Upload' }
  }
} as const;

export interface UserProfilePermissions {
  userId: string;
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  roles: string[];
  permissions: string[];
  profileSpecificPermissions: string[];
  isProfileOwner: boolean;
  canEditProfile: boolean;
  canPublishProfile: boolean;
  canAccessAnalytics: boolean;
  canCustomizeTheme: boolean;
  canAccessOptimization: boolean;
  canVerifyProfile: boolean;
  restrictions: {
    publicProfileRequired: boolean;
    verificationRequired: boolean;
    completionThreshold: number;
  };
  lastUpdated: Date;
}

export interface ProfileAccessContext {
  userId: string;
  requestedProfileId: string;
  requestedAction: string;
  userRoles: string[];
  isOwner: boolean;
  profileVisibility: 'private' | 'public' | 'restricted';
  profileStatus: 'draft' | 'published' | 'suspended';
}

export class ProfileRBACService {
  private static readonly PROFILES_COLLECTION = 'profiles';
  private static readonly USERS_COLLECTION = 'users';
  private static readonly RBAC_PERMISSIONS = 'rbac_permissions';
  private static readonly RBAC_ROLES = 'rbac_roles';

  /**
   * Initialize profile-specific permissions in the RBAC system
   */
  static async initializeProfilePermissions(): Promise<void> {
    try {
      const permissionsRef = collection(db, this.RBAC_PERMISSIONS);
      const batch = writeBatch(db);

      for (const [id, permission] of Object.entries(PROFILE_PERMISSIONS)) {
        const permissionDoc: PermissionDocument = {
          id,
          name: id,
          displayName: permission.displayName,
          description: permission.description,
          category: permission.category,
          group: permission.group,
          resource: permission.resource,
          action: permission.action,
          isCore: permission.isCore,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: permission.metadata
        };

        const docRef = doc(permissionsRef, id);
        batch.set(docRef, permissionDoc);
      }

      await batch.commit();
      console.log('Profile permissions initialized successfully');
    } catch (error) {
      console.error('Error initializing profile permissions:', error);
      throw error;
    }
  }

  /**
   * Get user's profile-specific permissions
   */
  static async getUserProfilePermissions(
    userId: string,
    profileId?: string
  ): Promise<UserProfilePermissions> {
    try {
      // Get user data with roles
      const userRef = doc(db, this.USERS_COLLECTION, userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const userRoles = userData.roles || [];
      const userType = userData.userType || 'freelancer';

      // Get profile data if profileId provided
      let isProfileOwner = false;
      let profileData = null;

      if (profileId) {
        const profileRef = doc(db, this.PROFILES_COLLECTION, profileId);
        const profileDoc = await getDoc(profileRef);
        
        if (profileDoc.exists()) {
          profileData = profileDoc.data();
          isProfileOwner = profileData.userId === userId;
        }
      } else {
        // If no profileId, assume user's own profile
        profileId = userId;
        isProfileOwner = true;
      }

      // Get permissions from user roles
      const rolePermissions = await this.getPermissionsFromRoles(userRoles);
      const profileSpecificPermissions = await this.getProfileSpecificPermissions(userType, isProfileOwner);

      // Combine all permissions
      const allPermissions = [...new Set([...rolePermissions, ...profileSpecificPermissions])];

      return {
        userId,
        profileId: profileId!,
        userType,
        roles: userRoles,
        permissions: rolePermissions,
        profileSpecificPermissions,
        isProfileOwner,
        canEditProfile: this.hasPermission(allPermissions, 'profile.edit') || isProfileOwner,
        canPublishProfile: this.hasPermission(allPermissions, 'profile.publish') || isProfileOwner,
        canAccessAnalytics: this.hasPermission(allPermissions, 'profile.analytics') || isProfileOwner,
        canCustomizeTheme: this.hasPermission(allPermissions, 'profile.customize') || isProfileOwner,
        canAccessOptimization: this.hasPermission(allPermissions, 'profile.optimize') || isProfileOwner,
        canVerifyProfile: this.hasPermission(allPermissions, 'profile.verify'),
        restrictions: await this.getProfileRestrictions(userType, userRoles),
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting user profile permissions:', error);
      throw error;
    }
  }

  /**
   * Check if user can access a specific profile action
   */
  static async canAccessProfileAction(context: ProfileAccessContext): Promise<{
    allowed: boolean;
    reason?: string;
    requiresUpgrade?: boolean;
  }> {
    try {
      const userPermissions = await this.getUserProfilePermissions(
        context.userId,
        context.requestedProfileId
      );

      // Owner always has access to their own profile
      if (context.isOwner) {
        return { allowed: true };
      }

      // Check if profile is accessible based on visibility
      if (context.profileVisibility === 'private' && !context.isOwner) {
        return { 
          allowed: false, 
          reason: 'Profile is private and you are not the owner' 
        };
      }

      if (context.profileStatus === 'suspended') {
        return { 
          allowed: false, 
          reason: 'Profile is currently suspended' 
        };
      }

      // Check specific action permissions
      const hasPermission = userPermissions.permissions.includes(context.requestedAction) ||
                           userPermissions.profileSpecificPermissions.includes(context.requestedAction);

      if (!hasPermission) {
        // Check if this is a premium feature that requires upgrade
        const premiumActions = ['profile.optimize', 'profile.verify', 'profile.backup'];
        const requiresUpgrade = premiumActions.includes(context.requestedAction);

        return {
          allowed: false,
          reason: requiresUpgrade 
            ? 'This feature requires a premium subscription'
            : 'Insufficient permissions for this action',
          requiresUpgrade
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking profile action access:', error);
      return { 
        allowed: false, 
        reason: 'Error validating permissions' 
      };
    }
  }

  /**
   * Get dashboard sections available to user based on their profile permissions
   */
  static async getAvailableDashboardSections(userId: string): Promise<{
    profileSections: string[];
    analyticsAccess: boolean;
    optimizationAccess: boolean;
    brandingAccess: boolean;
    publishingAccess: boolean;
  }> {
    try {
      const userPermissions = await this.getUserProfilePermissions(userId);

      return {
        profileSections: [
          'basic-info',
          'skills',
          'portfolio',
          'testimonials',
          ...(userPermissions.canCustomizeTheme ? ['branding'] : []),
          ...(userPermissions.canAccessOptimization ? ['optimization'] : []),
          ...(userPermissions.canAccessAnalytics ? ['analytics'] : []),
          ...(userPermissions.canPublishProfile ? ['publishing'] : [])
        ],
        analyticsAccess: userPermissions.canAccessAnalytics,
        optimizationAccess: userPermissions.canAccessOptimization,
        brandingAccess: userPermissions.canCustomizeTheme,
        publishingAccess: userPermissions.canPublishProfile
      };
    } catch (error) {
      console.error('Error getting dashboard sections:', error);
      return {
        profileSections: ['basic-info'],
        analyticsAccess: false,
        optimizationAccess: false,
        brandingAccess: false,
        publishingAccess: false
      };
    }
  }

  /**
   * Update profile permissions when user role changes
   */
  static async updateProfilePermissionsOnRoleChange(
    userId: string,
    newRoles: string[]
  ): Promise<void> {
    try {
      const profileRef = doc(db, this.PROFILES_COLLECTION, userId);
      const profileDoc = await getDoc(profileRef);

      if (profileDoc.exists()) {
        const newPermissions = await this.getUserProfilePermissions(userId);
        
        await updateDoc(profileRef, {
          'permissions': newPermissions.permissions,
          'profileSpecificPermissions': newPermissions.profileSpecificPermissions,
          'rbac.lastUpdated': Timestamp.now(),
          'rbac.roles': newRoles
        });
      }
    } catch (error) {
      console.error('Error updating profile permissions:', error);
      throw error;
    }
  }

  /**
   * Validate profile action with detailed logging
   */
  static async validateProfileAction(
    userId: string,
    profileId: string,
    action: string,
    metadata?: any
  ): Promise<{ success: boolean; message: string; context?: any }> {
    try {
      const userPermissions = await this.getUserProfilePermissions(userId, profileId);
      const isOwner = userPermissions.isProfileOwner;

      // Get profile data for context
      const profileRef = doc(db, this.PROFILES_COLLECTION, profileId);
      const profileDoc = await getDoc(profileRef);
      
      const profileData = profileDoc.exists() ? profileDoc.data() : null;
      
      const context: ProfileAccessContext = {
        userId,
        requestedProfileId: profileId,
        requestedAction: action,
        userRoles: userPermissions.roles,
        isOwner,
        profileVisibility: profileData?.publicProfile?.isPublic ? 'public' : 'private',
        profileStatus: profileData?.publishingStatus?.status || 'draft'
      };

      const accessResult = await this.canAccessProfileAction(context);

      // Log the action attempt
      await this.logProfileAccess({
        userId,
        profileId,
        action,
        allowed: accessResult.allowed,
        reason: accessResult.reason,
        timestamp: new Date(),
        metadata: {
          userRoles: userPermissions.roles,
          isOwner,
          profileStatus: context.profileStatus,
          ...metadata
        }
      });

      return {
        success: accessResult.allowed,
        message: accessResult.allowed 
          ? 'Action authorized'
          : accessResult.reason || 'Action not authorized',
        context: {
          permissions: userPermissions,
          requiresUpgrade: accessResult.requiresUpgrade
        }
      };
    } catch (error) {
      console.error('Error validating profile action:', error);
      return {
        success: false,
        message: 'Error validating permissions'
      };
    }
  }

  // Private helper methods

  private static async getPermissionsFromRoles(roleIds: string[]): Promise<string[]> {
    if (roleIds.length === 0) return [];

    try {
      const rolesQuery = query(
        collection(db, this.RBAC_ROLES),
        where('id', 'in', roleIds),
        where('isActive', '==', true)
      );

      const rolesSnapshot = await getDocs(rolesQuery);
      const allPermissions: string[] = [];

      rolesSnapshot.docs.forEach(doc => {
        const roleData = doc.data() as RoleDocument;
        allPermissions.push(...roleData.permissions);
      });

      return [...new Set(allPermissions)];
    } catch (error) {
      console.error('Error getting permissions from roles:', error);
      return [];
    }
  }

  private static async getProfileSpecificPermissions(
    userType: string,
    isProfileOwner: boolean
  ): Promise<string[]> {
    const basePermissions = [
      'profile.view'
    ];

    if (isProfileOwner) {
      basePermissions.push(
        'profile.edit',
        'profile.publish',
        'profile.unpublish',
        'profile.analytics',
        'profile.customize',
        'profile.backup',
        'profile.export'
      );

      // Add user-type specific permissions
      switch (userType) {
        case 'vendor':
        case 'organization':
          basePermissions.push(
            'profile.optimize',
            'profile.import'
          );
          break;
        case 'freelancer':
          basePermissions.push('profile.optimize');
          break;
      }
    }

    return basePermissions;
  }

  private static async getProfileRestrictions(
    userType: string,
    userRoles: string[]
  ): Promise<UserProfilePermissions['restrictions']> {
    // Default restrictions
    const restrictions = {
      publicProfileRequired: false,
      verificationRequired: false,
      completionThreshold: 50
    };

    // Apply role-based restrictions
    if (userRoles.includes('premium_freelancer') || userRoles.includes('enterprise_vendor')) {
      restrictions.completionThreshold = 80;
      restrictions.verificationRequired = true;
    }

    if (userType === 'organization') {
      restrictions.publicProfileRequired = true;
      restrictions.completionThreshold = 70;
    }

    return restrictions;
  }

  private static hasPermission(permissions: string[], requiredPermission: string): boolean {
    return permissions.includes(requiredPermission);
  }

  private static async logProfileAccess(logData: {
    userId: string;
    profileId: string;
    action: string;
    allowed: boolean;
    reason?: string;
    timestamp: Date;
    metadata: any;
  }): Promise<void> {
    try {
      const logsRef = collection(db, 'profile_access_logs');
      const logDoc = doc(logsRef);
      
      await updateDoc(logDoc, {
        ...logData,
        timestamp: Timestamp.fromDate(logData.timestamp)
      });
    } catch (error) {
      // Log access logging failure, but don't throw
      console.error('Failed to log profile access:', error);
    }
  }

  /**
   * Get role-based dashboard configuration
   */
  static async getDashboardConfiguration(userId: string): Promise<{
    availableSections: string[];
    permissions: UserProfilePermissions;
    uiConfiguration: {
      showOptimization: boolean;
      showAnalytics: boolean;
      showBranding: boolean;
      showPublishing: boolean;
      showVerification: boolean;
    };
  }> {
    try {
      const userPermissions = await this.getUserProfilePermissions(userId);
      const dashboardSections = await this.getAvailableDashboardSections(userId);

      return {
        availableSections: dashboardSections.profileSections,
        permissions: userPermissions,
        uiConfiguration: {
          showOptimization: dashboardSections.optimizationAccess,
          showAnalytics: dashboardSections.analyticsAccess,
          showBranding: dashboardSections.brandingAccess,
          showPublishing: dashboardSections.publishingAccess,
          showVerification: userPermissions.canVerifyProfile
        }
      };
    } catch (error) {
      console.error('Error getting dashboard configuration:', error);
      throw error;
    }
  }
}