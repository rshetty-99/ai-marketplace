'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  Sparkles,
  Lightbulb,
  TrendingUp,
  Brain,
  Target,
  Loader2,
  AlertCircle,
  RefreshCw,
  Info,
  Zap,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSemanticSearch, type SemanticSearchResult } from '@/hooks/use-semantic-search';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface SemanticSearchProps {
  onResults: (results: SemanticSearchResult[]) => void;
  onIntentDetected: (intent: any) => void;
  filters?: any;
  className?: string;
  placeholder?: string;
  showSuggestions?: boolean;
  showIntentIndicator?: boolean;
  enableQuickActions?: boolean;
}

export function SemanticSearch({
  onResults,
  onIntentDetected,
  filters = {},
  className,
  placeholder = "Search with natural language... (e.g., 'I need affordable AI for document processing')",
  showSuggestions = true,
  showIntentIndicator = true,
  enableQuickActions = true,
}: SemanticSearchProps) {
  const { trackEvent } = useAnalytics();
  const [query, setQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [threshold, setThreshold] = useState(0.6);
  const [enableHybridSearch, setEnableHybridSearch] = useState(true);
  
  const {
    search,
    isLoading,
    results,
    error,
    searchIntent,
    relatedQueries,
    lastQuery,
    metadata,
    clearResults,
  } = useSemanticSearch({
    enableFallback: true,
    fallbackToKeywordSearch: true,
    cacheResults: true,
    debounceMs: 300,
  });

  // Example search suggestions based on intent categories
  const searchSuggestions = [
    {
      category: 'budget_conscious',
      icon: <Target className="h-4 w-4" />,
      text: 'I need affordable AI for startups',
      description: 'Find budget-friendly solutions',
    },
    {
      category: 'industry_specific',
      icon: <Brain className="h-4 w-4" />,
      text: 'Healthcare AI with HIPAA compliance',
      description: 'Industry-specific requirements',
    },
    {
      category: 'technical_need',
      icon: <Zap className="h-4 w-4" />,
      text: 'Document processing with ML',
      description: 'Specific technical capabilities',
    },
    {
      category: 'enterprise',
      icon: <TrendingUp className="h-4 w-4" />,
      text: 'Enterprise ML platform with support',
      description: 'Large-scale implementations',
    },
  ];

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    const searchOptions = {
      threshold,
      includeExplanation: true,
      enableHybridSearch,
    };

    const response = await search(query, filters, searchOptions);
    
    if (response.success && response.results) {
      onResults(response.results);
      
      if (response.searchIntent) {
        onIntentDetected(response.searchIntent);
      }
    }
  }, [query, filters, threshold, enableHybridSearch, search, onResults, onIntentDetected]);

  const handleSuggestionClick = (suggestion: typeof searchSuggestions[0]) => {
    setQuery(suggestion.text);
    
    trackEvent('semantic_search_suggestion_clicked', {
      suggestion: suggestion.text,
      category: suggestion.category,
      timestamp: new Date().toISOString(),
    });
  };

  const handleRelatedQueryClick = (relatedQuery: string) => {
    setQuery(relatedQuery);
    
    trackEvent('semantic_search_related_query_clicked', {
      originalQuery: lastQuery,
      relatedQuery,
      timestamp: new Date().toISOString(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="relative">
          <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-500" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-20 h-12 text-sm bg-background/50 border-2 border-dashed border-purple-200 focus:border-purple-400 transition-colors"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-purple-500" />}
            <Button 
              onClick={handleSearch} 
              disabled={!query.trim() || isLoading}
              size="sm"
              className="h-8 bg-purple-600 hover:bg-purple-700"
            >
              <Search className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Intent Indicator */}
        {showIntentIndicator && searchIntent && (
          <div className="absolute -bottom-6 left-0 flex items-center gap-2 text-xs text-muted-foreground">
            <Brain className="h-3 w-3 text-purple-500" />
            <span>Intent detected: {searchIntent.category}</span>
            <Badge variant="outline" className="text-xs">
              {Math.round(searchIntent.confidence * 100)}% confidence
            </Badge>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearResults}
                className="ml-auto h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Suggestions */}
      {showSuggestions && !query && (
        <Card className="border-purple-200/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-purple-500" />
              Try these semantic search examples
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2">
              {searchSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="justify-start h-auto p-3 text-left hover:bg-purple-50"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="text-purple-500 mt-0.5">
                      {suggestion.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        "{suggestion.text}"
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {suggestion.description}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Queries */}
      {relatedQueries.length > 0 && (
        <Card className="border-blue-200/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              Related searches
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {relatedQueries.map((relatedQuery, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-blue-200 hover:bg-blue-50"
                  onClick={() => handleRelatedQueryClick(relatedQuery)}
                >
                  {relatedQuery}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Options */}
      {enableQuickActions && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-muted-foreground"
          >
            <Info className="h-3 w-3 mr-1" />
            Advanced options
          </Button>
          
          {metadata && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-muted-foreground">
                    {metadata.processingTime}ms
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <div>Request ID: {metadata.requestId}</div>
                    <div>Processing time: {metadata.processingTime}ms</div>
                    <div>Version: {metadata.version}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      {/* Advanced Options Panel */}
      {showAdvanced && (
        <Card className="border-gray-200/50">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium">Relevance Threshold</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-8">
                    {threshold}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hybrid-search"
                  checked={enableHybridSearch}
                  onChange={(e) => setEnableHybridSearch(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="hybrid-search" className="text-xs font-medium">
                  Hybrid Search
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}