/**
 * React Hook for File Upload Management
 * Provides file upload functionality with progress tracking and error handling
 */

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { storageService } from '@/lib/firebase/storage-service';
import { FileType, UserType, FileMetadata } from '@/lib/firebase/storage-architecture';

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface UseFileUploadOptions {
  maxFileSize?: number; // bytes
  allowedTypes?: string[]; // MIME types
  maxFiles?: number;
  autoUpload?: boolean;
}

export interface UseFileUploadReturn {
  // State
  uploads: UploadProgress[];
  isUploading: boolean;
  error: string | null;
  
  // Actions
  uploadFile: (
    file: File,
    fileType: FileType,
    options?: {
      ownerId?: string;
      ownerType?: 'user' | 'organization' | 'project' | 'public';
      isPublic?: boolean;
      accessLevel?: 'private' | 'organization' | 'project' | 'public';
      description?: string;
      tags?: string[];
    }
  ) => Promise<FileMetadata>;
  
  uploadFiles: (
    files: File[],
    fileType: FileType,
    options?: {
      ownerId?: string;
      ownerType?: 'user' | 'organization' | 'project' | 'public';
      isPublic?: boolean;
      accessLevel?: 'private' | 'organization' | 'project' | 'public';
      description?: string;
      tags?: string[];
    }
  ) => Promise<FileMetadata[]>;
  
  removeUpload: (fileId: string) => void;
  clearUploads: () => void;
  clearError: () => void;
}

const DEFAULT_OPTIONS: UseFileUploadOptions = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'video/mp4',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  maxFiles: 10,
  autoUpload: true
};\n\nexport function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {\n  const { user } = useAuth();\n  const [uploads, setUploads] = useState<UploadProgress[]>([]);\n  const [isUploading, setIsUploading] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n\n  const config = { ...DEFAULT_OPTIONS, ...options };\n\n  // Validate file before upload\n  const validateFile = useCallback((file: File): string | null => {\n    if (!config.allowedTypes?.includes(file.type)) {\n      return `File type \"${file.type}\" is not allowed`;\n    }\n    \n    if (config.maxFileSize && file.size > config.maxFileSize) {\n      const maxSizeMB = (config.maxFileSize / (1024 * 1024)).toFixed(1);\n      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);\n      return `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`;\n    }\n    \n    return null;\n  }, [config.allowedTypes, config.maxFileSize]);\n\n  // Upload single file\n  const uploadFile = useCallback(async (\n    file: File,\n    fileType: FileType,\n    uploadOptions: {\n      ownerId?: string;\n      ownerType?: 'user' | 'organization' | 'project' | 'public';\n      isPublic?: boolean;\n      accessLevel?: 'private' | 'organization' | 'project' | 'public';\n      description?: string;\n      tags?: string[];\n    } = {}\n  ): Promise<FileMetadata> => {\n    if (!user) {\n      throw new Error('User not authenticated');\n    }\n\n    // Validate file\n    const validationError = validateFile(file);\n    if (validationError) {\n      throw new Error(validationError);\n    }\n\n    // Check upload limit\n    if (config.maxFiles && uploads.length >= config.maxFiles) {\n      throw new Error(`Maximum ${config.maxFiles} files allowed`);\n    }\n\n    const fileId = `${Date.now()}_${Math.random().toString(36).substring(2)}`;\n\n    // Add to uploads list\n    const initialProgress: UploadProgress = {\n      fileId,\n      fileName: file.name,\n      progress: 0,\n      status: 'uploading'\n    };\n\n    setUploads(prev => [...prev, initialProgress]);\n    setIsUploading(true);\n    setError(null);\n\n    try {\n      // Determine user type (this should come from user profile)\n      const userType = getUserType(user); // You'll need to implement this\n\n      // Upload file with progress tracking\n      const metadata = await storageService.uploadFile(\n        file,\n        userType,\n        user.id,\n        fileType,\n        {\n          ...uploadOptions,\n          onProgress: (progress) => {\n            setUploads(prev => prev.map(upload => \n              upload.fileId === fileId \n                ? { ...upload, progress }\n                : upload\n            ));\n          }\n        }\n      );\n\n      // Mark as completed\n      setUploads(prev => prev.map(upload => \n        upload.fileId === fileId \n          ? { ...upload, progress: 100, status: 'completed' }\n          : upload\n      ));\n\n      return metadata;\n    } catch (err) {\n      const errorMessage = err instanceof Error ? err.message : 'Upload failed';\n      \n      // Mark as error\n      setUploads(prev => prev.map(upload => \n        upload.fileId === fileId \n          ? { ...upload, status: 'error', error: errorMessage }\n          : upload\n      ));\n      \n      setError(errorMessage);\n      throw err;\n    } finally {\n      setIsUploading(false);\n    }\n  }, [user, validateFile, config.maxFiles, uploads.length]);\n\n  // Upload multiple files\n  const uploadFiles = useCallback(async (\n    files: File[],\n    fileType: FileType,\n    uploadOptions: {\n      ownerId?: string;\n      ownerType?: 'user' | 'organization' | 'project' | 'public';\n      isPublic?: boolean;\n      accessLevel?: 'private' | 'organization' | 'project' | 'public';\n      description?: string;\n      tags?: string[];\n    } = {}\n  ): Promise<FileMetadata[]> => {\n    if (config.maxFiles && files.length > config.maxFiles) {\n      throw new Error(`Maximum ${config.maxFiles} files allowed`);\n    }\n\n    const results: FileMetadata[] = [];\n    const errors: string[] = [];\n\n    for (const file of files) {\n      try {\n        const metadata = await uploadFile(file, fileType, uploadOptions);\n        results.push(metadata);\n      } catch (err) {\n        const errorMessage = err instanceof Error ? err.message : 'Upload failed';\n        errors.push(`${file.name}: ${errorMessage}`);\n      }\n    }\n\n    if (errors.length > 0) {\n      setError(`Some uploads failed: ${errors.join(', ')}`);\n    }\n\n    return results;\n  }, [uploadFile, config.maxFiles]);\n\n  // Remove upload from list\n  const removeUpload = useCallback((fileId: string) => {\n    setUploads(prev => prev.filter(upload => upload.fileId !== fileId));\n  }, []);\n\n  // Clear all uploads\n  const clearUploads = useCallback(() => {\n    setUploads([]);\n    setIsUploading(false);\n  }, []);\n\n  // Clear error\n  const clearError = useCallback(() => {\n    setError(null);\n  }, []);\n\n  return {\n    uploads,\n    isUploading,\n    error,\n    uploadFile,\n    uploadFiles,\n    removeUpload,\n    clearUploads,\n    clearError\n  };\n}\n\n// Helper function to determine user type from user object\n// This should be implemented based on your user data structure\nfunction getUserType(user: any): UserType {\n  // This is a placeholder - implement based on your user schema\n  if (user.type === 'freelancer') return UserType.FREELANCER;\n  if (user.type === 'vendor') return UserType.VENDOR;\n  if (user.type === 'customer') return UserType.CUSTOMER;\n  if (user.type === 'organization') return UserType.ORGANIZATION;\n  \n  // Default fallback\n  return UserType.FREELANCER;\n}\n\n// File validation helpers\nexport const FILE_VALIDATION = {\n  IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],\n  VIDEO_TYPES: ['video/mp4', 'video/webm'],\n  DOCUMENT_TYPES: [\n    'application/pdf',\n    'application/msword',\n    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',\n    'application/vnd.ms-excel',\n    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',\n    'text/plain',\n    'text/csv'\n  ],\n  ARCHIVE_TYPES: ['application/zip', 'application/x-zip-compressed'],\n  \n  MAX_SIZES: {\n    IMAGE: 5 * 1024 * 1024, // 5MB\n    VIDEO: 50 * 1024 * 1024, // 50MB\n    DOCUMENT: 10 * 1024 * 1024, // 10MB\n    DEFAULT: 10 * 1024 * 1024 // 10MB\n  }\n};"