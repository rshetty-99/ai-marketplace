'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time of 5 minutes
            staleTime: 5 * 60 * 1000,
            // Cache time of 10 minutes  
            gcTime: 10 * 60 * 1000,
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors except 408, 429
              if (error?.status >= 400 && error?.status < 500) {
                if (error.status === 408 || error.status === 429) {
                  return failureCount < 2;
                }
                return false;
              }
              // Retry up to 3 times for 5xx errors and network errors
              return failureCount < 3;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: (failureCount, error: any) => {
              // Don't retry mutations on client errors
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <AnalyticsProvider>
            {children}
          </AnalyticsProvider>
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}