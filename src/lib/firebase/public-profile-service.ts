/**
 * Public Profile Service
 * Handles fetching and displaying public profiles for all user types
 */

import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  EnhancedUserDocument, 
  EnhancedFreelancerProfile, 
  EnhancedVendorProfile, 
  EnhancedOrganizationProfile 
} from './enhanced-profile-schema';
import { UserType } from './rbac-collections';

export interface PublicProfileSearchParams {
  skills?: string[];
  location?: string;
  minRating?: number;
  maxPrice?: number;
  availability?: boolean;
  userType?: UserType;
  limit?: number;
}

export interface PublicProfileResult {
  profiles: EnhancedUserDocument[];
  total: number;
  hasMore: boolean;
}

/**
 * Get freelancer profile by slug
 */
export async function getFreelancerProfileBySlug(slug: string): Promise<EnhancedFreelancerProfile | null> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('publicProfile.slug', '==', slug),
      where('userType', '==', 'freelancer'),
      where('publicProfile.isPublic', '==', true),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as EnhancedUserDocument;
    
    // Get freelancer-specific data
    const freelancerRef = doc(db, 'freelancers', userDoc.id);
    const freelancerDoc = await getDoc(freelancerRef);
    
    if (!freelancerDoc.exists()) {
      return null;
    }
    
    const freelancerData = freelancerDoc.data();
    
    return {
      ...userData,
      ...freelancerData,
      id: userDoc.id
    } as EnhancedFreelancerProfile;
  } catch (error) {
    console.error('Error fetching freelancer profile by slug:', error);
    return null;
  }
}

/**
 * Get vendor profile by slug
 */
export async function getVendorProfileBySlug(slug: string): Promise<EnhancedVendorProfile | null> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('publicProfile.slug', '==', slug),
      where('userType', '==', 'vendor'),
      where('publicProfile.isPublic', '==', true),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as EnhancedUserDocument;
    
    // Get vendor-specific data
    const vendorRef = doc(db, 'vendors', userDoc.id);
    const vendorDoc = await getDoc(vendorRef);
    
    if (!vendorDoc.exists()) {
      return null;
    }
    
    const vendorData = vendorDoc.data();
    
    return {
      ...userData,
      ...vendorData,
      id: userDoc.id
    } as EnhancedVendorProfile;
  } catch (error) {
    console.error('Error fetching vendor profile by slug:', error);
    return null;
  }
}

/**
 * Get organization profile by slug
 */
export async function getOrganizationProfileBySlug(slug: string): Promise<EnhancedOrganizationProfile | null> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('publicProfile.slug', '==', slug),
      where('userType', '==', 'customer'),
      where('publicProfile.isPublic', '==', true),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as EnhancedUserDocument;
    
    // Get organization-specific data
    const organizationRef = doc(db, 'organizations', userDoc.id);
    const organizationDoc = await getDoc(organizationRef);
    
    if (!organizationDoc.exists()) {
      return null;
    }
    
    const organizationData = organizationDoc.data();
    
    return {
      ...userData,
      ...organizationData,
      id: userDoc.id
    } as EnhancedOrganizationProfile;
  } catch (error) {
    console.error('Error fetching organization profile by slug:', error);
    return null;
  }
}

/**
 * Check if slug is available
 */
export async function isSlugAvailable(slug: string, userType?: UserType, excludeUserId?: string): Promise<boolean> {
  try {
    const usersRef = collection(db, 'users');
    let q = query(
      usersRef,
      where('publicProfile.slug', '==', slug)
    );
    
    if (userType) {
      q = query(q, where('userType', '==', userType));
    }
    
    const querySnapshot = await getDocs(q);
    
    if (excludeUserId) {
      // Filter out the current user's profile
      const filteredDocs = querySnapshot.docs.filter(doc => doc.id !== excludeUserId);
      return filteredDocs.length === 0;
    }
    
    return querySnapshot.empty;
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return false;
  }
}

/**
 * Search public profiles
 */
export async function searchPublicProfiles(params: PublicProfileSearchParams): Promise<PublicProfileResult> {
  try {
    const usersRef = collection(db, 'users');
    let q = query(
      usersRef,
      where('publicProfile.isPublic', '==', true),
      where('publicProfile.showInDirectory', '==', true)
    );
    
    if (params.userType) {
      q = query(q, where('userType', '==', params.userType));
    }
    
    if (params.availability) {
      q = query(q, where('availability.isAvailable', '==', true));
    }
    
    // Add ordering
    q = query(q, orderBy('profileCompletion', 'desc'));
    
    if (params.limit) {
      q = query(q, limit(params.limit));
    }
    
    const querySnapshot = await getDocs(q);
    const profiles = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as EnhancedUserDocument[];
    
    // Apply client-side filters for complex queries
    let filteredProfiles = profiles;
    
    if (params.skills && params.skills.length > 0) {
      filteredProfiles = filteredProfiles.filter(profile => {
        const profileSkills = [
          ...(profile.skills?.primary?.map(s => s.name) || []),
          ...(profile.skills?.secondary?.map(s => s.name) || [])
        ];
        return params.skills!.some(skill => 
          profileSkills.some(pSkill => 
            pSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
      });
    }
    
    if (params.location) {
      filteredProfiles = filteredProfiles.filter(profile =>
        profile.location?.toLowerCase().includes(params.location!.toLowerCase())
      );
    }
    
    if (params.minRating) {
      filteredProfiles = filteredProfiles.filter(profile =>
        (profile.rating || 0) >= params.minRating!
      );
    }
    
    if (params.maxPrice) {
      filteredProfiles = filteredProfiles.filter(profile =>
        (profile.pricing?.hourlyRate || 0) <= params.maxPrice!
      );
    }
    
    return {
      profiles: filteredProfiles,
      total: filteredProfiles.length,
      hasMore: false // Simplified for now
    };
  } catch (error) {
    console.error('Error searching public profiles:', error);
    return {
      profiles: [],
      total: 0,
      hasMore: false
    };
  }
}

/**
 * Get featured profiles
 */
export async function getFeaturedProfiles(userType?: UserType, limit = 6): Promise<EnhancedUserDocument[]> {
  try {
    const usersRef = collection(db, 'users');
    let q = query(
      usersRef,
      where('publicProfile.isPublic', '==', true),
      where('isFeatured', '==', true)
    );
    
    if (userType) {
      q = query(q, where('userType', '==', userType));
    }
    
    q = query(q, orderBy('profileCompletion', 'desc'), limit(limit));
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as EnhancedUserDocument[];
  } catch (error) {
    console.error('Error fetching featured profiles:', error);
    return [];
  }
}

/**
 * Get similar profiles (for recommendations)
 */
export async function getSimilarProfiles(
  profileId: string, 
  userType: UserType, 
  skills: string[] = [], 
  limit = 4
): Promise<EnhancedUserDocument[]> {
  try {
    const usersRef = collection(db, 'users');
    let q = query(
      usersRef,
      where('publicProfile.isPublic', '==', true),
      where('userType', '==', userType)
    );
    
    q = query(q, orderBy('profileCompletion', 'desc'), limit(limit + 1)); // +1 to exclude current profile
    
    const querySnapshot = await getDocs(q);
    
    let profiles = querySnapshot.docs
      .map(doc => ({
        ...doc.data(),
        id: doc.id
      }))
      .filter(profile => profile.id !== profileId) as EnhancedUserDocument[];
    
    // Score profiles by skill similarity
    if (skills.length > 0) {
      profiles = profiles
        .map(profile => {
          const profileSkills = [
            ...(profile.skills?.primary?.map(s => s.name) || []),
            ...(profile.skills?.secondary?.map(s => s.name) || [])
          ];
          
          const skillMatches = skills.filter(skill =>
            profileSkills.some(pSkill => 
              pSkill.toLowerCase().includes(skill.toLowerCase())
            )
          ).length;
          
          return {
            ...profile,
            _similarityScore: skillMatches / skills.length
          };
        })
        .sort((a, b) => (b._similarityScore || 0) - (a._similarityScore || 0));
    }
    
    return profiles.slice(0, limit);
  } catch (error) {
    console.error('Error fetching similar profiles:', error);
    return [];
  }
}

/**
 * Track profile view
 */
export async function trackProfileView(profileId: string, viewerType: 'anonymous' | 'user' = 'anonymous'): Promise<void> {
  try {
    // In a real implementation, you would:
    // 1. Update analytics in Firestore
    // 2. Track in Google Analytics
    // 3. Update profile view count
    
    console.log('Profile view tracked:', { profileId, viewerType, timestamp: new Date() });
    
    // Example: Update profile view count
    // const profileRef = doc(db, 'users', profileId);
    // await updateDoc(profileRef, {
    //   'analytics.totalViews': increment(1),
    //   'analytics.lastViewed': new Date()
    // });
  } catch (error) {
    console.error('Error tracking profile view:', error);
  }
}

/**
 * Generate profile URL
 */
export function getProfileUrl(userType: UserType, slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000';
  
  let pathPrefix = '';
  switch (userType) {
    case 'freelancer':
      pathPrefix = 'providers';
      break;
    case 'vendor':
      pathPrefix = 'vendors';
      break;
    case 'customer':
      pathPrefix = 'organizations';
      break;
    default:
      pathPrefix = 'profiles';
  }
  
  return `${baseUrl}/${pathPrefix}/${slug}`;
}

/**
 * Validate slug format
 */
export function validateSlug(slug: string): { isValid: boolean; error?: string } {
  if (!slug) {
    return { isValid: false, error: 'Slug is required' };
  }
  
  if (slug.length < 3) {
    return { isValid: false, error: 'Slug must be at least 3 characters' };
  }
  
  if (slug.length > 50) {
    return { isValid: false, error: 'Slug must be less than 50 characters' };
  }
  
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return { isValid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
  }
  
  const reservedSlugs = [
    'admin', 'api', 'www', 'mail', 'support', 'help', 'contact', 'about',
    'privacy', 'terms', 'blog', 'news', 'dashboard', 'profile', 'settings',
    'login', 'signup', 'auth', 'oauth', 'callback', 'webhook', 'health'
  ];
  
  if (reservedSlugs.includes(slug)) {
    return { isValid: false, error: 'This slug is reserved and cannot be used' };
  }
  
  return { isValid: true };
}