import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";

export default function BrowseLoading() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-4 w-[600px]" />
      </div>

      {/* Search and Filters Loading */}
      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-6">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="md:col-span-2">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="md:col-span-2">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="md:col-span-2">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Category Quick Filters Loading */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-24" />
          ))}
        </div>
      </div>

      {/* Results Loading */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-4 w-8" />
            </div>
            
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>

            <Skeleton className="h-12 w-full" />
            
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-5 w-16" />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}