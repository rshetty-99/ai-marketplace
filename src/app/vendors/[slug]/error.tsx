/**
 * Vendor Profile Error Page
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/shared/navigation/header';
import { Footer } from '@/components/shared/navigation/footer';

export default function VendorProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Vendor profile error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Something went wrong</CardTitle>
            <CardDescription>
              We encountered an error while loading this vendor profile. This might be a temporary issue.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Error details:</strong> {error.message || 'Unknown error occurred'}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => reset()} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Try again
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/vendors" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Browse vendors
                </Link>
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                If the problem persists, please{' '}
                <Link href="/contact" className="text-blue-600 hover:underline">
                  contact support
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}