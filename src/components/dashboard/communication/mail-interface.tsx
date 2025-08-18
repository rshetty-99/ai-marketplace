/**
 * Mail Interface Component
 * ShadCN UI Kit inspired mail interface for unified inbox
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';

import {
  Mail,
  Inbox,
  Send,
  Archive,
  Trash,
  Star,
  Search,
  Filter,
  MoreVertical,
  Reply,
  ReplyAll,
  Forward,
  Paperclip,
  Calendar,
  Tag,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  RefreshCw,
  Settings,
  Plus,
  Edit,
  FolderOpen,
  MessageSquare,
  DollarSign,
  FileText,
  Users,
  Building,
  Briefcase,
  Bell,
  Image as ImageIcon,
  Download,
  Eye,
  EyeOff,
  Flag,
  MoreHorizontal
} from 'lucide-react';

import { MailMessage, MailMetadata } from '@/lib/firebase/communication-schema';

interface MailInterfaceProps {
  className?: string;
}

// Mock data for demonstration
const mockFolders = [
  { id: 'inbox', name: 'Inbox', icon: Inbox, count: 12, color: 'blue' },
  { id: 'sent', name: 'Sent', icon: Send, count: 0, color: 'green' },
  { id: 'drafts', name: 'Drafts', icon: Edit, count: 3, color: 'orange' },
  { id: 'archive', name: 'Archive', icon: Archive, count: 45, color: 'gray' },
  { id: 'trash', name: 'Trash', icon: Trash, count: 8, color: 'red' },
];

const mockLabels = [
  { id: 'project', name: 'Projects', color: 'blue', count: 8 },
  { id: 'payment', name: 'Payments', color: 'green', count: 4 },
  { id: 'contract', name: 'Contracts', color: 'purple', count: 2 },
  { id: 'support', name: 'Support', color: 'orange', count: 1 },
  { id: 'urgent', name: 'Urgent', color: 'red', count: 3 },
];

const mockEmails: MailMessage[] = [
  {
    id: '1',
    senderId: 'client1',
    senderName: 'Sarah Johnson',
    senderEmail: 'sarah@techcorp.com',
    recipientIds: ['user1'],
    subject: 'Project Milestone Update Required',
    content: 'Hi there! I wanted to check in on the progress of our web development project. Could you please provide an update on the current milestone?',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    folder: 'inbox',
    labels: ['project', 'urgent'],
    priority: 'high',
    isRead: false,
    isStarred: true,
    isImportant: true,
    status: 'delivered',
    threadId: 'thread1',
    metadata: {
      category: 'project',
      project: { id: 'proj1', title: 'E-commerce Website' }
    }
  },
  {
    id: '2',
    senderId: 'vendor1',
    senderName: 'TechSolutions Inc',
    senderEmail: 'billing@techsolutions.com',
    recipientIds: ['user1'],
    subject: 'Invoice #2024-001 - Payment Due',
    content: 'Thank you for your business! Your invoice for services rendered is now available. Payment is due within 30 days.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    folder: 'inbox',
    labels: ['payment'],
    priority: 'normal',
    isRead: true,
    isStarred: false,
    isImportant: false,
    status: 'delivered',
    metadata: {
      category: 'payment',
      invoice: { id: 'inv001', amount: 2500, dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) }
    }
  },
  {
    id: '3',
    senderId: 'system',
    senderName: 'AI Marketplace',
    senderEmail: 'noreply@aimarketplace.com',
    recipientIds: ['user1'],
    subject: 'New Contract Awaiting Signature',
    content: 'A new contract has been prepared for your project with DataCorp. Please review and sign the contract to proceed.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    folder: 'inbox',
    labels: ['contract'],
    priority: 'normal',
    isRead: false,
    isStarred: false,
    isImportant: true,
    status: 'delivered',
    metadata: {
      category: 'contract',
      contract: { id: 'contract1', title: 'Data Analysis Project', status: 'pending_signature' }
    }
  }
];

export function MailInterface({ className }: MailInterfaceProps) {
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [selectedEmail, setSelectedEmail] = useState<MailMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [emails, setEmails] = useState<MailMessage[]>(mockEmails);

  const filteredEmails = emails.filter(email => {
    const matchesFolder = email.folder === selectedFolder;
    const matchesSearch = searchQuery === '' || 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const handleEmailSelect = (email: MailMessage) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      // Mark as read
      setEmails(prev => prev.map(e => 
        e.id === email.id ? { ...e, isRead: true } : e
      ));
    }
  };

  const handleSelectEmail = (emailId: string, checked: boolean) => {
    const newSelected = new Set(selectedEmails);
    if (checked) {
      newSelected.add(emailId);
    } else {
      newSelected.delete(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmails(new Set(filteredEmails.map(e => e.id)));
    } else {
      setSelectedEmails(new Set());
    }
  };

  const handleBulkAction = (action: 'archive' | 'delete' | 'mark-read' | 'mark-unread') => {
    setEmails(prev => prev.map(email => {
      if (selectedEmails.has(email.id)) {
        switch (action) {
          case 'archive':
            return { ...email, folder: 'archive' };
          case 'delete':
            return { ...email, folder: 'trash' };
          case 'mark-read':
            return { ...email, isRead: true };
          case 'mark-unread':
            return { ...email, isRead: false };
          default:
            return email;
        }
      }
      return email;
    }));
    setSelectedEmails(new Set());
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

  const getPriorityIcon = (priority: MailMessage['priority']) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'low':
        return <Circle className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'project':
        return <Briefcase className="h-4 w-4" />;
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      case 'contract':
        return <FileText className="h-4 w-4" />;
      case 'support':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn('flex h-full bg-white border rounded-lg', className)}>
      <ResizablePanelGroup direction="horizontal">
        {/* Sidebar */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="flex flex-col h-full border-r">
            {/* Compose Button */}
            <div className="p-4">
              <Button 
                onClick={() => setIsComposing(true)}
                className="w-full"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Compose
              </Button>
            </div>

            {/* Folders */}
            <div className="px-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">FOLDERS</h3>
              <div className="space-y-1">
                {mockFolders.map((folder) => {
                  const Icon = folder.icon;
                  const isActive = selectedFolder === folder.id;
                  return (
                    <Button
                      key={folder.id}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start text-left",
                        isActive && "bg-blue-50 text-blue-700"
                      )}
                      onClick={() => setSelectedFolder(folder.id)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="flex-1">{folder.name}</span>
                      {folder.count > 0 && (
                        <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                          {folder.count}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Labels */}
            <div className="px-4 flex-1">
              <h3 className="text-sm font-medium text-gray-500 mb-2">LABELS</h3>
              <div className="space-y-1">
                {mockLabels.map((label) => (
                  <div key={label.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", `bg-${label.color}-500`)} />
                      <span className="text-sm">{label.name}</span>
                    </div>
                    {label.count > 0 && (
                      <span className="text-xs text-gray-500">{label.count}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="p-4 border-t">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Email List */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold capitalize">{selectedFolder}</h2>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Mark all as read</DropdownMenuItem>
                      <DropdownMenuItem>Archive all</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Settings</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedEmails.size > 0 && (
              <div className="p-3 bg-blue-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedEmails.size === filteredEmails.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm font-medium">
                      {selectedEmails.size} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBulkAction('archive')}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBulkAction('delete')}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBulkAction('mark-read')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBulkAction('mark-unread')}
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Email List */}
            <ScrollArea className="flex-1">
              <div className="divide-y">
                {filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    className={cn(
                      'flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors',
                      !email.isRead && 'bg-blue-50/50',
                      selectedEmail?.id === email.id && 'bg-blue-100'
                    )}
                    onClick={() => handleEmailSelect(email)}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedEmails.has(email.id)}
                        onCheckedChange={(checked) => handleSelectEmail(email.id, !!checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEmails(prev => prev.map(e => 
                            e.id === email.id ? { ...e, isStarred: !e.isStarred } : e
                          ));
                        }}
                      >
                        <Star className={cn(
                          "h-4 w-4",
                          email.isStarred ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
                        )} />
                      </Button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-medium truncate",
                            !email.isRead && "font-semibold"
                          )}>
                            {email.senderName}
                          </span>
                          {email.metadata?.category && (
                            <div className="flex items-center gap-1 text-gray-500">
                              {getCategoryIcon(email.metadata.category)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {email.attachments && email.attachments.length > 0 && (
                            <Paperclip className="h-3 w-3 text-gray-400" />
                          )}
                          {getPriorityIcon(email.priority)}
                          <span className="text-xs text-gray-500">
                            {formatTime(email.timestamp)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          "text-sm truncate",
                          !email.isRead ? "font-medium text-gray-900" : "text-gray-600"
                        )}>
                          {email.subject}
                        </p>
                        <div className="flex items-center gap-1">
                          {email.labels.map((labelId) => {
                            const label = mockLabels.find(l => l.id === labelId);
                            if (!label) return null;
                            return (
                              <div
                                key={labelId}
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  `bg-${label.color}-500`
                                )}
                              />
                            );
                          })}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {email.content}
                      </p>
                    </div>
                  </div>
                ))}

                {filteredEmails.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Mail className="h-12 w-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No emails found</h3>
                    <p className="text-sm">
                      {searchQuery ? 'Try adjusting your search terms' : 'This folder is empty'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Email Content */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="flex flex-col h-full">
            {selectedEmail ? (
              <>
                {/* Email Header */}
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h1 className="text-xl font-semibold mb-2">{selectedEmail.subject}</h1>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {selectedEmail.senderName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{selectedEmail.senderName}</p>
                            <p className="text-xs text-gray-500">{selectedEmail.senderEmail}</p>
                          </div>
                        </div>
                        <span>•</span>
                        <span>{formatTime(selectedEmail.timestamp)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Reply className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ReplyAll className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Forward className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Flag className="h-4 w-4 mr-2" />
                            Flag
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Tag className="h-4 w-4 mr-2" />
                            Add Label
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Labels */}
                  {selectedEmail.labels.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      {selectedEmail.labels.map((labelId) => {
                        const label = mockLabels.find(l => l.id === labelId);
                        if (!label) return null;
                        return (
                          <Badge key={labelId} variant="outline" className="text-xs">
                            <div className={cn("w-2 h-2 rounded-full mr-1", `bg-${label.color}-500`)} />
                            {label.name}
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  {/* Metadata */}
                  {selectedEmail.metadata && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm">
                        {getCategoryIcon(selectedEmail.metadata.category)}
                        <span className="font-medium capitalize">{selectedEmail.metadata.category}</span>
                        {selectedEmail.metadata.project && (
                          <>
                            <span>•</span>
                            <span>{selectedEmail.metadata.project.title}</span>
                          </>
                        )}
                        {selectedEmail.metadata.invoice && (
                          <>
                            <span>•</span>
                            <span>${selectedEmail.metadata.invoice.amount.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Email Content */}
                <ScrollArea className="flex-1 p-6">
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{selectedEmail.content}</p>
                  </div>

                  {/* Attachments */}
                  {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-3">Attachments ({selectedEmail.attachments.length})</h4>
                      <div className="space-y-2">
                        {selectedEmail.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex items-center gap-2">
                              {attachment.type === 'image' ? (
                                <ImageIcon className="h-4 w-4 text-blue-500" />
                              ) : (
                                <FileText className="h-4 w-4 text-gray-500" />
                              )}
                              <span className="text-sm">{attachment.fileName}</span>
                              <span className="text-xs text-gray-500">
                                ({(attachment.fileSize / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </ScrollArea>

                {/* Reply Box */}
                <div className="p-6 border-t">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>You</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Input placeholder="Quick reply..." className="text-sm" />
                      </div>
                      <Button size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Press Tab for full compose mode</span>
                      <span>Ctrl+Enter to send</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* No Email Selected */
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select an email</h3>
                  <p className="text-sm">Choose an email from the list to read it</p>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}