/**
 * Dynamic metadata generation for catalog pages
 */

import { Metadata } from 'next';
import { MetaGenerator } from '@/lib/seo/meta-generator';

interface GenerateCatalogMetadataProps {
  searchParams?: {
    q?: string;
    category?: string;
    subcategory?: string;
    priceMin?: string;
    priceMax?: string;
    rating?: string;
    sort?: string;
    page?: string;
    verified?: string;
    location?: string;
  };
  resultCount?: number;
}

export function generateCatalogMetadata({
  searchParams = {},
  resultCount,
}: GenerateCatalogMetadataProps): Metadata {
  // Parse filters from search params
  const filters: Record<string, any> = {};
  
  if (searchParams.priceMin || searchParams.priceMax) {
    filters.priceRange = [
      searchParams.priceMin ? parseInt(searchParams.priceMin) : null,
      searchParams.priceMax ? parseInt(searchParams.priceMax) : null,
    ];
  }
  
  if (searchParams.rating) {
    filters.rating = parseFloat(searchParams.rating);
  }
  
  if (searchParams.verified === 'true') {
    filters.verified = true;
  }
  
  if (searchParams.location) {
    filters.location = searchParams.location;
  }

  // Generate canonical URL
  const canonical = MetaGenerator.generateCanonical('/catalog', {
    category: searchParams.category,
    subcategory: searchParams.subcategory,
    sort: searchParams.sort,
  });

  // Generate metadata
  return MetaGenerator.generateMetadata({
    searchQuery: searchParams.q,
    category: searchParams.category,
    filters,
    canonical,
    resultCount,
    page: searchParams.page ? parseInt(searchParams.page) : undefined,
  });
}

/**
 * Generate metadata for service detail pages
 */
export function generateServiceMetadata(service: any): Metadata {
  const title = `${service.name} - AI Service | AI Marketplace`;
  const description = service.description || `${service.name} provides cutting-edge AI solutions. Compare prices, read reviews, and connect directly.`;
  
  return {
    title,
    description,
    keywords: [
      service.name,
      service.category,
      'AI service',
      'artificial intelligence',
      ...(service.tags || []),
    ].join(', '),
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/services/${service.id}`,
      siteName: 'AI Marketplace',
      images: service.images?.length ? [
        {
          url: service.images[0],
          width: 1200,
          height: 630,
          alt: service.name,
        },
      ] : [],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: service.images || [],
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/services/${service.id}`,
    },
  };
}