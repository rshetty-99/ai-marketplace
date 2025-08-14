'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/lib/rbac/hooks';
import { Permission } from '@/lib/rbac/types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
  resourceId?: string;
}

export function PermissionGuard({ 
  permission, 
  children, 
  fallback,
  resourceId 
}: PermissionGuardProps) {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return <LoadingSpinner className="min-h-[200px]" />;
  }

  if (!hasPermission(permission, resourceId)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this resource.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            Required permission: {permission.replace(/_/g, ' ').toLowerCase()}
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

interface MultiPermissionGuardProps {
  permissions: Permission[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export function MultiPermissionGuard({ 
  permissions, 
  requireAll = false,
  children, 
  fallback 
}: MultiPermissionGuardProps) {
  const { hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading) {
    return <LoadingSpinner className="min-h-[200px]" />;
  }

  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You don't have the required permissions to access this resource.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            Required permissions: {permissions.map(p => p.replace(/_/g, ' ').toLowerCase()).join(', ')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}