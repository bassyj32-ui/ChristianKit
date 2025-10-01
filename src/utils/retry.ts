/**
 * Retry utility with exponential backoff for notification system reliability
 * Handles transient failures gracefully with intelligent retry logic
 */

export interface RetryOptions {
  maxAttempts?: number
  baseDelay?: number // milliseconds
  maxDelay?: number // milliseconds
  backoffFactor?: number
  retryCondition?: (error: Error) => boolean
  onRetry?: (attempt: number, error: Error) => void
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
}

class RetryManager {
  private defaultOptions: Required<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffFactor: 2,
    retryCondition: (error: Error) => {
      // Retry on network errors, timeouts, and 5xx status codes
      const retryableErrors = [
        'NetworkError',
        'TimeoutError',
        'ECONNRESET',
        'ENOTFOUND',
        'ETIMEDOUT',
      ]

      const errorMessage = error.message.toLowerCase()
      const isRetryable = retryableErrors.some(retryable => errorMessage.includes(retryable.toLowerCase()))

      // Also retry on specific HTTP status codes if available
      if (error.statusCode) {
        return error.statusCode >= 500 || error.statusCode === 429 // Server errors or rate limiting
      }

      return isRetryable
    },
    onRetry: () => {}, // No-op by default
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const opts = { ...this.defaultOptions, ...options }
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        const data = await operation()
        return {
          success: true,
          data,
          attempts: attempt,
        }
      } catch (error) {
        lastError = error as Error

        // Check if we should retry
        if (attempt < opts.maxAttempts && opts.retryCondition(lastError)) {
          const delay = this.calculateDelay(attempt, opts)

          if (opts.onRetry) {
            opts.onRetry(attempt, lastError)
          }

          // Wait before retrying
          await this.sleep(delay)
        } else {
          // No more retries or error is not retryable
          break
        }
      }
    }

    return {
      success: false,
      error: lastError!,
      attempts: opts.maxAttempts,
    }
  }

  private calculateDelay(attempt: number, options: Required<RetryOptions>): number {
    const { baseDelay, maxDelay, backoffFactor } = options

    // Exponential backoff: baseDelay * (backoffFactor ^ (attempt - 1))
    const exponentialDelay = baseDelay * Math.pow(backoffFactor, attempt - 1)

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * exponentialDelay

    return Math.min(exponentialDelay + jitter, maxDelay)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Predefined retry strategies for common scenarios
  getNetworkRetryOptions(): RetryOptions {
    return {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      retryCondition: (error: Error) => {
        const retryableErrors = ['NetworkError', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT']
        const errorMessage = error.message.toLowerCase()
        return retryableErrors.some(retryable => errorMessage.includes(retryable.toLowerCase()))
      },
    }
  }

  getDatabaseRetryOptions(): RetryOptions {
    return {
      maxAttempts: 2,
      baseDelay: 500,
      maxDelay: 5000,
      backoffFactor: 2,
      retryCondition: (error: Error) => {
        const retryableErrors = ['ConnectionError', 'TimeoutError', 'DeadlockError']
        const errorMessage = error.message.toLowerCase()
        return retryableErrors.some(retryable => errorMessage.includes(retryable.toLowerCase()))
      },
    }
  }

  getPushNotificationRetryOptions(): RetryOptions {
    return {
      maxAttempts: 2,
      baseDelay: 2000,
      maxDelay: 10000,
      backoffFactor: 2,
      retryCondition: (error: Error) => {
        // Don't retry on permanent errors (410 Gone, 404 Not Found)
        if (error.statusCode === 410 || error.statusCode === 404) {
          return false
        }

        // Retry on temporary errors (5xx, network issues)
        return error.statusCode >= 500 || error.message.includes('NetworkError')
      },
    }
  }
}

// Export singleton instance
export const retryManager = new RetryManager()

// Convenience functions for common retry scenarios
export const withNetworkRetry = <T>(operation: () => Promise<T>) =>
  retryManager.withRetry(operation, retryManager.getNetworkRetryOptions())

export const withDatabaseRetry = <T>(operation: () => Promise<T>) =>
  retryManager.withRetry(operation, retryManager.getDatabaseRetryOptions())

export const withPushRetry = <T>(operation: () => Promise<T>) =>
  retryManager.withRetry(operation, retryManager.getPushNotificationRetryOptions())

// Enhanced retry for critical notification operations
export const withNotificationRetry = <T>(
  operation: () => Promise<T>,
  context: { userId?: string; notificationId?: string }
) => {
  const options: RetryOptions = {
    maxAttempts: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 2,
    retryCondition: (error: Error) => {
      // Log retry attempts for monitoring
      console.warn(`Retrying notification operation for ${context.userId || 'unknown user'}:`, {
        error: error.message,
        context,
      })

      // Retry on network and temporary server errors
      return error.message.includes('NetworkError') ||
             (error.statusCode && error.statusCode >= 500)
    },
    onRetry: (attempt, error) => {
      console.info(`Notification retry attempt ${attempt} for ${context.userId || 'unknown user'}`, {
        error: error.message,
        context,
      })
    },
  }

  return retryManager.withRetry(operation, options)
}
