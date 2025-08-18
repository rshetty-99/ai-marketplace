/**
 * Slug Input Component
 * Professional slug management interface with real-time validation
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSlugManager } from '@/hooks/useSlugManager';
import { cn } from '@/lib/utils';

import {
  Check,
  X,
  Loader2,
  RefreshCw,
  ExternalLink,
  Copy,
  AlertCircle,
  Info,
  Lightbulb,
  Wand2,
  Eye
} from 'lucide-react';

interface SlugInputProps {
  value: string;
  onChange: (slug: string) => void;
  userId?: string;
  userType?: 'freelancer' | 'vendor' | 'organization';
  collectionName?: string;
  nameValue?: string; // For auto-generation from name
  disabled?: boolean;
  showPreview?: boolean;
  className?: string;
}

export function SlugInput({
  value,
  onChange,
  userId,
  userType,
  collectionName,
  nameValue,
  disabled = false,
  showPreview = true,
  className
}: SlugInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const {
    slug,
    validation,
    isChecking,
    setSlug,
    generateFromText,
    regenerateSuggestions,
    isValid,
    isAvailable,
    hasErrors,
    suggestions,
    errors
  } = useSlugManager({
    initialSlug: value,
    userId,
    userType,
    collectionName,
    debounceMs: 300
  });

  // Sync with parent component
  React.useEffect(() => {
    if (slug !== value) {
      onChange(slug);
    }
  }, [slug, onChange, value]);

  // Sync with external value changes
  React.useEffect(() => {
    if (value !== slug) {
      setSlug(value);
    }
  }, [value, setSlug, slug]);

  const handleGenerateFromName = () => {
    if (nameValue) {
      generateFromText(nameValue);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setSlug(suggestion);
    setShowSuggestions(false);
  };

  const handleCopyUrl = async () => {
    if (!slug || !isValid || !isAvailable) return;
    
    const baseUrl = window.location.origin;
    const urlPrefix = userType === 'freelancer' ? '/providers' : 
                     userType === 'vendor' ? '/vendors' : '/organizations';
    const fullUrl = `${baseUrl}${urlPrefix}/${slug}`;
    
    try {
      await navigator.clipboard.writeText(fullUrl);
      // Could add toast notification here
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    if (hasErrors) {
      return <X className="h-4 w-4 text-red-500" />;
    }
    
    if (isValid && isAvailable) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    
    if (isValid && !isAvailable) {
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
    
    return null;
  };

  const getStatusColor = () => {
    if (hasErrors) return 'border-red-300 focus:border-red-500';
    if (isValid && isAvailable) return 'border-green-300 focus:border-green-500';
    if (isValid && !isAvailable) return 'border-orange-300 focus:border-orange-500';
    return 'border-gray-300';
  };

  const urlPrefix = userType === 'freelancer' ? '/providers' : 
                   userType === 'vendor' ? '/vendors' : '/organizations';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="slug-input" className="text-sm font-medium">
            Profile URL
          </Label>
          <div className="flex items-center gap-2">
            {nameValue && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleGenerateFromName}
                      disabled={disabled}
                      className="h-6 px-2"
                    >
                      <Wand2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Generate from name</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {showPreview && isValid && isAvailable && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyUrl}
                      className="h-6 px-2"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy profile URL</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        
        <div className="relative">
          <div className="flex">
            <div className="flex items-center px-3 bg-gray-50 border border-r-0 rounded-l-md text-sm text-gray-600">
              {window.location.origin}{urlPrefix}/
            </div>
            <div className="relative flex-1">
              <Input
                id="slug-input"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={disabled}
                className={cn(
                  'rounded-l-none pr-10',
                  getStatusColor()
                )}
                placeholder="your-unique-slug"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getStatusIcon()}
              </div>
            </div>
          </div>
        </div>

        {/* URL Preview */}
        {showPreview && slug && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Preview:</span>
            <code className={cn(
              'px-1 py-0.5 rounded font-mono',
              isValid && isAvailable 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-gray-50 text-gray-600 border'
            )}>
              {window.location.origin}{urlPrefix}/{slug}
            </code>
            {isValid && isAvailable && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => window.open(`${urlPrefix}/${slug}`, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Validation Messages */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {isValid && !isAvailable && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This URL is already taken. Try one of the suggestions below or modify your slug.
          </AlertDescription>
        </Alert>
      )}

      {isValid && isAvailable && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Great! This URL is available and ready to use.
          </AlertDescription>
        </Alert>
      )}

      {/* Suggestions */}
      {(!isAvailable || showSuggestions) && suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Suggestions
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={regenerateSuggestions}
                disabled={isChecking}
                className="h-6 px-2"
              >
                <RefreshCw className={cn("h-3 w-3", isChecking && "animate-spin")} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md border border-blue-200 transition-colors"
                >
                  {suggestion}
                  <ExternalLink className="h-3 w-3" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Use lowercase letters, numbers, and hyphens only</p>
        <p>• Must be 3-50 characters long</p>
        <p>• Cannot start or end with a hyphen</p>
        <p>• Choose something memorable and professional</p>
      </div>
    </div>
  );
}

/**
 * Simplified Slug Input for forms
 */
interface SimpleSlugInputProps {
  value: string;
  onChange: (slug: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function SimpleSlugInput({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "your-slug"
}: SimpleSlugInputProps) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            error && "border-red-300 focus:border-red-500"
          )}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}