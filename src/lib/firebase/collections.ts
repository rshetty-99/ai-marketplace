import { 
  collection,
  doc,
  CollectionReference,
  DocumentReference,
  DocumentData 
} from 'firebase/firestore';
import { db } from '../firebase';

// Collection types
export interface Organization {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  description?: string;
  logo?: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  subscription: {
    plan: 'free' | 'professional' | 'enterprise';
    status: 'active' | 'inactive' | 'cancelled';
    trialEnd?: Date;
    billingCycle?: 'monthly' | 'yearly';
  };
  settings: {
    timezone: string;
    currency: string;
    language: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    security: {
      twoFactorRequired: boolean;
      ipWhitelist?: string[];
      ssoEnabled: boolean;
    };
  };
  billing: {
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    taxId?: string;
    paymentMethodId?: string;
  };
  parentOrganizationId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subsidiary {
  id: string;
  parentOrganizationId: string;
  name: string;
  email: string;
  description?: string;
  settings: Partial<Organization['settings']>;
  budget?: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  organizationId?: string;
  providerId: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  pricing: {
    type: 'fixed' | 'hourly' | 'project' | 'retainer';
    amount: number;
    currency: string;
    packages?: Array<{
      name: string;
      description: string;
      price: number;
      deliverables: string[];
      timeline: string;
    }>;
  };
  requirements: string[];
  deliverables: string[];
  timeline: {
    estimated: string;
    rush?: {
      available: boolean;
      multiplier: number;
      description: string;
    };
  };
  portfolio: Array<{
    title: string;
    description: string;
    imageUrl: string;
    projectUrl?: string;
    technologies?: string[];
  }>;
  availability: {
    status: 'available' | 'busy' | 'unavailable';
    nextAvailable?: Date;
    workingHours: {
      timezone: string;
      schedule: Record<string, { start: string; end: string; }>;
    };
  };
  reviews: {
    rating: number;
    count: number;
    lastReviewDate?: Date;
  };
  metadata: {
    views: number;
    inquiries: number;
    completedProjects: number;
    averageCompletionTime?: number;
  };
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Provider {
  id: string;
  clerkUserId: string;
  type: 'freelancer' | 'agency' | 'consultant';
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    title: string;
    bio: string;
    location: {
      country: string;
      city?: string;
      timezone: string;
    };
    website?: string;
    socialLinks?: Record<string, string>;
  };
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsOfExperience: number;
    verified: boolean;
  }>;
  experience: Array<{
    title: string;
    company: string;
    description: string;
    startDate: Date;
    endDate?: Date;
    technologies?: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    fieldOfStudy: string;
    startDate: Date;
    endDate: Date;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate: Date;
    expiryDate?: Date;
    credentialId?: string;
    credentialUrl?: string;
  }>;
  portfolio: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
    images: string[];
    projectUrl?: string;
    caseStudyUrl?: string;
    completedDate: Date;
    client?: {
      name: string;
      testimonial?: string;
      rating?: number;
    };
  }>;
  ratings: {
    overall: number;
    communication: number;
    quality: number;
    timeliness: number;
    count: number;
  };
  verification: {
    identityVerified: boolean;
    backgroundCheckCompleted: boolean;
    skillsVerified: string[];
    badgesEarned: string[];
  };
  preferences: {
    workingHours: {
      timezone: string;
      availability: Record<string, { start: string; end: string; }>;
    };
    projectTypes: string[];
    minimumBudget: number;
    currency: string;
    communicationMethods: string[];
  };
  tier: 'verified' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  requirements: {
    skills: string[];
    experience: 'entry' | 'intermediate' | 'senior' | 'expert';
    availability: string;
    location?: 'remote' | 'onsite' | 'hybrid';
    timezone?: string;
  };
  budget: {
    type: 'fixed' | 'hourly';
    min: number;
    max: number;
    currency: string;
  };
  timeline: {
    startDate?: Date;
    endDate?: Date;
    duration: string;
    milestones?: Array<{
      title: string;
      description: string;
      dueDate: Date;
      budget?: number;
    }>;
  };
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  applications: {
    count: number;
    shortlisted: string[];
    rejected: string[];
    interviews: string[];
  };
  assignedProvider?: {
    providerId: string;
    assignedAt: Date;
    agreedBudget: number;
    agreedTimeline: string;
  };
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
  aiMatching: {
    score?: number;
    reasons?: string[];
    suggestedProviders?: Array<{
      providerId: string;
      score: number;
      reasons: string[];
    }>;
  };
  visibility: 'public' | 'private' | 'invite_only';
  isUrgent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  projectId: string;
  organizationId: string;
  providerId: string;
  serviceId?: string;
  type: 'consultation' | 'project' | 'support';
  details: {
    title: string;
    description: string;
    requirements?: string[];
    deliverables?: string[];
  };
  scheduling: {
    startDate: Date;
    endDate?: Date;
    timezone: string;
    meetingUrl?: string;
    location?: string;
    recurring?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      endDate?: Date;
    };
  };
  budget: {
    amount: number;
    currency: string;
    paymentType: 'hourly' | 'fixed' | 'milestone';
    escrowReleaseType: 'automatic' | 'manual';
  };
  status: 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  communication: {
    messages: Array<{
      senderId: string;
      content: string;
      timestamp: Date;
      attachments?: string[];
    }>;
    lastActivity: Date;
  };
  milestones?: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: Date;
    status: 'pending' | 'completed' | 'overdue';
    payment?: {
      amount: number;
      releaseDate?: Date;
    };
  }>;
  review?: {
    organizationRating: number;
    organizationFeedback: string;
    providerRating: number;
    providerFeedback: string;
    submittedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  bookingId: string;
  organizationId: string;
  providerId: string;
  amount: number;
  currency: string;
  type: 'deposit' | 'milestone' | 'final' | 'refund';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'disputed' | 'refunded';
  gateway: 'stripe' | 'paypal' | 'bank_transfer';
  gatewayTransactionId?: string;
  escrow: {
    releasedAt?: Date;
    releaseType: 'automatic' | 'manual';
    disputeReason?: string;
    arbitration?: {
      status: 'requested' | 'in_review' | 'resolved';
      resolution?: string;
      resolvedAt?: Date;
    };
  };
  fees: {
    platformFee: number;
    processingFee: number;
    total: number;
  };
  invoice?: {
    number: string;
    url: string;
    issuedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelPartner {
  id: string;
  clerkUserId: string;
  type: 'reseller' | 'integrator' | 'consultant' | 'agency';
  profile: {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    website?: string;
    description: string;
    logo?: string;
    certifications?: string[];
  };
  partnership: {
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    commissionRate: number;
    minimumCommitment?: number;
    territory?: string[];
    specializations: string[];
  };
  clients: Array<{
    organizationId: string;
    referredAt: Date;
    status: 'active' | 'inactive';
    revenue: number;
    projects: number;
  }>;
  commission: {
    totalEarned: number;
    pendingAmount: number;
    lastPayment?: Date;
    paymentSchedule: 'monthly' | 'quarterly';
  };
  performance: {
    referrals: number;
    conversions: number;
    revenue: number;
    rating: number;
  };
  whiteLabel: {
    enabled: boolean;
    customDomain?: string;
    branding?: {
      logo: string;
      colors: Record<string, string>;
      customCss?: string;
    };
  };
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface Analytics {
  id: string;
  organizationId?: string;
  type: 'platform' | 'organization' | 'provider';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: Date;
  metrics: {
    users: {
      active: number;
      new: number;
      retained: number;
      churned: number;
    };
    projects: {
      created: number;
      completed: number;
      cancelled: number;
      inProgress: number;
    };
    revenue: {
      gross: number;
      net: number;
      fees: number;
      currency: string;
    };
    marketplace: {
      liquidityRatio: number;
      timeToFill: number;
      successRate: number;
      disputeRate: number;
    };
    performance: {
      averageRating: number;
      completionRate: number;
      onTimeDelivery: number;
      customerSatisfaction: number;
    };
  };
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  organizationId?: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  metadata: {
    userAgent: string;
    ipAddress: string;
    location?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

// Collection references with proper typing
export const collections = {
  organizations: collection(db, 'organizations') as CollectionReference<Organization>,
  subsidiaries: collection(db, 'subsidiaries') as CollectionReference<Subsidiary>,
  services: collection(db, 'services') as CollectionReference<Service>,
  providers: collection(db, 'providers') as CollectionReference<Provider>,
  projects: collection(db, 'projects') as CollectionReference<Project>,
  bookings: collection(db, 'bookings') as CollectionReference<Booking>,
  payments: collection(db, 'payments') as CollectionReference<Payment>,
  channelPartners: collection(db, 'channelPartners') as CollectionReference<ChannelPartner>,
  analytics: collection(db, 'analytics') as CollectionReference<Analytics>,
  auditLogs: collection(db, 'auditLogs') as CollectionReference<AuditLog>,
};

// Document reference helpers
export const getOrganizationDoc = (id: string): DocumentReference<Organization> => 
  doc(collections.organizations, id);

export const getSubsidiaryDoc = (id: string): DocumentReference<Subsidiary> => 
  doc(collections.subsidiaries, id);

export const getServiceDoc = (id: string): DocumentReference<Service> => 
  doc(collections.services, id);

export const getProviderDoc = (id: string): DocumentReference<Provider> => 
  doc(collections.providers, id);

export const getProjectDoc = (id: string): DocumentReference<Project> => 
  doc(collections.projects, id);

export const getBookingDoc = (id: string): DocumentReference<Booking> => 
  doc(collections.bookings, id);

export const getPaymentDoc = (id: string): DocumentReference<Payment> => 
  doc(collections.payments, id);

export const getChannelPartnerDoc = (id: string): DocumentReference<ChannelPartner> => 
  doc(collections.channelPartners, id);

export const getAnalyticsDoc = (id: string): DocumentReference<Analytics> => 
  doc(collections.analytics, id);

export const getAuditLogDoc = (id: string): DocumentReference<AuditLog> => 
  doc(collections.auditLogs, id);