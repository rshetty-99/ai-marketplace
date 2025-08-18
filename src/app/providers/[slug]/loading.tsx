'use client';

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/shared/navigation/header';
import { Footer } from '@/components/shared/navigation/footer';

export function ProviderProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Cover Image Skeleton */}
      <div className="relative h-64 bg-gradient-to-r from-blue-600 to-purple-600">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Profile Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Skeleton className="w-32 h-32 rounded-xl" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-14" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </CardContent>
            </Card>

            {/* Portfolio Section */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="w-full h-48 rounded-lg" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Services Section */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-28" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Skeleton className="h-5 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-28" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-20" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-16" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="large" />
      <span className="ml-3 text-lg">Loading Provider Profile...</span>
    </div>
  );
}