/**
 * Profile Management Hooks
 * React hooks for managing user profiles with role-based functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { 
  EnhancedUserDocument,
  EnhancedFreelancerProfile,
  EnhancedVendorProfile,
  EnhancedOrganizationProfile,
  ProfileCompletion,
  ProfileAnalytics
} from '@/lib/firebase/enhanced-profile-schema';
import { UserType } from '@/lib/firebase/onboarding-schema';
import { enhancedProfileService } from '@/lib/firebase/enhanced-profile-service';
import { logger } from '@/lib/utils/logger';

export interface UseProfileOptions {
  includeAnalytics?: boolean;
  includeCompletion?: boolean;
  autoFetch?: boolean;
}

export interface UseProfileReturn {
  // Core profile data
  userProfile: EnhancedUserDocument | null;
  specificProfile: EnhancedFreelancerProfile | EnhancedVendorProfile | EnhancedOrganizationProfile | null;
  profileCompletion: ProfileCompletion | null;
  profileAnalytics: ProfileAnalytics | null;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  
  // Error handling
  error: string | null;
  
  // Profile actions
  updateProfile: (updates: Partial<EnhancedUserDocument>) => Promise<void>;
  updateSpecificProfile: (updates: any) => Promise<void>;
  publishProfile: () => Promise<void>;
  unpublishProfile: () => Promise<void>;
  generateSlug: (baseName: string) => Promise<string>;
  
  // Profile completion
  refreshCompletion: () => Promise<void>;
  
  // Utilities
  clearError: () => void;
  refetch: () => Promise<void>;
}

/**
 * Main profile management hook
 */
export function useProfile(options: UseProfileOptions = {}): UseProfileReturn {
  const { user } = useAuth();
  const {
    includeAnalytics = false,
    includeCompletion = true,
    autoFetch = true
  } = options;

  // State management
  const [userProfile, setUserProfile] = useState<EnhancedUserDocument | null>(null);
  const [specificProfile, setSpecificProfile] = useState<any>(null);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletion | null>(null);
  const [profileAnalytics, setProfileAnalytics] = useState<ProfileAnalytics | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch enhanced user profile
      const userProfileData = await fetchUserProfile(user.id);
      setUserProfile(userProfileData);

      // Fetch user type specific profile
      if (userProfileData) {
        const specificProfileData = await fetchSpecificProfile(user.id, getUserType(userProfileData));
        setSpecificProfile(specificProfileData);
      }

      // Fetch profile completion if requested
      if (includeCompletion && userProfileData) {
        const completionData = await fetchProfileCompletion(user.id);
        setProfileCompletion(completionData);
      }

      // Fetch analytics if requested
      if (includeAnalytics && userProfileData) {
        const analyticsData = await fetchProfileAnalytics(user.id);
        setProfileAnalytics(analyticsData);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      logger.error('Profile fetch failed', err as Error, { userId: user.id });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, includeAnalytics, includeCompletion]);

  // Auto-fetch on mount and user change
  useEffect(() => {
    if (autoFetch && user?.id) {
      fetchProfile();
    }
  }, [autoFetch, user?.id, fetchProfile]);

  // Update main user profile
  const updateProfile = useCallback(async (updates: Partial<EnhancedUserDocument>) => {
    if (!user?.id || !userProfile) return;

    try {
      setIsSaving(true);
      setError(null);

      await updateUserProfile(user.id, updates);
      
      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);

      // Refresh completion if it's being tracked
      if (includeCompletion) {
        await refreshCompletion();
      }

      logger.info('Profile updated successfully', { userId: user.id, fields: Object.keys(updates) });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      logger.error('Profile update failed', err as Error, { userId: user.id });
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, userProfile, includeCompletion]);

  // Update specific profile (freelancer/vendor/organization)
  const updateSpecificProfile = useCallback(async (updates: any) => {
    if (!user?.id || !userProfile) return;

    try {
      setIsSaving(true);
      setError(null);

      const userType = getUserType(userProfile);
      await updateTypeSpecificProfile(user.id, userType, updates);
      
      // Update local state
      setSpecificProfile(prev => prev ? { ...prev, ...updates } : null);

      // Refresh completion
      if (includeCompletion) {
        await refreshCompletion();
      }

      logger.info('Specific profile updated successfully', { 
        userId: user.id, 
        userType, 
        fields: Object.keys(updates) 
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      logger.error('Specific profile update failed', err as Error, { userId: user.id });
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, userProfile, includeCompletion]);

  // Publish profile
  const publishProfile = useCallback(async () => {
    if (!user?.id || !userProfile) return;

    try {
      setIsPublishing(true);
      setError(null);

      const userType = getUserType(userProfile);
      await enhancedProfileService.publishProfile(user.id, userType);
      
      // Update local state
      setUserProfile(prev => prev ? {
        ...prev,
        publicProfile: {
          ...prev.publicProfile,
          isPublic: true,
          publishStatus: 'published',
          lastPublishedAt: new Date()
        }
      } : null);

      logger.info('Profile published successfully', { userId: user.id, userType });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish profile';
      setError(errorMessage);
      logger.error('Profile publish failed', err as Error, { userId: user.id });
      throw err;
    } finally {
      setIsPublishing(false);
    }
  }, [user?.id, userProfile]);

  // Unpublish profile
  const unpublishProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsPublishing(true);
      setError(null);

      await enhancedProfileService.unpublishProfile(user.id);
      
      // Update local state
      setUserProfile(prev => prev ? {
        ...prev,
        publicProfile: {
          ...prev.publicProfile,
          isPublic: false,
          publishStatus: 'unpublished'
        }
      } : null);

      logger.info('Profile unpublished successfully', { userId: user.id });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unpublish profile';
      setError(errorMessage);
      logger.error('Profile unpublish failed', err as Error, { userId: user.id });
      throw err;
    } finally {
      setIsPublishing(false);
    }
  }, [user?.id]);

  // Generate unique slug
  const generateSlug = useCallback(async (baseName: string): Promise<string> => {
    if (!user?.id || !userProfile) throw new Error('User not available');

    try {
      const userType = getUserType(userProfile);
      const slug = await enhancedProfileService.generateUniqueSlug({
        baseName,
        userType,
        maxAttempts: 5
      });

      // Assign slug to user
      await enhancedProfileService.assignSlugToUser(slug, user.id);

      return slug;
    } catch (err) {
      logger.error('Slug generation failed', err as Error, { userId: user.id, baseName });
      throw err;
    }
  }, [user?.id, userProfile]);

  // Refresh profile completion
  const refreshCompletion = useCallback(async () => {
    if (!user?.id || !userProfile) return;

    try {
      const userType = getUserType(userProfile);
      await enhancedProfileService.updateProfileCompletion(user.id, userType);
      
      const completionData = await fetchProfileCompletion(user.id);
      setProfileCompletion(completionData);
    } catch (err) {
      logger.error('Profile completion refresh failed', err as Error, { userId: user.id });
    }
  }, [user?.id, userProfile]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refetch all data
  const refetch = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return {
    // Data
    userProfile,
    specificProfile,
    profileCompletion,
    profileAnalytics,
    
    // Loading states
    isLoading,
    isSaving,
    isPublishing,
    
    // Error handling
    error,
    
    // Actions
    updateProfile,
    updateSpecificProfile,
    publishProfile,
    unpublishProfile,
    generateSlug,
    refreshCompletion,
    
    // Utilities
    clearError,
    refetch
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function fetchUserProfile(userId: string): Promise<EnhancedUserDocument | null> {
  try {
    // This would use the enhanced profile service to fetch user data
    // For now, return mock data structure
    return {
      id: userId,
      email: 'user@example.com',
      name: 'John Doe',
      organizationId: undefined,
      roles: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      profileCompletion: 45,
      publicProfile: {
        isPublic: false,
        isAvailableForHire: true,
        publishStatus: 'draft'
      },
      verification: {
        identity: 'not_started',
        email: 'verified',
        phone: 'not_started',
        background: 'not_started',
        skillsAssessment: 'not_started'
      },
      profileMetrics: {
        views: 0,
        inquiries: 0,
        hired: 0,
        rating: 0,
        reviewCount: 0,
        responseTime: 24,
        completionRate: 0
      },
      metadata: {
        clerkUserId: userId,
        clerkCreatedAt: new Date(),
        clerkUpdatedAt: new Date(),
        emailVerified: true,
        phoneVerified: false,
        lastSyncedAt: new Date()
      }
    };
  } catch (error) {
    logger.error('Failed to fetch user profile', error as Error, { userId });
    return null;
  }
}

async function fetchSpecificProfile(userId: string, userType: UserType): Promise<any> {
  try {
    // This would fetch type-specific profile data
    // Implementation depends on user type
    return null;
  } catch (error) {
    logger.error('Failed to fetch specific profile', error as Error, { userId, userType });
    return null;
  }
}

async function fetchProfileCompletion(userId: string): Promise<ProfileCompletion | null> {
  try {
    // This would fetch profile completion data
    return {
      userId,
      userType: UserType.FREELANCER,
      completionPercentage: 45,
      lastUpdated: new Date(),
      sections: {
        basicInfo: {
          completed: true,
          score: 100,
          suggestions: []
        },
        professional: {
          completed: false,
          score: 60,
          suggestions: ['Add more skills', 'Set availability']
        },
        portfolio: {
          completed: false,
          score: 20,
          suggestions: ['Add portfolio projects', 'Upload work samples']
        },
        verification: {
          completed: false,
          score: 30,
          suggestions: ['Complete identity verification']
        },
        seo: {
          completed: false,
          score: 0,
          suggestions: ['Add meta description', 'Set keywords']
        }
      },
      recommendations: [
        {
          priority: 'high',
          action: 'add_portfolio_projects',
          description: 'Add at least 3 portfolio projects to showcase your work',
          estimatedImpact: 25
        }
      ]
    };
  } catch (error) {
    logger.error('Failed to fetch profile completion', error as Error, { userId });
    return null;
  }
}

async function fetchProfileAnalytics(userId: string): Promise<ProfileAnalytics | null> {
  try {
    // This would fetch profile analytics data
    return null;
  } catch (error) {
    logger.error('Failed to fetch profile analytics', error as Error, { userId });
    return null;
  }
}

async function updateUserProfile(userId: string, updates: Partial<EnhancedUserDocument>): Promise<void> {
  // This would use the enhanced profile service to update user data
  logger.info('Updating user profile', { userId, updates });
}

async function updateTypeSpecificProfile(userId: string, userType: UserType, updates: any): Promise<void> {
  // This would use the enhanced profile service to update specific profile data
  logger.info('Updating type-specific profile', { userId, userType, updates });
}

function getUserType(userProfile: EnhancedUserDocument): UserType {
  // Determine user type from profile data
  // This would check roles, organization membership, etc.
  return UserType.FREELANCER; // Default for now
}

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

/**
 * Hook for freelancer-specific profile management
 */
export function useFreelancerProfile() {
  const profileHook = useProfile({ includeCompletion: true, includeAnalytics: true });
  
  return {
    ...profileHook,
    freelancerProfile: profileHook.specificProfile as EnhancedFreelancerProfile | null,
    
    // Freelancer-specific actions
    updateSkills: async (skills: any) => {
      await profileHook.updateSpecificProfile({ skills });
    },
    
    updatePricing: async (pricing: any) => {
      await profileHook.updateSpecificProfile({ 
        professional: { 
          ...profileHook.specificProfile?.professional, 
          pricing 
        } 
      });
    },
    
    addPortfolioProject: async (project: any) => {
      const currentProjects = profileHook.specificProfile?.portfolio?.projects || [];
      await profileHook.updateSpecificProfile({
        portfolio: {
          ...profileHook.specificProfile?.portfolio,
          projects: [...currentProjects, project]
        }
      });
    }
  };
}

/**
 * Hook for vendor-specific profile management
 */
export function useVendorProfile() {
  const profileHook = useProfile({ includeCompletion: true, includeAnalytics: true });
  
  return {
    ...profileHook,
    vendorProfile: profileHook.specificProfile as EnhancedVendorProfile | null,
    
    // Vendor-specific actions
    updateCompanyInfo: async (company: any) => {
      await profileHook.updateSpecificProfile({ company });
    },
    
    updateServices: async (services: any) => {
      await profileHook.updateSpecificProfile({ services });
    },
    
    addCaseStudy: async (caseStudy: any) => {
      const currentCaseStudies = profileHook.specificProfile?.showcase?.caseStudies || [];
      await profileHook.updateSpecificProfile({
        showcase: {
          ...profileHook.specificProfile?.showcase,
          caseStudies: [...currentCaseStudies, caseStudy]
        }
      });
    }
  };
}

/**
 * Hook for organization-specific profile management
 */
export function useOrganizationProfile() {
  const profileHook = useProfile({ includeCompletion: true });
  
  return {
    ...profileHook,
    organizationProfile: profileHook.specificProfile as EnhancedOrganizationProfile | null,
    
    // Organization-specific actions
    updateRequirements: async (requirements: any) => {
      await profileHook.updateSpecificProfile({ requirements });
    },
    
    updatePartnerships: async (partnerships: any) => {
      await profileHook.updateSpecificProfile({ partnerships });
    }
  };
}