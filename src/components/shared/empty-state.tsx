import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Package, Users, FileText, PlusCircle } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  variant?: 'default' | 'search' | 'services' | 'providers' | 'projects'
}

const iconMap = {
  default: FileText,
  search: Search,
  services: Package,
  providers: Users,
  projects: PlusCircle,
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default'
}: EmptyStateProps) {
  const IconComponent = iconMap[variant]
  const defaultIcon = <IconComponent className="h-12 w-12 text-gray-400" />

  return (
    <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mb-4">
          {icon || defaultIcon}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        
        <p className="text-gray-600 max-w-md mb-6 leading-relaxed">
          {description}
        </p>
        
        {action && (
          <Button 
            onClick={action.onClick}
            className="inline-flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Preset empty states for common scenarios
export function SearchEmptyState({ query }: { query?: string }) {
  return (
    <EmptyState
      variant="search"
      title={query ? `No results for "${query}"` : 'No search results'}
      description={
        query 
          ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
          : 'Enter search terms to find AI services and providers.'
      }
    />
  )
}

export function ServicesEmptyState() {
  return (
    <EmptyState
      variant="services"
      title="No services found"
      description="No AI services match your current filters. Try adjusting your search criteria or browse all categories."
      action={{
        label: 'Browse All Services',
        onClick: () => window.location.href = '/catalog'
      }}
    />
  )
}

export function ProvidersEmptyState() {
  return (
    <EmptyState
      variant="providers"
      title="No providers found"
      description="No AI service providers match your current filters. Try adjusting your search criteria."
      action={{
        label: 'Browse All Providers',
        onClick: () => window.location.href = '/providers'
      }}
    />
  )
}

export function ProjectsEmptyState() {
  return (
    <EmptyState
      variant="projects"
      title="No projects yet"
      description="You haven't started any AI projects yet. Browse our marketplace to find the perfect AI solution for your needs."
      action={{
        label: 'Explore AI Services',
        onClick: () => window.location.href = '/catalog'
      }}
    />
  )
}