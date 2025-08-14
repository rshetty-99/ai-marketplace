/**
 * API Types and Interfaces
 * Comprehensive type definitions for all API requests and responses
 */

import { 
  Organization, 
  Subsidiary, 
  Service, 
  Provider, 
  Project, 
  Booking, 
  Payment, 
  ChannelPartner, 
  Analytics 
} from '@/lib/firebase/collections';

// Base API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
  filters?: Record<string, any>;
  sort?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: string | number | boolean | string[] | number[] | undefined;
}

// Authentication API Types
export interface AuthValidateRequest {
  token: string;
}

export interface AuthValidateResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    organizationId?: string;
    roles: string[];
    permissions: string[];
  };
  expiresAt?: string;
}

export interface AuthRefreshRequest {
  refreshToken: string;
}

export interface AuthRefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthPermissionsRequest {
  userId: string;
  permissions: string[];
  resourceId?: string;
}

export interface AuthPermissionsResponse {
  hasPermission: boolean;
  permissions: Record<string, boolean>;
}

// Organizations API Types
export interface CreateOrganizationRequest {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  description?: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  settings?: Partial<Organization['settings']>;
  billing?: Partial<Organization['billing']>;
}

export interface UpdateOrganizationRequest {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  logo?: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  settings?: Partial<Organization['settings']>;
  billing?: Partial<Organization['billing']>;
}

export interface OrganizationsListRequest extends PaginationParams, SortParams {
  search?: string;
  industry?: string;
  size?: string;
  subscription?: string;
  isActive?: boolean;
}

export interface OrganizationAnalyticsRequest {
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
  metrics?: string[];
}

// Subsidiaries API Types
export interface CreateSubsidiaryRequest {
  parentOrganizationId: string;
  name: string;
  email: string;
  description?: string;
  settings?: Partial<Organization['settings']>;
  budget?: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  permissions: string[];
}

export interface UpdateSubsidiaryRequest extends Partial<CreateSubsidiaryRequest> {}

// Services API Types
export interface CreateServiceRequest {
  providerId: string;
  organizationId?: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  pricing: Service['pricing'];
  requirements: string[];
  deliverables: string[];
  timeline: Service['timeline'];
  portfolio?: Service['portfolio'];
  availability: Service['availability'];
}

export interface UpdateServiceRequest extends Partial<CreateServiceRequest> {
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface ServicesSearchRequest extends PaginationParams, SortParams {
  query?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
  pricingType?: 'fixed' | 'hourly' | 'project' | 'retainer';
  location?: string;
  availability?: 'available' | 'busy' | 'unavailable';
  rating?: number;
  providerId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface ServiceReviewsRequest extends PaginationParams, SortParams {
  minRating?: number;
  maxRating?: number;
}

// Providers API Types
export interface CreateProviderRequest {
  clerkUserId: string;
  type: 'freelancer' | 'agency' | 'consultant';
  profile: Provider['profile'];
  skills: Provider['skills'];
  experience?: Provider['experience'];
  education?: Provider['education'];
  certifications?: Provider['certifications'];
  portfolio?: Provider['portfolio'];
  preferences: Provider['preferences'];
  tier?: 'verified' | 'premium' | 'enterprise';
}

export interface UpdateProviderRequest extends Partial<CreateProviderRequest> {
  status?: 'active' | 'inactive' | 'suspended';
  isAvailable?: boolean;
}

export interface ProvidersSearchRequest extends PaginationParams, SortParams {
  query?: string;
  skills?: string[];
  location?: string;
  type?: 'freelancer' | 'agency' | 'consultant';
  tier?: 'verified' | 'premium' | 'enterprise';
  isAvailable?: boolean;
  minRating?: number;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  timezone?: string;
}

export interface ProviderAnalyticsRequest {
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
  metrics?: string[];
}

// Projects API Types
export interface CreateProjectRequest {
  organizationId: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  requirements: Project['requirements'];
  budget: Project['budget'];
  timeline: Project['timeline'];
  attachments?: Project['attachments'];
  visibility?: 'public' | 'private' | 'invite_only';
  isUrgent?: boolean;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
}

export interface ProjectsSearchRequest extends PaginationParams, SortParams {
  query?: string;
  category?: string;
  subcategory?: string;
  skills?: string[];
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: 'fixed' | 'hourly';
  experience?: 'entry' | 'intermediate' | 'senior' | 'expert';
  location?: 'remote' | 'onsite' | 'hybrid';
  organizationId?: string;
  status?: string;
  visibility?: string;
  isUrgent?: boolean;
}

export interface ProjectApplicationRequest {
  providerId: string;
  coverLetter: string;
  proposedBudget: number;
  proposedTimeline: string;
  milestones?: Array<{
    title: string;
    description: string;
    timeline: string;
    budget: number;
  }>;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

// Bookings API Types
export interface CreateBookingRequest {
  projectId?: string;
  organizationId: string;
  providerId: string;
  serviceId?: string;
  type: 'consultation' | 'project' | 'support';
  details: Booking['details'];
  scheduling: Booking['scheduling'];
  budget: Booking['budget'];
  milestones?: Booking['milestones'];
}

export interface UpdateBookingRequest extends Partial<CreateBookingRequest> {
  status?: 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
}

export interface BookingsListRequest extends PaginationParams, SortParams {
  organizationId?: string;
  providerId?: string;
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface BookingStatusUpdateRequest {
  status: 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  reason?: string;
  notify?: boolean;
}

export interface ScheduleAvailabilityRequest {
  providerId: string;
  startDate: string;
  endDate: string;
  timezone?: string;
}

export interface ScheduleAvailabilityResponse {
  availability: Array<{
    date: string;
    slots: Array<{
      start: string;
      end: string;
      available: boolean;
    }>;
  }>;
}

// Payments API Types
export interface ProcessPaymentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  type: 'deposit' | 'milestone' | 'final' | 'refund';
  paymentMethodId: string;
  escrowReleaseType?: 'automatic' | 'manual';
  description?: string;
}

export interface PaymentWebhookRequest {
  eventType: string;
  data: Record<string, any>;
  signature: string;
}

export interface PaymentsListRequest extends PaginationParams, SortParams {
  organizationId?: string;
  providerId?: string;
  bookingId?: string;
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface InvoiceRequest {
  paymentId: string;
  generatePdf?: boolean;
}

export interface SubscriptionRequest {
  organizationId: string;
  plan: 'free' | 'professional' | 'enterprise';
  billingCycle: 'monthly' | 'yearly';
  paymentMethodId: string;
}

// Channel Partners API Types
export interface CreateChannelPartnerRequest {
  clerkUserId: string;
  type: 'reseller' | 'integrator' | 'consultant' | 'agency';
  profile: ChannelPartner['profile'];
  partnership: ChannelPartner['partnership'];
  whiteLabel?: ChannelPartner['whiteLabel'];
}

export interface UpdateChannelPartnerRequest extends Partial<CreateChannelPartnerRequest> {
  status?: 'active' | 'inactive' | 'suspended';
}

export interface ChannelPartnersListRequest extends PaginationParams, SortParams {
  type?: string;
  tier?: string;
  status?: string;
  territory?: string;
  specializations?: string[];
}

export interface CommissionTrackingRequest extends PaginationParams {
  partnerId: string;
  startDate?: string;
  endDate?: string;
}

export interface ReferralRequest {
  partnerId: string;
  organizationId: string;
  referralCode?: string;
}

// Admin API Types
export interface AdminUsersListRequest extends PaginationParams, SortParams {
  search?: string;
  role?: string;
  status?: string;
  organizationId?: string;
  createdAfter?: string;
  createdBefore?: string;
}

export interface AdminUserUpdateRequest {
  status?: 'active' | 'inactive' | 'suspended';
  roles?: string[];
  organizationId?: string;
  reason?: string;
}

export interface AdminAnalyticsRequest {
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
  metrics?: string[];
  groupBy?: string[];
}

export interface ModerationRequest {
  resourceType: 'provider' | 'service' | 'project' | 'review';
  resourceId: string;
  action: 'approve' | 'reject' | 'flag' | 'unflag';
  reason?: string;
  notify?: boolean;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, {
    status: 'up' | 'down';
    responseTime?: number;
    lastCheck: string;
  }>;
  version: string;
  uptime: number;
}

// Search and AI API Types
export interface AIMatchingRequest {
  projectId?: string;
  requirements: {
    skills: string[];
    experience: string;
    budget: { min: number; max: number; };
    timeline: string;
    description: string;
  };
  filters?: {
    location?: string;
    timezone?: string;
    availability?: string;
    tier?: string[];
  };
  limit?: number;
}

export interface AIMatchingResponse {
  matches: Array<{
    providerId: string;
    score: number;
    reasons: string[];
    provider: {
      id: string;
      name: string;
      title: string;
      avatar?: string;
      rating: number;
      completedProjects: number;
      skills: string[];
      hourlyRate: number;
    };
  }>;
  searchId: string;
  totalResults: number;
}

export interface SearchSuggestionsRequest {
  query: string;
  type: 'skills' | 'categories' | 'providers' | 'services';
  limit?: number;
}

export interface SearchSuggestionsResponse {
  suggestions: Array<{
    text: string;
    type: string;
    score: number;
    metadata?: Record<string, any>;
  }>;
}

// Notification API Types
export interface NotificationRequest {
  userId: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  template: string;
  data: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  scheduledFor?: string;
}

export interface NotificationsListRequest extends PaginationParams {
  userId: string;
  type?: string;
  read?: boolean;
  startDate?: string;
  endDate?: string;
}

// File Upload API Types
export interface FileUploadRequest {
  file: File;
  type: 'avatar' | 'document' | 'portfolio' | 'attachment';
  resourceId: string;
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadId: string;
}

// Export Request Types
export interface DataExportRequest {
  type: 'projects' | 'providers' | 'payments' | 'analytics';
  format: 'csv' | 'json' | 'xlsx';
  filters?: Record<string, any>;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface DataExportResponse {
  exportId: string;
  status: 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: string;
}

// Integration API Types
export interface IntegrationRequest {
  type: 'stripe' | 'sendgrid' | 'twilio' | 'google_analytics' | 'zoom' | 'slack';
  organizationId: string;
  credentials: Record<string, any>;
  settings?: Record<string, any>;
}

export interface IntegrationStatusResponse {
  connected: boolean;
  lastSync?: string;
  status: 'active' | 'error' | 'disabled';
  error?: string;
}

// Webhook API Types
export interface WebhookEvent {
  id: string;
  type: string;
  version: string;
  timestamp: string;
  data: Record<string, any>;
  organizationId?: string;
}

export interface WebhookSubscriptionRequest {
  url: string;
  events: string[];
  secret?: string;
  enabled?: boolean;
}

// Rate Limiting Types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Error Codes
export enum ApiErrorCodes {
  // Authentication
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Resources
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Business Logic
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  PROJECT_NOT_AVAILABLE = 'PROJECT_NOT_AVAILABLE',
  BOOKING_CONFLICT = 'BOOKING_CONFLICT',
  
  // System
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Payment
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_DISPUTED = 'PAYMENT_DISPUTED',
  ESCROW_RELEASE_FAILED = 'ESCROW_RELEASE_FAILED',
}

// HTTP Status Codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}