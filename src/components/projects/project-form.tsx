'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Plus, X, Upload, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { createProject, updateProject, Project } from '@/lib/firebase/projects';
import { toast } from 'sonner';

const projectSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(2000, 'Description must be less than 2000 characters'),
  category: z.string().min(1, 'Please select a category'),
  subcategory: z.string().min(1, 'Please select a subcategory'),
  budgetType: z.enum(['fixed', 'hourly']),
  budgetAmount: z.number().min(1, 'Budget must be greater than 0'),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  timelineDuration: z.number().min(1, 'Duration must be at least 1'),
  timelineUnit: z.enum(['days', 'weeks', 'months']),
  deadline: z.date().optional(),
  experience: z.enum(['entry', 'intermediate', 'expert']),
  skills: z.array(z.string()).min(1, 'Please add at least one skill'),
  requirements: z.array(z.string()).min(1, 'Please add at least one requirement'),
  deliverables: z.array(z.string()).min(1, 'Please add at least one deliverable'),
  visibility: z.enum(['public', 'invite_only', 'private']),
  locationType: z.enum(['remote', 'onsite', 'hybrid']),
  country: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().optional()
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: Project;
  onSubmit: (project: Project) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const categories = {
  'Web Development': ['Frontend', 'Backend', 'Full Stack', 'E-commerce', 'CMS'],
  'Mobile Development': ['iOS', 'Android', 'React Native', 'Flutter', 'Hybrid'],
  'AI & Machine Learning': ['Natural Language Processing', 'Computer Vision', 'Data Science', 'Deep Learning', 'Chatbots'],
  'Design & Creative': ['UI/UX Design', 'Graphic Design', 'Logo Design', 'Branding', 'Video Editing'],
  'Data & Analytics': ['Data Analysis', 'Business Intelligence', 'Data Visualization', 'Database Design', 'ETL'],
  'DevOps & Infrastructure': ['Cloud Services', 'CI/CD', 'Docker', 'Kubernetes', 'Monitoring'],
  'Blockchain': ['Smart Contracts', 'DeFi', 'NFT', 'Web3', 'Cryptocurrency'],
  'Game Development': ['Unity', 'Unreal Engine', '2D Games', '3D Games', 'Mobile Games']
};

const skillSuggestions = [
  'React', 'Node.js', 'Python', 'TypeScript', 'Java', 'C++', 'PHP', 'Ruby',
  'Machine Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas',
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
  'Figma', 'Adobe Creative Suite', 'Sketch', 'InVision',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch'
];

export function ProjectForm({ project, onSubmit, onCancel, isEditing = false }: ProjectFormProps) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [skillInput, setSkillInput] = useState('');
  const [requirementInput, setRequirementInput] = useState('');
  const [deliverableInput, setDeliverableInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      currency: 'USD',
      budgetType: 'fixed',
      timelineUnit: 'weeks',
      experience: 'intermediate',
      visibility: 'public',
      locationType: 'remote'
    }
  });

  const watchedCategory = watch('category');
  const watchedDeadline = watch('deadline');

  useEffect(() => {
    if (project && isEditing) {
      reset({
        title: project.title,
        description: project.description,
        category: project.category,
        subcategory: project.subcategory,
        budgetType: project.budget.type,
        budgetAmount: project.budget.amount,
        currency: project.budget.currency,
        timelineDuration: project.timeline.duration,
        timelineUnit: project.timeline.unit,
        deadline: project.timeline.deadline,
        experience: project.experience,
        visibility: project.visibility,
        locationType: project.location?.type || 'remote',
        country: project.location?.country,
        city: project.location?.city,
        timezone: project.location?.timezone
      });
      setSelectedCategory(project.category);
      setSkills(project.skills);
      setRequirements(project.requirements);
      setDeliverables(project.deliverables);
    }
  }, [project, isEditing, reset]);

  useEffect(() => {
    setSelectedCategory(watchedCategory);
  }, [watchedCategory]);

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      const newSkills = [...skills, skillInput.trim()];
      setSkills(newSkills);
      setValue('skills', newSkills);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const newSkills = skills.filter(skill => skill !== skillToRemove);
    setSkills(newSkills);
    setValue('skills', newSkills);
  };

  const addRequirement = () => {
    if (requirementInput.trim()) {
      const newRequirements = [...requirements, requirementInput.trim()];
      setRequirements(newRequirements);
      setValue('requirements', newRequirements);
      setRequirementInput('');
    }
  };

  const removeRequirement = (index: number) => {
    const newRequirements = requirements.filter((_, i) => i !== index);
    setRequirements(newRequirements);
    setValue('requirements', newRequirements);
  };

  const addDeliverable = () => {
    if (deliverableInput.trim()) {
      const newDeliverables = [...deliverables, deliverableInput.trim()];
      setDeliverables(newDeliverables);
      setValue('deliverables', newDeliverables);
      setDeliverableInput('');
    }
  };

  const removeDeliverable = (index: number) => {
    const newDeliverables = deliverables.filter((_, i) => i !== index);
    setDeliverables(newDeliverables);
    setValue('deliverables', newDeliverables);
  };

  const onFormSubmit = async (data: ProjectFormData) => {
    if (!user) {
      toast.error('You must be logged in to create a project');
      return;
    }

    setIsLoading(true);
    try {
      const projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
        title: data.title,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        budget: {
          type: data.budgetType,
          amount: data.budgetAmount,
          currency: data.currency
        },
        timeline: {
          duration: data.timelineDuration,
          unit: data.timelineUnit,
          deadline: data.deadline
        },
        skills: data.skills,
        experience: data.experience,
        requirements: data.requirements,
        deliverables: data.deliverables,
        status: 'draft',
        visibility: data.visibility,
        customer: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          company: user.publicMetadata?.company as string,
          avatar: user.imageUrl
        },
        proposals: 0,
        views: 0,
        savedBy: [],
        tags: [data.category, data.subcategory, ...data.skills.slice(0, 3)],
        location: {
          type: data.locationType,
          country: data.country,
          city: data.city,
          timezone: data.timezone
        }
      };

      if (isEditing && project?.id) {
        await updateProject(project.id, projectData);
        toast.success('Project updated successfully');
        onSubmit({ ...projectData, id: project.id, createdAt: project.createdAt, updatedAt: new Date() });
      } else {
        const projectId = await createProject(projectData);
        toast.success('Project created successfully');
        onSubmit({ ...projectData, id: projectId, createdAt: new Date(), updatedAt: new Date() });
      }
    } catch (error) {
      toast.error(isEditing ? 'Failed to update project' : 'Failed to create project');
      console.error('Project form error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Project' : 'Create New Project'}</CardTitle>
          <CardDescription>
            {isEditing ? 'Update your project details' : 'Fill out the details for your new project'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div>
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="e.g., Build an AI-powered customer support chatbot"
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Describe your project in detail, including goals, requirements, and expected outcomes..."
                  rows={6}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={(value) => setValue('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(categories).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Select 
                    onValueChange={(value) => setValue('subcategory', value)}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCategory && categories[selectedCategory as keyof typeof categories]?.map((subcategory) => (
                        <SelectItem key={subcategory} value={subcategory}>
                          {subcategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subcategory && (
                    <p className="text-sm text-red-500 mt-1">{errors.subcategory.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Budget & Timeline */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Budget & Timeline</h3>
              
              <div>
                <Label>Budget Type</Label>
                <RadioGroup
                  onValueChange={(value) => setValue('budgetType', value as 'fixed' | 'hourly')}
                  defaultValue="fixed"
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed">Fixed Price</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hourly" id="hourly" />
                    <Label htmlFor="hourly">Hourly Rate</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budgetAmount">
                    {watch('budgetType') === 'fixed' ? 'Total Budget' : 'Hourly Rate'}
                  </Label>
                  <Input
                    id="budgetAmount"
                    type="number"
                    {...register('budgetAmount', { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {errors.budgetAmount && (
                    <p className="text-sm text-red-500 mt-1">{errors.budgetAmount.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select onValueChange={(value) => setValue('currency', value as 'USD' | 'EUR' | 'GBP')}>
                    <SelectTrigger>
                      <SelectValue placeholder="USD" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timelineDuration">Project Duration</Label>
                  <Input
                    id="timelineDuration"
                    type="number"
                    {...register('timelineDuration', { valueAsNumber: true })}
                    placeholder="1"
                  />
                  {errors.timelineDuration && (
                    <p className="text-sm text-red-500 mt-1">{errors.timelineDuration.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="timelineUnit">Duration Unit</Label>
                  <Select onValueChange={(value) => setValue('timelineUnit', value as 'days' | 'weeks' | 'months')}>
                    <SelectTrigger>
                      <SelectValue placeholder="weeks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Deadline (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watchedDeadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watchedDeadline ? format(watchedDeadline, "PPP") : "Pick a deadline"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={watchedDeadline}
                      onSelect={(date) => setValue('deadline', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Skills & Experience */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Skills & Experience</h3>
              
              <div>
                <Label>Required Skills</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Add a skill (e.g., React, Python, Machine Learning)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={addSkill} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
                
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-2">Suggested skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {skillSuggestions
                      .filter(skill => !skills.includes(skill))
                      .slice(0, 10)
                      .map((skill) => (
                        <Button
                          key={skill}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newSkills = [...skills, skill];
                            setSkills(newSkills);
                            setValue('skills', newSkills);
                          }}
                        >
                          {skill}
                        </Button>
                      ))}
                  </div>
                </div>
                {errors.skills && (
                  <p className="text-sm text-red-500 mt-1">{errors.skills.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="experience">Experience Level Required</Label>
                <Select onValueChange={(value) => setValue('experience', value as 'entry' | 'intermediate' | 'expert')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (3-5 years)</SelectItem>
                    <SelectItem value="expert">Expert (5+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Requirements & Deliverables */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Requirements & Deliverables</h3>
              
              <div>
                <Label>Project Requirements</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={requirementInput}
                    onChange={(e) => setRequirementInput(e.target.value)}
                    placeholder="Add a requirement (e.g., Must be mobile responsive)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addRequirement();
                      }
                    }}
                  />
                  <Button type="button" onClick={addRequirement} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 mt-2">
                  {requirements.map((requirement, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <span className="flex-1">{requirement}</span>
                      <X 
                        className="w-4 h-4 cursor-pointer" 
                        onClick={() => removeRequirement(index)}
                      />
                    </div>
                  ))}
                </div>
                {errors.requirements && (
                  <p className="text-sm text-red-500 mt-1">{errors.requirements.message}</p>
                )}
              </div>

              <div>
                <Label>Deliverables</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={deliverableInput}
                    onChange={(e) => setDeliverableInput(e.target.value)}
                    placeholder="Add a deliverable (e.g., Source code with documentation)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addDeliverable();
                      }
                    }}
                  />
                  <Button type="button" onClick={addDeliverable} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 mt-2">
                  {deliverables.map((deliverable, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <span className="flex-1">{deliverable}</span>
                      <X 
                        className="w-4 h-4 cursor-pointer" 
                        onClick={() => removeDeliverable(index)}
                      />
                    </div>
                  ))}
                </div>
                {errors.deliverables && (
                  <p className="text-sm text-red-500 mt-1">{errors.deliverables.message}</p>
                )}
              </div>
            </div>

            {/* Project Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Project Settings</h3>
              
              <div>
                <Label htmlFor="visibility">Project Visibility</Label>
                <Select onValueChange={(value) => setValue('visibility', value as 'public' | 'invite_only' | 'private')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can see and apply</SelectItem>
                    <SelectItem value="invite_only">Invite Only - Only invited freelancers can apply</SelectItem>
                    <SelectItem value="private">Private - Only you can see this project</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="locationType">Work Location</Label>
                <Select onValueChange={(value) => setValue('locationType', value as 'remote' | 'onsite' | 'hybrid')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select work location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(watch('locationType') === 'onsite' || watch('locationType') === 'hybrid') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      {...register('country')}
                      placeholder="e.g., United States"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      placeholder="e.g., New York"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Saving...' : (isEditing ? 'Update Project' : 'Create Project')}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}