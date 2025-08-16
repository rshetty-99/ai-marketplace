/**
 * Integration tests for provider API endpoints
 * Tests cover HTTP methods, query parameters, error handling, and response formats
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock the provider API functions
vi.mock('@/lib/api/providers', () => ({
  searchProviders: vi.fn(),
  generateProviderFilterCounts: vi.fn(),
}));

describe('/api/providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/providers', () => {
    it('should handle basic search without parameters', async () => {
      const { searchProviders } = await import('@/lib/api/providers');
      
      const mockResponse = {
        providers: [
          {
            id: '1',
            name: 'Test Provider',
            slug: 'test-provider',
            description: 'A test provider',
            expertiseAreas: ['AI'],
            industries: ['Tech'],
            rating: { averageRating: 4.5, totalReviews: 10 },
            verified: true,
            featured: false
          }
        ],
        total: 1,
        filterCounts: {
          expertise: [],
          industries: [],
          locations: [],
          certifications: [],
          companySizes: [],
          pricingModels: [],
          technologies: [],
          languages: [],
          ratings: []
        },
        pagination: {
          page: 1,
          limit: 24,
          hasNextPage: false,
          hasPrevPage: false,
          totalPages: 1
        }
      };

      vi.mocked(searchProviders).mockResolvedValue(mockResponse);

      const request = new NextRequest('https://example.com/api/providers');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.providers).toHaveLength(1);
      expect(data.total).toBe(1);
      expect(searchProviders).toHaveBeenCalledWith(
        {},
        { field: 'relevance', direction: 'desc' },
        1,
        24
      );
    });

    it('should handle search with query parameters', async () => {
      const { searchProviders } = await import('@/lib/api/providers');
      
      const mockResponse = {
        providers: [],
        total: 0,
        filterCounts: {
          expertise: [],
          industries: [],
          locations: [],
          certifications: [],
          companySizes: [],
          pricingModels: [],
          technologies: [],
          languages: [],
          ratings: []
        },
        pagination: {
          page: 1,
          limit: 12,
          hasNextPage: false,
          hasPrevPage: false,
          totalPages: 0
        }
      };

      vi.mocked(searchProviders).mockResolvedValue(mockResponse);

      const url = new URL('https://example.com/api/providers');
      url.searchParams.set('search', 'machine learning');
      url.searchParams.set('expertise', 'AI,ML');
      url.searchParams.set('location', 'US');
      url.searchParams.set('verified', 'true');
      url.searchParams.set('rating', '4.5');
      url.searchParams.set('page', '2');
      url.searchParams.set('limit', '12');
      url.searchParams.set('sortBy', 'rating');
      url.searchParams.set('sortOrder', 'desc');

      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(searchProviders).toHaveBeenCalledWith(
        {
          search: 'machine learning',
          expertise: ['AI', 'ML'],
          location: 'US',
          verified: true,
          rating: 4.5
        },
        { field: 'rating', direction: 'desc' },
        2,
        12
      );
    });

    it('should handle complex filter parameters', async () => {
      const { searchProviders } = await import('@/lib/api/providers');
      
      const mockResponse = {
        providers: [],
        total: 0,
        filterCounts: {
          expertise: [],
          industries: [],
          locations: [],
          certifications: [],
          companySizes: [],
          pricingModels: [],
          technologies: [],
          languages: [],
          ratings: []
        },
        pagination: {
          page: 1,
          limit: 24,
          hasNextPage: false,
          hasPrevPage: false,
          totalPages: 0
        }
      };

      vi.mocked(searchProviders).mockResolvedValue(mockResponse);

      const url = new URL('https://example.com/api/providers');
      url.searchParams.set('industries', 'Healthcare,Finance');
      url.searchParams.set('certification', 'SOC 2,GDPR');
      url.searchParams.set('companySize', 'medium');
      url.searchParams.set('technologies', 'Python,TensorFlow');
      url.searchParams.set('languages', 'English,Spanish');
      url.searchParams.set('pricingModel', 'project');
      url.searchParams.set('minPrice', '10000');
      url.searchParams.set('maxPrice', '100000');
      url.searchParams.set('available', 'true');

      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(searchProviders).toHaveBeenCalledWith(
        {
          industries: ['Healthcare', 'Finance'],
          certification: ['SOC 2', 'GDPR'],
          companySize: 'medium',
          technologies: ['Python', 'TensorFlow'],
          languages: ['English', 'Spanish'],
          pricing: {
            model: 'project',
            min: 10000,
            max: 100000
          },
          available: true
        },
        { field: 'relevance', direction: 'desc' },
        1,
        24
      );
    });

    it('should handle invalid parameters gracefully', async () => {
      const { searchProviders } = await import('@/lib/api/providers');
      
      const mockResponse = {
        providers: [],
        total: 0,
        filterCounts: {
          expertise: [],
          industries: [],
          locations: [],
          certifications: [],
          companySizes: [],
          pricingModels: [],
          technologies: [],
          languages: [],
          ratings: []
        },
        pagination: {
          page: 1,
          limit: 24,
          hasNextPage: false,
          hasPrevPage: false,
          totalPages: 0
        }
      };

      vi.mocked(searchProviders).mockResolvedValue(mockResponse);

      const url = new URL('https://example.com/api/providers');
      url.searchParams.set('rating', 'invalid');
      url.searchParams.set('page', 'not-a-number');
      url.searchParams.set('limit', '-5');

      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(200);
      // Should use defaults for invalid parameters
      expect(searchProviders).toHaveBeenCalledWith(
        {}, // No rating filter due to invalid value
        { field: 'relevance', direction: 'desc' },
        1, // Default page
        24 // Default limit
      );
    });

    it('should return proper cache headers', async () => {
      const { searchProviders } = await import('@/lib/api/providers');
      
      vi.mocked(searchProviders).mockResolvedValue({
        providers: [],
        total: 0,
        filterCounts: {
          expertise: [],
          industries: [],
          locations: [],
          certifications: [],
          companySizes: [],
          pricingModels: [],
          technologies: [],
          languages: [],
          ratings: []
        },
        pagination: {
          page: 1,
          limit: 24,
          hasNextPage: false,
          hasPrevPage: false,
          totalPages: 0
        }
      });

      const request = new NextRequest('https://example.com/api/providers');
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=300, stale-while-revalidate=600');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should handle search errors', async () => {
      const { searchProviders } = await import('@/lib/api/providers');
      
      vi.mocked(searchProviders).mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('https://example.com/api/providers');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to search providers');
      expect(data.message).toBe('Database connection failed');
    });
  });

  describe('POST /api/providers', () => {
    it('should handle POST requests with body filters', async () => {
      const { searchProviders } = await import('@/lib/api/providers');
      
      const mockResponse = {
        providers: [],
        total: 0,
        filterCounts: {
          expertise: [],
          industries: [],
          locations: [],
          certifications: [],
          companySizes: [],
          pricingModels: [],
          technologies: [],
          languages: [],
          ratings: []
        },
        pagination: {
          page: 1,
          limit: 24,
          hasNextPage: false,
          hasPrevPage: false,
          totalPages: 0
        }
      };

      vi.mocked(searchProviders).mockResolvedValue(mockResponse);

      const body = {
        filters: {
          search: 'AI consulting',
          expertise: ['Machine Learning', 'AI Consulting'],
          industries: ['Healthcare'],
          verified: true
        },
        sortOptions: {
          field: 'rating',
          direction: 'desc'
        },
        page: 2,
        limit: 12
      };

      const request = new NextRequest('https://example.com/api/providers', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(searchProviders).toHaveBeenCalledWith(
        body.filters,
        body.sortOptions,
        2,
        12
      );
    });

    it('should handle POST requests with partial body', async () => {
      const { searchProviders } = await import('@/lib/api/providers');
      
      const mockResponse = {
        providers: [],
        total: 0,
        filterCounts: {
          expertise: [],
          industries: [],
          locations: [],
          certifications: [],
          companySizes: [],
          pricingModels: [],
          technologies: [],
          languages: [],
          ratings: []
        },
        pagination: {
          page: 1,
          limit: 24,
          hasNextPage: false,
          hasPrevPage: false,
          totalPages: 0
        }
      };

      vi.mocked(searchProviders).mockResolvedValue(mockResponse);

      const body = {
        filters: {
          expertise: ['Data Science']
        }
      };

      const request = new NextRequest('https://example.com/api/providers', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(searchProviders).toHaveBeenCalledWith(
        { expertise: ['Data Science'] },
        { field: 'relevance', direction: 'desc' },
        1,
        24
      );
    });

    it('should handle empty POST body', async () => {
      const { searchProviders } = await import('@/lib/api/providers');
      
      const mockResponse = {
        providers: [],
        total: 0,
        filterCounts: {
          expertise: [],
          industries: [],
          locations: [],
          certifications: [],
          companySizes: [],
          pricingModels: [],
          technologies: [],
          languages: [],
          ratings: []
        },
        pagination: {
          page: 1,
          limit: 24,
          hasNextPage: false,
          hasPrevPage: false,
          totalPages: 0
        }
      };

      vi.mocked(searchProviders).mockResolvedValue(mockResponse);

      const request = new NextRequest('https://example.com/api/providers', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(searchProviders).toHaveBeenCalledWith(
        {},
        { field: 'relevance', direction: 'desc' },
        1,
        24
      );
    });

    it('should return proper cache headers for POST', async () => {
      const { searchProviders } = await import('@/lib/api/providers');
      
      vi.mocked(searchProviders).mockResolvedValue({
        providers: [],
        total: 0,
        filterCounts: {
          expertise: [],
          industries: [],
          locations: [],
          certifications: [],
          companySizes: [],
          pricingModels: [],
          technologies: [],
          languages: [],
          ratings: []
        },
        pagination: {
          page: 1,
          limit: 24,
          hasNextPage: false,
          hasPrevPage: false,
          totalPages: 0
        }
      });

      const request = new NextRequest('https://example.com/api/providers', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=60, stale-while-revalidate=300');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should handle POST errors', async () => {
      const { searchProviders } = await import('@/lib/api/providers');
      
      vi.mocked(searchProviders).mockRejectedValue(new Error('Invalid filter parameters'));

      const request = new NextRequest('https://example.com/api/providers', {
        method: 'POST',
        body: JSON.stringify({ filters: { invalid: 'filter' } }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to search providers');
      expect(data.message).toBe('Invalid filter parameters');
    });

    it('should handle malformed JSON in POST body', async () => {
      const request = new NextRequest('https://example.com/api/providers', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to search providers');
    });
  });

  describe('Response Format Validation', () => {
    it('should return consistent response structure', async () => {
      const { searchProviders } = await import('@/lib/api/providers');
      
      const mockResponse = {
        providers: [
          {
            id: '1',
            name: 'Test Provider',
            slug: 'test-provider',
            description: 'A test provider',
            expertiseAreas: ['AI'],
            industries: ['Tech'],
            rating: { averageRating: 4.5, totalReviews: 10 },
            verified: true,
            featured: false
          }
        ],
        total: 1,
        filterCounts: {
          expertise: [{ value: 'AI', count: 1, name: 'AI' }],
          industries: [{ value: 'Tech', count: 1, name: 'Tech' }],
          locations: [],
          certifications: [],
          companySizes: [],
          pricingModels: [],
          technologies: [],
          languages: [],
          ratings: []
        },
        pagination: {
          page: 1,
          limit: 24,
          hasNextPage: false,
          hasPrevPage: false,
          totalPages: 1
        }
      };

      vi.mocked(searchProviders).mockResolvedValue(mockResponse);

      const request = new NextRequest('https://example.com/api/providers');
      const response = await GET(request);
      const data = await response.json();

      // Validate response structure
      expect(data).toHaveProperty('providers');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('filterCounts');
      expect(data).toHaveProperty('pagination');

      expect(Array.isArray(data.providers)).toBe(true);
      expect(typeof data.total).toBe('number');
      expect(typeof data.filterCounts).toBe('object');
      expect(typeof data.pagination).toBe('object');

      // Validate pagination structure
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('limit');
      expect(data.pagination).toHaveProperty('hasNextPage');
      expect(data.pagination).toHaveProperty('hasPrevPage');
      expect(data.pagination).toHaveProperty('totalPages');

      // Validate filterCounts structure
      expect(data.filterCounts).toHaveProperty('expertise');
      expect(data.filterCounts).toHaveProperty('industries');
      expect(data.filterCounts).toHaveProperty('locations');
      expect(Array.isArray(data.filterCounts.expertise)).toBe(true);
    });
  });
});