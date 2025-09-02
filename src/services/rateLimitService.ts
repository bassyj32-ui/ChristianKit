import { supabase } from '../utils/supabase';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimitService {
  private static instance: RateLimitService;
  private memoryStore: Map<string, { count: number; resetTime: number }> = new Map();
  
  // Default rate limit configurations
  private static readonly DEFAULT_LIMITS = {
    POST_CREATION: { maxRequests: 3, windowMs: 60000, keyPrefix: 'post_create' }, // 3 posts per minute
    INTERACTION: { maxRequests: 10, windowMs: 60000, keyPrefix: 'interaction' }, // 10 interactions per minute
    PRAYER: { maxRequests: 5, windowMs: 60000, keyPrefix: 'prayer' }, // 5 prayers per minute
    LOGIN: { maxRequests: 5, windowMs: 300000, keyPrefix: 'login' }, // 5 login attempts per 5 minutes
    API_CALLS: { maxRequests: 100, windowMs: 60000, keyPrefix: 'api' }, // 100 API calls per minute
  };

  private constructor() {}

  public static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  /**
   * Check if a user can perform an action based on rate limits
   */
  public async checkRateLimit(
    userId: string,
    actionType: keyof typeof RateLimitService.DEFAULT_LIMITS,
    customConfig?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const config = { ...RateLimitService.DEFAULT_LIMITS[actionType], ...customConfig };
    const key = `${config.keyPrefix}:${userId}`;
    
    try {
      // Check memory store first for performance
      const memoryResult = this.checkMemoryStore(key, config);
      if (memoryResult) {
        return memoryResult;
      }

      // Fallback to database check
      return await this.checkDatabaseStore(key, config);
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow the request if rate limiting fails
      return { allowed: true, remaining: 1, resetTime: Date.now() + config.windowMs };
    }
  }

  /**
   * Record a rate-limited action
   */
  public async recordAction(
    userId: string,
    actionType: keyof typeof RateLimitService.DEFAULT_LIMITS
  ): Promise<void> {
    const config = RateLimitService.DEFAULT_LIMITS[actionType];
    const key = `${config.keyPrefix}:${userId}`;
    
    try {
      // Update memory store
      this.updateMemoryStore(key, config);
      
      // Update database store
      await this.updateDatabaseStore(key, config);
    } catch (error) {
      console.error('Failed to record rate limit action:', error);
    }
  }

  /**
   * Reset rate limits for a user (useful for admin actions)
   */
  public async resetRateLimit(
    userId: string,
    actionType: keyof typeof RateLimitService.DEFAULT_LIMITS
  ): Promise<void> {
    const config = RateLimitService.DEFAULT_LIMITS[actionType];
    const key = `${config.keyPrefix}:${userId}`;
    
    // Clear from memory
    this.memoryStore.delete(key);
    
    // Clear from database
    try {
      await supabase
        .from('rate_limits')
        .delete()
        .eq('key', key);
    } catch (error) {
      console.error('Failed to reset rate limit in database:', error);
    }
  }

  /**
   * Get current rate limit status for a user
   */
  public async getRateLimitStatus(
    userId: string,
    actionType: keyof typeof RateLimitService.DEFAULT_LIMITS
  ): Promise<RateLimitResult> {
    const config = RateLimitService.DEFAULT_LIMITS[actionType];
    const key = `${config.keyPrefix}:${userId}`;
    
    try {
      const { data } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('key', key)
        .single();

      if (!data) {
        return { allowed: true, remaining: config.maxRequests, resetTime: Date.now() + config.windowMs };
      }

      const now = Date.now();
      const resetTime = data.reset_time;
      const isExpired = now > resetTime;

      if (isExpired) {
        // Reset expired window
        await this.resetRateLimit(userId, actionType);
        return { allowed: true, remaining: config.maxRequests, resetTime: now + config.windowMs };
      }

      const remaining = Math.max(0, config.maxRequests - data.count);
      return {
        allowed: remaining > 0,
        remaining,
        resetTime,
        retryAfter: remaining === 0 ? resetTime - now : undefined
      };
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return { allowed: true, remaining: config.maxRequests, resetTime: Date.now() + config.windowMs };
    }
  }

  private checkMemoryStore(key: string, config: RateLimitConfig): RateLimitResult | null {
    const now = Date.now();
    const stored = this.memoryStore.get(key);
    
    if (!stored) {
      return null;
    }

    if (now > stored.resetTime) {
      // Expired, remove from memory
      this.memoryStore.delete(key);
      return null;
    }

    const remaining = Math.max(0, config.maxRequests - stored.count);
    return {
      allowed: remaining > 0,
      remaining,
      resetTime: stored.resetTime,
      retryAfter: remaining === 0 ? stored.resetTime - now : undefined
    };
  }

  private updateMemoryStore(key: string, config: RateLimitConfig): void {
    const now = Date.now();
    const stored = this.memoryStore.get(key);
    
    if (stored && now <= stored.resetTime) {
      stored.count += 1;
    } else {
      this.memoryStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
    }
  }

  private async checkDatabaseStore(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    
    const { data } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('key', key)
      .single();

    if (!data) {
      return { allowed: true, remaining: config.maxRequests, resetTime: now + config.windowMs };
    }

    if (now > data.reset_time) {
      // Expired, reset
      await supabase
        .from('rate_limits')
        .delete()
        .eq('key', key);
      
      return { allowed: true, remaining: config.maxRequests, resetTime: now + config.windowMs };
    }

    const remaining = Math.max(0, config.maxRequests - data.count);
    return {
      allowed: remaining > 0,
      remaining,
      resetTime: data.reset_time,
      retryAfter: remaining === 0 ? data.reset_time - now : undefined
    };
  }

  private async updateDatabaseStore(key: string, config: RateLimitConfig): Promise<void> {
    const now = Date.now();
    
    const { data: existing } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('key', key)
      .single();

    if (existing && now <= existing.reset_time) {
      // Update existing record
      await supabase
        .from('rate_limits')
        .update({ count: existing.count + 1 })
        .eq('key', key);
    } else {
      // Create new record or update expired one
      await supabase
        .from('rate_limits')
        .upsert({
          key,
          count: 1,
          reset_time: now + config.windowMs,
          created_at: now
        });
    }
  }

  /**
   * Clean up expired entries from memory store
   */
  public cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.memoryStore.entries()) {
      if (now > value.resetTime) {
        this.memoryStore.delete(key);
      }
    }
  }

  /**
   * Get all active rate limits for monitoring
   */
  public getActiveLimits(): Map<string, { count: number; resetTime: number }> {
    return new Map(this.memoryStore);
  }
}

// Export singleton instance
export const rateLimitService = RateLimitService.getInstance();

// Cleanup every 5 minutes
setInterval(() => {
  rateLimitService.cleanup();
}, 5 * 60 * 1000);
