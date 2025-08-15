'use client';

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Image, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Camera,
  Scan,
  Shield,
  Eye,
  RotateCcw
} from 'lucide-react';
import { DocumentType, VerificationStatus } from '@/lib/firebase/verification-schema';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface DocumentUploadProps {
  documentType: DocumentType;
  onUploadComplete: (files: UploadedFile[]) => void;
  onError: (error: string) => void;
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
  requiresBothSides?: boolean;
  requiresSelfie?: boolean;
  existingFiles?: UploadedFile[];
}

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: 'front' | 'back' | 'selfie' | 'document';
  size: number;
  mimeType: string;
  uploadedAt: Date;
  status: 'uploading' | 'completed' | 'failed';
  error?: string;
}

const DOCUMENT_REQUIREMENTS = {
  [DocumentType.PASSPORT]: {
    sides: ['front'],
    description: 'Main page with photo and personal information',
    tips: ['Ensure all text is clearly visible', 'Remove passport from protective cover', 'Good lighting is essential']
  },
  [DocumentType.DRIVERS_LICENSE]: {
    sides: ['front', 'back'],
    description: 'Both sides of your driver\'s license',
    tips: ['Remove from wallet', 'Lay flat on contrasting background', 'Ensure no glare or shadows']
  },
  [DocumentType.NATIONAL_ID]: {
    sides: ['front', 'back'],
    description: 'Government-issued national ID card',
    tips: ['Both sides required', 'Ensure all corners are visible', 'High resolution preferred']
  },
  [DocumentType.RESIDENCE_PERMIT]: {
    sides: ['front', 'back'],
    description: 'Valid residence permit or visa',
    tips: ['Must be current and valid', 'Clear photo required', 'All text must be legible']
  },
  [DocumentType.WORK_PERMIT]: {
    sides: ['front', 'back'],
    description: 'Work authorization document',
    tips: ['Check expiration date', 'Ensure document is unfolded', 'Good contrast with background']
  }
};

export function DocumentUpload({
  documentType,
  onUploadComplete,
  onError,
  maxFileSize = 10,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  requiresBothSides = DOCUMENT_REQUIREMENTS[documentType]?.sides.includes('back'),
  requiresSelfie = false,
  existingFiles = []
}: DocumentUploadProps) {
  const { trackEvent } = useAnalytics();
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [selectedSide, setSelectedSide] = useState<'front' | 'back' | 'selfie'>('front');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const requirements = DOCUMENT_REQUIREMENTS[documentType];
  const maxFileSizeBytes = maxFileSize * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSizeBytes) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    if (!acceptedFormats.includes(file.type)) {
      return `File type not supported. Please use: ${acceptedFormats.join(', ')}`;
    }

    // Check image dimensions (minimum requirements)
    if (file.type.startsWith('image/')) {
      return new Promise<string | null>((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (img.width < 800 || img.height < 600) {
            resolve('Image resolution too low. Minimum 800x600 pixels required.');
          } else {
            resolve(null);
          }
        };
        img.src = URL.createObjectURL(file);
      }) as any;
    }

    return null;
  };

  const handleFileUpload = useCallback(async (selectedFiles: FileList, side: 'front' | 'back' | 'selfie' = selectedSide) => {
    const file = selectedFiles[0];
    if (!file) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      onError(validationError);
      return;
    }

    const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newFile: UploadedFile = {
      id: fileId,
      name: file.name,
      url: '', // Will be set after upload
      type: side,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date(),
      status: 'uploading'
    };

    // Add to files list
    setFiles(prev => {
      // Remove existing file of same type
      const filtered = prev.filter(f => f.type !== side);
      return [...filtered, newFile];
    });

    // Track upload start
    trackEvent('document_upload_started', {
      documentType,
      fileType: side,
      fileSize: file.size,
      mimeType: file.type
    });

    try {
      // Simulate upload progress
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      
      // In a real implementation, you would upload to your storage service
      // For demo purposes, we'll simulate the upload
      const uploadResult = await simulateFileUpload(file, (progress) => {
        setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
      });

      // Update file with URL
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, url: uploadResult.url, status: 'completed' }
          : f
      ));

      // Remove from progress tracking
      setUploadProgress(prev => {
        const { [fileId]: _, ...rest } = prev;
        return rest;
      });

      // Track successful upload
      trackEvent('document_upload_completed', {
        documentType,
        fileType: side,
        fileSize: file.size,
        uploadTimeMs: uploadResult.uploadTime
      });

      // Check if all required files are uploaded
      const updatedFiles = files.map(f => 
        f.id === fileId 
          ? { ...f, url: uploadResult.url, status: 'completed' }
          : f
      );
      updatedFiles.push(newFile);

      checkCompletion(updatedFiles);

    } catch (error) {
      console.error('Upload failed:', error);
      
      // Update file status to failed
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'failed', error: 'Upload failed. Please try again.' }
          : f
      ));

      // Track failed upload
      trackEvent('document_upload_failed', {
        documentType,
        fileType: side,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      onError('Upload failed. Please try again.');
    }
  }, [documentType, files, maxFileSize, onError, selectedSide, trackEvent]);

  const checkCompletion = (currentFiles: UploadedFile[]) => {
    const completedFiles = currentFiles.filter(f => f.status === 'completed');
    const hasFront = completedFiles.some(f => f.type === 'front');
    const hasBack = completedFiles.some(f => f.type === 'back');
    const hasSelfie = completedFiles.some(f => f.type === 'selfie');

    const isComplete = hasFront && 
                      (!requiresBothSides || hasBack) && 
                      (!requiresSelfie || hasSelfie);

    if (isComplete) {
      onUploadComplete(completedFiles);
    }
  };

  // Simulate file upload with progress
  const simulateFileUpload = (file: File, onProgress: (progress: number) => void): Promise<{url: string, uploadTime: number}> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let progress = 0;

      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Generate a mock URL
          const mockUrl = `https://storage.example.com/documents/${Date.now()}_${file.name}`;
          const uploadTime = Date.now() - startTime;
          
          onProgress(100);
          setTimeout(() => resolve({ url: mockUrl, uploadTime }), 500);
        } else {
          onProgress(Math.round(progress));
        }
      }, 100);
    });
  };

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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    
    trackEvent('document_file_removed', {
      documentType,
      fileId
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mimeType === 'application/pdf') return <FileText className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'uploading': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getSideLabel = (side: 'front' | 'back' | 'selfie') => {
    switch (side) {
      case 'front': return 'Front Side';
      case 'back': return 'Back Side';
      case 'selfie': return 'Selfie Photo';
      default: return side;
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {documentType.replace('_', ' ').toUpperCase()} Verification
          </CardTitle>
          <CardDescription>
            {requirements?.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requirements?.tips && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Photography Tips:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {requirements.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 mt-0.5 text-green-600 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Side Selection */}
      {(requiresBothSides || requiresSelfie) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Select Document Side</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={selectedSide === 'front' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSide('front')}
              >
                Front Side
              </Button>
              
              {requiresBothSides && (
                <Button
                  variant={selectedSide === 'back' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSide('back')}
                >
                  Back Side
                </Button>
              )}
              
              {requiresSelfie && (
                <Button
                  variant={selectedSide === 'selfie' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSide('selfie')}
                >
                  <Camera className="w-4 h-4 mr-1" />
                  Selfie
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Upload {getSideLabel(selectedSide)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="w-12 h-12 text-muted-foreground" />
              </div>
              
              <div>
                <p className="text-lg font-medium">Upload {getSideLabel(selectedSide)}</p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop your file here, or click to browse
                </p>
              </div>

              <div className="flex justify-center gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
                
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  variant="outline"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Supported formats: JPEG, PNG, WebP, PDF • Max size: {maxFileSize}MB
              </p>
            </div>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
          />
          
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getFileIcon(file.mimeType)}
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  
                  <Badge variant="outline" className="text-xs">
                    {getSideLabel(file.type)}
                  </Badge>

                  <div className="flex-1">
                    {file.status === 'uploading' && uploadProgress[file.id] !== undefined && (
                      <div className="space-y-1">
                        <Progress value={uploadProgress[file.id]} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Uploading... {uploadProgress[file.id]}%
                        </p>
                      </div>
                    )}
                    
                    {file.status === 'completed' && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span className="text-xs">Upload complete</span>
                      </div>
                    )}
                    
                    {file.status === 'failed' && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-xs">{file.error || 'Upload failed'}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {file.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Retry upload logic
                          removeFile(file.id);
                        }}
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    )}
                    
                    {file.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(file.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Status */}
      {files.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {files.filter(f => f.status === 'completed').length === (requiresBothSides ? 2 : 1) + (requiresSelfie ? 1 : 0) ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-medium">All required documents uploaded successfully</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span className="text-amber-600">
                    {requiresBothSides && !files.some(f => f.type === 'back' && f.status === 'completed') && 'Back side required • '}
                    {requiresSelfie && !files.some(f => f.type === 'selfie' && f.status === 'completed') && 'Selfie photo required • '}
                    Upload remaining documents to continue
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}