/**
 * Analytics Dashboard Page
 * Main analytics view for users to track their profile performance
 */

'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { ProfileAnalyticsDashboard } from '@/components/dashboard/analytics/profile-analytics-dashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, BarChart3, TrendingUp, Users, Target } from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  const { user } = useUser();
  
  // This would typically come from your user profile data
  // For now, using mock data
  const profileId = user?.id || 'demo-profile';
  const userType = 'freelancer'; // This would be determined from user's actual role
  const hasProfile = true; // Check if user has created a profile

  if (!hasProfile) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Profile Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You need to create and publish your profile to start tracking analytics.
              </AlertDescription>
            </Alert>
            
            <div className="mt-6 text-center">
              <h3 className="text-lg font-medium mb-2">Get Started with Analytics</h3>
              <p className="text-gray-600 mb-4">
                Create your professional profile to start tracking views, engagement, and conversions.
              </p>
              <Link href="/dashboard/profile">
                <Button>Create Profile</Button>
              </Link>
            </div>

            {/* Benefits of Analytics */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h4 className="font-medium">Track Performance</h4>
                <p className="text-sm text-gray-600">
                  Monitor views, clicks, and engagement metrics in real-time
                </p>
              </div>
              <div className="text-center p-4">
                <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h4 className="font-medium">Know Your Audience</h4>
                <p className="text-sm text-gray-600">
                  Understand who visits your profile and where they come from
                </p>
              </div>
              <div className="text-center p-4">
                <Target className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <h4 className="font-medium">Optimize & Convert</h4>
                <p className="text-sm text-gray-600">
                  Get insights to improve your profile and increase conversions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ProfileAnalyticsDashboard 
        profileId={profileId}
        userType={userType as 'freelancer' | 'vendor' | 'organization'}
      />
    </div>
  );
}