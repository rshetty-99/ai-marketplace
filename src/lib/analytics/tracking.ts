/**
 * Analytics Tracking System
 * Comprehensive funnel tracking, conversion tracking, and event analytics
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export type EventCategory = 
  | 'catalog'
  | 'search'
  | 'filter'
  | 'service'
  | 'contact'
  | 'conversion'
  | 'navigation'
  | 'engagement';

export type FunnelStep = 
  | 'homepage_visit'
  | 'catalog_view'
  | 'search_initiated'
  | 'filter_applied'
  | 'service_viewed'
  | 'contact_initiated'
  | 'contact_completed'
  | 'conversion';

interface TrackingEvent {
  action: string;
  category: EventCategory;
  label?: string;
  value?: number | string;
  metadata?: Record<string, any>;
}

interface FunnelEvent {
  step: FunnelStep;
  stepNumber: number;
  metadata?: Record<string, any>;
}

class AnalyticsTracker {
  private sessionId: string;
  private userId?: string;
  private funnelStartTime?: number;
  private currentFunnelStep: number = 0;
  private eventQueue: TrackingEvent[] = [];
  private isInitialized: boolean = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  /**
   * Initialize tracking services
   */
  private initializeTracking() {
    if (typeof window === 'undefined') return;

    // Wait for GA to load
    const checkGA = setInterval(() => {
      if (window.gtag) {
        this.isInitialized = true;
        this.flushEventQueue();
        clearInterval(checkGA);
      }
    }, 100);

    // Stop checking after 5 seconds
    setTimeout(() => clearInterval(checkGA), 5000);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string) {
    this.userId = userId;
    if (window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
        user_id: userId,
      });
    }
  }

  /**
   * Track generic event
   */
  trackEvent(event: TrackingEvent) {
    if (!this.isInitialized) {
      this.eventQueue.push(event);
      return;
    }

    this.sendEvent(event);
  }

  /**
   * Send event to analytics
   */
  private sendEvent(event: TrackingEvent) {
    if (!window.gtag) return;

    window.gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      session_id: this.sessionId,
      user_id: this.userId,
      ...event.metadata,
    });
  }

  /**
   * Flush queued events
   */
  private flushEventQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) this.sendEvent(event);
    }
  }

  /**
   * Track funnel progression
   */
  trackFunnelStep(event: FunnelEvent) {
    if (!this.funnelStartTime) {
      this.funnelStartTime = Date.now();
    }

    const timeInFunnel = Date.now() - this.funnelStartTime;
    this.currentFunnelStep = event.stepNumber;

    this.trackEvent({
      action: 'funnel_step',
      category: 'conversion',
      label: event.step,
      value: event.stepNumber,
      metadata: {
        ...event.metadata,
        time_in_funnel: timeInFunnel,
        previous_step: this.currentFunnelStep - 1,
      },
    });
  }

  /**
   * Track search events
   */
  trackSearch(query: string, resultCount: number, filters?: Record<string, any>) {
    this.trackEvent({
      action: 'search',
      category: 'search',
      label: query,
      value: resultCount,
      metadata: {
        search_query: query,
        result_count: resultCount,
        filters_applied: filters ? Object.keys(filters).length : 0,
        has_filters: !!filters,
        ...filters,
      },
    });

    // Track as funnel step
    this.trackFunnelStep({
      step: 'search_initiated',
      stepNumber: 2,
      metadata: { query, resultCount },
    });
  }

  /**
   * Track filter application
   */
  trackFilter(filterType: string, filterValue: any, resultCount?: number) {
    this.trackEvent({
      action: 'filter_applied',
      category: 'filter',
      label: filterType,
      value: resultCount,
      metadata: {
        filter_type: filterType,
        filter_value: filterValue,
        result_count: resultCount,
      },
    });

    // Track as funnel step
    this.trackFunnelStep({
      step: 'filter_applied',
      stepNumber: 3,
      metadata: { filterType, filterValue, resultCount },
    });
  }

  /**
   * Track service view
   */
  trackServiceView(serviceId: string, serviceName: string, category?: string, price?: number) {
    this.trackEvent({
      action: 'service_view',
      category: 'service',
      label: serviceName,
      value: price,
      metadata: {
        service_id: serviceId,
        service_name: serviceName,
        service_category: category,
        service_price: price,
      },
    });

    // Track as funnel step
    this.trackFunnelStep({
      step: 'service_viewed',
      stepNumber: 4,
      metadata: { serviceId, serviceName, category, price },
    });
  }

  /**
   * Track contact/conversion events
   */
  trackContact(serviceId: string, contactType: 'inquiry' | 'demo' | 'purchase') {
    this.trackEvent({
      action: 'contact_initiated',
      category: 'contact',
      label: contactType,
      value: 1,
      metadata: {
        service_id: serviceId,
        contact_type: contactType,
      },
    });

    // Track as funnel step
    this.trackFunnelStep({
      step: 'contact_initiated',
      stepNumber: 5,
      metadata: { serviceId, contactType },
    });
  }

  /**
   * Track conversion completion
   */
  trackConversion(value: number, conversionType: string, metadata?: Record<string, any>) {
    this.trackEvent({
      action: 'conversion',
      category: 'conversion',
      label: conversionType,
      value,
      metadata: {
        conversion_type: conversionType,
        conversion_value: value,
        ...metadata,
      },
    });

    // Track as funnel step
    this.trackFunnelStep({
      step: 'conversion',
      stepNumber: 6,
      metadata: { value, conversionType, ...metadata },
    });

    // Send conversion to Google Ads if configured
    if (window.gtag && process.env.NEXT_PUBLIC_GOOGLE_ADS_ID) {
      window.gtag('event', 'conversion', {
        send_to: `${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}/conversion`,
        value,
        currency: 'USD',
      });
    }
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title?: string) {
    if (!window.gtag) return;

    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
      page_path: path,
      page_title: title,
      session_id: this.sessionId,
      user_id: this.userId,
    });
  }

  /**
   * Track timing events (performance)
   */
  trackTiming(category: string, variable: string, value: number, label?: string) {
    if (!window.gtag) return;

    window.gtag('event', 'timing_complete', {
      event_category: category,
      name: variable,
      value,
      event_label: label,
    });
  }

  /**
   * Track exceptions/errors
   */
  trackError(description: string, fatal: boolean = false) {
    if (!window.gtag) return;

    window.gtag('event', 'exception', {
      description,
      fatal,
    });
  }

  /**
   * Get funnel completion rate
   */
  getFunnelMetrics() {
    if (!this.funnelStartTime) return null;

    return {
      currentStep: this.currentFunnelStep,
      timeInFunnel: Date.now() - this.funnelStartTime,
      sessionId: this.sessionId,
    };
  }
}

// Singleton instance
export const analytics = new AnalyticsTracker();

/**
 * React hook for analytics tracking
 */
export function useAnalytics() {
  return {
    trackEvent: (event: TrackingEvent) => analytics.trackEvent(event),
    trackSearch: (query: string, resultCount: number, filters?: Record<string, any>) => 
      analytics.trackSearch(query, resultCount, filters),
    trackFilter: (filterType: string, filterValue: any, resultCount?: number) =>
      analytics.trackFilter(filterType, filterValue, resultCount),
    trackServiceView: (serviceId: string, serviceName: string, category?: string, price?: number) =>
      analytics.trackServiceView(serviceId, serviceName, category, price),
    trackContact: (serviceId: string, contactType: 'inquiry' | 'demo' | 'purchase') =>
      analytics.trackContact(serviceId, contactType),
    trackConversion: (value: number, conversionType: string, metadata?: Record<string, any>) =>
      analytics.trackConversion(value, conversionType, metadata),
    trackPageView: (path: string, title?: string) =>
      analytics.trackPageView(path, title),
    setUserId: (userId: string) => analytics.setUserId(userId),
  };
}

/**
 * Enhanced Google Analytics initialization
 */
export function initializeAnalytics() {
  if (typeof window === 'undefined') return;

  // Load Google Analytics
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
  document.head.appendChild(script1);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
    send_page_view: false, // We'll track page views manually
  });

  // Enhanced Ecommerce
  window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
    custom_map: {
      dimension1: 'session_id',
      dimension2: 'user_type',
      dimension3: 'service_category',
      metric1: 'search_result_count',
      metric2: 'filter_count',
    },
  });
}