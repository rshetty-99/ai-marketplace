/**
 * Enhanced Profile Schema for AI Marketplace
 * Extends existing user, freelancer, vendor, and organization collections
 * with comprehensive profile features for public showcase pages
 */

import { 
  FreelancerOnboarding, 
  VendorCompanyOnboarding, 
  CustomerOrganizationOnboarding,
  UserType,
  VerificationStatus 
} from './onboarding-schema';
import { User } from '../rbac/types';

// =============================================================================
// CORE PROFILE INTERFACES (Extending Existing Collections)
// =============================================================================

/**
 * Enhanced User Document (extends existing users collection)
 * Adds profile-specific fields to the existing user structure
 */
export interface EnhancedUserDocument extends User {
  // Existing fields from User interface:
  // id, email, name, organizationId, roles, isActive, createdAt, updatedAt
  
  // Enhanced profile fields
  avatar?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  profileCompletion: number; // 0-100 percentage
  
  // Public profile settings
  publicProfile: {
    slug?: string; // Custom URL slug
    isPublic: boolean;
    isAvailableForHire: boolean;
    lastPublishedAt?: Date;
    publishStatus: 'draft' | 'published' | 'unpublished';
  };
  
  // Verification and trust
  verification: {
    identity: VerificationStatus;
    email: VerificationStatus;
    phone: VerificationStatus;
    background: VerificationStatus;
    skillsAssessment: VerificationStatus;
  };
  
  // Analytics and performance
  profileMetrics: {
    views: number;
    inquiries: number;
    hired: number;
    rating: number; // 0-5
    reviewCount: number;
    responseTime: number; // in hours
    completionRate: number; // 0-100 percentage
  };
  
  // Clerk integration metadata
  metadata: {
    clerkUserId: string;
    clerkCreatedAt: Date;
    clerkUpdatedAt: Date;
    emailVerified: boolean;
    phoneVerified: boolean;
    lastSyncedAt: Date;
  };
}

/**
 * Enhanced Freelancer Profile (extends existing freelancers collection)
 * Builds upon FreelancerOnboarding data for public showcase
 */
export interface EnhancedFreelancerProfile {
  // Reference to user and onboarding data
  userId: string;
  userType: UserType.FREELANCER;
  onboardingId?: string; // Reference to onboarding document
  
  // Professional information
  professional: {
    title: string; // Professional headline
    experience: number; // Years of experience
    specializations: string[];
    availability: {
      status: 'available' | 'busy' | 'unavailable';
      hoursPerWeek: number;
      startDate?: Date;
      timezone: string;
    };
    pricing: {
      hourlyRate: {
        min: number;
        max: number;
        currency: string;
      };
      projectRates: {
        small: number; // < 40 hours
        medium: number; // 40-200 hours
        large: number; // 200+ hours
      };
      preferredPaymentTerms: string[];
    };
  };
  
  // Skills and expertise
  skills: {
    primary: SkillWithLevel[];
    secondary: SkillWithLevel[];
    tools: string[];
    languages: LanguageSkill[];
    certifications: Certification[];
  };
  
  // Portfolio and work samples
  portfolio: {
    projects: PortfolioProject[];
    testimonials: ClientTestimonial[];
    workSamples: WorkSample[];
    achievements: Achievement[];
  };
  
  // Public profile customization
  branding: {
    colorScheme?: string;
    coverImage?: string;
    logoUrl?: string;
    customCss?: string;
  };
  
  // SEO and marketing
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
    socialMediaLinks: SocialMediaLink[];
  };
  
  // Profile status
  status: {
    isProfileComplete: boolean;
    publishedAt?: Date;
    lastUpdated: Date;
    profileVersion: number;
  };
}

/**
 * Enhanced Vendor Profile (extends existing vendors collection)  
 * Builds upon VendorCompanyOnboarding for company showcase
 */
export interface EnhancedVendorProfile {
  // Reference to organization and onboarding
  organizationId: string;
  userType: UserType.VENDOR_COMPANY;
  onboardingId?: string;
  
  // Company information
  company: {
    legalName: string;
    brandName: string;
    description: string;
    foundedYear: number;
    employeeCount: number;
    headquarters: Address;
    locations: CompanyLocation[];
    website: string;
    industry: string[];
  };
  
  // Services and capabilities
  services: {
    primaryServices: ServiceOffering[];
    expertise: string[];
    industries: string[];
    methodologies: string[];
    technologies: string[];
  };
  
  // Team showcase
  team: {
    leadership: TeamMember[];
    keyPersonnel: TeamMember[];
    departments: DepartmentInfo[];
    culture: {
      values: string[];
      workEnvironment: string;
      benefits: string[];
    };
  };
  
  // Case studies and success stories
  showcase: {
    caseStudies: CaseStudy[];
    clientTestimonials: ClientTestimonial[];
    awards: Award[];
    partnerships: Partnership[];
    media: MediaMention[];
  };
  
  // Compliance and certifications
  compliance: {
    certifications: ComplianceCertification[];
    securityStandards: string[];
    industryAccreditations: string[];
    auditReports: AuditReport[];
  };
  
  // Pricing and business model
  business: {
    pricingModels: PricingModel[];
    contractTypes: string[];
    minimumEngagement: {
      duration: string;
      budget: number;
    };
    preferredClientSize: string[];
  };
  
  // Public profile settings
  branding: {
    logo: string;
    coverImage?: string;
    colorScheme: BrandColors;
    customDomain?: string;
  };
  
  // SEO and contact
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
    structuredData: any; // JSON-LD structured data
  };
  
  contact: {
    salesEmail: string;
    supportEmail: string;
    phone: string;
    socialMedia: SocialMediaLink[];
    contactForms: ContactForm[];
  };
}

/**
 * Enhanced Organization Profile (extends existing organizations collection)
 * For customer organizations to showcase their requirements and partnerships
 */
export interface EnhancedOrganizationProfile {
  // Reference to organization and onboarding
  organizationId: string;
  userType: UserType.CUSTOMER_ORGANIZATION;
  onboardingId?: string;
  
  // Organization information
  organization: {
    name: string;
    description: string;
    industry: string;
    size: string;
    founded: number;
    headquarters: Address;
    website: string;
    linkedinUrl?: string;
  };
  
  // Project and partnership information
  partnerships: {
    preferredVendorTypes: string[];
    projectTypes: string[];
    budgetRanges: BudgetRange[];
    collaborationPreferences: string[];
    successStories: PartnershipStory[];
  };
  
  // Requirements and standards
  requirements: {
    technicalRequirements: string[];
    complianceRequirements: string[];
    securityRequirements: string[];
    qualityStandards: string[];
  };
  
  // Public showcase
  showcase: {
    companyAchievements: Achievement[];
    industryRecognition: Award[];
    teamHighlights: TeamHighlight[];
    innovation: InnovationStory[];
  };
  
  // Contact and business development
  businessDevelopment: {
    contactEmail: string;
    partnershipManager?: TeamMember;
    applicationProcess: string;
    preferredContactMethods: string[];
  };
  
  // Branding and SEO
  branding: {
    logo: string;
    coverImage?: string;
    colorScheme: BrandColors;
  };
  
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords: string[];
  };
}

// =============================================================================
// SUPPORTING INTERFACES AND TYPES
// =============================================================================

export interface SkillWithLevel {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number;
  isVerified: boolean;
  verificationScore?: number; // 0-100
}

export interface LanguageSkill {
  language: string;
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
  isVerified: boolean;
}

export interface Certification {
  name: string;
  issuer: string;
  credentialId?: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialUrl?: string;
  isVerified: boolean;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  category: string;
  technologies: string[];
  role: string;
  duration: string;
  teamSize?: number;
  clientName?: string; // Optional for confidentiality
  projectUrl?: string;
  repositoryUrl?: string;
  images: ProjectImage[];
  challenges: string;
  solution: string;
  results: string[];
  metrics?: ProjectMetric[];
  testimonial?: ClientTestimonial;
  isFeatureProject: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectImage {
  url: string;
  caption?: string;
  type: 'screenshot' | 'mockup' | 'diagram' | 'other';
  isHero: boolean;
}

export interface ProjectMetric {
  label: string;
  value: string;
  description?: string;
}

export interface ClientTestimonial {
  id: string;
  clientName: string;
  clientTitle?: string;
  clientCompany?: string;
  clientAvatar?: string;
  rating: number; // 1-5
  testimonial: string;
  projectId?: string;
  isPublic: boolean;
  isFeatured: boolean;
  dateGiven: Date;
  isVerified: boolean;
}

export interface WorkSample {
  id: string;
  title: string;
  description: string;
  type: 'code' | 'design' | 'document' | 'video' | 'demo';
  url: string;
  thumbnailUrl?: string;
  technologies: string[];
  category: string;
  isPublic: boolean;
  uploadedAt: Date;
}

export interface Achievement {
  title: string;
  description: string;
  date: Date;
  type: 'award' | 'certification' | 'milestone' | 'recognition';
  issuer?: string;
  url?: string;
}

export interface SocialMediaLink {
  platform: 'linkedin' | 'github' | 'twitter' | 'behance' | 'dribbble' | 'website' | 'other';
  url: string;
  isVerified: boolean;
}

export interface Address {
  street?: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface CompanyLocation extends Address {
  name: string;
  type: 'headquarters' | 'branch' | 'remote_hub';
  employeeCount?: number;
  timezone: string;
}

export interface TeamMember {
  name: string;
  title: string;
  bio?: string;
  avatar?: string;
  linkedinUrl?: string;
  email?: string;
  skills: string[];
  yearsOfExperience: number;
  isPublic: boolean;
}

export interface DepartmentInfo {
  name: string;
  description: string;
  headCount: number;
  specializations: string[];
  manager?: TeamMember;
}

export interface CaseStudy {
  id: string;
  title: string;
  summary: string;
  challenge: string;
  solution: string;
  results: string[];
  metrics: ProjectMetric[];
  technologies: string[];
  duration: string;
  teamSize: number;
  industry: string;
  clientSize?: string;
  images: ProjectImage[];
  testimonial?: ClientTestimonial;
  isPublic: boolean;
  isFeatured: boolean;
  createdAt: Date;
}

export interface Award {
  title: string;
  issuer: string;
  date: Date;
  description?: string;
  category?: string;
  url?: string;
  imageUrl?: string;
}

export interface Partnership {
  partnerName: string;
  partnerLogo?: string;
  partnershipType: 'technology' | 'strategic' | 'vendor' | 'certified';
  description: string;
  startDate: Date;
  isPublic: boolean;
}

export interface MediaMention {
  title: string;
  publication: string;
  url: string;
  date: Date;
  type: 'article' | 'interview' | 'podcast' | 'video' | 'press_release';
  excerpt?: string;
}

export interface ComplianceCertification extends Certification {
  scope: string;
  auditFirm?: string;
  nextAuditDate?: Date;
  certificateUrl?: string;
}

export interface AuditReport {
  title: string;
  auditor: string;
  date: Date;
  scope: string;
  summary: string;
  reportUrl?: string;
  isPublic: boolean;
}

export interface PricingModel {
  name: string;
  description: string;
  type: 'hourly' | 'fixed' | 'retainer' | 'value_based';
  startingPrice?: number;
  currency: string;
  features: string[];
  isPopular: boolean;
}

export interface BrandColors {
  primary: string;
  secondary: string;
  accent?: string;
  background?: string;
  text?: string;
}

export interface ContactForm {
  name: string;
  description: string;
  fields: FormField[];
  successMessage: string;
  notificationEmail: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  options?: string[]; // For select fields
  placeholder?: string;
}

export interface BudgetRange {
  label: string;
  min: number;
  max: number;
  currency: string;
  frequency: 'project' | 'monthly' | 'annual';
}

export interface PartnershipStory {
  title: string;
  partnerName: string;
  description: string;
  outcome: string;
  duration: string;
  category: string;
  isPublic: boolean;
}

export interface TeamHighlight {
  title: string;
  description: string;
  members: TeamMember[];
  achievement?: string;
  imageUrl?: string;
}

export interface InnovationStory {
  title: string;
  description: string;
  impact: string;
  technologies: string[];
  date: Date;
  imageUrl?: string;
  videoUrl?: string;
}

// =============================================================================
// PROFILE MANAGEMENT INTERFACES
// =============================================================================

/**
 * Profile slug management for unique public URLs
 */
export interface ProfileSlug {
  slug: string;
  userId: string;
  userType: UserType;
  isReserved: boolean;
  createdAt: Date;
  expiresAt?: Date; // For temporary reservations
}

/**
 * Profile analytics for tracking performance
 */
export interface ProfileAnalytics {
  profileId: string;
  userId: string;
  userType: UserType;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  
  metrics: {
    views: number;
    uniqueVisitors: number;
    inquiries: number;
    contactFormSubmissions: number;
    projectViews: number;
    portfolioDownloads: number;
    socialMediaClicks: number;
    averageTimeOnPage: number; // in seconds
    bounceRate: number; // percentage
  };
  
  sources: {
    direct: number;
    search: number;
    social: number;
    referral: number;
    email: number;
  };
  
  geography: {
    country: string;
    views: number;
  }[];
  
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
}

/**
 * Profile completion tracking and suggestions
 */
export interface ProfileCompletion {
  userId: string;
  userType: UserType;
  completionPercentage: number;
  lastUpdated: Date;
  
  sections: {
    basicInfo: {
      completed: boolean;
      score: number;
      suggestions: string[];
    };
    professional: {
      completed: boolean;
      score: number;
      suggestions: string[];
    };
    portfolio: {
      completed: boolean;
      score: number;
      suggestions: string[];
    };
    verification: {
      completed: boolean;
      score: number;
      suggestions: string[];
    };
    seo: {
      completed: boolean;
      score: number;
      suggestions: string[];
    };
  };
  
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    description: string;
    estimatedImpact: number; // percentage improvement
  }[];
}

/**
 * Profile verification tracking
 */
export interface ProfileVerification {
  userId: string;
  verificationType: 'identity' | 'skills' | 'work_history' | 'education' | 'background';
  status: VerificationStatus;
  verifiedAt?: Date;
  expiresAt?: Date;
  verifiedBy?: string; // System or admin user ID
  documentUrl?: string;
  verificationScore?: number; // 0-100
  notes?: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// COLLECTION NAMES AND EXPORT
// =============================================================================

export const PROFILE_COLLECTIONS = {
  USERS: 'users',
  FREELANCERS: 'freelancers', 
  VENDORS: 'vendors',
  ORGANIZATIONS: 'organizations',
  ONBOARDING: 'onboarding',
  PROFILE_SLUGS: 'profile_slugs',
  PROFILE_ANALYTICS: 'profile_analytics',
  PROFILE_COMPLETION: 'profile_completion',
  PROFILE_VERIFICATION: 'profile_verification'
} as const;

export type ProfileCollectionName = typeof PROFILE_COLLECTIONS[keyof typeof PROFILE_COLLECTIONS];