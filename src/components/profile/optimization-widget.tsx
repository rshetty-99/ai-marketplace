/**
 * Profile Optimization Widget
 * Compact widget showing optimization status and quick actions
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useProfileOptimization } from '@/hooks/useProfileOptimization';
import { cn } from '@/lib/utils';

import {
  Target,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Trophy,
  AlertCircle,
  CheckCircle,
  Zap
} from 'lucide-react';

interface OptimizationWidgetProps {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  variant?: 'compact' | 'detailed';
  className?: string;
}

export function OptimizationWidget({
  profileId,
  userType,
  variant = 'compact',
  className
}: OptimizationWidgetProps) {
  const { optimization, isLoading, getProgressMetrics } = useProfileOptimization({
    profileId,
    userType,
    autoAnalyze: true
  });

  const progressMetrics = getProgressMetrics();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!optimization) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Trophy className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <Target className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const urgentSuggestions = optimization.suggestions.filter(s => 
    s.priority === 'critical' || s.priority === 'high'
  );

  const nextSuggestion = optimization.suggestions[0];

  if (variant === 'compact') {
    return (
      <Card className={cn("border-l-4 border-blue-500", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getScoreIcon(optimization.overallScore)}
              <span className="font-medium text-sm">Profile Score</span>
            </div>
            <span className={cn("text-xl font-bold", getScoreColor(optimization.overallScore))}>
              {optimization.overallScore}
            </span>
          </div>

          {progressMetrics && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Progress</span>
                <span className="text-gray-600">
                  {progressMetrics.completedSuggestions}/{progressMetrics.totalSuggestions}
                </span>
              </div>
              <Progress value={progressMetrics.progressPercentage} className="h-1.5" />
            </div>
          )}

          {urgentSuggestions.length > 0 && (
            <div className="mt-3 p-2 bg-orange-50 rounded border-l-2 border-orange-300">
              <div className="flex items-center gap-1 mb-1">
                <Zap className="h-3 w-3 text-orange-500" />
                <span className="text-xs font-medium text-orange-700">
                  {urgentSuggestions.length} urgent improvement{urgentSuggestions.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-orange-600">
                {nextSuggestion?.title}
              </p>
            </div>
          )}

          <Link href="/dashboard/profile/optimization">
            <Button variant="outline" size="sm" className="w-full mt-3">
              <Sparkles className="h-3 w-3 mr-1" />
              Optimize Profile
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-blue-500" />
          Profile Optimization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className={cn("text-2xl font-bold", getScoreColor(optimization.overallScore))}>
              {optimization.overallScore}
            </div>
            <p className="text-xs text-gray-600">Overall Score</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">
              {optimization.suggestions.length}
            </div>
            <p className="text-xs text-gray-600">Suggestions</p>
          </div>
        </div>

        {/* Progress */}
        {progressMetrics && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completion Progress</span>
              <span className="text-sm text-gray-600">
                {progressMetrics.progressPercentage}%
              </span>
            </div>
            <Progress value={progressMetrics.progressPercentage} className="h-2" />
            <p className="text-xs text-gray-600">
              {progressMetrics.completedSuggestions} of {progressMetrics.totalSuggestions} completed
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Quick Actions</h4>
          
          {optimization.nextSteps.slice(0, 2).map((step, index) => (
            <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
              <div className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <p className="text-xs text-blue-700">{step}</p>
            </div>
          ))}
        </div>

        {/* Priority Badges */}
        <div className="flex flex-wrap gap-1">
          {urgentSuggestions.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {urgentSuggestions.filter(s => s.priority === 'critical').length} Critical
            </Badge>
          )}
          {optimization.suggestions.filter(s => s.priority === 'high').length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {optimization.suggestions.filter(s => s.priority === 'high').length} High Priority
            </Badge>
          )}
          {optimization.suggestions.filter(s => s.priority === 'medium').length > 0 && (
            <Badge variant="outline" className="text-xs">
              {optimization.suggestions.filter(s => s.priority === 'medium').length} Medium
            </Badge>
          )}
        </div>

        {/* Action Button */}
        <Link href="/dashboard/profile/optimization">
          <Button className="w-full">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Full Optimization
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

/**
 * Optimization Alert Banner
 * Shows when profile needs immediate attention
 */
interface OptimizationAlertProps {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  className?: string;
}

export function OptimizationAlert({
  profileId,
  userType,
  className
}: OptimizationAlertProps) {
  const { optimization } = useProfileOptimization({
    profileId,
    userType,
    autoAnalyze: true
  });

  if (!optimization) return null;

  const criticalSuggestions = optimization.suggestions.filter(s => s.priority === 'critical');
  
  // Only show if there are critical issues or score is very low
  if (criticalSuggestions.length === 0 && optimization.overallScore >= 50) {
    return null;
  }

  return (
    <div className={cn("bg-red-50 border border-red-200 rounded-lg p-4", className)}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-red-900 mb-1">
            Profile Needs Attention
          </h4>
          <p className="text-sm text-red-700 mb-3">
            {optimization.overallScore < 50 
              ? `Your profile score is ${optimization.overallScore}/100. Complete your profile to attract more clients.`
              : `You have ${criticalSuggestions.length} critical issue${criticalSuggestions.length !== 1 ? 's' : ''} that need immediate attention.`
            }
          </p>
          <Link href="/dashboard/profile/optimization">
            <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-100">
              Fix Issues
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Optimization Success Banner
 * Shows when profile is well optimized
 */
export function OptimizationSuccess({
  profileId,
  userType,
  className
}: OptimizationAlertProps) {
  const { optimization } = useProfileOptimization({
    profileId,
    userType,
    autoAnalyze: true
  });

  if (!optimization || optimization.overallScore < 80) return null;

  return (
    <div className={cn("bg-green-50 border border-green-200 rounded-lg p-4", className)}>
      <div className="flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-green-900 mb-1">
            Great Job! Your Profile is Optimized
          </h4>
          <p className="text-sm text-green-700 mb-3">
            Your profile score is {optimization.overallScore}/100. You're ahead of most {userType}s in your industry!
          </p>
          {optimization.suggestions.length > 0 && (
            <Link href="/dashboard/profile/optimization">
              <Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-100">
                View {optimization.suggestions.length} More Suggestions
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}