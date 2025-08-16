'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Grid3X3, List, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useFilterPreferences } from '@/hooks/use-filter-preferences';
import type { ServiceFilters } from '@/types/service';

interface FilterPreferencesDialogProps {
  currentFilters: ServiceFilters;
  onApplyDefaults: (filters: Partial<ServiceFilters>) => void;
}

export function FilterPreferencesDialog({ 
  currentFilters, 
  onApplyDefaults 
}: FilterPreferencesDialogProps) {
  const {
    preferences,
    updateDefaultFilters,
    updateViewMode,
    updateSortPreferences,
    updateItemsPerPage,
    updateExpandedSections,
    resetPreferences,
  } = useFilterPreferences();

  const [open, setOpen] = useState(false);
  const [tempPreferences, setTempPreferences] = useState(preferences);

  const handleSaveCurrentAsDefault = () => {
    // Convert current filters to default preferences
    const defaultFilters: Partial<ServiceFilters> = {};
    
    if (currentFilters.category) defaultFilters.category = currentFilters.category;
    if (currentFilters.industries?.length) defaultFilters.industries = currentFilters.industries;
    if (currentFilters.providerType) defaultFilters.providerType = currentFilters.providerType;
    if (currentFilters.priceRange?.min || currentFilters.priceRange?.max) {
      defaultFilters.priceRange = currentFilters.priceRange;
    }
    if (currentFilters.rating) defaultFilters.rating = currentFilters.rating;
    if (currentFilters.technologies?.length) defaultFilters.technologies = currentFilters.technologies;
    
    updateDefaultFilters(defaultFilters);
    setTempPreferences(prev => ({ ...prev, defaultFilters }));
  };

  const handleApplyDefaults = () => {
    onApplyDefaults(preferences.defaultFilters);
    setOpen(false);
  };

  const handleResetAll = () => {
    resetPreferences();
    setTempPreferences(preferences);
  };

  const hasDefaultFilters = Object.keys(preferences.defaultFilters).length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Preferences
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Filter Preferences
          </DialogTitle>
          <DialogDescription>
            Customize your default search and filter settings for a better experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Default Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Default Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Save current filters as default</Label>
                  <p className="text-sm text-gray-500">
                    Your current search and filter settings will be applied automatically
                  </p>
                </div>
                <Button onClick={handleSaveCurrentAsDefault} variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Current
                </Button>
              </div>

              {hasDefaultFilters && (
                <div className="space-y-3">
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium">Current Default Filters:</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {preferences.defaultFilters.category && (
                        <Badge variant="secondary">
                          Category: {preferences.defaultFilters.category}
                        </Badge>
                      )}
                      {preferences.defaultFilters.industries?.map(industry => (
                        <Badge key={industry} variant="secondary">
                          Industry: {industry}
                        </Badge>
                      ))}
                      {preferences.defaultFilters.providerType && (
                        <Badge variant="secondary">
                          Provider: {preferences.defaultFilters.providerType}
                        </Badge>
                      )}
                      {preferences.defaultFilters.priceRange && (
                        <Badge variant="secondary">
                          Price: ${preferences.defaultFilters.priceRange.min || 0} - ${preferences.defaultFilters.priceRange.max || '∞'}
                        </Badge>
                      )}
                      {preferences.defaultFilters.rating && (
                        <Badge variant="secondary">
                          Rating: {preferences.defaultFilters.rating}+ stars
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button onClick={handleApplyDefaults} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Apply Defaults Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* View Preferences */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">View Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Default View Mode</Label>
                <RadioGroup
                  value={preferences.viewMode}
                  onValueChange={(value: 'grid' | 'list') => updateViewMode(value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="grid" id="grid" />
                    <Label htmlFor="grid" className="flex items-center gap-2 cursor-pointer">
                      <Grid3X3 className="h-4 w-4" />
                      Grid View
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="list" id="list" />
                    <Label htmlFor="list" className="flex items-center gap-2 cursor-pointer">
                      <List className="h-4 w-4" />
                      List View
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Default Sort Order</Label>
                <RadioGroup
                  value={`${preferences.sortField}-${preferences.sortDirection}`}
                  onValueChange={(value) => {
                    const [field, direction] = value.split('-');
                    updateSortPreferences(field, direction as 'asc' | 'desc');
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="relevance-desc" id="relevance" />
                    <Label htmlFor="relevance">Most Relevant</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rating-desc" id="rating" />
                    <Label htmlFor="rating">Highest Rated</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="price-asc" id="price-low" />
                    <Label htmlFor="price-low">Price: Low to High</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="price-desc" id="price-high" />
                    <Label htmlFor="price-high">Price: High to Low</Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Results per Page</Label>
                <RadioGroup
                  value={preferences.itemsPerPage.toString()}
                  onValueChange={(value) => updateItemsPerPage(parseInt(value))}
                >
                  {[12, 24, 48].map(count => (
                    <div key={count} className="flex items-center space-x-2">
                      <RadioGroupItem value={count.toString()} id={`items-${count}`} />
                      <Label htmlFor={`items-${count}`}>{count} services</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Expanded Sections */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Default Expanded Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label className="text-sm">Choose which filter sections are expanded by default:</Label>
                <div className="space-y-2">
                  {[
                    { id: 'categories', label: 'Categories' },
                    { id: 'priceRange', label: 'Price Range' },
                    { id: 'providerType', label: 'Provider Type' },
                    { id: 'rating', label: 'Rating' },
                    { id: 'industries', label: 'Industries' },
                    { id: 'compliance', label: 'Compliance' },
                    { id: 'features', label: 'Features' },
                  ].map(section => (
                    <div key={section.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={section.id}
                        checked={preferences.expandedSections.includes(section.id)}
                        onCheckedChange={(checked) => {
                          const newSections = checked
                            ? [...preferences.expandedSections, section.id]
                            : preferences.expandedSections.filter(s => s !== section.id);
                          updateExpandedSections(newSections);
                        }}
                      />
                      <Label htmlFor={section.id}>{section.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reset Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-red-600">Reset Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Reset all preferences to default</Label>
                  <p className="text-sm text-gray-500">
                    This will clear all your saved preferences and settings
                  </p>
                </div>
                <Button onClick={handleResetAll} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}