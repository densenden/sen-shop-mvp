/**
 * Error Boundary Component
 * Catches and displays errors in React components
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Container, Heading } from '@medusajs/ui';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/admin';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Container className="py-12">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Heading level="h1" className="text-2xl">
                Something went wrong
              </Heading>
              <p className="text-ui-fg-subtle">
                We encountered an unexpected error. Please try refreshing the page or contact support if
                the problem persists.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-left">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  Error Details (Development Only)
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200 font-mono break-all mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs text-red-700 dark:text-red-300">
                    <summary className="cursor-pointer hover:underline">Component Stack</summary>
                    <pre className="mt-2 whitespace-pre-wrap overflow-x-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" onClick={this.handleReset}>
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button variant="secondary" onClick={this.handleReload}>
                Reload Page
              </Button>
              <Button variant="primary" onClick={this.handleGoHome}>
                <Home className="w-4 h-4" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </Container>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};
