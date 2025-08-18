'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Clock, TrendingUp, Building2, User, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSearchSuggestions } from '@/lib/api/services';

interface SearchSuggestion {
  services: { id: string; name: string; category: string }[];
  providers: { id: string; name: string; type: string }[];
  categories: { id: string; name: string; count: number }[];
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (query: string, type?: 'service' | 'provider' | 'category') => void;
  placeholder?: string;
  className?: string;
  showTrending?: boolean;
  recentSearches?: string[];
}

export function SearchAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search AI services, providers, or technologies...",
  className,
  showTrending = true,
  recentSearches = [],
}: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion>({
    services: [],
    providers: [],
    categories: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Trending searches (can be moved to API later)
  const trendingSearches = [
    'Machine Learning',
    'Natural Language Processing',
    'Computer Vision',
    'Data Analytics',
    'AI Automation',
    'Chatbots',
  ];

  // Debounced search function
  const debouncedSearch = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSuggestions({ services: [], providers: [], categories: [] });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const results = await getSearchSuggestions(query, 5);
        setSuggestions(results);
      } catch (err) {
        console.error('Search suggestions error:', err);
        setError('Failed to load suggestions');
        setSuggestions({ services: [], providers: [], categories: [] });
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (showSuggestions) {
        debouncedSearch(value);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, showSuggestions, debouncedSearch]);

  // Calculate total suggestions for keyboard navigation
  const totalSuggestions = 
    recentSearches.length + 
    suggestions.services.length + 
    suggestions.providers.length + 
    suggestions.categories.length +
    (showTrending ? trendingSearches.length : 0);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < totalSuggestions - 1 ? prev + 1 : -1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > -1 ? prev - 1 : totalSuggestions - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionSelect(selectedIndex);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion selection by index
  const handleSuggestionSelect = (index: number) => {
    let currentIndex = 0;
    let selectedValue = value;
    let type: 'service' | 'provider' | 'category' | undefined;

    // Recent searches
    if (index < recentSearches.length) {
      selectedValue = recentSearches[index];
    } else {
      currentIndex += recentSearches.length;
      
      // Services
      if (index < currentIndex + suggestions.services.length) {
        const serviceIndex = index - currentIndex;
        selectedValue = suggestions.services[serviceIndex].name;
        type = 'service';
      } else {
        currentIndex += suggestions.services.length;
        
        // Providers
        if (index < currentIndex + suggestions.providers.length) {
          const providerIndex = index - currentIndex;
          selectedValue = suggestions.providers[providerIndex].name;
          type = 'provider';
        } else {
          currentIndex += suggestions.providers.length;
          
          // Categories
          if (index < currentIndex + suggestions.categories.length) {
            const categoryIndex = index - currentIndex;
            selectedValue = suggestions.categories[categoryIndex].name;
            type = 'category';
          } else {
            currentIndex += suggestions.categories.length;
            
            // Trending searches
            if (showTrending && index < currentIndex + trendingSearches.length) {
              const trendingIndex = index - currentIndex;
              selectedValue = trendingSearches[trendingIndex];
            }
          }
        }
      }
    }

    onChange(selectedValue);
    onSelect?.(selectedValue, type);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleSearch = () => {
    onSelect?.(value);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleFocus = () => {
    setShowSuggestions(true);
    if (value.length >= 2) {
      debouncedSearch(value);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't hide suggestions if clicking on a suggestion
    if (containerRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const clearSearch = () => {
    onChange('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10 h-12 text-base"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {isLoading && (
            <div className="p-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Loading suggestions...
            </div>
          )}

          {error && (
            <div className="p-3 text-center text-red-500 text-sm">
              {error}
            </div>
          )}

          {!isLoading && !error && (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Recent Searches
                  </div>
                  {recentSearches.map((search, index) => (
                    <div
                      key={search}
                      ref={el => suggestionRefs.current[index] = el}
                      onClick={() => handleSuggestionSelect(index)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm",
                        selectedIndex === index
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      )}
                    >
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="flex-1">{search}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Services */}
              {suggestions.services.length > 0 && (
                <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Services
                  </div>
                  {suggestions.services.map((service, index) => {
                    const globalIndex = recentSearches.length + index;
                    return (
                      <div
                        key={service.id}
                        ref={el => suggestionRefs.current[globalIndex] = el}
                        onClick={() => handleSuggestionSelect(globalIndex)}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm",
                          selectedIndex === globalIndex
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        )}
                      >
                        <Sparkles className="h-3 w-3 text-blue-500" />
                        <div className="flex-1">
                          <div className="font-medium">{service.name}</div>
                          <div className="text-xs text-gray-500">{service.category}</div>
                        </div>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Providers */}
              {suggestions.providers.length > 0 && (
                <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Providers
                  </div>
                  {suggestions.providers.map((provider, index) => {
                    const globalIndex = recentSearches.length + suggestions.services.length + index;
                    return (
                      <div
                        key={provider.id}
                        ref={el => suggestionRefs.current[globalIndex] = el}
                        onClick={() => handleSuggestionSelect(globalIndex)}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm",
                          selectedIndex === globalIndex
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        )}
                      >
                        <User className="h-3 w-3 text-green-500" />
                        <div className="flex-1">
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-xs text-gray-500">{provider.type}</div>
                        </div>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Categories */}
              {suggestions.categories.length > 0 && (
                <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-500 mb-2">Categories</div>
                  {suggestions.categories.map((category, index) => {
                    const globalIndex = recentSearches.length + suggestions.services.length + suggestions.providers.length + index;
                    return (
                      <div
                        key={category.id}
                        ref={el => suggestionRefs.current[globalIndex] = el}
                        onClick={() => handleSuggestionSelect(globalIndex)}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm",
                          selectedIndex === globalIndex
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        )}
                      >
                        <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium">{category.name}</div>
                          <div className="text-xs text-gray-500">{category.count} services</div>
                        </div>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Trending Searches */}
              {showTrending && value.length < 2 && (
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Trending Searches
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {trendingSearches.map((trend, index) => {
                      const globalIndex = recentSearches.length + suggestions.services.length + suggestions.providers.length + suggestions.categories.length + index;
                      return (
                        <Badge
                          key={trend}
                          variant="secondary"
                          className={cn(
                            "cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/20",
                            selectedIndex === globalIndex && "bg-blue-100 dark:bg-blue-900/20"
                          )}
                          onClick={() => handleSuggestionSelect(globalIndex)}
                        >
                          {trend}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No Results */}
              {value.length >= 2 && !isLoading && !error && 
               suggestions.services.length === 0 && 
               suggestions.providers.length === 0 && 
               suggestions.categories.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No suggestions found for "{value}"</p>
                  <p className="text-xs text-gray-400 mt-1">Try different keywords or browse categories</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}