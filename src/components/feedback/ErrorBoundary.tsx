import React, { Component, ErrorInfo, ReactNode } from 'react';
import { GlassButton } from '../primitives/GlassButton';
import { GlassCard } from '../data-display/GlassCard';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    level?: 'page' | 'component';
    componentName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorCount: number;
}

// Error logging service interface
interface ErrorLogger {
    log: (error: Error, context: Record<string, unknown>) => void;
}

// Default error logger that sends to server
const defaultLogger: ErrorLogger = {
    log: (error, context) => {
        // Send to server endpoint
        if (typeof fetch !== 'undefined') {
            fetch('/api/v1/security/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'client_error',
                    message: error.message,
                    stack: error.stack,
                    context,
                    timestamp: new Date().toISOString()
                })
            }).catch(() => {
                // Silently fail if logging fails
            });
        }
        // Console fallback
        console.error('[ErrorBoundary]', error, context);
    }
};

export class ErrorBoundary extends Component<Props, State> {
    private errorLogger: ErrorLogger;
    private lastErrorTime: number = 0;

    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0
        };
        this.errorLogger = defaultLogger;
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState(prevState => ({
            errorInfo,
            errorCount: prevState.errorCount + 1
        }));

        // Call optional error callback
        this.props.onError?.(error, errorInfo);

        // Debounce error logging (max once per 5 seconds)
        const now = Date.now();
        if (now - this.lastErrorTime > 5000) {
            this.lastErrorTime = now;

            // Log to error service
            this.errorLogger.log(error, {
                level: this.props.level || 'component',
                componentName: this.props.componentName,
                errorCount: this.state.errorCount,
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                url: typeof window !== 'undefined' ? window.location.href : 'unknown'
            });
        }

        // Log to console in development
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught an error:', error);
            console.error('Component stack:', errorInfo.componentStack);
            console.error('Component name:', this.props.componentName);
        }
    }

    private handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    private handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <GlassCard className="max-w-md w-full p-6 bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                        <div className="flex flex-col items-center text-center gap-4">
                            {/* Error Icon */}
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                                <svg
                                    className="w-8 h-8 text-red-600 dark:text-red-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>

                            {/* Error Message */}
                            <div>
                                <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">
                                    Something went wrong
                                </h2>
                                <p className="mt-2 text-red-600 dark:text-red-400 text-sm">
                                    {this.state.error?.message || 'An unexpected error occurred'}
                                </p>
                            </div>

                            {/* Error Details (Development Only) */}
                            {import.meta.env.DEV && this.state.errorInfo && (
                                <details className="w-full text-left">
                                    <summary className="text-xs text-red-500 cursor-pointer hover:text-red-600">
                                        Show error details
                                    </summary>
                                    <pre className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded text-xs overflow-auto max-h-32 text-red-700 dark:text-red-300">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-2">
                                <GlassButton
                                    variant="outline"
                                    onClick={this.handleRetry}
                                >
                                    Try Again
                                </GlassButton>
                                <GlassButton
                                    variant="primary"
                                    onClick={this.handleReload}
                                >
                                    Reload Page
                                </GlassButton>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            );
        }

        return this.props.children;
    }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}

// Hook version for functional components
export function useErrorHandler(error: Error | null) {
    if (error) {
        throw error;
    }
    return null;
}
