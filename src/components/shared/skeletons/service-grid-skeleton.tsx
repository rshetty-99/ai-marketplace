import { Skeleton } from '@/components/ui/skeleton';

interface ServiceGridSkeletonProps {
  count?: number;
  className?: string;
}

export function ServiceGridSkeleton({ count = 12, className }: ServiceGridSkeletonProps) {
  return (
    <div className={`grid gap-6 ${className || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <ServiceCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="animate-pulse">
        {/* Service Image/Icon */}
        <Skeleton className="h-12 w-12 rounded-lg mb-4" />
        
        {/* Title and Provider */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        {/* Description */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-4/5" />
        </div>

        {/* Tags */}
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>

        {/* Rating and Reviews */}
        <div className="flex items-center space-x-2 mb-4">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Key Features */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-20" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs mb-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-9 w-24 rounded" />
        </div>
      </div>
    </div>
  );
}