/**
 * Profile Completion Widget
 * Shows profile completion status with actionable suggestions
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useProfileOptimization } from '@/hooks/useProfileOptimization';
import { useProfilePermissions } from '@/hooks/useProfilePermissions';
import { PermissionGuard } from '@/components/profile/permission-guard';
import { cn } from '@/lib/utils';

import {
  Target,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Zap,
  TrendingUp,
  User,
  Edit3,
  Plus
} from 'lucide-react';

interface ProfileCompletionWidgetProps {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  variant?: 'compact' | 'detailed';
  className?: string;
}

export function ProfileCompletionWidget({
  profileId,
  userType,
  variant = 'compact',
  className
}: ProfileCompletionWidgetProps) {
  const { optimization, isLoading } = useProfileOptimization({
    profileId,
    userType,
    autoAnalyze: true
  });

  const { canEdit, canAccessOptimization } = useProfilePermissions({ profileId });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!optimization) {
    return (
      <Card className={className}>
        <CardContent className="p-4 text-center">
          <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Unable to load profile data</p>
          <Button size="sm" variant="outline" className="mt-2">
            <Edit3 className="h-3 w-3 mr-1" />
            Edit Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  const completionScore = optimization.completionScore;
  const overallScore = optimization.overallScore;
  const urgentSuggestions = optimization.suggestions.filter(s => 
    s.priority === 'critical' || s.priority === 'high'
  ).slice(0, 3);

  const getCompletionColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <Target className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  if (variant === 'compact') {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {getScoreIcon(completionScore)}
              Profile Status
            </CardTitle>
            <Badge variant={completionScore >= 80 ? "default" : "secondary"}>
              {completionScore}% Complete
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={completionScore} 
              className={cn(
                "h-2 transition-all",
                completionScore >= 80 ? "text-green-600" : 
                completionScore >= 60 ? "text-yellow-600" : "text-red-600"
              )}
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>Profile Completion</span>
              <span>Overall Score: {overallScore}/100</span>
            </div>
          </div>

          {/* Quick Action */}
          {urgentSuggestions.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-orange-900">
                    {urgentSuggestions.length} improvement{urgentSuggestions.length !== 1 ? 's' : ''} needed
                  </p>
                  <p className="text-xs text-orange-700 truncate">
                    {urgentSuggestions[0]?.title}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <PermissionGuard requireOwnership>
              <Link href="/dashboard/profile/edit" className="flex-1">
                <Button size="sm" variant="outline" className="w-full">
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit Profile
                </Button>
              </Link>
            </PermissionGuard>
            
            <PermissionGuard feature="canAccessOptimization">
              <Link href="/dashboard/profile/optimization">
                <Button size="sm" className="flex-shrink-0">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Optimize
                </Button>
              </Link>
            </PermissionGuard>
          </div>
        </CardContent>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500 opacity-5 rounded-full" />
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getScoreIcon(completionScore)}
            Profile Completion
          </CardTitle>
          <div className="text-right">
            <div className={cn("text-2xl font-bold", getCompletionColor(completionScore))}>
              {completionScore}%
            </div>
            <div className="text-xs text-gray-600">
              Overall: {overallScore}/100
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Detailed Progress */}
        <div className="space-y-3">
          <Progress value={completionScore} className="h-3" />
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">Quality</span>
                <span className={getCompletionColor(optimization.qualityScore)}>
                  {optimization.qualityScore}%
                </span>
              </div>
              <Progress value={optimization.qualityScore} className="h-1" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">SEO</span>
                <span className={getCompletionColor(optimization.seoScore)}>
                  {optimization.seoScore}%
                </span>
              </div>
              <Progress value={optimization.seoScore} className="h-1" />
            </div>
          </div>
        </div>

        {/* Top Suggestions */}
        {urgentSuggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Priority Actions</h4>
            {urgentSuggestions.map((suggestion, index) => (
              <div key={suggestion.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                <div className="flex-shrink-0 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{suggestion.title}</p>
                  <p className="text-xs text-gray-600">{suggestion.expectedImprovement}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Next Steps */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <PermissionGuard requireOwnership>
              <Link href="/dashboard/profile/edit">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Edit3 className="h-3 w-3 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </PermissionGuard>

            <PermissionGuard feature="canAccessOptimization">
              <Link href="/dashboard/profile/optimization">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <TrendingUp className="h-3 w-3 mr-2" />
                  Optimize
                </Button>
              </Link>
            </PermissionGuard>

            <PermissionGuard requireOwnership>
              <Link href="/dashboard/profile/branding">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Zap className="h-3 w-3 mr-2" />
                  Customize
                </Button>
              </Link>
            </PermissionGuard>

            <PermissionGuard requireOwnership>
              <Link href="/dashboard/profile/analytics">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <TrendingUp className="h-3 w-3 mr-2" />
                  Analytics
                </Button>
              </Link>
            </PermissionGuard>
          </div>
        </div>

        {/* See All Link */}
        <div className="pt-2 border-t">
          <PermissionGuard feature="canAccessOptimization">
            <Link href="/dashboard/profile/optimization">
              <Button variant="ghost" size="sm" className="w-full justify-center">
                View All Suggestions
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </PermissionGuard>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact Profile Status Badge
 * For use in headers or minimal spaces
 */
interface ProfileStatusBadgeProps {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  className?: string;
}

export function ProfileStatusBadge({
  profileId,
  userType,
  className
}: ProfileStatusBadgeProps) {
  const { optimization, isLoading } = useProfileOptimization({
    profileId,
    userType,
    autoAnalyze: true
  });

  if (isLoading) {
    return (
      <div className={cn("animate-pulse h-6 w-16 bg-gray-200 rounded", className)} />
    );
  }

  if (!optimization) return null;

  const completionScore = optimization.completionScore;
  const hasUrgentIssues = optimization.suggestions.some(s => s.priority === 'critical');

  const getVariant = () => {
    if (hasUrgentIssues) return 'destructive';
    if (completionScore >= 80) return 'default';
    if (completionScore >= 60) return 'secondary';
    return 'outline';
  };

  return (
    <Badge variant={getVariant()} className={className}>
      {hasUrgentIssues && <AlertCircle className="h-3 w-3 mr-1" />}
      {completionScore >= 80 && <CheckCircle className="h-3 w-3 mr-1" />}
      {completionScore}% Complete
    </Badge>
  );
}