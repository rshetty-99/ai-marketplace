/**
 * Profile Preview Component
 * Live preview of how the public profile will appear to visitors
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { 
  Eye, 
  EyeOff,
  Monitor,
  Smartphone,
  Tablet,
  Star,
  MapPin,
  Clock,
  Calendar,
  DollarSign,
  Users,
  Award,
  Globe,
  Phone,
  Mail,
  ExternalLink,
  Share2,
  Heart,
  MessageSquare,
  Briefcase,
  Code,
  Zap,
  CheckCircle,
  AlertTriangle,
  Refresh
} from 'lucide-react';

import { useProfile } from '@/hooks/useProfile';
import { EnhancedUserDocument } from '@/lib/firebase/enhanced-profile-schema';

interface ProfilePreviewProps {
  profile?: EnhancedUserDocument;
  className?: string;
}

type DeviceView = 'desktop' | 'tablet' | 'mobile';

export function ProfilePreview({ profile: externalProfile, className }: ProfilePreviewProps) {
  const { userProfile, isLoading } = useProfile();
  const [deviceView, setDeviceView] = useState<DeviceView>('desktop');
  const [isPreviewMode, setIsPreviewMode] = useState(true);

  // Use external profile if provided, otherwise use user's own profile
  const profile = externalProfile || userProfile;

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-b-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">Loading profile preview...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No profile data available for preview.
        </AlertDescription>
      </Alert>
    );
  }

  // Check if profile is public
  const isPublic = profile.publicProfile?.isPublic || false;

  // Get device-specific styling
  const getDeviceClasses = () => {
    switch (deviceView) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      default:
        return 'max-w-4xl mx-auto';
    }
  };

  const getDeviceScale = () => {
    switch (deviceView) {
      case 'mobile':
        return 'scale-75';
      case 'tablet':
        return 'scale-90';
      default:
        return 'scale-100';
    }
  };

  // Mock profile data for demonstration
  const mockStats = {
    profileViews: 1247,
    projectsCompleted: 23,
    clientsServed: 18,
    responseTime: '2 hours',
    rating: 4.9,
    reviewCount: 47
  };

  const renderFreelancerProfile = () => (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24 border-4 border-white">
            <AvatarImage src={profile.avatar} alt={profile.firstName} />
            <AvatarFallback className="text-lg bg-white text-gray-800">
              {profile.firstName?.[0]}{profile.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                {profile.firstName} {profile.lastName}
              </h1>
              {profile.isVerified && (
                <CheckCircle className="h-6 w-6 text-blue-200" />
              )}
            </div>
            
            <p className="text-lg opacity-90 mb-3">
              {profile.professionalSummary || 'Professional Summary'}
            </p>
            
            <div className="flex items-center gap-4 text-sm opacity-80">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Available
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400" />
                {mockStats.rating} ({mockStats.reviewCount} reviews)
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold">
              ${profile.pricing?.hourlyRate || 75}/hr
            </div>
            <div className="text-sm opacity-80">
              Responds in {mockStats.responseTime}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{mockStats.projectsCompleted}</div>
            <div className="text-sm text-muted-foreground">Projects</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">{mockStats.clientsServed}</div>
            <div className="text-sm text-muted-foreground">Clients</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-purple-600">{mockStats.profileViews}</div>
            <div className="text-sm text-muted-foreground">Views</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-orange-600">98%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="col-span-2 space-y-6">
          
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {profile.bio || 'Experienced developer with a passion for creating innovative solutions...'}
              </p>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Primary Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {['React', 'Node.js', 'TypeScript', 'PostgreSQL'].map((skill) => (
                      <Badge key={skill} variant="default">{skill}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Secondary Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Python', 'AWS', 'Docker', 'GraphQL'].map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {[1, 2].map((project) => (
                  <div key={project} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">E-commerce Platform</h4>
                      <Badge variant="outline">Featured</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Built a full-stack e-commerce solution with React and Node.js...
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {['React', 'Node.js', 'PostgreSQL'].map((tech) => (
                          <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
                        ))}
                      </div>
                      <Button size="sm" variant="outline">
                        View Project
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button variant="outline" className="w-full">
                <Heart className="h-4 w-4 mr-2" />
                Save Profile
              </Button>
              <Button variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share Profile
              </Button>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Available for new projects</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>Response time: {mockStats.responseTime}</div>
                  <div>Timezone: {profile.timezone || 'UTC-8'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader>
              <CardTitle>Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">English</span>
                  <Badge variant="outline">Native</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Spanish</span>
                  <Badge variant="outline">Fluent</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification */}
          <Card>
            <CardHeader>
              <CardTitle>Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Identity Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Skills Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Payment Verified</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderVendorProfile = () => (
    <div className="space-y-6">
      {/* Company Hero */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-8 rounded-lg">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24 border-4 border-white rounded-lg">
            <AvatarImage src={profile.branding?.logo} alt="Company logo" />
            <AvatarFallback className="text-lg bg-white text-gray-800 rounded-lg">
              {profile.company?.brandName?.slice(0, 2).toUpperCase() || 'CO'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                {profile.company?.brandName || 'Company Name'}
              </h1>
              <Badge variant="secondary" className="bg-white/20">
                Verified Vendor
              </Badge>
            </div>
            
            <p className="text-lg opacity-90 mb-3">
              {profile.company?.description || 'Professional software development services'}
            </p>
            
            <div className="flex items-center gap-4 text-sm opacity-80">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {profile.company?.employeeCount || 25} employees
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Since {profile.company?.foundedYear || 2020}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {profile.company?.headquarters?.city || 'San Francisco'}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm opacity-80 mb-1">Starting from</div>
            <div className="text-2xl font-bold">
              ${profile.business?.minimumEngagement?.budget?.toLocaleString() || '10,000'}
            </div>
            <div className="text-sm opacity-80">
              {profile.business?.minimumEngagement?.duration || '3 months'} minimum
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Our Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Web Development', 'Mobile Apps', 'Cloud Solutions', 'DevOps'].map((service) => (
                <div key={service} className="flex items-center justify-between p-2 border rounded">
                  <span>{service}</span>
                  <Badge variant="outline">Starting $5K</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technologies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'Python'].map((tech) => (
                <Badge key={tech} variant="secondary">{tech}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Case Studies */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Case Studies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {[1, 2].map((study) => (
              <div key={study} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">Enterprise E-commerce Platform</h4>
                    <p className="text-sm text-muted-foreground">Fortune 500 Client</p>
                  </div>
                  <Badge variant="outline">$50K</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Delivered a scalable e-commerce solution handling 1M+ transactions...
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">6 months • Team of 8</div>
                  <Button size="sm" variant="outline">View Case Study</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOrganizationProfile = () => (
    <div className="space-y-6">
      {/* Organization Hero */}
      <div className="relative bg-gradient-to-r from-green-600 to-teal-600 text-white p-8 rounded-lg">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24 border-4 border-white rounded-lg">
            <AvatarImage src={profile.branding?.logo} alt="Organization logo" />
            <AvatarFallback className="text-lg bg-white text-gray-800 rounded-lg">
              {profile.organization?.displayName?.slice(0, 2).toUpperCase() || 'OR'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                {profile.organization?.displayName || 'Organization Name'}
              </h1>
              <Badge variant="secondary" className="bg-white/20">
                {profile.organization?.type || 'Enterprise'}
              </Badge>
            </div>
            
            <p className="text-lg opacity-90 mb-3">
              {profile.organization?.description || 'Leading organization seeking development partners'}
            </p>
            
            <div className="flex items-center gap-4 text-sm opacity-80">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {profile.organization?.size || 'Large Enterprise'}
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {profile.organization?.industry?.[0] || 'Technology'}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {profile.organization?.headquarters?.city || 'New York'}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm opacity-80 mb-1">Project Budgets</div>
            <div className="text-2xl font-bold">
              ${profile.requirements?.budgetRange?.min?.toLocaleString() || '10K'} - ${profile.requirements?.budgetRange?.max?.toLocaleString() || '100K'}
            </div>
            <div className="text-sm opacity-80">
              Typical timeline: {profile.requirements?.timeline?.typical || '3-6 months'}
            </div>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Types We Need</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {['Web Development', 'Mobile Apps', 'Data Science', 'Cloud Migration'].map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{type}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferred Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Size:</span> Medium to Large Agencies
              </div>
              <div className="text-sm">
                <span className="font-medium">Experience:</span> 5+ years
              </div>
              <div className="text-sm">
                <span className="font-medium">Location:</span> North America, Europe
              </div>
              <div className="text-sm">
                <span className="font-medium">Compliance:</span> SOX, GDPR
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Partnership Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Current Openings</h4>
              <div className="space-y-2">
                <div className="p-2 border rounded">
                  <div className="font-medium text-sm">Mobile App Development</div>
                  <div className="text-xs text-muted-foreground">Budget: $50K - $100K</div>
                </div>
                <div className="p-2 border rounded">
                  <div className="font-medium text-sm">DevOps Consulting</div>
                  <div className="text-xs text-muted-foreground">Budget: $25K - $50K</div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  {profile.contact?.primaryEmail || 'contact@company.com'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" />
                  {profile.contact?.phone || '+1 (555) 123-4567'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProfileContent = () => {
    switch (profile.userType) {
      case 'vendor':
        return renderVendorProfile();
      case 'customer':
        return renderOrganizationProfile();
      default:
        return renderFreelancerProfile();
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Preview Controls */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="font-medium">Profile Preview</span>
          </div>
          
          {!isPublic && (
            <Alert className="py-2 px-3">
              <EyeOff className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Profile is currently private
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Device View Selector */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={deviceView === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDeviceView('desktop')}
              className="rounded-r-none"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={deviceView === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDeviceView('tablet')}
              className="rounded-none border-x"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={deviceView === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDeviceView('mobile')}
              className="rounded-l-none"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm">
            <Refresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="border rounded-lg overflow-hidden">
        <div className={`transform transition-transform ${getDeviceScale()}`}>
          <div className={`bg-white min-h-screen transition-all duration-300 ${getDeviceClasses()}`}>
            <div className="p-6">
              {renderProfileContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Info */}
      <div className="text-center text-sm text-muted-foreground">
        Preview shows how your profile appears to visitors • 
        Last updated: {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}

export default ProfilePreview;