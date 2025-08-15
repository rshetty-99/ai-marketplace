'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Paperclip, 
  Image, 
  Smile, 
  X,
  File,
  Loader2
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Message } from '@/lib/firebase/messaging';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
  replyTo?: Message;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export function MessageInput({
  onSendMessage,
  replyTo,
  onCancelReply,
  disabled = false,
  placeholder = "Type a message...",
  maxLength = 2000,
  className
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(async () => {
    if ((!message.trim() && attachments.length === 0) || isSending || disabled) {
      return;
    }

    setIsSending(true);
    try {
      await onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
      onCancelReply?.();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [message, attachments, isSending, disabled, onSendMessage, onCancelReply]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      // Max 10MB per file
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    if (attachments.length + validFiles.length > 5) {
      alert('Maximum 5 files allowed per message.');
      return;
    }

    setAttachments(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    if (attachments.length + validFiles.length > 5) {
      alert('Maximum 5 files allowed per message.');
      return;
    }

    setAttachments(prev => [...prev, ...validFiles]);
  }, [attachments.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return '🖼️';
    } else if (file.type.includes('pdf')) {
      return '📄';
    } else if (file.type.includes('word') || file.type.includes('document')) {
      return '📝';
    } else if (file.type.includes('sheet') || file.type.includes('excel')) {
      return '📊';
    } else if (file.type.includes('zip') || file.type.includes('rar')) {
      return '🗜️';
    }
    return '📎';
  };

  return (
    <div className={cn("border-t bg-background", className)}>
      {/* Reply indicator */}
      {replyTo && (
        <div className="px-4 py-2 bg-muted/50 border-b border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Replying to {replyTo.senderName}
              </p>
              <p className="text-sm line-clamp-1">{replyTo.content}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-b">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm"
              >
                <span>{getFileIcon(file)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate max-w-32">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(index)}
                  className="h-6 w-6 p-0 hover:bg-destructive/20"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message input */}
      <div
        className={cn(
          "p-4 space-y-3",
          isDragOver && "bg-primary/5 border-primary/20"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isDragOver && (
          <div className="text-center py-8 border-2 border-dashed border-primary/50 rounded-lg">
            <p className="text-muted-foreground">Drop files here to attach</p>
          </div>
        )}

        <div className="flex gap-2">
          {/* Attachment button */}
          <div className="flex gap-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt"
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || attachments.length >= 5}
              className="h-10 w-10 p-0"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'image/*';
                  fileInputRef.current.click();
                  fileInputRef.current.accept = 'image/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt';
                }
              }}
              disabled={disabled || attachments.length >= 5}
              className="h-10 w-10 p-0"
            >
              <Image className="w-4 h-4" />
            </Button>
          </div>

          {/* Message textarea */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= maxLength) {
                  setMessage(e.target.value);
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder={disabled ? "Cannot send messages" : placeholder}
              disabled={disabled}
              className="min-h-10 max-h-32 resize-none pr-16"
              rows={1}
            />
            
            {/* Character count */}
            {message.length > maxLength * 0.8 && (
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {message.length}/{maxLength}
              </div>
            )}
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={
              disabled || 
              isSending || 
              (!message.trim() && attachments.length === 0) ||
              message.length > maxLength
            }
            size="sm"
            className="h-10 w-10 p-0"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Tips */}
        {!disabled && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>Max 5 files, 10MB each</span>
          </div>
        )}
      </div>
    </div>
  );
}