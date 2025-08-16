'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Form } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomFormField, FormFieldType } from '@/components/CustomFormFields';
import { Header } from '@/components/shared/navigation/header';
import { Footer } from '@/components/shared/navigation/footer';
import { ProviderFilters } from '@/components/features/providers/provider-filters';
import { ProviderCard } from '@/components/features/providers/provider-card';
import { EmptyState } from '@/components/shared/empty-state';
import { 
  Search, 
  MapPin, 
  Star, 
  Users, 
  Award, 
  TrendingUp,
  Building2,
  Globe,
  Filter,
  SortAsc,
  Grid3X3,
  List
} from 'lucide-react';
import Link from 'next/link';
import { useAnalytics } from '@/components/providers/analytics-provider';
import { generateProviderDirectorySchema } from '@/lib/seo/structured-data';
import Script from 'next/script';

// Mock data - replace with actual API calls
const MOCK_PROVIDERS = [
  {
    id: '1',
    slug: 'ai-innovations-inc',
    name: 'AI Innovations Inc',
    description: 'Leading provider of enterprise AI solutions with 15+ years of experience in machine learning and data science.',
    logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&crop=faces',
    location: 'San Francisco, CA',
    country: 'us',
    rating: 4.9,
    reviewCount: 127,
    clientCount: 50,
    projectsCompleted: 200,
    expertiseAreas: ['Machine Learning', 'Computer Vision', 'NLP'],
    industries: ['Healthcare', 'Finance', 'Retail'],
    certifications: ['SOC 2', 'ISO 27001', 'GDPR'],
    companySize: 'medium',
    founded: 2008,
    verified: true,
    featured: true,
    pricingModel: 'project',
    startingPrice: 50000,
    portfolio: [
      {
        title: 'Healthcare AI Diagnostic System',
        description: 'Built AI system for early cancer detection with 95% accuracy',
        image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop'
      }
    ]
  },
  {
    id: '2',
    slug: 'data-science-experts',
    name: 'Data Science Experts',
    description: 'Specialized team of data scientists and ML engineers helping businesses unlock insights from their data.',
    logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    location: 'London, UK',
    country: 'uk',
    rating: 4.7,
    reviewCount: 89,
    clientCount: 35,
    projectsCompleted: 150,
    expertiseAreas: ['Data Science', 'Predictive Analytics', 'Deep Learning'],
    industries: ['Manufacturing', 'Transportation', 'Energy'],
    certifications: ['ISO 27001', 'GDPR'],
    companySize: 'small',
    founded: 2015,
    verified: true,
    featured: false,
    pricingModel: 'hourly',
    startingPrice: 150,
    portfolio: []
  },
  {
    id: '3',
    slug: 'neural-networks-pro',
    name: 'Neural Networks Pro',
    description: 'Cutting-edge AI research lab turned consulting firm, specializing in neural network architectures.',
    logo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
    location: 'Toronto, Canada',
    country: 'ca',
    rating: 4.8,
    reviewCount: 156,
    clientCount: 75,
    projectsCompleted: 300,
    expertiseAreas: ['Neural Networks', 'Reinforcement Learning', 'AI Research'],
    industries: ['Gaming', 'Robotics', 'Autonomous Systems'],
    certifications: ['SOC 2', 'Privacy Shield'],
    companySize: 'large',
    founded: 2012,
    verified: true,
    featured: true,
    pricingModel: 'project',
    startingPrice: 75000,
    portfolio: []
  },
];

const FILTER_OPTIONS = {
  expertise: [
    'Machine Learning',
    'Computer Vision', 
    'Natural Language Processing',
    'Data Science',
    'Deep Learning',
    'Neural Networks',
    'Predictive Analytics',
    'AI Consulting',
    'Reinforcement Learning'
  ],
  location: [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'de', label: 'Germany' },
    { value: 'in', label: 'India' },
    { value: 'au', label: 'Australia' }
  ],
  certification: [
    'SOC 2',
    'ISO 27001',
    'GDPR',
    'HIPAA',
    'PCI DSS',
    'Privacy Shield'
  ],
  industry: [
    'Healthcare',
    'Finance',
    'Retail',
    'Manufacturing',
    'Transportation',
    'Energy',
    'Gaming',
    'Robotics'
  ],
  companySize: [
    { value: 'small', label: 'Small (1-50 employees)' },
    { value: 'medium', label: 'Medium (51-200 employees)' },
    { value: 'large', label: 'Large (200+ employees)' }
  ],
  pricing: [
    { value: 'hourly', label: 'Hourly Rate' },
    { value: 'project', label: 'Project-Based' },
    { value: 'retainer', label: 'Monthly Retainer' }
  ]
};

interface ProviderDirectoryClientProps {
  initialFilters: {
    search?: string;
    expertise?: string;
    location?: string;
    certification?: string;
    industry?: string;
    companySize?: string;
    rating?: string;
    verified?: string;
    pricing?: string;
    sort?: string;
    page?: string;
    limit?: string;
  };
}

interface ProviderFilterForm {
  search: string;
  expertise: string;
  location: string;
  certification: string;
  industry: string;
  companySize: string;
  rating: string;
  verified: boolean;
  pricing: string;
  sort: string;
}

export function ProviderDirectoryClient({ initialFilters }: ProviderDirectoryClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const { trackEvent } = useAnalytics();

  const form = useForm<ProviderFilterForm>({
    defaultValues: {
      search: initialFilters.search || '',
      expertise: initialFilters.expertise || '',
      location: initialFilters.location || '',
      certification: initialFilters.certification || '',
      industry: initialFilters.industry || '',
      companySize: initialFilters.companySize || '',
      rating: initialFilters.rating || '0',
      verified: initialFilters.verified === 'true',
      pricing: initialFilters.pricing || '',
      sort: initialFilters.sort || 'relevance',
    },
  });

  const filters = form.watch();

  // Filter providers based on current filters
  const filteredProviders = useMemo(() => {
    let result = [...MOCK_PROVIDERS];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(provider => 
        provider.name.toLowerCase().includes(searchTerm) ||
        provider.description.toLowerCase().includes(searchTerm) ||
        provider.expertiseAreas.some(area => area.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.expertise) {
      result = result.filter(provider => 
        provider.expertiseAreas.some(area => 
          area.toLowerCase().includes(filters.expertise!.toLowerCase())
        )
      );
    }

    if (filters.location) {
      result = result.filter(provider => provider.country === filters.location);
    }

    if (filters.certification) {
      result = result.filter(provider => 
        provider.certifications.includes(filters.certification!)
      );
    }

    if (filters.industry) {
      result = result.filter(provider => 
        provider.industries.some(industry => 
          industry.toLowerCase().includes(filters.industry!.toLowerCase())
        )
      );
    }

    if (filters.companySize) {
      result = result.filter(provider => provider.companySize === filters.companySize);
    }

    if (filters.rating) {
      const minRating = parseFloat(filters.rating);
      result = result.filter(provider => provider.rating >= minRating);
    }

    if (filters.verified) {
      result = result.filter(provider => provider.verified);
    }

    if (filters.pricing) {
      result = result.filter(provider => provider.pricingModel === filters.pricing);
    }

    // Sort results
    const sortBy = filters.sort || 'relevance';
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'newest':
        result.sort((a, b) => b.founded - a.founded);
        break;
      case 'projects':
        result.sort((a, b) => b.projectsCompleted - a.projectsCompleted);
        break;
      default:
        // Featured first, then by rating
        result.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return b.rating - a.rating;
        });
    }

    return result;
  }, [filters]);

  const handleFilterChange = (key: keyof ProviderFilterForm, value: string | boolean) => {
    form.setValue(key, value as any);
    
    // Track filter usage
    trackEvent('provider_filter_applied', {
      filter_type: key,
      filter_value: value.toString(),
      result_count: filteredProviders.length
    });
  };

  const handleProviderClick = (provider: any) => {
    trackEvent('provider_profile_clicked', {
      provider_id: provider.id,
      provider_name: provider.name,
      location: 'directory_listing'
    });
  };

  const providerDirectorySchema = generateProviderDirectorySchema({
    providers: filteredProviders,
    totalCount: filteredProviders.length,
    filters
  });

  useEffect(() => {
    // Track page view
    trackEvent('provider_directory_viewed', {
      filters_applied: Object.keys(filters).filter(key => filters[key as keyof typeof filters]).length,
      result_count: filteredProviders.length,
      view_mode: viewMode
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Structured Data for SEO */}
      <Script
        id="provider-directory-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(providerDirectorySchema) }}
      />
      
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/50 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300">
              <Users className="mr-2 h-4 w-4" />
              {filteredProviders.length} Verified AI Providers
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight dark:text-white">
              AI Service{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Providers
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground dark:text-gray-300 max-w-3xl mx-auto">
              Connect with expert AI companies and consultants. Browse profiles, 
              portfolios, and case studies to find the perfect AI partner for your project.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <Form {...form}>
                <CustomFormField
                  control={form.control}
                  name="search"
                  fieldType={FormFieldType.INPUT}
                  placeholder="Search AI providers by name, expertise, or industry..."
                  iconSrc="/search-icon.svg"
                  iconAlt="search"
                />
              </Form>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              
              <div className="hidden lg:flex flex-wrap items-center gap-3">
                <Select value={filters.expertise || ''} onValueChange={(value) => handleFilterChange('expertise', value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Expertise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Expertise</SelectItem>
                    {FILTER_OPTIONS.expertise.map((option) => (
                      <SelectItem key={option} value={option.toLowerCase().replace(' ', '-')}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filters.location || ''} onValueChange={(value) => handleFilterChange('location', value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Locations</SelectItem>
                    {FILTER_OPTIONS.location.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filters.certification || ''} onValueChange={(value) => handleFilterChange('certification', value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Certification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Certifications</SelectItem>
                    {FILTER_OPTIONS.certification.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* View Controls */}
            <div className="flex items-center gap-3">
              <Select value={filters.sort || 'relevance'} onValueChange={(value) => handleFilterChange('sort', value)}>
                <SelectTrigger className="w-36">
                  <SortAsc className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Most Relevant</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                  <SelectItem value="projects">Most Projects</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Mobile Filters */}
          {showFilters && (
            <div className="lg:hidden mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <Form {...form}>
                <ProviderFilters
                  control={form.control}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  options={FILTER_OPTIONS}
                />
              </Form>
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredProviders.length === 0 ? (
            <EmptyState
              title="No providers found"
              description="Try adjusting your filters or search terms to find AI providers."
              icon={Users}
              action={
                <Button onClick={() => setFilters({})}>
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredProviders.length} AI Provider{filteredProviders.length !== 1 ? 's' : ''}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Showing verified providers with proven track records
                </p>
              </div>
              
              <div className={`grid gap-8 ${
                viewMode === 'grid' 
                  ? 'sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {filteredProviders.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    viewMode={viewMode}
                    onClick={() => handleProviderClick(provider)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 dark:from-blue-800 dark:via-blue-900 dark:to-purple-900 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your AI Project?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Connect with top-rated AI providers and get your project started today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="h-12 px-8">
              <Link href="/projects/create" className="flex items-center gap-2">
                Post Your Project
                <TrendingUp className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-700">
              <Link href="/catalog">
                Browse AI Services
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}