/**
 * Notification Center Component
 * Comprehensive notification management for dashboard
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

import {
  Bell,
  BellOff,
  Settings,
  MoreVertical,
  Check,
  CheckCheck,
  Trash,
  Archive,
  Star,
  MessageSquare,
  DollarSign,
  FileText,
  Calendar,
  Users,
  AlertCircle,
  Info,
  CheckCircle,
  Briefcase,
  Video,
  Mail,
  Clock,
  Filter,
  Search,
  MarkAsRead,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Globe
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'message' | 'payment' | 'project' | 'system' | 'meeting' | 'contract';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  actionUrl?: string;
  actionText?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata?: {
    projectId?: string;
    projectName?: string;
    amount?: number;
    contractId?: string;
    meetingId?: string;
  };
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  sound: boolean;
  vibration: boolean;
  categories: {
    messages: boolean;
    payments: boolean;
    projects: boolean;
    meetings: boolean;
    contracts: boolean;
    system: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'message',
    priority: 'high',
    title: 'New Message from Sarah Johnson',
    message: 'Hi! I wanted to check in on the progress of our web development project...',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    isRead: false,
    isStarred: false,
    actionUrl: '/dashboard/communication/chat',
    actionText: 'Reply',
    sender: {
      id: 'user1',
      name: 'Sarah Johnson',
      avatar: '/avatars/sarah.jpg'
    },
    metadata: {
      projectId: 'proj1',
      projectName: 'E-commerce Website'
    }
  },
  {
    id: '2',
    type: 'payment',
    priority: 'medium',
    title: 'Payment Received',
    message: 'You have received a payment of $2,500 for the completed milestone.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    isRead: true,
    isStarred: true,
    actionUrl: '/dashboard/earnings',
    actionText: 'View Details',
    metadata: {
      amount: 2500,
      projectName: 'Mobile App Development'
    }
  },
  {
    id: '3',
    type: 'meeting',
    priority: 'urgent',
    title: 'Upcoming Meeting Reminder',
    message: 'Your meeting with DataCorp starts in 30 minutes.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    isRead: false,
    isStarred: false,
    actionUrl: '/dashboard/communication/meetings',
    actionText: 'Join Meeting',
    metadata: {
      meetingId: 'meet1'
    }
  },
  {
    id: '4',
    type: 'contract',
    priority: 'medium',
    title: 'Contract Signed',
    message: 'Your contract with TechCorp has been signed and is now active.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    isRead: true,
    isStarred: false,
    actionUrl: '/dashboard/projects',
    actionText: 'View Project',
    metadata: {
      contractId: 'contract1',
      projectName: 'API Integration'
    }
  },
  {
    id: '5',
    type: 'system',
    priority: 'low',
    title: 'Profile Update Reminder',
    message: 'Complete your profile to increase your visibility to potential clients.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    isRead: true,
    isStarred: false,
    actionUrl: '/dashboard/profile',
    actionText: 'Update Profile'
  }
];

const defaultSettings: NotificationSettings = {
  email: true,
  push: true,
  inApp: true,
  sound: true,
  vibration: true,
  categories: {
    messages: true,
    payments: true,
    projects: true,
    meetings: true,
    contracts: true,
    system: false
  },
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00'
  }
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const filteredNotifications = notifications.filter(notification => {
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'unread' && !notification.isRead) ||
                      (activeTab === 'starred' && notification.isStarred) ||
                      notification.type === activeTab;
    
    const matchesSearch = searchQuery === '' ||
                         notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleToggleStar = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isStarred: !n.isStarred } : n
    ));
  };

  const handleDelete = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleBulkAction = (action: 'read' | 'unread' | 'star' | 'delete') => {
    if (action === 'delete') {
      setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)));
    } else {
      setNotifications(prev => prev.map(n => {
        if (selectedNotifications.has(n.id)) {
          switch (action) {
            case 'read':
              return { ...n, isRead: true };
            case 'unread':
              return { ...n, isRead: false };
            case 'star':
              return { ...n, isStarred: !n.isStarred };
            default:
              return n;
          }
        }
        return n;
      }));
    }
    setSelectedNotifications(new Set());
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'payment':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'project':
        return <Briefcase className="h-5 w-5 text-purple-500" />;
      case 'meeting':
        return <Video className="h-5 w-5 text-orange-500" />;
      case 'contract':
        return <FileText className="h-5 w-5 text-indigo-500" />;
      case 'system':
        return <Info className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-300';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <div className={cn(
      'border-l-4 p-4 hover:bg-gray-50 transition-colors',
      getPriorityColor(notification.priority),
      !notification.isRead && 'font-medium'
    )}>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedNotifications.has(notification.id)}
            onChange={(e) => {
              const newSelected = new Set(selectedNotifications);
              if (e.target.checked) {
                newSelected.add(notification.id);
              } else {
                newSelected.delete(notification.id);
              }
              setSelectedNotifications(newSelected);
            }}
            className="rounded"
          />
          {getNotificationIcon(notification.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={cn(
              'text-sm truncate',
              !notification.isRead && 'font-semibold'
            )}>
              {notification.title}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{formatTime(notification.timestamp)}</span>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {notification.message}
          </p>

          {notification.metadata && (
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
              {notification.metadata.projectName && (
                <span>Project: {notification.metadata.projectName}</span>
              )}
              {notification.metadata.amount && (
                <span>Amount: ${notification.metadata.amount.toLocaleString()}</span>
              )}
            </div>
          )}

          {notification.sender && (
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={notification.sender.avatar} alt={notification.sender.name} />
                <AvatarFallback className="text-xs">
                  {notification.sender.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-600">{notification.sender.name}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            {notification.actionText && notification.actionUrl && (
              <Button size="sm" variant="outline" className="h-7">
                {notification.actionText}
              </Button>
            )}

            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleToggleStar(notification.id)}
              >
                <Star className={cn(
                  "h-3 w-3",
                  notification.isStarred ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
                )} />
              </Button>
              
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                    <Check className="h-4 w-4 mr-2" />
                    Mark as read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleStar(notification.id)}>
                    <Star className="h-4 w-4 mr-2" />
                    {notification.isStarred ? 'Unstar' : 'Star'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(notification.id)} className="text-red-600">
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Notifications</h2>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 px-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all read
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Notification Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive All
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <BellOff className="h-4 w-4 mr-2" />
                    Turn Off Notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabs */}
        <TabsList className="grid w-full grid-cols-6 mx-4 mt-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 px-1 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="starred">Starred</TabsTrigger>
          <TabsTrigger value="message">Messages</TabsTrigger>
          <TabsTrigger value="payment">Payments</TabsTrigger>
          <TabsTrigger value="project">Projects</TabsTrigger>
        </TabsList>

        {/* Bulk Actions */}
        {selectedNotifications.size > 0 && (
          <div className="p-3 bg-blue-50 border-b mx-4 mt-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedNotifications.size} selected
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('read')}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('star')}
                >
                  <Star className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Content */}
        <TabsContent value={activeTab} className="flex-1 m-0">
          <ScrollArea className="h-full">
            {filteredNotifications.length > 0 ? (
              <div className="divide-y">
                {filteredNotifications.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Bell className="h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No notifications</h3>
                <p className="text-sm">
                  {searchQuery ? 'No notifications match your search' : 'You\'re all caught up!'}
                </p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}