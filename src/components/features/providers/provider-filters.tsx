'use client';

import { Control } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CustomFormField, FormFieldType } from '@/components/CustomFormFields';
import { X } from 'lucide-react';

interface ProviderFiltersProps {
  control: Control<any>;
  filters: {
    search?: string;
    expertise?: string;
    location?: string;
    certification?: string;
    industry?: string;
    companySize?: string;
    rating?: string;
    verified?: boolean;
    pricing?: string;
  };
  onFilterChange: (key: string, value: string | boolean) => void;
  options: {
    expertise: string[];
    location: { value: string; label: string }[];
    certification: string[];
    industry: string[];
    companySize: { value: string; label: string }[];
    pricing: { value: string; label: string }[];
  };
}

export function ProviderFilters({ control, filters, onFilterChange, options }: ProviderFiltersProps) {
  const activeFilters = Object.entries(filters).filter(([key, value]) => 
    value && value !== '' && value !== false && key !== 'search' && key !== 'sort' && key !== 'page' && key !== 'limit'
  );

  const clearFilter = (key: string) => {
    onFilterChange(key, key === 'verified' ? false : '');
  };

  const clearAllFilters = () => {
    Object.keys(filters).forEach(key => {
      if (key !== 'search') {
        onFilterChange(key, key === 'verified' ? false : '');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Active Filters</h3>
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(([key, value]) => (
              <Badge key={key} variant="secondary" className="flex items-center gap-1">
                {key}: {value}
                <button
                  onClick={() => clearFilter(key)}
                  className="ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Filter Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Expertise */}
        <div className="space-y-2">
          <CustomFormField
            control={control}
            name="expertise"
            fieldType={FormFieldType.SELECT}
            label="Expertise"
            placeholder="All Expertise Areas"
          >
            <option value="">All Expertise Areas</option>
            {options.expertise.map((option) => (
              <option key={option} value={option.toLowerCase().replace(' ', '-')}>
                {option}
              </option>
            ))}
          </CustomFormField>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <CustomFormField
            control={control}
            name="location"
            fieldType={FormFieldType.SELECT}
            label="Location"
            placeholder="All Locations"
          >
            <option value="">All Locations</option>
            {options.location.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </CustomFormField>
        </div>

        {/* Company Size */}
        <div className="space-y-2">
          <CustomFormField
            control={control}
            name="companySize"
            fieldType={FormFieldType.SELECT}
            label="Company Size"
            placeholder="All Company Sizes"
          >
            <option value="">All Company Sizes</option>
            {options.companySize.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </CustomFormField>
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <CustomFormField
            control={control}
            name="industry"
            fieldType={FormFieldType.SELECT}
            label="Industry"
            placeholder="All Industries"
          >
            <option value="">All Industries</option>
            {options.industry.map((option) => (
              <option key={option} value={option.toLowerCase().replace(' ', '-')}>
                {option}
              </option>
            ))}
          </CustomFormField>
        </div>

        {/* Certification */}
        <div className="space-y-2">
          <CustomFormField
            control={control}
            name="certification"
            fieldType={FormFieldType.SELECT}
            label="Certification"
            placeholder="All Certifications"
          >
            <option value="">All Certifications</option>
            {options.certification.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </CustomFormField>
        </div>

        {/* Pricing Model */}
        <div className="space-y-2">
          <CustomFormField
            control={control}
            name="pricing"
            fieldType={FormFieldType.SELECT}
            label="Pricing Model"
            placeholder="All Pricing Models"
          >
            <option value="">All Pricing Models</option>
            {options.pricing.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </CustomFormField>
        </div>
      </div>

      {/* Verified Only */}
      <div className="space-y-2">
        <CustomFormField
          control={control}
          name="verified"
          fieldType={FormFieldType.CHECKBOX}
          label="Verified providers only"
        />
      </div>
    </div>
  );
}