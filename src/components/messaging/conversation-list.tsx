'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  MoreHorizontal, 
  Archive, 
  Trash2, 
  Pin,
  MessageSquare,
  Clock,
  CheckCheck,
  Briefcase
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Conversation } from '@/lib/firebase/messaging';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  currentUserId: string;
  onSelectConversation: (conversation: Conversation) => void;
  onArchiveConversation?: (conversationId: string, archived: boolean) => void;
  onDeleteConversation?: (conversationId: string) => void;
  loading?: boolean;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  currentUserId,
  onSelectConversation,
  onArchiveConversation,
  onDeleteConversation,
  loading = false
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');

  const filteredConversations = conversations.filter(conversation => {
    // Filter by search term
    if (searchTerm) {
      const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
      const searchLower = searchTerm.toLowerCase();
      
      const matchesParticipant = otherParticipant?.name.toLowerCase().includes(searchLower);
      const matchesProject = conversation.projectTitle?.toLowerCase().includes(searchLower);
      const matchesLastMessage = conversation.lastMessage?.content.toLowerCase().includes(searchLower);
      
      if (!matchesParticipant && !matchesProject && !matchesLastMessage) {
        return false;
      }
    }

    // Filter by status
    switch (filter) {
      case 'unread':
        return (conversation.unreadCount[currentUserId] || 0) > 0;
      case 'archived':
        return conversation.isArchived;
      default:
        return !conversation.isArchived;
    }
  });

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== currentUserId);
  };

  const formatLastMessageTime = (timestamp: Date) => {
    const now = new Date();
    const isToday = timestamp.toDateString() === now.toDateString();
    const isThisWeek = now.getTime() - timestamp.getTime() < 7 * 24 * 60 * 60 * 1000;
    
    if (isToday) {
      return format(timestamp, 'HH:mm');
    } else if (isThisWeek) {
      return format(timestamp, 'EEE');
    } else {
      return format(timestamp, 'MMM d');
    }
  };

  const handleArchiveConversation = (conversationId: string, archived: boolean) => {
    onArchiveConversation?.(conversationId, archived);
  };

  const handleDeleteConversation = (conversationId: string) => {
    onDeleteConversation?.(conversationId);
  };

  if (loading) {
    return (
      <div className="w-80 border-r bg-muted/30">
        <div className="p-4 border-b">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2 p-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Messages</h2>
          <div className="flex items-center gap-1">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Unread
            </Button>
            <Button
              variant={filter === 'archived' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('archived')}
            >
              <Archive className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">
              {searchTerm ? 'No conversations found' : 'No messages yet'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Start a conversation by contacting a freelancer or client'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              const unreadCount = conversation.unreadCount[currentUserId] || 0;
              const isSelected = selectedConversationId === conversation.id;

              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/60 transition-colors group",
                    isSelected && "bg-primary/10 border border-primary/20"
                  )}
                  onClick={() => onSelectConversation(conversation)}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={otherParticipant?.avatar} />
                      <AvatarFallback>
                        {otherParticipant?.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator could go here */}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={cn(
                        "font-medium truncate",
                        unreadCount > 0 && "font-semibold"
                      )}>
                        {otherParticipant?.name || 'Unknown User'}
                      </h4>
                      <div className="flex items-center gap-2">
                        {conversation.lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {formatLastMessageTime(conversation.lastMessage.timestamp)}
                          </span>
                        )}
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 text-xs px-1">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Project info */}
                    {conversation.projectTitle && (
                      <div className="flex items-center gap-1 mb-1">
                        <Briefcase className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {conversation.projectTitle}
                        </span>
                      </div>
                    )}

                    {/* Last message */}
                    {conversation.lastMessage && (
                      <div className="flex items-center gap-1">
                        {conversation.lastMessage.senderId === currentUserId && (
                          <CheckCheck className="w-3 h-3 text-muted-foreground shrink-0" />
                        )}
                        <p className={cn(
                          "text-sm truncate",
                          unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                          {conversation.lastMessage.type === 'image' && '📷 '}
                          {conversation.lastMessage.type === 'file' && '📎 '}
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                    )}

                    {/* Status indicators */}
                    <div className="flex items-center gap-2 mt-1">
                      {otherParticipant && (
                        <Badge variant="outline" className="text-xs">
                          {otherParticipant.role}
                        </Badge>
                      )}
                      {conversation.isArchived && (
                        <Badge variant="secondary" className="text-xs">
                          <Archive className="w-3 h-3 mr-1" />
                          Archived
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveConversation(
                              conversation.id!,
                              !conversation.isArchived
                            );
                          }}
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          {conversation.isArchived ? 'Unarchive' : 'Archive'}
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conversation.id!);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}