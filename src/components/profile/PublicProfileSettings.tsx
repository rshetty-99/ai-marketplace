/**
 * Public Profile Settings Component
 * Manage visibility, SEO, and public profile configuration
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { 
  Globe, 
  Eye, 
  EyeOff,
  Search,
  Share,
  Settings,
  Link,
  Check,
  X,
  ExternalLink,
  Copy,
  QrCode,
  Download,
  Palette,
  Shield,
  AlertTriangle,
  Info
} from 'lucide-react';

import { useProfile } from '@/hooks/useProfile';

interface PublicProfileSettingsProps {
  className?: string;
}

// Form validation schemas
const seoSettingsSchema = z.object({
  metaTitle: z.string().min(10, 'Title must be at least 10 characters').max(60, 'Title must be under 60 characters'),
  metaDescription: z.string().min(50, 'Description must be at least 50 characters').max(160, 'Description must be under 160 characters'),
  keywords: z.array(z.string()).min(1, 'Add at least one keyword'),
  focusKeyword: z.string().min(1, 'Focus keyword is required'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
});

const visibilitySettingsSchema = z.object({
  isPublic: z.boolean(),
  searchEngineIndexing: z.boolean(),
  showInDirectory: z.boolean(),
  allowDirectContact: z.boolean(),
  showPricing: z.boolean(),
  showAvailability: z.boolean(),
  showLocation: z.boolean(),
  showContact: z.boolean()
});

const socialSharingSchema = z.object({
  openGraphImage: z.string().url().optional().or(z.literal('')),
  twitterCard: z.enum(['summary', 'summary_large_image']),
  customMessage: z.string().max(280, 'Message must be under 280 characters').optional()
});

type SEOSettingsData = z.infer<typeof seoSettingsSchema>;
type VisibilitySettingsData = z.infer<typeof visibilitySettingsSchema>;
type SocialSharingData = z.infer<typeof socialSharingSchema>;

export function PublicProfileSettings({ className }: PublicProfileSettingsProps) {
  const { userProfile, updateProfile, isLoading } = useProfile();
  const [activeTab, setActiveTab] = useState('visibility');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');

  // Forms
  const seoForm = useForm<SEOSettingsData>({
    resolver: zodResolver(seoSettingsSchema),
    defaultValues: {
      metaTitle: userProfile?.seo?.metaTitle || '',
      metaDescription: userProfile?.seo?.metaDescription || '',
      keywords: userProfile?.seo?.keywords || [],
      focusKeyword: userProfile?.seo?.focusKeyword || '',
      slug: userProfile?.publicProfile?.slug || ''
    }
  });

  const visibilityForm = useForm<VisibilitySettingsData>({
    resolver: zodResolver(visibilitySettingsSchema),
    defaultValues: {
      isPublic: userProfile?.publicProfile?.isPublic || false,
      searchEngineIndexing: userProfile?.publicProfile?.searchEngineIndexing || true,
      showInDirectory: userProfile?.publicProfile?.showInDirectory || true,
      allowDirectContact: userProfile?.publicProfile?.allowDirectContact || true,
      showPricing: userProfile?.publicProfile?.showPricing || true,
      showAvailability: userProfile?.publicProfile?.showAvailability || true,
      showLocation: userProfile?.publicProfile?.showLocation || true,
      showContact: userProfile?.publicProfile?.showContact || false
    }
  });

  const socialForm = useForm<SocialSharingData>({
    resolver: zodResolver(socialSharingSchema),
    defaultValues: {
      openGraphImage: userProfile?.seo?.openGraphImage || '',
      twitterCard: userProfile?.seo?.twitterCard || 'summary_large_image',
      customMessage: userProfile?.socialSharing?.customMessage || ''
    }
  });

  // Get the profile URL based on user type
  React.useEffect(() => {
    if (userProfile?.publicProfile?.slug) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000';
      const userType = userProfile.userType;
      let pathPrefix = '';
      
      switch (userType) {
        case 'freelancer':
          pathPrefix = 'providers';
          break;
        case 'vendor':
          pathPrefix = 'vendors';
          break;
        case 'customer':
          pathPrefix = 'organizations';
          break;
        default:
          pathPrefix = 'profiles';
      }
      
      setProfileUrl(`${baseUrl}/${pathPrefix}/${userProfile.publicProfile.slug}`);
    }
  }, [userProfile]);

  // Check slug availability
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) return;
    
    setIsCheckingSlug(true);
    try {
      // Simulate API call to check slug availability
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock logic - in reality this would check against your database
      const unavailableSlugs = ['admin', 'api', 'www', 'support', 'help'];
      const isAvailable = !unavailableSlugs.includes(slug.toLowerCase());
      
      setSlugAvailable(isAvailable);
    } catch (error) {
      console.error('Failed to check slug availability:', error);
    } finally {
      setIsCheckingSlug(false);
    }
  };

  // Handle SEO form submission
  const onSEOSubmit = async (data: SEOSettingsData) => {
    try {
      await updateProfile({
        seo: {
          ...userProfile?.seo,
          ...data
        },
        publicProfile: {
          ...userProfile?.publicProfile,
          slug: data.slug
        }
      });
    } catch (error) {
      console.error('Failed to update SEO settings:', error);
    }
  };

  // Handle visibility form submission
  const onVisibilitySubmit = async (data: VisibilitySettingsData) => {
    try {
      await updateProfile({
        publicProfile: {
          ...userProfile?.publicProfile,
          ...data
        }
      });
    } catch (error) {
      console.error('Failed to update visibility settings:', error);
    }
  };

  // Handle social sharing form submission
  const onSocialSubmit = async (data: SocialSharingData) => {
    try {
      await updateProfile({
        seo: {
          ...userProfile?.seo,
          openGraphImage: data.openGraphImage,
          twitterCard: data.twitterCard
        },
        socialSharing: {
          ...userProfile?.socialSharing,
          customMessage: data.customMessage
        }
      });
    } catch (error) {
      console.error('Failed to update social sharing settings:', error);
    }
  };

  // Copy profile URL to clipboard
  const copyProfileUrl = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const generateQRCode = () => {
    // In a real implementation, you would generate a QR code
    // For now, just open a QR code generator service
    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`, '_blank');
  };

  if (!userProfile) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load profile settings. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Public Profile Settings</h2>
        <p className="text-muted-foreground">
          Manage your public profile visibility, SEO settings, and social sharing
        </p>
      </div>

      {/* Profile URL Preview */}
      {profileUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Your Public Profile URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <code className="flex-1 text-sm">{profileUrl}</code>
              <Button size="sm" variant="outline" onClick={copyProfileUrl}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={generateQRCode}>
                <QrCode className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visibility">Visibility</TabsTrigger>
          <TabsTrigger value="seo">SEO & URLs</TabsTrigger>
          <TabsTrigger value="social">Social Sharing</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Visibility Settings Tab */}
        <TabsContent value="visibility" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Visibility Settings
              </CardTitle>
              <CardDescription>
                Control who can see your profile and what information is displayed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...visibilityForm}>
                <form onSubmit={visibilityForm.handleSubmit(onVisibilitySubmit)} className="space-y-6">
                  
                  {/* Public Profile Toggle */}
                  <FormField
                    control={visibilityForm.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Public Profile</FormLabel>
                          <FormDescription>
                            Make your profile visible to potential clients
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

                  <Separator />

                  {/* Search & Discovery */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Search & Discovery</h4>
                    
                    <FormField
                      control={visibilityForm.control}
                      name="searchEngineIndexing"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Search Engine Indexing</FormLabel>
                            <FormDescription className="text-sm">
                              Allow search engines like Google to index your profile
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

                    <FormField
                      control={visibilityForm.control}
                      name="showInDirectory"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Show in Directory</FormLabel>
                            <FormDescription className="text-sm">
                              Appear in our freelancer directory and search results
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

                  <Separator />

                  {/* Contact & Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Information Display</h4>
                    
                    <FormField
                      control={visibilityForm.control}
                      name="allowDirectContact"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Allow Direct Contact</FormLabel>
                            <FormDescription className="text-sm">
                              Let clients contact you directly through your profile
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

                    <FormField
                      control={visibilityForm.control}
                      name="showPricing"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Show Pricing</FormLabel>
                            <FormDescription className="text-sm">
                              Display your hourly rates and project pricing
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

                    <FormField
                      control={visibilityForm.control}
                      name="showAvailability"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Show Availability</FormLabel>
                            <FormDescription className="text-sm">
                              Display your current availability status
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

                    <FormField
                      control={visibilityForm.control}
                      name="showLocation"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Show Location</FormLabel>
                            <FormDescription className="text-sm">
                              Display your city and timezone
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

                    <FormField
                      control={visibilityForm.control}
                      name="showContact"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Show Contact Information</FormLabel>
                            <FormDescription className="text-sm">
                              Display your email and phone number publicly
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

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                      Save Visibility Settings
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO & URLs Tab */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                SEO & URL Settings
              </CardTitle>
              <CardDescription>
                Optimize your profile for search engines and customize your URL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...seoForm}>
                <form onSubmit={seoForm.handleSubmit(onSEOSubmit)} className="space-y-6">
                  
                  {/* Custom URL Slug */}
                  <FormField
                    control={seoForm.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom URL Slug</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center flex-1 border rounded-md">
                              <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-r">
                                /{userProfile.userType === 'freelancer' ? 'providers' : 
                                  userProfile.userType === 'vendor' ? 'vendors' : 'organizations'}/
                              </span>
                              <Input 
                                {...field} 
                                className="border-0 rounded-l-none"
                                placeholder="your-name"
                                onChange={(e) => {
                                  field.onChange(e);
                                  setSlugAvailable(null);
                                }}
                                onBlur={(e) => checkSlugAvailability(e.target.value)}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => checkSlugAvailability(field.value)}
                              disabled={isCheckingSlug}
                            >
                              {isCheckingSlug ? 'Checking...' : 'Check'}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription className="flex items-center gap-2">
                          {slugAvailable === true && (
                            <>
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-green-600">Slug is available</span>
                            </>
                          )}
                          {slugAvailable === false && (
                            <>
                              <X className="h-4 w-4 text-red-500" />
                              <span className="text-red-600">Slug is not available</span>
                            </>
                          )}
                          {slugAvailable === null && (
                            <span>Only lowercase letters, numbers, and hyphens are allowed</span>
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Meta Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Meta Information</h4>
                    
                    <FormField
                      control={seoForm.control}
                      name="metaTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Title</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Your Name - Professional Web Developer"
                              maxLength={60}
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value?.length || 0}/60 characters. This appears in search results.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={seoForm.control}
                      name="metaDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Experienced web developer specializing in React and Node.js..."
                              rows={3}
                              maxLength={160}
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value?.length || 0}/160 characters. This appears as the description in search results.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Keywords */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Keywords</h4>
                    
                    <FormField
                      control={seoForm.control}
                      name="focusKeyword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Focus Keyword</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="React Developer"
                            />
                          </FormControl>
                          <FormDescription>
                            The main keyword you want to rank for
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <Label>Additional Keywords</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {seoForm.watch('keywords').map((keyword, index) => (
                          <Badge key={index} variant="secondary">
                            {keyword}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-1 h-auto p-0"
                              onClick={() => {
                                const current = seoForm.getValues('keywords');
                                seoForm.setValue('keywords', current.filter((_, i) => i !== index));
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Add keyword..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const value = e.currentTarget.value.trim();
                              if (value) {
                                const current = seoForm.getValues('keywords');
                                if (!current.includes(value)) {
                                  seoForm.setValue('keywords', [...current, value]);
                                }
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading || slugAvailable === false}>
                      Save SEO Settings
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Sharing Tab */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share className="h-5 w-5" />
                Social Sharing
              </CardTitle>
              <CardDescription>
                Customize how your profile appears when shared on social media
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...socialForm}>
                <form onSubmit={socialForm.handleSubmit(onSocialSubmit)} className="space-y-6">
                  
                  <FormField
                    control={socialForm.control}
                    name="openGraphImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Open Graph Image (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="https://example.com/your-image.jpg"
                          />
                        </FormControl>
                        <FormDescription>
                          Custom image for social media sharing. Recommended size: 1200x630px
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={socialForm.control}
                    name="twitterCard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter Card Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="summary">Summary</SelectItem>
                            <SelectItem value="summary_large_image">Summary with Large Image</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How your profile appears when shared on Twitter
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={socialForm.control}
                    name="customMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Sharing Message (optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Check out my professional profile..."
                            rows={3}
                            maxLength={280}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/280 characters. Pre-filled message when someone shares your profile.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                      Save Social Settings
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Custom CSS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  <h4 className="font-medium">Custom Styling</h4>
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Custom CSS and branding options are available in the Pro plan.
                  </AlertDescription>
                </Alert>
                <Button variant="outline" disabled>
                  Upgrade to Pro
                </Button>
              </div>

              <Separator />

              {/* Analytics */}
              <div className="space-y-4">
                <h4 className="font-medium">Analytics Integration</h4>
                <div className="space-y-2">
                  <Label>Google Analytics Tracking ID (optional)</Label>
                  <Input placeholder="UA-XXXXXXXXX-X" disabled />
                  <p className="text-sm text-muted-foreground">
                    Add your Google Analytics tracking ID to monitor profile visits
                  </p>
                </div>
              </div>

              <Separator />

              {/* Danger Zone */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  <h4 className="font-medium text-red-600">Danger Zone</h4>
                </div>
                
                <div className="border border-red-200 rounded-lg p-4 space-y-4">
                  <div>
                    <h5 className="font-medium">Hide Profile</h5>
                    <p className="text-sm text-muted-foreground">
                      Temporarily hide your profile from all public searches
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Hide Profile
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h5 className="font-medium text-red-600">Delete Public Profile</h5>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your public profile. This action cannot be undone.
                    </p>
                    <Button variant="destructive" size="sm" className="mt-2">
                      Delete Profile
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PublicProfileSettings;