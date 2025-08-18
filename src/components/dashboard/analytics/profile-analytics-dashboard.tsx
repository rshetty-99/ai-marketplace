/**
 * Profile Analytics Dashboard Component
 * Comprehensive analytics visualization for profile performance
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProfileAnalytics, useAnalyticsDashboard } from '@/hooks/useProfileAnalytics';
import { cn } from '@/lib/utils';

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointerClick,
  Download,
  FileText,
  Calendar,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  ArrowUp,
  ArrowDown,
  Minus,
  Info,
  RefreshCw,
  ExternalLink,
  Share2,
  DollarSign,
  Target,
  Award,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface ProfileAnalyticsDashboardProps {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  className?: string;
}

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  cyan: '#06B6D4'
};

export function ProfileAnalyticsDashboard({
  profileId,
  userType,
  className
}: ProfileAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'engagement' | 'conversion'>('views');
  
  const { 
    analytics, 
    comparative,
    isLoading, 
    error,
    trackEvent,
    refreshAnalytics 
  } = useProfileAnalytics({
    profileId,
    userType,
    autoTrack: false
  });

  const { 
    report,
    generateReport,
    exportAnalytics,
    isGenerating 
  } = useAnalyticsDashboard(profileId);

  // Generate report on mount and time range change
  useEffect(() => {
    const now = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }

    generateReport({ start, end: now });
  }, [timeRange, generateReport]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!analytics) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>No analytics data available yet. Start promoting your profile to see metrics!</AlertDescription>
      </Alert>
    );
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatPercentage = (value: number) => {
    const formatted = value.toFixed(1);
    if (value > 0) return `+${formatted}%`;
    return `${formatted}%`;
  };

  // Prepare chart data
  const trafficData = Object.entries(analytics.trafficSources).map(([source, count]) => ({
    name: source.charAt(0).toUpperCase() + source.slice(1),
    value: count
  }));

  const deviceData = Object.entries(analytics.deviceBreakdown).map(([device, count]) => ({
    name: device.charAt(0).toUpperCase() + device.slice(1),
    value: count
  }));

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profile Analytics</h2>
          <p className="text-gray-600">Track your profile performance and optimize for better results</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={refreshAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button variant="outline" size="sm" onClick={() => exportAnalytics('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.uniqueViews} unique visitors
                </p>
              </div>
              <div className="flex items-center text-sm">
                {getTrendIcon(report?.trends.viewsTrend || 'stable')}
                <span className={cn(
                  'ml-1',
                  analytics.viewsVsPrevWeek > 0 ? 'text-green-600' : 
                  analytics.viewsVsPrevWeek < 0 ? 'text-red-600' : 'text-gray-600'
                )}>
                  {formatPercentage(analytics.viewsVsPrevWeek)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Engagement Rate</CardTitle>
              <MousePointerClick className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {((analytics.contactClicks / analytics.totalViews) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.contactClicks} interactions
                </p>
              </div>
              <div className="flex items-center text-sm">
                {getTrendIcon(report?.trends.engagementTrend || 'stable')}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.inquiries} inquiries
                </p>
              </div>
              <div className="flex items-center text-sm">
                {getTrendIcon(report?.trends.conversionTrend || 'stable')}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Avg. Duration</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {Math.floor(analytics.avgViewDuration / 60)}:{(analytics.avgViewDuration % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.bounceRate.toFixed(1)}% bounce rate
                </p>
              </div>
              <div className="flex items-center text-sm">
                {analytics.avgViewDuration > 120 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Comparison */}
      {comparative && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Performance Comparison
            </CardTitle>
            <CardDescription>How you compare to others in your category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Your Percentile Ranking</span>
                  <Badge variant={comparative.percentile > 75 ? 'default' : 'secondary'}>
                    Top {100 - comparative.percentile}%
                  </Badge>
                </div>
                <Progress value={comparative.percentile} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Your Views</p>
                  <p className="text-xl font-bold">{analytics.totalViews}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Industry Average</p>
                  <p className="text-xl font-bold">{comparative.avgIndustryViews}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>Where your visitors come from</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={trafficData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {trafficData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Breakdown</CardTitle>
              <CardDescription>Devices used to view your profile</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deviceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip />
                  <Bar dataKey="value" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Desktop</p>
                    <p className="text-2xl font-bold">{analytics.deviceBreakdown.desktop}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Mobile</p>
                    <p className="text-2xl font-bold">{analytics.deviceBreakdown.mobile}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tablet className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Tablet</p>
                    <p className="text-2xl font-bold">{analytics.deviceBreakdown.tablet}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Where your visitors are located</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topCountries.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topCountries.slice(0, 5).map((country, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{country.country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{country.views} views</span>
                        <Progress 
                          value={(country.views / analytics.totalViews) * 100} 
                          className="w-24 h-2" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No geographic data available yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>AI-powered recommendations to improve your profile</CardDescription>
            </CardHeader>
            <CardContent>
              {report && (
                <div className="space-y-6">
                  {/* Insights */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Key Insights
                    </h4>
                    <div className="space-y-2">
                      {report.insights.map((insight: string, index: number) => (
                        <Alert key={index}>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>{insight}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Recommendations
                    </h4>
                    <div className="space-y-2">
                      {report.recommendations.map((rec: string, index: number) => (
                        <Alert key={index} className="border-orange-200 bg-orange-50">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <AlertDescription>{rec}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}