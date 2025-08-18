import { Metadata } from 'next';
import { Suspense } from 'react';
import { EnhancedCatalogClient } from './enhanced-catalog-client';
import { ServiceCatalogSkeleton } from './loading';
import { generateCatalogMetadata } from './metadata';

// Dynamic metadata generation based on search params
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  // Convert searchParams to a simpler format
  const params = Object.entries(searchParams).reduce((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[key] = value;
    } else if (Array.isArray(value)) {
      acc[key] = value[0];
    }
    return acc;
  }, {} as Record<string, string>);

  return generateCatalogMetadata({ searchParams: params });
}

interface CatalogPageProps {
  searchParams: {
    search?: string;
    category?: string;
    subcategory?: string;
    industry?: string;
    providerType?: string;
    priceRange?: string;
    pricingType?: string;
    technologies?: string;
    regions?: string;
    compliance?: string;
    rating?: string;
    verified?: string;
    featured?: string;
    sort?: string;
    page?: string;
    limit?: string;
  };
}

export default function CatalogPage({ searchParams }: CatalogPageProps) {
  return (
    <Suspense fallback={<ServiceCatalogSkeleton />}>
      <EnhancedCatalogClient initialFilters={searchParams} />
    </Suspense>
  );
}