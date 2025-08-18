import OpenAI from 'openai';
import { getSemanticSearchConfig, embeddingModels } from './config';
import { ContentExtractor, PerformanceMonitor, ValidationUtils } from './utils';
import type { 
  ServiceEmbedding, 
  EmbeddingMetadata, 
  EmbeddingGenerationJob,
  EmbeddingApiResponse 
} from '@/types/semantic-search';

export class EmbeddingService {
  private openai: OpenAI;
  private config: ReturnType<typeof getSemanticSearchConfig>;
  private activeJobs: Map<string, EmbeddingGenerationJob> = new Map();

  constructor() {
    this.config = getSemanticSearchConfig();
    
    if (!this.config.openai.apiKey) {
      throw new Error('OpenAI API key is required for embedding service');
    }
    
    this.openai = new OpenAI({
      apiKey: this.config.openai.apiKey,
    });
  }

  /**
   * Generate embedding for a single service
   */
  async generateServiceEmbedding(service: any): Promise<ServiceEmbedding> {
    const timer = PerformanceMonitor.startTimer();
    
    try {
      // Extract searchable content
      const searchContent = ContentExtractor.extractSearchableContent(service);
      
      if (!searchContent) {
        throw new Error(`No searchable content found for service ${service.id}`);
      }
      
      // Generate content hash for change detection
      const contentHash = ContentExtractor.generateContentHash(searchContent);
      
      // Count tokens (approximate)
      const tokenCount = this.estimateTokenCount(searchContent);
      
      // Validate token count
      if (tokenCount > this.config.openai.maxTokens) {
        throw new Error(`Content too long: ${tokenCount} tokens (max: ${this.config.openai.maxTokens})`);
      }
      
      // Generate embedding
      const embeddingResponse = await this.openai.embeddings.create({
        model: this.config.openai.model,
        input: searchContent,
        encoding_format: 'float',
      });
      
      const embedding = embeddingResponse.data[0].embedding;
      
      // Validate embedding
      if (!ValidationUtils.validateEmbedding(embedding)) {
        throw new Error('Invalid embedding generated');
      }
      
      // Create metadata
      const metadata: EmbeddingMetadata = {
        model: this.config.openai.model,
        generatedAt: new Date(),
        version: '1.0.0',
        contentHash,
        tokenCount: embeddingResponse.usage?.total_tokens || tokenCount,
      };
      
      const serviceEmbedding: ServiceEmbedding = {
        embedding,
        metadata,
        searchContent,
        contentSources: ContentExtractor.extractContentSources(service),
      };
      
      // Record performance metrics
      const duration = timer();
      PerformanceMonitor.recordMetric('embedding_generation_time', duration);
      PerformanceMonitor.recordMetric('embedding_token_count', metadata.tokenCount);
      
      return serviceEmbedding;
      
    } catch (error) {
      const duration = timer();
      PerformanceMonitor.recordMetric('embedding_generation_error', duration);
      
      if (error instanceof Error) {
        throw new Error(`Failed to generate embedding for service ${service.id}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple services in batch
   */
  async generateBatchEmbeddings(services: any[]): Promise<Map<string, ServiceEmbedding>> {
    const timer = PerformanceMonitor.startTimer();
    const results = new Map<string, ServiceEmbedding>();
    const errors: Array<{ serviceId: string; error: string }> = [];
    
    // Process in batches to respect rate limits
    const batchSize = this.config.openai.batchSize;
    const batches = this.chunkArray(services, batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        // Process batch with concurrency control
        const batchPromises = batch.map(async (service) => {
          try {
            const embedding = await this.generateServiceEmbedding(service);
            results.set(service.id, embedding);
          } catch (error) {
            errors.push({
              serviceId: service.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        });
        
        await Promise.all(batchPromises);
        
        // Add delay between batches to respect rate limits
        if (i < batches.length - 1) {
          await this.delay(1000); // 1 second delay
        }
        
      } catch (error) {
        console.error(`Batch ${i + 1} failed:`, error);
      }
    }
    
    const duration = timer();
    PerformanceMonitor.recordMetric('batch_embedding_time', duration);
    PerformanceMonitor.recordMetric('batch_embedding_count', services.length);
    PerformanceMonitor.recordMetric('batch_embedding_errors', errors.length);
    
    if (errors.length > 0) {
      console.warn(`Batch embedding completed with ${errors.length} errors:`, errors);
    }
    
    return results;
  }

  /**
   * Generate embedding for a search query
   */
  async generateQueryEmbedding(query: string): Promise<EmbeddingApiResponse> {
    const timer = PerformanceMonitor.startTimer();
    const requestId = this.generateRequestId();
    
    try {
      // Validate query
      const validation = ValidationUtils.validateSearchQuery(query);
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: 'INVALID_QUERY',
            message: validation.error!,
          },
          metadata: {
            requestId,
            timestamp: new Date(),
            tokenCount: 0,
            cost: 0,
          },
        };
      }
      
      // Count tokens
      const tokenCount = this.estimateTokenCount(query);
      
      // Generate embedding
      const embeddingResponse = await this.openai.embeddings.create({
        model: this.config.openai.model,
        input: query,
        encoding_format: 'float',
      });
      
      const embedding = embeddingResponse.data[0].embedding;
      
      // Calculate cost
      const modelConfig = embeddingModels[this.config.openai.model as keyof typeof embeddingModels];
      const cost = (embeddingResponse.usage?.total_tokens || tokenCount) * modelConfig.costPer1kTokens / 1000;
      
      const duration = timer();
      PerformanceMonitor.recordMetric('query_embedding_time', duration);
      PerformanceMonitor.recordMetric('query_embedding_cost', cost);
      
      return {
        success: true,
        data: {
          embedding,
          metadata: {
            model: this.config.openai.model,
            generatedAt: new Date(),
            version: '1.0.0',
            contentHash: ContentExtractor.generateContentHash(query),
            tokenCount: embeddingResponse.usage?.total_tokens || tokenCount,
          },
        },
        metadata: {
          requestId,
          timestamp: new Date(),
          tokenCount: embeddingResponse.usage?.total_tokens || tokenCount,
          cost,
        },
      };
      
    } catch (error) {
      const duration = timer();
      PerformanceMonitor.recordMetric('query_embedding_error', duration);
      
      return {
        success: false,
        error: {
          code: 'EMBEDDING_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: { query, duration },
        },
        metadata: {
          requestId,
          timestamp: new Date(),
          tokenCount: 0,
          cost: 0,
        },
      };
    }
  }

  /**
   * Create an embedding generation job for large batches
   */
  async createEmbeddingJob(serviceIds: string[]): Promise<EmbeddingGenerationJob> {
    const jobId = this.generateJobId();
    const estimatedCost = this.estimateBatchCost(serviceIds.length);
    
    const job: EmbeddingGenerationJob = {
      jobId,
      status: 'pending',
      serviceIds,
      progress: {
        total: serviceIds.length,
        completed: 0,
        failed: 0,
      },
      metadata: {
        startTime: new Date(),
        model: this.config.openai.model,
        version: '1.0.0',
        estimatedCost,
      },
    };
    
    this.activeJobs.set(jobId, job);
    
    // Start processing asynchronously
    this.processEmbeddingJob(jobId).catch(error => {
      console.error(`Embedding job ${jobId} failed:`, error);
      job.status = 'failed';
      job.error = {
        message: error.message,
        code: 'JOB_PROCESSING_FAILED',
        details: { jobId, error: error.toString() },
      };
    });
    
    return job;
  }

  /**
   * Get status of an embedding job
   */
  getEmbeddingJob(jobId: string): EmbeddingGenerationJob | null {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Process embedding job
   */
  private async processEmbeddingJob(jobId: string): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    
    job.status = 'processing';
    
    try {
      // In a real implementation, you would:
      // 1. Fetch services from Firestore
      // 2. Generate embeddings in batches
      // 3. Update Firestore with embeddings
      // 4. Track progress
      
      // For now, simulate the process
      const batchSize = this.config.performance.batchProcessingSize;
      const batches = this.chunkArray(job.serviceIds, batchSize);
      
      let totalCost = 0;
      
      for (const batch of batches) {
        // Simulate processing delay
        await this.delay(2000);
        
        // Update progress
        job.progress.completed += batch.length;
        
        // Simulate cost accumulation
        totalCost += this.estimateBatchCost(batch.length);
      }
      
      job.status = 'completed';
      job.metadata.endTime = new Date();
      job.metadata.actualCost = totalCost;
      
    } catch (error) {
      job.status = 'failed';
      job.error = {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'PROCESSING_FAILED',
        details: { jobId, error: error?.toString() },
      };
    }
  }

  /**
   * Check if embedding needs regeneration
   */
  needsRegeneration(service: any, existingEmbedding?: ServiceEmbedding): boolean {
    if (!existingEmbedding) return true;
    
    const currentContent = ContentExtractor.extractSearchableContent(service);
    const currentHash = ContentExtractor.generateContentHash(currentContent);
    
    return currentHash !== existingEmbedding.metadata.contentHash;
  }

  /**
   * Estimate token count for text (approximate)
   */
  private estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Estimate cost for batch processing
   */
  private estimateBatchCost(serviceCount: number): number {
    const avgTokensPerService = 500; // Estimated average
    const totalTokens = serviceCount * avgTokensPerService;
    const modelConfig = embeddingModels[this.config.openai.model as keyof typeof embeddingModels];
    
    return (totalTokens * modelConfig.costPer1kTokens) / 1000;
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return PerformanceMonitor.getAllMetrics();
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics() {
    PerformanceMonitor.clearMetrics();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string; details?: any }> {
    try {
      // Test with a simple embedding
      const testResponse = await this.openai.embeddings.create({
        model: this.config.openai.model,
        input: 'health check test',
        encoding_format: 'float',
      });
      
      if (testResponse.data && testResponse.data[0] && testResponse.data[0].embedding) {
        return {
          healthy: true,
          message: 'Embedding service is healthy',
          details: {
            model: this.config.openai.model,
            dimensions: testResponse.data[0].embedding.length,
            tokenUsage: testResponse.usage,
          },
        };
      } else {
        return {
          healthy: false,
          message: 'Invalid response from OpenAI API',
        };
      }
    } catch (error) {
      return {
        healthy: false,
        message: `Embedding service health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error?.toString() },
      };
    }
  }
}

// Singleton instance
let embeddingServiceInstance: EmbeddingService | null = null;

/**
 * Get singleton instance of EmbeddingService
 */
export function getEmbeddingService(): EmbeddingService {
  if (!embeddingServiceInstance) {
    embeddingServiceInstance = new EmbeddingService();
  }
  return embeddingServiceInstance;
}

/**
 * Reset singleton instance (useful for testing)
 */
export function resetEmbeddingService(): void {
  embeddingServiceInstance = null;
}