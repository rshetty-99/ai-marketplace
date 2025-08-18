/**
 * Profile Analytics Service
 * Comprehensive analytics tracking and reporting for user profiles
 */

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  arrayUnion,
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface ProfileView {
  viewerId?: string; // Anonymous if not logged in
  viewerType?: 'visitor' | 'client' | 'freelancer' | 'vendor' | 'organization';
  timestamp: Date;
  source: 'direct' | 'search' | 'social' | 'referral' | 'internal';
  referrer?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  country?: string;
  city?: string;
  duration?: number; // Time spent on profile in seconds
  actions?: string[]; // Actions taken (e.g., 'contact', 'download_portfolio', 'view_projects')
}

export interface ProfileAnalytics {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  
  // View Metrics
  totalViews: number;
  uniqueViews: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  
  // Engagement Metrics
  avgViewDuration: number; // in seconds
  bounceRate: number; // Percentage of single-page sessions
  contactClicks: number;
  portfolioDownloads: number;
  socialLinkClicks: number;
  
  // Conversion Metrics
  inquiries: number;
  proposals: number;
  hiredCount: number;
  conversionRate: number;
  
  // Source Analytics
  trafficSources: {
    direct: number;
    search: number;
    social: number;
    referral: number;
    internal: number;
  };
  
  // Device Analytics
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  
  // Geographic Analytics
  topCountries: Array<{ country: string; views: number }>;
  topCities: Array<{ city: string; views: number }>;
  
  // Time-based Analytics
  peakViewHours: number[]; // Array of 24 hours with view counts
  bestPerformingDays: Array<{ date: Date; views: number }>;
  
  // Comparison Metrics
  viewsVsPrevWeek: number; // Percentage change
  viewsVsPrevMonth: number; // Percentage change
  industryAvgComparison?: number; // How this profile performs vs industry average
  
  // SEO Performance
  searchImpressions?: number;
  searchClicks?: number;
  avgSearchPosition?: number;
  topSearchQueries?: string[];
  
  // Last Updated
  lastUpdated: Date;
}

export interface AnalyticsTimeRange {
  start: Date;
  end: Date;
}

export interface AnalyticsEvent {
  profileId: string;
  eventType: 'view' | 'contact' | 'download' | 'share' | 'hire' | 'inquiry';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class ProfileAnalyticsService {
  private static ANALYTICS_COLLECTION = 'profile-analytics';
  private static EVENTS_COLLECTION = 'analytics-events';
  private static VIEWS_COLLECTION = 'profile-views';

  /**
   * Track a profile view
   */
  static async trackProfileView(
    profileId: string,
    userType: 'freelancer' | 'vendor' | 'organization',
    viewData: Partial<ProfileView>
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Create view record
      const viewRef = doc(collection(db, this.VIEWS_COLLECTION));
      const view: ProfileView = {
        viewerId: viewData.viewerId,
        viewerType: viewData.viewerType,
        timestamp: new Date(),
        source: viewData.source || 'direct',
        referrer: viewData.referrer,
        deviceType: viewData.deviceType || 'desktop',
        country: viewData.country,
        city: viewData.city,
        duration: viewData.duration,
        actions: viewData.actions || []
      };
      
      batch.set(viewRef, {
        ...view,
        profileId,
        timestamp: Timestamp.fromDate(view.timestamp)
      });

      // Update analytics summary
      const analyticsRef = doc(db, this.ANALYTICS_COLLECTION, profileId);
      const analyticsDoc = await getDoc(analyticsRef);
      
      if (!analyticsDoc.exists()) {
        // Initialize analytics document
        const initialAnalytics: ProfileAnalytics = {
          profileId,
          userType,
          totalViews: 1,
          uniqueViews: viewData.viewerId ? 1 : 0,
          viewsToday: 1,
          viewsThisWeek: 1,
          viewsThisMonth: 1,
          avgViewDuration: viewData.duration || 0,
          bounceRate: 0,
          contactClicks: 0,
          portfolioDownloads: 0,
          socialLinkClicks: 0,
          inquiries: 0,
          proposals: 0,
          hiredCount: 0,
          conversionRate: 0,
          trafficSources: {
            direct: view.source === 'direct' ? 1 : 0,
            search: view.source === 'search' ? 1 : 0,
            social: view.source === 'social' ? 1 : 0,
            referral: view.source === 'referral' ? 1 : 0,
            internal: view.source === 'internal' ? 1 : 0,
          },
          deviceBreakdown: {
            desktop: view.deviceType === 'desktop' ? 1 : 0,
            mobile: view.deviceType === 'mobile' ? 1 : 0,
            tablet: view.deviceType === 'tablet' ? 1 : 0,
          },
          topCountries: view.country ? [{ country: view.country, views: 1 }] : [],
          topCities: view.city ? [{ city: view.city, views: 1 }] : [],
          peakViewHours: new Array(24).fill(0),
          bestPerformingDays: [],
          viewsVsPrevWeek: 0,
          viewsVsPrevMonth: 0,
          lastUpdated: new Date()
        };
        
        batch.set(analyticsRef, {
          ...initialAnalytics,
          lastUpdated: Timestamp.fromDate(initialAnalytics.lastUpdated)
        });
      } else {
        // Update existing analytics
        const updates: any = {
          totalViews: increment(1),
          lastUpdated: Timestamp.now()
        };
        
        // Update traffic source
        updates[`trafficSources.${view.source}`] = increment(1);
        
        // Update device breakdown
        updates[`deviceBreakdown.${view.deviceType}`] = increment(1);
        
        batch.update(analyticsRef, updates);
      }

      // Create analytics event
      const eventRef = doc(collection(db, this.EVENTS_COLLECTION));
      const event: AnalyticsEvent = {
        profileId,
        eventType: 'view',
        timestamp: new Date(),
        metadata: {
          source: view.source,
          deviceType: view.deviceType,
          viewerId: view.viewerId
        }
      };
      
      batch.set(eventRef, {
        ...event,
        timestamp: Timestamp.fromDate(event.timestamp)
      });

      await batch.commit();
    } catch (error) {
      console.error('Error tracking profile view:', error);
    }
  }

  /**
   * Track an analytics event
   */
  static async trackEvent(
    profileId: string,
    eventType: AnalyticsEvent['eventType'],
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Create event record
      const eventRef = doc(collection(db, this.EVENTS_COLLECTION));
      const event: AnalyticsEvent = {
        profileId,
        eventType,
        timestamp: new Date(),
        metadata
      };
      
      batch.set(eventRef, {
        ...event,
        timestamp: Timestamp.fromDate(event.timestamp)
      });

      // Update analytics counters
      const analyticsRef = doc(db, this.ANALYTICS_COLLECTION, profileId);
      const updates: any = {
        lastUpdated: Timestamp.now()
      };
      
      switch (eventType) {
        case 'contact':
          updates.contactClicks = increment(1);
          break;
        case 'download':
          updates.portfolioDownloads = increment(1);
          break;
        case 'inquiry':
          updates.inquiries = increment(1);
          break;
        case 'hire':
          updates.hiredCount = increment(1);
          break;
      }
      
      batch.update(analyticsRef, updates);
      await batch.commit();
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Get profile analytics
   */
  static async getProfileAnalytics(
    profileId: string,
    timeRange?: AnalyticsTimeRange
  ): Promise<ProfileAnalytics | null> {
    try {
      const analyticsRef = doc(db, this.ANALYTICS_COLLECTION, profileId);
      const analyticsDoc = await getDoc(analyticsRef);
      
      if (!analyticsDoc.exists()) {
        return null;
      }

      const data = analyticsDoc.data() as ProfileAnalytics;
      
      // If time range specified, calculate metrics for that period
      if (timeRange) {
        const filteredData = await this.getFilteredAnalytics(profileId, timeRange);
        return { ...data, ...filteredData };
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile analytics:', error);
      return null;
    }
  }

  /**
   * Get filtered analytics for specific time range
   */
  private static async getFilteredAnalytics(
    profileId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<Partial<ProfileAnalytics>> {
    try {
      const viewsQuery = query(
        collection(db, this.VIEWS_COLLECTION),
        where('profileId', '==', profileId),
        where('timestamp', '>=', Timestamp.fromDate(timeRange.start)),
        where('timestamp', '<=', Timestamp.fromDate(timeRange.end)),
        orderBy('timestamp', 'desc')
      );

      const viewsSnapshot = await getDocs(viewsQuery);
      const views = viewsSnapshot.docs.map(doc => doc.data() as ProfileView);

      // Calculate metrics
      const totalViews = views.length;
      const uniqueViewers = new Set(views.map(v => v.viewerId).filter(Boolean)).size;
      const avgDuration = views.reduce((sum, v) => sum + (v.duration || 0), 0) / totalViews || 0;

      // Calculate traffic sources
      const trafficSources = views.reduce((acc, view) => {
        acc[view.source] = (acc[view.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate device breakdown
      const deviceBreakdown = views.reduce((acc, view) => {
        acc[view.deviceType] = (acc[view.deviceType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalViews,
        uniqueViews: uniqueViewers,
        avgViewDuration: avgDuration,
        trafficSources: {
          direct: trafficSources.direct || 0,
          search: trafficSources.search || 0,
          social: trafficSources.social || 0,
          referral: trafficSources.referral || 0,
          internal: trafficSources.internal || 0,
        },
        deviceBreakdown: {
          desktop: deviceBreakdown.desktop || 0,
          mobile: deviceBreakdown.mobile || 0,
          tablet: deviceBreakdown.tablet || 0,
        }
      };
    } catch (error) {
      console.error('Error fetching filtered analytics:', error);
      return {};
    }
  }

  /**
   * Get comparative analytics
   */
  static async getComparativeAnalytics(
    profileId: string,
    userType: 'freelancer' | 'vendor' | 'organization'
  ): Promise<{
    percentile: number;
    avgIndustryViews: number;
    avgIndustryConversion: number;
    topPerformers: Array<{ profileId: string; views: number }>;
  }> {
    try {
      // Get all profiles of same type
      const analyticsQuery = query(
        collection(db, this.ANALYTICS_COLLECTION),
        where('userType', '==', userType),
        orderBy('totalViews', 'desc'),
        limit(100) // Sample top 100 for comparison
      );

      const snapshot = await getDocs(analyticsQuery);
      const allProfiles = snapshot.docs.map(doc => doc.data() as ProfileAnalytics);
      
      // Find current profile position
      const currentProfile = allProfiles.find(p => p.profileId === profileId);
      if (!currentProfile) {
        return {
          percentile: 0,
          avgIndustryViews: 0,
          avgIndustryConversion: 0,
          topPerformers: []
        };
      }

      const position = allProfiles.findIndex(p => p.profileId === profileId) + 1;
      const percentile = ((allProfiles.length - position) / allProfiles.length) * 100;

      // Calculate averages
      const avgViews = allProfiles.reduce((sum, p) => sum + p.totalViews, 0) / allProfiles.length;
      const avgConversion = allProfiles.reduce((sum, p) => sum + p.conversionRate, 0) / allProfiles.length;

      // Get top performers
      const topPerformers = allProfiles.slice(0, 5).map(p => ({
        profileId: p.profileId,
        views: p.totalViews
      }));

      return {
        percentile: Math.round(percentile),
        avgIndustryViews: Math.round(avgViews),
        avgIndustryConversion: avgConversion,
        topPerformers
      };
    } catch (error) {
      console.error('Error fetching comparative analytics:', error);
      return {
        percentile: 0,
        avgIndustryViews: 0,
        avgIndustryConversion: 0,
        topPerformers: []
      };
    }
  }

  /**
   * Generate analytics report
   */
  static async generateAnalyticsReport(
    profileId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<{
    summary: ProfileAnalytics;
    trends: {
      viewsTrend: 'up' | 'down' | 'stable';
      engagementTrend: 'up' | 'down' | 'stable';
      conversionTrend: 'up' | 'down' | 'stable';
    };
    insights: string[];
    recommendations: string[];
  }> {
    const analytics = await this.getProfileAnalytics(profileId, timeRange);
    
    if (!analytics) {
      throw new Error('No analytics data available');
    }

    // Calculate trends
    const viewsTrend = analytics.viewsVsPrevWeek > 10 ? 'up' : 
                       analytics.viewsVsPrevWeek < -10 ? 'down' : 'stable';
    
    const engagementTrend = analytics.avgViewDuration > 60 ? 'up' : 
                           analytics.avgViewDuration < 30 ? 'down' : 'stable';
    
    const conversionTrend = analytics.conversionRate > 5 ? 'up' : 
                           analytics.conversionRate < 2 ? 'down' : 'stable';

    // Generate insights
    const insights: string[] = [];
    
    if (analytics.totalViews > 100) {
      insights.push('Your profile is getting good visibility with over 100 views');
    }
    
    if (analytics.bounceRate > 70) {
      insights.push('High bounce rate detected - visitors are leaving quickly');
    }
    
    if (analytics.trafficSources.search > analytics.trafficSources.direct) {
      insights.push('Most of your traffic comes from search - good SEO performance');
    }
    
    if (analytics.deviceBreakdown.mobile > analytics.deviceBreakdown.desktop) {
      insights.push('Majority of visitors use mobile devices');
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (analytics.avgViewDuration < 30) {
      recommendations.push('Add more engaging content to increase view duration');
    }
    
    if (analytics.portfolioDownloads < analytics.totalViews * 0.1) {
      recommendations.push('Consider updating your portfolio to increase downloads');
    }
    
    if (analytics.conversionRate < 2) {
      recommendations.push('Optimize your call-to-action buttons for better conversion');
    }
    
    if (!analytics.topSearchQueries?.length) {
      recommendations.push('Add more keywords to improve search visibility');
    }

    return {
      summary: analytics,
      trends: {
        viewsTrend,
        engagementTrend,
        conversionTrend
      },
      insights,
      recommendations
    };
  }

  /**
   * Export analytics data
   */
  static async exportAnalytics(
    profileId: string,
    format: 'json' | 'csv'
  ): Promise<string> {
    const analytics = await this.getProfileAnalytics(profileId);
    
    if (!analytics) {
      throw new Error('No analytics data available');
    }

    if (format === 'json') {
      return JSON.stringify(analytics, null, 2);
    } else {
      // Convert to CSV format
      const csvRows = [
        ['Metric', 'Value'],
        ['Total Views', analytics.totalViews.toString()],
        ['Unique Views', analytics.uniqueViews.toString()],
        ['Average View Duration', analytics.avgViewDuration.toString()],
        ['Bounce Rate', analytics.bounceRate.toString()],
        ['Contact Clicks', analytics.contactClicks.toString()],
        ['Portfolio Downloads', analytics.portfolioDownloads.toString()],
        ['Inquiries', analytics.inquiries.toString()],
        ['Conversion Rate', analytics.conversionRate.toString()],
      ];

      return csvRows.map(row => row.join(',')).join('\n');
    }
  }
}