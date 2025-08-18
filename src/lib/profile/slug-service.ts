/**
 * Slug Management Service
 * Handles validation, uniqueness checking, and SEO-friendly slug generation
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc,
  writeBatch,
  limit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface SlugValidationResult {
  isValid: boolean;
  isAvailable: boolean;
  suggestions?: string[];
  errors?: string[];
}

export interface SlugConfig {
  minLength: number;
  maxLength: number;
  allowNumbers: boolean;
  allowHyphens: boolean;
  allowUnderscores: boolean;
  reservedSlugs: string[];
  profanityFilter: boolean;
}

export interface SlugHistory {
  slug: string;
  userId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  redirectFrom?: string[];
}

const DEFAULT_CONFIG: SlugConfig = {
  minLength: 3,
  maxLength: 50,
  allowNumbers: true,
  allowHyphens: true,
  allowUnderscores: false,
  reservedSlugs: [
    'admin', 'api', 'www', 'app', 'mail', 'ftp', 'blog', 'shop', 'store',
    'help', 'support', 'contact', 'about', 'terms', 'privacy', 'legal',
    'dashboard', 'profile', 'settings', 'account', 'login', 'register',
    'signup', 'signin', 'logout', 'auth', 'oauth', 'callback', 'webhook',
    'assets', 'static', 'cdn', 'img', 'css', 'js', 'fonts', 'media',
    'uploads', 'download', 'file', 'files', 'doc', 'docs', 'pdf',
    'marketplace', 'vendor', 'vendors', 'freelancer', 'freelancers',
    'organization', 'organizations', 'company', 'companies', 'team',
    'teams', 'project', 'projects', 'job', 'jobs', 'gig', 'gigs',
    'service', 'services', 'product', 'products', 'portfolio',
    'search', 'browse', 'category', 'categories', 'tag', 'tags',
    'payment', 'payments', 'invoice', 'invoices', 'billing',
    'subscription', 'subscriptions', 'pricing', 'plans', 'upgrade',
    'notification', 'notifications', 'message', 'messages', 'chat',
    'review', 'reviews', 'rating', 'ratings', 'feedback',
    'report', 'reports', 'analytics', 'stats', 'statistics',
    'test', 'testing', 'dev', 'development', 'staging', 'prod',
    'null', 'undefined', 'true', 'false', 'admin-panel', 'control-panel'
  ],
  profanityFilter: true
};

// Basic profanity filter - can be expanded with external service
const PROFANITY_WORDS = [
  'spam', 'scam', 'fake', 'fraud', 'phishing', 'virus', 'malware',
  // Add more as needed - keeping it minimal for professional context
];

export class SlugService {
  private static config: SlugConfig = DEFAULT_CONFIG;

  /**
   * Configure slug validation rules
   */
  static configure(config: Partial<SlugConfig>): void {
    SlugService.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a clean slug from text
   */
  static generateSlug(text: string, maxLength?: number): string {
    const length = maxLength || SlugService.config.maxLength;
    
    let slug = text
      .toLowerCase()
      .trim()
      // Replace spaces and special characters with hyphens
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      // Remove multiple consecutive hyphens
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-|-$/g, '');

    // Apply character restrictions
    if (!SlugService.config.allowNumbers) {
      slug = slug.replace(/\d/g, '');
    }
    
    if (!SlugService.config.allowHyphens) {
      slug = slug.replace(/-/g, '');
    }
    
    if (!SlugService.config.allowUnderscores) {
      slug = slug.replace(/_/g, '');
    }

    // Truncate to max length
    if (slug.length > length) {
      slug = slug.substring(0, length).replace(/-$/, '');
    }

    return slug;
  }

  /**
   * Validate a slug according to configuration rules
   */
  static validateSlug(slug: string): Pick<SlugValidationResult, 'isValid' | 'errors'> {
    const errors: string[] = [];
    
    // Length validation
    if (slug.length < SlugService.config.minLength) {
      errors.push(`Slug must be at least ${SlugService.config.minLength} characters long`);
    }
    
    if (slug.length > SlugService.config.maxLength) {
      errors.push(`Slug must be no more than ${SlugService.config.maxLength} characters long`);
    }

    // Format validation
    if (!/^[a-z0-9_-]+$/.test(slug)) {
      errors.push('Slug can only contain lowercase letters, numbers, hyphens, and underscores');
    }

    // Character restrictions
    if (!SlugService.config.allowNumbers && /\d/.test(slug)) {
      errors.push('Numbers are not allowed in slugs');
    }
    
    if (!SlugService.config.allowHyphens && /-/.test(slug)) {
      errors.push('Hyphens are not allowed in slugs');
    }
    
    if (!SlugService.config.allowUnderscores && /_/.test(slug)) {
      errors.push('Underscores are not allowed in slugs');
    }

    // Start/end validation
    if (slug.startsWith('-') || slug.endsWith('-')) {
      errors.push('Slug cannot start or end with a hyphen');
    }
    
    if (slug.startsWith('_') || slug.endsWith('_')) {
      errors.push('Slug cannot start or end with an underscore');
    }

    // Reserved words
    if (SlugService.config.reservedSlugs.includes(slug.toLowerCase())) {
      errors.push('This slug is reserved and cannot be used');
    }

    // Profanity filter
    if (SlugService.config.profanityFilter) {
      const containsProfanity = PROFANITY_WORDS.some(word => 
        slug.toLowerCase().includes(word.toLowerCase())
      );
      if (containsProfanity) {
        errors.push('Slug contains inappropriate content');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Check if a slug is available across all user types
   */
  static async checkAvailability(
    slug: string, 
    excludeUserId?: string
  ): Promise<boolean> {
    const collections = ['users', 'freelancers', 'vendors', 'organizations'];
    
    for (const collectionName of collections) {
      const q = query(
        collection(db, collectionName),
        where('publicProfile.slug', '==', slug),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      // If we find a document and it's not the excluded user, slug is taken
      if (!snapshot.empty) {
        const existingDoc = snapshot.docs[0];
        if (!excludeUserId || existingDoc.id !== excludeUserId) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Generate suggestions for alternative slugs
   */
  static async generateSuggestions(
    baseSlug: string, 
    count: number = 5
  ): Promise<string[]> {
    const suggestions: string[] = [];
    const cleanBase = SlugService.generateSlug(baseSlug);
    
    // Try variations with numbers
    for (let i = 1; suggestions.length < count && i <= 99; i++) {
      const candidate = `${cleanBase}-${i}`;
      if (await SlugService.checkAvailability(candidate)) {
        suggestions.push(candidate);
      }
    }

    // Try variations with common suffixes
    const suffixes = ['pro', 'expert', 'official', 'team', 'studio', 'inc', 'co'];
    for (const suffix of suffixes) {
      if (suggestions.length >= count) break;
      
      const candidate = `${cleanBase}-${suffix}`;
      if (await SlugService.checkAvailability(candidate)) {
        suggestions.push(candidate);
      }
    }

    // Try shortened versions if original is long
    if (cleanBase.length > 10 && suggestions.length < count) {
      const shortened = cleanBase.substring(0, 8);
      for (let i = 1; suggestions.length < count && i <= 9; i++) {
        const candidate = `${shortened}${i}`;
        if (await SlugService.checkAvailability(candidate)) {
          suggestions.push(candidate);
        }
      }
    }

    return suggestions;
  }

  /**
   * Comprehensive slug validation with availability check
   */
  static async validateAndCheck(
    slug: string, 
    excludeUserId?: string
  ): Promise<SlugValidationResult> {
    const validation = SlugService.validateSlug(slug);
    
    if (!validation.isValid) {
      return {
        ...validation,
        isAvailable: false
      };
    }

    const isAvailable = await SlugService.checkAvailability(slug, excludeUserId);
    
    let suggestions: string[] | undefined;
    if (!isAvailable) {
      suggestions = await SlugService.generateSuggestions(slug);
    }

    return {
      isValid: validation.isValid,
      isAvailable,
      suggestions,
      errors: validation.errors
    };
  }

  /**
   * Reserve a slug for a user
   */
  static async reserveSlug(
    userId: string,
    userType: 'freelancer' | 'vendor' | 'organization',
    slug: string,
    collectionName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Double-check availability
      const isAvailable = await SlugService.checkAvailability(slug, userId);
      if (!isAvailable) {
        return { success: false, error: 'Slug is no longer available' };
      }

      // Update the user document with the slug
      const userRef = doc(db, collectionName, userId);
      await updateDoc(userRef, {
        'publicProfile.slug': slug,
        'publicProfile.updatedAt': new Date()
      });

      // Create slug history entry
      const historyRef = doc(collection(db, 'slug-history'));
      const batch = writeBatch(db);
      
      batch.set(historyRef, {
        slug,
        userId,
        userType,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      } as SlugHistory);

      await batch.commit();

      return { success: true };
    } catch (error) {
      console.error('Error reserving slug:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to reserve slug' 
      };
    }
  }

  /**
   * Update a user's slug (with redirect handling)
   */
  static async updateSlug(
    userId: string,
    userType: 'freelancer' | 'vendor' | 'organization',
    newSlug: string,
    collectionName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current slug
      const userRef = doc(db, collectionName, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return { success: false, error: 'User not found' };
      }

      const currentSlug = userDoc.data().publicProfile?.slug;
      
      // Validate new slug
      const validation = await SlugService.validateAndCheck(newSlug, userId);
      if (!validation.isValid || !validation.isAvailable) {
        return { 
          success: false, 
          error: validation.errors?.[0] || 'Slug is not available' 
        };
      }

      const batch = writeBatch(db);

      // Update user document
      batch.update(userRef, {
        'publicProfile.slug': newSlug,
        'publicProfile.updatedAt': new Date()
      });

      // Deactivate old slug history entry
      if (currentSlug) {
        const oldHistoryQuery = query(
          collection(db, 'slug-history'),
          where('slug', '==', currentSlug),
          where('userId', '==', userId),
          where('isActive', '==', true)
        );
        
        const oldHistorySnapshot = await getDocs(oldHistoryQuery);
        oldHistorySnapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            isActive: false,
            updatedAt: new Date()
          });
        });
      }

      // Create new slug history entry
      const newHistoryRef = doc(collection(db, 'slug-history'));
      batch.set(newHistoryRef, {
        slug: newSlug,
        userId,
        userType,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        redirectFrom: currentSlug ? [currentSlug] : undefined
      } as SlugHistory);

      await batch.commit();

      return { success: true };
    } catch (error) {
      console.error('Error updating slug:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update slug' 
      };
    }
  }

  /**
   * Get slug history for a user
   */
  static async getSlugHistory(userId: string): Promise<SlugHistory[]> {
    try {
      const q = query(
        collection(db, 'slug-history'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as SlugHistory[];
    } catch (error) {
      console.error('Error fetching slug history:', error);
      return [];
    }
  }

  /**
   * Find user by slug across all collections
   */
  static async findUserBySlug(slug: string): Promise<{
    userId: string;
    userType: 'freelancer' | 'vendor' | 'organization';
    collectionName: string;
    userData: any;
  } | null> {
    const collections = [
      { name: 'freelancers', type: 'freelancer' as const },
      { name: 'vendors', type: 'vendor' as const },
      { name: 'organizations', type: 'organization' as const }
    ];

    for (const { name, type } of collections) {
      const q = query(
        collection(db, name),
        where('publicProfile.slug', '==', slug),
        where('publicProfile.isPublic', '==', true),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return {
          userId: doc.id,
          userType: type,
          collectionName: name,
          userData: doc.data()
        };
      }
    }

    return null;
  }

  /**
   * Handle slug redirects for old URLs
   */
  static async resolveSlugRedirect(slug: string): Promise<{
    redirectTo?: string;
    found: boolean;
  }> {
    try {
      // First try to find active slug
      const activeUser = await SlugService.findUserBySlug(slug);
      if (activeUser) {
        return { found: true };
      }

      // Check if this is an old slug that should redirect
      const q = query(
        collection(db, 'slug-history'),
        where('slug', '==', slug),
        where('isActive', '==', false)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const historyDoc = snapshot.docs[0];
        const { userId, userType } = historyDoc.data();
        
        // Find the current active slug for this user
        const activeSlugQuery = query(
          collection(db, 'slug-history'),
          where('userId', '==', userId),
          where('isActive', '==', true),
          limit(1)
        );
        
        const activeSlugSnapshot = await getDocs(activeSlugQuery);
        
        if (!activeSlugSnapshot.empty) {
          const currentSlug = activeSlugSnapshot.docs[0].data().slug;
          const urlPrefix = userType === 'freelancer' ? '/providers' : 
                           userType === 'vendor' ? '/vendors' : '/organizations';
          
          return {
            redirectTo: `${urlPrefix}/${currentSlug}`,
            found: true
          };
        }
      }

      return { found: false };
    } catch (error) {
      console.error('Error resolving slug redirect:', error);
      return { found: false };
    }
  }
}