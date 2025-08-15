'use client';

import { useState, useEffect } from 'react';
import { UserProfile, useUser } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import CustomFormField, { FormFieldType } from '@/components/CustomFormFields';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAnalytics } from '@/components/providers/analytics-provider';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Camera, 
  Settings, 
  Shield, 
  Bell,
  Save,
  CheckCircle,
  AlertCircle,
  Globe,
  Building,
  UserCog,
  Briefcase,
  Star,
  TrendingUp,
  Clock
} from 'lucide-react';

const marketplaceProfileSchema = z.object({
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().optional(),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  timezone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  skills: z.string().optional(),
  experienceLevel: z.string().optional(),
  hourlyRate: z.string().optional(),
  availability: z.string().optional(),
});

type MarketplaceProfileForm = z.infer<typeof marketplaceProfileSchema>;

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
];

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'intermediate', label: 'Intermediate (2-5 years)' },
  { value: 'experienced', label: 'Experienced (5-10 years)' },
  { value: 'expert', label: 'Expert (10+ years)' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'full-time', label: 'Full-time (40+ hours/week)' },
  { value: 'part-time', label: 'Part-time (20-39 hours/week)' },
  { value: 'project-based', label: 'Project-based' },
  { value: 'as-needed', label: 'As needed' },
];

export function MarketplaceProfileWrapper() {
  const { user, isLoaded } = useUser();
  const { trackEvent } = useAnalytics();
  const [activeTab, setActiveTab] = useState('account');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const form = useForm<MarketplaceProfileForm>({
    resolver: zodResolver(marketplaceProfileSchema),
    defaultValues: {
      bio: '',
      location: '',
      website: '',
      timezone: '',
      company: '',
      jobTitle: '',
      skills: '',
      experienceLevel: '',
      hourlyRate: '',
      availability: '',
    },
  });

  useEffect(() => {
    if (user && isLoaded) {
      // Populate form with user metadata
      form.reset({
        bio: user.publicMetadata.bio as string || '',
        location: user.publicMetadata.location as string || '',
        website: user.publicMetadata.website as string || '',
        timezone: user.publicMetadata.timezone as string || '',
        company: user.publicMetadata.company as string || '',
        jobTitle: user.publicMetadata.jobTitle as string || '',
        skills: user.publicMetadata.skills as string || '',
        experienceLevel: user.publicMetadata.experienceLevel as string || '',
        hourlyRate: user.publicMetadata.hourlyRate as string || '',
        availability: user.publicMetadata.availability as string || '',
      });

      trackEvent('enhanced_profile_page_viewed', {
        userId: user.id,
        activeTab,
        timestamp: new Date().toISOString(),
      });
    }
  }, [user, isLoaded, form, trackEvent, activeTab]);

  const onSubmit = async (data: MarketplaceProfileForm) => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Update marketplace-specific metadata
      await user.update({
        publicMetadata: {
          ...user.publicMetadata,
          bio: data.bio,
          location: data.location,
          website: data.website,
          timezone: data.timezone,
          company: data.company,
          jobTitle: data.jobTitle,
          skills: data.skills,
          experienceLevel: data.experienceLevel,
          hourlyRate: data.hourlyRate,
          availability: data.availability,
        },
      });

      setLastSaved(new Date());
      setIsEditing(false);
      
      trackEvent('marketplace_profile_updated', {
        userId: user.id,
        fieldsUpdated: Object.keys(data),
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Failed to update marketplace profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getUserRole = () => {
    if (!user) return 'User';
    
    // Check email for test accounts first (same logic as AppSidebar)
    const email = user.primaryEmailAddress?.emailAddress || '';
    if (email === 'rshetty99@hotmail.com') {
      return 'Freelancer'; // Known test account
    }
    if (email === 'rshetty99@gmail.com') {
      return 'Freelancer'; // Known test account
    }
    if (email === 'rshetty@techsamur.ai') {
      return 'Vendor Admin'; // Known test account
    }
    if (email === 'alsmith141520@gmail.com') {
      return 'Customer Admin'; // Known test account
    }
    
    // Try to get from Clerk metadata (safe version)
    const role = user.publicMetadata?.primary_role || user.publicMetadata?.role;
    if (role && typeof role === 'string') {
      return role.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    // Try user type
    const userType = user.publicMetadata?.user_type;
    if (userType && typeof userType === 'string') {
      return userType.charAt(0).toUpperCase() + userType.slice(1);
    }
    
    return 'User';
  };

  const getVerificationStatus = () => {
    // Mock verification status - in real app, get from database
    return {
      email: user?.emailAddresses?.[0]?.verification?.status === 'verified',
      phone: user?.phoneNumbers?.[0]?.verification?.status === 'verified',
      identity: true, // Mock data
      background: false, // Mock data
    };
  };

  const getProfileStats = () => {
    // Mock profile stats - in real app, get from database
    return {
      completedProjects: 12,
      clientRating: 4.8,
      responseTime: '< 2 hours',
      successRate: '95%',
    };
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
        <span className="ml-3 text-lg">Loading profile...</span>
      </div>
    );
  }

  const verification = getVerificationStatus();
  const profileStats = getProfileStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and marketplace profile
            </p>
          </div>
          {lastSaved && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Profile Overview Card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.imageUrl} />
                <AvatarFallback className="text-lg">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-semibold">
                    {user.fullName || `${user.firstName} ${user.lastName}` || 'User'}
                  </h2>
                  <Badge variant="secondary">{getUserRole()}</Badge>
                  {verification.identity && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-3">
                  {user.publicMetadata.bio as string || 'Add a bio to tell clients about your expertise and experience.'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{profileStats.clientRating} rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    <span>{profileStats.completedProjects} projects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span>{profileStats.successRate} success</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span>{profileStats.responseTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
          </TabsList>

          {/* Account Tab - Clerk UserProfile */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Account Settings
                </CardTitle>
                <CardDescription>
                  Manage your basic account information, email, and password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserProfile 
                  appearance={{
                    elements: {
                      formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
                      footerActionLink: 'text-blue-600 hover:text-blue-700',
                      card: 'shadow-none border-0',
                      navbar: 'hidden',
                      pageScrollBox: 'max-w-none',
                      rootBox: 'w-full',
                    },
                  }}
                  routing="path"
                  path="/profile"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketplace Tab - Custom Profile */}
          <TabsContent value="marketplace" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Marketplace Profile
                </CardTitle>
                <CardDescription>
                  Customize your professional profile for the AI marketplace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <CustomFormField<MarketplaceProfileForm>
                      control={form.control}
                      name="bio"
                      fieldType={FormFieldType.TEXTAREA}
                      label="Professional Bio"
                      placeholder="Tell clients about your expertise, experience, and what makes you unique..."
                      disabled={!isEditing}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <CustomFormField<MarketplaceProfileForm>
                        control={form.control}
                        name="location"
                        fieldType={FormFieldType.INPUT}
                        label="Location"
                        placeholder="San Francisco, CA"
                        disabled={!isEditing}
                        iconSrc="/icons/location.svg"
                      />
                      
                      <CustomFormField<MarketplaceProfileForm>
                        control={form.control}
                        name="timezone"
                        fieldType={FormFieldType.SELECT}
                        label="Timezone"
                        placeholder="Select timezone"
                        disabled={!isEditing}
                      >
                        {TIMEZONES.map((timezone) => (
                          <option key={timezone.value} value={timezone.value}>
                            {timezone.label}
                          </option>
                        ))}
                      </CustomFormField>
                    </div>

                    <CustomFormField<MarketplaceProfileForm>
                      control={form.control}
                      name="website"
                      fieldType={FormFieldType.INPUT}
                      label="Portfolio Website"
                      placeholder="https://yourportfolio.com"
                      disabled={!isEditing}
                      iconSrc="/icons/globe.svg"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <CustomFormField<MarketplaceProfileForm>
                        control={form.control}
                        name="company"
                        fieldType={FormFieldType.INPUT}
                        label="Company"
                        placeholder="Acme Inc."
                        disabled={!isEditing}
                        iconSrc="/icons/building.svg"
                      />
                      
                      <CustomFormField<MarketplaceProfileForm>
                        control={form.control}
                        name="jobTitle"
                        fieldType={FormFieldType.INPUT}
                        label="Job Title"
                        placeholder="Senior AI Developer"
                        disabled={!isEditing}
                      />
                    </div>

                    <CustomFormField<MarketplaceProfileForm>
                      control={form.control}
                      name="skills"
                      fieldType={FormFieldType.TEXTAREA}
                      label="Skills & Expertise"
                      placeholder="List your key skills, technologies, and areas of expertise..."
                      disabled={!isEditing}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <CustomFormField<MarketplaceProfileForm>
                        control={form.control}
                        name="experienceLevel"
                        fieldType={FormFieldType.SELECT}
                        label="Experience Level"
                        placeholder="Select experience level"
                        disabled={!isEditing}
                      >
                        {EXPERIENCE_LEVELS.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </CustomFormField>
                      
                      <CustomFormField<MarketplaceProfileForm>
                        control={form.control}
                        name="hourlyRate"
                        fieldType={FormFieldType.INPUT}
                        label="Hourly Rate (USD)"
                        placeholder="$50-100"
                        disabled={!isEditing}
                      />
                    </div>

                    <CustomFormField<MarketplaceProfileForm>
                      control={form.control}
                      name="availability"
                      fieldType={FormFieldType.SELECT}
                      label="Availability"
                      placeholder="Select availability"
                      disabled={!isEditing}
                    >
                      {AVAILABILITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </CustomFormField>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2">
                      {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)} variant="outline">
                          <Settings className="w-4 h-4 mr-2" />
                          Edit Marketplace Profile
                        </Button>
                      ) : (
                        <>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setIsEditing(false);
                              form.reset();
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                              <>
                                <LoadingSpinner size={16} />
                                <span className="ml-2">Saving...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline">Configure</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Change Password</h4>
                      <p className="text-sm text-muted-foreground">
                        Update your account password
                      </p>
                    </div>
                    <Button variant="outline">Change</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Active Sessions</h4>
                      <p className="text-sm text-muted-foreground">
                        Manage devices signed into your account
                      </p>
                    </div>
                    <Button variant="outline">View Sessions</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">Notification settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Account Verification
                </CardTitle>
                <CardDescription>
                  Verify your account to access more features and build trust
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5" />
                      <div>
                        <h4 className="font-medium">Email Verification</h4>
                        <p className="text-sm text-muted-foreground">
                          Verify your email address
                        </p>
                      </div>
                    </div>
                    {verification.email ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Button variant="outline" size="sm">Verify</Button>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5" />
                      <div>
                        <h4 className="font-medium">Phone Verification</h4>
                        <p className="text-sm text-muted-foreground">
                          Verify your phone number
                        </p>
                      </div>
                    </div>
                    {verification.phone ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Button variant="outline" size="sm">Verify</Button>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5" />
                      <div>
                        <h4 className="font-medium">Identity Verification</h4>
                        <p className="text-sm text-muted-foreground">
                          Upload government-issued ID for trust & safety
                        </p>
                      </div>
                    </div>
                    {verification.identity ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Button variant="outline" size="sm">Upload ID</Button>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5" />
                      <div>
                        <h4 className="font-medium">Background Check</h4>
                        <p className="text-sm text-muted-foreground">
                          Complete professional background verification
                        </p>
                      </div>
                    </div>
                    {verification.background ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Button variant="outline" size="sm">Start Check</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}