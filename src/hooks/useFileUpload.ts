/**
 * File Upload Hook
 * React hook for handling file uploads with progress tracking
 */

'use client';

import { useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { ProfileStorageService, FileMetadata, UploadProgress } from '@/lib/firebase/profile-storage-service';

export interface UseFileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  generateThumbnail?: boolean;
  compress?: boolean;
  multiple?: boolean;
}

export interface UseFileUploadReturn {
  upload: (files: File | File[], uploadType: UploadType, options?: UploadTypeOptions) => Promise<FileMetadata | FileMetadata[]>;
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadedFiles: FileMetadata[];
  reset: () => void;
}

export type UploadType = 'avatar' | 'portfolio' | 'document';

export interface UploadTypeOptions {
  projectId?: string; // for portfolio uploads
  documentType?: 'contract' | 'certificate' | 'proposal' | 'other'; // for document uploads
}

export function useFileUpload(defaultOptions: UseFileUploadOptions = {}): UseFileUploadReturn {
  const { user } = useUser();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([]);

  const upload = useCallback(async (
    files: File | File[],
    uploadType: UploadType,
    typeOptions: UploadTypeOptions = {}
  ): Promise<FileMetadata | FileMetadata[]> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const fileArray = Array.isArray(files) ? files : [files];

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const uploadOptions = {
        ...defaultOptions,
        onProgress: (progressInfo: UploadProgress) => {
          setProgress(progressInfo.progress);
          if (progressInfo.status === 'error') {
            setError(progressInfo.error || 'Upload failed');
          }
        }
      };

      let result: FileMetadata | FileMetadata[];

      switch (uploadType) {
        case 'avatar':
          if (fileArray.length > 1) {
            throw new Error('Only one avatar image can be uploaded at a time');
          }
          result = await ProfileStorageService.uploadAvatar(user.id, fileArray[0], uploadOptions);
          break;

        case 'portfolio':
          if (!typeOptions.projectId) {
            throw new Error('Project ID is required for portfolio uploads');
          }
          result = await ProfileStorageService.uploadPortfolioImages(
            user.id,
            fileArray,
            typeOptions.projectId,
            uploadOptions
          );
          break;

        case 'document':
          if (fileArray.length > 1) {
            throw new Error('Only one document can be uploaded at a time');
          }
          result = await ProfileStorageService.uploadDocument(
            user.id,
            fileArray[0],
            typeOptions.documentType || 'other',
            uploadOptions
          );
          break;

        default:
          throw new Error('Invalid upload type');
      }

      // Update uploaded files state
      const newFiles = Array.isArray(result) ? result : [result];
      setUploadedFiles(prev => [...prev, ...newFiles]);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [user?.id, defaultOptions]);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setUploadedFiles([]);
  }, []);

  return {
    upload,
    uploading,
    progress,
    error,
    uploadedFiles,
    reset
  };
}

// Specialized hooks for specific upload types
export function useAvatarUpload() {
  return useFileUpload({
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    generateThumbnail: true,
    compress: true,
    multiple: false
  });
}

export function usePortfolioUpload() {
  return useFileUpload({
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    generateThumbnail: true,
    compress: true,
    multiple: true
  });
}

export function useDocumentUpload() {
  return useFileUpload({
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ],
    multiple: false
  });
}