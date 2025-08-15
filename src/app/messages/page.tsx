'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Phone, 
  Video, 
  MoreHorizontal, 
  Info,
  Star,
  Briefcase,
  Calendar,
  MapPin,
  User,
  Settings,
  Archive,
  Search
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConversationList } from '@/components/messaging/conversation-list';
import { MessageBubble } from '@/components/messaging/message-bubble';
import { MessageInput } from '@/components/messaging/message-input';
import { useAuth } from '@/hooks/useAuth';
import { 
  getUserConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToConversations,
  subscribeToMessages,
  archiveConversation,
  editMessage,
  deleteMessage,
  Conversation,
  Message
} from '@/lib/firebase/messaging';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubscribeConversationsRef = useRef<(() => void) | null>(null);
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
      
      // Subscribe to real-time conversations
      const unsubscribe = subscribeToConversations(user.id, (updatedConversations) => {
        setConversations(updatedConversations);
        setLoading(false);
      });
      unsubscribeConversationsRef.current = unsubscribe;

      return () => {
        unsubscribe?.();
      };
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation && user) {
      loadMessages();
      
      // Subscribe to real-time messages
      const unsubscribe = subscribeToMessages(selectedConversation.id!, (updatedMessages) => {
        setMessages(updatedMessages);
        setMessagesLoading(false);
        
        // Mark messages as read
        markMessagesAsRead(selectedConversation.id!, user.id);
      });
      unsubscribeMessagesRef.current = unsubscribe;

      return () => {
        unsubscribe?.();
      };
    }
  }, [selectedConversation, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      unsubscribeConversationsRef.current?.();
      unsubscribeMessagesRef.current?.();
    };
  }, []);

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      const userConversations = await getUserConversations(user.id);
      setConversations(userConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;
    
    setMessagesLoading(true);
    try {
      const conversationMessages = await getMessages(selectedConversation.id!);
      setMessages(conversationMessages);
      
      // Mark messages as read
      if (user) {
        await markMessagesAsRead(selectedConversation.id!, user.id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setReplyToMessage(null);
    setEditingMessage(null);
  };

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!selectedConversation || !user) return;

    try {
      const otherParticipant = selectedConversation.participants.find(p => p.id !== user.id);
      if (!otherParticipant) {
        throw new Error('Cannot find recipient');
      }

      // TODO: Handle file uploads to Firebase Storage
      // For now, we'll just send text messages
      await sendMessage(
        selectedConversation.id!,
        user.id,
        `${user.firstName} ${user.lastName}`,
        otherParticipant.id,
        otherParticipant.name,
        content,
        'text',
        undefined, // attachments would go here after upload
        replyToMessage ? {
          messageId: replyToMessage.id!,
          content: replyToMessage.content,
          senderName: replyToMessage.senderName
        } : undefined,
        user.imageUrl
      );

      setReplyToMessage(null);
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleReplyToMessage = (message: Message) => {
    setReplyToMessage(message);
    setEditingMessage(null);
  };

  const handleEditMessage = async (message: Message) => {
    // TODO: Implement edit functionality
    toast.info('Edit functionality coming soon');
  };

  const handleDeleteMessage = async (message: Message) => {
    try {
      await deleteMessage(message.id!);
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleArchiveConversation = async (conversationId: string, archived: boolean) => {
    try {
      await archiveConversation(conversationId, archived);
      toast.success(archived ? 'Conversation archived' : 'Conversation unarchived');
    } catch (error) {
      console.error('Error archiving conversation:', error);
      toast.error('Failed to archive conversation');
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    // TODO: Implement conversation deletion
    toast.info('Delete conversation functionality coming soon');
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== user?.id);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Please log in to access messages.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Conversations List */}
      <ConversationList
        conversations={conversations}
        selectedConversationId={selectedConversation?.id}
        currentUserId={user.id}
        onSelectConversation={handleSelectConversation}
        onArchiveConversation={handleArchiveConversation}
        onDeleteConversation={handleDeleteConversation}
        loading={loading}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={getOtherParticipant(selectedConversation)?.avatar} />
                    <AvatarFallback>
                      {getOtherParticipant(selectedConversation)?.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {getOtherParticipant(selectedConversation)?.name || 'Unknown User'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {getOtherParticipant(selectedConversation)?.role}
                      </Badge>
                      {selectedConversation.projectTitle && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {selectedConversation.projectTitle}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Info className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Search className="w-4 h-4 mr-2" />
                        Search in conversation
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleArchiveConversation(
                          selectedConversation.id!,
                          !selectedConversation.isArchived
                        )}
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        {selectedConversation.isArchived ? 'Unarchive' : 'Archive'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="w-4 h-4 mr-2" />
                        Conversation settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-12 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Start the conversation</h3>
                  <p className="text-muted-foreground">
                    Send a message to {getOtherParticipant(selectedConversation)?.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isOwn = message.senderId === user.id;
                    const showAvatar = index === 0 || 
                      messages[index - 1].senderId !== message.senderId ||
                      new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 5 * 60 * 1000;

                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                        onReply={handleReplyToMessage}
                        onEdit={handleEditMessage}
                        onDelete={handleDeleteMessage}
                      />
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              replyTo={replyToMessage}
              onCancelReply={() => setReplyToMessage(null)}
            />
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-24 h-24 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-semibold mb-2">Select a conversation</h2>
              <p className="text-muted-foreground mb-6">
                Choose a conversation from the list to start messaging
              </p>
              {conversations.length === 0 && !loading && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    No conversations yet. Start by contacting freelancers or clients on projects.
                  </p>
                  <Button variant="outline">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Browse Projects
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}