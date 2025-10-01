import React, { useState, useEffect } from 'react'
import { logger } from '../utils/logger'
import { metrics } from '../utils/metrics'
import { alerts } from '../utils/alerts'

interface HealthStatus {
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

export const MonitoringDashboard: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHealthStatus = async () => {
      try {
        setLoading(true)

        // In a real implementation, this would call the health check API
        // For now, we'll simulate the data
        const mockHealth: HealthStatus = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: Date.now() - (Date.now() - 86400000), // 24 hours ago
          checks: {
            database: { status: 'pass', message: 'Database healthy' },
            notifications: { status: 'pass', message: 'Notifications working' },
            vapid: { status: 'pass', message: 'VAPID keys configured' },
            performance: { status: 'pass', message: 'Performance good' },
          },
          metrics: {
            notifications_sent_last_hour: 150,
            notifications_failed_last_hour: 2,
            average_delivery_time: 150,
            active_subscriptions: 1250,
          },
          alerts: {
            count: 0,
            recent: [],
          },
        }

        setHealthStatus(mockHealth)
      } catch (err: any) {
        logger.error('Failed to fetch health status', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchHealthStatus()

    // Refresh every 30 seconds
    const interval = setInterval(fetchHealthStatus, 30000)

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
        </div>
      </div>
    )
  }

  if (!healthStatus) return null

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={`p-6 rounded-xl border ${getStatusBgColor(healthStatus.status)}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">System Health</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthStatus.status)}`}>
            {healthStatus.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-white/70 text-sm">Uptime</p>
            <p className="text-xl font-bold text-white">
              {Math.floor(healthStatus.uptime / 3600000)}h {Math.floor((healthStatus.uptime % 3600000) / 60000)}m
            </p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Last Check</p>
            <p className="text-sm text-white">
              {new Date(healthStatus.timestamp).toLocaleTimeString()}
            </p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Notifications/Hour</p>
            <p className="text-xl font-bold text-white">
              {healthStatus.metrics.notifications_sent_last_hour}
            </p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Active Subscriptions</p>
            <p className="text-xl font-bold text-white">
              {healthStatus.metrics.active_subscriptions.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* System Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(healthStatus.checks).map(([checkName, check]) => (
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

      {/* Metrics */}
      <div className="p-6 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-white/70 text-sm">Success Rate</p>
            <p className="text-2xl font-bold text-green-400">
              {((healthStatus.metrics.notifications_sent_last_hour /
                 (healthStatus.metrics.notifications_sent_last_hour + healthStatus.metrics.notifications_failed_last_hour)) * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Avg Delivery Time</p>
            <p className="text-2xl font-bold text-white">
              {healthStatus.metrics.average_delivery_time.toFixed(0)}ms
            </p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Error Rate</p>
            <p className={`text-2xl font-bold ${
              healthStatus.metrics.notifications_failed_last_hour /
              (healthStatus.metrics.notifications_sent_last_hour + healthStatus.metrics.notifications_failed_last_hour) > 0.1
                ? 'text-red-400' : 'text-green-400'
            }`}>
              {((healthStatus.metrics.notifications_failed_last_hour /
                (healthStatus.metrics.notifications_sent_last_hour + healthStatus.metrics.notifications_failed_last_hour)) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      {healthStatus.alerts && healthStatus.alerts.count > 0 && (
        <div className="p-6 bg-red-400/10 backdrop-blur-xl rounded-xl border border-red-400/20">
          <h3 className="text-xl font-bold text-red-400 mb-4">
            Recent Alerts ({healthStatus.alerts.count})
          </h3>
          <div className="space-y-2">
            {healthStatus.alerts.recent.map((alert, index) => (
              <div key={index} className="p-3 bg-red-400/5 rounded border border-red-400/20">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${
                    alert.severity === 'critical' ? 'text-red-300' :
                    alert.severity === 'high' ? 'text-orange-300' :
                    alert.severity === 'medium' ? 'text-yellow-300' : 'text-gray-300'
                  }`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className="text-white/50 text-sm">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-white/80 text-sm mt-1">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
        >
          Refresh Status
        </button>
        <button
          onClick={() => {
            logger.info('Manual health check triggered from dashboard')
            // In a real implementation, trigger a health check
          }}
          className="px-4 py-2 bg-blue-400/20 hover:bg-blue-400/30 rounded-lg text-blue-400 transition-colors"
        >
          Run Health Check
        </button>
      </div>
    </div>
  )
}

export default MonitoringDashboard


