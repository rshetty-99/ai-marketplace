import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { 
  Star, 
  MapPin, 
  Clock, 
  Users, 
  TrendingUp, 
  Shield,
  ArrowRight,
  Bookmark,
  BookmarkCheck
} from 'lucide-react'
import { useState } from 'react'

interface ServiceCardProps {
  service: {
    id: string
    title: string
    description: string
    provider: {
      name: string
      logo?: string
      verified: boolean
      location: string
    }
    category: string
    subcategory?: string
    pricing: {
      type: 'fixed' | 'hourly' | 'project' | 'subscription'
      amount: number
      currency: string
      period?: string
    }
    rating: number
    reviewCount: number
    completedProjects: number
    responseTime: string
    skills: string[]
    featured?: boolean
    urgent?: boolean
    image?: string
  }
  variant?: 'default' | 'compact' | 'featured'
  showSaveButton?: boolean
}

export function ServiceCard({ 
  service, 
  variant = 'default',
  showSaveButton = true 
}: ServiceCardProps) {
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsSaved(!isSaved)
    // TODO: Implement save functionality
  }

  const formatPrice = () => {
    const { type, amount, currency, period } = service.pricing
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

    switch (type) {
      case 'hourly':
        return `${formattedAmount}/hr`
      case 'project':
        return `${formattedAmount}/project`
      case 'subscription':
        return `${formattedAmount}/${period || 'month'}`
      default:
        return formattedAmount
    }
  }

  const cardContent = (
    <Card className={`
      group hover:shadow-lg transition-all duration-300 h-full
      ${service.featured ? 'ring-2 ring-blue-500 shadow-lg' : ''}
      ${variant === 'compact' ? 'min-h-[280px]' : 'min-h-[320px]'}
    `}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Category & Badges */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="text-xs">
                {service.category}
              </Badge>
              {service.featured && (
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs">
                  Featured
                </Badge>
              )}
              {service.urgent && (
                <Badge variant="destructive" className="text-xs">
                  Urgent
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-lg leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
              {service.title}
            </h3>
          </div>

          {/* Save Button */}
          {showSaveButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2"
            >
              {isSaved ? (
                <BookmarkCheck className="h-4 w-4 text-blue-600" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Provider Info */}
        <div className="flex items-center gap-3 mt-3">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            {service.provider.logo ? (
              <img
                src={service.provider.logo}
                alt={service.provider.name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <span className="text-xs font-medium text-gray-600">
                {service.provider.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {service.provider.name}
              </p>
              {service.provider.verified && (
                <Shield className="h-3 w-3 text-green-600 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {service.provider.location}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
          {service.description}
        </p>

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mb-4">
          {service.skills.slice(0, 3).map((skill, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="text-xs px-2 py-0.5"
            >
              {skill}
            </Badge>
          ))}
          {service.skills.length > 3 && (
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              +{service.skills.length - 3} more
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-gray-900">
              {service.rating.toFixed(1)}
            </span>
            <span>({service.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>{service.completedProjects} projects</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{service.responseTime}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full">
          <div>
            <p className="text-sm text-gray-500">Starting at</p>
            <p className="text-lg font-bold text-gray-900">
              {formatPrice()}
            </p>
          </div>
          <Button size="sm" className="group-hover:bg-blue-600 transition-colors">
            View Details
            <ArrowRight className="ml-2 h-3 w-3" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )

  return (
    <Link href={`/services/${service.id}`} className="block h-full">
      {cardContent}
    </Link>
  )
}

// Compact variant for sidebar or smaller spaces
export function ServiceCardCompact({ service }: { service: ServiceCardProps['service'] }) {
  return (
    <ServiceCard 
      service={service} 
      variant="compact" 
      showSaveButton={false} 
    />
  )
}

// Featured variant for promoted services
export function ServiceCardFeatured({ service }: { service: ServiceCardProps['service'] }) {
  return (
    <ServiceCard 
      service={{
        ...service,
        featured: true
      }} 
      variant="featured"
    />
  )
}