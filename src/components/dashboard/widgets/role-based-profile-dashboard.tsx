/**
 * Role-Based Profile Dashboard
 * Main dashboard layout with role-specific widgets and sections
 */

'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useProfilePermissions, useProfileFeatureFlags } from '@/hooks/useProfilePermissions';
import { ProfileCompletionWidget } from './profile-completion-widget';
import { ProfileAnalyticsWidget } from './profile-analytics-widget';
import { ProfilePublishingWidget } from './profile-publishing-widget';
import { ProfileActivityWidget } from './profile-activity-widget';
import { VerificationWidget } from './verification-widget';
import { OptimizationWidget } from '@/components/profile/optimization-widget';
import { PermissionGuard } from '@/components/profile/permission-guard';
import { cn } from '@/lib/utils';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import {
  User,
  Building2,
  Briefcase,
  Crown,
  Shield,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Globe,
  Settings,
  Plus,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';

interface RoleBasedProfileDashboardProps {
  profileId?: string;
  userType?: 'freelancer' | 'vendor' | 'organization';
  layout?: 'grid' | 'sidebar' | 'compact';
  className?: string;
}

export function RoleBasedProfileDashboard({
  profileId,
  userType,
  layout = 'grid',
  className
}: RoleBasedProfileDashboardProps) {
  const { user } = useUser();
  const userId = profileId || user?.id;
  const userTypeFromHook = userType || getUserTypeFromMetadata(user);

  const {
    permissions,
    isOwner,
    isLoading,
    dashboardConfig,
    hasRestrictions,
    restrictions
  } = useProfilePermissions({ profileId: userId });

  const { features } = useProfileFeatureFlags();

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!userId || !userTypeFromHook) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Profile Not Found</h3>
          <p className="text-gray-600 mb-4">
            Unable to load profile information.
          </p>
          <Button asChild>
            <Link href="/dashboard/profile/setup">
              Create Profile
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'organization':
        return <Building2 className="h-5 w-5" />;
      case 'vendor':
        return <Briefcase className="h-5 w-5" />;
      case 'freelancer':
        return <User className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'organization':
        return 'text-blue-600';
      case 'vendor':
        return 'text-purple-600';
      case 'freelancer':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (layout === 'compact') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg bg-gray-100', getUserTypeColor(userTypeFromHook))}>
              {getUserTypeIcon(userTypeFromHook)}
            </div>
            <div>
              <h2 className="font-semibold capitalize">{userTypeFromHook} Profile</h2>
              <p className="text-sm text-gray-600">Manage your professional presence</p>
            </div>
          </div>
          {isOwner && (
            <Link href="/dashboard/profile/edit">
              <Button size="sm">
                <Settings className="h-3 w-3 mr-2" />
                Edit
              </Button>
            </Link>
          )}
        </div>

        {/* Quick Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProfileCompletionWidget
            profileId={userId}
            userType={userTypeFromHook}
            variant="compact"
          />
          
          <PermissionGuard feature="basicAnalytics">
            <ProfileAnalyticsWidget
              profileId={userId}
              userType={userTypeFromHook}
              variant="mini"
            />
          </PermissionGuard>

          <PermissionGuard requireOwnership>
            <ProfilePublishingWidget
              profileId={userId}
              userType={userTypeFromHook}
              variant="compact"
            />
          </PermissionGuard>

          <PermissionGuard feature="basicOptimization">
            <OptimizationWidget
              profileId={userId}
              userType={userTypeFromHook}
              variant="compact"
            />
          </PermissionGuard>

          <VerificationWidget
            profileId={userId}
            userType={userTypeFromHook}
            variant="compact"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with User Type and Restrictions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('p-3 rounded-lg bg-gray-100', getUserTypeColor(userTypeFromHook))}>
            {getUserTypeIcon(userTypeFromHook)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold capitalize">{userTypeFromHook} Dashboard</h1>
              {permissions?.roles && permissions.roles.length > 0 && (
                <div className="flex gap-1">
                  {permissions.roles.slice(0, 2).map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {role.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <p className="text-gray-600">Manage your professional profile and presence</p>
          </div>
        </div>

        {isOwner && (
          <div className="flex gap-2">
            <Link href="/dashboard/profile/edit">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
            <Link href="/dashboard/profile">
              <Button>
                <Globe className="h-4 w-4 mr-2" />
                View Public Profile
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Restrictions Alert */}
      {hasRestrictions && restrictions && (
        <div className="space-y-3">
          {restrictions.publicProfileRequired && (
            <Alert>
              <Globe className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Your user type requires a public profile to access all features.</span>
                  <Button size="sm" variant="outline">
                    Make Public
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {restrictions.verificationRequired && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Verification is required for your account level.</span>
                  <Button size="sm" variant="outline">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verify Now
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {restrictions.completionThreshold > 50 && (
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                Your profile must be at least {restrictions.completionThreshold}% complete to access premium features.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Main Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Completion - Always shown */}
        <ProfileCompletionWidget
          profileId={userId}
          userType={userTypeFromHook}
          variant="detailed"
        />

        {/* Verification Widget - Always shown for trust building */}
        <VerificationWidget
          profileId={userId}
          userType={userTypeFromHook}
          variant="detailed"
        />

        {/* Analytics Widget - Based on permissions */}
        <PermissionGuard feature="basicAnalytics" showFallback={false}>
          <ProfileAnalyticsWidget
            profileId={userId}
            userType={userTypeFromHook}
            variant="compact"
          />
        </PermissionGuard>
      </div>

      {/* Secondary Widget Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Publishing Widget - Owner only */}
        <PermissionGuard requireOwnership showFallback={false}>
          <ProfilePublishingWidget
            profileId={userId}
            userType={userTypeFromHook}
            variant="compact"
          />
        </PermissionGuard>

        {/* Optimization Widget */}
        <PermissionGuard feature="basicOptimization" showFallback={false}>
          <OptimizationWidget
            profileId={userId}
            userType={userTypeFromHook}
            variant="detailed"
          />
        </PermissionGuard>

        {/* Activity Widget */}
        <PermissionGuard feature="basicAnalytics" showFallback={false}>
          <ProfileActivityWidget
            profileId={userId}
            userType={userTypeFromHook}
            variant="compact"
          />
        </PermissionGuard>
      </div>

      {/* Role-Specific Sections */}
      {userTypeFromHook === 'organization' && (
        <OrganizationSpecificWidgets
          profileId={userId}
          permissions={permissions}
          features={features}
        />
      )}

      {userTypeFromHook === 'vendor' && (
        <VendorSpecificWidgets
          profileId={userId}
          permissions={permissions}
          features={features}
        />
      )}

      {userTypeFromHook === 'freelancer' && (
        <FreelancerSpecificWidgets
          profileId={userId}
          permissions={permissions}
          features={features}
        />
      )}

      {/* Quick Actions Footer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/dashboard/profile/edit">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>

            <PermissionGuard feature="basicOptimization">
              <Link href="/dashboard/profile/optimization">
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="h-4 w-4 mr-2" />
                  Optimize
                </Button>
              </Link>
            </PermissionGuard>

            <PermissionGuard feature="basicAnalytics">
              <Link href="/dashboard/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </Link>
            </PermissionGuard>

            <PermissionGuard feature="basicTheme">
              <Link href="/dashboard/profile/branding">
                <Button variant="outline" className="w-full justify-start">
                  <Crown className="h-4 w-4 mr-2" />
                  Customize
                </Button>
              </Link>
            </PermissionGuard>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Role-specific widget sections

function OrganizationSpecificWidgets({ profileId, permissions, features }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Organization Features</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PermissionGuard feature="teamManagement">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Manage your organization's team members and their roles.
              </p>
              <Link href="/dashboard/team">
                <Button className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </PermissionGuard>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Business Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Verify your organization's credentials and build trust with clients.
            </p>
            <Link href="/dashboard/verification">
              <Button className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Complete Verification
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <PermissionGuard feature="multipleProfiles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Department Profiles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Create specialized profiles for different departments.
              </p>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </CardContent>
          </Card>
        </PermissionGuard>
      </div>
    </div>
  );
}

function VendorSpecificWidgets({ profileId, permissions, features }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Vendor Features</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Service Catalog
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Manage your service offerings and pricing.
            </p>
            <Link href="/dashboard/services">
              <Button className="w-full">
                <Briefcase className="h-4 w-4 mr-2" />
                Manage Services
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Business Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Verify your business credentials and showcase your professional status.
            </p>
            <Link href="/dashboard/verification">
              <Button className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Verify Business
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <PermissionGuard feature="advancedAnalytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Business Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Advanced analytics for your vendor business.
              </p>
              <Link href="/dashboard/analytics/business">
                <Button variant="outline" className="w-full">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </PermissionGuard>
      </div>
    </div>
  );
}

function FreelancerSpecificWidgets({ profileId, permissions, features }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Freelancer Tools</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Portfolio Showcase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Showcase your best work to attract clients.
            </p>
            <Link href="/dashboard/portfolio">
              <Button className="w-full">
                <User className="h-4 w-4 mr-2" />
                Manage Portfolio
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Skill Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Take skill assessments to verify your expertise and build trust.
            </p>
            <Link href="/dashboard/verification/skills">
              <Button className="w-full">
                <GraduationCap className="h-4 w-4 mr-2" />
                Take Skill Tests
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Set your availability and booking preferences.
            </p>
            <Button variant="outline" className="w-full">
              <Clock className="h-4 w-4 mr-2" />
              Set Availability
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper functions

function getUserTypeFromMetadata(user: any): 'freelancer' | 'vendor' | 'organization' | undefined {
  // This would typically come from user metadata or profile data
  // For now, return a default based on some logic
  return user?.publicMetadata?.userType || 'freelancer';
}

const Users = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);