/**
 * Profile View Tracker Component
 * Invisible component that tracks profile views
 */

'use client';

import { useEffect, useRef } from 'react';
import { useProfileAnalytics } from '@/hooks/useProfileAnalytics';
import { ProfileView } from '@/lib/analytics/profile-analytics-service';

interface ProfileViewTrackerProps {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  isOwner?: boolean; // Don't track if owner is viewing their own profile
  metadata?: Partial<ProfileView>;
}

export function ProfileViewTracker({
  profileId,
  userType,
  isOwner = false,
  metadata
}: ProfileViewTrackerProps) {
  const hasTracked = useRef(false);
  const startTime = useRef(Date.now());
  
  const { trackView, trackEvent } = useProfileAnalytics({
    profileId,
    userType,
    autoTrack: false // We'll track manually
  });

  // Track view on mount
  useEffect(() => {
    // Don't track if owner is viewing their own profile
    if (isOwner || hasTracked.current) return;

    // Track the view
    trackView({
      ...metadata,
      timestamp: new Date()
    });

    hasTracked.current = true;

    // Track duration when user leaves
    const handleUnload = () => {
      const duration = Math.floor((Date.now() - startTime.current) / 1000);
      
      // Send duration as a beacon (works even when page is closing)
      if (navigator.sendBeacon) {
        const data = JSON.stringify({
          profileId,
          eventType: 'view',
          metadata: { duration }
        });
        
        navigator.sendBeacon('/api/analytics/track', data);
      }
    };

    // Track when user leaves the page
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [profileId, userType, isOwner, trackView, metadata]);

  // Track specific interactions
  useEffect(() => {
    if (isOwner) return;

    const handleContactClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if clicked on contact button or link
      if (target.closest('[data-track="contact"]')) {
        trackEvent('contact', {
          element: target.getAttribute('data-track-label') || 'unknown'
        });
      }
      
      // Check if clicked on portfolio download
      if (target.closest('[data-track="download"]')) {
        trackEvent('download', {
          element: target.getAttribute('data-track-label') || 'portfolio'
        });
      }
      
      // Check if clicked on social link
      if (target.closest('[data-track="social"]')) {
        trackEvent('share', {
          platform: target.getAttribute('data-track-platform') || 'unknown'
        });
      }
    };

    document.addEventListener('click', handleContactClick);
    
    return () => {
      document.removeEventListener('click', handleContactClick);
    };
  }, [isOwner, trackEvent]);

  // This component doesn't render anything visible
  return null;
}

/**
 * Mini Analytics Display for Profile Owners
 * Shows basic stats on the profile page for owners
 */
interface ProfileAnalyticsWidgetProps {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  className?: string;
}

export function ProfileAnalyticsWidget({
  profileId,
  userType,
  className
}: ProfileAnalyticsWidgetProps) {
  const { analytics } = useProfileAnalytics({
    profileId,
    userType,
    autoTrack: false
  });

  if (!analytics) return null;

  return (
    <div className={className}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-blue-900">Profile Analytics</h4>
          <Link href="/dashboard/analytics">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              View Details →
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-900">{analytics.totalViews}</p>
            <p className="text-xs text-blue-700">Total Views</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-900">{analytics.uniqueViews}</p>
            <p className="text-xs text-blue-700">Unique Visitors</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-900">
              {analytics.conversionRate.toFixed(1)}%
            </p>
            <p className="text-xs text-blue-700">Conversion</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Button } from '@/components/ui/button';