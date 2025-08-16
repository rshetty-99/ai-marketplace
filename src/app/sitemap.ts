/**
 * Dynamic Sitemap Generation for AI Marketplace
 * Generates sitemaps for all public pages, services, categories, and providers
 */

import { MetadataRoute } from 'next';
import { db } from '@/lib/firebase/firebase-config';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-marketplace.com';

// Static pages with their update frequencies
const STATIC_PAGES = [
  {
    url: '',
    changeFrequency: 'daily' as const,
    priority: 1.0,
  },
  {
    url: '/catalog',
    changeFrequency: 'hourly' as const,
    priority: 0.9,
  },
  {
    url: '/about',
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  },
  {
    url: '/contact',
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  },
  {
    url: '/pricing',
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  },
  {
    url: '/how-it-works',
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  },
  {
    url: '/for-vendors',
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  },
  {
    url: '/for-customers',
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  },
  {
    url: '/blog',
    changeFrequency: 'daily' as const,
    priority: 0.6,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Generate static pages
    const staticUrls = STATIC_PAGES.map(page => ({
      url: `${BASE_URL}${page.url}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    }));

    // Fetch categories for category pages
    const categoryUrls = await generateCategoryUrls();

    // Fetch services for individual service pages (limit to most recent/popular)
    const serviceUrls = await generateServiceUrls();

    // Fetch provider profiles
    const providerUrls = await generateProviderUrls();

    // Combine all URLs
    return [
      ...staticUrls,
      ...categoryUrls,
      ...serviceUrls,
      ...providerUrls,
    ];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return at least static pages if dynamic generation fails
    return STATIC_PAGES.map(page => ({
      url: `${BASE_URL}${page.url}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    }));
  }
}

/**
 * Generate category page URLs
 */
async function generateCategoryUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const categoriesRef = collection(db, 'categories');
    const snapshot = await getDocs(categoriesRef);
    
    return snapshot.docs.map(doc => {
      const category = doc.data();
      return {
        url: `${BASE_URL}/catalog?category=${encodeURIComponent(category.slug || doc.id)}`,
        lastModified: category.updatedAt?.toDate() || new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      };
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Generate service page URLs (limit to top services for performance)
 */
async function generateServiceUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const servicesRef = collection(db, 'services');
    // Get top 1000 services by popularity/rating
    const q = query(
      servicesRef,
      where('status', '==', 'active'),
      orderBy('rating', 'desc'),
      limit(1000)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const service = doc.data();
      return {
        url: `${BASE_URL}/services/${doc.id}`,
        lastModified: service.updatedAt?.toDate() || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
}

/**
 * Generate provider profile URLs
 */
async function generateProviderUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const providersRef = collection(db, 'organizations');
    // Get verified providers
    const q = query(
      providersRef,
      where('type', '==', 'vendor'),
      where('verified', '==', true),
      limit(500)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const provider = doc.data();
      return {
        url: `${BASE_URL}/providers/${doc.id}`,
        lastModified: provider.updatedAt?.toDate() || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      };
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return [];
  }
}

/**
 * Additional sitemap for all services (can be split into multiple sitemaps)
 * This is called by sitemap-services.xml route
 */
export async function generateServicesSitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const servicesRef = collection(db, 'services');
    const snapshot = await getDocs(servicesRef);
    
    return snapshot.docs
      .filter(doc => doc.data().status === 'active')
      .map(doc => {
        const service = doc.data();
        return {
          url: `${BASE_URL}/services/${doc.id}`,
          lastModified: service.updatedAt?.toDate() || new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        };
      });
  } catch (error) {
    console.error('Error generating services sitemap:', error);
    return [];
  }
}