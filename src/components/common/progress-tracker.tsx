'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Target,
  TrendingUp,
  Calendar,
  Award,
  Star,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Users,
  Settings
} from 'lucide-react';
import { useAnalytics } from '@/components/providers/analytics-provider';

export interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
  category: 'onboarding' | 'verification' | 'setup' | 'training';
  priority: 'high' | 'medium' | 'low';
  estimatedTime?: string;
  dependencies?: string[];
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface ProgressTrackerProps {
  userId: string;
  userType: 'freelancer' | 'vendor' | 'customer';
  steps: ProgressStep[];
  onStepClick: (stepId: string) => void;
  onRefresh?: () => void;
  showCategories?: boolean;
  showTimeline?: boolean;
  compactView?: boolean;
}

interface ProgressMetrics {
  totalSteps: number;
  completedSteps: number;
  inProgressSteps: number;
  blockedSteps: number;
  completionPercentage: number;
  estimatedTimeRemaining: string;
  averageStepTime: number;
}

export function ProgressTracker({
  userId,
  userType,
  steps,
  onStepClick,
  onRefresh,
  showCategories = true,
  showTimeline = false,
  compactView = false
}: ProgressTrackerProps) {
  const { trackEvent } = useAnalytics();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const metrics: ProgressMetrics = {
    totalSteps: steps.length,
    completedSteps: steps.filter(s => s.status === 'completed').length,
    inProgressSteps: steps.filter(s => s.status === 'in_progress').length,
    blockedSteps: steps.filter(s => s.status === 'blocked').length,
    completionPercentage: steps.length > 0 ? Math.round((steps.filter(s => s.status === 'completed').length / steps.length) * 100) : 0,
    estimatedTimeRemaining: calculateEstimatedTime(steps),
    averageStepTime: calculateAverageStepTime(steps)
  };

  useEffect(() => {
    trackEvent('progress_tracker_viewed', {
      userId,
      userType,
      totalSteps: metrics.totalSteps,
      completionPercentage: metrics.completionPercentage
    });
  }, [userId, userType, metrics.totalSteps, metrics.completionPercentage]);

  const categories = showCategories ? [...new Set(steps.map(s => s.category))] : [];
  const filteredSteps = selectedCategory 
    ? steps.filter(s => s.category === selectedCategory)
    : steps;

  const getStatusIcon = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'blocked': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'skipped': return <Target className="w-4 h-4 text-gray-400" />;
      default: return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'blocked': return 'text-red-600 bg-red-100';
      case 'skipped': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getPriorityColor = (priority: ProgressStep['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
    }
  };

  const getCategoryIcon = (category: ProgressStep['category']) => {
    switch (category) {
      case 'onboarding': return <BookOpen className="w-4 h-4" />;
      case 'verification': return <Award className="w-4 h-4" />;
      case 'setup': return <Settings className="w-4 h-4" />;
      case 'training': return <Users className="w-4 h-4" />;
    }
  };

  const handleStepClick = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      trackEvent('progress_step_clicked', {
        userId,
        stepId,
        stepTitle: step.title,
        stepStatus: step.status,
        category: step.category
      });
      onStepClick(stepId);
    }
  };

  function calculateEstimatedTime(steps: ProgressStep[]): string {
    const pendingSteps = steps.filter(s => s.status === 'not_started' || s.status === 'in_progress');
    const totalMinutes = pendingSteps.reduce((sum, step) => {
      if (!step.estimatedTime) return sum;
      const minutes = parseEstimatedTime(step.estimatedTime);
      return sum + minutes;
    }, 0);

    if (totalMinutes < 60) return `${totalMinutes} minutes`;
    if (totalMinutes < 1440) return `${Math.round(totalMinutes / 60)} hours`;
    return `${Math.round(totalMinutes / 1440)} days`;
  }

  function calculateAverageStepTime(steps: ProgressStep[]): number {
    const completedSteps = steps.filter(s => s.status === 'completed' && s.completedAt);
    if (completedSteps.length === 0) return 0;

    // This is a simplified calculation - in real implementation you'd track actual completion times
    return 30; // minutes
  }

  function parseEstimatedTime(timeString: string): number {
    const match = timeString.match(/(\d+)\s*(minute|hour|day)s?/);
    if (!match) return 30; // default 30 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'minute': return value;
      case 'hour': return value * 60;
      case 'day': return value * 1440;
      default: return value;
    }
  }

  if (compactView) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-sm">Progress</span>
            </div>
            <Badge className="text-xs">
              {metrics.completedSteps}/{metrics.totalSteps}
            </Badge>
          </div>
          <Progress value={metrics.completionPercentage} className="mb-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{metrics.completionPercentage}% complete</span>
            <span>{metrics.estimatedTimeRemaining} remaining</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Progress Overview
              </CardTitle>
              <CardDescription>
                Track your completion progress across all activities
              </CardDescription>
            </div>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {metrics.completedSteps} of {metrics.totalSteps} steps
              </span>
            </div>
            <Progress value={metrics.completionPercentage} className="h-3" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.completedSteps}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.inProgressSteps}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{metrics.blockedSteps}</div>
                <div className="text-xs text-muted-foreground">Blocked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.completionPercentage}%</div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
            </div>

            {metrics.estimatedTimeRemaining && metrics.completionPercentage < 100 && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Estimated time to completion: <strong>{metrics.estimatedTimeRemaining}</strong>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      {showCategories && categories.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="flex items-center gap-1"
                >
                  {getCategoryIcon(category)}
                  {category.replace('_', ' ').toUpperCase()}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Steps List */}
      <div className="space-y-3">
        {filteredSteps.map((step, index) => (
          <Card key={step.id}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(step.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{step.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <Badge className={getStatusColor(step.status)} style={{ fontSize: '10px' }}>
                        {step.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(step.priority)} style={{ fontSize: '10px' }}>
                        {step.priority}
                      </Badge>
                      <Badge variant="outline" style={{ fontSize: '10px' }}>
                        {step.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {step.estimatedTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {step.estimatedTime}
                        </span>
                      )}
                      {step.completedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Completed {step.completedAt.toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {step.status !== 'completed' && step.status !== 'blocked' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStepClick(step.id)}
                        className="h-7 px-3"
                      >
                        {step.status === 'in_progress' ? 'Continue' : 'Start'}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>

                  {step.dependencies && step.dependencies.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Dependencies:</p>
                      <div className="flex flex-wrap gap-1">
                        {step.dependencies.map((depId) => {
                          const depStep = steps.find(s => s.id === depId);
                          if (!depStep) return null;
                          return (
                            <Badge
                              key={depId}
                              variant="outline"
                              className={`text-xs ${depStep.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`}
                            >
                              {depStep.title}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      {metrics.completionPercentage < 100 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">Quick Actions</h4>
                <p className="text-xs text-muted-foreground">
                  Continue where you left off
                </p>
              </div>
              <div className="flex gap-2">
                {metrics.inProgressSteps > 0 && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const inProgressStep = steps.find(s => s.status === 'in_progress');
                      if (inProgressStep) handleStepClick(inProgressStep.id);
                    }}
                  >
                    Continue Current
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextStep = steps.find(s => s.status === 'not_started');
                    if (nextStep) handleStepClick(nextStep.id);
                  }}
                >
                  Start Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Celebration */}
      {metrics.completionPercentage === 100 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Award className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">🎉 All Done!</h3>
              <p className="text-muted-foreground mb-4">
                Congratulations! You've completed all steps in your journey.
              </p>
              <Badge className="bg-green-100 text-green-800">
                100% Complete
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}