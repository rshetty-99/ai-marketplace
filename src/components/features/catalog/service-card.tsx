import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  MapPin, 
  Clock, 
  Shield, 
  CheckCircle, 
  Users, 
  Building2,
  User,
  ArrowRight,
  Compare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Service } from '@/types/service';

interface ServiceCardProps {
  service: Service;
  onSelect?: (service: Service) => void;
  onCompare?: (service: Service) => void;
  isSelected?: boolean;
  showCompareButton?: boolean;
  viewMode?: 'grid' | 'list';
  className?: string;
}

export function ServiceCard({
  service,
  onSelect,
  onCompare,
  isSelected = false,
  showCompareButton = false,
  viewMode = 'grid',
  className,
}: ServiceCardProps) {
  const formatPrice = (price?: number) => {
    if (!price) return 'Custom Pricing';
    if (price < 1) return `$${(price * 100).toFixed(0)}¢`;
    return `$${price.toLocaleString()}`;
  };

  const getProviderTypeIcon = (type: string) => {
    switch (type) {
      case 'vendor':
        return Building2;
      case 'freelancer':
        return User;
      case 'agency':
        return Users;
      default:
        return Building2;
    }
  };

  const getProviderTypeLabel = (type: string) => {
    switch (type) {
      case 'vendor':
        return 'Vendor';
      case 'freelancer':
        return 'Freelancer';
      case 'agency':
        return 'Agency';
      case 'channel_partner':
        return 'Partner';
      default:
        return 'Provider';
    }
  };

  if (viewMode === 'list') {
    return (
      <Card className={cn(
        'transition-all duration-200 hover:shadow-md cursor-pointer',
        isSelected && 'ring-2 ring-blue-500',
        className
      )}>
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Service Logo/Image */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                {service.media?.logo ? (
                  <img 
                    src={service.media.logo} 
                    alt={service.name}
                    className="w-12 h-12 object-contain rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-500 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {service.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Service Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {service.name}
                  </h3>
                  {service.tagline && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {service.tagline}
                    </p>
                  )}
                </div>
                
                {service.featured && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    Featured
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 mb-3">
                {/* Provider Info */}
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={service.providerLogo} />
                    <AvatarFallback className="text-xs">
                      {service.providerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {service.providerName}
                  </span>
                  {service.provider?.verification.verified && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>

                {/* Provider Type */}
                {service.provider?.type && (
                  <div className="flex items-center gap-1">
                    {(() => {
                      const IconComponent = getProviderTypeIcon(service.provider.type);
                      return <IconComponent className="w-4 h-4 text-gray-400" />;
                    })()}
                    <span className="text-xs text-gray-500">
                      {getProviderTypeLabel(service.provider.type)}
                    </span>
                  </div>
                )}

                {/* Rating */}
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">
                    {service.reviews.averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({service.reviews.totalReviews})
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                {service.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                <Badge variant="outline" className="text-xs">
                  {service.category.replace('_', ' ')}
                </Badge>
                {service.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {service.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{service.tags.length - 3}
                  </Badge>
                )}
              </div>
            </div>

            {/* Pricing and Actions */}
            <div className="flex-shrink-0 text-right">
              <div className="mb-4">
                {service.pricing.startingPrice ? (
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatPrice(service.pricing.startingPrice)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {service.pricing.type === 'usage_based' && 'per use'}
                      {service.pricing.type === 'subscription' && `/${service.pricing.billingCycle}`}
                      {service.pricing.type === 'project_based' && 'per project'}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-medium text-gray-600">
                    Custom Pricing
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {showCompareButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCompare?.(service);
                    }}
                    className={cn(isSelected && 'bg-blue-50 border-blue-300')}
                  >
                    <Compare className="w-4 h-4" />
                  </Button>
                )}
                <Button 
                  onClick={() => onSelect?.(service)}
                  size="sm"
                >
                  View Details
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view (default)
  return (
    <Card className={cn(
      'h-full transition-all duration-200 hover:shadow-md cursor-pointer',
      isSelected && 'ring-2 ring-blue-500',
      className
    )}>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2 text-gray-900 dark:text-white">
              {service.name}
            </CardTitle>
            {service.tagline && (
              <CardDescription className="line-clamp-1 mt-1">
                {service.tagline}
              </CardDescription>
            )}
          </div>
          
          {service.media?.logo ? (
            <img
              src={service.media.logo}
              alt={`${service.name} logo`}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">
                {service.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Provider Info */}
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={service.providerLogo} />
            <AvatarFallback className="text-xs">
              {service.providerName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {service.providerName}
          </span>
          {service.provider?.verification.verified && (
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">
              {service.reviews.averageRating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-500">
              ({service.reviews.totalReviews})
            </span>
          </div>
          
          {service.provider?.type && (
            <div className="flex items-center gap-1">
              {(() => {
                const IconComponent = getProviderTypeIcon(service.provider.type);
                return <IconComponent className="w-4 h-4 text-gray-400" />;
              })()}
              <span className="text-xs text-gray-500">
                {getProviderTypeLabel(service.provider.type)}
              </span>
            </div>
          )}
        </div>

        {/* Category and Tags */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {service.category.replace('_', ' ')}
          </Badge>
          {service.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {service.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{service.tags.length - 2}
            </Badge>
          )}
          {service.featured && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
          {service.description}
        </p>

        {/* Key Features */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Key Features:</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            {service.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <span className="line-clamp-1">{feature.name}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Metadata */}
        <div className="flex items-center text-xs text-gray-500 gap-4">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{service.availability.regions[0] || 'Global'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{service.implementation.timeline.total}</span>
          </div>
          {service.compliance.certifications.length > 0 && (
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>{service.compliance.certifications.length} certs</span>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              {service.pricing.startingPrice ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatPrice(service.pricing.startingPrice)}
                  </span>
                  {service.pricing.billingCycle && (
                    <span className="text-sm text-gray-500">
                      /{service.pricing.billingCycle}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Custom Pricing
                </span>
              )}
              <p className="text-xs text-gray-500 capitalize">
                {service.pricing.type.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button 
            onClick={() => onSelect?.(service)}
            className="flex-1"
            size="sm"
          >
            Learn More
          </Button>
          {showCompareButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCompare?.(service);
              }}
              className={cn(
                "px-3",
                isSelected && 'bg-blue-50 border-blue-300 text-blue-700'
              )}
            >
              <Compare className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

