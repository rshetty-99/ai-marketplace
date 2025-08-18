/**
 * Dashboard Notification Service
 * Handles real-time notification badges and alerts for menu items
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { collection, query, where, onSnapshot, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface NotificationData {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  count: number;
  label: string;
  lastUpdated: Date;
  items?: NotificationItem[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'message' | 'proposal' | 'project' | 'dispute' | 'support' | 'payment' | 'team';
  createdAt: Date;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Hook to manage real-time dashboard notifications
 */
export function useDashboardNotifications() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Record<string, NotificationData>>({});
  const [loading, setLoading] = useState(true);

  // Get notification counts for different categories
  const getNotificationCounts = useCallback(async () => {
    if (!user) return;

    try {
      // TODO: Replace with actual Firestore queries based on your data structure
      
      // Messages count
      const messagesCount = await getUnreadMessagesCount(user.id);
      
      // Projects/Proposals count
      const proposalsCount = await getPendingProposalsCount(user.id);
      
      // Support tickets count (for admin users)
      const supportTicketsCount = await getOpenSupportTicketsCount(user.id);
      
      // Team invitations count
      const invitationsCount = await getPendingInvitationsCount(user.id);
      
      // Disputes count (for admin/moderator users)
      const disputesCount = await getActiveDisputesCount(user.id);

      setNotifications({
        messages: {
          id: 'messages',
          type: 'info',
          count: messagesCount,
          label: `${messagesCount} unread messages`,
          lastUpdated: new Date()
        },
        proposals: {
          id: 'proposals',
          type: 'success',
          count: proposalsCount,
          label: `${proposalsCount} new proposals`,
          lastUpdated: new Date()
        },
        'support-tickets': {
          id: 'support-tickets',
          type: 'error',
          count: supportTicketsCount,
          label: `${supportTicketsCount} open tickets`,
          lastUpdated: new Date()
        },
        invitations: {
          id: 'invitations',
          type: 'warning',
          count: invitationsCount,
          label: `${invitationsCount} pending invitations`,
          lastUpdated: new Date()
        },
        disputes: {
          id: 'disputes',
          type: 'error',
          count: disputesCount,
          label: `${disputesCount} active disputes`,
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      console.error('Error fetching notification counts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Set up real-time listeners for notifications
  useEffect(() => {
    if (!user) return;

    const unsubscribers: (() => void)[] = [];

    // Listen to messages
    const messagesQuery = query(
      collection(db, 'messages'),
      where('recipientId', '==', user.id),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const count = snapshot.size;
      setNotifications(prev => ({
        ...prev,
        messages: {
          id: 'messages',
          type: 'info',
          count,
          label: `${count} unread messages`,
          lastUpdated: new Date()
        }
      }));
    });
    unsubscribers.push(unsubscribeMessages);

    // Listen to team invitations
    const invitationsQuery = query(
      collection(db, 'invitations'),
      where('recipientId', '==', user.id),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeInvitations = onSnapshot(invitationsQuery, (snapshot) => {
      const count = snapshot.size;
      setNotifications(prev => ({
        ...prev,
        invitations: {
          id: 'invitations',
          type: 'warning',
          count,
          label: `${count} pending invitations`,
          lastUpdated: new Date()
        }
      }));
    });
    unsubscribers.push(unsubscribeInvitations);

    // Initial load
    getNotificationCounts();

    // Cleanup listeners
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user, getNotificationCounts]);

  return {
    notifications,
    loading,
    refresh: getNotificationCounts
  };
}

// Helper functions to get specific notification counts
async function getUnreadMessagesCount(userId: string): Promise<number> {
  try {
    // TODO: Implement actual Firestore query
    // const q = query(
    //   collection(db, 'messages'),
    //   where('recipientId', '==', userId),
    //   where('isRead', '==', false)
    // );
    // const snapshot = await getDocs(q);
    // return snapshot.size;
    
    // Mock data for now
    return Math.floor(Math.random() * 5);
  } catch (error) {
    console.error('Error getting messages count:', error);
    return 0;
  }
}

async function getPendingProposalsCount(userId: string): Promise<number> {
  try {
    // TODO: Implement actual Firestore query for proposals
    // Based on user role, this could be:
    // - For customers: proposals received for their projects
    // - For freelancers/vendors: pending proposals they submitted
    
    // Mock data for now
    return Math.floor(Math.random() * 8);
  } catch (error) {
    console.error('Error getting proposals count:', error);
    return 0;
  }
}

async function getOpenSupportTicketsCount(userId: string): Promise<number> {
  try {
    // TODO: Check if user has admin/support permissions first
    // const userDoc = await getDoc(doc(db, 'users', userId));
    // const userData = userDoc.data();
    // if (!userData?.roles?.some(role => role.includes('admin') || role.includes('support'))) {
    //   return 0;
    // }
    
    // Mock data for now - only return count for admin users
    return Math.floor(Math.random() * 15);
  } catch (error) {
    console.error('Error getting support tickets count:', error);
    return 0;
  }
}

async function getPendingInvitationsCount(userId: string): Promise<number> {
  try {
    // TODO: Implement actual Firestore query
    // const q = query(
    //   collection(db, 'invitations'),
    //   where('recipientId', '==', userId),
    //   where('status', '==', 'pending')
    // );
    
    // Mock data for now
    return Math.floor(Math.random() * 3);
  } catch (error) {
    console.error('Error getting invitations count:', error);
    return 0;
  }
}

async function getActiveDisputesCount(userId: string): Promise<number> {
  try {
    // TODO: Check if user has dispute resolution permissions
    // Only return count for users who can handle disputes
    
    // Mock data for now
    return Math.floor(Math.random() * 4);
  } catch (error) {
    console.error('Error getting disputes count:', error);
    return 0;
  }
}

/**
 * Hook for specific notification types
 */
export function useSpecificNotifications(type: string) {
  const { notifications } = useDashboardNotifications();
  
  return {
    count: notifications[type]?.count || 0,
    type: notifications[type]?.type || 'info',
    label: notifications[type]?.label || '',
    lastUpdated: notifications[type]?.lastUpdated
  };
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(userId: string, notificationType: string) {
  try {
    // TODO: Implement actual Firestore update
    // const q = query(
    //   collection(db, 'notifications'),
    //   where('userId', '==', userId),
    //   where('type', '==', notificationType),
    //   where('isRead', '==', false)
    // );
    
    console.log(`Marking ${notificationType} notifications as read for user ${userId}`);
  } catch (error) {
    console.error('Error marking notifications as read:', error);
  }
}

export default {
  useDashboardNotifications,
  useSpecificNotifications,
  markNotificationsAsRead
};