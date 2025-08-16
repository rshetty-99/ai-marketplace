import { NextRequest, NextResponse } from 'next/server';
import { getVectorSearchService } from '@/lib/ai/semantic-search/vector-search-service';
import { getEmbeddingService } from '@/lib/ai/semantic-search/embedding-service';

// Firebase configuration from environment variables
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

/**
 * GET /api/search/semantic/health
 * 
 * Comprehensive health check for semantic search service
 * 
 * Response:
 * {
 *   healthy: boolean;
 *   message: string;
 *   timestamp: string;
 *   version: string;
 *   services: {
 *     vectorSearch: { healthy: boolean; message: string; details?: any };
 *     embedding: { healthy: boolean; message: string; details?: any };
 *     firestore: { healthy: boolean; message: string; details?: any };
 *     openai: { healthy: boolean; message: string; details?: any };
 *   };
 *   performance: {
 *     searchMetrics: any;
 *     embeddingMetrics: any;
 *   };
 *   configuration: {
 *     environment: string;
 *     cacheEnabled: boolean;
 *     embeddingModel: string;
 *   };
 * }
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const healthReport = {
      healthy: true,
      message: 'All services operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        vectorSearch: { healthy: false, message: 'Not checked' },
        embedding: { healthy: false, message: 'Not checked' },
        firestore: { healthy: false, message: 'Not checked' },
        openai: { healthy: false, message: 'Not checked' },
      },
      performance: {
        searchMetrics: {},
        embeddingMetrics: {},
      },
      configuration: {
        environment: process.env.NODE_ENV || 'unknown',
        cacheEnabled: false,
        embeddingModel: 'text-embedding-3-small',
      },
      responseTime: 0,
    };

    // Check required environment variables
    const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'OPENAI_API_KEY'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingEnvVars.length > 0) {
      healthReport.healthy = false;
      healthReport.message = `Missing environment variables: ${missingEnvVars.join(', ')}`;
      healthReport.responseTime = Date.now() - startTime;
      
      return NextResponse.json(healthReport, { status: 503 });
    }

    // Initialize services
    let vectorSearchService;
    let embeddingService;

    try {
      vectorSearchService = getVectorSearchService(firebaseConfig);
      embeddingService = getEmbeddingService();
    } catch (error) {
      healthReport.healthy = false;
      healthReport.message = `Service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      healthReport.responseTime = Date.now() - startTime;
      
      return NextResponse.json(healthReport, { status: 503 });
    }

    // Perform health checks in parallel
    const healthChecks = await Promise.allSettled([
      checkVectorSearchHealth(vectorSearchService),
      checkEmbeddingHealth(embeddingService),
      checkFirestoreHealth(),
      checkOpenAIHealth(),
    ]);

    // Process health check results
    const [vectorSearchHealth, embeddingHealth, firestoreHealth, openaiHealth] = healthChecks;

    if (vectorSearchHealth.status === 'fulfilled') {
      healthReport.services.vectorSearch = vectorSearchHealth.value;
    } else {
      healthReport.services.vectorSearch = {
        healthy: false,
        message: `Vector search check failed: ${vectorSearchHealth.reason}`,
      };
    }

    if (embeddingHealth.status === 'fulfilled') {
      healthReport.services.embedding = embeddingHealth.value;
    } else {
      healthReport.services.embedding = {
        healthy: false,
        message: `Embedding check failed: ${embeddingHealth.reason}`,
      };
    }

    if (firestoreHealth.status === 'fulfilled') {
      healthReport.services.firestore = firestoreHealth.value;
    } else {
      healthReport.services.firestore = {
        healthy: false,
        message: `Firestore check failed: ${firestoreHealth.reason}`,
      };
    }

    if (openaiHealth.status === 'fulfilled') {
      healthReport.services.openai = openaiHealth.value;
    } else {
      healthReport.services.openai = {
        healthy: false,
        message: `OpenAI check failed: ${openaiHealth.reason}`,
      };
    }

    // Get performance metrics
    try {
      healthReport.performance.searchMetrics = vectorSearchService.getPerformanceMetrics();
      healthReport.performance.embeddingMetrics = embeddingService.getPerformanceMetrics();
    } catch (error) {
      // Performance metrics are optional
    }

    // Update configuration info
    healthReport.configuration.cacheEnabled = true; // Get from actual config

    // Determine overall health
    const allServicesHealthy = Object.values(healthReport.services).every(service => service.healthy);
    
    if (!allServicesHealthy) {
      healthReport.healthy = false;
      healthReport.message = 'One or more services are unhealthy';
    }

    healthReport.responseTime = Date.now() - startTime;

    // Return appropriate status code
    const statusCode = healthReport.healthy ? 200 : 503;
    
    return NextResponse.json(healthReport, { status: statusCode });

  } catch (error) {
    console.error('Health check error:', error);
    
    const errorResponse = {
      healthy: false,
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      responseTime: Date.now() - startTime,
      error: process.env.NODE_ENV === 'development' ? error?.toString() : undefined,
    };

    return NextResponse.json(errorResponse, { status: 503 });
  }
}

/**
 * Check vector search service health
 */
async function checkVectorSearchHealth(service: any) {
  try {
    return await service.healthCheck();
  } catch (error) {
    return {
      healthy: false,
      message: `Vector search health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check embedding service health
 */
async function checkEmbeddingHealth(service: any) {
  try {
    return await service.healthCheck();
  } catch (error) {
    return {
      healthy: false,
      message: `Embedding service health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check Firestore connectivity
 */
async function checkFirestoreHealth() {
  try {
    // Import Firestore modules
    const { initializeApp } = await import('firebase/app');
    const { getFirestore, collection, query, limit, getDocs } = await import('firebase/firestore');
    
    // Initialize Firestore
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Try to read a document (with minimal data transfer)
    const testQuery = query(collection(db, 'services'), limit(1));
    const snapshot = await getDocs(testQuery);
    
    return {
      healthy: true,
      message: 'Firestore connection successful',
      details: {
        connected: true,
        testQueryExecuted: true,
        documentsFound: snapshot.size,
      },
    };
  } catch (error) {
    return {
      healthy: false,
      message: `Firestore connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        connected: false,
        error: error?.toString(),
      },
    };
  }
}

/**
 * Check OpenAI API connectivity
 */
async function checkOpenAIHealth() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        healthy: false,
        message: 'OpenAI API key not configured',
      };
    }

    // Import OpenAI
    const { default: OpenAI } = await import('openai');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Test with a minimal embedding request
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: 'health check',
      encoding_format: 'float',
    });

    if (response.data && response.data[0] && response.data[0].embedding) {
      return {
        healthy: true,
        message: 'OpenAI API connection successful',
        details: {
          connected: true,
          model: 'text-embedding-3-small',
          embeddingDimensions: response.data[0].embedding.length,
          tokenUsage: response.usage,
        },
      };
    } else {
      return {
        healthy: false,
        message: 'OpenAI API returned invalid response',
      };
    }
  } catch (error) {
    return {
      healthy: false,
      message: `OpenAI API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        connected: false,
        error: error?.toString(),
      },
    };
  }
}

/**
 * OPTIONS request handler for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}