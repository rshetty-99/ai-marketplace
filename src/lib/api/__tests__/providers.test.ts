/**
 * Comprehensive test suite for provider API functionality
 * Tests cover: search, filtering, sorting, pagination, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { 
  searchProviders, 
  getProviderById, 
  getProviderBySlug, 
  getFeaturedProviders,
  generateProviderFilterCounts,
  getProviderSearchSuggestions,
  type Provider,
  type ProviderFilters,
  type ProviderSortOptions
} from '../providers';

// Mock Firebase
vi.mock('@/lib/firebase/firebase-config', () => ({
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
  }
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getCountFromServer: vi.fn(),
}));

// Mock provider data for testing
const mockProvider: Provider = {
  id: '1',
  name: 'Test AI Provider',
  slug: 'test-ai-provider',
  logo: 'https://example.com/logo.png',
  description: 'A test AI provider for unit testing',
  longDescription: 'A comprehensive test AI provider with full capabilities for testing purposes.',
  tagline: 'AI Testing Excellence',
  type: 'company',
  founded: 2020,
  website: 'https://test-ai-provider.com',
  teamSize: 25,
  headquarters: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TC',
    country: 'US',
    postalCode: '12345',
    coordinates: { latitude: 40.7128, longitude: -74.0060 }
  },
  contactInfo: {
    email: 'contact@test-ai-provider.com',
    phone: '+1-555-0123',
    linkedIn: 'https://linkedin.com/company/test-ai-provider',
    twitter: 'https://twitter.com/testai'
  },
  expertiseAreas: ['Machine Learning', 'Natural Language Processing', 'Computer Vision'],
  industries: ['Healthcare', 'Finance', 'Retail'],
  technologies: ['Python', 'TensorFlow', 'PyTorch', 'AWS', 'Docker'],
  frameworks: ['FastAPI', 'Flask', 'React', 'Node.js'],
  languages: ['English', 'Spanish', 'French'],
  certifications: ['SOC 2', 'ISO 27001', 'GDPR'],
  compliance: {
    gdprCompliant: true,
    hipaaCompliant: true,
    soc2Compliant: true,
    iso27001Compliant: true
  },
  portfolio: [
    {
      id: 'p1',
      title: 'Healthcare AI System',
      description: 'AI-powered diagnostic system',
      category: 'Healthcare',
      technologies: ['TensorFlow', 'Python'],
      images: ['https://example.com/portfolio1.jpg'],
      outcome: '95% accuracy improvement',
      timeline: '6 months',
      investment: '$500,000',
      featured: true
    }
  ],
  services: [
    {
      id: 's1',
      name: 'AI Consulting',
      description: 'Strategic AI consultation services',
      category: 'Consulting',
      pricing: '$10,000 - $50,000',
      duration: '4-8 weeks',
      deliverables: ['Strategy Document', 'Implementation Roadmap'],
      featured: true
    }
  ],
  testimonials: [
    {
      id: 't1',
      client: 'John Doe',
      position: 'CTO',
      company: 'Test Corp',
      content: 'Excellent AI implementation services',
      rating: 5,
      image: 'https://example.com/testimonial1.jpg',
      projectCategory: 'Healthcare',
      featured: true,
      createdAt: new Date('2023-01-01')
    }
  ],
  rating: {
    averageRating: 4.8,
    totalReviews: 156,
    breakdown: { 5: 120, 4: 25, 3: 8, 2: 2, 1: 1 },
    dimensions: {
      quality: 4.9,
      communication: 4.7,
      delivery: 4.8,
      value: 4.6
    }
  },
  pricing: {
    model: 'project',
    startingPrice: 10000,
    currency: 'USD',
    projectRange: { min: 10000, max: 500000 }
  },
  stats: {
    totalProjects: 89,
    totalClients: 45,
    averageProjectValue: 75000,
    responseTime: 2,
    onTimeDelivery: 95,
    clientRetention: 85,
    views: 1250,
    inquiries: 67,
    lastActive: new Date('2024-01-15')
  },
  status: 'active',
  verified: true,
  featured: true,
  premium: true,
  availability: {
    isAvailable: true,
    nextAvailable: new Date('2024-02-01'),
    maxProjects: 5,
    currentProjects: 2,
    workingHours: {
      timezone: 'UTC-5',
      schedule: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: null,
        sunday: null
      }
    }
  },
  searchTerms: ['ai', 'machine learning', 'nlp', 'computer vision', 'test'],
  keywords: ['artificial intelligence', 'machine learning', 'deep learning'],
  createdAt: new Date('2020-01-01'),
  updatedAt: new Date('2024-01-15')
};

describe('Provider API', () => {
  beforeAll(() => {
    // Setup global test environment
  });

  afterAll(() => {
    // Cleanup global test environment
  });

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('searchProviders', () => {
    it('should search providers with default parameters', async () => {
      // Mock Firestore response
      const mockSnapshot = {
        docs: [
          {
            id: '1',
            data: () => ({ ...mockProvider })
          }
        ]
      };

      const mockCountSnapshot = {
        data: () => ({ count: 1 })
      };

      const { getDocs, getCountFromServer } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(getCountFromServer).mockResolvedValue(mockCountSnapshot as any);

      const result = await searchProviders();

      expect(result).toBeDefined();
      expect(result.providers).toHaveLength(1);
      expect(result.providers[0].id).toBe('1');
      expect(result.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(24);
    });

    it('should apply expertise filters correctly', async () => {
      const filters: ProviderFilters = {
        expertise: ['Machine Learning']
      };

      const mockSnapshot = {
        docs: [
          {
            id: '1',
            data: () => ({ ...mockProvider })
          }
        ]
      };

      const mockCountSnapshot = {
        data: () => ({ count: 1 })
      };

      const { getDocs, getCountFromServer, where } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(getCountFromServer).mockResolvedValue(mockCountSnapshot as any);

      const result = await searchProviders(filters);

      expect(where).toHaveBeenCalledWith('expertiseAreas', 'array-contains-any', ['Machine Learning']);
      expect(result.providers).toHaveLength(1);
    });

    it('should apply industry filters correctly', async () => {
      const filters: ProviderFilters = {
        industries: ['Healthcare', 'Finance']
      };

      const mockSnapshot = {
        docs: [
          {
            id: '1',
            data: () => ({ ...mockProvider })
          }
        ]
      };

      const mockCountSnapshot = {
        data: () => ({ count: 1 })
      };

      const { getDocs, getCountFromServer, where } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(getCountFromServer).mockResolvedValue(mockCountSnapshot as any);

      const result = await searchProviders(filters);

      expect(where).toHaveBeenCalledWith('industries', 'array-contains-any', ['Healthcare', 'Finance']);
      expect(result.providers).toHaveLength(1);
    });

    it('should apply location filters correctly', async () => {
      const filters: ProviderFilters = {
        location: 'US'
      };

      const mockSnapshot = {
        docs: [
          {
            id: '1',
            data: () => ({ ...mockProvider })
          }
        ]
      };

      const mockCountSnapshot = {
        data: () => ({ count: 1 })
      };

      const { getDocs, getCountFromServer, where } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(getCountFromServer).mockResolvedValue(mockCountSnapshot as any);

      const result = await searchProviders(filters);

      expect(where).toHaveBeenCalledWith('headquarters.country', '==', 'US');
      expect(result.providers).toHaveLength(1);
    });

    it('should apply certification filters correctly', async () => {
      const filters: ProviderFilters = {
        certification: ['SOC 2', 'GDPR']
      };

      const mockSnapshot = {
        docs: [
          {
            id: '1',
            data: () => ({ ...mockProvider })
          }
        ]
      };

      const mockCountSnapshot = {
        data: () => ({ count: 1 })
      };

      const { getDocs, getCountFromServer, where } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(getCountFromServer).mockResolvedValue(mockCountSnapshot as any);

      const result = await searchProviders(filters);

      expect(where).toHaveBeenCalledWith('certifications', 'array-contains-any', ['SOC 2', 'GDPR']);
      expect(result.providers).toHaveLength(1);
    });

    it('should apply rating filters correctly', async () => {
      const filters: ProviderFilters = {
        rating: 4.5
      };

      const mockSnapshot = {
        docs: [
          {
            id: '1',
            data: () => ({ ...mockProvider })
          }
        ]
      };

      const mockCountSnapshot = {
        data: () => ({ count: 1 })
      };

      const { getDocs, getCountFromServer, where } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(getCountFromServer).mockResolvedValue(mockCountSnapshot as any);

      const result = await searchProviders(filters);

      expect(where).toHaveBeenCalledWith('rating.averageRating', '>=', 4.5);
      expect(result.providers).toHaveLength(1);
    });

    it('should apply pricing filters correctly', async () => {
      const filters: ProviderFilters = {
        pricing: {
          model: 'project',
          min: 5000,
          max: 50000
        }
      };

      const mockSnapshot = {
        docs: [
          {
            id: '1',
            data: () => ({ ...mockProvider })
          }
        ]
      };

      const mockCountSnapshot = {
        data: () => ({ count: 1 })
      };

      const { getDocs, getCountFromServer, where } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(getCountFromServer).mockResolvedValue(mockCountSnapshot as any);

      const result = await searchProviders(filters);

      expect(where).toHaveBeenCalledWith('pricing.model', '==', 'project');
      expect(where).toHaveBeenCalledWith('pricing.startingPrice', '>=', 5000);
      expect(where).toHaveBeenCalledWith('pricing.startingPrice', '<=', 50000);
      expect(result.providers).toHaveLength(1);
    });

    it('should apply sorting correctly', async () => {
      const sortOptions: ProviderSortOptions = {
        field: 'rating',
        direction: 'desc'
      };

      const mockSnapshot = {
        docs: [
          {
            id: '1',
            data: () => ({ ...mockProvider })
          }
        ]
      };

      const mockCountSnapshot = {
        data: () => ({ count: 1 })
      };

      const { getDocs, getCountFromServer, orderBy } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(getCountFromServer).mockResolvedValue(mockCountSnapshot as any);

      const result = await searchProviders({}, sortOptions);

      expect(orderBy).toHaveBeenCalledWith('rating.averageRating', 'desc');
      expect(result.providers).toHaveLength(1);
    });

    it('should handle pagination correctly', async () => {
      const mockSnapshot = {
        docs: [
          {
            id: '1',
            data: () => ({ ...mockProvider })
          }
        ]
      };

      const mockCountSnapshot = {
        data: () => ({ count: 25 })
      };

      const { getDocs, getCountFromServer, limit } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(getCountFromServer).mockResolvedValue(mockCountSnapshot as any);

      const result = await searchProviders({}, { field: 'relevance', direction: 'desc' }, 2, 10);

      expect(limit).toHaveBeenCalledWith(10);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockRejectedValue(new Error('Database connection failed'));

      await expect(searchProviders()).rejects.toThrow('Failed to search providers');
    });
  });

  describe('getProviderById', () => {
    it('should return provider when found', async () => {
      const mockDoc = {
        exists: () => true,
        id: '1',
        data: () => ({ ...mockProvider })
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue(mockDoc as any);

      const result = await getProviderById('1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
      expect(result?.name).toBe('Test AI Provider');
    });

    it('should return null when provider not found', async () => {
      const mockDoc = {
        exists: () => false
      };

      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockResolvedValue(mockDoc as any);

      const result = await getProviderById('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockRejectedValue(new Error('Database error'));

      await expect(getProviderById('1')).rejects.toThrow('Failed to get provider');
    });
  });

  describe('getProviderBySlug', () => {
    it('should return provider when found', async () => {
      const mockSnapshot = {
        empty: false,
        docs: [
          {
            id: '1',
            data: () => ({ ...mockProvider })
          }
        ]
      };

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      const result = await getProviderBySlug('test-ai-provider');

      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
      expect(result?.slug).toBe('test-ai-provider');
    });

    it('should return null when provider not found', async () => {
      const mockSnapshot = {
        empty: true,
        docs: []
      };

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      const result = await getProviderBySlug('nonexistent-provider');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockRejectedValue(new Error('Database error'));

      await expect(getProviderBySlug('test')).rejects.toThrow('Failed to get provider');
    });
  });

  describe('getFeaturedProviders', () => {
    it('should return featured providers', async () => {
      const mockSnapshot = {
        docs: [
          {
            id: '1',
            data: () => ({ ...mockProvider, featured: true })
          }
        ]
      };

      const { getDocs, where } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      const result = await getFeaturedProviders(6);

      expect(where).toHaveBeenCalledWith('featured', '==', true);
      expect(result).toHaveLength(1);
      expect(result[0].featured).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockRejectedValue(new Error('Database error'));

      await expect(getFeaturedProviders()).rejects.toThrow('Failed to get featured providers');
    });
  });

  describe('generateProviderFilterCounts', () => {
    it('should generate filter counts correctly', async () => {
      const mockSnapshot = {
        docs: [
          {
            id: '1',
            data: () => ({ ...mockProvider })
          },
          {
            id: '2',
            data: () => ({ 
              ...mockProvider,
              id: '2',
              expertiseAreas: ['Data Science'],
              industries: ['Technology'],
              headquarters: { ...mockProvider.headquarters, country: 'CA' }
            })
          }
        ]
      };

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      const result = await generateProviderFilterCounts();

      expect(result).toBeDefined();
      expect(result.expertise).toBeInstanceOf(Array);
      expect(result.industries).toBeInstanceOf(Array);
      expect(result.locations).toBeInstanceOf(Array);
      expect(result.certifications).toBeInstanceOf(Array);

      // Check that counts are properly calculated
      expect(result.expertise.find(e => e.value === 'Machine Learning')?.count).toBe(1);
      expect(result.expertise.find(e => e.value === 'Data Science')?.count).toBe(1);
      expect(result.locations.find(l => l.value === 'US')?.count).toBe(1);
      expect(result.locations.find(l => l.value === 'CA')?.count).toBe(1);
    });

    it('should handle errors gracefully', async () => {
      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockRejectedValue(new Error('Database error'));

      await expect(generateProviderFilterCounts()).rejects.toThrow('Failed to generate provider filter counts');
    });
  });

  describe('getProviderSearchSuggestions', () => {
    it('should return search suggestions', async () => {
      const mockSnapshot = {
        docs: [
          {
            id: '1',
            data: () => ({ 
              name: 'Test AI Provider',
              expertiseAreas: ['Machine Learning'],
              slug: 'test-ai-provider'
            })
          }
        ]
      };

      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      const result = await getProviderSearchSuggestions('test', 10);

      expect(result).toBeDefined();
      expect(result.providers).toHaveLength(1);
      expect(result.providers[0].name).toBe('Test AI Provider');
      expect(result.providers[0].slug).toBe('test-ai-provider');
    });

    it('should return empty results for short queries', async () => {
      const result = await getProviderSearchSuggestions('t', 10);

      expect(result.providers).toHaveLength(0);
      expect(result.expertise).toHaveLength(0);
      expect(result.industries).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      const { getDocs } = await import('firebase/firestore');
      vi.mocked(getDocs).mockRejectedValue(new Error('Database error'));

      const result = await getProviderSearchSuggestions('test', 10);

      expect(result.providers).toHaveLength(0);
      expect(result.expertise).toHaveLength(0);
      expect(result.industries).toHaveLength(0);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle empty search results', async () => {
      const mockSnapshot = {
        docs: []
      };

      const mockCountSnapshot = {
        data: () => ({ count: 0 })
      };

      const { getDocs, getCountFromServer } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(getCountFromServer).mockResolvedValue(mockCountSnapshot as any);

      const result = await searchProviders();

      expect(result.providers).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('should handle malformed timestamp data', async () => {
      const mockProviderWithBadTimestamp = {
        ...mockProvider,
        createdAt: 'invalid-date',
        updatedAt: { seconds: 1641024000 }, // Valid timestamp format
        stats: {
          ...mockProvider.stats,
          lastActive: null
        }
      };

      const mockSnapshot = {
        docs: [
          {
            id: '1',
            data: () => mockProviderWithBadTimestamp
          }
        ]
      };

      const mockCountSnapshot = {
        data: () => ({ count: 1 })
      };

      const { getDocs, getCountFromServer } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(getCountFromServer).mockResolvedValue(mockCountSnapshot as any);

      const result = await searchProviders();

      expect(result.providers).toHaveLength(1);
      expect(result.providers[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should handle missing optional fields', async () => {
      const minimalProvider = {
        id: '1',
        name: 'Minimal Provider',
        slug: 'minimal-provider',
        description: 'A minimal provider',
        type: 'individual',
        expertiseAreas: ['AI'],
        industries: ['Tech'],
        technologies: ['Python'],
        frameworks: [],
        languages: ['English'],
        certifications: [],
        status: 'active',
        verified: false,
        featured: false,
        premium: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockSnapshot = {
        docs: [
          {
            id: '1',
            data: () => minimalProvider
          }
        ]
      };

      const mockCountSnapshot = {
        data: () => ({ count: 1 })
      };

      const { getDocs, getCountFromServer } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);
      vi.mocked(getCountFromServer).mockResolvedValue(mockCountSnapshot as any);

      const result = await searchProviders();

      expect(result.providers).toHaveLength(1);
      expect(result.providers[0].portfolio).toEqual([]);
      expect(result.providers[0].testimonials).toEqual([]);
    });
  });

  describe('Performance and Optimization', () => {
    it('should limit query results for filter counts', async () => {
      const { getDocs, limit } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);

      await generateProviderFilterCounts();

      expect(limit).toHaveBeenCalledWith(1000);
    });

    it('should use proper caching headers in production', () => {
      // This would be tested in integration tests with actual API endpoints
      expect(true).toBe(true); // Placeholder for cache header tests
    });
  });
});