/**
 * Chat Interface Component
 * ShadCN UI Kit inspired chat interface for dashboard
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import {
  MessageSquare,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Search,
  Filter,
  Video,
  Phone,
  UserPlus,
  Archive,
  Pin,
  Settings,
  Trash,
  Edit,
  Reply,
  Forward,
  ThumbsUp,
  Heart,
  Laugh,
  Angry,
  Sad,
  Star,
  Clock,
  Check,
  CheckCheck,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  File,
  Download,
  Play
} from 'lucide-react';

import { useUser } from '@clerk/nextjs';
import { Message, Conversation, ConversationParticipant } from '@/lib/firebase/communication-schema';
import { MessagingService } from '@/lib/firebase/messaging-service';

interface ChatInterfaceProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  className?: string;
}

export function ChatInterface({
  conversations,
  activeConversationId,
  onConversationSelect,
  className
}: ChatInterfaceProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const filteredConversations = conversations.filter(conversation =>
    conversation.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.participants.some(p => 
      p.userName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Subscribe to messages for active conversation
  useEffect(() => {
    if (!activeConversationId) return;

    const unsubscribe = MessagingService.subscribeToMessages(
      activeConversationId,
      (newMessages) => {
        setMessages(newMessages);
        scrollToBottom();
      }
    );

    return unsubscribe;
  }, [activeConversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversationId || !user) return;

    try {
      await MessagingService.sendMessage(
        activeConversationId,
        user.id,
        user.fullName || user.firstName || 'User',
        newMessage.trim(),
        {
          senderAvatar: user.imageUrl
        }
      );

      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
      }).format(date);
    }
  };

  const getUnreadCount = (conversation: Conversation) => {
    if (!user) return 0;
    // This would calculate unread messages for the user
    return 0; // Placeholder
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId);
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwn = message.senderId === user?.id;
    const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.senderId !== message.senderId);
    const showTimestamp = index === messages.length - 1 || 
                         messages[index + 1]?.senderId !== message.senderId ||
                         (new Date(messages[index + 1]?.timestamp).getTime() - new Date(message.timestamp).getTime()) > 300000; // 5 minutes

    return (
      <div
        key={message.id}
        className={cn(
          'flex gap-3 group',
          isOwn ? 'flex-row-reverse' : 'flex-row',
          showAvatar ? 'mt-4' : 'mt-1'
        )}
      >
        {/* Avatar */}
        <div className={cn('flex-shrink-0', showAvatar ? 'visible' : 'invisible')}>
          {!isOwn && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.senderAvatar} alt={message.senderName} />
              <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Message Content */}
        <div className={cn('flex flex-col max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
          {/* Sender name and timestamp */}
          {showAvatar && !isOwn && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900">{message.senderName}</span>
              <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
            </div>
          )}

          {/* Message bubble */}
          <div
            className={cn(
              'relative px-3 py-2 rounded-lg max-w-full break-words',
              isOwn
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-900 rounded-bl-sm',
              message.type === 'system' && 'bg-gray-50 text-gray-600 italic text-center'
            )}
          >
            {/* Reply indicator */}
            {message.replyTo && (
              <div className="mb-2 p-2 bg-black/10 rounded text-xs opacity-70">
                Replying to message...
              </div>
            )}

            {/* Message content */}
            <div className="text-sm leading-relaxed">
              {message.content}
            </div>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center gap-2 p-2 bg-black/5 rounded">
                    {attachment.type === 'image' ? (
                      <ImageIcon className="h-4 w-4" />
                    ) : (
                      <File className="h-4 w-4" />
                    )}
                    <span className="text-xs truncate">{attachment.fileName}</span>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Message status */}
            {isOwn && showTimestamp && (
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                {message.status === 'sent' && <Check className="h-3 w-3" />}
                {message.status === 'delivered' && <CheckCheck className="h-3 w-3" />}
                {message.status === 'read' && <CheckCheck className="h-3 w-3 text-blue-400" />}
              </div>
            )}
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1 mt-1">
              {message.reactions.map((reaction, idx) => (
                <Badge key={idx} variant="outline" className="text-xs px-1 py-0">
                  {reaction.emoji} {reaction.reactions?.length || 1}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Message actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Forward className="h-4 w-4 mr-2" />
                Forward
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Star className="h-4 w-4 mr-2" />
                Star
              </DropdownMenuItem>
              {isOwn && (
                <>
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  return (
    <div className={cn('flex h-full bg-white border rounded-lg', className)}>
      {/* Conversations Sidebar */}
      <div className="w-80 border-r flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Messages</h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.map((conversation) => {
              const unreadCount = getUnreadCount(conversation);
              const isActive = conversation.id === activeConversationId;
              const lastMessageTime = conversation.lastMessage?.timestamp;

              return (
                <div
                  key={conversation.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50',
                    isActive && 'bg-blue-50 border border-blue-200'
                  )}
                  onClick={() => onConversationSelect(conversation.id)}
                >
                  {/* Conversation Avatar */}
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.participants[0]?.userAvatar} />
                      <AvatarFallback>
                        {conversation.type === 'group' ? (
                          <MessageSquare className="h-6 w-6" />
                        ) : (
                          conversation.participants.find(p => p.userId !== user?.id)?.userName.charAt(0) || 'U'
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Online indicator */}
                    {conversation.type === 'direct' && (
                      <div className={cn(
                        'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
                        isUserOnline(conversation.participants.find(p => p.userId !== user?.id)?.userId || '') 
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                      )} />
                    )}
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium truncate">
                        {conversation.title || 
                         conversation.participants.find(p => p.userId !== user?.id)?.userName ||
                         'Unknown'}
                      </h3>
                      <div className="flex items-center gap-1">
                        {conversation.isPinned && <Pin className="h-3 w-3 text-gray-400" />}
                        {lastMessageTime && (
                          <span className="text-xs text-gray-500">
                            {formatTime(lastMessageTime)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                      {unreadCount > 0 && (
                        <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activeConversation.participants[0]?.userAvatar} />
                    <AvatarFallback>
                      {activeConversation.type === 'group' ? (
                        <MessageSquare className="h-5 w-5" />
                      ) : (
                        activeConversation.participants.find(p => p.userId !== user?.id)?.userName.charAt(0) || 'U'
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-semibold">
                      {activeConversation.title || 
                       activeConversation.participants.find(p => p.userId !== user?.id)?.userName ||
                       'Unknown'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {activeConversation.type === 'group' 
                        ? `${activeConversation.participants.length} members`
                        : isUserOnline(activeConversation.participants.find(p => p.userId !== user?.id)?.userId || '')
                          ? 'Online'
                          : 'Offline'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Video className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Start video call</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Start voice call</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add people
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pin className="h-4 w-4 mr-2" />
                        Pin conversation
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <VolumeX className="h-4 w-4 mr-2" />
                        Mute notifications
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <Separator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash className="h-4 w-4 mr-2" />
                        Delete conversation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-1">
                {messages.map((message, index) => renderMessage(message, index))}
                {isTyping && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    Someone is typing...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-end gap-3">
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={handleTextareaChange}
                    onKeyPress={handleKeyPress}
                    className="min-h-[44px] max-h-[120px] resize-none"
                    rows={1}
                  />
                </div>

                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-sm">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}