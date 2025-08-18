/**
 * Enhanced Profile Service
 * Production-ready service for managing comprehensive user profiles
 * with Clerk integration and Firestore storage (no MCP dependencies)
 */

import { 
  doc, 
  collection, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebase-config';
import { 
  EnhancedUserDocument,
  EnhancedFreelancerProfile,
  EnhancedVendorProfile,
  EnhancedOrganizationProfile,
  ProfileSlug,
  ProfileAnalytics,
  ProfileCompletion,
  ProfileVerification,
  PROFILE_COLLECTIONS
} from './enhanced-profile-schema';
import { UserType } from './onboarding-schema';
import { logger } from '../utils/logger';
import { cache, CacheTags } from '../utils/cache';

interface ClerkUserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  imageUrl?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProfileCreationOptions {
  publishImmediately?: boolean;
  generateSlug?: boolean;
  initializeAnalytics?: boolean;
  skipValidation?: boolean;
}

interface SlugGenerationOptions {
  baseName: string;
  userType: UserType;
  preferredSlug?: string;
  maxAttempts?: number;
}

export class EnhancedProfileService {
  
  // =============================================================================
  // CORE PROFILE MANAGEMENT
  // =============================================================================

  /**
   * Create enhanced user profile from Clerk webhook data
   */
  async createUserProfile(
    clerkUserData: ClerkUserData,
    userType: UserType,
    options: ProfileCreationOptions = {}
  ): Promise<EnhancedUserDocument> {
    try {
      const userId = clerkUserData.id;
      
      // Create enhanced user document
      const enhancedUser: EnhancedUserDocument = {
        id: userId,
        email: clerkUserData.email,
        name: `${clerkUserData.firstName || ''} ${clerkUserData.lastName || ''}`.trim() || 
              clerkUserData.username || 
              'Anonymous User',
        avatar: clerkUserData.imageUrl,
        organizationId: undefined,
        roles: [], // Will be populated by RBAC system
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Enhanced profile fields
        bio: '',
        location: '',
        timezone: '',
        profileCompletion: 10, // Basic info completed
        
        publicProfile: {
          isPublic: false,
          isAvailableForHire: userType === UserType.FREELANCER,
          publishStatus: 'draft'
        },
        
        verification: {
          identity: 'not_started',
          email: clerkUserData.emailVerified ? 'verified' : 'not_started',
          phone: clerkUserData.phoneVerified ? 'verified' : 'not_started',
          background: 'not_started',
          skillsAssessment: 'not_started'
        },
        
        profileMetrics: {
          views: 0,
          inquiries: 0,
          hired: 0,
          rating: 0,
          reviewCount: 0,
          responseTime: 24, // Default 24 hours
          completionRate: 0
        },
        
        metadata: {
          clerkUserId: userId,
          clerkCreatedAt: clerkUserData.createdAt,
          clerkUpdatedAt: clerkUserData.updatedAt,
          emailVerified: clerkUserData.emailVerified,
          phoneVerified: clerkUserData.phoneVerified,
          lastSyncedAt: new Date()
        }
      };

      // Generate slug if requested
      if (options.generateSlug) {
        const slug = await this.generateUniqueSlug({
          baseName: enhancedUser.name,
          userType,
          maxAttempts: 5
        });
        enhancedUser.publicProfile.slug = slug;
      }

      // Save enhanced user document
      await setDoc(doc(db, PROFILE_COLLECTIONS.USERS, userId), {
        ...enhancedUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Initialize profile completion tracking
      await this.initializeProfileCompletion(userId, userType);

      // Initialize analytics if requested
      if (options.initializeAnalytics) {
        await this.initializeProfileAnalytics(userId, userType);
      }

      // Cache the user profile
      cache.set(`user:${userId}`, enhancedUser, { tags: [CacheTags.USER, `user:${userId}`] });

      logger.logAudit('enhanced_user_profile_created', userId, 'user', userId, {
        userType,
        email: clerkUserData.email,
        hasSlug: !!enhancedUser.publicProfile.slug
      });

      return enhancedUser;

    } catch (error) {
      logger.error('Failed to create enhanced user profile', error as Error, {
        userId: clerkUserData.id,
        userType
      });
      throw error;
    }
  }

  /**
   * Update user profile from Clerk webhook data
   */
  async updateUserProfileFromClerk(
    userId: string,
    clerkUserData: Partial<ClerkUserData>
  ): Promise<void> {
    try {
      const updateData: Partial<EnhancedUserDocument> = {
        updatedAt: new Date(),
        'metadata.clerkUpdatedAt': clerkUserData.updatedAt || new Date(),
        'metadata.lastSyncedAt': new Date()
      };

      // Update basic fields if provided
      if (clerkUserData.email) updateData.email = clerkUserData.email;
      if (clerkUserData.firstName || clerkUserData.lastName) {
        updateData.name = `${clerkUserData.firstName || ''} ${clerkUserData.lastName || ''}`.trim();
      }
      if (clerkUserData.imageUrl) updateData.avatar = clerkUserData.imageUrl;
      if (clerkUserData.emailVerified !== undefined) {
        updateData['metadata.emailVerified'] = clerkUserData.emailVerified;
        updateData['verification.email'] = clerkUserData.emailVerified ? 'verified' : 'not_started';
      }
      if (clerkUserData.phoneVerified !== undefined) {
        updateData['metadata.phoneVerified'] = clerkUserData.phoneVerified;
        updateData['verification.phone'] = clerkUserData.phoneVerified ? 'verified' : 'not_started';
      }

      await updateDoc(doc(db, PROFILE_COLLECTIONS.USERS, userId), {
        ...updateData,
        updatedAt: serverTimestamp()
      });

      // Invalidate cache
      cache.invalidateByTags([CacheTags.USER, `user:${userId}`]);

      logger.logAudit('user_profile_synced_from_clerk', userId, 'user', userId, {
        fieldsUpdated: Object.keys(updateData)
      });

    } catch (error) {
      logger.error('Failed to update user profile from Clerk', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Create or update freelancer profile
   */
  async createFreelancerProfile(
    userId: string,
    profileData: Partial<EnhancedFreelancerProfile>,
    options: ProfileCreationOptions = {}
  ): Promise<EnhancedFreelancerProfile> {
    try {
      const freelancerProfile: EnhancedFreelancerProfile = {
        userId,
        userType: UserType.FREELANCER,
        onboardingId: profileData.onboardingId,
        
        professional: {
          title: profileData.professional?.title || '',
          experience: profileData.professional?.experience || 0,
          specializations: profileData.professional?.specializations || [],
          availability: {
            status: 'available',
            hoursPerWeek: 40,
            timezone: 'UTC',
            ...profileData.professional?.availability
          },
          pricing: {
            hourlyRate: {
              min: 50,
              max: 150,
              currency: 'USD'
            },
            projectRates: {
              small: 2000,
              medium: 10000,
              large: 50000
            },
            preferredPaymentTerms: ['milestone', 'hourly'],
            ...profileData.professional?.pricing
          }
        },
        
        skills: {
          primary: [],
          secondary: [],
          tools: [],
          languages: [],
          certifications: [],
          ...profileData.skills
        },
        
        portfolio: {
          projects: [],
          testimonials: [],
          workSamples: [],
          achievements: [],
          ...profileData.portfolio
        },
        
        branding: profileData.branding || {},
        
        seo: {
          keywords: [],
          socialMediaLinks: [],
          ...profileData.seo
        },
        
        status: {
          isProfileComplete: false,
          lastUpdated: new Date(),
          profileVersion: 1
        }
      };

      await setDoc(doc(db, PROFILE_COLLECTIONS.FREELANCERS, userId), {
        ...freelancerProfile,
        'status.lastUpdated': serverTimestamp()
      });

      // Update profile completion
      await this.updateProfileCompletion(userId, UserType.FREELANCER);

      // Auto-publish if requested
      if (options.publishImmediately) {
        await this.publishProfile(userId, UserType.FREELANCER);
      }

      cache.invalidateByTags([CacheTags.USER, `user:${userId}`, 'freelancer']);

      logger.logAudit('freelancer_profile_created', userId, 'freelancer_profile', userId, {
        hasPortfolio: freelancerProfile.portfolio.projects.length > 0,
        skillCount: freelancerProfile.skills.primary.length + freelancerProfile.skills.secondary.length
      });

      return freelancerProfile;

    } catch (error) {
      logger.error('Failed to create freelancer profile', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Create or update vendor profile
   */
  async createVendorProfile(
    organizationId: string,
    profileData: Partial<EnhancedVendorProfile>,
    options: ProfileCreationOptions = {}
  ): Promise<EnhancedVendorProfile> {
    try {
      const vendorProfile: EnhancedVendorProfile = {
        organizationId,
        userType: UserType.VENDOR_COMPANY,
        onboardingId: profileData.onboardingId,
        
        company: {
          legalName: profileData.company?.legalName || '',
          brandName: profileData.company?.brandName || profileData.company?.legalName || '',
          description: profileData.company?.description || '',
          foundedYear: profileData.company?.foundedYear || new Date().getFullYear(),
          employeeCount: profileData.company?.employeeCount || 1,
          headquarters: profileData.company?.headquarters || {
            city: '',
            country: ''
          },
          locations: [],
          website: profileData.company?.website || '',
          industry: profileData.company?.industry || [],
          ...profileData.company
        },
        
        services: {
          primaryServices: [],
          expertise: [],
          industries: [],
          methodologies: [],
          technologies: [],
          ...profileData.services
        },
        
        team: {
          leadership: [],
          keyPersonnel: [],
          departments: [],
          culture: {
            values: [],
            workEnvironment: '',
            benefits: []
          },
          ...profileData.team
        },
        
        showcase: {
          caseStudies: [],
          clientTestimonials: [],
          awards: [],
          partnerships: [],
          media: [],
          ...profileData.showcase
        },
        
        compliance: {
          certifications: [],
          securityStandards: [],
          industryAccreditations: [],
          auditReports: [],
          ...profileData.compliance
        },
        
        business: {
          pricingModels: [],
          contractTypes: [],
          minimumEngagement: {
            duration: '1 month',
            budget: 10000
          },
          preferredClientSize: [],
          ...profileData.business
        },
        
        branding: {
          logo: '',
          colorScheme: {
            primary: '#000000',
            secondary: '#ffffff'
          },
          ...profileData.branding
        },
        
        seo: {
          keywords: [],
          structuredData: {},
          ...profileData.seo
        },
        
        contact: {
          salesEmail: '',
          supportEmail: '',
          phone: '',
          socialMedia: [],
          contactForms: [],
          ...profileData.contact
        }
      };

      await setDoc(doc(db, PROFILE_COLLECTIONS.VENDORS, organizationId), vendorProfile);

      // Update profile completion
      await this.updateProfileCompletion(organizationId, UserType.VENDOR_COMPANY);

      // Auto-publish if requested
      if (options.publishImmediately) {
        await this.publishProfile(organizationId, UserType.VENDOR_COMPANY);
      }

      cache.invalidateByTags([CacheTags.ORGANIZATION, `org:${organizationId}`, 'vendor']);

      logger.logAudit('vendor_profile_created', organizationId, 'vendor_profile', organizationId, {
        companyName: vendorProfile.company.legalName,
        serviceCount: vendorProfile.services.primaryServices.length,
        teamSize: vendorProfile.company.employeeCount
      });

      return vendorProfile;

    } catch (error) {
      logger.error('Failed to create vendor profile', error as Error, { organizationId });
      throw error;
    }
  }

  // =============================================================================
  // SLUG MANAGEMENT
  // =============================================================================

  /**
   * Generate unique profile slug
   */
  async generateUniqueSlug(options: SlugGenerationOptions): Promise<string> {
    const { baseName, userType, preferredSlug, maxAttempts = 10 } = options;
    
    // Start with preferred slug or generate from base name
    let candidateSlug = preferredSlug || this.slugify(baseName);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const slug = attempt === 0 ? candidateSlug : `${candidateSlug}-${attempt}`;
      
      if (await this.isSlugAvailable(slug)) {
        // Reserve the slug
        await this.reserveSlug(slug, '', userType); // userId will be set when profile is created
        return slug;
      }
    }
    
    // Fallback: use timestamp-based slug
    const timestampSlug = `${candidateSlug}-${Date.now()}`;
    await this.reserveSlug(timestampSlug, '', userType);
    return timestampSlug;
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    try {
      const slugDoc = await getDoc(doc(db, PROFILE_COLLECTIONS.PROFILE_SLUGS, slug));
      return !slugDoc.exists();
    } catch (error) {
      logger.error('Failed to check slug availability', error as Error, { slug });
      return false;
    }
  }

  /**
   * Reserve a slug for a user
   */
  async reserveSlug(slug: string, userId: string, userType: UserType): Promise<void> {
    try {
      const slugData: ProfileSlug = {
        slug,
        userId,
        userType,
        isReserved: !userId, // Reserved if no userId provided yet
        createdAt: new Date(),
        expiresAt: userId ? undefined : new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hour reservation
      };

      await setDoc(doc(db, PROFILE_COLLECTIONS.PROFILE_SLUGS, slug), {
        ...slugData,
        createdAt: serverTimestamp()
      });

      logger.info('Slug reserved successfully', { slug, userId, userType });

    } catch (error) {
      logger.error('Failed to reserve slug', error as Error, { slug, userId });
      throw error;
    }
  }

  /**
   * Update slug ownership when profile is created
   */
  async assignSlugToUser(slug: string, userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, PROFILE_COLLECTIONS.PROFILE_SLUGS, slug), {
        userId,
        isReserved: false,
        expiresAt: null,
        updatedAt: serverTimestamp()
      });

      logger.info('Slug assigned to user', { slug, userId });

    } catch (error) {
      logger.error('Failed to assign slug to user', error as Error, { slug, userId });
      throw error;
    }
  }

  // =============================================================================
  // PROFILE COMPLETION AND ANALYTICS
  // =============================================================================

  /**
   * Initialize profile completion tracking
   */
  async initializeProfileCompletion(userId: string, userType: UserType): Promise<void> {
    try {
      const completion: ProfileCompletion = {
        userId,
        userType,
        completionPercentage: 10, // Basic info completed
        lastUpdated: new Date(),
        sections: {
          basicInfo: {
            completed: true,
            score: 100,
            suggestions: []
          },
          professional: {
            completed: false,
            score: 0,
            suggestions: ['Add professional title', 'Set hourly rate', 'Define availability']
          },
          portfolio: {
            completed: false,
            score: 0,
            suggestions: ['Add portfolio projects', 'Upload work samples', 'Collect testimonials']
          },
          verification: {
            completed: false,
            score: 0,
            suggestions: ['Verify identity', 'Complete skills assessment', 'Upload certifications']
          },
          seo: {
            completed: false,
            score: 0,
            suggestions: ['Add meta description', 'Set keywords', 'Connect social media']
          }
        },
        recommendations: [
          {
            priority: 'high',
            action: 'complete_professional_info',
            description: 'Complete your professional information to attract more clients',
            estimatedImpact: 30
          }
        ]
      };

      await setDoc(doc(db, PROFILE_COLLECTIONS.PROFILE_COMPLETION, userId), {
        ...completion,
        lastUpdated: serverTimestamp()
      });

    } catch (error) {
      logger.error('Failed to initialize profile completion', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Update profile completion based on current profile data
   */
  async updateProfileCompletion(userId: string, userType: UserType): Promise<void> {
    try {
      // This would analyze the current profile data and update completion scores
      // Implementation would check each section and calculate completion percentage
      
      const completion = await this.calculateProfileCompletion(userId, userType);
      
      await updateDoc(doc(db, PROFILE_COLLECTIONS.PROFILE_COMPLETION, userId), {
        ...completion,
        lastUpdated: serverTimestamp()
      });

      // Update main user document with completion percentage
      await updateDoc(doc(db, PROFILE_COLLECTIONS.USERS, userId), {
        profileCompletion: completion.completionPercentage,
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      logger.error('Failed to update profile completion', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Initialize profile analytics
   */
  async initializeProfileAnalytics(userId: string, userType: UserType): Promise<void> {
    try {
      const analytics: ProfileAnalytics = {
        profileId: userId,
        userId,
        userType,
        period: 'daily',
        date: new Date(),
        metrics: {
          views: 0,
          uniqueVisitors: 0,
          inquiries: 0,
          contactFormSubmissions: 0,
          projectViews: 0,
          portfolioDownloads: 0,
          socialMediaClicks: 0,
          averageTimeOnPage: 0,
          bounceRate: 0
        },
        sources: {
          direct: 0,
          search: 0,
          social: 0,
          referral: 0,
          email: 0
        },
        geography: [],
        devices: {
          desktop: 0,
          mobile: 0,
          tablet: 0
        }
      };

      const analyticsId = `${userId}_${this.getDateString(new Date())}`;
      await setDoc(doc(db, PROFILE_COLLECTIONS.PROFILE_ANALYTICS, analyticsId), {
        ...analytics,
        date: serverTimestamp()
      });

    } catch (error) {
      logger.error('Failed to initialize profile analytics', error as Error, { userId });
      throw error;
    }
  }

  // =============================================================================
  // PROFILE PUBLISHING AND VISIBILITY
  // =============================================================================

  /**
   * Publish profile to make it publicly visible
   */
  async publishProfile(userId: string, userType: UserType): Promise<void> {
    try {
      // Update user profile
      await updateDoc(doc(db, PROFILE_COLLECTIONS.USERS, userId), {
        'publicProfile.publishStatus': 'published',
        'publicProfile.isPublic': true,
        'publicProfile.lastPublishedAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update specific profile collection
      const collection = this.getProfileCollection(userType);
      if (collection) {
        await updateDoc(doc(db, collection, userId), {
          'status.publishedAt': serverTimestamp(),
          'status.lastUpdated': serverTimestamp()
        });
      }

      cache.invalidateByTags([CacheTags.USER, `user:${userId}`]);

      logger.logAudit('profile_published', userId, 'profile', userId, { userType });

    } catch (error) {
      logger.error('Failed to publish profile', error as Error, { userId, userType });
      throw error;
    }
  }

  /**
   * Unpublish profile to make it private
   */
  async unpublishProfile(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, PROFILE_COLLECTIONS.USERS, userId), {
        'publicProfile.publishStatus': 'unpublished',
        'publicProfile.isPublic': false,
        updatedAt: serverTimestamp()
      });

      cache.invalidateByTags([CacheTags.USER, `user:${userId}`]);

      logger.logAudit('profile_unpublished', userId, 'profile', userId);

    } catch (error) {
      logger.error('Failed to unpublish profile', error as Error, { userId });
      throw error;
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  private getProfileCollection(userType: UserType): string | null {
    switch (userType) {
      case UserType.FREELANCER:
        return PROFILE_COLLECTIONS.FREELANCERS;
      case UserType.VENDOR_COMPANY:
        return PROFILE_COLLECTIONS.VENDORS;
      case UserType.CUSTOMER_ORGANIZATION:
        return PROFILE_COLLECTIONS.ORGANIZATIONS;
      default:
        return null;
    }
  }

  private getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private async calculateProfileCompletion(userId: string, userType: UserType): Promise<ProfileCompletion> {
    // This would implement the actual completion calculation logic
    // For now, return a placeholder
    return {
      userId,
      userType,
      completionPercentage: 25,
      lastUpdated: new Date(),
      sections: {
        basicInfo: { completed: true, score: 100, suggestions: [] },
        professional: { completed: false, score: 50, suggestions: ['Add more details'] },
        portfolio: { completed: false, score: 0, suggestions: ['Add projects'] },
        verification: { completed: false, score: 0, suggestions: ['Verify identity'] },
        seo: { completed: false, score: 0, suggestions: ['Add keywords'] }
      },
      recommendations: []
    };
  }
}

// Export singleton instance
export const enhancedProfileService = new EnhancedProfileService();