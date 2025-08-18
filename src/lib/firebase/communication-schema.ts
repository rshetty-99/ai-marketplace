/**
 * Communication System Schema
 * Firestore collections for real-time messaging and unified inbox
 */

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'video_call' | 'meeting_link' | 'system';
  attachments?: MessageAttachment[];
  metadata?: MessageMetadata;
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  reactions?: MessageReaction[];
  mentions?: string[]; // User IDs mentioned in the message
  replyTo?: string; // Message ID this is replying to
  threadCount?: number; // Number of replies to this message
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  readBy?: MessageReadStatus[];
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'document' | 'audio' | 'video' | 'link';
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    title?: string;
    description?: string;
  };
}

export interface MessageMetadata {
  videoCall?: {
    meetingId: string;
    provider: 'zoom' | 'google-meet' | 'teams';
    joinUrl: string;
    startTime: Date;
    duration: number;
  };
  system?: {
    action: 'project_created' | 'user_joined' | 'payment_received' | 'milestone_completed';
    data: Record<string, any>;
  };
  link?: {
    title: string;
    description: string;
    image: string;
    url: string;
  };
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface MessageReadStatus {
  userId: string;
  readAt: Date;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'project' | 'team' | 'support';
  title?: string;
  description?: string;
  participants: ConversationParticipant[];
  createdBy: string;
  createdAt: Date;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
    type: string;
  };
  lastActivity: Date;
  isArchived: boolean;
  isPinned: boolean;
  settings: ConversationSettings;
  metadata?: ConversationMetadata;
  tags?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface ConversationParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  joinedAt: Date;
  lastSeen: Date;
  isOnline: boolean;
  permissions: ParticipantPermissions;
  notificationSettings: NotificationSettings;
}

export interface ParticipantPermissions {
  canSendMessages: boolean;
  canSendFiles: boolean;
  canMention: boolean;
  canAddParticipants: boolean;
  canRemoveParticipants: boolean;
  canEditConversation: boolean;
  canDeleteMessages: boolean;
  canStartVideoCall: boolean;
}

export interface NotificationSettings {
  muted: boolean;
  muteUntil?: Date;
  pushNotifications: boolean;
  emailNotifications: boolean;
  mentionOnly: boolean;
}

export interface ConversationSettings {
  allowFileSharing: boolean;
  allowVideoCall: boolean;
  requireApproval: boolean;
  autoDeleteAfter?: number; // days
  maxParticipants?: number;
  isPublic: boolean;
}

export interface ConversationMetadata {
  project?: {
    id: string;
    title: string;
    status: string;
  };
  team?: {
    id: string;
    name: string;
  };
  client?: {
    id: string;
    name: string;
    organizationId?: string;
  };
}

export interface MailMessage {
  id: string;
  conversationId?: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  recipientIds: string[];
  ccIds?: string[];
  bccIds?: string[];
  subject: string;
  content: string;
  htmlContent?: string;
  attachments?: MessageAttachment[];
  timestamp: Date;
  folder: 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash' | 'spam';
  labels: string[];
  priority: 'low' | 'normal' | 'high';
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  readAt?: Date;
  status: 'draft' | 'sent' | 'delivered' | 'failed';
  parentMessageId?: string; // For threading
  threadId?: string;
  threadPosition?: number;
  autoReply?: boolean;
  metadata?: MailMetadata;
}

export interface MailMetadata {
  category: 'project' | 'payment' | 'contract' | 'support' | 'marketing' | 'system';
  project?: {
    id: string;
    title: string;
  };
  invoice?: {
    id: string;
    amount: number;
    dueDate: Date;
  };
  contract?: {
    id: string;
    title: string;
    status: string;
  };
  tracking?: {
    opened: boolean;
    openedAt?: Date;
    clicked: boolean;
    clickedAt?: Date;
  };
}

export interface NotificationPreferences {
  userId: string;
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    categories: {
      messages: boolean;
      mentions: boolean;
      projects: boolean;
      payments: boolean;
      marketing: boolean;
    };
  };
  push: {
    enabled: boolean;
    categories: {
      messages: boolean;
      mentions: boolean;
      projects: boolean;
      payments: boolean;
    };
  };
  inApp: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
  digest: {
    enabled: boolean;
    time: string; // HH:MM format
    timezone: string;
    includeWeekends: boolean;
  };
}

export interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
  status: 'online' | 'away' | 'busy' | 'offline';
  customMessage?: string;
  timezone: string;
  workingHours?: {
    start: string; // HH:MM
    end: string; // HH:MM
    days: number[]; // 0-6, Sunday = 0
  };
}

export interface VideoCall {
  id: string;
  conversationId?: string;
  projectId?: string;
  title: string;
  description?: string;
  hostId: string;
  participants: VideoCallParticipant[];
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  provider: 'zoom' | 'google-meet' | 'teams';
  meetingUrl: string;
  meetingId: string;
  password?: string;
  status: 'scheduled' | 'started' | 'ended' | 'cancelled';
  recording?: {
    enabled: boolean;
    url?: string;
    duration?: number;
  };
  settings: {
    waitingRoom: boolean;
    muteOnEntry: boolean;
    allowScreenShare: boolean;
    allowRecording: boolean;
  };
  agenda?: string[];
  notes?: string;
  attachments?: MessageAttachment[];
  followUpTasks?: FollowUpTask[];
}

export interface VideoCallParticipant {
  userId: string;
  userName: string;
  email: string;
  role: 'host' | 'presenter' | 'attendee';
  status: 'invited' | 'accepted' | 'declined' | 'tentative';
  joinedAt?: Date;
  leftAt?: Date;
  duration?: number;
}

export interface FollowUpTask {
  id: string;
  title: string;
  description?: string;
  assignedTo: string[];
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'normal' | 'high';
  createdAt: Date;
}

export interface MessageTemplate {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: 'greeting' | 'proposal' | 'follow_up' | 'closure' | 'support' | 'custom';
  isPublic: boolean;
  usageCount: number;
  lastUsed?: Date;
  createdAt: Date;
  tags: string[];
  variables?: TemplateVariable[];
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'selection';
  required: boolean;
  defaultValue?: string;
  options?: string[]; // for selection type
  description?: string;
}

export interface CommunicationAnalytics {
  userId: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;
  metrics: {
    messagesSent: number;
    messagesReceived: number;
    conversationsStarted: number;
    averageResponseTime: number; // in minutes
    videoCallsHosted: number;
    videoCallsAttended: number;
    filesSent: number;
    filesReceived: number;
    mostActiveHour: number;
    mostActiveDayOfWeek: number;
    responseRate: number; // percentage
    conversationCompletionRate: number;
  };
  breakdown: {
    byConversationType: Record<string, number>;
    byParticipant: Array<{
      userId: string;
      userName: string;
      messageCount: number;
      callCount: number;
    }>;
    byProject: Array<{
      projectId: string;
      projectName: string;
      messageCount: number;
      callCount: number;
    }>;
  };
  updatedAt: Date;
}

export interface AutoReply {
  userId: string;
  enabled: boolean;
  message: string;
  conditions: {
    timeRange?: {
      start: string; // HH:MM
      end: string; // HH:MM
      timezone: string;
    };
    dateRange?: {
      start: Date;
      end: Date;
    };
    keywords?: string[];
    senderTypes?: ('client' | 'team' | 'vendor' | 'system')[];
  };
  frequency: 'once_per_conversation' | 'once_per_day' | 'always';
  createdAt: Date;
  lastUsed?: Date;
}