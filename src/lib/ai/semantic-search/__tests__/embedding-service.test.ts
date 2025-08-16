import { EmbeddingService } from '../embedding-service';
import { ContentExtractor } from '../utils';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: jest.fn(),
      },
    })),
  };
});

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
    OPENAI_API_KEY: 'test-api-key',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('EmbeddingService', () => {
  let embeddingService: EmbeddingService;
  let mockOpenAI: any;

  const mockService = {
    id: 'test-service-1',
    name: 'AI Document Processing Service',
    description: 'Advanced machine learning service for document analysis',
    tags: ['AI', 'ML', 'document'],
    category: 'computer_vision',
    features: ['batch_processing', 'real_time_api'],
  };

  const mockEmbeddingResponse = {
    data: [{
      embedding: new Array(1536).fill(0).map(() => Math.random()),
    }],
    usage: {
      total_tokens: 100,
    },
  };

  beforeEach(() => {
    const OpenAI = require('openai').default;
    mockOpenAI = new OpenAI();
    mockOpenAI.embeddings.create.mockResolvedValue(mockEmbeddingResponse);
    
    embeddingService = new EmbeddingService();
  });

  describe('constructor', () => {
    it('should initialize with valid API key', () => {
      expect(() => new EmbeddingService()).not.toThrow();
    });

    it('should throw error without API key', () => {
      process.env.OPENAI_API_KEY = '';
      expect(() => new EmbeddingService()).toThrow('OpenAI API key is required');
    });
  });

  describe('generateServiceEmbedding', () => {
    it('should generate embedding for valid service', async () => {
      const result = await embeddingService.generateServiceEmbedding(mockService);
      
      expect(result).toBeDefined();
      expect(result.embedding).toHaveLength(1536);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.model).toBe('text-embedding-3-small');
      expect(result.metadata.tokenCount).toBe(100);
      expect(result.searchContent).toBeTruthy();
      expect(result.contentSources).toBeDefined();
    });

    it('should include content sources', async () => {
      const result = await embeddingService.generateServiceEmbedding(mockService);
      
      expect(result.contentSources.name).toBe(mockService.name);
      expect(result.contentSources.description).toBe(mockService.description);
      expect(result.contentSources.tags).toEqual(mockService.tags);
      expect(result.contentSources.category).toBe(mockService.category);
    });

    it('should generate content hash', async () => {
      const result = await embeddingService.generateServiceEmbedding(mockService);
      
      expect(result.metadata.contentHash).toBeDefined();
      expect(result.metadata.contentHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should handle OpenAI API errors', async () => {
      mockOpenAI.embeddings.create.mockRejectedValue(new Error('API Error'));
      
      await expect(embeddingService.generateServiceEmbedding(mockService))
        .rejects.toThrow('Failed to generate embedding for service test-service-1: API Error');
    });

    it('should handle empty content', async () => {
      const emptyService = { id: 'empty-service' };
      
      await expect(embeddingService.generateServiceEmbedding(emptyService))
        .rejects.toThrow('No searchable content found for service empty-service');
    });

    it('should handle content too long', async () => {
      const longService = {
        id: 'long-service',
        description: 'a'.repeat(50000),
      };
      
      await expect(embeddingService.generateServiceEmbedding(longService))
        .rejects.toThrow('Content too long');
    });

    it('should validate generated embedding', async () => {
      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [{ embedding: [1, 2, 3] }], // Invalid dimensions
        usage: { total_tokens: 10 },
      });
      
      await expect(embeddingService.generateServiceEmbedding(mockService))
        .rejects.toThrow('Invalid embedding generated');
    });
  });

  describe('generateBatchEmbeddings', () => {
    const mockServices = [
      { ...mockService, id: 'service-1' },
      { ...mockService, id: 'service-2' },
      { ...mockService, id: 'service-3' },
    ];

    it('should process batch of services', async () => {
      const results = await embeddingService.generateBatchEmbeddings(mockServices);
      
      expect(results.size).toBe(3);
      expect(results.has('service-1')).toBe(true);
      expect(results.has('service-2')).toBe(true);
      expect(results.has('service-3')).toBe(true);
    });

    it('should handle partial failures', async () => {
      mockOpenAI.embeddings.create
        .mockResolvedValueOnce(mockEmbeddingResponse)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(mockEmbeddingResponse);
      
      const results = await embeddingService.generateBatchEmbeddings(mockServices);
      
      expect(results.size).toBe(2); // Only successful ones
      expect(results.has('service-1')).toBe(true);
      expect(results.has('service-2')).toBe(false); // Failed
      expect(results.has('service-3')).toBe(true);
    });

    it('should respect batch size', async () => {
      const largeServiceList = Array.from({ length: 25 }, (_, i) => ({
        ...mockService,
        id: `service-${i}`,
      }));
      
      await embeddingService.generateBatchEmbeddings(largeServiceList);
      
      // Should be called in batches (default batch size is 10)
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledTimes(25);
    });
  });

  describe('generateQueryEmbedding', () => {
    it('should generate embedding for valid query', async () => {
      const result = await embeddingService.generateQueryEmbedding('machine learning AI');
      
      expect(result.success).toBe(true);
      expect(result.data?.embedding).toHaveLength(1536);
      expect(result.data?.metadata.model).toBe('text-embedding-3-small');
      expect(result.metadata.tokenCount).toBe(100);
    });

    it('should calculate cost', async () => {
      const result = await embeddingService.generateQueryEmbedding('test query');
      
      expect(result.metadata.cost).toBeGreaterThan(0);
      expect(result.metadata.cost).toBe(100 * 0.00002 / 1000); // Expected cost calculation
    });

    it('should handle invalid query', async () => {
      const result = await embeddingService.generateQueryEmbedding('');
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_QUERY');
    });

    it('should handle API errors', async () => {
      mockOpenAI.embeddings.create.mockRejectedValue(new Error('API Error'));
      
      const result = await embeddingService.generateQueryEmbedding('test query');
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMBEDDING_GENERATION_FAILED');
    });
  });

  describe('createEmbeddingJob', () => {
    it('should create embedding job', async () => {
      const serviceIds = ['service-1', 'service-2', 'service-3'];
      const job = await embeddingService.createEmbeddingJob(serviceIds);
      
      expect(job.jobId).toBeDefined();
      expect(job.status).toBe('pending');
      expect(job.serviceIds).toEqual(serviceIds);
      expect(job.progress.total).toBe(3);
      expect(job.metadata.estimatedCost).toBeGreaterThan(0);
    });

    it('should track job progress', async () => {
      const serviceIds = ['service-1'];
      const job = await embeddingService.createEmbeddingJob(serviceIds);
      
      // Wait a bit for async processing to start
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const updatedJob = embeddingService.getEmbeddingJob(job.jobId);
      expect(updatedJob?.status).toMatch(/pending|processing|completed|failed/);
    });
  });

  describe('needsRegeneration', () => {
    it('should return true when no existing embedding', () => {
      const needsRegen = embeddingService.needsRegeneration(mockService);
      expect(needsRegen).toBe(true);
    });

    it('should return true when content hash differs', () => {
      const existingEmbedding = {
        embedding: new Array(1536).fill(0.5),
        metadata: {
          contentHash: 'old-hash',
          model: 'text-embedding-3-small',
          generatedAt: new Date(),
          version: '1.0.0',
          tokenCount: 100,
        },
        searchContent: 'old content',
        contentSources: {
          name: '', description: '', tags: [], category: '',
          features: [], industries: [], technologies: [],
        },
      };
      
      const needsRegen = embeddingService.needsRegeneration(mockService, existingEmbedding);
      expect(needsRegen).toBe(true);
    });

    it('should return false when content hash matches', () => {
      const currentContent = ContentExtractor.extractSearchableContent(mockService);
      const currentHash = ContentExtractor.generateContentHash(currentContent);
      
      const existingEmbedding = {
        embedding: new Array(1536).fill(0.5),
        metadata: {
          contentHash: currentHash,
          model: 'text-embedding-3-small',
          generatedAt: new Date(),
          version: '1.0.0',
          tokenCount: 100,
        },
        searchContent: currentContent,
        contentSources: {
          name: '', description: '', tags: [], category: '',
          features: [], industries: [], technologies: [],
        },
      };
      
      const needsRegen = embeddingService.needsRegeneration(mockService, existingEmbedding);
      expect(needsRegen).toBe(false);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      const health = await embeddingService.healthCheck();
      
      expect(health.healthy).toBe(true);
      expect(health.message).toContain('healthy');
      expect(health.details?.model).toBe('text-embedding-3-small');
      expect(health.details?.dimensions).toBe(1536);
    });

    it('should return unhealthy status on API error', async () => {
      mockOpenAI.embeddings.create.mockRejectedValue(new Error('API Error'));
      
      const health = await embeddingService.healthCheck();
      
      expect(health.healthy).toBe(false);
      expect(health.message).toContain('failed');
    });

    it('should handle invalid API response', async () => {
      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [], // Empty data array
      });
      
      const health = await embeddingService.healthCheck();
      
      expect(health.healthy).toBe(false);
      expect(health.message).toContain('Invalid response');
    });
  });

  describe('performance metrics', () => {
    it('should track embedding generation metrics', async () => {
      await embeddingService.generateServiceEmbedding(mockService);
      
      const metrics = embeddingService.getPerformanceMetrics();
      expect(metrics.embedding_generation_time).toBeDefined();
      expect(metrics.embedding_token_count).toBeDefined();
    });

    it('should clear metrics', () => {
      embeddingService.clearPerformanceMetrics();
      const metrics = embeddingService.getPerformanceMetrics();
      expect(Object.keys(metrics)).toHaveLength(0);
    });
  });
});