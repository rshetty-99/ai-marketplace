/**
 * Profile Analytics Component
 * Comprehensive analytics dashboard for profile performance and optimization
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

import { 
  TrendingUp, 
  TrendingDown,
  Eye, 
  Users, 
  MessageSquare, 
  Star, 
  Clock,
  Calendar,
  Target,
  Award,
  Globe,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

import { useProfile } from '@/hooks/useProfile';

interface ProfileAnalyticsProps {
  className?: string;
}

interface AnalyticsData {
  profileViews: {
    total: number;
    thisWeek: number;
    lastWeek: number;
    trend: 'up' | 'down' | 'stable';
    dailyViews: Array<{ date: string; views: number }>;
  };
  engagement: {
    contactRequests: number;
    favoriteAdds: number;
    projectInquiries: number;
    responseRate: number;
    averageResponseTime: number; // in hours
  };
  profileHealth: {
    completionScore: number;
    seoScore: number;
    trustScore: number;
    visibilityScore: number;
    recommendations: Array<{
      type: 'critical' | 'important' | 'suggestion';
      title: string;
      description: string;
      action: string;
    }>;
  };
  performance: {
    searchRanking: number;
    categoryRanking: number;
    skillRanking: Array<{ skill: string; rank: number; trend: 'up' | 'down' | 'stable' }>;
    competitorAnalysis: {
      averagePrice: number;
      averageRating: number;
      averageProjects: number;
    };
  };
  traffic: {
    sources: Array<{ source: string; visits: number; percentage: number }>;
    geography: Array<{ country: string; visits: number; percentage: number }>;
    devices: Array<{ device: string; visits: number; percentage: number }>;
  };
}

// Mock data generator for demonstration
const generateMockAnalytics = (): AnalyticsData => {
  const dailyViews = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    views: Math.floor(Math.random() * 50) + 10
  }));

  return {
    profileViews: {
      total: 1247,
      thisWeek: 89,
      lastWeek: 76,
      trend: 'up',
      dailyViews
    },
    engagement: {
      contactRequests: 23,
      favoriteAdds: 45,
      projectInquiries: 12,
      responseRate: 92,
      averageResponseTime: 4.2
    },
    profileHealth: {
      completionScore: 85,
      seoScore: 78,
      trustScore: 91,
      visibilityScore: 73,
      recommendations: [
        {
          type: 'critical',
          title: 'Add Portfolio Projects',
          description: 'Your profile lacks portfolio projects which significantly impacts client trust',
          action: 'Add at least 3 portfolio projects'
        },
        {
          type: 'important',
          title: 'Improve SEO Keywords',
          description: 'Your profile description could include more relevant keywords',
          action: 'Update description with target keywords'
        },
        {
          type: 'suggestion',
          title: 'Add Client Testimonials',
          description: 'Testimonials increase conversion rates by 34%',
          action: 'Request testimonials from recent clients'
        }
      ]
    },
    performance: {
      searchRanking: 15,
      categoryRanking: 7,
      skillRanking: [
        { skill: 'React', rank: 3, trend: 'up' },
        { skill: 'Node.js', rank: 8, trend: 'stable' },
        { skill: 'TypeScript', rank: 12, trend: 'down' }
      ],
      competitorAnalysis: {
        averagePrice: 85,
        averageRating: 4.6,
        averageProjects: 23
      }
    },
    traffic: {
      sources: [
        { source: 'Direct', visits: 456, percentage: 45 },
        { source: 'Search', visits: 324, percentage: 32 },
        { source: 'Social', visits: 123, percentage: 12 },
        { source: 'Referral', visits: 112, percentage: 11 }
      ],
      geography: [
        { country: 'United States', visits: 567, percentage: 56 },
        { country: 'Canada', visits: 234, percentage: 23 },
        { country: 'United Kingdom', visits: 123, percentage: 12 },
        { country: 'Germany', visits: 91, percentage: 9 }
      ],
      devices: [
        { device: 'Desktop', visits: 678, percentage: 67 },
        { device: 'Mobile', visits: 234, percentage: 23 },
        { device: 'Tablet', visits: 103, percentage: 10 }
      ]
    }
  };
};

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

export function ProfileAnalytics({ className }: ProfileAnalyticsProps) {
  const { userProfile, isLoading } = useProfile();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // In a real implementation, this would fetch from your analytics service
    setAnalyticsData(generateMockAnalytics());
  }, [timeRange]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setAnalyticsData(generateMockAnalytics());
      setIsRefreshing(false);
    }, 1000);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const getRecommendationIcon = (type: 'critical' | 'important' | 'suggestion') => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'important':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Target className="h-4 w-4 text-blue-500" />;
    }
  };

  if (isLoading || !analyticsData) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-b-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profile Analytics</h2>
          <p className="text-muted-foreground">
            Track your profile performance and optimization opportunities
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Profile Views</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{analyticsData.profileViews.total.toLocaleString()}</p>
                      {getTrendIcon(analyticsData.profileViews.trend)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analyticsData.profileViews.thisWeek} this week
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contact Requests</p>
                    <p className="text-2xl font-bold">{analyticsData.engagement.contactRequests}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(analyticsData.engagement.responseRate)}% response rate
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Favorites</p>
                    <p className="text-2xl font-bold">{analyticsData.engagement.favoriteAdds}</p>
                    <p className="text-xs text-muted-foreground">
                      People who saved your profile
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Search Ranking</p>
                    <p className="text-2xl font-bold">#{analyticsData.performance.searchRanking}</p>
                    <p className="text-xs text-muted-foreground">
                      In your category
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Views Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Views Trend</CardTitle>
              <CardDescription>Daily profile views over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.profileViews.dailyViews}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value) => [value, 'Views']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="views" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Health Check */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Health Score</CardTitle>
              <CardDescription>Overall profile optimization status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion</span>
                    <span className="text-sm text-muted-foreground">{analyticsData.profileHealth.completionScore}%</span>
                  </div>
                  <Progress value={analyticsData.profileHealth.completionScore} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">SEO</span>
                    <span className="text-sm text-muted-foreground">{analyticsData.profileHealth.seoScore}%</span>
                  </div>
                  <Progress value={analyticsData.profileHealth.seoScore} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Trust</span>
                    <span className="text-sm text-muted-foreground">{analyticsData.profileHealth.trustScore}%</span>
                  </div>
                  <Progress value={analyticsData.profileHealth.trustScore} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Visibility</span>
                    <span className="text-sm text-muted-foreground">{analyticsData.profileHealth.visibilityScore}%</span>
                  </div>
                  <Progress value={analyticsData.profileHealth.visibilityScore} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Traffic Tab */}
        <TabsContent value="traffic" className="space-y-6">
          
          <div className="grid grid-cols-3 gap-6">
            {/* Traffic Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.traffic.sources}
                        dataKey="visits"
                        nameKey="source"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({source, percentage}) => `${source}: ${percentage}%`}
                      >
                        {analyticsData.traffic.sources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.traffic.geography.map((geo, index) => (
                    <div key={geo.country} className="flex items-center justify-between">
                      <span className="text-sm">{geo.country}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={geo.percentage} className="w-20 h-2" />
                        <span className="text-xs text-muted-foreground w-8">{geo.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Device Types */}
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.traffic.devices.map((device, index) => (
                    <div key={device.device} className="flex items-center justify-between">
                      <span className="text-sm">{device.device}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={device.percentage} className="w-20 h-2" />
                        <span className="text-xs text-muted-foreground w-8">{device.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <span>Contact Requests</span>
                  </div>
                  <span className="font-semibold">{analyticsData.engagement.contactRequests}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>Profile Favorites</span>
                  </div>
                  <span className="font-semibold">{analyticsData.engagement.favoriteAdds}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-green-500" />
                    <span>Project Inquiries</span>
                  </div>
                  <span className="font-semibold">{analyticsData.engagement.projectInquiries}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-purple-500" />
                    <span>Avg Response Time</span>
                  </div>
                  <span className="font-semibold">{analyticsData.engagement.averageResponseTime}h</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Rate</CardTitle>
                <CardDescription>Your response rate to client inquiries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-green-600">
                    {analyticsData.engagement.responseRate}%
                  </div>
                  <Progress value={analyticsData.engagement.responseRate} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {analyticsData.engagement.responseRate >= 90 ? 'Excellent' : 
                     analyticsData.engagement.responseRate >= 80 ? 'Good' : 'Needs Improvement'} response rate
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Rankings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Overall Search Ranking</span>
                  <Badge variant="outline">#{analyticsData.performance.searchRanking}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Category Ranking</span>
                  <Badge variant="outline">#{analyticsData.performance.categoryRanking}</Badge>
                </div>
                
                <Separator />
                
                <h4 className="font-medium">Skill Rankings</h4>
                {analyticsData.performance.skillRanking.map((skill) => (
                  <div key={skill.skill} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{skill.skill}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{skill.rank}</Badge>
                      {getTrendIcon(skill.trend)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Competitor Analysis</CardTitle>
                <CardDescription>How you compare to similar profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Hourly Rate</span>
                    <span className="font-semibold">${analyticsData.performance.competitorAnalysis.averagePrice}/hr</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{analyticsData.performance.competitorAnalysis.averageRating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Projects</span>
                    <span className="font-semibold">{analyticsData.performance.competitorAnalysis.averageProjects}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-6">
          
          {/* Health Scores */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Profile Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.profileHealth.completionScore}%</div>
                <Progress value={analyticsData.profileHealth.completionScore} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">SEO Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.profileHealth.seoScore}%</div>
                <Progress value={analyticsData.profileHealth.seoScore} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Trust Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.profileHealth.trustScore}%</div>
                <Progress value={analyticsData.profileHealth.trustScore} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Visibility Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.profileHealth.visibilityScore}%</div>
                <Progress value={analyticsData.profileHealth.visibilityScore} className="h-2 mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
              <CardDescription>
                Action items to improve your profile performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.profileHealth.recommendations.map((recommendation, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      {getRecommendationIcon(recommendation.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{recommendation.title}</h4>
                          <Badge 
                            variant={
                              recommendation.type === 'critical' ? 'destructive' :
                              recommendation.type === 'important' ? 'default' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {recommendation.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {recommendation.description}
                        </p>
                        <Button size="sm" variant="outline">
                          {recommendation.action}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProfileAnalytics;