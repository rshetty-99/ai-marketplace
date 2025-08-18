import { NextRequest, NextResponse } from 'next/server';
import { getVectorSearchService } from '@/lib/ai/semantic-search/vector-search-service';
import { ValidationUtils } from '@/lib/ai/semantic-search/utils';
import type { SearchQuery } from '@/types/semantic-search';

// Firebase configuration from environment variables
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Validate required environment variables
const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
}

/**
 * POST /api/search/semantic
 * 
 * Performs semantic search using Firestore Vector Search and OpenAI embeddings
 * 
 * Request Body:
 * {
 *   query: string;                    // Search query (required)
 *   filters?: {                       // Optional filters
 *     categories?: string[];
 *     industries?: string[];
 *     providerTypes?: string[];
 *     priceRange?: { min?: number; max?: number };
 *     minRating?: number;
 *     locations?: string[];
 *     technologies?: string[];
 *     features?: string[];
 *     compliance?: string[];
 *   };
 *   options?: {                       // Search options
 *     limit?: number;                 // Max results (default: 20, max: 100)
 *     offset?: number;                // Pagination offset
 *     threshold?: number;             // Similarity threshold (0-1)
 *     distanceMeasure?: string;       // COSINE | EUCLIDEAN | DOT_PRODUCT
 *     includeTextSearch?: boolean;    // Include traditional text search
 *     includeExplanation?: boolean;   // Include result explanations
 *     diversify?: boolean;            // Diversify results
 *   };
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   data?: SearchResponse;
 *   error?: { code: string; message: string; details?: any };
 *   metadata: { requestId: string; timestamp: Date; processingTime: number; version: string };
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    if (missingEnvVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'CONFIGURATION_ERROR',
          message: 'Server configuration error',
          details: { missingEnvVars },
        },
        metadata: {
          requestId: generateRequestId(),
          timestamp: new Date(),
          processingTime: 0,
          version: '1.0.0',
        },
      }, { status: 500 });
    }

    // Parse request body
    let body: SearchQuery;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body',
        },
        metadata: {
          requestId: generateRequestId(),
          timestamp: new Date(),
          processingTime: 0,
          version: '1.0.0',
        },
      }, { status: 400 });
    }

    // Validate request
    const validation = validateSearchRequest(body);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error,
          details: validation.details,
        },
        metadata: {
          requestId: generateRequestId(),
          timestamp: new Date(),
          processingTime: 0,
          version: '1.0.0',
        },
      }, { status: 400 });
    }

    // Initialize vector search service
    const searchService = getVectorSearchService(firebaseConfig);

    // Perform search
    const result = await searchService.search(body);

    // Return appropriate status code
    const statusCode = result.success ? 200 : 500;
    
    return NextResponse.json(result, { status: statusCode });

  } catch (error) {
    console.error('Semantic search API error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? { error: error?.toString() } : undefined,
      },
      metadata: {
        requestId: generateRequestId(),
        timestamp: new Date(),
        processingTime: 0,
        version: '1.0.0',
      },
    }, { status: 500 });
  }
}

/**
 * GET /api/search/semantic/health
 * 
 * Health check endpoint for semantic search service
 */
export async function GET(request: NextRequest) {
  try {
    // Check for health endpoint
    const url = new URL(request.url);
    if (url.pathname.endsWith('/health')) {
      if (missingEnvVars.length > 0) {
        return NextResponse.json({
          healthy: false,
          message: 'Configuration error',
          details: { missingEnvVars },
        }, { status: 503 });
      }

      const searchService = getVectorSearchService(firebaseConfig);
      const healthCheck = await searchService.healthCheck();
      
      const statusCode = healthCheck.healthy ? 200 : 503;
      return NextResponse.json(healthCheck, { status: statusCode });
    }

    // Return API documentation for GET requests to main endpoint
    return NextResponse.json({
      name: 'Semantic Search API',
      version: '1.0.0',
      description: 'AI-powered semantic search using Firestore Vector Search and OpenAI embeddings',
      endpoints: {
        'POST /api/search/semantic': 'Perform semantic search',
        'GET /api/search/semantic/health': 'Health check',
      },
      documentation: 'https://docs.example.com/api/semantic-search',
      status: 'operational',
    });

  } catch (error) {
    console.error('Semantic search API GET error:', error);
    
    return NextResponse.json({
      healthy: false,
      message: 'Service unavailable',
      details: process.env.NODE_ENV === 'development' ? { error: error?.toString() } : undefined,
    }, { status: 503 });
  }
}

/**
 * Validate search request
 */
function validateSearchRequest(body: any): { 
  valid: boolean; 
  error?: string; 
  details?: any; 
} {
  // Check if body exists
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      error: 'Request body is required',
    };
  }

  // Validate query
  const queryValidation = ValidationUtils.validateSearchQuery(body.query);
  if (!queryValidation.valid) {
    return {
      valid: false,
      error: queryValidation.error,
      details: { field: 'query' },
    };
  }

  // Validate options if provided
  if (body.options) {
    const optionsValidation = ValidationUtils.validateSearchOptions(body.options);
    if (!optionsValidation.valid) {
      return {
        valid: false,
        error: optionsValidation.error,
        details: { field: 'options' },
      };
    }
  }

  // Validate filters if provided
  if (body.filters) {
    const filtersValidation = validateFilters(body.filters);
    if (!filtersValidation.valid) {
      return {
        valid: false,
        error: filtersValidation.error,
        details: { field: 'filters' },
      };
    }
  }

  return { valid: true };
}

/**
 * Validate filters object
 */
function validateFilters(filters: any): { valid: boolean; error?: string } {
  if (typeof filters !== 'object') {
    return { valid: false, error: 'Filters must be an object' };
  }

  // Validate array fields
  const arrayFields = ['categories', 'industries', 'providerTypes', 'locations', 'technologies', 'features', 'compliance'];
  
  for (const field of arrayFields) {
    if (filters[field] && !Array.isArray(filters[field])) {
      return { valid: false, error: `${field} must be an array` };
    }
  }

  // Validate priceRange
  if (filters.priceRange) {
    if (typeof filters.priceRange !== 'object') {
      return { valid: false, error: 'priceRange must be an object' };
    }
    
    if (filters.priceRange.min !== undefined && (typeof filters.priceRange.min !== 'number' || filters.priceRange.min < 0)) {
      return { valid: false, error: 'priceRange.min must be a non-negative number' };
    }
    
    if (filters.priceRange.max !== undefined && (typeof filters.priceRange.max !== 'number' || filters.priceRange.max < 0)) {
      return { valid: false, error: 'priceRange.max must be a non-negative number' };
    }
    
    if (filters.priceRange.min !== undefined && filters.priceRange.max !== undefined && filters.priceRange.min > filters.priceRange.max) {
      return { valid: false, error: 'priceRange.min cannot be greater than priceRange.max' };
    }
  }

  // Validate minRating
  if (filters.minRating !== undefined && (typeof filters.minRating !== 'number' || filters.minRating < 0 || filters.minRating > 5)) {
    return { valid: false, error: 'minRating must be a number between 0 and 5' };
  }

  return { valid: true };
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Rate limiting middleware (placeholder)
 * In production, you might want to implement proper rate limiting
 */
async function checkRateLimit(request: NextRequest): Promise<boolean> {
  // Implementation would depend on your rate limiting strategy
  // Could use Redis, memory store, or external service
  return true;
}

/**
 * Authentication middleware (placeholder)
 * In production, you might want to implement authentication
 */
async function authenticate(request: NextRequest): Promise<{ authenticated: boolean; userId?: string }> {
  // Implementation would depend on your authentication strategy
  // Could check API keys, JWT tokens, etc.
  return { authenticated: true };
}