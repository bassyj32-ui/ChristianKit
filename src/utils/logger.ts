/**
 * Structured logging utility for the notification system
 * Provides consistent logging format and levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  error?: Error
  userId?: string
  notificationId?: string
  sessionId?: string
  requestId?: string
  component?: string
  action?: string
  metadata?: Record<string, any>
}

class Logger {
  private minLevel: LogLevel = LogLevel.INFO
  private logs: LogEntry[] = []

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel

    // In production, you might want to send logs to a service like Sentry, LogRocket, etc.
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      this.minLevel = LogLevel.DEBUG // More verbose in development
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error,
    userId?: string,
    notificationId?: string,
    sessionId?: string,
    requestId?: string,
    component?: string,
    action?: string,
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      userId,
      notificationId,
      sessionId,
      requestId,
      component,
      action,
      metadata,
    }
  }

  private formatLog(entry: LogEntry): string {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR']
    const levelName = levelNames[entry.level]

    // Structured JSON format for better parsing and analysis
    const logData = {
      timestamp: entry.timestamp,
      level: levelName,
      message: entry.message,
      ...(entry.userId && { userId: entry.userId }),
      ...(entry.notificationId && { notificationId: entry.notificationId }),
      ...(entry.sessionId && { sessionId: entry.sessionId }),
      ...(entry.requestId && { requestId: entry.requestId }),
      ...(entry.component && { component: entry.component }),
      ...(entry.action && { action: entry.action }),
      ...(entry.context && Object.keys(entry.context).length > 0 && { context: entry.context }),
      ...(entry.metadata && Object.keys(entry.metadata).length > 0 && { metadata: entry.metadata }),
      ...(entry.error && {
        error: {
          message: entry.error.message,
          stack: entry.error.stack,
          name: entry.error.name
        }
      })
    }

    return JSON.stringify(logData)
  }

  private outputLog(entry: LogEntry): void {
    const formatted = this.formatLog(entry)

    // Console output for development
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted)
        break
      case LogLevel.INFO:
        console.info(formatted)
        break
      case LogLevel.WARN:
        console.warn(formatted)
        break
      case LogLevel.ERROR:
        console.error(formatted)
        break
    }

    // In production, you could send to external services
    // this.sendToExternalService(entry)

    // Store logs for analysis and debugging
    this.logs.push(entry)

    // Keep only recent logs to prevent memory issues
    if (this.logs.length > 200) {
      this.logs = this.logs.slice(-150)
    }
  }

  debug(message: string, context?: Record<string, any>, userId?: string, notificationId?: string, sessionId?: string, requestId?: string, component?: string, action?: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, context, undefined, userId, notificationId, sessionId, requestId, component, action, metadata)
      this.outputLog(entry)
    }
  }

  info(message: string, context?: Record<string, any>, userId?: string, notificationId?: string, sessionId?: string, requestId?: string, component?: string, action?: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createLogEntry(LogLevel.INFO, message, context, undefined, userId, notificationId, sessionId, requestId, component, action, metadata)
      this.outputLog(entry)
    }
  }

  warn(message: string, context?: Record<string, any>, userId?: string, notificationId?: string, sessionId?: string, requestId?: string, component?: string, action?: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createLogEntry(LogLevel.WARN, message, context, undefined, userId, notificationId, sessionId, requestId, component, action, metadata)
      this.outputLog(entry)
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>, userId?: string, notificationId?: string, sessionId?: string, requestId?: string, component?: string, action?: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.createLogEntry(LogLevel.ERROR, message, context, error, userId, notificationId, sessionId, requestId, component, action, metadata)
      this.outputLog(entry)
    }
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 10): LogEntry[] {
    return this.logs.slice(-count)
  }

  // Clear logs
  clearLogs(): void {
    this.logs = []
  }
}

// Export singleton instance
export const logger = new Logger()

// Convenience functions for common logging scenarios
export const logNotificationEvent = (event: string, userId: string, notificationId?: string, context?: Record<string, any>) => {
  logger.info(`Notification ${event}`, { event, ...context }, userId, notificationId)
}

export const logNotificationError = (message: string, error: Error, userId?: string, notificationId?: string) => {
  logger.error(message, error, { originalMessage: message }, userId, notificationId)
}

export const logPerformance = (operation: string, duration: number, userId?: string, context?: Record<string, any>) => {
  logger.info(`Performance: ${operation}`, { operation, duration, ...context }, userId)
}

// Enhanced convenience functions for structured logging
export const logUserAction = (
  action: string,
  userId: string,
  context?: Record<string, any>,
  component: string = 'UserInterface'
) => {
  logger.info(`User action: ${action}`, context, userId, undefined, undefined, undefined, component, action)
}

export const logDatabaseOperation = (
  operation: string,
  table: string,
  duration: number,
  success: boolean,
  context?: Record<string, any>
) => {
  const message = `Database ${operation} on ${table}`
  const metadata = { table, operation, duration, success, ...context }

  if (success) {
    logger.debug(message, metadata, undefined, undefined, undefined, undefined, 'Database', operation)
  } else {
    logger.warn(message, metadata, undefined, undefined, undefined, undefined, 'Database', operation)
  }
}

export const logSecurityEvent = (
  event: string,
  userId?: string,
  context?: Record<string, any>,
  severity: 'low' | 'medium' | 'high' = 'medium'
) => {
  const level = severity === 'high' ? LogLevel.ERROR : severity === 'medium' ? LogLevel.WARN : LogLevel.INFO
  const message = `Security: ${event}`

  if (level === LogLevel.ERROR) {
    logger.error(message, undefined, context, userId, undefined, undefined, undefined, 'Security', event)
  } else if (level === LogLevel.WARN) {
    logger.warn(message, context, userId, undefined, undefined, undefined, 'Security', event)
  } else {
    logger.info(message, context, userId, undefined, undefined, undefined, 'Security', event)
  }
}

export const logApiRequest = (
  method: string,
  endpoint: string,
  statusCode: number,
  duration: number,
  userId?: string,
  requestId?: string
) => {
  const success = statusCode >= 200 && statusCode < 300
  const message = `API ${method} ${endpoint}`

  if (success) {
    logger.debug(message, { method, endpoint, statusCode, duration }, userId, undefined, undefined, requestId, 'API', method)
  } else {
    logger.warn(message, { method, endpoint, statusCode, duration }, userId, undefined, undefined, requestId, 'API', method)
  }
}


