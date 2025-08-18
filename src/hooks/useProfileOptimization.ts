/**
 * React Hook for Profile Optimization
 * Manages profile analysis and optimization suggestions
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  ProfileOptimizationService,
  ProfileOptimization,
  OptimizationSuggestion,
  IndustryInsights
} from '@/lib/profile/optimization-service';
import { useToast } from '@/hooks/use-toast';

interface UseProfileOptimizationProps {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  autoAnalyze?: boolean;
}

interface UseProfileOptimizationReturn {
  // Analysis data
  optimization: ProfileOptimization | null;
  industryInsights: IndustryInsights | null;
  
  // Loading states
  isAnalyzing: boolean;
  isLoading: boolean;
  
  // Actions
  analyzeProfile: () => Promise<ProfileOptimization | null>;
  refreshAnalysis: () => Promise<void>;
  getIndustryInsights: (industry: string) => Promise<IndustryInsights | null>;
  
  // Suggestions management
  markSuggestionCompleted: (suggestionId: string) => void;
  dismissSuggestion: (suggestionId: string) => void;
  prioritizeSuggestion: (suggestionId: string) => void;
  
  // Timeline and planning
  getImprovementTimeline: () => {
    week1: OptimizationSuggestion[];
    week2: OptimizationSuggestion[];
    month1: OptimizationSuggestion[];
    ongoing: OptimizationSuggestion[];
  } | null;
  
  // Progress tracking
  getProgressMetrics: () => {
    totalSuggestions: number;
    completedSuggestions: number;
    progressPercentage: number;
    estimatedTimeToComplete: string;
  } | null;
}

export function useProfileOptimization({
  profileId,
  userType,
  autoAnalyze = true
}: UseProfileOptimizationProps): UseProfileOptimizationReturn {
  const { toast } = useToast();
  const [optimization, setOptimization] = useState<ProfileOptimization | null>(null);
  const [industryInsights, setIndustryInsights] = useState<IndustryInsights | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [completedSuggestions, setCompletedSuggestions] = useState<Set<string>>(new Set());
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [prioritizedSuggestions, setPrioritizedSuggestions] = useState<Set<string>>(new Set());

  // Analyze profile
  const analyzeProfile = useCallback(async (): Promise<ProfileOptimization | null> => {
    setIsAnalyzing(true);
    try {
      const result = await ProfileOptimizationService.analyzeProfile(profileId, userType);
      setOptimization(result);
      
      toast({
        title: 'Profile analyzed',
        description: `Your profile score is ${result.overallScore}/100 with ${result.suggestions.length} optimization suggestions`
      });
      
      return result;
    } catch (error) {
      console.error('Error analyzing profile:', error);
      toast({
        title: 'Analysis failed',
        description: 'Unable to analyze your profile. Please try again.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [profileId, userType, toast]);

  // Refresh analysis
  const refreshAnalysis = useCallback(async () => {
    setIsLoading(true);
    try {
      await analyzeProfile();
    } finally {
      setIsLoading(false);
    }
  }, [analyzeProfile]);

  // Get industry insights
  const getIndustryInsights = useCallback(async (industry: string): Promise<IndustryInsights | null> => {
    try {
      const insights = await ProfileOptimizationService.getIndustryInsights(industry, userType);
      setIndustryInsights(insights);
      return insights;
    } catch (error) {
      console.error('Error fetching industry insights:', error);
      toast({
        title: 'Unable to fetch insights',
        description: 'Could not load industry insights. Please try again.',
        variant: 'destructive'
      });
      return null;
    }
  }, [userType, toast]);

  // Suggestion management
  const markSuggestionCompleted = useCallback((suggestionId: string) => {
    setCompletedSuggestions(prev => new Set([...prev, suggestionId]));
    toast({
      title: 'Progress saved',
      description: 'Suggestion marked as completed'
    });
  }, [toast]);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
  }, []);

  const prioritizeSuggestion = useCallback((suggestionId: string) => {
    setPrioritizedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  }, []);

  // Get improvement timeline
  const getImprovementTimeline = useCallback(() => {
    if (!optimization) return null;

    // Filter out completed and dismissed suggestions
    const activeSuggestions = optimization.suggestions.filter(
      suggestion => !completedSuggestions.has(suggestion.id) && !dismissedSuggestions.has(suggestion.id)
    );

    // Prioritize user-marked suggestions
    const sortedSuggestions = activeSuggestions.sort((a, b) => {
      const aPrioritized = prioritizedSuggestions.has(a.id);
      const bPrioritized = prioritizedSuggestions.has(b.id);
      
      if (aPrioritized && !bPrioritized) return -1;
      if (!aPrioritized && bPrioritized) return 1;
      
      return 0; // Keep original order for same priority level
    });

    return ProfileOptimizationService.generateImprovementTimeline(sortedSuggestions);
  }, [optimization, completedSuggestions, dismissedSuggestions, prioritizedSuggestions]);

  // Get progress metrics
  const getProgressMetrics = useCallback(() => {
    if (!optimization) return null;

    const totalSuggestions = optimization.suggestions.length;
    const completed = completedSuggestions.size;
    const progressPercentage = totalSuggestions > 0 ? Math.round((completed / totalSuggestions) * 100) : 0;

    // Estimate time to complete based on effort levels
    const remainingSuggestions = optimization.suggestions.filter(
      suggestion => !completedSuggestions.has(suggestion.id) && !dismissedSuggestions.has(suggestion.id)
    );

    const effortHours = remainingSuggestions.reduce((total, suggestion) => {
      switch (suggestion.effort) {
        case 'easy': return total + 1;
        case 'moderate': return total + 4;
        case 'complex': return total + 8;
        default: return total + 2;
      }
    }, 0);

    const estimatedTimeToComplete = effortHours > 24 
      ? `${Math.ceil(effortHours / 8)} days`
      : effortHours > 8 
      ? `${Math.ceil(effortHours / 4)} half-days`
      : `${effortHours} hours`;

    return {
      totalSuggestions,
      completedSuggestions: completed,
      progressPercentage,
      estimatedTimeToComplete
    };
  }, [optimization, completedSuggestions, dismissedSuggestions]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (autoAnalyze && profileId) {
          await analyzeProfile();
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [profileId, userType, autoAnalyze, analyzeProfile]);

  // Load industry insights when optimization is available
  useEffect(() => {
    if (optimization?.benchmarks.industry) {
      getIndustryInsights(optimization.benchmarks.industry);
    }
  }, [optimization, getIndustryInsights]);

  return {
    optimization,
    industryInsights,
    isAnalyzing,
    isLoading,
    analyzeProfile,
    refreshAnalysis,
    getIndustryInsights,
    markSuggestionCompleted,
    dismissSuggestion,
    prioritizeSuggestion,
    getImprovementTimeline,
    getProgressMetrics
  };
}

/**
 * Hook for tracking optimization progress over time
 */
export function useOptimizationProgress(profileId: string) {
  const [progressHistory, setProgressHistory] = useState<Array<{
    date: Date;
    overallScore: number;
    completedSuggestions: number;
  }>>([]);

  const recordProgress = useCallback((overallScore: number, completedSuggestions: number) => {
    setProgressHistory(prev => [...prev, {
      date: new Date(),
      overallScore,
      completedSuggestions
    }]);
  }, []);

  const getProgressTrend = useCallback(() => {
    if (progressHistory.length < 2) return null;

    const latest = progressHistory[progressHistory.length - 1];
    const previous = progressHistory[progressHistory.length - 2];

    const scoreDelta = latest.overallScore - previous.overallScore;
    const suggestionsDelta = latest.completedSuggestions - previous.completedSuggestions;

    return {
      scoreImprovement: scoreDelta,
      suggestionsCompleted: suggestionsDelta,
      trend: scoreDelta > 0 ? 'improving' : scoreDelta < 0 ? 'declining' : 'stable'
    };
  }, [progressHistory]);

  return {
    progressHistory,
    recordProgress,
    getProgressTrend
  };
}