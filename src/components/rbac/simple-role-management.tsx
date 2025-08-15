'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  Crown, 
  User, 
  Settings, 
  UserPlus,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { 
  RoleName,
  MARKETPLACE_ROLES,
  ROLE_DESCRIPTIONS,
  getUserTypeRoles
} from '@/lib/firebase/rbac-schema';
import { useRoleManagement, AdminGuard } from '@/hooks/useRBAC';
import { useUser } from '@clerk/nextjs';

interface SimpleRoleManagementProps {
  organizationId: string;
  userType: 'vendor' | 'customer';
}

export function SimpleRoleManagement({ organizationId, userType }: SimpleRoleManagementProps) {
  const { user } = useUser();
  const { members, isLoading, error, loadMembers, assignRole, removeRole } = useRoleManagement(organizationId);
  const [selectedRole, setSelectedRole] = useState<RoleName | ''>('');
  const [inviteUserId, setInviteUserId] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  const availableRoles = getUserTypeRoles(userType);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleAssignRole = async () => {
    if (!selectedRole || !inviteUserId) return;

    try {
      await assignRole(inviteUserId, selectedRole as RoleName);
      setSelectedRole('');
      setInviteUserId('');
      setShowInvite(false);
    } catch (error) {
      console.error('Failed to assign role:', error);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the organization?')) return;

    try {
      await removeRole(userId);
    } catch (error) {
      console.error('Failed to remove user:', error);
    }
  };

  const getRoleIcon = (role: RoleName) => {
    if (role.includes('admin')) return <Crown className="w-4 h-4 text-yellow-600" />;
    return <User className="w-4 h-4 text-blue-600" />;
  };

  const getRoleBadgeColor = (role: RoleName) => {
    if (role.includes('admin')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Management
              </CardTitle>
              <CardDescription>
                Manage your team members and their roles
              </CardDescription>
            </div>
            <AdminGuard>
              <Button onClick={() => setShowInvite(!showInvite)}>
                <UserPlus className="w-4 h-4 mr-2" />
                {showInvite ? 'Cancel' : 'Invite User'}
              </Button>
            </AdminGuard>
          </div>
        </CardHeader>

        {error && (
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Invite User Form */}
      <AdminGuard>
        {showInvite && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invite New Team Member</CardTitle>
              <CardDescription>
                Add someone to your {userType} organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">User ID/Email</label>
                  <input
                    type="text"
                    placeholder="Enter user ID or email"
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map(role => (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(role)}
                            {MARKETPLACE_ROLES[role].name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleAssignRole}
                    disabled={!selectedRole || !inviteUserId}
                    className="w-full"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite User
                  </Button>
                </div>
              </div>

              {selectedRole && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{MARKETPLACE_ROLES[selectedRole as RoleName].name}:</strong> {ROLE_DESCRIPTIONS[selectedRole as RoleName]}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </AdminGuard>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No team members yet</p>
              <p className="text-sm text-muted-foreground">
                Invite your first team member to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <User className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{member.userId}</div>
                          <div className="text-sm text-muted-foreground">
                            {member.userId === user?.id && '(You)'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(member.role)}
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {MARKETPLACE_ROLES[member.role].name}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {MARKETPLACE_ROLES[member.role].permissions.join(', ')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {member.assignedAt.toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <AdminGuard>
                        {member.userId !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUser(member.userId)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </AdminGuard>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Role Explanations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role Descriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availableRoles.map(role => (
              <div key={role} className="flex items-start gap-3 p-3 border rounded-lg">
                {getRoleIcon(role)}
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {MARKETPLACE_ROLES[role].name}
                    <Badge variant="outline" className="text-xs">
                      {MARKETPLACE_ROLES[role].permissions.length} permissions
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {ROLE_DESCRIPTIONS[role]}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    <strong>Permissions:</strong> {MARKETPLACE_ROLES[role].permissions.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {members.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {members.filter(m => m.role.includes('admin')).length}
              </div>
              <div className="text-sm text-muted-foreground">Administrators</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {members.filter(m => m.role.includes('member')).length}
              </div>
              <div className="text-sm text-muted-foreground">Team Members</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}