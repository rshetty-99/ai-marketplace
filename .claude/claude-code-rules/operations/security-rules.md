# Security Rules for Enterprise SaaS

## Security-First Development Principles

### 1. Authentication & Authorization

#### Clerk Integration Security
```typescript
// Always verify Clerk authentication
import { requireAuth } from '@clerk/nextjs';

export async function protectedRoute(req: NextRequest) {
  // Never trust client-side auth claims
  const { userId, sessionClaims } = requireAuth();
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Verify session is valid
  const session = await clerkClient.sessions.getSession(sessionClaims.sid);
  if (!session || session.status !== 'active') {
    return new Response('Invalid session', { status: 401 });
  }
  
  // Map to internal user
  const user = await mapClerkUserToInternal(userId);
  if (!user) {
    return new Response('User not found', { status: 404 });
  }
  
  // Continue with verified user
}
```

#### RBAC Implementation
```typescript
// Hierarchical permission system
const permissionHierarchy = {
  'super_admin': ['*'], // All permissions
  'org_admin': [
    'org:*',
    'subsidiary:read',
    'subsidiary:create',
    'channel:read'
  ],
  'subsidiary_admin': [
    'subsidiary:*',
    'channel:read'
  ],
  'channel_partner': [
    'channel:*',
    'marketplace:read',
    'marketplace:create:own'
  ],
  'user': [
    'profile:*:own',
    'marketplace:read'
  ]
};

// Permission checking middleware
export function requirePermission(permission: string) {
  return async (req: NextRequest) => {
    const user = await getCurrentUser(req);
    const userPermissions = getUserPermissions(user.role);
    
    if (!hasPermission(userPermissions, permission)) {
      return new Response('Forbidden', { status: 403 });
    }
  };
}
```

### 2. Input Validation & Sanitization

#### Zod Schema Validation
```typescript
// Every API input MUST be validated
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Define strict schemas
const createOrgSchema = z.object({
  name: z.string()
    .min(2, 'Name too short')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Invalid characters'),
  email: z.string().email(),
  type: z.enum(['enterprise', 'business', 'starter']),
  subdomain: z.string()
    .regex(/^[a-z0-9-]+$/, 'Invalid subdomain')
    .transform(val => val.toLowerCase()),
  metadata: z.record(z.string()).optional()
});

// Validate and sanitize
export async function validateInput<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    // Parse and validate
    const validated = schema.parse(data);
    
    // Additional sanitization
    return sanitizeData(validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors);
    }
    throw error;
  }
}

// HTML/Script injection prevention
function sanitizeData<T>(data: T): T {
  if (typeof data === 'string') {
    return DOMPurify.sanitize(data) as T;
  }
  if (typeof data === 'object' && data !== null) {
    return Object.entries(data).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: sanitizeData(value)
    }), {} as T);
  }
  return data;
}
```

### 3. API Security

#### Rate Limiting
```typescript
// Implement multi-tier rate limiting
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = {
  // Per IP rate limiting
  ip: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true
  }),
  
  // Per user rate limiting
  user: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(1000, '1 h'),
    analytics: true
  }),
  
  // Per tenant rate limiting
  tenant: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10000, '1 h'),
    analytics: true
  }),
  
  // Strict limits for sensitive operations
  sensitive: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.fixedWindow(5, '15 m'),
    analytics: true
  })
};

// Apply rate limiting
export async function withRateLimit(req: NextRequest) {
  const ip = req.ip ?? '127.0.0.1';
  const { success, limit, reset, remaining } = await ratelimit.ip.limit(ip);
  
  if (!success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset).toISOString()
      }
    });
  }
}
```

#### CORS Configuration
```typescript
// Strict CORS policy
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://yourdomain.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

// Apply CORS
export async function withCORS(req: NextRequest) {
  // Check origin
  const origin = req.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  
  if (origin && !allowedOrigins.includes(origin)) {
    return new Response('CORS policy violation', { status: 403 });
  }
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
}
```

### 4. Data Security

#### Encryption at Rest
```typescript
// Encrypt sensitive data before storage
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encryptData(text: string): EncryptedData {
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, secretKey, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

export function decryptData(encryptedData: EncryptedData): string {
  const decipher = createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

#### Firestore Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isTenantAdmin(orgId) {
      return isSignedIn() && 
        get(/databases/$(database)/documents/organizations/$(orgId)/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function hasPermission(orgId, permission) {
      return isSignedIn() && 
        permission in get(/databases/$(database)/documents/organizations/$(orgId)/users/$(request.auth.uid)).data.permissions;
    }
    
    function belongsToTenant(orgId) {
      return isSignedIn() && 
        request.auth.uid in get(/databases/$(database)/documents/organizations/$(orgId)).data.members;
    }
    
    // Organization rules
    match /organizations/{orgId} {
      allow read: if belongsToTenant(orgId);
      allow create: if isSignedIn() && request.auth.token.role == 'org_admin';
      allow update: if isTenantAdmin(orgId);
      allow delete: if false; // Soft delete only
      
      // Subcollections
      match /subsidiaries/{subId} {
        allow read: if hasPermission(orgId, 'subsidiaries:read');
        allow write: if hasPermission(orgId, 'subsidiaries:write');
      }
      
      match /channelPartners/{partnerId} {
        allow read: if hasPermission(orgId, 'partners:read');
        allow write: if hasPermission(orgId, 'partners:write');
      }
      
      match /auditLogs/{logId} {
        allow read: if isTenantAdmin(orgId);
        allow write: if false; // Write only through admin SDK
      }
    }
    
    // Marketplace rules
    match /marketplace/{listingId} {
      allow read: if true; // Public read
      allow create: if isSignedIn() && request.auth.uid == resource.data.createdBy;
      allow update: if isSignedIn() && request.auth.uid == resource.data.createdBy;
      allow delete: if false; // Soft delete only
    }
  }
}
```

### 5. Session Management

```typescript
// Secure session handling
export const sessionConfig = {
  secret: process.env.SESSION_SECRET!,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  rolling: true,
  renew: true
};

// Session validation
export async function validateSession(sessionId: string): Promise<boolean> {
  const session = await getSession(sessionId);
  
  if (!session) return false;
  if (session.expiresAt < new Date()) return false;
  if (session.ipAddress !== currentIp) return false;
  if (session.userAgent !== currentUserAgent) return false;
  
  // Refresh session
  await refreshSession(sessionId);
  return true;
}
```

### 6. XSS Prevention

```typescript
// Content Security Policy
export const cspHeaders = {
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https://api.clerk.com https://*.firebase.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim()
};

// XSS protection headers
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  ...cspHeaders
};
```

### 7. SQL Injection Prevention

```typescript
// Always use parameterized queries
// Even though Firestore is NoSQL, similar principles apply

// ❌ WRONG - String concatenation
const query = db.collection('users').where('email', '==', userInput);

// ✅ CORRECT - Parameterized with validation
const emailSchema = z.string().email();
const validatedEmail = emailSchema.parse(userInput);
const query = db.collection('users').where('email', '==', validatedEmail);

// For complex queries
export function buildSecureQuery(filters: Record<string, any>) {
  // Validate all inputs
  const validatedFilters = validateQueryFilters(filters);
  
  // Build query safely
  let query = db.collection('organizations');
  
  for (const [field, value] of Object.entries(validatedFilters)) {
    if (allowedFields.includes(field)) {
      query = query.where(field, '==', value);
    }
  }
  
  return query;
}
```

### 8. File Upload Security

```typescript
// Secure file upload handling
const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/csv'
];

const maxFileSize = 10 * 1024 * 1024; // 10MB

export async function validateFileUpload(file: File): Promise<void> {
  // Check file size
  if (file.size > maxFileSize) {
    throw new Error('File too large');
  }
  
  // Check MIME type
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'csv'];
  
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new Error('Invalid file extension');
  }
  
  // Scan for malware (integrate with service)
  await scanFileForMalware(file);
  
  // Generate safe filename
  const safeFilename = generateSafeFilename(file.name);
  
  // Store with restricted permissions
  await storeFileSecurely(file, safeFilename);
}
```

### 9. API Key Management

```typescript
// Secure API key handling
export class APIKeyManager {
  // Generate secure API keys
  static generateKey(): string {
    return `sk_${randomBytes(32).toString('hex')}`;
  }
  
  // Hash API keys for storage
  static hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }
  
  // Validate API key
  static async validateKey(key: string): Promise<boolean> {
    const hashedKey = this.hashKey(key);
    const keyRecord = await db.collection('apiKeys')
      .where('hash', '==', hashedKey)
      .where('active', '==', true)
      .get();
    
    if (keyRecord.empty) return false;
    
    const data = keyRecord.docs[0].data();
    
    // Check expiration
    if (data.expiresAt && data.expiresAt < new Date()) {
      return false;
    }
    
    // Check rate limits
    if (data.requestCount >= data.rateLimit) {
      return false;
    }
    
    // Update usage
    await keyRecord.docs[0].ref.update({
      requestCount: data.requestCount + 1,
      lastUsed: new Date()
    });
    
    return true;
  }
}
```

### 10. Audit Logging

```typescript
// Comprehensive audit logging
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  tenantId: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure';
  metadata: Record<string, any>;
}

export async function logSecurityEvent(event: Partial<AuditLog>): Promise<void> {
  const log: AuditLog = {
    id: generateId(),
    timestamp: new Date(),
    ...event,
    result: event.result || 'success'
  };
  
  // Store in Firestore
  await db.collection('auditLogs').add(log);
  
  // Alert on suspicious activity
  if (isSuspicious(log)) {
    await alertSecurityTeam(log);
  }
}

function isSuspicious(log: AuditLog): boolean {
  // Multiple failed login attempts
  // Access from unusual location
  // Privilege escalation attempts
  // Data exfiltration patterns
  return false; // Implement logic
}
```

### 11. GDPR Compliance

```typescript
// GDPR compliance helpers
export class GDPRCompliance {
  // Data export
  static async exportUserData(userId: string): Promise<UserData> {
    const data = await collectAllUserData(userId);
    return encryptData(JSON.stringify(data));
  }
  
  // Data deletion
  static async deleteUserData(userId: string): Promise<void> {
    // Soft delete with retention period
    await db.collection('users').doc(userId).update({
      deleted: true,
      deletedAt: new Date(),
      scheduledPurge: addDays(new Date(), 30)
    });
    
    // Schedule hard delete
    await scheduleDataPurge(userId, 30);
  }
  
  // Consent management
  static async updateConsent(userId: string, consent: ConsentData): Promise<void> {
    await db.collection('users').doc(userId).update({
      consent: {
        ...consent,
        timestamp: new Date(),
        ipAddress: getCurrentIp()
      }
    });
  }
}
```

### 12. HIPAA Compliance

```typescript
// HIPAA compliance for healthcare data
export class HIPAACompliance {
  // PHI encryption
  static encryptPHI(data: any): EncryptedData {
    return encryptData(JSON.stringify(data));
  }
  
  // Access logging
  static async logPHIAccess(userId: string, patientId: string, action: string): Promise<void> {
    await db.collection('phiAccessLogs').add({
      userId,
      patientId,
      action,
      timestamp: new Date(),
      ipAddress: getCurrentIp(),
      justification: await getAccessJustification()
    });
  }
  
  // Minimum necessary access
  static filterPHIData(data: any, userRole: string): any {
    const allowedFields = PHIFieldsByRole[userRole];
    return pick(data, allowedFields);
  }
}
```

### 13. Security Monitoring

```typescript
// Real-time security monitoring
export class SecurityMonitor {
  // Monitor failed login attempts
  static async trackFailedLogin(email: string, ip: string): Promise<void> {
    const key = `failed_login:${email}:${ip}`;
    const attempts = await redis.incr(key);
    await redis.expire(key, 900); // 15 minutes
    
    if (attempts > 5) {
      await this.blockIP(ip);
      await this.notifyUser(email);
    }
  }
  
  // Monitor API usage patterns
  static async detectAnomalies(userId: string, endpoint: string): Promise<boolean> {
    const pattern = await getUsagePattern(userId, endpoint);
    const current = await getCurrentUsage(userId, endpoint);
    
    if (isAnomaly(pattern, current)) {
      await alertSecurityTeam({
        type: 'usage_anomaly',
        userId,
        endpoint,
        pattern,
        current
      });
      return true;
    }
    return false;
  }
}
```

### 14. Security Headers Middleware

```typescript
// Apply all security headers
export function securityMiddleware(req: NextRequest): NextResponse {
  const response = NextResponse.next();
  
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Remove sensitive headers
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');
  
  return response;
}
```

### 15. Security Checklist

#### Pre-Deployment Security Audit
- [ ] All inputs validated with Zod
- [ ] Rate limiting configured
- [ ] CORS properly set up
- [ ] CSP headers configured
- [ ] XSS protection enabled
- [ ] SQL injection prevention
- [ ] File upload validation
- [ ] API keys secured
- [ ] Audit logging enabled
- [ ] GDPR compliance checked
- [ ] HIPAA compliance (if applicable)
- [ ] Security monitoring active
- [ ] Penetration testing completed
- [ ] Dependency vulnerabilities scanned
- [ ] Secrets rotated