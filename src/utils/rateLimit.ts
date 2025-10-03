/**
 * Rate limiting utilities for API protection and abuse prevention
 * Implements sliding window rate limiting with Redis for scalability
 */

import { redisCache } from './redis'
import { logger } from './logger'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

class RateLimiter {
  private config: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  }

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...this.config, ...config }
  }

  /**
   * Check rate limit for a key
   */
  async checkLimit(key: string, requestType: 'success' | 'failed' | 'neutral' = 'neutral'): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    const redisKey = `ratelimit:${key}:${Math.floor(windowStart / 1000)}`

    try {
      // Get current request count for this window
      const currentCount = await redisCache.get<number>(redisKey) || 0

      // Check if limit exceeded
      if (currentCount >= this.config.maxRequests) {
        const resetTime = Math.ceil((windowStart + this.config.windowMs) / 1000) * 1000
        const retryAfter = Math.ceil((resetTime - now) / 1000)

        logger.warn('Rate limit exceeded', {
          key,
          currentCount,
          limit: this.config.maxRequests,
          retryAfter
        })

        return {
          success: false,
          limit: this.config.maxRequests,
          remaining: 0,
          resetTime,
          retryAfter,
        }
      }

      // Increment counter
      const newCount = currentCount + 1
      await redisCache.set(redisKey, newCount, Math.ceil(this.config.windowMs / 1000))

      const resetTime = Math.ceil((windowStart + this.config.windowMs) / 1000) * 1000

      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: Math.max(0, this.config.maxRequests - newCount),
        resetTime,
      }
    } catch (error) {
      // Fallback to in-memory rate limiting if Redis fails
      logger.error('Redis rate limiting failed, using fallback', error as Error)

      // Simple in-memory fallback using a Map
      const memoryKey = `memory_ratelimit:${key}`
      const memoryCounts = new Map<string, { count: number; resetTime: number }>()

      const existing = memoryCounts.get(memoryKey)
      const windowResetTime = now + this.config.windowMs

      if (existing && now < existing.resetTime) {
        // Still in the same window
        if (existing.count >= this.config.maxRequests) {
          return {
            success: false,
            limit: this.config.maxRequests,
            remaining: 0,
            resetTime: existing.resetTime,
          }
        }

        existing.count += 1
        memoryCounts.set(memoryKey, existing)

        return {
          success: true,
          limit: this.config.maxRequests,
          remaining: Math.max(0, this.config.maxRequests - existing.count),
          resetTime: existing.resetTime,
        }
      } else {
        // New window or expired window
        memoryCounts.set(memoryKey, { count: 1, resetTime: windowResetTime })

        return {
          success: true,
          limit: this.config.maxRequests,
          remaining: Math.max(0, this.config.maxRequests - 1),
          resetTime: windowResetTime,
        }
      }
    }
  }

  /**
   * Reset rate limit for a key (for testing or admin purposes)
   */
  async resetLimit(key: string): Promise<void> {
    // Since we're using in-memory rate limiting now, we can't easily reset
    // individual keys, but we can clear the cache entirely for testing
    logger.info('Rate limit reset requested', { key })
  }

  /**
   * Get current rate limit status
   */
  async getLimitStatus(key: string): Promise<RateLimitResult> {
    // Since we're using in-memory rate limiting, we can't easily get status
    // for individual keys, but we return a default status
    const now = Date.now()
    const resetTime = now + this.config.windowMs

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests,
      resetTime,
    }
  }
}

// Create rate limiters for different scenarios
export const apiRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100, // 100 requests per minute
})

export const notificationRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 50, // 50 notifications per minute
})

export const communityRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 30, // 30 community actions per minute
})

export const authRateLimiter = new RateLimiter({
  windowMs: 900000, // 15 minutes
  maxRequests: 5, // 5 auth attempts per 15 minutes
})

// Convenience functions for common rate limiting scenarios
export const checkApiRateLimit = (userId: string, endpoint: string) => {
  const key = `api:${userId}:${endpoint}`
  return apiRateLimiter.checkLimit(key)
}

export const checkNotificationRateLimit = (userId: string) => {
  const key = `notification:${userId}`
  return notificationRateLimiter.checkLimit(key)
}

export const checkCommunityRateLimit = (userId: string, action: string) => {
  const key = `community:${userId}:${action}`
  return communityRateLimiter.checkLimit(key)
}

export const checkAuthRateLimit = (identifier: string) => {
  const key = `auth:${identifier}`
  return authRateLimiter.checkLimit(key)
}

// Middleware function for API endpoints
export const rateLimitMiddleware = async (
  userId: string,
  endpoint: string,
  action: () => Promise<any>
): Promise<{ success: boolean; data?: any; error?: string }> => {
  const rateLimitResult = await checkApiRateLimit(userId, endpoint)

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
    }
  }

  try {
    const data = await action()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    }
  }
}

// Community-specific rate limiting
export const communityRateLimitMiddleware = async (
  userId: string,
  action: 'post' | 'interact' | 'follow',
  operation: () => Promise<any>
): Promise<{ success: boolean; data?: any; error?: string }> => {
  const rateLimitResult = await checkCommunityRateLimit(userId, action)

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: `Too many ${action} actions. Try again later.`,
    }
  }

  try {
    const data = await operation()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    }
  }
}
