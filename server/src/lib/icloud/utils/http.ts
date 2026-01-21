/**
 * HTTP client wrapper for iCloud API
 *
 * This is a fetch-based HTTP client that handles:
 * - Cookie management
 * - Request/response interceptors
 * - Error handling
 * - Retry logic
 */

import type { Cookie } from '../types/session';
import type { ClientSettings } from '../types/auth';
import { parseCookies, mergeCookies, cookiesToString } from './cookies';
import { parseErrorResponse, ICloudError } from '../errors/ICloudError';
import { retry } from './helpers';

export interface HttpClientConfig {
  baseUrl?: string;
  timeout?: number;
  clientSettings: ClientSettings;
  onCookiesUpdate?: (cookies: Cookie[]) => void;
  onRequest?: (config: RequestConfig) => RequestConfig;
  onResponse?: (response: HttpResponse<unknown>) => HttpResponse<unknown>;
  onError?: (error: ICloudError) => void;
}

export interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  timeout?: number;
  withCredentials?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
}

export interface HttpResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

export class HttpClient {
  private cookies: Cookie[] = [];
  private config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = config;
  }

  /**
   * Set cookies for the client
   */
  setCookies(cookies: Cookie[]): void {
    this.cookies = cookies;
  }

  /**
   * Get current cookies
   */
  getCookies(): Cookie[] {
    return this.cookies;
  }

  /**
   * Make a GET request
   */
  async get<T>(url: string, options?: Partial<RequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, url, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T>(url: string, body?: unknown, options?: Partial<RequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, url, method: 'POST', body });
  }

  /**
   * Make a PUT request
   */
  async put<T>(url: string, body?: unknown, options?: Partial<RequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, url, method: 'PUT', body });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(url: string, options?: Partial<RequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, url, method: 'DELETE' });
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(url: string, body?: unknown, options?: Partial<RequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...options, url, method: 'PATCH', body });
  }

  /**
   * Make a request with retry logic
   */
  async requestWithRetry<T>(
    config: RequestConfig,
    retryOptions?: {
      maxAttempts?: number;
      baseDelayMs?: number;
    }
  ): Promise<HttpResponse<T>> {
    return retry(
      () => this.request<T>(config),
      {
        maxAttempts: retryOptions?.maxAttempts ?? 3,
        baseDelayMs: retryOptions?.baseDelayMs ?? 1000,
        shouldRetry: (error) => {
          if (error instanceof ICloudError) {
            return error.retryable;
          }
          return false;
        },
      }
    );
  }

  /**
   * Make a request
   */
  async request<T>(config: RequestConfig): Promise<HttpResponse<T>> {
    // Apply base URL
    let url = config.url;
    if (this.config.baseUrl && !url.startsWith('http')) {
      url = `${this.config.baseUrl}${url}`;
    }

    // Add query parameters
    if (config.params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(config.params)) {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    // Build headers
    const headers: Record<string, string> = {
      ...this.config.clientSettings.defaultHeaders,
      ...config.headers,
    };

    // Add cookies
    if (this.cookies.length > 0) {
      headers['Cookie'] = cookiesToString(this.cookies);
    }

    // Add content type for JSON body
    if (config.body && typeof config.body === 'object' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    // Build request config
    let requestConfig: RequestConfig = {
      ...config,
      url,
      headers,
    };

    // Apply request interceptor
    if (this.config.onRequest) {
      requestConfig = this.config.onRequest(requestConfig);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeout = config.timeout ?? this.config.timeout ?? 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Make the request
      const fetchOptions: RequestInit = {
        method: requestConfig.method,
        headers: requestConfig.headers,
        signal: controller.signal,
        credentials: config.withCredentials ? 'include' : 'same-origin',
      };

      if (requestConfig.body) {
        fetchOptions.body = typeof requestConfig.body === 'string'
          ? requestConfig.body
          : JSON.stringify(requestConfig.body);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Parse response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key.toLowerCase()] = value;
      });

      // Handle Set-Cookie headers
      const setCookieHeaders = response.headers.get('set-cookie');
      if (setCookieHeaders) {
        const newCookies = parseCookies({ 'set-cookie': setCookieHeaders });
        this.cookies = mergeCookies(this.cookies, newCookies);
        this.config.onCookiesUpdate?.(this.cookies);
      }

      // Parse response body
      let data: T;
      const contentType = responseHeaders['content-type'] || '';

      if (config.responseType === 'blob') {
        data = await response.blob() as unknown as T;
      } else if (config.responseType === 'arraybuffer') {
        data = await response.arrayBuffer() as unknown as T;
      } else if (config.responseType === 'text' || !contentType.includes('application/json')) {
        const text = await response.text();
        // Try to parse as JSON anyway
        try {
          data = JSON.parse(text) as T;
        } catch {
          data = text as unknown as T;
        }
      } else {
        data = await response.json() as T;
      }

      // Check for errors
      if (!response.ok) {
        const error = parseErrorResponse(response.status, data);
        this.config.onError?.(error);
        throw error;
      }

      // Build response object
      let httpResponse: HttpResponse<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        config: requestConfig,
      };

      // Apply response interceptor
      if (this.config.onResponse) {
        httpResponse = this.config.onResponse(httpResponse) as HttpResponse<T>;
      }

      return httpResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort error (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new ICloudError(
          'Request timeout',
          'NETWORK_ERROR',
          { cause: error }
        );
        this.config.onError?.(timeoutError);
        throw timeoutError;
      }

      // Handle fetch errors
      if (error instanceof TypeError) {
        const networkError = new ICloudError(
          error.message || 'Network error',
          'NETWORK_ERROR',
          { cause: error }
        );
        this.config.onError?.(networkError);
        throw networkError;
      }

      // Re-throw ICloudError
      if (error instanceof ICloudError) {
        throw error;
      }

      // Unknown error
      const unknownError = new ICloudError(
        error instanceof Error ? error.message : 'Unknown error',
        'UNKNOWN_ERROR',
        { cause: error instanceof Error ? error : undefined }
      );
      this.config.onError?.(unknownError);
      throw unknownError;
    }
  }
}

/**
 * Create an HTTP client with default iCloud settings
 */
export function createHttpClient(config: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}
