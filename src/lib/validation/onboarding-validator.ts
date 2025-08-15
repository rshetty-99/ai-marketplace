// Onboarding Progress Validation
// Comprehensive validation system for all onboarding workflows

import { z } from 'zod';

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  errors: ValidationError[];
  warnings: ValidationWarning[];
  completionPercentage: number;
  missingRequiredFields: string[];
  recommendations: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'high' | 'medium';
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion: string;
  code: string;
}

// Base validation schemas
const EmailSchema = z.string().email('Invalid email address');
const PhoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format');
const URLSchema = z.string().url('Invalid URL format').optional();
const NonEmptyStringSchema = z.string().min(1, 'This field is required');

// Freelancer validation schemas
export const FreelancerPersonalInfoSchema = z.object({
  firstName: NonEmptyStringSchema,
  lastName: NonEmptyStringSchema,
  email: EmailSchema,
  phone: PhoneSchema,
  location: z.object({
    country: NonEmptyStringSchema,
    city: NonEmptyStringSchema,
    timezone: NonEmptyStringSchema
  }),
  profileImage: URLSchema,
  headline: z.string().min(10, 'Headline should be at least 10 characters').max(100, 'Headline too long'),
  bio: z.string().min(50, 'Bio should be at least 50 characters').max(2000, 'Bio too long')
});

export const FreelancerProfessionalInfoSchema = z.object({
  title: NonEmptyStringSchema,
  experience: z.enum(['entry', 'intermediate', 'expert']),
  hourlyRate: z.number().min(5, 'Minimum rate is $5/hour').max(1000, 'Maximum rate is $1000/hour'),
  availability: z.enum(['full_time', 'part_time', 'contract']),
  skills: z.array(z.string()).min(3, 'At least 3 skills required').max(20, 'Too many skills'),
  languages: z.array(z.object({
    language: NonEmptyStringSchema,
    proficiency: z.enum(['basic', 'conversational', 'fluent', 'native'])
  })).min(1, 'At least one language required'),
  certifications: z.array(z.object({
    name: NonEmptyStringSchema,
    issuer: NonEmptyStringSchema,
    issueDate: z.date(),
    expiryDate: z.date().optional(),
    credentialUrl: URLSchema
  })).optional()
});

export const FreelancerPortfolioSchema = z.object({
  projects: z.array(z.object({
    title: NonEmptyStringSchema,
    description: z.string().min(50, 'Description should be at least 50 characters'),
    technologies: z.array(z.string()).min(1, 'At least one technology required'),
    projectUrl: URLSchema,
    imageUrl: URLSchema,
    completionDate: z.date(),
    clientTestimonial: z.string().optional()
  })).min(2, 'At least 2 portfolio projects required'),
  githubUrl: URLSchema,
  linkedinUrl: URLSchema,
  websiteUrl: URLSchema
});

// Vendor validation schemas
export const VendorCompanyInfoSchema = z.object({
  companyName: NonEmptyStringSchema,
  legalName: NonEmptyStringSchema,
  registrationNumber: NonEmptyStringSchema,
  taxId: NonEmptyStringSchema,
  incorporationDate: z.date(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']),
  industry: NonEmptyStringSchema,
  website: URLSchema,
  headquarters: z.object({
    address: NonEmptyStringSchema,
    city: NonEmptyStringSchema,
    state: NonEmptyStringSchema,
    country: NonEmptyStringSchema,
    postalCode: NonEmptyStringSchema
  }),
  description: z.string().min(100, 'Company description should be at least 100 characters')
});

export const VendorServiceCatalogSchema = z.object({
  services: z.array(z.object({
    name: NonEmptyStringSchema,
    description: z.string().min(50, 'Service description should be at least 50 characters'),
    category: NonEmptyStringSchema,
    pricing: z.object({
      model: z.enum(['fixed', 'hourly', 'project', 'retainer']),
      basePrice: z.number().min(0, 'Price cannot be negative'),
      currency: z.string().length(3, 'Currency must be 3 characters')
    }),
    deliveryTime: z.string(),
    expertise: z.enum(['junior', 'mid', 'senior', 'expert'])
  })).min(1, 'At least one service required'),
  specializations: z.array(z.string()).min(1, 'At least one specialization required')
});

// Customer validation schemas
export const CustomerOrganizationInfoSchema = z.object({
  organizationName: NonEmptyStringSchema,
  industry: NonEmptyStringSchema,
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']),
  website: URLSchema,
  description: z.string().min(50, 'Organization description should be at least 50 characters'),
  headquarters: z.object({
    country: NonEmptyStringSchema,
    city: NonEmptyStringSchema,
    timezone: NonEmptyStringSchema
  }),
  contactInfo: z.object({
    primaryEmail: EmailSchema,
    primaryPhone: PhoneSchema,
    supportEmail: EmailSchema
  })
});

export const CustomerRequirementsSchema = z.object({
  projectTypes: z.array(z.enum(['web_development', 'mobile_development', 'ai_ml', 'data_science', 'design', 'marketing', 'consulting'])).min(1, 'At least one project type required'),
  budgetRange: z.object({
    min: z.number().min(0, 'Minimum budget cannot be negative'),
    max: z.number().min(0, 'Maximum budget cannot be negative'),
    currency: z.string().length(3, 'Currency must be 3 characters')
  }),
  timeline: z.object({
    urgency: z.enum(['urgent', 'standard', 'flexible']),
    expectedDuration: z.string()
  }),
  qualityRequirements: z.object({
    minimumRating: z.number().min(1).max(5),
    requiresVerification: z.boolean(),
    requiresPortfolio: z.boolean()
  })
});

// Validation functions
export class OnboardingValidator {
  static validateFreelancerProgress(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const missingRequiredFields: string[] = [];
    const recommendations: string[] = [];

    // Personal Info validation
    try {
      FreelancerPersonalInfoSchema.parse(data.personalInfo || {});
    } catch (e) {
      if (e instanceof z.ZodError) {
        e.errors.forEach(err => {
          errors.push({
            field: `personalInfo.${err.path.join('.')}`,
            message: err.message,
            severity: 'high',
            code: 'VALIDATION_ERROR'
          });
          missingRequiredFields.push(`personalInfo.${err.path.join('.')}`);
        });
      }
    }

    // Professional Info validation
    try {
      FreelancerProfessionalInfoSchema.parse(data.professionalInfo || {});
    } catch (e) {
      if (e instanceof z.ZodError) {
        e.errors.forEach(err => {
          errors.push({
            field: `professionalInfo.${err.path.join('.')}`,
            message: err.message,
            severity: 'high',
            code: 'VALIDATION_ERROR'
          });
          missingRequiredFields.push(`professionalInfo.${err.path.join('.')}`);
        });
      }
    }

    // Portfolio validation
    try {
      FreelancerPortfolioSchema.parse(data.portfolio || {});
    } catch (e) {
      if (e instanceof z.ZodError) {
        e.errors.forEach(err => {
          const severity = err.path.includes('projects') ? 'critical' : 'medium';
          errors.push({
            field: `portfolio.${err.path.join('.')}`,
            message: err.message,
            severity,
            code: 'VALIDATION_ERROR'
          });
          if (severity === 'critical') {
            missingRequiredFields.push(`portfolio.${err.path.join('.')}`);
          }
        });
      }
    }

    // Quality checks and warnings
    this.addFreelancerQualityChecks(data, warnings, recommendations);

    const completionPercentage = this.calculateCompletionPercentage(data, 'freelancer');
    const score = Math.max(0, 100 - (errors.length * 10) - (warnings.length * 2));

    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      score,
      errors,
      warnings,
      completionPercentage,
      missingRequiredFields,
      recommendations
    };
  }

  static validateVendorProgress(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const missingRequiredFields: string[] = [];
    const recommendations: string[] = [];

    // Company Info validation
    try {
      VendorCompanyInfoSchema.parse(data.companyInfo || {});
    } catch (e) {
      if (e instanceof z.ZodError) {
        e.errors.forEach(err => {
          errors.push({
            field: `companyInfo.${err.path.join('.')}`,
            message: err.message,
            severity: 'critical',
            code: 'VALIDATION_ERROR'
          });
          missingRequiredFields.push(`companyInfo.${err.path.join('.')}`);
        });
      }
    }

    // Service Catalog validation
    try {
      VendorServiceCatalogSchema.parse(data.serviceCatalog || {});
    } catch (e) {
      if (e instanceof z.ZodError) {
        e.errors.forEach(err => {
          errors.push({
            field: `serviceCatalog.${err.path.join('.')}`,
            message: err.message,
            severity: 'high',
            code: 'VALIDATION_ERROR'
          });
          missingRequiredFields.push(`serviceCatalog.${err.path.join('.')}`);
        });
      }
    }

    // Quality checks
    this.addVendorQualityChecks(data, warnings, recommendations);

    const completionPercentage = this.calculateCompletionPercentage(data, 'vendor');
    const score = Math.max(0, 100 - (errors.length * 15) - (warnings.length * 3));

    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      score,
      errors,
      warnings,
      completionPercentage,
      missingRequiredFields,
      recommendations
    };
  }

  static validateCustomerProgress(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const missingRequiredFields: string[] = [];
    const recommendations: string[] = [];

    // Organization Info validation
    try {
      CustomerOrganizationInfoSchema.parse(data.organizationInfo || {});
    } catch (e) {
      if (e instanceof z.ZodError) {
        e.errors.forEach(err => {
          const severity = err.path.includes('organizationName') ? 'critical' : 'high';
          errors.push({
            field: `organizationInfo.${err.path.join('.')}`,
            message: err.message,
            severity,
            code: 'VALIDATION_ERROR'
          });
          if (severity === 'critical') {
            missingRequiredFields.push(`organizationInfo.${err.path.join('.')}`);
          }
        });
      }
    }

    // Requirements validation
    try {
      CustomerRequirementsSchema.parse(data.requirements || {});
    } catch (e) {
      if (e instanceof z.ZodError) {
        e.errors.forEach(err => {
          errors.push({
            field: `requirements.${err.path.join('.')}`,
            message: err.message,
            severity: 'medium',
            code: 'VALIDATION_ERROR'
          });
        });
      }
    }

    // Quality checks
    this.addCustomerQualityChecks(data, warnings, recommendations);

    const completionPercentage = this.calculateCompletionPercentage(data, 'customer');
    const score = Math.max(0, 100 - (errors.length * 8) - (warnings.length * 2));

    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      score,
      errors,
      warnings,
      completionPercentage,
      missingRequiredFields,
      recommendations
    };
  }

  private static addFreelancerQualityChecks(
    data: any, 
    warnings: ValidationWarning[], 
    recommendations: string[]
  ) {
    const personalInfo = data.personalInfo || {};
    const professionalInfo = data.professionalInfo || {};
    const portfolio = data.portfolio || {};

    // Profile completeness checks
    if (!personalInfo.profileImage) {
      warnings.push({
        field: 'personalInfo.profileImage',
        message: 'Profile image missing',
        suggestion: 'Add a professional profile photo to increase trust',
        code: 'PROFILE_INCOMPLETE'
      });
      recommendations.push('Upload a professional profile photo');
    }

    if (professionalInfo.hourlyRate < 15) {
      warnings.push({
        field: 'professionalInfo.hourlyRate',
        message: 'Hourly rate may be too low',
        suggestion: 'Consider increasing your rate to reflect your skills',
        code: 'LOW_RATE'
      });
    }

    if ((professionalInfo.skills || []).length < 5) {
      recommendations.push('Add more skills to increase your visibility');
    }

    if ((portfolio.projects || []).length < 3) {
      recommendations.push('Add more portfolio projects to showcase your expertise');
    }
  }

  private static addVendorQualityChecks(
    data: any, 
    warnings: ValidationWarning[], 
    recommendations: string[]
  ) {
    const companyInfo = data.companyInfo || {};
    const serviceCatalog = data.serviceCatalog || {};

    if (!companyInfo.website) {
      warnings.push({
        field: 'companyInfo.website',
        message: 'Company website missing',
        suggestion: 'Add your company website to build credibility',
        code: 'WEBSITE_MISSING'
      });
    }

    if ((serviceCatalog.services || []).length < 3) {
      recommendations.push('Add more services to attract a wider range of clients');
    }

    if (companyInfo.description && companyInfo.description.length < 200) {
      recommendations.push('Expand your company description to better showcase your capabilities');
    }
  }

  private static addCustomerQualityChecks(
    data: any, 
    warnings: ValidationWarning[], 
    recommendations: string[]
  ) {
    const organizationInfo = data.organizationInfo || {};
    const requirements = data.requirements || {};

    if (!organizationInfo.website) {
      warnings.push({
        field: 'organizationInfo.website',
        message: 'Organization website missing',
        suggestion: 'Add your organization website for verification',
        code: 'WEBSITE_MISSING'
      });
    }

    if (requirements.budgetRange && requirements.budgetRange.max < 1000) {
      warnings.push({
        field: 'requirements.budgetRange.max',
        message: 'Budget range may limit available talent',
        suggestion: 'Consider increasing budget for access to higher-quality freelancers',
        code: 'LOW_BUDGET'
      });
    }
  }

  private static calculateCompletionPercentage(data: any, userType: string): number {
    const requiredFields = this.getRequiredFields(userType);
    const completedFields = this.getCompletedFields(data, requiredFields);
    
    return Math.round((completedFields / requiredFields.length) * 100);
  }

  private static getRequiredFields(userType: string): string[] {
    switch (userType) {
      case 'freelancer':
        return [
          'personalInfo.firstName', 'personalInfo.lastName', 'personalInfo.email',
          'professionalInfo.title', 'professionalInfo.experience', 'professionalInfo.hourlyRate',
          'portfolio.projects'
        ];
      case 'vendor':
        return [
          'companyInfo.companyName', 'companyInfo.registrationNumber', 'companyInfo.industry',
          'serviceCatalog.services'
        ];
      case 'customer':
        return [
          'organizationInfo.organizationName', 'organizationInfo.industry',
          'requirements.projectTypes', 'requirements.budgetRange'
        ];
      default:
        return [];
    }
  }

  private static getCompletedFields(data: any, requiredFields: string[]): number {
    return requiredFields.filter(field => {
      const value = this.getNestedValue(data, field);
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
      return value !== undefined && value !== null && value !== '';
    }).length;
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

// Validation helper functions
export const validateEmail = (email: string): boolean => {
  return EmailSchema.safeParse(email).success;
};

export const validatePhone = (phone: string): boolean => {
  return PhoneSchema.safeParse(phone).success;
};

export const validateURL = (url: string): boolean => {
  return URLSchema.safeParse(url).success;
};

export const getValidationSummary = (result: ValidationResult): string => {
  if (result.isValid && result.completionPercentage === 100) {
    return 'Profile is complete and valid ✅';
  }
  
  if (result.errors.length > 0) {
    const criticalErrors = result.errors.filter(e => e.severity === 'critical').length;
    if (criticalErrors > 0) {
      return `${criticalErrors} critical error(s) need attention ❌`;
    }
    return `${result.errors.length} error(s) found ⚠️`;
  }

  if (result.completionPercentage < 100) {
    return `${result.completionPercentage}% complete - ${100 - result.completionPercentage}% remaining`;
  }

  return `${result.warnings.length} warning(s) found ⚠️`;
};