// Hook for managing recent searches in localStorage

import { useState, useEffect } from 'react';

const RECENT_SEARCHES_KEY = 'ai-marketplace-recent-searches';
const MAX_RECENT_SEARCHES = 5;

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed);
        }
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
    }
  }, []);

  // Add a new search to recent searches
  const addRecentSearch = (query: string) => {
    if (!query.trim() || query.length < 2) return;

    setRecentSearches(prev => {
      const trimmedQuery = query.trim();
      const filtered = prev.filter(search => 
        search.toLowerCase() !== trimmedQuery.toLowerCase()
      );
      const newSearches = [trimmedQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
      } catch (error) {
        console.warn('Failed to save recent searches:', error);
      }
      
      return newSearches;
    });
  };

  // Clear all recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.warn('Failed to clear recent searches:', error);
    }
  };

  // Remove a specific recent search
  const removeRecentSearch = (query: string) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(search => 
        search.toLowerCase() !== query.toLowerCase()
      );
      
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
      } catch (error) {
        console.warn('Failed to update recent searches:', error);
      }
      
      return filtered;
    });
  };

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  };
}