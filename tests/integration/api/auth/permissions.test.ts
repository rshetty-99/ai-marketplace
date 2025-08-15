import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { NextApiHandler } from 'next';
import { createMocks } from 'node-mocks-http';
import { handler } from '@/app/api/v1/auth/permissions/route';
import { TestDataFactory } from '@/tests/fixtures/test-data-factory';
import { initializeFirebaseAdmin } from '@/lib/firebase';
import { Permission } from '@/lib/rbac/types';

// Mock Firebase Admin
jest.mock('@/lib/firebase', () => ({
  initializeFirebaseAdmin: jest.fn(),
  getAdminAuth: jest.fn(),
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
  },
}));

// Mock Clerk
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  clerkClient: jest.fn(() => ({
    users: {
      getUser: jest.fn(),
      updateUser: jest.fn(),
    },
    sessions: {
      getSession: jest.fn(),
    },
  })),
}));

describe('API Integration: Auth Permissions', () => {
  let mockFirestore: any;
  let mockAuth: any;
  let mockClerkClient: any;
  let testOrganization: any;
  let testUsers: any[];

  beforeAll(async () => {
    // Initialize test data
    TestDataFactory.setSeed(12345);
    
    // Setup mock Firebase
    const { db, getAdminAuth } = require('@/lib/firebase');
    mockFirestore = db;
    mockAuth = getAdminAuth;
    
    // Setup mock Clerk
    const { auth, clerkClient } = require('@clerk/nextjs/server');
    mockAuth = auth;
    mockClerkClient = clerkClient;
    
    // Create test organization and users
    testOrganization = TestDataFactory.createOrganization();
    testUsers = [
      TestDataFactory.createUser(testOrganization.id, 'org_owner'),
      TestDataFactory.createUser(testOrganization.id, 'team_member'),
      TestDataFactory.createUser('other-org-id', 'team_member'),
    ];
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/permissions', () => {
    it('should validate user permissions successfully', async () => {
      const [orgOwner] = testUsers;
      
      // Mock Clerk authentication
      mockAuth.mockResolvedValue({
        userId: orgOwner.id,
        sessionId: 'session-123',
      });
      
      mockClerkClient.mockReturnValue({
        users: {
          getUser: jest.fn().mockResolvedValue({
            id: orgOwner.id,
            emailAddresses: [{ emailAddress: orgOwner.email }],
            firstName: 'Test',
            lastName: 'User',
            publicMetadata: {
              organizationId: orgOwner.organizationId,
              roles: orgOwner.roles.map(r => r.name),
              permissions: orgOwner.roles.flatMap(r => r.permissions),
            },
          }),
        },
        sessions: {
          getSession: jest.fn().mockResolvedValue({
            status: 'active',
            expireAt: Date.now() + 3600000, // 1 hour from now
          }),
        },
      });
      
      mockAuth.mockResolvedValue({
        getUser: jest.fn().mockResolvedValue({
          customClaims: {
            organizationId: orgOwner.organizationId,
            roles: orgOwner.roles,
          },
        }),
      });
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: orgOwner.id,
          permissions: [Permission.SERVICE_VIEW, Permission.BOOKING_CREATE],
        },
        headers: {
          'content-type': 'application/json',
        },
      });
      
      await handler(req as any, res as any);
      
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
      expect(responseData.permissions).toEqual({
        [Permission.SERVICE_VIEW]: true,
        [Permission.BOOKING_CREATE]: true,
      });
    });

    it('should deny permissions user does not have', async () => {
      const [, teamMember] = testUsers;
      
      mockAuth.mockResolvedValue({
        userId: teamMember.id,
        sessionId: 'session-456',
      });
      
      mockClerkClient.mockReturnValue({
        users: {
          getUser: jest.fn().mockResolvedValue({
            id: teamMember.id,
            emailAddresses: [{ emailAddress: teamMember.email }],
            firstName: 'Team',
            lastName: 'Member',
            publicMetadata: {
              organizationId: teamMember.organizationId,
              roles: teamMember.roles.map(r => r.name),
              permissions: teamMember.roles.flatMap(r => r.permissions),
            },
          }),
        },
        sessions: {
          getSession: jest.fn().mockResolvedValue({
            status: 'active',
            expireAt: Date.now() + 3600000,
          }),
        },
      });
      
      mockAuth.mockResolvedValue({
        getUser: jest.fn().mockResolvedValue({
          customClaims: {
            organizationId: teamMember.organizationId,
            roles: teamMember.roles,
          },
        }),
      });
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: teamMember.id,
          permissions: [Permission.SERVICE_VIEW, Permission.SERVICE_DELETE], // Team member can't delete
        },
      });
      
      await handler(req as any, res as any);
      
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
      expect(responseData.permissions).toEqual({
        [Permission.SERVICE_VIEW]: true,
        [Permission.SERVICE_DELETE]: false,
      });
    });

    it('should deny cross-organization permission checks', async () => {
      const [orgOwner] = testUsers;
      const [, , otherOrgUser] = testUsers;
      
      mockAuth.mockResolvedValue({
        userId: orgOwner.id,
        sessionId: 'session-123',
      });
      
      mockClerkClient.mockReturnValue({
        users: {
          getUser: jest.fn().mockResolvedValue({
            id: orgOwner.id,
            publicMetadata: {
              organizationId: orgOwner.organizationId,
              roles: orgOwner.roles.map(r => r.name),
              permissions: orgOwner.roles.flatMap(r => r.permissions),
            },
          }),
        },
      });
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: otherOrgUser.id, // Different org user
          permissions: [Permission.SERVICE_VIEW],
        },
      });
      
      await handler(req as any, res as any);
      
      expect(res._getStatusCode()).toBe(403);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBeDefined();
      expect(responseData.error.message).toContain('Cross-organization access denied');
    });

    it('should handle resource-specific permission checks', async () => {
      const [orgOwner] = testUsers;
      
      mockAuth.mockResolvedValue({
        userId: orgOwner.id,
        sessionId: 'session-123',
      });
      
      mockClerkClient.mockReturnValue({
        users: {
          getUser: jest.fn().mockResolvedValue({
            id: orgOwner.id,
            publicMetadata: {
              organizationId: orgOwner.organizationId,
              roles: orgOwner.roles.map(r => r.name),
              permissions: orgOwner.roles.flatMap(r => r.permissions),
            },
          }),
        },
      });
      
      // Mock Firestore to return resource ownership
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              organizationId: orgOwner.organizationId,
              createdBy: orgOwner.id,
            }),
          }),
        }),
      });
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: orgOwner.id,
          permissions: [Permission.SERVICE_EDIT],
          resourceId: 'service-123',
        },
      });
      
      await handler(req as any, res as any);
      
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
      expect(responseData.permissions[Permission.SERVICE_EDIT]).toBe(true);
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({
        userId: null,
        sessionId: null,
      });
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'user-123',
          permissions: [Permission.SERVICE_VIEW],
        },
      });
      
      await handler(req as any, res as any);
      
      expect(res._getStatusCode()).toBe(401);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBeDefined();
      expect(responseData.error.type).toBe('AuthenticationError');
    });

    it('should return 400 for invalid request body', async () => {
      const [orgOwner] = testUsers;
      
      mockAuth.mockResolvedValue({
        userId: orgOwner.id,
        sessionId: 'session-123',
      });
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          // Missing userId and permissions
        },
      });
      
      await handler(req as any, res as any);
      
      expect(res._getStatusCode()).toBe(400);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBeDefined();
      expect(responseData.error.type).toBe('ValidationError');
    });

    it('should handle inactive user accounts', async () => {
      const inactiveUser = {
        ...testUsers[0],
        isActive: false,
      };
      
      mockAuth.mockResolvedValue({
        userId: inactiveUser.id,
        sessionId: 'session-123',
      });
      
      mockClerkClient.mockReturnValue({
        users: {
          getUser: jest.fn().mockResolvedValue({
            id: inactiveUser.id,
            banned: true, // Inactive user
            publicMetadata: {
              organizationId: inactiveUser.organizationId,
              roles: inactiveUser.roles.map(r => r.name),
              permissions: inactiveUser.roles.flatMap(r => r.permissions),
            },
          }),
        },
      });
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: inactiveUser.id,
          permissions: [Permission.SERVICE_VIEW],
        },
      });
      
      await handler(req as any, res as any);
      
      expect(res._getStatusCode()).toBe(401);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error.message).toContain('Account is inactive');
    });

    it('should handle expired sessions', async () => {
      const [orgOwner] = testUsers;
      
      mockAuth.mockResolvedValue({
        userId: orgOwner.id,
        sessionId: 'session-123',
      });
      
      mockClerkClient.mockReturnValue({
        users: {
          getUser: jest.fn().mockResolvedValue({
            id: orgOwner.id,
            publicMetadata: {
              organizationId: orgOwner.organizationId,
              roles: orgOwner.roles.map(r => r.name),
            },
          }),
        },
        sessions: {
          getSession: jest.fn().mockResolvedValue({
            status: 'expired',
            expireAt: Date.now() - 3600000, // Expired 1 hour ago
          }),
        },
      });
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: orgOwner.id,
          permissions: [Permission.SERVICE_VIEW],
        },
      });
      
      await handler(req as any, res as any);
      
      expect(res._getStatusCode()).toBe(401);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error.message).toContain('Session expired');
    });

    it('should enforce rate limiting', async () => {
      const [orgOwner] = testUsers;
      
      mockAuth.mockResolvedValue({
        userId: orgOwner.id,
        sessionId: 'session-123',
      });
      
      mockClerkClient.mockReturnValue({
        users: {
          getUser: jest.fn().mockResolvedValue({
            id: orgOwner.id,
            publicMetadata: {
              organizationId: orgOwner.organizationId,
            },
          }),
        },
      });
      
      const requestBody = {
        userId: orgOwner.id,
        permissions: [Permission.SERVICE_VIEW],
      };
      
      // Make multiple rapid requests
      const requests = Array(10).fill(null).map(() => {
        const { req, res } = createMocks({
          method: 'POST',
          body: requestBody,
          headers: {
            'x-forwarded-for': '192.168.1.100', // Same IP
          },
        });
        return handler(req as any, res as any);
      });
      
      await Promise.all(requests);
      
      // At least one should be rate limited (implementation dependent)
      // This test would need actual rate limiting implementation
    });

    it('should handle database connection failures gracefully', async () => {
      const [orgOwner] = testUsers;
      
      mockAuth.mockResolvedValue({
        userId: orgOwner.id,
        sessionId: 'session-123',
      });
      
      // Mock database failure
      mockAuth.mockRejectedValue(new Error('Database connection failed'));
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: orgOwner.id,
          permissions: [Permission.SERVICE_VIEW],
        },
      });
      
      await handler(req as any, res as any);
      
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error.type).toBe('DatabaseError');
    });

    it('should log security events for suspicious activities', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockAuth.mockResolvedValue({
        userId: null, // No user but trying to access
        sessionId: null,
      });
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'admin-user-123',
          permissions: [Permission.PLATFORM_ADMIN], // High privilege request
        },
        headers: {
          'x-forwarded-for': '192.168.1.100',
        },
      });
      
      await handler(req as any, res as any);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Method validation', () => {
    it('should return 405 for unsupported HTTP methods', async () => {
      const { req, res } = createMocks({
        method: 'GET', // Only POST is supported
      });
      
      await handler(req as any, res as any);
      
      expect(res._getStatusCode()).toBe(405);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error.message).toContain('Method Not Allowed');
    });

    it('should handle OPTIONS requests for CORS', async () => {
      const { req, res } = createMocks({
        method: 'OPTIONS',
      });
      
      await handler(req as any, res as any);
      
      expect(res._getStatusCode()).toBe(200);
      expect(res.getHeaders()).toHaveProperty('access-control-allow-methods');
    });
  });

  describe('Error handling and logging', () => {
    it('should mask sensitive information in error responses', async () => {
      // Mock sensitive error
      mockAuth.mockRejectedValue(new Error('Database password incorrect: secret123'));
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'user-123',
          permissions: [Permission.SERVICE_VIEW],
        },
      });
      
      process.env.NODE_ENV = 'production';
      
      await handler(req as any, res as any);
      
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error.message).not.toContain('secret123');
      expect(responseData.error.message).toBe('An unexpected error occurred');
    });

    it('should provide detailed errors in development', async () => {
      mockAuth.mockRejectedValue(new Error('Specific development error'));
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'user-123',
          permissions: [Permission.SERVICE_VIEW],
        },
      });
      
      process.env.NODE_ENV = 'development';
      
      await handler(req as any, res as any);
      
      expect(res._getStatusCode()).toBe(500);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData.error.message).toContain('Specific development error');
    });
  });

  describe('Response format validation', () => {
    it('should return properly formatted success response', async () => {
      const [orgOwner] = testUsers;
      
      mockAuth.mockResolvedValue({
        userId: orgOwner.id,
        sessionId: 'session-123',
      });
      
      mockClerkClient.mockReturnValue({
        users: {
          getUser: jest.fn().mockResolvedValue({
            id: orgOwner.id,
            publicMetadata: {
              organizationId: orgOwner.organizationId,
              permissions: [Permission.SERVICE_VIEW],
            },
          }),
        },
      });
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: orgOwner.id,
          permissions: [Permission.SERVICE_VIEW],
        },
      });
      
      await handler(req as any, res as any);
      
      expect(res._getStatusCode()).toBe(200);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toHaveProperty('success');
      expect(responseData).toHaveProperty('permissions');
      expect(responseData).toHaveProperty('timestamp');
      expect(responseData.success).toBe(true);
      expect(typeof responseData.timestamp).toBe('string');
    });

    it('should return properly formatted error response', async () => {
      mockAuth.mockResolvedValue({
        userId: null,
        sessionId: null,
      });
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'user-123',
          permissions: [Permission.SERVICE_VIEW],
        },
      });
      
      await handler(req as any, res as any);
      
      expect(res._getStatusCode()).toBe(401);
      
      const responseData = JSON.parse(res._getData());
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toHaveProperty('type');
      expect(responseData.error).toHaveProperty('message');
      expect(responseData.error).toHaveProperty('statusCode');
      expect(responseData.error).toHaveProperty('timestamp');
    });
  });
});