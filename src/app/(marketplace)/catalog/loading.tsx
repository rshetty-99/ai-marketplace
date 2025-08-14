import { ServiceGridSkeleton } from '@/components/shared/skeletons/service-grid-skeleton';

export default function CatalogLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="animate-pulse mb-8">
        <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-96 mb-6"></div>
        <div className="flex gap-4">
          <div className="h-10 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-28"></div>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Skeleton */}
        <aside className="lg:w-80 flex-shrink-0">
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-24 mb-3"></div>
                <div className="space-y-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded w-32"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <main className="flex-1">
          <ServiceGridSkeleton />
        </main>
      </div>
    </div>
  );
}