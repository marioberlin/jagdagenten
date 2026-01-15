/**
 * Error utilities for A2A SDK
 */

import {
  JSONRPCError,
  InternalError,
} from '../types';

/**
 * Base class for server errors
 */
export class ServerError extends Error {
  error?: JSONRPCError;

  constructor(error: Error | string, errorCode?: number) {
    const message = typeof error === 'string' ? error : error.message;
    super(message);

    if (error instanceof Error) {
      this.error = new InternalError({
        message: error.message,
        code: errorCode || -32000,
      });
    } else {
      this.error = new InternalError({
        message: message,
        code: errorCode || -32000,
      });
    }

    this.name = 'ServerError';
  }
}

/**
 * Method not implemented error
 */
export class MethodNotImplementedError extends ServerError {
  constructor(message: string = 'Method not implemented') {
    super(message, -50100);
    this.name = 'MethodNotImplementedError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends ServerError {
  constructor(message: string) {
    super(message, -40000);
    this.name = 'ValidationError';
  }
}
