import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiError, ApiErrorCodes, HttpStatus } from '@/types/api';

/**
 * Centralized error handling for API routes
 * Provides consistent error responses and logging
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    public code: string = ApiErrorCodes.INTERNAL_SERVER_ERROR,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public validationErrors: any[]) {
    super(message, HttpStatus.BAD_REQUEST, ApiErrorCodes.VALIDATION_ERROR);
    this.details = { validationErrors };
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, HttpStatus.UNAUTHORIZED, ApiErrorCodes.AUTH_TOKEN_INVALID);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, HttpStatus.FORBIDDEN, ApiErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, HttpStatus.NOT_FOUND, ApiErrorCodes.RESOURCE_NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT, ApiErrorCodes.RESOURCE_CONFLICT);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, HttpStatus.TOO_MANY_REQUESTS, ApiErrorCodes.RATE_LIMIT_EXCEEDED);
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, ApiErrorCodes.PAYMENT_FAILED, details);
  }
}

/**
 * Error handler middleware for API routes
 */
export function withErrorHandler<T = any>(
  handler: (req: NextRequest, params?: any) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest, params?: any): Promise<NextResponse> => {
    try {
      return await handler(req, params);
    } catch (error) {
      return handleError(error, req);
    }
  };
}

/**
 * Main error handling function
 */
export function handleError(error: unknown, req: NextRequest): NextResponse {
  console.error('API Error:', error);

  // Log error with context
  logError(error, req);

  if (error instanceof AppError) {
    return createErrorResponse(error.message, error.statusCode, error.code, error.details);
  }

  if (error instanceof ZodError) {
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));

    return createErrorResponse(
      'Validation failed',
      HttpStatus.BAD_REQUEST,
      ApiErrorCodes.VALIDATION_ERROR,
      { validationErrors }
    );
  }

  // Firebase/Firestore errors
  if (error instanceof Error) {
    if (error.message.includes('permission-denied')) {
      return createErrorResponse(
        'Access denied',
        HttpStatus.FORBIDDEN,
        ApiErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS
      );
    }

    if (error.message.includes('not-found')) {
      return createErrorResponse(
        'Resource not found',
        HttpStatus.NOT_FOUND,
        ApiErrorCodes.RESOURCE_NOT_FOUND
      );
    }

    if (error.message.includes('already-exists')) {
      return createErrorResponse(
        'Resource already exists',
        HttpStatus.CONFLICT,
        ApiErrorCodes.RESOURCE_ALREADY_EXISTS
      );
    }

    // Clerk authentication errors
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(
        'Invalid authentication token',
        HttpStatus.UNAUTHORIZED,
        ApiErrorCodes.AUTH_TOKEN_INVALID
      );
    }
  }

  // Default internal server error
  return createErrorResponse(
    'An unexpected error occurred',
    HttpStatus.INTERNAL_SERVER_ERROR,
    ApiErrorCodes.INTERNAL_SERVER_ERROR,
    process.env.NODE_ENV === 'development' ? { originalError: String(error) } : undefined
  );
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  message: string,
  status: number,
  code: string,
  details?: Record<string, any>
): NextResponse {
  const errorResponse: { success: false; error: ApiError } = {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  };

  return NextResponse.json(errorResponse, { status });
}

/**
 * Error logging with context
 */
function logError(error: unknown, req: NextRequest): void {
  const context = {
    method: req.method,
    url: req.url,
    userAgent: req.headers.get('user-agent'),
    ip: req.ip || req.headers.get('x-forwarded-for'),
    timestamp: new Date().toISOString()
  };

  if (error instanceof AppError) {
    console.error('Application Error:', {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      details: error.details,
      stack: error.stack,
      context
    });
  } else if (error instanceof Error) {
    console.error('Unexpected Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context
    });
  } else {
    console.error('Unknown Error:', {
      error: String(error),
      context
    });
  }

  // TODO: Send to error tracking service (Sentry, etc.)
  // await sendToErrorTracking(error, context);
}

/**
 * Success response helper
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = HttpStatus.OK,
  meta?: Record<string, any>
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    ...(meta && { meta })
  }, { status });
}

/**
 * Async error boundary for non-API routes
 */
export function asyncErrorBoundary<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Async operation failed:', error);
      throw error;
    }
  }) as T;
}

/**
 * Error boundary for React Server Components
 */
export function withServerErrorBoundary<T>(
  component: () => Promise<T>,
  fallback?: () => T
): () => Promise<T> {
  return async () => {
    try {
      return await component();
    } catch (error) {
      console.error('Server component error:', error);
      
      if (fallback) {
        return fallback();
      }
      
      throw error;
    }
  };
}

/**
 * Custom error types for specific business logic
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, code, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: Record<string, any>) {
    super(`${service} service error: ${message}`, HttpStatus.SERVICE_UNAVAILABLE, 'EXTERNAL_SERVICE_ERROR', {
      service,
      ...details
    });
  }
}

export class RateLimitExceededError extends AppError {
  constructor(limit: number, windowMs: number, retryAfter: number) {
    super(
      `Rate limit exceeded. ${limit} requests per ${windowMs}ms allowed.`,
      HttpStatus.TOO_MANY_REQUESTS,
      ApiErrorCodes.RATE_LIMIT_EXCEEDED,
      { limit, windowMs, retryAfter }
    );
  }
}

/**
 * Error response for method not allowed
 */
export function createMethodNotAllowedResponse(allowedMethods: string[]): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
        timestamp: new Date().toISOString()
      }
    },
    {
      status: HttpStatus.METHOD_NOT_ALLOWED,
      headers: {
        Allow: allowedMethods.join(', ')
      }
    }
  );
}

/**
 * Validation error formatter
 */
export function formatValidationErrors(error: ZodError) {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    received: 'received' in err ? err.received : undefined
  }));
}

/**
 * Error monitoring integration
 */
interface ErrorMonitoringService {
  captureException(error: Error, context?: Record<string, any>): void;
  captureMessage(message: string, level: 'info' | 'warning' | 'error'): void;
}

let errorMonitoringService: ErrorMonitoringService | null = null;

export function initializeErrorMonitoring(service: ErrorMonitoringService) {
  errorMonitoringService = service;
}

export function captureError(error: Error, context?: Record<string, any>) {
  if (errorMonitoringService) {
    errorMonitoringService.captureException(error, context);
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (errorMonitoringService) {
    errorMonitoringService.captureMessage(message, level);
  }
}