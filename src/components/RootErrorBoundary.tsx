import React from 'react';
import { ErrorFallback } from '@/components/ErrorBoundary';

interface RootErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class RootErrorBoundary extends React.Component<React.PropsWithChildren, RootErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Global error logging for white-screen debugging
    // eslint-disable-next-line no-console
    console.error('RootErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    // Full reload to recover from fatal errors
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
