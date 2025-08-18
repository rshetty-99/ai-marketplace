/**
 * Enhanced Storage Suite Usage Examples
 * Comprehensive examples showing how to use the AI marketplace storage system
 */

import { enhancedStorageManager } from './enhanced-storage-suite';
import { FileType, UserType } from './storage-architecture';

/**
 * Example 1: Basic File Upload with Validation
 */
export async function uploadProfileImage(
  file: File,
  userId: string
): Promise<void> {
  try {
    const metadata = await enhancedStorageManager.uploadFile(
      file,
      UserType.FREELANCER,
      userId,
      FileType.PROFILE_AVATAR,
      {
        description: 'User profile avatar',
        tags: ['profile', 'avatar'],
        isPublic: true,
        businessPurpose: 'user_identification',
        onProgress: (progress) => {
          console.log(`Upload progress: ${progress.toFixed(1)}%`);
        }
      }
    );

    console.log('Profile image uploaded successfully:', {
      url: metadata.downloadUrl,
      size: metadata.size,
      fileName: metadata.fileName
    });
  } catch (error) {
    console.error('Profile image upload failed:', error);
    throw error;
  }
}

/**
 * Example 2: Bulk Portfolio Upload
 */
export async function uploadPortfolioAssets(
  files: File[],
  freelancerId: string
): Promise<{
  successful: string[];
  failed: string[];
}> {
  const results = {
    successful: [],
    failed: []
  };

  try {
    const bulkResult = await enhancedStorageManager.uploadFilesBatch(
      files,
      UserType.FREELANCER,
      freelancerId,
      FileType.PORTFOLIO_IMAGE,
      {
        description: 'Portfolio showcase assets',
        tags: ['portfolio', 'showcase'],
        businessPurpose: 'professional_showcase',
        isPublic: true
      }
    );

    console.log(`Bulk upload completed: ${bulkResult.successful}/${files.length} files uploaded`);
    
    // Track results
    bulkResult.successful.forEach(metadata => {
      results.successful.push(metadata.downloadUrl);
    });
    
    results.failed = bulkResult.errors;

    return results;
  } catch (error) {
    console.error('Bulk portfolio upload failed:', error);
    throw error;
  }
}

/**
 * Example 3: Project Document Management
 */
export async function uploadProjectDeliverable(
  file: File,
  projectId: string,
  uploaderId: string,
  clientId: string
): Promise<string> {
  try {
    const metadata = await enhancedStorageManager.uploadFile(
      file,
      UserType.FREELANCER,
      uploaderId,
      FileType.PROJECT_DELIVERABLE,
      {
        ownerId: projectId,
        ownerType: 'project',
        description: 'Project deliverable document',
        tags: ['deliverable', 'project', projectId],
        businessPurpose: 'contract_fulfillment',
        isPublic: false // Private to project participants
      }
    );

    // Notify client of new deliverable
    console.log(`Project deliverable uploaded for project ${projectId}`);
    
    return metadata.downloadUrl;
  } catch (error) {
    console.error('Project deliverable upload failed:', error);
    throw error;
  }
}

/**
 * Example 4: Chat File Attachment
 */
export async function uploadChatAttachment(
  file: File,
  senderId: string,
  conversationId: string
): Promise<{
  url: string;
  thumbnailUrl?: string;
  metadata: any;
}> {
  try {
    const metadata = await enhancedStorageManager.uploadFile(
      file,
      UserType.FREELANCER, // Would be determined dynamically
      senderId,
      FileType.CHAT_MEDIA,
      {
        ownerId: conversationId,
        ownerType: 'project',
        description: `Chat attachment from ${senderId}`,
        tags: ['chat', 'attachment', conversationId],
        businessPurpose: 'communication',
        isPublic: false
      }
    );

    return {
      url: metadata.downloadUrl,
      thumbnailUrl: metadata.thumbnailUrl,
      metadata: {
        fileName: metadata.fileName,
        size: metadata.size,
        mimeType: metadata.mimeType,
        uploadedAt: metadata.uploadedAt
      }
    };
  } catch (error) {
    console.error('Chat attachment upload failed:', error);
    throw error;
  }
}

/**
 * Example 5: Get User Storage Dashboard
 */
export async function getUserStorageDashboard(
  userId: string,
  userType: UserType
) {
  try {
    const dashboard = await enhancedStorageManager.getDashboard(
      userId,
      userType
    );

    console.log('User Storage Dashboard:', {
      totalFiles: dashboard.user.totalFiles,
      storageUsed: `${(dashboard.user.totalSize / 1024 / 1024).toFixed(1)} MB`,
      quotaPercentage: `${dashboard.user.quotaPercentage.toFixed(1)}%`,
      complianceScore: `${dashboard.compliance.complianceScore}%`,
      performanceStats: {
        avgUploadTime: `${dashboard.performance.averageUploadTime}ms`,
        cacheHitRate: `${dashboard.performance.cacheHitRate.toFixed(1)}%`,
        errorRate: `${dashboard.performance.errorRate.toFixed(1)}%`
      },
      costs: {
        monthlyEstimate: `$${dashboard.costs.currentMonthlyEstimate.toFixed(2)}`,
        potentialSavings: `$${dashboard.costs.potentialSavings.toFixed(2)}`
      }
    });

    return dashboard;
  } catch (error) {
    console.error('Failed to get storage dashboard:', error);
    throw error;
  }
}

/**
 * Example 6: GDPR User Data Deletion
 */
export async function deleteUserGDPRCompliant(
  userId: string,
  userType: UserType,
  reason: 'user_request' | 'retention_expired' | 'consent_withdrawn' = 'user_request'
) {
  try {
    console.log(`Starting GDPR-compliant deletion for user ${userId}`);
    
    const deletionJob = await enhancedStorageManager.deleteUserGDPRCompliant(
      userId,
      userType
    );

    console.log('GDPR deletion initiated:', {
      jobId: deletionJob.id,
      status: deletionJob.status,
      estimatedFiles: deletionJob.filesFound
    });

    // Monitor deletion progress
    const monitorProgress = setInterval(async () => {
      try {
        const jobStatus = await enhancedStorageManager.getCleanupHistory(1, 'user_gdpr_deletion');
        const currentJob = jobStatus.jobs.find(job => job.id === deletionJob.id);
        
        if (currentJob) {
          console.log(`Deletion progress: ${currentJob.progress || 0}%`);
          
          if (currentJob.status === 'completed') {
            console.log('GDPR deletion completed:', {
              filesDeleted: currentJob.filesDeleted,
              filesAnonymized: currentJob.filesAnonymized,
              filesTransferred: currentJob.filesTransferred
            });
            clearInterval(monitorProgress);
          } else if (currentJob.status === 'failed') {
            console.error('GDPR deletion failed:', currentJob.errors);
            clearInterval(monitorProgress);
          }
        }
      } catch (error) {
        console.error('Error monitoring deletion progress:', error);
        clearInterval(monitorProgress);
      }
    }, 5000); // Check every 5 seconds

    return deletionJob;
  } catch (error) {
    console.error('GDPR deletion failed:', error);
    throw error;
  }
}

/**
 * Example 7: Storage Optimization
 */
export async function optimizeUserStorage(
  userId: string,
  organizationId?: string
) {
  try {
    console.log(`Starting storage optimization for user ${userId}`);
    
    const optimization = await enhancedStorageManager.optimizeStorage(
      userId,
      organizationId,
      {
        includeCleanup: true,
        includeCostOptimization: true,
        includePerformanceOptimization: true
      }
    );

    console.log('Storage optimization completed:', {
      recommendations: optimization.recommendations,
      potentialSavings: `$${optimization.potentialSavings.toFixed(2)}`,
      estimatedImpact: {
        storageReduction: `${optimization.estimatedImpact.storageReduction.toFixed(1)} MB`,
        costSavings: `$${optimization.estimatedImpact.costSavings.toFixed(2)}`,
        performanceImprovement: `${optimization.estimatedImpact.performanceImprovement}%`
      },
      optimizationJobs: optimization.optimizationJobs.length
    });

    return optimization;
  } catch (error) {
    console.error('Storage optimization failed:', error);
    throw error;
  }
}

/**
 * Example 8: Generate Analytics Report
 */
export async function generateStorageReport(
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
  scope?: { userId?: string; organizationId?: string }
) {
  try {
    const report = await enhancedStorageManager.generateAnalyticsReport(period, scope);

    console.log('Storage Analytics Report:', {
      period,
      scope,
      totalFiles: report.analytics.totalFiles,
      totalSize: `${(report.analytics.totalSize / 1024 / 1024 / 1024).toFixed(2)} GB`,
      activeUsers: report.analytics.activeUsers,
      trends: {
        uploadTrend: report.analytics.trends.uploadTrend,
        sizeGrowthRate: `${report.analytics.trends.sizeGrowthRate}%`,
        performanceTrend: report.analytics.trends.performanceTrend
      },
      compliance: {
        score: `${report.analytics.complianceScore}%`,
        violations: report.analytics.retentionPolicyViolations
      },
      activeAlerts: report.alerts.length,
      systemHealth: report.systemHealth.status,
      projections: report.projections.map(p => ({
        timeframe: p.timeframe,
        projectedCost: `$${p.projectedCost.toFixed(2)}`,
        confidence: `${(p.confidence * 100).toFixed(1)}%`
      }))
    });

    return report;
  } catch (error) {
    console.error('Failed to generate analytics report:', error);
    throw error;
  }
}

/**
 * Example 9: System Health Monitoring
 */
export async function monitorSystemHealth() {
  try {
    const health = await enhancedStorageManager.getSystemHealth();

    console.log('Storage System Health:', {
      status: health.status,
      uptime: `${health.uptime}%`,
      issues: health.issues,
      performance: {
        avgResponseTime: `${health.performance.avgResponseTime}ms`,
        errorRate: `${health.performance.errorRate.toFixed(1)}%`,
        throughput: `${(health.performance.throughput / 1024 / 1024).toFixed(1)} MB/s`
      }
    });

    // Alert if critical issues
    if (health.status === 'critical') {
      console.error('CRITICAL: Storage system has critical issues:', health.issues);
      // Would trigger alerts to administrators
    }

    return health;
  } catch (error) {
    console.error('Health monitoring failed:', error);
    throw error;
  }
}

/**
 * Example 10: Automated Maintenance
 */
export async function runAutomatedMaintenance() {
  try {
    console.log('Starting automated storage maintenance...');
    
    // Run cleanup jobs
    const cleanupJobs = await enhancedStorageManager.runCleanupJobs();
    
    console.log('Cleanup jobs completed:', {
      tempCleanup: {
        filesDeleted: cleanupJobs.tempCleanup.filesDeleted,
        sizeFreed: `${(cleanupJobs.tempCleanup.totalSizeDeleted / 1024 / 1024).toFixed(1)} MB`
      },
      retentionCleanup: {
        filesProcessed: cleanupJobs.retentionCleanup.filesFound,
        filesDeleted: cleanupJobs.retentionCleanup.filesDeleted,
        filesAnonymized: cleanupJobs.retentionCleanup.filesAnonymized
      }
    });

    // Clear expired cache
    await enhancedStorageManager.cleanupCache();
    console.log('Cache cleanup completed');

    // Generate health report
    const health = await monitorSystemHealth();
    
    return {
      cleanupJobs,
      systemHealth: health,
      maintenanceCompletedAt: new Date()
    };
  } catch (error) {
    console.error('Automated maintenance failed:', error);
    throw error;
  }
}

/**
 * Example 11: File Search and Management
 */
export async function searchUserFiles(
  userId: string,
  searchCriteria: {
    fileType?: FileType;
    tags?: string[];
    dateRange?: { start: Date; end: Date };
    sizeRange?: { min: number; max: number };
  }
) {
  try {
    // Get user files with pagination
    const files = await enhancedStorageManager.getFilesPaginated(
      userId,
      searchCriteria.fileType,
      50 // Limit to 50 files
    );

    // Apply additional filters
    let filteredFiles = files.files;

    if (searchCriteria.tags) {
      filteredFiles = filteredFiles.filter(file =>
        file.tags?.some(tag => searchCriteria.tags!.includes(tag))
      );
    }

    if (searchCriteria.dateRange) {
      filteredFiles = filteredFiles.filter(file =>
        file.uploadedAt >= searchCriteria.dateRange!.start &&
        file.uploadedAt <= searchCriteria.dateRange!.end
      );
    }

    if (searchCriteria.sizeRange) {
      filteredFiles = filteredFiles.filter(file =>
        file.size >= searchCriteria.sizeRange!.min &&
        file.size <= searchCriteria.sizeRange!.max
      );
    }

    console.log(`Found ${filteredFiles.length} files matching criteria`);
    
    return {
      files: filteredFiles,
      totalMatches: filteredFiles.length,
      searchCriteria
    };
  } catch (error) {
    console.error('File search failed:', error);
    throw error;
  }
}

/**
 * Example 12: Integration with Frontend Components
 */
export const StorageAPIHelpers = {
  /**
   * Format file size for display
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Validate file before upload
   */
  validateFile: (file: File, fileType: FileType): { valid: boolean; error?: string } => {
    // Size limits by file type
    const sizeLimit = {
      [FileType.PROFILE_AVATAR]: 5 * 1024 * 1024, // 5MB
      [FileType.PORTFOLIO_IMAGE]: 10 * 1024 * 1024, // 10MB
      [FileType.PROJECT_DELIVERABLE]: 50 * 1024 * 1024, // 50MB
    }[fileType] || 10 * 1024 * 1024; // Default 10MB

    if (file.size > sizeLimit) {
      return {
        valid: false,
        error: `File size (${StorageAPIHelpers.formatFileSize(file.size)}) exceeds limit (${StorageAPIHelpers.formatFileSize(sizeLimit)})`
      };
    }

    return { valid: true };
  },

  /**
   * Get file type from MIME type
   */
  getFileTypeFromMime: (mimeType: string): FileType => {
    if (mimeType.startsWith('image/')) return FileType.PORTFOLIO_IMAGE;
    if (mimeType.startsWith('video/')) return FileType.PORTFOLIO_VIDEO;
    if (mimeType === 'application/pdf') return FileType.PORTFOLIO_DOCUMENT;
    return FileType.TEMP_UPLOAD;
  }
};

// Export all examples for easy import
export const StorageExamples = {
  uploadProfileImage,
  uploadPortfolioAssets,
  uploadProjectDeliverable,
  uploadChatAttachment,
  getUserStorageDashboard,
  deleteUserGDPRCompliant,
  optimizeUserStorage,
  generateStorageReport,
  monitorSystemHealth,
  runAutomatedMaintenance,
  searchUserFiles,
  StorageAPIHelpers
};