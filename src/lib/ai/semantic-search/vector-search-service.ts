import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  Query
} from 'firebase/firestore';
import { getEmbeddingService } from './embedding-service';
import { QueryProcessor, SimilarityCalculator, ExplanationGenerator, PerformanceMonitor } from './utils';
import { getSemanticSearchConfig, searchStrategies } from './config';
import type { 
  SearchQuery, 
  SearchResponse, 
  SearchResult, 
  SearchOptions, 
  SearchFilters,
  SearchStrategy,
  QueryMetadata,
  SearchPerformance,
  SearchSuggestion,
  SemanticSearchApiResponse 
} from '@/types/semantic-search';

export class VectorSearchService {
  private db: any;
  private embeddingService: any;
  private config: ReturnType<typeof getSemanticSearchConfig>;
  private cache: Map<string, { result: SearchResponse; timestamp: number }> = new Map();

  constructor(firebaseConfig: any) {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
    
    // Initialize embedding service
    this.embeddingService = getEmbeddingService();
    
    // Get configuration
    this.config = getSemanticSearchConfig();
  }

  /**
   * Perform semantic search for services
   */
  async search(searchQuery: SearchQuery): Promise<SemanticSearchApiResponse> {
    const requestId = this.generateRequestId();
    const timer = PerformanceMonitor.startTimer();
    
    try {
      // Validate query
      const { query, filters = {}, options = {} } = searchQuery;
      
      if (!query || query.trim().length === 0) {
        return this.createErrorResponse(requestId, 'INVALID_QUERY', 'Search query is required');
      }
      
      // Check cache first
      const cacheKey = this.generateCacheKey(searchQuery);
      const cachedResult = this.getCachedResult(cacheKey);
      
      if (cachedResult) {
        PerformanceMonitor.recordMetric('search_cache_hit', timer());
        return this.createSuccessResponse(requestId, cachedResult, timer());
      }
      
      // Process query
      const processedQuery = QueryProcessor.processQuery(query);
      const queryIntent = QueryProcessor.detectIntent(query);
      
      // Determine search strategy
      const strategy = this.determineSearchStrategy(queryIntent, options);
      
      // Generate query embedding
      const embeddingResponse = await this.embeddingService.generateQueryEmbedding(processedQuery);
      
      if (!embeddingResponse.success) {
        return this.createErrorResponse(requestId, 'EMBEDDING_FAILED', embeddingResponse.error?.message || 'Failed to generate query embedding');
      }
      
      const queryEmbedding = embeddingResponse.data!.embedding;
      
      // Perform search based on strategy
      let searchResults: SearchResult[] = [];
      const performanceMetrics = {
        vectorSearchTime: 0,
        textSearchTime: 0,
        filterTime: 0,
        rankingTime: 0,
        documentsScanned: 0,
      };
      
      if (strategy.primary === 'vector' || strategy.primary === 'hybrid') {
        const vectorTimer = PerformanceMonitor.startTimer();
        const vectorResults = await this.performVectorSearch(queryEmbedding, filters, options);
        performanceMetrics.vectorSearchTime = vectorTimer();
        performanceMetrics.documentsScanned += vectorResults.length;
        searchResults = vectorResults;
      }
      
      if (strategy.primary === 'text' || strategy.primary === 'hybrid') {
        const textTimer = PerformanceMonitor.startTimer();
        const textResults = await this.performTextSearch(processedQuery, filters, options);
        performanceMetrics.textSearchTime = textTimer();
        performanceMetrics.documentsScanned += textResults.length;
        
        if (strategy.primary === 'hybrid') {
          searchResults = this.mergeResults(searchResults, textResults, strategy.weights);
        } else {
          searchResults = textResults;
        }
      }
      
      // Apply additional filters
      const filterTimer = PerformanceMonitor.startTimer();
      searchResults = this.applyFilters(searchResults, filters);
      performanceMetrics.filterTime = filterTimer();
      
      // Rank and score results
      const rankingTimer = PerformanceMonitor.startTimer();
      searchResults = this.rankResults(searchResults, query, strategy);
      performanceMetrics.rankingTime = rankingTimer();
      
      // Apply limit and pagination
      const limit = Math.min(options.limit || this.config.search.defaultLimit, this.config.search.maxLimit);
      const offset = options.offset || 0;
      const paginatedResults = searchResults.slice(offset, offset + limit);
      
      // Generate suggestions
      const suggestions = this.generateSuggestions(query, searchResults, filters);
      
      // Create response
      const queryMetadata: QueryMetadata = {
        originalQuery: query,
        processedQuery,
        queryEmbedding,
        intent: queryIntent,
        strategy,
      };
      
      const performance: SearchPerformance = {
        totalTime: timer(),
        ...performanceMetrics,
        cacheStatus: 'miss',
      };
      
      const response: SearchResponse = {
        results: paginatedResults,
        totalCount: searchResults.length,
        queryMetadata,
        performance,
        suggestions,
      };
      
      // Cache result
      if (this.config.search.cacheEnabled) {
        this.setCachedResult(cacheKey, response);
      }
      
      // Record metrics
      PerformanceMonitor.recordMetric('search_total_time', performance.totalTime);
      PerformanceMonitor.recordMetric('search_result_count', response.totalCount);
      
      return this.createSuccessResponse(requestId, response, timer);
      
    } catch (error) {
      const duration = timer();
      PerformanceMonitor.recordMetric('search_error_time', duration);
      
      return this.createErrorResponse(
        requestId,
        'SEARCH_FAILED',
        error instanceof Error ? error.message : 'Unknown search error',
        { error: error?.toString() }
      );
    }
  }

  /**
   * Perform vector similarity search using Firestore
   */
  private async performVectorSearch(
    queryEmbedding: number[],
    filters: SearchFilters,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    try {
      // In Firestore Vector Search, we would use findNearest
      // For now, we'll simulate with a traditional approach and calculate similarity
      
      let q: Query<DocumentData> = collection(this.db, 'services');
      
      // Apply basic filters first to reduce search space
      if (filters.categories && filters.categories.length > 0) {
        q = query(q, where('category', 'in', filters.categories));
      }
      
      if (filters.providerTypes && filters.providerTypes.length > 0) {
        q = query(q, where('providerType', 'in', filters.providerTypes));
      }
      
      if (filters.minRating) {
        q = query(q, where('rating', '>=', filters.minRating));
      }
      
      // Get documents
      const snapshot = await getDocs(q);
      const results: SearchResult[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Skip if no embedding
        if (!data.embedding || !Array.isArray(data.embedding)) {
          continue;
        }
        
        // Calculate similarity
        const similarity = SimilarityCalculator.cosineSimilarity(queryEmbedding, data.embedding);
        const distance = 1 - similarity; // Convert similarity to distance
        
        // Apply threshold
        const threshold = options.threshold || this.config.search.defaultThreshold;
        if (similarity < threshold) {
          continue;
        }
        
        // Create search result
        const searchResult: SearchResult = {
          serviceId: doc.id,
          score: similarity,
          distance,
          service: { id: doc.id, ...data },
        };
        
        // Add explanation if requested
        if (options.includeExplanation) {
          searchResult.explanation = ExplanationGenerator.generateExplanation(
            '', // We'll add the original query here
            data,
            similarity,
            distance
          );
        }
        
        results.push(searchResult);
      }
      
      // Sort by similarity score (descending)
      results.sort((a, b) => b.score - a.score);
      
      return results;
      
    } catch (error) {
      console.error('Vector search failed:', error);
      return [];
    }
  }

  /**
   * Perform traditional text search
   */
  private async performTextSearch(
    query: string,
    filters: SearchFilters,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    try {
      const queryTerms = query.toLowerCase().split(/\s+/);
      let q: Query<DocumentData> = collection(this.db, 'services');
      
      // Apply filters
      if (filters.categories && filters.categories.length > 0) {
        q = query(q, where('category', 'in', filters.categories));
      }
      
      // Get documents
      const snapshot = await getDocs(q);
      const results: SearchResult[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Create searchable content
        const searchContent = [
          data.name || '',
          data.description || '',
          data.shortDescription || '',
          ...(data.tags || []),
          ...(data.features || []),
        ].join(' ').toLowerCase();
        
        // Calculate text match score
        const score = this.calculateTextMatchScore(queryTerms, searchContent);
        
        if (score > 0) {
          results.push({
            serviceId: doc.id,
            score,
            distance: 1 - score,
            service: { id: doc.id, ...data },
          });
        }
      }
      
      // Sort by score
      results.sort((a, b) => b.score - a.score);
      
      return results;
      
    } catch (error) {
      console.error('Text search failed:', error);
      return [];
    }
  }

  /**
   * Calculate text match score
   */
  private calculateTextMatchScore(queryTerms: string[], content: string): number {
    let score = 0;
    let totalWeight = 0;
    
    for (const term of queryTerms) {
      const weight = 1; // Could be adjusted based on term importance
      totalWeight += weight;
      
      if (content.includes(term)) {
        // Exact match
        score += weight;
      } else if (content.includes(term.substring(0, Math.max(3, term.length - 2)))) {
        // Partial match
        score += weight * 0.5;
      }
    }
    
    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * Merge vector and text search results
   */
  private mergeResults(
    vectorResults: SearchResult[],
    textResults: SearchResult[],
    weights: SearchStrategy['weights']
  ): SearchResult[] {
    const resultMap = new Map<string, SearchResult>();
    
    // Add vector results
    for (const result of vectorResults) {
      resultMap.set(result.serviceId, {
        ...result,
        score: result.score * weights.vector,
      });
    }
    
    // Merge text results
    for (const result of textResults) {
      const existing = resultMap.get(result.serviceId);
      if (existing) {
        existing.score += result.score * weights.text;
      } else {
        resultMap.set(result.serviceId, {
          ...result,
          score: result.score * weights.text,
        });
      }
    }
    
    return Array.from(resultMap.values()).sort((a, b) => b.score - a.score);
  }

  /**
   * Apply additional filters to results
   */
  private applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    return results.filter(result => {
      const service = result.service;
      
      // Price range filter
      if (filters.priceRange) {
        const price = service.pricing?.startingPrice || 0;
        if (filters.priceRange.min && price < filters.priceRange.min) return false;
        if (filters.priceRange.max && price > filters.priceRange.max) return false;
      }
      
      // Industry filter
      if (filters.industries && filters.industries.length > 0) {
        const serviceIndustries = service.industries || [];
        if (!filters.industries.some(industry => serviceIndustries.includes(industry))) {
          return false;
        }
      }
      
      // Technology filter
      if (filters.technologies && filters.technologies.length > 0) {
        const serviceTechs = service.technologies || [];
        if (!filters.technologies.some(tech => serviceTechs.includes(tech))) {
          return false;
        }
      }
      
      // Location filter
      if (filters.locations && filters.locations.length > 0) {
        const serviceLocations = service.locations || [];
        if (!filters.locations.some(location => serviceLocations.includes(location))) {
          return false;
        }
      }
      
      // Feature filter
      if (filters.features && filters.features.length > 0) {
        const serviceFeatures = service.features || [];
        if (!filters.features.some(feature => serviceFeatures.includes(feature))) {
          return false;
        }
      }
      
      // Compliance filter
      if (filters.compliance && filters.compliance.length > 0) {
        const serviceCompliance = service.compliance || [];
        if (!filters.compliance.some(comp => serviceCompliance.includes(comp))) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Rank results based on various factors
   */
  private rankResults(
    results: SearchResult[],
    originalQuery: string,
    strategy: SearchStrategy
  ): SearchResult[] {
    return results.map(result => {
      const service = result.service;
      let finalScore = result.score;
      
      // Apply popularity boost
      if (strategy.weights.popularity > 0) {
        const popularityScore = (service.reviewCount || 0) / 100; // Normalize
        finalScore += popularityScore * strategy.weights.popularity;
      }
      
      // Apply recency boost
      if (strategy.weights.recency > 0) {
        const daysSinceUpdate = service.updatedAt 
          ? (Date.now() - service.updatedAt.toDate().getTime()) / (1000 * 60 * 60 * 24)
          : 365;
        const recencyScore = Math.max(0, 1 - daysSinceUpdate / 365); // Score decreases over time
        finalScore += recencyScore * strategy.weights.recency;
      }
      
      return {
        ...result,
        score: finalScore,
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Generate search suggestions
   */
  private generateSuggestions(
    query: string,
    results: SearchResult[],
    filters: SearchFilters
  ): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    
    // Suggest spelling corrections
    const spellingSuggestions = this.getSpellingSuggestions(query);
    suggestions.push(...spellingSuggestions);
    
    // Suggest filter refinements
    if (results.length === 0) {
      suggestions.push({
        query: query,
        type: 'filter',
        expectedResultCount: 10,
        reason: 'Try removing some filters to see more results',
      });
    }
    
    // Suggest popular categories if no results
    if (results.length === 0 && !filters.categories) {
      suggestions.push({
        query: query,
        type: 'category',
        expectedResultCount: 25,
        reason: 'Try searching in Machine Learning category',
      });
    }
    
    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  }

  /**
   * Get spelling suggestions (simple implementation)
   */
  private getSpellingSuggestions(query: string): SearchSuggestion[] {
    // Simple implementation - in production, you might use a spell-checking library
    const commonCorrections: Record<string, string> = {
      'machien': 'machine',
      'leraning': 'learning',
      'artifical': 'artificial',
      'inteligence': 'intelligence',
    };
    
    const suggestions: SearchSuggestion[] = [];
    
    for (const [typo, correction] of Object.entries(commonCorrections)) {
      if (query.toLowerCase().includes(typo)) {
        const correctedQuery = query.toLowerCase().replace(typo, correction);
        suggestions.push({
          query: correctedQuery,
          type: 'spelling',
          expectedResultCount: 15,
          reason: `Did you mean "${correction}"?`,
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Determine search strategy based on query intent and options
   */
  private determineSearchStrategy(
    queryIntent: any,
    options: SearchOptions
  ): SearchStrategy {
    // Use hybrid by default, but could be more intelligent based on intent
    if (options.includeTextSearch === false) {
      return searchStrategies.semantic_only;
    }
    
    if (queryIntent.category === 'specific_need') {
      return searchStrategies.hybrid_semantic_heavy;
    }
    
    return searchStrategies.hybrid_balanced;
  }

  /**
   * Cache management
   */
  private generateCacheKey(searchQuery: SearchQuery): string {
    return Buffer.from(JSON.stringify(searchQuery)).toString('base64');
  }

  private getCachedResult(cacheKey: string): SearchResponse | null {
    if (!this.config.search.cacheEnabled) return null;
    
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.config.search.cacheTtl * 1000;
    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return cached.result;
  }

  private setCachedResult(cacheKey: string, result: SearchResponse): void {
    if (!this.config.search.cacheEnabled) return;
    
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });
    
    // Simple cache size management
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Response helpers
   */
  private createSuccessResponse(
    requestId: string,
    data: SearchResponse,
    timer: () => number
  ): SemanticSearchApiResponse {
    return {
      success: true,
      data,
      metadata: {
        requestId,
        timestamp: new Date(),
        processingTime: timer(),
        version: '1.0.0',
      },
    };
  }

  private createErrorResponse(
    requestId: string,
    code: string,
    message: string,
    details?: any
  ): SemanticSearchApiResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      metadata: {
        requestId,
        timestamp: new Date(),
        processingTime: 0,
        version: '1.0.0',
      },
    };
  }

  private generateRequestId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string; details?: any }> {
    try {
      // Test basic search functionality
      const testQuery: SearchQuery = {
        query: 'health check test',
        options: { limit: 1 },
      };
      
      const result = await this.search(testQuery);
      
      if (result.success) {
        return {
          healthy: true,
          message: 'Vector search service is healthy',
          details: {
            searchResponseTime: result.metadata.processingTime,
            cacheSize: this.cache.size,
            embeddingServiceHealthy: true,
          },
        };
      } else {
        return {
          healthy: false,
          message: `Search test failed: ${result.error?.message}`,
        };
      }
    } catch (error) {
      return {
        healthy: false,
        message: `Vector search health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error?.toString() },
      };
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return PerformanceMonitor.getAllMetrics();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
let vectorSearchServiceInstance: VectorSearchService | null = null;

/**
 * Get singleton instance of VectorSearchService
 */
export function getVectorSearchService(firebaseConfig?: any): VectorSearchService {
  if (!vectorSearchServiceInstance) {
    if (!firebaseConfig) {
      throw new Error('Firebase config required for first initialization');
    }
    vectorSearchServiceInstance = new VectorSearchService(firebaseConfig);
  }
  return vectorSearchServiceInstance;
}

/**
 * Reset singleton instance (useful for testing)
 */
export function resetVectorSearchService(): void {
  vectorSearchServiceInstance = null;
}