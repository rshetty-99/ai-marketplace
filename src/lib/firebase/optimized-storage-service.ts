/**
 * Performance-Optimized Firebase Storage Service
 * Implements hot/warm/cold storage patterns, intelligent caching,
 * batch operations, and progressive loading for optimal performance
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
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase-config';
import { 
  StoragePathBuilder, 
  FileType, 
  UserType, 
  FileMetadata, 
  AccessPattern,
  FileClassification,
  GDPRRetentionBasis,
  StorageCacheEntry,
  FilePerformanceMetrics
} from './storage-architecture';

interface UploadOptions {
  ownerId?: string;
  ownerType?: 'user' | 'organization' | 'project' | 'public';
  isPublic?: boolean;
  accessLevel?: 'private' | 'organization' | 'project' | 'public';
  description?: string;
  tags?: string[];
  businessPurpose?: string;
  retentionBasis?: GDPRRetentionBasis;
  forceAccessPattern?: AccessPattern;
  onProgress?: (progress: number) => void;
}

interface BatchUploadResult {
  successful: FileMetadata[];
  failed: { file: File; error: string }[];
  totalTime: number;
  averageThroughput: number;
}

export class OptimizedStorageService {
  private storage = getStorage();
  private cache = new Map<string, StorageCacheEntry>();
  private uploadQueue: Array<() => Promise<any>> = [];
  private processingQueue = false;

  /**
   * Upload file with performance optimizations and intelligent storage tier selection
   */
  async uploadFile(
    file: File,
    userType: UserType,
    userId: string,
    fileType: FileType,
    options: UploadOptions = {}
  ): Promise<FileMetadata> {
    const startTime = Date.now();
    
    try {
      // Check storage quota
      await this.checkStorageQuota(userId, file.size);

      // Determine optimal access pattern
      const accessPattern = options.forceAccessPattern || 
        StoragePathBuilder.getOptimalAccessPattern(fileType);

      // Generate optimized filename and path
      const fileName = this.generateOptimizedFileName(file, fileType);
      const storagePath = this.buildOptimizedPath(
        userType, userId, fileType, fileName, accessPattern
      );

      // Determine file classification
      const dataClassification = this.determineFileClassification(fileType, options);

      // Create storage reference
      const storageRef = ref(this.storage, storagePath);

      // Upload with progress tracking and optimization
      const uploadResult = await this.performOptimizedUpload(
        storageRef, file, options.onProgress
      );

      // Create enhanced metadata
      const metadata: FileMetadata = {
        id: `${userId}_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        fileName,
        originalName: file.name,
        storagePath,
        downloadUrl: uploadResult.downloadUrl,
        fileType,
        mimeType: file.type,
        size: file.size,
        uploadedBy: userId,
        uploaderName: 'User', // Can be enhanced with actual user name
        ownerId: options.ownerId || userId,
        ownerType: options.ownerType || 'user',
        uploadedAt: new Date(),
        isPublic: options.isPublic || false,
        accessLevel: options.accessLevel || 'private',
        accessPattern,
        dataClassification,
        retentionBasis: options.retentionBasis || GDPRRetentionBasis.CONSENT,
        businessPurpose: options.businessPurpose,
        tags: options.tags,
        description: options.description,
        version: 1,
        downloadCount: 0,
        compressionEnabled: this.shouldCompress(file),
        thumbnailUrl: await this.generateThumbnail(file, uploadResult.downloadUrl),
        metadata: {
          uploadDuration: Date.now() - startTime,
          throughput: file.size / (Date.now() - startTime) * 1000
        }
      };

      // Save metadata to Firestore
      await this.saveFileMetadata(metadata);

      // Update storage summary
      await this.updateStorageSummary(userId, fileType, file.size, 1);

      // Cache the download URL
      await this.cacheDownloadUrl(storagePath, uploadResult.downloadUrl);

      // Track performance metrics
      await this.trackPerformanceMetrics({
        fileId: metadata.id,
        operation: 'upload',
        duration: Date.now() - startTime,
        fileSize: file.size,
        throughput: file.size / (Date.now() - startTime) * 1000,
        timestamp: new Date(),
        userId,
        accessPattern,
        cacheHit: false
      });

      return metadata;

    } catch (error) {
      console.error('Optimized file upload failed:', error);
      
      // Track failed upload
      await this.trackPerformanceMetrics({
        fileId: 'failed_upload',
        operation: 'upload',
        duration: Date.now() - startTime,
        fileSize: file.size,
        throughput: 0,
        timestamp: new Date(),
        userId,
        accessPattern: AccessPattern.WARM,
        cacheHit: false,
        errorCode: error.code || 'unknown_error'
      });
      
      throw error;
    }
  }

  /**
   * Batch upload multiple files with optimized processing
   */
  async uploadFilesBatch(
    files: File[],
    userType: UserType,
    userId: string,
    fileType: FileType,
    options: UploadOptions = {}
  ): Promise<BatchUploadResult> {
    const startTime = Date.now();
    const results: BatchUploadResult = {
      successful: [],
      failed: [],
      totalTime: 0,
      averageThroughput: 0
    };

    // Process in batches of 5 to avoid overwhelming the system
    const batchSize = 5;
    const batches = this.chunkArray(files, batchSize);

    for (const batch of batches) {
      const batchPromises = batch.map(file => 
        this.uploadFile(file, userType, userId, fileType, options)
          .then(metadata => ({ success: true, metadata, file }))
          .catch(error => ({ success: false, error: error.message, file }))
      );

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        if (result.success) {
          results.successful.push(result.metadata);
        } else {
          results.failed.push({ file: result.file, error: result.error });
        }
      }

      // Small delay between batches to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    results.totalTime = Date.now() - startTime;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    results.averageThroughput = totalSize / results.totalTime * 1000; // bytes per second

    return results;
  }

  /**
   * Get file with intelligent caching and progressive loading
   */
  async getFileWithCaching(
    filePath: string,
    variant?: 'thumbnail' | 'medium' | 'large' | 'original'
  ): Promise<string> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = `${filePath}:${variant || 'original'}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && cached.expiresAt > new Date()) {
        // Update access count and last accessed
        cached.accessCount++;
        cached.lastAccessed = new Date();
        
        await this.trackPerformanceMetrics({
          fileId: this.extractFileIdFromPath(filePath),
          operation: 'download',
          duration: Date.now() - startTime,
          fileSize: cached.size,
          throughput: cached.size / (Date.now() - startTime) * 1000,
          timestamp: new Date(),
          accessPattern: StoragePathBuilder.extractAccessPattern(filePath),
          cacheHit: true
        });

        return cached.downloadUrl;
      }

      // Get from storage
      const downloadUrl = await this.getOptimizedDownloadUrl(filePath, variant);
      
      // Cache the result
      await this.cacheDownloadUrl(filePath, downloadUrl, variant);

      await this.trackPerformanceMetrics({
        fileId: this.extractFileIdFromPath(filePath),
        operation: 'download',
        duration: Date.now() - startTime,
        fileSize: 0, // Size not available for downloads
        throughput: 0,
        timestamp: new Date(),
        accessPattern: StoragePathBuilder.extractAccessPattern(filePath),
        cacheHit: false
      });

      return downloadUrl;

    } catch (error) {
      console.error('Failed to get file with caching:', error);
      
      await this.trackPerformanceMetrics({
        fileId: this.extractFileIdFromPath(filePath),
        operation: 'download',
        duration: Date.now() - startTime,
        fileSize: 0,
        throughput: 0,
        timestamp: new Date(),
        accessPattern: StoragePathBuilder.extractAccessPattern(filePath),
        cacheHit: false,
        errorCode: error.code || 'unknown_error'
      });
      
      throw error;
    }
  }

  /**
   * Batch delete files with optimization
   */
  async deleteFilesBatch(filePaths: string[]): Promise<{
    successful: string[];
    failed: { path: string; error: string }[];
  }> {
    const results = {
      successful: [],
      failed: []
    };

    // Process in smaller batches to avoid Firebase limits
    const batches = this.chunkArray(filePaths, 10);

    for (const batch of batches) {
      const batchPromises = batch.map(async (filePath) => {
        try {
          // Get metadata first
          const metadata = await this.getFileMetadata(filePath);
          
          // Delete from storage
          const storageRef = ref(this.storage, filePath);
          await deleteObject(storageRef);

          // Delete metadata
          if (metadata) {
            await this.deleteFileMetadata(metadata.id);
            
            // Update storage summary
            await this.updateStorageSummary(
              metadata.uploadedBy, 
              metadata.fileType, 
              -metadata.size, 
              -1
            );
          }

          // Remove from cache
          this.removeCachedFile(filePath);

          return { success: true, path: filePath };
        } catch (error) {
          return { success: false, path: filePath, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        if (result.success) {
          results.successful.push(result.path);
        } else {
          results.failed.push({ path: result.path, error: result.error });
        }
      }
    }

    return results;
  }

  /**
   * Get files with pagination and smart loading
   */
  async getFilesPaginated(
    userId: string,
    fileType?: FileType,
    limitCount: number = 20,
    accessPattern?: AccessPattern
  ): Promise<{
    files: FileMetadata[];
    hasMore: boolean;
    totalCount: number;
  }> {
    let filesQuery = query(
      collection(db, 'file_metadata'),
      where('uploadedBy', '==', userId),
      orderBy('uploadedAt', 'desc'),
      limit(limitCount + 1) // Get one extra to check if there are more
    );

    if (fileType) {
      filesQuery = query(
        collection(db, 'file_metadata'),
        where('uploadedBy', '==', userId),
        where('fileType', '==', fileType),
        orderBy('uploadedAt', 'desc'),
        limit(limitCount + 1)
      );
    }

    if (accessPattern) {
      filesQuery = query(
        filesQuery,
        where('accessPattern', '==', accessPattern)
      );
    }

    const snapshot = await getDocs(filesQuery);
    const files = snapshot.docs.slice(0, limitCount).map(doc => doc.data() as FileMetadata);
    const hasMore = snapshot.docs.length > limitCount;

    // Get total count (this could be cached for better performance)
    const countQuery = query(
      collection(db, 'file_metadata'),
      where('uploadedBy', '==', userId)
    );
    const countSnapshot = await getDocs(countQuery);
    const totalCount = countSnapshot.size;

    return {
      files,
      hasMore,
      totalCount
    };
  }

  /**
   * Preload critical files for faster access
   */
  async preloadCriticalFiles(userId: string): Promise<void> {
    const criticalFileTypes = [
      FileType.PROFILE_AVATAR,
      FileType.COMPANY_LOGO,
      FileType.SERVICE_MEDIA
    ];

    const criticalFilesQuery = query(
      collection(db, 'file_metadata'),
      where('uploadedBy', '==', userId),
      where('fileType', 'in', criticalFileTypes),
      limit(10)
    );

    const snapshot = await getDocs(criticalFilesQuery);
    
    // Preload in background without blocking
    snapshot.docs.forEach(doc => {
      const metadata = doc.data() as FileMetadata;
      this.getFileWithCaching(metadata.storagePath).catch(console.warn);
    });
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache(): Promise<void> {
    const now = new Date();
    const expiredKeys = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
  }

  /**
   * Get storage performance statistics
   */
  async getPerformanceStats(
    timeRange: { start: Date; end: Date },
    userId?: string
  ): Promise<{
    averageUploadTime: number;
    averageDownloadTime: number;
    averageThroughput: number;
    cacheHitRate: number;
    totalOperations: number;
    errorRate: number;
  }> {
    let metricsQuery = query(
      collection(db, 'performance_metrics'),
      where('timestamp', '>=', timeRange.start),
      where('timestamp', '<=', timeRange.end)
    );

    if (userId) {
      metricsQuery = query(metricsQuery, where('userId', '==', userId));
    }

    const snapshot = await getDocs(metricsQuery);
    const metrics = snapshot.docs.map(doc => doc.data() as FilePerformanceMetrics);

    if (metrics.length === 0) {
      return {
        averageUploadTime: 0,
        averageDownloadTime: 0,
        averageThroughput: 0,
        cacheHitRate: 0,
        totalOperations: 0,
        errorRate: 0
      };
    }

    const uploads = metrics.filter(m => m.operation === 'upload');
    const downloads = metrics.filter(m => m.operation === 'download');
    const cacheHits = metrics.filter(m => m.cacheHit === true);
    const errors = metrics.filter(m => m.errorCode);

    return {
      averageUploadTime: uploads.length > 0 ? 
        uploads.reduce((sum, m) => sum + m.duration, 0) / uploads.length : 0,
      averageDownloadTime: downloads.length > 0 ? 
        downloads.reduce((sum, m) => sum + m.duration, 0) / downloads.length : 0,
      averageThroughput: metrics.reduce((sum, m) => sum + m.throughput, 0) / metrics.length,
      cacheHitRate: metrics.length > 0 ? (cacheHits.length / metrics.length) * 100 : 0,
      totalOperations: metrics.length,
      errorRate: metrics.length > 0 ? (errors.length / metrics.length) * 100 : 0
    };
  }

  /**
   * Private helper methods
   */
  private generateOptimizedFileName(file: File, fileType: FileType): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    // Create SEO-friendly filename for public files
    const baseName = fileType.includes('public') ? 
      this.createSEOFriendlyName(file.name) : 
      `${timestamp}_${randomId}`;
    
    return `${baseName}.${extension}`;
  }

  private buildOptimizedPath(
    userType: UserType,
    userId: string,
    fileType: FileType,
    fileName: string,
    accessPattern: AccessPattern
  ): string {
    // Determine if it's personal or business file
    if (fileType.startsWith('personal/')) {
      return StoragePathBuilder.buildPersonalPath(userType, userId, fileType, fileName);
    } else if (fileType.startsWith('business/')) {
      return StoragePathBuilder.buildBusinessPath(userType, userId, fileType, fileName);
    } else {
      return StoragePathBuilder.buildUserPath(userType, userId, fileType, fileName, accessPattern);
    }
  }

  private determineFileClassification(fileType: FileType, options: UploadOptions): FileClassification {
    if (fileType.startsWith('personal/')) return FileClassification.PERSONAL;
    if (fileType.startsWith('business/')) return FileClassification.BUSINESS;
    if (fileType.startsWith('public/')) return FileClassification.PUBLIC;
    if (fileType.startsWith('projects/') || fileType.startsWith('conversations/')) {
      return FileClassification.SHARED;
    }
    return FileClassification.BUSINESS; // Default
  }

  private async performOptimizedUpload(
    storageRef: any,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ downloadUrl: string }> {
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);
        },
        reject,
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ downloadUrl });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  private shouldCompress(file: File): boolean {
    const compressibleTypes = ['text/', 'application/json', 'application/xml'];
    return compressibleTypes.some(type => file.type.startsWith(type)) && file.size > 1024;
  }

  private async generateThumbnail(file: File, downloadUrl: string): Promise<string | undefined> {
    if (!file.type.startsWith('image/')) return undefined;
    
    // In production, this would integrate with Firebase storage-resize-images extension
    // For now, return the original URL with size parameters
    return `${downloadUrl}&width=150&height=150`;
  }

  private async cacheDownloadUrl(
    filePath: string, 
    downloadUrl: string, 
    variant?: string
  ): Promise<void> {
    const cacheKey = `${filePath}:${variant || 'original'}`;
    const cacheExpiry = new Date();
    cacheExpiry.setHours(cacheExpiry.getHours() + 1); // 1 hour cache

    this.cache.set(cacheKey, {
      filePath,
      downloadUrl,
      expiresAt: cacheExpiry,
      accessCount: 1,
      lastAccessed: new Date(),
      size: 0 // Size would be determined from metadata
    });
  }

  private async getOptimizedDownloadUrl(filePath: string, variant?: string): Promise<string> {
    const storageRef = ref(this.storage, filePath);
    let downloadUrl = await getDownloadURL(storageRef);
    
    // Add optimization parameters for images
    if (variant && variant !== 'original') {
      const sizeParams = this.getVariantParameters(variant);
      downloadUrl += sizeParams;
    }
    
    return downloadUrl;
  }

  private getVariantParameters(variant: string): string {
    const variants = {
      thumbnail: '&width=150&height=150',
      medium: '&width=500&height=500',
      large: '&width=1200&height=1200'
    };
    return variants[variant] || '';
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private createSEOFriendlyName(originalName: string): string {
    return originalName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private extractFileIdFromPath(filePath: string): string {
    const parts = filePath.split('/');
    return parts[parts.length - 1].split('.')[0];
  }

  private removeCachedFile(filePath: string): void {
    const keysToRemove = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(filePath)
    );
    keysToRemove.forEach(key => this.cache.delete(key));
  }

  private async saveFileMetadata(metadata: FileMetadata): Promise<void> {
    await addDoc(collection(db, 'file_metadata'), {
      ...metadata,
      uploadedAt: serverTimestamp(),
      lastModified: serverTimestamp()
    });
  }

  private async getFileMetadata(filePath: string): Promise<FileMetadata | null> {
    const metadataQuery = query(
      collection(db, 'file_metadata'),
      where('storagePath', '==', filePath)
    );
    const snapshot = await getDocs(metadataQuery);
    return snapshot.empty ? null : snapshot.docs[0].data() as FileMetadata;
  }

  private async deleteFileMetadata(fileId: string): Promise<void> {
    const metadataQuery = query(
      collection(db, 'file_metadata'),
      where('id', '==', fileId)
    );
    const snapshot = await getDocs(metadataQuery);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  private async updateStorageSummary(
    userId: string,
    fileType: FileType,
    sizeChange: number,
    countChange: number
  ): Promise<void> {
    try {
      const summaryRef = doc(db, 'storage_summary', userId);
      
      await runTransaction(db, async (transaction) => {
        const summaryDoc = await transaction.get(summaryRef);
        
        if (summaryDoc.exists()) {
          const data = summaryDoc.data();
          const newTotalSize = (data.totalSize || 0) + sizeChange;
          const newFileCount = (data.fileCount || 0) + countChange;
          
          transaction.update(summaryRef, {
            totalSize: newTotalSize,
            fileCount: newFileCount,
            [`fileTypes.${fileType}.size`]: (data.fileTypes?.[fileType]?.size || 0) + sizeChange,
            [`fileTypes.${fileType}.count`]: (data.fileTypes?.[fileType]?.count || 0) + countChange,
            lastUpdated: serverTimestamp(),
            quotaPercentage: newTotalSize / (data.quotaLimit || 5 * 1024 * 1024 * 1024) * 100
          });
        } else {
          // Create new summary document
          transaction.set(summaryRef, {
            userId,
            totalSize: Math.max(0, sizeChange),
            fileCount: Math.max(0, countChange),
            fileTypes: {
              [fileType]: {
                size: Math.max(0, sizeChange),
                count: Math.max(0, countChange)
              }
            },
            quotaLimit: 5 * 1024 * 1024 * 1024, // Default 5GB
            quotaPercentage: Math.max(0, sizeChange) / (5 * 1024 * 1024 * 1024) * 100,
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp()
          });
        }
      });
    } catch (error) {
      console.error('Failed to update storage summary:', error);
      throw error;
    }
  }

  private async checkStorageQuota(userId: string, fileSize: number): Promise<void> {
    try {
      const summaryRef = doc(db, 'storage_summary', userId);
      const summaryDoc = await summaryRef.get();
      
      if (summaryDoc.exists()) {
        const data = summaryDoc.data();
        const currentSize = data.totalSize || 0;
        const quotaLimit = data.quotaLimit || 5 * 1024 * 1024 * 1024; // Default 5GB
        
        if (currentSize + fileSize > quotaLimit) {
          const usedMB = Math.round(currentSize / 1024 / 1024);
          const limitMB = Math.round(quotaLimit / 1024 / 1024);
          const fileMB = Math.round(fileSize / 1024 / 1024);
          
          throw new Error(
            `Storage quota exceeded. Used: ${usedMB}MB, Limit: ${limitMB}MB, ` +
            `Attempting to add: ${fileMB}MB. Please delete some files or upgrade your plan.`
          );
        }
        
        // Warn if approaching quota (90%)
        if ((currentSize + fileSize) / quotaLimit > 0.9) {
          console.warn(
            `Storage quota warning: ${Math.round((currentSize + fileSize) / quotaLimit * 100)}% used`
          );
        }
      }
    } catch (error) {
      if (error.message.includes('quota exceeded')) {
        throw error;
      }
      console.error('Failed to check storage quota:', error);
      // Don't block upload if quota check fails
    }
  }

  private async trackPerformanceMetrics(metrics: FilePerformanceMetrics): Promise<void> {
    try {
      await addDoc(collection(db, 'performance_metrics'), {
        ...metrics,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.warn('Failed to track performance metrics:', error);
    }
  }
}

// Export singleton instance
export const optimizedStorageService = new OptimizedStorageService();