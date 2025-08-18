/**
 * File Upload Component
 * Drag & drop file upload with progress tracking
 */

'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Upload,
  X,
  File,
  Image as ImageIcon,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

export interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  uploading?: boolean;
  progress?: number;
  error?: string | null;
  className?: string;
  dropzoneText?: string;
  allowedTypes?: string[];
}

export function FileUpload({
  onUpload,
  accept = '*',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = multiple ? 5 : 1,
  disabled = false,
  uploading = false,
  progress = 0,
  error = null,
  className,
  dropzoneText,
  allowedTypes = []
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is ${formatFileSize(maxSize)}.`;
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `File type "${file.type}" is not allowed.`;
    }

    return null;
  }, [maxSize, allowedTypes]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || disabled) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate each file
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    }

    // Check total file count
    if (validFiles.length > maxFiles) {
      errors.push(`Too many files. Maximum allowed is ${maxFiles}.`);
      return;
    }

    if (errors.length > 0) {
      console.error('File validation errors:', errors);
      return;
    }

    setSelectedFiles(validFiles);
    if (validFiles.length > 0) {
      onUpload(validFiles);
    }
  }, [disabled, validateFile, maxFiles, onUpload]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    
    handleFiles(e.dataTransfer.files);
  }, [disabled, handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    } else if (file.type === 'application/pdf' || file.type.includes('document')) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors cursor-pointer',
          dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50',
          error ? 'border-destructive' : ''
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground mb-4" />
          )}
          
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {uploading ? 'Uploading files...' : 
               dropzoneText || (multiple ? 'Drop files here or click to browse' : 'Drop file here or click to browse')}
            </p>
            <p className="text-xs text-muted-foreground">
              {allowedTypes.length > 0 && `Supported: ${allowedTypes.join(', ')}`}
              {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
              {multiple && ` • Max files: ${maxFiles}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && !uploading && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files:</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  {getFileIcon(file)}
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Specialized file upload components
export function AvatarUpload(props: Omit<FileUploadProps, 'accept' | 'multiple' | 'allowedTypes'>) {
  return (
    <FileUpload
      {...props}
      accept="image/*"
      multiple={false}
      allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
      maxSize={5 * 1024 * 1024} // 5MB
      dropzoneText="Drop your profile image here or click to browse"
    />
  );
}

export function PortfolioUpload(props: Omit<FileUploadProps, 'accept' | 'allowedTypes'>) {
  return (
    <FileUpload
      {...props}
      accept="image/*"
      allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']}
      maxSize={10 * 1024 * 1024} // 10MB
      maxFiles={5}
      dropzoneText="Drop portfolio images here or click to browse"
    />
  );
}

export function DocumentUpload(props: Omit<FileUploadProps, 'accept' | 'multiple' | 'allowedTypes'>) {
  return (
    <FileUpload
      {...props}
      accept=".pdf,.doc,.docx,.txt,image/*"
      multiple={false}
      allowedTypes={[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png'
      ]}
      maxSize={50 * 1024 * 1024} // 50MB
      dropzoneText="Drop document here or click to browse"
    />
  );
}