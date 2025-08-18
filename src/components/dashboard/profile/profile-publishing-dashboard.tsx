/**
 * Profile Publishing Dashboard Component
 * Comprehensive interface for managing profile publication workflow
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { useProfilePublishing } from '@/hooks/useProfilePublishing';
import { PublishingSchedule } from '@/lib/profile/publishing-service';
import { cn } from '@/lib/utils';

import {
  Globe,
  Eye,
  Edit,
  Check,
  X,
  AlertCircle,
  Info,
  Clock,
  Share2,
  Copy,
  ExternalLink,
  FileText,
  RotateCcw,
  Calendar,
  Shield,
  Zap,
  TrendingUp,
  Users,
  Star,
  Target,
  Settings,
  History,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

interface ProfilePublishingDashboardProps {
  profileId: string;
  userType: 'freelancer' | 'vendor' | 'organization';
  className?: string;
}

export function ProfilePublishingDashboard({
  profileId,
  userType,
  className
}: ProfilePublishingDashboardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [unpublishReason, setUnpublishReason] = useState('');
  const [publishingSchedule, setPublishingSchedule] = useState<PublishingSchedule>({
    autoRenew: false
  });
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);

  const {
    publishingStatus,
    validation,
    isPublished,
    isDraft,
    isValidating,
    isPublishing,
    isLoading,
    validateProfile,
    publishProfile,
    unpublishProfile,
    createPreview,
    versions,
    restoreVersion
  } = useProfilePublishing({
    profileId,
    userType,
    autoValidate: true
  });

  const handleCreatePreview = async () => {
    const preview = await createPreview(24);
    if (preview) {
      setPreviewUrl(preview.previewUrl);
    }
  };

  const handlePublish = async () => {
    await publishProfile();
  };

  const handleScheduledPublish = async () => {
    await publishProfile(publishingSchedule);
    setShowScheduleDialog(false);
  };

  const handleUnpublish = async () => {
    await unpublishProfile(unpublishReason);
    setShowUnpublishDialog(false);
    setUnpublishReason('');
  };

  const handleCopyPreview = () => {
    if (previewUrl) {
      navigator.clipboard.writeText(previewUrl);
    }
  };

  const getStatusBadge = () => {
    if (!publishingStatus) {
      return <Badge variant="secondary">Draft</Badge>;
    }

    switch (publishingStatus.status) {
      case 'published':
        return <Badge variant="default" className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'review':
        return <Badge variant="outline">Under Review</Badge>;
      case 'unpublished':
        return <Badge variant="destructive">Unpublished</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getCompletenessColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profile Publishing</h2>
          <p className="text-gray-600">Manage your profile visibility and publication settings</p>
        </div>
        
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={validateProfile}
            disabled={isValidating}
          >
            {isValidating ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Validate
          </Button>
        </div>
      </div>

      {/* Profile Completeness */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Profile Completeness
            </CardTitle>
            <CardDescription>
              Complete your profile to maximize visibility and engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Score</span>
                <span className="text-2xl font-bold">{validation.completeness.score}%</span>
              </div>
              
              <Progress 
                value={validation.completeness.score} 
                className={cn("h-3", getCompletenessColor(validation.completeness.score))}
              />

              {validation.completeness.score < 100 && (
                <div className="space-y-3">
                  {validation.completeness.missingRequired.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-600 mb-2">Required Fields Missing</h4>
                      <div className="grid gap-1">
                        {validation.completeness.missingRequired.map((field) => (
                          <div key={field} className="flex items-center gap-2 text-sm">
                            <X className="h-3 w-3 text-red-500" />
                            <span>{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {validation.completeness.missingOptional.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-orange-600 mb-2">Recommended Fields</h4>
                      <div className="grid gap-1">
                        {validation.completeness.missingOptional.slice(0, 3).map((field) => (
                          <div key={field} className="flex items-center gap-2 text-sm text-gray-600">
                            <AlertCircle className="h-3 w-3 text-orange-500" />
                            <span>{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                          </div>
                        ))}
                        {validation.completeness.missingOptional.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{validation.completeness.missingOptional.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="space-y-3">
          {validation.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Fix these issues before publishing:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index} className="text-sm">{error.message}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {validation.warnings.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Suggestions to improve your profile:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {validation.warnings.slice(0, 3).map((warning, index) => (
                      <li key={index} className="text-sm">{warning.message}</li>
                    ))}
                    {validation.warnings.length > 3 && (
                      <li className="text-sm text-gray-500">+{validation.warnings.length - 3} more suggestions</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Publishing Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Publication Status
          </CardTitle>
          <CardDescription>
            Control when and how your profile appears to the public
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isDraft && (
              <div className="space-y-3">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Your profile is currently in draft mode. Publish it to make it visible to potential clients.
                  </AlertDescription>
                </Alert>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={handlePublish}
                    disabled={!validation?.isValid || isPublishing}
                    className="flex items-center gap-2"
                  >
                    {isPublishing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Publish Now
                  </Button>

                  <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule Publication</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Publish Date</Label>
                          <DateTimePicker
                            value={publishingSchedule.scheduledFor}
                            onChange={(date) => setPublishingSchedule(prev => ({ ...prev, scheduledFor: date }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label>Auto-renew</Label>
                          <Switch
                            checked={publishingSchedule.autoRenew}
                            onCheckedChange={(checked) => setPublishingSchedule(prev => ({ ...prev, autoRenew: checked }))}
                          />
                        </div>

                        <Button onClick={handleScheduledPublish} className="w-full">
                          Schedule Publication
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" onClick={handleCreatePreview}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </div>
            )}

            {isPublished && (
              <div className="space-y-3">
                <Alert className="border-green-200 bg-green-50">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Your profile is live and visible to potential clients.
                    {publishingStatus?.publishedAt && (
                      <span className="block text-sm mt-1">
                        Published on {publishingStatus.publishedAt.toLocaleDateString()}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleCreatePreview}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>

                  <Dialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="text-red-600 hover:text-red-700">
                        <Pause className="h-4 w-4 mr-2" />
                        Unpublish
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Unpublish Profile</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          This will make your profile invisible to the public. You can republish it anytime.
                        </p>
                        
                        <div>
                          <Label>Reason (optional)</Label>
                          <Textarea
                            value={unpublishReason}
                            onChange={(e) => setUnpublishReason(e.target.value)}
                            placeholder="Why are you unpublishing your profile?"
                          />
                        </div>

                        <Button onClick={handleUnpublish} variant="destructive" className="w-full">
                          Unpublish Profile
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}

            {/* Preview URL */}
            {previewUrl && (
              <Alert>
                <Share2 className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Preview link created (expires in 24 hours):</p>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1 truncate">
                        {previewUrl}
                      </code>
                      <Button size="sm" variant="outline" onClick={handleCopyPreview}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => window.open(previewUrl, '_blank')}>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Version History */}
      {versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </CardTitle>
            <CardDescription>
              Track changes and restore previous versions of your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {versions.slice(0, 5).map((version) => (
                <div key={version.versionId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">v{version.version}</Badge>
                      {version.isPublished && (
                        <Badge variant="default" className="bg-green-500">Published</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {version.createdAt.toLocaleDateString()} at {version.createdAt.toLocaleTimeString()}
                    </p>
                    {version.changeLog && (
                      <p className="text-xs text-gray-500">{version.changeLog}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restoreVersion(version.versionId)}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
              
              {versions.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  +{versions.length - 5} more versions
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}