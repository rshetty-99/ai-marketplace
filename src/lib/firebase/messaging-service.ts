/**
 * Real-time Messaging Service
 * Handles chat functionality with Firestore real-time updates
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Message,
  Conversation,
  ConversationParticipant,
  MessageAttachment,
  OnlineStatus,
  ConversationSettings,
  NotificationSettings,
  ParticipantPermissions
} from './communication-schema';

export class MessagingService {
  private static readonly MESSAGES_COLLECTION = 'messages';
  private static readonly CONVERSATIONS_COLLECTION = 'conversations';
  private static readonly ONLINE_STATUS_COLLECTION = 'onlineStatus';
  private static readonly MESSAGE_REACTIONS_COLLECTION = 'messageReactions';

  /**
   * Create a new conversation
   */
  static async createConversation(
    type: Conversation['type'],
    createdBy: string,
    participants: Omit<ConversationParticipant, 'joinedAt' | 'lastSeen' | 'isOnline'>[],
    options: {
      title?: string;
      description?: string;
      settings?: Partial<ConversationSettings>;
      metadata?: Conversation['metadata'];
    } = {}
  ): Promise<string> {
    try {
      const conversationData: Omit<Conversation, 'id'> = {
        type,
        title: options.title,
        description: options.description,
        participants: participants.map(p => ({
          ...p,
          joinedAt: new Date(),
          lastSeen: new Date(),
          isOnline: false,
          permissions: this.getDefaultPermissions(p.role),
          notificationSettings: this.getDefaultNotificationSettings()
        })),
        createdBy,
        createdAt: new Date(),
        lastActivity: new Date(),
        isArchived: false,
        isPinned: false,
        settings: {
          allowFileSharing: true,
          allowVideoCall: true,
          requireApproval: false,
          isPublic: false,
          ...options.settings
        },
        metadata: options.metadata
      };

      const docRef = await addDoc(collection(db, this.CONVERSATIONS_COLLECTION), {
        ...conversationData,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      throw new Error(`Failed to create conversation: ${error}`);
    }
  }

  /**
   * Send a message to a conversation
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    content: string,
    options: {
      type?: Message['type'];
      attachments?: MessageAttachment[];
      replyTo?: string;
      mentions?: string[];
      senderAvatar?: string;
    } = {}
  ): Promise<string> {
    try {
      const messageData: Omit<Message, 'id'> = {
        conversationId,
        senderId,
        senderName,
        senderAvatar: options.senderAvatar,
        content,
        type: options.type || 'text',
        attachments: options.attachments,
        timestamp: new Date(),
        mentions: options.mentions,
        replyTo: options.replyTo,
        status: 'sent',
        readBy: [{
          userId: senderId,
          readAt: new Date()
        }]
      };

      const batch = writeBatch(db);

      // Add message
      const messageRef = doc(collection(db, this.MESSAGES_COLLECTION));
      batch.set(messageRef, {
        ...messageData,
        timestamp: serverTimestamp()
      });

      // Update conversation last message and activity
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      batch.update(conversationRef, {
        lastMessage: {
          id: messageRef.id,
          content: content.substring(0, 100),
          senderId,
          senderName,
          timestamp: serverTimestamp(),
          type: options.type || 'text'
        },
        lastActivity: serverTimestamp()
      });

      await batch.commit();

      // Handle mentions notifications
      if (options.mentions && options.mentions.length > 0) {
        await this.handleMentions(conversationId, messageRef.id, options.mentions, senderId, senderName);
      }

      return messageRef.id;
    } catch (error) {
      throw new Error(`Failed to send message: ${error}`);
    }
  }

  /**
   * Edit a message
   */
  static async editMessage(messageId: string, newContent: string, userId: string): Promise<void> {
    try {
      const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
      
      // Verify user owns the message
      const messageDoc = await getDoc(messageRef);
      if (!messageDoc.exists() || messageDoc.data().senderId !== userId) {
        throw new Error('Unauthorized to edit this message');
      }

      await updateDoc(messageRef, {
        content: newContent,
        edited: true,
        editedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error(`Failed to edit message: ${error}`);
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
      
      // Verify user owns the message or has admin permissions
      const messageDoc = await getDoc(messageRef);
      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }

      const messageData = messageDoc.data();
      if (messageData.senderId !== userId) {
        // Check if user has admin permissions in the conversation
        const hasPermission = await this.checkDeletePermission(messageData.conversationId, userId);
        if (!hasPermission) {
          throw new Error('Unauthorized to delete this message');
        }
      }

      await deleteDoc(messageRef);
    } catch (error) {
      throw new Error(`Failed to delete message: ${error}`);
    }
  }

  /**
   * Add reaction to a message
   */
  static async addReaction(messageId: string, userId: string, userName: string, emoji: string): Promise<void> {
    try {
      const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
      
      await updateDoc(messageRef, {
        reactions: arrayUnion({
          emoji,
          userId,
          userName,
          timestamp: new Date()
        })
      });
    } catch (error) {
      throw new Error(`Failed to add reaction: ${error}`);
    }
  }

  /**
   * Remove reaction from a message
   */
  static async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    try {
      const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const reactions = messageDoc.data().reactions || [];
        const updatedReactions = reactions.filter((r: any) => 
          !(r.userId === userId && r.emoji === emoji)
        );
        
        await updateDoc(messageRef, {
          reactions: updatedReactions
        });
      }
    } catch (error) {
      throw new Error(`Failed to remove reaction: ${error}`);
    }
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(conversationId: string, userId: string, messageIds?: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      if (messageIds && messageIds.length > 0) {
        // Mark specific messages as read
        for (const messageId of messageIds) {
          const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
          batch.update(messageRef, {
            readBy: arrayUnion({
              userId,
              readAt: new Date()
            })
          });
        }
      } else {
        // Mark all unread messages in conversation as read
        const messagesQuery = query(
          collection(db, this.MESSAGES_COLLECTION),
          where('conversationId', '==', conversationId),
          where('readBy', 'not-in', [{ userId }])
        );
        
        const messagesSnapshot = await getDocs(messagesQuery);
        messagesSnapshot.forEach(doc => {
          batch.update(doc.ref, {
            readBy: arrayUnion({
              userId,
              readAt: new Date()
            })
          });
        });
      }

      // Update user's last seen in conversation
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const participants = conversationDoc.data().participants;
        const updatedParticipants = participants.map((p: ConversationParticipant) => 
          p.userId === userId ? { ...p, lastSeen: new Date() } : p
        );
        
        batch.update(conversationRef, {
          participants: updatedParticipants
        });
      }

      await batch.commit();
    } catch (error) {
      throw new Error(`Failed to mark messages as read: ${error}`);
    }
  }

  /**
   * Update online status
   */
  static async updateOnlineStatus(
    userId: string,
    status: OnlineStatus['status'],
    customMessage?: string
  ): Promise<void> {
    try {
      const statusRef = doc(db, this.ONLINE_STATUS_COLLECTION, userId);
      
      await updateDoc(statusRef, {
        isOnline: status === 'online',
        status,
        lastSeen: serverTimestamp(),
        customMessage: customMessage || null
      });
    } catch (error) {
      throw new Error(`Failed to update online status: ${error}`);
    }
  }

  /**
   * Subscribe to conversation messages
   */
  static subscribeToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void,
    limitCount: number = 50
  ): () => void {
    const messagesQuery = query(
      collection(db, this.MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(messagesQuery, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as Message);
      });
      
      // Reverse to show oldest first
      callback(messages.reverse());
    });
  }

  /**
   * Subscribe to user's conversations
   */
  static subscribeToConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void
  ): () => void {
    const conversationsQuery = query(
      collection(db, this.CONVERSATIONS_COLLECTION),
      where('participants', 'array-contains-any', [{ userId }]),
      orderBy('lastActivity', 'desc')
    );

    return onSnapshot(conversationsQuery, (snapshot) => {
      const conversations: Conversation[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        conversations.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastActivity: data.lastActivity?.toDate() || new Date(),
          lastMessage: data.lastMessage ? {
            ...data.lastMessage,
            timestamp: data.lastMessage.timestamp?.toDate() || new Date()
          } : undefined
        } as Conversation);
      });
      
      callback(conversations);
    });
  }

  /**
   * Subscribe to online status updates
   */
  static subscribeToOnlineStatus(
    userIds: string[],
    callback: (statuses: OnlineStatus[]) => void
  ): () => void {
    const statusQuery = query(
      collection(db, this.ONLINE_STATUS_COLLECTION),
      where('userId', 'in', userIds)
    );

    return onSnapshot(statusQuery, (snapshot) => {
      const statuses: OnlineStatus[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        statuses.push({
          ...data,
          lastSeen: data.lastSeen?.toDate() || new Date()
        } as OnlineStatus);
      });
      
      callback(statuses);
    });
  }

  /**
   * Add participant to conversation
   */
  static async addParticipant(
    conversationId: string,
    participant: Omit<ConversationParticipant, 'joinedAt' | 'lastSeen' | 'isOnline'>,
    addedBy: string
  ): Promise<void> {
    try {
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      
      const newParticipant: ConversationParticipant = {
        ...participant,
        joinedAt: new Date(),
        lastSeen: new Date(),
        isOnline: false,
        permissions: this.getDefaultPermissions(participant.role),
        notificationSettings: this.getDefaultNotificationSettings()
      };

      await updateDoc(conversationRef, {
        participants: arrayUnion(newParticipant)
      });

      // Send system message
      await this.sendMessage(
        conversationId,
        'system',
        'System',
        `${participant.userName} was added to the conversation`,
        { type: 'system' }
      );
    } catch (error) {
      throw new Error(`Failed to add participant: ${error}`);
    }
  }

  /**
   * Remove participant from conversation
   */
  static async removeParticipant(
    conversationId: string,
    userId: string,
    removedBy: string
  ): Promise<void> {
    try {
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const participants = conversationDoc.data().participants;
        const participantToRemove = participants.find((p: ConversationParticipant) => p.userId === userId);
        const updatedParticipants = participants.filter((p: ConversationParticipant) => p.userId !== userId);
        
        await updateDoc(conversationRef, {
          participants: updatedParticipants
        });

        // Send system message
        if (participantToRemove) {
          await this.sendMessage(
            conversationId,
            'system',
            'System',
            `${participantToRemove.userName} was removed from the conversation`,
            { type: 'system' }
          );
        }
      }
    } catch (error) {
      throw new Error(`Failed to remove participant: ${error}`);
    }
  }

  /**
   * Archive/Unarchive conversation
   */
  static async archiveConversation(conversationId: string, isArchived: boolean): Promise<void> {
    try {
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      await updateDoc(conversationRef, { isArchived });
    } catch (error) {
      throw new Error(`Failed to archive conversation: ${error}`);
    }
  }

  /**
   * Pin/Unpin conversation
   */
  static async pinConversation(conversationId: string, isPinned: boolean): Promise<void> {
    try {
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      await updateDoc(conversationRef, { isPinned });
    } catch (error) {
      throw new Error(`Failed to pin conversation: ${error}`);
    }
  }

  /**
   * Get default permissions for role
   */
  private static getDefaultPermissions(role: ConversationParticipant['role']): ParticipantPermissions {
    const basePermissions = {
      canSendMessages: true,
      canSendFiles: true,
      canMention: true,
      canAddParticipants: false,
      canRemoveParticipants: false,
      canEditConversation: false,
      canDeleteMessages: false,
      canStartVideoCall: true
    };

    switch (role) {
      case 'owner':
      case 'admin':
        return {
          ...basePermissions,
          canAddParticipants: true,
          canRemoveParticipants: true,
          canEditConversation: true,
          canDeleteMessages: true
        };
      case 'member':
        return basePermissions;
      case 'guest':
        return {
          ...basePermissions,
          canSendFiles: false,
          canStartVideoCall: false
        };
      default:
        return basePermissions;
    }
  }

  /**
   * Get default notification settings
   */
  private static getDefaultNotificationSettings(): NotificationSettings {
    return {
      muted: false,
      pushNotifications: true,
      emailNotifications: false,
      mentionOnly: false
    };
  }

  /**
   * Handle mention notifications
   */
  private static async handleMentions(
    conversationId: string,
    messageId: string,
    mentions: string[],
    senderId: string,
    senderName: string
  ): Promise<void> {
    // Implementation would trigger notifications for mentioned users
    // This could integrate with the notification system
    console.log('Handling mentions:', { conversationId, messageId, mentions, senderId, senderName });
  }

  /**
   * Check if user has permission to delete messages
   */
  private static async checkDeletePermission(conversationId: string, userId: string): Promise<boolean> {
    try {
      const conversationRef = doc(db, this.CONVERSATIONS_COLLECTION, conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const participants = conversationDoc.data().participants;
        const userParticipant = participants.find((p: ConversationParticipant) => p.userId === userId);
        return userParticipant?.permissions?.canDeleteMessages || false;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
}