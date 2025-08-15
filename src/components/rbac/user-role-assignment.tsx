'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  Plus, 
  Trash2, 
  Shield, 
  Search, 
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Crown,
  UserCheck,
  User
} from 'lucide-react';
import { useUserRoleAssignment, useRoleManagement, PermissionGuard } from '@/hooks/useRBAC';
import { Role, UserRole } from '@/lib/firebase/rbac-schema';

interface UserRoleAssignmentProps {
  organizationId?: string;
  userType?: Role['userType'];
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
  department?: string;
  jobTitle?: string;
  isActive: boolean;
}

export function UserRoleAssignment({ organizationId, userType }: UserRoleAssignmentProps) {
  const { roles, loadRoles } = useRoleManagement(organizationId);
  const { assignRole, revokeRole, getUserRoles, isLoading, error } = useUserRoleAssignment(organizationId);
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, UserRole[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [selectedRoleAssignment, setSelectedRoleAssignment] = useState<UserRole | null>(null);

  useEffect(() => {
    loadRoles(userType);
    loadUsers();
  }, [loadRoles, userType]);

  // Mock function to load users - replace with actual user fetching logic
  const loadUsers = async () => {
    // This would typically fetch from your user management system
    const mockUsers: UserProfile[] = [
      {
        id: 'user_1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        department: 'Engineering',
        jobTitle: 'Senior Developer',
        isActive: true
      },
      {
        id: 'user_2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        department: 'Product',
        jobTitle: 'Product Manager',
        isActive: true
      }
    ];
    
    setUsers(mockUsers);
    
    // Load user roles for each user
    const roleData: Record<string, UserRole[]> = {};
    for (const user of mockUsers) {
      try {
        const roles = await getUserRoles(user.id);
        roleData[user.id] = roles;
      } catch (error) {
        roleData[user.id] = [];
      }
    }
    setUserRoles(roleData);
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return fullName.includes(searchLower) || 
           user.email.toLowerCase().includes(searchLower) ||
           (user.department?.toLowerCase().includes(searchLower)) ||
           (user.jobTitle?.toLowerCase().includes(searchLower));
  });

  const handleAssignRole = (user: UserProfile) => {
    setSelectedUser(user);
    setIsAssignDialogOpen(true);
  };

  const handleRevokeRole = (user: UserProfile, roleAssignment: UserRole) => {
    setSelectedUser(user);
    setSelectedRoleAssignment(roleAssignment);
    setIsRevokeDialogOpen(true);
  };

  const confirmRevokeRole = async () => {
    if (!selectedRoleAssignment) return;
    
    try {
      await revokeRole(selectedRoleAssignment.id);
      setIsRevokeDialogOpen(false);
      setSelectedUser(null);
      setSelectedRoleAssignment(null);
      await loadUsers(); // Refresh user roles
    } catch (error) {
      console.error('Error revoking role:', error);
    }
  };

  const getRoleById = (roleId: string): Role | undefined => {
    return roles.find(role => role.id === roleId);
  };

  const getRoleIcon = (role?: Role) => {
    if (!role) return <User className="w-4 h-4" />;
    
    if (role.name.toLowerCase().includes('owner') || role.name.toLowerCase().includes('admin')) {
      return <Crown className="w-4 h-4" />;
    }
    if (role.name.toLowerCase().includes('manager')) {
      return <UserCheck className="w-4 h-4" />;
    }
    return <User className="w-4 h-4" />;
  };

  const getRoleColor = (role?: Role) => {
    if (!role) return 'bg-gray-100 text-gray-800';
    
    if (role.name.toLowerCase().includes('owner')) return 'bg-red-100 text-red-800';
    if (role.name.toLowerCase().includes('admin')) return 'bg-blue-100 text-blue-800';
    if (role.name.toLowerCase().includes('manager')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Role Assignment</h2>
          <p className="text-muted-foreground">
            Manage role assignments for organization members
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Organization Members ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            View and manage role assignments for your team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Current Roles</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const userRolesList = userRoles[user.id] || [];
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profileImage} alt={`${user.firstName} ${user.lastName}`} />
                          <AvatarFallback>
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {user.jobTitle && (
                            <div className="text-xs text-muted-foreground">{user.jobTitle}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm">{user.department || 'N/A'}</span>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {userRolesList.length > 0 ? (
                          userRolesList.map((userRole) => {
                            const role = getRoleById(userRole.roleId);
                            return (
                              <Badge
                                key={userRole.id}
                                variant="secondary"
                                className={`text-xs ${getRoleColor(role)}`}
                              >
                                {getRoleIcon(role)}
                                <span className="ml-1">{role?.name || 'Unknown Role'}</span>
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-sm text-muted-foreground">No roles assigned</span>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-2">
                        <PermissionGuard permission="role.assign.organization" organizationId={organizationId}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAssignRole(user)}
                            disabled={isLoading}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Assign
                          </Button>
                        </PermissionGuard>
                        
                        {userRolesList.length > 0 && (
                          <UserRoleMenu
                            user={user}
                            userRoles={userRolesList}
                            onRevokeRole={handleRevokeRole}
                            getRoleById={getRoleById}
                            organizationId={organizationId}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No users found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Try adjusting your search criteria' : 'No users available for role assignment'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Role Dialog */}
      {selectedUser && (
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <AssignRoleDialog
            user={selectedUser}
            availableRoles={roles}
            organizationId={organizationId}
            onClose={() => {
              setIsAssignDialogOpen(false);
              setSelectedUser(null);
            }}
            onSuccess={() => {
              setIsAssignDialogOpen(false);
              setSelectedUser(null);
              loadUsers();
            }}
          />
        </Dialog>
      )}

      {/* Revoke Role Dialog */}
      <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke the role "{getRoleById(selectedRoleAssignment?.roleId || '')?.name}" 
              from {selectedUser?.firstName} {selectedUser?.lastName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRevokeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmRevokeRole}
              disabled={isLoading}
            >
              {isLoading ? 'Revoking...' : 'Revoke Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// User Role Menu Component
interface UserRoleMenuProps {
  user: UserProfile;
  userRoles: UserRole[];
  onRevokeRole: (user: UserProfile, roleAssignment: UserRole) => void;
  getRoleById: (roleId: string) => Role | undefined;
  organizationId?: string;
}

function UserRoleMenu({ user, userRoles, onRevokeRole, getRoleById, organizationId }: UserRoleMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Shield className="w-3 h-3 mr-1" />
          Manage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Roles: {user.firstName} {user.lastName}</DialogTitle>
          <DialogDescription>
            View and manage role assignments for this user
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {userRoles.length > 0 ? (
            userRoles.map((userRole) => {
              const role = getRoleById(userRole.roleId);
              const isExpired = userRole.expiresAt && userRole.expiresAt < new Date();
              
              return (
                <div key={userRole.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${role?.isSystem ? 'bg-blue-100' : 'bg-green-100'}`}>
                      <Shield className={`w-4 h-4 ${role?.isSystem ? 'text-blue-600' : 'text-green-600'}`} />
                    </div>
                    <div>
                      <div className="font-medium">{role?.name || 'Unknown Role'}</div>
                      <div className="text-sm text-muted-foreground">
                        Assigned on {userRole.assignedAt.toLocaleDateString()}
                      </div>
                      {userRole.expiresAt && (
                        <div className={`text-xs ${isExpired ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {isExpired ? 'Expired' : 'Expires'} on {userRole.expiresAt.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <PermissionGuard permission="role.assign.organization" organizationId={organizationId}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        onRevokeRole(user, userRole);
                        setIsOpen(false);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </PermissionGuard>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No roles assigned to this user</p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Assign Role Dialog Component
interface AssignRoleDialogProps {
  user: UserProfile;
  availableRoles: Role[];
  organizationId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

function AssignRoleDialog({ user, availableRoles, organizationId, onClose, onSuccess }: AssignRoleDialogProps) {
  const { assignRole } = useUserRoleAssignment(organizationId);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoleId) return;

    try {
      setIsSubmitting(true);
      
      const expirationDate = expiresAt ? new Date(expiresAt) : undefined;
      await assignRole(user.id, selectedRoleId, expirationDate);
      
      onSuccess();
    } catch (error) {
      console.error('Error assigning role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Assign Role to {user.firstName} {user.lastName}</DialogTitle>
        <DialogDescription>
          Select a role to assign to this user
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  <div className="flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${role.isSystem ? 'text-blue-600' : 'text-green-600'}`} />
                    <div>
                      <div>{role.name}</div>
                      <div className="text-xs text-muted-foreground">{role.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
          <Input
            id="expiresAt"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty for permanent assignment
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !selectedRoleId}>
            {isSubmitting ? 'Assigning...' : 'Assign Role'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}