'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  DollarSign, 
  Star, 
  Clock, 
  Briefcase,
  User,
  MessageSquare,
  Bell,
  Settings,
  Plus,
  Eye,
  CheckCircle,
  Calendar,
  TrendingUp,
  Users,
  Filter,
  Download
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';

// Mock data for demonstration
const mockStats = {
  activeProjects: 5,
  completedProjects: 18,
  totalSpent: 125000,
  monthlySpent: 15000,
  averageProjectRating: 4.6,
  favoriteFreelancers: 8,
  savedServices: 12,
  pendingInvoices: 3
};

const mockProjects = [
  {
    id: '1',
    title: 'E-commerce AI Recommendation Engine',
    freelancer: 'Sarah Chen',
    vendor: null,
    status: 'in_progress',
    budget: 25000,
    spent: 15000,
    progress: 60,
    startDate: '2024-01-15',
    deadline: '2024-03-01',
    rating: null
  },
  {
    id: '2',
    title: 'Customer Data Analytics Dashboard',
    freelancer: null,
    vendor: 'DataTech Solutions',
    status: 'in_progress',
    budget: 35000,
    spent: 20000,
    progress: 75,
    startDate: '2024-01-20',
    deadline: '2024-02-28',
    rating: null
  },
  {
    id: '3',
    title: 'Mobile App UI/UX Redesign',
    freelancer: 'Mike Rodriguez',
    vendor: null,
    status: 'completed',
    budget: 8000,
    spent: 8000,
    progress: 100,
    startDate: '2023-12-01',
    deadline: '2024-01-15',
    rating: 4.8
  },
  {
    id: '4',
    title: 'Cloud Infrastructure Migration',
    freelancer: null,
    vendor: 'CloudOps Pro',
    status: 'completed',
    budget: 45000,
    spent: 42000,
    progress: 100,
    startDate: '2023-11-15',
    deadline: '2024-01-10',
    rating: 4.9
  },
  {
    id: '5',
    title: 'AI Chatbot Development',
    freelancer: 'Alex Thompson',
    vendor: null,
    status: 'pending',
    budget: 12000,
    spent: 0,
    progress: 0,
    startDate: '2024-02-01',
    deadline: '2024-03-15',
    rating: null
  }
];

const mockFavorites = [
  { id: '1', name: 'Sarah Chen', type: 'freelancer', specialization: 'AI/ML Engineering', rating: 4.9, projects: 23 },
  { id: '2', name: 'DataTech Solutions', type: 'vendor', specialization: 'Data Analytics', rating: 4.7, projects: 156 },
  { id: '3', name: 'Mike Rodriguez', type: 'freelancer', specialization: 'UI/UX Design', rating: 4.8, projects: 45 }
];

export default function CustomerDashboard() {
  const { user, userType } = useAuth();
  const { permissions, isLoading: rbacLoading } = useRBAC();
  const [selectedTab, setSelectedTab] = useState('overview');

  if (!user || userType !== 'customer') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Access denied. Customer account required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeProjects = mockProjects.filter(p => p.status === 'in_progress');
  const completedProjects = mockProjects.filter(p => p.status === 'completed');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customer Dashboard</h1>
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
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockStats.monthlySpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ${mockStats.totalSpent.toLocaleString()} total spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.averageProjectRating}</div>
            <p className="text-xs text-muted-foreground">
              Average satisfaction score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Talent</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.favoriteFreelancers}</div>
            <p className="text-xs text-muted-foreground">
              Freelancers & vendors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="talent">Talent</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Projects Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Active Projects</CardTitle>
                <CardDescription>Projects currently in progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeProjects.slice(0, 3).map(project => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{project.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {project.freelancer || project.vendor}
                        </p>
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
                <CardDescription>Latest updates from your projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm">Milestone completed for Analytics Dashboard</p>
                      <p className="text-xs text-muted-foreground">3 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm">New message from Sarah Chen</p>
                      <p className="text-xs text-muted-foreground">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm">Invoice received for UI/UX project</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm">Project proposal from Alex Thompson</p>
                      <p className="text-xs text-muted-foreground">2 days ago</p>
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
                  <Search className="w-5 h-5" />
                  <span className="text-xs">Find Talent</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                  <Plus className="w-5 h-5" />
                  <span className="text-xs">Post Project</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-xs">Messages</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                  <TrendingUp className="w-5 h-5" />
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
                <CardTitle>All Projects</CardTitle>
                <CardDescription>Manage your current and past projects</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Talent</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProjects.map(project => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{project.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(project.deadline).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {project.freelancer || project.vendor}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {project.freelancer ? 'Freelancer' : 'Vendor'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">${project.budget.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            ${project.spent.toLocaleString()} spent
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={project.progress} className="w-16 h-2" />
                          <span className="text-xs">{project.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          project.status === 'completed' ? 'default' : 
                          project.status === 'in_progress' ? 'secondary' : 'outline'
                        }>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Talent Tab */}
        <TabsContent value="talent" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Saved Talent</CardTitle>
                <CardDescription>Your favorite freelancers and vendors</CardDescription>
              </div>
              <Button>
                <Search className="w-4 h-4 mr-2" />
                Find More Talent
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockFavorites.map(talent => (
                  <div key={talent.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{talent.name}</h4>
                        <p className="text-xs text-muted-foreground">{talent.type}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{talent.specialization}</p>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{talent.rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {talent.projects} projects
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Message
                      </Button>
                      <Button size="sm" className="flex-1">
                        Hire
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Spending Overview</CardTitle>
                <CardDescription>Your project expenses over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">Spending chart will be displayed here</p>
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
                  Credit Card ****4567
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Bank Account ****1234
                </Button>
                <Button variant="outline" className="w-full">
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Your project payments and expenses</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { id: 'INV-001', project: 'E-commerce AI Engine', amount: 15000, date: '2024-01-15', status: 'paid' },
                    { id: 'INV-002', project: 'Analytics Dashboard', amount: 20000, date: '2024-01-20', status: 'paid' },
                    { id: 'INV-003', project: 'Mobile App Redesign', amount: 8000, date: '2024-01-10', status: 'paid' },
                    { id: 'INV-004', project: 'AI Chatbot', amount: 6000, date: '2024-02-01', status: 'pending' }
                  ].map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.project}</TableCell>
                      <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}