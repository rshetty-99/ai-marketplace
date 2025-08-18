'use client';

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/shared/navigation/header';
import { Footer } from '@/components/shared/navigation/footer';

export function ProviderDirectorySkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Hero Section Skeleton */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <Skeleton className="h-12 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-2/3 mx-auto" />
            <div className="max-w-2xl mx-auto">
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section Skeleton */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </section>

      {/* Provider Grid Skeleton */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-5/6" />
                      <Skeleton className="h-3 w-4/6" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-14" />
                    </div>
                    <div className="flex justify-between items-center pt-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="large" />
      <span className="ml-3 text-lg">Loading AI Providers...</span>
    </div>
  );
}