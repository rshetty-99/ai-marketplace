'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  X,
  Star,
  DollarSign,
  Clock,
  MapPin,
  Shield,
  CheckCircle,
  Building2,
  User,
  Users,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Service } from '@/types/service';

interface ServiceComparisonProps {
  services: Service[];
  onClose: () => void;
  onServiceRemove: (service: Service) => void;
}

export function ServiceComparison({ 
  services, 
  onClose, 
  onServiceRemove 
}: ServiceComparisonProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'pricing' | 'features' | 'technical'>('overview');

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

  if (services.length === 0) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Service Comparison ({services.length})</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Compare services side by side to find the perfect solution for your needs.
          </DialogDescription>
        </DialogHeader>

        <div className="flex space-x-1 border-b">
          {(['overview', 'pricing', 'features', 'technical'] as const).map((tab) => (
            <Button
              key={tab}
              variant={selectedTab === tab ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab(tab)}
              className="capitalize"
            >
              {tab}
            </Button>
          ))}
        </div>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {services.map((service) => (
              <Card key={service.id} className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => onServiceRemove(service)}
                >
                  <X className="h-4 w-4" />
                </Button>

                {selectedTab === 'overview' && (
                  <>
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {service.media?.logo ? (
                            <img
                              src={service.media.logo}
                              alt={`${service.name} logo`}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {service.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-2 mb-1">
                            {service.name}
                          </CardTitle>
                          {service.tagline && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                              {service.tagline}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Provider Info */}
                      <div className="flex items-center gap-2 mt-3">
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
                      <div className="flex items-center justify-between mt-3">
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
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                        {service.description}
                      </p>

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
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{service.availability.regions[0] || 'Global'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{service.implementation.timeline.total}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          <span>{service.compliance.certifications.length} certs</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          <span>{formatPrice(service.pricing.startingPrice)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </>
                )}

                {selectedTab === 'pricing' && (
                  <>
                    <CardHeader>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-2xl font-bold">
                          {formatPrice(service.pricing.startingPrice)}
                        </div>
                        <p className="text-sm text-gray-500 capitalize">
                          {service.pricing.type.replace('_', ' ')}
                          {service.pricing.billingCycle && ` / ${service.pricing.billingCycle}`}
                        </p>
                      </div>

                      {service.pricing.tiers && service.pricing.tiers.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium">Pricing Tiers:</h4>
                          {service.pricing.tiers.map((tier, index) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{tier.name}</span>
                                <span className="font-bold">{formatPrice(tier.price)}</span>
                              </div>
                              <ul className="text-xs space-y-1">
                                {tier.features.slice(0, 3).map((feature, i) => (
                                  <li key={i} className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </>
                )}

                {selectedTab === 'features' && (
                  <>
                    <CardHeader>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {service.features.slice(0, 6).map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-sm">{feature.name}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-300">
                                {feature.description}
                              </div>
                              <Badge variant="outline" className="text-xs mt-1">
                                {feature.category}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {service.features.length > 6 && (
                          <div className="text-xs text-gray-500 text-center pt-2">
                            +{service.features.length - 6} more features
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </>
                )}

                {selectedTab === 'technical' && (
                  <>
                    <CardHeader>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Technologies:</h4>
                        <div className="flex flex-wrap gap-1">
                          {service.technical.technologies.slice(0, 4).map((tech) => (
                            <Badge key={tech} variant="secondary" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                          {service.technical.technologies.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{service.technical.technologies.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-medium text-sm mb-2">Deployment:</h4>
                        <div className="space-y-1 text-xs">
                          <div>Regions: {service.availability.regions.join(', ')}</div>
                          <div>Options: {service.availability.deploymentOptions.join(', ')}</div>
                          <div>Uptime: {service.availability.uptime}</div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-medium text-sm mb-2">Security:</h4>
                        <div className="space-y-1 text-xs">
                          {service.compliance.certifications.slice(0, 3).map((cert) => (
                            <div key={cert} className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-green-500" />
                              {cert}
                            </div>
                          ))}
                          {service.compliance.certifications.length > 3 && (
                            <div className="text-gray-500">
                              +{service.compliance.certifications.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </>
                )}

                <div className="p-4 border-t">
                  <Button size="sm" className="w-full">
                    View Details
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {services.length < 3 && (
          <div className="text-center p-4 border-t">
            <p className="text-sm text-gray-500">
              Add more services to compare (up to 3 total)
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}