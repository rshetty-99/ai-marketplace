/**
 * Public Vendor Profile Component
 * SEO-optimized public profile for vendor companies
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

import { 
  Building2,
  MapPin, 
  Calendar,
  Users,
  MessageSquare,
  Heart,
  Share2,
  ExternalLink,
  CheckCircle,
  Award,
  Globe,
  Mail,
  Phone,
  Star,
  Briefcase,
  DollarSign,
  Clock,
  Target,
  Code,
  TrendingUp,
  FileText
} from 'lucide-react';

import { EnhancedVendorProfile } from '@/lib/firebase/enhanced-profile-schema';
import { trackProfileView } from '@/lib/firebase/public-profile-service';
import { Header } from '@/components/shared/navigation/header';
import { Footer } from '@/components/shared/navigation/footer';
import { Gallery, GalleryItem } from '@/components/ui/gallery';

interface PublicVendorProfileProps {
  profile: EnhancedVendorProfile;
}

export function PublicVendorProfile({ profile }: PublicVendorProfileProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    // Track profile view
    trackProfileView(profile.id, 'anonymous');
  }, [profile.id]);

  const companyName = profile.company?.brandName || profile.company?.legalName || 'Company';
  const primaryServices = profile.services?.primaryServices?.slice(0, 6) || [];
  const technologies = profile.services?.technologies?.slice(0, 12) || [];
  const caseStudies = profile.showcase?.caseStudies?.slice(0, 6) || [];

  // Transform case studies and showcase items to gallery items
  const galleryItems: GalleryItem[] = [
    // Case studies
    ...caseStudies.map((study) => ({
      id: study.id,
      title: study.title,
      description: study.description,
      image: study.images?.[0] || '/placeholder-case-study.jpg',
      category: 'Case Study',
      tags: study.technologies,
      date: study.completionDate,
      featured: study.featured,
      link: study.liveUrl,
      type: 'image' as const
    })),
    // Portfolio items
    ...(profile.showcase?.portfolio?.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      image: item.image || '/placeholder-portfolio.jpg',
      category: item.category || 'Portfolio',
      tags: item.tags,
      date: item.date,
      featured: item.featured,
      link: item.url,
      type: 'image' as const
    })) || [])
  ];

  const handleContact = () => {
    console.log('Contact vendor:', profile.id);
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${companyName} - Development Services`,
          text: profile.company?.description || `Check out ${companyName}'s professional services`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            
            {/* Company Logo & Basic Info */}
            <div className="flex flex-col items-center lg:items-start">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white shadow-xl rounded-lg">
                  <AvatarImage src={profile.branding?.logo} alt={companyName} />
                  <AvatarFallback className="text-2xl bg-white text-gray-800 rounded-lg">
                    {companyName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {profile.isVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-2">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-sm font-medium">Accepting new projects</span>
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
                <h1 className="text-4xl lg:text-5xl font-bold">
                  {companyName}
                </h1>
                {profile.isFeatured && (
                  <Badge className="bg-yellow-500 text-yellow-900 self-center lg:self-start">
                    <Award className="h-4 w-4 mr-1" />
                    Featured Partner
                  </Badge>
                )}
              </div>
              
              <p className="text-xl lg:text-2xl opacity-90 mb-4">
                Professional Development Services
              </p>
              
              <p className="text-lg opacity-80 mb-6 max-w-3xl">
                {profile.company?.description || 'Experienced development company ready to bring your ideas to life.'}
              </p>

              {/* Key Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>{profile.company?.employeeCount || 25} employees</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>Founded {profile.company?.foundedYear || 2020}</span>
                </div>
                
                {profile.company?.headquarters?.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>{profile.company.headquarters.city}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  <span>100+ projects completed</span>
                </div>
              </div>

              {/* Services Preview */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6">
                {profile.services?.expertise?.slice(0, 6).map((service) => (
                  <Badge key={service} variant="secondary" className="bg-white/20 text-white">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Contact & Pricing */}
            <div className="flex flex-col items-center lg:items-end gap-4">
              <div className="text-center lg:text-right">
                <div className="text-sm opacity-80 mb-1">Starting from</div>
                <div className="text-3xl font-bold mb-1">
                  ${profile.business?.minimumEngagement?.budget?.toLocaleString() || '10,000'}
                </div>
                <div className="text-sm opacity-80">
                  {profile.business?.minimumEngagement?.duration || '3 months'} minimum
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={handleContact}
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Get Quote
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-white text-white hover:bg-white/10"
                    onClick={handleFavorite}
                  >
                    <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-white text-white hover:bg-white/10"
                    onClick={handleShare}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                
                {/* About Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>About {companyName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {profile.company?.description || 'Professional development company focused on delivering high-quality solutions.'}
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <h4 className="font-semibold mb-2">Company Highlights</h4>
                        <ul className="text-gray-600 space-y-1 text-sm">
                          <li>• {profile.company?.employeeCount || 25}+ skilled professionals</li>
                          <li>• {(new Date().getFullYear()) - (profile.company?.foundedYear || 2020)}+ years of experience</li>
                          <li>• Serving {profile.services?.industries?.length || 5}+ industries</li>
                          <li>• 100+ successful projects delivered</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Industries We Serve</h4>
                        <div className="flex flex-wrap gap-1">
                          {(profile.services?.industries || profile.company?.industry || ['Technology', 'Finance', 'Healthcare']).slice(0, 6).map((industry) => (
                            <Badge key={industry} variant="outline" className="text-xs">
                              {industry}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Technologies */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Technologies & Expertise
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Technologies</h4>
                        <div className="flex flex-wrap gap-2">
                          {technologies.map((tech) => (
                            <Badge key={tech} variant="secondary">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3">Methodologies</h4>
                        <div className="flex flex-wrap gap-2">
                          {(profile.services?.methodologies || ['Agile', 'Scrum', 'DevOps']).map((method) => (
                            <Badge key={method} variant="outline">
                              {method}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Services Tab */}
              <TabsContent value="services" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Our Services</CardTitle>
                    <CardDescription>
                      Comprehensive development solutions tailored to your needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {primaryServices.length > 0 ? (
                      <div className="grid gap-6">
                        {primaryServices.map((service, index) => (
                          <div key={index} className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold mb-1">{service.name}</h3>
                                <Badge variant="outline" className="mb-2">{service.category}</Badge>
                                <p className="text-gray-600">{service.description}</p>
                              </div>
                              <div className="ml-4 text-right">
                                <div className="font-semibold text-green-600">
                                  ${service.priceRange?.min?.toLocaleString()} - ${service.priceRange?.max?.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-500">Project range</div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Learn More
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Service information coming soon</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Portfolio Tab */}
              <TabsContent value="portfolio" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Case Studies & Portfolio</CardTitle>
                    <CardDescription>
                      Recent projects, client success stories, and showcase work
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {galleryItems.length > 0 ? (
                      <Gallery 
                        items={galleryItems}
                        columns={3}
                        showFilters={true}
                        showMetadata={true}
                        className="mt-4"
                      />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Case studies and portfolio coming soon</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Our Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{profile.company?.employeeCount || 25}+</div>
                        <div className="text-sm text-gray-600">Team Members</div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">5+</div>
                        <div className="text-sm text-gray-600">Senior Developers</div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">3+</div>
                        <div className="text-sm text-gray-600">Project Managers</div>
                      </div>
                    </div>
                    
                    {profile.team?.leadership && profile.team.leadership.length > 0 ? (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-4">Leadership Team</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          {profile.team.leadership.slice(0, 4).map((member, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                              <Avatar>
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback>
                                  {member.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{member.name}</div>
                                <div className="text-sm text-gray-600">{member.title}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500 mt-6">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Team information coming soon</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle>Start Your Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" size="lg" onClick={handleContact}>
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Get Free Quote
                </Button>
                
                <Button variant="outline" className="w-full" size="lg">
                  <Calendar className="h-5 w-5 mr-2" />
                  Schedule Consultation
                </Button>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Minimum project</span>
                    <span className="font-semibold">${profile.business?.minimumEngagement?.budget?.toLocaleString() || '10,000'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timeline</span>
                    <span>{profile.business?.minimumEngagement?.duration || '3 months'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response time</span>
                    <span>Within 24 hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Company Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Founded</span>
                  <span className="font-semibold">{profile.company?.foundedYear || 2020}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Team size</span>
                  <span className="font-semibold">{profile.company?.employeeCount || 25}+ employees</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location</span>
                  <span>{profile.company?.headquarters?.city || 'Global'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Industries</span>
                  <span>{profile.services?.industries?.length || 5}+</span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.contact?.salesEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <Link href={`mailto:${profile.contact.salesEmail}`} className="text-blue-600 hover:underline text-sm">
                      {profile.contact.salesEmail}
                    </Link>
                  </div>
                )}
                {profile.contact?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <Link href={`tel:${profile.contact.phone}`} className="text-blue-600 hover:underline text-sm">
                      {profile.contact.phone}
                    </Link>
                  </div>
                )}
                {profile.company?.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <Link href={profile.company.website} target="_blank" className="text-blue-600 hover:underline text-sm">
                      Visit Website
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preferred Client Sizes */}
            {profile.business?.preferredClientSize && profile.business.preferredClientSize.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Ideal Client Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {profile.business.preferredClientSize.map((size) => (
                      <div key={size} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{size}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}