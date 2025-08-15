'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Reply, 
  Edit, 
  Copy, 
  Trash2, 
  Download,
  ExternalLink,
  Check,
  CheckCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Message } from '@/lib/firebase/messaging';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  className?: string;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = true,
  onReply,
  onEdit,
  onDelete,
  className
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return format(date, 'HH:mm');
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const renderAttachment = (attachment: NonNullable<Message['attachments']>[0]) => {
    const isImage = attachment.type.startsWith('image/');
    
    if (isImage) {
      return (
        <div key={attachment.name} className="mt-2">
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
            onClick={() => window.open(attachment.url, '_blank')}
          />
        </div>
      );
    }

    return (
      <div key={attachment.name} className="mt-2 p-3 bg-muted rounded-lg flex items-center gap-2 max-w-xs">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.name}</p>
          <p className="text-xs text-muted-foreground">
            {(attachment.size / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => window.open(attachment.url, '_blank')}>
          <Download className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  const renderReplyTo = () => {
    if (!message.replyTo) return null;

    return (
      <div className="mb-2 p-2 bg-muted/50 rounded border-l-4 border-primary">
        <p className="text-xs font-medium text-muted-foreground">
          Replying to {message.replyTo.senderName}
        </p>
        <p className="text-sm line-clamp-2">
          {message.replyTo.content}
        </p>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex gap-3 group",
        isOwn ? "flex-row-reverse" : "flex-row",
        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {showAvatar && (
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage src={isOwn ? message.senderAvatar : message.senderAvatar} />
          <AvatarFallback className="text-xs">
            {(isOwn ? message.senderName : message.senderName)
              .split(' ')
              .map(n => n[0])
              .join('')
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-md",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Sender name (only for non-own messages) */}
        {!isOwn && showAvatar && (
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {message.senderName}
          </p>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "relative px-4 py-2 rounded-2xl max-w-full break-words",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md",
            message.type === 'system' && "bg-muted/50 text-muted-foreground italic"
          )}
        >
          {/* Reply indicator */}
          {renderReplyTo()}

          {/* Message content */}
          <div className="whitespace-pre-wrap">
            {message.content}
          </div>

          {/* Attachments */}
          {message.attachments?.map(renderAttachment)}

          {/* Edited indicator */}
          {message.isEdited && (
            <p className="text-xs opacity-70 mt-1">
              edited {message.editedAt && formatDistanceToNow(message.editedAt, { addSuffix: true })}
            </p>
          )}
        </div>

        {/* Timestamp and read status */}
        {showTimestamp && (
          <div className={cn(
            "flex items-center gap-1 mt-1 text-xs text-muted-foreground",
            isOwn ? "flex-row-reverse" : "flex-row"
          )}>
            <span>{formatTime(message.createdAt)}</span>
            {isOwn && (
              <div className="flex items-center">
                {message.isRead ? (
                  <CheckCheck className="w-3 h-3 text-blue-500" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && message.type !== 'system' && (
        <div className={cn(
          "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isOwn ? "end" : "start"}>
              {onReply && (
                <DropdownMenuItem onClick={() => onReply(message)}>
                  <Reply className="w-4 h-4 mr-2" />
                  Reply
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={handleCopyMessage}>
                <Copy className="w-4 h-4 mr-2" />
                Copy text
              </DropdownMenuItem>

              {isOwn && onEdit && message.type === 'text' && (
                <DropdownMenuItem onClick={() => onEdit(message)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}

              {isOwn && onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(message)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}