/**
 * Vendor Profile Form
 * Comprehensive form for managing vendor company profile information
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
import { Switch } from '@/components/ui/switch';
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
  Building, 
  Users, 
  MapPin, 
  Globe, 
  DollarSign,
  Star,
  Plus, 
  Trash2, 
  Upload,
  Award,
  Shield,
  FileText,
  Camera,
  Edit,
  ExternalLink
} from 'lucide-react';

import { EnhancedVendorProfile } from '@/lib/firebase/enhanced-profile-schema';
import { useFileUpload } from '@/hooks/useFileUpload';
import { FileType } from '@/lib/firebase/storage-architecture';

// Form validation schema
const vendorProfileSchema = z.object({
  company: z.object({
    legalName: z.string().min(2, 'Legal name is required'),
    brandName: z.string().min(2, 'Brand name is required'),
    description: z.string().min(50, 'Description must be at least 50 characters'),
    foundedYear: z.number().min(1900).max(new Date().getFullYear()),
    employeeCount: z.number().min(1),
    headquarters: z.object({
      street: z.string().optional(),
      city: z.string().min(1, 'City is required'),
      state: z.string().optional(),
      country: z.string().min(1, 'Country is required'),
      zipCode: z.string().optional()
    }),
    website: z.string().url('Invalid website URL'),
    industry: z.array(z.string()).min(1, 'At least one industry is required')
  }),
  services: z.object({
    primaryServices: z.array(z.object({
      name: z.string(),
      category: z.string(),
      description: z.string(),
      priceRange: z.object({
        min: z.number(),
        max: z.number()
      })
    })),
    expertise: z.array(z.string()),
    industries: z.array(z.string()),
    methodologies: z.array(z.string()),
    technologies: z.array(z.string())
  }),
  business: z.object({
    minimumEngagement: z.object({
      duration: z.string(),
      budget: z.number().min(1)
    }),
    preferredClientSize: z.array(z.string())
  }),
  contact: z.object({
    salesEmail: z.string().email('Invalid email'),
    supportEmail: z.string().email('Invalid email'),
    phone: z.string().min(1, 'Phone number is required')
  })
});

type VendorProfileFormData = z.infer<typeof vendorProfileSchema>;

interface VendorProfileFormProps {
  profile: EnhancedVendorProfile | null;
  isLoading: boolean;
  onUpdate: (updates: Partial<EnhancedVendorProfile>) => Promise<void>;
  onUpdateCompany: (company: any) => Promise<void>;
  onUpdateServices: (services: any) => Promise<void>;
  onAddCaseStudy: (caseStudy: any) => Promise<void>;
  className?: string;
}

// Predefined options
const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'E-commerce', 'Education', 'Manufacturing',
  'Real Estate', 'Marketing', 'Consulting', 'Media', 'Government', 'Non-Profit',
  'Automotive', 'Energy', 'Agriculture', 'Retail', 'Transportation', 'Other'
];

const SERVICE_CATEGORIES = [
  'Web Development', 'Mobile Development', 'UI/UX Design', 'Data Science',
  'DevOps', 'Cloud Services', 'Cybersecurity', 'AI/ML', 'Blockchain',
  'Digital Marketing', 'Content Creation', 'Business Consulting', 'Other'
];

const METHODOLOGIES = [
  'Agile', 'Scrum', 'Kanban', 'Waterfall', 'Lean', 'DevOps', 'Design Thinking',
  'Six Sigma', 'ITIL', 'SAFe', 'Extreme Programming', 'Feature-Driven Development'
];

const TECHNOLOGIES = [
  'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'C#', 'PHP',
  'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'PostgreSQL',
  'MongoDB', 'Redis', 'Elasticsearch', 'TensorFlow', 'PyTorch'
];

const CLIENT_SIZES = [
  'Startup (1-10 employees)',
  'Small Business (11-50 employees)',
  'Medium Business (51-200 employees)',
  'Large Enterprise (200+ employees)',
  'Fortune 500',
  'Government',
  'Non-Profit'
];

export function VendorProfileForm({ 
  profile, 
  isLoading, 
  onUpdate, 
  onUpdateCompany, 
  onUpdateServices, 
  onAddCaseStudy,
  className 
}: VendorProfileFormProps) {
  const [activeTab, setActiveTab] = useState('company');
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isAddTeamMemberOpen, setIsAddTeamMemberOpen] = useState(false);
  const { uploadFile } = useFileUpload();

  // Initialize form with profile data
  const form = useForm<VendorProfileFormData>({
    resolver: zodResolver(vendorProfileSchema),
    defaultValues: {
      company: {
        legalName: profile?.company?.legalName || '',
        brandName: profile?.company?.brandName || '',
        description: profile?.company?.description || '',
        foundedYear: profile?.company?.foundedYear || new Date().getFullYear(),
        employeeCount: profile?.company?.employeeCount || 1,
        headquarters: {
          street: profile?.company?.headquarters?.street || '',
          city: profile?.company?.headquarters?.city || '',
          state: profile?.company?.headquarters?.state || '',
          country: profile?.company?.headquarters?.country || '',
          zipCode: profile?.company?.headquarters?.zipCode || ''
        },
        website: profile?.company?.website || '',
        industry: profile?.company?.industry || []
      },
      services: {
        primaryServices: profile?.services?.primaryServices || [],
        expertise: profile?.services?.expertise || [],
        industries: profile?.services?.industries || [],
        methodologies: profile?.services?.methodologies || [],
        technologies: profile?.services?.technologies || []
      },
      business: {
        minimumEngagement: {
          duration: profile?.business?.minimumEngagement?.duration || '1 month',
          budget: profile?.business?.minimumEngagement?.budget || 10000
        },
        preferredClientSize: profile?.business?.preferredClientSize || []
      },
      contact: {
        salesEmail: profile?.contact?.salesEmail || '',
        supportEmail: profile?.contact?.supportEmail || '',
        phone: profile?.contact?.phone || ''
      }
    }
  });

  // Handle form submission
  const onSubmit = async (data: VendorProfileFormData) => {
    try {
      await onUpdate(data);
    } catch (error) {
      console.error('Failed to update vendor profile:', error);
    }
  };

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Complete your onboarding to access vendor profile settings
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="company">Company</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="showcase">Showcase</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
            </TabsList>

            {/* Company Information Tab */}
            <TabsContent value="company" className="space-y-6">
              
              {/* Company Branding */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Company Branding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Logo Upload */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24 rounded-lg">
                        <AvatarImage src={profile.branding?.logo} alt="Company logo" />
                        <AvatarFallback className="text-lg rounded-lg">
                          {profile.company.legalName?.slice(0, 2).toUpperCase() || 'CO'}
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
                            try {
                              const metadata = await uploadFile(file, FileType.VENDOR_LOGO, {
                                isPublic: true,
                                description: 'Company logo'
                              });
                              await onUpdate({
                                branding: {
                                  ...profile.branding,
                                  logo: metadata.downloadUrl
                                }
                              });
                            } catch (error) {
                              console.error('Logo upload failed:', error);
                            }
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

              {/* Basic Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="company.legalName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Legal Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Legal business name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company.brandName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Public-facing brand name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="company.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your company, mission, and what makes you unique..."
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
                      name="company.foundedYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Founded Year</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1900" 
                              max={new Date().getFullYear()}
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
                      name="company.employeeCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee Count</FormLabel>
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
                      name="company.website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourcompany.com" {...field} />
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
                      {form.watch('company.industry').map((industry, index) => (
                        <Badge key={index} variant="secondary">
                          {industry}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-auto p-0"
                            onClick={() => {
                              const current = form.getValues('company.industry');
                              form.setValue('company.industry', current.filter((_, i) => i !== index));
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <Select
                      onValueChange={(value) => {
                        const current = form.getValues('company.industry');
                        if (!current.includes(value)) {
                          form.setValue('company.industry', [...current, value]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Add industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES
                          .filter(industry => !form.watch('company.industry').includes(industry))
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

              {/* Company Address */}
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
                    name="company.headquarters.street"
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
                      name="company.headquarters.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="San Francisco" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company.headquarters.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="California" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="company.headquarters.country"
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
                      name="company.headquarters.zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP/Postal Code (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="94105" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6">
              
              {/* Primary Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Primary Services</CardTitle>
                  <CardDescription>
                    The main services your company offers to clients
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {profile.services?.primaryServices?.map((service, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{service.name}</h4>
                          <Badge variant="outline">{service.category}</Badge>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                          <p className="text-sm">
                            Price range: ${service.priceRange?.min.toLocaleString()} - ${service.priceRange?.max.toLocaleString()}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Service
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Primary Service</DialogTitle>
                        <DialogDescription>
                          Add a service that your company specializes in
                        </DialogDescription>
                      </DialogHeader>
                      <ServiceForm onSubmit={async (service) => {
                        const updatedServices = {
                          ...profile.services,
                          primaryServices: [...(profile.services?.primaryServices || []), service]
                        };
                        await onUpdateServices(updatedServices);
                        setIsAddServiceOpen(false);
                      }} />
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Expertise Areas */}
              <Card>
                <CardHeader>
                  <CardTitle>Expertise & Technologies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Expertise */}
                  <div className="space-y-2">
                    <Label>Areas of Expertise</Label>
                    <div className="flex flex-wrap gap-2">
                      {profile.services?.expertise?.map((item, index) => (
                        <Badge key={index} variant="secondary">
                          {item}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-auto p-0"
                            onClick={async () => {
                              const updatedServices = {
                                ...profile.services,
                                expertise: profile.services?.expertise?.filter(e => e !== item) || []
                              };
                              await onUpdateServices(updatedServices);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <MultiSelectInput
                      options={SERVICE_CATEGORIES}
                      selectedValues={profile.services?.expertise || []}
                      onAdd={async (value) => {
                        const updatedServices = {
                          ...profile.services,
                          expertise: [...(profile.services?.expertise || []), value]
                        };
                        await onUpdateServices(updatedServices);
                      }}
                      placeholder="Add expertise area"
                    />
                  </div>

                  <Separator />

                  {/* Technologies */}
                  <div className="space-y-2">
                    <Label>Technologies & Tools</Label>
                    <div className="flex flex-wrap gap-2">
                      {profile.services?.technologies?.map((tech, index) => (
                        <Badge key={index} variant="outline">
                          {tech}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-auto p-0"
                            onClick={async () => {
                              const updatedServices = {
                                ...profile.services,
                                technologies: profile.services?.technologies?.filter(t => t !== tech) || []
                              };
                              await onUpdateServices(updatedServices);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <MultiSelectInput
                      options={TECHNOLOGIES}
                      selectedValues={profile.services?.technologies || []}
                      onAdd={async (value) => {
                        const updatedServices = {
                          ...profile.services,
                          technologies: [...(profile.services?.technologies || []), value]
                        };
                        await onUpdateServices(updatedServices);
                      }}
                      placeholder="Add technology"
                    />
                  </div>

                  <Separator />

                  {/* Methodologies */}
                  <div className="space-y-2">
                    <Label>Methodologies & Frameworks</Label>
                    <div className="flex flex-wrap gap-2">
                      {profile.services?.methodologies?.map((method, index) => (
                        <Badge key={index} variant="outline">
                          {method}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-auto p-0"
                            onClick={async () => {
                              const updatedServices = {
                                ...profile.services,
                                methodologies: profile.services?.methodologies?.filter(m => m !== method) || []
                              };
                              await onUpdateServices(updatedServices);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <MultiSelectInput
                      options={METHODOLOGIES}
                      selectedValues={profile.services?.methodologies || []}
                      onAdd={async (value) => {
                        const updatedServices = {
                          ...profile.services,
                          methodologies: [...(profile.services?.methodologies || []), value]
                        };
                        await onUpdateServices(updatedServices);
                      }}
                      placeholder="Add methodology"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-6">
              <TeamManagementSection profile={profile} onUpdate={onUpdate} />
            </TabsContent>

            {/* Showcase Tab */}
            <TabsContent value="showcase" className="space-y-6">
              <ShowcaseSection profile={profile} onAddCaseStudy={onAddCaseStudy} />
            </TabsContent>

            {/* Business Tab */}
            <TabsContent value="business" className="space-y-6">
              
              {/* Business Terms */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Business Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="business.minimumEngagement.duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Engagement Duration</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 3 months" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="business.minimumEngagement.budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Project Budget ($)</FormLabel>
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

                  {/* Preferred Client Sizes */}
                  <div className="space-y-2">
                    <Label>Preferred Client Sizes</Label>
                    <div className="space-y-2">
                      {CLIENT_SIZES.map((size) => (
                        <div key={size} className="flex items-center space-x-2">
                          <Switch
                            id={size}
                            checked={form.watch('business.preferredClientSize').includes(size)}
                            onCheckedChange={(checked) => {
                              const current = form.getValues('business.preferredClientSize');
                              const updated = checked 
                                ? [...current, size]
                                : current.filter(s => s !== size);
                              form.setValue('business.preferredClientSize', updated);
                            }}
                          />
                          <Label htmlFor={size} className="text-sm">
                            {size}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Business Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contact.salesEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sales Email</FormLabel>
                          <FormControl>
                            <Input placeholder="sales@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact.supportEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Support Email</FormLabel>
                          <FormControl>
                            <Input placeholder="support@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="contact.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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

// Service Form Component
function ServiceForm({ onSubmit }: { onSubmit: (service: any) => void }) {
  const [serviceData, setServiceData] = useState({
    name: '',
    category: '',
    description: '',
    priceRange: { min: 1000, max: 10000 }
  });

  const handleSubmit = () => {
    if (serviceData.name && serviceData.category && serviceData.description) {
      onSubmit(serviceData);
      setServiceData({
        name: '',
        category: '',
        description: '',
        priceRange: { min: 1000, max: 10000 }
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Service Name</Label>
        <Input 
          placeholder="e.g., Custom Web Development"
          value={serviceData.name}
          onChange={(e) => setServiceData({...serviceData, name: e.target.value})}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Category</Label>
        <Select onValueChange={(value) => setServiceData({...serviceData, category: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea 
          placeholder="Describe this service..."
          rows={3}
          value={serviceData.description}
          onChange={(e) => setServiceData({...serviceData, description: e.target.value})}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Min Price ($)</Label>
          <Input 
            type="number"
            value={serviceData.priceRange.min}
            onChange={(e) => setServiceData({
              ...serviceData, 
              priceRange: {...serviceData.priceRange, min: parseInt(e.target.value) || 0}
            })}
          />
        </div>
        <div className="space-y-2">
          <Label>Max Price ($)</Label>
          <Input 
            type="number"
            value={serviceData.priceRange.max}
            onChange={(e) => setServiceData({
              ...serviceData, 
              priceRange: {...serviceData.priceRange, max: parseInt(e.target.value) || 0}
            })}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={!serviceData.name || !serviceData.category}>
          Add Service
        </Button>
      </DialogFooter>
    </div>
  );
}

// Multi-Select Input Component
function MultiSelectInput({ 
  options, 
  onAdd, 
  placeholder,
  selectedValues = []
}: { 
  options: string[]; 
  onAdd: (value: string) => void; 
  placeholder: string;
  selectedValues?: string[];
}) {
  const [customValue, setCustomValue] = useState('');
  
  const availableOptions = options.filter(option => !selectedValues.includes(option));
  
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select onValueChange={(value) => {
          onAdd(value);
        }}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {availableOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex gap-2">
        <Input 
          placeholder="Or add custom option..."
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && customValue.trim()) {
              onAdd(customValue.trim());
              setCustomValue('');
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (customValue.trim()) {
              onAdd(customValue.trim());
              setCustomValue('');
            }
          }}
          disabled={!customValue.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Team Management Section
function TeamManagementSection({ profile, onUpdate }: { profile: any; onUpdate: any }) {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* Leadership Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Leadership Team
          </CardTitle>
          <CardDescription>
            Showcase key leadership and decision makers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profile.team?.leadership?.length > 0 ? (
              <div className="grid gap-4">
                {profile.team.leadership.map((member: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>
                        {member.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">{member.title}</div>
                      <div className="text-xs text-muted-foreground">{member.department}</div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No leadership team members added yet</p>
              </div>
            )}
            
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Leadership Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Leadership Member</DialogTitle>
                  <DialogDescription>
                    Add a key leadership team member to showcase
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input placeholder="John Smith" />
                    </div>
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input placeholder="Chief Executive Officer" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input placeholder="Executive" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bio (optional)</Label>
                    <Textarea placeholder="Brief professional background..." rows={3} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsAddMemberOpen(false)}>
                    Add Member
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
      
      {/* Team Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Team Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{profile.company?.employeeCount || 0}</div>
              <div className="text-xs text-muted-foreground">Total Employees</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{profile.team?.leadership?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Leadership</div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{profile.team?.departments?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Departments</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Showcase Section
function ShowcaseSection({ profile, onAddCaseStudy }: { profile: any; onAddCaseStudy: any }) {
  const [isAddCaseStudyOpen, setIsAddCaseStudyOpen] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* Featured Case Studies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Featured Case Studies
          </CardTitle>
          <CardDescription>
            Showcase your most successful client projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profile.showcase?.caseStudies?.length > 0 ? (
              <div className="grid gap-4">
                {profile.showcase.caseStudies.map((caseStudy: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{caseStudy.title}</h4>
                        <p className="text-sm text-muted-foreground">{caseStudy.clientName}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {caseStudy.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {caseStudy.technologies?.slice(0, 3).map((tech: string) => (
                          <Badge key={tech} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {caseStudy.duration}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium mb-2">No case studies yet</p>
                <p className="text-sm">Add your first case study to showcase your work</p>
              </div>
            )}
            
            <Dialog open={isAddCaseStudyOpen} onOpenChange={setIsAddCaseStudyOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Case Study
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Case Study</DialogTitle>
                  <DialogDescription>
                    Showcase a successful client project
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Project Title</Label>
                      <Input placeholder="Enterprise E-commerce Platform" />
                    </div>
                    <div className="space-y-2">
                      <Label>Client Name</Label>
                      <Input placeholder="Acme Corporation" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Project Description</Label>
                    <Textarea placeholder="Describe the project scope and objectives..." rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input placeholder="6 months" />
                    </div>
                    <div className="space-y-2">
                      <Label>Team Size</Label>
                      <Input type="number" placeholder="8" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Challenge</Label>
                    <Textarea placeholder="What challenges did you solve?" rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Solution</Label>
                    <Textarea placeholder="How did you address the challenges?" rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Results</Label>
                    <Textarea placeholder="What were the measurable outcomes?" rows={2} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddCaseStudyOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsAddCaseStudyOpen(false)}>
                    Add Case Study
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
      
      {/* Company Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Company Assets
          </CardTitle>
          <CardDescription>
            Brochures, whitepapers, and other marketing materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Upload company brochures and materials</p>
            <Button variant="outline" className="mt-3">
              <Upload className="h-4 w-4 mr-2" />
              Upload Materials
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VendorProfileForm;