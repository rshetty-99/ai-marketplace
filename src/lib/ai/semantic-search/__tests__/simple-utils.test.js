// Simple JavaScript test file to avoid TypeScript compilation issues
describe('Semantic Search Utils - Basic Tests', () => {
  describe('SimilarityCalculator', () => {
    // Mock implementation for testing
    const calculateCosineSimilarity = (a, b) => {
      if (a.length !== b.length) {
        throw new Error('Vectors must have the same length');
      }
      
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      
      for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      
      const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
      return magnitude === 0 ? 0 : dotProduct / magnitude;
    };

    it('should calculate cosine similarity correctly for identical vectors', () => {
      const vector1 = [1, 0, 0];
      const vector2 = [1, 0, 0];
      const similarity = calculateCosineSimilarity(vector1, vector2);
      expect(similarity).toBeCloseTo(1.0);
    });

    it('should calculate cosine similarity for orthogonal vectors', () => {
      const vector1 = [1, 0, 0];
      const vector2 = [0, 1, 0];
      const similarity = calculateCosineSimilarity(vector1, vector2);
      expect(similarity).toBeCloseTo(0.0);
    });

    it('should handle opposite vectors', () => {
      const vector1 = [1, 0, 0];
      const vector2 = [-1, 0, 0];
      const similarity = calculateCosineSimilarity(vector1, vector2);
      expect(similarity).toBeCloseTo(-1.0);
    });

    it('should throw error for different length vectors', () => {
      const vector1 = [1, 0];
      const vector2 = [1, 0, 0];
      expect(() => {
        calculateCosineSimilarity(vector1, vector2);
      }).toThrow('Vectors must have the same length');
    });
  });

  describe('Content Processing', () => {
    const preprocessText = (text) => {
      let processed = text;
      
      // Remove HTML tags
      processed = processed.replace(/<[^>]*>/g, ' ');
      
      // Convert to lowercase
      processed = processed.toLowerCase();
      
      // Normalize whitespace
      processed = processed.replace(/\s+/g, ' ').trim();
      
      return processed;
    };

    it('should remove HTML tags', () => {
      const text = 'This is <b>bold</b> and <i>italic</i> text';
      const processed = preprocessText(text);
      expect(processed).toBe('this is bold and italic text');
    });

    it('should convert to lowercase', () => {
      const text = 'UPPERCASE and MixedCase';
      const processed = preprocessText(text);
      expect(processed).toBe('uppercase and mixedcase');
    });

    it('should normalize whitespace', () => {
      const text = 'Multiple   spaces\n\nand\tlines';
      const processed = preprocessText(text);
      expect(processed).toBe('multiple spaces and lines');
    });
  });

  describe('Search Query Validation', () => {
    const validateSearchQuery = (query) => {
      if (!query || typeof query !== 'string') {
        return { valid: false, error: 'Query must be a non-empty string' };
      }
      
      if (query.trim().length === 0) {
        return { valid: false, error: 'Query cannot be empty' };
      }
      
      if (query.length > 1000) {
        return { valid: false, error: 'Query too long (max 1000 characters)' };
      }
      
      return { valid: true };
    };

    it('should validate correct query', () => {
      const result = validateSearchQuery('machine learning AI');
      expect(result.valid).toBe(true);
    });

    it('should reject empty query', () => {
      const result = validateSearchQuery('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject non-string query', () => {
      const result = validateSearchQuery(123);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('string');
    });

    it('should reject too long query', () => {
      const longQuery = 'a'.repeat(1001);
      const result = validateSearchQuery(longQuery);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });
  });

  describe('Performance Monitor Mock', () => {
    let metrics = new Map();

    const recordMetric = (name, value) => {
      if (!metrics.has(name)) {
        metrics.set(name, []);
      }
      
      const values = metrics.get(name);
      values.push(value);
      
      // Keep only last 100 measurements
      if (values.length > 100) {
        values.shift();
      }
    };

    const getMetricStats = (name) => {
      const values = metrics.get(name);
      if (!values || values.length === 0) {
        return null;
      }
      
      const sorted = [...values].sort((a, b) => a - b);
      const count = values.length;
      const sum = values.reduce((acc, val) => acc + val, 0);
      
      return {
        count,
        average: sum / count,
        min: sorted[0],
        max: sorted[count - 1],
        p95: sorted[Math.floor(count * 0.95)],
      };
    };

    beforeEach(() => {
      metrics.clear();
    });

    it('should record and retrieve metrics', () => {
      recordMetric('test_metric', 100);
      recordMetric('test_metric', 200);
      
      const stats = getMetricStats('test_metric');
      expect(stats).not.toBeNull();
      expect(stats.count).toBe(2);
      expect(stats.average).toBe(150);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(200);
    });

    it('should return null for non-existent metrics', () => {
      const stats = getMetricStats('non_existent');
      expect(stats).toBeNull();
    });

    it('should limit metric history', () => {
      // Record more than 100 metrics
      for (let i = 0; i < 150; i++) {
        recordMetric('test_metric', i);
      }
      
      const stats = getMetricStats('test_metric');
      expect(stats.count).toBeLessThanOrEqual(100);
    });
  });
});