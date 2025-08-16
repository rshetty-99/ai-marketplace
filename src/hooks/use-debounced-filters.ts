/**
 * Debounced Filter Hook
 * Optimizes filter application performance by debouncing rapid changes
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface UseDebounce…FiltersOptions {
  delay?: number;
  onFilterChange?: (filters: Record<string, any>) => void;
  trackAnalytics?: boolean;
}

export function useDebouncedFilters(
  initialFilters: Record<string, any> = {},
  options: UseDebouncedFiltersOptions = {}
) {
  const { delay = 500, onFilterChange, trackAnalytics = true } = options;
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(initialFilters);
  const [pendingFilters, setPendingFilters] = useState(initialFilters);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const analyticsTimerRef = useRef<NodeJS.Timeout>();

  // Track filter changes for analytics
  const trackFilterChange = useCallback((filterType: string, value: any) => {
    if (!trackAnalytics) return;
    
    // Batch analytics events
    if (analyticsTimerRef.current) {
      clearTimeout(analyticsTimerRef.current);
    }
    
    analyticsTimerRef.current = setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'filter_applied', {
          event_category: 'catalog',
          event_label: filterType,
          value: JSON.stringify(value),
        });
      }
    }, 1000);
  }, [trackAnalytics]);

  // Apply filters with debouncing
  const applyFilters = useCallback((newFilters: Record<string, any>) => {
    setIsDebouncing(true);
    setPendingFilters(newFilters);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setFilters(newFilters);
      setIsDebouncing(false);
      
      // Update URL params
      const params = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.set(key, value.toString());
          }
        }
      });
      
      router.push(`?${params.toString()}`, { scroll: false });
      
      // Callback
      if (onFilterChange) {
        onFilterChange(newFilters);
      }
    }, delay);
  }, [delay, router, onFilterChange]);

  // Update single filter
  const updateFilter = useCallback((key: string, value: any) => {
    const newFilters = { ...pendingFilters };
    
    if (value === undefined || value === null || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    
    trackFilterChange(key, value);
    applyFilters(newFilters);
  }, [pendingFilters, applyFilters, trackFilterChange]);

  // Update multiple filters at once
  const updateFilters = useCallback((updates: Record<string, any>) => {
    const newFilters = { ...pendingFilters, ...updates };
    
    // Remove empty values
    Object.keys(newFilters).forEach(key => {
      const value = newFilters[key];
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        delete newFilters[key];
      }
    });
    
    Object.entries(updates).forEach(([key, value]) => {
      trackFilterChange(key, value);
    });
    
    applyFilters(newFilters);
  }, [pendingFilters, applyFilters, trackFilterChange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setPendingFilters({});
    setFilters({});
    router.push('?', { scroll: false });
    
    if (trackAnalytics && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'filters_cleared', {
        event_category: 'catalog',
      });
    }
    
    if (onFilterChange) {
      onFilterChange({});
    }
  }, [router, trackAnalytics, onFilterChange]);

  // Clear single filter
  const clearFilter = useCallback((key: string) => {
    const newFilters = { ...pendingFilters };
    delete newFilters[key];
    applyFilters(newFilters);
  }, [pendingFilters, applyFilters]);

  // Initialize from URL params
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    if (Object.keys(params).length > 0) {
      setFilters(params);
      setPendingFilters(params);
    }
  }, [searchParams]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (analyticsTimerRef.current) {
        clearTimeout(analyticsTimerRef.current);
      }
    };
  }, []);

  return {
    filters,           // Applied filters (after debounce)
    pendingFilters,    // Pending filters (before debounce)
    isDebouncing,      // Whether filters are being debounced
    updateFilter,      // Update single filter
    updateFilters,     // Update multiple filters
    clearFilter,       // Clear single filter
    clearFilters,      // Clear all filters
  };
}

/**
 * Hook for optimized price range filtering
 */
export function useDebouncedPriceRange(
  initialMin?: number,
  initialMax?: number,
  options: { delay?: number; onChange?: (min: number, max: number) => void } = {}
) {
  const { delay = 800, onChange } = options;
  
  const [priceRange, setPriceRange] = useState<[number?, number?]>([initialMin, initialMax]);
  const [pendingRange, setPendingRange] = useState<[number?, number?]>([initialMin, initialMax]);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const updatePriceRange = useCallback((min?: number, max?: number) => {
    setPendingRange([min, max]);
    setIsDebouncing(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setPriceRange([min, max]);
      setIsDebouncing(false);
      
      if (onChange) {
        onChange(min || 0, max || Infinity);
      }
    }, delay);
  }, [delay, onChange]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    priceRange,
    pendingRange,
    isDebouncing,
    updatePriceRange,
  };
}

/**
 * Hook for optimized search input
 */
export function useDebouncedSearch(
  initialQuery: string = '',
  options: { delay?: number; minLength?: number; onSearch?: (query: string) => void } = {}
) {
  const { delay = 300, minLength = 2, onSearch } = options;
  
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setIsSearching(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (newQuery.length === 0 || newQuery.length >= minLength) {
      timerRef.current = setTimeout(() => {
        setDebouncedQuery(newQuery);
        setIsSearching(false);
        
        if (onSearch) {
          onSearch(newQuery);
        }
      }, delay);
    } else {
      setIsSearching(false);
    }
  }, [delay, minLength, onSearch]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    query,
    debouncedQuery,
    isSearching,
    updateQuery,
  };
}