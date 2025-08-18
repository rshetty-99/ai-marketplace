/**
 * React Hook for Profile Analytics
 * Provides real-time analytics data and tracking capabilities
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  ProfileAnalyticsService, 
  ProfileAnalytics, 
  AnalyticsTimeRange,
  ProfileView,
  AnalyticsEvent
} from '@/lib/analytics/profile-analytics-service';

interface UseProfileAnalyticsProps {
  profileId: string;
  userType?: 'freelancer' | 'vendor' | 'organization';
  autoTrack?: boolean;
  trackingData?: Partial<ProfileView>;
}

interface UseProfileAnalyticsReturn {
  analytics: ProfileAnalytics | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  trackView: (data?: Partial<ProfileView>) => Promise<void>;
  trackEvent: (eventType: AnalyticsEvent['eventType'], metadata?: Record<string, any>) => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  
  // Time range filtering
  setTimeRange: (range: AnalyticsTimeRange) => void;
  timeRange: AnalyticsTimeRange | null;
  
  // Comparative data
  comparative: {
    percentile: number;
    avgIndustryViews: number;
    avgIndustryConversion: number;
    topPerformers: Array<{ profileId: string; views: number }>;
  } | null;
}

export function useProfileAnalytics({
  profileId,
  userType = 'freelancer',
  autoTrack = false,
  trackingData
}: UseProfileAnalyticsProps): UseProfileAnalyticsReturn {
  const { user } = useUser();
  const [analytics, setAnalytics] = useState<ProfileAnalytics | null>(null);
  const [comparative, setComparative] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange | null>(null);

  // Track view automatically if enabled
  useEffect(() => {
    if (autoTrack && profileId) {
      const viewData: Partial<ProfileView> = {
        viewerId: user?.id,
        viewerType: user ? 'client' : 'visitor',
        source: getTrafficSource(),
        deviceType: getDeviceType(),
        referrer: document.referrer,
        ...trackingData
      };

      ProfileAnalyticsService.trackProfileView(profileId, userType, viewData);

      // Track view duration on page unload
      const startTime = Date.now();
      const handleUnload = () => {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        ProfileAnalyticsService.trackEvent(profileId, 'view', { duration });
      };

      window.addEventListener('beforeunload', handleUnload);
      return () => window.removeEventListener('beforeunload', handleUnload);
    }
  }, [autoTrack, profileId, userType, user, trackingData]);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    if (!profileId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [analyticsData, comparativeData] = await Promise.all([
        ProfileAnalyticsService.getProfileAnalytics(profileId, timeRange || undefined),
        userType ? ProfileAnalyticsService.getComparativeAnalytics(profileId, userType) : null
      ]);

      setAnalytics(analyticsData);
      setComparative(comparativeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  }, [profileId, userType, timeRange]);

  // Initial fetch and refresh on time range change
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Track a view manually
  const trackView = useCallback(async (data?: Partial<ProfileView>) => {
    if (!profileId) return;

    try {
      const viewData: Partial<ProfileView> = {
        viewerId: user?.id,
        viewerType: user ? 'client' : 'visitor',
        source: getTrafficSource(),
        deviceType: getDeviceType(),
        referrer: document.referrer,
        ...data
      };

      await ProfileAnalyticsService.trackProfileView(profileId, userType, viewData);
    } catch (err) {
      console.error('Failed to track view:', err);
    }
  }, [profileId, userType, user]);

  // Track an event
  const trackEvent = useCallback(async (
    eventType: AnalyticsEvent['eventType'], 
    metadata?: Record<string, any>
  ) => {
    if (!profileId) return;

    try {
      await ProfileAnalyticsService.trackEvent(profileId, eventType, metadata);
      
      // Refresh analytics to show updated data
      await fetchAnalytics();
    } catch (err) {
      console.error('Failed to track event:', err);
    }
  }, [profileId, fetchAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    trackView,
    trackEvent,
    refreshAnalytics: fetchAnalytics,
    setTimeRange,
    timeRange,
    comparative
  };
}

/**
 * Hook for viewing analytics dashboard
 */
export function useAnalyticsDashboard(profileId: string) {
  const [report, setReport] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportData, setExportData] = useState<string | null>(null);

  const generateReport = useCallback(async (timeRange: AnalyticsTimeRange) => {
    setIsGenerating(true);
    try {
      const reportData = await ProfileAnalyticsService.generateAnalyticsReport(profileId, timeRange);
      setReport(reportData);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [profileId]);

  const exportAnalytics = useCallback(async (format: 'json' | 'csv') => {
    try {
      const data = await ProfileAnalyticsService.exportAnalytics(profileId, format);
      setExportData(data);
      
      // Trigger download
      const blob = new Blob([data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${profileId}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export analytics:', error);
    }
  }, [profileId]);

  return {
    report,
    isGenerating,
    generateReport,
    exportAnalytics,
    exportData
  };
}

// Helper functions
function getTrafficSource(): ProfileView['source'] {
  const referrer = document.referrer;
  const searchEngines = ['google', 'bing', 'yahoo', 'duckduckgo'];
  const socialNetworks = ['facebook', 'twitter', 'linkedin', 'instagram'];

  if (!referrer) return 'direct';
  
  const referrerHost = new URL(referrer).hostname.toLowerCase();
  
  if (searchEngines.some(engine => referrerHost.includes(engine))) {
    return 'search';
  }
  
  if (socialNetworks.some(network => referrerHost.includes(network))) {
    return 'social';
  }
  
  if (referrerHost === window.location.hostname) {
    return 'internal';
  }
  
  return 'referral';
}

function getDeviceType(): ProfileView['deviceType'] {
  const width = window.innerWidth;
  
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}