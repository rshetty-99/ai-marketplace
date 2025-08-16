// Service Types - Based on Database Schema
import { Timestamp } from 'firebase/firestore';

export interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  updatedBy?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ContactInfo {
  email: string;
  phone?: string;
  website?: string;
  linkedIn?: string;
}

export interface Rating {
  averageRating: number;
  totalReviews: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  lastUpdated: Timestamp;
}

export interface PricingTier {
  name: string;
  price: number;
  features: string[];
  limitations?: string[];
  popular?: boolean;
}

export interface PricingModel {
  type: 'subscription' | 'usage_based' | 'project_based' | 'custom';
  startingPrice?: number;
  currency: string;
  billingCycle?: 'monthly' | 'annually' | 'one_time';
  tiers?: PricingTier[];
  customPricing: boolean;
}

export interface ServiceFeature {
  name: string;
  description: string;
  included: boolean;
  category?: string;
}

export interface APIInfo {
  name: string;
  version: string;
  documentation?: string;
  restEndpoint?: string;
  graphqlEndpoint?: string;
  sdks?: string[];
}

export interface Integration {
  name: string;
  type: 'api' | 'webhook' | 'plugin' | 'native';
  difficulty: 'easy' | 'medium' | 'complex';
  documentation?: string;
}

export interface SupportInfo {
  channels: ('email' | 'chat' | 'phone' | 'slack' | 'teams')[];
  hours: string;
  responseTime: string;
  languages: string[];
  dedicatedManager?: boolean;
}

export interface SecurityFeatures {
  authentication: string[];
  encryption: {
    atRest: boolean;
    inTransit: boolean;
    keyManagement: string;
  };
  accessControl: string[];
  monitoring: boolean;
  penetrationTesting: boolean;
  vulnerabilityScanning: boolean;
}

export type ServiceCategory = 
  | 'computer_vision'
  | 'natural_language_processing'
  | 'predictive_analytics'
  | 'machine_learning_ops'
  | 'conversational_ai'
  | 'recommendation_systems'
  | 'fraud_detection'
  | 'custom_development'
  | 'data_analytics'
  | 'automation';

export type ProviderType = 'vendor' | 'freelancer' | 'agency' | 'channel_partner';
export type ProviderSize = 'individual' | 'small' | 'medium' | 'large' | 'enterprise';

export interface ProviderInfo {
  id: string;
  name: string;
  type: ProviderType;
  size: ProviderSize;
  logo?: string;
  description?: string;
  website?: string;
  founded?: number;
  employeeCount?: string;
  headquarters?: Address;
  verification: {
    verified: boolean;
    certifications: string[];
    verifiedAt?: Timestamp;
  };
  rating: Rating;
}

export interface Service extends BaseDocument {
  // Provider Information
  providerId: string;
  providerName: string;
  providerLogo?: string;
  provider?: ProviderInfo;
  
  // Service Identification
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  
  // Categorization
  category: ServiceCategory;
  subcategory: string;
  tags: string[];
  industries: string[];
  useCases: string[];
  
  // Technical Information
  technical: {
    technologies: string[];
    frameworks: string[];
    languages: string[];
    platforms: string[];
    apis: APIInfo[];
    integrations: Integration[];
  };
  
  // Features & Pricing
  features: ServiceFeature[];
  pricing: PricingModel;
  
  // Implementation Details
  implementation: {
    timeline: {
      discovery: string;
      development: string;
      deployment: string;
      total: string;
    };
    complexity: 'low' | 'medium' | 'high' | 'enterprise';
    requirements: {
      technical: string[];
      business: string[];
      data: string[];
      infrastructure: string[];
    };
    support: SupportInfo;
  };
  
  // Availability & Deployment
  availability: {
    regions: string[];
    deploymentOptions: ('cloud' | 'on_premise' | 'hybrid' | 'saas')[];
    scalability: string;
    uptime: string;
  };
  
  // Compliance & Security
  compliance: {
    certifications: string[];
    regulations: string[];
    dataHandling: {
      dataRetention: string;
      dataLocation: string[];
      encryption: boolean;
      backups: boolean;
    };
    security: SecurityFeatures;
  };
  
  // Media & Documentation
  media: {
    logo?: string;
    screenshots: string[];
    videos: string[];
    demos: string[];
    whitepapers: string[];
    caseStudies: string[];
  };
  
  // Reviews & Ratings
  reviews: Rating & {
    dimensions: {
      quality: Rating;
      support: Rating;
      implementation: Rating;
      value: Rating;
    };
  };
  
  // Status & Visibility
  status: 'draft' | 'under_review' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'approved_only';
  featured: boolean;
  priority: number;
  
  // Statistics (updated via Cloud Functions)
  stats: {
    views: number;
    inquiries: number;
    demos: number;
    conversions: number;
    lastViewed: Timestamp;
    averageResponseTime: number;
  };
}

// Filter Types
export interface ServiceFilters {
  search?: string;
  category?: ServiceCategory | ServiceCategory[];
  subcategory?: string | string[];
  industries?: string | string[];
  providerType?: ProviderType | ProviderType[];
  providerSize?: ProviderSize | ProviderSize[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  pricingType?: PricingModel['type'] | PricingModel['type'][];
  technologies?: string | string[];
  deploymentOptions?: string | string[];
  regions?: string | string[];
  compliance?: string | string[];
  rating?: {
    min?: number;
    max?: number;
  };
  features?: string | string[];
  verified?: boolean;
  featured?: boolean;
}

export interface ServiceSortOptions {
  field: 'relevance' | 'rating' | 'price' | 'name' | 'created' | 'popularity';
  direction: 'asc' | 'desc';
}

// API Response Types
export interface ServiceSearchResponse {
  services: Service[];
  totalCount: number;
  hasMore: boolean;
  aggregations: {
    categories: { [key: string]: number };
    industries: { [key: string]: number };
    providerTypes: { [key: string]: number };
    priceRanges: { [key: string]: number };
    technologies: { [key: string]: number };
  };
}

export interface ServiceComparisonData {
  services: Service[];
  comparisonMatrix: {
    [serviceId: string]: {
      [feature: string]: {
        value: string | number | boolean;
        highlight?: boolean;
      };
    };
  };
}

// Form Types
export interface ServiceInquiry {
  serviceId: string;
  providerId: string;
  type: 'demo' | 'consultation' | 'quote' | 'information';
  contactInfo: {
    name: string;
    email: string;
    phone?: string;
    company: string;
    jobTitle?: string;
  };
  requirements: {
    budget?: string;
    timeline?: string;
    description: string;
    useCases?: string[];
  };
  preferredContact: 'email' | 'phone' | 'video_call';
  urgency: 'low' | 'medium' | 'high';
}

// Mock Data Types for Development
export interface MockServiceData {
  services: Service[];
  providers: ProviderInfo[];
  categories: {
    id: ServiceCategory;
    name: string;
    description: string;
    icon: string;
    subcategories: {
      id: string;
      name: string;
      description: string;
    }[];
  }[];
  industries: {
    id: string;
    name: string;
    serviceCount: number;
  }[];
  technologies: {
    id: string;
    name: string;
    category: string;
    popularity: number;
  }[];
}