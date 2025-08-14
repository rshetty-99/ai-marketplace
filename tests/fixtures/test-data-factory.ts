import { faker } from '@faker-js/faker';
import type { User } from '@/lib/rbac/types';
import type { Organization, Service, Provider, Booking } from '@/types/api';

/**
 * Test data factory for generating consistent test data
 * Uses faker.js for realistic mock data generation
 */

export class TestDataFactory {
  // Set seed for consistent test data
  static setSeed(seed: number = 12345) {
    faker.seed(seed);
  }

  // Reset faker seed
  static resetSeed() {
    faker.seed();
  }

  /**
   * Organization factories
   */
  static createOrganization(overrides: Partial<Organization> = {}): Organization {
    return {
      id: faker.string.uuid(),
      name: faker.company.name(),
      slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
      logo: faker.image.url({ width: 200, height: 200 }),
      description: faker.company.catchPhrase(),
      type: faker.helpers.arrayElement(['primary', 'subsidiary', 'channel_partner'] as const),
      parentOrgId: overrides.type === 'subsidiary' ? faker.string.uuid() : undefined,
      childOrgIds: [],
      industry: faker.helpers.arrayElement([
        'technology',
        'healthcare',
        'finance',
        'retail',
        'manufacturing',
        'education',
        'consulting'
      ]),
      size: faker.helpers.arrayElement(['startup', 'sme', 'midmarket', 'enterprise'] as const),
      founded: faker.number.int({ min: 1990, max: 2023 }),
      website: faker.internet.url(),
      contactInfo: {
        email: faker.internet.email(),
        phone: faker.phone.number(),
        website: faker.internet.url(),
      },
      headquarters: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.countryCode(),
        postalCode: faker.location.zipCode(),
        coordinates: {
          latitude: faker.location.latitude(),
          longitude: faker.location.longitude(),
        },
      },
      operatingRegions: faker.helpers.arrayElements([
        'US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'IN'
      ], { min: 1, max: 4 }),
      timezone: faker.helpers.arrayElement([
        'America/New_York',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Berlin',
        'Asia/Tokyo',
      ]),
      subscription: {
        plan: faker.helpers.arrayElement(['free', 'starter', 'professional', 'enterprise', 'custom'] as const),
        status: faker.helpers.arrayElement(['active', 'inactive', 'trial', 'suspended', 'cancelled'] as const),
        billingEmail: faker.internet.email(),
        billingAddress: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          country: faker.location.countryCode(),
          postalCode: faker.location.zipCode(),
        },
        currentPeriodStart: faker.date.recent({ days: 30 }),
        currentPeriodEnd: faker.date.future({ days: 30 }),
        trialEndsAt: faker.helpers.maybe(() => faker.date.future({ days: 7 })),
      },
      compliance: {
        gdprCompliant: faker.datatype.boolean(),
        hipaaRequired: faker.datatype.boolean(),
        soc2Required: faker.datatype.boolean(),
        dataResidency: faker.helpers.maybe(() => 
          faker.helpers.arrayElements(['US', 'EU', 'CA'], { min: 1, max: 2 })
        ),
        privacyPolicyUrl: faker.internet.url(),
        termsOfServiceUrl: faker.internet.url(),
      },
      status: faker.helpers.arrayElement(['active', 'inactive', 'pending', 'suspended'] as const),
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent({ days: 30 }),
      ...overrides,
    };
  }

  static createSubsidiary(parentOrgId: string, overrides: Partial<Organization> = {}): Organization {
    return this.createOrganization({
      type: 'subsidiary',
      parentOrgId,
      ...overrides,
    });
  }

  static createChannelPartner(overrides: Partial<Organization> = {}): Organization {
    return this.createOrganization({
      type: 'channel_partner',
      ...overrides,
    });
  }

  /**
   * User factories
   */
  static createUser(organizationId: string, role: string = 'team_member', overrides: Partial<User> = {}): User {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName });

    return {
      id: faker.string.uuid(),
      email,
      name: `${firstName} ${lastName}`,
      organizationId,
      roles: [this.createRole(role, organizationId)],
      isActive: faker.datatype.boolean({ probability: 0.9 }),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent({ days: 7 }),
      ...overrides,
    };
  }

  static createRole(name: string, organizationId: string) {
    const rolePermissions = this.getRolePermissions(name);
    return {
      id: faker.string.uuid(),
      name,
      description: `${name.replace('_', ' ')} role`,
      permissions: rolePermissions,
      organizationId,
      tier: faker.helpers.arrayElement(['basic', 'premium', 'enterprise']),
      type: faker.helpers.arrayElement(['buyer', 'vendor', 'admin']),
    };
  }

  static getRolePermissions(roleName: string): string[] {
    const permissionMap: Record<string, string[]> = {
      org_owner: [
        'org:manage', 'service:view', 'booking:create', 'booking:manage',
        'user:invite', 'user:manage', 'analytics:view'
      ],
      subsidiary_manager: [
        'org:view', 'service:view', 'booking:create', 'booking:manage', 'analytics:view'
      ],
      provider_admin: [
        'org:manage', 'service:create', 'service:edit', 'service:delete',
        'booking:manage', 'user:invite', 'user:manage', 'analytics:view'
      ],
      channel_partner: [
        'org:view', 'service:view', 'booking:create', 'analytics:view'
      ],
      team_member: [
        'org:view', 'service:view', 'booking:create'
      ],
      admin: [
        'platform:admin', 'org:manage', 'service:manage', 'user:manage', 'analytics:view'
      ],
    };

    return permissionMap[roleName] || permissionMap.team_member;
  }

  /**
   * Service factories
   */
  static createService(providerId: string, overrides: Partial<Service> = {}): Service {
    const serviceName = faker.helpers.arrayElement([
      'AI Chatbot Development',
      'Computer Vision System',
      'Natural Language Processing',
      'Predictive Analytics Platform',
      'Machine Learning Consulting',
      'Data Pipeline Automation',
      'AI Model Training',
      'Recommendation Engine'
    ]);

    return {
      id: faker.string.uuid(),
      providerId,
      providerName: faker.company.name(),
      providerLogo: faker.image.url({ width: 100, height: 100 }),
      name: serviceName,
      slug: faker.helpers.slugify(serviceName).toLowerCase(),
      tagline: faker.company.buzzPhrase(),
      description: faker.lorem.paragraphs(3),
      category: faker.helpers.arrayElement(['ai', 'ml', 'nlp', 'computer_vision', 'predictive_analytics']),
      subcategory: faker.helpers.arrayElement([
        'chatbots', 'image_recognition', 'text_analysis', 'forecasting', 'recommendation_systems'
      ]),
      tags: faker.helpers.arrayElements([
        'artificial-intelligence', 'machine-learning', 'deep-learning', 'python', 'tensorflow',
        'pytorch', 'nlp', 'computer-vision', 'data-science', 'automation'
      ], { min: 3, max: 8 }),
      industries: faker.helpers.arrayElements([
        'healthcare', 'finance', 'retail', 'manufacturing', 'technology', 'education'
      ], { min: 1, max: 3 }),
      useCases: faker.helpers.arrayElements([
        'Customer Support', 'Fraud Detection', 'Inventory Management', 'Quality Control',
        'Personalization', 'Process Automation', 'Risk Assessment', 'Content Moderation'
      ], { min: 2, max: 4 }),
      technical: {
        technologies: faker.helpers.arrayElements([
          'Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'OpenCV', 'NLTK', 'spaCy'
        ], { min: 2, max: 5 }),
        frameworks: faker.helpers.arrayElements([
          'FastAPI', 'Flask', 'Django', 'React', 'Next.js', 'Docker', 'Kubernetes'
        ], { min: 1, max: 3 }),
        languages: faker.helpers.arrayElements([
          'Python', 'JavaScript', 'TypeScript', 'R', 'SQL', 'Java', 'Go'
        ], { min: 1, max: 3 }),
        platforms: faker.helpers.arrayElements([
          'AWS', 'Google Cloud', 'Azure', 'Heroku', 'Vercel'
        ], { min: 1, max: 2 }),
        apis: [],
        integrations: faker.helpers.arrayElements([
          'Salesforce', 'HubSpot', 'Slack', 'Microsoft Teams', 'Zapier'
        ], { min: 0, max: 3 }).map(name => ({ name, type: 'third-party' })),
      },
      features: faker.helpers.arrayElements([
        'Real-time Processing', 'Custom Model Training', 'API Integration',
        'Dashboard Analytics', 'Multi-language Support', 'Cloud Deployment',
        'Batch Processing', 'Real-time Monitoring'
      ], { min: 3, max: 6 }).map(name => ({
        name,
        description: faker.lorem.sentence(),
        included: faker.datatype.boolean({ probability: 0.8 }),
      })),
      pricing: {
        type: faker.helpers.arrayElement(['subscription', 'usage_based', 'project_based', 'custom'] as const),
        startingPrice: faker.number.int({ min: 500, max: 50000 }),
        currency: faker.helpers.arrayElement(['USD', 'EUR', 'GBP']),
        billingCycle: faker.helpers.arrayElement(['monthly', 'annually', 'one_time']),
        tiers: faker.helpers.arrayElements([
          {
            name: 'Basic',
            price: faker.number.int({ min: 500, max: 2000 }),
            features: ['Basic AI model', 'Email support', 'Standard SLA'],
          },
          {
            name: 'Professional',
            price: faker.number.int({ min: 2000, max: 10000 }),
            features: ['Advanced AI model', 'Priority support', 'Custom integration'],
          },
          {
            name: 'Enterprise',
            price: faker.number.int({ min: 10000, max: 50000 }),
            features: ['Custom AI model', '24/7 support', 'Dedicated account manager'],
          },
        ], { min: 1, max: 3 }),
        customPricing: faker.datatype.boolean({ probability: 0.3 }),
      },
      implementation: {
        timeline: {
          discovery: faker.helpers.arrayElement(['1-2 weeks', '2-4 weeks', '1 month']),
          development: faker.helpers.arrayElement(['4-8 weeks', '2-3 months', '3-6 months']),
          deployment: faker.helpers.arrayElement(['1-2 weeks', '2-4 weeks']),
          total: faker.helpers.arrayElement(['6-12 weeks', '3-4 months', '4-8 months']),
        },
        complexity: faker.helpers.arrayElement(['low', 'medium', 'high', 'enterprise'] as const),
        requirements: {
          technical: faker.helpers.arrayElements([
            'API integration capability', 'Data preprocessing', 'Model hosting infrastructure',
            'Real-time processing', 'Batch processing capability'
          ], { min: 1, max: 3 }),
          business: faker.helpers.arrayElements([
            'Stakeholder alignment', 'Data governance policies', 'Compliance requirements',
            'User training', 'Change management'
          ], { min: 1, max: 3 }),
          data: faker.helpers.arrayElements([
            'Historical data (6+ months)', 'Clean, labeled datasets', 'Data access permissions',
            'Data quality standards', 'Privacy compliance'
          ], { min: 1, max: 3 }),
          infrastructure: faker.helpers.arrayElements([
            'Cloud hosting environment', 'API gateway', 'Load balancing',
            'Monitoring and logging', 'Backup systems'
          ], { min: 1, max: 3 }),
        },
        support: {
          level: faker.helpers.arrayElement(['basic', 'standard', 'premium', 'enterprise']),
          hours: faker.helpers.arrayElement(['9-5 EST', '24/7', 'Business hours']),
          channels: faker.helpers.arrayElements(['email', 'phone', 'slack', 'teams'], { min: 1, max: 3 }),
          responseTime: faker.helpers.arrayElement(['24 hours', '4 hours', '1 hour', '15 minutes']),
        },
      },
      compliance: {
        certifications: faker.helpers.arrayElements([
          'ISO 27001', 'SOC 2 Type II', 'GDPR', 'HIPAA', 'PCI DSS'
        ], { min: 0, max: 3 }),
        regulations: faker.helpers.arrayElements([
          'GDPR', 'CCPA', 'HIPAA', 'SOX', 'FERPA'
        ], { min: 0, max: 2 }),
        dataHandling: {
          dataRetention: faker.helpers.arrayElement(['1 year', '2 years', '5 years', 'Custom']),
          dataLocation: faker.helpers.arrayElements(['US', 'EU', 'Canada'], { min: 1, max: 2 }),
          encryption: faker.datatype.boolean({ probability: 0.9 }),
          backups: faker.datatype.boolean({ probability: 0.95 }),
        },
        security: {
          encryption: faker.datatype.boolean({ probability: 0.95 }),
          accessControl: faker.datatype.boolean({ probability: 0.9 }),
          auditLogging: faker.datatype.boolean({ probability: 0.8 }),
          penetrationTesting: faker.datatype.boolean({ probability: 0.7 }),
        },
      },
      reviews: {
        averageRating: faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 }),
        totalReviews: faker.number.int({ min: 5, max: 500 }),
        breakdown: {
          5: faker.number.int({ min: 50, max: 200 }),
          4: faker.number.int({ min: 20, max: 100 }),
          3: faker.number.int({ min: 5, max: 50 }),
          2: faker.number.int({ min: 0, max: 20 }),
          1: faker.number.int({ min: 0, max: 10 }),
        },
        dimensions: {
          quality: {
            averageRating: faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 }),
            totalReviews: faker.number.int({ min: 5, max: 100 }),
            breakdown: {
              5: faker.number.int({ min: 20, max: 80 }),
              4: faker.number.int({ min: 5, max: 20 }),
              3: faker.number.int({ min: 0, max: 10 }),
              2: faker.number.int({ min: 0, max: 5 }),
              1: faker.number.int({ min: 0, max: 2 }),
            },
            lastUpdated: faker.date.recent({ days: 30 }),
          },
          support: {
            averageRating: faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }),
            totalReviews: faker.number.int({ min: 5, max: 100 }),
            breakdown: {
              5: faker.number.int({ min: 15, max: 60 }),
              4: faker.number.int({ min: 5, max: 25 }),
              3: faker.number.int({ min: 0, max: 15 }),
              2: faker.number.int({ min: 0, max: 8 }),
              1: faker.number.int({ min: 0, max: 5 }),
            },
            lastUpdated: faker.date.recent({ days: 30 }),
          },
          implementation: {
            averageRating: faker.number.float({ min: 3.2, max: 4.8, fractionDigits: 1 }),
            totalReviews: faker.number.int({ min: 5, max: 100 }),
            breakdown: {
              5: faker.number.int({ min: 10, max: 50 }),
              4: faker.number.int({ min: 5, max: 30 }),
              3: faker.number.int({ min: 2, max: 20 }),
              2: faker.number.int({ min: 0, max: 10 }),
              1: faker.number.int({ min: 0, max: 5 }),
            },
            lastUpdated: faker.date.recent({ days: 30 }),
          },
          value: {
            averageRating: faker.number.float({ min: 3.0, max: 4.5, fractionDigits: 1 }),
            totalReviews: faker.number.int({ min: 5, max: 100 }),
            breakdown: {
              5: faker.number.int({ min: 8, max: 40 }),
              4: faker.number.int({ min: 5, max: 25 }),
              3: faker.number.int({ min: 2, max: 20 }),
              2: faker.number.int({ min: 0, max: 12 }),
              1: faker.number.int({ min: 0, max: 8 }),
            },
            lastUpdated: faker.date.recent({ days: 30 }),
          },
        },
        lastUpdated: faker.date.recent({ days: 30 }),
      },
      status: faker.helpers.arrayElement(['draft', 'under_review', 'published', 'archived'] as const),
      visibility: faker.helpers.arrayElement(['public', 'private', 'approved_only'] as const),
      featured: faker.datatype.boolean({ probability: 0.1 }),
      priority: faker.number.int({ min: 1, max: 100 }),
      stats: {
        views: faker.number.int({ min: 10, max: 10000 }),
        inquiries: faker.number.int({ min: 1, max: 500 }),
        demos: faker.number.int({ min: 0, max: 100 }),
        conversions: faker.number.int({ min: 0, max: 50 }),
        lastViewed: faker.date.recent({ days: 7 }),
        averageResponseTime: faker.number.int({ min: 1, max: 24 }), // hours
      },
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent({ days: 30 }),
      ...overrides,
    };
  }

  /**
   * Provider factories
   */
  static createProvider(organizationId: string, overrides: Partial<Provider> = {}): Provider {
    const companyName = faker.company.name();
    
    return {
      id: faker.string.uuid(),
      organizationId,
      companyName,
      description: faker.company.catchPhrase() + '. ' + faker.lorem.sentences(2),
      logo: faker.image.url({ width: 200, height: 200 }),
      website: faker.internet.url(),
      founded: faker.number.int({ min: 2010, max: 2023 }),
      teamSize: faker.helpers.arrayElement(['1-10', '11-50', '51-200', '201-500', '500+']),
      headquarters: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.countryCode(),
        postalCode: faker.location.zipCode(),
        coordinates: {
          latitude: faker.location.latitude(),
          longitude: faker.location.longitude(),
        },
      },
      serviceAreas: faker.helpers.arrayElements([
        'North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa'
      ], { min: 1, max: 3 }),
      expertise: {
        categories: faker.helpers.arrayElements([
          'ai', 'ml', 'nlp', 'computer_vision', 'predictive_analytics', 'automation'
        ], { min: 1, max: 3 }),
        technologies: faker.helpers.arrayElements([
          'Python', 'TensorFlow', 'PyTorch', 'AWS', 'Google Cloud', 'Azure', 'Docker'
        ], { min: 3, max: 8 }),
        industries: faker.helpers.arrayElements([
          'healthcare', 'finance', 'retail', 'manufacturing', 'technology', 'education'
        ], { min: 1, max: 4 }),
      },
      certifications: faker.helpers.arrayElements([
        'AWS Certified', 'Google Cloud Certified', 'Microsoft Azure Certified',
        'ISO 27001', 'SOC 2 Type II', 'GDPR Compliant'
      ], { min: 0, max: 4 }).map(name => ({
        name,
        issuer: faker.company.name(),
        issueDate: faker.date.past({ years: 2 }),
        expiryDate: faker.date.future({ years: 1 }),
        credentialId: faker.string.alphanumeric(10).toUpperCase(),
      })),
      portfolio: faker.helpers.arrayElements([
        'AI-Powered Customer Support System',
        'Fraud Detection Platform',
        'Inventory Optimization Tool',
        'Predictive Maintenance Solution',
        'Recommendation Engine',
        'Document Processing Automation'
      ], { min: 2, max: 5 }).map(title => ({
        id: faker.string.uuid(),
        title,
        description: faker.lorem.paragraph(),
        imageUrl: faker.image.url({ width: 400, height: 300 }),
        projectUrl: faker.internet.url(),
        technologies: faker.helpers.arrayElements([
          'Python', 'React', 'TensorFlow', 'AWS', 'PostgreSQL'
        ], { min: 2, max: 4 }),
        industry: faker.helpers.arrayElement([
          'healthcare', 'finance', 'retail', 'manufacturing'
        ]),
        completedAt: faker.date.past({ years: 1 }),
      })),
      reviews: {
        averageRating: faker.number.float({ min: 3.8, max: 5.0, fractionDigits: 1 }),
        totalReviews: faker.number.int({ min: 10, max: 200 }),
        breakdown: {
          5: faker.number.int({ min: 30, max: 120 }),
          4: faker.number.int({ min: 10, max: 50 }),
          3: faker.number.int({ min: 2, max: 20 }),
          2: faker.number.int({ min: 0, max: 10 }),
          1: faker.number.int({ min: 0, max: 5 }),
        },
        lastUpdated: faker.date.recent({ days: 30 }),
      },
      responseTime: faker.number.int({ min: 1, max: 48 }), // hours
      languages: faker.helpers.arrayElements([
        'English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese'
      ], { min: 1, max: 3 }),
      timezone: faker.helpers.arrayElement([
        'America/New_York', 'America/Los_Angeles', 'Europe/London',
        'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney'
      ]),
      verified: faker.datatype.boolean({ probability: 0.8 }),
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent({ days: 7 }),
      ...overrides,
    };
  }

  /**
   * Booking factories
   */
  static createBooking(organizationId: string, providerId: string, overrides: Partial<Booking> = {}): Booking {
    const bookingTypes = ['consultation', 'demo', 'workshop', 'project_kickoff', 'follow_up'] as const;
    const statuses = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'] as const;
    
    return {
      id: faker.string.uuid(),
      organizationId,
      providerId,
      serviceId: faker.helpers.maybe(() => faker.string.uuid()),
      type: faker.helpers.arrayElement(bookingTypes),
      title: faker.helpers.arrayElement([
        'AI Solution Discovery Call',
        'Product Demo Session',
        'Technical Requirements Workshop',
        'Project Kickoff Meeting',
        'Implementation Planning Session'
      ]),
      description: faker.lorem.paragraph(),
      scheduledAt: faker.date.future({ days: 30 }),
      duration: faker.helpers.arrayElement([30, 45, 60, 90, 120]), // minutes
      timezone: faker.helpers.arrayElement([
        'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo'
      ]),
      meetingDetails: {
        platform: faker.helpers.arrayElement(['zoom', 'teams', 'meet', 'in_person', 'phone'] as const),
        meetingUrl: faker.internet.url(),
        meetingId: faker.string.numeric(10),
        password: {
          encrypted: faker.string.alphanumeric(20),
          iv: faker.string.hexadecimal({ length: 32 }),
          tag: faker.string.hexadecimal({ length: 32 }),
          _encrypted: true as const,
        },
        dialInNumber: faker.phone.number(),
        location: faker.helpers.maybe(() => ({
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          country: faker.location.countryCode(),
          postalCode: faker.location.zipCode(),
        })),
      },
      participants: {
        buyer: {
          primaryContact: faker.string.uuid(),
          additionalAttendees: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
            id: faker.string.uuid(),
            name: faker.person.fullName(),
            email: faker.internet.email(),
            role: faker.person.jobTitle(),
            phone: faker.phone.number(),
          })),
          requirements: faker.lorem.sentences(2),
        },
        provider: {
          primaryContact: faker.string.uuid(),
          additionalAttendees: Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, () => ({
            id: faker.string.uuid(),
            name: faker.person.fullName(),
            email: faker.internet.email(),
            role: faker.person.jobTitle(),
            phone: faker.phone.number(),
          })),
          agenda: faker.lorem.sentences(3),
        },
      },
      status: faker.helpers.arrayElement(statuses),
      workflow: {
        confirmationRequired: faker.datatype.boolean({ probability: 0.7 }),
        remindersSent: Array.from({ 
          length: faker.number.int({ min: 0, max: 3 }) 
        }, () => faker.date.recent({ days: 7 })),
        followUpRequired: faker.datatype.boolean({ probability: 0.6 }),
        followUpScheduled: faker.helpers.maybe(() => faker.date.future({ days: 14 })),
      },
      outcome: faker.helpers.maybe(() => ({
        notes: faker.lorem.paragraphs(2),
        nextSteps: Array.from({ 
          length: faker.number.int({ min: 1, max: 5 }) 
        }, () => faker.lorem.sentence()),
        followUpActions: Array.from({ 
          length: faker.number.int({ min: 0, max: 3 }) 
        }, () => ({
          id: faker.string.uuid(),
          action: faker.lorem.sentence(),
          assignee: faker.string.uuid(),
          dueDate: faker.date.future({ days: 30 }),
          status: faker.helpers.arrayElement(['pending', 'in_progress', 'completed']),
        })),
        rating: faker.helpers.maybe(() => ({
          buyerRating: faker.number.int({ min: 1, max: 5 }),
          providerRating: faker.number.int({ min: 1, max: 5 }),
          feedback: faker.lorem.paragraph(),
        })),
        recordings: Array.from({ 
          length: faker.number.int({ min: 0, max: 2 }) 
        }, () => faker.internet.url()),
        documents: Array.from({ 
          length: faker.number.int({ min: 0, max: 4 }) 
        }, () => faker.internet.url()),
      })),
      createdAt: faker.date.past({ days: 60 }),
      updatedAt: faker.date.recent({ days: 7 }),
      ...overrides,
    };
  }

  /**
   * Batch creation methods
   */
  static createOrganizations(count: number, overrides: Partial<Organization> = {}): Organization[] {
    return Array.from({ length: count }, () => this.createOrganization(overrides));
  }

  static createUsers(organizationId: string, count: number, role?: string): User[] {
    return Array.from({ length: count }, () => this.createUser(organizationId, role));
  }

  static createServices(providerId: string, count: number, overrides: Partial<Service> = {}): Service[] {
    return Array.from({ length: count }, () => this.createService(providerId, overrides));
  }

  static createBookings(organizationId: string, providerId: string, count: number): Booking[] {
    return Array.from({ length: count }, () => this.createBooking(organizationId, providerId));
  }

  /**
   * Scenario-based creation methods
   */
  static createMultiTenantScenario() {
    // Create parent organization
    const parentOrg = this.createOrganization({ type: 'primary' });
    
    // Create subsidiaries
    const subsidiaries = Array.from({ length: 3 }, () => 
      this.createSubsidiary(parentOrg.id)
    );
    
    // Create channel partner
    const channelPartner = this.createChannelPartner();
    
    // Create users for each organization
    const parentUsers = this.createUsers(parentOrg.id, 5, 'org_owner');
    const subsidiaryUsers = subsidiaries.flatMap(sub => 
      this.createUsers(sub.id, 3, 'subsidiary_manager')
    );
    const partnerUsers = this.createUsers(channelPartner.id, 2, 'channel_partner');
    
    return {
      parentOrg,
      subsidiaries,
      channelPartner,
      users: {
        parent: parentUsers,
        subsidiaries: subsidiaryUsers,
        partner: partnerUsers,
      },
    };
  }

  static createMarketplaceScenario() {
    // Create provider organizations
    const providers = Array.from({ length: 5 }, () => 
      this.createOrganization({ type: 'primary' })
    );
    
    // Create provider profiles
    const providerProfiles = providers.map(org => 
      this.createProvider(org.id)
    );
    
    // Create services for each provider
    const services = providers.flatMap(org => 
      this.createServices(org.id, faker.number.int({ min: 2, max: 8 }))
    );
    
    // Create buyer organizations
    const buyers = Array.from({ length: 10 }, () => 
      this.createOrganization({ type: 'primary' })
    );
    
    // Create bookings between buyers and providers
    const bookings = buyers.flatMap(buyer => 
      Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => 
        this.createBooking(
          buyer.id, 
          faker.helpers.arrayElement(providers).id
        )
      )
    );
    
    return {
      providers,
      providerProfiles,
      services,
      buyers,
      bookings,
    };
  }
}

// Export default instance with pre-configured seed
export const testDataFactory = new TestDataFactory();
TestDataFactory.setSeed(); // Set default seed for consistency