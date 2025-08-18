/**
 * Profile Optimization Dashboard Component
 * Comprehensive interface for profile improvement and optimization
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProfileOptimization } from '@/hooks/useProfileOptimization';
import { OptimizationSuggestion } from '@/lib/profile/optimization-service';
import { cn } from '@/lib/utils';

import {
  Target,
  TrendingUp,
  Star,
  Zap,
  CheckCircle,
  Circle,
  Clock,
  ArrowRight,
  Info,
  AlertCircle,
  Trophy,
  Lightbulb,
  BarChart3,
  Calendar,
  Rocket,
  Shield,
  Eye,
  Heart,
  Award,
  RefreshCw,
  ChevronRight,
  X,
  Pin,
  Sparkles,
  Brain,
  Users,
  DollarSign
} from 'lucide-react';

interface ProfileOptimizationDashboardProps {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  className?: string;
}

export function ProfileOptimizationDashboard({
  profileId,
  userType,
  className
}: ProfileOptimizationDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  
  const {
    optimization,
    industryInsights,
    isAnalyzing,
    isLoading,
    analyzeProfile,
    markSuggestionCompleted,
    dismissSuggestion,
    prioritizeSuggestion,
    getImprovementTimeline,
    getProgressMetrics
  } = useProfileOptimization({
    profileId,
    userType,
    autoAnalyze: true
  });

  const timeline = getImprovementTimeline();
  const progressMetrics = getProgressMetrics();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high': return <Circle className="h-4 w-4 text-orange-500 fill-current" />;
      case 'medium': return <Circle className="h-4 w-4 text-yellow-500 fill-current" />;
      case 'low': return <Circle className="h-4 w-4 text-gray-400 fill-current" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'seo': return <Eye className="h-4 w-4 text-purple-500" />;
      case 'engagement': return <Heart className="h-4 w-4 text-pink-500" />;
      case 'conversion': return <Target className="h-4 w-4 text-green-500" />;
      case 'trust': return <Shield className="h-4 w-4 text-indigo-500" />;
      default: return <Sparkles className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!optimization) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">Unable to load optimization data</p>
        <Button onClick={analyzeProfile} disabled={isAnalyzing}>
          {isAnalyzing && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
          Analyze Profile
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profile Optimization</h2>
          <p className="text-gray-600">Improve your profile performance with AI-powered suggestions</p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={analyzeProfile}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Brain className="h-4 w-4 mr-2" />
          )}
          Re-analyze
        </Button>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className={cn("border-2", getScoreBackground(optimization.overallScore))}>
          <CardContent className="p-4 text-center">
            <div className={cn("text-3xl font-bold", getScoreColor(optimization.overallScore))}>
              {optimization.overallScore}
            </div>
            <p className="text-sm font-medium">Overall Score</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className={cn("text-2xl font-bold", getScoreColor(optimization.completionScore))}>
              {optimization.completionScore}%
            </div>
            <p className="text-xs text-gray-600">Completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className={cn("text-2xl font-bold", getScoreColor(optimization.qualityScore))}>
              {optimization.qualityScore}%
            </div>
            <p className="text-xs text-gray-600">Quality</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className={cn("text-2xl font-bold", getScoreColor(optimization.seoScore))}>
              {optimization.seoScore}%
            </div>
            <p className="text-xs text-gray-600">SEO</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className={cn("text-2xl font-bold", getScoreColor(optimization.engagementScore))}>
              {optimization.engagementScore}%
            </div>
            <p className="text-xs text-gray-600">Engagement</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className={cn("text-2xl font-bold", getScoreColor(optimization.trustScore))}>
              {optimization.trustScore}%
            </div>
            <p className="text-xs text-gray-600">Trust</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      {progressMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Suggestions Completed</span>
                <span className="text-sm text-gray-600">
                  {progressMetrics.completedSuggestions} of {progressMetrics.totalSuggestions}
                </span>
              </div>
              
              <Progress value={progressMetrics.progressPercentage} className="h-2" />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 font-medium">
                  {progressMetrics.progressPercentage}% Complete
                </span>
                <span className="text-gray-600">
                  Est. {progressMetrics.estimatedTimeToComplete} remaining
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-blue-500" />
                Quick Wins
              </CardTitle>
              <CardDescription>
                Complete these high-impact actions first
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {optimization.nextSteps.slice(0, 3).map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Industry Benchmarks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Industry Benchmarks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {optimization.benchmarks.avgCompletionScore}%
                  </div>
                  <p className="text-xs text-gray-600">Avg Completion</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ${optimization.benchmarks.avgHourlyRate}
                  </div>
                  <p className="text-xs text-gray-600">Avg Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {optimization.benchmarks.successMetrics.profileViews}
                  </div>
                  <p className="text-xs text-gray-600">Avg Views</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {optimization.benchmarks.successMetrics.contactRate}%
                  </div>
                  <p className="text-xs text-gray-600">Contact Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {optimization.suggestions.length} Optimization Suggestions
            </h3>
            <div className="flex gap-2">
              <Badge variant="outline">{optimization.suggestions.filter(s => s.priority === 'critical').length} Critical</Badge>
              <Badge variant="outline">{optimization.suggestions.filter(s => s.priority === 'high').length} High</Badge>
              <Badge variant="outline">{optimization.suggestions.filter(s => s.priority === 'medium').length} Medium</Badge>
            </div>
          </div>

          <ScrollArea className="h-96">
            <div className="space-y-4 pr-4">
              {optimization.suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onComplete={() => markSuggestionCompleted(suggestion.id)}
                  onDismiss={() => dismissSuggestion(suggestion.id)}
                  onPrioritize={() => prioritizeSuggestion(suggestion.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          {timeline && (
            <div className="space-y-6">
              <TimelineSection title="Week 1 - Quick Wins" suggestions={timeline.week1} />
              <TimelineSection title="Week 2 - Foundation" suggestions={timeline.week2} />
              <TimelineSection title="Month 1 - Growth" suggestions={timeline.month1} />
              <TimelineSection title="Ongoing - Excellence" suggestions={timeline.ongoing} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {industryInsights && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Market Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Trending Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {industryInsights.trending_skills.map((skill) => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Market Demand</p>
                        <Badge variant={industryInsights.market_demand === 'very_high' ? 'default' : 'secondary'}>
                          {industryInsights.market_demand.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Competition</p>
                        <Badge variant="outline">{industryInsights.competition_level}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Entry Rate</p>
                        <p className="font-medium">${industryInsights.salary_ranges.entry}/hr</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Growth Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {industryInsights.growth_opportunities.map((opportunity, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{opportunity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components

interface SuggestionCardProps {
  suggestion: OptimizationSuggestion;
  onComplete: () => void;
  onDismiss: () => void;
  onPrioritize: () => void;
}

function SuggestionCard({ suggestion, onComplete, onDismiss, onPrioritize }: SuggestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'high': return 'border-orange-200 bg-orange-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-gray-200 bg-gray-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className={cn("border-l-4", getPriorityColor(suggestion.priority))}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getPriorityIcon(suggestion.priority)}
              {getTypeIcon(suggestion.type)}
              <h4 className="font-medium">{suggestion.title}</h4>
              <Badge variant="outline" className="text-xs">
                {suggestion.impact} impact
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              <span>Effort: {suggestion.effort}</span>
              <span>•</span>
              <span>{suggestion.expectedImprovement}</span>
            </div>

            {isExpanded && (
              <div className="space-y-3 pt-3 border-t">
                <div>
                  <h5 className="font-medium text-sm mb-1">Action Steps:</h5>
                  <p className="text-sm text-gray-700">{suggestion.action}</p>
                </div>
                
                {suggestion.examples && (
                  <div>
                    <h5 className="font-medium text-sm mb-1">Examples:</h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {suggestion.examples.map((example, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-start gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
            </Button>
            <Button variant="ghost" size="sm" onClick={onPrioritize}>
              <Pin className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onComplete}>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TimelineSectionProps {
  title: string;
  suggestions: OptimizationSuggestion[];
}

function TimelineSection({ title, suggestions }: TimelineSectionProps) {
  if (suggestions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {getTypeIcon(suggestion.type)}
              <div className="flex-1">
                <h5 className="font-medium text-sm">{suggestion.title}</h5>
                <p className="text-xs text-gray-600">{suggestion.action}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {suggestion.effort}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'high': return <Circle className="h-4 w-4 text-orange-500 fill-current" />;
    case 'medium': return <Circle className="h-4 w-4 text-yellow-500 fill-current" />;
    case 'low': return <Circle className="h-4 w-4 text-gray-400 fill-current" />;
    default: return <Circle className="h-4 w-4 text-gray-400" />;
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'content': return <Lightbulb className="h-4 w-4 text-blue-500" />;
    case 'seo': return <Eye className="h-4 w-4 text-purple-500" />;
    case 'engagement': return <Heart className="h-4 w-4 text-pink-500" />;
    case 'conversion': return <Target className="h-4 w-4 text-green-500" />;
    case 'trust': return <Shield className="h-4 w-4 text-indigo-500" />;
    default: return <Sparkles className="h-4 w-4 text-gray-500" />;
  }
}