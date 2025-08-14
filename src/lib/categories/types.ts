export interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  parentId?: string;
  level: number;
  subcategories: Category[];
  skills: Skill[];
  tools: Tool[];
  deliverables: Deliverable[];
  averageRate: number;
  totalFreelancers: number;
  demandScore: number;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  level: SkillLevel;
  verificationRequired: boolean;
  tags: string[];
  relatedSkills: string[];
  averageRate: number;
  demandScore: number;
  certifications: string[];
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  type: ToolType;
  proficiencyLevels: string[];
  relatedTools: string[];
  officialCertifications: string[];
}

export interface Deliverable {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  estimatedHours: number;
  complexity: ComplexityLevel;
  requiredSkills: string[];
  templates: string[];
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export enum ToolType {
  SOFTWARE = 'software',
  PLATFORM = 'platform',
  FRAMEWORK = 'framework',
  LANGUAGE = 'language',
  METHODOLOGY = 'methodology',
}

export enum ComplexityLevel {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  ENTERPRISE = 'enterprise',
}

export interface FreelancerProfile {
  id: string;
  userId: string;
  categories: string[];
  skills: FreelancerSkill[];
  tools: FreelancerTool[];
  portfolio: PortfolioItem[];
  ratings: Rating[];
  averageRating: number;
  totalProjects: number;
  successRate: number;
  responseTime: number;
  availability: Availability;
  rates: RateStructure;
  verifications: Verification[];
  tags: string[];
}

export interface FreelancerSkill {
  skillId: string;
  level: SkillLevel;
  experience: number; // years
  verified: boolean;
  verificationDate?: Date;
  certifications: string[];
  portfolioItems: string[];
}

export interface FreelancerTool {
  toolId: string;
  proficiency: string;
  experience: number; // years
  certifications: string[];
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  categoryIds: string[];
  skillIds: string[];
  toolIds: string[];
  completionDate: Date;
  clientRating?: number;
  images: string[];
  attachments: string[];
}

export interface Rating {
  id: string;
  projectId: string;
  clientId: string;
  rating: number;
  feedback: string;
  categories: string[];
  skills: string[];
  createdAt: Date;
}

export interface Availability {
  hoursPerWeek: number;
  timezone: string;
  workingHours: TimeSlot[];
  availableFrom: Date;
  unavailableDates: Date[];
}

export interface TimeSlot {
  day: string;
  start: string;
  end: string;
}

export interface RateStructure {
  hourlyRate: number;
  projectMinimum: number;
  currency: string;
  fixedPricePreference: boolean;
  rushFee: number;
}

export interface Verification {
  type: VerificationType;
  status: VerificationStatus;
  verifiedBy: string;
  verifiedAt: Date;
  expiresAt?: Date;
  details: Record<string, any>;
}

export enum VerificationType {
  IDENTITY = 'identity',
  SKILL = 'skill',
  EDUCATION = 'education',
  CERTIFICATION = 'certification',
  PORTFOLIO = 'portfolio',
  CLIENT_REFERENCE = 'client_reference',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export interface MatchingCriteria {
  categories: string[];
  skills: string[];
  tools: string[];
  budget: BudgetRange;
  timeline: TimelineRange;
  complexity: ComplexityLevel;
  workType: WorkType;
  location?: string;
  timezone?: string;
  languages?: string[];
  verificationRequired?: boolean;
  ratingMinimum?: number;
  responseTimeMax?: number;
}

export interface BudgetRange {
  min: number;
  max: number;
  currency: string;
  type: 'hourly' | 'fixed';
}

export interface TimelineRange {
  start: Date;
  end: Date;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
}

export enum WorkType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  ONE_TIME = 'one_time',
}

export interface AIMatchingResult {
  freelancerId: string;
  matchScore: number;
  reasoning: string;
  skillMatches: SkillMatch[];
  categoryMatches: CategoryMatch[];
  availabilityMatch: number;
  budgetMatch: number;
  timelineMatch: number;
  riskFactors: string[];
  recommendations: string[];
}

export interface SkillMatch {
  skillId: string;
  required: boolean;
  freelancerLevel: SkillLevel;
  requiredLevel: SkillLevel;
  experience: number;
  verified: boolean;
  matchScore: number;
}

export interface CategoryMatch {
  categoryId: string;
  relevance: number;
  experience: number;
  successRate: number;
  portfolioItems: number;
}