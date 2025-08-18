/**
 * Communication Dashboard Page
 * Main communication hub with chat, mail, files, and notifications
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import {
  MessageSquare,
  Mail,
  FolderOpen,
  Bell,
  Video,
  Phone,
  Users,
  TrendingUp,
  Clock,
  Star,
  Settings
} from 'lucide-react';

import { ChatInterface } from '@/components/dashboard/communication/chat-interface';
import { MailInterface } from '@/components/dashboard/communication/mail-interface';
import { FileSharing } from '@/components/dashboard/communication/file-sharing';
import { NotificationCenter } from '@/components/dashboard/communication/notification-center';
import { useUser } from '@clerk/nextjs';
import { Conversation } from '@/lib/firebase/communication-schema';
import { MessagingService } from '@/lib/firebase/messaging-service';

// Mock data for demonstration
const mockConversations: Conversation[] = [
  {
    id: 'conv1',
    type: 'direct',
    participants: [
      {
        userId: 'user1',
        userName: 'Sarah Johnson',
        userAvatar: '/avatars/sarah.jpg',
        role: 'member',
        joinedAt: new Date(),
        lastSeen: new Date(),
        isOnline: true,
        permissions: {
          canSendMessages: true,
          canSendFiles: true,
          canMention: true,
          canAddParticipants: false,
          canRemoveParticipants: false,
          canEditConversation: false,
          canDeleteMessages: false,
          canStartVideoCall: true
        },
        notificationSettings: {
          muted: false,
          pushNotifications: true,
          emailNotifications: false,
          mentionOnly: false
        }
      }
    ],
    createdBy: 'current-user',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    lastMessage: {
      id: 'msg1',
      content: 'Hi! I wanted to check in on the progress of our web development project...',
      senderId: 'user1',
      senderName: 'Sarah Johnson',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      type: 'text'
    },
    lastActivity: new Date(Date.now() - 1000 * 60 * 30),
    isArchived: false,
    isPinned: true,
    settings: {
      allowFileSharing: true,
      allowVideoCall: true,
      requireApproval: false,
      isPublic: false
    },
    metadata: {
      project: {
        id: 'proj1',
        title: 'E-commerce Website',
        status: 'in_progress'
      }
    }
  },
  {
    id: 'conv2',
    type: 'group',
    title: 'Project Team - Mobile App',
    participants: [
      {
        userId: 'user2',
        userName: 'Mike Chen',
        userAvatar: '/avatars/mike.jpg',
        role: 'member',
        joinedAt: new Date(),
        lastSeen: new Date(),
        isOnline: false,
        permissions: {
          canSendMessages: true,
          canSendFiles: true,
          canMention: true,
          canAddParticipants: false,
          canRemoveParticipants: false,
          canEditConversation: false,
          canDeleteMessages: false,
          canStartVideoCall: true
        },
        notificationSettings: {
          muted: false,
          pushNotifications: true,
          emailNotifications: false,
          mentionOnly: false
        }
      },
      {
        userId: 'user3',
        userName: 'Lisa Wong',
        userAvatar: '/avatars/lisa.jpg',
        role: 'member',
        joinedAt: new Date(),
        lastSeen: new Date(),
        isOnline: true,
        permissions: {
          canSendMessages: true,
          canSendFiles: true,
          canMention: true,
          canAddParticipants: false,
          canRemoveParticipants: false,
          canEditConversation: false,
          canDeleteMessages: false,
          canStartVideoCall: true
        },
        notificationSettings: {
          muted: false,
          pushNotifications: true,
          emailNotifications: false,
          mentionOnly: false
        }
      }
    ],
    createdBy: 'current-user',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    lastMessage: {
      id: 'msg2',
      content: 'The latest build is ready for testing. Please check it out!',
      senderId: 'user2',
      senderName: 'Mike Chen',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      type: 'text'
    },
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isArchived: false,
    isPinned: false,
    settings: {
      allowFileSharing: true,
      allowVideoCall: true,
      requireApproval: false,
      isPublic: false
    },
    metadata: {
      project: {
        id: 'proj2',
        title: 'Mobile App Development',
        status: 'testing'
      }
    }
  }
];

export default function CommunicationPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('chat');
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(conversations[0]?.id);
  const [stats, setStats] = useState({
    unreadMessages: 12,
    unreadEmails: 5,
    pendingFiles: 3,
    notifications: 8,
    activeConversations: conversations.length,
    onlineContacts: 4
  });

  // Subscribe to conversations in real implementation
  useEffect(() => {
    if (!user?.id) return;

    // In real implementation, subscribe to user's conversations
    // const unsubscribe = MessagingService.subscribeToConversations(
    //   user.id,
    //   (newConversations) => setConversations(newConversations)
    // );
    // return unsubscribe;
  }, [user?.id]);

  const handleConversationSelect = (conversationId: string) => {
    setActiveConversationId(conversationId);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Communication Hub</h1>
          <p className="text-gray-600">Manage all your conversations, emails, and notifications</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-600">{stats.onlineContacts} online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Unread Messages</p>
              <p className="text-2xl font-bold">{stats.unreadMessages}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Unread Emails</p>
              <p className="text-2xl font-bold">{stats.unreadEmails}</p>
            </div>
            <Mail className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Shared Files</p>
              <p className="text-2xl font-bold">{stats.pendingFiles}</p>
            </div>
            <FolderOpen className="h-8 w-8 text-orange-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Notifications</p>
              <p className="text-2xl font-bold">{stats.notifications}</p>
            </div>
            <Bell className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* Communication Interface */}
      <Card className="h-[700px]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-[400px] grid-cols-4">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                  {stats.unreadMessages > 0 && (
                    <Badge variant="destructive" className="h-4 px-1 text-xs">
                      {stats.unreadMessages}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="mail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Mail
                  {stats.unreadEmails > 0 && (
                    <Badge variant="destructive" className="h-4 px-1 text-xs">
                      {stats.unreadEmails}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="files" className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Files
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Alerts
                  {stats.notifications > 0 && (
                    <Badge variant="destructive" className="h-4 px-1 text-xs">
                      {stats.notifications}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Video className="h-4 w-4 mr-2" />
                  Start Meeting
                </Button>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  New Group
                </Button>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="flex-1 p-0 overflow-hidden">
            <TabsContent value="chat" className="h-full m-0">
              <ChatInterface
                conversations={conversations}
                activeConversationId={activeConversationId}
                onConversationSelect={handleConversationSelect}
                className="h-full"
              />
            </TabsContent>

            <TabsContent value="mail" className="h-full m-0">
              <MailInterface className="h-full" />
            </TabsContent>

            <TabsContent value="files" className="h-full m-0 p-6">
              <FileSharing
                allowUpload={true}
                maxFileSize={50 * 1024 * 1024}
                className="h-full"
              />
            </TabsContent>

            <TabsContent value="notifications" className="h-full m-0">
              <NotificationCenter />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Recent Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New message from Sarah Johnson</p>
                  <p className="text-xs text-gray-500">30 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Payment received - $2,500</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Meeting scheduled with DataCorp</p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">File shared: Project Requirements.pdf</p>
                  <p className="text-xs text-gray-500">6 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Communication Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Messages sent today</span>
                <span className="font-semibold">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active conversations</span>
                <span className="font-semibold">{stats.activeConversations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Files shared this week</span>
                <span className="font-semibold">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average response time</span>
                <span className="font-semibold">15 min</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}