/**
 * GDPR-Compliant User Deletion Service
 * Implements selective deletion strategy that preserves business data
 * while removing personal information in compliance with GDPR Article 17
 */

import { 
  getStorage, 
  ref, 
  deleteObject, 
  listAll,
  updateMetadata
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
  writeBatch,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase-config';
import { 
  FileType, 
  UserType, 
  FileMetadata, 
  CleanupJob, 
  UserDeletionStrategy,
  FileClassification,
  GDPRRetentionBasis,
  StoragePathBuilder 
} from './storage-architecture';

interface GDPRComplianceReport {
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

export class GDPRDeletionService {
  private storage = getStorage();

  /**
   * Execute GDPR-compliant user deletion with selective strategy
   */
  async executeGDPRUserDeletion(
    userId: string, 
    userType: UserType,
    deletionReason: 'user_request' | 'retention_expired' | 'consent_withdrawn' = 'user_request',
    organizationId?: string
  ): Promise<CleanupJob> {
    const cleanupJob: CleanupJob = {
      id: `gdpr_deletion_${userId}_${Date.now()}`,
      type: 'user_gdpr_deletion',
      targetId: userId,
      targetType: 'user',
      status: 'pending',
      filesFound: 0,
      filesDeleted: 0,
      filesAnonymized: 0,
      filesTransferred: 0,
      totalSizeDeleted: 0,
      gdprReason: deletionReason,
      dataExportGenerated: false,
      createdAt: new Date(),
      requestedBy: userId,
      errors: [],
      warnings: []
    };

    try {
      // Create cleanup job record
      await addDoc(collection(db, 'cleanup_jobs'), cleanupJob);
      
      // Generate deletion strategy
      const strategy = await this.generateUserDeletionStrategy(userId, userType, organizationId);
      
      // Execute deletion strategy
      await this.executeDeletionStrategy(strategy, cleanupJob.id);
      
      return cleanupJob;
    } catch (error) {
      console.error('GDPR user deletion failed:', error);
      await this.updateCleanupJob(cleanupJob.id, { 
        status: 'failed',
        errors: [error.message]
      });
      throw error;
    }
  }

  /**
   * Generate selective deletion strategy based on user type and business context
   */
  private async generateUserDeletionStrategy(
    userId: string, 
    userType: UserType,
    organizationId?: string
  ): Promise<UserDeletionStrategy> {
    // Get all user files
    const userFiles = await this.getUserFiles(userId);
    
    const strategy: UserDeletionStrategy = {
      userId,
      userType,
      organizationId,
      personalFiles: [],
      businessFiles: [],
      transferFiles: [],
      retainedFiles: []
    };

    for (const file of userFiles) {
      const classification = this.classifyFile(file);
      
      switch (classification) {
        case FileClassification.PERSONAL:
          // DELETE: Personal data that must be removed
          strategy.personalFiles.push(file.storagePath);
          break;
          
        case FileClassification.BUSINESS:
          // ANONYMIZE: Business data that should be preserved but anonymized
          strategy.businessFiles.push({
            filePath: file.storagePath,
            newOwnerId: organizationId || 'platform',
            anonymizeMetadata: true
          });
          break;
          
        case FileClassification.SHARED:
          // TRANSFER: Shared business assets that should be transferred
          strategy.transferFiles.push({
            filePath: file.storagePath,
            newOwnerId: organizationId || this.determineNewOwner(file),
            transferReason: 'business_continuity'
          });
          break;
          
        case FileClassification.PUBLIC:
          // KEEP: Public assets that should remain
          // No action needed for public files
          break;
          
        default:
          // RETAIN: Files kept for legal/compliance reasons
          if (this.shouldRetainForCompliance(file)) {
            strategy.retainedFiles.push({
              filePath: file.storagePath,
              retentionReason: this.getRetentionReason(file),
              retentionPeriod: this.getRetentionPeriod(file)
            });
          }
      }
    }

    return strategy;
  }

  /**
   * Execute the deletion strategy
   */
  private async executeDeletionStrategy(
    strategy: UserDeletionStrategy, 
    jobId: string
  ): Promise<void> {
    await this.updateCleanupJob(jobId, { 
      status: 'in_progress', 
      startedAt: new Date() 
    });

    let totalDeleted = 0;
    let totalAnonymized = 0;
    let totalTransferred = 0;
    let totalSizeDeleted = 0;

    try {
      // 1. Delete personal files
      for (const filePath of strategy.personalFiles) {
        try {
          const metadata = await this.getFileMetadata(filePath);
          if (metadata) {
            await this.deletePersonalFile(filePath, metadata);
            totalDeleted++;
            totalSizeDeleted += metadata.size;
          }
        } catch (error) {
          console.warn(`Failed to delete personal file: ${filePath}`, error);
        }
      }

      // 2. Anonymize business files
      for (const fileInfo of strategy.businessFiles) {
        try {
          await this.anonymizeBusinessFile(fileInfo.filePath, fileInfo.newOwnerId);
          totalAnonymized++;
        } catch (error) {
          console.warn(`Failed to anonymize business file: ${fileInfo.filePath}`, error);
        }
      }

      // 3. Transfer file ownership
      for (const fileInfo of strategy.transferFiles) {
        try {
          await this.transferFileOwnership(
            fileInfo.filePath, 
            fileInfo.newOwnerId, 
            fileInfo.transferReason
          );
          totalTransferred++;
        } catch (error) {
          console.warn(`Failed to transfer file: ${fileInfo.filePath}`, error);
        }
      }

      // 4. Update retained files with anonymized metadata
      for (const fileInfo of strategy.retainedFiles) {
        try {
          await this.updateRetainedFile(fileInfo.filePath, fileInfo.retentionReason);
        } catch (error) {
          console.warn(`Failed to update retained file: ${fileInfo.filePath}`, error);
        }
      }

      // Mark job as completed
      await this.updateCleanupJob(jobId, {
        status: 'completed',
        completedAt: new Date(),
        filesDeleted: totalDeleted,
        filesAnonymized: totalAnonymized,
        filesTransferred: totalTransferred,
        totalSizeDeleted,
        progress: 100
      });

    } catch (error) {
      await this.updateCleanupJob(jobId, {
        status: 'failed',
        errors: [error.message]
      });
      throw error;
    }
  }

  /**
   * Classify file for deletion strategy
   */
  private classifyFile(file: FileMetadata): FileClassification {
    // Check explicit classification first
    if (file.dataClassification) {
      return file.dataClassification;
    }

    // Classify based on file type
    const personalFileTypes = [
      FileType.PROFILE_AVATAR,
      FileType.PROFILE_COVER,
      FileType.PERSONAL_VERIFICATION,
      FileType.PERSONAL_IDENTITY,
      FileType.PERSONAL_CERTIFICATES
    ];

    const businessFileTypes = [
      FileType.PORTFOLIO_IMAGE,
      FileType.PORTFOLIO_VIDEO,
      FileType.PORTFOLIO_DOCUMENT,
      FileType.CASE_STUDY_ASSET,
      FileType.WORK_SAMPLE,
      FileType.CONTRACT_DOCUMENT,
      FileType.INVOICE_DOCUMENT
    ];

    const sharedFileTypes = [
      FileType.PROJECT_ASSET,
      FileType.PROJECT_DELIVERABLE,
      FileType.PROJECT_DOCUMENTATION,
      FileType.MESSAGE_ATTACHMENT,
      FileType.CHAT_MEDIA,
      FileType.SHARED_FILES
    ];

    const publicFileTypes = [
      FileType.BLOG_IMAGE,
      FileType.BLOG_VIDEO,
      FileType.MARKETING_ASSET,
      FileType.SERVICE_MEDIA,
      FileType.COMPANY_LOGO,
      FileType.COMPANY_BANNER
    ];

    if (personalFileTypes.includes(file.fileType)) {
      return FileClassification.PERSONAL;
    }
    
    if (businessFileTypes.includes(file.fileType)) {
      return FileClassification.BUSINESS;
    }
    
    if (sharedFileTypes.includes(file.fileType)) {
      return FileClassification.SHARED;
    }
    
    if (publicFileTypes.includes(file.fileType)) {
      return FileClassification.PUBLIC;
    }

    // Default to business for unknown types
    return FileClassification.BUSINESS;
  }

  /**
   * Delete personal file completely
   */
  private async deletePersonalFile(filePath: string, metadata: FileMetadata): Promise<void> {
    // Delete from storage
    const storageRef = ref(this.storage, filePath);
    await deleteObject(storageRef);

    // Delete metadata from Firestore
    const metadataQuery = query(
      collection(db, 'file_metadata'),
      where('storagePath', '==', filePath)
    );
    const snapshot = await getDocs(metadataQuery);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    console.log(`Personal file deleted: ${filePath}`);
  }

  /**
   * Anonymize business file while preserving business value
   */
  private async anonymizeBusinessFile(filePath: string, newOwnerId: string): Promise<void> {
    const metadataQuery = query(
      collection(db, 'file_metadata'),
      where('storagePath', '==', filePath)
    );
    const snapshot = await getDocs(metadataQuery);

    for (const docSnapshot of snapshot.docs) {
      const fileData = docSnapshot.data() as FileMetadata;
      
      // Anonymize metadata
      const anonymizedData = {
        ...fileData,
        uploadedBy: 'deleted_user_' + this.hashUserId(fileData.uploadedBy),
        uploaderName: 'Former Team Member',
        ownerId: newOwnerId,
        isAnonymized: true,
        anonymizedAt: new Date(),
        // Remove personal identifiers
        tags: fileData.tags?.filter(tag => !this.isPersonalTag(tag)),
        description: this.anonymizeDescription(fileData.description),
        // Keep business context
        businessPurpose: fileData.businessPurpose || 'business_asset',
        retentionBasis: GDPRRetentionBasis.LEGITIMATE_INTEREST
      };

      await updateDoc(docSnapshot.ref, anonymizedData);
    }

    console.log(`Business file anonymized: ${filePath}`);
  }

  /**
   * Transfer file ownership to organization or new owner
   */
  private async transferFileOwnership(
    filePath: string, 
    newOwnerId: string, 
    transferReason: string
  ): Promise<void> {
    const metadataQuery = query(
      collection(db, 'file_metadata'),
      where('storagePath', '==', filePath)
    );
    const snapshot = await getDocs(metadataQuery);

    for (const docSnapshot of snapshot.docs) {
      await updateDoc(docSnapshot.ref, {
        ownerId: newOwnerId,
        ownerType: newOwnerId.startsWith('org_') ? 'organization' : 'platform',
        uploadedBy: 'transferred_user_' + this.hashUserId(docSnapshot.data().uploadedBy),
        uploaderName: 'Former Team Member',
        businessPurpose: transferReason,
        retentionBasis: GDPRRetentionBasis.LEGITIMATE_INTEREST,
        lastModified: new Date()
      });
    }

    console.log(`File ownership transferred: ${filePath} -> ${newOwnerId}`);
  }

  /**
   * Update retained file with compliance information
   */
  private async updateRetainedFile(filePath: string, retentionReason: string): Promise<void> {
    const metadataQuery = query(
      collection(db, 'file_metadata'),
      where('storagePath', '==', filePath)
    );
    const snapshot = await getDocs(metadataQuery);

    for (const docSnapshot of snapshot.docs) {
      await updateDoc(docSnapshot.ref, {
        uploadedBy: 'retained_user_' + this.hashUserId(docSnapshot.data().uploadedBy),
        uploaderName: 'Former User (Retained for Compliance)',
        businessPurpose: retentionReason,
        retentionBasis: GDPRRetentionBasis.LEGAL_OBLIGATION,
        isAnonymized: true,
        anonymizedAt: new Date(),
        lastModified: new Date()
      });
    }

    console.log(`Retained file updated: ${filePath}`);
  }

  /**
   * Helper methods
   */
  private async getUserFiles(userId: string): Promise<FileMetadata[]> {
    const filesQuery = query(
      collection(db, 'file_metadata'),
      where('uploadedBy', '==', userId)
    );
    const snapshot = await getDocs(filesQuery);
    return snapshot.docs.map(doc => doc.data() as FileMetadata);
  }

  private async getFileMetadata(filePath: string): Promise<FileMetadata | null> {
    const metadataQuery = query(
      collection(db, 'file_metadata'),
      where('storagePath', '==', filePath)
    );
    const snapshot = await getDocs(metadataQuery);
    return snapshot.empty ? null : snapshot.docs[0].data() as FileMetadata;
  }

  private shouldRetainForCompliance(file: FileMetadata): boolean {
    const legalRetentionTypes = [
      FileType.CONTRACT_DOCUMENT,
      FileType.INVOICE_DOCUMENT,
      FileType.LEGAL_DOCUMENT,
      FileType.COMPLIANCE_DOCUMENT
    ];
    
    return legalRetentionTypes.includes(file.fileType) ||
           file.retentionBasis === GDPRRetentionBasis.LEGAL_OBLIGATION;
  }

  private getRetentionReason(file: FileMetadata): string {
    if (file.fileType === FileType.CONTRACT_DOCUMENT) return 'contract_legal_requirement';
    if (file.fileType === FileType.INVOICE_DOCUMENT) return 'tax_legal_requirement';
    if (file.fileType === FileType.LEGAL_DOCUMENT) return 'legal_compliance';
    return 'business_legal_requirement';
  }

  private getRetentionPeriod(file: FileMetadata): number {
    // Return days for retention period
    if (file.fileType === FileType.CONTRACT_DOCUMENT) return 10 * 365; // 10 years
    if (file.fileType === FileType.INVOICE_DOCUMENT) return 7 * 365;  // 7 years
    if (file.fileType === FileType.LEGAL_DOCUMENT) return 10 * 365;   // 10 years
    return 7 * 365; // Default 7 years
  }

  private determineNewOwner(file: FileMetadata): string {
    // Try to determine the best new owner for the file
    if (file.relatedEntities && file.relatedEntities.length > 0) {
      return file.relatedEntities[0];
    }
    if (file.ownerType === 'organization') {
      return file.ownerId;
    }
    return 'platform'; // Default to platform ownership
  }

  private hashUserId(userId: string): string {
    // Simple hash for anonymization (use a proper hashing library in production)
    return btoa(userId).substring(0, 8);
  }

  private isPersonalTag(tag: string): boolean {
    const personalTags = ['personal', 'private', 'confidential', 'identity'];
    return personalTags.some(pt => tag.toLowerCase().includes(pt));
  }

  private anonymizeDescription(description?: string): string | undefined {
    if (!description) return undefined;
    
    // Remove personal identifiers (names, emails, etc.)
    return description
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]')
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[name]')
      .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[phone]');
  }

  private async updateCleanupJob(jobId: string, updates: Partial<CleanupJob>): Promise<void> {
    const jobQuery = query(collection(db, 'cleanup_jobs'), where('id', '==', jobId));
    const jobSnapshot = await getDocs(jobQuery);
    
    if (!jobSnapshot.empty) {
      await updateDoc(jobSnapshot.docs[0].ref, {
        ...updates,
        lastUpdated: serverTimestamp()
      });
    }
  }

  /**
   * Generate GDPR compliance report for user or organization
   */
  async generateGDPRComplianceReport(
    userId?: string,
    organizationId?: string
  ): Promise<GDPRComplianceReport> {
    const report: GDPRComplianceReport = {
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
   * Check individual file compliance
   */
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

  /**
   * Generate compliance recommendations based on report findings
   */
  private generateComplianceRecommendations(report: GDPRComplianceReport): string[] {
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
    if (report.summary.totalFiles > 0) {
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
    }

    return recommendations;
  }
}

// Export singleton instance
export const gdprDeletionService = new GDPRDeletionService();