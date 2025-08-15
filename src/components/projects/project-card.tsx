'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  Eye, 
  Clock, 
  DollarSign, 
  MapPin, 
  Star, 
  Briefcase,
  MessageSquare,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Project } from '@/lib/firebase/projects';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  onView?: (project: Project) => void;
  onApply?: (project: Project) => void;
  onSave?: (project: Project) => void;
  onMessage?: (project: Project) => void;
  isSaved?: boolean;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  currentUserId?: string;
}

export function ProjectCard({ 
  project, 
  onView, 
  onApply, 
  onSave, 
  onMessage,
  isSaved = false,
  showActions = true,
  variant = 'default',
  currentUserId
}: ProjectCardProps) {
  const [isLocalSaved, setIsLocalSaved] = useState(isSaved);
  const [isLoading, setIsLoading] = useState(false);

  const isOwner = currentUserId === project.customer.id;
  const isAssigned = currentUserId === project.assignee?.id;

  const handleSave = async () => {
    if (onSave) {
      setIsLoading(true);
      try {
        await onSave(project);
        setIsLocalSaved(!isLocalSaved);
      } catch (error) {
        console.error('Error saving project:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExperienceColor = (level: Project['experience']) => {
    switch (level) {
      case 'entry':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'expert':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatBudget = () => {
    const { type, amount, currency } = project.budget;
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    
    if (type === 'hourly') {
      return `${symbol}${amount.toLocaleString()}/hr`;
    }
    return `${symbol}${amount.toLocaleString()}`;
  };

  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (variant === 'compact') {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView?.(project)}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg leading-tight">{project.title}</h3>
            <Badge className={cn('text-xs', getStatusColor(project.status))}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {project.description}
          </p>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {formatBudget()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {project.timeline.duration} {project.timeline.unit}
              </span>
            </div>
            {showActions && !isOwner && (
              <Button size="sm" variant="outline" onClick={(e) => {
                e.stopPropagation();
                onApply?.(project);
              }}>
                Apply
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "hover:shadow-lg transition-all duration-200",
      variant === 'detailed' && "lg:flex lg:flex-row"
    )}>
      <CardHeader className={cn(
        "pb-3",
        variant === 'detailed' && "lg:flex-1"
      )}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <CardTitle className="text-xl leading-tight mb-2 hover:text-primary cursor-pointer" 
                      onClick={() => onView?.(project)}>
              {project.title}
            </CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn('text-xs', getStatusColor(project.status))}>
                {project.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className={cn('text-xs', getExperienceColor(project.experience))}>
                {project.experience} level
              </Badge>
              {project.visibility !== 'public' && (
                <Badge variant="secondary" className="text-xs">
                  {project.visibility.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </div>
          
          {showActions && !isOwner && (
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
          )}
        </div>

        <CardDescription className="text-sm leading-relaxed line-clamp-3">
          {project.description}
        </CardDescription>

        {/* Customer Info */}
        <div className="flex items-center gap-2 mt-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={project.customer.avatar} />
            <AvatarFallback>{project.customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{project.customer.name}</p>
            {project.customer.company && (
              <p className="text-xs text-muted-foreground">{project.customer.company}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn(
        "pt-0",
        variant === 'detailed' && "lg:w-80 lg:pt-6"
      )}>
        {/* Skills */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {project.skills.slice(0, 6).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {project.skills.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{project.skills.length - 6} more
              </Badge>
            )}
          </div>
        </div>

        {/* Project Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              Budget:
            </span>
            <span className="font-semibold">{formatBudget()}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              Timeline:
            </span>
            <span>{project.timeline.duration} {project.timeline.unit}</span>
          </div>

          {project.timeline.deadline && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Deadline:
              </span>
              <span>{new Date(project.timeline.deadline).toLocaleDateString()}</span>
            </div>
          )}

          {project.location && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                Location:
              </span>
              <span className="capitalize">{project.location.type}</span>
            </div>
          )}

          {project.assignee && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-4 h-4" />
                Assigned to:
              </span>
              <div className="flex items-center gap-1">
                <Avatar className="w-4 h-4">
                  <AvatarImage src={project.assignee.avatar} />
                  <AvatarFallback className="text-xs">
                    {project.assignee.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">{project.assignee.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Project Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {project.views || 0}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="w-3 h-3" />
            {project.proposals || 0} proposals
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {project.savedBy?.length || 0}
          </span>
        </div>

        {/* Posted Time */}
        <p className="text-xs text-muted-foreground mb-4">
          Posted {formatTimeAgo(project.createdAt)}
        </p>

        {/* Actions */}
        {showActions && (
          <div className="space-y-2">
            {isOwner ? (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onView?.(project)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                {project.status === 'published' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onMessage?.(project)}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Messages
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onView?.(project)}
                    >
                      <Briefcase className="w-4 h-4 mr-1" />
                      Proposals
                    </Button>
                  </div>
                )}
              </div>
            ) : isAssigned ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  You're assigned to this project
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => onView?.(project)}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Go to Project
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {project.status === 'published' ? (
                  <>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => onApply?.(project)}
                    >
                      <Briefcase className="w-4 h-4 mr-2" />
                      Apply Now
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onView?.(project)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onMessage?.(project)}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-yellow-600">
                      <AlertCircle className="w-4 h-4" />
                      Project not available for applications
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => onView?.(project)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}