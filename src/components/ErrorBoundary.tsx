import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🙏</div>
            <h1 className="text-2xl font-bold mb-4 text-[var(--accent-primary)]">
              Something went wrong
            </h1>
            <p className="text-[var(--text-secondary)] mb-6">
              Don't worry, God is still with you. Let's get you back to your prayer journey.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[var(--accent-primary)] text-[var(--text-inverse)] px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Refresh Page
            </button>
            <p className="text-sm text-[var(--text-tertiary)] mt-4">
              If the problem persists, please try again later.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
