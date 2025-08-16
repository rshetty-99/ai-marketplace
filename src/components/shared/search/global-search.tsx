'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, Filter, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAnalytics } from '@/components/providers/analytics-provider';
import { cn } from '@/lib/utils';
import { mockServices, serviceCategories } from '@/lib/data/mock-services';

interface SearchSuggestion {
  id: string;
  type: 'service' | 'provider' | 'category';
  title: string;
  subtitle?: string;
  category?: string;
}

interface SearchProps {
  className?: string;
  placeholder?: string;
  showFilters?: boolean;
  variant?: 'default' | 'minimal';
}

export function Search({ 
  className, 
  placeholder = "Search AI services, providers, or solutions...",
  showFilters = false,
  variant = 'default'
}: SearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate suggestions from actual data
  const generateSuggestions = useCallback((searchQuery: string): SearchSuggestion[] => {
    if (searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();
    const suggestions: SearchSuggestion[] = [];

    // Add service suggestions
    mockServices.forEach(service => {
      if (
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.tags.some(tag => tag.toLowerCase().includes(query))
      ) {
        suggestions.push({
          id: service.id,
          type: 'service',
          title: service.name,
          subtitle: service.tagline || service.description.substring(0, 60) + '...',
          category: serviceCategories.find(cat => cat.id === service.category)?.name
        });
      }
    });

    // Add provider suggestions
    const uniqueProviders = new Set<string>();
    mockServices.forEach(service => {
      if (
        service.providerName.toLowerCase().includes(query) &&
        !uniqueProviders.has(service.providerId)
      ) {
        uniqueProviders.add(service.providerId);
        suggestions.push({
          id: service.providerId,
          type: 'provider',
          title: service.providerName,
          subtitle: service.provider?.verification.verified ? 'Verified AI service provider' : 'AI service provider',
        });
      }
    });

    // Add category suggestions
    serviceCategories.forEach(category => {
      if (
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query)
      ) {
        const serviceCount = mockServices.filter(s => s.category === category.id).length;
        suggestions.push({
          id: category.id,
          type: 'category',
          title: category.name,
          subtitle: `${serviceCount} available services`,
        });
      }
    });

    // Limit results and prioritize exact matches
    return suggestions
      .sort((a, b) => {
        const aExact = a.title.toLowerCase().includes(query);
        const bExact = b.title.toLowerCase().includes(query);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      })
      .slice(0, 8);
  }, []);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate API delay for realistic UX
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const generatedSuggestions = generateSuggestions(searchQuery);
    setSuggestions(generatedSuggestions);
    setIsLoading(false);
  }, [generateSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length >= 2) {
      setIsOpen(true);
      fetchSuggestions(value);
    } else {
      setIsOpen(false);
      setSuggestions([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query);
    }
  };

  const performSearch = (searchQuery: string) => {
    setIsOpen(false);
    
    // Track search event
    trackEvent('search_initiated', {
      search_query: searchQuery,
      search_location: 'global_search',
      suggestion_count: suggestions.length,
    });

    // Navigate to catalog with search query
    router.push(`/catalog?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    setIsOpen(false);
    
    trackEvent('search_suggestion_clicked', {
      suggestion_type: suggestion.type,
      suggestion_id: suggestion.id,
      suggestion_title: suggestion.title,
      search_query: query,
    });

    // Navigate based on suggestion type
    switch (suggestion.type) {
      case 'service':
        // For now, redirect to catalog with service filter until service detail pages are created
        router.push(`/catalog?search=${encodeURIComponent(suggestion.title)}`);
        break;
      case 'provider':
        // For now, redirect to catalog with provider filter until provider pages are created
        router.push(`/catalog?search=${encodeURIComponent(suggestion.title)}`);
        break;
      case 'category':
        router.push(`/catalog?category=${suggestion.id}`);
        break;
      default:
        performSearch(suggestion.title);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const isMinimal = variant === 'minimal';

  return (
    <div ref={searchRef} className={cn('relative w-full max-w-2xl', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className={cn(
          'relative flex items-center',
          isMinimal 
            ? 'bg-white border border-gray-200 rounded-lg shadow-sm'
            : 'bg-white border-2 border-gray-200 rounded-xl shadow-lg'
        )}>
          <SearchIcon 
            className={cn(
              'text-gray-400 ml-4',
              isMinimal ? 'h-4 w-4' : 'h-5 w-5'
            )} 
          />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              'border-0 bg-transparent px-4 focus-visible:ring-0 focus-visible:ring-offset-0',
              isMinimal ? 'h-10 text-sm' : 'h-14 text-base'
            )}
          />
          
          {query && (
            <Button
              type="button"
              variant="ghost"
              size={isMinimal ? "sm" : "default"}
              onClick={clearSearch}
              className="mr-2 h-auto p-1 hover:bg-gray-100"
            >
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          )}
          
          <Button 
            type="submit"
            size={isMinimal ? "sm" : "default"}
            className={cn(
              'mr-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 text-white border-0',
              isMinimal ? 'h-8 px-3' : 'h-10 px-6'
            )}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Search
          </Button>
          
          {showFilters && (
            <Button 
              type="button"
              variant="outline"
              size={isMinimal ? "sm" : "default"}
              className={cn(
                'mr-2',
                isMinimal ? 'h-8 px-3' : 'h-10 px-4'
              )}
            >
              <Filter className="h-4 w-4" />
              {!isMinimal && <span className="ml-2">Filters</span>}
            </Button>
          )}
        </div>
      </form>

      {/* Search Suggestions */}
      {isOpen && (query.length >= 2 || suggestions.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                    suggestion.type === 'service' && 'bg-blue-100 text-blue-700',
                    suggestion.type === 'provider' && 'bg-green-100 text-green-700',
                    suggestion.type === 'category' && 'bg-purple-100 text-purple-700'
                  )}>
                    {suggestion.type === 'service' && '🔧'}
                    {suggestion.type === 'provider' && '🏢'}
                    {suggestion.type === 'category' && '📂'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {suggestion.title}
                    </div>
                    {suggestion.subtitle && (
                      <div className="text-sm text-gray-500 truncate">
                        {suggestion.subtitle}
                      </div>
                    )}
                  </div>
                  {suggestion.category && (
                    <div className="text-xs text-gray-400 hidden sm:block">
                      {suggestion.category}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="mb-2">No suggestions found</div>
              <div className="text-sm">
                Press Enter to search for &quot;{query}&quot;
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}