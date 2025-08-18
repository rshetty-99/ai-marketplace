/**
 * Testimonial Display Component
 * Component for displaying and managing client testimonials
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { 
  Star, 
  MessageSquare, 
  Shield, 
  Calendar,
  Building,
  User,
  Eye,
  EyeOff,
  Award,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

import { ClientTestimonial } from '@/lib/firebase/enhanced-profile-schema';

interface TestimonialDisplayProps {
  testimonials: ClientTestimonial[];
  onToggleVisibility?: (testimonialId: string, isPublic: boolean) => Promise<void>;
  onToggleFeatured?: (testimonialId: string, isFeatured: boolean) => Promise<void>;
  onDelete?: (testimonialId: string) => Promise<void>;
  className?: string;
}

export function TestimonialDisplay({ 
  testimonials, 
  onToggleVisibility,
  onToggleFeatured,
  onDelete,
  className 
}: TestimonialDisplayProps) {
  const [selectedTestimonial, setSelectedTestimonial] = useState<ClientTestimonial | null>(null);
  const [isViewTestimonialOpen, setIsViewTestimonialOpen] = useState(false);

  // Sort testimonials - featured first, then by date
  const sortedTestimonials = [...testimonials].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime();
  });

  // Calculate average rating
  const averageRating = testimonials.length > 0 
    ? testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length 
    : 0;

  const verifiedCount = testimonials.filter(t => t.isVerified).length;
  const featuredCount = testimonials.filter(t => t.isFeatured).length;

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Testimonials Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{testimonials.length}</div>
              <p className="text-xs text-muted-foreground">Total Reviews</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                {averageRating.toFixed(1)}
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-xs text-muted-foreground">Average Rating</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                {verifiedCount}
                <Shield className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground">Verified</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                {featuredCount}
                <Award className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-xs text-muted-foreground">Featured</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Testimonials List */}
      <div className="space-y-4">
        {testimonials.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="mb-4">
              <MessageSquare className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <p className="text-lg font-medium mb-2">No testimonials yet</p>
            <p className="text-sm mb-4">Request testimonials from your satisfied clients</p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Request Testimonial
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTestimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                onView={() => {
                  setSelectedTestimonial(testimonial);
                  setIsViewTestimonialOpen(true);
                }}
                onToggleVisibility={onToggleVisibility}
                onToggleFeatured={onToggleFeatured}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Testimonial Button */}
      <div className="text-center">
        <Button variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Request New Testimonial
        </Button>
      </div>

      {/* Testimonial Detail View Dialog */}
      <Dialog open={isViewTestimonialOpen} onOpenChange={setIsViewTestimonialOpen}>
        <DialogContent className="max-w-2xl">
          {selectedTestimonial && (
            <TestimonialDetailView 
              testimonial={selectedTestimonial} 
              onClose={() => setIsViewTestimonialOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Individual Testimonial Card Component
function TestimonialCard({ 
  testimonial, 
  onView,
  onToggleVisibility,
  onToggleFeatured,
  onDelete
}: {
  testimonial: ClientTestimonial;
  onView: () => void;
  onToggleVisibility?: (testimonialId: string, isPublic: boolean) => Promise<void>;
  onToggleFeatured?: (testimonialId: string, isFeatured: boolean) => Promise<void>;
  onDelete?: (testimonialId: string) => Promise<void>;
}) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          
          {/* Header with client info and badges */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={testimonial.clientAvatar} alt={testimonial.clientName} />
                <AvatarFallback>
                  {testimonial.clientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="font-medium">{testimonial.clientName}</div>
                {testimonial.clientTitle && (
                  <div className="text-sm text-muted-foreground">{testimonial.clientTitle}</div>
                )}
                {testimonial.clientCompany && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {testimonial.clientCompany}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              {/* Rating */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < testimonial.rating 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              
              {/* Badges */}
              <div className="flex items-center gap-1">
                {testimonial.isVerified && (
                  <Badge variant="default" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {testimonial.isFeatured && (
                  <Badge variant="secondary" className="text-xs">
                    <Award className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {!testimonial.isPublic && (
                  <Badge variant="outline" className="text-xs">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Private
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Testimonial text */}
          <blockquote className="text-sm italic text-muted-foreground border-l-4 border-muted pl-4 line-clamp-3">
            "{testimonial.testimonial}"
          </blockquote>

          {/* Footer with date and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {testimonial.dateGiven.toLocaleDateString()}
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" onClick={onView}>
                <Eye className="h-4 w-4" />
              </Button>
              
              {onToggleVisibility && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onToggleVisibility(testimonial.id, !testimonial.isPublic)}
                  title={testimonial.isPublic ? 'Make private' : 'Make public'}
                >
                  {testimonial.isPublic ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              {onToggleFeatured && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onToggleFeatured(testimonial.id, !testimonial.isFeatured)}
                  title={testimonial.isFeatured ? 'Remove from featured' : 'Add to featured'}
                >
                  <Award className={`h-4 w-4 ${testimonial.isFeatured ? 'text-purple-500' : ''}`} />
                </Button>
              )}
              
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
              
              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onDelete(testimonial.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Testimonial Detail View Component
function TestimonialDetailView({ 
  testimonial, 
  onClose 
}: {
  testimonial: ClientTestimonial;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Client Testimonial</DialogTitle>
        <DialogDescription>
          Detailed view of testimonial from {testimonial.clientName}
        </DialogDescription>
      </DialogHeader>

      {/* Client Information */}
      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
        <Avatar className="h-16 w-16">
          <AvatarImage src={testimonial.clientAvatar} alt={testimonial.clientName} />
          <AvatarFallback className="text-lg">
            {testimonial.clientName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h4 className="font-semibold text-lg">{testimonial.clientName}</h4>
          {testimonial.clientTitle && (
            <p className="text-muted-foreground">{testimonial.clientTitle}</p>
          )}
          {testimonial.clientCompany && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Building className="h-4 w-4" />
              {testimonial.clientCompany}
            </p>
          )}
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < testimonial.rating 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {testimonial.rating}/5 stars
          </p>
        </div>
      </div>

      {/* Testimonial Content */}
      <div className="space-y-4">
        <h4 className="font-medium">Testimonial</h4>
        <blockquote className="text-lg italic border-l-4 border-primary pl-6">
          "{testimonial.testimonial}"
        </blockquote>
      </div>

      {/* Testimonial Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h5 className="font-medium text-sm">Testimonial Details</h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date Received:</span>
              <span>{testimonial.dateGiven.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span>{testimonial.isPublic ? 'Public' : 'Private'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Verified:</span>
              <span className="flex items-center gap-1">
                {testimonial.isVerified ? (
                  <>
                    <Shield className="h-3 w-3 text-green-500" />
                    Yes
                  </>
                ) : (
                  'No'
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Featured:</span>
              <span className="flex items-center gap-1">
                {testimonial.isFeatured ? (
                  <>
                    <Award className="h-3 w-3 text-purple-500" />
                    Yes
                  </>
                ) : (
                  'No'
                )}
              </span>
            </div>
          </div>
        </div>

        {testimonial.projectId && (
          <div className="space-y-2">
            <h5 className="font-medium text-sm">Related Project</h5>
            <div className="text-sm">
              <p className="text-muted-foreground">
                This testimonial is linked to a specific project in your portfolio.
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                View Project
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" className="flex-1">
          <Edit className="h-4 w-4 mr-2" />
          Edit Testimonial
        </Button>
        <Button variant="outline" className="flex-1">
          {testimonial.isPublic ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Make Private
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Make Public
            </>
          )}
        </Button>
        <Button variant="outline" className="flex-1">
          {testimonial.isFeatured ? (
            <>
              Remove Featured
            </>
          ) : (
            <>
              <Award className="h-4 w-4 mr-2" />
              Feature
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default TestimonialDisplay;