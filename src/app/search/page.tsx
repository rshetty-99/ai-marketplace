'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Grid3X3, 
  List,
  Star,
  MapPin,
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  Award
} from 'lucide-react';
import { TalentCard } from '@/components/search/talent-card';
import { ProjectCard } from '@/components/projects/project-card';
import { useAuth } from '@/hooks/useAuth';
import { 
  searchTalent, 
  searchProjects,
  getPopularSkills,
  getTrendingCategories,
  FreelancerProfile, 
  VendorProfile, 
  TalentSearchFilters 
} from '@/lib/firebase/search';
import { Project, ProjectFilters } from '@/lib/firebase/projects';
import { toast } from 'sonner';
import { DocumentSnapshot } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const experienceLevels = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'intermediate', label: 'Intermediate (3-5 years)' },
  { value: 'expert', label: 'Expert (5+ years)' }
];

const availabilityOptions = [
  { value: 'available', label: 'Available Now' },
  { value: 'busy', label: 'Busy (Limited Availability)' },
  { value: 'unavailable', label: 'Not Available' }
];

const budgetRanges = [
  { min: 0, max: 25, label: 'Under $25/hr' },
  { min: 25, max: 50, label: '$25 - $50/hr' },
  { min: 50, max: 100, label: '$50 - $100/hr' },
  { min: 100, max: 200, label: '$100 - $200/hr' },
  { min: 200, max: Infinity, label: '$200+/hr' }
];

const countries = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 
  'Netherlands', 'Australia', 'India', 'Brazil', 'Mexico'
];

export default function SearchPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'talent' | 'projects' | 'services'>('talent');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Talent search state
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [talentLoading, setTalentLoading] = useState(false);
  const [talentHasMore, setTalentHasMore] = useState(true);
  const [talentLastDoc, setTalentLastDoc] = useState<DocumentSnapshot | undefined>();
  
  // Project search state
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsHasMore, setProjectsHasMore] = useState(true);
  const [projectsLastDoc, setProjectsLastDoc] = useState<DocumentSnapshot | undefined>();
  
  // Filter states
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string>('');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedBudgetRange, setSelectedBudgetRange] = useState<{min: number, max: number} | null>(null);
  const [minRating, setMinRating] = useState<number>(0);
  const [talentType, setTalentType] = useState<'all' | 'freelancer' | 'vendor'>('all');
  
  // Popular data
  const [popularSkills, setPopularSkills] = useState<{skill: string, count: number}[]>([]);
  const [trendingCategories, setTrendingCategories] = useState<{category: string, projectCount: number, growth: number}[]>([]);

  useEffect(() => {
    loadPopularData();
  }, []);

  useEffect(() => {
    if (activeTab === 'talent') {
      searchTalentData();
    } else if (activeTab === 'projects') {
      searchProjectsData();
    }
  }, [activeTab]);

  const loadPopularData = async () => {
    try {
      const [skills, categories] = await Promise.all([
        getPopularSkills(),
        getTrendingCategories()
      ]);
      setPopularSkills(skills);
      setTrendingCategories(categories);
    } catch (error) {
      console.error('Error loading popular data:', error);
    }
  };

  const searchTalentData = async (loadMore = false) => {
    try {
      setTalentLoading(true);
      
      const filters: TalentSearchFilters = {
        searchTerm: searchTerm || undefined,
        skills: selectedSkills.length > 0 ? selectedSkills : undefined,
        experience: selectedExperience || undefined,
        availability: selectedAvailability || undefined,
        location: selectedCountry || undefined,
        hourlyRateMin: selectedBudgetRange?.min,
        hourlyRateMax: selectedBudgetRange?.max === Infinity ? undefined : selectedBudgetRange?.max,
        averageRating: minRating > 0 ? minRating : undefined,
        type: talentType === 'all' ? undefined : talentType
      };
      
      const result = await searchTalent(
        filters,
        20,
        loadMore ? talentLastDoc : undefined
      );
      
      if (loadMore) {
        setFreelancers(prev => [...prev, ...result.freelancers]);
        setVendors(prev => [...prev, ...result.vendors]);
      } else {
        setFreelancers(result.freelancers);
        setVendors(result.vendors);
      }
      
      setTalentHasMore(result.hasMore);
      setTalentLastDoc(result.lastDoc);
    } catch (error) {
      console.error('Error searching talent:', error);
      toast.error('Failed to search talent');
    } finally {
      setTalentLoading(false);
    }
  };

  const searchProjectsData = async (loadMore = false) => {
    try {
      setProjectsLoading(true);
      
      const filters: ProjectFilters = {
        searchTerm: searchTerm || undefined,
        skills: selectedSkills.length > 0 ? selectedSkills : undefined,
        experience: selectedExperience || undefined,
        status: 'published'
      };
      
      const result = await searchProjects(
        filters,
        20,
        loadMore ? projectsLastDoc : undefined
      );
      
      if (loadMore) {
        setProjects(prev => [...prev, ...result.projects]);
      } else {
        setProjects(result.projects);
      }
      
      setProjectsHasMore(result.hasMore);
      setProjectsLastDoc(result.lastDoc);
    } catch (error) {
      console.error('Error searching projects:', error);
      toast.error('Failed to search projects');
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleSearch = () => {
    if (activeTab === 'talent') {
      setTalentLastDoc(undefined);
      searchTalentData();
    } else if (activeTab === 'projects') {
      setProjectsLastDoc(undefined);
      searchProjectsData();
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSkills([]);
    setSelectedExperience('');
    setSelectedAvailability('');
    setSelectedCountry('');
    setSelectedBudgetRange(null);
    setMinRating(0);
    setTalentType('all');
    
    // Reset search results
    setTalentLastDoc(undefined);
    setProjectsLastDoc(undefined);
    
    if (activeTab === 'talent') {
      searchTalentData();
    } else if (activeTab === 'projects') {
      searchProjectsData();
    }
  };

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills(prev => [...prev, skill]);
    }
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skill));
  };

  const handleTalentAction = async (talent: FreelancerProfile | VendorProfile, action: string) => {
    // TODO: Implement talent actions
    toast.info(`${action} functionality coming soon`);
  };

  const handleProjectAction = async (project: Project, action: string) => {
    // TODO: Implement project actions
    toast.info(`${action} functionality coming soon`);
  };

  const activeFiltersCount = [
    searchTerm,
    selectedSkills.length > 0,
    selectedExperience,
    selectedAvailability,
    selectedCountry,
    selectedBudgetRange,
    minRating > 0,
    talentType !== 'all'
  ].filter(Boolean).length;

  const totalTalentResults = freelancers.length + vendors.length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Search & Discover</h1>
        <p className="text-muted-foreground">
          Find the perfect talent and projects for your needs
        </p>
      </div>

      {/* Search Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="talent" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Talent
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Services
          </TabsTrigger>
        </TabsList>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder={
                      activeTab === 'talent' 
                        ? "Search for developers, designers, or vendors..."
                        : activeTab === 'projects'
                        ? "Search for projects by title, skills, or description..."
                        : "Search for services and solutions..."
                    }
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

              {/* Popular Skills */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Popular Skills</Label>
                <div className="flex flex-wrap gap-2">
                  {popularSkills.slice(0, 10).map((skill) => (
                    <Badge
                      key={skill.skill}
                      variant={selectedSkills.includes(skill.skill) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/80"
                      onClick={() => 
                        selectedSkills.includes(skill.skill) 
                          ? removeSkill(skill.skill)
                          : addSkill(skill.skill)
                      }
                    >
                      {skill.skill} ({skill.count})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Talent Type (only for talent tab) */}
                    {activeTab === 'talent' && (
                      <div className="space-y-2">
                        <Label>Talent Type</Label>
                        <Select value={talentType} onValueChange={(value: any) => setTalentType(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="All types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="freelancer">Freelancers</SelectItem>
                            <SelectItem value="vendor">Vendors</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Experience Level */}
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

                    {/* Location */}
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger>
                          <SelectValue placeholder="All countries" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All countries</SelectItem>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Availability (talent only) */}
                    {activeTab === 'talent' && (
                      <div className="space-y-2">
                        <Label>Availability</Label>
                        <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                          <SelectTrigger>
                            <SelectValue placeholder="All availability" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All availability</SelectItem>
                            {availabilityOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Budget Range (talent only) */}
                  {activeTab === 'talent' && (
                    <div className="space-y-2">
                      <Label>Hourly Rate Range</Label>
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
                  )}

                  {/* Rating Filter */}
                  <div className="space-y-2">
                    <Label>Minimum Rating</Label>
                    <div className="flex gap-2">
                      {[0, 3, 4, 4.5, 5].map((rating) => (
                        <Badge
                          key={rating}
                          variant={minRating === rating ? "default" : "outline"}
                          className="cursor-pointer flex items-center gap-1"
                          onClick={() => setMinRating(rating)}
                        >
                          <Star className="w-3 h-3" />
                          {rating === 0 ? 'Any' : `${rating}+`}
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

        {/* Trending Categories */}
        {trendingCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Trending Categories
              </CardTitle>
              <CardDescription>
                Popular categories with high demand and growth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {trendingCategories.map((category) => (
                  <div key={category.category} className="text-center p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <div className="font-medium text-sm mb-1">{category.category}</div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {category.projectCount} projects
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      +{category.growth}% growth
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <TabsContent value="talent" className="space-y-6">
          {/* View Controls */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {totalTalentResults} results found
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

          {/* Talent Results */}
          {talentLoading && totalTalentResults === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              ))}
            </div>
          ) : totalTalentResults === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">No talent found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search criteria or filters to find talent.
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
              {/* Freelancers */}
              {freelancers.map((freelancer) => (
                <TalentCard
                  key={freelancer.id}
                  talent={freelancer}
                  type="freelancer"
                  variant={viewMode === 'grid' ? 'default' : 'detailed'}
                  onView={(talent) => handleTalentAction(talent, 'view')}
                  onMessage={(talent) => handleTalentAction(talent, 'message')}
                  onHire={(talent) => handleTalentAction(talent, 'hire')}
                  onSave={(talent) => handleTalentAction(talent, 'save')}
                />
              ))}
              
              {/* Vendors */}
              {vendors.map((vendor) => (
                <TalentCard
                  key={vendor.id}
                  talent={vendor}
                  type="vendor"
                  variant={viewMode === 'grid' ? 'default' : 'detailed'}
                  onView={(talent) => handleTalentAction(talent, 'view')}
                  onMessage={(talent) => handleTalentAction(talent, 'message')}
                  onHire={(talent) => handleTalentAction(talent, 'hire')}
                  onSave={(talent) => handleTalentAction(talent, 'save')}
                />
              ))}
            </div>
          )}

          {/* Load More */}
          {talentHasMore && totalTalentResults > 0 && (
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => searchTalentData(true)}
                disabled={talentLoading}
              >
                {talentLoading ? 'Loading...' : 'Load More Talent'}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
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

          {/* Project Results */}
          {projectsLoading && projects.length === 0 ? (
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
                    <Briefcase className="w-8 h-8 text-gray-400" />
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
                  currentUserId={user?.id}
                  onView={(project) => handleProjectAction(project, 'view')}
                  onApply={(project) => handleProjectAction(project, 'apply')}
                  onSave={(project) => handleProjectAction(project, 'save')}
                  onMessage={(project) => handleProjectAction(project, 'message')}
                />
              ))}
            </div>
          )}

          {/* Load More */}
          {projectsHasMore && projects.length > 0 && (
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => searchProjectsData(true)}
                disabled={projectsLoading}
              >
                {projectsLoading ? 'Loading...' : 'Load More Projects'}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Award className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">AI Services Catalog</h3>
                  <p className="text-muted-foreground">
                    Discover AI services from verified providers in our comprehensive catalog.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild>
                    <Link href="/catalog">
                      <Award className="w-4 h-4 mr-2" />
                      Browse All Services
                    </Link>
                  </Button>
                  {searchTerm && (
                    <Button variant="outline" asChild>
                      <Link href={`/catalog?search=${encodeURIComponent(searchTerm)}`}>
                        <Search className="w-4 h-4 mr-2" />
                        Search "{searchTerm}" in Services
                      </Link>
                    </Button>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Popular categories: Computer Vision, NLP, Predictive Analytics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}