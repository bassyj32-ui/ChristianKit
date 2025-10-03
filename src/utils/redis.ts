/**
 * Browser-Safe Cache Manager (Redis Completely Disabled)
 * - Uses only in-memory caching for all environments
 * - No Redis dependencies or process.env usage
 * - Ready for Redis integration when reaching 10k+ users
 */

import { logger } from './logger'

// Browser-safe cache implementation with LRU eviction
class BrowserSafeCache {
  private cache = new Map<string, { value: any; expires: number; lastAccessed: number }>()
  private maxSize = 2000 // Increased from 1000 for better 1k user support

  set(key: string, value: any, ttlMs: number = 5 * 60 * 1000) {
    const expires = Date.now() + ttlMs
    const lastAccessed = Date.now()

    // If at max capacity, remove least recently used item
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU()
    }

    this.cache.set(key, { value, expires, lastAccessed })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }

    // Update last accessed time for LRU
    item.lastAccessed = Date.now()
    this.cache.set(key, item)

    return item.value as T
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  private evictLRU() {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    // Find the least recently used item
    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  getStats() {
    return {
      type: 'memory',
      size: this.cache.size,
      maxSize: this.maxSize,
      // Estimate memory usage (rough calculation)
      estimatedMemoryMB: Math.round(this.cache.size * 0.1 / 1024 / 1024 * 100) / 100, // Assume 0.1KB per entry average
    }
  }
}

// Single cache instance for all environments
const cache = new BrowserSafeCache()

export interface CacheConfig {
  keyPrefix?: string
  ttl?: number
}

class SimpleCacheManager {
  private config: CacheConfig

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      keyPrefix: 'christiankit:',
      ttl: 300, // 5 minutes default
      ...config,
    }
  }

  /**
   * Set cache value with TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const ttlValue = ttl || this.config.ttl!
      const fullKey = this.config.keyPrefix + key
      // Cache expects milliseconds
      cache.set(fullKey, value, ttlValue * 1000)
    } catch (error) {
      logger.error('Cache set failed', error as Error)
    }
  }

  /**
   * Get cache value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.config.keyPrefix + key
      return cache.get<T>(fullKey)
    } catch (error) {
      logger.error('Cache get failed', error as Error)
      return null
    }
  }

  /**
   * Delete cache value
   */
  async delete(key: string): Promise<void> {
    try {
      const fullKey = this.config.keyPrefix + key
      cache.delete(fullKey)
    } catch (error) {
      logger.error('Cache delete failed', error as Error)
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      cache.clear()
    } catch (error) {
      logger.error('Cache clear failed', error as Error)
    }
  }

  getStats() {
    const stats = cache.getStats()
    return {
      cacheType: stats.type,
      available: true,
      size: stats.size,
      maxSize: stats.maxSize,
      estimatedMemoryMB: stats.estimatedMemoryMB,
    }
  }

  async warmCache(userId: string, data: {
    preferences?: any
    notifications?: any[]
    subscriptions?: any[]
  }): Promise<void> {
    if (data.preferences) {
      await this.set(`user_preferences_${userId}`, data.preferences)
    }
    if (data.notifications) {
      await this.set(`user_notifications_${userId}`, data.notifications)
    }
    if (data.subscriptions) {
      await this.set(`user_subscriptions_${userId}`, data.subscriptions)
    }
    logger.info('Cache warmed for user', { userId, dataTypes: Object.keys(data) })
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.delete(`user_preferences_${userId}`)
    await this.delete(`user_notifications_${userId}`)
    await this.delete(`user_subscriptions_${userId}`)
    logger.info('User cache invalidated', { userId })
  }
}

// Singleton instance - completely Redis-free for now
export const redisCache = new SimpleCacheManager()

// Helper exports
export const setCache = (key: string, value: any, ttl?: number) => redisCache.set(key, value, ttl)
export const getCache = <T>(key: string) => redisCache.get<T>(key)
export const deleteCache = (key: string) => redisCache.delete(key)
export const clearCache = () => redisCache.clear()
export const warmUserCache = (userId: string, data: Parameters<SimpleCacheManager['warmCache']>[1]) =>
  redisCache.warmCache(userId, data)
export const invalidateUserCache = (userId: string) =>
  redisCache.invalidateUserCache(userId)

// Extra warmers
export const warmPopularContentCache = async () => {
  logger.info('Warming popular content cache')
}
export const warmUserPreferencesCache = async (userId: string) => {
  logger.info('Warming user preferences cache', { userId })
}
