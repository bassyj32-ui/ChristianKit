export interface CacheOptions {
  expirationTtl?: number; // Time to live in seconds
  expiration?: number; // Absolute expiration timestamp
}

export class CacheService {
  constructor(private kv: KVNamespace) {}

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.kv.put(key, serializedValue, options);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Get multiple values from cache
   */
  async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.kv.getMany(keys);
      return values.map((value: string | null) => value ? JSON.parse(value) : null);
    } catch (error) {
      console.error('Cache getMany error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values in cache
   */
  async setMany<T>(entries: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<void> {
    try {
      const operations = entries.map(({ key, value, options }) => ({
        key,
        value: JSON.stringify(value),
        options
      }));
      
      await this.kv.putMany(operations);
    } catch (error) {
      console.error('Cache setMany error:', error);
    }
  }

  /**
   * Cache with fallback function
   */
  async getOrSet<T>(
    key: string, 
    fallback: () => Promise<T>, 
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fallback();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Cache user data with user-specific key
   */
  async setUserCache<T>(userId: number, key: string, value: T, options?: CacheOptions): Promise<void> {
    const cacheKey = `user:${userId}:${key}`;
    await this.set(cacheKey, value, options);
  }

  /**
   * Get user data from cache
   */
  async getUserCache<T>(userId: number, key: string): Promise<T | null> {
    const cacheKey = `user:${userId}:${key}`;
    return await this.get<T>(cacheKey);
  }

  /**
   * Clear all user cache
   */
  async clearUserCache(userId: number): Promise<void> {
    try {
      // Note: This is a simplified approach. In production, you might want to
      // implement a more sophisticated cache invalidation strategy
      const keys = await this.kv.list({ prefix: `user:${userId}:` });
      if (keys.keys.length > 0) {
        // Delete keys one by one since delete only accepts a single key
        for (const key of keys.keys) {
          await this.kv.delete(key.name);
        }
      }
    } catch (error) {
      console.error('Clear user cache error:', error);
    }
  }

  /**
   * Health check for cache
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const testKey = 'health-check';
      const testValue = { status: 'ok', timestamp: new Date().toISOString() };
      
      await this.set(testKey, testValue, { expirationTtl: 60 });
      const retrieved = await this.get(testKey);
      
      if (retrieved && (retrieved as any).status === 'ok') {
        await this.delete(testKey);
        return { status: 'healthy', timestamp: new Date().toISOString() };
      } else {
        return { status: 'unhealthy', timestamp: new Date().toISOString() };
      }
    } catch (error) {
      return { status: 'error', timestamp: new Date().toISOString() };
    }
  }
}
