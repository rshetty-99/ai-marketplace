/**
 * SEO Meta Tag Generator
 * Dynamically generates meta tags based on page context, filters, and content
 */

import { Metadata } from 'next';

export interface MetaGeneratorOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  filters?: Record<string, any>;
  category?: string;
  searchQuery?: string;
  resultCount?: number;
  page?: number;
}

const SITE_NAME = 'AI Marketplace';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-marketplace.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;

export class MetaGenerator {
  /**
   * Generate dynamic title based on context
   */
  static generateTitle(options: MetaGeneratorOptions): string {
    const parts: string[] = [];

    // Add search query if present
    if (options.searchQuery) {
      parts.push(`"${options.searchQuery}"`);
    }

    // Add category if present
    if (options.category) {
      parts.push(`${options.category} AI Services`);
    }

    // Add filter context
    if (options.filters) {
      const filterContext = this.getFilterContext(options.filters);
      if (filterContext) {
        parts.push(filterContext);
      }
    }

    // Add page number for pagination
    if (options.page && options.page > 1) {
      parts.push(`Page ${options.page}`);
    }

    // Fallback to custom title or default
    if (parts.length === 0 && options.title) {
      parts.push(options.title);
    } else if (parts.length === 0) {
      parts.push('AI Services & Solutions');
    }

    // Add site name
    parts.push(SITE_NAME);

    return parts.join(' | ');
  }

  /**
   * Generate dynamic description
   */
  static generateDescription(options: MetaGeneratorOptions): string {
    let description = '';

    if (options.description) {
      return options.description;
    }

    // Build dynamic description
    if (options.searchQuery) {
      description = `Find ${options.searchQuery} services on ${SITE_NAME}. `;
    } else if (options.category) {
      description = `Explore top ${options.category} AI services and solutions. `;
    } else {
      description = `Discover cutting-edge AI services and solutions. `;
    }

    // Add result count if available
    if (options.resultCount !== undefined) {
      description += `Browse ${options.resultCount.toLocaleString()} verified providers. `;
    }

    // Add filter context
    if (options.filters) {
      const filterDescription = this.getFilterDescription(options.filters);
      if (filterDescription) {
        description += filterDescription;
      }
    }

    // Add call to action
    description += `Compare prices, read reviews, and connect with expert AI service providers.`;

    return description.slice(0, 160); // Keep under 160 chars
  }

  /**
   * Generate keywords based on context
   */
  static generateKeywords(options: MetaGeneratorOptions): string[] {
    const keywords = new Set<string>();

    // Add default keywords
    keywords.add('AI services');
    keywords.add('artificial intelligence');
    keywords.add('machine learning');
    keywords.add('AI marketplace');

    // Add category keywords
    if (options.category) {
      keywords.add(options.category.toLowerCase());
      keywords.add(`${options.category} AI`);
      keywords.add(`${options.category} services`);
    }

    // Add search keywords
    if (options.searchQuery) {
      const searchTerms = options.searchQuery.toLowerCase().split(' ');
      searchTerms.forEach(term => {
        if (term.length > 2) keywords.add(term);
      });
    }

    // Add filter-based keywords
    if (options.filters) {
      if (options.filters.priceRange) {
        keywords.add('affordable AI');
        keywords.add('AI pricing');
      }
      if (options.filters.rating) {
        keywords.add('top rated AI services');
        keywords.add('best AI providers');
      }
      if (options.filters.certifications) {
        keywords.add('certified AI experts');
        keywords.add('verified providers');
      }
    }

    // Add custom keywords
    if (options.keywords) {
      options.keywords.forEach(kw => keywords.add(kw));
    }

    return Array.from(keywords).slice(0, 10); // Limit to 10 keywords
  }

  /**
   * Generate canonical URL
   */
  static generateCanonical(path: string, filters?: Record<string, any>): string {
    const url = new URL(path, SITE_URL);
    
    // Only include important filters in canonical
    if (filters) {
      const importantFilters = ['category', 'subcategory', 'sort'];
      importantFilters.forEach(key => {
        if (filters[key]) {
          url.searchParams.set(key, filters[key]);
        }
      });
    }

    return url.toString();
  }

  /**
   * Generate complete metadata object for Next.js
   */
  static generateMetadata(options: MetaGeneratorOptions): Metadata {
    const title = this.generateTitle(options);
    const description = this.generateDescription(options);
    const keywords = this.generateKeywords(options).join(', ');
    const canonical = options.canonical || SITE_URL;
    const ogImage = options.ogImage || DEFAULT_OG_IMAGE;

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: SITE_NAME,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
      alternates: {
        canonical,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  }

  /**
   * Helper: Get filter context for title
   */
  private static getFilterContext(filters: Record<string, any>): string {
    const parts: string[] = [];

    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      if (min && max) {
        parts.push(`$${min}-$${max}`);
      } else if (min) {
        parts.push(`$${min}+`);
      } else if (max) {
        parts.push(`Under $${max}`);
      }
    }

    if (filters.rating && filters.rating >= 4) {
      parts.push('Top Rated');
    }

    if (filters.verified) {
      parts.push('Verified');
    }

    return parts.join(', ');
  }

  /**
   * Helper: Get filter description
   */
  private static getFilterDescription(filters: Record<string, any>): string {
    const parts: string[] = [];

    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      if (min && max) {
        parts.push(`Prices from $${min} to $${max}.`);
      }
    }

    if (filters.rating) {
      parts.push(`Minimum ${filters.rating} star rating.`);
    }

    if (filters.location) {
      parts.push(`Available in ${filters.location}.`);
    }

    return parts.join(' ');
  }
}

/**
 * Generate structured data for service listings
 */
export function generateServiceListingSchema(services: any[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: services.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: service.name,
        description: service.description,
        provider: {
          '@type': 'Organization',
          name: service.providerName,
        },
        aggregateRating: service.rating ? {
          '@type': 'AggregateRating',
          ratingValue: service.rating,
          reviewCount: service.reviewCount || 0,
        } : undefined,
        offers: {
          '@type': 'Offer',
          price: service.startingPrice,
          priceCurrency: 'USD',
        },
        url: `${SITE_URL}/services/${service.id}`,
      },
    })),
  };
}

/**
 * Generate breadcrumb schema
 */
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/**
 * Generate organization schema for the marketplace
 */
export function generateOrganizationSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'Leading AI services marketplace connecting businesses with AI solution providers',
    sameAs: [
      'https://twitter.com/aimarketplace',
      'https://linkedin.com/company/ai-marketplace',
      'https://github.com/ai-marketplace',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-0123',
      contactType: 'customer service',
      availableLanguage: 'en',
    },
  };
}