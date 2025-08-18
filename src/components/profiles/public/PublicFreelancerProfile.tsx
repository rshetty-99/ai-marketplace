/**
 * Public Freelancer Profile Component
 * SEO-optimized public profile for freelancers
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

import { 
  Star, 
  MapPin, 
  Clock, 
  Calendar,
  DollarSign,
  MessageSquare,
  Heart,
  Share2,
  ExternalLink,
  CheckCircle,
  Award,
  Globe,
  Mail,
  Phone,
  Users,
  Briefcase,
  Code,
  Download,
  Eye,
  TrendingUp
} from 'lucide-react';

import { EnhancedFreelancerProfile } from '@/lib/firebase/enhanced-profile-schema';
import { trackProfileView } from '@/lib/firebase/public-profile-service';
import { Header } from '@/components/shared/navigation/header';
import { Footer } from '@/components/shared/navigation/footer';
import { Gallery, GalleryItem } from '@/components/ui/gallery';

interface PublicFreelancerProfileProps {
  profile: EnhancedFreelancerProfile;
}

export function PublicFreelancerProfile({ profile }: PublicFreelancerProfileProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    // Track profile view
    trackProfileView(profile.id, 'anonymous');
  }, [profile.id]);

  const profileName = `${profile.firstName} ${profile.lastName}`;
  const primarySkills = profile.skills?.primary?.slice(0, 6) || [];
  const secondarySkills = profile.skills?.secondary?.slice(0, 8) || [];
  const portfolioProjects = profile.portfolio?.projects?.slice(0, 6) || [];
  const testimonials = profile.testimonials?.slice(0, 4) || [];

  // Transform portfolio projects to gallery items
  const galleryItems: GalleryItem[] = portfolioProjects.map((project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    image: project.images?.[0]?.url || '/placeholder-project.jpg',
    category: project.category,
    tags: project.technologies,
    date: project.completionDate,
    featured: project.isFeatureProject,
    link: project.projectUrl,
    type: 'image' as const
  }));

  const handleContact = () => {
    // In a real implementation, this would open a contact modal or redirect to messaging
    console.log('Contact freelancer:', profile.id);
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    // In a real implementation, this would save to user's favorites
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profileName} - Freelancer Profile`,
          text: profile.professionalSummary || `Check out ${profileName}'s professional profile`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            
            {/* Profile Image & Basic Info */}
            <div className="flex flex-col items-center lg:items-start">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                  <AvatarImage src={profile.avatar} alt={profileName} />
                  <AvatarFallback className="text-2xl bg-white text-gray-800">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {profile.isVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-2">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                )}
              </div>
              
              {/* Availability Status */}
              <div className="mt-4 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <div className={`w-3 h-3 rounded-full ${
                  profile.availability?.isAvailable ? 'bg-green-400' : 'bg-orange-400'
                }`} />
                <span className="text-sm font-medium">
                  {profile.availability?.isAvailable ? 'Available for hire' : 'Busy'}
                </span>
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
                <h1 className="text-4xl lg:text-5xl font-bold">
                  {profileName}
                </h1>
                {profile.isFeatured && (
                  <Badge className="bg-yellow-500 text-yellow-900 self-center lg:self-start">
                    <Award className="h-4 w-4 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              
              <h2 className="text-xl lg:text-2xl font-medium opacity-90 mb-4">
                {profile.title || 'Professional Freelancer'}
              </h2>
              
              <p className="text-lg opacity-80 mb-6 max-w-3xl">
                {profile.professionalSummary || 'Experienced freelancer ready to help with your next project.'}
              </p>

              {/* Key Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{profile.rating || 5.0}</span>
                  <span className="opacity-80">({profile.reviewCount || 0} reviews)</span>
                </div>
                
                {profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>{profile.location}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  <span>{profile.analytics?.totalProjects || 0}+ projects</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>Responds in {profile.averageResponseTime || '2'} hours</span>
                </div>
              </div>

              {/* Primary Skills Preview */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6">
                {primarySkills.map((skill) => (
                  <Badge key={skill.name} variant="secondary" className="bg-white/20 text-white">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Contact & Pricing */}
            <div className="flex flex-col items-center lg:items-end gap-4">
              <div className="text-center lg:text-right">
                <div className="text-3xl font-bold mb-1">
                  ${profile.pricing?.hourlyRate || 75}/hr
                </div>
                <div className="text-sm opacity-80">
                  {profile.pricing?.currency || 'USD'} • Starting rate
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={handleContact}
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Contact
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
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                
                {/* About Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>About {profile.firstName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {profile.bio || 'Experienced professional ready to help with your next project.'}
                    </p>
                    
                    {profile.experience && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Experience Highlights</h4>
                        <ul className="text-gray-600 space-y-1">
                          <li>• {profile.experience.totalYears || 5}+ years of professional experience</li>
                          <li>• Specialized in {primarySkills.slice(0, 3).map(s => s.name).join(', ')}</li>
                          <li>• Successfully completed {profile.analytics?.totalProjects || 20}+ projects</li>
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Services */}
                {profile.services?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Services Offered</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {profile.services.slice(0, 3).map((service, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{service.name}</h4>
                              <Badge variant="outline">${service.price}</Badge>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                            <div className="flex justify-between items-center text-sm text-gray-500">
                              <span>Delivery: {service.deliveryTime}</span>
                              <Button size="sm" variant="outline">Learn More</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Education & Certifications */}
                {(profile.education?.length > 0 || profile.certifications?.length > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Education & Certifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      
                      {profile.education?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Education</h4>
                          <div className="space-y-2">
                            {profile.education.slice(0, 3).map((edu, index) => (
                              <div key={index} className="flex justify-between">
                                <div>
                                  <div className="font-medium">{edu.degree}</div>
                                  <div className="text-sm text-gray-600">{edu.institution}</div>
                                </div>
                                <div className="text-sm text-gray-500">{edu.year}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.certifications?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Certifications</h4>
                          <div className="flex flex-wrap gap-2">
                            {profile.certifications.slice(0, 6).map((cert, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                <Award className="h-3 w-3" />
                                {cert.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Portfolio Tab */}
              <TabsContent value="portfolio" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Featured Projects</CardTitle>
                    <CardDescription>
                      Showcase of recent work and achievements
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
                        <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Portfolio projects will be displayed here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Skills Tab */}
              <TabsContent value="skills" className="space-y-6">
                
                {/* Primary Skills */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Primary Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {primarySkills.map((skill) => (
                        <div key={skill.name}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{skill.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {skill.yearsOfExperience}yr
                              </Badge>
                              <Badge variant={
                                skill.level === 'expert' ? 'default' :
                                skill.level === 'advanced' ? 'secondary' : 'outline'
                              } className="text-xs capitalize">
                                {skill.level}
                              </Badge>
                            </div>
                          </div>
                          <Progress 
                            value={
                              skill.level === 'expert' ? 100 :
                              skill.level === 'advanced' ? 80 :
                              skill.level === 'intermediate' ? 60 : 40
                            } 
                            className="h-2" 
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Secondary Skills */}
                {secondarySkills.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Additional Skills
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {secondarySkills.map((skill) => (
                          <Badge key={skill.name} variant="secondary">
                            {skill.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tools & Technologies */}
                {profile.skills?.tools && profile.skills.tools.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tools & Technologies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.tools.map((tool) => (
                          <Badge key={tool} variant="outline">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Languages */}
                {profile.skills?.languages && profile.skills.languages.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Languages
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {profile.skills.languages.map((lang) => (
                          <div key={lang.language} className="flex justify-between items-center">
                            <span>{lang.language}</span>
                            <Badge variant="outline" className="capitalize">
                              {lang.proficiency}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Client Reviews</CardTitle>
                    <CardDescription>
                      What clients say about working with {profile.firstName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {testimonials.length > 0 ? (
                      <div className="space-y-6">
                        {testimonials.map((testimonial) => (
                          <div key={testimonial.id} className="p-6 bg-gray-50 rounded-lg">
                            <div className="flex items-start gap-4">
                              <Avatar>
                                <AvatarImage src={testimonial.clientAvatar} alt={testimonial.clientName} />
                                <AvatarFallback>
                                  {testimonial.clientName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < testimonial.rating
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="font-semibold">{testimonial.rating}/5</span>
                                  {testimonial.isVerified && (
                                    <Badge variant="outline" className="text-xs">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Verified
                                    </Badge>
                                  )}
                                </div>
                                
                                <blockquote className="text-gray-700 mb-3 italic">
                                  "{testimonial.testimonial}"
                                </blockquote>
                                
                                <div className="text-sm text-gray-500">
                                  <div className="font-semibold">{testimonial.clientName}</div>
                                  {testimonial.clientTitle && (
                                    <div>{testimonial.clientTitle}</div>
                                  )}
                                  {testimonial.clientCompany && (
                                    <div>{testimonial.clientCompany}</div>
                                  )}
                                  <div className="mt-1">{testimonial.dateGiven.toLocaleDateString()}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Client reviews will appear here</p>
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
                <CardTitle>Hire {profile.firstName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" size="lg" onClick={handleContact}>
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Send Message
                </Button>
                
                <Button variant="outline" className="w-full" size="lg">
                  <Calendar className="h-5 w-5 mr-2" />
                  Schedule Call
                </Button>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Starting from</span>
                    <span className="font-semibold">${profile.pricing?.hourlyRate}/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response time</span>
                    <span>{profile.averageResponseTime || '2'} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Availability</span>
                    <Badge variant={profile.availability?.isAvailable ? 'default' : 'secondary'}>
                      {profile.availability?.isAvailable ? 'Available' : 'Busy'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Profile views</span>
                  <span className="font-semibold">{profile.analytics?.totalViews || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Projects completed</span>
                  <span className="font-semibold">{profile.analytics?.totalProjects || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Repeat clients</span>
                  <span className="font-semibold">{profile.analytics?.repeatClients || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Member since</span>
                  <span>{profile.createdAt?.toLocaleDateString() || 'Recently'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Verification Card */}
            {profile.verification && (
              <Card>
                <CardHeader>
                  <CardTitle>Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {profile.verification.identity && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Identity verified</span>
                    </div>
                  )}
                  {profile.verification.email && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Email verified</span>
                    </div>
                  )}
                  {profile.verification.phone && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Phone verified</span>
                    </div>
                  )}
                  {profile.verification.portfolio && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Portfolio verified</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            {profile.publicProfile?.showContact && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <Link href={`mailto:${profile.email}`} className="text-blue-600 hover:underline">
                        {profile.email}
                      </Link>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <Link href={`tel:${profile.phone}`} className="text-blue-600 hover:underline">
                        {profile.phone}
                      </Link>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <Link href={profile.website} target="_blank" className="text-blue-600 hover:underline">
                        Visit Website
                      </Link>
                    </div>
                  )}
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