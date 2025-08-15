import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { 
  Activity, 
  CreditCard, 
  Package, 
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  FileText,
  Settings,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // TODO: Fetch real data from Firebase based on user
  const stats = [
    {
      title: 'Active Projects',
      value: '12',
      change: '+2 from last month',
      trend: 'up',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Service Providers',
      value: '8',
      change: '+1 new this week',
      trend: 'up',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Spent',
      value: '$24,567',
      change: '+12% from last month',
      trend: 'up',
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Success Rate',
      value: '94%',
      change: '-2% from last month',
      trend: 'down',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  const recentProjects = [
    {
      id: 1,
      name: 'Computer Vision Model Training',
      provider: 'AI Solutions Inc.',
      status: 'In Progress',
      statusColor: 'text-blue-600 bg-blue-100',
      dueDate: '2024-02-15',
      budget: '$12,000',
    },
    {
      id: 2,
      name: 'NLP Chatbot Development',
      provider: 'Tech Innovators',
      status: 'Completed',
      statusColor: 'text-green-600 bg-green-100',
      dueDate: '2024-01-30',
      budget: '$8,500',
    },
    {
      id: 3,
      name: 'Data Pipeline Optimization',
      provider: 'Data Experts Co.',
      status: 'Under Review',
      statusColor: 'text-yellow-600 bg-yellow-100',
      dueDate: '2024-02-20',
      budget: '$15,000',
    },
  ]

  const upcomingConsultations = [
    {
      id: 1,
      provider: 'AI Solutions Inc.',
      topic: 'Project Kickoff',
      date: '2024-02-05',
      time: '10:00 AM',
    },
    {
      id: 2,
      provider: 'Tech Innovators',
      topic: 'Progress Review',
      date: '2024-02-07',
      time: '2:00 PM',
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's an overview of your AI projects.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button asChild>
            <Link href="/catalog">
              Browse Services
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex-1">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.title} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-red-500" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
              <p className="text-xs text-gray-500 mt-2">{stat.change}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Projects */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/projects">
                    View All
                  </Link>
                </Button>
              </div>
              <div className="divide-y">
                {recentProjects.map((project) => (
                  <div key={project.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{project.provider}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${project.statusColor}`}>
                            {project.status}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {project.dueDate}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{project.budget}</p>
                        <Button variant="ghost" size="sm" className="mt-2" asChild>
                          <Link href={`/dashboard/projects/${project.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Consultations */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Consultations</h2>
              </div>
              <div className="divide-y">
                {upcomingConsultations.map((consultation) => (
                  <div key={consultation.id} className="px-6 py-4">
                    <h3 className="font-medium text-gray-900">{consultation.topic}</h3>
                    <p className="text-sm text-gray-600 mt-1">{consultation.provider}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{consultation.date} at {consultation.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/bookings">
                    View All Bookings
                  </Link>
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/catalog">
                    <Package className="mr-2 h-4 w-4" />
                    Browse AI Services
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/projects/new">
                    <FileText className="mr-2 h-4 w-4" />
                    Create New Project
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/analytics">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View Analytics
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}