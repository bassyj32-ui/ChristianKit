/**
 * Performance metrics and monitoring utility
 * Tracks key performance indicators for the notification system
 */

export interface MetricData {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
  userId?: string
  notificationId?: string
  sessionId?: string
  component?: string
  operation?: string
  metadata?: Record<string, any>
}

export interface PerformanceTimer {
  name: string
  startTime: number
  endTime?: number
  duration?: number
}

class MetricsCollector {
  private metrics: MetricData[] = []
  private activeTimers: Map<string, PerformanceTimer> = new Map()
  private maxMetrics: number = 1000 // Keep last 1000 metrics

  // Core metrics
  startTimer(name: string, userId?: string, notificationId?: string): () => void {
    const startTime = performance.now()
    const timer: PerformanceTimer = {
      name,
      startTime,
    }

    this.activeTimers.set(name, timer)

    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime

      timer.endTime = endTime
      timer.duration = duration

      this.recordMetric('timer', duration, {
        timer_name: name,
        user_id: userId,
        notification_id: notificationId,
      })

      this.activeTimers.delete(name)
    }
  }

  recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>,
    userId?: string,
    notificationId?: string,
    sessionId?: string,
    component?: string,
    operation?: string,
    metadata?: Record<string, any>
  ): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      tags,
      userId,
      notificationId,
      sessionId,
      component,
      operation,
      metadata,
    }

    this.metrics.push(metric)

    // Keep only recent metrics to prevent memory issues
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  // Notification-specific metrics
  recordNotificationSent(
    notificationType: string,
    deliveryMethod: 'push' | 'email',
    duration: number,
    userId: string,
    notificationId: string,
    component: string = 'NotificationService'
  ): void {
    this.recordMetric('notification_sent', 1, {
      type: notificationType,
      delivery_method: deliveryMethod,
      duration_ms: duration.toString(),
    }, userId, notificationId, undefined, component, 'send_notification', {
      notificationType,
      deliveryMethod,
      duration
    })
  }

  recordNotificationFailed(
    notificationType: string,
    deliveryMethod: 'push' | 'email',
    error: string,
    userId?: string,
    notificationId?: string,
    component: string = 'NotificationService'
  ): void {
    this.recordMetric('notification_failed', 1, {
      type: notificationType,
      delivery_method: deliveryMethod,
      error,
    }, userId, notificationId, undefined, component, 'send_notification', {
      notificationType,
      deliveryMethod,
      error
    })
  }

  recordSubscriptionCleanup(subscriptionId: string, reason: string, userId?: string): void {
    this.recordMetric('subscription_cleanup', 1, {
      subscription_id: subscriptionId,
      reason,
    }, userId, undefined, undefined, 'NotificationService', 'subscription_cleanup', {
      subscriptionId,
      reason
    })
  }

  // Database performance metrics
  recordDatabaseQuery(operation: string, duration: number, table?: string, userId?: string): void {
    this.recordMetric('db_query', duration, {
      operation,
      table,
    }, userId, undefined, undefined, 'Database', operation, {
      operation,
      table,
      duration
    })
  }

  recordDatabaseError(operation: string, error: string, table?: string, userId?: string): void {
    this.recordMetric('db_error', 1, {
      operation,
      error,
      table,
    }, userId, undefined, undefined, 'Database', operation, {
      operation,
      error,
      table
    })
  }

  // User engagement metrics
  recordNotificationRead(userId: string, notificationId: string, timeToRead: number): void {
    this.recordMetric('notification_read', timeToRead, {
      time_to_read_ms: timeToRead.toString(),
    }, userId, notificationId, undefined, 'UserInterface', 'notification_read', {
      timeToRead,
      notificationId,
      userId
    })
  }

  recordNotificationInteraction(
    action: 'click' | 'dismiss' | 'ignore',
    userId: string,
    notificationId: string,
    component: string = 'NotificationCenter'
  ): void {
    this.recordMetric('notification_interaction', 1, {
      action,
    }, userId, notificationId, undefined, component, action, {
      action,
      notificationId,
      userId
    })
  }

  // System health metrics
  recordSystemHealth(metric: string, value: number, metadata?: Record<string, any>): void {
    this.recordMetric('system_health', value, { metric }, undefined, undefined, undefined, 'SystemMonitor', metric, metadata)
  }

  recordMemoryUsage(used: number, total: number): void {
    this.recordMetric('memory_usage', used, {
      used_mb: Math.round(used / 1024 / 1024).toString(),
      total_mb: Math.round(total / 1024 / 1024).toString(),
      percentage: ((used / total) * 100).toFixed(1)
    }, undefined, undefined, undefined, 'PerformanceMonitor', 'memory_usage', {
      used,
      total,
      percentage: (used / total) * 100
    })
  }

  recordErrorRate(errors: number, total: number): void {
    const rate = total > 0 ? (errors / total) * 100 : 0
    this.recordMetric('error_rate', rate, {
      errors: errors.toString(),
      total: total.toString(),
      rate_percentage: rate.toFixed(2)
    }, undefined, undefined, undefined, 'ErrorMonitor', 'error_rate', {
      errors,
      total,
      rate
    })
  }

  // API performance metrics
  recordApiPerformance(endpoint: string, method: string, duration: number, statusCode: number, userId?: string): void {
    this.recordMetric('api_performance', duration, {
      endpoint,
      method,
      status_code: statusCode.toString(),
      duration_ms: duration.toString()
    }, userId, undefined, undefined, 'API', `${method}_${endpoint}`, {
      endpoint,
      method,
      duration,
      statusCode
    })
  }

  // Get metrics for analysis
  getMetrics(name?: string, limit: number = 100): MetricData[] {
    let filtered = this.metrics

    if (name) {
      filtered = filtered.filter(m => m.name === name)
    }

    return filtered.slice(-limit)
  }

  // Get metrics by component
  getMetricsByComponent(component: string, limit: number = 100): MetricData[] {
    return this.metrics
      .filter(m => m.component === component)
      .slice(-limit)
  }

  // Get metrics by user
  getMetricsByUser(userId: string, limit: number = 100): MetricData[] {
    return this.metrics
      .filter(m => m.userId === userId)
      .slice(-limit)
  }

  // Get recent errors
  getRecentErrors(limit: number = 20): MetricData[] {
    return this.metrics
      .filter(m => m.name.includes('error') || m.name.includes('fail'))
      .slice(-limit)
  }

  // Get aggregated metrics
  getAggregatedMetrics(name: string, timeWindow: number = 60000): { count: number; average: number; min: number; max: number } {
    const now = Date.now()
    const recent = this.metrics.filter(
      m => m.name === name && (now - m.timestamp) <= timeWindow
    )

    if (recent.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0 }
    }

    const values = recent.map(m => m.value)
    const sum = values.reduce((a, b) => a + b, 0)

    return {
      count: recent.length,
      average: sum / recent.length,
      min: Math.min(...values),
      max: Math.max(...values),
    }
  }

  // Get active timers
  getActiveTimers(): PerformanceTimer[] {
    return Array.from(this.activeTimers.values())
  }

  // Clear old metrics (for memory management)
  clearOldMetrics(olderThanMs: number = 3600000): void { // 1 hour default
    const cutoff = Date.now() - olderThanMs
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
  }

  // Export metrics for external monitoring
  exportMetrics(): MetricData[] {
    return [...this.metrics]
  }
}

// Export singleton instance
export const metrics = new MetricsCollector()

// Enhanced convenience functions for structured metrics
export const startNotificationTimer = (userId: string, notificationId: string, component: string = 'NotificationService') =>
  metrics.startTimer(`notification-${notificationId}`, userId, notificationId, component)

export const recordNotificationDelivery = (
  type: string,
  method: 'push' | 'email',
  duration: number,
  userId: string,
  notificationId: string,
  component: string = 'NotificationService'
) => {
  metrics.recordNotificationSent(type, method, duration, userId, notificationId, component)
}

export const recordNotificationFailure = (
  type: string,
  method: 'push' | 'email',
  error: string,
  userId?: string,
  notificationId?: string,
  component: string = 'NotificationService'
) => {
  metrics.recordNotificationFailed(type, method, error, userId, notificationId, component)
}

// Additional convenience functions
export const trackUserAction = (action: string, userId: string, metadata?: Record<string, any>) => {
  metrics.recordMetric('user_action', 1, { action }, userId, undefined, undefined, 'UserInterface', action, metadata)
}

export const trackApiCall = (endpoint: string, method: string, duration: number, statusCode: number, userId?: string) => {
  metrics.recordApiPerformance(endpoint, method, duration, statusCode, userId)
}

export const trackDatabaseOperation = (operation: string, table: string, duration: number, success: boolean, userId?: string) => {
  if (success) {
    metrics.recordDatabaseQuery(operation, duration, table, userId)
  } else {
    metrics.recordDatabaseError(operation, 'unknown', table, userId)
  }
}


