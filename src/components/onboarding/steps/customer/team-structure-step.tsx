'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, Plus, Trash2, Crown, UserCheck, User, 
  Mail, Phone, Building, CheckCircle 
} from 'lucide-react';
import { CustomerOrganizationOnboarding } from '@/lib/firebase/onboarding-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface TeamStructureStepProps {
  data: Partial<CustomerOrganizationOnboarding>;
  onUpdate: (data: Partial<CustomerOrganizationOnboarding>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  level: 'decision_maker' | 'stakeholder' | 'contributor' | 'user';
  phone?: string;
  involvement: 'high' | 'medium' | 'low';
}

const ROLES = [
  'CEO/President',
  'CTO/Chief Technology Officer',
  'CIO/Chief Information Officer',
  'CDO/Chief Data Officer',
  'VP of Engineering',
  'VP of Operations',
  'Director of IT',
  'Director of Data Science',
  'AI/ML Engineer',
  'Data Scientist',
  'Software Engineer',
  'Product Manager',
  'Project Manager',
  'Business Analyst',
  'IT Administrator',
  'End User',
  'Other'
];

const DEPARTMENTS = [
  'Executive',
  'Engineering',
  'IT/Technology',
  'Data Science',
  'Product',
  'Operations',
  'Finance',
  'Marketing',
  'Sales',
  'HR',
  'Legal',
  'Compliance',
  'Customer Service',
  'Other'
];

const TEAM_LEVELS = [
  { value: 'decision_maker', label: 'Decision Maker', description: 'Has authority to approve and make final decisions', color: 'bg-red-100 text-red-800' },
  { value: 'stakeholder', label: 'Key Stakeholder', description: 'Significant influence on project direction', color: 'bg-blue-100 text-blue-800' },
  { value: 'contributor', label: 'Contributor', description: 'Actively involved in implementation', color: 'bg-green-100 text-green-800' },
  { value: 'user', label: 'End User', description: 'Will use the final solution', color: 'bg-gray-100 text-gray-800' }
];

const INVOLVEMENT_LEVELS = [
  { value: 'high', label: 'High', description: 'Daily involvement' },
  { value: 'medium', label: 'Medium', description: 'Weekly involvement' },
  { value: 'low', label: 'Low', description: 'Periodic updates' }
];

export function TeamStructureStep({ data, onUpdate, onNext, onPrevious, onSkip, isSubmitting }: TeamStructureStepProps) {
  const { trackEvent } = useAnalytics();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    name: '',
    email: '',
    role: '',
    department: '',
    level: 'contributor',
    involvement: 'medium'
  });

  const teamStructure = data.teamStructure || {};

  useEffect(() => {
    trackEvent('customer_onboarding_step_viewed', {
      step: 'team_structure',
      stepNumber: 4
    });

    // Initialize with existing data
    if (teamStructure.teamMembers && teamStructure.teamMembers.length > 0) {
      setTeamMembers(teamStructure.teamMembers);
    }
  }, [trackEvent, teamStructure]);

  const handleAddMember = () => {
    if (!newMember.name?.trim() || !newMember.email?.trim()) return;

    const member: TeamMember = {
      id: `member_${Date.now()}`,
      name: newMember.name!,
      email: newMember.email!,
      role: newMember.role || '',
      department: newMember.department || '',
      level: newMember.level as TeamMember['level'],
      involvement: newMember.involvement as TeamMember['involvement'],
      phone: newMember.phone
    };

    const updatedMembers = [...teamMembers, member];
    setTeamMembers(updatedMembers);
    updateData({ teamMembers: updatedMembers });

    // Reset form
    setNewMember({
      name: '',
      email: '',
      role: '',
      department: '',
      level: 'contributor',
      involvement: 'medium'
    });
    setIsAddingMember(false);

    trackEvent('customer_team_member_added', {
      memberRole: member.role,
      memberLevel: member.level,
      totalMembers: updatedMembers.length
    });
  };

  const handleRemoveMember = (memberId: string) => {
    const updatedMembers = teamMembers.filter(member => member.id !== memberId);
    setTeamMembers(updatedMembers);
    updateData({ teamMembers: updatedMembers });

    trackEvent('customer_team_member_removed', {
      totalMembers: updatedMembers.length
    });
  };

  const updateData = (updates: Partial<CustomerOrganizationOnboarding['teamStructure']>) => {
    onUpdate({
      ...data,
      teamStructure: {
        ...teamStructure,
        ...updates
      }
    });
  };

  const handleNext = () => {
    updateData({ teamMembers });

    trackEvent('customer_onboarding_step_completed', {
      step: 'team_structure',
      stepNumber: 4,
      teamSize: teamMembers.length,
      decisionMakers: teamMembers.filter(m => m.level === 'decision_maker').length,
      stakeholders: teamMembers.filter(m => m.level === 'stakeholder').length
    });

    onNext();
  };

  const handleSkip = () => {
    trackEvent('customer_onboarding_step_skipped', {
      step: 'team_structure',
      stepNumber: 4
    });

    onSkip();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getLevelIcon = (level: TeamMember['level']) => {
    switch (level) {
      case 'decision_maker': return <Crown className="w-4 h-4" />;
      case 'stakeholder': return <UserCheck className="w-4 h-4" />;
      case 'contributor': return <User className="w-4 h-4" />;
      case 'user': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getLevelConfig = (level: TeamMember['level']) => {
    return TEAM_LEVELS.find(l => l.value === level) || TEAM_LEVELS[2];
  };

  const getTeamStats = () => {
    const stats = {
      total: teamMembers.length,
      decisionMakers: teamMembers.filter(m => m.level === 'decision_maker').length,
      stakeholders: teamMembers.filter(m => m.level === 'stakeholder').length,
      contributors: teamMembers.filter(m => m.level === 'contributor').length,
      users: teamMembers.filter(m => m.level === 'user').length,
      departments: new Set(teamMembers.map(m => m.department).filter(Boolean)).size
    };
    return stats;
  };

  const stats = getTeamStats();

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Users className="w-5 h-5 text-green-600" />
        <div>
          <h3 className="font-medium">Team Structure & Stakeholders</h3>
          <p className="text-sm text-muted-foreground">
            Identify key team members who will be involved in the AI project (Optional)
          </p>
        </div>
      </div>

      {/* Team Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Project Team ({teamMembers.length})
              </CardTitle>
              <CardDescription>
                Add team members who will be involved in the AI implementation
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsAddingMember(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length > 0 ? (
            <div className="space-y-4">
              {teamMembers.map((member) => {
                const levelConfig = getLevelConfig(member.level);
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/10">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {member.role}
                          {member.department && ` • ${member.department}`}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={`text-xs ${levelConfig.color}`}>
                            {getLevelIcon(member.level)}
                            <span className="ml-1">{levelConfig.label}</span>
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {INVOLVEMENT_LEVELS.find(l => l.value === member.involvement)?.label} Involvement
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {member.phone}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-muted-foreground mb-2">No Team Members Added</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add key stakeholders and team members for better project coordination
              </p>
              <Button onClick={() => setIsAddingMember(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Member
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Form */}
      {isAddingMember && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Team Member
            </CardTitle>
            <CardDescription>
              Enter information for a key project team member
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="memberName">Name *</Label>
                <Input
                  id="memberName"
                  value={newMember.name || ''}
                  onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memberEmail">Email *</Label>
                <Input
                  id="memberEmail"
                  type="email"
                  value={newMember.email || ''}
                  onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memberRole">Role</Label>
                <Select
                  value={newMember.role || ''}
                  onValueChange={(value) => setNewMember(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memberDepartment">Department</Label>
                <Select
                  value={newMember.department || ''}
                  onValueChange={(value) => setNewMember(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memberLevel">Project Role</Label>
                <Select
                  value={newMember.level || 'contributor'}
                  onValueChange={(value) => setNewMember(prev => ({ ...prev, level: value as TeamMember['level'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex items-center gap-2">
                          {getLevelIcon(level.value as TeamMember['level'])}
                          <div>
                            <div>{level.label}</div>
                            <div className="text-xs text-muted-foreground">{level.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memberInvolvement">Involvement Level</Label>
                <Select
                  value={newMember.involvement || 'medium'}
                  onValueChange={(value) => setNewMember(prev => ({ ...prev, involvement: value as TeamMember['involvement'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVOLVEMENT_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <div>{level.label}</div>
                          <div className="text-xs text-muted-foreground">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memberPhone">Phone (Optional)</Label>
                <Input
                  id="memberPhone"
                  type="tel"
                  value={newMember.phone || ''}
                  onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleAddMember}
                disabled={!newMember.name?.trim() || !newMember.email?.trim()}
              >
                Add Member
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingMember(false);
                  setNewMember({
                    name: '',
                    email: '',
                    role: '',
                    department: '',
                    level: 'contributor',
                    involvement: 'medium'
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Statistics */}
      {teamMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Team Overview
            </CardTitle>
            <CardDescription>
              Summary of your project team structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <Crown className="w-8 h-8 mx-auto text-red-600 mb-2" />
                <div className="text-2xl font-bold text-red-600">{stats.decisionMakers}</div>
                <div className="text-sm text-muted-foreground">Decision Makers</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <UserCheck className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-blue-600">{stats.stakeholders}</div>
                <div className="text-sm text-muted-foreground">Stakeholders</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <User className="w-8 h-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold text-green-600">{stats.contributors}</div>
                <div className="text-sm text-muted-foreground">Contributors</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Building className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-purple-600">{stats.departments}</div>
                <div className="text-sm text-muted-foreground">Departments</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* By Level */}
              <div>
                <h4 className="font-medium mb-3">By Project Role</h4>
                <div className="space-y-2">
                  {TEAM_LEVELS.map((level) => {
                    const count = teamMembers.filter(m => m.level === level.value).length;
                    return (
                      <div key={level.value} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {getLevelIcon(level.value as TeamMember['level'])}
                          <span className="text-sm">{level.label}</span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By Department */}
              <div>
                <h4 className="font-medium mb-3">By Department</h4>
                <div className="space-y-2">
                  {Array.from(new Set(teamMembers.map(m => m.department).filter(Boolean))).map((dept) => {
                    const count = teamMembers.filter(m => m.department === dept).length;
                    return (
                      <div key={dept} className="flex justify-between items-center">
                        <span className="text-sm">{dept}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-6">
        <Button variant="outline" onClick={onPrevious} disabled={isSubmitting}>
          Previous
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Step 4 of 6 • {teamMembers.length} team members added
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
              Skip
            </Button>
            <Button onClick={handleNext} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}