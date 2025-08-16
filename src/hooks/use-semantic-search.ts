import { useState, useCallback, useRef } from 'react';
import { useAnalytics } from '@/components/providers/analytics-provider';

export interface SemanticSearchOptions {
  limit?: number;
  threshold?: number;
  includeExplanation?: boolean;
  enableHybridSearch?: boolean;
}

export interface SemanticSearchResult {
  id: string;
  name: string;
  description: string;
  score: number;
  explanation?: string;
  relevanceFactors?: {
    semantic: number;
    keyword: number;
    category: number;
    popularity: number;
  };
  // Include full service data
  [key: string]: any;
}

export interface SemanticSearchResponse {
  success: boolean;
  results?: SemanticSearchResult[];
  totalCount?: number;
  searchIntent?: {
    category: string;
    confidence: number;
    suggestions: string[];
  };
  relatedQueries?: string[];
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
    processingTime: number;
    version: string;
  };
}

export interface UseSemanticSearchOptions {
  enableFallback?: boolean;
  fallbackToKeywordSearch?: boolean;
  cacheResults?: boolean;
  debounceMs?: number;
}

export function useSemanticSearch(options: UseSemanticSearchOptions = {}) {
  const { trackEvent } = useAnalytics();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchIntent, setSearchIntent] = useState<any>(null);
  const [relatedQueries, setRelatedQueries] = useState<string[]>([]);
  const [lastQuery, setLastQuery] = useState<string>('');
  const [metadata, setMetadata] = useState<any>(null);
  
  // Cache for storing recent results
  const cache = useRef(new Map<string, SemanticSearchResponse>());
  const abortController = useRef<AbortController | null>(null);

  const search = useCallback(async (
    query: string,
    filters: any = {},
    searchOptions: SemanticSearchOptions = {}
  ): Promise<SemanticSearchResponse> => {
    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    // Input validation
    if (!query || query.trim().length === 0) {
      setError('Search query cannot be empty');
      return { success: false, error: { code: 'INVALID_QUERY', message: 'Search query cannot be empty' } };
    }

    // Check cache first
    const cacheKey = JSON.stringify({ query, filters, searchOptions });
    if (options.cacheResults && cache.current.has(cacheKey)) {
      const cachedResult = cache.current.get(cacheKey)!;
      setResults(cachedResult.results || []);
      setSearchIntent(cachedResult.searchIntent);
      setRelatedQueries(cachedResult.relatedQueries || []);
      setMetadata(cachedResult.metadata);
      return cachedResult;
    }

    setIsLoading(true);
    setError(null);
    setLastQuery(query);

    const startTime = Date.now();

    try {
      // Track search intent
      trackEvent('semantic_search_initiated', {
        query,
        queryLength: query.length,
        hasFilters: Object.keys(filters).length > 0,
        timestamp: new Date().toISOString(),
      });

      const requestBody = {
        query: query.trim(),
        filters,
        options: {
          limit: searchOptions.limit || 20,
          threshold: searchOptions.threshold || 0.6,
          includeExplanation: searchOptions.includeExplanation || true,
          enableHybridSearch: searchOptions.enableHybridSearch !== false,
        },
      };

      const response = await fetch('/api/search/semantic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortController.current.signal,
      });

      const data: SemanticSearchResponse = await response.json();
      const processingTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(data.error?.message || 'Search request failed');
      }

      if (data.success && data.results) {
        setResults(data.results);
        setSearchIntent(data.searchIntent);
        setRelatedQueries(data.relatedQueries || []);
        setMetadata(data.metadata);

        // Cache successful results
        if (options.cacheResults) {
          cache.current.set(cacheKey, data);
          
          // Limit cache size
          if (cache.current.size > 50) {
            const firstKey = cache.current.keys().next().value;
            cache.current.delete(firstKey);
          }
        }

        // Track successful search
        trackEvent('semantic_search_completed', {
          query,
          resultCount: data.results.length,
          processingTime,
          intent: data.searchIntent?.category,
          intentConfidence: data.searchIntent?.confidence,
          timestamp: new Date().toISOString(),
        });

        return data;
      } else {
        throw new Error(data.error?.message || 'No results found');
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { success: false, error: { code: 'CANCELLED', message: 'Search was cancelled' } };
      }

      const errorMessage = error.message || 'Search failed';
      setError(errorMessage);

      // Track search error
      trackEvent('semantic_search_error', {
        query,
        error: errorMessage,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });

      // Fallback to keyword search if enabled
      if (options.fallbackToKeywordSearch && error.message.includes('quota') || error.message.includes('API')) {
        try {
          trackEvent('semantic_search_fallback_triggered', {
            query,
            originalError: errorMessage,
            timestamp: new Date().toISOString(),
          });

          // Implement keyword fallback here (integrate with existing search)
          // For now, return empty results with fallback indication
          return {
            success: true,
            results: [],
            metadata: {
              requestId: `fallback_${Date.now()}`,
              timestamp: new Date().toISOString(),
              processingTime: Date.now() - startTime,
              version: '1.0.0-fallback',
            },
          };
        } catch (fallbackError) {
          return { 
            success: false, 
            error: { 
              code: 'FALLBACK_FAILED', 
              message: 'Both semantic search and fallback failed' 
            } 
          };
        }
      }

      return { success: false, error: { code: 'SEARCH_FAILED', message: errorMessage } };

    } finally {
      setIsLoading(false);
    }
  }, [trackEvent, options.cacheResults, options.fallbackToKeywordSearch]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setSearchIntent(null);
    setRelatedQueries([]);
    setLastQuery('');
    setMetadata(null);
  }, []);

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  return {
    search,
    isLoading,
    results,
    error,
    searchIntent,
    relatedQueries,
    lastQuery,
    metadata,
    clearResults,
    clearCache,
  };
}