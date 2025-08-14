'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Star, DollarSign, Building, Tag, Zap } from 'lucide-react';
// import { useAnalytics } from '@/components/providers/analytics-provider';

interface ServiceFiltersProps {
  initialFilters: {
    search?: string;
    category?: string;
    industry?: string;
    pricing?: string;
    sort?: string;
    page?: string;
  };
}

const categories = [
  { id: 'computer_vision', name: 'Computer Vision', count: 150 },
  { id: 'nlp', name: 'Natural Language Processing', count: 200 },
  { id: 'machine_learning', name: 'Machine Learning', count: 180 },
  { id: 'deep_learning', name: 'Deep Learning', count: 120 },
  { id: 'data_science', name: 'Data Science', count: 160 },
  { id: 'robotics', name: 'Robotics & Automation', count: 85 },
  { id: 'ai_consulting', name: 'AI Strategy & Consulting', count: 95 },
  { id: 'custom_ai', name: 'Custom AI Development', count: 110 },
];

const industries = [
  { id: 'healthcare', name: 'Healthcare', count: 45 },
  { id: 'finance', name: 'Financial Services', count: 62 },
  { id: 'retail', name: 'Retail & E-commerce', count: 38 },
  { id: 'manufacturing', name: 'Manufacturing', count: 54 },
  { id: 'technology', name: 'Technology', count: 89 },
  { id: 'education', name: 'Education', count: 29 },
  { id: 'automotive', name: 'Automotive', count: 33 },
  { id: 'logistics', name: 'Supply Chain & Logistics', count: 41 },
];

const deploymentTypes = [
  { id: 'cloud', name: 'Cloud-based', count: 189 },
  { id: 'on_premise', name: 'On-premise', count: 156 },
  { id: 'hybrid', name: 'Hybrid', count: 134 },
  { id: 'saas', name: 'Software as a Service', count: 203 },
];

const complianceStandards = [
  { id: 'gdpr', name: 'GDPR Compliant', count: 167 },
  { id: 'hipaa', name: 'HIPAA Ready', count: 89 },
  { id: 'sox', name: 'SOX Compliant', count: 134 },
  { id: 'iso27001', name: 'ISO 27001', count: 145 },
];

export function ServiceFilters({ initialFilters }: ServiceFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['category', 'pricing', 'rating'])
  );
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(initialFilters.category ? [initialFilters.category] : [])
  );
  const [selectedIndustries, setSelectedIndustries] = useState<Set<string>>(new Set());
  const [selectedDeployments, setSelectedDeployments] = useState<Set<string>>(new Set());
  const [selectedCompliance, setSelectedCompliance] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [minRating, setMinRating] = useState(0);

  // const { trackEvent } = useAnalytics();

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const newSelected = new Set(selectedCategories);
    if (checked) {
      newSelected.add(categoryId);
    } else {
      newSelected.delete(categoryId);
    }
    setSelectedCategories(newSelected);
    
    // trackEvent('filter_applied', {
    //   filter_type: 'category',
    //   filter_value: categoryId,
    //   is_selected: checked,
    // });
  };

  const clearAllFilters = () => {
    setSelectedCategories(new Set());
    setSelectedIndustries(new Set());
    setSelectedDeployments(new Set());
    setSelectedCompliance(new Set());
    setPriceRange([0, 10000]);
    setMinRating(0);
    
    // trackEvent('all_filters_cleared', {
    //   cleared_categories: selectedCategories.size,
    //   cleared_industries: selectedIndustries.size,
    // });
  };

  const FilterSection = ({ 
    title, 
    id, 
    icon: Icon, 
    children 
  }: { 
    title: string; 
    id: string; 
    icon: React.ElementType;
    children: React.ReactNode; 
  }) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <div className="border-b border-gray-200 pb-6">
        <button
          className="flex items-center justify-between w-full text-left"
          onClick={() => toggleSection(id)}
        >
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900">{title}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {isExpanded && (
          <div className="mt-4 space-y-3">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {(selectedCategories.size > 0 || selectedIndustries.size > 0 || minRating > 0) && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Categories */}
        <FilterSection title="Service Category" id="category" icon={Tag}>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={category.id}
                  checked={selectedCategories.has(category.id)}
                  onCheckedChange={(checked) => 
                    handleCategoryChange(category.id, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={category.id} 
                  className="flex-1 text-sm text-gray-700 cursor-pointer"
                >
                  {category.name}
                </Label>
                <span className="text-xs text-gray-500">({category.count})</span>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Industry */}
        <FilterSection title="Industry" id="industry" icon={Building}>
          <div className="space-y-2">
            {industries.map((industry) => (
              <div key={industry.id} className="flex items-center space-x-2">
                <Checkbox
                  id={industry.id}
                  checked={selectedIndustries.has(industry.id)}
                  onCheckedChange={(checked) => {
                    const newSelected = new Set(selectedIndustries);
                    if (checked) {
                      newSelected.add(industry.id);
                    } else {
                      newSelected.delete(industry.id);
                    }
                    setSelectedIndustries(newSelected);
                  }}
                />
                <Label 
                  htmlFor={industry.id} 
                  className="flex-1 text-sm text-gray-700 cursor-pointer"
                >
                  {industry.name}
                </Label>
                <span className="text-xs text-gray-500">({industry.count})</span>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Pricing */}
        <FilterSection title="Pricing Range" id="pricing" icon={DollarSign}>
          <div className="space-y-4">
            <div className="px-2">
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={10000}
                min={0}
                step={100}
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>${priceRange[0].toLocaleString()}</span>
              <span>${priceRange[1].toLocaleString()}/mo</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setPriceRange([0, 1000])}
              >
                $0-$1K
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setPriceRange([1000, 5000])}
              >
                $1K-$5K
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setPriceRange([5000, 10000])}
              >
                $5K+
              </Button>
            </div>
          </div>
        </FilterSection>

        {/* Rating */}
        <FilterSection title="Minimum Rating" id="rating" icon={Star}>
          <div className="space-y-2">
            {[4.5, 4.0, 3.5, 3.0].map((rating) => (
              <div key={rating} className="flex items-center space-x-2">
                <Checkbox
                  id={`rating-${rating}`}
                  checked={minRating === rating}
                  onCheckedChange={(checked) => {
                    setMinRating(checked ? rating : 0);
                  }}
                />
                <Label 
                  htmlFor={`rating-${rating}`} 
                  className="flex items-center space-x-1 text-sm text-gray-700 cursor-pointer"
                >
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(rating) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span>{rating}+ stars</span>
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Deployment Type */}
        <FilterSection title="Deployment" id="deployment" icon={Zap}>
          <div className="space-y-2">
            {deploymentTypes.map((type) => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox
                  id={type.id}
                  checked={selectedDeployments.has(type.id)}
                  onCheckedChange={(checked) => {
                    const newSelected = new Set(selectedDeployments);
                    if (checked) {
                      newSelected.add(type.id);
                    } else {
                      newSelected.delete(type.id);
                    }
                    setSelectedDeployments(newSelected);
                  }}
                />
                <Label 
                  htmlFor={type.id} 
                  className="flex-1 text-sm text-gray-700 cursor-pointer"
                >
                  {type.name}
                </Label>
                <span className="text-xs text-gray-500">({type.count})</span>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Compliance */}
        <FilterSection title="Compliance" id="compliance" icon={Building}>
          <div className="space-y-2">
            {complianceStandards.map((standard) => (
              <div key={standard.id} className="flex items-center space-x-2">
                <Checkbox
                  id={standard.id}
                  checked={selectedCompliance.has(standard.id)}
                  onCheckedChange={(checked) => {
                    const newSelected = new Set(selectedCompliance);
                    if (checked) {
                      newSelected.add(standard.id);
                    } else {
                      newSelected.delete(standard.id);
                    }
                    setSelectedCompliance(newSelected);
                  }}
                />
                <Label 
                  htmlFor={standard.id} 
                  className="flex-1 text-sm text-gray-700 cursor-pointer"
                >
                  {standard.name}
                </Label>
                <span className="text-xs text-gray-500">({standard.count})</span>
              </div>
            ))}
          </div>
        </FilterSection>
      </div>
    </div>
  );
}