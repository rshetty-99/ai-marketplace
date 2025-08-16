import { SemanticSearchConfig } from '@/types/semantic-search';

// Default configuration for semantic search
export const defaultSemanticSearchConfig: SemanticSearchConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'text-embedding-3-small', // Cost-effective with good performance
    maxTokens: 8191, // Max for text-embedding-3-small
    batchSize: 100, // Process embeddings in batches
    retryAttempts: 3,
  },
  firestore: {
    collection: 'services',
    vectorField: 'embedding',
    indexName: 'services_vector_index',
  },
  search: {
    defaultLimit: 20,
    maxLimit: 100,
    defaultThreshold: 0.7, // Minimum similarity score
    enableHybridSearch: true,
    cacheEnabled: true,
    cacheTtl: 300, // 5 minutes
  },
  performance: {
    maxConcurrentEmbeddings: 5, // OpenAI rate limits
    batchProcessingSize: 50,
    requestTimeout: 30000, // 30 seconds
    enableMetrics: true,
  },
};

// Embedding model configurations
export const embeddingModels = {
  'text-embedding-3-small': {
    dimensions: 1536,
    maxTokens: 8191,
    costPer1kTokens: 0.00002, // $0.00002 per 1K tokens
    performance: 'good',
    recommended: true,
  },
  'text-embedding-3-large': {
    dimensions: 3072,
    maxTokens: 8191,
    costPer1kTokens: 0.00013, // $0.00013 per 1K tokens
    performance: 'excellent',
    recommended: false, // More expensive
  },
  'text-embedding-ada-002': {
    dimensions: 1536,
    maxTokens: 8191,
    costPer1kTokens: 0.0001, // $0.0001 per 1K tokens (legacy)
    performance: 'good',
    recommended: false, // Legacy model
  },
} as const;

// Search strategy configurations
export const searchStrategies = {
  semantic_only: {
    primary: 'vector' as const,
    fallbacks: [],
    weights: {
      vector: 1.0,
      text: 0.0,
      filters: 0.0,
      popularity: 0.0,
      recency: 0.0,
    },
  },
  hybrid_balanced: {
    primary: 'hybrid' as const,
    fallbacks: ['vector', 'text'],
    weights: {
      vector: 0.6,
      text: 0.2,
      filters: 0.1,
      popularity: 0.05,
      recency: 0.05,
    },
  },
  hybrid_semantic_heavy: {
    primary: 'hybrid' as const,
    fallbacks: ['vector', 'text'],
    weights: {
      vector: 0.8,
      text: 0.1,
      filters: 0.05,
      popularity: 0.03,
      recency: 0.02,
    },
  },
  traditional_fallback: {
    primary: 'text' as const,
    fallbacks: ['vector'],
    weights: {
      vector: 0.3,
      text: 0.5,
      filters: 0.1,
      popularity: 0.05,
      recency: 0.05,
    },
  },
} as const;

// Content extraction configuration
export const contentExtractionConfig = {
  // Fields to include in embedding generation
  includedFields: [
    'name',
    'description',
    'shortDescription',
    'tags',
    'category',
    'subcategory',
    'features',
    'benefits',
    'industries',
    'technologies',
    'useCases',
  ],
  
  // Field weights for content importance
  fieldWeights: {
    name: 3.0,
    description: 2.0,
    shortDescription: 1.5,
    tags: 1.8,
    category: 1.2,
    subcategory: 1.0,
    features: 1.5,
    benefits: 1.3,
    industries: 1.0,
    technologies: 1.4,
    useCases: 1.6,
  },
  
  // Text preprocessing options
  preprocessing: {
    removeHtml: true,
    removePunctuation: false,
    toLowerCase: true,
    removeStopWords: false, // Keep for semantic context
    maxLength: 8000, // Leave room for model limits
    minLength: 10,
  },
} as const;

// Query processing configuration
export const queryProcessingConfig = {
  // Query expansion settings
  expansion: {
    enabled: true,
    synonyms: {
      'AI': ['artificial intelligence', 'machine learning', 'ML'],
      'NLP': ['natural language processing', 'text analysis', 'language AI'],
      'ML': ['machine learning', 'artificial intelligence', 'AI'],
      'computer vision': ['image recognition', 'visual AI', 'image analysis'],
      'chatbot': ['conversational AI', 'virtual assistant', 'chat AI'],
    },
    maxExpansions: 3,
  },
  
  // Intent detection patterns
  intentPatterns: {
    product_search: [
      /looking for.*AI/i,
      /need.*machine learning/i,
      /want.*solution/i,
    ],
    service_discovery: [
      /what.*services/i,
      /show me.*providers/i,
      /find.*companies/i,
    ],
    comparison: [
      /compare.*services/i,
      /difference between/i,
      /vs\.|versus/i,
    ],
    specific_need: [
      /help.*with/i,
      /solve.*problem/i,
      /automate.*process/i,
    ],
  },
  
  // Spell correction settings
  spellCheck: {
    enabled: true,
    maxSuggestions: 3,
    confidenceThreshold: 0.8,
  },
} as const;

// Analytics and monitoring configuration
export const analyticsConfig = {
  // Events to track
  trackEvents: [
    'search_performed',
    'result_clicked',
    'result_viewed',
    'query_refined',
    'no_results_found',
    'search_abandoned',
  ],
  
  // Metrics to calculate
  metrics: {
    clickThroughRate: true,
    averagePosition: true,
    queryCompletionRate: true,
    resultRelevance: true,
    searchLatency: true,
    costTracking: true,
  },
  
  // Data retention
  retention: {
    rawQueries: 90, // days
    aggregatedMetrics: 365, // days
    userSessions: 30, // days
  },
} as const;

// Cost management configuration
export const costConfig = {
  // Budget limits
  dailyBudget: 50, // USD per day
  monthlyBudget: 1000, // USD per month
  
  // Alert thresholds
  alerts: {
    dailySpendThreshold: 0.8, // 80% of daily budget
    monthlySpendThreshold: 0.9, // 90% of monthly budget
    unusualUsageMultiplier: 3, // Alert if usage is 3x normal
  },
  
  // Cost optimization
  optimization: {
    enableCaching: true,
    batchRequests: true,
    deduplicateQueries: true,
    useSmallModel: true, // Use text-embedding-3-small by default
  },
} as const;

// Environment-specific overrides
export function getEnvironmentConfig(): Partial<SemanticSearchConfig> {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'development':
      return {
        search: {
          defaultLimit: 10,
          cacheEnabled: false, // Disable cache for testing
        },
        performance: {
          maxConcurrentEmbeddings: 2, // Lower for dev
          enableMetrics: true,
        },
      };
      
    case 'test':
      return {
        openai: {
          model: 'text-embedding-3-small',
          batchSize: 10,
        },
        search: {
          cacheEnabled: false,
        },
      };
      
    case 'production':
      return {
        performance: {
          maxConcurrentEmbeddings: 10, // Higher for prod
          enableMetrics: true,
        },
        search: {
          cacheEnabled: true,
          cacheTtl: 600, // 10 minutes in prod
        },
      };
      
    default:
      return {};
  }
}

// Merged configuration with environment overrides
export function getSemanticSearchConfig(): SemanticSearchConfig {
  const envConfig = getEnvironmentConfig();
  return {
    ...defaultSemanticSearchConfig,
    ...envConfig,
    openai: {
      ...defaultSemanticSearchConfig.openai,
      ...envConfig.openai,
    },
    firestore: {
      ...defaultSemanticSearchConfig.firestore,
      ...envConfig.firestore,
    },
    search: {
      ...defaultSemanticSearchConfig.search,
      ...envConfig.search,
    },
    performance: {
      ...defaultSemanticSearchConfig.performance,
      ...envConfig.performance,
    },
  };
}