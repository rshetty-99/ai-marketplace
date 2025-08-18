/**
 * Profile Analytics Widget
 * Shows key profile performance metrics
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfileAnalytics } from '@/hooks/useProfileAnalytics';
import { useProfilePermissions } from '@/hooks/useProfilePermissions';
import { PermissionGuard } from '@/components/profile/permission-guard';
import { cn } from '@/lib/utils';

import {
  Eye,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  ArrowRight,
  Calendar,
  Target,
  BarChart3,
  Activity,
  Phone,
  Mail,
  ExternalLink,
  Zap
} from 'lucide-react';

interface ProfileAnalyticsWidgetProps {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  variant?: 'compact' | 'detailed' | 'mini';
  timeframe?: '7d' | '30d' | '90d';
  className?: string;
}

export function ProfileAnalyticsWidget({
  profileId,
  userType,
  variant = 'compact',
  timeframe = '30d',
  className
}: ProfileAnalyticsWidgetProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  
  const { analytics, isLoading } = useProfileAnalytics({
    profileId,
    userType,
    timeframe: selectedTimeframe
  });

  const { canAccessAnalytics } = useProfilePermissions({ profileId });

  if (!canAccessAnalytics) {
    return (
      <PermissionGuard 
        feature="canAccessAnalytics" 
        className={className}
        showFallback={true}
      >
        <div></div>
      </PermissionGuard>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className={className}>
        <CardContent className="p-4 text-center">
          <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">No analytics data available</p>
          <p className="text-xs text-gray-500">Publish your profile to start tracking analytics</p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Activity className="h-3 w-3 text-gray-500" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatTrend = (trend: number) => {
    const sign = trend > 0 ? '+' : '';
    return `${sign}${trend.toFixed(1)}%`;
  };

  if (variant === 'mini') {
    return (
      <Card className={cn("p-3", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Profile Views</span>
          </div>
          <div className="text-right">
            <div className="font-bold">{analytics.totalViews}</div>
            <div className={cn("text-xs flex items-center", getTrendColor(analytics.viewsTrend))}>
              {getTrendIcon(analytics.viewsTrend)}
              <span className="ml-1">{formatTrend(analytics.viewsTrend)}</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Analytics
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              Last {selectedTimeframe === '7d' ? '7 days' : selectedTimeframe === '30d' ? '30 days' : '90 days'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600">Views</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{analytics.totalViews}</span>
                <div className={cn("text-xs flex items-center", getTrendColor(analytics.viewsTrend))}>
                  {getTrendIcon(analytics.viewsTrend)}
                  <span className="ml-1">{formatTrend(analytics.viewsTrend)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600">Contacts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{analytics.totalContacts}</span>
                <div className={cn("text-xs flex items-center", getTrendColor(analytics.contactsTrend))}>
                  {getTrendIcon(analytics.contactsTrend)}
                  <span className="ml-1">{formatTrend(analytics.contactsTrend)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Conversion Rate</span>
              <span className="text-lg font-bold text-purple-600">
                {analytics.conversionRate.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(analytics.conversionRate, 100)}%` }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">{analytics.uniqueViews}</div>
              <div className="text-xs text-gray-600">Unique Visitors</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{analytics.avgViewDuration}s</div>
              <div className="text-xs text-gray-600">Avg Duration</div>
            </div>
          </div>

          {/* Action Button */}
          <Link href="/dashboard/analytics">
            <Button variant="outline" size="sm" className="w-full">
              <BarChart3 className="h-3 w-3 mr-2" />
              View Full Analytics
              <ArrowRight className="h-3 w-3 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Profile Analytics
          </CardTitle>
          <Tabs value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <TabsList className="h-8">
              <TabsTrigger value="7d" className="text-xs">7d</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs">30d</TabsTrigger>
              <TabsTrigger value="90d" className="text-xs">90d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overview Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Eye className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{analytics.totalViews}</div>
            <div className="text-xs text-blue-700">Total Views</div>
            <div className={cn("text-xs flex items-center justify-center mt-1", getTrendColor(analytics.viewsTrend))}>
              {getTrendIcon(analytics.viewsTrend)}
              <span className="ml-1">{formatTrend(analytics.viewsTrend)}</span>
            </div>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg">
            <Users className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{analytics.uniqueViews}</div>
            <div className="text-xs text-green-700">Unique Visitors</div>
          </div>

          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <MessageSquare className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{analytics.totalContacts}</div>
            <div className="text-xs text-purple-700">Contacts</div>
            <div className={cn("text-xs flex items-center justify-center mt-1", getTrendColor(analytics.contactsTrend))}>
              {getTrendIcon(analytics.contactsTrend)}
              <span className="ml-1">{formatTrend(analytics.contactsTrend)}</span>
            </div>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <Target className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">{analytics.conversionRate.toFixed(1)}%</div>
            <div className="text-xs text-orange-700">Conversion</div>
          </div>
        </div>

        {/* Contact Methods Breakdown */}
        {analytics.contactMethods && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Contact Methods</h4>
            <div className="space-y-2">
              {Object.entries(analytics.contactMethods).map(([method, count]) => (
                <div key={method} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {method === 'email' && <Mail className="h-4 w-4 text-blue-500" />}
                    {method === 'phone' && <Phone className="h-4 w-4 text-green-500" />}
                    {method === 'message' && <MessageSquare className="h-4 w-4 text-purple-500" />}
                    <span className="text-sm capitalize">{method}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full"
                        style={{ width: `${(count / analytics.totalContacts) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Referrers */}
        {analytics.topReferrers && analytics.topReferrers.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Top Traffic Sources</h4>
            <div className="space-y-2">
              {analytics.topReferrers.slice(0, 3).map((referrer, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-3 w-3 text-gray-400" />
                    <span className="truncate">{referrer.source}</span>
                  </div>
                  <span className="font-medium">{referrer.views}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/analytics">
            <Button variant="outline" className="w-full">
              <BarChart3 className="h-4 w-4 mr-2" />
              Full Report
            </Button>
          </Link>
          <Link href="/dashboard/profile/optimization">
            <Button className="w-full">
              <Zap className="h-4 w-4 mr-2" />
              Improve Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Quick Analytics Summary for headers
 */
interface QuickAnalyticsSummaryProps {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  className?: string;
}

export function QuickAnalyticsSummary({
  profileId,
  userType,
  className
}: QuickAnalyticsSummaryProps) {
  const { analytics, isLoading } = useProfileAnalytics({
    profileId,
    userType,
    timeframe: '7d'
  });

  if (isLoading || !analytics) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-4 text-sm", className)}>
      <div className="flex items-center gap-1">
        <Eye className="h-3 w-3 text-blue-500" />
        <span className="text-gray-600">{analytics.totalViews}</span>
      </div>
      <div className="flex items-center gap-1">
        <MessageSquare className="h-3 w-3 text-green-500" />
        <span className="text-gray-600">{analytics.totalContacts}</span>
      </div>
      <div className="flex items-center gap-1">
        <Target className="h-3 w-3 text-purple-500" />
        <span className="text-gray-600">{analytics.conversionRate.toFixed(1)}%</span>
      </div>
    </div>
  );
}