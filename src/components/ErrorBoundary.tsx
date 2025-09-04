import React, { Component, ErrorInfo, ReactNode } from 'react'
import { MobileOptimizedButton } from './MobileOptimizedButton'
import { MobileOptimizedCard } from './MobileOptimizedCard'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with error reporting services here
      // e.g., Sentry, LogRocket, etc.
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI with Osmo design
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          {/* Background Elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 bg-red-400/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-40 left-1/4 w-20 h-20 bg-yellow-300/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>

          <MobileOptimizedCard 
            variant="primary" 
            size="lg" 
            className="max-w-md w-full text-center"
          >
            {/* Error Icon */}
            <div className="text-6xl mb-6">🚨</div>
            
            {/* Error Title */}
            <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
              Oops! Something went wrong
            </h1>
            
            {/* Error Message */}
            <p className="text-slate-300 mb-6 leading-relaxed">
              We encountered an unexpected error. Don't worry, your data is safe and we're working to fix this.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-yellow-400 font-medium mb-2">
                  Error Details (Development)
                </summary>
                <div className="bg-slate-800/50 rounded-lg p-4 text-sm">
                  <div className="text-red-400 font-mono mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <pre className="text-slate-400 text-xs overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <MobileOptimizedButton
                onClick={this.handleRetry}
                variant="primary"
                size="md"
                fullWidth
                icon="🔄"
              >
                Try Again
              </MobileOptimizedButton>
              
              <MobileOptimizedButton
                onClick={this.handleReload}
                variant="secondary"
                size="md"
                fullWidth
                icon="🔄"
              >
                Reload Page
              </MobileOptimizedButton>
            </div>

            {/* Help Text */}
            <p className="text-slate-400 text-sm mt-6">
              If this problem persists, please contact support.
            </p>
          </MobileOptimizedCard>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components to catch errors
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: string) => {
    console.error('🚨 useErrorHandler caught an error:', error, errorInfo)
    
    // You can add custom error handling logic here
    // e.g., send to error reporting service
    
    // Show user-friendly error message
    alert(`An error occurred: ${error.message}`)
  }

  return { handleError }
}

// Higher-order component for wrapping components with error boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}