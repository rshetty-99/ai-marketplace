/**
 * Permission Guard Components
 * Provides role-based access control for UI components
 */

'use client';

import React from 'react';
import { useProfilePermissions, useProfileFeatureFlags } from '@/hooks/useProfilePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import {
  Lock,
  Crown,
  Shield,
  AlertCircle,
  Upgrade,
  CheckCircle,
  Clock,
  Star,
  Zap
} from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  feature?: string;
  requireOwnership?: boolean;
  fallback?: React.ReactNode;
  showFallback?: boolean;
  profileId?: string;
  className?: string;
}

/**
 * Main Permission Guard Component
 * Wraps content that requires specific permissions
 */
export function PermissionGuard({
  children,
  permission,
  feature,
  requireOwnership = false,
  fallback,
  showFallback = true,
  profileId,
  className
}: PermissionGuardProps) {
  const { 
    permissions, 
    isOwner, 
    isLoading, 
    checkPermission 
  } = useProfilePermissions({ profileId });
  
  const { features } = useProfileFeatureFlags();

  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  // Check ownership requirement
  if (requireOwnership && !isOwner) {
    return showFallback ? (
      fallback || (
        <PermissionDenied 
          reason="You can only access your own profile" 
          type="ownership"
          className={className}
        />
      )
    ) : null;
  }

  // Check specific permission
  if (permission && !checkPermission(permission)) {
    return showFallback ? (
      fallback || (
        <PermissionDenied 
          reason={`Missing permission: ${permission}`} 
          type="permission"
          className={className}
        />
      )
    ) : null;
  }

  // Check feature flag
  if (feature && !features.hasFeature(feature as any)) {
    return showFallback ? (
      fallback || (
        <FeatureUnavailable 
          feature={feature} 
          userType={permissions?.userType}
          roles={permissions?.roles}
          className={className}
        />
      )
    ) : null;
  }

  return <div className={className}>{children}</div>;
}

/**
 * Permission Denied Component
 */
interface PermissionDeniedProps {
  reason: string;
  type: 'permission' | 'ownership' | 'subscription' | 'verification';
  className?: string;
  showUpgrade?: boolean;
  onUpgrade?: () => void;
}

export function PermissionDenied({
  reason,
  type,
  className,
  showUpgrade = false,
  onUpgrade
}: PermissionDeniedProps) {
  const getIcon = () => {
    switch (type) {
      case 'ownership':
        return <Shield className="h-5 w-5 text-red-500" />;
      case 'subscription':
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'verification':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <Lock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'subscription':
        return 'default';
      case 'verification':
        return 'default';
      default:
        return 'destructive';
    }
  };

  return (
    <Alert variant={getVariant()} className={className}>
      {getIcon()}
      <AlertDescription>
        <div className="flex items-center justify-between">
          <span>{reason}</span>
          {showUpgrade && onUpgrade && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onUpgrade}
              className="ml-4"
            >
              <Upgrade className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Feature Unavailable Component
 */
interface FeatureUnavailableProps {
  feature: string;
  userType?: string;
  roles?: string[];
  className?: string;
}

export function FeatureUnavailable({
  feature,
  userType,
  roles,
  className
}: FeatureUnavailableProps) {
  const getFeatureInfo = (featureName: string) => {
    const featureMap: Record<string, {
      name: string;
      description: string;
      requiredPlan: string;
      icon: React.ReactNode;
    }> = {
      advancedAnalytics: {
        name: 'Advanced Analytics',
        description: 'Detailed performance insights and reporting',
        requiredPlan: 'Professional',
        icon: <Zap className="h-4 w-4 text-yellow-500" />
      },
      aiOptimization: {
        name: 'AI Optimization',
        description: 'AI-powered profile optimization suggestions',
        requiredPlan: 'Premium',
        icon: <Star className="h-4 w-4 text-purple-500" />
      },
      customCSS: {
        name: 'Custom CSS',
        description: 'Add custom styling to your profile',
        requiredPlan: 'Premium',
        icon: <Crown className="h-4 w-4 text-yellow-500" />
      },
      whiteLabel: {
        name: 'White Label',
        description: 'Remove platform branding',
        requiredPlan: 'Enterprise',
        icon: <Shield className="h-4 w-4 text-blue-500" />
      },
      teamManagement: {
        name: 'Team Management',
        description: 'Manage team members and permissions',
        requiredPlan: 'Organization',
        icon: <Crown className="h-4 w-4 text-green-500" />
      }
    };

    return featureMap[featureName] || {
      name: featureName,
      description: 'This feature is not available in your current plan',
      requiredPlan: 'Premium',
      icon: <Lock className="h-4 w-4 text-gray-500" />
    };
  };

  const featureInfo = getFeatureInfo(feature);

  return (
    <Card className={cn('border-dashed', className)}>
      <CardHeader className="text-center pb-3">
        <div className="flex items-center justify-center mb-2">
          {featureInfo.icon}
        </div>
        <CardTitle className="text-lg">{featureInfo.name}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-3">
        <p className="text-sm text-gray-600">
          {featureInfo.description}
        </p>
        <Badge variant="outline" className="mx-auto">
          Requires {featureInfo.requiredPlan}
        </Badge>
        <Button size="sm" className="w-full">
          <Crown className="h-3 w-3 mr-2" />
          Upgrade Plan
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Profile Completion Guard
 * Shows completion requirements
 */
interface ProfileCompletionGuardProps {
  children: React.ReactNode;
  requiredCompletion: number;
  currentCompletion?: number;
  className?: string;
}

export function ProfileCompletionGuard({
  children,
  requiredCompletion,
  currentCompletion = 0,
  className
}: ProfileCompletionGuardProps) {
  const isComplete = currentCompletion >= requiredCompletion;

  if (isComplete) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Alert className={className}>
      <Clock className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p>Complete your profile to access this feature</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(currentCompletion, 100)}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {currentCompletion}% / {requiredCompletion}%
            </span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Verification Guard
 * Requires profile verification
 */
interface VerificationGuardProps {
  children: React.ReactNode;
  isVerified?: boolean;
  className?: string;
}

export function VerificationGuard({
  children,
  isVerified = false,
  className
}: VerificationGuardProps) {
  if (isVerified) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Alert className={className}>
      <CheckCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Verification Required</p>
            <p className="text-sm text-gray-600">
              Verify your identity to access this feature
            </p>
          </div>
          <Button size="sm" variant="outline">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verify
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Role Badge Component
 * Shows user's current role and permissions
 */
interface RoleBadgeProps {
  userType?: string;
  roles?: string[];
  permissions?: string[];
  className?: string;
}

export function RoleBadge({
  userType,
  roles = [],
  permissions = [],
  className
}: RoleBadgeProps) {
  const { permissions: userPermissions } = useProfilePermissions();

  const displayRoles = roles.length > 0 ? roles : userPermissions?.roles || [];
  const displayUserType = userType || userPermissions?.userType;

  const getRoleColor = (role: string) => {
    if (role.includes('admin')) return 'bg-red-100 text-red-800';
    if (role.includes('premium')) return 'bg-purple-100 text-purple-800';
    if (role.includes('enterprise')) return 'bg-blue-100 text-blue-800';
    if (role.includes('verified')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'organization':
        return <Crown className="h-3 w-3" />;
      case 'vendor':
        return <Star className="h-3 w-3" />;
      case 'freelancer':
        return <Zap className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (!displayUserType && displayRoles.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-1 flex-wrap', className)}>
      {displayUserType && (
        <Badge variant="outline" className="text-xs">
          {getTypeIcon(displayUserType)}
          <span className="ml-1 capitalize">{displayUserType}</span>
        </Badge>
      )}
      
      {displayRoles.slice(0, 2).map((role) => (
        <Badge 
          key={role} 
          className={cn('text-xs', getRoleColor(role))}
        >
          {role.replace(/_/g, ' ')}
        </Badge>
      ))}
      
      {displayRoles.length > 2 && (
        <Badge variant="outline" className="text-xs">
          +{displayRoles.length - 2} more
        </Badge>
      )}
    </div>
  );
}

/**
 * Permission Debug Component
 * Shows current permissions for debugging (dev only)
 */
export function PermissionDebug() {
  const { permissions, isLoading } = useProfilePermissions();
  const { features } = useProfileFeatureFlags();

  if (process.env.NODE_ENV !== 'development' || isLoading || !permissions) {
    return null;
  }

  return (
    <Card className="mt-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm text-yellow-800">
          🔧 Permission Debug (Dev Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <strong>User Type:</strong> {permissions.userType}
        </div>
        <div>
          <strong>Roles:</strong> {permissions.roles.join(', ') || 'None'}
        </div>
        <div>
          <strong>Permissions:</strong> {permissions.permissions.join(', ') || 'None'}
        </div>
        <div>
          <strong>Profile Permissions:</strong> {permissions.profileSpecificPermissions.join(', ') || 'None'}
        </div>
        <div>
          <strong>Features:</strong> {Object.entries(features).filter(([, enabled]) => enabled).map(([name]) => name).join(', ') || 'None'}
        </div>
      </CardContent>
    </Card>
  );
}