/**
 * Enhanced Error Handling Utilities
 *
 * Provides advanced error handling mechanisms including:
 * - Circuit breaker pattern
 * - Retry strategies with jitter
 * - Error classification and recovery
 * - Session recovery handling
 */

import { ICloudError, AuthenticationError, RateLimitError } from '../errors/ICloudError';
import { sleep } from './helpers';

// ============================================================================
// Types
// ============================================================================

export interface CircuitBreakerConfig {
  /** Number of failures before opening the circuit */
  failureThreshold: number;
  /** Time in ms before attempting to close the circuit */
  resetTimeoutMs: number;
  /** Number of successful calls needed to close the circuit */
  successThreshold: number;
}

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Base delay in ms between retries */
  baseDelayMs: number;
  /** Maximum delay in ms between retries */
  maxDelayMs: number;
  /** Add random jitter to delays */
  useJitter: boolean;
  /** Function to determine if error is retryable */
  shouldRetry?: (error: unknown) => boolean;
  /** Function called before each retry */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

export interface ErrorContext {
  /** The operation that failed */
  operation: string;
  /** The service that was called */
  service?: string;
  /** Request details */
  request?: {
    method: string;
    url: string;
    params?: Record<string, unknown>;
  };
  /** Session state */
  hasSession: boolean;
  /** Timestamp of the error */
  timestamp: Date;
}

export interface ErrorRecoveryResult {
  /** Whether recovery was successful */
  recovered: boolean;
  /** Action taken during recovery */
  action: 'retry' | 'refresh_session' | 'reauthenticate' | 'wait' | 'none';
  /** Delay before next action */
  waitMs?: number;
  /** Error after recovery attempt */
  error?: ICloudError;
}

export type CircuitState = 'closed' | 'open' | 'half-open';

// ============================================================================
// Circuit Breaker
// ============================================================================

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      resetTimeoutMs: config.resetTimeoutMs ?? 30000,
      successThreshold: config.successThreshold ?? 2,
    };
  }

  get currentState(): CircuitState {
    return this.state;
  }

  get isOpen(): boolean {
    return this.state === 'open';
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition from open to half-open
    if (this.state === 'open') {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure >= this.config.resetTimeoutMs) {
        this.state = 'half-open';
        this.successes = 0;
      } else {
        throw new ICloudError(
          'Circuit breaker is open - service temporarily unavailable',
          'SERVICE_UNAVAILABLE'
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.state = 'closed';
        this.failures = 0;
      }
    } else if (this.state === 'closed') {
      // Reset failure count on success
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      // Immediately open on failure in half-open state
      this.state = 'open';
    } else if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }

  /**
   * Reset the circuit breaker to closed state
   */
  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureTime: number;
  } {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

// ============================================================================
// Retry with Jitter
// ============================================================================

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateRetryDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  useJitter: boolean
): number {
  // Exponential backoff
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

  if (!useJitter) {
    return cappedDelay;
  }

  // Add jitter (between 0% and 100% of the delay)
  const jitter = Math.random() * cappedDelay;
  return Math.floor(cappedDelay + jitter) / 2;
}

/**
 * Enhanced retry with jitter and callbacks
 */
export async function retryWithJitter<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    useJitter = true,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = config;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts - 1 || !shouldRetry(error)) {
        throw error;
      }

      const delay = calculateRetryDelay(attempt, baseDelayMs, maxDelayMs, useJitter);

      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Default retry predicate
 */
function defaultShouldRetry(error: unknown): boolean {
  if (error instanceof ICloudError) {
    return error.retryable;
  }
  return false;
}

// ============================================================================
// Error Classification
// ============================================================================

export type ErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'network'
  | 'rate_limit'
  | 'server'
  | 'client'
  | 'conflict'
  | 'not_found'
  | 'unknown';

/**
 * Classify an error into a category
 */
export function classifyError(error: unknown): ErrorCategory {
  if (error instanceof AuthenticationError) {
    return 'authentication';
  }

  if (error instanceof ICloudError) {
    switch (error.code) {
      case 'AUTH_REQUIRED':
      case 'INVALID_CREDENTIALS':
      case 'INVALID_2FA_CODE':
      case 'SESSION_EXPIRED':
      case 'TWO_FACTOR_REQUIRED':
        return 'authentication';

      case 'PERMISSION_DENIED':
        return 'authorization';

      case 'NETWORK_ERROR':
        return 'network';

      case 'RATE_LIMITED':
        return 'rate_limit';

      case 'SERVICE_UNAVAILABLE':
        return 'server';

      case 'NOT_FOUND':
        return 'not_found';

      case 'CONFLICT':
        return 'conflict';

      case 'INVALID_REQUEST':
        return 'client';

      default:
        return 'unknown';
    }
  }

  if (error instanceof TypeError) {
    return 'network';
  }

  return 'unknown';
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  const category = classifyError(error);

  switch (category) {
    case 'authentication':
      return 'Your session has expired. Please sign in again.';

    case 'authorization':
      return 'You do not have permission to perform this action.';

    case 'network':
      return 'Unable to connect to iCloud. Please check your internet connection.';

    case 'rate_limit':
      return 'Too many requests. Please wait a moment and try again.';

    case 'server':
      return 'iCloud services are temporarily unavailable. Please try again later.';

    case 'not_found':
      return 'The requested item could not be found.';

    case 'conflict':
      return 'This item has been modified. Please refresh and try again.';

    case 'client':
      return 'Invalid request. Please check your input and try again.';

    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

// ============================================================================
// Error Recovery
// ============================================================================

export interface ErrorRecoveryOptions {
  /** Whether session refresh is available */
  canRefreshSession: boolean;
  /** Whether reauthentication is available */
  canReauthenticate: boolean;
  /** Current retry count */
  currentRetries: number;
  /** Maximum retries allowed */
  maxRetries: number;
}

/**
 * Determine recovery action for an error
 */
export function determineRecoveryAction(
  error: unknown,
  options: ErrorRecoveryOptions
): ErrorRecoveryResult {
  const category = classifyError(error);

  // Handle rate limiting
  if (category === 'rate_limit' && error instanceof RateLimitError) {
    return {
      recovered: false,
      action: 'wait',
      waitMs: error.retryAfterMs ?? 60000,
    };
  }

  // Handle network errors with retry
  if (category === 'network' && options.currentRetries < options.maxRetries) {
    return {
      recovered: false,
      action: 'retry',
      waitMs: calculateRetryDelay(options.currentRetries, 1000, 30000, true),
    };
  }

  // Handle authentication errors
  if (category === 'authentication') {
    if (error instanceof ICloudError) {
      if (error.code === 'SESSION_EXPIRED' && options.canRefreshSession) {
        return {
          recovered: false,
          action: 'refresh_session',
        };
      }
      if (options.canReauthenticate) {
        return {
          recovered: false,
          action: 'reauthenticate',
        };
      }
    }
  }

  // Handle server errors with retry
  if (category === 'server' && options.currentRetries < options.maxRetries) {
    return {
      recovered: false,
      action: 'retry',
      waitMs: calculateRetryDelay(options.currentRetries, 2000, 60000, true),
    };
  }

  // No recovery possible
  return {
    recovered: false,
    action: 'none',
    error: error instanceof ICloudError ? error : new ICloudError(
      error instanceof Error ? error.message : 'Unknown error',
      'UNKNOWN_ERROR'
    ),
  };
}

// ============================================================================
// Session Recovery
// ============================================================================

export interface SessionRecoveryHandlers {
  refreshSession: () => Promise<boolean>;
  reauthenticate: () => Promise<boolean>;
  onSessionExpired?: () => void;
}

/**
 * Create a session recovery middleware
 */
export function createSessionRecovery(handlers: SessionRecoveryHandlers) {
  let isRecovering = false;
  let recoveryPromise: Promise<boolean> | null = null;

  return {
    /**
     * Attempt to recover from a session error
     */
    async recover(error: unknown): Promise<boolean> {
      const category = classifyError(error);

      if (category !== 'authentication') {
        return false;
      }

      // Prevent concurrent recovery attempts
      if (isRecovering && recoveryPromise) {
        return recoveryPromise;
      }

      isRecovering = true;

      try {
        // First try to refresh the session
        recoveryPromise = handlers.refreshSession();
        const refreshed = await recoveryPromise;

        if (refreshed) {
          return true;
        }

        // If refresh fails, try reauthentication
        recoveryPromise = handlers.reauthenticate();
        const reauthenticated = await recoveryPromise;

        if (!reauthenticated) {
          handlers.onSessionExpired?.();
        }

        return reauthenticated;
      } finally {
        isRecovering = false;
        recoveryPromise = null;
      }
    },

    /**
     * Check if recovery is in progress
     */
    get isRecovering(): boolean {
      return isRecovering;
    },
  };
}

// ============================================================================
// Error Aggregation
// ============================================================================

export interface AggregatedErrors {
  total: number;
  byCategory: Record<ErrorCategory, number>;
  byCode: Record<string, number>;
  recent: Array<{
    error: ICloudError;
    timestamp: Date;
    context?: ErrorContext;
  }>;
}

/**
 * Create an error aggregator for monitoring
 */
export function createErrorAggregator(maxRecentErrors: number = 100) {
  const errors: AggregatedErrors = {
    total: 0,
    byCategory: {
      authentication: 0,
      authorization: 0,
      network: 0,
      rate_limit: 0,
      server: 0,
      client: 0,
      conflict: 0,
      not_found: 0,
      unknown: 0,
    },
    byCode: {},
    recent: [],
  };

  return {
    /**
     * Record an error
     */
    record(error: unknown, context?: ErrorContext): void {
      errors.total++;

      const category = classifyError(error);
      errors.byCategory[category]++;

      if (error instanceof ICloudError) {
        errors.byCode[error.code] = (errors.byCode[error.code] || 0) + 1;

        errors.recent.unshift({
          error,
          timestamp: new Date(),
          context,
        });

        // Keep only recent errors
        if (errors.recent.length > maxRecentErrors) {
          errors.recent.pop();
        }
      }
    },

    /**
     * Get aggregated statistics
     */
    getStats(): AggregatedErrors {
      return { ...errors };
    },

    /**
     * Reset all statistics
     */
    reset(): void {
      errors.total = 0;
      for (const key of Object.keys(errors.byCategory) as ErrorCategory[]) {
        errors.byCategory[key] = 0;
      }
      errors.byCode = {};
      errors.recent = [];
    },
  };
}

// ============================================================================
// Exports
// ============================================================================

export default {
  CircuitBreaker,
  calculateRetryDelay,
  retryWithJitter,
  classifyError,
  getUserFriendlyMessage,
  determineRecoveryAction,
  createSessionRecovery,
  createErrorAggregator,
};
