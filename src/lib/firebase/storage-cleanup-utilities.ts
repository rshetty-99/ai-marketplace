/**
 * Storage Cleanup and GDPR Compliance Utilities
 * Automated cleanup jobs, retention policy enforcement,
 * and compliance reporting for Firebase Storage
 */

import { 
  getStorage, 
  ref, 
  deleteObject, 
  listAll,
  getMetadata
} from 'firebase/storage';
import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase-config';
import { 
  FileType, 
  UserType, 
  FileMetadata, 
  CleanupJob,
  RETENTION_POLICIES,
  AccessPattern,
  FileClassification,
  GDPRRetentionBasis
} from './storage-architecture';

interface CleanupSchedule {
  id: string;
  type: 'temp_cleanup' | 'expired_files' | 'retention_policy' | 'cache_cleanup';
  schedule: string; // Cron-like schedule
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  parameters?: Record<string, any>;
}

interface ComplianceReport {
  id: string;
  generatedAt: Date;
  reportType: 'gdpr_compliance' | 'retention_audit' | 'data_mapping';
  userId?: string;
  organizationId?: string;
  summary: {
    totalFiles: number;
    personalDataFiles: number;
    businessDataFiles: number;
    retainedFiles: number;
    anonymizedFiles: number;
  };
  violations: ComplianceViolation[];
  recommendations: string[];
}

interface ComplianceViolation {
  type: 'expired_retention' | 'missing_classification' | 'invalid_basis' | 'orphaned_data';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedFiles: string[];
  remediation: string;
}

export class StorageCleanupUtilities {
  private storage = getStorage();

  /**
   * Clean up expired temporary files
   */
  async cleanupExpiredTempFiles(): Promise<CleanupJob> {
    const cleanupJob: CleanupJob = {
      id: `temp_cleanup_${Date.now()}`,
      type: 'temp_cleanup',
      targetId: 'system',
      targetType: 'user',
      status: 'pending',
      filesFound: 0,
      filesDeleted: 0,
      filesAnonymized: 0,
      filesTransferred: 0,
      totalSizeDeleted: 0,
      createdAt: new Date(),
      requestedBy: 'system',
      errors: [],
      warnings: []
    };

    try {
      await this.createCleanupJob(cleanupJob);
      await this.updateCleanupJob(cleanupJob.id, { status: 'in_progress', startedAt: new Date() });

      // Find expired temp files (older than 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const expiredFilesQuery = query(
        collection(db, 'file_metadata'),
        where('fileType', '==', FileType.TEMP_UPLOAD),
        where('uploadedAt', '<=', oneDayAgo)
      );

      const snapshot = await getDocs(expiredFilesQuery);
      const expiredFiles = snapshot.docs.map(doc => doc.data() as FileMetadata);

      let deletedCount = 0;
      let totalSizeDeleted = 0;

      // Delete expired temp files
      for (const file of expiredFiles) {
        try {
          await this.deleteTempFile(file);
          deletedCount++;
          totalSizeDeleted += file.size;
        } catch (error) {
          cleanupJob.errors.push(`Failed to delete ${file.storagePath}: ${error.message}`);
        }
      }

      await this.updateCleanupJob(cleanupJob.id, {
        status: 'completed',
        completedAt: new Date(),
        filesFound: expiredFiles.length,
        filesDeleted: deletedCount,
        totalSizeDeleted,
        progress: 100
      });

      console.log(`Temp cleanup completed: ${deletedCount}/${expiredFiles.length} files deleted`);
      return cleanupJob;

    } catch (error) {
      await this.updateCleanupJob(cleanupJob.id, {
        status: 'failed',
        errors: [error.message]
      });
      throw error;
    }
  }

  /**
   * Enforce retention policies across all file types
   */
  async enforceRetentionPolicies(): Promise<CleanupJob> {
    const cleanupJob: CleanupJob = {
      id: `retention_cleanup_${Date.now()}`,
      type: 'retention_policy',
      targetId: 'system',
      targetType: 'user',
      status: 'pending',
      filesFound: 0,
      filesDeleted: 0,
      filesAnonymized: 0,
      filesTransferred: 0,
      totalSizeDeleted: 0,
      createdAt: new Date(),
      requestedBy: 'system',
      errors: [],
      warnings: []
    };

    try {
      await this.createCleanupJob(cleanupJob);
      await this.updateCleanupJob(cleanupJob.id, { status: 'in_progress', startedAt: new Date() });

      let totalProcessed = 0;
      let totalDeleted = 0;
      let totalAnonymized = 0;
      let totalSizeDeleted = 0;

      // Process each file type with retention policy
      for (const [fileType, retentionPeriod] of Object.entries(RETENTION_POLICIES)) {
        if (retentionPeriod === null) continue; // Keep forever

        const cutoffDate = new Date();
        cutoffDate.setTime(cutoffDate.getTime() - retentionPeriod);

        const expiredFilesQuery = query(
          collection(db, 'file_metadata'),
          where('fileType', '==', fileType),
          where('uploadedAt', '<=', cutoffDate)
        );

        const snapshot = await getDocs(expiredFilesQuery);
        const expiredFiles = snapshot.docs.map(doc => doc.data() as FileMetadata);
        totalProcessed += expiredFiles.length;

        for (const file of expiredFiles) {
          try {
            const action = this.determineRetentionAction(file);
            
            if (action === 'delete') {
              await this.deleteExpiredFile(file);
              totalDeleted++;
              totalSizeDeleted += file.size;
            } else if (action === 'anonymize') {
              await this.anonymizeExpiredFile(file);
              totalAnonymized++;
            }
          } catch (error) {
            cleanupJob.errors.push(`Failed to process ${file.storagePath}: ${error.message}`);
          }
        }
      }

      await this.updateCleanupJob(cleanupJob.id, {
        status: 'completed',
        completedAt: new Date(),
        filesFound: totalProcessed,
        filesDeleted: totalDeleted,
        filesAnonymized: totalAnonymized,
        totalSizeDeleted,
        progress: 100
      });

      console.log(`Retention cleanup completed: ${totalDeleted} deleted, ${totalAnonymized} anonymized`);
      return cleanupJob;

    } catch (error) {
      await this.updateCleanupJob(cleanupJob.id, {
        status: 'failed',
        errors: [error.message]
      });
      throw error;
    }
  }

  /**
   * Clean up orphaned files (files without metadata)
   */
  async cleanupOrphanedFiles(): Promise<CleanupJob> {
    const cleanupJob: CleanupJob = {
      id: `orphaned_cleanup_${Date.now()}`,
      type: 'expired_files',
      targetId: 'system',
      targetType: 'user',
      status: 'pending',
      filesFound: 0,
      filesDeleted: 0,
      filesAnonymized: 0,
      filesTransferred: 0,
      totalSizeDeleted: 0,
      createdAt: new Date(),
      requestedBy: 'system',
      errors: [],
      warnings: []
    };

    try {
      await this.createCleanupJob(cleanupJob);
      await this.updateCleanupJob(cleanupJob.id, { status: 'in_progress', startedAt: new Date() });

      // Get all file metadata
      const metadataSnapshot = await getDocs(collection(db, 'file_metadata'));
      const metadataPaths = new Set(
        metadataSnapshot.docs.map(doc => doc.data().storagePath)
      );

      // Check for orphaned entries in metadata (files that don't exist in storage)
      let orphanedMetadata = 0;
      const batch = writeBatch(db);
      
      for (const doc of metadataSnapshot.docs) {
        const metadata = doc.data() as FileMetadata;
        
        try {
          // Try to get metadata from storage to see if file exists
          const storageRef = ref(this.storage, metadata.storagePath);
          await getMetadata(storageRef);
        } catch (error) {
          if (error.code === 'storage/object-not-found') {
            // File doesn't exist in storage, delete metadata
            batch.delete(doc.ref);
            orphanedMetadata++;
            cleanupJob.warnings.push(`Orphaned metadata removed: ${metadata.storagePath}`);
          }
        }
      }
      
      if (orphanedMetadata > 0) {
        await batch.commit();
      }

      // For a full orphaned file cleanup in storage, we would need to:
      // 1. List all files in storage (expensive operation)
      // 2. Check each against metadata collection
      // 3. Delete files without metadata
      // This is commented out for performance reasons but can be enabled for deep cleanup
      
      /*
      // WARNING: This operation can be very expensive for large storage
      const storageRoot = ref(this.storage);
      const storageList = await listAll(storageRoot);
      
      let orphanedFiles = 0;
      for (const item of storageList.items) {
        if (!metadataPaths.has(item.fullPath)) {
          // File exists in storage but not in metadata
          try {
            await deleteObject(item);
            orphanedFiles++;
            cleanupJob.warnings.push(`Orphaned file deleted: ${item.fullPath}`);
          } catch (error) {
            cleanupJob.errors.push(`Failed to delete orphaned file ${item.fullPath}: ${error.message}`);
          }
        }
      }
      */

      await this.updateCleanupJob(cleanupJob.id, {
        status: 'completed',
        completedAt: new Date(),
        filesFound: orphanedMetadata,
        filesDeleted: orphanedMetadata,
        progress: 100
      });

      console.log(`Orphaned cleanup completed: ${orphanedMetadata} orphaned metadata entries removed`);
      return cleanupJob;

    } catch (error) {
      await this.updateCleanupJob(cleanupJob.id, {
        status: 'failed',
        errors: [error.message]
      });
      throw error;
    }
  }

  /**
   * Generate GDPR compliance report
   */
  async generateGDPRComplianceReport(
    userId?: string,
    organizationId?: string
  ): Promise<ComplianceReport> {
    const report: ComplianceReport = {
      id: `gdpr_report_${Date.now()}`,
      generatedAt: new Date(),
      reportType: 'gdpr_compliance',
      userId,
      organizationId,
      summary: {
        totalFiles: 0,
        personalDataFiles: 0,
        businessDataFiles: 0,
        retainedFiles: 0,
        anonymizedFiles: 0
      },
      violations: [],
      recommendations: []
    };

    try {
      // Build query based on scope
      let filesQuery = collection(db, 'file_metadata');
      if (userId) {
        filesQuery = query(filesQuery, where('uploadedBy', '==', userId));
      } else if (organizationId) {
        filesQuery = query(filesQuery, where('ownerId', '==', organizationId));
      }

      const snapshot = await getDocs(filesQuery);
      const files = snapshot.docs.map(doc => doc.data() as FileMetadata);

      // Analyze files for compliance
      for (const file of files) {
        report.summary.totalFiles++;

        // Classify data type
        if (file.dataClassification === FileClassification.PERSONAL) {
          report.summary.personalDataFiles++;
        } else if (file.dataClassification === FileClassification.BUSINESS) {
          report.summary.businessDataFiles++;
        }

        if (file.isAnonymized) {
          report.summary.anonymizedFiles++;
        }

        if (file.retentionBasis === GDPRRetentionBasis.LEGAL_OBLIGATION) {
          report.summary.retainedFiles++;
        }

        // Check for violations
        const violations = await this.checkFileCompliance(file);
        report.violations.push(...violations);
      }

      // Generate recommendations
      report.recommendations = this.generateComplianceRecommendations(report);

      // Save report
      await addDoc(collection(db, 'compliance_reports'), {
        ...report,
        generatedAt: serverTimestamp()
      });

      return report;

    } catch (error) {
      console.error('Failed to generate GDPR compliance report:', error);
      throw error;
    }
  }

  /**
   * Schedule automated cleanup jobs
   */
  async scheduleCleanupJob(schedule: CleanupSchedule): Promise<void> {
    await addDoc(collection(db, 'cleanup_schedules'), {
      ...schedule,
      createdAt: serverTimestamp(),
      lastModified: serverTimestamp()
    });

    console.log(`Cleanup job scheduled: ${schedule.type} - ${schedule.schedule}`);
  }

  /**
   * Get cleanup job history and statistics
   */
  async getCleanupHistory(
    limit: number = 50,
    type?: CleanupJob['type']
  ): Promise<{
    jobs: CleanupJob[];
    statistics: {
      totalJobs: number;
      successfulJobs: number;
      failedJobs: number;
      totalFilesDeleted: number;
      totalSizeFreed: number; // in bytes
    };
  }> {
    let jobsQuery = query(
      collection(db, 'cleanup_jobs'),
      orderBy('createdAt', 'desc'),
      limit(limit)
    );

    if (type) {
      jobsQuery = query(jobsQuery, where('type', '==', type));
    }

    const snapshot = await getDocs(jobsQuery);
    const jobs = snapshot.docs.map(doc => doc.data() as CleanupJob);

    // Calculate statistics
    const statistics = {
      totalJobs: jobs.length,
      successfulJobs: jobs.filter(job => job.status === 'completed').length,
      failedJobs: jobs.filter(job => job.status === 'failed').length,
      totalFilesDeleted: jobs.reduce((sum, job) => sum + job.filesDeleted, 0),
      totalSizeFreed: jobs.reduce((sum, job) => sum + job.totalSizeDeleted, 0)
    };

    return { jobs, statistics };
  }

  /**
   * Private helper methods
   */
  private async deleteTempFile(file: FileMetadata): Promise<void> {
    // Delete from storage
    const storageRef = ref(this.storage, file.storagePath);
    await deleteObject(storageRef);

    // Delete metadata
    const metadataQuery = query(
      collection(db, 'file_metadata'),
      where('id', '==', file.id)
    );
    const snapshot = await getDocs(metadataQuery);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  private async deleteExpiredFile(file: FileMetadata): Promise<void> {
    // Same as deleteTempFile but with different logging
    await this.deleteTempFile(file);
    console.log(`Expired file deleted: ${file.storagePath}`);
  }

  private async anonymizeExpiredFile(file: FileMetadata): Promise<void> {
    const metadataQuery = query(
      collection(db, 'file_metadata'),
      where('id', '==', file.id)
    );
    const snapshot = await getDocs(metadataQuery);

    for (const docSnapshot of snapshot.docs) {
      await updateDoc(docSnapshot.ref, {
        uploadedBy: 'anonymized_user_' + this.hashString(file.uploadedBy),
        uploaderName: 'Anonymized User',
        isAnonymized: true,
        anonymizedAt: new Date(),
        retentionBasis: GDPRRetentionBasis.LEGITIMATE_INTEREST,
        lastModified: serverTimestamp()
      });
    }

    console.log(`File anonymized: ${file.storagePath}`);
  }

  private determineRetentionAction(file: FileMetadata): 'delete' | 'anonymize' | 'keep' {
    // Personal data should be deleted
    if (file.dataClassification === FileClassification.PERSONAL) {
      return 'delete';
    }

    // Business data with legitimate interest can be anonymized
    if (file.dataClassification === FileClassification.BUSINESS) {
      return 'anonymize';
    }

    // Legal obligation files should be kept
    if (file.retentionBasis === GDPRRetentionBasis.LEGAL_OBLIGATION) {
      return 'keep';
    }

    // Default to anonymize for safety
    return 'anonymize';
  }

  private async checkFileCompliance(file: FileMetadata): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    // Check for missing data classification
    if (!file.dataClassification) {
      violations.push({
        type: 'missing_classification',
        severity: 'medium',
        description: 'File lacks proper data classification',
        affectedFiles: [file.storagePath],
        remediation: 'Add dataClassification field to file metadata'
      });
    }

    // Check for missing retention basis
    if (!file.retentionBasis) {
      violations.push({
        type: 'invalid_basis',
        severity: 'high',
        description: 'File lacks GDPR retention basis',
        affectedFiles: [file.storagePath],
        remediation: 'Add retentionBasis field to file metadata'
      });
    }

    // Check for expired retention periods
    if (file.expiresAt && file.expiresAt < new Date()) {
      violations.push({
        type: 'expired_retention',
        severity: 'critical',
        description: 'File has exceeded its retention period',
        affectedFiles: [file.storagePath],
        remediation: 'Delete or anonymize the file according to retention policy'
      });
    }

    return violations;
  }

  private generateComplianceRecommendations(report: ComplianceReport): string[] {
    const recommendations: string[] = [];

    // Check violation patterns
    const missingClassifications = report.violations.filter(v => v.type === 'missing_classification');
    if (missingClassifications.length > 0) {
      recommendations.push(
        `${missingClassifications.length} files need data classification. ` +
        'Implement automated classification based on file type and content.'
      );
    }

    const expiredFiles = report.violations.filter(v => v.type === 'expired_retention');
    if (expiredFiles.length > 0) {
      recommendations.push(
        `${expiredFiles.length} files have exceeded retention periods. ` +
        'Set up automated cleanup jobs to handle expired files.'
      );
    }

    // Check data distribution
    const personalDataRatio = report.summary.personalDataFiles / report.summary.totalFiles;
    if (personalDataRatio > 0.5) {
      recommendations.push(
        'High percentage of personal data files detected. ' +
        'Consider implementing data minimization strategies.'
      );
    }

    const anonymizedRatio = report.summary.anonymizedFiles / report.summary.totalFiles;
    if (anonymizedRatio < 0.1 && report.summary.totalFiles > 100) {
      recommendations.push(
        'Low anonymization rate. Consider anonymizing older business files ' +
        'that no longer need personal identifiers.'
      );
    }

    return recommendations;
  }

  private async createCleanupJob(job: CleanupJob): Promise<void> {
    await addDoc(collection(db, 'cleanup_jobs'), {
      ...job,
      createdAt: serverTimestamp()
    });
  }

  private async updateCleanupJob(jobId: string, updates: Partial<CleanupJob>): Promise<void> {
    const jobQuery = query(collection(db, 'cleanup_jobs'), where('id', '==', jobId));
    const snapshot = await getDocs(jobQuery);
    
    if (!snapshot.empty) {
      await updateDoc(snapshot.docs[0].ref, {
        ...updates,
        lastModified: serverTimestamp()
      });
    }
  }

  private hashString(input: string): string {
    // Simple hash function for anonymization
    return btoa(input).substring(0, 8);
  }
}

// Export singleton instance
export const storageCleanupUtilities = new StorageCleanupUtilities();