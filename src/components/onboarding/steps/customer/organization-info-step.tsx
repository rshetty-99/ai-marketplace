'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building, MapPin, Users, Calendar, CheckCircle, AlertCircle, Phone, Globe, Mail } from 'lucide-react';
import { CustomerOrganizationOnboarding } from '@/lib/firebase/onboarding-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface OrganizationInfoStepProps {
  data: Partial<CustomerOrganizationOnboarding>;
  onUpdate: (data: Partial<CustomerOrganizationOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

const COMPANY_SIZES = [
  { value: 'startup', label: 'Startup (1-10 employees)' },
  { value: 'small', label: 'Small Business (11-50 employees)' },
  { value: 'medium', label: 'Medium Business (51-200 employees)' },
  { value: 'large', label: 'Large Enterprise (201-1000 employees)' },
  { value: 'enterprise', label: 'Enterprise (1000+ employees)' },
];

const INDUSTRIES = [
  'Technology',
  'Healthcare & Life Sciences',
  'Financial Services',
  'Manufacturing',
  'Retail & E-commerce',
  'Education',
  'Government & Public Sector',
  'Media & Entertainment',
  'Transportation & Logistics',
  'Energy & Utilities',
  'Real Estate',
  'Professional Services',
  'Non-Profit',
  'Agriculture',
  'Construction',
  'Hospitality',
  'Other'
];

const ORGANIZATION_TYPES = [
  { value: 'corporation', label: 'Corporation' },
  { value: 'llc', label: 'LLC' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'non_profit', label: 'Non-Profit' },
  { value: 'government', label: 'Government Agency' },
  { value: 'educational', label: 'Educational Institution' },
  { value: 'other', label: 'Other' },
];

export function OrganizationInfoStep({ data, onUpdate, onNext, onPrevious, onSkip, isSubmitting }: OrganizationInfoStepProps) {
  const { trackEvent } = useAnalytics();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const organizationInfo = data.organizationInfo || {};

  useEffect(() => {
    trackEvent('customer_onboarding_step_viewed', {
      step: 'organization_info',
      stepNumber: 1
    });
  }, [trackEvent]);

  const handleFieldChange = (field: string, value: string) => {
    const updatedData = {
      ...data,
      organizationInfo: {
        ...organizationInfo,
        [field]: value
      }
    };
    onUpdate(updatedData);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => new Set([...prev, field]));
    validateField(field, organizationInfo[field as keyof typeof organizationInfo] as string);
  };

  const validateField = (field: string, value: string) => {
    let error = '';

    switch (field) {
      case 'companyName':
        if (!value?.trim()) {
          error = 'Company name is required';
        } else if (value.length < 2) {
          error = 'Company name must be at least 2 characters';
        }
        break;

      case 'contactEmail':
        if (!value?.trim()) {
          error = 'Contact email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;

      case 'contactName':
        if (!value?.trim()) {
          error = 'Contact name is required';
        }
        break;

      case 'website':
        if (value && !/^https?:\/\/.+\..+/.test(value)) {
          error = 'Please enter a valid website URL';
        }
        break;

      case 'phone':
        if (value && !/^\+?[\d\s\-\(\)]+$/.test(value)) {
          error = 'Please enter a valid phone number';
        }
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const validateForm = () => {
    const requiredFields = ['companyName', 'contactName', 'contactEmail', 'industry', 'companySize'];
    let isValid = true;

    requiredFields.forEach(field => {
      const value = organizationInfo[field as keyof typeof organizationInfo] as string;
      if (!validateField(field, value || '')) {
        isValid = false;
      }
    });

    // Set all fields as touched to show errors
    setTouchedFields(new Set(requiredFields));

    return isValid;
  };

  const handleNext = () => {
    if (validateForm()) {
      trackEvent('customer_onboarding_step_completed', {
        step: 'organization_info',
        stepNumber: 1,
        companySize: organizationInfo.companySize,
        industry: organizationInfo.industry,
        organizationType: organizationInfo.organizationType
      });
      onNext();
    }
  };

  const getFieldError = (field: string) => {
    return touchedFields.has(field) ? errors[field] : '';
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Building className="w-5 h-5 text-green-600" />
        <div>
          <h3 className="font-medium">Organization Information</h3>
          <p className="text-sm text-muted-foreground">
            Tell us about your organization to help us tailor our AI solutions
          </p>
        </div>
      </div>

      {/* Basic Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Company Details
          </CardTitle>
          <CardDescription>
            Basic information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={organizationInfo.companyName || ''}
                onChange={(e) => handleFieldChange('companyName', e.target.value)}
                onBlur={() => handleFieldBlur('companyName')}
                placeholder="Acme Corporation"
                className={getFieldError('companyName') ? 'border-red-500' : ''}
              />
              {getFieldError('companyName') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {getFieldError('companyName')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationType">Organization Type</Label>
              <Select
                value={organizationInfo.organizationType || ''}
                onValueChange={(value) => handleFieldChange('organizationType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization type" />
                </SelectTrigger>
                <SelectContent>
                  {ORGANIZATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Select
                value={organizationInfo.industry || ''}
                onValueChange={(value) => handleFieldChange('industry', value)}
              >
                <SelectTrigger className={getFieldError('industry') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry.toLowerCase().replace(/\s+/g, '_')}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getFieldError('industry') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Industry is required
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySize">Company Size *</Label>
              <Select
                value={organizationInfo.companySize || ''}
                onValueChange={(value) => handleFieldChange('companySize', value)}
              >
                <SelectTrigger className={getFieldError('companySize') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getFieldError('companySize') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Company size is required
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Company Website</Label>
              <Input
                id="website"
                type="url"
                value={organizationInfo.website || ''}
                onChange={(e) => handleFieldChange('website', e.target.value)}
                onBlur={() => handleFieldBlur('website')}
                placeholder="https://acme.com"
                className={getFieldError('website') ? 'border-red-500' : ''}
              />
              {getFieldError('website') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {getFieldError('website')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={organizationInfo.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                onBlur={() => handleFieldBlur('phone')}
                placeholder="+1 (555) 123-4567"
                className={getFieldError('phone') ? 'border-red-500' : ''}
              />
              {getFieldError('phone') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {getFieldError('phone')}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Company Description</Label>
            <Textarea
              id="description"
              value={organizationInfo.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Brief description of your company and what you do..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Primary Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Primary Contact
          </CardTitle>
          <CardDescription>
            Main point of contact for this project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name *</Label>
              <Input
                id="contactName"
                value={organizationInfo.contactName || ''}
                onChange={(e) => handleFieldChange('contactName', e.target.value)}
                onBlur={() => handleFieldBlur('contactName')}
                placeholder="John Smith"
                className={getFieldError('contactName') ? 'border-red-500' : ''}
              />
              {getFieldError('contactName') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {getFieldError('contactName')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactTitle">Job Title</Label>
              <Input
                id="contactTitle"
                value={organizationInfo.contactTitle || ''}
                onChange={(e) => handleFieldChange('contactTitle', e.target.value)}
                placeholder="CTO, AI Director, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={organizationInfo.contactEmail || ''}
                onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
                onBlur={() => handleFieldBlur('contactEmail')}
                placeholder="john@acme.com"
                className={getFieldError('contactEmail') ? 'border-red-500' : ''}
              />
              {getFieldError('contactEmail') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {getFieldError('contactEmail')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={organizationInfo.contactPhone || ''}
                onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={organizationInfo.department || ''}
              onChange={(e) => handleFieldChange('department', e.target.value)}
              placeholder="Engineering, IT, Data Science, etc."
            />
          </div>
        </CardContent>
      </Card>

      {/* Company Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location Information
          </CardTitle>
          <CardDescription>
            Primary business location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={organizationInfo.country || ''}
                onChange={(e) => handleFieldChange('country', e.target.value)}
                placeholder="United States"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={organizationInfo.city || ''}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                placeholder="San Francisco"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={organizationInfo.state || ''}
                onChange={(e) => handleFieldChange('state', e.target.value)}
                placeholder="California"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={organizationInfo.timezone || ''}
                onValueChange={(value) => handleFieldChange('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="Europe/London">GMT</SelectItem>
                  <SelectItem value="Europe/Paris">Central European Time</SelectItem>
                  <SelectItem value="Asia/Tokyo">Japan Standard Time</SelectItem>
                  <SelectItem value="Asia/Shanghai">China Standard Time</SelectItem>
                  <SelectItem value="Asia/Kolkata">India Standard Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Information Summary
          </CardTitle>
          <CardDescription>
            Review your organization information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Building className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <div className="font-medium">{organizationInfo.companyName || 'Company Name'}</div>
              <div className="text-sm text-muted-foreground">
                {organizationInfo.industry ? INDUSTRIES.find(i => i.toLowerCase().replace(/\s+/g, '_') === organizationInfo.industry)?.replace(/_/g, ' ') : 'Industry'}
              </div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Users className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <div className="font-medium">
                {organizationInfo.companySize ? COMPANY_SIZES.find(s => s.value === organizationInfo.companySize)?.label : 'Company Size'}
              </div>
              <div className="text-sm text-muted-foreground">Team Size</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <MapPin className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <div className="font-medium">
                {organizationInfo.city && organizationInfo.country 
                  ? `${organizationInfo.city}, ${organizationInfo.country}`
                  : 'Location'
                }
              </div>
              <div className="text-sm text-muted-foreground">Primary Location</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-6">
        <Button variant="outline" onClick={onPrevious} disabled>
          Previous
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Step 1 of 6 • Required information
          </div>
          <Button onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}