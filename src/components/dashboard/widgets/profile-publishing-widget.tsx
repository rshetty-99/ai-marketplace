/**
 * Profile Publishing Widget
 * Manages profile publication status and quick actions
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useProfilePublishing } from '@/hooks/useProfilePublishing';
import { useProfilePermissions } from '@/hooks/useProfilePermissions';
import { PermissionGuard } from '@/components/profile/permission-guard';
import { cn } from '@/lib/utils';

import {
  Globe,
  Eye,
  EyeOff,
  Play,
  Pause,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Calendar,
  Zap,
  RefreshCw,
  Settings,
  ArrowRight
} from 'lucide-react';

interface ProfilePublishingWidgetProps {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  variant?: 'compact' | 'detailed';
  className?: string;
}

export function ProfilePublishingWidget({
  profileId,
  userType,
  variant = 'compact',
  className
}: ProfilePublishingWidgetProps) {
  const [showQuickPublish, setShowQuickPublish] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    publishingStatus,
    validation,
    isPublished,
    isDraft,
    isPublishing,
    publishProfile,
    unpublishProfile,
    createPreview
  } = useProfilePublishing({
    profileId,
    userType,
    autoValidate: true
  });

  const { canPublish } = useProfilePermissions({ profileId });

  const handleQuickPublish = async () => {
    const success = await publishProfile();
    if (success) {
      setShowQuickPublish(false);
    }
  };

  const handleCreatePreview = async () => {
    const preview = await createPreview(24);
    if (preview) {
      setPreviewUrl(preview.previewUrl);
    }
  };

  const copyPreviewUrl = () => {
    if (previewUrl) {
      navigator.clipboard.writeText(previewUrl);
    }
  };

  const getStatusInfo = () => {
    if (!publishingStatus) {
      return {
        status: 'Draft',
        icon: <Clock className="h-4 w-4 text-gray-500" />,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        description: 'Your profile is not published yet'
      };
    }

    switch (publishingStatus.status) {
      case 'published':
        return {
          status: 'Published',
          icon: <Globe className="h-4 w-4 text-green-500" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          description: 'Your profile is live and visible to clients'
        };
      case 'draft':
        return {
          status: 'Draft',
          icon: <Clock className="h-4 w-4 text-gray-500" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          description: 'Your profile is saved but not published'
        };
      case 'review':
        return {
          status: 'Under Review',
          icon: <Eye className="h-4 w-4 text-yellow-500" />,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          description: 'Your profile is being reviewed before publication'
        };
      case 'unpublished':
        return {
          status: 'Unpublished',
          icon: <EyeOff className="h-4 w-4 text-orange-500" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          description: 'Your profile was unpublished'
        };
      case 'suspended':
        return {
          status: 'Suspended',
          icon: <Pause className="h-4 w-4 text-red-500" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          description: 'Your profile has been suspended'
        };
      default:
        return {
          status: 'Unknown',
          icon: <AlertCircle className="h-4 w-4 text-gray-500" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          description: 'Status unknown'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const canQuickPublish = validation?.isValid && canPublish && !isPublishing;
  const hasValidationIssues = validation && !validation.isValid;

  if (!canPublish) {
    return (
      <PermissionGuard 
        requireOwnership 
        className={className}
        showFallback={true}
      >
        <div></div>
      </PermissionGuard>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {statusInfo.icon}
              Publishing
            </CardTitle>
            <Badge 
              variant={isPublished ? "default" : "secondary"}
              className={isPublished ? "bg-green-500" : ""}
            >
              {statusInfo.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Status Description */}
          <div className={cn("p-3 rounded-lg", statusInfo.bgColor)}>
            <p className={cn("text-sm font-medium", statusInfo.color)}>
              {statusInfo.description}
            </p>
            {publishingStatus?.publishedAt && isPublished && (
              <p className="text-xs text-gray-600 mt-1">
                Published on {publishingStatus.publishedAt.toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Validation Issues Alert */}
          {hasValidationIssues && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {validation!.errors.length} issue{validation!.errors.length !== 1 ? 's' : ''} preventing publication
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Actions */}
          <div className="space-y-2">
            {isDraft && (
              <div className="flex gap-2">
                <Dialog open={showQuickPublish} onOpenChange={setShowQuickPublish}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      disabled={!canQuickPublish}
                      className="flex-1"
                    >
                      {isPublishing ? (
                        <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                      ) : (
                        <Play className="h-3 w-3 mr-2" />
                      )}
                      Publish
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Quick Publish Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        This will make your profile immediately visible to potential clients.
                      </p>
                      {validation && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-900">
                            Profile Score: {validation.completeness.score}%
                          </p>
                          <p className="text-xs text-blue-700">
                            {validation.completeness.score >= 80 ? 
                              'Your profile is well-optimized!' : 
                              'Consider optimizing your profile for better results'
                            }
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleQuickPublish}
                          disabled={isPublishing}
                          className="flex-1"
                        >
                          {isPublishing ? (
                            <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                          ) : (
                            <Play className="h-3 w-3 mr-2" />
                          )}
                          Publish Now
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowQuickPublish(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCreatePreview}
                >
                  <Eye className="h-3 w-3 mr-2" />
                  Preview
                </Button>
              </div>
            )}

            {isPublished && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCreatePreview}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3 mr-2" />
                  View Live
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => unpublishProfile()}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <Pause className="h-3 w-3 mr-2" />
                  Unpublish
                </Button>
              </div>
            )}
          </div>

          {/* Preview URL Display */}
          {previewUrl && (
            <div className="p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-3 w-3 text-blue-500 flex-shrink-0" />
                <code className="text-xs text-blue-700 flex-1 truncate">
                  {previewUrl}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyPreviewUrl}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Advanced Publishing Link */}
          <Link href="/dashboard/profile/publishing">
            <Button variant="ghost" size="sm" className="w-full justify-center">
              <Settings className="h-3 w-3 mr-2" />
              Advanced Settings
              <ArrowRight className="h-3 w-3 ml-2" />
            </Button>
          </Link>
        </CardContent>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-green-500 opacity-5 rounded-full" />
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {statusInfo.icon}
            Profile Publishing
          </CardTitle>
          <Badge 
            variant={isPublished ? "default" : "secondary"}
            className={isPublished ? "bg-green-500" : ""}
          >
            {statusInfo.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className={cn("p-4 rounded-lg", statusInfo.bgColor)}>
          <div className="flex items-start gap-3">
            {statusInfo.icon}
            <div className="flex-1">
              <p className={cn("font-medium", statusInfo.color)}>
                {statusInfo.description}
              </p>
              {publishingStatus?.publishedAt && isPublished && (
                <p className="text-sm text-gray-600 mt-1">
                  Published on {publishingStatus.publishedAt.toLocaleDateString()} at{' '}
                  {publishingStatus.publishedAt.toLocaleTimeString()}
                </p>
              )}
              {publishingStatus?.unpublishedAt && !isPublished && (
                <p className="text-sm text-gray-600 mt-1">
                  Last unpublished on {publishingStatus.unpublishedAt.toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Validation Status */}
        {validation && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Publishing Readiness</h4>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Profile Completion</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{validation.completeness.score}%</span>
                {validation.completeness.score >= 80 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            </div>

            {validation.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">{validation.errors.length} issue{validation.errors.length !== 1 ? 's' : ''} need attention:</p>
                    <ul className="text-sm space-y-1">
                      {validation.errors.slice(0, 2).map((error, index) => (
                        <li key={index}>• {error.message}</li>
                      ))}
                      {validation.errors.length > 2 && (
                        <li>• +{validation.errors.length - 2} more issues</li>
                      )}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Publishing Actions */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Actions</h4>
          
          {isDraft && (
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleQuickPublish}
                disabled={!canQuickPublish}
                className="w-full"
              >
                {isPublishing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Publish Now
              </Button>

              <Button 
                variant="outline" 
                onClick={handleCreatePreview}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>

              <Link href="/dashboard/profile/publishing" className="col-span-2">
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Publishing
                </Button>
              </Link>
            </div>
          )}

          {isPublished && (
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={handleCreatePreview}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Live Profile
              </Button>

              <Button 
                variant="outline" 
                onClick={() => unpublishProfile()}
                className="w-full text-orange-600 hover:text-orange-700"
              >
                <Pause className="h-4 w-4 mr-2" />
                Unpublish
              </Button>
            </div>
          )}
        </div>

        {/* Advanced Options */}
        <div className="pt-3 border-t">
          <Link href="/dashboard/profile/publishing">
            <Button variant="ghost" className="w-full justify-center">
              <Settings className="h-4 w-4 mr-2" />
              Advanced Publishing Settings
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Quick Publishing Status Indicator
 */
interface PublishingStatusBadgeProps {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  className?: string;
}

export function PublishingStatusBadge({
  profileId,
  userType,
  className
}: PublishingStatusBadgeProps) {
  const { publishingStatus, isPublished, isDraft } = useProfilePublishing({
    profileId,
    userType,
    autoValidate: false
  });

  const getStatusConfig = () => {
    if (!publishingStatus || isDraft) {
      return { 
        label: 'Draft', 
        variant: 'secondary' as const,
        icon: <Clock className="h-3 w-3" />
      };
    }

    switch (publishingStatus.status) {
      case 'published':
        return { 
          label: 'Live', 
          variant: 'default' as const,
          icon: <Globe className="h-3 w-3" />
        };
      case 'review':
        return { 
          label: 'Review', 
          variant: 'secondary' as const,
          icon: <Eye className="h-3 w-3" />
        };
      case 'unpublished':
        return { 
          label: 'Unpublished', 
          variant: 'outline' as const,
          icon: <EyeOff className="h-3 w-3" />
        };
      case 'suspended':
        return { 
          label: 'Suspended', 
          variant: 'destructive' as const,
          icon: <Pause className="h-3 w-3" />
        };
      default:
        return { 
          label: 'Unknown', 
          variant: 'outline' as const,
          icon: <AlertCircle className="h-3 w-3" />
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Badge variant={statusConfig.variant} className={cn("flex items-center gap-1", className)}>
      {statusConfig.icon}
      {statusConfig.label}
    </Badge>
  );
}