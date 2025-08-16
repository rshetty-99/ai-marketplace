'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchAutocomplete } from '@/components/ui/search-autocomplete';
import {
  CategoryFilterSkeleton,
  PriceFilterSkeleton,
  ProviderTypeFilterSkeleton,
  RatingFilterSkeleton,
  IndustryFilterSkeleton,
  ComplianceFilterSkeleton,
  ServiceFeaturesFilterSkeleton,
  FilterSectionSkeleton,
} from '@/components/features/catalog/filter-skeleton';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ServiceCard } from '@/components/features/catalog/service-card';
import { ServiceComparison } from '@/components/features/catalog/service-comparison';
import { SemanticSearch } from '@/components/features/catalog/semantic-search';
import { SemanticSearchResults } from '@/components/features/catalog/semantic-search-results';
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
  ChevronRight,
  ArrowUpDown,
  Package,
  Sparkles,
  Shield,
  Clock,
  Globe,
  Cpu,
  Code,
  HeadphonesIcon,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockServices } from '@/lib/data/mock-services';
import {
  categoryHierarchy,
  priceRanges,
  billingCycles,
  providerTypes,
  ratingFilters,
  industryFilters,
  complianceFilters,
  deploymentOptions,
  implementationTimelines,
  serviceFeatures,
  technologyFilters,
  languageFilters,
  platformFilters,
  integrationMethods,
  supportLevels,
  locationFilters,
  quickFilterCombos,
} from '@/lib/data/filter-options';
import { searchServices, generateFilterCounts, generatePriceHistogram, type FilterCounts, type PriceHistogram } from '@/lib/api/services';
import { mergeFilterCounts } from '@/lib/utils/filter-helpers';
import { useRecentSearches } from '@/hooks/use-recent-searches';
import { useFilterPreferences } from '@/hooks/use-filter-preferences';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { useSemanticSearch, type SemanticSearchResult } from '@/hooks/use-semantic-search';
import { FilterPreferencesDialog } from '@/components/features/catalog/filter-preferences-dialog';
import { QuickFilterCombos, QuickFilterCombosCompact } from '@/components/features/catalog/quick-filter-combos';
import type { Service, ServiceFilters, ServiceSortOptions } from '@/types/service';

interface EnhancedCatalogClientProps {
  initialFilters: Record<string, string>;
}

export function EnhancedCatalogClient({ initialFilters }: EnhancedCatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { trackEvent } = useAnalytics();
  const [isPending, startTransition] = useTransition();
  const { recentSearches, addRecentSearch } = useRecentSearches();
  const { 
    preferences, 
    updateViewMode, 
    updateSortPreferences, 
    isSectionExpanded 
  } = useFilterPreferences();
  
  // State
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(preferences.viewMode);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);
  const [filterCounts, setFilterCounts] = useState<FilterCounts | null>(null);
  const [priceHistogram, setPriceHistogram] = useState<PriceHistogram | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Infinite scroll state
  const [useInfiniteScrollMode, setUseInfiniteScrollMode] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allServices, setAllServices] = useState<Service[]>([]);
  
  // Enhanced filter state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ServiceFilters>({
    search: initialFilters.search || '',
    category: initialFilters.category as any || undefined,
    industries: initialFilters.industry?.split(',') || [],
    providerType: initialFilters.providerType as any || undefined,
    priceRange: {
      min: initialFilters.minPrice ? parseInt(initialFilters.minPrice) : undefined,
      max: initialFilters.maxPrice ? parseInt(initialFilters.maxPrice) : undefined,
    },
    rating: initialFilters.rating ? parseFloat(initialFilters.rating) : undefined,
    verified: initialFilters.verified === 'true',
    featured: initialFilters.featured === 'true',
  });
  
  // Legacy state for UI compatibility (will be removed)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(filters.category || null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number]>([filters.priceRange?.min || 0, filters.priceRange?.max || 10000]);
  const [selectedBillingCycles, setSelectedBillingCycles] = useState<Set<string>>(new Set());
  const [selectedProviderTypes, setSelectedProviderTypes] = useState<Set<string>>(filters.providerType ? new Set([filters.providerType]) : new Set());
  const [minRating, setMinRating] = useState<number>(filters.rating || 0);
  const [selectedIndustries, setSelectedIndustries] = useState<Set<string>>(new Set(filters.industries || []));
  const [selectedCompliances, setSelectedCompliances] = useState<Set<string>>(new Set());
  const [selectedDeployments, setSelectedDeployments] = useState<Set<string>>(new Set());
  const [selectedTimelines, setSelectedTimelines] = useState<Set<string>>(new Set());
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [selectedTechnologies, setSelectedTechnologies] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  
  // Semantic search state
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);
  const [semanticSearchResults, setSemanticSearchResults] = useState<SemanticSearchResult[]>([]);
  const [semanticSearchIntent, setSemanticSearchIntent] = useState<any>(null);
  const [showSemanticResults, setShowSemanticResults] = useState(false);
  
  // Sort state
  const [sort, setSort] = useState<ServiceSortOptions>({
    field: (initialFilters.sort?.split('-')[0] as any) || preferences.sortField as any,
    direction: (initialFilters.sort?.split('-')[1] as any) || preferences.sortDirection,
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(parseInt(initialFilters.page || '1'));
  const [itemsPerPage] = useState(preferences.itemsPerPage);

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    const isExpanding = !newExpanded.has(categoryId);
    
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
    
    // Track category expansion
    trackEvent('filter_category_toggled', {
      categoryId,
      action: isExpanding ? 'expanded' : 'collapsed',
      timestamp: new Date().toISOString(),
    });
  };

  // Toggle subcategory expansion
  const toggleSubcategory = (subcategoryId: string) => {
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(subcategoryId)) {
      newExpanded.delete(subcategoryId);
    } else {
      newExpanded.add(subcategoryId);
    }
    setExpandedSubcategories(newExpanded);
  };

  // Load more services for infinite scroll
  const loadMoreServices = useCallback(async () => {
    if (isLoadingMore || !hasNextPage) return;
    
    try {
      setIsLoadingMore(true);
      
      const currentFilters: ServiceFilters = {
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        industries: selectedIndustries.size > 0 ? Array.from(selectedIndustries) : undefined,
        providerType: selectedProviderTypes.size > 0 ? Array.from(selectedProviderTypes)[0] as any : undefined,
        priceRange: {
          min: priceRange[0] > 0 ? priceRange[0] : undefined,
          max: priceRange[1] < 10000 ? priceRange[1] : undefined,
        },
        rating: minRating > 0 ? minRating : undefined,
        technologies: selectedTechnologies.size > 0 ? Array.from(selectedTechnologies) : undefined,
      };
      
      // Clean up undefined values
      Object.keys(currentFilters).forEach(key => {
        if (currentFilters[key as keyof ServiceFilters] === undefined) {
          delete currentFilters[key as keyof ServiceFilters];
        }
      });
      
      const nextPage = Math.ceil(allServices.length / itemsPerPage) + 1;
      const servicesResponse = await searchServices(currentFilters, sort, nextPage, itemsPerPage);
      
      setAllServices(prev => [...prev, ...servicesResponse.services]);
      setFilteredServices(prev => [...prev, ...servicesResponse.services]);
      setHasNextPage(servicesResponse.pagination.hasNextPage);
      
      trackEvent('infinite_scroll_load_more', {
        page: nextPage,
        loadedCount: servicesResponse.services.length,
        totalCount: allServices.length + servicesResponse.services.length,
      });
      
    } catch (err) {
      console.error('Error loading more services:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasNextPage, searchQuery, selectedCategory, selectedIndustries, selectedProviderTypes, priceRange, minRating, selectedTechnologies, sort, itemsPerPage, allServices.length, trackEvent]);

  // Setup infinite scroll
  const { loadMoreRef } = useInfiniteScroll({
    hasMore: hasNextPage && useInfiniteScrollMode,
    loading: isLoadingMore,
    onLoadMore: loadMoreServices,
  });

  // Load services with current filters
  const loadServices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Only show filter loading on first load or when filter counts are null
      if (!filterCounts) {
        setIsFiltersLoading(true);
      }
      
      // Build filters object
      const currentFilters: ServiceFilters = {
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        industries: selectedIndustries.size > 0 ? Array.from(selectedIndustries) : undefined,
        providerType: selectedProviderTypes.size > 0 ? Array.from(selectedProviderTypes)[0] as any : undefined,
        priceRange: {
          min: priceRange[0] > 0 ? priceRange[0] : undefined,
          max: priceRange[1] < 10000 ? priceRange[1] : undefined,
        },
        rating: minRating > 0 ? minRating : undefined,
        technologies: selectedTechnologies.size > 0 ? Array.from(selectedTechnologies) : undefined,
        verified: false, // We can add this as a filter option later
        featured: false, // We can add this as a filter option later
      };
      
      // Clean up undefined values
      Object.keys(currentFilters).forEach(key => {
        if (currentFilters[key as keyof ServiceFilters] === undefined) {
          delete currentFilters[key as keyof ServiceFilters];
        }
      });
      
      // Load services and filter counts in parallel
      const [servicesResponse, filterCountsData, priceHistogramData] = await Promise.all([
        searchServices(currentFilters, sort, currentPage, itemsPerPage),
        generateFilterCounts(currentFilters),
        generatePriceHistogram(currentFilters),
      ]);
      
      if (useInfiniteScrollMode) {
        setAllServices(servicesResponse.services);
        setFilteredServices(servicesResponse.services);
      } else {
        setServices(servicesResponse.services);
        setFilteredServices(servicesResponse.services);
      }
      setTotalResults(servicesResponse.total);
      setHasNextPage(servicesResponse.pagination.hasNextPage);
      setFilterCounts(filterCountsData);
      setPriceHistogram(priceHistogramData);
      setIsFiltersLoading(false);
      
      // Track analytics
      trackEvent('catalog_search', {
        filters: currentFilters,
        sort,
        page: currentPage,
        totalResults: servicesResponse.total,
      });
      
    } catch (err) {
      console.error('Error loading services:', err);
      setError('Failed to load services. Please try again.');
      
      // Fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        setServices(mockServices);
        setFilteredServices(mockServices);
        setTotalResults(mockServices.length);
      }
    } finally {
      setIsLoading(false);
      setIsFiltersLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedIndustries, selectedProviderTypes, priceRange, minRating, selectedTechnologies, sort, currentPage, itemsPerPage, trackEvent]);

  // Initial load and reload on filter changes
  useEffect(() => {
    loadServices();
  }, [loadServices]);
  
  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== filters.search) {
        setCurrentPage(1); // Reset to first page on new search
        loadServices();
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters.search, loadServices]);

  // Handle service selection
  const handleServiceSelect = (service: Service) => {
    trackEvent('service_clicked', {
      serviceId: service.id,
      serviceName: service.name,
      providerId: service.providerId,
    });
    router.push(`/services/${service.provider?.name.toLowerCase().replace(/\s+/g, '-')}/${service.slug}`);
  };

  // Handle service comparison
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

  // Apply quick filter combo
  const applyQuickFilterCombo = (combo: any) => {
    clearAllFilters();
    
    // Apply the combo filters
    if (combo.filters.category) {
      setSelectedCategory(combo.filters.category);
    }
    if (combo.filters.providerType) {
      setSelectedProviderTypes(new Set([combo.filters.providerType]));
    }
    if (combo.filters.priceRange) {
      setPriceRange([
        combo.filters.priceRange.min || 0,
        combo.filters.priceRange.max || 10000
      ]);
    }
    if (combo.filters.industries) {
      setSelectedIndustries(new Set(combo.filters.industries));
    }
    if (combo.filters.compliance) {
      setSelectedCompliances(new Set(combo.filters.compliance));
    }
    if (combo.filters.features) {
      setSelectedFeatures(new Set(combo.filters.features));
    }
    
    // Track analytics
    trackEvent('quick_filter_applied', {
      comboId: combo.id,
      comboLabel: combo.label,
      filters: combo.filters,
    });
    
    // Reload services with new filters
    setCurrentPage(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const previousFilters = {
      search: searchQuery,
      category: selectedCategory,
      providerTypes: Array.from(selectedProviderTypes),
      industries: Array.from(selectedIndustries),
      priceRange: priceRange,
      rating: minRating,
      features: Array.from(selectedFeatures),
      technologies: Array.from(selectedTechnologies),
    };
    
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedDomains(new Set());
    setPriceRange([0, 10000]);
    setSelectedBillingCycles(new Set());
    setSelectedProviderTypes(new Set());
    setMinRating(0);
    setSelectedIndustries(new Set());
    setSelectedCompliances(new Set());
    setSelectedDeployments(new Set());
    setSelectedTimelines(new Set());
    setSelectedFeatures(new Set());
    setSelectedTechnologies(new Set());
    setCurrentPage(1);
    
    // Enhanced tracking for filter clearing
    trackEvent('filters_cleared', {
      previousFilters,
      activeFilterCount,
      timestamp: new Date().toISOString(),
      userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : null,
    });
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalResults / itemsPerPage);
  const paginatedServices = filteredServices; // Already paginated from API

  const activeFilterCount = [
    searchQuery,
    selectedCategory,
    selectedProviderTypes.size > 0,
    minRating > 0,
    selectedIndustries.size > 0,
    selectedCompliances.size > 0,
    selectedFeatures.size > 0,
  ].filter(Boolean).length;

  // Merge filter counts with static options
  const mergedFilters = mergeFilterCounts(filterCounts);

  // Helper function to track filter changes
  const trackFilterChange = (filterType: string, value: any, action: 'added' | 'removed' | 'changed') => {
    trackEvent('filter_changed', {
      filterType,
      value,
      action,
      timestamp: new Date().toISOString(),
      currentFilters: {
        search: searchQuery,
        category: selectedCategory,
        providerTypes: Array.from(selectedProviderTypes),
        industries: Array.from(selectedIndustries),
        priceRange: priceRange,
        rating: minRating,
        totalResults,
      },
      page: currentPage,
      viewMode,
      sort: `${sort.field}-${sort.direction}`,
    });
  };

  // Semantic search callbacks
  const handleSemanticSearchResults = useCallback((results: SemanticSearchResult[]) => {
    setSemanticSearchResults(results);
    setShowSemanticResults(true);
    
    // Track semantic search usage
    trackEvent('semantic_search_results_received', {
      resultCount: results.length,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  const handleSemanticSearchIntent = useCallback((intent: any) => {
    setSemanticSearchIntent(intent);
    
    // Auto-apply filters based on intent if applicable
    if (intent.category && intent.confidence > 0.7) {
      const categoryMatch = mergedFilters.categories.find(c => 
        c.name.toLowerCase().includes(intent.category.toLowerCase())
      );
      if (categoryMatch) {
        setSelectedCategory(categoryMatch.id);
      }
    }
    
    trackEvent('semantic_search_intent_detected', {
      category: intent.category,
      confidence: intent.confidence,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent, mergedFilters.categories]);

  const handleSemanticServiceSelect = useCallback((service: SemanticSearchResult) => {
    // Navigate to service detail page
    router.push(`/services/${service.providerName || 'provider'}/${service.id}`);
    
    trackEvent('semantic_search_service_selected', {
      serviceId: service.id,
      serviceName: service.name,
      score: service.score,
      timestamp: new Date().toISOString(),
    });
  }, [router, trackEvent]);

  const toggleSemanticSearch = useCallback(() => {
    setUseSemanticSearch(!useSemanticSearch);
    setShowSemanticResults(false);
    setSemanticSearchResults([]);
    setSemanticSearchIntent(null);
    
    trackEvent('semantic_search_toggled', {
      enabled: !useSemanticSearch,
      timestamp: new Date().toISOString(),
    });
  }, [useSemanticSearch, trackEvent]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with search and controls */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-2xl">
              <SearchAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                onSelect={(query, type) => {
                  // Handle different selection types
                  if (type === 'category') {
                    // Set category filter and clear search
                    const categoryMatch = mergedFilters.categories.find(c => 
                      c.name.toLowerCase() === query.toLowerCase()
                    );
                    if (categoryMatch) {
                      setSelectedCategory(categoryMatch.id);
                      setSearchQuery('');
                    }
                  } else if (type === 'provider') {
                    // Search for provider
                    setSearchQuery(query);
                    addRecentSearch(query);
                  } else {
                    // Default search
                    setSearchQuery(query);
                    addRecentSearch(query);
                  }
                  
                  // Track search
                  trackEvent('search_autocomplete_selected', {
                    query,
                    type: type || 'search',
                  });
                }}
                placeholder="Search AI services, providers, or technologies..."
                className="w-full"
                showTrending={true}
                recentSearches={recentSearches}
              />
            </div>
            
            <div className="flex items-center gap-3">
              {/* Mobile filter toggle */}
              <Button
                variant="outline"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              
              {/* Semantic search toggle */}
              <Button
                variant={useSemanticSearch ? 'default' : 'outline'}
                size="sm"
                onClick={toggleSemanticSearch}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Semantic</span>
              </Button>
              
              {/* View mode toggle */}
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setViewMode('grid');
                    updateViewMode('grid');
                  }}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setViewMode('list');
                    updateViewMode('list');
                  }}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Sort dropdown */}
              <select
                value={`${sort.field}-${sort.direction}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  const newSort = { field: field as any, direction: direction as any };
                  setSort(newSort);
                  updateSortPreferences(field, direction as 'asc' | 'desc');
                }}
                className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                <option value="relevance-desc">Most Relevant</option>
                <option value="rating-desc">Highest Rated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="popularity-desc">Most Popular</option>
              </select>
              
              {/* Filter Preferences */}
              <FilterPreferencesDialog
                currentFilters={{
                  search: searchQuery,
                  category: selectedCategory,
                  industries: Array.from(selectedIndustries),
                  providerType: selectedProviderTypes.size > 0 ? Array.from(selectedProviderTypes)[0] as any : undefined,
                  priceRange: {
                    min: priceRange[0] > 0 ? priceRange[0] : undefined,
                    max: priceRange[1] < 10000 ? priceRange[1] : undefined,
                  },
                  rating: minRating > 0 ? minRating : undefined,
                  technologies: Array.from(selectedTechnologies),
                }}
                onApplyDefaults={(defaultFilters) => {
                  // Apply default filters
                  if (defaultFilters.category) {
                    setSelectedCategory(defaultFilters.category);
                  }
                  if (defaultFilters.industries) {
                    setSelectedIndustries(new Set(defaultFilters.industries));
                  }
                  if (defaultFilters.providerType) {
                    setSelectedProviderTypes(new Set([defaultFilters.providerType]));
                  }
                  if (defaultFilters.priceRange) {
                    setPriceRange([
                      defaultFilters.priceRange.min || 0,
                      defaultFilters.priceRange.max || 10000
                    ]);
                  }
                  if (defaultFilters.rating) {
                    setMinRating(defaultFilters.rating);
                  }
                  if (defaultFilters.technologies) {
                    setSelectedTechnologies(new Set(defaultFilters.technologies));
                  }
                  if (defaultFilters.search) {
                    setSearchQuery(defaultFilters.search);
                  }
                }}
              />

              {/* Compare button */}
              {selectedServices.length > 0 && (
                <Button 
                  onClick={() => {
                    setShowComparison(true);
                    
                    // Track comparison dialog opened
                    trackEvent('service_comparison_opened', {
                      comparedServices: selectedServices.length,
                      serviceIds: selectedServices.map(s => s.id),
                      serviceNames: selectedServices.map(s => s.name),
                    });
                  }}
                  className="hidden lg:flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Compare ({selectedServices.length})
                </Button>
              )}
            </div>
          </div>
          
          {/* Results count and active filters */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">{totalResults}</span> services found
              {searchQuery && (
                <span className="ml-1">for "{searchQuery}"</span>
              )}
              {isLoading && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Updating...
                </span>
              )}
            </div>
            
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-blue-600 hover:text-blue-700"
              >
                Clear all filters
                <X className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Filter Combinations */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Desktop version */}
        <div className="hidden lg:block">
          <QuickFilterCombos
            combos={quickFilterCombos}
            onSelectCombo={applyQuickFilterCombo}
          />
        </div>
        {/* Mobile version */}
        <div className="lg:hidden">
          <QuickFilterCombosCompact
            combos={quickFilterCombos}
            onSelectCombo={applyQuickFilterCombo}
          />
        </div>
      </div>

      {/* Semantic Search Section */}
      {useSemanticSearch && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <SemanticSearch
            onResults={handleSemanticSearchResults}
            onIntentDetected={handleSemanticSearchIntent}
            filters={{
              category: selectedCategory,
              industries: Array.from(selectedIndustries),
              providerTypes: Array.from(selectedProviderTypes),
              priceRange: {
                min: priceRange[0],
                max: priceRange[1],
              },
              rating: minRating,
              compliance: Array.from(selectedCompliances),
              features: Array.from(selectedFeatures),
              technologies: Array.from(selectedTechnologies),
              locations: Array.from(selectedLocations),
            }}
            className="max-w-4xl mx-auto"
          />
        </div>
      )}

      {/* Semantic Search Results */}
      {showSemanticResults && semanticSearchResults.length > 0 && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SemanticSearchResults
            results={semanticSearchResults}
            searchQuery={searchQuery}
            searchIntent={semanticSearchIntent}
            onServiceSelect={handleSemanticServiceSelect}
            showExplanations={true}
            showRelevanceScores={true}
            className="mb-8"
          />
          <Separator className="my-6" />
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <aside className={cn(
            "w-80 flex-shrink-0 space-y-4",
            "lg:block",
            showMobileFilters ? "block fixed inset-0 z-50 bg-white dark:bg-gray-800 overflow-y-auto lg:relative" : "hidden"
          )}>
            {/* Mobile filter header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileFilters(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-4 pr-4">
                {/* Category Hierarchy Filter */}
                {isFiltersLoading ? (
                  <CategoryFilterSkeleton />
                ) : (
                  <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {mergedFilters.categories.map((category) => (
                      <div key={category.id} className="space-y-2">
                        <div 
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
                            selectedCategory === category.id && "bg-blue-50 dark:bg-blue-900/20"
                          )}
                          onClick={() => {
                            const newCategory = selectedCategory === category.id ? null : category.id;
                            setSelectedCategory(newCategory);
                            toggleCategory(category.id);
                            
                            // Track category filter change
                            trackFilterChange('category', newCategory, newCategory ? 'added' : 'removed');
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {category.count}
                            </Badge>
                            {category.subcategories && (
                              <ChevronRight className={cn(
                                "h-4 w-4 transition-transform",
                                expandedCategories.has(category.id) && "rotate-90"
                              )} />
                            )}
                          </div>
                        </div>
                        
                        {expandedCategories.has(category.id) && (
                          <div className="ml-4 space-y-1">
                            {category.subcategories.map((subcategory) => (
                              <div key={subcategory.id} className="space-y-1">
                                <div 
                                  className={cn(
                                    "flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50",
                                    selectedSubcategory === subcategory.id && "bg-blue-50/50 dark:bg-blue-900/10"
                                  )}
                                  onClick={() => {
                                    setSelectedSubcategory(selectedSubcategory === subcategory.id ? null : subcategory.id);
                                    toggleSubcategory(subcategory.id);
                                  }}
                                >
                                  <span className="text-sm">{subcategory.name}</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500">{subcategory.count}</span>
                                    {subcategory.domains && (
                                      <ChevronRight className={cn(
                                        "h-3 w-3 transition-transform",
                                        expandedSubcategories.has(subcategory.id) && "rotate-90"
                                      )} />
                                    )}
                                  </div>
                                </div>
                                
                                {expandedSubcategories.has(subcategory.id) && subcategory.domains && (
                                  <div className="ml-4 space-y-1">
                                    {subcategory.domains.map((domain) => (
                                      <label 
                                        key={domain.id}
                                        className="flex items-center gap-2 p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded"
                                      >
                                        <Checkbox
                                          checked={selectedDomains.has(domain.id)}
                                          onCheckedChange={(checked) => {
                                            const newDomains = new Set(selectedDomains);
                                            if (checked) {
                                              newDomains.add(domain.id);
                                            } else {
                                              newDomains.delete(domain.id);
                                            }
                                            setSelectedDomains(newDomains);
                                          }}
                                        />
                                        <span className="text-xs flex-1">{domain.name}</span>
                                        <span className="text-xs text-gray-400">{domain.count}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
                )}

                {/* Price Range Filter */}
                {isFiltersLoading ? (
                  <PriceFilterSkeleton />
                ) : (
                  <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Price Range
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}+</span>
                      </div>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        min={0}
                        max={10000}
                        step={100}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      {mergedFilters.priceRanges.map((range) => (
                        <label 
                          key={range.id}
                          className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <span className="text-sm">{range.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {range.count}
                          </Badge>
                        </label>
                      ))}
                    </div>
                    
                    {/* Price Histogram */}
                    {priceHistogram && priceHistogram.total > 0 && (
                      <div className="space-y-3">
                        <Separator />
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Price Distribution
                          </Label>
                          <div className="space-y-1">
                            {priceHistogram.buckets.map((bucket, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="text-xs text-gray-500 w-20">
                                  ${bucket.min}-{bucket.max === Infinity ? '+' : `$${bucket.max}`}
                                </div>
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                    style={{ width: `${bucket.percentage}%` }}
                                  />
                                </div>
                                <div className="text-xs text-gray-500 w-8">
                                  {bucket.count}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Billing Cycle</Label>
                      {billingCycles.map((cycle) => (
                        <label 
                          key={cycle.id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedBillingCycles.has(cycle.id)}
                            onCheckedChange={(checked) => {
                              const newCycles = new Set(selectedBillingCycles);
                              if (checked) {
                                newCycles.add(cycle.id);
                              } else {
                                newCycles.delete(cycle.id);
                              }
                              setSelectedBillingCycles(newCycles);
                            }}
                          />
                          <span className="text-sm flex-1">{cycle.label}</span>
                          <span className="text-xs text-gray-500">{cycle.count}</span>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                )}

                {/* Provider Type Filter */}
                {isFiltersLoading ? (
                  <ProviderTypeFilterSkeleton />
                ) : (
                  <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Provider Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {mergedFilters.providerTypes.map((type) => (
                      <label 
                        key={type.id}
                        className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Checkbox
                          checked={selectedProviderTypes.has(type.id)}
                          onCheckedChange={(checked) => {
                            const newTypes = new Set(selectedProviderTypes);
                            if (checked) {
                              newTypes.add(type.id);
                            } else {
                              newTypes.delete(type.id);
                            }
                            setSelectedProviderTypes(newTypes);
                            
                            // Track provider type filter change
                            trackFilterChange('providerType', type.id, checked ? 'added' : 'removed');
                          }}
                        />
                        <span className="text-lg">{type.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {type.count}
                        </Badge>
                      </label>
                    ))}
                  </CardContent>
                </Card>
                )}

                {/* Rating Filter */}
                {isFiltersLoading ? (
                  <RatingFilterSkeleton />
                ) : (
                  <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Minimum Rating
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup 
                      value={minRating.toString()} 
                      onValueChange={(val) => {
                        const newRating = parseFloat(val);
                        setMinRating(newRating);
                        
                        // Track rating filter change
                        trackFilterChange('rating', newRating, 'changed');
                      }}
                    >
                      <label className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="0" />
                          <span className="text-sm">All Ratings</span>
                        </div>
                      </label>
                      {mergedFilters.ratingFilters.map((rating) => (
                        <label 
                          key={rating.value}
                          className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value={rating.value.toString()} />
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "h-3 w-3",
                                    i < Math.floor(rating.value)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  )}
                                />
                              ))}
                              <span className="text-sm ml-1">{rating.label}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {rating.count}
                          </Badge>
                        </label>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
                )}

                {/* Industries Filter */}
                {isFiltersLoading ? (
                  <IndustryFilterSkeleton />
                ) : (
                  <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Industries
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {mergedFilters.industryFilters.map((industry) => (
                      <label 
                        key={industry.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedIndustries.has(industry.id)}
                          onCheckedChange={(checked) => {
                            const newIndustries = new Set(selectedIndustries);
                            if (checked) {
                              newIndustries.add(industry.id);
                            } else {
                              newIndustries.delete(industry.id);
                            }
                            setSelectedIndustries(newIndustries);
                            
                            // Track industry filter change
                            trackFilterChange('industry', industry.id, checked ? 'added' : 'removed');
                          }}
                        />
                        <span className="text-lg">{industry.icon}</span>
                        <span className="text-sm flex-1">{industry.label}</span>
                        <span className="text-xs text-gray-500">{industry.count}</span>
                      </label>
                    ))}
                  </CardContent>
                </Card>
                )}

                {/* Location/Region Filter */}
                {isFiltersLoading ? (
                  <FilterSectionSkeleton title="Location" itemCount={7} showIcon={true} showCounts={true} showCheckboxes={true} />
                ) : (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location & Region
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {locationFilters.map((location) => (
                        <label 
                          key={location.id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedLocations.has(location.id)}
                            onCheckedChange={(checked) => {
                              const newLocations = new Set(selectedLocations);
                              if (checked) {
                                newLocations.add(location.id);
                              } else {
                                newLocations.delete(location.id);
                              }
                              setSelectedLocations(newLocations);
                              
                              // Track location filter change
                              trackFilterChange('location', location.id, checked ? 'added' : 'removed');
                            }}
                          />
                          <span className="text-lg">{location.icon}</span>
                          <span className="text-sm flex-1">{location.label}</span>
                          <span className="text-xs text-gray-500">{location.count}</span>
                        </label>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Compliance Filter */}
                {isFiltersLoading ? (
                  <ComplianceFilterSkeleton />
                ) : (
                  <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Compliance & Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {complianceFilters.map((compliance) => (
                      <label 
                        key={compliance.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedCompliances.has(compliance.id)}
                          onCheckedChange={(checked) => {
                            const newCompliances = new Set(selectedCompliances);
                            if (checked) {
                              newCompliances.add(compliance.id);
                            } else {
                              newCompliances.delete(compliance.id);
                            }
                            setSelectedCompliances(newCompliances);
                          }}
                        />
                        <span className="text-sm flex-1">{compliance.label}</span>
                        <span className="text-xs text-gray-500">{compliance.count}</span>
                      </label>
                    ))}
                  </CardContent>
                </Card>
                )}

                {/* Service Features Filter */}
                {isFiltersLoading ? (
                  <ServiceFeaturesFilterSkeleton />
                ) : (
                  <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Service Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {serviceFeatures.map((feature) => (
                      <label 
                        key={feature.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedFeatures.has(feature.id)}
                          onCheckedChange={(checked) => {
                            const newFeatures = new Set(selectedFeatures);
                            if (checked) {
                              newFeatures.add(feature.id);
                            } else {
                              newFeatures.delete(feature.id);
                            }
                            setSelectedFeatures(newFeatures);
                          }}
                        />
                        <span className="text-sm flex-1">{feature.label}</span>
                        <span className="text-xs text-gray-500">{feature.count}</span>
                      </label>
                    ))}
                  </CardContent>
                </Card>
                )}
              </div>
            </ScrollArea>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {/* Services Grid/List */}
            {error ? (
              <Card className="p-12 text-center">
                <div className="text-red-500 mb-4">
                  <X className="h-12 w-12 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">Error loading services</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
                <Button onClick={loadServices} className="mr-2">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              </Card>
            ) : isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">Loading services...</p>
              </div>
            ) : paginatedServices.length === 0 ? (
              <Card className="p-12 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No services found</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Try adjusting your filters or search terms.
                </p>
                <Button onClick={clearAllFilters}>Clear all filters</Button>
              </Card>
            ) : (
              <>
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newPage = Math.max(1, currentPage - 1);
                        setCurrentPage(newPage);
                        
                        // Track pagination
                        trackEvent('pagination_changed', {
                          direction: 'previous',
                          fromPage: currentPage,
                          toPage: newPage,
                          totalPages,
                          totalResults,
                        });
                      }}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum = Math.max(1, currentPage - 2) + i;
                        if (pageNum > totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setCurrentPage(pageNum);
                              
                              // Track page number selection
                              trackEvent('pagination_changed', {
                                direction: 'direct',
                                fromPage: currentPage,
                                toPage: pageNum,
                                totalPages,
                                totalResults,
                              });
                            }}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newPage = Math.min(totalPages, currentPage + 1);
                        setCurrentPage(newPage);
                        
                        // Track pagination
                        trackEvent('pagination_changed', {
                          direction: 'next',
                          fromPage: currentPage,
                          toPage: newPage,
                          totalPages,
                          totalResults,
                        });
                      }}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Service Comparison Modal */}
      {showComparison && (
        <ServiceComparison
          services={selectedServices}
          onClose={() => {
            setShowComparison(false);
            
            // Track comparison dialog closed
            trackEvent('service_comparison_closed', {
              comparedServices: selectedServices.length,
              serviceIds: selectedServices.map(s => s.id),
              duration: 'unknown', // Could track time if needed
            });
          }}
          onServiceRemove={(service) => handleServiceCompare(service)}
        />
      )}
    </div>
  );
}