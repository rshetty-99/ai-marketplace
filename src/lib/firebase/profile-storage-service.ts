/**
 * Profile Storage Service
 * Secure file upload and management for profile assets
 */

import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  uploadBytesResumable,
  getMetadata
} from 'firebase/storage';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'paused';
  downloadURL?: string;
  error?: string;
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  downloadURL: string;
  path: string;
  thumbnailURL?: string;
}

export interface UploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  generateThumbnail?: boolean;
  compress?: boolean;
  onProgress?: (progress: UploadProgress) => void;
}

export class ProfileStorageService {
  private static readonly DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];
  private static readonly ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  /**
   * Upload profile avatar
   */
  static async uploadAvatar(
    userId: string,
    file: File,
    options: UploadOptions = {}
  ): Promise<FileMetadata> {
    const {
      maxSize = this.DEFAULT_MAX_SIZE,
      allowedTypes = this.ALLOWED_IMAGE_TYPES,
      onProgress
    } = options;

    // Validate file
    this.validateFile(file, maxSize, allowedTypes);

    // Compress image if needed
    const processedFile = options.compress ? await this.compressImage(file) : file;

    const fileId = uuidv4();
    const path = `profiles/${userId}/avatar/${fileId}`;
    const storageRef = ref(storage, path);

    try {
      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, processedFile);
      
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.({
              progress,
              status: 'uploading'
            });
          },
          (error) => {
            onProgress?.({
              progress: 0,
              status: 'error',
              error: error.message
            });
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const metadata = await getMetadata(uploadTask.snapshot.ref);
              
              const fileMetadata: FileMetadata = {
                id: fileId,
                name: file.name,
                size: file.size,
                type: file.type,
                uploadedAt: new Date(),
                downloadURL,
                path,
                thumbnailURL: options.generateThumbnail ? await this.generateThumbnail(downloadURL) : undefined
              };

              // Update user profile with new avatar
              await this.updateProfileField(userId, 'avatar', downloadURL);

              onProgress?.({
                progress: 100,
                status: 'completed',
                downloadURL
              });

              resolve(fileMetadata);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      throw new Error(`Avatar upload failed: ${error}`);
    }
  }

  /**
   * Upload portfolio images
   */
  static async uploadPortfolioImages(
    userId: string,
    files: File[],
    projectId: string,
    options: UploadOptions = {}
  ): Promise<FileMetadata[]> {
    const {
      maxSize = this.DEFAULT_MAX_SIZE,
      allowedTypes = this.ALLOWED_IMAGE_TYPES,
      onProgress
    } = options;

    const uploadPromises = files.map(async (file, index) => {
      this.validateFile(file, maxSize, allowedTypes);

      const fileId = uuidv4();
      const path = `profiles/${userId}/portfolio/${projectId}/${fileId}`;
      const storageRef = ref(storage, path);

      const processedFile = options.compress ? await this.compressImage(file) : file;
      const uploadTask = uploadBytesResumable(storageRef, processedFile);

      return new Promise<FileMetadata>((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.({
              progress: (progress + (index * 100)) / files.length,
              status: 'uploading'
            });
          },
          reject,
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const metadata = await getMetadata(uploadTask.snapshot.ref);

              const fileMetadata: FileMetadata = {
                id: fileId,
                name: file.name,
                size: file.size,
                type: file.type,
                uploadedAt: new Date(),
                downloadURL,
                path,
                thumbnailURL: options.generateThumbnail ? await this.generateThumbnail(downloadURL) : undefined
              };

              resolve(fileMetadata);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    });

    const results = await Promise.all(uploadPromises);
    
    onProgress?.({
      progress: 100,
      status: 'completed'
    });

    return results;
  }

  /**
   * Upload documents (contracts, certificates, etc.)
   */
  static async uploadDocument(
    userId: string,
    file: File,
    documentType: 'contract' | 'certificate' | 'proposal' | 'other',
    options: UploadOptions = {}
  ): Promise<FileMetadata> {
    const {
      maxSize = this.DEFAULT_MAX_SIZE * 5, // 50MB for documents
      allowedTypes = [...this.ALLOWED_DOCUMENT_TYPES, ...this.ALLOWED_IMAGE_TYPES],
      onProgress
    } = options;

    this.validateFile(file, maxSize, allowedTypes);

    const fileId = uuidv4();
    const path = `profiles/${userId}/documents/${documentType}/${fileId}`;
    const storageRef = ref(storage, path);

    try {
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.({
              progress,
              status: 'uploading'
            });
          },
          reject,
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const metadata = await getMetadata(uploadTask.snapshot.ref);

              const fileMetadata: FileMetadata = {
                id: fileId,
                name: file.name,
                size: file.size,
                type: file.type,
                uploadedAt: new Date(),
                downloadURL,
                path
              };

              // Update profile with document reference
              await this.addDocumentToProfile(userId, documentType, fileMetadata);

              onProgress?.({
                progress: 100,
                status: 'completed',
                downloadURL
              });

              resolve(fileMetadata);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      throw new Error(`Document upload failed: ${error}`);
    }
  }

  /**
   * Delete file from storage and update profile
   */
  static async deleteFile(userId: string, filePath: string, profileField?: string): Promise<void> {
    try {
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);

      // Remove from profile if specified
      if (profileField) {
        await this.removeFromProfileField(userId, profileField, filePath);
      }
    } catch (error) {
      throw new Error(`File deletion failed: ${error}`);
    }
  }

  /**
   * Get all files for a user
   */
  static async getUserFiles(userId: string): Promise<FileMetadata[]> {
    try {
      const userFolderRef = ref(storage, `profiles/${userId}`);
      const listResult = await listAll(userFolderRef);
      
      const filePromises = listResult.items.map(async (itemRef) => {
        const downloadURL = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        
        return {
          id: itemRef.name,
          name: itemRef.name,
          size: metadata.size || 0,
          type: metadata.contentType || 'unknown',
          uploadedAt: new Date(metadata.timeCreated),
          downloadURL,
          path: itemRef.fullPath
        };
      });

      return Promise.all(filePromises);
    } catch (error) {
      throw new Error(`Failed to get user files: ${error}`);
    }
  }

  /**
   * Validate file before upload
   */
  private static validateFile(file: File, maxSize: number, allowedTypes: string[]): void {
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
  }

  /**
   * Compress image file
   */
  private static async compressImage(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob!], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate thumbnail for image
   */
  private static async generateThumbnail(imageUrl: string): Promise<string> {
    // In a real implementation, you might use a service like Cloudinary
    // For now, return the original URL
    return imageUrl;
  }

  /**
   * Update profile field with new value
   */
  private static async updateProfileField(userId: string, field: string, value: any): Promise<void> {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      [field]: value,
      updatedAt: new Date()
    });
  }

  /**
   * Add document to profile
   */
  private static async addDocumentToProfile(
    userId: string, 
    documentType: string, 
    fileMetadata: FileMetadata
  ): Promise<void> {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      [`documents.${documentType}`]: arrayUnion(fileMetadata),
      updatedAt: new Date()
    });
  }

  /**
   * Remove file reference from profile
   */
  private static async removeFromProfileField(userId: string, field: string, filePath: string): Promise<void> {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      [field]: arrayRemove(filePath),
      updatedAt: new Date()
    });
  }
}