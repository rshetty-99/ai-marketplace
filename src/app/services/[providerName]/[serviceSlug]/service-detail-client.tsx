'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Star,
  MapPin,
  Clock,
  Shield,
  CheckCircle,
  Building2,
  User,
  Users,
  DollarSign,
  ArrowLeft,
  ExternalLink,
  Play,
  Download,
  Heart,
  Share2,
  MessageCircle,
  Calendar,
  Globe,
  Zap,
  Award,
  TrendingUp,
  Eye,
  ThumbsUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/components/providers/analytics-provider';
import type { Service } from '@/types/service';

interface ServiceDetailClientProps {
  service: Service;
}

export function ServiceDetailClient({ service }: ServiceDetailClientProps) {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    trackEvent('service_detail_viewed', {
      serviceId: service.id,
      serviceName: service.name,
      providerId: service.providerId,
      providerName: service.providerName,
    });
  }, [service, trackEvent]);

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

  const handleContactProvider = () => {
    trackEvent('contact_provider_clicked', {
      serviceId: service.id,
      providerId: service.providerId,
    });
    // TODO: Implement contact modal or navigation
  };

  const handleRequestQuote = () => {
    trackEvent('request_quote_clicked', {
      serviceId: service.id,
      providerId: service.providerId,
    });
    // TODO: Implement quote request modal or navigation
  };

  const handleSaveService = () => {
    setIsSaved(!isSaved);
    trackEvent('service_saved', {
      serviceId: service.id,
      action: !isSaved ? 'saved' : 'unsaved',
    });
  };

  const handleShareService = () => {
    trackEvent('service_shared', {
      serviceId: service.id,
    });
    
    if (navigator.share) {
      navigator.share({
        title: service.name,
        text: service.tagline || service.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
    trackEvent('service_detail_tab_viewed', {
      serviceId: service.id,
      tab: tab,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveService}
                className={cn(
                  "flex items-center gap-2",
                  isSaved && "text-red-600 hover:text-red-700"
                )}
              >
                <Heart className={cn("w-4 h-4", isSaved && "fill-current")} />
                {isSaved ? 'Saved' : 'Save'}
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleShareService}>
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Service Info */}
            <div className="lg:col-span-2">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0">
                  {service.media?.logo ? (
                    <img
                      src={service.media.logo}
                      alt={`${service.name} logo`}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {service.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {service.name}
                  </h1>
                  {service.tagline && (
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                      {service.tagline}
                    </p>
                  )}
                  
                  {/* Provider Info */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={service.providerLogo} />
                        <AvatarFallback className="text-sm">
                          {service.providerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {service.providerName}
                      </span>
                      {service.provider?.verification.verified && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    
                    {service.provider?.type && (
                      <div className="flex items-center gap-1">
                        {(() => {
                          const IconComponent = getProviderTypeIcon(service.provider.type);
                          return <IconComponent className="w-4 h-4 text-gray-400" />;
                        })()}
                        <span className="text-sm text-gray-500">
                          {getProviderTypeLabel(service.provider.type)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rating and Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                        {service.reviews.averageRating.toFixed(1)}
                      </span>
                      <span className="text-gray-500">
                        ({service.reviews.totalReviews} reviews)
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {service.stats.views.toLocaleString()} views
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {service.stats.conversions} projects
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category and Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="outline" className="text-sm">
                  {service.category.replace('_', ' ')}
                </Badge>
                {service.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-sm">
                    {tag}
                  </Badge>
                ))}
                {service.featured && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-sm">
                    Featured
                  </Badge>
                )}
              </div>
            </div>

            {/* Pricing and Actions */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <div className="text-center">
                    {service.pricing.startingPrice ? (
                      <div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(service.pricing.startingPrice)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {service.pricing.type === 'usage_based' && 'per use'}
                          {service.pricing.type === 'subscription' && `/${service.pricing.billingCycle}`}
                          {service.pricing.type === 'project_based' && 'per project'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xl font-medium text-gray-600 dark:text-gray-300">
                        Custom Pricing
                      </div>
                    )}
                    <p className="text-sm text-gray-500 capitalize mt-1">
                      {service.pricing.type.replace('_', ' ')}
                    </p>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <Button onClick={handleRequestQuote} className="w-full" size="lg">
                    Request Quote
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleContactProvider}
                    className="w-full"
                    size="lg"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Provider
                  </Button>

                  {service.media?.demos && service.media.demos.length > 0 && (
                    <Button variant="outline" className="w-full" size="lg">
                      <Play className="w-4 h-4 mr-2" />
                      View Demo
                    </Button>
                  )}

                  <Separator />

                  {/* Key Info */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{service.availability.regions.join(', ')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{service.implementation.timeline.total}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span>{service.availability.uptime} uptime</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span>{service.compliance.certifications.length} certifications</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="provider">Provider</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {service.description}
                </p>
              </CardContent>
            </Card>

            {/* Screenshots/Media */}
            {service.media?.screenshots && service.media.screenshots.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Screenshots</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.media.screenshots.map((screenshot, index) => (
                      <img
                        key={index}
                        src={screenshot}
                        alt={`${service.name} screenshot ${index + 1}`}
                        className="rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Use Cases */}
            <Card>
              <CardHeader>
                <CardTitle>Use Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {service.useCases.map((useCase, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-medium">{useCase}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Industries */}
            <Card>
              <CardHeader>
                <CardTitle>Target Industries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {service.industries.map((industry) => (
                    <Badge key={industry} variant="outline">
                      {industry}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {service.features.map((feature, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{feature.name}</CardTitle>
                      <Badge variant="outline">{feature.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            {service.pricing.tiers && service.pricing.tiers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {service.pricing.tiers.map((tier, index) => (
                  <Card key={index} className={cn("relative", tier.popular && "border-blue-500 shadow-lg")}>
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle>{tier.name}</CardTitle>
                      <div className="text-3xl font-bold">
                        {formatPrice(tier.price)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Custom Pricing</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Contact the provider for a customized quote based on your specific needs.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="technical" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Technologies */}
              <Card>
                <CardHeader>
                  <CardTitle>Technologies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {service.technical.technologies.map((tech) => (
                      <Badge key={tech} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Platforms */}
              <Card>
                <CardHeader>
                  <CardTitle>Supported Platforms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {service.technical.platforms.map((platform) => (
                      <Badge key={platform} variant="outline">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Implementation */}
              <Card>
                <CardHeader>
                  <CardTitle>Implementation Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Discovery</span>
                      <span className="text-sm font-medium">{service.implementation.timeline.discovery}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Development</span>
                      <span className="text-sm font-medium">{service.implementation.timeline.development}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Deployment</span>
                      <span className="text-sm font-medium">{service.implementation.timeline.deployment}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Total</span>
                      <span className="text-sm font-bold">{service.implementation.timeline.total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security & Compliance */}
              <Card>
                <CardHeader>
                  <CardTitle>Security & Compliance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Certifications:</h4>
                      <div className="flex flex-wrap gap-1">
                        {service.compliance.certifications.map((cert) => (
                          <Badge key={cert} variant="outline" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-sm mb-2">Regulations:</h4>
                      <div className="flex flex-wrap gap-1">
                        {service.compliance.regulations.map((reg) => (
                          <Badge key={reg} variant="secondary" className="text-xs">
                            {reg}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            {/* Rating Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Overall Rating */}
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">
                      {service.reviews.averageRating.toFixed(1)}
                    </div>
                    <div className="flex justify-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "w-5 h-5",
                            star <= service.reviews.averageRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Based on {service.reviews.totalReviews} reviews
                    </p>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="space-y-2">
                    {Object.entries(service.reviews.breakdown).reverse().map(([rating, count]) => (
                      <div key={rating} className="flex items-center gap-3">
                        <span className="text-sm w-8">{rating}★</span>
                        <Progress 
                          value={(count / service.reviews.totalReviews) * 100} 
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-300 w-8">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Dimensions */}
            {service.reviews.dimensions && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(service.reviews.dimensions).map(([dimension, data]) => (
                  <Card key={dimension}>
                    <CardHeader>
                      <CardTitle className="capitalize">{dimension.replace('_', ' ')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold">
                          {data.averageRating.toFixed(1)}
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "w-4 h-4",
                                star <= data.averageRating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="provider" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={service.providerLogo} />
                    <AvatarFallback className="text-lg">
                      {service.providerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{service.providerName}</CardTitle>
                    {service.provider?.description && (
                      <CardDescription className="mt-1">
                        {service.provider.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {service.provider && (
                <CardContent className="space-y-6">
                  {/* Provider Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold">
                        {service.provider.rating?.averageRating.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Provider Rating
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold">
                        {service.provider.rating?.totalReviews}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Total Reviews
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold">
                        {service.provider.founded}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Founded
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold">
                        {service.provider.employeeCount}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Team Size
                      </div>
                    </div>
                  </div>

                  {/* Verification */}
                  {service.provider.verification && (
                    <div>
                      <h3 className="font-semibold mb-3">Verification & Certifications</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-sm">Verified Provider</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {service.provider.verification.certifications.map((cert) => (
                            <Badge key={cert} variant="outline">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="flex gap-4">
                    <Button onClick={handleContactProvider}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact Provider
                    </Button>
                    {service.provider.website && (
                      <Button variant="outline" asChild>
                        <a href={service.provider.website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Visit Website
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}