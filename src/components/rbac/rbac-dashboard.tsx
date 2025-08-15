'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Users, 
  Settings, 
  Key, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Crown,
  Lock,
  Eye,
  BarChart3
} from 'lucide-react';
import { RoleManagement } from './role-management';
import { UserRoleAssignment } from './user-role-assignment';
import { useRBAC, useRoleManagement, useRBACInitialization, PermissionGuard } from '@/hooks/useRBAC';
import { Role } from '@/lib/firebase/rbac-schema';

interface RBACDashboardProps {
  organizationId?: string;
  userType?: Role['userType'];
}

export function RBACDashboard({ organizationId, userType }: RBACDashboardProps) {
  const { userRoles, userPermissions, isLoading: rbacLoading } = useRBAC();
  const { roles, loadRoles } = useRoleManagement(organizationId);
  const { isInitialized, isInitializing, initializeSystem } = useRBACInitialization();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration - replace with real data
  const stats = {
    totalRoles: roles.length,
    customRoles: roles.filter(r => !r.isSystem).length,
    totalUsers: 24, // This would come from your user management system
    activeUsers: 22
  };

  if (!isInitialized && !isInitializing) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            RBAC system needs to be initialized. This will create default roles and permissions.
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center">
          <Button onClick={initializeSystem}>
            Initialize RBAC System
          </Button>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Initializing RBAC system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Access Control</h1>
          <p className="text-muted-foreground">
            Manage roles, permissions, and user access for your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            System Active
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            User Assignment
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRoles}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.customRoles} custom roles
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  of {stats.totalUsers} total users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Roles</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userRoles.length}</div>
                <p className="text-xs text-muted-foreground">
                  role{userRoles.length !== 1 ? 's' : ''} assigned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Permissions</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userPermissions.length}</div>
                <p className="text-xs text-muted-foreground">
                  permission{userPermissions.length !== 1 ? 's' : ''} granted
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Your Access Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Your Roles
                </CardTitle>
                <CardDescription>
                  Roles currently assigned to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userRoles.length > 0 ? (
                  <div className="space-y-3">
                    {userRoles.map((userRole) => {
                      const role = roles.find(r => r.id === userRole.roleId);
                      return (
                        <div key={userRole.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${role?.isSystem ? 'bg-blue-100' : 'bg-green-100'}`}>
                              <Shield className={`w-4 h-4 ${role?.isSystem ? 'text-blue-600' : 'text-green-600'}`} />
                            </div>
                            <div>
                              <div className="font-medium">{role?.name || 'Unknown Role'}</div>
                              <div className="text-sm text-muted-foreground">
                                {role?.description}
                              </div>
                            </div>
                          </div>
                          <Badge variant={role?.isSystem ? 'default' : 'secondary'}>
                            {role?.isSystem ? 'System' : 'Custom'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Crown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No roles assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Permission Summary
                </CardTitle>
                <CardDescription>
                  Overview of your access permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userPermissions.length > 0 ? (
                  <div className="space-y-4">
                    {/* Group permissions by resource */}
                    {Object.entries(
                      userPermissions.reduce((acc, perm) => {
                        if (!acc[perm.resource]) acc[perm.resource] = [];
                        acc[perm.resource].push(perm);
                        return acc;
                      }, {} as Record<string, typeof userPermissions>)
                    ).slice(0, 5).map(([resource, perms]) => (
                      <div key={resource} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-muted-foreground" />
                          <span className="capitalize font-medium">{resource}</span>
                        </div>
                        <Badge variant="outline">
                          {perms.length} permission{perms.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    ))}
                    {Object.keys(userPermissions.reduce((acc, perm) => {
                      if (!acc[perm.resource]) acc[perm.resource] = [];
                      acc[perm.resource].push(perm);
                      return acc;
                    }, {} as Record<string, typeof userPermissions>)).length > 5 && (
                      <div className="text-sm text-muted-foreground text-center pt-2">
                        +{Object.keys(userPermissions.reduce((acc, perm) => {
                          if (!acc[perm.resource]) acc[perm.resource] = [];
                          acc[perm.resource].push(perm);
                          return acc;
                        }, {} as Record<string, typeof userPermissions>)).length - 5} more resources
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No permissions granted</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common RBAC management tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PermissionGuard permission="role.create" organizationId={organizationId}>
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('roles')}
                  >
                    <Shield className="w-6 h-6" />
                    <span>Create New Role</span>
                  </Button>
                </PermissionGuard>

                <PermissionGuard permission="role.assign.organization" organizationId={organizationId}>
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('users')}
                  >
                    <Users className="w-6 h-6" />
                    <span>Assign Roles</span>
                  </Button>
                </PermissionGuard>

                <PermissionGuard permission="audit.read.organization" organizationId={organizationId}>
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('audit')}
                  >
                    <Activity className="w-6 h-6" />
                    <span>View Audit Log</span>
                  </Button>
                </PermissionGuard>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles">
          <PermissionGuard 
            permission="role.read.organization" 
            organizationId={organizationId}
            fallback={
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You don't have permission to view roles.
                </AlertDescription>
              </Alert>
            }
          >
            <RoleManagement organizationId={organizationId} userType={userType} />
          </PermissionGuard>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <PermissionGuard 
            permission="user.read.organization" 
            organizationId={organizationId}
            fallback={
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You don't have permission to view user assignments.
                </AlertDescription>
              </Alert>
            }
          >
            <UserRoleAssignment organizationId={organizationId} userType={userType} />
          </PermissionGuard>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit">
          <PermissionGuard 
            permission="audit.read.organization" 
            organizationId={organizationId}
            fallback={
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You don't have permission to view audit logs.
                </AlertDescription>
              </Alert>
            }
          >
            <AuditLogViewer organizationId={organizationId} />
          </PermissionGuard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Audit Log Viewer Component
interface AuditLogViewerProps {
  organizationId?: string;
}

function AuditLogViewer({ organizationId }: AuditLogViewerProps) {
  // This would integrate with the audit log system
  // For now, showing a placeholder
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Audit Log
        </CardTitle>
        <CardDescription>
          Track access control changes and user activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Audit Log</h3>
          <p className="text-sm text-muted-foreground">
            Audit log viewer will be implemented here
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            This will show role assignments, permission changes, and other security events
          </p>
        </div>
      </CardContent>
    </Card>
  );
}