/**
 * Server context types for A2A server
 */

import { User } from './interfaces';

/**
 * Server call context
 * Provides request-scoped information to handlers
 */
export interface ServerCallContext {
  /** The user making the request */
  user?: User;

  /** Request state and metadata */
  state?: Record<string, any>;

  /** Extensions requested by the client */
  requested_extensions?: string[];

  /** Activated extensions */
  activated_extensions?: string[];

  /** Cancellation signal */
  signal?: AbortSignal;

  /** Request headers */
  headers?: Record<string, string>;
}

/**
 * Default implementation of ServerCallContext
 */
export class DefaultServerCallContext implements ServerCallContext {
  user?: User;
  state?: Record<string, any>;
  requested_extensions?: string[];
  activated_extensions?: string[];
  signal?: AbortSignal;
  headers?: Record<string, string>;

  constructor(options: ServerCallContext = {}) {
    this.user = options.user;
    this.state = options.state || {};
    this.requested_extensions = options.requested_extensions;
    this.activated_extensions = options.activated_extensions;
    this.signal = options.signal;
    this.headers = options.headers;
  }
}
