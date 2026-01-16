/**
 * Error utilities for A2A SDK
 */

import type { JSONRPCError } from '../types/v1';
import { A2AErrorCodes } from '../types/v1';

/**
 * Base class for server errors
 */
export class ServerError extends Error {
  error: JSONRPCError;

  constructor(error: Error | string, errorCode?: number) {
    const message = typeof error === 'string' ? error : error.message;
    super(message);

    this.error = {
      code: errorCode || A2AErrorCodes.INTERNAL_ERROR,
      message: message,
    };

    this.name = 'ServerError';
  }
}

/**
 * Method not implemented error
 */
export class MethodNotImplementedError extends ServerError {
  constructor(message: string = 'Method not implemented') {
    super(message, A2AErrorCodes.UNSUPPORTED_OPERATION);
    this.name = 'MethodNotImplementedError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends ServerError {
  constructor(message: string) {
    super(message, A2AErrorCodes.INVALID_PARAMS);
    this.name = 'ValidationError';
  }
}

/**
 * Task not found error
 */
export class TaskNotFoundError extends ServerError {
  constructor(taskId: string) {
    super(`Task with id ${taskId} not found`, A2AErrorCodes.TASK_NOT_FOUND);
    this.name = 'TaskNotFoundError';
  }
}

/**
 * Task not cancelable error
 */
export class TaskNotCancelableError extends ServerError {
  constructor(taskId: string) {
    super(`Task with id ${taskId} cannot be canceled`, A2AErrorCodes.TASK_NOT_CANCELABLE);
    this.name = 'TaskNotCancelableError';
  }
}
