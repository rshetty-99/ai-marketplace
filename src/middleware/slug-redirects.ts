/**
 * Slug Redirect Middleware
 * Handles redirects for old slugs and route resolution
 */

import { NextRequest, NextResponse } from 'next/server';
import { SlugService } from '@/lib/profile/slug-service';

// Cache for resolved slugs to avoid repeated Firestore queries
const slugCache = new Map<string, { 
  redirectTo?: string; 
  found: boolean; 
  timestamp: number;
  userType?: string;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function handleSlugRedirect(
  request: NextRequest,
  pathname: string
): Promise<NextResponse | null> {
  // Extract slug from different profile routes
  const providerMatch = pathname.match(/^\/providers\/([^\/]+)/);
  const vendorMatch = pathname.match(/^\/vendors\/([^\/]+)/);
  const organizationMatch = pathname.match(/^\/organizations\/([^\/]+)/);

  if (!providerMatch && !vendorMatch && !organizationMatch) {
    return null; // Not a profile route
  }

  const slug = (providerMatch?.[1] || vendorMatch?.[1] || organizationMatch?.[1])?.toLowerCase();
  const routeType = providerMatch ? 'providers' : vendorMatch ? 'vendors' : 'organizations';
  
  if (!slug) {
    return null;
  }

  // Check cache first
  const cacheKey = `${routeType}:${slug}`;
  const cached = slugCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    if (cached.redirectTo) {
      return NextResponse.redirect(new URL(cached.redirectTo, request.url), 301);
    }
    if (cached.found) {
      return null; // Continue with normal processing
    }
    // If not found in cache, continue to check
  }

  try {
    // First check if the slug exists for the correct user type
    const expectedUserType = routeType === 'providers' ? 'freelancer' : 
                           routeType === 'vendors' ? 'vendor' : 'organization';
    
    const directMatch = await SlugService.findUserBySlug(slug);
    
    if (directMatch) {
      // Check if user type matches the route
      if (directMatch.userType === expectedUserType) {
        // Cache success and continue
        slugCache.set(cacheKey, {
          found: true,
          timestamp: Date.now(),
          userType: directMatch.userType
        });
        return null; // Continue with normal processing
      } else {
        // User exists but wrong route type - redirect to correct route
        const correctRoute = directMatch.userType === 'freelancer' ? '/providers' :
                           directMatch.userType === 'vendor' ? '/vendors' : '/organizations';
        const redirectTo = `${correctRoute}/${slug}`;
        
        slugCache.set(cacheKey, {
          redirectTo,
          found: true,
          timestamp: Date.now(),
          userType: directMatch.userType
        });
        
        return NextResponse.redirect(new URL(redirectTo, request.url), 301);
      }
    }

    // Check for old slug redirects
    const redirectResult = await SlugService.resolveSlugRedirect(slug);
    
    if (redirectResult.redirectTo) {
      // Cache redirect
      slugCache.set(cacheKey, {
        redirectTo: redirectResult.redirectTo,
        found: true,
        timestamp: Date.now()
      });
      
      return NextResponse.redirect(new URL(redirectResult.redirectTo, request.url), 301);
    }

    // Cache not found
    slugCache.set(cacheKey, {
      found: false,
      timestamp: Date.now()
    });

    // Return 404 response for non-existent slugs
    return new NextResponse(null, { status: 404 });

  } catch (error) {
    console.error('Error resolving slug redirect:', error);
    // On error, let the request continue (fail gracefully)
    return null;
  }
}

/**
 * Clear slug cache (useful for webhook updates)
 */
export function clearSlugCache(slug?: string) {
  if (slug) {
    // Clear specific slug from all route types
    slugCache.delete(`providers:${slug}`);
    slugCache.delete(`vendors:${slug}`);
    slugCache.delete(`organizations:${slug}`);
  } else {
    // Clear entire cache
    slugCache.clear();
  }
}

/**
 * Preload popular slugs into cache
 */
export async function preloadSlugCache(popularSlugs: string[]) {
  const promises = popularSlugs.map(async (slug) => {
    try {
      const user = await SlugService.findUserBySlug(slug);
      if (user) {
        const routeType = user.userType === 'freelancer' ? 'providers' :
                         user.userType === 'vendor' ? 'vendors' : 'organizations';
        const cacheKey = `${routeType}:${slug}`;
        
        slugCache.set(cacheKey, {
          found: true,
          timestamp: Date.now(),
          userType: user.userType
        });
      }
    } catch (error) {
      console.error(`Error preloading slug ${slug}:`, error);
    }
  });

  await Promise.allSettled(promises);
}

/**
 * Generate sitemap data for all public slugs
 */
export async function generateSlugSitemap(): Promise<{
  providers: string[];
  vendors: string[];
  organizations: string[];
}> {
  try {
    // This would query Firestore for all public profiles with slugs
    // Implementation depends on your specific requirements and data volume
    
    // For now, return empty arrays - implement based on your needs
    return {
      providers: [],
      vendors: [],
      organizations: []
    };
  } catch (error) {
    console.error('Error generating slug sitemap:', error);
    return {
      providers: [],
      vendors: [],
      organizations: []
    };
  }
}