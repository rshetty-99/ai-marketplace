import { 
  ContentExtractor, 
  QueryProcessor, 
  SimilarityCalculator, 
  ExplanationGenerator,
  PerformanceMonitor,
  ValidationUtils 
} from '../utils';

describe('ContentExtractor', () => {
  const mockService = {
    id: 'test-service-1',
    name: 'AI Document Processing Service',
    description: 'Advanced machine learning service for document analysis and extraction',
    shortDescription: 'ML-powered document processing',
    tags: ['AI', 'ML', 'document', 'OCR'],
    category: 'computer_vision',
    subcategory: 'document_processing',
    features: ['batch_processing', 'real_time_api', 'custom_training'],
    benefits: ['improved_accuracy', 'cost_reduction'],
    industries: ['healthcare', 'finance', 'legal'],
    technologies: ['tensorflow', 'opencv', 'tesseract'],
    useCases: ['invoice_processing', 'contract_analysis'],
  };

  describe('extractSearchableContent', () => {
    it('should extract and combine all searchable fields', () => {
      const content = ContentExtractor.extractSearchableContent(mockService);
      
      expect(content).toContain('AI Document Processing Service');
      expect(content).toContain('machine learning');
      expect(content).toContain('document analysis');
      expect(content).toContain('tensorflow');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should apply field weights correctly', () => {
      const content = ContentExtractor.extractSearchableContent(mockService);
      
      // Name should appear multiple times due to higher weight
      const nameOccurrences = (content.match(/AI Document Processing Service/g) || []).length;
      expect(nameOccurrences).toBeGreaterThan(1);
    });

    it('should handle missing fields gracefully', () => {
      const incompleteService = {
        id: 'test-service-2',
        name: 'Simple Service',
      };
      
      const content = ContentExtractor.extractSearchableContent(incompleteService);
      expect(content).toBe('simple service');
    });

    it('should handle array fields correctly', () => {
      const content = ContentExtractor.extractSearchableContent(mockService);
      expect(content).toContain('healthcare finance legal');
      expect(content).toContain('tensorflow opencv tesseract');
    });
  });

  describe('preprocessText', () => {
    it('should remove HTML tags', () => {
      const text = 'This is <b>bold</b> and <i>italic</i> text';
      const processed = ContentExtractor.preprocessText(text);
      expect(processed).toBe('this is bold and italic text');
    });

    it('should convert to lowercase', () => {
      const text = 'UPPERCASE and MixedCase';
      const processed = ContentExtractor.preprocessText(text);
      expect(processed).toBe('uppercase and mixedcase');
    });

    it('should normalize whitespace', () => {
      const text = 'Multiple   spaces\n\nand\tlines';
      const processed = ContentExtractor.preprocessText(text);
      expect(processed).toBe('multiple spaces and lines');
    });

    it('should handle length constraints', () => {
      const longText = 'a'.repeat(10000);
      const processed = ContentExtractor.preprocessText(longText);
      expect(processed.length).toBeLessThanOrEqual(8000);
    });

    it('should return empty string for very short content', () => {
      const shortText = 'hi';
      const processed = ContentExtractor.preprocessText(shortText);
      expect(processed).toBe('');
    });
  });

  describe('generateContentHash', () => {
    it('should generate consistent hashes for same content', () => {
      const content = 'test content';
      const hash1 = ContentExtractor.generateContentHash(content);
      const hash2 = ContentExtractor.generateContentHash(content);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different content', () => {
      const hash1 = ContentExtractor.generateContentHash('content 1');
      const hash2 = ContentExtractor.generateContentHash('content 2');
      expect(hash1).not.toBe(hash2);
    });

    it('should generate SHA256 hash', () => {
      const hash = ContentExtractor.generateContentHash('test');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});

describe('QueryProcessor', () => {
  describe('processQuery', () => {
    it('should clean and normalize query', () => {
      const query = '  Machine Learning AI  ';
      const processed = QueryProcessor.processQuery(query);
      expect(processed).toContain('machine learning');
      expect(processed).toContain('artificial intelligence');
    });

    it('should expand synonyms', () => {
      const query = 'AI solutions';
      const processed = QueryProcessor.processQuery(query);
      expect(processed).toContain('artificial intelligence');
      expect(processed).toContain('machine learning');
    });

    it('should apply spell correction', () => {
      const query = 'machien leraning';
      const processed = QueryProcessor.processQuery(query);
      expect(processed).toContain('machine learning');
    });
  });

  describe('detectIntent', () => {
    it('should detect product search intent', () => {
      const query = 'looking for AI solutions';
      const intent = QueryProcessor.detectIntent(query);
      expect(intent.category).toBe('product_search');
      expect(intent.confidence).toBeGreaterThan(0);
    });

    it('should detect service discovery intent', () => {
      const query = 'what AI services are available';
      const intent = QueryProcessor.detectIntent(query);
      expect(intent.category).toBe('service_discovery');
    });

    it('should detect comparison intent', () => {
      const query = 'compare AI services vs traditional solutions';
      const intent = QueryProcessor.detectIntent(query);
      expect(intent.category).toBe('comparison');
    });

    it('should extract entities from query', () => {
      const query = 'machine learning for healthcare with $10000 budget';
      const intent = QueryProcessor.detectIntent(query);
      
      expect(intent.entities.technologies).toContain('machine learning');
      expect(intent.entities.industries).toContain('healthcare');
      expect(intent.entities.budget).toBe(10000);
    });
  });
});

describe('SimilarityCalculator', () => {
  describe('cosineSimilarity', () => {
    it('should calculate cosine similarity correctly', () => {
      const vector1 = [1, 0, 0];
      const vector2 = [1, 0, 0];
      const similarity = SimilarityCalculator.cosineSimilarity(vector1, vector2);
      expect(similarity).toBeCloseTo(1.0);
    });

    it('should handle orthogonal vectors', () => {
      const vector1 = [1, 0, 0];
      const vector2 = [0, 1, 0];
      const similarity = SimilarityCalculator.cosineSimilarity(vector1, vector2);
      expect(similarity).toBeCloseTo(0.0);
    });

    it('should handle opposite vectors', () => {
      const vector1 = [1, 0, 0];
      const vector2 = [-1, 0, 0];
      const similarity = SimilarityCalculator.cosineSimilarity(vector1, vector2);
      expect(similarity).toBeCloseTo(-1.0);
    });

    it('should throw error for different length vectors', () => {
      const vector1 = [1, 0];
      const vector2 = [1, 0, 0];
      expect(() => {
        SimilarityCalculator.cosineSimilarity(vector1, vector2);
      }).toThrow('Vectors must have the same length');
    });
  });

  describe('euclideanDistance', () => {
    it('should calculate Euclidean distance correctly', () => {
      const vector1 = [0, 0];
      const vector2 = [3, 4];
      const distance = SimilarityCalculator.euclideanDistance(vector1, vector2);
      expect(distance).toBeCloseTo(5.0);
    });

    it('should return 0 for identical vectors', () => {
      const vector1 = [1, 2, 3];
      const vector2 = [1, 2, 3];
      const distance = SimilarityCalculator.euclideanDistance(vector1, vector2);
      expect(distance).toBeCloseTo(0.0);
    });
  });

  describe('distanceToSimilarity', () => {
    it('should convert cosine distance to similarity', () => {
      const similarity = SimilarityCalculator.distanceToSimilarity(0.2, 'COSINE');
      expect(similarity).toBeCloseTo(0.8);
    });

    it('should handle Euclidean distance', () => {
      const similarity = SimilarityCalculator.distanceToSimilarity(1.0, 'EUCLIDEAN');
      expect(similarity).toBeCloseTo(0.5);
    });

    it('should handle dot product', () => {
      const similarity = SimilarityCalculator.distanceToSimilarity(0.8, 'DOT_PRODUCT');
      expect(similarity).toBeCloseTo(0.8);
    });
  });
});

describe('ExplanationGenerator', () => {
  const mockService = {
    id: 'test-service',
    name: 'AI Document Processing',
    description: 'Machine learning service for document analysis',
    category: 'computer_vision',
    tags: ['AI', 'ML', 'document', 'analysis'],
  };

  describe('generateExplanation', () => {
    it('should identify exact matches', () => {
      const query = 'document processing AI';
      const explanation = ExplanationGenerator.generateExplanation(query, mockService, 0.9, 0.1);
      
      expect(explanation.textMatch?.exactMatches).toContain('document');
      expect(explanation.textMatch?.exactMatches).toContain('ai');
    });

    it('should identify semantic matches', () => {
      const explanation = ExplanationGenerator.generateExplanation('test query', mockService, 0.8, 0.2);
      
      expect(explanation.semanticMatch.confidence).toBe(0.8);
      expect(explanation.semanticMatch.matchedConcepts).toBeDefined();
    });

    it('should categorize matching factors', () => {
      const query = 'computer vision document analysis';
      const explanation = ExplanationGenerator.generateExplanation(query, mockService, 0.9, 0.1);
      
      expect(explanation.matchingFactors.length).toBeGreaterThan(0);
      expect(explanation.matchingFactors.some(factor => factor.includes('Category match'))).toBe(true);
    });

    it('should handle high similarity scores', () => {
      const explanation = ExplanationGenerator.generateExplanation('test', mockService, 0.85, 0.15);
      
      expect(explanation.matchingFactors.some(factor => 
        factor.includes('High semantic similarity')
      )).toBe(true);
    });
  });
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    PerformanceMonitor.clearMetrics();
  });

  describe('startTimer', () => {
    it('should return a function that measures elapsed time', async () => {
      const timer = PerformanceMonitor.startTimer();
      await new Promise(resolve => setTimeout(resolve, 10));
      const elapsed = timer();
      
      expect(elapsed).toBeGreaterThan(5);
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('recordMetric', () => {
    it('should record and retrieve metrics', () => {
      PerformanceMonitor.recordMetric('test_metric', 100);
      PerformanceMonitor.recordMetric('test_metric', 200);
      
      const stats = PerformanceMonitor.getMetricStats('test_metric');
      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(2);
      expect(stats!.average).toBe(150);
      expect(stats!.min).toBe(100);
      expect(stats!.max).toBe(200);
    });

    it('should limit metric history', () => {
      // Record more than 100 metrics
      for (let i = 0; i < 150; i++) {
        PerformanceMonitor.recordMetric('test_metric', i);
      }
      
      const stats = PerformanceMonitor.getMetricStats('test_metric');
      expect(stats!.count).toBeLessThanOrEqual(100);
    });
  });

  describe('getMetricStats', () => {
    it('should return null for non-existent metrics', () => {
      const stats = PerformanceMonitor.getMetricStats('non_existent');
      expect(stats).toBeNull();
    });

    it('should calculate p95 correctly', () => {
      // Record 100 values from 0 to 99
      for (let i = 0; i < 100; i++) {
        PerformanceMonitor.recordMetric('test_metric', i);
      }
      
      const stats = PerformanceMonitor.getMetricStats('test_metric');
      expect(stats!.p95).toBe(94); // 95th percentile of 0-99 is 94
    });
  });
});

describe('ValidationUtils', () => {
  describe('validateEmbedding', () => {
    it('should validate correct embedding', () => {
      const embedding = new Array(1536).fill(0.5);
      const isValid = ValidationUtils.validateEmbedding(embedding);
      expect(isValid).toBe(true);
    });

    it('should reject wrong dimension', () => {
      const embedding = new Array(1000).fill(0.5);
      const isValid = ValidationUtils.validateEmbedding(embedding);
      expect(isValid).toBe(false);
    });

    it('should reject non-numeric values', () => {
      const embedding = new Array(1536).fill('invalid');
      const isValid = ValidationUtils.validateEmbedding(embedding);
      expect(isValid).toBe(false);
    });

    it('should reject NaN values', () => {
      const embedding = new Array(1536).fill(NaN);
      const isValid = ValidationUtils.validateEmbedding(embedding);
      expect(isValid).toBe(false);
    });
  });

  describe('validateSearchQuery', () => {
    it('should validate correct query', () => {
      const result = ValidationUtils.validateSearchQuery('machine learning AI');
      expect(result.valid).toBe(true);
    });

    it('should reject empty query', () => {
      const result = ValidationUtils.validateSearchQuery('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject non-string query', () => {
      const result = ValidationUtils.validateSearchQuery(123 as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('string');
    });

    it('should reject too long query', () => {
      const longQuery = 'a'.repeat(1001);
      const result = ValidationUtils.validateSearchQuery(longQuery);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });
  });

  describe('validateSearchOptions', () => {
    it('should validate correct options', () => {
      const options = {
        limit: 50,
        threshold: 0.8,
        includeTextSearch: true,
      };
      const result = ValidationUtils.validateSearchOptions(options);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid limit', () => {
      const options = { limit: 150 };
      const result = ValidationUtils.validateSearchOptions(options);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Limit');
    });

    it('should reject invalid threshold', () => {
      const options = { threshold: 1.5 };
      const result = ValidationUtils.validateSearchOptions(options);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Threshold');
    });

    it('should handle null options', () => {
      const result = ValidationUtils.validateSearchOptions(null);
      expect(result.valid).toBe(true);
    });
  });
});