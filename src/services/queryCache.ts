/**
 * Query Result Caching System
 * Provides multi-level caching for improved performance
 */

export interface CacheConfig {
  ttl: number // Time to live in milliseconds
  maxSize?: number // Maximum cache size
  storage?: 'memory' | 'localStorage' | 'sessionStorage'
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export class QueryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private config: Required<CacheConfig>

  constructor(config: CacheConfig) {
    this.config = {
      maxSize: 100,
      storage: 'memory',
      ...config
    }

    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), 60000) // Every minute
  }

  /**
   * Generate cache key from query parameters
   */
  private generateKey(query: string, params?: any): string {
    const paramsStr = params ? JSON.stringify(params) : ''
    return `${query}:${paramsStr}`
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, customTtl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: customTtl || this.config.ttl
    }

    // Check size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, entry)

    // Persist to storage if configured
    if (this.config.storage !== 'memory') {
      this.persistToStorage(key, entry)
    }
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      // Try loading from storage
      if (this.config.storage !== 'memory') {
        const stored = this.loadFromStorage(key)
        if (stored) {
          this.cache.set(key, stored)
          return this.isValid(stored) ? stored.data : null
        }
      }
      return null
    }

    if (!this.isValid(entry)) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Check if cache entry is valid (not expired)
   */
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Evict oldest entry when cache is full
   */
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTimestamp = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Persist cache entry to storage
   */
  private persistToStorage(key: string, entry: CacheEntry<any>): void {
    try {
      const storage = this.config.storage === 'localStorage' ? localStorage : sessionStorage
      storage.setItem(`cache:${key}`, JSON.stringify(entry))
    } catch (error) {
      console.warn('Failed to persist cache entry:', error)
    }
  }

  /**
   * Load cache entry from storage
   */
  private loadFromStorage(key: string): CacheEntry<any> | null {
    try {
      const storage = this.config.storage === 'localStorage' ? localStorage : sessionStorage
      const stored = storage.getItem(`cache:${key}`)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      return null
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()

    if (this.config.storage !== 'memory') {
      try {
        const storage = this.config.storage === 'localStorage' ? localStorage : sessionStorage
        const keys = Object.keys(storage).filter(key => key.startsWith('cache:'))
        keys.forEach(key => storage.removeItem(key))
      } catch (error) {
        console.warn('Failed to clear storage cache:', error)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size
    }
  }
}

// Global cache instances for different data types
export const userProfileCache = new QueryCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 200,
  storage: 'memory'
})

export const postsCache = new QueryCache({
  ttl: 2 * 60 * 1000, // 2 minutes
  maxSize: 500,
  storage: 'memory'
})

export const notificationsCache = new QueryCache({
  ttl: 1 * 60 * 1000, // 1 minute
  maxSize: 100,
  storage: 'memory'
})

export const followsCache = new QueryCache({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 300,
  storage: 'memory'
})

// Cache key generators for consistent cache keys
export const cacheKeys = {
  userProfile: (userId: string) => `user_profile:${userId}`,
  userPosts: (userId: string, page?: number) => `user_posts:${userId}:${page || 0}`,
  feedPosts: (page?: number, limit?: number) => `feed_posts:${page || 0}:${limit || 20}`,
  userNotifications: (userId: string, unreadOnly?: boolean) => `notifications:${userId}:${unreadOnly || false}`,
  followStatus: (followerId: string, followingId: string) => `follow_status:${followerId}:${followingId}`,
  trendingPosts: (timeframe?: string) => `trending_posts:${timeframe || 'hourly'}`
}










