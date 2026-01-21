/**
 * HTTP Client Tests
 *
 * Tests for the HTTP client wrapper including request handling,
 * cookie management, retry logic, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient, createHttpClient } from '../utils/http';
import { ICloudError } from '../errors/ICloudError';
import { DEFAULT_CLIENT_SETTINGS } from '../types/auth';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('HttpClient', () => {
  let client: HttpClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createHttpClient({
      timeout: 5000,
      clientSettings: DEFAULT_CLIENT_SETTINGS,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Request Methods', () => {
    it('should make GET requests', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: { foo: 'bar' } }));

      const response = await client.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(response.data).toEqual({ foo: 'bar' });
    });

    it('should make POST requests with body', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: { created: true } }));

      const response = await client.post('/test', { name: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        })
      );
      expect(response.data).toEqual({ created: true });
    });

    it('should make PUT requests', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: { updated: true } }));

      const response = await client.put('/test', { name: 'updated' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'PUT' })
      );
      expect(response.data).toEqual({ updated: true });
    });

    it('should make DELETE requests', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: { deleted: true } }));

      await client.delete('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should make PATCH requests', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ data: { patched: true } }));

      await client.patch('/test', { field: 'value' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  describe('Query Parameters', () => {
    it('should add query parameters to URL', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      await client.get('/test', {
        params: { foo: 'bar', baz: 123 },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('foo=bar'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('baz=123'),
        expect.any(Object)
      );
    });

    it('should skip undefined parameters', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      await client.get('/test', {
        params: { foo: 'bar', baz: undefined },
      });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('foo=bar');
      expect(url).not.toContain('baz');
    });
  });

  describe('Headers', () => {
    it('should include default headers', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      await client.get('/test');

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers).toBeDefined();
    });

    it('should merge custom headers', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      await client.get('/test', {
        headers: { 'X-Custom-Header': 'custom-value' },
      });

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers['X-Custom-Header']).toBe('custom-value');
    });

    it('should add Content-Type for JSON body', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      await client.post('/test', { data: 'value' });

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Cookie Management', () => {
    it('should include cookies in requests', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      client.setCookies([
        { name: 'session', value: 'abc123', domain: '.example.com', path: '/' },
        { name: 'token', value: 'xyz789', domain: '.example.com', path: '/' },
      ]);

      await client.get('/test');

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers['Cookie']).toContain('session=abc123');
      expect(options.headers['Cookie']).toContain('token=xyz789');
    });

    it('should return current cookies', () => {
      const cookies = [
        { name: 'session', value: 'abc123', domain: '.example.com', path: '/' },
      ];

      client.setCookies(cookies);

      expect(client.getCookies()).toEqual(cookies);
    });
  });

  describe('Response Handling', () => {
    it('should parse JSON responses', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        data: { users: [{ id: 1, name: 'Test' }] },
        headers: { 'content-type': 'application/json' },
      }));

      const response = await client.get('/users');

      expect(response.data).toEqual({ users: [{ id: 1, name: 'Test' }] });
    });

    it('should handle text responses', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        data: 'Hello, World!',
        headers: { 'content-type': 'text/plain' },
      }));

      const response = await client.get('/text', { responseType: 'text' });

      expect(response.data).toBe('Hello, World!');
    });

    it('should include response headers', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        headers: {
          'x-request-id': 'req-123',
          'x-rate-limit-remaining': '99',
        },
      }));

      const response = await client.get('/test');

      expect(response.headers['x-request-id']).toBe('req-123');
      expect(response.headers['x-rate-limit-remaining']).toBe('99');
    });
  });

  describe('Error Handling', () => {
    it('should throw ICloudError for HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        status: 400,
        data: { error: 'Bad request' },
      }));

      await expect(client.get('/test')).rejects.toThrow(ICloudError);
    });

    it('should throw ICloudError for network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(client.get('/test')).rejects.toThrow(ICloudError);
    });

    it('should call error callback on errors', async () => {
      const errorCallback = vi.fn();
      const clientWithCallback = createHttpClient({
        timeout: 5000,
        clientSettings: DEFAULT_CLIENT_SETTINGS,
        onError: errorCallback,
      });

      mockFetch.mockResolvedValueOnce(createMockResponse({
        status: 500,
        data: { error: 'Server error' },
      }));

      try {
        await clientWithCallback.get('/test');
      } catch {
        // Expected
      }

      expect(errorCallback).toHaveBeenCalled();
      expect(errorCallback.mock.calls[0][0]).toBeInstanceOf(ICloudError);
    });
  });

  describe('Retry Logic', () => {
    it('should not retry non-retryable errors', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        status: 401,
        data: { error: 'Unauthorized' },
      }));

      await expect(
        client.requestWithRetry(
          { url: '/test', method: 'GET' },
          { maxAttempts: 3 }
        )
      ).rejects.toThrow();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Interceptors', () => {
    it('should call request interceptor', async () => {
      const requestInterceptor = vi.fn((config) => ({
        ...config,
        headers: { ...config.headers, 'X-Intercepted': 'true' },
      }));

      const clientWithInterceptor = createHttpClient({
        timeout: 5000,
        clientSettings: DEFAULT_CLIENT_SETTINGS,
        onRequest: requestInterceptor,
      });

      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      await clientWithInterceptor.get('/test');

      expect(requestInterceptor).toHaveBeenCalled();
    });

    it('should call response interceptor', async () => {
      const responseInterceptor = vi.fn((response) => ({
        ...response,
        data: { ...response.data, intercepted: true },
      }));

      const clientWithInterceptor = createHttpClient({
        timeout: 5000,
        clientSettings: DEFAULT_CLIENT_SETTINGS,
        onResponse: responseInterceptor,
      });

      mockFetch.mockResolvedValueOnce(createMockResponse({
        data: { original: true },
      }));

      const response = await clientWithInterceptor.get('/test');

      expect(responseInterceptor).toHaveBeenCalled();
      expect(response.data).toEqual({ original: true, intercepted: true });
    });
  });

  describe('Base URL', () => {
    it('should prepend base URL to requests', async () => {
      const clientWithBaseUrl = createHttpClient({
        baseUrl: 'https://api.example.com',
        timeout: 5000,
        clientSettings: DEFAULT_CLIENT_SETTINGS,
      });

      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      await clientWithBaseUrl.get('/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.any(Object)
      );
    });

    it('should not prepend base URL to absolute URLs', async () => {
      const clientWithBaseUrl = createHttpClient({
        baseUrl: 'https://api.example.com',
        timeout: 5000,
        clientSettings: DEFAULT_CLIENT_SETTINGS,
      });

      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      await clientWithBaseUrl.get('https://other.example.com/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://other.example.com/users',
        expect.any(Object)
      );
    });
  });
});

// Helper function to create mock responses
function createMockResponse(options: {
  status?: number;
  statusText?: string;
  data?: any;
  headers?: Record<string, string>;
}) {
  const {
    status = 200,
    statusText = 'OK',
    data = {},
    headers = {},
  } = options;

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: {
      get: (name: string) => headers[name.toLowerCase()] || null,
      forEach: (callback: (value: string, key: string) => void) => {
        Object.entries(headers).forEach(([key, value]) => callback(value, key.toLowerCase()));
      },
    },
    json: () => Promise.resolve(typeof data === 'string' ? JSON.parse(data) : data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  };
}
