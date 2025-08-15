# API Specifications - AI Marketplace Platform

## Executive Summary

This document defines the comprehensive REST API specifications for the AI Marketplace Platform using Next.js 15.4 App Router. The API follows RESTful principles with consistent patterns, comprehensive error handling, and robust security measures. All endpoints support the multi-tenant architecture and RBAC requirements.

### API Design Principles
- **RESTful Architecture:** Standard HTTP methods and status codes
- **Consistent Response Format:** Unified response structure across all endpoints
- **Multi-Tenant Support:** Organization-scoped data access and isolation
- **Security First:** Authentication, authorization, and rate limiting on all endpoints
- **Developer Friendly:** Comprehensive documentation and predictable patterns

## Base Configuration

### Base URLs
```
Production:  https://aimarketplace.com/api
Staging:     https://staging.aimarketplace.com/api
Development: http://localhost:3000/api
```

### Request/Response Format
```typescript
// Standard request headers
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>",
  "X-Organization-ID": "<org_id>", // Required for multi-tenant endpoints
  "X-API-Version": "v1"
}

// Standard success response
{
  "success": true,
  "data": any,
  "meta"?: {
    "pagination"?: PaginationMeta,
    "total"?: number,
    "filters"?: any
  }
}

// Standard error response
{
  "success": false,
  "error": {
    "code": string,
    "message": string,
    "details"?: any,
    "field"?: string // For validation errors
  },
  "meta"?: {
    "timestamp": string,
    "requestId": string
  }
}
```

## Authentication Endpoints

### POST /api/auth/signup
Register a new user account.

```typescript
interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationType: 'primary' | 'subsidiary' | 'channel_partner';
  organizationName: string;
  industry: string;
  companySize: 'startup' | 'sme' | 'midmarket' | 'enterprise';
  acceptedTerms: boolean;
}

// Response (201 Created)
interface SignupResponse {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      status: 'pending_verification';
    };
    organization: {
      id: string;
      name: string;
      type: string;
      status: 'active';
    };
    token: string;
    expiresIn: number;
  };
}
```

### POST /api/auth/signin
Authenticate existing user.

```typescript
interface SigninRequest {
  email: string;
  password: string;
  organizationId?: string; // Optional for multi-org users
}

// Response (200 OK)
interface SigninResponse {
  success: true;
  data: {
    user: User;
    organization: Organization;
    token: string;
    expiresIn: number;
    permissions: string[];
  };
}
```

## Service Management Endpoints

### GET /api/services
Retrieve services with filtering and pagination.

```typescript
interface ServicesQuery {
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 100
  category?: ServiceCategory;
  industry?: string[];
  technologies?: string[];
  minPrice?: number;
  maxPrice?: number;
  priceType?: 'subscription' | 'usage_based' | 'project_based';
  region?: string[];
  certification?: string[];
  sort?: 'rating' | 'price' | 'name' | 'created' | 'popularity';
  order?: 'asc' | 'desc';
  featured?: boolean;
  search?: string;
}

// Response (200 OK)
interface ServicesResponse {
  success: true;
  data: Service[];
  meta: {
    pagination: PaginationMeta;
    total: number;
    filters: {
      applied: ServicesQuery;
      available: {
        categories: { value: string; count: number }[];
        industries: { value: string; count: number }[];
        technologies: { value: string; count: number }[];
      };
    };
  };
}
```

### POST /api/services
Create a new service (Provider only).

```typescript
interface CreateServiceRequest {
  name: string;
  description: string;
  category: ServiceCategory;
  subcategory: string;
  tags?: string[];
  industries: string[];
  useCases: string[];
  technical: {
    technologies: string[];
    frameworks?: string[];
    platforms?: string[];
  };
  features: ServiceFeature[];
  pricing: PricingModel;
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
    };
  };
  compliance: {
    certifications: string[];
    regulations: string[];
  };
  status?: 'draft' | 'published';
}

// Response (201 Created)
interface CreateServiceResponse {
  success: true;
  data: {
    service: Service;
    message: string;
  };
}
```

## Booking Management Endpoints

### GET /api/bookings
Retrieve organization bookings.

```typescript
interface BookingsQuery {
  page?: number;
  limit?: number;
  status?: BookingStatus[];
  type?: BookingType[];
  providerId?: string;
  serviceId?: string;
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
  sort?: 'date' | 'status' | 'provider';
  order?: 'asc' | 'desc';
}

// Response (200 OK)
interface BookingsResponse {
  success: true;
  data: Booking[];
  meta: {
    pagination: PaginationMeta;
    total: number;
    stats: {
      upcoming: number;
      completed: number;
      cancelled: number;
    };
  };
}
```

### POST /api/bookings
Create a new booking.

```typescript
interface CreateBookingRequest {
  providerId: string;
  serviceId?: string;
  type: 'consultation' | 'demo' | 'workshop' | 'project_kickoff';
  title: string;
  description?: string;
  scheduledAt: string; // ISO datetime
  duration: number; // in minutes
  timezone: string;
  meetingDetails: {
    platform: 'zoom' | 'teams' | 'meet' | 'in_person' | 'phone';
    location?: Address; // For in-person meetings
  };
  participants: {
    buyer: {
      primaryContact: string; // User ID
      additionalAttendees?: BookingAttendee[];
      requirements?: string;
    };
  };
}

// Response (201 Created)
interface CreateBookingResponse {
  success: true;
  data: {
    booking: Booking;
    message: string;
    nextSteps: string[];
  };
}
```

## Provider Management Endpoints

### GET /api/providers
Retrieve providers with filtering.

```typescript
interface ProvidersQuery {
  page?: number;
  limit?: number;
  expertise?: ServiceCategory[];
  industries?: string[];
  regions?: string[];
  teamSize?: string;
  certifications?: string[];
  verified?: boolean;
  sort?: 'rating' | 'experience' | 'name' | 'responseTime';
  order?: 'asc' | 'desc';
  search?: string;
}

// Response (200 OK)
interface ProvidersResponse {
  success: true;
  data: Provider[];
  meta: {
    pagination: PaginationMeta;
    total: number;
  };
}
```

### POST /api/providers
Create provider profile (Organization only).

```typescript
interface CreateProviderRequest {
  companyName: string;
  description: string;
  website: string;
  business: {
    founded: number;
    legalName: string;
    businessType: 'sole_proprietorship' | 'partnership' | 'llc' | 'corporation';
  };
  team: {
    size: TeamSize;
    keyPersonnel: KeyPerson[];
  };
  expertise: {
    categories: ServiceCategory[];
    technologies: string[];
    industries: string[];
  };
  presence: {
    headquarters: Address;
    serviceAreas: string[];
    languages: string[];
  };
  contact: {
    primary: ContactInfo;
    sales?: ContactInfo;
  };
}

// Response (201 Created)
interface CreateProviderResponse {
  success: true;
  data: {
    provider: Provider;
    message: string;
  };
}
```

## Analytics Endpoints

### GET /api/analytics/dashboard
Get dashboard analytics data.

```typescript
interface AnalyticsQuery {
  period: 'today' | 'week' | 'month' | 'quarter' | 'year';
  dateFrom?: string;
  dateTo?: string;
  metrics?: string[];
}

// Response (200 OK)
interface AnalyticsDashboardResponse {
  success: true;
  data: {
    summary: {
      totalServices: number;
      totalBookings: number;
      conversionRate: number;
      averageResponseTime: number;
    };
    charts: {
      bookingsOverTime: TimeSeriesData[];
      inquiriesByCategory: CategoryData[];
    };
    trends: {
      bookingsGrowth: number;
      inquiriesGrowth: number;
    };
  };
}
```

### POST /api/analytics/events
Track custom analytics events.

```typescript
interface TrackEventRequest {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
}

// Response (200 OK)
interface TrackEventResponse {
  success: true;
  data: {
    eventId: string;
    message: string;
  };
}
```

## Error Handling

### Standard Error Codes
```typescript
enum ApiErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource Management
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Business Logic
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // System
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}
```

### Error Response Examples
```typescript
// Validation error (400)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request data is invalid",
    "details": [
      {
        "field": "email",
        "code": "INVALID_EMAIL",
        "message": "Please provide a valid email address"
      }
    ]
  }
}

// Resource not found (404)
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested service was not found",
    "details": {
      "resource": "service",
      "id": "srv_nonexistent"
    }
  }
}

// Rate limit exceeded (429)
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 300
    }
  }
}
```

## Rate Limiting

### Rate Limits by Category
```typescript
const rateLimits = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // Authenticated users
  },
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // Unauthenticated users
  },
};
```

This API specification provides comprehensive endpoints for the AI Marketplace Platform with proper authentication, validation, error handling, and rate limiting to support all product requirements and user workflows.