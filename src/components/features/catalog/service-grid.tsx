'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceCard } from '@/components/features/catalog/service-card';
import { ServiceGridSkeleton } from '@/components/shared/skeletons/service-grid-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  Filter,
  Search as SearchIcon 
} from 'lucide-react';
// import { useAnalytics } from '@/components/providers/analytics-provider';
import { cn } from '@/lib/utils';

interface ServiceGridProps {
  searchParams: {
    search?: string;
    category?: string;
    industry?: string;
    pricing?: string;
    sort?: string;
    page?: string;
  };
  className?: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  provider: {
    id: string;
    name: string;
    logo: string;
    verified: boolean;
  };
  category: string;
  subcategory?: string;
  pricing: {
    model: 'fixed' | 'usage' | 'tiered' | 'custom';
    startingPrice: number;
    currency: 'USD';
    period?: 'hour' | 'month' | 'project';
  };
  rating: {
    average: number;
    count: number;
  };
  features: string[];
  tags: string[];
  compliance: string[];
  deployment: ('cloud' | 'on_premise' | 'hybrid' | 'saas')[];
  image?: string;
  featured?: boolean;
}

// Mock data - TODO: Replace with actual API call
const mockServices: Service[] = Array.from({ length: 50 }, (_, index) => ({
  id: `service-${index + 1}`,
  name: [
    'AI Vision Pro',
    'SmartText Analyzer', 
    'DataMind ML Platform',
    'VisionBot API',
    'NeuralChat Assistant',
    'PredictiveMax',
    'AutoML Suite',
    'DeepSight Vision',
    'ConversationAI',
    'AnalyticsGenie'
  ][index % 10],
  description: [
    'Advanced computer vision solution for real-time object detection and analysis',
    'Natural language processing API for sentiment analysis and text understanding',
    'Complete machine learning platform with automated model training and deployment',
    'Comprehensive image recognition service with custom model training capabilities',
    'Conversational AI chatbot with natural language understanding and generation',
    'Predictive analytics platform for business forecasting and trend analysis',
    'Automated machine learning platform for non-technical users',
    'Deep learning-powered visual inspection and quality control system',
    'Multi-language conversational AI with voice and text support',
    'Advanced business analytics with AI-powered insights and recommendations'
  ][index % 10],
  provider: {
    id: `provider-${(index % 5) + 1}`,
    name: ['TechVision AI', 'DataCorp Solutions', 'Neural Networks Inc', 'AI Dynamics', 'SmartTech Labs'][index % 5],
    logo: `/providers/logo-${(index % 5) + 1}.png`,
    verified: Math.random() > 0.3,
  },
  category: ['computer_vision', 'nlp', 'machine_learning', 'data_science', 'deep_learning'][index % 5],
  pricing: {
    model: ['fixed', 'usage', 'tiered', 'custom'][index % 4] as any,
    startingPrice: Math.floor(Math.random() * 5000) + 100,
    currency: 'USD',
    period: ['month', 'hour', 'project'][index % 3] as any,
  },
  rating: {
    average: Math.round((Math.random() * 2 + 3) * 10) / 10,
    count: Math.floor(Math.random() * 500) + 10,
  },
  features: [
    'Real-time processing',
    'Custom model training',
    'API integration',
    'Cloud deployment',
    'Multi-language support'
  ].slice(0, Math.floor(Math.random() * 3) + 2),
  tags: [
    'Computer Vision',
    'Machine Learning',
    'Deep Learning',
    'Natural Language',
    'Analytics',
    'Automation'
  ].slice(0, Math.floor(Math.random() * 3) + 1),
  compliance: ['GDPR', 'HIPAA', 'SOX', 'ISO27001'].slice(0, Math.floor(Math.random() * 2) + 1),
  deployment: [
    ['cloud'],
    ['on_premise'],
    ['cloud', 'hybrid'],
    ['saas'],
    ['cloud', 'on_premise', 'hybrid']
  ][index % 5] as any,
  featured: Math.random() > 0.8,
}));

export function ServiceGrid({ searchParams, className }: ServiceGridProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const { trackEvent } = useAnalytics();

  const currentPage = parseInt(searchParams.page || '1');
  const servicesPerPage = 12;
  const totalServices = mockServices.length;
  const totalPages = Math.ceil(totalServices / servicesPerPage);

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      setError(null);

      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        let filteredServices = [...mockServices];

        // Apply search filter
        if (searchParams.search) {
          const searchTerm = searchParams.search.toLowerCase();
          filteredServices = filteredServices.filter(service =>
            service.name.toLowerCase().includes(searchTerm) ||
            service.description.toLowerCase().includes(searchTerm) ||
            service.provider.name.toLowerCase().includes(searchTerm) ||
            service.tags.some(tag => tag.toLowerCase().includes(searchTerm))
          );
        }

        // Apply category filter
        if (searchParams.category) {
          filteredServices = filteredServices.filter(service =>
            service.category === searchParams.category
          );
        }

        // Apply sorting
        const sortOption = searchParams.sort || 'relevance';
        switch (sortOption) {
          case 'rating':
            filteredServices.sort((a, b) => b.rating.average - a.rating.average);
            break;
          case 'price_low':
            filteredServices.sort((a, b) => a.pricing.startingPrice - b.pricing.startingPrice);
            break;
          case 'price_high':
            filteredServices.sort((a, b) => b.pricing.startingPrice - a.pricing.startingPrice);
            break;
          case 'popular':
            filteredServices.sort((a, b) => b.rating.count - a.rating.count);
            break;
          case 'newest':
            // Mock newest sorting
            filteredServices.reverse();
            break;
          default:
            // Relevance - move featured services to top
            filteredServices.sort((a, b) => {
              if (a.featured && !b.featured) return -1;
              if (!a.featured && b.featured) return 1;
              return 0;
            });
        }

        // Apply pagination
        const startIndex = (currentPage - 1) * servicesPerPage;
        const paginatedServices = filteredServices.slice(startIndex, startIndex + servicesPerPage);

        setServices(paginatedServices);
        
        // Track search/filter events
        // trackEvent('services_loaded', {
        //   search_query: searchParams.search,
        //   category: searchParams.category,
        //   sort_option: sortOption,
        //   page: currentPage,
        //   results_count: filteredServices.length,
        // });

      } catch (err) {
        console.error('Failed to load services:', err);
        setError('Failed to load services. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [searchParams, currentPage]);

  if (loading) {
    return <ServiceGridSkeleton className={className} />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <EmptyState
        icon={SearchIcon}
        title="No services found"
        description={
          searchParams.search 
            ? `No services found for "${searchParams.search}". Try adjusting your search terms or filters.`
            : 'No services found matching your current filters. Try adjusting your selection.'
        }
        actions={[
          <Button key="clear" variant="outline" onClick={() => {
            // TODO: Clear all filters
            console.log('Clear all filters');
          }}>
            Clear All Filters
          </Button>,
          <Button key="browse" asChild>
            <Link href="/catalog">Browse All Services</Link>
          </Button>
        ]}
      />
    );
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    // trackEvent('pagination_clicked', {
    //   page: page,
    //   previous_page: currentPage,
    //   total_pages: totalPages,
    // });

    // TODO: Update URL with new page
    console.log('Navigate to page:', page);
  };

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {((currentPage - 1) * servicesPerPage) + 1}-{Math.min(currentPage * servicesPerPage, totalServices)} of {totalServices} results
        </div>
        
        {searchParams.search && (
          <div className="text-sm text-gray-600">
            Search results for &quot;{searchParams.search}&quot;
          </div>
        )}
      </div>

      {/* Services Grid */}
      <div className={cn('grid gap-6', className)}>
        {services.map((service) => {
          // Transform service data to match ServiceCard interface
          const transformedService = {
            id: service.id,
            title: service.name,
            description: service.description,
            provider: {
              name: service.provider.name,
              logo: service.provider.logo,
              verified: service.provider.verified,
              location: 'Global'
            },
            category: service.category,
            subcategory: service.subcategory,
            pricing: {
              type: (service.pricing.model === 'usage' ? 'hourly' : 
                    service.pricing.model === 'fixed' ? 'project' :
                    service.pricing.model === 'tiered' ? 'subscription' : 'fixed') as 'fixed' | 'hourly' | 'project' | 'subscription',
              amount: service.pricing.startingPrice,
              currency: service.pricing.currency,
              period: service.pricing.period
            },
            rating: service.rating.average,
            reviewCount: service.rating.count,
            completedProjects: Math.floor(Math.random() * 100) + 10,
            responseTime: '< 24h',
            skills: service.features,
            featured: service.featured,
            urgent: false,
            image: service.image
          };
          
          return (
            <ServiceCard 
              key={service.id} 
              service={transformedService}
            />
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + Math.max(1, currentPage - 2);
              if (page > totalPages) return null;

              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="w-10"
                >
                  {page}
                </Button>
              );
            })}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="text-gray-500">...</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  className="w-10"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}