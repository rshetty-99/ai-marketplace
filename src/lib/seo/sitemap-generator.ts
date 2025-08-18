/**
 * Sitemap Generator
 * Generates XML sitemaps for profiles and dynamic content
 */

import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ProfileSEOData, generateProfileSitemapEntry } from './meta-generator';

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export interface SitemapIndex {
  sitemaps: Array<{
    loc: string;
    lastmod: Date;
  }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-marketplace.com';
const MAX_SITEMAP_ENTRIES = 50000; // Google's limit
const MAX_ENTRIES_PER_SITEMAP = 10000; // Split large sitemaps

export class SitemapGenerator {
  /**
   * Generate main sitemap index
   */
  static async generateSitemapIndex(): Promise<SitemapIndex> {
    const sitemaps = [
      {
        loc: `${SITE_URL}/sitemap-static.xml`,
        lastmod: new Date()
      },
      {
        loc: `${SITE_URL}/sitemap-profiles.xml`,
        lastmod: await SitemapGenerator.getLatestProfileUpdate()
      }
    ];

    // Add additional profile sitemaps if needed
    const profileCount = await SitemapGenerator.getProfileCount();
    if (profileCount > MAX_ENTRIES_PER_SITEMAP) {
      const additionalSitemaps = Math.ceil(profileCount / MAX_ENTRIES_PER_SITEMAP) - 1;
      for (let i = 1; i <= additionalSitemaps; i++) {
        sitemaps.push({
          loc: `${SITE_URL}/sitemap-profiles-${i}.xml`,
          lastmod: await SitemapGenerator.getLatestProfileUpdate()
        });
      }
    }

    return { sitemaps };
  }

  /**
   * Generate static pages sitemap
   */
  static generateStaticSitemap(): SitemapEntry[] {
    const staticPages = [
      { path: '/', priority: 1.0, changeFreq: 'daily' as const },
      { path: '/browse', priority: 0.9, changeFreq: 'daily' as const },
      { path: '/categories', priority: 0.8, changeFreq: 'weekly' as const },
      { path: '/about', priority: 0.6, changeFreq: 'monthly' as const },
      { path: '/contact', priority: 0.5, changeFreq: 'monthly' as const },
      { path: '/terms', priority: 0.3, changeFreq: 'yearly' as const },
      { path: '/privacy', priority: 0.3, changeFreq: 'yearly' as const },
      { path: '/help', priority: 0.7, changeFreq: 'weekly' as const },
    ];

    return staticPages.map(page => ({
      url: `${SITE_URL}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFreq,
      priority: page.priority
    }));
  }

  /**
   * Generate profiles sitemap
   */
  static async generateProfilesSitemap(page: number = 0): Promise<SitemapEntry[]> {
    const entries: SitemapEntry[] = [];
    const collections = ['freelancers', 'vendors', 'organizations'];
    const userTypes: ('freelancer' | 'vendor' | 'organization')[] = ['freelancer', 'vendor', 'organization'];

    for (let i = 0; i < collections.length; i++) {
      const collectionName = collections[i];
      const userType = userTypes[i];
      
      try {
        const q = query(
          collection(db, collectionName),
          where('publicProfile.isPublic', '==', true),
          where('publicProfile.slug', '!=', null),
          orderBy('publicProfile.slug'),
          limit(MAX_ENTRIES_PER_SITEMAP)
        );

        const snapshot = await getDocs(q);
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const profileData: ProfileSEOData = {
            name: data.name || data.companyName || 'Unknown',
            description: data.bio || data.description || '',
            slug: data.publicProfile?.slug,
            userType,
            title: data.title || data.jobTitle,
            location: data.location,
            skills: data.skills || [],
            services: data.services || [],
            rating: data.rating,
            reviewCount: data.reviewCount,
            avatar: data.avatar || data.logo,
            lastActive: data.lastActive?.toDate() || data.updatedAt?.toDate() || new Date(),
            // Add other fields as needed
          };

          if (profileData.slug) {
            entries.push(generateProfileSitemapEntry(profileData));
          }
        });
      } catch (error) {
        console.error(`Error generating sitemap for ${collectionName}:`, error);
      }
    }

    return entries;
  }

  /**
   * Generate category pages sitemap
   */
  static generateCategorySitemap(): SitemapEntry[] {
    // This would be populated with your actual categories
    const categories = [
      'machine-learning',
      'natural-language-processing',
      'computer-vision',
      'data-science',
      'ai-consulting',
      'automation',
      'chatbots',
      'recommendation-systems',
    ];

    return categories.map(category => ({
      url: `${SITE_URL}/browse?category=${category}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8
    }));
  }

  /**
   * Convert sitemap entries to XML
   */
  static generateSitemapXML(entries: SitemapEntry[]): string {
    const xmlEntries = entries.map(entry => `
  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified.toISOString()}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
  }

  /**
   * Convert sitemap index to XML
   */
  static generateSitemapIndexXML(index: SitemapIndex): string {
    const xmlSitemaps = index.sitemaps.map(sitemap => `
  <sitemap>
    <loc>${sitemap.loc}</loc>
    <lastmod>${sitemap.lastmod.toISOString()}</lastmod>
  </sitemap>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlSitemaps}
</sitemapindex>`;
  }

  /**
   * Get latest profile update timestamp
   */
  private static async getLatestProfileUpdate(): Promise<Date> {
    try {
      const collections = ['freelancers', 'vendors', 'organizations'];
      let latestUpdate = new Date(0); // Start with epoch

      for (const collectionName of collections) {
        const q = query(
          collection(db, collectionName),
          where('publicProfile.isPublic', '==', true),
          orderBy('updatedAt', 'desc'),
          limit(1)
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const updateTime = snapshot.docs[0].data().updatedAt?.toDate();
          if (updateTime && updateTime > latestUpdate) {
            latestUpdate = updateTime;
          }
        }
      }

      return latestUpdate > new Date(0) ? latestUpdate : new Date();
    } catch (error) {
      console.error('Error getting latest profile update:', error);
      return new Date();
    }
  }

  /**
   * Get total profile count
   */
  private static async getProfileCount(): Promise<number> {
    try {
      const collections = ['freelancers', 'vendors', 'organizations'];
      let totalCount = 0;

      for (const collectionName of collections) {
        const q = query(
          collection(db, collectionName),
          where('publicProfile.isPublic', '==', true),
          where('publicProfile.slug', '!=', null)
        );

        const snapshot = await getDocs(q);
        totalCount += snapshot.size;
      }

      return totalCount;
    } catch (error) {
      console.error('Error getting profile count:', error);
      return 0;
    }
  }

  /**
   * Generate robots.txt content
   */
  static generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml

# Common crawl delays
Crawl-delay: 1

# Block admin areas
Disallow: /admin/
Disallow: /dashboard/
Disallow: /api/

# Block sensitive files
Disallow: /*.json$
Disallow: /*.xml$
Disallow: /*.txt$

# Allow specific static assets
Allow: /images/
Allow: /css/
Allow: /js/
Allow: /*.css
Allow: /*.js
Allow: /*.png
Allow: /*.jpg
Allow: /*.jpeg
Allow: /*.gif
Allow: /*.svg
Allow: /*.ico`;
  }
}