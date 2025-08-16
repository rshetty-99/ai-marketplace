/**
 * Firebase Storage Service
 * Handles file uploads, downloads, tracking, and cleanup operations
 */

import { 
  getStorage, 
  ref, 
  uploadBytes, 
  uploadBytesResumable,
  getDownloadURL, 
  deleteObject, 
  listAll,
  getMetadata,
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
  orderBy, 
  limit,
  runTransaction,
  writeBatch,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase-config';
import { 
  StoragePathBuilder, 
  FileType, 
  UserType, 
  FileMetadata, 
  StorageSummary, 
  CleanupJob,
  STORAGE_QUOTAS,
  RETENTION_POLICIES
} from './storage-architecture';

export class StorageService {
  private storage = getStorage();

  /**
   * Upload file with metadata tracking
   */
  async uploadFile(
    file: File,
    userType: UserType,
    userId: string,
    fileType: FileType,
    options: {
      ownerId?: string;
      ownerType?: 'user' | 'organization' | 'project' | 'public';
      isPublic?: boolean;
      accessLevel?: 'private' | 'organization' | 'project' | 'public';
      description?: string;
      tags?: string[];
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<FileMetadata> {
    // Check storage quota
    await this.checkStorageQuota(userId, file.size);

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomId}.${extension}`;

    // Build storage path
    const storagePath = StoragePathBuilder.buildUserPath(userType, userId, fileType, fileName);
    const storageRef = ref(this.storage, storagePath);

    try {
      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            options.onProgress?.(progress);
          },
          (error) => reject(error),
          async () => {
            try {
              // Get download URL
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

              // Create file metadata
              const metadata: FileMetadata = {
                id: `${userId}_${timestamp}_${randomId}`,
                fileName,
                originalName: file.name,
                storagePath,
                downloadUrl,
                fileType,
                mimeType: file.type,
                size: file.size,
                uploadedBy: userId,
                ownerId: options.ownerId || userId,
                ownerType: options.ownerType || 'user',
                uploadedAt: new Date(),
                isPublic: options.isPublic || false,
                accessLevel: options.accessLevel || 'private',
                description: options.description,
                tags: options.tags,
                version: 1
              };

              // Save metadata to Firestore
              await this.saveFileMetadata(metadata);

              // Update storage summary
              await this.updateStorageSummary(userId, fileType, file.size, 1);

              resolve(metadata);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  /**
   * Delete file and cleanup metadata
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    try {
      // Get file metadata
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        throw new Error('File not found');
      }

      // Check permissions
      if (metadata.uploadedBy !== userId && metadata.ownerId !== userId) {
        throw new Error('Unauthorized to delete this file');
      }

      // Delete from storage
      const storageRef = ref(this.storage, metadata.storagePath);
      await deleteObject(storageRef);

      // Delete metadata
      await deleteDoc(doc(db, 'file_metadata', fileId));

      // Update storage summary
      await this.updateStorageSummary(
        metadata.uploadedBy, 
        metadata.fileType, 
        -metadata.size, 
        -1
      );

      console.log(`File deleted: ${fileId}`);
    } catch (error) {
      console.error('File deletion failed:', error);
      throw error;
    }
  }

  /**
   * Get file metadata from Firestore
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      const docRef = doc(db, 'file_metadata', fileId);
      const docSnap = await getDocs(query(collection(db, 'file_metadata'), where('id', '==', fileId)));
      
      if (docSnap.empty) return null;
      
      return docSnap.docs[0].data() as FileMetadata;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return null;
    }
  }

  /**
   * Save file metadata to Firestore
   */
  private async saveFileMetadata(metadata: FileMetadata): Promise<void> {
    await addDoc(collection(db, 'file_metadata'), {
      ...metadata,
      uploadedAt: serverTimestamp(),
    });
  }

  /**
   * Update storage summary for user/organization
   */
  private async updateStorageSummary(
    userId: string, 
    fileType: FileType, 
    sizeChange: number, 
    countChange: number
  ): Promise<void> {
    const summaryRef = doc(db, 'storage_summary', userId);
    
    await runTransaction(db, async (transaction) => {
      const summaryDoc = await transaction.get(summaryRef);
      
      if (summaryDoc.exists()) {
        // Update existing summary
        const currentData = summaryDoc.data() as StorageSummary;
        const newTotalSize = currentData.totalSize + sizeChange;
        const newTotalFiles = currentData.totalFiles + countChange;
        
        const updatedFilesByType = {
          ...currentData.filesByType,
          [fileType]: {
            count: (currentData.filesByType[fileType]?.count || 0) + countChange,
            size: (currentData.filesByType[fileType]?.size || 0) + sizeChange
          }
        };

        transaction.update(summaryRef, {
          totalFiles: newTotalFiles,
          totalSize: newTotalSize,
          filesByType: updatedFilesByType,
          quotaUsed: newTotalSize,
          quotaPercentage: currentData.quotaLimit ? (newTotalSize / currentData.quotaLimit) * 100 : 0,
          lastUpdated: serverTimestamp()
        });
      } else {
        // Create new summary
        const newSummary: Partial<StorageSummary> = {
          userId,
          totalFiles: Math.max(0, countChange),
          totalSize: Math.max(0, sizeChange),
          filesByType: {
            [fileType]: {
              count: Math.max(0, countChange),
              size: Math.max(0, sizeChange)
            }
          } as any,
          lastUpdated: serverTimestamp(),
          quotaUsed: Math.max(0, sizeChange),
          quotaPercentage: 0
        };

        transaction.set(summaryRef, newSummary);
      }
    });
  }

  /**
   * Check if user has sufficient storage quota
   */
  async checkStorageQuota(userId: string, fileSize: number): Promise<void> {
    const summaryRef = doc(db, 'storage_summary', userId);
    const summaryDoc = await getDocs(query(collection(db, 'storage_summary'), where('userId', '==', userId)));
    
    if (!summaryDoc.empty) {
      const summary = summaryDoc.docs[0].data() as StorageSummary;
      const newTotalSize = summary.totalSize + fileSize;
      
      if (summary.quotaLimit && newTotalSize > summary.quotaLimit) {
        throw new Error(`Storage quota exceeded. Used: ${this.formatBytes(summary.totalSize)}, Limit: ${this.formatBytes(summary.quotaLimit)}`);
      }
    }
  }

  /**
   * Clean up all files for a user (GDPR compliance)
   */
  async cleanupUserFiles(userId: string, userType: UserType): Promise<CleanupJob> {
    const cleanupJob: CleanupJob = {
      id: `cleanup_${userId}_${Date.now()}`,
      type: 'user_deletion',
      targetId: userId,
      targetType: 'user',
      status: 'pending',
      filesFound: 0,
      filesDeleted: 0,
      totalSizeDeleted: 0,
      createdAt: new Date()
    };

    try {
      // Save cleanup job
      await addDoc(collection(db, 'cleanup_jobs'), cleanupJob);
      
      // Start cleanup process
      await this.executeUserCleanup(userId, userType, cleanupJob.id);
      
      return cleanupJob;
    } catch (error) {
      console.error('User cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Execute user file cleanup
   */
  private async executeUserCleanup(userId: string, userType: UserType, jobId: string): Promise<void> {
    try {
      // Update job status
      await this.updateCleanupJob(jobId, { status: 'in_progress', startedAt: new Date() });

      // Get all user files
      const filesQuery = query(
        collection(db, 'file_metadata'),
        where('uploadedBy', '==', userId)
      );
      const filesSnapshot = await getDocs(filesQuery);
      
      const totalFiles = filesSnapshot.size;
      let deletedFiles = 0;
      let totalSizeDeleted = 0;

      // Update files found
      await this.updateCleanupJob(jobId, { filesFound: totalFiles });

      // Delete files in batches
      const batch = writeBatch(db);
      const filesToDelete = [];

      for (const doc of filesSnapshot.docs) {
        const metadata = doc.data() as FileMetadata;
        filesToDelete.push(metadata);
        
        // Add to batch for metadata deletion
        batch.delete(doc.ref);
      }

      // Commit metadata deletions
      await batch.commit();

      // Delete actual files from storage
      for (const metadata of filesToDelete) {
        try {
          const storageRef = ref(this.storage, metadata.storagePath);
          await deleteObject(storageRef);
          deletedFiles++;
          totalSizeDeleted += metadata.size;
          
          // Update progress
          const progress = (deletedFiles / totalFiles) * 100;
          await this.updateCleanupJob(jobId, { 
            filesDeleted: deletedFiles,
            totalSizeDeleted,
            progress
          });
        } catch (error) {
          console.error(`Failed to delete file: ${metadata.storagePath}`, error);
        }
      }

      // Delete storage summary
      await deleteDoc(doc(db, 'storage_summary', userId));

      // Mark job as completed
      await this.updateCleanupJob(jobId, { 
        status: 'completed',
        completedAt: new Date(),
        filesDeleted: deletedFiles,
        totalSizeDeleted
      });

      console.log(`User cleanup completed for ${userId}: ${deletedFiles}/${totalFiles} files deleted`);
    } catch (error) {
      await this.updateCleanupJob(jobId, { 
        status: 'failed',
        errors: [error.message]
      });
      throw error;
    }
  }

  /**
   * Update cleanup job status
   */
  private async updateCleanupJob(jobId: string, updates: Partial<CleanupJob>): Promise<void> {
    const jobQuery = query(collection(db, 'cleanup_jobs'), where('id', '==', jobId));
    const jobSnapshot = await getDocs(jobQuery);
    
    if (!jobSnapshot.empty) {
      await updateDoc(jobSnapshot.docs[0].ref, updates);
    }
  }

  /**
   * Clean up expired temporary files
   */
  async cleanupExpiredFiles(): Promise<void> {
    const now = new Date();
    
    // Get expired files
    const expiredQuery = query(
      collection(db, 'file_metadata'),
      where('expiresAt', '<=', now)
    );
    
    const expiredSnapshot = await getDocs(expiredQuery);
    
    for (const doc of expiredSnapshot.docs) {
      const metadata = doc.data() as FileMetadata;
      try {
        await this.deleteFile(metadata.id, metadata.uploadedBy);
      } catch (error) {
        console.error(`Failed to delete expired file: ${metadata.id}`, error);
      }
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(userId: string): Promise<StorageSummary | null> {
    const summaryQuery = query(
      collection(db, 'storage_summary'),
      where('userId', '==', userId)
    );
    
    const summarySnapshot = await getDocs(summaryQuery);
    
    if (summarySnapshot.empty) return null;
    
    return summarySnapshot.docs[0].data() as StorageSummary;
  }

  /**
   * Get files by user and type
   */
  async getUserFiles(
    userId: string,
    fileType?: FileType,
    limitCount: number = 50
  ): Promise<FileMetadata[]> {
    let filesQuery = query(
      collection(db, 'file_metadata'),
      where('uploadedBy', '==', userId),
      orderBy('uploadedAt', 'desc'),
      limit(limitCount)
    );

    if (fileType) {
      filesQuery = query(
        collection(db, 'file_metadata'),
        where('uploadedBy', '==', userId),
        where('fileType', '==', fileType),
        orderBy('uploadedAt', 'desc'),
        limit(limitCount)
      );
    }

    const filesSnapshot = await getDocs(filesQuery);
    return filesSnapshot.docs.map(doc => doc.data() as FileMetadata);
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const storageService = new StorageService();