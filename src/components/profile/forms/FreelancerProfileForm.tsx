/**
 * Freelancer Profile Form
 * Comprehensive form for managing freelancer-specific profile information
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { 
  Briefcase, 
  DollarSign, 
  Clock, 
  Star, 
  Plus, 
  Trash2, 
  Upload,
  Award,
  Code,
  Globe,
  Users
} from 'lucide-react';

import { EnhancedFreelancerProfile } from '@/lib/firebase/enhanced-profile-schema';
import { SkillSelector } from '../components/SkillSelector';
import { PortfolioProjectForm } from '../components/PortfolioProjectForm';
import { TestimonialDisplay } from '../components/TestimonialDisplay';

// Form validation schema
const freelancerProfileSchema = z.object({
  professional: z.object({
    title: z.string().min(2, 'Professional title is required'),
    experience: z.number().min(0).max(50),
    specializations: z.array(z.string()),
    availability: z.object({
      status: z.enum(['available', 'busy', 'unavailable']),
      hoursPerWeek: z.number().min(1).max(80),
      timezone: z.string()
    }),
    pricing: z.object({
      hourlyRate: z.object({
        min: z.number().min(1),
        max: z.number().min(1),
        currency: z.string()
      }),
      projectRates: z.object({
        small: z.number().min(1),
        medium: z.number().min(1),
        large: z.number().min(1)
      }),
      preferredPaymentTerms: z.array(z.string())
    })
  }),
  skills: z.object({
    primary: z.array(z.object({
      name: z.string(),
      level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
      yearsOfExperience: z.number().min(0),
      isVerified: z.boolean()
    })),
    secondary: z.array(z.object({
      name: z.string(),
      level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
      yearsOfExperience: z.number().min(0),
      isVerified: z.boolean()
    })),
    tools: z.array(z.string()),
    languages: z.array(z.object({
      language: z.string(),
      proficiency: z.enum(['basic', 'conversational', 'fluent', 'native']),
      isVerified: z.boolean()
    }))
  }),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().max(160).optional(),
    keywords: z.array(z.string()),
    socialMediaLinks: z.array(z.object({
      platform: z.string(),
      url: z.string().url(),
      isVerified: z.boolean()
    }))
  })
});

type FreelancerProfileFormData = z.infer<typeof freelancerProfileSchema>;

interface FreelancerProfileFormProps {
  profile: EnhancedFreelancerProfile | null;
  isLoading: boolean;
  onUpdate: (updates: Partial<EnhancedFreelancerProfile>) => Promise<void>;
  onUpdateSkills: (skills: any) => Promise<void>;
  onUpdatePricing: (pricing: any) => Promise<void>;
  onAddProject: (project: any) => Promise<void>;
  className?: string;
}

// Predefined options
const AVAILABILITY_STATUS = [
  { value: 'available', label: 'Available for new projects' },
  { value: 'busy', label: 'Busy (limited availability)' },
  { value: 'unavailable', label: 'Currently unavailable' }
];

const PAYMENT_TERMS = [
  'hourly', 'milestone', 'fixed_price', 'retainer', 'weekly', 'monthly'
];

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' }
];

const SOCIAL_PLATFORMS = [
  'linkedin', 'github', 'twitter', 'behance', 'dribbble', 'website', 'other'
];

export function FreelancerProfileForm({ 
  profile, 
  isLoading, 
  onUpdate, 
  onUpdateSkills, 
  onUpdatePricing, 
  onAddProject,
  className 
}: FreelancerProfileFormProps) {
  const [activeTab, setActiveTab] = useState('professional');

  // Initialize form with profile data
  const form = useForm<FreelancerProfileFormData>({
    resolver: zodResolver(freelancerProfileSchema),
    defaultValues: {
      professional: {
        title: profile?.professional?.title || '',
        experience: profile?.professional?.experience || 0,
        specializations: profile?.professional?.specializations || [],
        availability: {
          status: profile?.professional?.availability?.status || 'available',
          hoursPerWeek: profile?.professional?.availability?.hoursPerWeek || 40,
          timezone: profile?.professional?.availability?.timezone || 'UTC'
        },
        pricing: {
          hourlyRate: {
            min: profile?.professional?.pricing?.hourlyRate?.min || 50,
            max: profile?.professional?.pricing?.hourlyRate?.max || 150,
            currency: profile?.professional?.pricing?.hourlyRate?.currency || 'USD'
          },
          projectRates: {
            small: profile?.professional?.pricing?.projectRates?.small || 2000,
            medium: profile?.professional?.pricing?.projectRates?.medium || 10000,
            large: profile?.professional?.pricing?.projectRates?.large || 50000
          },
          preferredPaymentTerms: profile?.professional?.pricing?.preferredPaymentTerms || []
        }
      },
      skills: {
        primary: profile?.skills?.primary || [],
        secondary: profile?.skills?.secondary || [],
        tools: profile?.skills?.tools || [],
        languages: profile?.skills?.languages || []
      },
      seo: {
        metaTitle: profile?.seo?.metaTitle || '',
        metaDescription: profile?.seo?.metaDescription || '',
        keywords: profile?.seo?.keywords || [],
        socialMediaLinks: profile?.seo?.socialMediaLinks || []
      }
    }
  });

  // Field arrays for dynamic forms
  const { fields: specializationFields, append: addSpecialization, remove: removeSpecialization } = 
    useFieldArray({ control: form.control, name: 'professional.specializations' });
  
  const { fields: keywordFields, append: addKeyword, remove: removeKeyword } = 
    useFieldArray({ control: form.control, name: 'seo.keywords' });
  
  const { fields: socialFields, append: addSocial, remove: removeSocial } = 
    useFieldArray({ control: form.control, name: 'seo.socialMediaLinks' });

  // Handle form submission
  const onSubmit = async (data: FreelancerProfileFormData) => {
    try {
      await onUpdate(data);
    } catch (error) {
      console.error('Failed to update freelancer profile:', error);
    }
  };

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Complete your onboarding to access freelancer profile settings
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
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="skills">Skills & Expertise</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="seo">SEO & Social</TabsTrigger>
            </TabsList>

            {/* Professional Information Tab */}
            <TabsContent value="professional" className="space-y-6">
              
              {/* Basic Professional Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  <FormField
                    control={form.control}
                    name="professional.title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Full-Stack Developer" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your main professional title or role
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="professional.experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="50"
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Specializations */}
                  <div className="space-y-2">
                    <FormLabel>Specializations</FormLabel>
                    <div className="space-y-2">
                      {profile.professional.specializations.map((spec, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge variant="secondary">{spec}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updated = profile.professional.specializations.filter((_, i) => i !== index);
                              onUpdate({
                                professional: {
                                  ...profile.professional,
                                  specializations: updated
                                }
                              });
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Availability */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Availability
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  <FormField
                    control={form.control}
                    name="professional.availability.status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AVAILABILITY_STATUS.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
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
                    name="professional.availability.hoursPerWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Hours per Week</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="80"
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pricing & Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Hourly Rates */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Hourly Rates</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="professional.pricing.hourlyRate.min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Rate</FormLabel>
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
                        name="professional.pricing.hourlyRate.max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Rate</FormLabel>
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
                        name="professional.pricing.hourlyRate.currency"
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
                                {CURRENCIES.map((currency) => (
                                  <SelectItem key={currency.value} value={currency.value}>
                                    {currency.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Project Rates */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Project-Based Rates</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="professional.pricing.projectRates.small"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Small Projects (&lt; 40 hrs)</FormLabel>
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
                        name="professional.pricing.projectRates.medium"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medium Projects (40-200 hrs)</FormLabel>
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
                        name="professional.pricing.projectRates.large"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Large Projects (200+ hrs)</FormLabel>
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
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Terms */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Preferred Payment Terms</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {PAYMENT_TERMS.map((term) => (
                        <div key={term} className="flex items-center space-x-2">
                          <Switch
                            id={term}
                            checked={form.watch('professional.pricing.preferredPaymentTerms').includes(term)}
                            onCheckedChange={(checked) => {
                              const current = form.getValues('professional.pricing.preferredPaymentTerms');
                              const updated = checked 
                                ? [...current, term]
                                : current.filter(t => t !== term);
                              form.setValue('professional.pricing.preferredPaymentTerms', updated);
                            }}
                          />
                          <Label htmlFor={term} className="capitalize">
                            {term.replace('_', ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skills & Expertise Tab */}
            <TabsContent value="skills" className="space-y-6">
              <SkillSelector 
                profile={profile}
                onUpdate={onUpdateSkills}
              />
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Projects</CardTitle>
                  <CardDescription>
                    Showcase your best work to attract clients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PortfolioProjectForm 
                    projects={profile.portfolio.projects}
                    onAddProject={onAddProject}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Client Testimonials</CardTitle>
                  <CardDescription>
                    Display reviews and feedback from previous clients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TestimonialDisplay 
                    testimonials={profile.portfolio.testimonials}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO & Social Tab */}
            <TabsContent value="seo" className="space-y-6">
              
              {/* SEO Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    SEO Settings
                  </CardTitle>
                  <CardDescription>
                    Optimize your profile for search engines
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  <FormField
                    control={form.control}
                    name="seo.metaTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Professional title for search results" {...field} />
                        </FormControl>
                        <FormDescription>
                          Appears in search engine results (50-60 characters recommended)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seo.metaDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description for search engines..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Brief description for search results ({field.value?.length || 0}/160 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Keywords */}
                  <div className="space-y-2">
                    <FormLabel>Keywords</FormLabel>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {profile.seo.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-auto p-0"
                            onClick={() => {
                              const updated = profile.seo.keywords.filter((_, i) => i !== index);
                              onUpdate({
                                seo: {
                                  ...profile.seo,
                                  keywords: updated
                                }
                              });
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Add keyword..." />
                      <Button type="button" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Social Media & Portfolio Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.seo.socialMediaLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {link.platform}
                      </Badge>
                      <Input value={link.url} readOnly className="flex-1" />
                      <Button type="button" variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button type="button" variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Social Link
                  </Button>
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

export default FreelancerProfileForm;