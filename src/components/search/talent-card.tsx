'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  MapPin, 
  DollarSign, 
  Clock, 
  Briefcase,
  MessageSquare,
  Heart,
  Eye,
  Globe,
  Award,
  Users,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { FreelancerProfile, VendorProfile } from '@/lib/firebase/search';
import { cn } from '@/lib/utils';

interface TalentCardProps {
  talent: FreelancerProfile | VendorProfile;
  type: 'freelancer' | 'vendor';
  onView?: (talent: FreelancerProfile | VendorProfile) => void;
  onMessage?: (talent: FreelancerProfile | VendorProfile) => void;
  onHire?: (talent: FreelancerProfile | VendorProfile) => void;
  onSave?: (talent: FreelancerProfile | VendorProfile) => void;
  isSaved?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export function TalentCard({ 
  talent, 
  type, 
  onView, 
  onMessage, 
  onHire, 
  onSave,
  isSaved = false,
  variant = 'default'
}: TalentCardProps) {
  const [isLocalSaved, setIsLocalSaved] = useState(isSaved);
  const [isLoading, setIsLoading] = useState(false);

  const isFreelancer = type === 'freelancer';
  const freelancer = isFreelancer ? talent as FreelancerProfile : null;
  const vendor = !isFreelancer ? talent as VendorProfile : null;

  const handleSave = async () => {
    if (onSave) {
      setIsLoading(true);
      try {
        await onSave(talent);
        setIsLocalSaved(!isLocalSaved);
      } catch (error) {
        console.error('Error saving talent:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRate = (rate: any) => {
    if (isFreelancer && freelancer?.hourlyRate) {
      const { min, max, currency } = freelancer.hourlyRate;
      const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
      return max > min ? `${symbol}${min}-${max}/hr` : `${symbol}${min}/hr`;
    }
    return 'Contact for pricing';
  };

  const getDisplayName = () => {
    if (isFreelancer && freelancer) {
      return `${freelancer.firstName} ${freelancer.lastName}`;
    }
    return vendor?.companyName || '';
  };

  const getDisplayTitle = () => {
    if (isFreelancer && freelancer) {
      return freelancer.title;
    }
    return vendor?.specializations?.[0] || 'Professional Services';
  };

  const getAvatar = () => {
    if (isFreelancer && freelancer) {
      return freelancer.avatar;
    }
    return vendor?.logo;
  };

  const getLocation = () => {
    const location = talent.location;
    return location.city ? `${location.city}, ${location.country}` : location.country;
  };

  const getSkills = () => {
    if (isFreelancer && freelancer) {
      return freelancer.skills;
    }
    return vendor?.specializations || [];
  };

  const getStats = () => {
    return talent.stats;
  };

  if (variant === 'compact') {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView?.(talent)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={getAvatar()} />
              <AvatarFallback>
                {getDisplayName().split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{getDisplayName()}</h3>
              <p className="text-sm text-muted-foreground truncate">{getDisplayTitle()}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs">{getStats().averageRating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {getStats().completedProjects} projects
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{formatRate(null)}</span>
            <Button size="sm" variant="outline" onClick={(e) => {
              e.stopPropagation();
              onHire?.(talent);
            }}>
              {isFreelancer ? 'Hire' : 'Contact'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="w-16 h-16">
              <AvatarImage src={getAvatar()} />
              <AvatarFallback className="text-lg">
                {getDisplayName().split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-tight cursor-pointer hover:text-primary" 
                        onClick={() => onView?.(talent)}>
                {getDisplayName()}
              </CardTitle>
              <CardDescription className="text-sm mb-2">
                {getDisplayTitle()}
              </CardDescription>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{getStats().averageRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({getStats().reviewCount} reviews)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {getLocation()}
                </span>
                {isFreelancer && freelancer?.availability && (
                  <Badge className={cn('text-xs', getAvailabilityColor(freelancer.availability))}>
                    {freelancer.availability}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
            className={cn(
              "ml-2",
              isLocalSaved && "text-red-500 hover:text-red-600"
            )}
          >
            <Heart className={cn("w-4 h-4", isLocalSaved && "fill-current")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Overview */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {isFreelancer ? freelancer?.overview : vendor?.description}
        </p>

        {/* Skills/Specializations */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {getSkills().slice(0, 6).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {getSkills().length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{getSkills().length - 6} more
              </Badge>
            )}
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Briefcase className="w-3 h-3" />
                Projects:
              </span>
              <span className="font-medium">{getStats().completedProjects}</span>
            </div>
            
            {isFreelancer ? (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Response:
                </span>
                <span className="font-medium">{freelancer?.stats.responseTime}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-3 h-3" />
                  Team:
                </span>
                <span className="font-medium">
                  {vendor?.teamSize.min === vendor?.teamSize.max 
                    ? vendor.teamSize.min 
                    : `${vendor?.teamSize.min}-${vendor?.teamSize.max}`}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="w-3 h-3" />
                {isFreelancer ? 'Earned:' : 'Revenue:'}
              </span>
              <span className="font-medium">
                ${(isFreelancer ? freelancer?.stats.totalEarnings : vendor?.stats.totalRevenue || 0).toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Award className="w-3 h-3" />
                {isFreelancer ? 'Repeat:' : 'Retention:'}
              </span>
              <span className="font-medium">
                {isFreelancer 
                  ? `${freelancer?.stats.repeatClients}%`
                  : `${vendor?.stats.clientRetention}%`
                }
              </span>
            </div>
          </div>
        </div>

        {/* Rate/Pricing */}
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-muted-foreground">
            {isFreelancer ? 'Hourly Rate:' : 'Starting From:'}
          </span>
          <span className="font-semibold text-lg">{formatRate(null)}</span>
        </div>

        {/* Portfolio Preview */}
        {talent.portfolio && talent.portfolio.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Recent Work</p>
            <div className="flex gap-2">
              {talent.portfolio.slice(0, 3).map((item) => (
                <div key={item.id} className="flex-1">
                  <div className="aspect-video bg-gray-100 rounded-md mb-1 overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs truncate">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {talent.certifications && talent.certifications.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-muted-foreground">
                {talent.certifications.length} certification{talent.certifications.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Button
            className="w-full"
            onClick={() => onHire?.(talent)}
          >
            {isFreelancer ? 'Hire Freelancer' : 'Contact Vendor'}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onView?.(talent)}
            >
              <Eye className="w-4 h-4 mr-1" />
              View Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onMessage?.(talent)}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}