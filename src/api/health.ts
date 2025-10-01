/**
 * Health check API for monitoring notification system status
 * Can be called by monitoring systems to ensure everything is working
 */

import { logger } from '../utils/logger'
import { metrics } from '../utils/metrics'
import { alerts, checkNotificationHealth } from '../utils/alerts'
import { getValidatedVapidPublicKey } from '../utils/vapidKeys'

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  checks: {
    database: HealthCheckStatus
    notifications: HealthCheckStatus
    vapid: HealthCheckStatus
    performance: HealthCheckStatus
  }
  metrics: {
    notifications_sent_last_hour: number
    notifications_failed_last_hour: number
    average_delivery_time: number
    active_subscriptions: number
  }
  alerts?: {
    count: number
    recent: Array<{
      type: string
      severity: string
      message: string
      timestamp: string
    }>
  }
}

export interface HealthCheckStatus {
  status: 'pass' | 'warn' | 'fail'
  message: string
  responseTime?: number
  details?: Record<string, any>
}

// Global uptime tracking
let startTime = Date.now()

export const checkNotificationSystemHealth = async (): Promise<HealthCheckResult> => {
  const checks = {
    database: await checkDatabaseHealth(),
    notifications: await checkNotificationServiceHealth(),
    vapid: checkVapidHealth(),
    performance: checkPerformanceHealth(),
  }

  // Determine overall status
  const statuses = Object.values(checks).map(c => c.status)
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

  if (statuses.includes('fail')) {
    overallStatus = 'unhealthy'
  } else if (statuses.includes('warn')) {
    overallStatus = 'degraded'
  }

  // Gather metrics
  const metricsData = {
    notifications_sent_last_hour: metrics.getAggregatedMetrics('notification_sent', 3600000).count,
    notifications_failed_last_hour: metrics.getAggregatedMetrics('notification_failed', 3600000).count,
    average_delivery_time: metrics.getAggregatedMetrics('timer', 3600000).average,
    active_subscriptions: await getActiveSubscriptionCount(),
  }

  // Check for alerts based on metrics
  const recentAlerts = alerts.getRecentAlerts(5)
  const alertInfo = recentAlerts.length > 0 ? {
    count: recentAlerts.length,
    recent: recentAlerts.map(alert => ({
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      timestamp: new Date().toISOString(), // Would need timestamp in AlertData
    })),
  } : undefined

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    checks,
    metrics: metricsData,
    alerts: alertInfo,
  }
}

async function checkDatabaseHealth(): Promise<HealthCheckStatus> {
  const startTime = performance.now()

  try {
    // Test basic database connectivity
    // In a real implementation, you'd make a simple query
    const { supabase } = await import('../utils/supabase')

    // Simple health check - try to select from a small table
    const { error } = await supabase
      .from('user_notification_preferences')
      .select('id')
      .limit(1)

    const responseTime = performance.now() - startTime

    if (error) {
      logger.error('Database health check failed', error)
      return {
        status: 'fail',
        message: `Database error: ${error.message}`,
        responseTime,
      }
    }

    return {
      status: 'pass',
      message: 'Database connection healthy',
      responseTime,
    }
  } catch (error: any) {
    logger.error('Database health check error', error)
    return {
      status: 'fail',
      message: `Database check failed: ${error.message}`,
      responseTime: performance.now() - startTime,
    }
  }
}

async function checkNotificationServiceHealth(): Promise<HealthCheckStatus> {
  const startTime = performance.now()

  try {
    // Test notification service availability
    const { realNotificationService } = await import('../services/RealNotificationService')

    // Check if service can get status
    const status = await realNotificationService.getStatus()

    const responseTime = performance.now() - startTime

    if (!status.isSupported) {
      return {
        status: 'warn',
        message: 'Notification API not supported in this browser',
        responseTime,
        details: { supported: status.isSupported },
      }
    }

    return {
      status: 'pass',
      message: 'Notification service operational',
      responseTime,
      details: { supported: status.isSupported, permission: status.permission },
    }
  } catch (error: any) {
    logger.error('Notification service health check error', error)
    return {
      status: 'fail',
      message: `Notification service error: ${error.message}`,
      responseTime: performance.now() - startTime,
    }
  }
}

function checkVapidHealth(): HealthCheckStatus {
  const startTime = performance.now()

  try {
    const vapidKey = getValidatedVapidPublicKey()
    const responseTime = performance.now() - startTime

    if (!vapidKey) {
      return {
        status: 'fail',
        message: 'VAPID keys not configured',
        responseTime,
      }
    }

    return {
      status: 'pass',
      message: 'VAPID keys configured correctly',
      responseTime,
    }
  } catch (error: any) {
    return {
      status: 'fail',
      message: `VAPID health check error: ${error.message}`,
      responseTime: performance.now() - startTime,
    }
  }
}

function checkPerformanceHealth(): HealthCheckStatus {
  const startTime = performance.now()

  try {
    const activeTimers = metrics.getActiveTimers()
    const recentMetrics = metrics.getMetrics(undefined, 10)

    const responseTime = performance.now() - startTime

    // Check for too many active timers (potential memory leak)
    if (activeTimers.length > 10) {
      return {
        status: 'warn',
        message: `${activeTimers.length} active performance timers (potential memory leak)`,
        responseTime,
        details: { activeTimers: activeTimers.length },
      }
    }

    // Check for too many recent errors
    const recentErrors = recentMetrics.filter(m => m.name.includes('error') || m.name.includes('fail')).length
    if (recentErrors > 5) {
      return {
        status: 'warn',
        message: `${recentErrors} errors in last 10 metrics`,
        responseTime,
        details: { errorCount: recentErrors },
      }
    }

    return {
      status: 'pass',
      message: 'Performance metrics healthy',
      responseTime,
      details: {
        activeTimers: activeTimers.length,
        recentMetrics: recentMetrics.length,
      },
    }
  } catch (error: any) {
    return {
      status: 'fail',
      message: `Performance health check error: ${error.message}`,
      responseTime: performance.now() - startTime,
    }
  }
}

async function getActiveSubscriptionCount(): Promise<number> {
  try {
    const { supabase } = await import('../utils/supabase')

    const { count } = await supabase
      .from('push_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    return count || 0
  } catch (error) {
    logger.error('Failed to get active subscription count', error as Error)
    return 0
  }
}

// HTTP endpoint for health checks (for monitoring systems)
export const handleHealthCheck = async (request: Request): Promise<Response> => {
  try {
    const health = await checkNotificationSystemHealth()

    const statusCode = health.status === 'healthy' ? 200 :
                      health.status === 'degraded' ? 200 : 503

    return new Response(JSON.stringify(health, null, 2), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error: any) {
    logger.error('Health check endpoint error', error)

    return new Response(JSON.stringify({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
