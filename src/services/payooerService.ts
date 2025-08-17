import { auth } from '../config/firebase';

export interface PayooerPaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface PayooerSubscription {
  id: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  planId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  paymentMethodId: string;
}

export interface PayooerPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}

export class PayooerService {
  private apiKey: string;
  private merchantId: string;
  private baseUrl: string;
  private webhookSecret: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_PAYOOER_API_KEY || '';
    this.merchantId = import.meta.env.VITE_PAYOOER_MERCHANT_ID || '';
    this.baseUrl = import.meta.env.VITE_PAYOOER_BASE_URL || 'https://api.payooer.com';
    this.webhookSecret = import.meta.env.VITE_PAYOOER_WEBHOOK_SECRET || '';
  }

  // Initialize Payooer with user authentication
  async initialize(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Initialize Payooer SDK (this would be the actual SDK initialization)
      console.log('Payooer initialized for user:', user.uid);
      return true;
    } catch (error) {
      console.error('Failed to initialize Payooer:', error);
      return false;
    }
  }

  // Create a new subscription
  async createSubscription(
    planId: string,
    paymentMethodId: string,
    userId: string
  ): Promise<PayooerSubscription> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          payment_method_id: paymentMethodId,
          customer_id: userId,
          metadata: {
            user_id: userId,
            app: 'christian-kit'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Payooer API error: ${response.statusText}`);
      }

      const subscription = await response.json();
      return this.mapPayooerSubscription(subscription);
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  // Get available plans
  async getPlans(): Promise<PayooerPlan[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/plans`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Payooer API error: ${response.statusText}`);
      }

      const plans = await response.json();
      return plans.data.map((plan: any) => this.mapPayooerPlan(plan));
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      throw error;
    }
  }

  // Get user's active subscription
  async getSubscription(subscriptionId: string): Promise<PayooerSubscription | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/subscriptions/${subscriptionId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Payooer API error: ${response.statusText}`);
      }

      const subscription = await response.json();
      return this.mapPayooerSubscription(subscription);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<PayooerSubscription> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancel_at_period_end: cancelAtPeriodEnd
        })
      });

      if (!response.ok) {
        throw new Error(`Payooer API error: ${response.statusText}`);
      }

      const subscription = await response.json();
      return this.mapPayooerSubscription(subscription);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  // Add payment method
  async addPaymentMethod(
    type: 'card' | 'bank' | 'paypal',
    token: string,
    userId: string
  ): Promise<PayooerPaymentMethod> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payment_methods`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          token,
          customer_id: userId,
          metadata: {
            user_id: userId,
            app: 'christian-kit'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Payooer API error: ${response.statusText}`);
      }

      const paymentMethod = await response.json();
      return this.mapPayooerPaymentMethod(paymentMethod);
    } catch (error) {
      console.error('Failed to add payment method:', error);
      throw error;
    }
  }

  // Get user's payment methods
  async getPaymentMethods(userId: string): Promise<PayooerPaymentMethod[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/customers/${userId}/payment_methods`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Payooer API error: ${response.statusText}`);
      }

      const paymentMethods = await response.json();
      return paymentMethods.data.map((method: any) => this.mapPayooerPaymentMethod(method));
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      throw error;
    }
  }

  // Remove payment method
  async removePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payment_methods/${paymentMethodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to remove payment method:', error);
      return false;
    }
  }

  // Process one-time payment
  async processPayment(
    amount: number,
    currency: string,
    paymentMethodId: string,
    description: string,
    userId: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/charges`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          payment_method_id: paymentMethodId,
          description,
          customer_id: userId,
          metadata: {
            user_id: userId,
            app: 'christian-kit'
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment failed');
      }

      const charge = await response.json();
      return {
        success: true,
        transactionId: charge.id
      };
    } catch (error) {
      console.error('Payment processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      };
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      // This is a simplified verification - in production, use proper crypto verification
      const expectedSignature = this.generateWebhookSignature(payload);
      return signature === expectedSignature;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  // Handle webhook events
  async handleWebhook(event: any): Promise<void> {
    try {
      switch (event.type) {
        case 'subscription.created':
          await this.handleSubscriptionCreated(event.data);
          break;
        case 'subscription.updated':
          await this.handleSubscriptionUpdated(event.data);
          break;
        case 'subscription.cancelled':
          await this.handleSubscriptionCancelled(event.data);
          break;
        case 'payment.succeeded':
          await this.handlePaymentSucceeded(event.data);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(event.data);
          break;
        default:
          console.log('Unhandled webhook event:', event.type);
      }
    } catch (error) {
      console.error('Webhook handling failed:', error);
    }
  }

  // Private helper methods
  private mapPayooerSubscription(data: any): PayooerSubscription {
    return {
      id: data.id,
      status: data.status,
      planId: data.plan_id,
      currentPeriodStart: new Date(data.current_period_start * 1000),
      currentPeriodEnd: new Date(data.current_period_end * 1000),
      cancelAtPeriodEnd: data.cancel_at_period_end,
      paymentMethodId: data.default_payment_method
    };
  }

  private mapPayooerPlan(data: any): PayooerPlan {
    return {
      id: data.id,
      name: data.name,
      price: data.amount / 100, // Convert from cents
      currency: data.currency.toUpperCase(),
      interval: data.interval,
      features: data.metadata?.features || []
    };
  }

  private mapPayooerPaymentMethod(data: any): PayooerPaymentMethod {
    return {
      id: data.id,
      type: data.type,
      last4: data.card?.last4,
      brand: data.card?.brand,
      expiryMonth: data.card?.exp_month,
      expiryYear: data.card?.exp_year,
      isDefault: data.metadata?.is_default === 'true'
    };
  }

  private generateWebhookSignature(payload: string): string {
    // In production, use proper HMAC-SHA256 signature generation
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
  }

  private async handleSubscriptionCreated(data: any): Promise<void> {
    console.log('Subscription created:', data.id);
    // Update local user subscription status
    // Trigger welcome email/notification
  }

  private async handleSubscriptionUpdated(data: any): Promise<void> {
    console.log('Subscription updated:', data.id);
    // Update local subscription data
    // Sync with cloud database
  }

  private async handleSubscriptionCancelled(data: any): Promise<void> {
    console.log('Subscription cancelled:', data.id);
    // Update local subscription status
    // Trigger cancellation email/notification
  }

  private async handlePaymentSucceeded(data: any): Promise<void> {
    console.log('Payment succeeded:', data.id);
    // Update payment status
    // Trigger success notification
  }

  private async handlePaymentFailed(data: any): Promise<void> {
    console.log('Payment failed:', data.id);
    // Update payment status
    // Trigger failure notification
    // Attempt retry logic
  }
}

// Export singleton instance
export const payooerService = new PayooerService();
