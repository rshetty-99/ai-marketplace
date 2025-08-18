/**
 * Stripe Payment Service
 * Handles marketplace payments, escrow, and vendor payouts
 */

import Stripe from 'stripe';

// Initialize Stripe with API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface ConnectedAccount {
  id: string;
  email: string;
  verified: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  requirements: Stripe.Account.Requirements;
}

export interface EscrowPayment {
  id: string;
  projectId: string;
  clientId: string;
  freelancerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'held' | 'released' | 'refunded';
  platformFee: number;
  createdAt: Date;
  releaseDate?: Date;
}

export class StripeService {
  /**
   * Create a Stripe Connect account for vendors/freelancers
   */
  static async createConnectedAccount(
    email: string,
    type: 'express' | 'standard' = 'express',
    country: string = 'US'
  ): Promise<ConnectedAccount> {
    try {
      const account = await stripe.accounts.create({
        type,
        email,
        country,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        settings: {
          payouts: {
            schedule: {
              interval: 'weekly',
              weekly_anchor: 'friday'
            }
          }
        }
      });

      return {
        id: account.id,
        email: account.email || email,
        verified: account.details_submitted || false,
        payoutsEnabled: account.payouts_enabled || false,
        chargesEnabled: account.charges_enabled || false,
        requirements: account.requirements!
      };
    } catch (error) {
      throw new Error(`Failed to create connected account: ${error}`);
    }
  }

  /**
   * Create onboarding link for vendors to complete their Stripe setup
   */
  static async createAccountLink(
    accountId: string,
    returnUrl: string,
    refreshUrl: string
  ): Promise<string> {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink.url;
    } catch (error) {
      throw new Error(`Failed to create account link: ${error}`);
    }
  }

  /**
   * Create payment intent with platform fee (marketplace model)
   */
  static async createPaymentIntent(
    amount: number, // in cents
    currency: string = 'usd',
    vendorAccountId: string,
    platformFeePercent: number = 10,
    projectId: string,
    metadata: Record<string, string> = {}
  ): Promise<PaymentIntent> {
    try {
      const platformFee = Math.round(amount * (platformFeePercent / 100));

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        application_fee_amount: platformFee,
        transfer_data: {
          destination: vendorAccountId,
        },
        metadata: {
          projectId,
          vendorAccountId,
          platformFee: platformFee.toString(),
          ...metadata
        },
        capture_method: 'manual', // For escrow - capture manually when work is completed
      });

      return {
        id: paymentIntent.id,
        amount,
        currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret!
      };
    } catch (error) {
      throw new Error(`Failed to create payment intent: ${error}`);
    }
  }

  /**
   * Create escrow payment (authorized but not captured)
   */
  static async createEscrowPayment(
    amount: number,
    currency: string = 'usd',
    vendorAccountId: string,
    projectId: string,
    clientId: string,
    freelancerId: string,
    platformFeePercent: number = 10
  ): Promise<EscrowPayment> {
    try {
      const platformFee = Math.round(amount * (platformFeePercent / 100));

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        application_fee_amount: platformFee,
        transfer_data: {
          destination: vendorAccountId,
        },
        metadata: {
          projectId,
          clientId,
          freelancerId,
          type: 'escrow'
        },
        capture_method: 'manual'
      });

      const escrowPayment: EscrowPayment = {
        id: paymentIntent.id,
        projectId,
        clientId,
        freelancerId,
        amount,
        currency,
        status: 'pending',
        platformFee,
        createdAt: new Date()
      };

      return escrowPayment;
    } catch (error) {
      throw new Error(`Failed to create escrow payment: ${error}`);
    }
  }

  /**
   * Release escrow payment (capture the payment)
   */
  static async releaseEscrowPayment(paymentIntentId: string): Promise<void> {
    try {
      await stripe.paymentIntents.capture(paymentIntentId);
    } catch (error) {
      throw new Error(`Failed to release escrow payment: ${error}`);
    }
  }

  /**
   * Refund escrow payment
   */
  static async refundEscrowPayment(
    paymentIntentId: string,
    amount?: number,
    reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' = 'requested_by_customer'
  ): Promise<void> {
    try {
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason
      });
    } catch (error) {
      throw new Error(`Failed to refund escrow payment: ${error}`);
    }
  }

  /**
   * Create customer for recurring billing
   */
  static async createCustomer(
    email: string,
    name: string,
    metadata: Record<string, string> = {}
  ): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata
      });

      return customer.id;
    } catch (error) {
      throw new Error(`Failed to create customer: ${error}`);
    }
  }

  /**
   * Create subscription for premium features
   */
  static async createSubscription(
    customerId: string,
    priceId: string,
    metadata: Record<string, string> = {}
  ): Promise<string> {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata
      });

      return subscription.id;
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error}`);
    }
  }

  /**
   * Get account information
   */
  static async getAccount(accountId: string): Promise<ConnectedAccount> {
    try {
      const account = await stripe.accounts.retrieve(accountId);

      return {
        id: account.id,
        email: account.email || '',
        verified: account.details_submitted || false,
        payoutsEnabled: account.payouts_enabled || false,
        chargesEnabled: account.charges_enabled || false,
        requirements: account.requirements!
      };
    } catch (error) {
      throw new Error(`Failed to get account: ${error}`);
    }
  }

  /**
   * Get payment intent status
   */
  static async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret!
      };
    } catch (error) {
      throw new Error(`Failed to get payment intent: ${error}`);
    }
  }

  /**
   * Get platform balance
   */
  static async getPlatformBalance(): Promise<{ available: number; pending: number }> {
    try {
      const balance = await stripe.balance.retrieve();
      
      const availableUSD = balance.available.find(b => b.currency === 'usd');
      const pendingUSD = balance.pending.find(b => b.currency === 'usd');

      return {
        available: availableUSD?.amount || 0,
        pending: pendingUSD?.amount || 0
      };
    } catch (error) {
      throw new Error(`Failed to get platform balance: ${error}`);
    }
  }

  /**
   * Create instant payout to vendor
   */
  static async createInstantPayout(
    accountId: string,
    amount: number,
    currency: string = 'usd'
  ): Promise<void> {
    try {
      await stripe.transfers.create({
        amount,
        currency,
        destination: accountId,
        metadata: {
          type: 'instant_payout'
        }
      });
    } catch (error) {
      throw new Error(`Failed to create instant payout: ${error}`);
    }
  }

  /**
   * Handle webhook events
   */
  static async handleWebhook(
    payload: string,
    signature: string,
    endpointSecret: string
  ): Promise<Stripe.Event> {
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
      return event;
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error}`);
    }
  }

  /**
   * Get vendor earning analytics
   */
  static async getVendorEarnings(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalEarnings: number;
    paymentCount: number;
    averagePayment: number;
  }> {
    try {
      const transfers = await stripe.transfers.list({
        destination: accountId,
        created: {
          gte: Math.floor(startDate.getTime() / 1000),
          lte: Math.floor(endDate.getTime() / 1000)
        },
        limit: 100
      });

      const totalEarnings = transfers.data.reduce((sum, transfer) => sum + transfer.amount, 0);
      const paymentCount = transfers.data.length;
      const averagePayment = paymentCount > 0 ? totalEarnings / paymentCount : 0;

      return {
        totalEarnings,
        paymentCount,
        averagePayment
      };
    } catch (error) {
      throw new Error(`Failed to get vendor earnings: ${error}`);
    }
  }
}