import { supabase } from '../utils/supabase'
import { paddleService } from './paddleService'

export interface UserSubscription {
  tier: 'free' | 'pro'
  expiresAt?: string | null
  isActive: boolean
  features: {
    dailyReEngagement: boolean
    weeklyProgressTracking: boolean
    monthlyHabitBuilder: boolean
    communityPrayerRequests: boolean
    communityFeatures: boolean
    premiumSupport: boolean
  }
}

export interface ProFeatureCheck {
  hasAccess: boolean
  reason?: string
  upgradePrompt?: string
}

class SubscriptionService {
  private userSubscription: UserSubscription | null = null

  // Initialize user subscription data
  async initializeUserSubscription(userId: string): Promise<UserSubscription> {
    try {
      if (!supabase) {
        // Fallback to free tier for demo mode
        this.userSubscription = this.getFreeSubscription()
        return this.userSubscription
      }

      // Check if user has subscription record
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error)
        this.userSubscription = this.getFreeSubscription()
        return this.userSubscription
      }

      if (!subscription) {
        // Create free subscription record
        const freeSubscription = {
          user_id: userId,
          tier: 'free' as const,
          is_active: true,
          created_at: new Date().toISOString()
        }

        const { error: createError } = await supabase
          .from('user_subscriptions')
          .insert(freeSubscription)

        if (createError) {
          console.error('Error creating subscription record:', createError)
        }

        this.userSubscription = this.getFreeSubscription()
        return this.userSubscription
      }

      // Check if pro subscription is still active
      const isProActive = subscription.tier === 'pro' && 
        subscription.is_active && 
        (!subscription.expires_at || new Date(subscription.expires_at) > new Date())

      this.userSubscription = {
        tier: isProActive ? 'pro' : 'free',
        expiresAt: subscription.expires_at,
        isActive: subscription.is_active,
        features: isProActive ? this.getProFeatures() : this.getFreeFeatures()
      }

      return this.userSubscription

    } catch (error) {
      console.error('Error initializing subscription:', error)
      this.userSubscription = this.getFreeSubscription()
      return this.userSubscription
    }
  }

  // Get current user subscription
  getCurrentSubscription(): UserSubscription | null {
    return this.userSubscription
  }

  // Check if user has access to a specific pro feature
  checkProFeature(feature: keyof UserSubscription['features']): ProFeatureCheck {
    if (!this.userSubscription) {
      return {
        hasAccess: false,
        reason: 'Subscription not initialized',
        upgradePrompt: 'Please refresh the page and try again.'
      }
    }

    const hasAccess = this.userSubscription.features[feature]

    if (!hasAccess) {
      const featureNames = {
        dailyReEngagement: 'Daily Re-Engagement System',
        weeklyProgressTracking: 'Advanced Weekly Progress Tracking',
        monthlyHabitBuilder: 'Monthly Habit Builder',
        communityPrayerRequests: 'Community Prayer Requests',
        communityFeatures: 'Advanced Community Features',
        premiumSupport: 'Premium Support'
      }

      return {
        hasAccess: false,
        reason: 'Pro feature not available',
        upgradePrompt: `Upgrade to Pro to unlock ${featureNames[feature]} and grow your spiritual journey!`
      }
    }

    return { hasAccess: true }
  }

  // Upgrade user to pro
  async upgradeUserToPro(userId: string, expiresAt?: string): Promise<boolean> {
    try {
      if (!supabase) {
        // In demo mode, just update local state
        this.userSubscription = {
          tier: 'pro',
          expiresAt,
          isActive: true,
          features: this.getProFeatures()
        }
        localStorage.setItem('demo_subscription', JSON.stringify(this.userSubscription))
        return true
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          tier: 'pro',
          is_active: true,
          expires_at: expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Error upgrading subscription:', error)
        return false
      }

      // Update local state
      this.userSubscription = {
        tier: 'pro',
        expiresAt,
        isActive: true,
        features: this.getProFeatures()
      }

      return true

    } catch (error) {
      console.error('Error upgrading to pro:', error)
      return false
    }
  }

  // Check for demo pro access (for testing)
  checkDemoProAccess(): boolean {
    const demoSubscription = localStorage.getItem('demo_subscription')
    if (demoSubscription) {
      try {
        const subscription = JSON.parse(demoSubscription)
        return subscription.tier === 'pro'
      } catch {
        return false
      }
    }
    return false
  }

  // Enable demo pro for testing
  enableDemoPro(): void {
    const demoSubscription = {
      tier: 'pro' as const,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      isActive: true,
      features: this.getProFeatures()
    }
    
    this.userSubscription = demoSubscription
    localStorage.setItem('demo_subscription', JSON.stringify(demoSubscription))
  }

  // Disable demo pro
  disableDemoPro(): void {
    this.userSubscription = this.getFreeSubscription()
    localStorage.removeItem('demo_subscription')
  }

  private getFreeSubscription(): UserSubscription {
    return {
      tier: 'free',
      expiresAt: null,
      isActive: true,
      features: this.getFreeFeatures()
    }
  }

  private getFreeFeatures() {
    return {
      dailyReEngagement: false,
      weeklyProgressTracking: false,
      monthlyHabitBuilder: false,
      communityPrayerRequests: false,
      communityFeatures: false,
      premiumSupport: false
    }
  }

  private getProFeatures() {
    return {
      dailyReEngagement: true,
      weeklyProgressTracking: true,
      monthlyHabitBuilder: true,
      communityPrayerRequests: true,
      communityFeatures: true,
      premiumSupport: true
    }
  }
}

export const subscriptionService = new SubscriptionService()
