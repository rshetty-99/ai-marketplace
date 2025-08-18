/**
 * Enhanced Firebase Storage Architecture for AI Marketplace
 * Performance-optimized structure with GDPR compliance, selective deletion,
 * hot/warm/cold storage patterns, and comprehensive file management
 */

export enum FileType {
  // Profile & Identity (Personal - DELETE on user removal)
  PROFILE_AVATAR = 'personal/profile/avatar',
  PROFILE_COVER = 'personal/profile/cover',
  PROFILE_BANNER = 'personal/profile/banner',
  
  // Company Assets (Business - TRANSFER on user removal)
  COMPANY_LOGO = 'business/company/logo',
  COMPANY_BANNER = 'business/company/banner',
  COMPANY_ASSETS = 'business/company/assets',
  
  // Personal Documents (Personal - DELETE on user removal)
  PERSONAL_VERIFICATION = 'personal/verification/documents',
  PERSONAL_IDENTITY = 'personal/identity/documents',
  PERSONAL_CERTIFICATES = 'personal/certificates/documents',
  
  // Business Documents (Business - ANONYMIZE on user removal)
  CONTRACT_DOCUMENT = 'business/contracts/documents',
  INVOICE_DOCUMENT = 'business/invoices/documents',
  LEGAL_DOCUMENT = 'business/legal/documents',
  COMPLIANCE_DOCUMENT = 'business/compliance/documents',
  
  // Portfolio & Work Samples (Business - TRANSFER/ANONYMIZE)
  PORTFOLIO_IMAGE = 'business/portfolio/images',
  PORTFOLIO_VIDEO = 'business/portfolio/videos',
  PORTFOLIO_DOCUMENT = 'business/portfolio/documents',
  CASE_STUDY_ASSET = 'business/portfolio/case-studies',
  WORK_SAMPLE = 'business/portfolio/samples',
  
  // Project Files (Business - KEEP with anonymized ownership)
  PROJECT_ASSET = 'projects/assets',
  PROJECT_DELIVERABLE = 'projects/deliverables',
  PROJECT_REQUIREMENT = 'projects/requirements',
  PROJECT_FEEDBACK = 'projects/feedback',
  PROJECT_DOCUMENTATION = 'projects/documentation',
  
  // Communication (Business - ANONYMIZE sender info)
  MESSAGE_ATTACHMENT = 'conversations/attachments',
  CHAT_MEDIA = 'conversations/media',
  SHARED_FILES = 'conversations/shared',
  
  // Content & Marketing (Public - KEEP)
  BLOG_IMAGE = 'public/content/blog/images',
  BLOG_VIDEO = 'public/content/blog/videos',
  MARKETING_ASSET = 'public/marketing/assets',
  SERVICE_MEDIA = 'public/services/media',
  
  // System & Temporary (System - AUTO-CLEANUP)
  TEMP_UPLOAD = 'temp/uploads',
  SYSTEM_BACKUP = 'system/backups',
  ANALYTICS_EXPORT = 'system/analytics/exports',
  AUDIT_EXPORT = 'system/audit/exports'
}

export enum UserType {
  FREELANCER = 'freelancer',
  VENDOR = 'vendor',
  CUSTOMER = 'customer',
  ORGANIZATION = 'organization',
  PLATFORM = 'platform'
}

export enum AccessPattern {
  HOT = 'hot',     // Frequently accessed - fast retrieval
  WARM = 'warm',   // Occasionally accessed - standard retrieval
  COLD = 'cold'    // Rarely accessed - slower but cheaper
}

export enum FileClassification {
  PERSONAL = 'personal',       // DELETE on user removal
  BUSINESS = 'business',       // TRANSFER/ANONYMIZE on user removal
  SHARED = 'shared',          // KEEP with anonymized ownership
  PUBLIC = 'public',          // KEEP forever
  SYSTEM = 'system'           // AUTO-CLEANUP based on policies
}

export enum GDPRRetentionBasis {
  CONSENT = 'consent',                    // Delete when consent withdrawn
  CONTRACT = 'contract',                  // Keep for contract duration + legal period
  LEGAL_OBLIGATION = 'legal_obligation',  // Keep for legal requirement period
  LEGITIMATE_INTEREST = 'legitimate_interest' // Keep for business purposes
}

/**
 * Firebase Storage Path Structure
 */
export class StoragePathBuilder {
  /**
   * Build performance-optimized storage path for user-specific files
   * Pattern: {accessPattern}/{date-shard}/{user-shard}/{userType}/{userId}/{fileType}/{fileName}
   */
  static buildUserPath(
    userType: UserType,
    userId: string,
    fileType: FileType,
    fileName: string,
    accessPattern: AccessPattern = AccessPattern.WARM
  ): string {
    const dateShard = new Date().toISOString().slice(0, 7); // YYYY-MM
    const userShard = userId.slice(-2); // Last 2 chars for sharding
    
    return `${accessPattern}/${dateShard}/${userShard}/users/${userType}/${userId}/${fileType}/${fileName}`;
  }

  /**
   * Build storage path for personal files (DELETE on user removal)
   */
  static buildPersonalPath(
    userType: UserType,
    userId: string,
    fileType: FileType,
    fileName: string
  ): string {
    return this.buildUserPath(userType, userId, fileType, fileName, AccessPattern.HOT);
  }

  /**
   * Build storage path for business files (TRANSFER/ANONYMIZE on user removal)
   */
  static buildBusinessPath(
    userType: UserType,
    userId: string,
    fileType: FileType,
    fileName: string,
    organizationId?: string
  ): string {
    const basePath = this.buildUserPath(userType, userId, fileType, fileName, AccessPattern.WARM);
    return organizationId ? `${basePath}?org=${organizationId}` : basePath;
  }

  /**
   * Build storage path for organization files
   * Pattern: {accessPattern}/{date-shard}/organizations/{orgId}/{fileType}/{fileName}
   */
  static buildOrganizationPath(
    orgId: string,
    fileType: FileType,
    fileName: string,
    accessPattern: AccessPattern = AccessPattern.WARM
  ): string {
    const dateShard = new Date().toISOString().slice(0, 7);
    const orgShard = orgId.slice(-2);
    
    return `${accessPattern}/${dateShard}/${orgShard}/organizations/${orgId}/${fileType}/${fileName}`;
  }

  /**
   * Build storage path for project files
   * Pattern: {accessPattern}/{date-shard}/projects/{projectId}/{fileType}/{fileName}
   */
  static buildProjectPath(
    projectId: string,
    fileType: FileType,
    fileName: string,
    accessPattern: AccessPattern = AccessPattern.WARM
  ): string {
    const dateShard = new Date().toISOString().slice(0, 7);
    const projectShard = projectId.slice(-2);
    
    return `${accessPattern}/${dateShard}/${projectShard}/projects/${projectId}/${fileType}/${fileName}`;
  }

  /**
   * Build storage path for public content with CDN optimization
   * Pattern: {accessPattern}/public/{contentType}/{id}/{fileName}
   */
  static buildPublicPath(
    contentType: string,
    id: string,
    fileName: string,
    accessPattern: AccessPattern = AccessPattern.HOT
  ): string {
    const dateShard = new Date().toISOString().slice(0, 7);
    return `${accessPattern}/${dateShard}/public/${contentType}/${id}/${fileName}`;
  }

  /**
   * Build storage path for temporary files with auto-cleanup
   * Pattern: temp/{date}/{sessionId}/{fileName}
   */
  static buildTempPath(sessionId: string, fileName: string): string {
    const dateShard = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return `temp/${dateShard}/${sessionId}/${fileName}`;
  }

  /**
   * Build storage path for conversation files (anonymize on user removal)
   */
  static buildConversationPath(
    conversationId: string,
    fileType: FileType,
    fileName: string
  ): string {
    const dateShard = new Date().toISOString().slice(0, 7);
    return `warm/${dateShard}/conversations/${conversationId}/${fileType}/${fileName}`;
  }

  /**
   * Extract user ID from storage path
   */
  static extractUserIdFromPath(path: string): string | null {
    const match = path.match(/^users\/[^\/]+\/([^\/]+)\//);
    return match ? match[1] : null;
  }

  /**
   * Extract organization ID from storage path
   */
  static extractOrgIdFromPath(path: string): string | null {
    const match = path.match(/^organizations\/([^\/]+)\//);
    return match ? match[1] : null;
  }

  /**
   * Extract project ID from storage path
   */
  static extractProjectIdFromPath(path: string): string | null {
    const match = path.match(/^projects\/([^\/]+)\//);
    return match ? match[1] : null;
  }

  /**
   * Extract access pattern from storage path
   */
  static extractAccessPattern(path: string): AccessPattern {
    if (path.startsWith('hot/')) return AccessPattern.HOT;
    if (path.startsWith('warm/')) return AccessPattern.WARM;
    if (path.startsWith('cold/')) return AccessPattern.COLD;
    return AccessPattern.WARM; // default
  }

  /**
   * Determine optimal access pattern based on file type and usage
   */
  static getOptimalAccessPattern(fileType: FileType): AccessPattern {
    // Frequently accessed files
    if ([
      FileType.PROFILE_AVATAR,
      FileType.COMPANY_LOGO,
      FileType.SERVICE_MEDIA
    ].includes(fileType)) {
      return AccessPattern.HOT;
    }
    
    // Rarely accessed files
    if ([
      FileType.PERSONAL_VERIFICATION,
      FileType.SYSTEM_BACKUP,
      FileType.AUDIT_EXPORT
    ].includes(fileType)) {
      return AccessPattern.COLD;
    }
    
    // Default to warm storage
    return AccessPattern.WARM;
  }
}

/**
 * Enhanced File metadata for tracking in Firestore with GDPR compliance
 */
export interface FileMetadata {
  id: string;
  fileName: string;
  originalName: string;
  storagePath: string;
  downloadUrl: string;
  fileType: FileType;
  mimeType: string;
  size: number; // bytes
  
  // Ownership
  uploadedBy: string; // user ID (can be anonymized)
  uploaderName?: string; // display name (can be anonymized)
  ownerId: string; // can be user, org, or project ID
  ownerType: 'user' | 'organization' | 'project' | 'public';
  
  // Timestamps
  uploadedAt: Date;
  lastAccessed?: Date;
  expiresAt?: Date; // for temporary files
  lastModified?: Date;
  
  // Security & Access
  isPublic: boolean;
  accessLevel: 'private' | 'organization' | 'project' | 'public';
  encryptionKey?: string; // for encrypted files
  
  // Performance & Storage
  accessPattern: AccessPattern;
  cacheExpiry?: Date;
  compressionEnabled?: boolean;
  thumbnailUrl?: string; // for images/videos
  
  // GDPR & Compliance
  dataClassification: FileClassification;
  retentionBasis: GDPRRetentionBasis;
  businessPurpose?: string;
  relatedEntities?: string[]; // Other users/orgs affected by this file
  isAnonymized?: boolean;
  anonymizedAt?: Date;
  
  // Versioning & Backup
  version?: number;
  parentFileId?: string; // for versioning
  isBackup?: boolean;
  backupOf?: string; // original file ID
  
  // Analytics
  downloadCount?: number;
  accessHistory?: FileAccessRecord[];
  
  // Additional metadata
  tags?: string[];
  description?: string;
  metadata?: Record<string, any>; // Flexible metadata
}

/**
 * File access record for analytics and audit
 */
export interface FileAccessRecord {
  userId: string;
  timestamp: Date;
  action: 'upload' | 'download' | 'view' | 'share' | 'delete';
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Storage summary for tracking usage
 */
export interface StorageSummary {
  userId?: string;
  organizationId?: string;
  projectId?: string;
  
  totalFiles: number;
  totalSize: number; // bytes
  
  filesByType: Record<FileType, {
    count: number;
    size: number;
  }>;
  
  lastUpdated: Date;
  
  // Quotas and limits
  quotaLimit?: number; // bytes
  quotaUsed: number; // bytes
  quotaPercentage: number;
}

/**
 * Enhanced File cleanup job metadata for GDPR compliance
 */
export interface CleanupJob {
  id: string;
  type: 'user_deletion' | 'user_gdpr_deletion' | 'project_cleanup' | 'temp_cleanup' | 'expired_files' | 'retention_policy';
  
  targetId: string; // user, org, or project ID
  targetType: 'user' | 'organization' | 'project';
  
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'partial';
  
  filesFound: number;
  filesDeleted: number;
  filesAnonymized: number;
  filesTransferred: number;
  totalSizeDeleted: number;
  
  // GDPR compliance tracking
  gdprReason?: 'user_request' | 'retention_expired' | 'consent_withdrawn';
  legalBasisKept?: string[]; // Files kept for legal reasons
  dataExportGenerated?: boolean;
  
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  errors?: string[];
  warnings?: string[];
  progress?: number; // 0-100
  
  // Audit trail
  requestedBy: string;
  approvedBy?: string;
  verifiedBy?: string;
  
  // Related jobs (for cascading operations)
  parentJobId?: string;
  childJobIds?: string[];
}

/**
 * File performance metrics
 */
export interface FilePerformanceMetrics {
  fileId: string;
  operation: 'upload' | 'download' | 'delete' | 'list';
  duration: number; // milliseconds
  fileSize: number; // bytes
  throughput: number; // bytes per second
  timestamp: Date;
  userId?: string;
  accessPattern: AccessPattern;
  cacheHit?: boolean;
  errorCode?: string;
}

/**
 * Storage cache entry
 */
export interface StorageCacheEntry {
  filePath: string;
  downloadUrl: string;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
  size: number;
}

/**
 * User deletion strategy configuration
 */
export interface UserDeletionStrategy {
  userId: string;
  userType: UserType;
  organizationId?: string;
  
  // Files to delete immediately
  personalFiles: string[];
  
  // Files to anonymize (keep for business purposes)
  businessFiles: {
    filePath: string;
    newOwnerId: string; // Transfer to organization
    anonymizeMetadata: boolean;
  }[];
  
  // Files to transfer ownership
  transferFiles: {
    filePath: string;
    newOwnerId: string;
    transferReason: string;
  }[];
  
  // Files to keep for legal/compliance reasons
  retainedFiles: {
    filePath: string;
    retentionReason: string;
    retentionPeriod: number; // days
  }[];
}

/**
 * Storage quota limits by user type
 */
export const STORAGE_QUOTAS = {
  [UserType.FREELANCER]: {
    free: 1 * 1024 * 1024 * 1024, // 1GB
    pro: 10 * 1024 * 1024 * 1024, // 10GB
    enterprise: 50 * 1024 * 1024 * 1024, // 50GB
  },
  [UserType.VENDOR]: {
    small: 5 * 1024 * 1024 * 1024, // 5GB
    medium: 25 * 1024 * 1024 * 1024, // 25GB
    large: 100 * 1024 * 1024 * 1024, // 100GB
  },
  [UserType.CUSTOMER]: {
    basic: 2 * 1024 * 1024 * 1024, // 2GB
    professional: 10 * 1024 * 1024 * 1024, // 10GB
    enterprise: 50 * 1024 * 1024 * 1024, // 50GB
  },
  [UserType.ORGANIZATION]: {
    startup: 10 * 1024 * 1024 * 1024, // 10GB
    business: 50 * 1024 * 1024 * 1024, // 50GB
    enterprise: 200 * 1024 * 1024 * 1024, // 200GB
  }
};

/**
 * File retention policies
 */
export const RETENTION_POLICIES = {
  [FileType.TEMP_UPLOAD]: 24 * 60 * 60 * 1000, // 24 hours
  [FileType.MESSAGE_ATTACHMENT]: 365 * 24 * 60 * 60 * 1000, // 1 year
  [FileType.PROJECT_DELIVERABLE]: null, // Keep forever
  [FileType.VERIFICATION_DOCUMENT]: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
  [FileType.CONTRACT_DOCUMENT]: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
  [FileType.PORTFOLIO_IMAGE]: null, // Keep forever
  [FileType.SYSTEM_BACKUP]: 30 * 24 * 60 * 60 * 1000, // 30 days
};