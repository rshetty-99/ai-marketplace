'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
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
  Building
} from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().optional(),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  timezone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

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

export function ProfileClient() {
  const { user, isLoaded } = useUser();
  const { trackEvent } = useAnalytics();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      bio: '',
      location: '',
      website: '',
      timezone: '',
      company: '',
      jobTitle: '',
    },
  });

  useEffect(() => {
    if (user && isLoaded) {
      // Populate form with user data
      form.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        phone: user.primaryPhoneNumber?.phoneNumber || '',
        bio: user.publicMetadata.bio as string || '',
        location: user.publicMetadata.location as string || '',
        website: user.publicMetadata.website as string || '',
        timezone: user.publicMetadata.timezone as string || '',
        company: user.publicMetadata.company as string || '',
        jobTitle: user.publicMetadata.jobTitle as string || '',
      });

      trackEvent('profile_page_viewed', {
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
    }
  }, [user, isLoaded, form, trackEvent]);

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Update user profile in Clerk
      await user.update({
        firstName: data.firstName,
        lastName: data.lastName,
      });

      // Update metadata
      await user.update({
        publicMetadata: {
          ...user.publicMetadata,
          bio: data.bio,
          location: data.location,
          website: data.website,
          timezone: data.timezone,
          company: data.company,
          jobTitle: data.jobTitle,
        },
      });

      setLastSaved(new Date());
      setIsEditing(false);
      
      trackEvent('profile_updated', {
        userId: user.id,
        fieldsUpdated: Object.keys(data),
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getUserRole = () => {
    if (!user) return 'User';
    const email = user.primaryEmailAddress?.emailAddress || '';
    if (email === 'rshetty99@hotmail.com') return 'Freelancer';
    if (email === 'rshetty99@gmail.com') return 'Vendor Admin';
    if (email === 'rshetty@techsamur.ai') return 'Customer Admin';
    if (email === 'alsmith141520@gmail.com') return 'Freelancer';
    return user.publicMetadata.role as string || 'User';
  };

  const getVerificationStatus = () => {
    // Mock verification status - in real app, get from database
    return {
      email: true,
      phone: false,
      identity: true,
      background: false,
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and profile information
          </p>
        </div>
        {lastSaved && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Saved {lastSaved.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and profile details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Profile Photo Section */}
                  <div className="flex items-center gap-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={user.imageUrl} />
                      <AvatarFallback className="text-lg">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{getUserRole()}</Badge>
                        {verification.identity && (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        <Camera className="w-4 h-4 mr-2" />
                        Change Photo
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        JPG, PNG or GIF. Max file size 5MB.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <CustomFormField<ProfileForm>
                      control={form.control}
                      name="firstName"
                      fieldType={FormFieldType.INPUT}
                      label="First Name"
                      placeholder="John"
                      disabled={!isEditing}
                    />
                    
                    <CustomFormField<ProfileForm>
                      control={form.control}
                      name="lastName"
                      fieldType={FormFieldType.INPUT}
                      label="Last Name"
                      placeholder="Doe"
                      disabled={!isEditing}
                    />
                  </div>

                  <CustomFormField<ProfileForm>
                    control={form.control}
                    name="email"
                    fieldType={FormFieldType.INPUT}
                    label="Email Address"
                    placeholder="john.doe@example.com"
                    disabled={true} // Email usually can't be changed
                    iconSrc="/icons/email.svg"
                  />

                  <CustomFormField<ProfileForm>
                    control={form.control}
                    name="phone"
                    fieldType={FormFieldType.PHONE_INPUT}
                    label="Phone Number"
                    placeholder="+1 (555) 123-4567"
                    disabled={!isEditing}
                  />

                  <CustomFormField<ProfileForm>
                    control={form.control}
                    name="bio"
                    fieldType={FormFieldType.TEXTAREA}
                    label="Bio"
                    placeholder="Tell us about yourself..."
                    disabled={!isEditing}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <CustomFormField<ProfileForm>
                      control={form.control}
                      name="location"
                      fieldType={FormFieldType.INPUT}
                      label="Location"
                      placeholder="San Francisco, CA"
                      disabled={!isEditing}
                      iconSrc="/icons/location.svg"
                    />
                    
                    <CustomFormField<ProfileForm>
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

                  <CustomFormField<ProfileForm>
                    control={form.control}
                    name="website"
                    fieldType={FormFieldType.INPUT}
                    label="Website"
                    placeholder="https://yourwebsite.com"
                    disabled={!isEditing}
                    iconSrc="/icons/globe.svg"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <CustomFormField<ProfileForm>
                      control={form.control}
                      name="company"
                      fieldType={FormFieldType.INPUT}
                      label="Company"
                      placeholder="Acme Inc."
                      disabled={!isEditing}
                      iconSrc="/icons/building.svg"
                    />
                    
                    <CustomFormField<ProfileForm>
                      control={form.control}
                      name="jobTitle"
                      fieldType={FormFieldType.INPUT}
                      label="Job Title"
                      placeholder="Senior Developer"
                      disabled={!isEditing}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2">
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)} variant="outline">
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Profile
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
                Verify your account to access more features
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
                        Upload government-issued ID
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
                        Complete background verification
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
  );
}