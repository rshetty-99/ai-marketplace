import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitExceededError,
  ExternalServiceError,
  DatabaseError,
  handleApiError,
  createErrorResponse,
  logError,
} from '@/lib/utils/error-handler';

// Mock console methods
const mockConsole = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

describe('Error Handler', () => {
  beforeEach(() => {
    // Replace console methods with mocks
    global.console = mockConsole as any;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Custom Error Classes', () => {
    describe('AuthenticationError', () => {
      it('should create authentication error with correct properties', () => {
        const error = new AuthenticationError('Invalid credentials');
        
        expect(error.name).toBe('AuthenticationError');
        expect(error.message).toBe('Invalid credentials');
        expect(error.statusCode).toBe(401);
        expect(error.isOperational).toBe(true);
        expect(error instanceof Error).toBe(true);
      });

      it('should create authentication error with custom status code', () => {
        const error = new AuthenticationError('Session expired', 403);
        
        expect(error.statusCode).toBe(403);
        expect(error.message).toBe('Session expired');
      });
    });

    describe('AuthorizationError', () => {
      it('should create authorization error with correct properties', () => {
        const error = new AuthorizationError('Insufficient permissions');
        
        expect(error.name).toBe('AuthorizationError');
        expect(error.message).toBe('Insufficient permissions');
        expect(error.statusCode).toBe(403);
        expect(error.isOperational).toBe(true);
      });
    });

    describe('ValidationError', () => {
      it('should create validation error with details', () => {
        const validationDetails = [
          { field: 'email', message: 'Invalid email format' },
          { field: 'age', message: 'Must be a positive number' },
        ];
        
        const error = new ValidationError('Validation failed', validationDetails);
        
        expect(error.name).toBe('ValidationError');
        expect(error.message).toBe('Validation failed');
        expect(error.statusCode).toBe(400);
        expect(error.details).toEqual(validationDetails);
        expect(error.isOperational).toBe(true);
      });

      it('should work without validation details', () => {
        const error = new ValidationError('General validation error');
        
        expect(error.details).toEqual([]);
      });
    });

    describe('NotFoundError', () => {
      it('should create not found error with correct properties', () => {
        const error = new NotFoundError('Resource not found');
        
        expect(error.name).toBe('NotFoundError');
        expect(error.message).toBe('Resource not found');
        expect(error.statusCode).toBe(404);
        expect(error.isOperational).toBe(true);
      });
    });

    describe('ConflictError', () => {
      it('should create conflict error with correct properties', () => {
        const error = new ConflictError('Resource already exists');
        
        expect(error.name).toBe('ConflictError');
        expect(error.message).toBe('Resource already exists');
        expect(error.statusCode).toBe(409);
        expect(error.isOperational).toBe(true);
      });
    });

    describe('RateLimitExceededError', () => {
      it('should create rate limit error with retry after', () => {
        const error = new RateLimitExceededError('Too many requests', 300);
        
        expect(error.name).toBe('RateLimitExceededError');
        expect(error.message).toBe('Too many requests');
        expect(error.statusCode).toBe(429);
        expect(error.retryAfter).toBe(300);
        expect(error.isOperational).toBe(true);
      });

      it('should work without retry after value', () => {
        const error = new RateLimitExceededError('Rate limit exceeded');
        
        expect(error.retryAfter).toBeUndefined();
      });
    });

    describe('ExternalServiceError', () => {
      it('should create external service error with service name', () => {
        const error = new ExternalServiceError('Payment service unavailable', 'stripe');
        
        expect(error.name).toBe('ExternalServiceError');
        expect(error.message).toBe('Payment service unavailable');
        expect(error.statusCode).toBe(502);
        expect(error.service).toBe('stripe');
        expect(error.isOperational).toBe(true);
      });

      it('should create external service error with custom status code', () => {
        const error = new ExternalServiceError('Service timeout', 'firebase', 504);
        
        expect(error.statusCode).toBe(504);
        expect(error.service).toBe('firebase');
      });
    });

    describe('DatabaseError', () => {
      it('should create database error with operation', () => {
        const error = new DatabaseError('Connection timeout', 'query');
        
        expect(error.name).toBe('DatabaseError');
        expect(error.message).toBe('Connection timeout');
        expect(error.statusCode).toBe(500);
        expect(error.operation).toBe('query');
        expect(error.isOperational).toBe(true);
      });

      it('should work without operation', () => {
        const error = new DatabaseError('Database error');
        
        expect(error.operation).toBeUndefined();
      });
    });
  });

  describe('handleApiError', () => {
    it('should handle authentication errors', () => {
      const error = new AuthenticationError('Invalid token');
      const response = handleApiError(error);
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: {
          type: 'AuthenticationError',
          message: 'Invalid token',
          statusCode: 401,
        },
      });
    });

    it('should handle validation errors with details', () => {
      const validationDetails = [
        { field: 'email', message: 'Required' },
      ];
      const error = new ValidationError('Validation failed', validationDetails);
      const response = handleApiError(error);
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: {
          type: 'ValidationError',
          message: 'Validation failed',
          statusCode: 400,
          details: validationDetails,
        },
      });
    });

    it('should handle rate limit errors with retry after', () => {
      const error = new RateLimitExceededError('Too many requests', 300);
      const response = handleApiError(error);
      
      expect(response.status).toBe(429);
      expect(response.headers).toEqual({
        'Retry-After': '300',
      });
      expect(response.body.error.retryAfter).toBe(300);
    });

    it('should handle external service errors', () => {
      const error = new ExternalServiceError('Service unavailable', 'stripe');
      const response = handleApiError(error);
      
      expect(response.status).toBe(502);
      expect(response.body.error.service).toBe('stripe');
    });

    it('should handle database errors', () => {
      const error = new DatabaseError('Query timeout', 'select');
      const response = handleApiError(error);
      
      expect(response.status).toBe(500);
      expect(response.body.error.operation).toBe('select');
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unexpected error');
      const response = handleApiError(error);
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: {
          type: 'InternalServerError',
          message: 'An unexpected error occurred',
          statusCode: 500,
        },
      });
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      const response = handleApiError(error as any);
      
      expect(response.status).toBe(500);
      expect(response.body.error.message).toBe('An unexpected error occurred');
    });

    it('should include request ID when provided', () => {
      const error = new AuthenticationError('Invalid token');
      const response = handleApiError(error, 'req-123');
      
      expect(response.body.error.requestId).toBe('req-123');
    });

    it('should not expose internal error details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Internal database connection failed');
      const response = handleApiError(error);
      
      expect(response.body.error.message).toBe('An unexpected error occurred');
      expect(response.body.error).not.toHaveProperty('stack');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Development error');
      const response = handleApiError(error);
      
      expect(response.body.error.message).toBe('Development error');
      expect(response.body.error).toHaveProperty('stack');
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response with all properties', () => {
      const response = createErrorResponse(
        'ValidationError',
        'Invalid input',
        400,
        { field: 'email', message: 'Required' },
        'req-456'
      );
      
      expect(response).toEqual({
        status: 400,
        body: {
          error: {
            type: 'ValidationError',
            message: 'Invalid input',
            statusCode: 400,
            details: { field: 'email', message: 'Required' },
            requestId: 'req-456',
            timestamp: expect.any(String),
          },
        },
      });
    });

    it('should create error response with minimal properties', () => {
      const response = createErrorResponse(
        'NotFoundError',
        'Resource not found',
        404
      );
      
      expect(response).toEqual({
        status: 404,
        body: {
          error: {
            type: 'NotFoundError',
            message: 'Resource not found',
            statusCode: 404,
            timestamp: expect.any(String),
          },
        },
      });
    });

    it('should include valid ISO timestamp', () => {
      const response = createErrorResponse('Error', 'Test error', 500);
      const timestamp = response.body.error.timestamp;
      
      expect(() => new Date(timestamp)).not.toThrow();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const error = new AuthenticationError('Invalid token');
      const context = {
        userId: 'user-123',
        path: '/api/services',
        method: 'GET',
      };
      
      logError(error, context);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error occurred:',
        {
          name: 'AuthenticationError',
          message: 'Invalid token',
          statusCode: 401,
          stack: expect.any(String),
          context,
        }
      );
    });

    it('should log error without context', () => {
      const error = new ValidationError('Invalid data');
      
      logError(error);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error occurred:',
        {
          name: 'ValidationError',
          message: 'Invalid data',
          statusCode: 400,
          stack: expect.any(String),
          context: undefined,
        }
      );
    });

    it('should log non-Error objects', () => {
      const error = 'String error';
      
      logError(error as any);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error occurred:',
        {
          name: 'Unknown',
          message: 'String error',
          statusCode: 500,
          stack: undefined,
          context: undefined,
        }
      );
    });

    it('should handle circular references in context', () => {
      const context: any = { name: 'test' };
      context.self = context; // Create circular reference
      
      const error = new Error('Test error');
      
      expect(() => logError(error, context)).not.toThrow();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should log operational vs programming errors differently', () => {
      // Operational error
      const operationalError = new AuthenticationError('Invalid credentials');
      logError(operationalError);
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error occurred:',
        expect.objectContaining({
          name: 'AuthenticationError',
        })
      );
      
      // Programming error
      const programmingError = new Error('Unexpected null reference');
      logError(programmingError);
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error occurred:',
        expect.objectContaining({
          name: 'Error',
        })
      );
    });
  });

  describe('Error handling in production vs development', () => {
    it('should mask sensitive information in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const sensitiveError = new Error('Database password is invalid: password123');
      const response = handleApiError(sensitiveError);
      
      expect(response.body.error.message).not.toContain('password123');
      expect(response.body.error.message).toBe('An unexpected error occurred');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should provide detailed errors in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const detailedError = new Error('Database connection failed at line 42');
      const response = handleApiError(detailedError);
      
      expect(response.body.error.message).toBe('Database connection failed at line 42');
      expect(response.body.error).toHaveProperty('stack');
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error correlation and tracking', () => {
    it('should maintain error correlation across service calls', () => {
      const correlationId = 'corr-123-456';
      const error = new ExternalServiceError('Service timeout', 'payment');
      
      const response = handleApiError(error, correlationId);
      
      expect(response.body.error.requestId).toBe(correlationId);
    });

    it('should generate consistent error IDs for the same error', () => {
      const error = new ValidationError('Invalid email');
      
      const response1 = handleApiError(error, 'req-1');
      const response2 = handleApiError(error, 'req-2');
      
      // Different request IDs but same error type and message
      expect(response1.body.error.requestId).toBe('req-1');
      expect(response2.body.error.requestId).toBe('req-2');
      expect(response1.body.error.type).toBe(response2.body.error.type);
      expect(response1.body.error.message).toBe(response2.body.error.message);
    });
  });
});