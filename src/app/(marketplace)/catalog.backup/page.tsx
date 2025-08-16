import { Metadata } from 'next';
import { Suspense } from 'react';
import { ServiceGrid } from '@/components/features/catalog/service-grid';
import { ServiceFilters } from '@/components/features/catalog/service-filters';
import { CatalogHeader } from '@/components/features/catalog/catalog-header';
import { ServiceGridSkeleton } from '@/components/shared/skeletons/service-grid-skeleton';

export const metadata: Metadata = {
  title: 'AI Services Catalog | Find the Perfect AI Solution',
  description: 'Browse our comprehensive catalog of AI services. Filter by industry, use case, and pricing to find the perfect AI solution for your enterprise needs.',
  keywords: 'AI services catalog, machine learning solutions, enterprise AI tools, AI marketplace',
  openGraph: {
    title: 'AI Services Catalog',
    description: 'Browse comprehensive AI services from verified providers',
    type: 'website',
  },
};

interface CatalogPageProps {
  searchParams: {
    search?: string;
    category?: string;
    industry?: string;
    pricing?: string;
    sort?: string;
    page?: string;
  };
}

export default function CatalogPage({ searchParams }: CatalogPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <CatalogHeader searchParams={searchParams} />
      
      <div className="flex flex-col lg:flex-row gap-8 mt-8">
        {/* Sidebar Filters */}
        <aside className="lg:w-80 flex-shrink-0">
          <div className="sticky top-24">
            <ServiceFilters initialFilters={searchParams} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Suspense fallback={<ServiceGridSkeleton />}>
            <ServiceGrid 
              searchParams={searchParams}
              className="grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
            />
          </Suspense>
        </main>
      </div>
    </div>
  );
}