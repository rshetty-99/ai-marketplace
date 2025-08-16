'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  TrendingUp,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Clock,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/shared/navigation/header';
import { Footer } from '@/components/shared/navigation/footer';
import { useAnalytics } from '@/components/providers/analytics-provider';
import { generateProviderProfileSchema } from '@/lib/seo/structured-data';
import Script from 'next/script';

interface ProviderProfileClientProps {
  provider: any; // This should be properly typed based on your provider interface
}

export function ProviderProfileClient({ provider }: ProviderProfileClientProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { trackEvent } = useAnalytics();

  const formatPrice = (price: number, model: string) => {
    if (model === 'hourly') {
      return `$${price.toLocaleString()}/hr`;
    } else if (model === 'project') {
      return `From $${price.toLocaleString()}`;
    }
    return `$${price.toLocaleString()}/month`;
  };

  const handleContactClick = (type: string) => {
    trackEvent('provider_contact_clicked', {
      provider_id: provider.id,
      provider_name: provider.name,
      contact_type: type,
      location: 'provider_profile'
    });
  };

  const handleServiceInquiry = (serviceId: string) => {
    trackEvent('service_inquiry_clicked', {
      provider_id: provider.id,
      service_id: serviceId,
      location: 'provider_profile'
    });
  };

  const providerSchema = generateProviderProfileSchema(provider);

  useEffect(() => {
    // Track page view
    trackEvent('provider_profile_viewed', {
      provider_id: provider.id,
      provider_name: provider.name,
      tab: activeTab
    });
  }, [provider.id, provider.name, activeTab, trackEvent]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Structured Data for SEO */}
      <Script
        id="provider-profile-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(providerSchema) }}
      />
      
      <Header />
      
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-blue-600 to-purple-600">
        {provider.coverImage && (
          <Image
            src={provider.coverImage}
            alt={`${provider.name} cover`}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
      </div>

      {/* Profile Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="relative">
              <Avatar className="w-32 h-32">
                <AvatarImage src={provider.logo} alt={provider.name} />
                <AvatarFallback className="text-2xl font-bold">
                  {provider.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {provider.verified && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-1">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {provider.name}
                </h1>
                {provider.featured && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Award className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{provider.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  <span>{provider.teamSize} employees</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Founded {provider.founded}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(provider.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{provider.rating}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    ({provider.reviewCount} reviews)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{provider.clientCount}+ clients served</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Briefcase className="w-4 h-4" />
                  <span>{provider.projectsCompleted} projects completed</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {provider.expertiseAreas.map((area: string) => (
                  <Badge key={area} variant="outline">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                size="lg" 
                className="h-12 px-8"
                onClick={() => handleContactClick('message')}
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Contact Provider
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="h-12 px-8"
                onClick={() => handleContactClick('rfp')}
              >
                Request Proposal
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* About Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>About {provider.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {provider.longDescription || provider.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Industries */}
                <Card>
                  <CardHeader>
                    <CardTitle>Industries We Serve</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {provider.industries.map((industry: string) => (
                        <div key={industry} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          <span>{industry}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Awards */}
                {provider.awards && provider.awards.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Awards & Recognition</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {provider.awards.map((award: any, index: number) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <Award className="w-6 h-6 text-yellow-600" />
                            <div>
                              <div className="font-semibold">{award.name}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{award.organization}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="portfolio" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Featured Projects</CardTitle>
                    <CardDescription>
                      Showcase of our most impactful AI implementations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {provider.portfolio.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-6">
                        {provider.portfolio.map((project: any) => (
                          <div key={project.id} className="group cursor-pointer">
                            <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                              <Image
                                src={project.image}
                                alt={project.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-3 left-3">
                                <Badge variant="secondary">{project.category}</Badge>
                              </div>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
                              {project.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {project.technologies.map((tech: string) => (
                                <Badge key={tech} variant="outline" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Outcome:</span>
                                <div className="font-medium">{project.outcome}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Timeline:</span>
                                <div className="font-medium">{project.timeline}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No portfolio items available yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Our Services</CardTitle>
                    <CardDescription>
                      Comprehensive AI solutions tailored to your needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {provider.services.length > 0 ? (
                      <div className="space-y-4">
                        {provider.services.map((service: any) => (
                          <div key={service.id} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="text-lg font-semibold">{service.name}</h3>
                              <div className="text-right">
                                <div className="font-semibold text-green-600">{service.pricing}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {service.duration}
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                              {service.description}
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleServiceInquiry(service.id)}
                            >
                              Learn More
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Service information coming soon.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Client Reviews</CardTitle>
                    <CardDescription>
                      What our clients say about working with us
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {provider.testimonials.length > 0 ? (
                      <div className="space-y-6">
                        {provider.testimonials.map((review: any) => (
                          <div key={review.id} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-start gap-4">
                              <Avatar>
                                <AvatarImage src={review.image} alt={review.client} />
                                <AvatarFallback>{review.client.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-4 h-4 ${
                                          i < review.rating
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="font-semibold">{review.rating}/5</span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 mb-3">
                                  "{review.content}"
                                </p>
                                <div className="text-sm">
                                  <div className="font-semibold">{review.client}</div>
                                  <div className="text-gray-500">{review.position}, {review.company}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No reviews available yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full justify-start h-12"
                  onClick={() => handleContactClick('message')}
                >
                  <MessageSquare className="w-5 h-5 mr-3" />
                  Send Message
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12"
                  onClick={() => handleContactClick('consultation')}
                >
                  <Calendar className="w-5 h-5 mr-3" />
                  Book Consultation
                </Button>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  {provider.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <Link 
                        href={provider.website} 
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        Visit Website
                      </Link>
                    </div>
                  )}
                  {provider.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <Link 
                        href={`mailto:${provider.email}`}
                        className="text-gray-600 dark:text-gray-400"
                      >
                        {provider.email}
                      </Link>
                    </div>
                  )}
                  {provider.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <Link 
                        href={`tel:${provider.phone}`}
                        className="text-gray-600 dark:text-gray-400"
                      >
                        {provider.phone}
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Key Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Founded</span>
                  <span className="font-semibold">{provider.founded}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Team Size</span>
                  <span className="font-semibold">{provider.teamSize}+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Projects</span>
                  <span className="font-semibold">{provider.projectsCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Clients</span>
                  <span className="font-semibold">{provider.clientCount}+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Pricing</span>
                  <span className="font-semibold">{formatPrice(provider.startingPrice, provider.pricingModel)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card>
              <CardHeader>
                <CardTitle>Certifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {provider.certifications.map((cert: string) => (
                    <Badge key={cert} variant="secondary" className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Client Logos */}
            {provider.clients && provider.clients.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Trusted By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {provider.clients.map((client: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                        <div className="text-sm font-medium">{client.name}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Start Your AI Project?</h2>
            <p className="text-blue-100 mb-6">
              Connect with {provider.name} to discuss your requirements and get a custom proposal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary" 
                className="h-12 px-8"
                onClick={() => handleContactClick('proposal')}
              >
                Get Free Consultation
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-12 px-8 bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-700"
                onClick={() => handleContactClick('quote')}
              >
                Request Quote
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}