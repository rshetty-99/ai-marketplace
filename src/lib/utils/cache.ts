/**
 * Caching utilities for the AI Marketplace
 * Provides in-memory caching, Redis integration, and cache invalidation strategies
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Cache entry interface
 */
interface CacheEntry<T = any> {
  data: T;
  expiry: number;
  createdAt: number;
  tags?: string[];
  size?: number;
}

/**
 * Cache statistics
 */
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  memoryUsage: number;
}

/**
 * Cache options
 */
interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // Tags for cache invalidation
  serialize?: boolean; // Whether to serialize complex objects
  compress?: boolean; // Whether to compress large values
  maxSize?: number; // Maximum size in bytes
}

/**
 * In-memory cache implementation
 */
export class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    memoryUsage: 0
  };

  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 100 * 1024 * 1024, defaultTTL: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;

    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Set value in cache
   */
  set<T = any>(key: string, value: T, options: CacheOptions = {}): boolean {
    const ttl = options.ttl || this.defaultTTL;
    const expiry = Date.now() + ttl;

    // Serialize if needed
    let data = value;
    if (options.serialize && typeof value === 'object') {
      data = JSON.parse(JSON.stringify(value)) as T;
    }

    // Calculate size
    let size = 0;
    if (options.maxSize || this.shouldTrackSize()) {
      size = this.calculateSize(data);
      
      if (options.maxSize && size > options.maxSize) {
        return false; // Value too large
      }
    }

    // Check total cache size
    if (this.stats.memoryUsage + size > this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      expiry,
      createdAt: Date.now(),
      tags: options.tags,
      size
    };

    this.cache.set(key, entry);
    this.stats.sets++;
    this.stats.memoryUsage += size;

    return true;
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.stats.deletes++;
      this.stats.memoryUsage -= entry.size || 0;
      return true;
    }
    return false;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.stats.evictions++;
      return false;
    }

    return true;
  }

  /**
   * Clear cache by tags
   */
  invalidateByTags(tags: string[]): number {
    let count = 0;
    const tagSet = new Set(tags);

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.some(tag => tagSet.has(tag))) {
        this.cache.delete(key);
        this.stats.memoryUsage -= entry.size || 0;
        count++;
      }
    }

    this.stats.deletes += count;
    return count;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.memoryUsage = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { size: number; hitRate: number } {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Get all keys matching pattern
   */
  keys(pattern?: RegExp): string[] {
    const allKeys = Array.from(this.cache.keys());
    return pattern ? allKeys.filter(key => pattern.test(key)) : allKeys;
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T> | T,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, options);
    return value;
  }

  private cleanup(): void {
    const now = Date.now();
    let evicted = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        this.stats.memoryUsage -= entry.size || 0;
        evicted++;
      }
    }

    this.stats.evictions += evicted;
  }

  private evictLRU(): void {
    // Find least recently used entry (by creation time for simplicity)
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  private shouldTrackSize(): boolean {
    return this.cache.size > 1000; // Only track size for larger caches
  }

  private calculateSize(data: any): number {
    if (typeof data === 'string') {
      return data.length * 2; // Assuming UTF-16
    }
    
    if (typeof data === 'number') {
      return 8; // 64-bit number
    }
    
    if (typeof data === 'boolean') {
      return 1;
    }
    
    if (data === null || data === undefined) {
      return 0;
    }
    
    // Rough estimate for objects
    return JSON.stringify(data).length * 2;
  }
}

/**
 * Redis cache implementation (for production)
 */
export class RedisCache {
  private client: any = null;
  private connected = false;

  constructor(private redisUrl?: string) {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (typeof window !== 'undefined') {
      return; // Skip Redis in browser
    }

    // Skip Redis in development environment
    if (process.env.NODE_ENV === 'development' && !process.env.REDIS_URL) {
      console.log('Skipping Redis connection in development mode');
      return;
    }

    try {
      // Dynamic import for server-side only
      const Redis = (await import('ioredis')).default;
      this.client = new Redis(this.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
      
      this.client.on('connect', () => {
        this.connected = true;
        console.log('Redis connected');
      });

      this.client.on('error', (error: Error) => {
        console.error('Redis error:', error);
        this.connected = false;
      });
    } catch (error) {
      console.warn('Redis not available, falling back to memory cache');
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.connected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T = any>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async invalidateByPattern(pattern: string): Promise<number> {
    if (!this.connected || !this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;
      
      const result = await this.client.del(...keys);
      return result;
    } catch (error) {
      console.error('Redis pattern delete error:', error);
      return 0;
    }
  }

  async clear(): Promise<void> {
    if (!this.connected || !this.client) {
      return;
    }

    try {
      await this.client.flushdb();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }
}

/**
 * Multi-tier cache (memory + Redis)
 */
export class TieredCache {
  private memoryCache: MemoryCache;
  private redisCache: RedisCache;

  constructor(
    memoryCacheSize: number = 50 * 1024 * 1024, // 50MB
    redisUrl?: string
  ) {
    this.memoryCache = new MemoryCache(memoryCacheSize);
    this.redisCache = new RedisCache(redisUrl);
  }

  async get<T = any>(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryResult = this.memoryCache.get<T>(key);
    if (memoryResult !== null) {
      return memoryResult;
    }

    // Try Redis cache
    const redisResult = await this.redisCache.get<T>(key);
    if (redisResult !== null) {
      // Populate memory cache
      this.memoryCache.set(key, redisResult);
      return redisResult;
    }

    return null;
  }

  async set<T = any>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttlSeconds = options.ttl ? Math.floor(options.ttl / 1000) : undefined;

    // Set in memory cache
    this.memoryCache.set(key, value, options);

    // Set in Redis cache
    await this.redisCache.set(key, value, ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.redisCache.delete(key);
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    this.memoryCache.invalidateByTags(tags);
    
    // For Redis, we'd need to implement tag tracking
    // This is a simplified version
    for (const tag of tags) {
      await this.redisCache.invalidateByPattern(`*:${tag}:*`);
    }
  }
}

/**
 * HTTP response caching middleware
 */
export function withHttpCache(options: {
  ttl?: number;
  tags?: string[];
  key?: (req: NextRequest) => string;
  condition?: (req: NextRequest) => boolean;
}) {
  return function <T>(
    handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
      // Check condition
      if (options.condition && !options.condition(req)) {
        return handler(req, ...args);
      }

      // Generate cache key
      const cacheKey = options.key 
        ? options.key(req)
        : `http:${req.method}:${req.url}`;

      // Try to get from cache
      const cached = cache.get(cacheKey);
      if (cached) {
        return new NextResponse(cached.body, {
          status: cached.status,
          statusText: cached.statusText,
          headers: {
            ...cached.headers,
            'X-Cache': 'HIT'
          }
        });
      }

      // Execute handler
      const response = await handler(req, ...args);

      // Only cache successful responses
      if (response.status === 200) {
        const body = await response.text();
        const cacheData = {
          body,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        };

        cache.set(cacheKey, cacheData, {
          ttl: options.ttl,
          tags: options.tags
        });

        // Return response with cache miss header
        return new NextResponse(body, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            'X-Cache': 'MISS'
          }
        });
      }

      return response;
    };
  };
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  organization: (orgId: string) => `org:${orgId}`,
  project: (projectId: string) => `project:${projectId}`,
  service: (serviceId: string) => `service:${serviceId}`,
  provider: (providerId: string) => `provider:${providerId}`,
  search: (query: string, filters: string) => `search:${Buffer.from(query + filters).toString('base64')}`,
  analytics: (type: string, period: string, date: string) => `analytics:${type}:${period}:${date}`,
  api: (endpoint: string, params: string) => `api:${endpoint}:${Buffer.from(params).toString('base64')}`,
};

/**
 * Cache invalidation tags
 */
export const CacheTags = {
  USER: 'user',
  ORGANIZATION: 'organization',
  PROJECT: 'project',
  SERVICE: 'service',
  PROVIDER: 'provider',
  SEARCH: 'search',
  ANALYTICS: 'analytics',
  MARKETPLACE: 'marketplace',
};

// Global cache instances
export const cache = new MemoryCache();
export const redisCache = new RedisCache();
export const tieredCache = new TieredCache();

/**
 * Cache warmup utilities
 */
export class CacheWarmer {
  static async warmupUserData(userId: string): Promise<void> {
    try {
      // TODO: Implement user data warmup
      // This would pre-populate cache with user's frequently accessed data
      console.log(`Warming up cache for user: ${userId}`);
    } catch (error) {
      console.error('Cache warmup error:', error);
    }
  }

  static async warmupOrganizationData(orgId: string): Promise<void> {
    try {
      // TODO: Implement organization data warmup
      console.log(`Warming up cache for organization: ${orgId}`);
    } catch (error) {
      console.error('Cache warmup error:', error);
    }
  }

  static async warmupPopularContent(): Promise<void> {
    try {
      // TODO: Implement popular content warmup
      console.log('Warming up popular content cache');
    } catch (error) {
      console.error('Cache warmup error:', error);
    }
  }
}

// Export cache utilities
export { MemoryCache, RedisCache, TieredCache, CacheWarmer };
export type { CacheEntry, CacheStats, CacheOptions };