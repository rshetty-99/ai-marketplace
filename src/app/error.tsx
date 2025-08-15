'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error:', error);
    
    // Track error in analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: true,
        error_boundary: 'global',
      });
    }
  }, [error]);

  const errorId = Date.now().toString(36);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-lg mx-auto text-center">
        <div className="w-24 h-24 mx-auto mb-8 text-red-500">
          <AlertTriangle className="w-full h-full" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Oops! Something went wrong
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          We&apos;re sorry, but something unexpected happened. Our team has been 
          notified and is working on a fix.
        </p>
        
        {/* Error details for development */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-left">
            <h3 className="text-sm font-medium text-red-800 mb-2">
              Development Error Details:
            </h3>
            <pre className="text-xs text-red-700 overflow-auto max-h-32 whitespace-pre-wrap">
              {error.message}
              {error.stack && (
                <>
                  {'\n\nStack Trace:\n'}
                  {error.stack}
                </>
              )}
            </pre>
          </div>
        )}

        <div className="bg-gray-100 rounded-lg p-4 mb-8 text-sm text-gray-600">
          <p>Error ID: {errorId}</p>
          <p>Timestamp: {new Date().toLocaleString()}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button onClick={reset} size="lg" className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Try Again
          </Button>
          <Button variant="outline" size="lg" asChild className="flex items-center gap-2">
            <Link href="/">
              <Home className="w-5 h-5" />
              Go to Homepage
            </Link>
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">Need help? Contact our support team</p>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/contact" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Contact Support
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}