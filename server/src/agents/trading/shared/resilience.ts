/**
 * Resilience Tools - Retry & Circuit Breaker
 * 
 * Shared resilience patterns for all trading agents.
 */

// ============================================================================
// Retry Configuration
// ============================================================================

export interface RetryConfig {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
};

// ============================================================================
// Circuit Breaker Configuration
// ============================================================================

export interface CircuitBreakerConfig {
    failureThreshold: number;  // Failures before opening
    resetTimeoutMs: number;    // Time before attempting reset
    halfOpenMaxAttempts: number;
}

const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeoutMs: 30000,
    halfOpenMaxAttempts: 3,
};

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerState {
    state: CircuitState;
    failures: number;
    lastFailureTime: number;
    halfOpenAttempts: number;
}

// ============================================================================
// Retry Implementation
// ============================================================================

export async function withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    onRetry?: (attempt: number, error: Error, delayMs: number) => void
): Promise<T> {
    const cfg = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= cfg.maxRetries + 1; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt > cfg.maxRetries) {
                break;
            }

            // Calculate delay with exponential backoff + jitter
            const baseDelay = cfg.baseDelayMs * Math.pow(cfg.backoffMultiplier, attempt - 1);
            const jitter = Math.random() * 0.3 * baseDelay;
            const delay = Math.min(baseDelay + jitter, cfg.maxDelayMs);

            if (onRetry) {
                onRetry(attempt, lastError, delay);
            }

            await sleep(delay);
        }
    }

    throw lastError;
}

// ============================================================================
// Circuit Breaker Implementation
// ============================================================================

const circuitBreakers = new Map<string, CircuitBreakerState>();

export async function withCircuitBreaker<T>(
    key: string,
    operation: () => Promise<T>,
    config: Partial<CircuitBreakerConfig> = {}
): Promise<T> {
    const cfg = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };

    // Get or create circuit breaker state
    let state = circuitBreakers.get(key);
    if (!state) {
        state = {
            state: 'closed',
            failures: 0,
            lastFailureTime: 0,
            halfOpenAttempts: 0,
        };
        circuitBreakers.set(key, state);
    }

    // Check if circuit should transition from open to half-open
    if (state.state === 'open') {
        const timeSinceLastFailure = Date.now() - state.lastFailureTime;
        if (timeSinceLastFailure >= cfg.resetTimeoutMs) {
            state.state = 'half-open';
            state.halfOpenAttempts = 0;
        } else {
            throw new CircuitOpenError(key, cfg.resetTimeoutMs - timeSinceLastFailure);
        }
    }

    try {
        const result = await operation();

        // Success - reset or close circuit
        if (state.state === 'half-open') {
            state.halfOpenAttempts++;
            if (state.halfOpenAttempts >= cfg.halfOpenMaxAttempts) {
                // Fully recovered
                state.state = 'closed';
                state.failures = 0;
                state.halfOpenAttempts = 0;
            }
        } else {
            // Reset failure count on success
            state.failures = 0;
        }

        return result;
    } catch (error) {
        state.failures++;
        state.lastFailureTime = Date.now();

        if (state.state === 'half-open') {
            // Failed during half-open, re-open circuit
            state.state = 'open';
            state.halfOpenAttempts = 0;
        } else if (state.failures >= cfg.failureThreshold) {
            // Too many failures, open circuit
            state.state = 'open';
        }

        throw error;
    }
}

export class CircuitOpenError extends Error {
    constructor(
        public readonly circuitKey: string,
        public readonly retryAfterMs: number
    ) {
        super(`Circuit breaker '${circuitKey}' is open. Retry after ${retryAfterMs}ms`);
        this.name = 'CircuitOpenError';
    }
}

/**
 * Get current state of a circuit breaker
 */
export function getCircuitState(key: string): CircuitState | 'not-found' {
    const state = circuitBreakers.get(key);
    return state?.state ?? 'not-found';
}

/**
 * Manually reset a circuit breaker
 */
export function resetCircuit(key: string): void {
    circuitBreakers.delete(key);
}

// ============================================================================
// Combined Resilient Call
// ============================================================================

export interface ResilientCallConfig {
    retry?: Partial<RetryConfig>;
    circuitBreaker?: {
        key: string;
        config?: Partial<CircuitBreakerConfig>;
    };
}

/**
 * Execute an operation with both retry and circuit breaker patterns
 */
export async function resilientCall<T>(
    operation: () => Promise<T>,
    config: ResilientCallConfig = {}
): Promise<T> {
    const wrappedOperation = config.circuitBreaker
        ? () => withCircuitBreaker(
            config.circuitBreaker!.key,
            operation,
            config.circuitBreaker!.config
        )
        : operation;

    return withRetry(wrappedOperation, config.retry);
}

// ============================================================================
// Utilities
// ============================================================================

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Timeout wrapper for operations
 */
export async function withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    timeoutMessage?: string
): Promise<T> {
    return Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
            setTimeout(
                () => reject(new TimeoutError(timeoutMessage ?? `Operation timed out after ${timeoutMs}ms`)),
                timeoutMs
            )
        ),
    ]);
}

export class TimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TimeoutError';
    }
}
