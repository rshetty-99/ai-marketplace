import { NextRequest } from 'next/server';
import { RateLimitExceededError } from './error-handler';

/**
 * Rate limiting implementation for API routes
 * Uses in-memory storage with configurable limits and windows
 */

interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
  onLimitReached?: (req: NextRequest, info: RateLimitInfo) => void;
}

interface RateLimitInfo {
  totalHits: number;
  totalHitsForUser: number;
  resetTime: Date;
  remaining: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequestTime: number;
}

// In-memory storage for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default rate limit configurations
const DEFAULT_RULES: Record<string, RateLimitRule> = {
  // General API endpoints
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Authentication endpoints (more strict)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Search and browse endpoints (higher limits)
  search: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 200,
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  },

  // File upload endpoints (very strict)
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Payment endpoints (extremely strict)
  payment: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Admin endpoints (moderate limits)
  admin: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 50,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Webhook endpoints (higher limits for external services)
  webhook: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 1000,
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  }
};

/**
 * Default key generator - uses IP address and user ID if available
 */
function defaultKeyGenerator(req: NextRequest): string {
  const ip = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userId = req.headers.get('x-user-id') || '';
  return `${ip}:${userId}`;
}

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get or create rate limit entry
 */
function getRateLimitEntry(key: string, windowMs: number): RateLimitEntry {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  // If entry exists and hasn't expired, return it
  if (existing && now < existing.resetTime) {
    return existing;
  }

  // Create new entry
  const newEntry: RateLimitEntry = {
    count: 0,
    resetTime: now + windowMs,
    firstRequestTime: now
  };

  rateLimitStore.set(key, newEntry);
  return newEntry;
}

/**
 * Rate limiter middleware
 */
export class RateLimiter {
  private rules: Map<string, RateLimitRule> = new Map();

  constructor(customRules?: Record<string, RateLimitRule>) {
    // Set default rules
    Object.entries(DEFAULT_RULES).forEach(([name, rule]) => {
      this.rules.set(name, rule);
    });

    // Override with custom rules
    if (customRules) {
      Object.entries(customRules).forEach(([name, rule]) => {
        this.rules.set(name, rule);
      });
    }

    // Clean up expired entries every 5 minutes
    setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
  }

  /**
   * Add or update a rate limit rule
   */
  addRule(name: string, rule: RateLimitRule): void {
    this.rules.set(name, rule);
  }

  /**
   * Check rate limit for a request
   */
  async checkRateLimit(
    req: NextRequest,
    ruleName: string = 'default'
  ): Promise<RateLimitInfo> {
    const rule = this.rules.get(ruleName) || DEFAULT_RULES.default;
    const keyGenerator = rule.keyGenerator || defaultKeyGenerator;
    const key = `${ruleName}:${keyGenerator(req)}`;

    const entry = getRateLimitEntry(key, rule.windowMs);
    const now = Date.now();

    // Increment counter
    entry.count += 1;

    const info: RateLimitInfo = {
      totalHits: entry.count,
      totalHitsForUser: entry.count,
      resetTime: new Date(entry.resetTime),
      remaining: Math.max(0, rule.maxRequests - entry.count)
    };

    // Check if limit exceeded
    if (entry.count > rule.maxRequests) {
      if (rule.onLimitReached) {
        rule.onLimitReached(req, info);
      }

      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      throw new RateLimitExceededError(rule.maxRequests, rule.windowMs, retryAfter);
    }

    return info;
  }

  /**
   * Create rate limit middleware for specific rule
   */
  createMiddleware(ruleName: string = 'default') {
    return async (req: NextRequest): Promise<RateLimitInfo> => {
      return await this.checkRateLimit(req, ruleName);
    };
  }

  /**
   * Get rate limit info without incrementing counter
   */
  getRateLimitInfo(req: NextRequest, ruleName: string = 'default'): RateLimitInfo | null {
    const rule = this.rules.get(ruleName) || DEFAULT_RULES.default;
    const keyGenerator = rule.keyGenerator || defaultKeyGenerator;
    const key = `${ruleName}:${keyGenerator(req)}`;

    const entry = rateLimitStore.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return null;
    }

    return {
      totalHits: entry.count,
      totalHitsForUser: entry.count,
      resetTime: new Date(entry.resetTime),
      remaining: Math.max(0, rule.maxRequests - entry.count)
    };
  }

  /**
   * Reset rate limit for a key
   */
  resetRateLimit(req: NextRequest, ruleName: string = 'default'): void {
    const rule = this.rules.get(ruleName) || DEFAULT_RULES.default;
    const keyGenerator = rule.keyGenerator || defaultKeyGenerator;
    const key = `${ruleName}:${keyGenerator(req)}`;
    rateLimitStore.delete(key);
  }

  /**
   * Get all rate limit statistics
   */
  getStats(): {
    totalKeys: number;
    ruleNames: string[];
    memoryUsage: number;
  } {
    return {
      totalKeys: rateLimitStore.size,
      ruleNames: Array.from(this.rules.keys()),
      memoryUsage: JSON.stringify(Array.from(rateLimitStore.entries())).length
    };
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit decorator for API route handlers
 */
export function withRateLimit(
  ruleName: string = 'default',
  skipCondition?: (req: NextRequest) => boolean
) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;

    descriptor.value = (async function (this: any, req: NextRequest, ...args: any[]) {
      // Skip rate limiting if condition is met
      if (skipCondition && skipCondition(req)) {
        return method.apply(this, [req, ...args]);
      }

      // Check rate limit
      await rateLimiter.checkRateLimit(req, ruleName);

      // Call original method
      return method.apply(this, [req, ...args]);
    }) as T;

    return descriptor;
  };
}

/**
 * Rate limit headers helper
 */
export function addRateLimitHeaders(
  headers: Headers,
  info: RateLimitInfo,
  rule: RateLimitRule
): void {
  headers.set('X-RateLimit-Limit', rule.maxRequests.toString());
  headers.set('X-RateLimit-Remaining', info.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.ceil(info.resetTime.getTime() / 1000).toString());
  headers.set('X-RateLimit-Window', rule.windowMs.toString());
}

/**
 * Specialized rate limiters for different use cases
 */

// IP-based rate limiter (for public endpoints)
export const ipRateLimiter = new RateLimiter({
  ip_based: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    keyGenerator: (req) => req.ip || req.headers.get('x-forwarded-for') || 'unknown'
  }
});

// User-based rate limiter (for authenticated endpoints)
export const userRateLimiter = new RateLimiter({
  user_based: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 200,
    keyGenerator: (req) => req.headers.get('x-user-id') || req.headers.get('authorization') || 'anonymous'
  }
});

// Organization-based rate limiter (for tenant-based limits)
export const organizationRateLimiter = new RateLimiter({
  organization_based: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10000,
    keyGenerator: (req) => req.headers.get('x-organization-id') || 'unknown'
  }
});

/**
 * Dynamic rate limiting based on user tier
 */
export function createTieredRateLimit(req: NextRequest): RateLimitRule {
  const userTier = req.headers.get('x-user-tier') || 'free';
  
  const tierLimits: Record<string, Partial<RateLimitRule>> = {
    free: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100/hour
    premium: { maxRequests: 500, windowMs: 60 * 60 * 1000 }, // 500/hour
    enterprise: { maxRequests: 2000, windowMs: 60 * 60 * 1000 } // 2000/hour
  };

  const tierConfig = tierLimits[userTier] || tierLimits.free;

  return {
    ...DEFAULT_RULES.default,
    ...tierConfig
  };
}

/**
 * Rate limit bypass for internal services
 */
export function shouldBypassRateLimit(req: NextRequest): boolean {
  const internalToken = req.headers.get('x-internal-service-token');
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;
  
  if (!internalToken || !expectedToken) {
    return false;
  }

  return internalToken === expectedToken;
}

/**
 * Sliding window rate limiter (more accurate but memory intensive)
 */
export class SlidingWindowRateLimiter {
  private windows = new Map<string, number[]>();

  async checkRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create window for this key
    let requests = this.windows.get(key) || [];

    // Remove old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);

    // Check if adding this request would exceed the limit
    if (requests.length >= maxRequests) {
      return false;
    }

    // Add current request
    requests.push(now);
    this.windows.set(key, requests);

    return true;
  }

  cleanup(): void {
    const now = Date.now();
    const maxWindowMs = 60 * 60 * 1000; // 1 hour

    for (const [key, requests] of this.windows.entries()) {
      const filteredRequests = requests.filter(timestamp => timestamp > now - maxWindowMs);
      
      if (filteredRequests.length === 0) {
        this.windows.delete(key);
      } else {
        this.windows.set(key, filteredRequests);
      }
    }
  }
}

// Export rate limiting utilities
export { DEFAULT_RULES as RATE_LIMIT_RULES };
export type { RateLimitRule, RateLimitInfo, RateLimitEntry };