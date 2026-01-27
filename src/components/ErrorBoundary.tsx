/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs the error, and displays a fallback UI.
 */
import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKey?: string | number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// Error Boundary Class Component
// ============================================================================

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
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props): void {
    // Reset error state when resetKey changes
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Default Error Fallback UI
// ============================================================================

interface DefaultErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  onReset,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8 bg-glass-elevated rounded-xl border border-red-500/20">
      <div className="p-4 rounded-full bg-red-500/10 mb-4">
        <AlertTriangle size={32} className="text-red-400" />
      </div>

      <h2 className="text-xl font-semibold text-white mb-2">
        Something went wrong
      </h2>

      <p className="text-white/60 text-center mb-4 max-w-md">
        We encountered an unexpected error. Please try again or return to the home page.
      </p>

      {error && process.env.NODE_ENV === 'development' && (
        <details className="w-full max-w-lg mb-4">
          <summary className="cursor-pointer text-sm text-white/40 hover:text-white/60 transition-colors">
            Error details (development only)
          </summary>
          <pre className="mt-2 p-4 bg-black/50 rounded-lg text-xs text-red-400 overflow-auto max-h-40">
            {error.message}
            {'\n'}
            {error.stack}
          </pre>
        </details>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all"
        >
          <RefreshCw size={16} />
          <span>Try Again</span>
        </button>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
        >
          <Home size={16} />
          <span>Reload Page</span>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Specialized Error Boundaries
// ============================================================================

/**
 * Product-specific error boundary with retry functionality
 */
export const ProductErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center p-8 bg-glass-elevated rounded-xl border border-white/5">
          <AlertTriangle size={24} className="text-yellow-400 mb-2" />
          <p className="text-white/60 text-sm text-center">
            Unable to load product. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            Reload
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Cart-specific error boundary
 */
export const CartErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">
            Cart error. Please refresh the page.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Checkout-specific error boundary
 */
export const CheckoutErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <AlertTriangle size={48} className="text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Checkout Unavailable
          </h3>
          <p className="text-white/60 text-center mb-4">
            There was a problem loading the checkout. Your cart items are safe.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all"
          >
            Return to Cart
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
