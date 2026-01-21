/**
 * Error Handling Utilities Tests
 *
 * Tests for circuit breaker, retry logic, error classification,
 * and session recovery mechanisms.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CircuitBreaker,
  calculateRetryDelay,
  retryWithJitter,
  classifyError,
  getUserFriendlyMessage,
  determineRecoveryAction,
  createSessionRecovery,
  createErrorAggregator,
} from '../utils/errorHandling';
import {
  ICloudError,
  AuthenticationError,
  RateLimitError,
  NetworkError,
  NotFoundError,
  PermissionDeniedError,
  ConflictError,
} from '../errors/ICloudError';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeoutMs: 1000,
      successThreshold: 2,
    });
  });

  it('should start in closed state', () => {
    expect(circuitBreaker.currentState).toBe('closed');
    expect(circuitBreaker.isOpen).toBe(false);
  });

  it('should execute function successfully in closed state', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await circuitBreaker.execute(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalled();
  });

  it('should open after failure threshold is reached', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('failure'));

    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(fn);
      } catch {
        // Expected
      }
    }

    expect(circuitBreaker.currentState).toBe('open');
    expect(circuitBreaker.isOpen).toBe(true);
  });

  it('should throw immediately when circuit is open', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('failure'));

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(fn);
      } catch {
        // Expected
      }
    }

    // Next call should fail immediately
    fn.mockClear();
    await expect(circuitBreaker.execute(fn)).rejects.toThrow('Circuit breaker is open');
    expect(fn).not.toHaveBeenCalled();
  });

  it('should transition to half-open after reset timeout', async () => {
    vi.useFakeTimers();

    const fn = vi.fn()
      .mockRejectedValue(new Error('failure'));

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(fn);
      } catch {
        // Expected
      }
    }

    expect(circuitBreaker.currentState).toBe('open');

    // Advance time past reset timeout
    vi.advanceTimersByTime(1100);

    // Reset the mock to succeed
    fn.mockResolvedValue('success');

    // Next call should attempt (half-open)
    await circuitBreaker.execute(fn);

    expect(circuitBreaker.currentState).toBe('half-open');

    vi.useRealTimers();
  });

  it('should close circuit after success threshold in half-open', async () => {
    vi.useFakeTimers();

    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('failure'))
      .mockRejectedValueOnce(new Error('failure'))
      .mockRejectedValueOnce(new Error('failure'))
      .mockResolvedValue('success');

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(fn);
      } catch {
        // Expected
      }
    }

    // Advance time past reset timeout
    vi.advanceTimersByTime(1100);

    // Success calls in half-open state
    await circuitBreaker.execute(fn);
    await circuitBreaker.execute(fn);

    expect(circuitBreaker.currentState).toBe('closed');

    vi.useRealTimers();
  });

  it('should reset to closed state', () => {
    circuitBreaker.reset();

    expect(circuitBreaker.currentState).toBe('closed');
    expect(circuitBreaker.getStats().failures).toBe(0);
  });

  it('should return stats', () => {
    const stats = circuitBreaker.getStats();

    expect(stats).toEqual({
      state: 'closed',
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
    });
  });
});

describe('calculateRetryDelay', () => {
  it('should calculate exponential backoff', () => {
    const delay0 = calculateRetryDelay(0, 1000, 30000, false);
    const delay1 = calculateRetryDelay(1, 1000, 30000, false);
    const delay2 = calculateRetryDelay(2, 1000, 30000, false);

    expect(delay0).toBe(1000);
    expect(delay1).toBe(2000);
    expect(delay2).toBe(4000);
  });

  it('should cap delay at maxDelayMs', () => {
    const delay = calculateRetryDelay(10, 1000, 30000, false);

    expect(delay).toBe(30000);
  });

  it('should add jitter when enabled', () => {
    const delays = new Set<number>();

    for (let i = 0; i < 10; i++) {
      delays.add(calculateRetryDelay(1, 1000, 30000, true));
    }

    // With jitter, delays should vary
    expect(delays.size).toBeGreaterThan(1);
  });
});

describe('retryWithJitter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await retryWithJitter(fn, { maxAttempts: 3 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new ICloudError('fail', 'NETWORK_ERROR'))
      .mockResolvedValue('success');

    const resultPromise = retryWithJitter(fn, {
      maxAttempts: 3,
      baseDelayMs: 100,
      useJitter: false,
    });

    // Advance past first retry delay
    await vi.advanceTimersByTimeAsync(100);

    const result = await resultPromise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max attempts', async () => {
    // Use real timers for this test since we need very short delays
    vi.useRealTimers();

    const error = new ICloudError('fail', 'NETWORK_ERROR');
    const fn = vi.fn().mockRejectedValue(error);

    await expect(
      retryWithJitter(fn, {
        maxAttempts: 3,
        baseDelayMs: 5,
        maxDelayMs: 10,
        useJitter: false,
      })
    ).rejects.toThrow('fail');

    expect(fn).toHaveBeenCalledTimes(3);

    // Restore fake timers for other tests
    vi.useFakeTimers();
  });

  it('should call onRetry callback', async () => {
    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new ICloudError('fail', 'NETWORK_ERROR'))
      .mockResolvedValue('success');

    const promise = retryWithJitter(fn, {
      maxAttempts: 3,
      baseDelayMs: 100,
      useJitter: false,
      onRetry,
    });

    await vi.advanceTimersByTimeAsync(100);
    await promise;

    expect(onRetry).toHaveBeenCalledWith(
      expect.any(ICloudError),
      1,
      expect.any(Number)
    );
  });

  it('should not retry non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(new ICloudError('fail', 'AUTH_REQUIRED'));

    await expect(
      retryWithJitter(fn, { maxAttempts: 3 })
    ).rejects.toThrow();

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('classifyError', () => {
  it('should classify authentication errors', () => {
    expect(classifyError(new AuthenticationError('', 'AUTH_REQUIRED'))).toBe('authentication');
    expect(classifyError(new ICloudError('', 'SESSION_EXPIRED'))).toBe('authentication');
    expect(classifyError(new ICloudError('', 'INVALID_CREDENTIALS'))).toBe('authentication');
  });

  it('should classify authorization errors', () => {
    expect(classifyError(new PermissionDeniedError(''))).toBe('authorization');
    expect(classifyError(new ICloudError('', 'PERMISSION_DENIED'))).toBe('authorization');
  });

  it('should classify network errors', () => {
    expect(classifyError(new NetworkError(''))).toBe('network');
    expect(classifyError(new ICloudError('', 'NETWORK_ERROR'))).toBe('network');
    expect(classifyError(new TypeError('Failed to fetch'))).toBe('network');
  });

  it('should classify rate limit errors', () => {
    expect(classifyError(new RateLimitError(''))).toBe('rate_limit');
    expect(classifyError(new ICloudError('', 'RATE_LIMITED'))).toBe('rate_limit');
  });

  it('should classify server errors', () => {
    expect(classifyError(new ICloudError('', 'SERVICE_UNAVAILABLE'))).toBe('server');
  });

  it('should classify not found errors', () => {
    expect(classifyError(new NotFoundError(''))).toBe('not_found');
    expect(classifyError(new ICloudError('', 'NOT_FOUND'))).toBe('not_found');
  });

  it('should classify conflict errors', () => {
    expect(classifyError(new ConflictError(''))).toBe('conflict');
    expect(classifyError(new ICloudError('', 'CONFLICT'))).toBe('conflict');
  });

  it('should classify client errors', () => {
    expect(classifyError(new ICloudError('', 'INVALID_REQUEST'))).toBe('client');
  });

  it('should classify unknown errors', () => {
    expect(classifyError(new Error('unknown'))).toBe('unknown');
    expect(classifyError(new ICloudError('', 'UNKNOWN_ERROR'))).toBe('unknown');
  });
});

describe('getUserFriendlyMessage', () => {
  it('should return friendly message for authentication errors', () => {
    const message = getUserFriendlyMessage(new AuthenticationError('', 'AUTH_REQUIRED'));
    expect(message).toContain('session');
  });

  it('should return friendly message for network errors', () => {
    const message = getUserFriendlyMessage(new NetworkError(''));
    expect(message).toContain('internet');
  });

  it('should return friendly message for rate limit errors', () => {
    const message = getUserFriendlyMessage(new RateLimitError(''));
    expect(message).toContain('many requests');
  });

  it('should return friendly message for server errors', () => {
    const message = getUserFriendlyMessage(new ICloudError('', 'SERVICE_UNAVAILABLE'));
    expect(message).toContain('unavailable');
  });

  it('should return generic message for unknown errors', () => {
    const message = getUserFriendlyMessage(new Error('unknown'));
    expect(message).toContain('unexpected');
  });
});

describe('determineRecoveryAction', () => {
  it('should return wait action for rate limit errors', () => {
    const error = new RateLimitError('', { retryAfterMs: 5000 });

    const result = determineRecoveryAction(error, {
      canRefreshSession: true,
      canReauthenticate: true,
      currentRetries: 0,
      maxRetries: 3,
    });

    expect(result.action).toBe('wait');
    expect(result.waitMs).toBe(5000);
  });

  it('should return retry action for network errors', () => {
    const error = new NetworkError('');

    const result = determineRecoveryAction(error, {
      canRefreshSession: true,
      canReauthenticate: true,
      currentRetries: 0,
      maxRetries: 3,
    });

    expect(result.action).toBe('retry');
  });

  it('should return refresh_session for session expired', () => {
    const error = new ICloudError('', 'SESSION_EXPIRED');

    const result = determineRecoveryAction(error, {
      canRefreshSession: true,
      canReauthenticate: true,
      currentRetries: 0,
      maxRetries: 3,
    });

    expect(result.action).toBe('refresh_session');
  });

  it('should return reauthenticate for auth errors when refresh not available', () => {
    const error = new AuthenticationError('', 'AUTH_REQUIRED');

    const result = determineRecoveryAction(error, {
      canRefreshSession: false,
      canReauthenticate: true,
      currentRetries: 0,
      maxRetries: 3,
    });

    expect(result.action).toBe('reauthenticate');
  });

  it('should return none when no recovery possible', () => {
    const error = new NotFoundError('');

    const result = determineRecoveryAction(error, {
      canRefreshSession: false,
      canReauthenticate: false,
      currentRetries: 5,
      maxRetries: 3,
    });

    expect(result.action).toBe('none');
  });
});

describe('createSessionRecovery', () => {
  it('should attempt to refresh session first', async () => {
    const refreshSession = vi.fn().mockResolvedValue(true);
    const reauthenticate = vi.fn().mockResolvedValue(true);

    const recovery = createSessionRecovery({
      refreshSession,
      reauthenticate,
    });

    const result = await recovery.recover(new AuthenticationError('', 'SESSION_EXPIRED'));

    expect(result).toBe(true);
    expect(refreshSession).toHaveBeenCalled();
    expect(reauthenticate).not.toHaveBeenCalled();
  });

  it('should attempt reauthentication if refresh fails', async () => {
    const refreshSession = vi.fn().mockResolvedValue(false);
    const reauthenticate = vi.fn().mockResolvedValue(true);

    const recovery = createSessionRecovery({
      refreshSession,
      reauthenticate,
    });

    const result = await recovery.recover(new AuthenticationError('', 'SESSION_EXPIRED'));

    expect(result).toBe(true);
    expect(refreshSession).toHaveBeenCalled();
    expect(reauthenticate).toHaveBeenCalled();
  });

  it('should call onSessionExpired if all recovery fails', async () => {
    const onSessionExpired = vi.fn();
    const recovery = createSessionRecovery({
      refreshSession: vi.fn().mockResolvedValue(false),
      reauthenticate: vi.fn().mockResolvedValue(false),
      onSessionExpired,
    });

    await recovery.recover(new AuthenticationError('', 'SESSION_EXPIRED'));

    expect(onSessionExpired).toHaveBeenCalled();
  });

  it('should not recover non-authentication errors', async () => {
    const recovery = createSessionRecovery({
      refreshSession: vi.fn().mockResolvedValue(true),
      reauthenticate: vi.fn().mockResolvedValue(true),
    });

    const result = await recovery.recover(new NetworkError(''));

    expect(result).toBe(false);
  });

  it('should prevent concurrent recovery attempts', async () => {
    const refreshSession = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(true), 100))
    );

    const recovery = createSessionRecovery({
      refreshSession,
      reauthenticate: vi.fn().mockResolvedValue(true),
    });

    const error = new AuthenticationError('', 'SESSION_EXPIRED');

    // Start two recovery attempts
    const promise1 = recovery.recover(error);
    const promise2 = recovery.recover(error);

    const [result1, result2] = await Promise.all([promise1, promise2]);

    expect(result1).toBe(true);
    expect(result2).toBe(true);
    expect(refreshSession).toHaveBeenCalledTimes(1); // Only one call
  });
});

describe('createErrorAggregator', () => {
  it('should record errors', () => {
    const aggregator = createErrorAggregator();

    aggregator.record(new NetworkError(''));
    aggregator.record(new AuthenticationError('', 'AUTH_REQUIRED'));

    const stats = aggregator.getStats();

    expect(stats.total).toBe(2);
    expect(stats.byCategory.network).toBe(1);
    expect(stats.byCategory.authentication).toBe(1);
  });

  it('should track errors by code', () => {
    const aggregator = createErrorAggregator();

    aggregator.record(new ICloudError('', 'NETWORK_ERROR'));
    aggregator.record(new ICloudError('', 'NETWORK_ERROR'));
    aggregator.record(new ICloudError('', 'AUTH_REQUIRED'));

    const stats = aggregator.getStats();

    expect(stats.byCode['NETWORK_ERROR']).toBe(2);
    expect(stats.byCode['AUTH_REQUIRED']).toBe(1);
  });

  it('should limit recent errors', () => {
    const aggregator = createErrorAggregator(5);

    for (let i = 0; i < 10; i++) {
      aggregator.record(new ICloudError(`Error ${i}`, 'UNKNOWN_ERROR'));
    }

    const stats = aggregator.getStats();

    expect(stats.recent.length).toBe(5);
    expect(stats.recent[0].error.message).toBe('Error 9'); // Most recent first
  });

  it('should include context in recent errors', () => {
    const aggregator = createErrorAggregator();
    const context = {
      operation: 'getContacts',
      service: 'contacts',
      hasSession: true,
      timestamp: new Date(),
    };

    aggregator.record(new ICloudError('', 'NETWORK_ERROR'), context);

    const stats = aggregator.getStats();

    expect(stats.recent[0].context).toEqual(context);
  });

  it('should reset statistics', () => {
    const aggregator = createErrorAggregator();

    aggregator.record(new NetworkError(''));
    aggregator.reset();

    const stats = aggregator.getStats();

    expect(stats.total).toBe(0);
    expect(stats.byCategory.network).toBe(0);
    expect(stats.recent.length).toBe(0);
  });
});
