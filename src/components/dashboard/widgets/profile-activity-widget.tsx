/**
 * Profile Activity Widget
 * Shows recent profile activities and engagement
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfileAnalytics } from '@/hooks/useProfileAnalytics';
import { useProfilePermissions } from '@/hooks/useProfilePermissions';
import { PermissionGuard } from '@/components/profile/permission-guard';
import { cn } from '@/lib/utils';

import {
  Activity,
  Eye,
  MessageSquare,
  Download,
  Heart,
  Share2,
  Clock,
  MapPin,
  Globe,
  ArrowRight,
  TrendingUp,
  Users,
  Calendar,
  ExternalLink,
  Phone,
  Mail,
  Star,
  Bookmark
} from 'lucide-react';

interface ProfileActivityWidgetProps {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  variant?: 'compact' | 'detailed';
  className?: string;
}

interface ActivityItem {
  id: string;
  type: 'view' | 'contact' | 'download' | 'share' | 'bookmark' | 'follow';
  timestamp: Date;
  user?: {
    name: string;
    avatar?: string;
    location?: string;
    company?: string;
  };
  metadata?: {
    source?: string;
    device?: string;
    duration?: number;
    method?: string;
  };
}

export function ProfileActivityWidget({
  profileId,
  userType,
  variant = 'compact',
  className
}: ProfileActivityWidgetProps) {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('week');
  
  const { analytics, recentActivity, isLoading } = useProfileAnalytics({
    profileId,
    userType,
    includeActivity: true
  });

  const { canAccessAnalytics } = useProfilePermissions({ profileId });

  // Mock recent activity data (in real app, this would come from the analytics service)
  const mockRecentActivity: ActivityItem[] = [
    {
      id: '1',
      type: 'contact',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      user: {
        name: 'Sarah Chen',
        avatar: '/avatars/sarah.jpg',
        location: 'San Francisco, CA',
        company: 'TechCorp'
      },
      metadata: { method: 'email' }
    },
    {
      id: '2',
      type: 'view',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      user: {
        name: 'Michael Rodriguez',
        avatar: '/avatars/michael.jpg',
        location: 'Austin, TX'
      },
      metadata: { duration: 180, source: 'google' }
    },
    {
      id: '3',
      type: 'download',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      user: {
        name: 'Emma Thompson',
        location: 'London, UK',
        company: 'Design Studio'
      },
      metadata: { method: 'portfolio' }
    },
    {
      id: '4',
      type: 'bookmark',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      user: {
        name: 'Alex Kumar',
        location: 'Mumbai, India'
      }
    },
    {
      id: '5',
      type: 'view',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
      user: {
        name: 'Jessica Martinez',
        location: 'Mexico City, MX',
        company: 'StartupXYZ'
      },
      metadata: { duration: 120, source: 'linkedin' }
    }
  ];

  const activities = recentActivity || mockRecentActivity;

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
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'view':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'contact':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'download':
        return <Download className="h-4 w-4 text-purple-500" />;
      case 'share':
        return <Share2 className="h-4 w-4 text-orange-500" />;
      case 'bookmark':
        return <Bookmark className="h-4 w-4 text-yellow-500" />;
      case 'follow':
        return <Heart className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'view':
        return 'Viewed your profile';
      case 'contact':
        return 'Contacted you';
      case 'download':
        return 'Downloaded your portfolio';
      case 'share':
        return 'Shared your profile';
      case 'bookmark':
        return 'Bookmarked your profile';
      case 'follow':
        return 'Started following you';
      default:
        return 'Interacted with your profile';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const todayCount = activities.filter(a => {
    const today = new Date();
    return a.timestamp.toDateString() === today.toDateString();
  }).length;

  if (variant === 'compact') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Recent Activity
            </CardTitle>
            <Badge variant="outline">
              {todayCount} today
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {activities.filter(a => a.type === 'view').length}
              </div>
              <div className="text-xs text-gray-600">Views</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {activities.filter(a => a.type === 'contact').length}
              </div>
              <div className="text-xs text-gray-600">Contacts</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {activities.filter(a => a.type === 'download').length}
              </div>
              <div className="text-xs text-gray-600">Downloads</div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Latest Interactions</h4>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {activities.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.user?.name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {getActivityLabel(activity.type)}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* View All Link */}
          <Link href="/dashboard/analytics">
            <Button variant="outline" size="sm" className="w-full">
              <Activity className="h-3 w-3 mr-2" />
              View All Activity
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
            <Activity className="h-5 w-5 text-blue-500" />
            Profile Activity
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {activities.length} interactions
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {todayCount} today
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Activity Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Eye className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">
              {activities.filter(a => a.type === 'view').length}
            </div>
            <div className="text-xs text-blue-700">Profile Views</div>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg">
            <MessageSquare className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">
              {activities.filter(a => a.type === 'contact').length}
            </div>
            <div className="text-xs text-green-700">Contact Attempts</div>
          </div>

          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <Download className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">
              {activities.filter(a => a.type === 'download').length}
            </div>
            <div className="text-xs text-purple-700">Downloads</div>
          </div>

          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <Bookmark className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-600">
              {activities.filter(a => a.type === 'bookmark').length}
            </div>
            <div className="text-xs text-yellow-700">Bookmarks</div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Recent Interactions</h4>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/analytics">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>

          <ScrollArea className="h-64">
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={activity.user?.avatar} />
                    <AvatarFallback>
                      {activity.user?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getActivityIcon(activity.type)}
                      <p className="text-sm font-medium">
                        {activity.user?.name || 'Anonymous user'}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {getActivityLabel(activity.type)}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {activity.user?.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {activity.user.location}
                        </div>
                      )}
                      
                      {activity.user?.company && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {activity.user.company}
                        </div>
                      )}

                      {activity.metadata?.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.metadata.duration}s
                        </div>
                      )}

                      {activity.metadata?.source && (
                        <div className="flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          {activity.metadata.source}
                        </div>
                      )}

                      {activity.metadata?.method && (
                        <div className="flex items-center gap-1">
                          {activity.metadata.method === 'email' ? (
                            <Mail className="h-3 w-3" />
                          ) : activity.metadata.method === 'phone' ? (
                            <Phone className="h-3 w-3" />
                          ) : (
                            <MessageSquare className="h-3 w-3" />
                          )}
                          {activity.metadata.method}
                        </div>
                      )}
                    </div>
                  </div>

                  {activity.type === 'contact' && (
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Insights */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                {todayCount > 0 ? 'Great activity today!' : 'Quiet day so far'}
              </p>
              <p className="text-xs text-blue-700">
                {todayCount > 0 
                  ? `${todayCount} interaction${todayCount !== 1 ? 's' : ''} today. Keep up the momentum!`
                  : 'Consider sharing your profile to increase visibility.'
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Activity Summary for quick overview
 */
interface ActivitySummaryProps {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  className?: string;
}

export function ActivitySummary({
  profileId,
  userType,
  className
}: ActivitySummaryProps) {
  const { analytics } = useProfileAnalytics({
    profileId,
    userType,
    timeframe: '7d'
  });

  if (!analytics) return null;

  return (
    <div className={cn("flex items-center gap-4 text-sm", className)}>
      <div className="flex items-center gap-1">
        <Activity className="h-3 w-3 text-blue-500" />
        <span className="text-gray-600">Active</span>
      </div>
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3 text-green-500" />
        <span className="text-gray-600">Online</span>
      </div>
      <div className="flex items-center gap-1">
        <TrendingUp className="h-3 w-3 text-purple-500" />
        <span className="text-gray-600">Growing</span>
      </div>
    </div>
  );
}