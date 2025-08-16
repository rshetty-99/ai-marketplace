import crypto from 'crypto';
import { contentExtractionConfig, queryProcessingConfig } from './config';
import type { ServiceEmbedding, QueryIntent, SearchExplanation } from '@/types/semantic-search';

// Content extraction utilities
export class ContentExtractor {
  /**
   * Extract searchable content from a service object
   */
  static extractSearchableContent(service: any): string {
    const { includedFields, fieldWeights, preprocessing } = contentExtractionConfig;
    
    let content = '';
    
    // Extract content with field weights
    for (const field of includedFields) {
      const value = service[field];
      if (!value) continue;
      
      const weight = fieldWeights[field as keyof typeof fieldWeights] || 1.0;
      let fieldContent = '';
      
      if (Array.isArray(value)) {
        fieldContent = value.join(' ');
      } else if (typeof value === 'string') {
        fieldContent = value;
      } else if (typeof value === 'object') {
        fieldContent = JSON.stringify(value);
      }
      
      // Apply field weight by repeating content
      const repetitions = Math.floor(weight);
      const fractional = weight - repetitions;
      
      for (let i = 0; i < repetitions; i++) {
        content += ` ${fieldContent}`;
      }
      
      // Handle fractional weight
      if (fractional > 0 && Math.random() < fractional) {
        content += ` ${fieldContent}`;
      }
    }
    
    return this.preprocessText(content.trim());
  }
  
  /**
   * Preprocess text according to configuration
   */
  static preprocessText(text: string): string {
    const { preprocessing } = contentExtractionConfig;
    let processed = text;
    
    if (preprocessing.removeHtml) {
      processed = processed.replace(/<[^>]*>/g, ' ');
    }
    
    if (preprocessing.removePunctuation) {
      processed = processed.replace(/[^\w\s]/g, ' ');
    }
    
    if (preprocessing.toLowerCase) {
      processed = processed.toLowerCase();
    }
    
    // Normalize whitespace
    processed = processed.replace(/\s+/g, ' ').trim();
    
    // Apply length constraints
    if (processed.length < preprocessing.minLength) {
      return '';
    }
    
    if (processed.length > preprocessing.maxLength) {
      processed = processed.substring(0, preprocessing.maxLength);
      // Try to cut at word boundary
      const lastSpace = processed.lastIndexOf(' ');
      if (lastSpace > preprocessing.maxLength * 0.8) {
        processed = processed.substring(0, lastSpace);
      }
    }
    
    return processed;
  }
  
  /**
   * Generate content hash for change detection
   */
  static generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
  
  /**
   * Extract individual content sources for embedding metadata
   */
  static extractContentSources(service: any): ServiceEmbedding['contentSources'] {
    return {
      name: service.name || '',
      description: service.description || '',
      tags: service.tags || [],
      category: service.category || '',
      features: service.features || [],
      industries: service.industries || [],
      technologies: service.technologies || [],
    };
  }
}

// Query processing utilities
export class QueryProcessor {
  /**
   * Process and clean user query
   */
  static processQuery(query: string): string {
    const { expansion } = queryProcessingConfig;
    
    let processed = query.trim().toLowerCase();
    
    // Expand synonyms
    if (expansion.enabled) {
      processed = this.expandSynonyms(processed);
    }
    
    // Basic spell correction (simple implementation)
    processed = this.basicSpellCorrection(processed);
    
    return processed;
  }
  
  /**
   * Expand query with synonyms
   */
  static expandSynonyms(query: string): string {
    const { expansion } = queryProcessingConfig;
    let expanded = query;
    
    for (const [term, synonyms] of Object.entries(expansion.synonyms)) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      if (regex.test(query)) {
        // Add synonyms to query (weighted approach)
        const selectedSynonyms = synonyms.slice(0, expansion.maxExpansions);
        expanded += ` ${selectedSynonyms.join(' ')}`;
      }
    }
    
    return expanded;
  }
  
  /**
   * Basic spell correction
   */
  static basicSpellCorrection(query: string): string {
    // Common AI/ML term corrections
    const corrections: Record<string, string> = {
      'machien': 'machine',
      'leraning': 'learning',
      'artifical': 'artificial',
      'inteligence': 'intelligence',
      'algoritm': 'algorithm',
      'chatbots': 'chatbot',
      'analystics': 'analytics',
      'prediciton': 'prediction',
      'recomendation': 'recommendation',
    };
    
    let corrected = query;
    for (const [typo, correction] of Object.entries(corrections)) {
      const regex = new RegExp(`\\b${typo}\\b`, 'gi');
      corrected = corrected.replace(regex, correction);
    }
    
    return corrected;
  }
  
  /**
   * Detect query intent
   */
  static detectIntent(query: string): QueryIntent {
    const { intentPatterns } = queryProcessingConfig;
    
    for (const [category, patterns] of Object.entries(intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          return {
            category: category as QueryIntent['category'],
            confidence: 0.8, // Simple confidence score
            entities: this.extractEntities(query),
          };
        }
      }
    }
    
    // Default intent
    return {
      category: 'product_search',
      confidence: 0.5,
      entities: this.extractEntities(query),
    };
  }
  
  /**
   * Extract entities from query
   */
  static extractEntities(query: string): QueryIntent['entities'] {
    const entities: QueryIntent['entities'] = {};
    
    // Technology detection
    const technologies = ['AI', 'ML', 'machine learning', 'NLP', 'computer vision', 'chatbot', 'deep learning'];
    entities.technologies = technologies.filter(tech => 
      query.toLowerCase().includes(tech.toLowerCase())
    );
    
    // Industry detection
    const industries = ['healthcare', 'finance', 'retail', 'manufacturing', 'education'];
    entities.industries = industries.filter(industry => 
      query.toLowerCase().includes(industry.toLowerCase())
    );
    
    // Use case detection
    const useCases = ['automation', 'prediction', 'analysis', 'recommendation', 'classification'];
    entities.useCases = useCases.filter(useCase => 
      query.toLowerCase().includes(useCase.toLowerCase())
    );
    
    // Budget detection (simple regex)
    const budgetMatch = query.match(/\$([0-9,]+)/);
    if (budgetMatch) {
      entities.budget = parseInt(budgetMatch[1].replace(/,/g, ''));
    }
    
    return entities;
  }
}

// Similarity and ranking utilities
export class SimilarityCalculator {
  /**
   * Calculate cosine similarity between two vectors
   */
  static cosineSimilarity(a: number[], b: number[]): number {
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
  }
  
  /**
   * Calculate Euclidean distance
   */
  static euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    
    return Math.sqrt(sum);
  }
  
  /**
   * Convert distance to similarity score (0-1)
   */
  static distanceToSimilarity(distance: number, distanceMeasure: string): number {
    switch (distanceMeasure) {
      case 'COSINE':
        // Cosine distance is 1 - cosine similarity
        return Math.max(0, 1 - distance);
      case 'EUCLIDEAN':
        // Normalize Euclidean distance to 0-1 range
        return Math.max(0, 1 / (1 + distance));
      case 'DOT_PRODUCT':
        // Dot product is already a similarity measure
        return Math.max(0, Math.min(1, distance));
      default:
        return distance;
    }
  }
}

// Search explanation utilities
export class ExplanationGenerator {
  /**
   * Generate explanation for why a result was matched
   */
  static generateExplanation(
    query: string,
    service: any,
    score: number,
    distance: number
  ): SearchExplanation {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const serviceContent = ContentExtractor.extractSearchableContent(service).toLowerCase();
    
    // Find matching terms
    const exactMatches = queryTerms.filter(term => 
      serviceContent.includes(term)
    );
    
    const partialMatches = queryTerms.filter(term => 
      serviceContent.includes(term.substring(0, Math.max(3, term.length - 2)))
    ).filter(term => !exactMatches.includes(term));
    
    // Determine primary matching factors
    const matchingFactors: string[] = [];
    
    if (exactMatches.length > 0) {
      matchingFactors.push(`Exact matches: ${exactMatches.join(', ')}`);
    }
    
    if (score > 0.8) {
      matchingFactors.push('High semantic similarity');
    } else if (score > 0.6) {
      matchingFactors.push('Good semantic similarity');
    }
    
    if (service.category && query.toLowerCase().includes(service.category.toLowerCase())) {
      matchingFactors.push('Category match');
    }
    
    if (service.tags && service.tags.some((tag: string) => 
      queryTerms.some(term => tag.toLowerCase().includes(term))
    )) {
      matchingFactors.push('Tag relevance');
    }
    
    return {
      matchingFactors,
      semanticMatch: {
        matchedConcepts: this.extractMatchedConcepts(query, service),
        confidence: score,
      },
      textMatch: exactMatches.length > 0 || partialMatches.length > 0 ? {
        exactMatches,
        partialMatches,
      } : undefined,
    };
  }
  
  /**
   * Extract conceptually matched terms
   */
  static extractMatchedConcepts(query: string, service: any): string[] {
    const concepts: string[] = [];
    
    // Simple concept matching based on common AI/ML terms
    const conceptMap: Record<string, string[]> = {
      'AI': ['artificial intelligence', 'machine learning', 'intelligent'],
      'automation': ['automate', 'automated', 'automatic'],
      'analysis': ['analyze', 'analytics', 'analytical'],
      'prediction': ['predict', 'predictive', 'forecasting'],
      'vision': ['image', 'visual', 'computer vision', 'recognition'],
    };
    
    const queryLower = query.toLowerCase();
    const serviceContent = ContentExtractor.extractSearchableContent(service).toLowerCase();
    
    for (const [concept, variations] of Object.entries(conceptMap)) {
      if (queryLower.includes(concept.toLowerCase()) && 
          variations.some(variation => serviceContent.includes(variation))) {
        concepts.push(concept);
      }
    }
    
    return concepts;
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  
  /**
   * Start timing an operation
   */
  static startTimer(): () => number {
    const start = performance.now();
    return () => performance.now() - start;
  }
  
  /**
   * Record a metric
   */
  static recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }
  
  /**
   * Get metric statistics
   */
  static getMetricStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const values = this.metrics.get(name);
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
  }
  
  /**
   * Get all metrics
   */
  static getAllMetrics(): Record<string, ReturnType<typeof PerformanceMonitor.getMetricStats>> {
    const result: Record<string, any> = {};
    
    for (const name of this.metrics.keys()) {
      result[name] = this.getMetricStats(name);
    }
    
    return result;
  }
  
  /**
   * Clear metrics
   */
  static clearMetrics(): void {
    this.metrics.clear();
  }
}

// Validation utilities
export class ValidationUtils {
  /**
   * Validate embedding vector
   */
  static validateEmbedding(embedding: number[]): boolean {
    if (!Array.isArray(embedding)) return false;
    if (embedding.length !== 1536) return false; // text-embedding-3-small
    if (!embedding.every(val => typeof val === 'number' && !isNaN(val))) return false;
    
    return true;
  }
  
  /**
   * Validate search query
   */
  static validateSearchQuery(query: string): { valid: boolean; error?: string } {
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
  }
  
  /**
   * Validate search options
   */
  static validateSearchOptions(options: any): { valid: boolean; error?: string } {
    if (!options) return { valid: true };
    
    if (options.limit && (typeof options.limit !== 'number' || options.limit < 1 || options.limit > 100)) {
      return { valid: false, error: 'Limit must be a number between 1 and 100' };
    }
    
    if (options.threshold && (typeof options.threshold !== 'number' || options.threshold < 0 || options.threshold > 1)) {
      return { valid: false, error: 'Threshold must be a number between 0 and 1' };
    }
    
    return { valid: true };
  }
}