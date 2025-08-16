// Helper utilities for filter data management

import type { FilterCounts } from '@/lib/api/services';
import { categoryHierarchy, priceRanges, providerTypes, ratingFilters, industryFilters } from '@/lib/data/filter-options';

// Merge real filter counts with static filter options
export const mergeFilterCounts = (filterCounts: FilterCounts | null) => {
  if (!filterCounts) {
    return {
      categories: categoryHierarchy,
      priceRanges,
      providerTypes,
      ratingFilters,
      industryFilters,
    };
  }

  // Merge categories with hierarchy structure
  const mergedCategories = categoryHierarchy.map(category => {
    const realCount = filterCounts.categories.find(c => c.value === category.id);
    return {
      ...category,
      count: realCount?.count || 0,
    };
  });

  // Merge price ranges
  const mergedPriceRanges = priceRanges.map(range => {
    const realCount = filterCounts.priceRanges.find(p => p.value === range.id);
    return {
      ...range,
      count: realCount?.count || 0,
    };
  });

  // Merge provider types
  const mergedProviderTypes = providerTypes.map(type => {
    const realCount = filterCounts.providerTypes.find(p => p.value === type.id);
    return {
      ...type,
      count: realCount?.count || 0,
    };
  });

  // Merge rating filters
  const mergedRatingFilters = ratingFilters.map(rating => {
    const realCount = filterCounts.ratings.find(r => r.value === rating.value);
    return {
      ...rating,
      count: realCount?.count || 0,
    };
  });

  // Merge industry filters
  const mergedIndustryFilters = industryFilters.map(industry => {
    const realCount = filterCounts.industries.find(i => i.value === industry.id);
    return {
      ...industry,
      count: realCount?.count || 0,
    };
  });

  return {
    categories: mergedCategories,
    priceRanges: mergedPriceRanges,
    providerTypes: mergedProviderTypes,
    ratingFilters: mergedRatingFilters,
    industryFilters: mergedIndustryFilters,
    rawFilterCounts: filterCounts,
  };
};

// Format category display name
export const formatCategoryName = (categoryId: string): string => {
  return categoryId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Get category icon by ID
export const getCategoryIcon = (categoryId: string): string => {
  const category = categoryHierarchy.find(c => c.id === categoryId);
  return category?.icon || '📁';
};