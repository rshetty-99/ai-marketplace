// Semantic Search Types for AI Marketplace Platform

export interface EmbeddingMetadata {
  /** Model used to generate the embedding */
  model: string;
  /** Timestamp when embedding was generated */
  generatedAt: Date;
  /** Version of the embedding pipeline */
  version: string;
  /** Original content hash for change detection */
  contentHash: string;
  /** Token count used for billing */
  tokenCount: number;
}

export interface ServiceEmbedding {
  /** The embedding vector (1536 dimensions for text-embedding-3-small) */
  embedding: number[];
  /** Metadata about the embedding generation */
  metadata: EmbeddingMetadata;
  /** Searchable content that was embedded */
  searchContent: string;
  /** Individual content components */
  contentSources: {
    name: string;
    description: string;
    tags: string[];
    category: string;
    features: string[];
    industries: string[];
    technologies: string[];
  };
}

export interface SearchQuery {
  /** The user's search query */
  query: string;
  /** Optional filters to apply */
  filters?: SearchFilters;
  /** Search configuration options */
  options?: SearchOptions;
}

export interface SearchFilters {
  /** Category filters */
  categories?: string[];
  /** Industry filters */
  industries?: string[];
  /** Provider type filters */
  providerTypes?: string[];
  /** Price range filter */
  priceRange?: {
    min?: number;
    max?: number;
  };
  /** Rating filter */
  minRating?: number;
  /** Location filters */
  locations?: string[];
  /** Technology filters */
  technologies?: string[];
  /** Feature filters */
  features?: string[];
  /** Compliance filters */
  compliance?: string[];
}

export interface SearchOptions {
  /** Maximum number of results to return */
  limit?: number;
  /** Search result offset for pagination */
  offset?: number;
  /** Similarity threshold (0-1) */
  threshold?: number;
  /** Distance measure for vector search */
  distanceMeasure?: 'COSINE' | 'EUCLIDEAN' | 'DOT_PRODUCT';
  /** Whether to include traditional text search */
  includeTextSearch?: boolean;
  /** Whether to include explanation of relevance */
  includeExplanation?: boolean;
  /** Search result diversification */
  diversify?: boolean;
}

export interface SearchResult {
  /** The service ID */
  serviceId: string;
  /** Relevance score (0-1, higher is more relevant) */
  score: number;
  /** Distance from query vector */
  distance: number;
  /** Why this result was matched */
  explanation?: SearchExplanation;
  /** The actual service data */
  service: any; // Will be typed as Service from existing types
}

export interface SearchExplanation {
  /** Primary matching factors */
  matchingFactors: string[];
  /** Semantic similarity indicators */
  semanticMatch: {
    /** Key terms that matched semantically */
    matchedConcepts: string[];
    /** Confidence in semantic match */
    confidence: number;
  };
  /** Traditional text match indicators */
  textMatch?: {
    /** Exact keyword matches */
    exactMatches: string[];
    /** Partial matches */
    partialMatches: string[];
  };
  /** Applied filters */
  filterMatches?: string[];
}

export interface SearchResponse {
  /** Search results */
  results: SearchResult[];
  /** Total number of potential results */
  totalCount: number;
  /** Query processing metadata */
  queryMetadata: QueryMetadata;
  /** Search performance metrics */
  performance: SearchPerformance;
  /** Suggested refinements */
  suggestions?: SearchSuggestion[];
}

export interface QueryMetadata {
  /** Original query */
  originalQuery: string;
  /** Processed/cleaned query */
  processedQuery: string;
  /** Generated embedding */
  queryEmbedding: number[];
  /** Query intent classification */
  intent?: QueryIntent;
  /** Search strategy used */
  strategy: SearchStrategy;
}

export interface QueryIntent {
  /** Detected intent category */
  category: 'product_search' | 'service_discovery' | 'comparison' | 'specific_need';
  /** Confidence in intent detection */
  confidence: number;
  /** Extracted entities */
  entities: {
    technologies?: string[];
    industries?: string[];
    useCases?: string[];
    budget?: number;
  };
}

export interface SearchStrategy {
  /** Primary search method used */
  primary: 'vector' | 'text' | 'hybrid';
  /** Fallback methods */
  fallbacks: string[];
  /** Weights applied to different signals */
  weights: {
    vector: number;
    text: number;
    filters: number;
    popularity: number;
    recency: number;
  };
}

export interface SearchPerformance {
  /** Total search time in milliseconds */
  totalTime: number;
  /** Vector search time */
  vectorSearchTime: number;
  /** Text search time */
  textSearchTime?: number;
  /** Filtering time */
  filterTime: number;
  /** Ranking time */
  rankingTime: number;
  /** Number of documents scanned */
  documentsScanned: number;
  /** Cache hit/miss status */
  cacheStatus: 'hit' | 'miss' | 'partial';
}

export interface SearchSuggestion {
  /** Suggested query refinement */
  query: string;
  /** Type of suggestion */
  type: 'spelling' | 'expansion' | 'filter' | 'category';
  /** Expected improvement */
  expectedResultCount: number;
  /** Reason for suggestion */
  reason: string;
}

export interface SearchAnalytics {
  /** Unique query identifier */
  queryId: string;
  /** Search query details */
  query: SearchQuery;
  /** Search results */
  results: SearchResult[];
  /** User interactions */
  interactions: SearchInteraction[];
  /** Session information */
  session: {
    userId?: string;
    sessionId: string;
    timestamp: Date;
    userAgent: string;
    location?: string;
  };
  /** Business metrics */
  metrics: {
    clickThroughRate: number;
    timeToFirstClick: number;
    conversionRate: number;
    satisfactionScore?: number;
  };
}

export interface SearchInteraction {
  /** Type of interaction */
  type: 'click' | 'view' | 'contact' | 'bookmark' | 'compare';
  /** Target service ID */
  serviceId: string;
  /** Result position when interacted */
  position: number;
  /** Timestamp of interaction */
  timestamp: Date;
  /** Additional context */
  context?: Record<string, any>;
}

export interface EmbeddingGenerationJob {
  /** Job identifier */
  jobId: string;
  /** Job status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Services to process */
  serviceIds: string[];
  /** Processing progress */
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  /** Job metadata */
  metadata: {
    startTime: Date;
    endTime?: Date;
    model: string;
    version: string;
    estimatedCost: number;
    actualCost?: number;
  };
  /** Error information if failed */
  error?: {
    message: string;
    code: string;
    details: Record<string, any>;
  };
}

export interface SearchIndex {
  /** Index name */
  name: string;
  /** Index status */
  status: 'building' | 'ready' | 'updating' | 'error';
  /** Number of indexed documents */
  documentCount: number;
  /** Index configuration */
  config: {
    embeddingModel: string;
    dimensions: number;
    distanceMeasure: string;
    updateFrequency: string;
  };
  /** Index statistics */
  stats: {
    averageDocumentSize: number;
    totalStorageSize: number;
    lastUpdated: Date;
    queryPerformance: {
      averageLatency: number;
      p95Latency: number;
      throughput: number;
    };
  };
}

// Configuration types
export interface SemanticSearchConfig {
  /** OpenAI configuration */
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
    batchSize: number;
    retryAttempts: number;
  };
  /** Firestore configuration */
  firestore: {
    collection: string;
    vectorField: string;
    indexName?: string;
  };
  /** Search behavior configuration */
  search: {
    defaultLimit: number;
    maxLimit: number;
    defaultThreshold: number;
    enableHybridSearch: boolean;
    cacheEnabled: boolean;
    cacheTtl: number;
  };
  /** Performance configuration */
  performance: {
    maxConcurrentEmbeddings: number;
    batchProcessingSize: number;
    requestTimeout: number;
    enableMetrics: boolean;
  };
}

// API Response types for external consumption
export interface SemanticSearchApiResponse {
  success: boolean;
  data?: SearchResponse;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata: {
    requestId: string;
    timestamp: Date;
    processingTime: number;
    version: string;
  };
}

export interface EmbeddingApiResponse {
  success: boolean;
  data?: {
    embedding: number[];
    metadata: EmbeddingMetadata;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata: {
    requestId: string;
    timestamp: Date;
    tokenCount: number;
    cost: number;
  };
}