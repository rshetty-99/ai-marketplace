/**
 * Firestore Collections for Storage Management
 * Defines the database structure for file tracking and storage management
 */

import { FileMetadata, StorageSummary, CleanupJob } from './storage-architecture';

/**
 * Firestore Collection Names
 */
export const STORAGE_COLLECTIONS = {
  FILE_METADATA: 'file_metadata',
  STORAGE_SUMMARY: 'storage_summary', 
  CLEANUP_JOBS: 'cleanup_jobs',
  STORAGE_AUDIT: 'storage_audit'
} as const;

/**
 * Collection: file_metadata
 * Stores metadata for every uploaded file
 * 
 * Document ID: auto-generated
 * Indexes needed:
 * - uploadedBy (for user file queries)
 * - ownerId (for owner file queries) 
 * - fileType (for type-based queries)
 * - uploadedAt (for chronological sorting)
 * - expiresAt (for cleanup jobs)
 * - storagePath (for path-based lookups)
 */
export interface FileMetadataDoc extends FileMetadata {
  // Firestore document structure
}

/**
 * Collection: storage_summary  
 * Tracks storage usage per user/organization
 * 
 * Document ID: userId or organizationId
 * This allows for easy upserts and lookups
 */
export interface StorageSummaryDoc extends StorageSummary {
  // Additional fields for Firestore
  createdAt?: Date;
}

/**
 * Collection: cleanup_jobs
 * Tracks file cleanup operations for auditing
 * 
 * Document ID: auto-generated
 * Indexes needed:
 * - targetId (for finding jobs by user/org)
 * - status (for finding pending/failed jobs)
 * - type (for filtering job types)
 * - createdAt (for chronological sorting)
 */
export interface CleanupJobDoc extends CleanupJob {
  // Additional fields for Firestore
}

/**
 * Collection: storage_audit
 * Audit log for all storage operations
 * 
 * Document ID: auto-generated  
 * Indexes needed:
 * - userId (for user activity)
 * - action (for action filtering)
 * - timestamp (for chronological sorting)
 */
export interface StorageAuditDoc {
  id: string;
  userId: string;
  action: 'upload' | 'download' | 'delete' | 'share' | 'cleanup';
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Firestore Security Rules for Storage Collections
 * Add these to firestore.rules
 */
export const STORAGE_SECURITY_RULES = `
// File Metadata - Users can read/write their own files
match /file_metadata/{fileId} {
  allow read, write: if request.auth != null && 
    (resource.data.uploadedBy == request.auth.uid ||
     resource.data.ownerId == request.auth.uid ||
     resource.data.isPublic == true);
  
  // Platform admins can access all files
  allow read, write: if request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'platform_admin';
}

// Storage Summary - Users can read their own summary
match /storage_summary/{userId} {
  allow read: if request.auth != null && 
    (userId == request.auth.uid ||
     // Allow organization members to read org summary
     get(/databases/$(database)/documents/organizations/$(userId)/members/$(request.auth.uid)).data.role != null);
  
  // Only system can write to storage summary
  allow write: if false;
}

// Cleanup Jobs - Users can read their own cleanup jobs
match /cleanup_jobs/{jobId} {
  allow read: if request.auth != null &&
    resource.data.targetId == request.auth.uid;
    
  // Only system can create/update cleanup jobs  
  allow write: if false;
}

// Storage Audit - Only platform admins can read audit logs
match /storage_audit/{auditId} {
  allow read: if request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'platform_admin';
    
  // Only system can write audit logs
  allow write: if false;
}
`;

/**
 * Composite Indexes needed in Firestore
 * Add these in Firebase Console -> Firestore -> Indexes
 */
export const REQUIRED_INDEXES = [
  {
    collection: 'file_metadata',
    fields: [
      { field: 'uploadedBy', order: 'ASCENDING' },
      { field: 'uploadedAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'file_metadata', 
    fields: [
      { field: 'uploadedBy', order: 'ASCENDING' },
      { field: 'fileType', order: 'ASCENDING' },
      { field: 'uploadedAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'file_metadata',
    fields: [
      { field: 'ownerId', order: 'ASCENDING' },
      { field: 'ownerType', order: 'ASCENDING' },
      { field: 'uploadedAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'file_metadata',
    fields: [
      { field: 'expiresAt', order: 'ASCENDING' }
    ]
  },
  {
    collection: 'cleanup_jobs',
    fields: [
      { field: 'targetId', order: 'ASCENDING' },
      { field: 'status', order: 'ASCENDING' },
      { field: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'storage_audit',
    fields: [
      { field: 'userId', order: 'ASCENDING' },
      { field: 'timestamp', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'storage_audit',
    fields: [
      { field: 'action', order: 'ASCENDING' },
      { field: 'timestamp', order: 'DESCENDING' }
    ]
  }
];

/**
 * Storage Collection Initialization
 * Run this once to set up initial data
 */
export const STORAGE_INITIALIZATION_DATA = {
  // Global storage settings document
  storage_settings: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedFileTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-zip-compressed'
    ],
    defaultQuotas: {
      freelancer_free: 1 * 1024 * 1024 * 1024, // 1GB
      freelancer_pro: 10 * 1024 * 1024 * 1024, // 10GB
      vendor_small: 5 * 1024 * 1024 * 1024, // 5GB
      vendor_medium: 25 * 1024 * 1024 * 1024, // 25GB
      customer_basic: 2 * 1024 * 1024 * 1024, // 2GB
      organization_startup: 10 * 1024 * 1024 * 1024 // 10GB
    },
    cleanupSchedule: {
      tempFiles: '0 2 * * *', // Daily at 2 AM
      expiredFiles: '0 3 * * *', // Daily at 3 AM
      auditLogs: '0 4 * * 0' // Weekly on Sunday at 4 AM
    }
  }
};

/**
 * Helper function to calculate storage path depth
 * Used for billing and organization
 */
export function getStorageDepth(path: string): {
  type: 'user' | 'organization' | 'project' | 'public' | 'temp';
  id: string;
  category: string;
} {
  const parts = path.split('/');
  
  if (parts[0] === 'users') {
    return {
      type: 'user',
      id: parts[2], // userId
      category: parts[3] // fileType
    };
  } else if (parts[0] === 'organizations') {
    return {
      type: 'organization', 
      id: parts[1], // orgId
      category: parts[2] // fileType
    };
  } else if (parts[0] === 'projects') {
    return {
      type: 'project',
      id: parts[1], // projectId  
      category: parts[2] // fileType
    };
  } else if (parts[0] === 'public') {
    return {
      type: 'public',
      id: parts[2], // contentId
      category: parts[1] // contentType
    };
  } else if (parts[0] === 'temp') {
    return {
      type: 'temp',
      id: parts[1], // sessionId
      category: 'temporary'
    };
  }
  
  throw new Error(`Invalid storage path: ${path}`);
}

/**
 * Storage usage analytics queries
 */
export const STORAGE_ANALYTICS_QUERIES = {
  // Top storage users
  topStorageUsers: `
    SELECT userId, totalSize, totalFiles, quotaPercentage
    FROM storage_summary 
    ORDER BY totalSize DESC 
    LIMIT 100
  `,
  
  // Storage growth over time
  storageGrowth: `
    SELECT DATE(uploadedAt) as date, 
           SUM(size) as totalSize,
           COUNT(*) as totalFiles
    FROM file_metadata 
    WHERE uploadedAt >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
    GROUP BY DATE(uploadedAt)
    ORDER BY date
  `,
  
  // File type distribution
  fileTypeDistribution: `
    SELECT fileType, 
           COUNT(*) as count,
           SUM(size) as totalSize,
           AVG(size) as avgSize
    FROM file_metadata
    GROUP BY fileType
    ORDER BY totalSize DESC
  `,
  
  // Quota utilization
  quotaUtilization: `
    SELECT 
      CASE 
        WHEN quotaPercentage >= 90 THEN 'critical'
        WHEN quotaPercentage >= 75 THEN 'warning'  
        WHEN quotaPercentage >= 50 THEN 'moderate'
        ELSE 'low'
      END as utilization_level,
      COUNT(*) as user_count
    FROM storage_summary
    WHERE quotaLimit IS NOT NULL
    GROUP BY utilization_level
  `
};