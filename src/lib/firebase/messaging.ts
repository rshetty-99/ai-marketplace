// Messaging System
// Real-time messaging between users with Firebase

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  QueryConstraint,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase-config';

export interface Message {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  isRead: boolean;
  isEdited: boolean;
  editedAt?: Date;
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id?: string;
  participants: {
    id: string;
    name: string;
    avatar?: string;
    role: 'customer' | 'freelancer' | 'vendor';
  }[];
  projectId?: string;
  projectTitle?: string;
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
    type: 'text' | 'image' | 'file' | 'system';
  };
  unreadCount: {
    [userId: string]: number;
  };
  isActive: boolean;
  isArchived: boolean;
  metadata?: {
    contractId?: string;
    proposalId?: string;
    invoiceId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageFilter {
  conversationId?: string;
  senderId?: string;
  recipientId?: string;
  isRead?: boolean;
  type?: Message['type'];
}

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_COLLECTION = 'messages';

// Create or get existing conversation
export async function createConversation(
  participants: Conversation['participants'],
  projectId?: string,
  projectTitle?: string
): Promise<string> {
  try {
    // Check if conversation already exists between these participants
    const participantIds = participants.map(p => p.id).sort();
    
    const existingConversationsQuery = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('participants', 'array-contains', participants[0])
    );
    
    const existingSnapshot = await getDocs(existingConversationsQuery);
    
    for (const docSnap of existingSnapshot.docs) {
      const data = docSnap.data();
      const existingParticipantIds = data.participants.map((p: any) => p.id).sort();
      
      if (JSON.stringify(participantIds) === JSON.stringify(existingParticipantIds)) {
        // Update project info if provided
        if (projectId && projectTitle) {
          await updateDoc(doc(db, CONVERSATIONS_COLLECTION, docSnap.id), {
            projectId,
            projectTitle,
            updatedAt: serverTimestamp()
          });
        }
        return docSnap.id;
      }
    }

    // Create new conversation
    const now = new Date();
    const conversationData: Omit<Conversation, 'id'> = {
      participants,
      projectId,
      projectTitle,
      unreadCount: participants.reduce((acc, p) => ({
        ...acc,
        [p.id]: 0
      }), {}),
      isActive: true,
      isArchived: false,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), {
      ...conversationData,
      createdAt: Timestamp.fromDate(conversationData.createdAt),
      updatedAt: Timestamp.fromDate(conversationData.updatedAt)
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw new Error('Failed to create conversation');
  }
}

// Send a message
export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  recipientId: string,
  recipientName: string,
  content: string,
  type: Message['type'] = 'text',
  attachments?: Message['attachments'],
  replyTo?: Message['replyTo'],
  senderAvatar?: string,
  recipientAvatar?: string
): Promise<string> {
  try {
    const now = new Date();
    
    const messageData: Omit<Message, 'id'> = {
      conversationId,
      senderId,
      senderName,
      senderAvatar,
      recipientId,
      recipientName,
      recipientAvatar,
      content,
      type,
      attachments,
      isRead: false,
      isEdited: false,
      replyTo,
      createdAt: now,
      updatedAt: now
    };

    // Add message
    const messageRef = await addDoc(collection(db, MESSAGES_COLLECTION), {
      ...messageData,
      createdAt: Timestamp.fromDate(messageData.createdAt),
      updatedAt: Timestamp.fromDate(messageData.updatedAt)
    });

    // Update conversation with last message and unread count
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (conversationSnap.exists()) {
      const conversationData = conversationSnap.data();
      const currentUnreadCount = conversationData.unreadCount || {};
      
      await updateDoc(conversationRef, {
        lastMessage: {
          content: content.length > 100 ? content.substring(0, 100) + '...' : content,
          senderId,
          senderName,
          timestamp: Timestamp.fromDate(now),
          type
        },
        unreadCount: {
          ...currentUnreadCount,
          [recipientId]: (currentUnreadCount[recipientId] || 0) + 1
        },
        updatedAt: serverTimestamp()
      });
    }

    return messageRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
}

// Get conversation messages
export async function getMessages(
  conversationId: string,
  pageSize: number = 50
): Promise<Message[]> {
  try {
    const messagesQuery = query(
      collection(db, MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    const snapshot = await getDocs(messagesQuery);
    const messages: Message[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        editedAt: data.editedAt?.toDate()
      } as Message);
    });

    return messages.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Error getting messages:', error);
    throw new Error('Failed to get messages');
  }
}

// Listen to real-time messages
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void,
  pageSize: number = 50
) {
  const messagesQuery = query(
    collection(db, MESSAGES_COLLECTION),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    const messages: Message[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        editedAt: data.editedAt?.toDate()
      } as Message);
    });

    callback(messages.reverse());
  });
}

// Get user conversations
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  try {
    const conversationsQuery = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('participants', 'array-contains', { id: userId }),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(conversationsQuery);
    const conversations: Conversation[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      conversations.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastMessage: data.lastMessage ? {
          ...data.lastMessage,
          timestamp: data.lastMessage.timestamp?.toDate() || new Date()
        } : undefined
      } as Conversation);
    });

    return conversations;
  } catch (error) {
    console.error('Error getting user conversations:', error);
    throw new Error('Failed to get conversations');
  }
}

// Listen to real-time conversations
export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
) {
  const conversationsQuery = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('participants', 'array-contains', { id: userId }),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(conversationsQuery, (snapshot) => {
    const conversations: Conversation[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      conversations.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastMessage: data.lastMessage ? {
          ...data.lastMessage,
          timestamp: data.lastMessage.timestamp?.toDate() || new Date()
        } : undefined
      } as Conversation);
    });

    callback(conversations);
  });
}

// Mark messages as read
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    // Get unread messages for this user
    const unreadMessagesQuery = query(
      collection(db, MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId),
      where('recipientId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(unreadMessagesQuery);
    
    // Update all unread messages
    const updatePromises = snapshot.docs.map(async (messageDoc) => {
      await updateDoc(doc(db, MESSAGES_COLLECTION, messageDoc.id), {
        isRead: true,
        updatedAt: serverTimestamp()
      });
    });

    await Promise.all(updatePromises);

    // Reset unread count for this user in conversation
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (conversationSnap.exists()) {
      const conversationData = conversationSnap.data();
      const currentUnreadCount = conversationData.unreadCount || {};
      
      await updateDoc(conversationRef, {
        unreadCount: {
          ...currentUnreadCount,
          [userId]: 0
        }
      });
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw new Error('Failed to mark messages as read');
  }
}

// Edit a message
export async function editMessage(
  messageId: string,
  newContent: string
): Promise<void> {
  try {
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    await updateDoc(messageRef, {
      content: newContent,
      isEdited: true,
      editedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error editing message:', error);
    throw new Error('Failed to edit message');
  }
}

// Delete a message
export async function deleteMessage(messageId: string): Promise<void> {
  try {
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    await deleteDoc(messageRef);
  } catch (error) {
    console.error('Error deleting message:', error);
    throw new Error('Failed to delete message');
  }
}

// Archive a conversation
export async function archiveConversation(
  conversationId: string,
  archived: boolean = true
): Promise<void> {
  try {
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(conversationRef, {
      isArchived: archived,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    throw new Error('Failed to archive conversation');
  }
}

// Search messages
export async function searchMessages(
  userId: string,
  searchTerm: string,
  conversationId?: string
): Promise<Message[]> {
  try {
    // Note: This is a simplified search. In production, you'd want to use
    // a dedicated search service like Algolia or Elasticsearch
    let messagesQuery;
    
    if (conversationId) {
      messagesQuery = query(
        collection(db, MESSAGES_COLLECTION),
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
    } else {
      // Search across all user's conversations
      messagesQuery = query(
        collection(db, MESSAGES_COLLECTION),
        where('senderId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
    }

    const snapshot = await getDocs(messagesQuery);
    const messages: Message[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const message = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        editedAt: data.editedAt?.toDate()
      } as Message;

      // Client-side filtering for search term
      if (message.content.toLowerCase().includes(searchTerm.toLowerCase())) {
        messages.push(message);
      }
    });

    return messages;
  } catch (error) {
    console.error('Error searching messages:', error);
    throw new Error('Failed to search messages');
  }
}

// Get conversation by ID
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  try {
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) {
      return null;
    }

    const data = conversationSnap.data();
    return {
      id: conversationSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastMessage: data.lastMessage ? {
        ...data.lastMessage,
        timestamp: data.lastMessage.timestamp?.toDate() || new Date()
      } : undefined
    } as Conversation;
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw new Error('Failed to get conversation');
  }
}

// Get unread messages count for user
export async function getUnreadMessagesCount(userId: string): Promise<number> {
  try {
    const conversations = await getUserConversations(userId);
    
    let totalUnread = 0;
    conversations.forEach(conversation => {
      totalUnread += conversation.unreadCount[userId] || 0;
    });

    return totalUnread;
  } catch (error) {
    console.error('Error getting unread messages count:', error);
    return 0;
  }
}