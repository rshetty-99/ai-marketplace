/**
 * File Sharing Component
 * Integrated file sharing for messages and communications
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileUpload } from '@/components/ui/file-upload';
import { useFileUpload, useDocumentUpload } from '@/hooks/useFileUpload';
import { cn } from '@/lib/utils';

import {
  Upload,
  File,
  Image as ImageIcon,
  Video,
  FileText,
  Download,
  Eye,
  Share,
  MoreVertical,
  Trash,
  Copy,
  ExternalLink,
  Clock,
  User,
  Calendar,
  FolderOpen,
  Search,
  Filter,
  Grid,
  List,
  Star,
  Archive,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

import { MessageAttachment } from '@/lib/firebase/communication-schema';

interface FileItem extends MessageAttachment {
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: Date;
  downloadCount: number;
  isShared: boolean;
  conversationId?: string;
  projectId?: string;
  tags: string[];
  version: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
}

interface FileSharingProps {
  conversationId?: string;
  projectId?: string;
  onFileSelect?: (file: FileItem) => void;
  allowUpload?: boolean;
  maxFileSize?: number;
  allowedTypes?: string[];
  className?: string;
}

// Mock data for demonstration
const mockFiles: FileItem[] = [
  {
    id: '1',
    type: 'document',
    url: '/files/project-requirements.pdf',
    fileName: 'Project Requirements.pdf',
    fileSize: 2456789,
    mimeType: 'application/pdf',
    uploadedBy: 'user1',
    uploadedByName: 'John Doe',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    downloadCount: 5,
    isShared: true,
    projectId: 'proj1',
    tags: ['requirements', 'project'],
    version: 2,
    status: 'ready'
  },
  {
    id: '2',
    type: 'image',
    url: '/files/wireframe-v1.png',
    fileName: 'Wireframe v1.png',
    fileSize: 1234567,
    mimeType: 'image/png',
    thumbnailUrl: '/files/wireframe-v1-thumb.png',
    uploadedBy: 'user2',
    uploadedByName: 'Jane Smith',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    downloadCount: 3,
    isShared: false,
    conversationId: 'conv1',
    tags: ['design', 'wireframe'],
    version: 1,
    status: 'ready',
    metadata: {
      width: 1920,
      height: 1080
    }
  },
  {
    id: '3',
    type: 'video',
    url: '/files/demo-video.mp4',
    fileName: 'Product Demo.mp4',
    fileSize: 15678901,
    mimeType: 'video/mp4',
    uploadedBy: 'user3',
    uploadedByName: 'Mike Johnson',
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    downloadCount: 8,
    isShared: true,
    tags: ['demo', 'product'],
    version: 1,
    status: 'ready',
    metadata: {
      duration: 180
    }
  }
];

export function FileSharing({
  conversationId,
  projectId,
  onFileSelect,
  allowUpload = true,
  maxFileSize = 50 * 1024 * 1024,
  allowedTypes = [],
  className
}: FileSharingProps) {
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'images' | 'documents' | 'videos'>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  const { upload, uploading, progress, error, reset } = useFileUpload({
    maxSize: maxFileSize,
    allowedTypes: allowedTypes.length > 0 ? allowedTypes : undefined
  });

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'images' && file.type === 'image') ||
                         (selectedFilter === 'documents' && file.type === 'document') ||
                         (selectedFilter === 'videos' && file.type === 'video');

    const matchesScope = !conversationId && !projectId || 
                        file.conversationId === conversationId ||
                        file.projectId === projectId;

    return matchesSearch && matchesFilter && matchesScope;
  });

  const handleFileUpload = useCallback(async (uploadedFiles: File[]) => {
    try {
      for (const file of uploadedFiles) {
        // Create temporary file item with uploading status
        const tempFile: FileItem = {
          id: Date.now().toString(),
          type: file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('video/') ? 'video' : 'document',
          url: '',
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadedBy: 'current-user',
          uploadedByName: 'You',
          uploadedAt: new Date(),
          downloadCount: 0,
          isShared: false,
          conversationId,
          projectId,
          tags: [],
          version: 1,
          status: 'uploading'
        };

        setFiles(prev => [...prev, tempFile]);

        // Upload file
        const result = await upload(file, 'document', {
          projectId: projectId || 'default'
        });

        // Update file with upload result
        setFiles(prev => prev.map(f => 
          f.id === tempFile.id 
            ? { ...f, url: Array.isArray(result) ? result[0].downloadURL : result.downloadURL, status: 'ready' }
            : f
        ));
      }
      
      setUploadDialogOpen(false);
      reset();
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }, [upload, conversationId, projectId, reset]);

  const handleDownload = (file: FileItem) => {
    // Update download count
    setFiles(prev => prev.map(f => 
      f.id === file.id ? { ...f, downloadCount: f.downloadCount + 1 } : f
    ));
    
    // Trigger download
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = (file: FileItem) => {
    // Toggle share status
    setFiles(prev => prev.map(f => 
      f.id === file.id ? { ...f, isShared: !f.isShared } : f
    ));
  };

  const handleDelete = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getFileIcon = (file: FileItem) => {
    switch (file.type) {
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const FileCard = ({ file }: { file: FileItem }) => (
    <Card className="group hover:shadow-md transition-shadow cursor-pointer" onClick={() => onFileSelect?.(file)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* File Preview */}
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            {file.type === 'image' && file.thumbnailUrl ? (
              <img src={file.thumbnailUrl} alt={file.fileName} className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-400">
                {getFileIcon(file)}
              </div>
            )}
            
            {/* Status overlay */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {getStatusIcon(file.status)}
            </div>
          </div>

          {/* File Info */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-sm truncate pr-2">{file.fileName}</h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownload(file)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare(file)}>
                    <Share className="h-4 w-4 mr-2" />
                    {file.isShared ? 'Unshare' : 'Share'}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Star className="h-4 w-4 mr-2" />
                    Favorite
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDelete(file.id)}
                    className="text-red-600"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formatFileSize(file.fileSize)}</span>
              <span>{formatDate(file.uploadedAt)}</span>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <User className="h-3 w-3" />
              <span>{file.uploadedByName}</span>
              {file.downloadCount > 0 && (
                <>
                  <span>•</span>
                  <span>{file.downloadCount} downloads</span>
                </>
              )}
            </div>

            {/* Tags */}
            {file.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {file.tags.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {file.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{file.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const FileRow = ({ file }: { file: FileItem }) => (
    <div 
      className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg group cursor-pointer"
      onClick={() => onFileSelect?.(file)}
    >
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          {getFileIcon(file)}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm truncate">{file.fileName}</h4>
          <div className="flex items-center gap-2">
            {getStatusIcon(file.status)}
            <span className="text-xs text-gray-500">{formatDate(file.uploadedAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
          <span>{formatFileSize(file.fileSize)}</span>
          <span>{file.uploadedByName}</span>
          {file.downloadCount > 0 && <span>{file.downloadCount} downloads</span>}
          {file.isShared && <Badge variant="outline" className="text-xs">Shared</Badge>}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleDownload(file)}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare(file)}>
            <Share className="h-4 w-4 mr-2" />
            {file.isShared ? 'Unshare' : 'Share'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDelete(file.id)} className="text-red-600">
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Files</h3>
          <p className="text-sm text-gray-600">{filteredFiles.length} files</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Upload Button */}
          {allowUpload && (
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Upload Files</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <FileUpload
                    onUpload={handleFileUpload}
                    multiple={true}
                    maxSize={maxFileSize}
                    allowedTypes={allowedTypes}
                    uploading={uploading}
                    progress={progress}
                    error={error}
                    dropzoneText="Drop files here to upload to conversation"
                  />
                  
                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {selectedFilter === 'all' ? 'All Files' : 
               selectedFilter === 'images' ? 'Images' :
               selectedFilter === 'documents' ? 'Documents' : 'Videos'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSelectedFilter('all')}>
              All Files
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedFilter('images')}>
              Images
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedFilter('documents')}>
              Documents
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedFilter('videos')}>
              Videos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Files Display */}
      <div className="space-y-4">
        {filteredFiles.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFiles.map(file => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredFiles.map(file => (
                <FileRow key={file.id} file={file} />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No files found</h3>
            <p className="text-sm">
              {searchQuery ? 'Try adjusting your search terms' : 'Upload files to get started'}
            </p>
            {allowUpload && !searchQuery && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}