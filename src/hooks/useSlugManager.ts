/**
 * React Hook for Slug Management
 * Provides reactive slug validation, availability checking, and management
 */

import { useState, useEffect, useCallback } from 'react';
import { SlugService, SlugValidationResult } from '@/lib/profile/slug-service';
import { useDebounce } from '@/hooks/useDebounce';

interface UseSlugManagerProps {
  initialSlug?: string;
  userId?: string;
  userType?: 'freelancer' | 'vendor' | 'organization';
  collectionName?: string;
  autoGenerate?: boolean;
  debounceMs?: number;
}

interface UseSlugManagerReturn {
  // Current state
  slug: string;
  validation: SlugValidationResult;
  isChecking: boolean;
  isUpdating: boolean;
  
  // Actions
  setSlug: (slug: string) => void;
  generateFromText: (text: string) => void;
  reserveSlug: () => Promise<{ success: boolean; error?: string }>;
  updateSlug: () => Promise<{ success: boolean; error?: string }>;
  regenerateSuggestions: () => Promise<void>;
  
  // Utilities
  isValid: boolean;
  isAvailable: boolean;
  hasErrors: boolean;
  canSave: boolean;
  suggestions: string[];
  errors: string[];
}

export function useSlugManager({
  initialSlug = '',
  userId,
  userType,
  collectionName,
  autoGenerate = false,
  debounceMs = 500
}: UseSlugManagerProps = {}): UseSlugManagerReturn {
  const [slug, setSlugState] = useState(initialSlug);
  const [validation, setValidation] = useState<SlugValidationResult>({
    isValid: false,
    isAvailable: false
  });
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const debouncedSlug = useDebounce(slug, debounceMs);

  // Validate and check availability when debounced slug changes
  useEffect(() => {
    if (!debouncedSlug.trim()) {
      setValidation({
        isValid: false,
        isAvailable: false,
        errors: ['Slug is required']
      });
      return;
    }

    let isCancelled = false;
    setIsChecking(true);

    const validateSlug = async () => {
      try {
        const result = await SlugService.validateAndCheck(debouncedSlug, userId);
        
        if (!isCancelled) {
          setValidation(result);
        }
      } catch (error) {
        if (!isCancelled) {
          setValidation({
            isValid: false,
            isAvailable: false,
            errors: ['Error checking slug availability']
          });
        }
      } finally {
        if (!isCancelled) {
          setIsChecking(false);
        }
      }
    };

    validateSlug();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSlug, userId]);

  const setSlug = useCallback((newSlug: string) => {
    setSlugState(newSlug);
  }, []);

  const generateFromText = useCallback((text: string) => {
    const generated = SlugService.generateSlug(text);
    setSlugState(generated);
  }, []);

  const reserveSlug = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!userId || !userType || !collectionName) {
      return { success: false, error: 'Missing required parameters' };
    }

    if (!validation.isValid || !validation.isAvailable) {
      return { success: false, error: 'Slug is not valid or available' };
    }

    setIsUpdating(true);
    
    try {
      const result = await SlugService.reserveSlug(userId, userType, slug, collectionName);
      return result;
    } finally {
      setIsUpdating(false);
    }
  }, [userId, userType, collectionName, slug, validation]);

  const updateSlug = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!userId || !userType || !collectionName) {
      return { success: false, error: 'Missing required parameters' };
    }

    if (!validation.isValid || !validation.isAvailable) {
      return { success: false, error: 'Slug is not valid or available' };
    }

    setIsUpdating(true);
    
    try {
      const result = await SlugService.updateSlug(userId, userType, slug, collectionName);
      return result;
    } finally {
      setIsUpdating(false);
    }
  }, [userId, userType, collectionName, slug, validation]);

  const regenerateSuggestions = useCallback(async () => {
    if (!slug.trim()) return;

    setIsChecking(true);
    
    try {
      const suggestions = await SlugService.generateSuggestions(slug);
      setValidation(prev => ({
        ...prev,
        suggestions
      }));
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsChecking(false);
    }
  }, [slug]);

  // Auto-generate slug when enabled and no initial slug provided
  useEffect(() => {
    if (autoGenerate && !initialSlug && !slug) {
      // This would typically be triggered by a name/title change
      // Implementation depends on specific use case
    }
  }, [autoGenerate, initialSlug, slug]);

  return {
    // Current state
    slug,
    validation,
    isChecking,
    isUpdating,
    
    // Actions
    setSlug,
    generateFromText,
    reserveSlug,
    updateSlug,
    regenerateSuggestions,
    
    // Computed values
    isValid: validation.isValid,
    isAvailable: validation.isAvailable,
    hasErrors: !!validation.errors?.length,
    canSave: validation.isValid && validation.isAvailable && !isChecking && !isUpdating,
    suggestions: validation.suggestions || [],
    errors: validation.errors || []
  };
}

/**
 * Hook for checking slug availability without full management
 */
export function useSlugAvailability(slug: string, excludeUserId?: string) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  const debouncedSlug = useDebounce(slug, 300);

  useEffect(() => {
    if (!debouncedSlug.trim()) {
      setIsAvailable(null);
      return;
    }

    let isCancelled = false;
    setIsChecking(true);

    SlugService.checkAvailability(debouncedSlug, excludeUserId)
      .then(available => {
        if (!isCancelled) {
          setIsAvailable(available);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setIsAvailable(null);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsChecking(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedSlug, excludeUserId]);

  return { isAvailable, isChecking };
}

/**
 * Hook for generating slug suggestions
 */
export function useSlugSuggestions(baseSlug: string, count: number = 5) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateSuggestions = useCallback(async () => {
    if (!baseSlug.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const newSuggestions = await SlugService.generateSuggestions(baseSlug, count);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [baseSlug, count]);

  useEffect(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  return {
    suggestions,
    isLoading,
    regenerate: generateSuggestions
  };
}