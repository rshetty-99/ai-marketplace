/**
 * Profile Publishing Service
 * Manages profile preview, validation, and publishing workflow
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

export interface PublishingStatus {
  status: 'draft' | 'review' | 'published' | 'unpublished' | 'suspended';
  publishedAt?: Date;
  unpublishedAt?: Date;
  lastModified: Date;
  version: number;
  reviewNotes?: string;
  suspensionReason?: string;
}

export interface ProfileCompleteness {
  score: number; // 0-100
  isComplete: boolean;
  missingRequired: string[];
  missingOptional: string[];
  suggestions: string[];
}

export interface ProfileValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  completeness: ProfileCompleteness;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface ProfilePreview {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  previewUrl: string;
  previewToken: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface PublishingSchedule {
  scheduledFor?: Date;
  unpublishAt?: Date;
  autoRenew: boolean;
  renewalPeriod?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export interface ProfileVersion {
  versionId: string;
  profileId: string;
  version: number;
  data: any; // Profile data snapshot
  createdAt: Date;
  createdBy: string;
  changeLog?: string;
  isPublished: boolean;
}

export class ProfilePublishingService {
  private static readonly PROFILES_COLLECTION = 'profiles';
  private static readonly VERSIONS_COLLECTION = 'profile-versions';
  private static readonly PREVIEWS_COLLECTION = 'profile-previews';

  /**
   * Validate profile for publishing
   */
  static async validateProfile(
    profileId: string,
    userType: 'freelancer' | 'vendor' | 'organization'
  ): Promise<ProfileValidation> {
    try {
      const profileRef = doc(db, this.PROFILES_COLLECTION, profileId);
      const profileDoc = await getDoc(profileRef);

      if (!profileDoc.exists()) {
        return {
          isValid: false,
          errors: [{ field: 'profile', message: 'Profile not found', severity: 'critical' }],
          warnings: [],
          completeness: {
            score: 0,
            isComplete: false,
            missingRequired: ['profile'],
            missingOptional: [],
            suggestions: ['Create a profile first']
          }
        };
      }

      const profile = profileDoc.data();
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];
      const missingRequired: string[] = [];
      const missingOptional: string[] = [];
      const suggestions: string[] = [];

      // Required fields validation
      const requiredFields = this.getRequiredFields(userType);
      
      for (const field of requiredFields) {
        const value = this.getNestedValue(profile, field);
        if (!value || (Array.isArray(value) && value.length === 0)) {
          errors.push({
            field,
            message: `${this.formatFieldName(field)} is required`,
            severity: 'error'
          });
          missingRequired.push(field);
        }
      }

      // Optional but recommended fields
      const optionalFields = this.getOptionalFields(userType);
      
      for (const field of optionalFields) {
        const value = this.getNestedValue(profile, field);
        if (!value || (Array.isArray(value) && value.length === 0)) {
          warnings.push({
            field,
            message: `Adding ${this.formatFieldName(field)} can improve your profile visibility`,
            suggestion: `Consider adding ${this.formatFieldName(field)} to attract more clients`
          });
          missingOptional.push(field);
        }
      }

      // Content quality checks
      if (profile.bio && profile.bio.length < 100) {
        warnings.push({
          field: 'bio',
          message: 'Your bio is quite short',
          suggestion: 'A detailed bio (150+ characters) helps clients understand your expertise'
        });
      }

      if (profile.skills && profile.skills.length < 3) {
        warnings.push({
          field: 'skills',
          message: 'Add more skills',
          suggestion: 'Profiles with 5+ skills get 40% more views'
        });
      }

      if (!profile.avatar) {
        warnings.push({
          field: 'avatar',
          message: 'No profile photo',
          suggestion: 'Profiles with photos get 3x more engagement'
        });
      }

      // SEO checks
      if (!profile.publicProfile?.slug) {
        errors.push({
          field: 'slug',
          message: 'Custom URL is required for public profiles',
          severity: 'error'
        });
      }

      // Calculate completeness score
      const totalFields = requiredFields.length + optionalFields.length;
      const completedFields = totalFields - missingRequired.length - missingOptional.length;
      const score = Math.round((completedFields / totalFields) * 100);

      // Generate suggestions
      if (score < 50) {
        suggestions.push('Your profile needs more information to be effective');
      }
      if (score >= 50 && score < 80) {
        suggestions.push('Your profile is good but could be improved');
      }
      if (score >= 80) {
        suggestions.push('Your profile is well-optimized!');
      }

      if (!profile.portfolio || profile.portfolio.length === 0) {
        suggestions.push('Add portfolio items to showcase your work');
      }

      if (!profile.testimonials || profile.testimonials.length === 0) {
        suggestions.push('Request testimonials from past clients');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        completeness: {
          score,
          isComplete: score >= 80 && errors.length === 0,
          missingRequired,
          missingOptional,
          suggestions
        }
      };
    } catch (error) {
      console.error('Error validating profile:', error);
      throw error;
    }
  }

  /**
   * Create a preview URL for the profile
   */
  static async createPreview(
    profileId: string,
    userType: 'freelancer' | 'vendor' | 'organization',
    expirationHours: number = 24
  ): Promise<ProfilePreview> {
    try {
      const previewToken = this.generatePreviewToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      const preview: ProfilePreview = {
        profileId,
        userType,
        previewUrl: this.generatePreviewUrl(userType, profileId, previewToken),
        previewToken,
        expiresAt,
        createdAt: new Date()
      };

      // Store preview in database
      const previewRef = doc(collection(db, this.PREVIEWS_COLLECTION));
      await updateDoc(previewRef, {
        ...preview,
        expiresAt: Timestamp.fromDate(preview.expiresAt),
        createdAt: Timestamp.fromDate(preview.createdAt)
      });

      return preview;
    } catch (error) {
      console.error('Error creating preview:', error);
      throw error;
    }
  }

  /**
   * Publish a profile
   */
  static async publishProfile(
    profileId: string,
    userType: 'freelancer' | 'vendor' | 'organization',
    schedule?: PublishingSchedule
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate profile first
      const validation = await this.validateProfile(profileId, userType);
      
      if (!validation.isValid) {
        return {
          success: false,
          message: `Profile has validation errors: ${validation.errors.map(e => e.message).join(', ')}`
        };
      }

      const batch = writeBatch(db);
      const profileRef = doc(db, this.PROFILES_COLLECTION, profileId);
      
      // Create version snapshot before publishing
      const profileDoc = await getDoc(profileRef);
      const profileData = profileDoc.data();
      
      if (!profileData) {
        return {
          success: false,
          message: 'Profile not found'
        };
      }

      // Create version
      const versionRef = doc(collection(db, this.VERSIONS_COLLECTION));
      const version: Omit<ProfileVersion, 'versionId'> = {
        profileId,
        version: (profileData.publishingStatus?.version || 0) + 1,
        data: profileData,
        createdAt: new Date(),
        createdBy: profileId,
        changeLog: 'Profile published',
        isPublished: true
      };
      
      batch.set(versionRef, {
        ...version,
        versionId: versionRef.id,
        createdAt: Timestamp.fromDate(version.createdAt)
      });

      // Update profile status
      const publishingStatus: PublishingStatus = {
        status: 'published',
        publishedAt: schedule?.scheduledFor || new Date(),
        lastModified: new Date(),
        version: version.version
      };

      const updates: any = {
        'publishingStatus': publishingStatus,
        'publicProfile.isPublic': true,
        'publicProfile.publishedAt': Timestamp.fromDate(publishingStatus.publishedAt),
        'publicProfile.publishStatus': 'published'
      };

      if (schedule) {
        updates['publishingSchedule'] = {
          ...schedule,
          scheduledFor: schedule.scheduledFor ? Timestamp.fromDate(schedule.scheduledFor) : null,
          unpublishAt: schedule.unpublishAt ? Timestamp.fromDate(schedule.unpublishAt) : null
        };
      }

      batch.update(profileRef, updates);
      
      await batch.commit();

      return {
        success: true,
        message: 'Profile published successfully'
      };
    } catch (error) {
      console.error('Error publishing profile:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to publish profile'
      };
    }
  }

  /**
   * Unpublish a profile
   */
  static async unpublishProfile(
    profileId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const profileRef = doc(db, this.PROFILES_COLLECTION, profileId);
      const profileDoc = await getDoc(profileRef);
      
      if (!profileDoc.exists()) {
        return {
          success: false,
          message: 'Profile not found'
        };
      }

      const updates = {
        'publishingStatus.status': 'unpublished',
        'publishingStatus.unpublishedAt': Timestamp.now(),
        'publishingStatus.lastModified': Timestamp.now(),
        'publishingStatus.reviewNotes': reason,
        'publicProfile.isPublic': false,
        'publicProfile.publishStatus': 'unpublished'
      };

      await updateDoc(profileRef, updates);

      return {
        success: true,
        message: 'Profile unpublished successfully'
      };
    } catch (error) {
      console.error('Error unpublishing profile:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to unpublish profile'
      };
    }
  }

  /**
   * Get profile versions
   */
  static async getProfileVersions(
    profileId: string,
    limit: number = 10
  ): Promise<ProfileVersion[]> {
    try {
      const versionsQuery = query(
        collection(db, this.VERSIONS_COLLECTION),
        where('profileId', '==', profileId),
        where('version', '>', 0)
      );

      const snapshot = await getDocs(versionsQuery);
      
      return snapshot.docs
        .map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate()
        } as ProfileVersion))
        .sort((a, b) => b.version - a.version)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching profile versions:', error);
      return [];
    }
  }

  /**
   * Restore a previous version
   */
  static async restoreVersion(
    profileId: string,
    versionId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const versionRef = doc(db, this.VERSIONS_COLLECTION, versionId);
      const versionDoc = await getDoc(versionRef);
      
      if (!versionDoc.exists()) {
        return {
          success: false,
          message: 'Version not found'
        };
      }

      const versionData = versionDoc.data() as ProfileVersion;
      
      if (versionData.profileId !== profileId) {
        return {
          success: false,
          message: 'Version does not belong to this profile'
        };
      }

      // Restore the profile data
      const profileRef = doc(db, this.PROFILES_COLLECTION, profileId);
      const restoredData = {
        ...versionData.data,
        'publishingStatus.lastModified': Timestamp.now(),
        'publishingStatus.version': (versionData.data.publishingStatus?.version || 0) + 1,
        'publishingStatus.reviewNotes': `Restored from version ${versionData.version}`
      };

      await updateDoc(profileRef, restoredData);

      return {
        success: true,
        message: `Profile restored to version ${versionData.version}`
      };
    } catch (error) {
      console.error('Error restoring version:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to restore version'
      };
    }
  }

  /**
   * Get publishing status
   */
  static async getPublishingStatus(profileId: string): Promise<PublishingStatus | null> {
    try {
      const profileRef = doc(db, this.PROFILES_COLLECTION, profileId);
      const profileDoc = await getDoc(profileRef);
      
      if (!profileDoc.exists()) {
        return null;
      }

      const data = profileDoc.data();
      return data.publishingStatus || null;
    } catch (error) {
      console.error('Error fetching publishing status:', error);
      return null;
    }
  }

  // Helper methods
  private static getRequiredFields(userType: 'freelancer' | 'vendor' | 'organization'): string[] {
    const common = ['name', 'bio', 'publicProfile.slug'];
    
    switch (userType) {
      case 'freelancer':
        return [...common, 'skills', 'hourlyRate'];
      case 'vendor':
        return [...common, 'companyName', 'services'];
      case 'organization':
        return [...common, 'companyName', 'industry'];
      default:
        return common;
    }
  }

  private static getOptionalFields(userType: 'freelancer' | 'vendor' | 'organization'): string[] {
    const common = ['avatar', 'location', 'website', 'socialLinks'];
    
    switch (userType) {
      case 'freelancer':
        return [...common, 'portfolio', 'testimonials', 'certifications'];
      case 'vendor':
        return [...common, 'teamSize', 'foundedYear', 'caseStudies'];
      case 'organization':
        return [...common, 'mission', 'values', 'partnerships'];
      default:
        return common;
    }
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private static formatFieldName(field: string): string {
    return field
      .split('.')
      .pop()!
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private static generatePreviewToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private static generatePreviewUrl(
    userType: 'freelancer' | 'vendor' | 'organization',
    profileId: string,
    token: string
  ): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const route = userType === 'freelancer' ? 'providers' : 
                  userType === 'vendor' ? 'vendors' : 'organizations';
    
    return `${baseUrl}/${route}/preview/${profileId}?token=${token}`;
  }
}