'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp,
  Briefcase,
  Star,
  Calendar,
  BarChart3,
  Settings,
  Bell,
  Plus,
  FileText,
  Shield,
  UserPlus,
  Package
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import { SimpleRoleManagement } from '@/components/rbac/simple-role-management';

// Mock data for demonstration
const mockStats = {
  activeProjects: 12,
  totalRevenue: 285000,
  monthlyRevenue: 45000,
  teamMembers: 8,
  clientSatisfaction: 4.7,
  projectCompletionRate: 94,
  averageProjectValue: 23750,
  newClients: 5
};

const mockTeamMembers = [
  { id: '1', name: 'John Smith', role: 'Senior Developer', projects: 3, utilization: 85 },
  { id: '2', name: 'Sarah Johnson', role: 'AI Engineer', projects: 2, utilization: 70 },
  { id: '3', name: 'Mike Chen', role: 'Data Scientist', projects: 4, utilization: 95 },
  { id: '4', name: 'Emily Davis', role: 'Project Manager', projects: 5, utilization: 100 }
];

const mockProjects = [
  {
    id: '1',
    name: 'Enterprise AI Platform',
    client: 'TechCorp',
    status: 'in_progress',
    team: ['John Smith', 'Sarah Johnson'],
    value: 85000,
    progress: 60,
    deadline: '2024-03-15'
  },
  {
    id: '2',
    name: 'ML Pipeline Automation',
    client: 'DataCo',
    status: 'in_progress',
    team: ['Mike Chen'],
    value: 45000,
    progress: 35,
    deadline: '2024-02-28'
  },
  {
    id: '3',
    name: 'Computer Vision System',
    client: 'VisionTech',
    status: 'planning',
    team: ['Sarah Johnson', 'Mike Chen'],
    value: 120000,
    progress: 10,
    deadline: '2024-04-01'
  }
];

export default function VendorDashboard() {
  const { user, userType } = useAuth();
  const { isAdmin, canInvite, canManageOrg } = useRBAC();
  const [selectedTab, setSelectedTab] = useState('overview');

  if (!user || userType !== 'vendor') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Access denied. Vendor account required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
          <p className="text-muted-foreground">Manage your organization and projects</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
          {canManageOrg && (
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              +{mockStats.newClients} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockStats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ${mockStats.totalRevenue.toLocaleString()} YTD
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.teamMembers}</div>
            <p className="text-xs text-muted-foreground">
              {mockStats.projectCompletionRate}% project completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.clientSatisfaction}/5.0</div>
            <p className="text-xs text-muted-foreground">
              Based on client feedback
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Projects Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Active Projects</CardTitle>
                <CardDescription>Current projects in progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockProjects.slice(0, 3).map(project => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.client}</p>
                      </div>
                      <Badge variant={project.status === 'in_progress' ? 'default' : 'secondary'}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{project.team.length} team members</span>
                      <span>${(project.value).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Team Utilization */}
            <Card>
              <CardHeader>
                <CardTitle>Team Utilization</CardTitle>
                <CardDescription>Current team capacity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockTeamMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={member.utilization} className="w-20 h-2" />
                        <span className="text-xs font-medium w-10 text-right">
                          {member.utilization}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                  <Plus className="w-5 h-5" />
                  <span className="text-xs">New Project</span>
                </Button>
                {canInvite && (
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                    <UserPlus className="w-5 h-5" />
                    <span className="text-xs">Invite Team</span>
                  </Button>
                )}
                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                  <Package className="w-5 h-5" />
                  <span className="text-xs">Add Service</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-xs">View Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Management</CardTitle>
                <CardDescription>Manage all vendor projects</CardDescription>
              </div>
              {isAdmin && (
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProjects.map(project => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{project.client}</TableCell>
                      <TableCell>{project.team.length} members</TableCell>
                      <TableCell>${project.value.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={project.progress} className="w-20 h-2" />
                          <span className="text-xs">{project.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(project.deadline).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">Manage</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          {isAdmin ? (
            <SimpleRoleManagement 
              organizationId={user.publicMetadata?.organizationId as string || ''} 
              userType="vendor" 
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Your organization's team</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Active Projects</TableHead>
                      <TableHead>Utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTeamMembers.map(member => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>{member.projects}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={member.utilization} className="w-20 h-2" />
                            <span className="text-xs">{member.utilization}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Service Catalog</CardTitle>
                <CardDescription>Manage your service offerings</CardDescription>
              </div>
              {isAdmin && (
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['AI Model Development', 'ML Pipeline Setup', 'Data Science Consulting', 'Computer Vision Solutions'].map((service, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{service}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Professional service offering with expert team support
                    </p>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">Starting at $5,000</Badge>
                      <Button size="sm" variant="outline">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">Revenue chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Analytics</CardTitle>
                <CardDescription>Project completion and success rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">Project analytics will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}