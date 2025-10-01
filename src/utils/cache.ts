/**
 * Caching utility for notification system performance optimization
 * Implements in-memory caching with TTL for frequently accessed data
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class NotificationCache {
  private cache = new Map<string, CacheEntry<any>>()
  private maxSize = 1000 // Maximum cache entries
  private defaultTTL = 300000 // 5 minutes default

  // Set cache entry with TTL
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  // Get cache entry if not expired
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  // Delete specific cache entry
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // Clear all cache entries
  clear(): void {
    this.cache.clear()
  }

  // Get cache statistics
  getStats(): {
    size: number
    maxSize: number
    hitRate: number // Would need to track hits/misses for accurate rate
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Placeholder - would need hit/miss tracking
    }
  }

  // Evict oldest entry (simple LRU)
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  // Cache warming for frequently accessed data
  warmCache(userId: string, data: {
    preferences?: any
    notifications?: any[]
    subscriptions?: any[]
  }): void {
    if (data.preferences) {
      this.set(`user_preferences_${userId}`, data.preferences)
    }

    if (data.notifications) {
      this.set(`user_notifications_${userId}`, data.notifications)
    }

    if (data.subscriptions) {
      this.set(`user_subscriptions_${userId}`, data.subscriptions)
    }
  }

  // Invalidate user-specific cache
  invalidateUserCache(userId: string): void {
    this.delete(`user_preferences_${userId}`)
    this.delete(`user_notifications_${userId}`)
    this.delete(`user_subscriptions_${userId}`)
  }
}

// Export singleton instance
export const notificationCache = new NotificationCache()

// Convenience functions for common caching patterns
export const cacheUserPreferences = (userId: string, preferences: any) => {
  notificationCache.set(`user_preferences_${userId}`, preferences, 600000) // 10 minutes
}

export const getCachedUserPreferences = (userId: string) => {
  return notificationCache.get(`user_preferences_${userId}`)
}

export const cacheUserNotifications = (userId: string, notifications: any[]) => {
  notificationCache.set(`user_notifications_${userId}`, notifications, 300000) // 5 minutes
}

export const getCachedUserNotifications = (userId: string) => {
  return notificationCache.get(`user_notifications_${userId}`)
}

export const cachePushSubscriptions = (userId: string, subscriptions: any[]) => {
  notificationCache.set(`user_subscriptions_${userId}`, subscriptions, 600000) // 10 minutes
}

export const getCachedPushSubscriptions = (userId: string) => {
  return notificationCache.get(`user_subscriptions_${userId}`)
}

// Cache invalidation helpers
export const invalidateUserCache = (userId: string) => {
  notificationCache.invalidateUserCache(userId)
}

export const clearAllCache = () => {
  notificationCache.clear()
}