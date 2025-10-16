/**
 * Performance Monitoring System
 * Tracks query performance and provides optimization insights
 */

export interface QueryMetrics {
  query: string
  executionTime: number
  timestamp: number
  cacheHit: boolean
  resultCount?: number
  error?: string
}

export interface PerformanceStats {
  totalQueries: number
  averageExecutionTime: number
  cacheHitRate: number
  slowQueries: QueryMetrics[]
  topQueries: Array<{
    query: string
    count: number
    avgTime: number
  }>
  errorRate: number
}

export class PerformanceMonitor {
  private metrics: QueryMetrics[] = []
  private maxMetrics = 1000 // Keep last 1000 metrics

  /**
   * Record query execution metrics
   */
  recordQuery(metrics: Omit<QueryMetrics, 'timestamp'>): void {
    const fullMetrics: QueryMetrics = {
      ...metrics,
      timestamp: Date.now()
    }

    this.metrics.push(fullMetrics)

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log slow queries (> 500ms)
    if (metrics.executionTime > 500) {
      console.warn('Slow query detected:', {
        query: metrics.query.substring(0, 100) + '...',
        time: metrics.executionTime + 'ms',
        cacheHit: metrics.cacheHit
      })
    }
  }

  /**
   * Get performance statistics
   */
  getStats(timeWindow: number = 3600000): PerformanceStats { // 1 hour default
    const cutoff = Date.now() - timeWindow
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoff)

    const totalQueries = recentMetrics.length
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length
    const errors = recentMetrics.filter(m => m.error).length

    // Calculate average execution time (excluding cache hits for fairness)
    const executedQueries = recentMetrics.filter(m => !m.cacheHit)
    const avgTime = executedQueries.length > 0
      ? executedQueries.reduce((sum, m) => sum + m.executionTime, 0) / executedQueries.length
      : 0

    // Find slow queries (> 200ms)
    const slowQueries = recentMetrics
      .filter(m => m.executionTime > 200)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10)

    // Find most frequent queries
    const queryCounts = new Map<string, { count: number, totalTime: number }>()
    recentMetrics.forEach(m => {
      const existing = queryCounts.get(m.query) || { count: 0, totalTime: 0 }
      queryCounts.set(m.query, {
        count: existing.count + 1,
        totalTime: existing.totalTime + m.executionTime
      })
    })

    const topQueries = Array.from(queryCounts.entries())
      .map(([query, stats]) => ({
        query: query.substring(0, 50) + '...',
        count: stats.count,
        avgTime: Math.round(stats.totalTime / stats.count)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalQueries,
      averageExecutionTime: Math.round(avgTime),
      cacheHitRate: totalQueries > 0 ? Math.round((cacheHits / totalQueries) * 100) : 0,
      slowQueries,
      topQueries,
      errorRate: totalQueries > 0 ? Math.round((errors / totalQueries) * 100) : 0
    }
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations(): Array<{
    type: 'index' | 'cache' | 'partition' | 'query'
    priority: 'high' | 'medium' | 'low'
    description: string
    impact: string
  }> {
    const stats = this.getStats()
    const recommendations = []

    // High priority recommendations
    if (stats.averageExecutionTime > 100) {
      recommendations.push({
        type: 'index',
        priority: 'high',
        description: 'Add indexes to frequently queried columns',
        impact: '2-10x query performance improvement'
      })
    }

    if (stats.cacheHitRate < 50) {
      recommendations.push({
        type: 'cache',
        priority: 'high',
        description: 'Implement query result caching for repeated queries',
        impact: '50-90% reduction in database load'
      })
    }

    if (stats.slowQueries.length > 5) {
      recommendations.push({
        type: 'query',
        priority: 'high',
        description: 'Optimize slow queries with better joins and filters',
        impact: 'Immediate performance improvement for slow operations'
      })
    }

    // Medium priority recommendations
    if (stats.errorRate > 5) {
      recommendations.push({
        type: 'query',
        priority: 'medium',
        description: 'Fix queries causing errors',
        impact: 'Improved reliability and user experience'
      })
    }

    // Low priority recommendations
    if (this.metrics.length > 500) {
      recommendations.push({
        type: 'partition',
        priority: 'low',
        description: 'Consider database partitioning for large tables',
        impact: 'Better performance for very large datasets'
      })
    }

    return recommendations
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): any {
    return {
      summary: this.getStats(),
      recommendations: this.getRecommendations(),
      rawMetrics: this.metrics.slice(-100) // Last 100 metrics
    }
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(daysToKeep: number = 7): void {
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff)
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Helper function to time async operations
export async function withPerformanceMonitoring<T>(
  operation: string,
  fn: () => Promise<T>,
  options?: {
    cacheHit?: boolean
    expectedResultCount?: number
  }
): Promise<T> {
  const startTime = performance.now()

  try {
    const result = await fn()
    const executionTime = performance.now() - startTime

    performanceMonitor.recordQuery({
      query: operation,
      executionTime: Math.round(executionTime),
      cacheHit: options?.cacheHit || false,
      resultCount: options?.expectedResultCount
    })

    return result
  } catch (error) {
    const executionTime = performance.now() - startTime

    performanceMonitor.recordQuery({
      query: operation,
      executionTime: Math.round(executionTime),
      cacheHit: false,
      error: error.message
    })

    throw error
  }
}










