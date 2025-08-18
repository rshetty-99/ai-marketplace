/**
 * Organization Profile Form
 * Comprehensive form for managing customer organization profile information
 */

'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { 
  Building2, 
  Users, 
  MapPin, 
  DollarSign,
  Target,
  Briefcase,
  Shield,
  Plus, 
  Trash2, 
  Upload,
  Edit,
  Camera,
  Globe,
  FileText,
  Calendar,
  Award
} from 'lucide-react';

import { EnhancedOrganizationProfile } from '@/lib/firebase/enhanced-profile-schema';
import { useFileUpload } from '@/hooks/useFileUpload';
import { FileType } from '@/lib/firebase/storage-architecture';

// Form validation schema
const organizationProfileSchema = z.object({
  organization: z.object({
    legalName: z.string().min(2, 'Organization name is required'),
    displayName: z.string().min(2, 'Display name is required'),
    description: z.string().min(50, 'Description must be at least 50 characters'),
    type: z.string().min(1, 'Organization type is required'),
    industry: z.array(z.string()).min(1, 'At least one industry is required'),
    size: z.string().min(1, 'Organization size is required'),
    founded: z.number().min(1800).max(new Date().getFullYear()).optional(),
    headquarters: z.object({
      street: z.string().optional(),
      city: z.string().min(1, 'City is required'),
      state: z.string().optional(),
      country: z.string().min(1, 'Country is required'),
      zipCode: z.string().optional()
    }),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
    socialMedia: z.object({
      linkedin: z.string().url().optional().or(z.literal('')),
      twitter: z.string().url().optional().or(z.literal('')),
      facebook: z.string().url().optional().or(z.literal(''))
    })
  }),
  requirements: z.object({
    projectTypes: z.array(z.string()).min(1, 'At least one project type is required'),
    budgetRange: z.object({
      min: z.number().min(1),
      max: z.number().min(1),
      currency: z.string().default('USD')
    }),
    timeline: z.object({
      typical: z.string(),
      urgent: z.boolean().default(false)
    }),
    preferredVendorSize: z.array(z.string()),
    technicalRequirements: z.array(z.string()),
    complianceRequirements: z.array(z.string())
  }),
  partnership: z.object({
    preferredEngagementTypes: z.array(z.string()),
    communicationPreferences: z.array(z.string()),
    reportingRequirements: z.array(z.string()),
    onboardingRequirements: z.array(z.string())
  }),
  contact: z.object({
    primaryEmail: z.string().email('Invalid email'),
    secondaryEmail: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().min(1, 'Phone number is required'),
    procurementEmail: z.string().email('Invalid email').optional().or(z.literal(''))
  })
});

type OrganizationProfileFormData = z.infer<typeof organizationProfileSchema>;

interface OrganizationProfileFormProps {
  profile: EnhancedOrganizationProfile | null;
  isLoading: boolean;
  onUpdate: (updates: Partial<EnhancedOrganizationProfile>) => Promise<void>;
  className?: string;
}

// Predefined options
const ORGANIZATION_TYPES = [
  'Private Company',
  'Public Company',
  'Non-Profit',
  'Government Agency',
  'Educational Institution',
  'Healthcare Organization',
  'Financial Institution',
  'Startup',
  'Enterprise',
  'Other'
];

const ORGANIZATION_SIZES = [
  'Startup (1-10 employees)',
  'Small (11-50 employees)',
  'Medium (51-200 employees)',
  'Large (201-1000 employees)',
  'Enterprise (1000+ employees)',
  'Government',
  'Non-Profit'
];

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'E-commerce', 'Education', 'Manufacturing',
  'Real Estate', 'Marketing', 'Consulting', 'Media', 'Government', 'Non-Profit',
  'Automotive', 'Energy', 'Agriculture', 'Retail', 'Transportation', 'Other'
];

const PROJECT_TYPES = [
  'Web Development', 'Mobile Development', 'Software Development', 'Data Science',
  'Digital Marketing', 'Design Services', 'Consulting', 'Infrastructure',
  'Security Services', 'AI/ML Projects', 'Cloud Migration', 'DevOps'
];

const VENDOR_SIZES = [
  'Freelancer (1 person)',
  'Small Team (2-10 people)',
  'Medium Agency (11-50 people)',
  'Large Agency (50+ people)',
  'Enterprise Vendor',
  'No Preference'
];

const ENGAGEMENT_TYPES = [
  'Fixed Price Projects',
  'Hourly/Time & Materials',
  'Retainer Agreements',
  'Outcome-Based Pricing',
  'Hybrid Models'
];

const COMMUNICATION_PREFERENCES = [
  'Daily Standup Meetings',
  'Weekly Status Reports',
  'Slack/Teams Integration',
  'Email Updates',
  'Project Management Tools',
  'Video Calls',
  'In-Person Meetings'
];

const COMPLIANCE_REQUIREMENTS = [
  'SOX Compliance',
  'HIPAA Compliance',
  'GDPR Compliance',
  'PCI DSS',
  'ISO 27001',
  'FedRAMP',
  'FISMA',
  'None Required'
];

export function OrganizationProfileForm({ 
  profile, 
  isLoading, 
  onUpdate,
  className 
}: OrganizationProfileFormProps) {
  const [activeTab, setActiveTab] = useState('organization');
  const { uploadFile } = useFileUpload();

  // Initialize form with profile data
  const form = useForm<OrganizationProfileFormData>({
    resolver: zodResolver(organizationProfileSchema),
    defaultValues: {
      organization: {
        legalName: profile?.organization?.legalName || '',
        displayName: profile?.organization?.displayName || '',
        description: profile?.organization?.description || '',
        type: profile?.organization?.type || '',
        industry: profile?.organization?.industry || [],
        size: profile?.organization?.size || '',
        founded: profile?.organization?.founded || undefined,
        headquarters: {
          street: profile?.organization?.headquarters?.street || '',
          city: profile?.organization?.headquarters?.city || '',
          state: profile?.organization?.headquarters?.state || '',
          country: profile?.organization?.headquarters?.country || '',
          zipCode: profile?.organization?.headquarters?.zipCode || ''
        },
        website: profile?.organization?.website || '',
        socialMedia: {
          linkedin: profile?.organization?.socialMedia?.linkedin || '',
          twitter: profile?.organization?.socialMedia?.twitter || '',
          facebook: profile?.organization?.socialMedia?.facebook || ''
        }
      },
      requirements: {
        projectTypes: profile?.requirements?.projectTypes || [],
        budgetRange: {
          min: profile?.requirements?.budgetRange?.min || 10000,
          max: profile?.requirements?.budgetRange?.max || 100000,
          currency: profile?.requirements?.budgetRange?.currency || 'USD'
        },
        timeline: {
          typical: profile?.requirements?.timeline?.typical || '3-6 months',
          urgent: profile?.requirements?.timeline?.urgent || false
        },
        preferredVendorSize: profile?.requirements?.preferredVendorSize || [],
        technicalRequirements: profile?.requirements?.technicalRequirements || [],
        complianceRequirements: profile?.requirements?.complianceRequirements || []
      },
      partnership: {
        preferredEngagementTypes: profile?.partnership?.preferredEngagementTypes || [],
        communicationPreferences: profile?.partnership?.communicationPreferences || [],
        reportingRequirements: profile?.partnership?.reportingRequirements || [],
        onboardingRequirements: profile?.partnership?.onboardingRequirements || []
      },
      contact: {
        primaryEmail: profile?.contact?.primaryEmail || '',
        secondaryEmail: profile?.contact?.secondaryEmail || '',
        phone: profile?.contact?.phone || '',
        procurementEmail: profile?.contact?.procurementEmail || ''
      }
    }
  });

  // Handle form submission
  const onSubmit = async (data: OrganizationProfileFormData) => {
    try {
      await onUpdate(data);
    } catch (error) {
      console.error('Failed to update organization profile:', error);
    }
  };

  // Handle logo upload
  const handleLogoUpload = async (file: File) => {
    try {
      const metadata = await uploadFile(file, FileType.ORGANIZATION_LOGO, {
        isPublic: true,
        description: 'Organization logo'
      });
      await onUpdate({
        branding: {
          ...profile?.branding,
          logo: metadata.downloadUrl
        }
      });
    } catch (error) {
      console.error('Logo upload failed:', error);
    }
  };

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Complete your onboarding to access organization profile settings
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="organization">Organization</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="partnership">Partnership</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            {/* Organization Information Tab */}
            <TabsContent value="organization" className="space-y-6">
              
              {/* Organization Branding */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Organization Branding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Logo Upload */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24 rounded-lg">
                        <AvatarImage src={profile.branding?.logo} alt="Organization logo" />
                        <AvatarFallback className="text-lg rounded-lg">
                          {profile.organization.legalName?.slice(0, 2).toUpperCase() || 'OR'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="logo-upload" className="cursor-pointer">
                        <Button type="button" variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Logo
                        </Button>
                      </Label>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            await handleLogoUpload(file);
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        PNG or SVG recommended. Square format preferred.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Organization Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Organization Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="organization.legalName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Legal Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corporation Inc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="organization.displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corp" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="organization.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your organization, mission, and what you do..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This will appear on your public profile ({field.value?.length || 0}/500)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="organization.type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ORGANIZATION_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="organization.size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Size</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ORGANIZATION_SIZES.map((size) => (
                                <SelectItem key={size} value={size}>
                                  {size}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="organization.founded"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Founded Year (optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1800" 
                              max={new Date().getFullYear()}
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Industries */}
                  <div className="space-y-2">
                    <FormLabel>Industries</FormLabel>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.watch('organization.industry').map((industry, index) => (
                        <Badge key={index} variant="secondary">
                          {industry}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-auto p-0"
                            onClick={() => {
                              const current = form.getValues('organization.industry');
                              form.setValue('organization.industry', current.filter((_, i) => i !== index));
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <Select
                      onValueChange={(value) => {
                        const current = form.getValues('organization.industry');
                        if (!current.includes(value)) {
                          form.setValue('organization.industry', [...current, value]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Add industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES
                          .filter(industry => !form.watch('organization.industry').includes(industry))
                          .map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Address and Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Headquarters Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  <FormField
                    control={form.control}
                    name="organization.headquarters.street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Business Street" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="organization.headquarters.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="organization.headquarters.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="organization.headquarters.country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="United States" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="organization.headquarters.zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP/Postal Code (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Web Presence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Web Presence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  <FormField
                    control={form.control}
                    name="organization.website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourcompany.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="organization.socialMedia.linkedin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://linkedin.com/company/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="organization.socialMedia.twitter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://twitter.com/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="organization.socialMedia.facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://facebook.com/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Requirements Tab */}
            <TabsContent value="requirements" className="space-y-6">
              
              {/* Project Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Project Requirements
                  </CardTitle>
                  <CardDescription>
                    Define what types of projects and services you typically need
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Project Types */}
                  <div className="space-y-2">
                    <FormLabel>Typical Project Types</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {PROJECT_TYPES.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Switch
                            id={type}
                            checked={form.watch('requirements.projectTypes').includes(type)}
                            onCheckedChange={(checked) => {
                              const current = form.getValues('requirements.projectTypes');
                              const updated = checked 
                                ? [...current, type]
                                : current.filter(t => t !== type);
                              form.setValue('requirements.projectTypes', updated);
                            }}
                          />
                          <Label htmlFor={type} className="text-sm">
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Budget Range */}
                  <div className="space-y-4">
                    <FormLabel>Typical Budget Range</FormLabel>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="requirements.budgetRange.min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Budget</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="requirements.budgetRange.max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Budget</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="requirements.budgetRange.currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                                <SelectItem value="CAD">CAD</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Timeline */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="requirements.timeline.typical"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Typical Project Timeline</FormLabel>
                            <FormControl>
                              <Input placeholder="3-6 months" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="requirements.timeline.urgent"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Accept Urgent Projects</FormLabel>
                              <FormDescription>
                                Projects with tight deadlines or rush delivery
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vendor Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Vendor Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Preferred Vendor Sizes */}
                  <div className="space-y-2">
                    <FormLabel>Preferred Vendor Sizes</FormLabel>
                    <div className="space-y-2">
                      {VENDOR_SIZES.map((size) => (
                        <div key={size} className="flex items-center space-x-2">
                          <Switch
                            id={size}
                            checked={form.watch('requirements.preferredVendorSize').includes(size)}
                            onCheckedChange={(checked) => {
                              const current = form.getValues('requirements.preferredVendorSize');
                              const updated = checked 
                                ? [...current, size]
                                : current.filter(s => s !== size);
                              form.setValue('requirements.preferredVendorSize', updated);
                            }}
                          />
                          <Label htmlFor={size} className="text-sm">
                            {size}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Compliance Requirements */}
                  <div className="space-y-2">
                    <FormLabel>Compliance Requirements</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {COMPLIANCE_REQUIREMENTS.map((requirement) => (
                        <div key={requirement} className="flex items-center space-x-2">
                          <Switch
                            id={requirement}
                            checked={form.watch('requirements.complianceRequirements').includes(requirement)}
                            onCheckedChange={(checked) => {
                              const current = form.getValues('requirements.complianceRequirements');
                              const updated = checked 
                                ? [...current, requirement]
                                : current.filter(r => r !== requirement);
                              form.setValue('requirements.complianceRequirements', updated);
                            }}
                          />
                          <Label htmlFor={requirement} className="text-sm">
                            {requirement}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Partnership Tab */}
            <TabsContent value="partnership" className="space-y-6">
              
              {/* Engagement Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Engagement Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Engagement Types */}
                  <div className="space-y-2">
                    <FormLabel>Preferred Engagement Types</FormLabel>
                    <div className="space-y-2">
                      {ENGAGEMENT_TYPES.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Switch
                            id={type}
                            checked={form.watch('partnership.preferredEngagementTypes').includes(type)}
                            onCheckedChange={(checked) => {
                              const current = form.getValues('partnership.preferredEngagementTypes');
                              const updated = checked 
                                ? [...current, type]
                                : current.filter(t => t !== type);
                              form.setValue('partnership.preferredEngagementTypes', updated);
                            }}
                          />
                          <Label htmlFor={type} className="text-sm">
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Communication Preferences */}
                  <div className="space-y-2">
                    <FormLabel>Communication Preferences</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {COMMUNICATION_PREFERENCES.map((preference) => (
                        <div key={preference} className="flex items-center space-x-2">
                          <Switch
                            id={preference}
                            checked={form.watch('partnership.communicationPreferences').includes(preference)}
                            onCheckedChange={(checked) => {
                              const current = form.getValues('partnership.communicationPreferences');
                              const updated = checked 
                                ? [...current, preference]
                                : current.filter(p => p !== preference);
                              form.setValue('partnership.communicationPreferences', updated);
                            }}
                          />
                          <Label htmlFor={preference} className="text-sm">
                            {preference}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Partnership Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FormLabel>Reporting Requirements</FormLabel>
                      <Textarea 
                        placeholder="Describe your reporting needs..."
                        rows={3}
                        value={form.watch('partnership.reportingRequirements').join('\n')}
                        onChange={(e) => {
                          const requirements = e.target.value.split('\n').filter(r => r.trim());
                          form.setValue('partnership.reportingRequirements', requirements);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <FormLabel>Onboarding Requirements</FormLabel>
                      <Textarea 
                        placeholder="Describe your onboarding process..."
                        rows={3}
                        value={form.watch('partnership.onboardingRequirements').join('\n')}
                        onChange={(e) => {
                          const requirements = e.target.value.split('\n').filter(r => r.trim());
                          form.setValue('partnership.onboardingRequirements', requirements);
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-6">
              
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    Primary contact details for vendor communications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contact.primaryEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Email</FormLabel>
                          <FormControl>
                            <Input placeholder="contact@yourcompany.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact.secondaryEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Email (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="backup@yourcompany.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contact.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact.procurementEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Procurement Email (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="procurement@yourcompany.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            For contract and purchase order communications
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t">
            <Button 
              type="submit" 
              disabled={isLoading || !form.formState.isDirty}
              className="min-w-32"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-b-transparent mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default OrganizationProfileForm;