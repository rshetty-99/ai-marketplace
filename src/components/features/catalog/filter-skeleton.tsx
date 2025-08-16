import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Skeleton for category filter section
export function CategoryFilterSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg">
            <div className="flex items-center gap-2 flex-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 flex-1 max-w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-8 rounded-full" />
              <Skeleton className="h-4 w-4" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Skeleton for price range filter section
export function PriceFilterSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price slider skeleton */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        
        {/* Price range options skeleton */}
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded">
              <Skeleton className="h-4 flex-1 max-w-20" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
          ))}
        </div>
        
        {/* Price histogram skeleton */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-2 flex-1 rounded-full" />
              <Skeleton className="h-3 w-4" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton for provider type filter section
export function ProviderTypeFilterSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-4" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Skeleton for rating filter section
export function RatingFilterSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Skeleton key={j} className="h-3 w-3" />
                  ))}
                  <Skeleton className="h-4 w-16 ml-1" />
                </div>
              </div>
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton for industry filter section
export function IndustryFilterSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 flex-1 max-w-24" />
            <Skeleton className="h-3 w-4" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Skeleton for compliance filter section
export function ComplianceFilterSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1 max-w-28" />
            <Skeleton className="h-3 w-4" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Skeleton for service features filter section
export function ServiceFeaturesFilterSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1 max-w-32" />
            <Skeleton className="h-3 w-4" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// General filter section skeleton
export function FilterSectionSkeleton({ 
  title = "Filter Section",
  itemCount = 5,
  showIcon = true,
  showCounts = true,
  showCheckboxes = true
}: {
  title?: string;
  itemCount?: number;
  showIcon?: boolean;
  showCounts?: boolean;
  showCheckboxes?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {showIcon && <Skeleton className="h-4 w-4" />}
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {[...Array(itemCount)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            {showCheckboxes && <Skeleton className="h-4 w-4 rounded" />}
            <Skeleton className="h-4 flex-1 max-w-24" />
            {showCounts && <Skeleton className="h-3 w-4" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}