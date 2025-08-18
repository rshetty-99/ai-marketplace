/**
 * Profile Completion Component
 * Displays profile completion status and provides optimization suggestions
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
  CheckCircle, 
  Circle, 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  Lightbulb,
  Clock,
  User,
  Briefcase,
  Star,
  Shield,
  Globe,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

import { useProfile } from '@/hooks/useProfile';

interface ProfileCompletionProps {
  className?: string;
}

export function ProfileCompletion({ className }: ProfileCompletionProps) {
  const { profileCompletion, userProfile, refreshCompletion, isLoading } = useProfile();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshCompletion();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!profileCompletion || !userProfile) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load profile completion data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const sections = Object.entries(profileCompletion.sections);
  const completedSections = sections.filter(([_, section]) => section.completed).length;
  const totalSections = sections.length;

  // Sort recommendations by priority
  const sortedRecommendations = [...profileCompletion.recommendations].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Profile Completion
              </CardTitle>
              <CardDescription>
                Complete your profile to attract more clients and improve visibility
              </CardDescription>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Main Progress Indicator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {profileCompletion.completionPercentage}%
              </span>
              <span className="text-sm text-muted-foreground">
                {completedSections} of {totalSections} sections complete
              </span>
            </div>
            
            <Progress 
              value={profileCompletion.completionPercentage} 
              className="h-3"
            />
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Last updated: {profileCompletion.lastUpdated.toLocaleDateString()}
              </span>
              <CompletionBadge percentage={profileCompletion.completionPercentage} />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-semibold text-green-600">{completedSections}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-semibold text-orange-600">{totalSections - completedSections}</div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-semibold text-blue-600">{sortedRecommendations.length}</div>
              <div className="text-xs text-muted-foreground">Recommendations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Section Breakdown</CardTitle>
          <CardDescription>
            Detailed completion status for each profile section
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map(([sectionKey, section]) => (
            <ProfileSection
              key={sectionKey}
              sectionKey={sectionKey}
              section={section}
            />
          ))}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Optimization Recommendations
          </CardTitle>
          <CardDescription>
            Actionable steps to improve your profile and attract more clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedRecommendations.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="font-medium">Great job! Your profile is well optimized.</p>
              <p className="text-sm">Keep your information up to date to maintain visibility.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedRecommendations.map((recommendation, index) => (
                <RecommendationCard
                  key={index}
                  recommendation={recommendation}
                  index={index}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Profile Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Profile Strength Meter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Profile Strength</span>
              <span className="text-sm text-muted-foreground">
                {getProfileStrength(profileCompletion.completionPercentage)}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-sm ${
                    i < Math.ceil(profileCompletion.completionPercentage / 20)
                      ? getStrengthColor(profileCompletion.completionPercentage)
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Optimization Tips */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Quick Optimization Tips</h4>
            <div className="space-y-2">
              <OptimizationTip
                icon={<User className="h-4 w-4" />}
                title="Professional Photo"
                description="Profiles with photos get 40% more views"
                completed={!!userProfile.avatar}
              />
              <OptimizationTip
                icon={<Briefcase className="h-4 w-4" />}
                title="Portfolio Projects"
                description="Add 3+ projects to showcase your expertise"
                completed={profileCompletion.sections.portfolio.completed}
              />
              <OptimizationTip
                icon={<Star className="h-4 w-4" />}
                title="Skills & Expertise"
                description="Add 5+ skills with proficiency levels"
                completed={profileCompletion.sections.professional.completed}
              />
              <OptimizationTip
                icon={<Shield className="h-4 w-4" />}
                title="Verification"
                description="Verified profiles build more trust"
                completed={profileCompletion.sections.verification.completed}
              />
              <OptimizationTip
                icon={<Globe className="h-4 w-4" />}
                title="SEO Optimization"
                description="Improve discoverability with keywords"
                completed={profileCompletion.sections.seo.completed}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Profile Section Component
function ProfileSection({ 
  sectionKey, 
  section 
}: { 
  sectionKey: string; 
  section: any; 
}) {
  const getSectionIcon = (key: string) => {
    switch (key) {
      case 'basicInfo': return <User className="h-4 w-4" />;
      case 'professional': return <Briefcase className="h-4 w-4" />;
      case 'portfolio': return <Star className="h-4 w-4" />;
      case 'verification': return <Shield className="h-4 w-4" />;
      case 'seo': return <Globe className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getSectionName = (key: string) => {
    switch (key) {
      case 'basicInfo': return 'Basic Information';
      case 'professional': return 'Professional Details';
      case 'portfolio': return 'Portfolio & Projects';
      case 'verification': return 'Verification & Trust';
      case 'seo': return 'SEO & Visibility';
      default: return key.charAt(0).toUpperCase() + key.slice(1);
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg">
      <div className={`p-2 rounded-full ${section.completed ? 'bg-green-100' : 'bg-muted'}`}>
        {section.completed ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          getSectionIcon(sectionKey)
        )}
      </div>
      
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{getSectionName(sectionKey)}</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{section.score}%</span>
            <Badge variant={section.completed ? 'default' : 'secondary'}>
              {section.completed ? 'Complete' : 'Incomplete'}
            </Badge>
          </div>
        </div>
        
        <Progress value={section.score} className="h-2" />
        
        {section.suggestions.length > 0 && (
          <div className="space-y-1">
            {section.suggestions.slice(0, 2).map((suggestion: string, index: number) => (
              <p key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {suggestion}
              </p>
            ))}
            {section.suggestions.length > 2 && (
              <p className="text-xs text-muted-foreground">
                +{section.suggestions.length - 2} more suggestions
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Recommendation Card Component
function RecommendationCard({ 
  recommendation, 
  index 
}: { 
  recommendation: any; 
  index: number; 
}) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`p-4 border rounded-lg ${getPriorityColor(recommendation.priority)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant="outline" 
              className={`text-xs capitalize ${getPriorityColor(recommendation.priority)}`}
            >
              {recommendation.priority} Priority
            </Badge>
            <span className="text-xs text-muted-foreground">
              +{recommendation.estimatedImpact}% profile improvement
            </span>
          </div>
          
          <h4 className="font-medium mb-1">
            {recommendation.action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </h4>
          <p className="text-sm opacity-90">
            {recommendation.description}
          </p>
        </div>
        
        <Button size="sm" variant="outline" className="ml-4">
          Take Action
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// Optimization Tip Component
function OptimizationTip({ 
  icon, 
  title, 
  description, 
  completed 
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  completed: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg ${completed ? 'bg-green-50' : 'bg-muted'}`}>
      <div className={`p-1 rounded ${completed ? 'text-green-600' : 'text-muted-foreground'}`}>
        {completed ? <CheckCircle className="h-4 w-4" /> : icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {completed && (
        <CheckCircle className="h-4 w-4 text-green-600" />
      )}
    </div>
  );
}

// Completion Badge Component
function CompletionBadge({ percentage }: { percentage: number }) {
  if (percentage >= 90) {
    return <Badge className="bg-green-500">Excellent</Badge>;
  } else if (percentage >= 70) {
    return <Badge className="bg-blue-500">Good</Badge>;
  } else if (percentage >= 50) {
    return <Badge className="bg-orange-500">Needs Work</Badge>;
  } else {
    return <Badge variant="destructive">Incomplete</Badge>;
  }
}

// Helper Functions
function getProfileStrength(percentage: number): string {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 70) return 'Strong';
  if (percentage >= 50) return 'Moderate';
  if (percentage >= 30) return 'Weak';
  return 'Very Weak';
}

function getStrengthColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-blue-500';
  if (percentage >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

export default ProfileCompletion;