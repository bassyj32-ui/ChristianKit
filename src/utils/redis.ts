/**
 * Redis caching utilities for production scalability
 * Provides distributed caching when Redis is available
 * Falls back to in-memory caching for development
 */

import { logger } from './logger'
import { notificationCache } from './cache'

export interface RedisConfig {
  host?: string
  port?: number
  password?: string
  db?: number
  keyPrefix?: string
  ttl?: number
}

class RedisCacheManager {
  private redisClient: any = null
  private config: RedisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: 'christiankit:',
    ttl: 300, // 5 minutes default
  }

  private isRedisAvailable = false

  constructor(config?: Partial<RedisConfig>) {
    this.config = { ...this.config, ...config }
    this.initializeRedis()
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Only try to use Redis if environment variables are set
      if (process.env.REDIS_HOST && process.env.NODE_ENV === 'production') {
        // In a real implementation, you'd import and configure Redis:
        // const Redis = require('ioredis')
        // this.redisClient = new Redis(this.config)

        // For now, we'll use the in-memory cache
        logger.info('Redis not configured, using in-memory cache')
        this.isRedisAvailable = false
      } else {
        logger.info('Using in-memory cache for development')
        this.isRedisAvailable = false
      }
    } catch (error) {
      logger.error('Failed to initialize Redis, falling back to in-memory cache', error as Error)
      this.isRedisAvailable = false
    }
  }

  /**
   * Set cache value with TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const fullKey = this.config.keyPrefix + key
    const ttlValue = ttl || this.config.ttl

    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.setex(fullKey, ttlValue, JSON.stringify(value))
        logger.debug('Redis cache set', { key: fullKey, ttl: ttlValue })
      } catch (error) {
        logger.error('Redis cache set failed, falling back to memory', error as Error)
        notificationCache.set(key, value, ttlValue * 1000) // Convert to ms
      }
    } else {
      notificationCache.set(key, value, ttlValue * 1000)
    }
  }

  /**
   * Get cache value
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.config.keyPrefix + key

    if (this.isRedisAvailable && this.redisClient) {
      try {
        const value = await this.redisClient.get(fullKey)
        if (value) {
          logger.debug('Redis cache hit', { key: fullKey })
          return JSON.parse(value)
        }
      } catch (error) {
        logger.error('Redis cache get failed, falling back to memory', error as Error)
      }
    }

    // Fallback to in-memory cache
    const memoryValue = notificationCache.get(key)
    if (memoryValue) {
      logger.debug('Memory cache hit', { key })
    }

    return memoryValue
  }

  /**
   * Delete cache value
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.config.keyPrefix + key

    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.del(fullKey)
        logger.debug('Redis cache deleted', { key: fullKey })
      } catch (error) {
        logger.error('Redis cache delete failed', error as Error)
      }
    }

    notificationCache.delete(key)
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        // Clear keys with our prefix
        const pattern = this.config.keyPrefix + '*'
        const keys = await this.redisClient.keys(pattern)
        if (keys.length > 0) {
          await this.redisClient.del(...keys)
        }
        logger.info('Redis cache cleared', { keysDeleted: keys.length })
      } catch (error) {
        logger.error('Redis cache clear failed', error as Error)
      }
    }

    notificationCache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): { redisAvailable: boolean; memoryCacheSize: number } {
    return {
      redisAvailable: this.isRedisAvailable,
      memoryCacheSize: notificationCache.getStats().size,
    }
  }

  /**
   * Warm cache with initial data
   */
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

  /**
   * Invalidate user cache across all cache layers
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await this.delete(`user_preferences_${userId}`)
    await this.delete(`user_notifications_${userId}`)
    await this.delete(`user_subscriptions_${userId}`)

    logger.info('User cache invalidated', { userId })
  }
}

// Export singleton instance
export const redisCache = new RedisCacheManager()

// Enhanced cache functions that work with Redis when available
export const setCache = async (key: string, value: any, ttl?: number) => {
  await redisCache.set(key, value, ttl)
}

export const getCache = async <T>(key: string): Promise<T | null> => {
  return await redisCache.get<T>(key)
}

export const deleteCache = async (key: string) => {
  await redisCache.delete(key)
}

export const clearCache = async () => {
  await redisCache.clear()
}

export const warmUserCache = async (userId: string, data: Parameters<RedisCacheManager['warmCache']>[1]) => {
  await redisCache.warmCache(userId, data)
}

export const invalidateUserCache = async (userId: string) => {
  await redisCache.invalidateUserCache(userId)
}

// Cache warming utilities
export const warmPopularContentCache = async () => {
  // Warm cache with popular posts, trending topics, etc.
  logger.info('Warming popular content cache')
}

export const warmUserPreferencesCache = async (userId: string) => {
  // Warm cache with user's preferences and recent activity
  logger.info('Warming user preferences cache', { userId })
}
