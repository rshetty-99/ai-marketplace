'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import CustomFormField, { FormFieldType } from '@/components/CustomFormFields';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building, MapPin, Users, Calendar, CheckCircle, AlertCircle, Phone, Globe, Upload } from 'lucide-react';
import { VendorCompanyOnboarding } from '@/lib/firebase/onboarding-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface CompanyInfoStepProps {
  data: Partial<VendorCompanyOnboarding>;
  onUpdate: (data: Partial<VendorCompanyOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

const BUSINESS_TYPES = [
  { value: 'corporation', label: 'Corporation' },
  { value: 'llc', label: 'Limited Liability Company (LLC)' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'nonprofit', label: 'Non-Profit Organization' },
  { value: 'other', label: 'Other' },
];

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Marketing',
  'Legal',
  'Real Estate',
  'Transportation',
  'Energy',
  'Media',
  'Government',
  'Other'
];

const companyInfoSchema = z.object({
  legalName: z.string().min(2, 'Company name must be at least 2 characters'),
  tradingName: z.string().optional(),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone number is required'),
  ein: z.string().regex(/^\d{2}-\d{7}$/, 'EIN should be in format: XX-XXXXXXX').optional().or(z.literal('')),
  address: z.string().min(1, 'Business address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  zipCode: z.string().min(1, 'ZIP/Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  businessType: z.string().min(1, 'Business type is required'),
  companySize: z.string().min(1, 'Company size is required'),
  foundedYear: z.string().min(1, 'Founded year is required'),
  primaryIndustry: z.string().min(1, 'Primary industry is required'),
  description: z.string().optional(),
});

type CompanyInfoForm = z.infer<typeof companyInfoSchema>;

export function CompanyInfoStep({ data, onUpdate, onNext, onPrevious, isSubmitting }: CompanyInfoStepProps) {
  const { trackEvent } = useAnalytics();
  
  const companyInfo = data.companyInfo || {};

  const form = useForm<CompanyInfoForm>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      legalName: companyInfo.legalName || '',
      tradingName: companyInfo.tradingName || '',
      website: companyInfo.website || '',
      phone: companyInfo.phone || '',
      ein: companyInfo.ein || '',
      address: companyInfo.address || '',
      city: companyInfo.city || '',
      state: companyInfo.state || '',
      zipCode: companyInfo.zipCode || '',
      country: companyInfo.country || '',
      businessType: companyInfo.businessType || '',
      companySize: companyInfo.companySize || '',
      foundedYear: companyInfo.foundedYear || '',
      primaryIndustry: companyInfo.primaryIndustry || '',
      description: companyInfo.description || '',
    },
  });

  // Auto-save form data when it changes
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (form.formState.isDirty) {
        onUpdate({
          ...data,
          companyInfo: {
            ...companyInfo,
            ...values,
          },
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onUpdate, data, companyInfo]);

  useEffect(() => {
    trackEvent('vendor_onboarding_step_viewed', {
      step: 'company_info',
      stepNumber: 1
    });
  }, [trackEvent]);

  const handleFieldChange = (field: string, value: string) => {
    const updatedData = {
      ...data,
      companyInfo: {
        ...companyInfo,
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
    validateField(field, companyInfo[field as keyof typeof companyInfo] as string);
  };

  const validateField = (field: string, value: string) => {
    let error = '';

    switch (field) {
      case 'legalName':
        if (!value?.trim()) {
          error = 'Legal company name is required';
        } else if (value.length < 2) {
          error = 'Company name must be at least 2 characters';
        }
        break;

      case 'website':
        if (value && !/^https?:\/\/.+\..+/.test(value)) {
          error = 'Please enter a valid website URL';
        }
        break;

      case 'phone':
        if (!value?.trim()) {
          error = 'Phone number is required';
        } else if (!/^\+?[\d\s\-\(\)]+$/.test(value)) {
          error = 'Please enter a valid phone number';
        }
        break;

      case 'ein':
        if (value && !/^\d{2}-\d{7}$/.test(value)) {
          error = 'EIN should be in format: XX-XXXXXXX';
        }
        break;

      case 'address':
        if (!value?.trim()) {
          error = 'Business address is required';
        }
        break;

      case 'city':
        if (!value?.trim()) {
          error = 'City is required';
        }
        break;

      case 'state':
        if (!value?.trim()) {
          error = 'State/Province is required';
        }
        break;

      case 'zipCode':
        if (!value?.trim()) {
          error = 'ZIP/Postal code is required';
        }
        break;

      case 'country':
        if (!value?.trim()) {
          error = 'Country is required';
        }
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const validateForm = () => {
    const requiredFields = [
      'legalName', 'phone', 'address', 'city', 'state', 'zipCode', 'country',
      'businessType', 'companySize', 'foundedYear', 'primaryIndustry'
    ];

    const newErrors: Record<string, string> = {};
    let isValid = true;

    requiredFields.forEach(field => {
      const value = companyInfo[field as keyof typeof companyInfo] as string;
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
      trackEvent('vendor_onboarding_step_completed', {
        step: 'company_info',
        stepNumber: 1,
        companySize: companyInfo.companySize,
        industry: companyInfo.primaryIndustry,
        businessType: companyInfo.businessType
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
        <Building className="w-5 h-5 text-blue-600" />
        <div>
          <h3 className="font-medium">Company Information</h3>
          <p className="text-sm text-muted-foreground">
            Provide your business details for verification and legal compliance
          </p>
        </div>
      </div>

      {/* Basic Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Legal business information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="legalName">Legal Company Name *</Label>
              <Input
                id="legalName"
                value={companyInfo.legalName || ''}
                onChange={(e) => handleFieldChange('legalName', e.target.value)}
                onBlur={() => handleFieldBlur('legalName')}
                placeholder="Acme AI Solutions Inc."
                className={getFieldError('legalName') ? 'border-red-500' : ''}
              />
              {getFieldError('legalName') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {getFieldError('legalName')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tradeName">Trade/DBA Name</Label>
              <Input
                id="tradeName"
                value={companyInfo.tradeName || ''}
                onChange={(e) => handleFieldChange('tradeName', e.target.value)}
                placeholder="Acme AI (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Company Website</Label>
              <Input
                id="website"
                type="url"
                value={companyInfo.website || ''}
                onChange={(e) => handleFieldChange('website', e.target.value)}
                onBlur={() => handleFieldBlur('website')}
                placeholder="https://acme-ai.com"
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
              <Label htmlFor="phone">Business Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={companyInfo.phone || ''}
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

            <div className="space-y-2">
              <Label htmlFor="ein">EIN/Tax ID</Label>
              <Input
                id="ein"
                value={companyInfo.ein || ''}
                onChange={(e) => handleFieldChange('ein', e.target.value)}
                onBlur={() => handleFieldBlur('ein')}
                placeholder="12-3456789"
                className={getFieldError('ein') ? 'border-red-500' : ''}
              />
              {getFieldError('ein') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {getFieldError('ein')}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Company Description</Label>
            <Textarea
              id="description"
              value={companyInfo.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Brief description of your AI services company..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Business Address
          </CardTitle>
          <CardDescription>
            Primary business location for legal and service delivery purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              value={companyInfo.address || ''}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              onBlur={() => handleFieldBlur('address')}
              placeholder="123 AI Innovation Drive"
              className={getFieldError('address') ? 'border-red-500' : ''}
            />
            {getFieldError('address') && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {getFieldError('address')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={companyInfo.city || ''}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                onBlur={() => handleFieldBlur('city')}
                placeholder="San Francisco"
                className={getFieldError('city') ? 'border-red-500' : ''}
              />
              {getFieldError('city') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {getFieldError('city')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province *</Label>
              <Input
                id="state"
                value={companyInfo.state || ''}
                onChange={(e) => handleFieldChange('state', e.target.value)}
                onBlur={() => handleFieldBlur('state')}
                placeholder="CA"
                className={getFieldError('state') ? 'border-red-500' : ''}
              />
              {getFieldError('state') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {getFieldError('state')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP/Postal Code *</Label>
              <Input
                id="zipCode"
                value={companyInfo.zipCode || ''}
                onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                onBlur={() => handleFieldBlur('zipCode')}
                placeholder="94105"
                className={getFieldError('zipCode') ? 'border-red-500' : ''}
              />
              {getFieldError('zipCode') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {getFieldError('zipCode')}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={companyInfo.country || ''}
              onChange={(e) => handleFieldChange('country', e.target.value)}
              onBlur={() => handleFieldBlur('country')}
              placeholder="United States"
              className={getFieldError('country') ? 'border-red-500' : ''}
            />
            {getFieldError('country') && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {getFieldError('country')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Classification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Business Classification
          </CardTitle>
          <CardDescription>
            Help us understand your business structure and industry focus
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type *</Label>
              <Select
                value={companyInfo.businessType || ''}
                onValueChange={(value) => handleFieldChange('businessType', value)}
              >
                <SelectTrigger className={getFieldError('businessType') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getFieldError('businessType') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Business type is required
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySize">Company Size *</Label>
              <Select
                value={companyInfo.companySize || ''}
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
              <Label htmlFor="foundedYear">Founded Year *</Label>
              <Input
                id="foundedYear"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={companyInfo.foundedYear || ''}
                onChange={(e) => handleFieldChange('foundedYear', e.target.value)}
                onBlur={() => handleFieldBlur('foundedYear')}
                placeholder="2020"
                className={getFieldError('foundedYear') ? 'border-red-500' : ''}
              />
              {getFieldError('foundedYear') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Founded year is required
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryIndustry">Primary Industry *</Label>
              <Select
                value={companyInfo.primaryIndustry || ''}
                onValueChange={(value) => handleFieldChange('primaryIndustry', value)}
              >
                <SelectTrigger className={getFieldError('primaryIndustry') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select primary industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry.toLowerCase()}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getFieldError('primaryIndustry') && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Primary industry is required
                </p>
              )}
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
            Step 1 of 8 • Required fields marked with *
          </div>
          <Button onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}