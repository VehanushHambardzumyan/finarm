import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

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

    // In production, you might want to send this to an error reporting service
    // reportError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles['error-boundary']}>
          <h2>Something went wrong</h2>
          <p>Please refresh the page or contact support if the problem persists.</p>
          <button
            onClick={() => window.location.reload()}
            className={styles['error-boundary__retry']}
          >
            Refresh Page
          </button>
          {import.meta.env.MODE === 'development' && (
            <details className={styles['error-boundary__details']}>
              <summary>Error Details</summary>
              <pre>{this.state.error?.stack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}