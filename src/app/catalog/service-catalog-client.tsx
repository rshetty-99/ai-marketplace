'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ServiceCard } from '@/components/features/catalog/service-card';
import { ServiceComparison } from '@/components/features/catalog/service-comparison';
import { useAnalytics } from '@/components/providers/analytics-provider';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Grid3X3, 
  List, 
  Star,
  MapPin,
  DollarSign,
  Users,
  Building2,
  X,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockServices, serviceCategories, industries, technologies } from '@/lib/data/mock-services';
import type { Service, ServiceFilters, ServiceSortOptions } from '@/types/service';

interface ServiceCatalogClientProps {
  initialFilters: Record<string, string>;
}

export function ServiceCatalogClient({ initialFilters }: ServiceCatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { trackEvent } = useAnalytics();
  const [isPending, startTransition] = useTransition();
  
  // State
  const [services, setServices] = useState<Service[]>(mockServices);
  const [filteredServices, setFilteredServices] = useState<Service[]>(mockServices);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<ServiceFilters>({
    search: initialFilters.search || '',
    category: initialFilters.category as any || undefined,
    industries: initialFilters.industry?.split(',') || [],
    providerType: initialFilters.providerType as any || undefined,
    priceRange: {
      min: initialFilters.priceRange ? parseInt(initialFilters.priceRange.split('-')[0]) : undefined,
      max: initialFilters.priceRange ? parseInt(initialFilters.priceRange.split('-')[1]) : undefined,
    },
    technologies: initialFilters.technologies?.split(',') || [],
    verified: initialFilters.verified === 'true' || undefined,
    featured: initialFilters.featured === 'true' || undefined,
  });
  
  // Sort state
  const [sort, setSort] = useState<ServiceSortOptions>({
    field: (initialFilters.sort?.split('-')[0] as any) || 'relevance',
    direction: (initialFilters.sort?.split('-')[1] as any) || 'desc',
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(parseInt(initialFilters.page || '1'));
  const [itemsPerPage] = useState(parseInt(initialFilters.limit || '12'));

  // Filter and sort services
  useEffect(() => {
    let filtered = [...services];
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchTerm) ||
        service.description.toLowerCase().includes(searchTerm) ||
        service.providerName.toLowerCase().includes(searchTerm) ||
        service.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    // Category filter
    if (filters.category) {
      filtered = filtered.filter(service => service.category === filters.category);
    }
    
    // Industries filter
    if (filters.industries && filters.industries.length > 0) {
      filtered = filtered.filter(service => 
        service.industries.some(industry => filters.industries!.includes(industry))
      );
    }
    
    // Provider type filter
    if (filters.providerType) {
      filtered = filtered.filter(service => service.provider?.type === filters.providerType);
    }
    
    // Price range filter
    if (filters.priceRange?.min !== undefined || filters.priceRange?.max !== undefined) {
      filtered = filtered.filter(service => {
        const price = service.pricing.startingPrice;
        if (!price) return filters.priceRange?.min === undefined; // Include custom pricing if no min
        if (filters.priceRange?.min !== undefined && price < filters.priceRange.min) return false;
        if (filters.priceRange?.max !== undefined && price > filters.priceRange.max) return false;
        return true;
      });
    }
    
    // Technologies filter
    if (filters.technologies && filters.technologies.length > 0) {
      filtered = filtered.filter(service => 
        service.technical.technologies.some(tech => filters.technologies!.includes(tech))
      );
    }
    
    // Verified filter
    if (filters.verified) {
      filtered = filtered.filter(service => service.provider?.verification.verified);
    }
    
    // Featured filter
    if (filters.featured) {
      filtered = filtered.filter(service => service.featured);
    }
    
    // Sort services
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sort.field) {
        case 'rating':
          aValue = a.reviews.averageRating;
          bValue = b.reviews.averageRating;
          break;
        case 'price':
          aValue = a.pricing.startingPrice || Infinity;
          bValue = b.pricing.startingPrice || Infinity;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created':
          aValue = a.createdAt.seconds;
          bValue = b.createdAt.seconds;
          break;
        case 'popularity':
          aValue = a.stats.views;
          bValue = b.stats.views;
          break;
        default: // relevance
          aValue = a.priority;
          bValue = b.priority;
      }
      
      if (sort.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredServices(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [services, filters, sort]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.industries && filters.industries.length > 0) {
      params.set('industry', filters.industries.join(','));
    }
    if (filters.providerType) params.set('providerType', filters.providerType);
    if (filters.priceRange?.min !== undefined || filters.priceRange?.max !== undefined) {
      params.set('priceRange', `${filters.priceRange?.min || 0}-${filters.priceRange?.max || 999999}`);
    }
    if (filters.technologies && filters.technologies.length > 0) {
      params.set('technologies', filters.technologies.join(','));
    }
    if (filters.verified) params.set('verified', 'true');
    if (filters.featured) params.set('featured', 'true');
    if (sort.field !== 'relevance' || sort.direction !== 'desc') {
      params.set('sort', `${sort.field}-${sort.direction}`);
    }
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    const url = params.toString() ? `/catalog?${params.toString()}` : '/catalog';
    
    startTransition(() => {
      router.replace(url, { scroll: false });
    });
  }, [filters, sort, currentPage, router]);

  // Analytics tracking
  useEffect(() => {
    trackEvent('catalog_viewed', {
      filters: Object.keys(filters).filter(key => filters[key as keyof ServiceFilters]),
      resultCount: filteredServices.length,
      sortBy: `${sort.field}-${sort.direction}`,
    });
  }, [filters, filteredServices.length, sort, trackEvent]);

  // Handler functions
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    trackEvent('catalog_search', { query: value });
  };

  const handleFilterChange = (key: keyof ServiceFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    trackEvent('filter_applied', { filter: key, value });
  };

  const handleSortChange = (field: string) => {
    const [sortField, sortDirection] = field.split('-') as [ServiceSortOptions['field'], ServiceSortOptions['direction']];
    setSort({ field: sortField, direction: sortDirection });
    trackEvent('sort_changed', { field: sortField, direction: sortDirection });
  };

  const handleServiceSelect = (service: Service) => {
    trackEvent('service_clicked', {
      serviceId: service.id,
      serviceName: service.name,
      providerId: service.providerId,
    });
    router.push(`/services/${service.provider?.name.toLowerCase().replace(/\s+/g, '-')}/${service.slug}`);
  };

  const handleServiceCompare = (service: Service) => {
    setSelectedServices(prev => {
      const isAlreadySelected = prev.some(s => s.id === service.id);
      let newSelection;
      
      if (isAlreadySelected) {
        newSelection = prev.filter(s => s.id !== service.id);
      } else if (prev.length < 3) {
        newSelection = [...prev, service];
      } else {
        newSelection = [...prev.slice(1), service]; // Replace oldest
      }
      
      trackEvent('service_comparison_updated', {
        serviceId: service.id,
        action: isAlreadySelected ? 'removed' : 'added',
        totalSelected: newSelection.length,
      });
      
      return newSelection;
    });
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      category: undefined,
      industries: [],
      providerType: undefined,
      priceRange: { min: undefined, max: undefined },
      technologies: [],
      verified: undefined,
      featured: undefined,
    });
    setSort({ field: 'relevance', direction: 'desc' });
    trackEvent('filters_cleared');
  };

  // Get paginated services
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedServices = filteredServices.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  const hasActiveFilters = Object.values(filters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== undefined);
    }
    return value !== undefined && value !== '';
  });

  return (
    <div className="space-y-6">
      {/* Search and Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search services, providers, or technologies..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <div className="flex items-center space-x-1 border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Select value={`${sort.field}-${sort.direction}`} onValueChange={handleSortChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance-desc">Most Relevant</SelectItem>
              <SelectItem value="rating-desc">Highest Rated</SelectItem>
              <SelectItem value="rating-asc">Lowest Rated</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
              <SelectItem value="name-desc">Name: Z to A</SelectItem>
              <SelectItem value="created-desc">Newest First</SelectItem>
              <SelectItem value="popularity-desc">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Active filters:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('search', '')} />
            </Badge>
          )}
          
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              Category: {serviceCategories.find(c => c.id === filters.category)?.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('category', undefined)} />
            </Badge>
          )}
          
          {filters.industries?.map(industry => (
            <Badge key={industry} variant="secondary" className="gap-1">
              {industry}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleFilterChange('industries', filters.industries?.filter(i => i !== industry))} 
              />
            </Badge>
          ))}
          
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear all
          </Button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className={cn(
          "lg:w-1/4 space-y-6",
          !showFilters && "hidden lg:block"
        )}>
          {/* Categories */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Categories
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {serviceCategories.map((category) => (
                <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={filters.category === category.id}
                    onCheckedChange={(checked) => 
                      handleFilterChange('category', checked ? category.id : undefined)
                    }
                  />
                  <span className="text-sm flex-1">{category.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {services.filter(s => s.category === category.id).length}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Industries */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Industries
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {industries.slice(0, 8).map((industry) => (
                <label key={industry.id} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={filters.industries?.includes(industry.name) || false}
                    onCheckedChange={(checked) => {
                      const current = filters.industries || [];
                      const updated = checked 
                        ? [...current, industry.name]
                        : current.filter(i => i !== industry.name);
                      handleFilterChange('industries', updated);
                    }}
                  />
                  <span className="text-sm flex-1">{industry.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {industry.serviceCount}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Provider Type */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Provider Type
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { value: 'vendor', label: 'Vendors', count: 45 },
                { value: 'freelancer', label: 'Freelancers', count: 67 },
                { value: 'agency', label: 'Agencies', count: 23 },
                { value: 'channel_partner', label: 'Channel Partners', count: 12 },
              ].map((type) => (
                <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={filters.providerType === type.value}
                    onCheckedChange={(checked) => 
                      handleFilterChange('providerType', checked ? type.value : undefined)
                    }
                  />
                  <span className="text-sm flex-1">{type.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {type.count}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Price Range */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price Range
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Starting Price (USD)</label>
                <Slider
                  value={[filters.priceRange?.min || 0, filters.priceRange?.max || 50000]}
                  onValueChange={([min, max]) => 
                    handleFilterChange('priceRange', { min: min || undefined, max: max || undefined })
                  }
                  max={50000}
                  step={100}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>${filters.priceRange?.min || 0}</span>
                <span>${filters.priceRange?.max || '50,000+'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Other Filters */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold flex items-center gap-2">
                <Star className="h-4 w-4" />
                Other Filters
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={filters.verified || false}
                  onCheckedChange={(checked) => handleFilterChange('verified', checked || undefined)}
                />
                <span className="text-sm">Verified Providers Only</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={filters.featured || false}
                  onCheckedChange={(checked) => handleFilterChange('featured', checked || undefined)}
                />
                <span className="text-sm">Featured Services</span>
              </label>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="lg:w-3/4">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">
                {filteredServices.length} services found
              </h2>
              {filters.search && (
                <p className="text-sm text-muted-foreground">
                  Results for "{filters.search}"
                </p>
              )}
            </div>
            
            {selectedServices.length > 0 && (
              <Button 
                onClick={() => setShowComparison(true)}
                className="gap-2"
              >
                Compare ({selectedServices.length})
              </Button>
            )}
          </div>

          {/* Services Grid/List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading services...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No services found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search terms.
              </p>
              <Button onClick={clearAllFilters}>Clear all filters</Button>
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                : "space-y-4"
            )}>
              {paginatedServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onSelect={handleServiceSelect}
                  onCompare={handleServiceCompare}
                  isSelected={selectedServices.some(s => s.id === service.id)}
                  showCompareButton={true}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = Math.max(1, currentPage - 2) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Service Comparison Modal */}
      {showComparison && (
        <ServiceComparison
          services={selectedServices}
          onClose={() => setShowComparison(false)}
          onServiceRemove={(service) => handleServiceCompare(service)}
        />
      )}
    </div>
  );
}