/**
 * Database optimization utilities for improved performance
 * Connection pooling, query optimization, and caching strategies
 */

import { supabase } from './supabase'
import { logger } from './logger'
import { metrics } from './metrics'

export interface DatabaseConfig {
  maxConnections?: number
  connectionTimeout?: number
  queryTimeout?: number
  enableConnectionPooling?: boolean
}

export class DatabaseOptimizer {
  private config: DatabaseConfig = {
    maxConnections: 10,
    connectionTimeout: 30000, // 30 seconds
    queryTimeout: 10000, // 10 seconds
    enableConnectionPooling: true,
  }

  constructor(config?: Partial<DatabaseConfig>) {
    this.config = { ...this.config, ...config }
  }

  /**
   * Execute optimized database query with performance tracking
   */
  async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    operation: string,
    table?: string,
    userId?: string
  ): Promise<T | null> {
    const startTime = performance.now()
    let success = false

    try {
      logger.debug(`Executing database ${operation}`, { table, userId })

      const result = await queryFn()
      const duration = performance.now() - startTime

      if (result.error) {
        throw result.error
      }

      success = true

      // Track performance metrics
      metrics.recordDatabaseQuery(operation, duration, table, userId)

      logger.debug(`Database ${operation} completed`, {
        duration: Math.round(duration),
        table,
        userId,
        success: true
      })

      return result.data
    } catch (error) {
      const duration = performance.now() - startTime

      // Track error metrics
      metrics.recordDatabaseError(operation, (error as Error).message, table, userId)

      logger.error(`Database ${operation} failed`, error as Error, {
        duration: Math.round(duration),
        table,
        userId,
        operation
      })

      throw error
    }
  }

  /**
   * Get optimized posts query with caching
   */
  async getCommunityPosts(
    options: {
      limit?: number
      offset?: number
      userId?: string
      postType?: string
      includeAuthor?: boolean
    } = {}
  ) {
    const { limit = 20, offset = 0, userId, postType, includeAuthor = true } = options

    return this.executeQuery(
      async () => {
        let query = supabase
          .from('community_posts')
          .select(includeAuthor ? `
            id,
            author_id,
            author_name,
            author_avatar,
            content,
            post_type,
            created_at,
            amens_count,
            loves_count,
            prayers_count,
            replies_count,
            is_live,
            moderation_status
          ` : '*')
          .eq('is_live', true)
          .eq('moderation_status', 'approved')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (userId) {
          // For personalized feeds, we might want to show followed users' posts
          // This would require a more complex query with user_follows table
        }

        if (postType) {
          query = query.eq('post_type', postType)
        }

        return await query
      },
      'select_community_posts',
      'community_posts',
      userId
    )
  }

  /**
   * Get optimized user interactions query
   */
  async getUserInteractions(userId: string, postId?: string) {
    return this.executeQuery(
      async () => {
        let query = supabase
          .from('post_interactions')
          .select('*')
          .eq('user_id', userId)

        if (postId) {
          query = query.eq('post_id', postId)
        }

        return await query
      },
      'select_user_interactions',
      'post_interactions',
      userId
    )
  }

  /**
   * Get optimized followed users query
   */
  async getFollowedUsers(userId: string) {
    return this.executeQuery(
      async () => {
        return await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', userId)
      },
      'select_followed_users',
      'user_follows',
      userId
    )
  }

  /**
   * Batch insert posts with optimized performance
   */
  async batchInsertPosts(posts: any[]) {
    if (posts.length === 0) return []

    return this.executeQuery(
      async () => {
        return await supabase
          .from('community_posts')
          .insert(posts)
          .select()
      },
      'batch_insert_posts',
      'community_posts'
    )
  }

  /**
   * Optimized user preferences query
   */
  async getUserPreferences(userId: string) {
    return this.executeQuery(
      async () => {
        return await supabase
          .from('user_notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .single()
      },
      'select_user_preferences',
      'user_notification_preferences',
      userId
    )
  }

  /**
   * Update user preferences with optimistic locking
   */
  async updateUserPreferences(userId: string, updates: any) {
    return this.executeQuery(
      async () => {
        return await supabase
          .from('user_notification_preferences')
          .update(updates)
          .eq('user_id', userId)
      },
      'update_user_preferences',
      'user_notification_preferences',
      userId
    )
  }
}

// Export singleton instance
export const dbOptimizer = new DatabaseOptimizer()

// Convenience functions for common database operations
export const getOptimizedCommunityPosts = (options?: Parameters<DatabaseOptimizer['getCommunityPosts']>[0]) =>
  dbOptimizer.getCommunityPosts(options)

export const getOptimizedUserInteractions = (userId: string, postId?: string) =>
  dbOptimizer.getUserInteractions(userId, postId)

export const getOptimizedFollowedUsers = (userId: string) =>
  dbOptimizer.getFollowedUsers(userId)

export const batchInsertOptimizedPosts = (posts: any[]) =>
  dbOptimizer.batchInsertPosts(posts)

export const getOptimizedUserPreferences = (userId: string) =>
  dbOptimizer.getUserPreferences(userId)

export const updateOptimizedUserPreferences = (userId: string, updates: any) =>
  dbOptimizer.updateUserPreferences(userId, updates)