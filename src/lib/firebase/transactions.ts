import {
  runTransaction,
  writeBatch,
  increment,
  serverTimestamp,
  Transaction,
  WriteBatch,
  DocumentReference,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  collections,
  Organization,
  Provider,
  Project,
  Booking,
  Payment,
  Analytics
} from './collections';

/**
 * Transaction utilities for atomic operations
 * Ensures data consistency across multi-document updates
 */

export class TransactionService {
  /**
   * Create organization with initial setup
   */
  static async createOrganizationWithSetup(
    organizationData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    return await runTransaction(db, async (transaction) => {
      const orgRef = collections.organizations.doc();
      const now = serverTimestamp();
      
      // Create organization
      const organization: Organization = {
        ...organizationData,
        id: orgRef.id,
        createdAt: now,
        updatedAt: now
      } as Organization;
      
      transaction.set(orgRef, organization);
      
      // Create initial analytics document
      const analyticsRef = collections.analytics.doc();
      const analytics: Analytics = {
        id: analyticsRef.id,
        organizationId: orgRef.id,
        type: 'organization',
        period: 'monthly',
        date: now,
        metrics: {
          users: { active: 1, new: 1, retained: 0, churned: 0 },
          projects: { created: 0, completed: 0, cancelled: 0, inProgress: 0 },
          revenue: { gross: 0, net: 0, fees: 0, currency: organizationData.settings.currency },
          marketplace: { liquidityRatio: 0, timeToFill: 0, successRate: 0, disputeRate: 0 },
          performance: { averageRating: 0, completionRate: 0, onTimeDelivery: 0, customerSatisfaction: 0 }
        },
        createdAt: now
      } as Analytics;
      
      transaction.set(analyticsRef, analytics);
      
      return orgRef.id;
    });
  }

  /**
   * Create provider with verification setup
   */
  static async createProviderWithVerification(
    providerData: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    return await runTransaction(db, async (transaction) => {
      const providerRef = collections.providers.doc(providerData.clerkUserId);
      const now = serverTimestamp();
      
      // Check if provider already exists
      const existingProvider = await transaction.get(providerRef);
      if (existingProvider.exists()) {
        throw new Error('Provider already exists');
      }
      
      // Create provider
      const provider: Provider = {
        ...providerData,
        id: providerRef.id,
        createdAt: now,
        updatedAt: now
      } as Provider;
      
      transaction.set(providerRef, provider);
      
      // Update platform analytics
      const platformAnalyticsQuery = query(
        collections.analytics,
        where('type', '==', 'platform'),
        where('period', '==', 'monthly'),
        orderBy('date', 'desc'),
        limit(1)
      );
      
      const platformAnalytics = await getDocs(platformAnalyticsQuery);
      if (!platformAnalytics.empty) {
        const analyticsRef = platformAnalytics.docs[0].ref;
        transaction.update(analyticsRef, {
          'metrics.users.new': increment(1),
          'metrics.users.active': increment(1),
          updatedAt: now
        });
      }
      
      return providerRef.id;
    });
  }

  /**
   * Publish project with AI matching
   */
  static async publishProjectWithMatching(
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
    suggestedProviders?: Array<{ providerId: string; score: number; reasons: string[]; }>
  ): Promise<string> {
    return await runTransaction(db, async (transaction) => {
      const projectRef = collections.projects.doc();
      const now = serverTimestamp();
      
      // Create project
      const project: Project = {
        ...projectData,
        id: projectRef.id,
        status: 'published',
        aiMatching: {
          suggestedProviders: suggestedProviders || []
        },
        createdAt: now,
        updatedAt: now
      } as Project;
      
      transaction.set(projectRef, project);
      
      // Update organization analytics
      if (projectData.organizationId) {
        const orgAnalyticsQuery = query(
          collections.analytics,
          where('organizationId', '==', projectData.organizationId),
          where('type', '==', 'organization'),
          where('period', '==', 'monthly'),
          orderBy('date', 'desc'),
          limit(1)
        );
        
        const orgAnalytics = await getDocs(orgAnalyticsQuery);
        if (!orgAnalytics.empty) {
          const analyticsRef = orgAnalytics.docs[0].ref;
          transaction.update(analyticsRef, {
            'metrics.projects.created': increment(1),
            updatedAt: now
          });
        }
      }
      
      return projectRef.id;
    });
  }

  /**
   * Accept project and create booking
   */
  static async acceptProjectAndCreateBooking(
    projectId: string,
    providerId: string,
    bookingData: Omit<Booking, 'id' | 'projectId' | 'providerId' | 'createdAt' | 'updatedAt'>
  ): Promise<{ projectId: string; bookingId: string; }> {
    return await runTransaction(db, async (transaction) => {
      const projectRef = collections.projects.doc(projectId);
      const bookingRef = collections.bookings.doc();
      const now = serverTimestamp();
      
      // Get project
      const projectDoc = await transaction.get(projectRef);
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }
      
      const project = projectDoc.data();
      if (project.status !== 'published') {
        throw new Error('Project is not available for booking');
      }
      
      // Update project status
      transaction.update(projectRef, {
        status: 'in_progress',
        assignedProvider: {
          providerId,
          assignedAt: now,
          agreedBudget: bookingData.budget.amount,
          agreedTimeline: 'TBD' // TODO: Calculate from booking data
        },
        updatedAt: now
      });
      
      // Create booking
      const booking: Booking = {
        ...bookingData,
        id: bookingRef.id,
        projectId,
        providerId,
        status: 'confirmed',
        createdAt: now,
        updatedAt: now
      } as Booking;
      
      transaction.set(bookingRef, booking);
      
      // Update analytics for both organization and provider
      const [orgAnalytics, platformAnalytics] = await Promise.all([
        getDocs(query(
          collections.analytics,
          where('organizationId', '==', project.organizationId),
          where('type', '==', 'organization'),
          where('period', '==', 'monthly'),
          orderBy('date', 'desc'),
          limit(1)
        )),
        getDocs(query(
          collections.analytics,
          where('type', '==', 'platform'),
          where('period', '==', 'monthly'),
          orderBy('date', 'desc'),
          limit(1)
        ))
      ]);
      
      if (!orgAnalytics.empty) {
        transaction.update(orgAnalytics.docs[0].ref, {
          'metrics.projects.inProgress': increment(1),
          updatedAt: now
        });
      }
      
      if (!platformAnalytics.empty) {
        transaction.update(platformAnalytics.docs[0].ref, {
          'metrics.projects.inProgress': increment(1),
          updatedAt: now
        });
      }
      
      return { projectId, bookingId: bookingRef.id };
    });
  }

  /**
   * Process payment and update escrow
   */
  static async processPaymentWithEscrow(
    paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>,
    updateBookingStatus: boolean = true
  ): Promise<string> {
    return await runTransaction(db, async (transaction) => {
      const paymentRef = collections.payments.doc();
      const now = serverTimestamp();
      
      // Create payment record
      const payment: Payment = {
        ...paymentData,
        id: paymentRef.id,
        status: 'processing',
        createdAt: now,
        updatedAt: now
      } as Payment;
      
      transaction.set(paymentRef, payment);
      
      // Update booking if needed
      if (updateBookingStatus && paymentData.bookingId) {
        const bookingRef = collections.bookings.doc(paymentData.bookingId);
        const bookingDoc = await transaction.get(bookingRef);
        
        if (bookingDoc.exists()) {
          const booking = bookingDoc.data();
          let newStatus = booking.status;
          
          if (paymentData.type === 'deposit' && booking.status === 'confirmed') {
            newStatus = 'in_progress';
          } else if (paymentData.type === 'final' && booking.status === 'in_progress') {
            newStatus = 'completed';
          }
          
          transaction.update(bookingRef, {
            status: newStatus,
            updatedAt: now
          });
        }
      }
      
      // Update revenue analytics
      const analyticsUpdates = [
        // Organization analytics
        getDocs(query(
          collections.analytics,
          where('organizationId', '==', paymentData.organizationId),
          where('type', '==', 'organization'),
          where('period', '==', 'monthly'),
          orderBy('date', 'desc'),
          limit(1)
        )),
        // Platform analytics
        getDocs(query(
          collections.analytics,
          where('type', '==', 'platform'),
          where('period', '==', 'monthly'),
          orderBy('date', 'desc'),
          limit(1)
        ))
      ];
      
      const [orgAnalytics, platformAnalytics] = await Promise.all(analyticsUpdates);
      
      if (!orgAnalytics.empty) {
        transaction.update(orgAnalytics.docs[0].ref, {
          'metrics.revenue.gross': increment(paymentData.amount),
          'metrics.revenue.fees': increment(paymentData.fees.total),
          'metrics.revenue.net': increment(paymentData.amount - paymentData.fees.total),
          updatedAt: now
        });
      }
      
      if (!platformAnalytics.empty) {
        transaction.update(platformAnalytics.docs[0].ref, {
          'metrics.revenue.gross': increment(paymentData.amount),
          'metrics.revenue.fees': increment(paymentData.fees.total),
          updatedAt: now
        });
      }
      
      return paymentRef.id;
    });
  }

  /**
   * Complete project and handle final payments
   */
  static async completeProjectWithReview(
    projectId: string,
    bookingId: string,
    review: {
      organizationRating: number;
      organizationFeedback: string;
      providerRating: number;
      providerFeedback: string;
    }
  ): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const projectRef = collections.projects.doc(projectId);
      const bookingRef = collections.bookings.doc(bookingId);
      const now = serverTimestamp();
      
      // Get project and booking data
      const [projectDoc, bookingDoc] = await Promise.all([
        transaction.get(projectRef),
        transaction.get(bookingRef)
      ]);
      
      if (!projectDoc.exists() || !bookingDoc.exists()) {
        throw new Error('Project or booking not found');
      }
      
      const project = projectDoc.data();
      const booking = bookingDoc.data();
      
      // Update project status
      transaction.update(projectRef, {
        status: 'completed',
        updatedAt: now
      });
      
      // Update booking with review
      transaction.update(bookingRef, {
        status: 'completed',
        review: {
          ...review,
          submittedAt: now
        },
        updatedAt: now
      });
      
      // Update provider ratings
      if (project.assignedProvider) {
        const providerRef = collections.providers.doc(project.assignedProvider.providerId);
        const providerDoc = await transaction.get(providerRef);
        
        if (providerDoc.exists()) {
          const provider = providerDoc.data();
          const newCount = provider.ratings.count + 1;
          const newOverall = (provider.ratings.overall * provider.ratings.count + review.providerRating) / newCount;
          
          transaction.update(providerRef, {
            'ratings.overall': newOverall,
            'ratings.count': newCount,
            updatedAt: now
          });
        }
      }
      
      // Update analytics
      const analyticsUpdates = [
        getDocs(query(
          collections.analytics,
          where('organizationId', '==', project.organizationId),
          where('type', '==', 'organization'),
          where('period', '==', 'monthly'),
          orderBy('date', 'desc'),
          limit(1)
        )),
        getDocs(query(
          collections.analytics,
          where('type', '==', 'platform'),
          where('period', '==', 'monthly'),
          orderBy('date', 'desc'),
          limit(1)
        ))
      ];
      
      const [orgAnalytics, platformAnalytics] = await Promise.all(analyticsUpdates);
      
      const updateData = {
        'metrics.projects.completed': increment(1),
        'metrics.projects.inProgress': increment(-1),
        'metrics.performance.averageRating': review.organizationRating, // TODO: Calculate properly
        updatedAt: now
      };
      
      if (!orgAnalytics.empty) {
        transaction.update(orgAnalytics.docs[0].ref, updateData);
      }
      
      if (!platformAnalytics.empty) {
        transaction.update(platformAnalytics.docs[0].ref, updateData);
      }
    });
  }
}

/**
 * Batch operations for bulk updates
 */
export class BatchService {
  /**
   * Update multiple provider statuses
   */
  static async updateProvidersStatus(
    providerIds: string[],
    status: 'active' | 'inactive' | 'suspended',
    reason?: string
  ): Promise<void> {
    const batch = writeBatch(db);
    const now = serverTimestamp();
    
    providerIds.forEach(providerId => {
      const providerRef = collections.providers.doc(providerId);
      batch.update(providerRef, {
        status,
        updatedAt: now,
        ...(reason && { suspensionReason: reason })
      });
    });
    
    await batch.commit();
  }

  /**
   * Bulk update project visibility
   */
  static async updateProjectsVisibility(
    projectIds: string[],
    visibility: 'public' | 'private' | 'invite_only'
  ): Promise<void> {
    const batch = writeBatch(db);
    const now = serverTimestamp();
    
    projectIds.forEach(projectId => {
      const projectRef = collections.projects.doc(projectId);
      batch.update(projectRef, {
        visibility,
        updatedAt: now
      });
    });
    
    await batch.commit();
  }

  /**
   * Generate monthly analytics for all organizations
   */
  static async generateMonthlyAnalytics(
    month: string,
    year: number
  ): Promise<void> {
    // TODO: Implement batch analytics generation
    // This would be called by a scheduled function
    const batch = writeBatch(db);
    
    // Get all active organizations
    const orgsSnapshot = await getDocs(
      query(collections.organizations, where('isActive', '==', true))
    );
    
    const now = serverTimestamp();
    const analyticsDate = new Date(year, parseInt(month) - 1, 1);
    
    orgsSnapshot.docs.forEach(orgDoc => {
      const org = orgDoc.data();
      const analyticsRef = collections.analytics.doc();
      
      // TODO: Calculate actual metrics from historical data
      const analytics: Analytics = {
        id: analyticsRef.id,
        organizationId: org.id,
        type: 'organization',
        period: 'monthly',
        date: analyticsDate,
        metrics: {
          users: { active: 0, new: 0, retained: 0, churned: 0 },
          projects: { created: 0, completed: 0, cancelled: 0, inProgress: 0 },
          revenue: { gross: 0, net: 0, fees: 0, currency: org.settings.currency },
          marketplace: { liquidityRatio: 0, timeToFill: 0, successRate: 0, disputeRate: 0 },
          performance: { averageRating: 0, completionRate: 0, onTimeDelivery: 0, customerSatisfaction: 0 }
        },
        createdAt: now
      } as Analytics;
      
      batch.set(analyticsRef, analytics);
    });
    
    await batch.commit();
  }
}

/**
 * Error handling for transactions
 */
export class TransactionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

/**
 * Transaction retry utility
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        // Wait before retrying with exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, backoffMs * Math.pow(2, attempt))
        );
      }
    }
  }
  
  throw new TransactionError(
    'Transaction failed after multiple retries',
    'TRANSACTION_RETRY_FAILED',
    { originalError: lastError.message, attempts: maxRetries }
  );
}