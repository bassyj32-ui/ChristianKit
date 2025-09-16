export interface AnalyticsEvent {
  event: string
  properties: Record<string, any>
  timestamp: number
  userId?: string
}

export interface GrowthMetrics {
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  userRetention: {
    day1: number
    day7: number
    day30: number
  }
  conversionRate: {
    freeToPro: number
    trialToPro: number
  }
  viralCoefficient: number
  referralRate: number
  churnRate: number
}

export class AnalyticsService {
  private static instance: AnalyticsService
  private events: AnalyticsEvent[] = []
  private isOnline = navigator.onLine

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true
      this.flushEvents()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  // Track user events
  track(event: string, properties: Record<string, any> = {}, userId?: string) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      userId
    }

    this.events.push(analyticsEvent)

    // Send immediately if online, otherwise queue for later
    if (this.isOnline) {
      this.sendEvent(analyticsEvent)
    }

    // Store in localStorage for offline sync
    this.storeEvent(analyticsEvent)
  }

  // Track page views
  trackPageView(page: string, userId?: string) {
    this.track('page_view', { page }, userId)
  }

  // Track user actions
  trackUserAction(action: string, properties: Record<string, any> = {}, userId?: string) {
    this.track('user_action', { action, ...properties }, userId)
  }

  // Track conversion events
  trackConversion(event: string, value?: number, userId?: string) {
    this.track('conversion', { event, value }, userId)
  }

  // Track viral events
  trackViralEvent(event: string, properties: Record<string, any> = {}, userId?: string) {
    this.track('viral_event', { event, ...properties }, userId)
  }

  // Track referral events
  trackReferral(referrerCode: string, newUserId: string) {
    this.track('referral', { referrerCode, newUserId }, newUserId)
  }

  // Track sharing events
  trackShare(platform: string, content: string, userId?: string) {
    this.track('share', { platform, content }, userId)
  }

  // Track engagement events
  trackEngagement(feature: string, duration?: number, userId?: string) {
    this.track('engagement', { feature, duration }, userId)
  }

  // Track retention events
  trackRetention(day: number, userId?: string) {
    this.track('retention', { day }, userId)
  }

  // Track churn events
  trackChurn(reason?: string, userId?: string) {
    this.track('churn', { reason }, userId)
  }

  // Send event to analytics service
  private async sendEvent(event: AnalyticsEvent) {
    try {
      // In a real app, you would send to your analytics service
      // For now, we'll just log it
      console.log('Analytics Event:', event)
      
      // Example: Send to Google Analytics, Mixpanel, or custom endpoint
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // })
    } catch (error) {
      console.error('Failed to send analytics event:', error)
    }
  }

  // Store event in localStorage for offline sync
  private storeEvent(event: AnalyticsEvent) {
    try {
      const stored = localStorage.getItem('analytics_events')
      const events = stored ? JSON.parse(stored) : []
      events.push(event)
      
      // Keep only last 100 events to prevent storage bloat
      if (events.length > 100) {
        events.splice(0, events.length - 100)
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(events))
    } catch (error) {
      console.error('Failed to store analytics event:', error)
    }
  }

  // Flush queued events when back online
  private async flushEvents() {
    try {
      const stored = localStorage.getItem('analytics_events')
      if (stored) {
        const events = JSON.parse(stored)
        for (const event of events) {
          await this.sendEvent(event)
        }
        localStorage.removeItem('analytics_events')
      }
    } catch (error) {
      console.error('Failed to flush analytics events:', error)
    }
  }

  // Get growth metrics (mock data for now)
  getGrowthMetrics(): GrowthMetrics {
    return {
      dailyActiveUsers: 150,
      weeklyActiveUsers: 850,
      monthlyActiveUsers: 3200,
      userRetention: {
        day1: 0.75,
        day7: 0.45,
        day30: 0.25
      },
      conversionRate: {
        freeToPro: 0.08,
        trialToPro: 0.15
      },
      viralCoefficient: 1.2,
      referralRate: 0.12,
      churnRate: 0.05
    }
  }

  // Get user journey data
  getUserJourney(userId: string) {
    return this.events.filter(event => event.userId === userId)
  }

  // Get feature usage data
  getFeatureUsage(feature: string) {
    return this.events.filter(event => 
      event.event === 'engagement' && 
      event.properties.feature === feature
    )
  }

  // Get conversion funnel data
  getConversionFunnel() {
    const funnel = {
      visitors: this.events.filter(e => e.event === 'page_view').length,
      signups: this.events.filter(e => e.event === 'user_action' && e.properties.action === 'signup').length,
      activations: this.events.filter(e => e.event === 'user_action' && e.properties.action === 'first_prayer').length,
      conversions: this.events.filter(e => e.event === 'conversion').length
    }

    return {
      ...funnel,
      signupRate: funnel.visitors > 0 ? funnel.signups / funnel.visitors : 0,
      activationRate: funnel.signups > 0 ? funnel.activations / funnel.signups : 0,
      conversionRate: funnel.activations > 0 ? funnel.conversions / funnel.activations : 0
    }
  }

  // Get viral metrics
  getViralMetrics() {
    const shares = this.events.filter(e => e.event === 'share').length
    const referrals = this.events.filter(e => e.event === 'referral').length
    const users = new Set(this.events.map(e => e.userId)).size

    return {
      sharesPerUser: users > 0 ? shares / users : 0,
      referralsPerUser: users > 0 ? referrals / users : 0,
      viralCoefficient: referrals > 0 ? referrals / users : 0
    }
  }
}

export const analyticsService = AnalyticsService.getInstance()