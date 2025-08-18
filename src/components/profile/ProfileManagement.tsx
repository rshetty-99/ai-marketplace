/**
 * Profile Management Component
 * Main dashboard interface for managing user profiles with role-based forms
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Settings, 
  Eye, 
  Globe, 
  BarChart3, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Clock,
  Edit
} from 'lucide-react';

import { useProfile, useFreelancerProfile, useVendorProfile, useOrganizationProfile } from '@/hooks/useProfile';
import { UserType } from '@/lib/firebase/onboarding-schema';

import { BasicInfoForm } from './forms/BasicInfoForm';
import { FreelancerProfileForm } from './forms/FreelancerProfileForm';
import { VendorProfileForm } from './forms/VendorProfileForm';
import { OrganizationProfileForm } from './forms/OrganizationProfileForm';
import { ProfileCompletion } from './ProfileCompletion';
import { ProfileAnalytics } from './ProfileAnalytics';
import { ProfilePreview } from './ProfilePreview';
import { PublicProfileSettings } from './PublicProfileSettings';

interface ProfileManagementProps {
  className?: string;
}

export function ProfileManagement({ className }: ProfileManagementProps) {
  const { userProfile, isLoading, error, publishProfile, unpublishProfile } = useProfile();
  const [activeTab, setActiveTab] = useState('basic');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!userProfile) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Profile not found. Please try refreshing the page.</AlertDescription>
      </Alert>
    );
  }

  const userType = getUserTypeFromProfile(userProfile);
  const isPublished = userProfile.publicProfile.isPublic;

  if (isPreviewMode) {
    return (
      <div className={className}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Profile Preview</h2>
          <Button variant="outline" onClick={() => setIsPreviewMode(false)}>
            <Edit className="h-4 w-4 mr-2" />
            Back to Edit
          </Button>
        </div>
        <ProfilePreview userProfile={userProfile} userType={userType} />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your {userType.toLowerCase()} profile and public presence
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Profile Status Badge */}
            <Badge variant={isPublished ? 'default' : 'secondary'}>
              {isPublished ? (
                <>
                  <Globe className="h-3 w-3 mr-1" />
                  Published
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  Draft
                </>
              )}
            </Badge>

            {/* Action Buttons */}
            <Button 
              variant="outline" 
              onClick={() => setIsPreviewMode(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            
            <Button 
              onClick={isPublished ? unpublishProfile : publishProfile}
              variant={isPublished ? 'outline' : 'default'}
            >
              {isPublished ? 'Unpublish' : 'Publish Profile'}
            </Button>
          </div>
        </div>

        {/* Profile Completion Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Profile Completion</span>
            <span className="text-sm text-muted-foreground">
              {userProfile.profileCompletion}%
            </span>
          </div>
          <Progress value={userProfile.profileCompletion} className="h-2" />
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="professional" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Professional
          </TabsTrigger>
          <TabsTrigger value="public" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Public Profile
          </TabsTrigger>
          <TabsTrigger value="completion" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completion
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Verification
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update your basic profile information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BasicInfoForm userProfile={userProfile} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional/Role-Specific Tab */}
        <TabsContent value="professional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {userType === UserType.FREELANCER && 'Freelancer Profile'}
                {userType === UserType.VENDOR_COMPANY && 'Company Profile'}
                {userType === UserType.CUSTOMER_ORGANIZATION && 'Organization Profile'}
              </CardTitle>
              <CardDescription>
                Manage your {userType.toLowerCase()}-specific information and showcase
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userType === UserType.FREELANCER && <FreelancerProfileFormWrapper />}
              {userType === UserType.VENDOR_COMPANY && <VendorProfileFormWrapper />}
              {userType === UserType.CUSTOMER_ORGANIZATION && <OrganizationProfileFormWrapper />}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Public Profile Settings Tab */}
        <TabsContent value="public" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Public Profile Settings</CardTitle>
              <CardDescription>
                Configure how your profile appears to the public
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PublicProfileSettings userProfile={userProfile} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Completion Tab */}
        <TabsContent value="completion" className="space-y-6">
          <ProfileCompletion />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <ProfileAnalytics />
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Verification</CardTitle>
              <CardDescription>
                Verify your identity and credentials to build trust
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VerificationStatus userProfile={userProfile} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =============================================================================
// ROLE-SPECIFIC FORM WRAPPERS
// =============================================================================

function FreelancerProfileFormWrapper() {
  const freelancerHook = useFreelancerProfile();
  
  return (
    <FreelancerProfileForm 
      profile={freelancerHook.freelancerProfile}
      isLoading={freelancerHook.isSaving}
      onUpdate={freelancerHook.updateSpecificProfile}
      onUpdateSkills={freelancerHook.updateSkills}
      onUpdatePricing={freelancerHook.updatePricing}
      onAddProject={freelancerHook.addPortfolioProject}
    />
  );
}

function VendorProfileFormWrapper() {
  const vendorHook = useVendorProfile();
  
  return (
    <VendorProfileForm 
      profile={vendorHook.vendorProfile}
      isLoading={vendorHook.isSaving}
      onUpdate={vendorHook.updateSpecificProfile}
      onUpdateCompany={vendorHook.updateCompanyInfo}
      onUpdateServices={vendorHook.updateServices}
      onAddCaseStudy={vendorHook.addCaseStudy}
    />
  );
}

function OrganizationProfileFormWrapper() {
  const orgHook = useOrganizationProfile();
  
  return (
    <OrganizationProfileForm 
      profile={orgHook.organizationProfile}
      isLoading={orgHook.isSaving}
      onUpdate={orgHook.updateSpecificProfile}
      onUpdateRequirements={orgHook.updateRequirements}
      onUpdatePartnerships={orgHook.updatePartnerships}
    />
  );
}

// =============================================================================
// VERIFICATION STATUS COMPONENT
// =============================================================================

function VerificationStatus({ userProfile }: { userProfile: any }) {
  const verificationItems = [
    {
      key: 'identity',
      label: 'Identity Verification',
      description: 'Verify your identity with government-issued ID',
      status: userProfile.verification.identity,
      icon: User
    },
    {
      key: 'email',
      label: 'Email Verification',
      description: 'Confirm your email address',
      status: userProfile.verification.email,
      icon: User
    },
    {
      key: 'phone',
      label: 'Phone Verification',
      description: 'Verify your phone number',
      status: userProfile.verification.phone,
      icon: User
    },
    {
      key: 'background',
      label: 'Background Check',
      description: 'Professional background verification',
      status: userProfile.verification.background,
      icon: Shield
    },
    {
      key: 'skillsAssessment',
      label: 'Skills Assessment',
      description: 'Validate your professional skills',
      status: userProfile.verification.skillsAssessment,
      icon: BarChart3
    }
  ];

  return (
    <div className="space-y-4">
      {verificationItems.map((item) => (
        <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <item.icon className="h-5 w-5 text-muted-foreground" />
            <div>
              <h4 className="font-medium">{item.label}</h4>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={item.status === 'verified' ? 'default' : 
                      item.status === 'in_progress' ? 'secondary' : 'outline'}
            >
              {item.status === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
              {item.status === 'in_progress' && <Clock className="h-3 w-3 mr-1" />}
              {item.status === 'not_started' && <AlertCircle className="h-3 w-3 mr-1" />}
              {item.status}
            </Badge>
            
            {item.status !== 'verified' && (
              <Button size="sm" variant="outline">
                {item.status === 'not_started' ? 'Start' : 'Continue'}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getUserTypeFromProfile(userProfile: any): UserType {
  // This would determine user type from profile data
  // For now, return default
  return UserType.FREELANCER;
}

export default ProfileManagement;