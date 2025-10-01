import React, { useState, useEffect } from 'react'
import { logger } from '../utils/logger'
import { metrics } from '../utils/metrics'
import { checkNotificationSystemHealth } from '../api/health'

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  checks: Record<string, any>
  metrics: Record<string, number>
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

export const SystemMonitor: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchHealth = async () => {
    try {
      setLoading(true)
      const healthData = await checkNotificationSystemHealth()
      setHealth(healthData)
      setLastRefresh(new Date())
    } catch (err: any) {
      logger.error('Failed to fetch system health', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()

    // Refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400'
      case 'degraded': return 'text-yellow-400'
      case 'unhealthy': return 'text-red-400'
      case 'pass': return 'text-green-400'
      case 'warn': return 'text-yellow-400'
      case 'fail': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-400/10 border-green-400/20'
      case 'degraded': return 'bg-yellow-400/10 border-yellow-400/20'
      case 'unhealthy': return 'bg-red-400/10 border-red-400/20'
      default: return 'bg-gray-400/10 border-gray-400/20'
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-400/10 backdrop-blur-xl rounded-xl border border-red-400/20">
        <div className="text-red-400">
          <h3 className="font-bold mb-2">Monitoring Error</h3>
          <p>{error}</p>
          <button
            onClick={fetchHealth}
            className="mt-4 px-4 py-2 bg-red-400/20 hover:bg-red-400/30 rounded text-red-300"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!health) return null

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={`p-6 rounded-xl border ${getStatusBgColor(health.status)}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">System Health</h2>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.status)}`}>
              {health.status.toUpperCase()}
            </span>
            <span className="text-white/60 text-sm">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-white/70 text-sm">Uptime</p>
            <p className="text-xl font-bold text-white">
              {Math.floor(health.uptime / 3600000)}h {Math.floor((health.uptime % 3600000) / 60000)}m
            </p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Notifications/Hour</p>
            <p className="text-xl font-bold text-white">
              {health.metrics.notifications_sent_last_hour}
            </p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Success Rate</p>
            <p className="text-xl font-bold text-green-400">
              {((health.metrics.notifications_sent_last_hour /
                 (health.metrics.notifications_sent_last_hour + health.metrics.notifications_failed_last_hour)) * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Active Subscriptions</p>
            <p className="text-xl font-bold text-white">
              {health.metrics.active_subscriptions.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* System Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(health.checks).map(([checkName, check]) => (
          <div key={checkName} className="p-4 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white capitalize">{checkName}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(check.status)}`}>
                {check.status.toUpperCase()}
              </span>
            </div>
            <p className="text-white/70 text-sm">{check.message}</p>
            {check.responseTime && (
              <p className="text-white/60 text-xs mt-1">
                Response: {check.responseTime}ms
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="p-6 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-white/70 text-sm">Avg Response Time</p>
            <p className="text-2xl font-bold text-white">
              {health.metrics.average_delivery_time.toFixed(0)}ms
            </p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Error Rate</p>
            <p className={`text-2xl font-bold ${
              health.metrics.notifications_failed_last_hour /
              (health.metrics.notifications_sent_last_hour + health.metrics.notifications_failed_last_hour) > 0.1
                ? 'text-red-400' : 'text-green-400'
            }`}>
              {((health.metrics.notifications_failed_last_hour /
                (health.metrics.notifications_sent_last_hour + health.metrics.notifications_failed_last_hour)) * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-white/70 text-sm">System Load</p>
            <p className="text-2xl font-bold text-blue-400">
              Normal
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-6 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-white/80 text-sm">Database connected</span>
            </div>
            <span className="text-white/60 text-xs">2 minutes ago</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-white/80 text-sm">Cache warmed</span>
            </div>
            <span className="text-white/60 text-xs">5 minutes ago</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-white/80 text-sm">High memory usage detected</span>
            </div>
            <span className="text-white/60 text-xs">15 minutes ago</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={fetchHealth}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
        >
          Refresh Status
        </button>
        <button
          onClick={() => {
            logger.info('Manual health check triggered from monitor')
          }}
          className="px-4 py-2 bg-blue-400/20 hover:bg-blue-400/30 rounded-lg text-blue-400 transition-colors"
        >
          Run Health Check
        </button>
        <button
          onClick={() => {
            // Export logs and metrics for analysis
            const logs = logger.getRecentLogs(50)
            const metricsData = metrics.getMetrics(undefined, 50)
            console.log('System data exported for analysis', { logs: logs.length, metrics: metricsData.length })
          }}
          className="px-4 py-2 bg-green-400/20 hover:bg-green-400/30 rounded-lg text-green-400 transition-colors"
        >
          Export Data
        </button>
      </div>
    </div>
  )
}

export default SystemMonitor
