/**
 * React Hook for Profile Publishing
 * Manages profile preview, validation, and publishing workflow
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  ProfilePublishingService,
  PublishingStatus,
  ProfileValidation,
  ProfilePreview,
  ProfileVersion,
  PublishingSchedule
} from '@/lib/profile/publishing-service';
import { useToast } from '@/hooks/use-toast';

interface UseProfilePublishingProps {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  autoValidate?: boolean;
}

interface UseProfilePublishingReturn {
  // Status
  publishingStatus: PublishingStatus | null;
  validation: ProfileValidation | null;
  isPublished: boolean;
  isDraft: boolean;
  
  // Loading states
  isValidating: boolean;
  isPublishing: boolean;
  isLoading: boolean;
  
  // Actions
  validateProfile: () => Promise<ProfileValidation>;
  publishProfile: (schedule?: PublishingSchedule) => Promise<boolean>;
  unpublishProfile: (reason?: string) => Promise<boolean>;
  createPreview: (expirationHours?: number) => Promise<ProfilePreview | null>;
  
  // Versions
  versions: ProfileVersion[];
  restoreVersion: (versionId: string) => Promise<boolean>;
  refreshVersions: () => Promise<void>;
}

export function useProfilePublishing({
  profileId,
  userType,
  autoValidate = true
}: UseProfilePublishingProps): UseProfilePublishingReturn {
  const { toast } = useToast();
  const [publishingStatus, setPublishingStatus] = useState<PublishingStatus | null>(null);
  const [validation, setValidation] = useState<ProfileValidation | null>(null);
  const [versions, setVersions] = useState<ProfileVersion[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch publishing status
  const fetchPublishingStatus = useCallback(async () => {
    try {
      const status = await ProfilePublishingService.getPublishingStatus(profileId);
      setPublishingStatus(status);
    } catch (error) {
      console.error('Error fetching publishing status:', error);
    }
  }, [profileId]);

  // Validate profile
  const validateProfile = useCallback(async (): Promise<ProfileValidation> => {
    setIsValidating(true);
    try {
      const result = await ProfilePublishingService.validateProfile(profileId, userType);
      setValidation(result);
      return result;
    } catch (error) {
      console.error('Error validating profile:', error);
      const errorValidation: ProfileValidation = {
        isValid: false,
        errors: [{ field: 'general', message: 'Validation failed', severity: 'error' }],
        warnings: [],
        completeness: {
          score: 0,
          isComplete: false,
          missingRequired: [],
          missingOptional: [],
          suggestions: []
        }
      };
      setValidation(errorValidation);
      return errorValidation;
    } finally {
      setIsValidating(false);
    }
  }, [profileId, userType]);

  // Publish profile
  const publishProfile = useCallback(async (schedule?: PublishingSchedule): Promise<boolean> => {
    setIsPublishing(true);
    try {
      // Validate first
      const validationResult = await validateProfile();
      
      if (!validationResult.isValid) {
        toast({
          title: 'Cannot publish profile',
          description: 'Please fix validation errors before publishing',
          variant: 'destructive'
        });
        return false;
      }

      const result = await ProfilePublishingService.publishProfile(profileId, userType, schedule);
      
      if (result.success) {
        toast({
          title: 'Profile published!',
          description: result.message
        });
        await fetchPublishingStatus();
        return true;
      } else {
        toast({
          title: 'Failed to publish',
          description: result.message,
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to publish profile',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsPublishing(false);
    }
  }, [profileId, userType, validateProfile, fetchPublishingStatus, toast]);

  // Unpublish profile
  const unpublishProfile = useCallback(async (reason?: string): Promise<boolean> => {
    setIsPublishing(true);
    try {
      const result = await ProfilePublishingService.unpublishProfile(profileId, reason);
      
      if (result.success) {
        toast({
          title: 'Profile unpublished',
          description: result.message
        });
        await fetchPublishingStatus();
        return true;
      } else {
        toast({
          title: 'Failed to unpublish',
          description: result.message,
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unpublish profile',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsPublishing(false);
    }
  }, [profileId, fetchPublishingStatus, toast]);

  // Create preview
  const createPreview = useCallback(async (expirationHours?: number): Promise<ProfilePreview | null> => {
    try {
      const preview = await ProfilePublishingService.createPreview(profileId, userType, expirationHours);
      
      toast({
        title: 'Preview created',
        description: 'Preview link has been generated'
      });
      
      return preview;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create preview',
        variant: 'destructive'
      });
      return null;
    }
  }, [profileId, userType, toast]);

  // Fetch versions
  const fetchVersions = useCallback(async () => {
    try {
      const versionList = await ProfilePublishingService.getProfileVersions(profileId);
      setVersions(versionList);
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  }, [profileId]);

  // Restore version
  const restoreVersion = useCallback(async (versionId: string): Promise<boolean> => {
    try {
      const result = await ProfilePublishingService.restoreVersion(profileId, versionId);
      
      if (result.success) {
        toast({
          title: 'Version restored',
          description: result.message
        });
        await Promise.all([fetchPublishingStatus(), fetchVersions()]);
        return true;
      } else {
        toast({
          title: 'Failed to restore',
          description: result.message,
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore version',
        variant: 'destructive'
      });
      return false;
    }
  }, [profileId, fetchPublishingStatus, fetchVersions, toast]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchPublishingStatus(),
          fetchVersions(),
          autoValidate ? validateProfile() : Promise.resolve()
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    if (profileId) {
      loadData();
    }
  }, [profileId, fetchPublishingStatus, fetchVersions, validateProfile, autoValidate]);

  const isPublished = publishingStatus?.status === 'published';
  const isDraft = publishingStatus?.status === 'draft' || !publishingStatus;

  return {
    publishingStatus,
    validation,
    isPublished,
    isDraft,
    isValidating,
    isPublishing,
    isLoading,
    validateProfile,
    publishProfile,
    unpublishProfile,
    createPreview,
    versions,
    restoreVersion,
    refreshVersions: fetchVersions
  };
}

/**
 * Hook for profile preview
 */
export function useProfilePreview(token: string) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    const validatePreview = async () => {
      try {
        // This would validate the preview token with your backend
        // For now, we'll simulate it
        setIsValid(true);
        setProfileData({
          // Mock profile data
          name: 'Preview Profile',
          bio: 'This is a preview of your profile'
        });
      } catch (error) {
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      validatePreview();
    }
  }, [token]);

  return {
    isValid,
    isLoading,
    profileData
  };
}