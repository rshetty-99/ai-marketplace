'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Plus, 
  Grid3X3, 
  List,
  MapPin,
  DollarSign,
  Clock,
  Star
} from 'lucide-react';
import { ProjectCard } from '@/components/projects/project-card';
import { useAuth } from '@/hooks/useAuth';
import { searchProjects, Project, ProjectFilters, toggleProjectSave } from '@/lib/firebase/projects';
import { toast } from 'sonner';
import Link from 'next/link';
import { DocumentSnapshot } from 'firebase/firestore';

const categories = [
  'Web Development',
  'Mobile Development', 
  'AI & Machine Learning',
  'Design & Creative',
  'Data & Analytics',
  'DevOps & Infrastructure',
  'Blockchain',
  'Game Development'
];

const experienceLevels = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'intermediate', label: 'Intermediate (3-5 years)' },
  { value: 'expert', label: 'Expert (5+ years)' }
];

const locationTypes = [
  { value: 'remote', label: 'Remote' },
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' }
];

const budgetRanges = [
  { min: 0, max: 1000, label: 'Under $1,000' },
  { min: 1000, max: 5000, label: '$1,000 - $5,000' },
  { min: 5000, max: 10000, label: '$5,000 - $10,000' },
  { min: 10000, max: 25000, label: '$10,000 - $25,000' },
  { min: 25000, max: 50000, label: '$25,000 - $50,000' },
  { min: 50000, max: Infinity, label: '$50,000+' }
];

export default function ProjectsPage() {
  const { user, userType } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>();
  const [savedProjects, setSavedProjects] = useState<string[]>([]);
  
  // Filter states
  const [filters, setFilters] = useState<ProjectFilters>({
    status: 'published'
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedBudgetRange, setSelectedBudgetRange] = useState<{min: number, max: number} | null>(null);
  const [budgetType, setBudgetType] = useState<'fixed' | 'hourly' | ''>('');

  useEffect(() => {
    loadProjects();
  }, [filters]);

  const loadProjects = async (loadMore = false) => {
    try {
      setLoading(true);
      const result = await searchProjects(
        filters,
        20,
        loadMore ? lastDoc : undefined
      );
      
      if (loadMore) {
        setProjects(prev => [...prev, ...result.projects]);
      } else {
        setProjects(result.projects);
      }
      
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const newFilters: ProjectFilters = {
      ...filters,
      searchTerm: searchTerm || undefined,
      category: selectedCategories.length > 0 ? selectedCategories[0] : undefined,
      experience: selectedExperience || undefined,
      location: selectedLocation || undefined,
      budgetType: budgetType || undefined,
      budgetMin: selectedBudgetRange?.min,
      budgetMax: selectedBudgetRange?.max === Infinity ? undefined : selectedBudgetRange?.max
    };
    
    setFilters(newFilters);
    setLastDoc(undefined);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedExperience('');
    setSelectedLocation('');
    setSelectedBudgetRange(null);
    setBudgetType('');
    setFilters({ status: 'published' });
    setLastDoc(undefined);
  };

  const handleSaveProject = async (project: Project) => {
    if (!user) {
      toast.error('Please log in to save projects');
      return;
    }

    try {
      await toggleProjectSave(project.id!, user.id);
      const isSaved = savedProjects.includes(project.id!);
      
      if (isSaved) {
        setSavedProjects(prev => prev.filter(id => id !== project.id));
        toast.success('Project removed from saved');
      } else {
        setSavedProjects(prev => [...prev, project.id!]);
        toast.success('Project saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save project');
    }
  };

  const handleApplyToProject = (project: Project) => {
    // TODO: Implement apply functionality
    toast.info('Apply functionality coming soon');
  };

  const handleViewProject = (project: Project) => {
    // TODO: Navigate to project detail page
    toast.info('Project details page coming soon');
  };

  const handleMessageCustomer = (project: Project) => {
    // TODO: Implement messaging functionality
    toast.info('Messaging functionality coming soon');
  };

  const activeFiltersCount = [
    searchTerm,
    selectedCategories.length > 0,
    selectedExperience,
    selectedLocation,
    selectedBudgetRange,
    budgetType
  ].filter(Boolean).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Browse Projects</h1>
          <p className="text-muted-foreground">
            Discover opportunities that match your skills and interests
          </p>
        </div>
        {userType === 'customer' && (
          <Link href="/projects/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Post Project
            </Button>
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search projects by title, description, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full"
                />
              </div>
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Category Filter */}
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={selectedCategories[0] || ''}
                      onValueChange={(value) => setSelectedCategories(value ? [value] : [])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Experience Filter */}
                  <div className="space-y-2">
                    <Label>Experience Level</Label>
                    <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                      <SelectTrigger>
                        <SelectValue placeholder="All levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All levels</SelectItem>
                        {experienceLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Filter */}
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="All locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All locations</SelectItem>
                        {locationTypes.map((location) => (
                          <SelectItem key={location.value} value={location.value}>
                            {location.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Budget Type Filter */}
                  <div className="space-y-2">
                    <Label>Budget Type</Label>
                    <Select value={budgetType} onValueChange={setBudgetType}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All types</SelectItem>
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                        <SelectItem value="hourly">Hourly Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Budget Range Filter */}
                <div className="space-y-2">
                  <Label>Budget Range</Label>
                  <div className="flex flex-wrap gap-2">
                    {budgetRanges.map((range) => (
                      <Badge
                        key={range.label}
                        variant={selectedBudgetRange?.min === range.min ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => 
                          setSelectedBudgetRange(
                            selectedBudgetRange?.min === range.min ? null : range
                          )
                        }
                      >
                        {range.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSearch}>Apply Filters</Button>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {projects.length} projects found
          </span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">
              {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} applied
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {loading && projects.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <Card>
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No projects found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or filters to find projects.
                </p>
              </div>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        )}>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              variant={viewMode === 'grid' ? 'default' : 'detailed'}
              isSaved={savedProjects.includes(project.id!)}
              currentUserId={user?.id}
              onView={handleViewProject}
              onApply={handleApplyToProject}
              onSave={handleSaveProject}
              onMessage={handleMessageCustomer}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && projects.length > 0 && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => loadProjects(true)}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Projects'}
          </Button>
        </div>
      )}
    </div>
  );
}