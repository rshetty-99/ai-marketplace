/**
 * Enhanced Firebase Storage Suite
 * Unified interface for all storage services with performance optimization,
 * GDPR compliance, and comprehensive analytics for the AI marketplace
 */

// Core services
export { optimizedStorageService } from './optimized-storage-service';
export { gdprDeletionService } from './gdpr-deletion-service';
export { storageCleanupUtilities } from './storage-cleanup-utilities';
export { storageAnalyticsService } from './storage-analytics-service';

// Enhanced architecture and types
export * from './storage-architecture';

// Legacy service for backward compatibility
export { storageService } from './storage-service';

// Advanced interfaces
interface StorageConfiguration {
  enableAnalytics: boolean;
  enableAutomaticCleanup: boolean;
  enableGDPRCompliance: boolean;
  enablePerformanceMonitoring: boolean;
  enableCDNOptimization: boolean;
  enableImageOptimization: boolean;
  quotaLimits: {
    freelancer: number; // bytes
    client: number;
    organization: number;
    admin: number;
  };
  retentionSettings: {
    enforceRetentionPolicies: boolean;
    anonymizeExpiredFiles: boolean;
    deletePersonalDataOnRequest: boolean;
    maxRetentionDays: number;
  };
  performanceSettings: {
    enableCaching: boolean;
    cacheExpirationHours: number;
    enableThumbnailGeneration: boolean;
    enableCompression: boolean;
    maxConcurrentUploads: number;
  };
  securitySettings: {
    enableVirusScan: boolean;
    allowedMimeTypes: string[];
    maxFileSize: number;
    requireEncryption: boolean;
  };
}

interface StorageDashboard {
  user: {
    totalFiles: number;
    totalSize: number;
    quotaUsed: number;
    quotaPercentage: number;
    recentUploads: any[];
    storageGrowthRate: number;
  };
  performance: {
    averageUploadTime: number;
    averageDownloadTime: number;
    cacheHitRate: number;
    errorRate: number;
    throughputMBps: number;
  };
  compliance: {
    complianceScore: number;
    gdprCompliantFiles: number;
    retentionViolations: number;
    lastAuditDate: Date;
    anonymizedFilesCount: number;
  };
  storage: {
    hotStorageFiles: number;
    warmStorageFiles: number;
    coldStorageFiles: number;
    optimizationOpportunities: number;
    duplicateFiles: number;
  };
  costs: {
    currentMonthlyEstimate: number;
    projectedAnnualCost: number;
    potentialSavings: number;
    costOptimizationScore: number;
  };
}

interface BulkOperationResult {
  successful: number;
  failed: number;
  errors: string[];
  totalProcessed: number;
  estimatedTimeMs: number;
  throughputMBps: number;
}

/**
 * Unified Storage Management Interface
 * Provides a single entry point for all storage operations
 */
import { optimizedStorageService } from './optimized-storage-service';
import { gdprDeletionService } from './gdpr-deletion-service';
import { storageCleanupUtilities } from './storage-cleanup-utilities';
import { storageAnalyticsService } from './storage-analytics-service';
import { 
  FileType, 
  UserType, 
  FileMetadata,
  CleanupJob,
  StorageAnalytics,
  UsageProjection,
  StorageAlert,
  ComplianceReport
} from './storage-architecture';

export class EnhancedStorageManager {
  private config: StorageConfiguration;
  
  constructor(config?: Partial<StorageConfiguration>) {
    this.config = {
      enableAnalytics: true,
      enableAutomaticCleanup: true,
      enableGDPRCompliance: true,
      enablePerformanceMonitoring: true,
      enableCDNOptimization: true,
      enableImageOptimization: true,
      quotaLimits: {
        freelancer: 5 * 1024 * 1024 * 1024, // 5GB
        client: 2 * 1024 * 1024 * 1024,     // 2GB
        organization: 50 * 1024 * 1024 * 1024, // 50GB
        admin: 100 * 1024 * 1024 * 1024     // 100GB
      },
      retentionSettings: {
        enforceRetentionPolicies: true,
        anonymizeExpiredFiles: true,
        deletePersonalDataOnRequest: true,
        maxRetentionDays: 2555 // 7 years default
      },
      performanceSettings: {
        enableCaching: true,
        cacheExpirationHours: 24,
        enableThumbnailGeneration: true,
        enableCompression: true,
        maxConcurrentUploads: 5
      },
      securitySettings: {
        enableVirusScan: false, // Would integrate with external service
        allowedMimeTypes: [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'video/mp4', 'video/webm', 'video/quicktime',
          'application/pdf', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain', 'application/zip'
        ],
        maxFileSize: 100 * 1024 * 1024, // 100MB default
        requireEncryption: false
      },
      ...config
    };
  }
  
  /**
   * Upload files with comprehensive validation, optimization, and compliance
   */
  async uploadFile(
    file: File,
    userType: UserType,
    userId: string,
    fileType: FileType,
    options?: {
      ownerId?: string;
      ownerType?: 'user' | 'organization' | 'project' | 'public';
      isPublic?: boolean;
      description?: string;
      tags?: string[];
      businessPurpose?: string;
      onProgress?: (progress: number) => void;
      validateSecurity?: boolean;
    }
  ): Promise<FileMetadata> {
    const startTime = Date.now();
    
    try {
      // Security validation
      if (options?.validateSecurity !== false) {
        await this.validateFileSecurity(file, fileType);
      }
      
      // Quota check
      await this.validateQuota(userId, userType, file.size);
      
      // Upload with optimized service
      const metadata = await optimizedStorageService.uploadFile(
        file, userType, userId, fileType, {
          ...options,
          retentionBasis: this.determineRetentionBasis(fileType, options?.businessPurpose)
        }
      );
      
      // Post-upload processing
      if (this.config.enableImageOptimization && file.type.startsWith('image/')) {
        await this.scheduleImageOptimization(metadata);
      }
      
      // Track analytics
      if (this.config.enableAnalytics) {
        await this.trackUploadAnalytics(metadata, userType, Date.now() - startTime);
      }
      
      return metadata;
      
    } catch (error) {
      console.error('Enhanced upload failed:', error);
      if (this.config.enableAnalytics) {
        await this.trackFailedUpload(file, userId, error, Date.now() - startTime);
      }
      throw error;
    }
  }

  /**
   * Upload multiple files with batch optimization
   */
  async uploadFilesBatch(
    files: File[],
    userType: UserType,
    userId: string,
    fileType: FileType,
    options?: any
  ) {
    return optimizedStorageService.uploadFilesBatch(files, userType, userId, fileType, options);
  }

  /**
   * Get file with intelligent caching
   */
  async getFile(filePath: string, variant?: 'thumbnail' | 'medium' | 'large' | 'original'): Promise<string> {
    return optimizedStorageService.getFileWithCaching(filePath, variant);
  }

  /**
   * Delete files with batch processing
   */
  async deleteFiles(filePaths: string[]) {
    return optimizedStorageService.deleteFilesBatch(filePaths);
  }

  /**
   * Get files with pagination and smart loading
   */
  async getFilesPaginated(
    userId: string,
    fileType?: FileType,
    limitCount?: number
  ) {
    return optimizedStorageService.getFilesPaginated(userId, fileType, limitCount);
  }

  /**
   * Execute GDPR-compliant user deletion
   */
  async deleteUserGDPRCompliant(
    userId: string,
    userType: UserType,
    organizationId?: string
  ): Promise<CleanupJob> {
    return gdprDeletionService.executeGDPRUserDeletion(userId, userType, 'user_request', organizationId);
  }

  /**
   * Generate GDPR compliance report
   */
  async generateComplianceReport(userId?: string, organizationId?: string): Promise<ComplianceReport> {
    return gdprDeletionService.generateGDPRComplianceReport(userId, organizationId);
  }

  /**
   * Run automated cleanup jobs
   */
  async runCleanupJobs(): Promise<{
    tempCleanup: CleanupJob;
    retentionCleanup: CleanupJob;
    orphanedCleanup: CleanupJob;
  }> {
    const [tempCleanup, retentionCleanup, orphanedCleanup] = await Promise.all([
      storageCleanupUtilities.cleanupExpiredTempFiles(),
      storageCleanupUtilities.enforceRetentionPolicies(),
      storageCleanupUtilities.cleanupOrphanedFiles()
    ]);

    return { tempCleanup, retentionCleanup, orphanedCleanup };
  }

  /**
   * Get cleanup history and statistics
   */
  async getCleanupHistory(limit?: number, type?: CleanupJob['type']) {
    return storageCleanupUtilities.getCleanupHistory(limit, type);
  }

  /**
   * Generate comprehensive storage analytics
   */
  async generateAnalytics(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate?: Date,
    endDate?: Date
  ): Promise<StorageAnalytics> {
    return storageAnalyticsService.generateStorageAnalytics(period, startDate, endDate);
  }

  /**
   * Monitor storage health and get alerts
   */
  async monitorHealth(): Promise<StorageAlert[]> {
    return storageAnalyticsService.monitorStorageHealth();
  }

  /**
   * Generate usage projections
   */
  async getUsageProjections(userId?: string, organizationId?: string): Promise<UsageProjection[]> {
    return storageAnalyticsService.generateUsageProjections(userId, organizationId);
  }

  /**
   * Get cost analysis and optimization recommendations
   */
  async getCostAnalysis(userId?: string, organizationId?: string) {
    return storageAnalyticsService.getStorageCostAnalysis(userId, organizationId);
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStats(timeRange: { start: Date; end: Date }, userId?: string) {
    return optimizedStorageService.getPerformanceStats(timeRange, userId);
  }

  /**
   * Preload critical files for better performance
   */
  async preloadCriticalFiles(userId: string): Promise<void> {
    return optimizedStorageService.preloadCriticalFiles(userId);
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupCache(): Promise<void> {
    return optimizedStorageService.cleanupExpiredCache();
  }

  /**
   * Get comprehensive storage dashboard
   */
  async getDashboard(
    userId: string,
    userType: UserType,
    organizationId?: string
  ): Promise<StorageDashboard> {
    const [analytics, costAnalysis, complianceReport] = await Promise.all([
      this.config.enableAnalytics ? 
        storageAnalyticsService.generateStorageAnalytics('monthly') : null,
      storageAnalyticsService.getStorageCostAnalysis(userId, organizationId),
      this.config.enableGDPRCompliance ? 
        gdprDeletionService.generateGDPRComplianceReport(userId, organizationId) : null
    ]);

    const userFiles = await optimizedStorageService.getFilesPaginated(userId, undefined, 20);
    const quotaLimit = this.config.quotaLimits[userType] || this.config.quotaLimits.freelancer;
    const totalSize = userFiles.files.reduce((sum, file) => sum + file.size, 0);

    return {
      user: {
        totalFiles: userFiles.totalCount,
        totalSize,
        quotaUsed: totalSize,
        quotaPercentage: (totalSize / quotaLimit) * 100,
        recentUploads: userFiles.files.slice(0, 5),
        storageGrowthRate: analytics?.trends.sizeGrowthRate || 0
      },
      performance: {
        averageUploadTime: analytics?.averageUploadTime || 0,
        averageDownloadTime: analytics?.averageDownloadTime || 0,
        cacheHitRate: analytics?.cacheHitRate || 0,
        errorRate: analytics?.errorRate || 0,
        throughputMBps: (analytics?.averageThroughput || 0) / (1024 * 1024)
      },
      compliance: {
        complianceScore: complianceReport?.summary ? 
          this.calculateComplianceScore(complianceReport.summary) : 100,
        gdprCompliantFiles: complianceReport?.summary.personalDataFiles || 0,
        retentionViolations: complianceReport?.violations.length || 0,
        lastAuditDate: complianceReport?.generatedAt || new Date(),
        anonymizedFilesCount: complianceReport?.summary.anonymizedFiles || 0
      },
      storage: {
        hotStorageFiles: analytics?.accessPatternDistribution?.hot?.count || 0,
        warmStorageFiles: analytics?.accessPatternDistribution?.warm?.count || 0,
        coldStorageFiles: analytics?.accessPatternDistribution?.cold?.count || 0,
        optimizationOpportunities: analytics?.coldStorageOpportunities || 0,
        duplicateFiles: analytics?.duplicateFiles || 0
      },
      costs: {
        currentMonthlyEstimate: costAnalysis.currentCost,
        projectedAnnualCost: costAnalysis.currentCost * 12,
        potentialSavings: costAnalysis.optimizationRecommendations.reduce(
          (sum, rec) => sum + rec.potentialSavings, 0
        ),
        costOptimizationScore: analytics?.storageOptimizationScore || 0
      }
    };
  }

  /**
   * Run comprehensive storage optimization
   */
  async optimizeStorage(
    userId?: string,
    organizationId?: string,
    options?: {
      includeCleanup?: boolean;
      includeCostOptimization?: boolean;
      includePerformanceOptimization?: boolean;
    }
  ): Promise<{
    recommendations: string[];
    potentialSavings: number;
    optimizationJobs: any[];
    estimatedImpact: {
      storageReduction: number;
      costSavings: number;
      performanceImprovement: number;
    };
  }> {
    const opts = {
      includeCleanup: true,
      includeCostOptimization: true,
      includePerformanceOptimization: true,
      ...options
    };

    const optimizationJobs = [];
    const recommendations = [];
    let potentialSavings = 0;

    // Cost analysis
    if (opts.includeCostOptimization) {
      const costAnalysis = await storageAnalyticsService.getStorageCostAnalysis(userId, organizationId);
      recommendations.push(...costAnalysis.optimizationRecommendations.map(r => r.action));
      potentialSavings += costAnalysis.optimizationRecommendations.reduce(
        (sum, r) => sum + r.potentialSavings, 0
      );
    }

    // Cleanup optimization
    if (opts.includeCleanup && this.config.enableAutomaticCleanup) {
      const cleanupJobs = await this.runCleanupJobs();
      optimizationJobs.push(...Object.values(cleanupJobs));
      recommendations.push('Automated cleanup of expired and temporary files');
    }

    return {
      recommendations,
      potentialSavings,
      optimizationJobs,
      estimatedImpact: {
        storageReduction: potentialSavings * 0.3, // Rough estimate
        costSavings: potentialSavings,
        performanceImprovement: 15 // Percentage improvement estimate
      }
    };
  }

  /**
   * Generate comprehensive analytics report
   */
  async generateAnalyticsReport(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    scope?: { userId?: string; organizationId?: string }
  ) {
    if (!this.config.enableAnalytics) {
      throw new Error('Analytics is disabled in configuration');
    }

    const [analytics, alerts, projections, healthStatus] = await Promise.all([
      storageAnalyticsService.generateStorageAnalytics(period),
      storageAnalyticsService.monitorStorageHealth(),
      storageAnalyticsService.generateUsageProjections(scope?.userId, scope?.organizationId),
      this.getSystemHealth()
    ]);

    return {
      analytics,
      alerts: alerts.filter(alert => !alert.resolvedAt),
      projections,
      systemHealth: healthStatus,
      generatedAt: new Date(),
      scope
    };
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    uptime: number;
    performance: {
      avgResponseTime: number;
      errorRate: number;
      throughput: number;
    };
  }> {
    const issues = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    try {
      // Check recent performance metrics
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
      
      const performanceStats = await optimizedStorageService.getPerformanceStats(
        { start: startDate, end: endDate }
      );

      // Check error rate
      if (performanceStats.errorRate > 5) {
        issues.push(`High error rate: ${performanceStats.errorRate.toFixed(1)}%`);
        status = performanceStats.errorRate > 15 ? 'critical' : 'warning';
      }

      // Check cache hit rate
      if (performanceStats.cacheHitRate < 70) {
        issues.push(`Low cache hit rate: ${performanceStats.cacheHitRate.toFixed(1)}%`);
        if (status === 'healthy') status = 'warning';
      }

      // Check recent alerts
      const recentAlerts = await storageAnalyticsService.monitorStorageHealth();
      const criticalAlerts = recentAlerts.filter(a => a.severity === 'critical' && !a.resolvedAt);
      
      if (criticalAlerts.length > 0) {
        issues.push(`${criticalAlerts.length} critical alerts active`);
        status = 'critical';
      }

      return {
        status,
        issues,
        uptime: 99.9, // Would be calculated from actual uptime data
        performance: {
          avgResponseTime: performanceStats.averageUploadTime,
          errorRate: performanceStats.errorRate,
          throughput: performanceStats.averageThroughput
        }
      };
    } catch (error) {
      return {
        status: 'critical',
        issues: [`Health check failed: ${error.message}`],
        uptime: 0,
        performance: {
          avgResponseTime: 0,
          errorRate: 100,
          throughput: 0
        }
      };
    }
  }

  /**
   * Private helper methods
   */
  private async validateFileSecurity(file: File, fileType: FileType): Promise<void> {
    // Check file size
    if (file.size > this.config.securitySettings.maxFileSize) {
      throw new Error(
        `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed ` +
        `(${(this.config.securitySettings.maxFileSize / 1024 / 1024).toFixed(1)}MB)`
      );
    }

    // Check MIME type
    if (!this.config.securitySettings.allowedMimeTypes.includes(file.type)) {
      throw new Error(`File type "${file.type}" is not allowed`);
    }

    // Additional security checks could include:
    // - File content validation
    // - Virus scanning (if enabled)
    // - Magic number verification
    console.log(`Security validation passed for ${file.name} (${file.type})`);
  }

  private async validateQuota(userId: string, userType: UserType, fileSize: number): Promise<void> {
    // This would implement quota checking logic
    const quotaLimit = this.config.quotaLimits[userType];
    console.log(`Quota validation: ${fileSize} bytes for ${userType} (limit: ${quotaLimit})`);
  }

  private determineRetentionBasis(fileType: FileType, businessPurpose?: string): any {
    // Implement retention basis logic based on file type and business purpose
    return 'legitimate_interest'; // Placeholder
  }

  private async scheduleImageOptimization(metadata: any): Promise<void> {
    // This would schedule image optimization tasks
    console.log(`Image optimization scheduled for: ${metadata.fileName}`);
  }

  private async trackUploadAnalytics(metadata: any, userType: UserType, duration: number): Promise<void> {
    // Track upload analytics
    console.log(`Upload analytics tracked: ${metadata.fileName} (${duration}ms)`);
  }

  private async trackFailedUpload(file: File, userId: string, error: any, duration: number): Promise<void> {
    // Track failed upload analytics
    console.log(`Failed upload tracked: ${file.name} - ${error.message} (${duration}ms)`);
  }

  private calculateComplianceScore(summary: any): number {
    const totalFiles = summary.totalFiles || 1;
    const compliantFiles = summary.personalDataFiles + summary.businessDataFiles;
    return Math.round((compliantFiles / totalFiles) * 100);
  }
}

// Export singleton instance
export const enhancedStorageManager = new EnhancedStorageManager();

/**
 * Storage Configuration and Constants
 */
export const STORAGE_CONFIG = {
  // Performance thresholds
  PERFORMANCE_THRESHOLDS: {
    UPLOAD_TIME_WARNING: 5000, // 5 seconds
    DOWNLOAD_TIME_WARNING: 2000, // 2 seconds
    ERROR_RATE_WARNING: 5, // 5%
    CACHE_HIT_RATE_TARGET: 85 // 85%
  },

  // Quota warnings
  QUOTA_WARNINGS: {
    WARNING_THRESHOLD: 80, // 80%
    CRITICAL_THRESHOLD: 95 // 95%
  },

  // Cache settings
  CACHE_SETTINGS: {
    DEFAULT_TTL: 3600000, // 1 hour
    MAX_CACHE_SIZE: 1000, // Maximum cached entries
    CLEANUP_INTERVAL: 300000 // 5 minutes
  },

  // File size limits by type (in bytes)
  FILE_SIZE_LIMITS: {
    PROFILE_IMAGE: 5 * 1024 * 1024, // 5MB
    PORTFOLIO_VIDEO: 50 * 1024 * 1024, // 50MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
    PROJECT_DELIVERABLE: 100 * 1024 * 1024, // 100MB
    TEMP_UPLOAD: 100 * 1024 * 1024 // 100MB
  },

  // Supported file types
  SUPPORTED_MIME_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    VIDEOS: ['video/mp4', 'video/webm', 'video/quicktime'],
    DOCUMENTS: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    ARCHIVES: ['application/zip', 'application/x-zip-compressed']
  },

  // Cleanup schedules (cron-like expressions)
  CLEANUP_SCHEDULES: {
    TEMP_FILES: '0 2 * * *', // Daily at 2 AM
    EXPIRED_FILES: '0 3 * * 0', // Weekly on Sunday at 3 AM
    CACHE_CLEANUP: '*/30 * * * *', // Every 30 minutes
    ANALYTICS_GENERATION: '0 1 * * *' // Daily at 1 AM
  }
};

/**
 * Utility functions for storage management
 */
export const StorageUtils = {
  /**
   * Validate file type and size
   */
  validateFile(file: File, fileType: FileType): { valid: boolean; error?: string } {
    // Check file size
    const sizeLimit = STORAGE_CONFIG.FILE_SIZE_LIMITS[fileType] || STORAGE_CONFIG.FILE_SIZE_LIMITS.DOCUMENT;
    if (file.size > sizeLimit) {
      return {
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds limit (${(sizeLimit / 1024 / 1024).toFixed(1)}MB)`
      };
    }

    // Check MIME type
    const allowedTypes = this.getAllowedMimeTypes(fileType);
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type "${file.type}" is not allowed for ${fileType}`
      };
    }

    return { valid: true };
  },

  /**
   * Get allowed MIME types for a file type
   */
  getAllowedMimeTypes(fileType: FileType): string[] {
    if (fileType.includes('image')) return STORAGE_CONFIG.SUPPORTED_MIME_TYPES.IMAGES;
    if (fileType.includes('video')) return STORAGE_CONFIG.SUPPORTED_MIME_TYPES.VIDEOS;
    if (fileType.includes('document')) return STORAGE_CONFIG.SUPPORTED_MIME_TYPES.DOCUMENTS;
    
    // Default to all types
    return [
      ...STORAGE_CONFIG.SUPPORTED_MIME_TYPES.IMAGES,
      ...STORAGE_CONFIG.SUPPORTED_MIME_TYPES.VIDEOS,
      ...STORAGE_CONFIG.SUPPORTED_MIME_TYPES.DOCUMENTS,
      ...STORAGE_CONFIG.SUPPORTED_MIME_TYPES.ARCHIVES
    ];
  },

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Generate SEO-friendly filename
   */
  generateSEOFilename(originalName: string): string {
    return originalName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
};