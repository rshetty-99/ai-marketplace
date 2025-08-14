'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

interface AnalyticsContextType {
  trackEvent: (eventName: string, parameters?: Record<string, any>) => void;
  trackPageView: (path: string, title?: string) => void;
  identifyUser: (userId: string, traits?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { userId, isLoaded } = useAuth();

  const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
    if (typeof window === 'undefined') return;

    // Google Analytics 4
    if ((window as any).gtag) {
      (window as any).gtag('event', eventName, {
        page_location: window.location.href,
        page_path: pathname,
        user_id: userId || undefined,
        timestamp: Date.now(),
        ...parameters,
      });
    }

    // Console logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', eventName, parameters);
    }
  };

  const trackPageView = (path: string, title?: string) => {
    if (typeof window === 'undefined') return;

    // Google Analytics 4 page view
    if ((window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_title: title || document.title,
        page_location: window.location.href,
        page_path: path,
        user_id: userId || undefined,
      });
    }
  };

  const identifyUser = (userId: string, traits: Record<string, any> = {}) => {
    if (typeof window === 'undefined') return;

    // Set user ID for Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        user_id: userId,
        custom_map: traits,
      });
    }
  };

  // Track page views
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);

    // Track specific page events based on pathname
    if (pathname === '/') {
      trackEvent('homepage_viewed');
    } else if (pathname.startsWith('/catalog')) {
      trackEvent('catalog_viewed', {
        filters: Object.fromEntries(searchParams.entries()),
      });
    } else if (pathname.startsWith('/services/')) {
      trackEvent('service_detail_viewed', {
        service_path: pathname,
      });
    } else if (pathname.startsWith('/providers/')) {
      trackEvent('provider_profile_viewed', {
        provider_path: pathname,
      });
    } else if (pathname.startsWith('/dashboard')) {
      trackEvent('dashboard_viewed', {
        dashboard_section: pathname.split('/')[2] || 'main',
      });
    }
  }, [pathname, searchParams, userId]);

  // Identify user when authenticated
  useEffect(() => {
    if (isLoaded && userId) {
      identifyUser(userId, {
        authenticated: true,
        user_type: 'registered',
      });
    }
  }, [isLoaded, userId]);

  const value: AnalyticsContextType = {
    trackEvent,
    trackPageView,
    identifyUser,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}