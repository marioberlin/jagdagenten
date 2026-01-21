/**
 * Custom error classes for iCloud API
 */

import type { ICloudErrorCode } from '../types';

export class ICloudError extends Error {
  public readonly code: ICloudErrorCode;
  public readonly statusCode?: number;
  public readonly response?: unknown;
  public readonly retryable: boolean;

  constructor(
    message: string,
    code: ICloudErrorCode,
    options?: {
      statusCode?: number;
      response?: unknown;
      cause?: Error;
    }
  ) {
    super(message);
    // Set cause manually for compatibility
    if (options?.cause) {
      (this as unknown as { cause: Error }).cause = options.cause;
    }
    this.name = 'ICloudError';
    this.code = code;
    this.statusCode = options?.statusCode;
    this.response = options?.response;
    this.retryable = this.isRetryable(code, options?.statusCode);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ICloudError);
    }
  }

  private isRetryable(code: ICloudErrorCode, statusCode?: number): boolean {
    // Network errors are typically retryable
    if (code === 'NETWORK_ERROR') return true;

    // Service unavailable is retryable
    if (code === 'SERVICE_UNAVAILABLE') return true;

    // Rate limiting is retryable after a delay
    if (code === 'RATE_LIMITED') return true;

    // Some HTTP status codes indicate retryable errors
    if (statusCode) {
      // 429 Too Many Requests
      if (statusCode === 429) return true;
      // 502, 503, 504 are typically temporary
      if (statusCode >= 502 && statusCode <= 504) return true;
    }

    return false;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      retryable: this.retryable,
      stack: this.stack,
    };
  }
}

export class AuthenticationError extends ICloudError {
  constructor(
    message: string,
    code: Extract<ICloudErrorCode, 'AUTH_REQUIRED' | 'TWO_FACTOR_REQUIRED' | 'INVALID_CREDENTIALS' | 'INVALID_2FA_CODE' | 'SESSION_EXPIRED'>,
    options?: {
      statusCode?: number;
      response?: unknown;
      cause?: Error;
    }
  ) {
    super(message, code, options);
    this.name = 'AuthenticationError';
  }
}

export class TwoFactorRequiredError extends AuthenticationError {
  public readonly methods: ('sms' | 'voice' | 'trustedDevice')[];
  public readonly phoneNumbers?: Array<{
    id: number;
    numberWithDialCode: string;
    obfuscatedNumber: string;
  }>;

  constructor(
    message: string,
    options?: {
      methods?: ('sms' | 'voice' | 'trustedDevice')[];
      phoneNumbers?: Array<{
        id: number;
        numberWithDialCode: string;
        obfuscatedNumber: string;
      }>;
      response?: unknown;
    }
  ) {
    super(message, 'TWO_FACTOR_REQUIRED', { response: options?.response });
    this.name = 'TwoFactorRequiredError';
    this.methods = options?.methods ?? ['trustedDevice'];
    this.phoneNumbers = options?.phoneNumbers;
  }
}

export class RateLimitError extends ICloudError {
  public readonly retryAfterMs?: number;

  constructor(
    message: string,
    options?: {
      retryAfterMs?: number;
      statusCode?: number;
      response?: unknown;
    }
  ) {
    super(message, 'RATE_LIMITED', options);
    this.name = 'RateLimitError';
    this.retryAfterMs = options?.retryAfterMs;
  }
}

export class NotFoundError extends ICloudError {
  public readonly resourceType?: string;
  public readonly resourceId?: string;

  constructor(
    message: string,
    options?: {
      resourceType?: string;
      resourceId?: string;
      response?: unknown;
    }
  ) {
    super(message, 'NOT_FOUND', { response: options?.response });
    this.name = 'NotFoundError';
    this.resourceType = options?.resourceType;
    this.resourceId = options?.resourceId;
  }
}

export class ConflictError extends ICloudError {
  public readonly conflictingEtag?: string;

  constructor(
    message: string,
    options?: {
      conflictingEtag?: string;
      response?: unknown;
    }
  ) {
    super(message, 'CONFLICT', { response: options?.response });
    this.name = 'ConflictError';
    this.conflictingEtag = options?.conflictingEtag;
  }
}

export class PermissionDeniedError extends ICloudError {
  public readonly requiredPermission?: string;

  constructor(
    message: string,
    options?: {
      requiredPermission?: string;
      response?: unknown;
    }
  ) {
    super(message, 'PERMISSION_DENIED', { response: options?.response });
    this.name = 'PermissionDeniedError';
    this.requiredPermission = options?.requiredPermission;
  }
}

export class NetworkError extends ICloudError {
  public readonly originalError?: Error;

  constructor(
    message: string,
    options?: {
      originalError?: Error;
    }
  ) {
    super(message, 'NETWORK_ERROR', { cause: options?.originalError });
    this.name = 'NetworkError';
    this.originalError = options?.originalError;
  }
}

/**
 * Parse an error response and return the appropriate ICloudError
 */
export function parseErrorResponse(
  statusCode: number,
  response?: unknown,
  originalError?: Error
): ICloudError {
  const errorBody = response as Record<string, unknown> | undefined;
  const errorMessage = errorBody?.error as string | undefined;
  const errorReason = errorBody?.reason as string | undefined;

  switch (statusCode) {
    case 401:
      return new AuthenticationError(
        errorMessage ?? 'Authentication required',
        'AUTH_REQUIRED',
        { statusCode, response }
      );

    case 403:
      if (errorReason === 'hsaRequired' || errorReason === 'hsa2Required') {
        return new TwoFactorRequiredError(
          'Two-factor authentication required',
          { response }
        );
      }
      return new PermissionDeniedError(
        errorMessage ?? 'Permission denied',
        { response }
      );

    case 404:
      return new NotFoundError(
        errorMessage ?? 'Resource not found',
        { response }
      );

    case 409:
      return new ConflictError(
        errorMessage ?? 'Resource conflict',
        { response }
      );

    case 421:
      return new TwoFactorRequiredError(
        'Two-factor authentication required',
        { response }
      );

    case 429:
      const retryAfter = errorBody?.['retry-after'] as number | undefined;
      return new RateLimitError(
        errorMessage ?? 'Rate limit exceeded',
        { retryAfterMs: retryAfter ? retryAfter * 1000 : undefined, statusCode, response }
      );

    case 500:
    case 502:
    case 503:
    case 504:
      return new ICloudError(
        errorMessage ?? 'Service unavailable',
        'SERVICE_UNAVAILABLE',
        { statusCode, response }
      );

    default:
      if (originalError) {
        return new NetworkError(
          originalError.message ?? 'Network error',
          { originalError }
        );
      }
      return new ICloudError(
        errorMessage ?? 'Unknown error',
        'UNKNOWN_ERROR',
        { statusCode, response }
      );
  }
}
