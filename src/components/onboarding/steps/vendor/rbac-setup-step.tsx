'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, Shield, Plus, Trash2, CheckCircle, AlertCircle, Settings, 
  Crown, User, UserCheck, Lock, Eye, Edit, Save 
} from 'lucide-react';
import { VendorCompanyOnboarding, RoleDefinition } from '@/lib/firebase/onboarding-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface RBACSetupStepProps {
  data: Partial<VendorCompanyOnboarding>;
  onUpdate: (data: Partial<VendorCompanyOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const PERMISSION_CATEGORIES = {
  'Project Management': [
    { id: 'view_projects', name: 'View Projects', description: 'View project details and status' },
    { id: 'create_projects', name: 'Create Projects', description: 'Create new projects and proposals' },
    { id: 'edit_projects', name: 'Edit Projects', description: 'Modify existing projects' },
    { id: 'delete_projects', name: 'Delete Projects', description: 'Remove projects from system' },
    { id: 'manage_project_team', name: 'Manage Project Teams', description: 'Add/remove team members from projects' },
  ],
  'Client Management': [
    { id: 'view_clients', name: 'View Clients', description: 'Access client information' },
    { id: 'manage_clients', name: 'Manage Clients', description: 'Add, edit, and remove clients' },
    { id: 'client_communication', name: 'Client Communication', description: 'Send messages and updates to clients' },
  ],
  'Financial': [
    { id: 'view_financials', name: 'View Financials', description: 'Access financial reports and data' },
    { id: 'manage_pricing', name: 'Manage Pricing', description: 'Set and modify service pricing' },
    { id: 'approve_budgets', name: 'Approve Budgets', description: 'Approve project budgets and expenses' },
    { id: 'process_payments', name: 'Process Payments', description: 'Handle payment processing and invoicing' },
  ],
  'Team Management': [
    { id: 'view_team', name: 'View Team', description: 'View team member information' },
    { id: 'manage_team', name: 'Manage Team', description: 'Add, edit, and remove team members' },
    { id: 'assign_roles', name: 'Assign Roles', description: 'Assign and modify user roles' },
    { id: 'manage_permissions', name: 'Manage Permissions', description: 'Configure role permissions' },
  ],
  'Analytics & Reports': [
    { id: 'view_analytics', name: 'View Analytics', description: 'Access performance analytics' },
    { id: 'export_reports', name: 'Export Reports', description: 'Export data and generate reports' },
    { id: 'view_audit_logs', name: 'View Audit Logs', description: 'Access system audit trails' },
  ],
  'System Administration': [
    { id: 'manage_settings', name: 'Manage Settings', description: 'Configure system settings' },
    { id: 'manage_integrations', name: 'Manage Integrations', description: 'Configure third-party integrations' },
    { id: 'platform_admin', name: 'Platform Admin', description: 'Full platform administration access' },
  ]
};

const DEFAULT_ROLES = [
  {
    id: 'owner',
    name: 'Company Owner',
    description: 'Full access to all company resources and settings',
    type: 'admin' as const,
    tier: 'owner' as const,
    isSystem: true,
    permissions: Object.values(PERMISSION_CATEGORIES).flat().map(p => p.id),
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Manage team, projects, and most company settings',
    type: 'admin' as const,
    tier: 'admin' as const,
    isSystem: false,
    permissions: [
      'view_projects', 'create_projects', 'edit_projects', 'manage_project_team',
      'view_clients', 'manage_clients', 'client_communication',
      'view_financials', 'manage_pricing', 'approve_budgets',
      'view_team', 'manage_team', 'assign_roles',
      'view_analytics', 'export_reports', 'view_audit_logs',
      'manage_settings'
    ],
  },
  {
    id: 'project_manager',
    name: 'Project Manager',
    description: 'Manage projects and coordinate with teams and clients',
    type: 'manager' as const,
    tier: 'standard' as const,
    isSystem: false,
    permissions: [
      'view_projects', 'create_projects', 'edit_projects', 'manage_project_team',
      'view_clients', 'client_communication',
      'view_financials', 'manage_pricing',
      'view_team', 'view_analytics'
    ],
  },
  {
    id: 'team_lead',
    name: 'Team Lead',
    description: 'Lead project teams and manage deliverables',
    type: 'lead' as const,
    tier: 'standard' as const,
    isSystem: false,
    permissions: [
      'view_projects', 'edit_projects', 'manage_project_team',
      'view_clients', 'client_communication',
      'view_financials', 'view_team', 'view_analytics'
    ],
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Work on projects and contribute to deliverables',
    type: 'member' as const,
    tier: 'standard' as const,
    isSystem: false,
    permissions: [
      'view_projects', 'view_clients', 'view_team', 'view_analytics'
    ],
  }
];

export function RBACSetupStep({ data, onUpdate, onNext, onPrevious, isSubmitting }: RBACSetupStepProps) {
  const { trackEvent } = useAnalytics();
  const [roles, setRoles] = useState<RoleDefinition[]>(DEFAULT_ROLES);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    type: 'member' as const,
    tier: 'standard' as const,
    permissions: [] as string[]
  });

  const rbacSetup = data.rbacSetup || {};

  useEffect(() => {
    trackEvent('vendor_onboarding_step_viewed', {
      step: 'rbac_setup',
      stepNumber: 2
    });

    // Initialize with existing roles or defaults
    if (rbacSetup.roles && rbacSetup.roles.length > 0) {
      setRoles(rbacSetup.roles);
    }
  }, [trackEvent, rbacSetup.roles]);

  const handleRoleUpdate = (roleId: string, updates: Partial<RoleDefinition>) => {
    const updatedRoles = roles.map(role => 
      role.id === roleId ? { ...role, ...updates } : role
    );
    setRoles(updatedRoles);
    updateData({ roles: updatedRoles });
  };

  const handlePermissionToggle = (roleId: string, permissionId: string, checked: boolean) => {
    const updatedRoles = roles.map(role => {
      if (role.id === roleId) {
        const permissions = checked 
          ? [...role.permissions, permissionId]
          : role.permissions.filter(p => p !== permissionId);
        return { ...role, permissions };
      }
      return role;
    });
    setRoles(updatedRoles);
    updateData({ roles: updatedRoles });
  };

  const handleCreateRole = () => {
    if (!newRole.name.trim()) return;

    const roleId = newRole.name.toLowerCase().replace(/\s+/g, '_');
    const role: RoleDefinition = {
      id: roleId,
      name: newRole.name,
      description: newRole.description,
      type: newRole.type,
      tier: newRole.tier,
      isSystem: false,
      permissions: newRole.permissions
    };

    const updatedRoles = [...roles, role];
    setRoles(updatedRoles);
    updateData({ roles: updatedRoles });

    // Reset form
    setNewRole({
      name: '',
      description: '',
      type: 'member',
      tier: 'standard',
      permissions: []
    });
    setIsCreatingRole(false);

    trackEvent('vendor_rbac_role_created', {
      roleName: role.name,
      roleType: role.type,
      permissionCount: role.permissions.length
    });
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) return; // Cannot delete system roles

    const updatedRoles = roles.filter(r => r.id !== roleId);
    setRoles(updatedRoles);
    updateData({ roles: updatedRoles });

    if (selectedRole === roleId) {
      setSelectedRole('');
    }

    trackEvent('vendor_rbac_role_deleted', {
      roleName: role?.name,
      roleType: role?.type
    });
  };

  const updateData = (updates: Partial<VendorCompanyOnboarding['rbacSetup']>) => {
    onUpdate({
      ...data,
      rbacSetup: {
        ...rbacSetup,
        ...updates
      }
    });
  };

  const handleNext = () => {
    // Validation - ensure at least basic roles exist
    const hasOwnerRole = roles.some(r => r.type === 'admin' && r.tier === 'owner');
    
    if (!hasOwnerRole) {
      // Add owner role if missing
      const ownerRole = DEFAULT_ROLES.find(r => r.id === 'owner');
      if (ownerRole) {
        const finalRoles = [...roles, ownerRole];
        setRoles(finalRoles);
        updateData({ roles: finalRoles });
      }
    }

    trackEvent('vendor_onboarding_step_completed', {
      step: 'rbac_setup',
      stepNumber: 2,
      roleCount: roles.length,
      customRoleCount: roles.filter(r => !r.isSystem).length
    });

    onNext();
  };

  const getRoleIcon = (role: RoleDefinition) => {
    switch (role.type) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'manager': return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'lead': return <Shield className="w-4 h-4 text-green-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const selectedRoleData = roles.find(r => r.id === selectedRole);

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Shield className="w-5 h-5 text-blue-600" />
        <div>
          <h3 className="font-medium">Role-Based Access Control</h3>
          <p className="text-sm text-muted-foreground">
            Define user roles and permissions for your team
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roles List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Roles
                </CardTitle>
                <CardDescription>
                  Manage user roles and their access levels
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setIsCreatingRole(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-3 h-3" />
                Add Role
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRole === role.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedRole(role.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getRoleIcon(role)}
                        <div>
                          <div className="font-medium text-sm">{role.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {role.permissions.length} permissions
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={role.isSystem ? 'default' : 'secondary'} className="text-xs">
                          {role.isSystem ? 'System' : 'Custom'}
                        </Badge>
                        {!role.isSystem && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRole(role.id);
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {role.description}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Role Details / Creation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {isCreatingRole ? 'Create New Role' : selectedRoleData ? 'Role Permissions' : 'Select a Role'}
            </CardTitle>
            <CardDescription>
              {isCreatingRole 
                ? 'Define a new role with specific permissions'
                : selectedRoleData 
                ? `Configure permissions for ${selectedRoleData.name}`
                : 'Choose a role to view and edit its permissions'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCreatingRole ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roleName">Role Name</Label>
                  <Input
                    id="roleName"
                    value={newRole.name}
                    onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Senior Developer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roleDescription">Description</Label>
                  <Textarea
                    id="roleDescription"
                    value={newRole.description}
                    onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this role's responsibilities"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roleType">Role Type</Label>
                    <Select
                      value={newRole.type}
                      onValueChange={(value) => setNewRole(prev => ({ ...prev, type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="lead">Team Lead</SelectItem>
                        <SelectItem value="member">Team Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roleTier">Access Tier</Label>
                    <Select
                      value={newRole.tier}
                      onValueChange={(value) => setNewRole(prev => ({ ...prev, tier: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateRole} disabled={!newRole.name.trim()}>
                    <Save className="w-4 h-4 mr-2" />
                    Create Role
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreatingRole(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : selectedRoleData ? (
              <ScrollArea className="h-80">
                <div className="space-y-4">
                  {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                    <div key={category} className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        {category}
                      </h4>
                      <div className="space-y-2 pl-5">
                        {permissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-3">
                            <Checkbox
                              id={`${selectedRole}-${permission.id}`}
                              checked={selectedRoleData.permissions.includes(permission.id)}
                              onCheckedChange={(checked) => 
                                handlePermissionToggle(selectedRole, permission.id, checked as boolean)
                              }
                              disabled={selectedRoleData.isSystem}
                            />
                            <Label 
                              htmlFor={`${selectedRole}-${permission.id}`}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              <div>
                                <div className="font-medium">{permission.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {permission.description}
                                </div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                      <Separator />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-center">
                <Shield className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-muted-foreground mb-2">No Role Selected</h3>
                <p className="text-sm text-muted-foreground">
                  Select a role from the list to view and configure its permissions
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            RBAC Summary
          </CardTitle>
          <CardDescription>
            Review your role and permission configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{roles.length}</div>
              <div className="text-sm text-muted-foreground">Total Roles</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {roles.filter(r => !r.isSystem).length}
              </div>
              <div className="text-sm text-muted-foreground">Custom Roles</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(PERMISSION_CATEGORIES).flat().length}
              </div>
              <div className="text-sm text-muted-foreground">Available Permissions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-6">
        <Button variant="outline" onClick={onPrevious} disabled={isSubmitting}>
          Previous
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Step 2 of 8 • {roles.length} roles configured
          </div>
          <Button onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}