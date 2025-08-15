'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Briefcase, 
  DollarSign, 
  Star, 
  Clock, 
  TrendingUp,
  User,
  FileText,
  MessageSquare,
  Bell,
  Settings,
  BarChart3,
  Calendar,
  Target,
  Award
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import Link from 'next/link';

// Mock data for demonstration
const mockStats = {
  activeProjects: 3,
  completedProjects: 12,
  totalEarnings: 45000,
  monthlyEarnings: 8500,
  averageRating: 4.8,
  totalReviews: 15,
  responseTime: '2 hours',
  completionRate: 96
};

const mockProjects = [
  {
    id: '1',
    title: 'AI Chatbot Development',
    client: 'TechCorp Inc.',
    status: 'in_progress',
    deadline: '2024-02-15',
    budget: 5000,
    progress: 65
  },
  {
    id: '2',
    title: 'Machine Learning Model',
    client: 'DataAnalytics Ltd',
    status: 'in_progress',
    deadline: '2024-02-20',
    budget: 8000,
    progress: 40
  },
  {
    id: '3',
    title: 'Computer Vision System',
    client: 'VisionTech',
    status: 'pending',
    deadline: '2024-02-25',
    budget: 12000,
    progress: 0
  }
];

export default function FreelancerDashboard() {
  const { user, userType } = useAuth();
  const { permissions, isLoading: rbacLoading } = useRBAC();
  const [selectedTab, setSelectedTab] = useState('overview');

  if (!user || userType !== 'freelancer') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Access denied. Freelancer account required.</p>
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
          <h1 className="text-3xl font-bold">Freelancer Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.firstName}!</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
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
              {mockStats.completedProjects} completed total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockStats.monthlyEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ${mockStats.totalEarnings.toLocaleString()} total earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.averageRating}</div>
            <p className="text-xs text-muted-foreground">
              Based on {mockStats.totalReviews} reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.responseTime}</div>
            <p className="text-xs text-muted-foreground">
              {mockStats.completionRate}% completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Active Projects</CardTitle>
                <CardDescription>Projects currently in progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockProjects.filter(p => p.status === 'in_progress').map(project => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{project.title}</p>
                        <p className="text-sm text-muted-foreground">{project.client}</p>
                      </div>
                      <Badge variant="outline">${project.budget.toLocaleString()}</Badge>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{project.progress}% complete</span>
                      <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm">New message from TechCorp Inc.</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm">Milestone approved for ML Model project</p>
                      <p className="text-xs text-muted-foreground">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm">New project invitation received</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
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
                  <FileText className="w-5 h-5" />
                  <span className="text-xs">Browse Projects</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-xs">Messages</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                  <User className="w-5 h-5" />
                  <span className="text-xs">Update Profile</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-xs">View Analytics</span>
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
                <CardTitle>All Projects</CardTitle>
                <CardDescription>Manage your active and past projects</CardDescription>
              </div>
              <Button>
                <Briefcase className="w-4 h-4 mr-2" />
                Browse New Projects
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockProjects.map(project => (
                  <div key={project.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{project.title}</h4>
                        <p className="text-sm text-muted-foreground">{project.client}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={project.status === 'in_progress' ? 'default' : 'secondary'}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-sm font-medium mt-1">${project.budget.toLocaleString()}</p>
                      </div>
                    </div>
                    {project.status === 'in_progress' && (
                      <>
                        <Progress value={project.progress} className="h-2 mb-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{project.progress}% complete</span>
                          <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                        </div>
                      </>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline">View Details</Button>
                      {project.status === 'in_progress' && (
                        <Button size="sm" variant="outline">Update Progress</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Earnings Overview</CardTitle>
                <CardDescription>Your income over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">Earnings chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Bank Account ****1234
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="w-4 h-4 mr-2" />
                  PayPal @username
                </Button>
                <Button variant="outline" className="w-full">
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Completion</CardTitle>
              <CardDescription>Complete your profile to attract more clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Profile Strength</span>
                    <span className="text-sm text-muted-foreground">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Basic information completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Portfolio added</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Skills verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-muted-foreground">Add certifications</span>
                  </div>
                </div>

                <Button className="w-full">
                  Complete Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}