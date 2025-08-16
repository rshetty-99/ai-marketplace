// Hook for managing filter preferences in localStorage

import { useState, useEffect } from 'react';
import type { ServiceFilters } from '@/types/service';

const FILTER_PREFERENCES_KEY = 'ai-marketplace-filter-preferences';

interface FilterPreferences {
  // User's preferred default filters
  defaultFilters: Partial<ServiceFilters>;
  // User's view preferences
  viewMode: 'grid' | 'list';
  // User's sort preferences
  sortField: string;
  sortDirection: 'asc' | 'desc';
  // Items per page preference
  itemsPerPage: number;
  // Remember expanded filter sections
  expandedSections: string[];
}

const defaultPreferences: FilterPreferences = {
  defaultFilters: {},
  viewMode: 'grid',
  sortField: 'relevance',
  sortDirection: 'desc',
  itemsPerPage: 24,
  expandedSections: ['categories', 'priceRange', 'providerType'],
};

export function useFilterPreferences() {
  const [preferences, setPreferences] = useState<FilterPreferences>(defaultPreferences);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FILTER_PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.warn('Failed to load filter preferences:', error);
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = (newPreferences: Partial<FilterPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPreferences };
      
      try {
        localStorage.setItem(FILTER_PREFERENCES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save filter preferences:', error);
      }
      
      return updated;
    });
  };

  // Update default filters (saves commonly used filters)
  const updateDefaultFilters = (filters: Partial<ServiceFilters>) => {
    savePreferences({ defaultFilters: filters });
  };

  // Update view preferences
  const updateViewMode = (viewMode: 'grid' | 'list') => {
    savePreferences({ viewMode });
  };

  // Update sort preferences
  const updateSortPreferences = (field: string, direction: 'asc' | 'desc') => {
    savePreferences({ sortField: field, sortDirection: direction });
  };

  // Update items per page
  const updateItemsPerPage = (itemsPerPage: number) => {
    savePreferences({ itemsPerPage });
  };

  // Update expanded sections
  const updateExpandedSections = (sections: string[]) => {
    savePreferences({ expandedSections: sections });
  };

  // Toggle expanded section
  const toggleExpandedSection = (sectionId: string) => {
    const newSections = preferences.expandedSections.includes(sectionId)
      ? preferences.expandedSections.filter(s => s !== sectionId)
      : [...preferences.expandedSections, sectionId];
    
    updateExpandedSections(newSections);
  };

  // Reset all preferences
  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    try {
      localStorage.removeItem(FILTER_PREFERENCES_KEY);
    } catch (error) {
      console.warn('Failed to clear filter preferences:', error);
    }
  };

  // Apply saved filters to current filter state
  const applyDefaultFilters = (): Partial<ServiceFilters> => {
    return preferences.defaultFilters;
  };

  // Check if a filter section should be expanded by default
  const isSectionExpanded = (sectionId: string): boolean => {
    return preferences.expandedSections.includes(sectionId);
  };

  return {
    preferences,
    updateDefaultFilters,
    updateViewMode,
    updateSortPreferences,
    updateItemsPerPage,
    updateExpandedSections,
    toggleExpandedSection,
    resetPreferences,
    applyDefaultFilters,
    isSectionExpanded,
  };
}