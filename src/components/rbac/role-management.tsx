'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Lock, 
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Settings
} from 'lucide-react';
import { useRoleManagement, usePermissions, PermissionGuard } from '@/hooks/useRBAC';
import { Role, Permission, MARKETPLACE_PERMISSIONS } from '@/lib/firebase/rbac-schema';

interface RoleManagementProps {
  organizationId?: string;
  userType?: Role['userType'];
}

export function RoleManagement({ organizationId, userType }: RoleManagementProps) {
  const { roles, isLoading, error, loadRoles, createRole, updateRole, deleteRole } = useRoleManagement(organizationId);
  const { allPermissions, getPermissionsByResource } = usePermissions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'system' | 'custom'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadRoles(userType);
  }, [loadRoles, userType]);

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'system' && role.isSystem) ||
                         (filterType === 'custom' && !role.isSystem);
    
    return matchesSearch && matchesFilter;
  });

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsEditDialogOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!selectedRole) return;
    
    try {
      await deleteRole(selectedRole.id);
      setIsDeleteDialogOpen(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Role Management</h2>
          <p className="text-muted-foreground">
            Manage roles and permissions for your organization
          </p>
        </div>
        <PermissionGuard permission="role.create" organizationId={organizationId}>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <CreateRoleDialog 
              organizationId={organizationId}
              userType={userType}
              onClose={() => setIsCreateDialogOpen(false)}
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                loadRoles(userType);
              }}
            />
          </Dialog>
        </PermissionGuard>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="system">System Roles</SelectItem>
            <SelectItem value="custom">Custom Roles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            organizationId={organizationId}
            onEdit={handleEditRole}
            onDelete={handleDeleteRole}
          />
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No roles found</h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm ? 'Try adjusting your search criteria' : 'Create your first custom role to get started'}
          </p>
        </div>
      )}

      {/* Edit Role Dialog */}
      {selectedRole && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <EditRoleDialog
            role={selectedRole}
            organizationId={organizationId}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedRole(null);
            }}
            onSuccess={() => {
              setIsEditDialogOpen(false);
              setSelectedRole(null);
              loadRoles(userType);
            }}
          />
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role "{selectedRole?.name}"? 
              This action cannot be undone and will affect all users with this role.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteRole}
            >
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Role Card Component
interface RoleCardProps {
  role: Role;
  organizationId?: string;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}

function RoleCard({ role, organizationId, onEdit, onDelete }: RoleCardProps) {
  const getPermissionCount = (permissions: string[]) => {
    return permissions.length;
  };

  const getRoleTypeColor = (isSystem: boolean) => {
    return isSystem ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  return (
    <Card className="relative group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{role.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getRoleTypeColor(role.isSystem)}`}
                >
                  {role.isSystem ? 'System' : 'Custom'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {role.userType.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
          
          {!role.isSystem && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <PermissionGuard permission="role.update.organization" organizationId={organizationId}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(role)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              </PermissionGuard>
              <PermissionGuard permission="role.delete.organization" organizationId={organizationId}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(role)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </PermissionGuard>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <CardDescription className="mb-4 line-clamp-2">
          {role.description}
        </CardDescription>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>{getPermissionCount(role.permissions)} permissions</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEdit(role)}
            className="text-xs"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Create Role Dialog Component
interface CreateRoleDialogProps {
  organizationId?: string;
  userType?: Role['userType'];
  onClose: () => void;
  onSuccess: () => void;
}

function CreateRoleDialog({ organizationId, userType, onClose, onSuccess }: CreateRoleDialogProps) {
  const { createRole } = useRoleManagement(organizationId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    userType: userType || 'vendor' as Role['userType'],
    permissions: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    try {
      setIsSubmitting(true);
      
      await createRole({
        name: formData.name,
        description: formData.description,
        userType: formData.userType,
        permissions: formData.permissions,
        isSystem: false,
        isCustom: true,
        organizationId
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogDescription>
          Define a custom role with specific permissions for your organization
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="roleName">Role Name *</Label>
            <Input
              id="roleName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Project Manager"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userType">User Type</Label>
            <Select 
              value={formData.userType} 
              onValueChange={(value: Role['userType']) => 
                setFormData(prev => ({ ...prev, userType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="freelancer">Freelancer</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the role and its responsibilities..."
            rows={3}
          />
        </div>

        <PermissionSelector
          selectedPermissions={formData.permissions}
          onPermissionsChange={(permissions) => 
            setFormData(prev => ({ ...prev, permissions }))
          }
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
            {isSubmitting ? 'Creating...' : 'Create Role'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// Edit Role Dialog Component
interface EditRoleDialogProps {
  role: Role;
  organizationId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

function EditRoleDialog({ role, organizationId, onClose, onSuccess }: EditRoleDialogProps) {
  const { updateRole } = useRoleManagement(organizationId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: role.name,
    description: role.description,
    permissions: [...role.permissions]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      
      await updateRole(role.id, {
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit Role: {role.name}</DialogTitle>
        <DialogDescription>
          Modify the role settings and permissions
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roleName">Role Name *</Label>
            <Input
              id="roleName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={role.isSystem}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={role.isSystem}
              rows={3}
            />
          </div>
        </div>

        <PermissionSelector
          selectedPermissions={formData.permissions}
          onPermissionsChange={(permissions) => 
            setFormData(prev => ({ ...prev, permissions }))
          }
          disabled={role.isSystem}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || role.isSystem}
          >
            {isSubmitting ? 'Updating...' : 'Update Role'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// Permission Selector Component
interface PermissionSelectorProps {
  selectedPermissions: string[];
  onPermissionsChange: (permissions: string[]) => void;
  disabled?: boolean;
}

function PermissionSelector({ 
  selectedPermissions, 
  onPermissionsChange, 
  disabled = false 
}: PermissionSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResource, setSelectedResource] = useState<string>('all');

  // Group permissions by resource
  const permissionsByResource = MARKETPLACE_PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const resources = Object.keys(permissionsByResource);

  const filteredPermissions = MARKETPLACE_PERMISSIONS.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResource = selectedResource === 'all' || permission.resource === selectedResource;
    
    return matchesSearch && matchesResource;
  });

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    if (disabled) return;

    const newPermissions = checked
      ? [...selectedPermissions, permissionId]
      : selectedPermissions.filter(id => id !== permissionId);
    
    onPermissionsChange(newPermissions);
  };

  const handleResourceToggle = (resource: string, checked: boolean) => {
    if (disabled) return;

    const resourcePermissions = permissionsByResource[resource].map(p => p.id);
    
    if (checked) {
      const newPermissions = [...new Set([...selectedPermissions, ...resourcePermissions])];
      onPermissionsChange(newPermissions);
    } else {
      const newPermissions = selectedPermissions.filter(id => !resourcePermissions.includes(id));
      onPermissionsChange(newPermissions);
    }
  };

  const isResourceFullySelected = (resource: string) => {
    const resourcePermissions = permissionsByResource[resource].map(p => p.id);
    return resourcePermissions.every(id => selectedPermissions.includes(id));
  };

  const isResourcePartiallySelected = (resource: string) => {
    const resourcePermissions = permissionsByResource[resource].map(p => p.id);
    return resourcePermissions.some(id => selectedPermissions.includes(id)) && 
           !isResourceFullySelected(resource);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Permissions ({selectedPermissions.length} selected)</Label>
        <p className="text-sm text-muted-foreground">
          Select the permissions this role should have
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={disabled}
          />
        </div>
        <Select value={selectedResource} onValueChange={setSelectedResource}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            {resources.map(resource => (
              <SelectItem key={resource} value={resource}>
                {resource.charAt(0).toUpperCase() + resource.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Permissions by Resource */}
      <ScrollArea className="h-[400px] border rounded-md p-4">
        <div className="space-y-6">
          {resources.map(resource => {
            const resourcePermissions = permissionsByResource[resource];
            const isFullySelected = isResourceFullySelected(resource);
            const isPartiallySelected = isResourcePartiallySelected(resource);

            return (
              <div key={resource} className="space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b">
                  <Checkbox
                    checked={isFullySelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isPartiallySelected;
                    }}
                    onCheckedChange={(checked) => handleResourceToggle(resource, checked as boolean)}
                    disabled={disabled}
                  />
                  <h4 className="font-medium capitalize">{resource} Permissions</h4>
                  <Badge variant="outline" className="ml-auto">
                    {resourcePermissions.filter(p => selectedPermissions.includes(p.id)).length} / {resourcePermissions.length}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
                  {resourcePermissions
                    .filter(permission => 
                      selectedResource === 'all' || 
                      selectedResource === resource
                    )
                    .filter(permission =>
                      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      permission.description.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(permission => (
                      <div key={permission.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50">
                        <Checkbox
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked as boolean)}
                          disabled={disabled}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{permission.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {permission.description}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {permission.action}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {permission.scope}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}