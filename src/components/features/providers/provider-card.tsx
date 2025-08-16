'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  MapPin, 
  Users, 
  Award, 
  ExternalLink,
  MessageSquare,
  Building2,
  Globe,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

interface ProviderCardProps {
  provider: {
    id: string;
    slug: string;
    name: string;
    description: string;
    logo: string;
    location: string;
    country: string;
    rating: number;
    reviewCount: number;
    clientCount: number;
    projectsCompleted: number;
    expertiseAreas: string[];
    industries: string[];
    certifications: string[];
    companySize: string;
    founded: number;
    verified: boolean;
    featured: boolean;
    pricingModel: string;
    startingPrice: number;
    portfolio: any[];
  };
  viewMode: 'grid' | 'list';
  onClick: () => void;
}

export function ProviderCard({ provider, viewMode, onClick }: ProviderCardProps) {
  const formatPrice = (price: number, model: string) => {
    if (model === 'hourly') {
      return `$${price}/hr`;
    } else if (model === 'project') {
      return `From $${(price / 1000).toFixed(0)}k`;
    } else {
      return `$${price}/month`;
    }
  };

  const getCompanySizeLabel = (size: string) => {
    switch (size) {
      case 'small': return '1-50 employees';
      case 'medium': return '51-200 employees';
      case 'large': return '200+ employees';
      default: return '';
    }
  };

  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Logo and Basic Info */}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-blue-100 dark:ring-blue-900">
                <AvatarImage src={provider.logo} alt={`${provider.name} logo`} />
                <AvatarFallback className="text-lg font-semibold">
                  {provider.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      <Link 
                        href={`/providers/${provider.slug}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        onClick={onClick}
                      >
                        {provider.name}
                      </Link>
                      {provider.verified && (
                        <CheckCircle className="inline-block ml-2 h-5 w-5 text-green-500" />
                      )}
                      {provider.featured && (
                        <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {provider.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {getCompanySizeLabel(provider.companySize)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        Founded {provider.founded}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{provider.rating}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ({provider.reviewCount} reviews)
                      </span>
                    </div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatPrice(provider.startingPrice, provider.pricingModel)}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {provider.description}
                </p>
              </div>
            </div>
            
            {/* Tags and Stats */}
            <div className="lg:w-80 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Expertise</h4>
                <div className="flex flex-wrap gap-1">
                  {provider.expertiseAreas.slice(0, 4).map((area) => (
                    <Badge key={area} variant="secondary" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                  {provider.expertiseAreas.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{provider.expertiseAreas.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Industries</h4>
                <div className="flex flex-wrap gap-1">
                  {provider.industries.slice(0, 3).map((industry) => (
                    <Badge key={industry} variant="outline" className="text-xs">
                      {industry}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{provider.clientCount}</div>
                  <div className="text-gray-600 dark:text-gray-400">Clients</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{provider.projectsCompleted}</div>
                  <div className="text-gray-600 dark:text-gray-400">Projects</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{provider.certifications.length}</div>
                  <div className="text-gray-600 dark:text-gray-400">Certs</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <Link href={`/providers/${provider.slug}`} onClick={onClick}>
                    View Profile
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="icon">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group hover:scale-105">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-3">
          <Avatar className="h-16 w-16 ring-2 ring-blue-100 dark:ring-blue-900">
            <AvatarImage src={provider.logo} alt={`${provider.name} logo`} />
            <AvatarFallback className="text-lg font-semibold">
              {provider.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col items-end gap-2">
            {provider.featured && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                <TrendingUp className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            {provider.verified && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            <Link 
              href={`/providers/${provider.slug}`}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              onClick={onClick}
            >
              {provider.name}
            </Link>
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {provider.location}
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{provider.rating}</span>
              <span>({provider.reviewCount})</span>
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4">
            {provider.description}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Expertise Tags */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">EXPERTISE</h4>
            <div className="flex flex-wrap gap-1">
              {provider.expertiseAreas.slice(0, 3).map((area) => (
                <Badge key={area} variant="secondary" className="text-xs">
                  {area}
                </Badge>
              ))}
              {provider.expertiseAreas.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{provider.expertiseAreas.length - 3}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Industries */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">INDUSTRIES</h4>
            <div className="flex flex-wrap gap-1">
              {provider.industries.slice(0, 2).map((industry) => (
                <Badge key={industry} variant="outline" className="text-xs">
                  {industry}
                </Badge>
              ))}
              {provider.industries.length > 2 && (
                <span className="text-xs text-gray-500">+{provider.industries.length - 2} more</span>
              )}
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center text-sm border-t border-gray-200 dark:border-gray-700 pt-4">
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">{provider.clientCount}</div>
              <div className="text-gray-600 dark:text-gray-400 text-xs">Clients</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">{provider.projectsCompleted}</div>
              <div className="text-gray-600 dark:text-gray-400 text-xs">Projects</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">{provider.certifications.length}</div>
              <div className="text-gray-600 dark:text-gray-400 text-xs">Certs</div>
            </div>
          </div>
          
          {/* Price and CTA */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatPrice(provider.startingPrice, provider.pricingModel)}
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm">
                <Link href={`/providers/${provider.slug}`} onClick={onClick}>
                  View Profile
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}