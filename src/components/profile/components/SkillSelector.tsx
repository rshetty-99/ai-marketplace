/**
 * Skill Selector Component
 * Interactive component for managing skills, tools, and language proficiencies
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Plus, 
  Trash2, 
  Star, 
  Code, 
  Globe, 
  Award,
  Search,
  X
} from 'lucide-react';

import { 
  EnhancedFreelancerProfile, 
  SkillWithLevel, 
  LanguageSkill 
} from '@/lib/firebase/enhanced-profile-schema';

interface SkillSelectorProps {
  profile: EnhancedFreelancerProfile;
  onUpdate: (skills: any) => Promise<void>;
  className?: string;
}

// Predefined skill categories and options
const SKILL_CATEGORIES = {
  'Programming Languages': [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin'
  ],
  'Frontend': [
    'React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js', 'HTML5', 'CSS3', 'Sass', 'Tailwind CSS'
  ],
  'Backend': [
    'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'Ruby on Rails', 'ASP.NET'
  ],
  'Database': [
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Firebase', 'DynamoDB', 'SQLite'
  ],
  'Cloud & DevOps': [
    'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'Jenkins', 'GitHub Actions', 'Terraform'
  ],
  'Mobile': [
    'React Native', 'Flutter', 'iOS Development', 'Android Development', 'Xamarin', 'Ionic'
  ],
  'Design': [
    'UI/UX Design', 'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'InVision', 'Principle'
  ],
  'Data Science': [
    'Machine Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'Jupyter', 'R'
  ]
};

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner (0-1 years)', color: 'bg-gray-500' },
  { value: 'intermediate', label: 'Intermediate (1-3 years)', color: 'bg-blue-500' },
  { value: 'advanced', label: 'Advanced (3-5 years)', color: 'bg-orange-500' },
  { value: 'expert', label: 'Expert (5+ years)', color: 'bg-green-500' }
];

const LANGUAGE_PROFICIENCY = [
  { value: 'basic', label: 'Basic' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'native', label: 'Native' }
];

const COMMON_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Chinese (Mandarin)',
  'Japanese', 'Korean', 'Arabic', 'Hindi', 'Dutch', 'Swedish', 'Norwegian', 'Danish'
];

export function SkillSelector({ profile, onUpdate, className }: SkillSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [isAddLanguageOpen, setIsAddLanguageOpen] = useState(false);
  const [newSkill, setNewSkill] = useState({
    name: '',
    level: 'intermediate' as const,
    yearsOfExperience: 1,
    isVerified: false
  });
  const [newLanguage, setNewLanguage] = useState({
    language: '',
    proficiency: 'conversational' as const,
    isVerified: false
  });

  // Filter available skills based on search and category
  const getAvailableSkills = () => {
    let skills: string[] = [];
    
    if (selectedCategory) {
      skills = SKILL_CATEGORIES[selectedCategory as keyof typeof SKILL_CATEGORIES] || [];
    } else {
      skills = Object.values(SKILL_CATEGORIES).flat();
    }

    if (searchTerm) {
      skills = skills.filter(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter out skills that are already added
    const existingSkillNames = [
      ...profile.skills.primary.map(s => s.name),
      ...profile.skills.secondary.map(s => s.name)
    ];
    
    return skills.filter(skill => !existingSkillNames.includes(skill));
  };

  // Add primary skill
  const addPrimarySkill = async (skillData: SkillWithLevel) => {
    const updatedSkills = {
      ...profile.skills,
      primary: [...profile.skills.primary, skillData]
    };
    await onUpdate({ skills: updatedSkills });
  };

  // Add secondary skill
  const addSecondarySkill = async (skillData: SkillWithLevel) => {
    const updatedSkills = {
      ...profile.skills,
      secondary: [...profile.skills.secondary, skillData]
    };
    await onUpdate({ skills: updatedSkills });
  };

  // Remove skill
  const removeSkill = async (skillName: string, type: 'primary' | 'secondary') => {
    const updatedSkills = {
      ...profile.skills,
      [type]: profile.skills[type].filter(skill => skill.name !== skillName)
    };
    await onUpdate({ skills: updatedSkills });
  };

  // Move skill between primary and secondary
  const moveSkill = async (skillName: string, from: 'primary' | 'secondary', to: 'primary' | 'secondary') => {
    const skill = profile.skills[from].find(s => s.name === skillName);
    if (!skill) return;

    const updatedSkills = {
      ...profile.skills,
      [from]: profile.skills[from].filter(s => s.name !== skillName),
      [to]: [...profile.skills[to], skill]
    };
    await onUpdate({ skills: updatedSkills });
  };

  // Add tool
  const addTool = async (toolName: string) => {
    if (!toolName.trim() || profile.skills.tools.includes(toolName)) return;
    
    const updatedSkills = {
      ...profile.skills,
      tools: [...profile.skills.tools, toolName.trim()]
    };
    await onUpdate({ skills: updatedSkills });
  };

  // Remove tool
  const removeTool = async (toolName: string) => {
    const updatedSkills = {
      ...profile.skills,
      tools: profile.skills.tools.filter(tool => tool !== toolName)
    };
    await onUpdate({ skills: updatedSkills });
  };

  // Add language
  const addLanguage = async (languageData: LanguageSkill) => {
    const updatedSkills = {
      ...profile.skills,
      languages: [...profile.skills.languages, languageData]
    };
    await onUpdate({ skills: updatedSkills });
  };

  // Remove language
  const removeLanguage = async (languageName: string) => {
    const updatedSkills = {
      ...profile.skills,
      languages: profile.skills.languages.filter(lang => lang.language !== languageName)
    };
    await onUpdate({ skills: updatedSkills });
  };

  // Handle add skill form submission
  const handleAddSkill = async (isPrimary: boolean) => {
    if (!newSkill.name.trim()) return;

    const skillData: SkillWithLevel = {
      name: newSkill.name,
      level: newSkill.level,
      yearsOfExperience: newSkill.yearsOfExperience,
      isVerified: false
    };

    if (isPrimary) {
      await addPrimarySkill(skillData);
    } else {
      await addSecondarySkill(skillData);
    }

    // Reset form
    setNewSkill({
      name: '',
      level: 'intermediate',
      yearsOfExperience: 1,
      isVerified: false
    });
    setIsAddSkillOpen(false);
  };

  // Handle add language form submission
  const handleAddLanguage = async () => {
    if (!newLanguage.language.trim()) return;

    await addLanguage({
      language: newLanguage.language,
      proficiency: newLanguage.proficiency,
      isVerified: false
    });

    // Reset form
    setNewLanguage({
      language: '',
      proficiency: 'conversational',
      isVerified: false
    });
    setIsAddLanguageOpen(false);
  };

  const getLevelColor = (level: string) => {
    return SKILL_LEVELS.find(l => l.value === level)?.color || 'bg-gray-500';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Primary Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Primary Skills
          </CardTitle>
          <CardDescription>
            Your core competencies and main areas of expertise (5-8 skills recommended)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {profile.skills.primary.map((skill) => (
                <div key={skill.name} className="group relative">
                  <Badge 
                    variant="default" 
                    className="pr-8 py-2 text-sm"
                  >
                    <div className={`w-2 h-2 rounded-full mr-2 ${getLevelColor(skill.level)}`} />
                    {skill.name}
                    {skill.isVerified && <Award className="w-3 h-3 ml-1" />}
                  </Badge>
                  
                  <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 w-6 p-0 rounded-full"
                      onClick={() => removeSkill(skill.name, 'primary')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="absolute top-full left-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    {skill.level} • {skill.yearsOfExperience} years
                  </div>
                </div>
              ))}
            </div>

            <Dialog open={isAddSkillOpen} onOpenChange={setIsAddSkillOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Primary Skill
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Primary Skill</DialogTitle>
                  <DialogDescription>
                    Add a core skill that represents your main expertise
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Skill Search and Selection */}
                  <div className="space-y-2">
                    <Label>Skill Name</Label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search or type skill name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by category (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Categories</SelectItem>
                          {Object.keys(SKILL_CATEGORIES).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Available Skills */}
                    <div className="max-h-40 overflow-y-auto border rounded p-2">
                      <div className="flex flex-wrap gap-1">
                        {getAvailableSkills().slice(0, 20).map((skill) => (
                          <Button
                            key={skill}
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setNewSkill({ ...newSkill, name: skill })}
                          >
                            {skill}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <Input
                      placeholder="Or type custom skill name"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    />
                  </div>

                  {/* Skill Level */}
                  <div className="space-y-2">
                    <Label>Skill Level</Label>
                    <Select 
                      value={newSkill.level} 
                      onValueChange={(value: any) => setNewSkill({ ...newSkill, level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SKILL_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${level.color}`} />
                              {level.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Years of Experience */}
                  <div className="space-y-2">
                    <Label>Years of Experience</Label>
                    <Input
                      type="number"
                      min="0"
                      max="30"
                      value={newSkill.yearsOfExperience}
                      onChange={(e) => setNewSkill({ 
                        ...newSkill, 
                        yearsOfExperience: parseInt(e.target.value) || 0 
                      })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddSkillOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleAddSkill(true)} disabled={!newSkill.name.trim()}>
                    Add Skill
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Secondary Skills
          </CardTitle>
          <CardDescription>
            Additional skills and technologies you're familiar with
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {profile.skills.secondary.map((skill) => (
                <div key={skill.name} className="group relative">
                  <Badge variant="secondary" className="pr-8 py-1">
                    <div className={`w-2 h-2 rounded-full mr-2 ${getLevelColor(skill.level)}`} />
                    {skill.name}
                  </Badge>
                  
                  <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 rounded-full"
                      onClick={() => removeSkill(skill.name, 'secondary')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsAddSkillOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Secondary Skill
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tools & Technologies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Tools & Technologies
          </CardTitle>
          <CardDescription>
            Software, frameworks, and tools you use regularly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {profile.skills.tools.map((tool) => (
                <Badge key={tool} variant="outline" className="group relative pr-6">
                  {tool}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeTool(tool)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Add tool or technology..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTool(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Add tool or technology..."]') as HTMLInputElement;
                  if (input) {
                    addTool(input.value);
                    input.value = '';
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Languages
          </CardTitle>
          <CardDescription>
            Languages you can communicate in for international projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              {profile.skills.languages.map((language) => (
                <div key={language.language} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{language.language}</span>
                    <Badge variant="outline" className="capitalize">
                      {language.proficiency}
                    </Badge>
                    {language.isVerified && <Award className="h-4 w-4 text-yellow-500" />}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLanguage(language.language)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Dialog open={isAddLanguageOpen} onOpenChange={setIsAddLanguageOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Language
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Language</DialogTitle>
                  <DialogDescription>
                    Add a language you can communicate in
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select 
                      value={newLanguage.language} 
                      onValueChange={(value) => setNewLanguage({ ...newLanguage, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_LANGUAGES.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Proficiency Level</Label>
                    <Select 
                      value={newLanguage.proficiency} 
                      onValueChange={(value: any) => setNewLanguage({ ...newLanguage, proficiency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_PROFICIENCY.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddLanguageOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddLanguage} disabled={!newLanguage.language}>
                    Add Language
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SkillSelector;