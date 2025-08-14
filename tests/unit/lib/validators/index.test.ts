import { describe, it, expect, beforeEach } from '@jest/globals';
import { z } from 'zod';
import {
  ValidationSchemas,
  validateSchema,
  ValidationError,
  EmailSchema,
  PhoneSchema,
  SanitizedTextSchema,
  TagsSchema,
  CreateOrganizationSchema,
  CreateServiceSchema,
  CreateBookingSchema,
  ProcessPaymentSchema,
} from '@/lib/validators';

describe('Validation Schemas', () => {
  describe('EmailSchema', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'test.email@sub.domain.com',
      ];

      validEmails.forEach(email => {
        expect(() => EmailSchema.parse(email)).not.toThrow();
      });
    });

    it('should transform email to lowercase and trim', () => {
      const result = EmailSchema.parse('  TEST@EXAMPLE.COM  ');
      expect(result).toBe('test@example.com');
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test.example.com',
        'test@.com',
        'test@example.',
        '',
        'test space@example.com',
      ];

      invalidEmails.forEach(email => {
        expect(() => EmailSchema.parse(email)).toThrow();
      });
    });
  });

  describe('PhoneSchema', () => {
    it('should validate correct phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '+12345678901234',
        '1234567890',
        '+447700900123',
      ];

      validPhones.forEach(phone => {
        expect(() => PhoneSchema.parse(phone)).not.toThrow();
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123',
        '+1',
        'not-a-phone',
        '+123456789012345', // too long
        '0123456789', // starts with 0
      ];

      invalidPhones.forEach(phone => {
        expect(() => PhoneSchema.parse(phone)).toThrow();
      });
    });

    it('should allow undefined for optional phone', () => {
      expect(() => PhoneSchema.parse(undefined)).not.toThrow();
    });
  });

  describe('SanitizedTextSchema', () => {
    it('should sanitize HTML script tags', () => {
      const maliciousInput = 'Hello <script>alert("xss")</script> world';
      const result = SanitizedTextSchema.parse(maliciousInput);
      expect(result).toBe('Hello  world');
      expect(result).not.toContain('<script>');
    });

    it('should sanitize HTML iframe tags', () => {
      const maliciousInput = 'Content <iframe src="evil.com"></iframe> more content';
      const result = SanitizedTextSchema.parse(maliciousInput);
      expect(result).not.toContain('<iframe>');
    });

    it('should sanitize HTML object and embed tags', () => {
      const maliciousInput = 'Text <object data="evil.swf"></object> and <embed src="bad.swf">';
      const result = SanitizedTextSchema.parse(maliciousInput);
      expect(result).not.toContain('<object>');
      expect(result).not.toContain('<embed>');
    });

    it('should preserve safe HTML content', () => {
      const safeInput = 'Hello <strong>bold</strong> and <em>italic</em> text';
      const result = SanitizedTextSchema.parse(safeInput);
      expect(result).toBe(safeInput);
    });

    it('should reject empty strings after sanitization', () => {
      const emptyAfterSanitization = '<script></script>';
      expect(() => SanitizedTextSchema.parse(emptyAfterSanitization)).toThrow();
    });
  });

  describe('TagsSchema', () => {
    it('should validate and transform tags correctly', () => {
      const input = ['Tag1', 'TAG2', '  tag3  ', 'Tag-4'];
      const result = TagsSchema.parse(input);
      expect(result).toEqual(['tag1', 'tag2', 'tag3', 'tag-4']);
    });

    it('should enforce maximum tag count', () => {
      const tooManyTags = Array(25).fill('tag');
      expect(() => TagsSchema.parse(tooManyTags)).toThrow('Maximum 20 tags allowed');
    });

    it('should enforce minimum tag length', () => {
      const invalidTags = ['', 'a'];
      expect(() => TagsSchema.parse(invalidTags)).toThrow();
    });

    it('should enforce maximum tag length', () => {
      const longTag = 'a'.repeat(51);
      expect(() => TagsSchema.parse([longTag])).toThrow();
    });
  });

  describe('CreateOrganizationSchema', () => {
    const validOrgData = {
      name: 'Test Organization',
      email: 'test@example.com',
      phone: '+1234567890',
      website: 'https://example.com',
      description: 'A test organization',
      industry: 'technology',
      size: 'midmarket' as const,
    };

    it('should validate correct organization data', () => {
      expect(() => CreateOrganizationSchema.parse(validOrgData)).not.toThrow();
    });

    it('should trim organization name', () => {
      const result = CreateOrganizationSchema.parse({
        ...validOrgData,
        name: '  Test Org  ',
      });
      expect(result.name).toBe('Test Org');
    });

    it('should sanitize description', () => {
      const result = CreateOrganizationSchema.parse({
        ...validOrgData,
        description: 'Description with <script>alert("xss")</script>',
      });
      expect(result.description).not.toContain('<script>');
    });

    it('should validate nested settings object', () => {
      const orgWithSettings = {
        ...validOrgData,
        settings: {
          timezone: 'America/New_York',
          currency: 'USD' as const,
          language: 'en',
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
          security: {
            twoFactorRequired: true,
            ipWhitelist: ['192.168.1.1', '10.0.0.1'],
            ssoEnabled: false,
          },
        },
      };

      expect(() => CreateOrganizationSchema.parse(orgWithSettings)).not.toThrow();
    });

    it('should validate billing information', () => {
      const orgWithBilling = {
        ...validOrgData,
        billing: {
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
          },
          taxId: 'TAX123456',
          paymentMethodId: 'pm_123456789',
        },
      };

      expect(() => CreateOrganizationSchema.parse(orgWithBilling)).not.toThrow();
    });

    it('should reject invalid organization size', () => {
      const invalidOrg = {
        ...validOrgData,
        size: 'invalid-size',
      };

      expect(() => CreateOrganizationSchema.parse(invalidOrg)).toThrow();
    });

    it('should reject invalid IP addresses in whitelist', () => {
      const invalidOrg = {
        ...validOrgData,
        settings: {
          security: {
            ipWhitelist: ['invalid-ip', '192.168.1.1'],
          },
        },
      };

      expect(() => CreateOrganizationSchema.parse(invalidOrg)).toThrow();
    });
  });

  describe('CreateServiceSchema', () => {
    const validServiceData = {
      providerId: 'provider-123',
      title: 'AI Chatbot Development',
      description: 'Custom AI chatbot solutions for your business needs',
      category: 'nlp',
      tags: ['ai', 'chatbot', 'nlp'],
      pricing: {
        type: 'fixed' as const,
        amount: 5000,
        currency: 'USD' as const,
      },
      requirements: ['API integration capability', 'Data access permissions'],
      deliverables: ['Trained AI model', 'Integration documentation', 'Support package'],
      timeline: {
        estimated: '6-8 weeks',
        rush: {
          available: true,
          multiplier: 1.5,
          description: 'Rush delivery available',
        },
      },
      availability: {
        status: 'available' as const,
        workingHours: {
          timezone: 'America/New_York',
          schedule: {
            monday: { start: '09:00', end: '17:00' },
            tuesday: { start: '09:00', end: '17:00' },
          },
        },
      },
    };

    it('should validate correct service data', () => {
      expect(() => CreateServiceSchema.parse(validServiceData)).not.toThrow();
    });

    it('should trim and sanitize title and description', () => {
      const result = CreateServiceSchema.parse({
        ...validServiceData,
        title: '  Test Service  ',
        description: 'Description with <script>evil</script> content',
      });

      expect(result.title).toBe('Test Service');
      expect(result.description).not.toContain('<script>');
    });

    it('should transform tags to lowercase', () => {
      const result = CreateServiceSchema.parse({
        ...validServiceData,
        tags: ['AI', 'ChatBot', 'NLP'],
      });

      expect(result.tags).toEqual(['ai', 'chatbot', 'nlp']);
    });

    it('should validate pricing packages', () => {
      const serviceWithPackages = {
        ...validServiceData,
        pricing: {
          ...validServiceData.pricing,
          packages: [
            {
              name: 'Basic',
              description: 'Basic chatbot package',
              price: 2500,
              deliverables: ['Basic model', 'Documentation'],
              timeline: '4 weeks',
            },
          ],
        },
      };

      expect(() => CreateServiceSchema.parse(serviceWithPackages)).not.toThrow();
    });

    it('should reject invalid working hours format', () => {
      const invalidService = {
        ...validServiceData,
        availability: {
          ...validServiceData.availability,
          workingHours: {
            timezone: 'America/New_York',
            schedule: {
              monday: { start: '25:00', end: '17:00' }, // Invalid hour
            },
          },
        },
      };

      expect(() => CreateServiceSchema.parse(invalidService)).toThrow();
    });

    it('should require minimum requirements and deliverables', () => {
      const invalidService = {
        ...validServiceData,
        requirements: [],
        deliverables: [],
      };

      expect(() => CreateServiceSchema.parse(invalidService)).toThrow();
    });
  });

  describe('CreateBookingSchema', () => {
    const validBookingData = {
      organizationId: 'org-123',
      providerId: 'provider-123',
      serviceId: 'service-123',
      type: 'consultation' as const,
      details: {
        title: 'AI Solution Discovery Call',
        description: 'Discussing AI chatbot requirements',
        requirements: ['Define use cases', 'Technical requirements'],
        deliverables: ['Requirements document', 'Technical proposal'],
      },
      scheduling: {
        startDate: '2024-12-01T10:00:00Z',
        timezone: 'America/New_York',
        meetingUrl: 'https://zoom.us/meeting/123',
      },
      budget: {
        amount: 5000,
        currency: 'USD' as const,
        paymentType: 'fixed' as const,
      },
    };

    it('should validate correct booking data', () => {
      expect(() => CreateBookingSchema.parse(validBookingData)).not.toThrow();
    });

    it('should sanitize description and requirements', () => {
      const result = CreateBookingSchema.parse({
        ...validBookingData,
        details: {
          ...validBookingData.details,
          description: 'Meeting about <script>alert("xss")</script> requirements',
        },
      });

      expect(result.details.description).not.toContain('<script>');
    });

    it('should validate recurring meetings', () => {
      const recurringBooking = {
        ...validBookingData,
        scheduling: {
          ...validBookingData.scheduling,
          recurring: {
            frequency: 'weekly' as const,
            endDate: '2024-12-31T23:59:59Z',
          },
        },
      };

      expect(() => CreateBookingSchema.parse(recurringBooking)).not.toThrow();
    });

    it('should validate milestones', () => {
      const bookingWithMilestones = {
        ...validBookingData,
        milestones: [
          {
            id: 'milestone-1',
            title: 'Discovery Phase',
            description: 'Initial requirements gathering',
            dueDate: '2024-12-15T23:59:59Z',
            payment: { amount: 1000 },
          },
        ],
      };

      expect(() => CreateBookingSchema.parse(bookingWithMilestones)).not.toThrow();
    });

    it('should reject invalid meeting URLs', () => {
      const invalidBooking = {
        ...validBookingData,
        scheduling: {
          ...validBookingData.scheduling,
          meetingUrl: 'not-a-valid-url',
        },
      };

      expect(() => CreateBookingSchema.parse(invalidBooking)).toThrow();
    });
  });

  describe('ProcessPaymentSchema', () => {
    const validPaymentData = {
      bookingId: 'booking-123',
      amount: 2500.50,
      currency: 'USD' as const,
      type: 'deposit' as const,
      paymentMethodId: 'pm_123456789',
    };

    it('should validate correct payment data', () => {
      expect(() => ProcessPaymentSchema.parse(validPaymentData)).not.toThrow();
    });

    it('should enforce minimum payment amount', () => {
      const invalidPayment = {
        ...validPaymentData,
        amount: 0.005, // Less than $0.01
      };

      expect(() => ProcessPaymentSchema.parse(invalidPayment)).toThrow();
    });

    it('should validate payment description', () => {
      const paymentWithDescription = {
        ...validPaymentData,
        description: 'Payment for AI consultation services',
      };

      expect(() => ProcessPaymentSchema.parse(paymentWithDescription)).not.toThrow();
    });

    it('should default escrow release type to manual', () => {
      const result = ProcessPaymentSchema.parse(validPaymentData);
      expect(result.escrowReleaseType).toBe('manual');
    });
  });

  describe('validateSchema helper function', () => {
    it('should validate correct data successfully', () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(0),
      });
      const validData = { name: 'John', age: 30 };

      const result = validateSchema(schema, validData);
      expect(result).toEqual(validData);
    });

    it('should throw ValidationError for invalid data', () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(0),
      });
      const invalidData = { name: '', age: -5 };

      expect(() => validateSchema(schema, invalidData)).toThrow(ValidationError);
    });

    it('should preserve original error for non-Zod errors', () => {
      const schema = z.object({
        name: z.string().transform(() => {
          throw new Error('Custom error');
        }),
      });

      expect(() => validateSchema(schema, { name: 'test' })).toThrow('Custom error');
    });
  });

  describe('ValidationError class', () => {
    it('should format errors correctly', () => {
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.too_small,
          minimum: 1,
          type: 'string',
          inclusive: true,
          exact: false,
          message: 'String must contain at least 1 character(s)',
          path: ['name'],
        },
        {
          code: z.ZodIssueCode.too_small,
          minimum: 0,
          type: 'number',
          inclusive: true,
          exact: false,
          message: 'Number must be greater than or equal to 0',
          path: ['age'],
        },
      ]);

      const validationError = new ValidationError('Validation failed', zodError.errors);
      const formattedErrors = validationError.getFormattedErrors();

      expect(formattedErrors).toEqual([
        {
          field: 'name',
          message: 'String must contain at least 1 character(s)',
          code: 'too_small',
        },
        {
          field: 'age',
          message: 'Number must be greater than or equal to 0',
          code: 'too_small',
        },
      ]);
    });

    it('should handle nested field paths', () => {
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'number',
          message: 'Expected string, received number',
          path: ['user', 'profile', 'name'],
        },
      ]);

      const validationError = new ValidationError('Validation failed', zodError.errors);
      const formattedErrors = validationError.getFormattedErrors();

      expect(formattedErrors[0].field).toBe('user.profile.name');
    });
  });

  describe('edge cases and security', () => {
    it('should handle extremely long strings', () => {
      const longString = 'a'.repeat(100000);
      expect(() => SanitizedTextSchema.parse(longString)).not.toThrow();
    });

    it('should handle Unicode characters correctly', () => {
      const unicodeText = 'Hello 世界 🌍 émojis';
      const result = SanitizedTextSchema.parse(unicodeText);
      expect(result).toBe(unicodeText);
    });

    it('should handle nested HTML attacks', () => {
      const nestedAttack = '<div><script>alert("xss")</script></div>';
      const result = SanitizedTextSchema.parse(nestedAttack);
      expect(result).not.toContain('<script>');
    });

    it('should handle malformed HTML gracefully', () => {
      const malformedHtml = '<div><p>unclosed tags<script>';
      expect(() => SanitizedTextSchema.parse(malformedHtml)).not.toThrow();
    });

    it('should validate international phone numbers', () => {
      const internationalPhones = [
        '+447700900123', // UK
        '+33123456789',  // France
        '+8613812345678', // China
        '+911234567890',  // India
      ];

      internationalPhones.forEach(phone => {
        expect(() => PhoneSchema.parse(phone)).not.toThrow();
      });
    });

    it('should handle currency validation edge cases', () => {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
      validCurrencies.forEach(currency => {
        expect(() => ValidationSchemas.Currency.parse(currency)).not.toThrow();
      });

      const invalidCurrencies = ['usd', 'JPY', 'BTC', ''];
      invalidCurrencies.forEach(currency => {
        expect(() => ValidationSchemas.Currency.parse(currency)).toThrow();
      });
    });
  });
});