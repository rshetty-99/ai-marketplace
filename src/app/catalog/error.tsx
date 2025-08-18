'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Search } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to analytics/monitoring service
    console.error('Service catalog error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-xl">Something went wrong!</CardTitle>
          <CardDescription>
            We're sorry, but there was an error loading the service catalog. 
            This might be a temporary issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
            <strong>Error Details:</strong> {error.message || 'An unexpected error occurred'}
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/search">
                <Search className="w-4 h-4 mr-2" />
                Try Search Instead
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              If this problem persists, please{' '}
              <Link href="/contact" className="text-blue-600 hover:underline">
                contact our support team
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}