/**
 * Alert system for monitoring notification system health
 * Sends alerts when critical thresholds are exceeded
 */

export interface AlertConfig {
  highErrorRate: number // Percentage (0-1)
  highFailureCount: number // Absolute count
  longResponseTime: number // Milliseconds
  lowSuccessRate: number // Percentage (0-1)
}

export interface AlertData {
  type: 'error_rate' | 'failure_count' | 'response_time' | 'success_rate'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  value: number
  threshold: number
  context?: Record<string, any>
}

class AlertSystem {
  private config: AlertConfig = {
    highErrorRate: 0.1, // 10% error rate
    highFailureCount: 10, // 10 failures
    longResponseTime: 5000, // 5 seconds
    lowSuccessRate: 0.8, // 80% success rate
  }

  private alerts: AlertData[] = []
  private maxAlerts: number = 100

  constructor(config?: Partial<AlertConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  // Check if alert should be triggered
  shouldAlert(type: AlertData['type'], value: number, threshold: number): boolean {
    switch (type) {
      case 'error_rate':
        return value > threshold
      case 'failure_count':
        return value >= threshold
      case 'response_time':
        return value > threshold
      case 'success_rate':
        return value < threshold
      default:
        return false
    }
  }

  // Determine alert severity
  getSeverity(type: AlertData['type'], value: number, threshold: number): AlertData['severity'] {
    const ratio = value / threshold

    if (ratio >= 3) return 'critical'
    if (ratio >= 2) return 'high'
    if (ratio >= 1.5) return 'medium'
    return 'low'
  }

  // Create alert
  createAlert(
    type: AlertData['type'],
    value: number,
    threshold: number,
    context?: Record<string, any>
  ): AlertData {
    const severity = this.getSeverity(type, value, threshold)

    const alertMessages = {
      error_rate: `Error rate ${(value * 100).toFixed(1)}% exceeds threshold ${(threshold * 100).toFixed(1)}%`,
      failure_count: `Failure count ${value} exceeds threshold ${threshold}`,
      response_time: `Response time ${value}ms exceeds threshold ${threshold}ms`,
      success_rate: `Success rate ${(value * 100).toFixed(1)}% below threshold ${(threshold * 100).toFixed(1)}%`,
    }

    const alert: AlertData = {
      type,
      severity,
      message: alertMessages[type],
      value,
      threshold,
      context,
    }

    this.alerts.push(alert)

    // Keep only recent alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts)
    }

    return alert
  }

  // Check metrics and trigger alerts if needed
  checkMetricsAndAlert(metrics: {
    errorRate: number
    failureCount: number
    averageResponseTime: number
    successRate: number
  }): AlertData[] {
    const triggeredAlerts: AlertData[] = []

    // Check error rate
    if (this.shouldAlert('error_rate', metrics.errorRate, this.config.highErrorRate)) {
      const alert = this.createAlert('error_rate', metrics.errorRate, this.config.highErrorRate, {
        errorRate: metrics.errorRate,
        threshold: this.config.highErrorRate,
      })
      triggeredAlerts.push(alert)
      this.sendAlert(alert)
    }

    // Check failure count
    if (this.shouldAlert('failure_count', metrics.failureCount, this.config.highFailureCount)) {
      const alert = this.createAlert('failure_count', metrics.failureCount, this.config.highFailureCount, {
        failureCount: metrics.failureCount,
        threshold: this.config.highFailureCount,
      })
      triggeredAlerts.push(alert)
      this.sendAlert(alert)
    }

    // Check response time
    if (this.shouldAlert('response_time', metrics.averageResponseTime, this.config.longResponseTime)) {
      const alert = this.createAlert('response_time', metrics.averageResponseTime, this.config.longResponseTime, {
        responseTime: metrics.averageResponseTime,
        threshold: this.config.longResponseTime,
      })
      triggeredAlerts.push(alert)
      this.sendAlert(alert)
    }

    // Check success rate
    if (this.shouldAlert('success_rate', metrics.successRate, this.config.lowSuccessRate)) {
      const alert = this.createAlert('success_rate', metrics.successRate, this.config.lowSuccessRate, {
        successRate: metrics.successRate,
        threshold: this.config.lowSuccessRate,
      })
      triggeredAlerts.push(alert)
      this.sendAlert(alert)
    }

    return triggeredAlerts
  }

  // Send alert (in production, this would send to Slack, email, etc.)
  private async sendAlert(alert: AlertData): Promise<void> {
    // In production, you would:
    // - Send to Slack webhook
    // - Send email notification
    // - Create incident in PagerDuty
    // - Log to external monitoring service

    console.warn(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`, {
      type: alert.type,
      value: alert.value,
      threshold: alert.threshold,
      context: alert.context,
      timestamp: new Date().toISOString(),
    })

    // For now, just log it
    // In production, implement actual alerting:
    // await sendSlackAlert(alert)
    // await sendEmailAlert(alert)
  }

  // Get recent alerts
  getRecentAlerts(count: number = 10): AlertData[] {
    return this.alerts.slice(-count)
  }

  // Clear old alerts
  clearOldAlerts(olderThanMs: number = 86400000): void { // 24 hours default
    const cutoff = Date.now() - olderThanMs
    // Note: In a real implementation, you'd need timestamps on alerts
    // For now, just keep the last maxAlerts
  }

  // Update configuration
  updateConfig(newConfig: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Get current configuration
  getConfig(): AlertConfig {
    return { ...this.config }
  }
}

// Export singleton instance
export const alerts = new AlertSystem()

// Convenience functions
export const checkNotificationHealth = (metrics: {
  errorRate: number
  failureCount: number
  averageResponseTime: number
  successRate: number
}) => {
  return alerts.checkMetricsAndAlert(metrics)
}

export const createCustomAlert = (
  type: AlertData['type'],
  message: string,
  value: number,
  threshold: number,
  context?: Record<string, any>
) => {
  const alert = alerts.createAlert(type, value, threshold, context)
  alerts.sendAlert(alert)
  return alert
}


