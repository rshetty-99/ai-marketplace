'use client';

import { useState } from 'react';
import { Search } from '@/components/shared/search/global-search';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, Grid, List, SlidersHorizontal, X } from 'lucide-react';
// import { useAnalytics } from '@/components/providers/analytics-provider';

interface CatalogHeaderProps {
  searchParams: {
    search?: string;
    category?: string;
    industry?: string;
    pricing?: string;
    sort?: string;
    page?: string;
  };
}

export function CatalogHeader({ searchParams }: CatalogHeaderProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  // const { trackEvent } = useAnalytics();

  const activeFilters = Object.entries(searchParams).filter(
    ([key, value]) => value && key !== 'sort' && key !== 'page'
  );

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    // trackEvent('catalog_view_changed', {
    //   view_mode: mode,
    //   active_filters: activeFilters.length,
    // });
  };

  const clearFilter = (filterKey: string) => {
    // trackEvent('filter_removed', {
    //   filter_key: filterKey,
    //   filter_value: searchParams[filterKey as keyof typeof searchParams],
    // });

    // TODO: Implement URL update logic
    console.log('Clear filter:', filterKey);
  };

  const clearAllFilters = () => {
    // trackEvent('all_filters_cleared', {
    //   cleared_filters: activeFilters.length,
    // });

    // TODO: Implement URL update logic
    console.log('Clear all filters');
  };

  return (
    <div className="space-y-6">
      {/* Page Title and Search */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              AI Services Catalog
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              Discover enterprise-grade AI solutions from verified providers
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="w-full lg:w-96">
            <Search 
              variant="minimal" 
              placeholder="Search AI services..."
              showFilters={false}
            />
          </div>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-gray-600">
          {searchParams.search && (
            <span>
              Search results for &quot;{searchParams.search}&quot; •{' '}
            </span>
          )}
          <span>Showing 1,247 AI services</span>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Active filters:</span>
          {activeFilters.map(([key, value]) => (
            <Badge key={key} variant="secondary" className="flex items-center gap-1">
              <span className="capitalize">{key}:</span>
              <span>{value}</span>
              <button
                onClick={() => clearFilter(key)}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                aria-label={`Remove ${key} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-blue-600 hover:text-blue-700"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        {/* Mobile Filter Toggle */}
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden flex items-center gap-2"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilters.length > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              {activeFilters.length}
            </Badge>
          )}
        </Button>

        {/* Sort Options */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            Sort by:
          </span>
          <select 
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            defaultValue={searchParams.sort || 'relevance'}
            onChange={(e) => {
              // trackEvent('catalog_sort_changed', {
              //   sort_option: e.target.value,
              //   previous_sort: searchParams.sort || 'relevance',
              // });
            }}
          >
            <option value="relevance">Most Relevant</option>
            <option value="rating">Highest Rated</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => handleViewModeChange('grid')}
            aria-label="Grid view"
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => handleViewModeChange('list')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile Filters Overlay */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowMobileFilters(false)}>
          <div className="bg-white h-full w-80 max-w-[90%] p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* TODO: Add ServiceFilters component here */}
            <div className="text-gray-600">Mobile filters will be displayed here</div>
          </div>
        </div>
      )}
    </div>
  );
}