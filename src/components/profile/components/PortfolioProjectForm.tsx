/**
 * Portfolio Project Form Component
 * Form for adding and managing portfolio projects
 */

'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

import { 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Upload,
  ExternalLink,
  Github,
  Calendar,
  Users,
  Star,
  Award,
  Image as ImageIcon,
  Play
} from 'lucide-react';

import { PortfolioProject, ProjectImage, ProjectMetric } from '@/lib/firebase/enhanced-profile-schema';
import { useFileUpload } from '@/hooks/useFileUpload';
import { FileType } from '@/lib/firebase/storage-architecture';

// Form validation schema
const portfolioProjectSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  technologies: z.array(z.string()).min(1, 'At least one technology is required'),
  role: z.string().min(1, 'Your role is required'),
  duration: z.string().min(1, 'Duration is required'),
  teamSize: z.number().min(1).optional(),
  clientName: z.string().optional(),
  projectUrl: z.string().url().optional().or(z.literal('')),
  repositoryUrl: z.string().url().optional().or(z.literal('')),
  challenges: z.string().min(10, 'Challenges description is required'),
  solution: z.string().min(10, 'Solution description is required'),
  results: z.array(z.string()).min(1, 'At least one result is required'),
  isFeatureProject: z.boolean(),
});

type PortfolioProjectFormData = z.infer<typeof portfolioProjectSchema>;

interface PortfolioProjectFormProps {
  projects: PortfolioProject[];
  onAddProject: (project: Partial<PortfolioProject>) => Promise<void>;
  className?: string;
}

// Project categories
const PROJECT_CATEGORIES = [
  'Web Application',
  'Mobile App',
  'E-commerce',
  'SaaS Platform',
  'API Development',
  'Data Science',
  'Machine Learning',
  'Blockchain',
  'Desktop Application',
  'Game Development',
  'DevOps/Infrastructure',
  'Design System',
  'Other'
];

// Common technologies
const COMMON_TECHNOLOGIES = [
  'React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js',
  'Node.js', 'Express.js', 'Django', 'Flask', 'Laravel', 'Spring Boot',
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'PHP', 'Go', 'Rust',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Firebase',
  'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes',
  'React Native', 'Flutter', 'iOS', 'Android',
  'TensorFlow', 'PyTorch', 'Scikit-learn'
];

export function PortfolioProjectForm({ projects, onAddProject, className }: PortfolioProjectFormProps) {
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);
  const [isViewProjectOpen, setIsViewProjectOpen] = useState(false);
  const { uploadFile } = useFileUpload();

  // Initialize form
  const form = useForm<PortfolioProjectFormData>({
    resolver: zodResolver(portfolioProjectSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      technologies: [],
      role: '',
      duration: '',
      teamSize: 1,
      clientName: '',
      projectUrl: '',
      repositoryUrl: '',
      challenges: '',
      solution: '',
      results: [],
      isFeatureProject: false
    }
  });

  // Field arrays for dynamic form fields
  const { fields: technologyFields, append: addTechnology, remove: removeTechnology } = 
    useFieldArray({ control: form.control, name: 'technologies' });
  
  const { fields: resultFields, append: addResult, remove: removeResult } = 
    useFieldArray({ control: form.control, name: 'results' });

  // Handle form submission
  const onSubmit = async (data: PortfolioProjectFormData) => {
    try {
      const projectData: Partial<PortfolioProject> = {
        ...data,
        id: `project_${Date.now()}`,
        images: [], // Will be added later via image upload
        metrics: [],
        displayOrder: projects.length,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await onAddProject(projectData);
      
      // Reset form and close dialog
      form.reset();
      setIsAddProjectOpen(false);
    } catch (error) {
      console.error('Failed to add project:', error);
    }
  };

  // Handle project image upload
  const handleImageUpload = async (projectId: string, file: File) => {
    try {
      const metadata = await uploadFile(file, FileType.PORTFOLIO_IMAGE, {
        ownerId: projectId,
        ownerType: 'project',
        isPublic: true,
        description: 'Portfolio project image',
        tags: ['portfolio', 'project', projectId]
      });

      // Update project with new image
      // This would typically trigger a re-fetch or update
      console.log('Image uploaded:', metadata.downloadUrl);

    } catch (error) {
      console.error('Image upload failed:', error);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Existing Projects */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="mb-4">
              <Award className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <p className="text-lg font-medium mb-2">No portfolio projects yet</p>
            <p className="text-sm">Add your first project to showcase your work</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id}
                project={project}
                onView={() => {
                  setSelectedProject(project);
                  setIsViewProjectOpen(true);
                }}
                onEdit={() => {
                  // Handle edit functionality
                  console.log('Edit project:', project.id);
                }}
                onDelete={() => {
                  // Handle delete functionality
                  console.log('Delete project:', project.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Project Button */}
      <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Portfolio Project
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Portfolio Project</DialogTitle>
            <DialogDescription>
              Showcase your best work to attract potential clients
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-medium">Basic Information</h4>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter project name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what the project does and its main features..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a clear overview of the project ({field.value?.length || 0} characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PROJECT_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Role</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Full-Stack Developer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 3 months" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="teamSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Size (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="1"
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Technologies */}
              <div className="space-y-4">
                <h4 className="font-medium">Technologies Used</h4>
                
                <div className="space-y-2">
                  {form.watch('technologies').map((tech, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="secondary">{tech}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTechnology(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Add Technology</Label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {COMMON_TECHNOLOGIES
                      .filter(tech => !form.watch('technologies').includes(tech))
                      .slice(0, 15)
                      .map((tech) => (
                        <Button
                          key={tech}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => addTechnology(tech)}
                        >
                          {tech}
                        </Button>
                      ))}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Custom technology..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value && !form.watch('technologies').includes(value)) {
                            addTechnology(value);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Custom technology..."]') as HTMLInputElement;
                        if (input) {
                          const value = input.value.trim();
                          if (value && !form.watch('technologies').includes(value)) {
                            addTechnology(value);
                            input.value = '';
                          }
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Links */}
              <div className="space-y-4">
                <h4 className="font-medium">Project Links</h4>
                
                <FormField
                  control={form.control}
                  name="projectUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Live Project URL (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="repositoryUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repository URL (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://github.com/username/repo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Client or company name" {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave blank for personal projects or if confidential
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Project Details */}
              <div className="space-y-4">
                <h4 className="font-medium">Project Details</h4>
                
                <FormField
                  control={form.control}
                  name="challenges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Challenges</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What challenges did you face during this project?"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="solution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Solution</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="How did you solve these challenges?"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Results */}
                <div className="space-y-2">
                  <Label>Results & Outcomes</Label>
                  <div className="space-y-2">
                    {form.watch('results').map((result, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input value={result} readOnly />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeResult(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Add a result or outcome..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value) {
                            addResult(value);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Add a result or outcome..."]') as HTMLInputElement;
                        if (input) {
                          const value = input.value.trim();
                          if (value) {
                            addResult(value);
                            input.value = '';
                          }
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="isFeatureProject"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Featured Project</FormLabel>
                        <FormDescription>
                          Highlight this project on your profile
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddProjectOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Add Project
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Project View Dialog */}
      <Dialog open={isViewProjectOpen} onOpenChange={setIsViewProjectOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProject && (
            <ProjectDetailView 
              project={selectedProject} 
              onClose={() => setIsViewProjectOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Project Card Component
function ProjectCard({ 
  project, 
  onView, 
  onEdit, 
  onDelete 
}: {
  project: PortfolioProject;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{project.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{project.category}</Badge>
              {project.isFeatureProject && (
                <Badge variant="default">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>
        
        <div className="flex flex-wrap gap-1">
          {project.technologies.slice(0, 3).map((tech) => (
            <Badge key={tech} variant="outline" className="text-xs">
              {tech}
            </Badge>
          ))}
          {project.technologies.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{project.technologies.length - 3} more
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {project.duration}
          </div>
          {project.teamSize && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {project.teamSize} {project.teamSize === 1 ? 'person' : 'people'}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {project.projectUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Live Demo
              </a>
            </Button>
          )}
          {project.repositoryUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">
                <Github className="h-3 w-3 mr-1" />
                Code
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Project Detail View Component
function ProjectDetailView({ 
  project, 
  onClose 
}: {
  project: PortfolioProject;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-2xl">{project.title}</DialogTitle>
        <DialogDescription className="text-base">
          {project.description}
        </DialogDescription>
      </DialogHeader>

      {/* Project Images */}
      {project.images && project.images.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Project Images</h4>
          <Carousel className="w-full">
            <CarouselContent>
              {project.images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="relative aspect-video">
                    <img 
                      src={image.url} 
                      alt={image.caption || `Project image ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {image.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 rounded-b-lg">
                        <p className="text-sm">{image.caption}</p>
                      </div>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      )}

      {/* Project Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Technologies</h4>
            <div className="flex flex-wrap gap-1">
              {project.technologies.map((tech) => (
                <Badge key={tech} variant="secondary">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Project Info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role:</span>
                <span>{project.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span>{project.duration}</span>
              </div>
              {project.teamSize && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Size:</span>
                  <span>{project.teamSize}</span>
                </div>
              )}
              {project.clientName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client:</span>
                  <span>{project.clientName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Challenges</h4>
            <p className="text-sm text-muted-foreground">{project.challenges}</p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Solution</h4>
            <p className="text-sm text-muted-foreground">{project.solution}</p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Results</h4>
            <ul className="space-y-1">
              {project.results.map((result, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  {result}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Project Links */}
      <div className="flex gap-2">
        {project.projectUrl && (
          <Button asChild>
            <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Live Project
            </a>
          </Button>
        )}
        {project.repositoryUrl && (
          <Button variant="outline" asChild>
            <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4 mr-2" />
              View Code
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

export default PortfolioProjectForm;