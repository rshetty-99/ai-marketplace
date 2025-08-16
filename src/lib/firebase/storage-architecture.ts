/**
 * Firebase Storage Architecture for AI Marketplace
 * Organized structure for file storage with cleanup and tracking capabilities
 */

export enum FileType {
  // Profile & Identity
  PROFILE_AVATAR = 'profile/avatar',
  PROFILE_COVER = 'profile/cover',
  COMPANY_LOGO = 'company/logo',
  COMPANY_BANNER = 'company/banner',
  
  // Documents & Verification
  VERIFICATION_DOCUMENT = 'verification/documents',
  CONTRACT_DOCUMENT = 'contracts/documents',
  INVOICE_DOCUMENT = 'invoices/documents',
  LEGAL_DOCUMENT = 'legal/documents',
  
  // Portfolio & Work Samples
  PORTFOLIO_IMAGE = 'portfolio/images',
  PORTFOLIO_VIDEO = 'portfolio/videos',
  PORTFOLIO_DOCUMENT = 'portfolio/documents',
  CASE_STUDY_ASSET = 'portfolio/case-studies',
  
  // Project Files
  PROJECT_ASSET = 'projects/assets',
  PROJECT_DELIVERABLE = 'projects/deliverables',
  PROJECT_REQUIREMENT = 'projects/requirements',
  PROJECT_FEEDBACK = 'projects/feedback',
  
  // Communication
  MESSAGE_ATTACHMENT = 'messages/attachments',
  CHAT_MEDIA = 'messages/media',
  
  // Content & Marketing
  BLOG_IMAGE = 'content/blog/images',
  BLOG_VIDEO = 'content/blog/videos',
  MARKETING_ASSET = 'marketing/assets',
  
  // System & Temporary
  TEMP_UPLOAD = 'temp/uploads',
  SYSTEM_BACKUP = 'system/backups'
}

export enum UserType {
  FREELANCER = 'freelancer',
  VENDOR = 'vendor',
  CUSTOMER = 'customer',
  ORGANIZATION = 'organization',
  PLATFORM = 'platform'
}

/**
 * Firebase Storage Path Structure
 */
export class StoragePathBuilder {
  /**
   * Build storage path for user-specific files
   * Pattern: users/{userType}/{userId}/{fileType}/{fileName}
   */
  static buildUserPath(
    userType: UserType,
    userId: string,
    fileType: FileType,
    fileName: string
  ): string {
    return `users/${userType}/${userId}/${fileType}/${fileName}`;
  }

  /**
   * Build storage path for organization files
   * Pattern: organizations/{orgId}/{fileType}/{fileName}
   */
  static buildOrganizationPath(
    orgId: string,
    fileType: FileType,
    fileName: string
  ): string {
    return `organizations/${orgId}/${fileType}/${fileName}`;
  }

  /**
   * Build storage path for project files
   * Pattern: projects/{projectId}/{fileType}/{fileName}
   */
  static buildProjectPath(
    projectId: string,
    fileType: FileType,
    fileName: string
  ): string {
    return `projects/${projectId}/${fileType}/${fileName}`;
  }

  /**
   * Build storage path for public content
   * Pattern: public/{contentType}/{id}/{fileName}
   */
  static buildPublicPath(
    contentType: string,
    id: string,
    fileName: string
  ): string {
    return `public/${contentType}/${id}/${fileName}`;
  }

  /**
   * Build storage path for temporary files
   * Pattern: temp/{sessionId}/{fileName}
   */
  static buildTempPath(sessionId: string, fileName: string): string {
    return `temp/${sessionId}/${fileName}`;
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
}

/**
 * File metadata for tracking in Firestore
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
  uploadedBy: string; // user ID
  ownerId: string; // can be user, org, or project ID
  ownerType: 'user' | 'organization' | 'project' | 'public';
  
  // Timestamps
  uploadedAt: Date;
  lastAccessed?: Date;
  expiresAt?: Date; // for temporary files
  
  // Security
  isPublic: boolean;
  accessLevel: 'private' | 'organization' | 'project' | 'public';
  
  // Additional metadata
  tags?: string[];
  description?: string;
  version?: number;
  parentFileId?: string; // for versioning
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
 * File cleanup job metadata
 */
export interface CleanupJob {
  id: string;
  type: 'user_deletion' | 'project_cleanup' | 'temp_cleanup' | 'expired_files';
  
  targetId: string; // user, org, or project ID
  targetType: 'user' | 'organization' | 'project';
  
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  
  filesFound: number;
  filesDeleted: number;
  totalSizeDeleted: number;
  
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  errors?: string[];
  progress?: number; // 0-100
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