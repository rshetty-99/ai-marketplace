/**
 * Firestore Database Schema for User Onboarding System
 * Based on AImarketplace_feature.md RBAC specifications
 */

export interface BaseOnboardingData {
  userId: string;
  userType: UserType;
  status: OnboardingStatus;
  currentStep: number;
  totalSteps: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  onboardingScore?: number; // 0-100, affects initial visibility
}

export enum UserType {
  FREELANCER = 'freelancer',
  VENDOR_COMPANY = 'vendor_company', 
  CUSTOMER_ORGANIZATION = 'customer_organization'
}

export enum OnboardingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  REQUIRES_REVIEW = 'requires_review'
}

// FREELANCER ONBOARDING SCHEMA
export interface FreelancerOnboarding extends BaseOnboardingData {
  userType: UserType.FREELANCER;
  
  // Step 1: Personal Information & Identity Verification
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
    timezone: string;
    profilePhoto?: string;
    identityVerification: {
      status: VerificationStatus;
      documentType: 'passport' | 'drivers_license' | 'national_id';
      documentUrl?: string;
      verifiedAt?: Date;
    };
  };

  // Step 2: Skills Assessment with AI-proctored tests
  skillsAssessment: {
    primarySkills: string[]; // e.g., ['JavaScript', 'React', 'Node.js']
    secondarySkills: string[];
    assessmentResults: SkillAssessmentResult[];
    aiProctorData?: {
      sessionId: string;
      flags: string[]; // Any irregularities detected
      score: number; // 0-100
    };
  };

  // Step 3: Portfolio Upload & AI Verification
  portfolio: {
    projects: PortfolioProject[];
    githubIntegration?: {
      username: string;
      verifiedRepos: string[];
      contributionScore: number;
    };
    linkedinIntegration?: {
      profileUrl: string;
      verified: boolean;
    };
    aiVerification: {
      plagiarismScore: number; // 0-100, lower is better
      codeQualityScore: number; // 0-100, higher is better
      originalityScore: number; // 0-100, higher is better
    };
  };

  // Step 4: Pricing Strategy Setup
  pricingStrategy: {
    hourlyRate: {
      min: number;
      max: number;
      currency: string;
    };
    projectBasedRates: {
      small: number; // < 40 hours
      medium: number; // 40-200 hours  
      large: number; // 200+ hours
    };
    preferredPaymentTerms: 'hourly' | 'milestone' | 'fixed' | 'retainer';
    aiRecommendations: {
      suggestedRate: number;
      marketAnalysis: string;
      confidenceScore: number;
    };
  };

  // Step 5: Banking/Payment Configuration
  paymentInfo: {
    bankingDetails: {
      accountType: 'checking' | 'savings';
      routingNumber?: string;
      accountNumber?: string; // Encrypted
      bankName: string;
    };
    paypalEmail?: string;
    stripeAccountId?: string;
    preferredMethod: 'bank' | 'paypal' | 'stripe';
  };

  // Step 6: Tax Information
  taxInfo: {
    taxId: string; // SSN or EIN (encrypted)
    formType: 'W9' | 'W8-BEN' | 'W8-BEN-E';
    businessType: 'individual' | 'llc' | 'corporation' | 'partnership';
    taxDocumentUrl?: string;
    isUSPerson: boolean;
  };

  // Step 7: Background Check
  backgroundCheck: {
    consentGiven: boolean;
    consentDate?: Date;
    status: VerificationStatus;
    reportId?: string;
    clearedAt?: Date;
  };

  // Step 8: Personality/Work Style Assessment
  personalityAssessment: {
    discProfile?: DISCProfile;
    bigFiveProfile?: BigFiveProfile;
    workStylePreferences: {
      communicationStyle: 'direct' | 'collaborative' | 'supportive' | 'analytical';
      workEnvironment: 'structured' | 'flexible' | 'autonomous' | 'team-based';
      projectTypes: string[];
      availabilityHours: string; // e.g., "9AM-5PM EST"
    };
  };

  // Step 9: AI Agent Configuration (Optional)
  aiAgentConfig?: {
    hasCustomTools: boolean;
    toolDescriptions: string[];
    integrationApprovalStatus: VerificationStatus;
  };
}

// VENDOR COMPANY ONBOARDING SCHEMA  
export interface VendorCompanyOnboarding extends BaseOnboardingData {
  userType: UserType.VENDOR_COMPANY;

  // Company Information
  companyInfo: {
    legalName: string;
    tradingName?: string;
    businessLicense: {
      number: string;
      issuingAuthority: string;
      documentUrl: string;
      verificationStatus: VerificationStatus;
    };
    taxId: string; // EIN (encrypted)
    incorporationDate: Date;
    businessType: 'llc' | 'corporation' | 'partnership' | 'sole_proprietorship';
    headquarters: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };

  // Multi-user RBAC Configuration
  rbacSetup: {
    adminUsers: CompanyUser[];
    orgStructure: OrganizationStructure;
    roleDefinitions: CustomRole[];
  };

  // Employee Management
  employeeRoster: {
    totalEmployees: number;
    keyPersonnel: KeyPersonnel[];
    // Note: No individual tracking as per requirements
    departmentBreakdown: {
      engineering: number;
      design: number;
      pm: number;
      sales: number;
      other: number;
    };
  };

  // Service Catalog Definition
  serviceCatalog: {
    primaryServices: ServiceOffering[];
    specializations: string[];
    industries: string[];
    certifications: Certification[];
  };

  // Compliance Documentation
  complianceInfo: {
    soc2: ComplianceDocument;
    hipaa?: ComplianceDocument;
    gdpr?: ComplianceDocument;
    iso27001?: ComplianceDocument;
    customCompliance?: ComplianceDocument[];
  };

  // Pricing Models
  pricingModels: {
    hourlyRates: {
      junior: number;
      mid: number;
      senior: number;
      lead: number;
    };
    projectBasedPricing: boolean;
    retainerOptions: boolean;
    enterpriseContracts: boolean;
  };

  // White-label Capabilities
  whiteLabelSetup?: {
    available: boolean;
    brandingGuidelines?: string;
    customDomainOptions: boolean;
    resellerprograms: boolean;
  };

  // API Access Configuration
  apiAccess: {
    required: boolean;
    endpoints: string[];
    rateLimits: {
      tier: 'basic' | 'professional' | 'enterprise';
      requestsPerMinute: number;
    };
  };
}

// CUSTOMER ORGANIZATION ONBOARDING SCHEMA
export interface CustomerOrganizationOnboarding extends BaseOnboardingData {
  userType: UserType.CUSTOMER_ORGANIZATION;

  // Company Profile & Verification
  organizationInfo: {
    legalName: string;
    industry: string;
    companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
    employeeCount: number;
    annualRevenue?: string;
    headquarters: Address;
    website: string;
    businessVerification: {
      status: VerificationStatus;
      documentUrl?: string;
      verifiedAt?: Date;
    };
  };

  // RBAC Roles Setup
  rbacConfiguration: {
    roles: CustomerRole[];
    departmentStructure: Department[];
    approvalWorkflows: ApprovalWorkflow[];
  };

  // Payment & Escrow Setup
  paymentSetup: {
    paymentMethods: PaymentMethod[];
    escrowPreferences: {
      autoRelease: boolean;
      releaseTerms: string;
      disputeResolution: 'mediation' | 'arbitration' | 'legal';
    };
    budgetLimits: {
      monthly: number;
      projectMax: number;
      departmentLimits: Record<string, number>;
    };
  };

  // Contract Templates
  contractTemplates: {
    nda: ContractTemplate;
    msa: ContractTemplate; // Master Service Agreement
    customTemplates?: ContractTemplate[];
  };

  // Compliance Requirements
  complianceRequirements: {
    dataResidency: string[]; // Countries where data must stay
    certificationRequirements: string[]; // Required vendor certifications
    securityRequirements: SecurityRequirement[];
    auditRequirements: boolean;
  };

  // SSO Configuration
  ssoConfig?: {
    provider: 'okta' | 'azure_ad' | 'google_workspace' | 'custom_saml';
    domain: string;
    configured: boolean;
    testingComplete: boolean;
  };

  // Preferred Vendor Pool
  vendorPreferences: {
    preferredVendors: string[]; // Vendor IDs
    blacklistedVendors: string[]; // Vendor IDs
    vendorTiers: VendorTier[];
    autoApprovalCriteria: {
      maxProjectValue: number;
      requiredCertifications: string[];
      minimumRating: number;
    };
  };
}

// SUPPORTING INTERFACES
export interface SkillAssessmentResult {
  skill: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  score: number; // 0-100
  testType: 'multiple_choice' | 'coding_challenge' | 'project_review';
  completedAt: Date;
  aiProctorFlags?: string[];
}

export interface PortfolioProject {
  title: string;
  description: string;
  technologies: string[];
  role: string;
  duration: string;
  clientTestimonial?: string;
  projectUrl?: string;
  githubUrl?: string;
  screenshots: string[];
  aiAnalysis: {
    complexityScore: number;
    innovationScore: number;
    codeQualityScore: number;
  };
}

export interface DISCProfile {
  dominance: number; // 0-100
  influence: number; // 0-100
  steadiness: number; // 0-100
  conscientiousness: number; // 0-100
  primaryStyle: 'D' | 'I' | 'S' | 'C';
  workingStyle: string;
}

export interface BigFiveProfile {
  openness: number; // 0-100
  conscientiousness: number; // 0-100
  extraversion: number; // 0-100
  agreeableness: number; // 0-100
  neuroticism: number; // 0-100
}

export interface CompanyUser {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  permissions: string[];
  inviteStatus: 'pending' | 'accepted' | 'expired';
}

export interface ServiceOffering {
  name: string;
  category: string;
  description: string;
  deliverables: string[];
  estimatedDuration: string;
  priceRange: {
    min: number;
    max: number;
  };
  requirements: string[];
}

export interface Certification {
  name: string;
  issuingOrganization: string;
  certificateUrl?: string;
  validUntil?: Date;
  verificationStatus: VerificationStatus;
}

export interface ComplianceDocument {
  type: string;
  documentUrl: string;
  validUntil?: Date;
  verificationStatus: VerificationStatus;
  auditedBy?: string;
  lastAuditDate?: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface CustomerRole {
  name: string;
  permissions: string[];
  maxBudgetApproval: number;
  canInviteUsers: boolean;
  departmentAccess: string[];
}

export interface Department {
  name: string;
  budget: number;
  head: string; // User ID
  members: string[]; // User IDs
  defaultApprover: string; // User ID
}

export interface ApprovalWorkflow {
  projectValueThreshold: number;
  requiredApprovers: string[]; // Role names
  timeoutDays: number;
  escalationPath: string[]; // Role names
}

export interface PaymentMethod {
  type: 'credit_card' | 'ach' | 'wire' | 'check';
  isDefault: boolean;
  details: Record<string, string>; // Encrypted sensitive data
  verificationStatus: VerificationStatus;
}

export interface ContractTemplate {
  name: string;
  type: 'nda' | 'msa' | 'sow' | 'custom';
  templateUrl: string;
  version: string;
  lastUpdated: Date;
  requiresLegalReview: boolean;
}

export interface SecurityRequirement {
  requirement: string;
  mandatory: boolean;
  description: string;
  validationCriteria: string;
}

export interface VendorTier {
  name: string;
  criteria: {
    minimumRating: number;
    requiredCertifications: string[];
    minimumCompletedProjects: number;
    maxResponseTime: number; // hours
  };
  benefits: string[];
  fees: {
    platformFee: number; // percentage
    transactionFee: number; // flat fee
  };
}

export enum VerificationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress', 
  VERIFIED = 'verified',
  FAILED = 'failed',
  EXPIRED = 'expired',
  PENDING_REVIEW = 'pending_review'
}

export interface OrganizationStructure {
  departments: string[];
  hierarchy: Record<string, string[]>; // parent -> children
  crossFunctionalTeams: string[];
}

export interface KeyPersonnel {
  name: string;
  title: string;
  email: string;
  linkedinUrl?: string;
  yearsOfExperience: number;
  specializations: string[];
}

export interface CustomRole {
  name: string;
  description: string;
  permissions: string[];
  hierarchy: number; // 1-10, higher = more authority
}