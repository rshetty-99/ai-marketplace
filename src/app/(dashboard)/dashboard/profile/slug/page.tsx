/**
 * Slug Management Dashboard Page
 * Comprehensive interface for managing profile URLs
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SlugInput } from '@/components/profile/slug-input';
import { useToast } from '@/hooks/use-toast';
import { useSlugManager } from '@/hooks/useSlugManager';
import { SlugService, SlugHistory } from '@/lib/profile/slug-service';

import {
  Save,
  History,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Info,
  Clock,
  Globe,
  Shield,
  Zap,
  TrendingUp,
  BarChart3
} from 'lucide-react';

export default function SlugManagementPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [slugHistory, setSlugHistory] = useState<SlugHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // This would come from user's current profile data
  const [currentSlug, setCurrentSlug] = useState('');
  const [userType, setUserType] = useState<'freelancer' | 'vendor' | 'organization'>('freelancer');
  const [collectionName, setCollectionName] = useState('freelancers');

  const {
    slug,
    setSlug,
    validation,
    isChecking,
    isValid,
    isAvailable,
    canSave
  } = useSlugManager({
    initialSlug: currentSlug,
    userId: user?.id,
    userType,
    collectionName
  });

  // Load current user data and slug history
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;

      try {
        // Load slug history
        const response = await fetch('/api/slug/history');
        if (response.ok) {
          const data = await response.json();
          setSlugHistory(data.history);
        }

        // TODO: Load current user profile data to get current slug and type
        // This would depend on your existing profile data structure
        
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user?.id]);

  const handleSaveSlug = async () => {
    if (!canSave || !user?.id) return;

    setIsSaving(true);
    
    try {
      const response = await fetch('/api/slug/reserve', {
        method: currentSlug ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          slug,
          userType,
          collectionName,
          isUpdate: !!currentSlug
        })
      });

      const result = await response.json();

      if (result.success) {
        setCurrentSlug(slug);
        toast({
          title: 'Success',
          description: 'Your profile URL has been updated successfully!',
        });
        
        // Reload history
        const historyResponse = await fetch('/api/slug/history');
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setSlugHistory(historyData.history);
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update slug',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!slug || !isValid || !isAvailable) return;
    
    const baseUrl = window.location.origin;
    const urlPrefix = userType === 'freelancer' ? '/providers' : 
                     userType === 'vendor' ? '/vendors' : '/organizations';
    const fullUrl = `${baseUrl}${urlPrefix}/${slug}`;
    
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast({
        title: 'Copied!',
        description: 'Profile URL copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy URL',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const urlPrefix = userType === 'freelancer' ? '/providers' : 
                   userType === 'vendor' ? '/vendors' : '/organizations';
  const fullUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${urlPrefix}/${slug}`;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Profile URL Management</h1>
        <p className="text-gray-600">
          Customize your public profile URL to make it easy for clients to find you.
        </p>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList>
          <TabsTrigger value="current">Current URL</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Current Slug Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Your Profile URL
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SlugInput
                value={slug}
                onChange={setSlug}
                userId={user?.id}
                userType={userType}
                collectionName={collectionName}
                nameValue={user?.fullName || user?.firstName}
                showPreview={true}
              />

              {/* Current Status */}
              {currentSlug && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>
                        Your current URL: <code className="bg-gray-100 px-1 rounded">{urlPrefix}/{currentSlug}</code>
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyUrl}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`${urlPrefix}/${currentSlug}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveSlug}
                  disabled={!canSave || isSaving || isChecking}
                  className="min-w-[120px]"
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {currentSlug ? 'Update URL' : 'Save URL'}
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SEO Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Benefits of a Custom URL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Professional Branding</h4>
                    <p className="text-sm text-gray-600">A clean, memorable URL builds trust with clients</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Better SEO</h4>
                    <p className="text-sm text-gray-600">Custom URLs rank better in search results</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Easy Sharing</h4>
                    <p className="text-sm text-gray-600">Share your profile easily on social media and business cards</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Slug History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                URL History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {slugHistory.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {slugHistory.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {urlPrefix}/{entry.slug}
                            </code>
                            <Badge variant={entry.isActive ? "default" : "secondary"}>
                              {entry.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Created: {formatDate(entry.createdAt)}</span>
                            <span>Updated: {formatDate(entry.updatedAt)}</span>
                          </div>
                          {entry.redirectFrom && entry.redirectFrom.length > 0 && (
                            <div className="text-xs text-gray-500">
                              Redirects from: {entry.redirectFrom.join(', ')}
                            </div>
                          )}
                        </div>
                        
                        {entry.isActive && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(`${window.location.origin}${urlPrefix}/${entry.slug}`)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`${urlPrefix}/${entry.slug}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No URL history</h3>
                  <p className="text-sm">Your URL changes will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                URL Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
                <p className="text-sm">Track visits, referrers, and engagement for your profile URL</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}