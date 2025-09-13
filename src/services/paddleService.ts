import { supabase } from '../utils/supabase';

export interface PaddleSubscription {
  id: string;
  status: 'active' | 'cancelled' | 'past_due' | 'deleted';
  planId: string;
  nextPayment: Date;
  cancelUrl: string;
  updateUrl: string;
}

export interface PaddlePlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  paddleProductId: string;
}

export interface PaddleCheckoutData {
  product_id: string;
  email: string;
  passthrough?: string;
  return_url: string;
  cancel_url: string;
}

export class PaddleService {
  private vendorId: string;
  private vendorAuthCode: string;
  private publicKey: string;
  private environment: string;
  private baseUrl: string;

  constructor() {
    this.vendorId = import.meta.env.VITE_PADDLE_VENDOR_ID || '';
    this.vendorAuthCode = import.meta.env.VITE_PADDLE_VENDOR_AUTH_CODE || '';
    this.publicKey = import.meta.env.VITE_PADDLE_PUBLIC_KEY || '';
    this.environment = import.meta.env.VITE_PADDLE_ENVIRONMENT || 'sandbox';
    this.baseUrl = this.environment === 'sandbox' 
      ? 'https://sandbox-vendors.paddle.com' 
      : 'https://vendors.paddle.com';
  }

  // Initialize Paddle with user authentication
  async initialize(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Paddle initialized for user:', user.id);
      return true;
    } catch (error) {
      console.error('Failed to initialize Paddle:', error);
      return false;
    }
  }

  // Get available plans
  async getPlans(): Promise<PaddlePlan[]> {
    // Return predefined plans for ChristianKit
    return [
      {
        id: 'christiankit_pro_monthly',
        name: 'ChristianKit Pro Monthly',
        price: 3.00,
        currency: 'USD',
        interval: 'month',
        features: [
          'Daily Re-Engagement System',
          'Advanced Weekly Progress Tracking',
          'Monthly Habit Builder',
          'Community Prayer Requests',
          'Premium Support'
        ],
        paddleProductId: 'pro_monthly_001' // Replace with your actual Paddle product ID
      },
      {
        id: 'christiankit_pro_yearly',
        name: 'ChristianKit Pro Yearly',
        price: 30.00,
        currency: 'USD',
        interval: 'year',
        features: [
          'Daily Re-Engagement System',
          'Advanced Weekly Progress Tracking',
          'Monthly Habit Builder',
          'Community Prayer Requests',
          'Premium Support',
          '17% Savings vs Monthly'
        ],
        paddleProductId: 'pro_yearly_001' // Replace with your actual Paddle product ID
      }
    ];
  }

  // Create checkout session
  async createCheckout(plan: PaddlePlan, userEmail: string): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const checkoutData: PaddleCheckoutData = {
        product_id: plan.paddleProductId,
        email: userEmail,
        passthrough: JSON.stringify({
          user_id: user?.id,
          plan_id: plan.id,
          app: 'christian-kit'
        }),
        return_url: `${window.location.origin}/subscription/success`,
        cancel_url: `${window.location.origin}/subscription`
      };

      const response = await fetch(`${this.baseUrl}/api/2.0/product/generate_pay_link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          vendor_id: this.vendorId,
          vendor_auth_code: this.vendorAuthCode,
          ...checkoutData
        })
      });

      if (!response.ok) {
        throw new Error(`Paddle API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.response.pay_link;
      } else {
        throw new Error(result.error?.message || 'Failed to create checkout');
      }
    } catch (error) {
      console.error('Failed to create checkout:', error);
      throw error;
    }
  }

  // Get user's active subscription
  async getSubscription(subscriptionId: string): Promise<PaddleSubscription | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/2.0/subscription/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          vendor_id: this.vendorId,
          vendor_auth_code: this.vendorAuthCode,
          subscription_id: subscriptionId
        })
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Paddle API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.response.length > 0) {
        const subscription = result.response[0];
        return this.mapPaddleSubscription(subscription);
      }
      
      return null;
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/2.0/subscription/users_cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          vendor_id: this.vendorId,
          vendor_auth_code: this.vendorAuthCode,
          subscription_id: subscriptionId
        })
      });

      if (!response.ok) {
        throw new Error(`Paddle API error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      // In production, implement proper Paddle webhook signature verification
      // For now, return true for development
      return true;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  // Handle webhook events
  async handleWebhook(event: any): Promise<void> {
    try {
      switch (event.event_type) {
        case 'subscription.created':
          await this.handleSubscriptionCreated(event);
          break;
        case 'subscription.updated':
          await this.handleSubscriptionUpdated(event);
          break;
        case 'subscription.cancelled':
          await this.handleSubscriptionCancelled(event);
          break;
        case 'subscription.payment_succeeded':
          await this.handlePaymentSucceeded(event);
          break;
        case 'subscription.payment_failed':
          await this.handlePaymentFailed(event);
          break;
        default:
          console.log('Unhandled webhook event:', event.event_type);
      }
    } catch (error) {
      console.error('Webhook handling failed:', error);
    }
  }

  // Private helper methods
  private mapPaddleSubscription(data: any): PaddleSubscription {
    return {
      id: data.subscription_id,
      status: data.state,
      planId: data.product_id,
      nextPayment: new Date(data.next_payment?.date || Date.now()),
      cancelUrl: data.cancel_url,
      updateUrl: data.update_url
    };
  }

  private async handleSubscriptionCreated(event: any): Promise<void> {
    console.log('Subscription created:', event.subscription_id);
    // Update local user subscription status
    // Trigger welcome email/notification
  }

  private async handleSubscriptionUpdated(event: any): Promise<void> {
    console.log('Subscription updated:', event.subscription_id);
    // Update local subscription data
    // Sync with cloud database
  }

  private async handleSubscriptionCancelled(event: any): Promise<void> {
    console.log('Subscription cancelled:', event.subscription_id);
    // Update local subscription status
    // Trigger cancellation email/notification
  }

  private async handlePaymentSucceeded(event: any): Promise<void> {
    console.log('Payment succeeded:', event.subscription_id);
    // Update payment status
    // Trigger success notification
  }

  private async handlePaymentFailed(event: any): Promise<void> {
    console.log('Payment failed:', event.subscription_id);
    // Update payment status
    // Trigger failure notification
    // Attempt retry logic
  }
}

// Export singleton instance
export const paddleService = new PaddleService();
