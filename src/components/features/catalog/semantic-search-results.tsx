'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Star,
  Brain,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Info,
  Lightbulb,
  Zap,
  Shield,
  Building2,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ServiceCard } from './service-card';
import type { SemanticSearchResult } from '@/hooks/use-semantic-search';

interface SemanticSearchResultsProps {
  results: SemanticSearchResult[];
  searchQuery: string;
  searchIntent?: any;
  showExplanations?: boolean;
  showRelevanceScores?: boolean;
  onServiceSelect?: (service: SemanticSearchResult) => void;
  className?: string;
}

export function SemanticSearchResults({
  results,
  searchQuery,
  searchIntent,
  showExplanations = true,
  showRelevanceScores = true,
  onServiceSelect,
  className,
}: SemanticSearchResultsProps) {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [showAllScores, setShowAllScores] = useState(false);

  const toggleResultExpansion = (resultId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedResults(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.6) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent Match';
    if (score >= 0.6) return 'Good Match';
    if (score >= 0.4) return 'Partial Match';
    return 'Weak Match';
  };

  const RelevanceFactors = ({ factors }: { factors: any }) => {
    if (!factors) return null;

    const factorItems = [
      { key: 'semantic', label: 'Semantic Similarity', icon: Brain, value: factors.semantic },
      { key: 'keyword', label: 'Keyword Match', icon: Target, value: factors.keyword },
      { key: 'category', label: 'Category Relevance', icon: Building2, value: factors.category },
      { key: 'popularity', label: 'Popularity Score', icon: TrendingUp, value: factors.popularity },
    ];

    return (
      <div className="space-y-3">
        <div className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          Relevance Breakdown
        </div>
        <div className="grid gap-2">
          {factorItems.map((factor) => (
            <div key={factor.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <factor.icon className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{factor.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={factor.value * 100} 
                  className="w-16 h-1" 
                />
                <span className="text-xs font-mono w-8 text-right">
                  {(factor.value * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (results.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="text-muted-foreground">
          <Brain className="h-12 w-12 mx-auto mb-4 text-purple-300" />
          <p className="text-lg font-medium">No semantic matches found</p>
          <p className="text-sm mt-2">
            Try adjusting your search query or using different keywords
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Intent Summary */}
      {searchIntent && (
        <Card className="border-purple-200/50 bg-purple-50/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-purple-900">
                  Search Intent Detected
                </h3>
                <p className="text-sm text-purple-700 mt-1">
                  Looking for {searchIntent.category.replace('_', ' ')} solutions
                  {searchIntent.confidence && (
                    <span className="ml-2">
                      ({Math.round(searchIntent.confidence * 100)}% confidence)
                    </span>
                  )}
                </p>
                {searchIntent.suggestions && searchIntent.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {searchIntent.suggestions.map((suggestion: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs border-purple-200">
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Found {results.length} semantic matches for "{searchQuery}"
        </div>
        {showRelevanceScores && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllScores(!showAllScores)}
            className="text-xs"
          >
            {showAllScores ? 'Hide' : 'Show'} relevance scores
          </Button>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {results.map((result, index) => {
          const isExpanded = expandedResults.has(result.id);
          
          return (
            <Card 
              key={result.id} 
              className={cn(
                'relative transition-all duration-200',
                'hover:shadow-md border-l-4',
                result.score >= 0.8 ? 'border-l-green-400' :
                result.score >= 0.6 ? 'border-l-blue-400' :
                result.score >= 0.4 ? 'border-l-yellow-400' : 'border-l-gray-400'
              )}
            >
              {/* Relevance Score Badge */}
              {showRelevanceScores && (
                <div className="absolute top-4 right-4 z-10">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          className={cn('text-xs font-mono', getScoreColor(result.score))}
                        >
                          {(result.score * 100).toFixed(0)}%
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <div>{getScoreLabel(result.score)}</div>
                          <div>Semantic relevance: {result.score.toFixed(3)}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between pr-16">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        #{index + 1}
                      </span>
                      {result.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {result.description}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Explanation */}
                {showExplanations && result.explanation && (
                  <div className="mb-4 p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <span className="font-medium">Why this matches: </span>
                        {result.explanation}
                      </div>
                    </div>
                  </div>
                )}

                {/* Service Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {result.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">{result.rating}</span>
                    </div>
                  )}
                  {result.pricing && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm">${result.pricing.startingPrice}/mo</span>
                    </div>
                  )}
                  {result.providerType && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm capitalize">{result.providerType}</span>
                    </div>
                  )}
                  {result.compliance && result.compliance.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">{result.compliance[0]}</span>
                    </div>
                  )}
                </div>

                {/* Expandable Details */}
                <Collapsible open={isExpanded} onOpenChange={() => toggleResultExpansion(result.id)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      <span className="text-sm">
                        {isExpanded ? 'Hide details' : 'Show details'}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-4 mt-4">
                    <Separator />
                    
                    {/* Relevance Factors */}
                    {showAllScores && result.relevanceFactors && (
                      <RelevanceFactors factors={result.relevanceFactors} />
                    )}

                    {/* Additional Service Info */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {result.technologies && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Technologies</h4>
                          <div className="flex flex-wrap gap-1">
                            {result.technologies.slice(0, 4).map((tech: string) => (
                              <Badge key={tech} variant="outline" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {result.industries && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Industries</h4>
                          <div className="flex flex-wrap gap-1">
                            {result.industries.slice(0, 3).map((industry: string) => (
                              <Badge key={industry} variant="outline" className="text-xs">
                                {industry}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        onClick={() => onServiceSelect?.(result)}
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Compare
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}