'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Search } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ProviderErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Provider Error Boundary caught an error:', error, errorInfo);
    
    // Log error to analytics or error reporting service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        page_title: 'Provider Directory',
        error_boundary: true,
      });
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                We encountered an error while loading the provider information. 
                This might be a temporary issue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleRetry} 
                  className="flex items-center justify-center gap-2"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button 
                  asChild
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <Link href="/">
                    <Home className="w-4 h-4" />
                    Go Home
                  </Link>
                </Button>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  You can also try:
                </p>
                <div className="space-y-2">
                  <Button asChild variant="ghost" size="sm" className="w-full">
                    <Link href="/catalog" className="flex items-center justify-center gap-2">
                      <Search className="w-4 h-4" />
                      Browse AI Services
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="w-full">
                    <Link href="/search">
                      Search Marketplace
                    </Link>
                  </Button>
                </div>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-sm cursor-pointer text-gray-500 dark:text-gray-400">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                    {this.state.error.message}
                    {this.state.error.stack && '\n' + this.state.error.stack}
                    {this.state.errorInfo && '\n\nComponent Stack:' + this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useProviderErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('Provider error:', error);
    
    // Log to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        page_title: 'Provider Directory',
      });
    }
    
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    hasError: !!error,
  };
}