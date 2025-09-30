import { CacheService } from '../utils/cache';

export interface CacheStrategy {
  ttl: number; // Time to live in seconds
  maxSize?: number; // Maximum number of items
  priority: 'low' | 'medium' | 'high';
  invalidationPatterns?: string[]; // Patterns to invalidate when this cache changes
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  metadata?: Record<string, any>;
}

export interface CacheStats {
  totalKeys: number;
  hitRate: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

export class EnhancedCacheService {
  private static instance: EnhancedCacheService;
  private cacheService: CacheService;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private accessLog: Map<string, number[]> = new Map();
  private strategies: Map<string, CacheStrategy> = new Map();
  
  // Default cache strategies for different content types
  private static readonly DEFAULT_STRATEGIES: Record<string, CacheStrategy> = {
    // User data - cache for 1 hour, high priority
    user_profile: { ttl: 3600, priority: 'high' },
    user_settings: { ttl: 7200, priority: 'high' },
    
    // Community content - cache for 15 minutes, medium priority
    posts: { ttl: 900, priority: 'medium', maxSize: 1000 },
    trending_posts: { ttl: 300, priority: 'medium', maxSize: 100 },
    post_interactions: { ttl: 600, priority: 'medium' },
    
    // Bible content - cache for 24 hours, low priority
    bible_verses: { ttl: 86400, priority: 'low' },
    bible_books: { ttl: 604800, priority: 'low' }, // 1 week
    
    // Analytics - cache for 5 minutes, medium priority
    analytics: { ttl: 300, priority: 'medium' },
    
    // Search results - cache for 10 minutes, medium priority
    search_results: { ttl: 600, priority: 'medium', maxSize: 500 },
    
    // Notifications - cache for 1 minute, high priority
    notifications: { ttl: 60, priority: 'high' },
    
    // API responses - cache for 30 seconds, low priority
    api_responses: { ttl: 30, priority: 'low' }
  };

  private constructor() {
    this.cacheService = new CacheService({} as any); // Placeholder for now
    this.initializeStrategies();
    this.startCleanupInterval();
  }

  public static getInstance(): EnhancedCacheService {
    if (!EnhancedCacheService.instance) {
      EnhancedCacheService.instance = new EnhancedCacheService();
    }
    return EnhancedCacheService.instance;
  }

  /**
   * Initialize default cache strategies
   */
  private initializeStrategies(): void {
    for (const [key, strategy] of Object.entries(EnhancedCacheService.DEFAULT_STRATEGIES)) {
      this.strategies.set(key, strategy);
    }
  }

  /**
   * Get cached value with intelligent fallback
   */
  public async get<T>(
    key: string,
    category: string = 'general',
    fallback?: () => Promise<T>
  ): Promise<T | null> {
    try {
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && this.isValid(memoryEntry, category)) {
        this.updateAccessStats(key, memoryEntry);
        return memoryEntry.value;
      }

      // Check persistent cache
      const cached = await this.cacheService.get<T>(key);
      if (cached !== null) {
        // Store in memory cache for faster access
        const entry: CacheEntry<T> = {
          value: cached,
          timestamp: Date.now(),
          accessCount: 1,
          lastAccessed: Date.now()
        };
        this.memoryCache.set(key, entry);
        this.updateAccessStats(key, entry);
        return cached;
      }

      // Execute fallback if provided
      if (fallback) {
        const value = await fallback();
        await this.set(key, value, category);
        return value;
      }

      return null;
    } catch (error) {
      console.error('Enhanced cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached value with strategy-based TTL
   */
  public async set<T>(
    key: string,
    value: T,
    category: string = 'general',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const strategy = this.strategies.get(category) || this.strategies.get('general') || { ttl: 300, priority: 'medium' };
      
      // Create cache entry
      const entry: CacheEntry<T> = {
        value,
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now(),
        metadata
      };

      // Store in memory cache
      this.memoryCache.set(key, entry);
      
      // Store in persistent cache with TTL
      await this.cacheService.set(key, value, {
        expirationTtl: strategy.ttl
      });

      // Enforce size limits
      this.enforceSizeLimits(category);
      
      // Update access statistics
      this.updateAccessStats(key, entry);
      
      // Handle cache invalidation patterns
      this.handleInvalidationPatterns(key, category);
      
    } catch (error) {
      console.error('Enhanced cache set error:', error);
    }
  }

  /**
   * Get or set with intelligent caching
   */
  public async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    category: string = 'general'
  ): Promise<T> {
    const cached = await this.get<T>(key, category);
    if (cached !== null) {
      return cached;
    }

    const value = await fallback();
    await this.set(key, value, category);
    return value;
  }

  /**
   * Invalidate cache by pattern
   */
  public async invalidate(pattern: string): Promise<void> {
    try {
      const keysToDelete: string[] = [];
      
      // Find keys matching pattern
      for (const key of this.memoryCache.keys()) {
        if (key.includes(pattern) || this.matchesPattern(key, pattern)) {
          keysToDelete.push(key);
        }
      }

      // Delete from memory cache
      for (const key of keysToDelete) {
        this.memoryCache.delete(key);
        this.accessLog.delete(key);
      }

      // Delete from persistent cache
      for (const key of keysToDelete) {
        await this.cacheService.delete(key);
      }

      // Cache entries invalidated for pattern
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Invalidate all caches for a specific category
   */
  public async invalidateCategory(category: string): Promise<void> {
    try {
      const keysToDelete: string[] = [];
      
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.metadata?.category === category) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        this.memoryCache.delete(key);
        this.accessLog.delete(key);
        await this.cacheService.delete(key);
      }

      // Cache entries invalidated for category
    } catch (error) {
      console.error('Category invalidation error:', error);
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  public async warmup(keys: string[], category: string = 'general'): Promise<void> {
    try {
      for (const key of keys) {
        // Check if already cached
        const cached = await this.get(key, category);
        if (cached === null) {
          // Store placeholder to trigger fallback on first access
          await this.set(key, null as any, category, { warming: true });
        }
      }
    } catch (error) {
      console.error('Cache warmup error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const now = Date.now();
    const keys = Array.from(this.memoryCache.keys());
    
    let totalHits = 0;
    let totalAccesses = 0;
    let oldestTimestamp = now;
    let newestTimestamp = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      const accessCount = this.accessLog.get(key)?.length || 0;
      totalHits += entry.accessCount;
      totalAccesses += accessCount;
      
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
      if (entry.timestamp > newestTimestamp) {
        newestTimestamp = entry.timestamp;
      }
    }

    return {
      totalKeys: keys.length,
      hitRate: totalAccesses > 0 ? totalHits / totalAccesses : 0,
      memoryUsage: this.estimateMemoryUsage(),
      oldestEntry: oldestTimestamp,
      newestEntry: newestTimestamp
    };
  }

  /**
   * Clear all caches
   */
  public async clear(): Promise<void> {
    try {
      this.memoryCache.clear();
      this.accessLog.clear();
      
      // Note: This would require a method to clear all persistent cache
      // await this.cacheService.clearAll();
      
      // All caches cleared
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry<any>, category: string): boolean {
    const strategy = this.strategies.get(category) || this.strategies.get('general');
    if (!strategy) return true;

    const now = Date.now();
    const age = (now - entry.timestamp) / 1000; // Convert to seconds
    
    return age < strategy.ttl;
  }

  /**
   * Update access statistics
   */
  private updateAccessStats(key: string, entry: CacheEntry<any>): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    if (!this.accessLog.has(key)) {
      this.accessLog.set(key, []);
    }
    
    const log = this.accessLog.get(key)!;
    log.push(Date.now());
    
    // Keep only last 100 access times
    if (log.length > 100) {
      log.splice(0, log.length - 100);
    }
  }

  /**
   * Enforce size limits for cache categories
   */
  private enforceSizeLimits(category: string): void {
    const strategy = this.strategies.get(category);
    if (!strategy?.maxSize) return;

    const categoryKeys = Array.from(this.memoryCache.keys()).filter(key => {
      const entry = this.memoryCache.get(key);
      return entry?.metadata?.category === category;
    });

    if (categoryKeys.length > strategy.maxSize!) {
      // Remove least recently used entries
      const sortedKeys = categoryKeys.sort((a, b) => {
        const entryA = this.memoryCache.get(a)!;
        const entryB = this.memoryCache.get(b)!;
        return entryA.lastAccessed - entryB.lastAccessed;
      });

      const keysToRemove = sortedKeys.slice(0, categoryKeys.length - strategy.maxSize!);
      for (const key of keysToRemove) {
        this.memoryCache.delete(key);
        this.accessLog.delete(key);
      }
    }
  }

  /**
   * Handle cache invalidation patterns
   */
  private handleInvalidationPatterns(key: string, category: string): void {
    const strategy = this.strategies.get(category);
    if (!strategy?.invalidationPatterns) return;

    for (const pattern of strategy.invalidationPatterns) {
      if (this.matchesPattern(key, pattern)) {
        // Invalidate related caches
        this.invalidate(pattern);
      }
    }
  }

  /**
   * Check if key matches pattern
   */
  private matchesPattern(key: string, pattern: string): boolean {
    // Simple pattern matching - can be enhanced with regex
    return key.includes(pattern) || 
           key.startsWith(pattern) || 
           key.endsWith(pattern);
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, entry] of this.memoryCache.entries()) {
      // Rough estimation: key + value + metadata
      totalSize += key.length;
      totalSize += JSON.stringify(entry.value).length;
      totalSize += JSON.stringify(entry.metadata || {}).length;
      totalSize += 100; // Overhead for object structure
    }
    
    return totalSize;
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValid(entry, entry.metadata?.category || 'general')) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.memoryCache.delete(key);
      this.accessLog.delete(key);
    }

    if (keysToDelete.length > 0) {
      // Cleaned up expired cache entries
    }
  }

  /**
   * Add custom cache strategy
   */
  public addStrategy(category: string, strategy: CacheStrategy): void {
    this.strategies.set(category, strategy);
  }

  /**
   * Get cache strategy for category
   */
  public getStrategy(category: string): CacheStrategy | undefined {
    return this.strategies.get(category);
  }

  /**
   * Preload frequently accessed data
   */
  public async preload(keys: string[], category: string = 'general'): Promise<void> {
    // This would be implemented based on your specific data loading needs
    // Preloading items for category
  }
}

// Export singleton instance
export const enhancedCacheService = EnhancedCacheService.getInstance();
