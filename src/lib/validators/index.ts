import { z } from 'zod';

/**
 * Comprehensive Zod validation schemas for API endpoints
 * Includes input sanitization and data validation
 */

// Common validation schemas
export const IdSchema = z.string().min(1, 'ID is required');

export const EmailSchema = z
  .string()
  .email('Invalid email format')
  .transform(email => email.toLowerCase().trim());

export const PhoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional();

export const UrlSchema = z
  .string()
  .url('Invalid URL format')
  .optional();

export const CurrencySchema = z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD'], {
  errorMap: () => ({ message: 'Unsupported currency' })
});

export const TimezoneSchema = z.string().min(1, 'Timezone is required');

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional()
});

export const SortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, 'End date must be after start date');

// Text sanitization
const sanitizeHtml = (text: string) => {
  // Basic HTML sanitization - in production use a proper library like DOMPurify
  return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
             .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
             .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
             .replace(/<embed\b[^<]*>/gi, '');
};

export const SanitizedTextSchema = z
  .string()
  .transform(sanitizeHtml)
  .refine(text => text.length > 0, 'Text cannot be empty after sanitization');

export const TagsSchema = z
  .array(z.string().min(1).max(50))
  .max(20, 'Maximum 20 tags allowed')
  .transform(tags => tags.map(tag => tag.toLowerCase().trim()));

// Authentication schemas
export const AuthValidateSchema = z.object({
  token: z.string().min(1, 'Token is required')
});

export const AuthRefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export const AuthPermissionsSchema = z.object({
  userId: IdSchema,
  permissions: z.array(z.string()),
  resourceId: z.string().optional()
});

// Organization schemas
export const CreateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).transform(name => name.trim()),
  email: EmailSchema,
  phone: PhoneSchema,
  website: UrlSchema,
  description: z.string().max(2000).optional().transform(desc => desc ? sanitizeHtml(desc) : undefined),
  industry: z.string().max(100).optional(),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  settings: z.object({
    timezone: TimezoneSchema.optional(),
    currency: CurrencySchema.optional(),
    language: z.string().length(2).default('en'),
    notifications: z.object({
      email: z.boolean().default(true),
      sms: z.boolean().default(false),
      push: z.boolean().default(true)
    }).optional(),
    security: z.object({
      twoFactorRequired: z.boolean().default(false),
      ipWhitelist: z.array(z.string().ip()).optional(),
      ssoEnabled: z.boolean().default(false)
    }).optional()
  }).optional(),
  billing: z.object({
    address: z.object({
      street: z.string().min(1).max(255),
      city: z.string().min(1).max(100),
      state: z.string().min(1).max(100),
      zipCode: z.string().min(1).max(20),
      country: z.string().length(2).toUpperCase()
    }),
    taxId: z.string().max(50).optional(),
    paymentMethodId: z.string().optional()
  }).optional()
});

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();

export const OrganizationsListSchema = PaginationSchema.merge(SortSchema).merge(z.object({
  search: z.string().max(255).optional(),
  industry: z.string().max(100).optional(),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  subscription: z.enum(['free', 'professional', 'enterprise']).optional(),
  isActive: z.coerce.boolean().optional()
}));

// Subsidiary schemas
export const CreateSubsidiarySchema = z.object({
  parentOrganizationId: IdSchema,
  name: z.string().min(1).max(255).transform(name => name.trim()),
  email: EmailSchema,
  description: z.string().max(1000).optional().transform(desc => desc ? sanitizeHtml(desc) : undefined),
  budget: z.object({
    monthly: z.number().min(0),
    yearly: z.number().min(0),
    currency: CurrencySchema
  }).optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission required')
});

export const UpdateSubsidiarySchema = CreateSubsidiarySchema.partial();

// Service schemas
export const ServicePricingSchema = z.object({
  type: z.enum(['fixed', 'hourly', 'project', 'retainer']),
  amount: z.number().min(0),
  currency: CurrencySchema,
  packages: z.array(z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).transform(sanitizeHtml),
    price: z.number().min(0),
    deliverables: z.array(z.string().min(1).max(200)),
    timeline: z.string().max(100)
  })).optional()
});

export const ServiceTimelineSchema = z.object({
  estimated: z.string().max(100),
  rush: z.object({
    available: z.boolean(),
    multiplier: z.number().min(1).max(5),
    description: z.string().max(200)
  }).optional()
});

export const ServiceAvailabilitySchema = z.object({
  status: z.enum(['available', 'busy', 'unavailable']),
  nextAvailable: z.string().datetime().optional(),
  workingHours: z.object({
    timezone: TimezoneSchema,
    schedule: z.record(z.string(), z.object({
      start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
      end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    }))
  })
});

export const CreateServiceSchema = z.object({
  providerId: IdSchema,
  organizationId: IdSchema.optional(),
  title: z.string().min(1).max(200).transform(title => title.trim()),
  description: SanitizedTextSchema.max(5000),
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).optional(),
  tags: TagsSchema,
  pricing: ServicePricingSchema,
  requirements: z.array(z.string().min(1).max(200)).min(1),
  deliverables: z.array(z.string().min(1).max(200)).min(1),
  timeline: ServiceTimelineSchema,
  portfolio: z.array(z.object({
    title: z.string().min(1).max(100),
    description: SanitizedTextSchema.max(1000),
    imageUrl: z.string().url(),
    projectUrl: UrlSchema,
    technologies: TagsSchema.optional()
  })).optional(),
  availability: ServiceAvailabilitySchema
});

export const UpdateServiceSchema = CreateServiceSchema.partial().merge(z.object({
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional()
}));

export const ServicesSearchSchema = PaginationSchema.merge(SortSchema).merge(z.object({
  query: z.string().max(255).optional(),
  category: z.string().max(100).optional(),
  subcategory: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  pricingType: z.enum(['fixed', 'hourly', 'project', 'retainer']).optional(),
  location: z.string().max(100).optional(),
  availability: z.enum(['available', 'busy', 'unavailable']).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  providerId: IdSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional()
}));

// Provider schemas
export const ProviderProfileSchema = z.object({
  firstName: z.string().min(1).max(100).transform(name => name.trim()),
  lastName: z.string().min(1).max(100).transform(name => name.trim()),
  email: EmailSchema,
  phone: PhoneSchema,
  avatar: z.string().url().optional(),
  title: z.string().min(1).max(200).transform(title => title.trim()),
  bio: SanitizedTextSchema.max(2000),
  location: z.object({
    country: z.string().length(2).toUpperCase(),
    city: z.string().max(100).optional(),
    timezone: TimezoneSchema
  }),
  website: UrlSchema,
  socialLinks: z.record(z.string(), z.string().url()).optional()
});

export const ProviderSkillSchema = z.object({
  name: z.string().min(1).max(100).transform(name => name.trim()),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  yearsOfExperience: z.number().min(0).max(50),
  verified: z.boolean().default(false)
});

export const CreateProviderSchema = z.object({
  clerkUserId: IdSchema,
  type: z.enum(['freelancer', 'agency', 'consultant']),
  profile: ProviderProfileSchema,
  skills: z.array(ProviderSkillSchema).min(1, 'At least one skill required'),
  experience: z.array(z.object({
    title: z.string().min(1).max(200),
    company: z.string().min(1).max(200),
    description: SanitizedTextSchema.max(2000),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    technologies: TagsSchema.optional()
  })).optional(),
  education: z.array(z.object({
    degree: z.string().min(1).max(200),
    institution: z.string().min(1).max(200),
    fieldOfStudy: z.string().min(1).max(200),
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  })).optional(),
  certifications: z.array(z.object({
    name: z.string().min(1).max(200),
    issuer: z.string().min(1).max(200),
    issueDate: z.string().datetime(),
    expiryDate: z.string().datetime().optional(),
    credentialId: z.string().max(100).optional(),
    credentialUrl: UrlSchema
  })).optional(),
  preferences: z.object({
    workingHours: z.object({
      timezone: TimezoneSchema,
      availability: z.record(z.string(), z.object({
        start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
        end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
      }))
    }),
    projectTypes: z.array(z.string().max(100)).min(1),
    minimumBudget: z.number().min(0),
    currency: CurrencySchema,
    communicationMethods: z.array(z.string()).min(1)
  }),
  tier: z.enum(['verified', 'premium', 'enterprise']).optional()
});

export const UpdateProviderSchema = CreateProviderSchema.partial().merge(z.object({
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  isAvailable: z.boolean().optional()
}));

// Project schemas
export const ProjectRequirementsSchema = z.object({
  skills: TagsSchema.min(1, 'At least one skill required'),
  experience: z.enum(['entry', 'intermediate', 'senior', 'expert']),
  availability: z.string().max(200),
  location: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  timezone: TimezoneSchema.optional()
});

export const ProjectBudgetSchema = z.object({
  type: z.enum(['fixed', 'hourly']),
  min: z.number().min(0),
  max: z.number().min(0),
  currency: CurrencySchema
}).refine(data => data.max >= data.min, 'Max budget must be >= min budget');

export const ProjectTimelineSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  duration: z.string().max(100),
  milestones: z.array(z.object({
    title: z.string().min(1).max(200),
    description: SanitizedTextSchema.max(1000),
    dueDate: z.string().datetime(),
    budget: z.number().min(0).optional()
  })).optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, 'End date must be after start date');

export const CreateProjectSchema = z.object({
  organizationId: IdSchema,
  title: z.string().min(1).max(300).transform(title => title.trim()),
  description: SanitizedTextSchema.min(50).max(10000),
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).optional(),
  requirements: ProjectRequirementsSchema,
  budget: ProjectBudgetSchema,
  timeline: ProjectTimelineSchema,
  attachments: z.array(z.object({
    name: z.string().min(1).max(255),
    url: z.string().url(),
    type: z.string().max(100),
    size: z.number().min(0)
  })).optional(),
  visibility: z.enum(['public', 'private', 'invite_only']).default('public'),
  isUrgent: z.boolean().default(false)
});

export const UpdateProjectSchema = CreateProjectSchema.partial().merge(z.object({
  status: z.enum(['draft', 'published', 'in_progress', 'completed', 'cancelled']).optional()
}));

// Booking schemas
export const BookingDetailsSchema = z.object({
  title: z.string().min(1).max(300),
  description: SanitizedTextSchema.max(5000),
  requirements: z.array(z.string().max(200)).optional(),
  deliverables: z.array(z.string().max(200)).optional()
});

export const BookingSchedulingSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  timezone: TimezoneSchema,
  meetingUrl: UrlSchema,
  location: z.string().max(500).optional(),
  recurring: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    endDate: z.string().datetime().optional()
  }).optional()
});

export const BookingBudgetSchema = z.object({
  amount: z.number().min(0),
  currency: CurrencySchema,
  paymentType: z.enum(['hourly', 'fixed', 'milestone']),
  escrowReleaseType: z.enum(['automatic', 'manual']).default('manual')
});

export const CreateBookingSchema = z.object({
  projectId: IdSchema.optional(),
  organizationId: IdSchema,
  providerId: IdSchema,
  serviceId: IdSchema.optional(),
  type: z.enum(['consultation', 'project', 'support']),
  details: BookingDetailsSchema,
  scheduling: BookingSchedulingSchema,
  budget: BookingBudgetSchema,
  milestones: z.array(z.object({
    id: z.string(),
    title: z.string().min(1).max(200),
    description: SanitizedTextSchema.max(1000),
    dueDate: z.string().datetime(),
    payment: z.object({
      amount: z.number().min(0)
    }).optional()
  })).optional()
});

export const UpdateBookingSchema = CreateBookingSchema.partial().merge(z.object({
  status: z.enum(['requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed']).optional()
}));

// Payment schemas
export const ProcessPaymentSchema = z.object({
  bookingId: IdSchema,
  amount: z.number().min(0.01), // Minimum $0.01
  currency: CurrencySchema,
  type: z.enum(['deposit', 'milestone', 'final', 'refund']),
  paymentMethodId: z.string().min(1),
  escrowReleaseType: z.enum(['automatic', 'manual']).default('manual'),
  description: z.string().max(500).optional()
});

export const PaymentWebhookSchema = z.object({
  eventType: z.string().min(1),
  data: z.record(z.any()),
  signature: z.string().min(1)
});

// Channel Partner schemas
export const ChannelPartnerProfileSchema = z.object({
  companyName: z.string().min(1).max(255).transform(name => name.trim()),
  contactName: z.string().min(1).max(200).transform(name => name.trim()),
  email: EmailSchema,
  phone: PhoneSchema.transform(phone => phone || ''),
  website: UrlSchema,
  description: SanitizedTextSchema.max(2000),
  logo: z.string().url().optional(),
  certifications: z.array(z.string().max(200)).optional()
});

export const ChannelPartnershipSchema = z.object({
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  commissionRate: z.number().min(0).max(1), // 0-100% as decimal
  minimumCommitment: z.number().min(0).optional(),
  territory: z.array(z.string().length(2)).optional(), // Country codes
  specializations: z.array(z.string().max(100)).min(1)
});

export const CreateChannelPartnerSchema = z.object({
  clerkUserId: IdSchema,
  type: z.enum(['reseller', 'integrator', 'consultant', 'agency']),
  profile: ChannelPartnerProfileSchema,
  partnership: ChannelPartnershipSchema,
  whiteLabel: z.object({
    enabled: z.boolean().default(false),
    customDomain: z.string().url().optional(),
    branding: z.object({
      logo: z.string().url(),
      colors: z.record(z.string(), z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)),
      customCss: z.string().max(10000).optional()
    }).optional()
  }).optional()
});

// Admin schemas
export const AdminUsersListSchema = PaginationSchema.merge(SortSchema).merge(z.object({
  search: z.string().max(255).optional(),
  role: z.string().max(100).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  organizationId: IdSchema.optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional()
}));

export const AdminUserUpdateSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  roles: z.array(z.string()).optional(),
  organizationId: IdSchema.optional(),
  reason: z.string().max(500).optional()
});

export const ModerationSchema = z.object({
  resourceType: z.enum(['provider', 'service', 'project', 'review']),
  resourceId: IdSchema,
  action: z.enum(['approve', 'reject', 'flag', 'unflag']),
  reason: z.string().max(500).optional(),
  notify: z.boolean().default(true)
});

// AI and Search schemas
export const AIMatchingSchema = z.object({
  projectId: IdSchema.optional(),
  requirements: z.object({
    skills: TagsSchema.min(1),
    experience: z.enum(['entry', 'intermediate', 'senior', 'expert']),
    budget: z.object({
      min: z.number().min(0),
      max: z.number().min(0)
    }),
    timeline: z.string().max(200),
    description: SanitizedTextSchema.min(20).max(2000)
  }),
  filters: z.object({
    location: z.string().max(100).optional(),
    timezone: TimezoneSchema.optional(),
    availability: z.enum(['available', 'busy', 'unavailable']).optional(),
    tier: z.array(z.enum(['verified', 'premium', 'enterprise'])).optional()
  }).optional(),
  limit: z.number().min(1).max(50).default(10)
});

// File upload schemas
export const FileUploadSchema = z.object({
  type: z.enum(['avatar', 'document', 'portfolio', 'attachment']),
  resourceId: IdSchema,
  metadata: z.record(z.any()).optional()
});

// Notification schemas
export const NotificationSchema = z.object({
  userId: IdSchema,
  type: z.enum(['email', 'sms', 'push', 'in_app']),
  template: z.string().min(1).max(100),
  data: z.record(z.any()),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  scheduledFor: z.string().datetime().optional()
});

// Export all schemas
export const ValidationSchemas = {
  // Common
  Id: IdSchema,
  Email: EmailSchema,
  Phone: PhoneSchema,
  Url: UrlSchema,
  Currency: CurrencySchema,
  Timezone: TimezoneSchema,
  Pagination: PaginationSchema,
  Sort: SortSchema,
  DateRange: DateRangeSchema,
  SanitizedText: SanitizedTextSchema,
  Tags: TagsSchema,

  // Auth
  AuthValidate: AuthValidateSchema,
  AuthRefresh: AuthRefreshSchema,
  AuthPermissions: AuthPermissionsSchema,

  // Organizations
  CreateOrganization: CreateOrganizationSchema,
  UpdateOrganization: UpdateOrganizationSchema,
  OrganizationsList: OrganizationsListSchema,

  // Subsidiaries
  CreateSubsidiary: CreateSubsidiarySchema,
  UpdateSubsidiary: UpdateSubsidiarySchema,

  // Services
  CreateService: CreateServiceSchema,
  UpdateService: UpdateServiceSchema,
  ServicesSearch: ServicesSearchSchema,

  // Providers
  CreateProvider: CreateProviderSchema,
  UpdateProvider: UpdateProviderSchema,

  // Projects
  CreateProject: CreateProjectSchema,
  UpdateProject: UpdateProjectSchema,

  // Bookings
  CreateBooking: CreateBookingSchema,
  UpdateBooking: UpdateBookingSchema,

  // Payments
  ProcessPayment: ProcessPaymentSchema,
  PaymentWebhook: PaymentWebhookSchema,

  // Channel Partners
  CreateChannelPartner: CreateChannelPartnerSchema,

  // Admin
  AdminUsersList: AdminUsersListSchema,
  AdminUserUpdate: AdminUserUpdateSchema,
  Moderation: ModerationSchema,

  // AI and Search
  AIMatching: AIMatchingSchema,

  // Files and Notifications
  FileUpload: FileUploadSchema,
  Notification: NotificationSchema
} as const;

// Validation helper function
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodIssue[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }

  getFormattedErrors() {
    return this.errors.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code
    }));
  }
}