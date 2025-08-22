// Analytics Service - Tracks user engagement and app usage
export interface AnalyticsEvent {
  eventName: string;
  userId?: string;
  timestamp: Date;
  properties?: Record<string, any>;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private isEnabled: boolean = true;

  trackEvent(eventName: string, userId?: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;
    
    const event: AnalyticsEvent = {
      eventName,
      userId,
      timestamp: new Date(),
      properties
    };

    this.events.push(event);
    console.log('📊 Analytics Event:', event);
  }

  trackPrayerSession(userId: string, duration: number, focus: string): void {
    this.trackEvent('prayer_session_completed', userId, { duration, focus });
  }

  trackBibleSession(userId: string, duration: number, book: string): void {
    this.trackEvent('bible_session_completed', userId, { duration, book });
  }

  getUserMetrics(userId: string): any {
    const stored = localStorage.getItem(`analytics_${userId}`);
    return stored ? JSON.parse(stored) : null;
  }

  updateUserMetrics(userId: string, updates: any): void {
    const current = this.getUserMetrics(userId) || { userId, totalPrayerTime: 0, prayerStreak: 0 };
    const updated = { ...current, ...updates, lastActive: new Date() };
    localStorage.setItem(`analytics_${userId}`, JSON.stringify(updated));
  }
}

export const analyticsService = new AnalyticsService();
export default AnalyticsService;
