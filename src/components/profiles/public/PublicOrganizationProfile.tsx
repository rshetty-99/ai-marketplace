/**
 * Public Organization Profile Component
 * SEO-optimized public profile for customer organizations
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
import { Progress } from '@/components/ui/progress';

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
  TrendingUp,
  FileText,
  HandHeart,
  Lightbulb,
  Zap,
  Search,
  Shield,
  ChevronRight
} from 'lucide-react';

import { EnhancedOrganizationProfile } from '@/lib/firebase/enhanced-profile-schema';
import { trackProfileView } from '@/lib/firebase/public-profile-service';
import { Header } from '@/components/shared/navigation/header';
import { Footer } from '@/components/shared/navigation/footer';
import { Gallery, GalleryItem } from '@/components/ui/gallery';

interface PublicOrganizationProfileProps {
  profile: EnhancedOrganizationProfile;
}

export function PublicOrganizationProfile({ profile }: PublicOrganizationProfileProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    // Track profile view
    trackProfileView(profile.id, 'anonymous');
  }, [profile.id]);

  const orgName = profile.organization?.displayName || profile.organization?.legalName || 'Organization';
  const projectTypes = profile.requirements?.projectTypes || [];
  const budgetRange = profile.requirements?.budget;
  const preferredPartners = profile.partnerships?.preferredPartnerTypes || [];

  // Transform organization vision/project materials to gallery items
  const galleryItems: GalleryItem[] = [
    // Vision materials, case studies, or project examples
    ...(profile.showcase?.materials?.map((material) => ({
      id: material.id,
      title: material.title,
      description: material.description,
      image: material.image || '/placeholder-org-material.jpg',
      category: material.type || 'Vision',
      tags: material.tags,
      date: material.date,
      featured: material.featured,
      link: material.link,
      type: 'image' as const
    })) || []),
    // Success stories or partnership examples
    ...(profile.partnerships?.successStories?.map((story) => ({
      id: story.id,
      title: story.title,
      description: story.description,
      image: story.image || '/placeholder-success-story.jpg',
      category: 'Success Story',
      tags: story.technologies || [],
      date: story.date,
      featured: true,
      link: story.link,
      type: 'image' as const
    })) || [])
  ];

  const handleContact = () => {
    console.log('Contact organization:', profile.id);
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${orgName} - Partnership Opportunities`,
          text: profile.organization?.description || `Explore partnership opportunities with ${orgName}`,
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
      <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            
            {/* Organization Logo & Basic Info */}
            <div className="flex flex-col items-center lg:items-start">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white shadow-xl rounded-lg">
                  <AvatarImage src={profile.branding?.logo} alt={orgName} />
                  <AvatarFallback className="text-2xl bg-white text-gray-800 rounded-lg">
                    {orgName.slice(0, 2).toUpperCase()}
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
                <span className="text-sm font-medium">Seeking partners</span>
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
                <h1 className="text-4xl lg:text-5xl font-bold">
                  {orgName}
                </h1>
                {profile.isFeatured && (
                  <Badge className="bg-yellow-500 text-yellow-900 self-center lg:self-start">
                    <Award className="h-4 w-4 mr-1" />
                    Featured Client
                  </Badge>
                )}
              </div>
              
              <p className="text-xl lg:text-2xl opacity-90 mb-4">
                Partnership & Development Opportunities
              </p>
              
              <p className="text-lg opacity-80 mb-6 max-w-3xl">
                {profile.organization?.description || 'Innovative organization seeking development partners to bring cutting-edge solutions to market.'}
              </p>

              {/* Key Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>{profile.organization?.employeeCount || 100}+ employees</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>Founded {profile.organization?.foundedYear || 2015}</span>
                </div>
                
                {profile.organization?.headquarters?.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>{profile.organization.headquarters.city}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  <span>{projectTypes.length}+ project types</span>
                </div>
              </div>

              {/* Project Types Preview */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6">
                {projectTypes.slice(0, 6).map((type) => (
                  <Badge key={type} variant="secondary" className="bg-white/20 text-white">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Budget & Partnership Info */}
            <div className="flex flex-col items-center lg:items-end gap-4">
              <div className="text-center lg:text-right">
                <div className="text-sm opacity-80 mb-1">Project budgets</div>
                <div className="text-3xl font-bold mb-1">
                  ${budgetRange?.min?.toLocaleString() || '25,000'} - ${budgetRange?.max?.toLocaleString() || '500,000'}
                </div>
                <div className="text-sm opacity-80">
                  Per project range
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  size="lg" 
                  className="bg-white text-purple-600 hover:bg-gray-100"
                  onClick={handleContact}
                >
                  <HandHeart className="h-5 w-5 mr-2" />
                  Explore Partnership
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
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="partnerships">Partnerships</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                
                {/* About Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>About {orgName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {profile.organization?.description || 'Forward-thinking organization focused on innovation and digital transformation through strategic partnerships.'}
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <h4 className="font-semibold mb-2">Organization Highlights</h4>
                        <ul className="text-gray-600 space-y-1 text-sm">
                          <li>• {profile.organization?.employeeCount || 100}+ dedicated professionals</li>
                          <li>• {(new Date().getFullYear()) - (profile.organization?.foundedYear || 2015)}+ years of industry experience</li>
                          <li>• Active in {profile.requirements?.industries?.length || 3}+ industries</li>
                          <li>• Seeking {preferredPartners.length || 5}+ partner types</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Industries & Focus Areas</h4>
                        <div className="flex flex-wrap gap-1">
                          {(profile.requirements?.industries || profile.organization?.industry || ['Technology', 'Innovation', 'Digital']).slice(0, 6).map((industry) => (
                            <Badge key={industry} variant="outline" className="text-xs">
                              {industry}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Partnership Goals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Partnership Goals & Vision
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Strategic Objectives</h4>
                        <ul className="text-gray-600 space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 mt-0.5 text-yellow-500" />
                            <span>Innovation & digital transformation</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Zap className="h-4 w-4 mt-0.5 text-blue-500" />
                            <span>Scalable technology solutions</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 mt-0.5 text-green-500" />
                            <span>Market expansion & growth</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Shield className="h-4 w-4 mt-0.5 text-purple-500" />
                            <span>Risk mitigation & compliance</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3">Preferred Partner Types</h4>
                        <div className="flex flex-wrap gap-2">
                          {preferredPartners.map((partner) => (
                            <Badge key={partner} variant="secondary">
                              {partner}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Projects Tab */}
              <TabsContent value="projects" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Requirements</CardTitle>
                    <CardDescription>
                      Current and upcoming development needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {projectTypes.length > 0 ? (
                      <div className="grid gap-6">
                        {projectTypes.map((type, index) => (
                          <div key={index} className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold mb-1">{type}</h3>
                                <Badge variant="outline" className="mb-2">High Priority</Badge>
                                <p className="text-gray-600">
                                  Seeking experienced partners for {type.toLowerCase()} projects with proven track record.
                                </p>
                              </div>
                              <div className="ml-4 text-right">
                                <div className="font-semibold text-green-600">
                                  ${budgetRange?.min?.toLocaleString() || '25,000'}+
                                </div>
                                <div className="text-sm text-gray-500">Starting budget</div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <Search className="h-4 w-4 mr-2" />
                              View Requirements
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Project requirements coming soon</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Vision & Success Stories Gallery */}
                {galleryItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Vision & Success Stories</CardTitle>
                      <CardDescription>
                        Our organizational vision and partnership success examples
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Gallery 
                        items={galleryItems}
                        columns={2}
                        showFilters={true}
                        showMetadata={true}
                        className="mt-4"
                      />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Partnerships Tab */}
              <TabsContent value="partnerships" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Partnership Approach</CardTitle>
                    <CardDescription>
                      How we collaborate with development partners
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <div className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-3">Collaboration Model</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <HandHeart className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                            <div className="font-medium">Strategic</div>
                            <div className="text-sm text-gray-600">Long-term partnerships</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <Zap className="h-8 w-8 mx-auto mb-2 text-green-600" />
                            <div className="font-medium">Agile</div>
                            <div className="text-sm text-gray-600">Flexible delivery</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <Shield className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                            <div className="font-medium">Secure</div>
                            <div className="text-sm text-gray-600">Compliance focused</div>
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-3">Partner Benefits</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span>Competitive compensation & bonuses</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span>Long-term project stability</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span>Technology & innovation exposure</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span>Professional growth opportunities</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Requirements Tab */}
              <TabsContent value="requirements" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Partner Requirements</CardTitle>
                    <CardDescription>
                      What we look for in development partners
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-3">Technical Requirements</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            {(profile.requirements?.technologies || ['React', 'Node.js', 'Python', 'AWS']).map((tech) => (
                              <div key={tech} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{tech}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-3">Experience Level</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span>Minimum experience required</span>
                            <Badge variant="outline">3+ years</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Team size preference</span>
                            <Badge variant="outline">5-20 developers</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Communication level</span>
                            <Badge variant="outline">Business fluent English</Badge>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h4 className="font-semibold mb-3">Project Timeline</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Typical project duration</span>
                            <span className="font-medium">3-12 months</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Start timeline</span>
                            <span className="font-medium">Within 2-4 weeks</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Time zone preference</span>
                            <span className="font-medium">EST overlap required</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Partnership Interest Card */}
            <Card>
              <CardHeader>
                <CardTitle>Express Interest</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" size="lg" onClick={handleContact}>
                  <HandHeart className="h-5 w-5 mr-2" />
                  Partnership Inquiry
                </Button>
                
                <Button variant="outline" className="w-full" size="lg">
                  <Calendar className="h-5 w-5 mr-2" />
                  Schedule Meeting
                </Button>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget range</span>
                    <span className="font-semibold">${budgetRange?.min?.toLocaleString() || '25K'} - ${budgetRange?.max?.toLocaleString() || '500K'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Project duration</span>
                    <span>3-12 months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response time</span>
                    <span>Within 48 hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organization Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Organization Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Founded</span>
                  <span className="font-semibold">{profile.organization?.foundedYear || 2015}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Team size</span>
                  <span className="font-semibold">{profile.organization?.employeeCount || 100}+ employees</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location</span>
                  <span>{profile.organization?.headquarters?.city || 'Global'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Industries</span>
                  <span>{profile.requirements?.industries?.length || 3}+</span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.contact?.businessEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <Link href={`mailto:${profile.contact.businessEmail}`} className="text-blue-600 hover:underline text-sm">
                      {profile.contact.businessEmail}
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
                {profile.organization?.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <Link href={profile.organization.website} target="_blank" className="text-blue-600 hover:underline text-sm">
                      Visit Website
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Partner Requirements Summary */}
            {preferredPartners.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Seeking Partners</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {preferredPartners.slice(0, 5).map((partner) => (
                      <div key={partner} className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{partner}</span>
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