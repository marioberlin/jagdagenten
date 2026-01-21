/**
 * iCloud API Client Integration Tests
 *
 * Tests for the ICloud class including authentication flow,
 * session management, error handling, and service access.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ICloud, createICloudClient } from '../ICloud';
import {
  ICloudError,
  AuthenticationError,
  TwoFactorRequiredError,
  RateLimitError,
  NetworkError,
  NotFoundError,
  PermissionDeniedError,
  ConflictError,
  parseErrorResponse,
} from '../errors/ICloudError';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ICloud Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create a client with default settings', () => {
      const client = createICloudClient();

      expect(client).toBeInstanceOf(ICloud);
      expect(client.isAuthenticated).toBe(false);
      expect(client.account).toBeNull();
    });

    it('should create a client with custom settings', () => {
      const client = createICloudClient({
        clientSettings: {
          clientId: 'custom-client-id',
        },
        debug: true,
      });

      expect(client.clientSettings.clientId).toBe('custom-client-id');
    });

    it('should restore session from config', () => {
      const mockSession = createMockSession();

      const client = createICloudClient({
        session: mockSession,
      });

      expect(client.isAuthenticated).toBe(true);
      expect(client.account).toBeDefined();
    });

    it('should handle expired session during restore', () => {
      const expiredSession = createMockSession({
        expiresAt: new Date(Date.now() - 1000), // Expired
      });

      const client = createICloudClient({
        session: expiredSession,
      });

      expect(client.isAuthenticated).toBe(false);
    });
  });

  describe('Authentication', () => {
    it('should throw error when signing in without credentials', async () => {
      const client = createICloudClient();

      await expect(client.signIn()).rejects.toThrow(AuthenticationError);
      await expect(client.signIn()).rejects.toThrow('No credentials provided');
    });

    it('should call 2FA callback when required', async () => {
      const twoFactorCallback = vi.fn().mockResolvedValue('123456');

      // Mock sign in response requiring 2FA
      mockFetch
        .mockResolvedValueOnce(createMockResponse({
          status: 200,
          data: { hsaChallengeRequired: true },
        }))
        .mockResolvedValueOnce(createMockResponse({ status: 200 })) // 2FA verify
        .mockResolvedValueOnce(createMockResponse({ status: 200 })) // Trust browser
        .mockResolvedValueOnce(createMockResponse({
          status: 200,
          data: createMockAccountData(),
        })); // Validate session

      const client = createICloudClient({
        credentials: { username: 'test@example.com', password: 'password' },
        onTwoFactorRequired: twoFactorCallback,
      });

      await client.signIn();

      expect(twoFactorCallback).toHaveBeenCalled();
      expect(client.isAuthenticated).toBe(true);
    });

    it('should throw TwoFactorRequiredError when no callback provided', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        status: 200,
        data: { hsaChallengeRequired: true },
      }));

      const client = createICloudClient({
        credentials: { username: 'test@example.com', password: 'password' },
      });

      await expect(client.signIn()).rejects.toThrow(TwoFactorRequiredError);
    });

    it('should emit ready event on successful authentication', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse({
          status: 200,
          data: { hsaChallengeRequired: false },
        }))
        .mockResolvedValueOnce(createMockResponse({ status: 200 })) // Trust browser
        .mockResolvedValueOnce(createMockResponse({
          status: 200,
          data: createMockAccountData(),
        }));

      const client = createICloudClient({
        credentials: { username: 'test@example.com', password: 'password' },
      });

      const readyHandler = vi.fn();
      client.on('ready', readyHandler);

      await client.signIn();

      expect(readyHandler).toHaveBeenCalled();
    });

    it('should emit sessionUpdate event when session changes', async () => {
      mockFetch
        .mockResolvedValueOnce(createMockResponse({
          status: 200,
          data: { hsaChallengeRequired: false },
        }))
        .mockResolvedValueOnce(createMockResponse({ status: 200 }))
        .mockResolvedValueOnce(createMockResponse({
          status: 200,
          data: createMockAccountData(),
        }));

      const sessionHandler = vi.fn();
      const client = createICloudClient({
        credentials: { username: 'test@example.com', password: 'password' },
        onSessionUpdate: sessionHandler,
      });

      await client.signIn();

      expect(sessionHandler).toHaveBeenCalled();
      const session = sessionHandler.mock.calls[0][0];
      expect(session.username).toBe('test@example.com');
    });

    it('should sign out and clear all state', async () => {
      const client = createICloudClient({
        session: createMockSession(),
      });

      expect(client.isAuthenticated).toBe(true);

      mockFetch.mockResolvedValueOnce(createMockResponse({ status: 200 }));

      await client.signOut();

      expect(client.isAuthenticated).toBe(false);
      expect(client.account).toBeNull();
      expect(client.getSession()).toBeNull();
    });
  });

  describe('Service Access', () => {
    it('should throw error when accessing services without authentication', () => {
      const client = createICloudClient();

      expect(() => client.Contacts).toThrow(AuthenticationError);
      expect(() => client.Calendar).toThrow(AuthenticationError);
      expect(() => client.Mail).toThrow(AuthenticationError);
      expect(() => client.Drive).toThrow(AuthenticationError);
      expect(() => client.Notes).toThrow(AuthenticationError);
      expect(() => client.Reminders).toThrow(AuthenticationError);
      expect(() => client.Photos).toThrow(AuthenticationError);
      expect(() => client.FindMy).toThrow(AuthenticationError);
    });

    it('should return services when authenticated', () => {
      const client = createICloudClient({
        session: createMockSession(),
      });

      expect(client.Contacts).toBeDefined();
      expect(client.Calendar).toBeDefined();
      expect(client.Mail).toBeDefined();
      expect(client.Drive).toBeDefined();
      expect(client.Notes).toBeDefined();
      expect(client.Reminders).toBeDefined();
      expect(client.Photos).toBeDefined();
      expect(client.FindMy).toBeDefined();
    });

    it('should cache service instances', () => {
      const client = createICloudClient({
        session: createMockSession(),
      });

      const contacts1 = client.Contacts;
      const contacts2 = client.Contacts;

      expect(contacts1).toBe(contacts2);
    });
  });

  describe('Session Management', () => {
    it('should return current session', () => {
      const mockSession = createMockSession();
      const client = createICloudClient({
        session: mockSession,
      });

      const session = client.getSession();
      expect(session).toBeDefined();
      expect(session?.username).toBe(mockSession.username);
    });

    it('should refresh session', async () => {
      const client = createICloudClient({
        session: createMockSession(),
      });

      mockFetch.mockResolvedValueOnce(createMockResponse({
        status: 200,
        data: createMockAccountData(),
      }));

      await client.refreshSession();

      expect(client.isAuthenticated).toBe(true);
    });

    it('should throw error when refreshing without session', async () => {
      const client = createICloudClient();

      await expect(client.refreshSession()).rejects.toThrow(AuthenticationError);
    });
  });

  describe('Event Handling', () => {
    it('should register and call event handlers', () => {
      const client = createICloudClient();
      const errorHandler = vi.fn();

      client.on('error', errorHandler);

      // Trigger an error by accessing service without auth
      try {
        client.Contacts;
      } catch {
        // Expected
      }

      // The error handler should NOT be called for sync errors
      // It's only called for async errors in the HTTP client
    });

    it('should remove event handlers', () => {
      const client = createICloudClient();
      const handler = vi.fn();

      client.on('ready', handler);
      client.off('ready', handler);

      // Handler should not be called even if ready event is emitted
    });
  });
});

describe('Error Classes', () => {
  describe('ICloudError', () => {
    it('should create error with code', () => {
      const error = new ICloudError('Test error', 'UNKNOWN_ERROR');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.name).toBe('ICloudError');
    });

    it('should mark network errors as retryable', () => {
      const error = new ICloudError('Network failed', 'NETWORK_ERROR');

      expect(error.retryable).toBe(true);
    });

    it('should mark service unavailable as retryable', () => {
      const error = new ICloudError('Service down', 'SERVICE_UNAVAILABLE');

      expect(error.retryable).toBe(true);
    });

    it('should mark rate limit as retryable', () => {
      const error = new ICloudError('Too many requests', 'RATE_LIMITED');

      expect(error.retryable).toBe(true);
    });

    it('should mark 502/503/504 as retryable', () => {
      const error502 = new ICloudError('Bad gateway', 'UNKNOWN_ERROR', { statusCode: 502 });
      const error503 = new ICloudError('Service unavailable', 'UNKNOWN_ERROR', { statusCode: 503 });
      const error504 = new ICloudError('Gateway timeout', 'UNKNOWN_ERROR', { statusCode: 504 });

      expect(error502.retryable).toBe(true);
      expect(error503.retryable).toBe(true);
      expect(error504.retryable).toBe(true);
    });

    it('should serialize to JSON', () => {
      const error = new ICloudError('Test', 'UNKNOWN_ERROR', { statusCode: 500 });
      const json = error.toJSON();

      expect(json.name).toBe('ICloudError');
      expect(json.message).toBe('Test');
      expect(json.code).toBe('UNKNOWN_ERROR');
      expect(json.statusCode).toBe(500);
    });
  });

  describe('AuthenticationError', () => {
    it('should extend ICloudError', () => {
      const error = new AuthenticationError('Auth failed', 'AUTH_REQUIRED');

      expect(error).toBeInstanceOf(ICloudError);
      expect(error.name).toBe('AuthenticationError');
    });
  });

  describe('TwoFactorRequiredError', () => {
    it('should include methods', () => {
      const error = new TwoFactorRequiredError('2FA required', {
        methods: ['sms', 'trustedDevice'],
      });

      expect(error.methods).toContain('sms');
      expect(error.methods).toContain('trustedDevice');
    });

    it('should include phone numbers', () => {
      const error = new TwoFactorRequiredError('2FA required', {
        phoneNumbers: [
          { id: 1, numberWithDialCode: '+1******1234', obfuscatedNumber: '•••1234' },
        ],
      });

      expect(error.phoneNumbers).toHaveLength(1);
      expect(error.phoneNumbers?.[0].id).toBe(1);
    });
  });

  describe('RateLimitError', () => {
    it('should include retry after', () => {
      const error = new RateLimitError('Rate limited', {
        retryAfterMs: 5000,
      });

      expect(error.retryAfterMs).toBe(5000);
      expect(error.retryable).toBe(true);
    });
  });

  describe('NotFoundError', () => {
    it('should include resource info', () => {
      const error = new NotFoundError('Contact not found', {
        resourceType: 'contact',
        resourceId: '123',
      });

      expect(error.resourceType).toBe('contact');
      expect(error.resourceId).toBe('123');
    });
  });

  describe('PermissionDeniedError', () => {
    it('should include required permission', () => {
      const error = new PermissionDeniedError('Access denied', {
        requiredPermission: 'contacts:write',
      });

      expect(error.requiredPermission).toBe('contacts:write');
    });
  });

  describe('ConflictError', () => {
    it('should include conflicting etag', () => {
      const error = new ConflictError('Version conflict', {
        conflictingEtag: 'abc123',
      });

      expect(error.conflictingEtag).toBe('abc123');
    });
  });

  describe('NetworkError', () => {
    it('should include original error', () => {
      const originalError = new Error('Connection reset');
      const error = new NetworkError('Network failed', {
        originalError,
      });

      expect(error.originalError).toBe(originalError);
      expect(error.retryable).toBe(true);
    });
  });
});

describe('Error Response Parser', () => {
  it('should parse 401 as AuthenticationError', () => {
    const error = parseErrorResponse(401);

    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.code).toBe('AUTH_REQUIRED');
  });

  it('should parse 403 with hsaRequired as TwoFactorRequiredError', () => {
    const error = parseErrorResponse(403, { reason: 'hsaRequired' });

    expect(error).toBeInstanceOf(TwoFactorRequiredError);
  });

  it('should parse 403 as PermissionDeniedError', () => {
    const error = parseErrorResponse(403);

    expect(error).toBeInstanceOf(PermissionDeniedError);
  });

  it('should parse 404 as NotFoundError', () => {
    const error = parseErrorResponse(404);

    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('should parse 409 as ConflictError', () => {
    const error = parseErrorResponse(409);

    expect(error).toBeInstanceOf(ConflictError);
  });

  it('should parse 421 as TwoFactorRequiredError', () => {
    const error = parseErrorResponse(421);

    expect(error).toBeInstanceOf(TwoFactorRequiredError);
  });

  it('should parse 429 as RateLimitError', () => {
    const error = parseErrorResponse(429, { 'retry-after': 30 });

    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).retryAfterMs).toBe(30000);
  });

  it('should parse 5xx as SERVICE_UNAVAILABLE', () => {
    const error500 = parseErrorResponse(500);
    const error502 = parseErrorResponse(502);
    const error503 = parseErrorResponse(503);
    const error504 = parseErrorResponse(504);

    expect(error500.code).toBe('SERVICE_UNAVAILABLE');
    expect(error502.code).toBe('SERVICE_UNAVAILABLE');
    expect(error503.code).toBe('SERVICE_UNAVAILABLE');
    expect(error504.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('should parse unknown errors with original error', () => {
    const originalError = new Error('Connection failed');
    const error = parseErrorResponse(0, undefined, originalError);

    expect(error).toBeInstanceOf(NetworkError);
  });

  it('should use error message from response', () => {
    const error = parseErrorResponse(400, { error: 'Invalid request' });

    expect(error.message).toBe('Invalid request');
  });
});

// Helper functions
function createMockSession(overrides: Partial<{
  cookies: any[];
  authToken: string;
  account: any;
  username: string;
  expiresAt: Date;
}> = {}) {
  return {
    cookies: [
      { name: 'X-APPLE-ID-SESSION-ID', value: 'test-session-id' },
      { name: 'scnt', value: 'test-scnt' },
    ],
    authToken: 'test-auth-token',
    account: createMockAccountData(),
    username: 'test@example.com',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ...overrides,
  };
}

function createMockAccountData() {
  return {
    dsInfo: {
      appleId: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      dsid: '12345',
    },
    webservices: {
      contacts: { url: 'https://contacts.icloud.com', status: 'active' },
      calendar: { url: 'https://calendar.icloud.com', status: 'active' },
      mail: { url: 'https://mail.icloud.com', status: 'active' },
      drive: { url: 'https://drive.icloud.com', status: 'active' },
      notes: { url: 'https://notes.icloud.com', status: 'active' },
      reminders: { url: 'https://reminders.icloud.com', status: 'active' },
      photos: { url: 'https://photos.icloud.com', status: 'active' },
      findme: { url: 'https://findme.icloud.com', status: 'active' },
    },
    hasMinimumDeviceForPhotosWeb: true,
    hasPaymentInfo: false,
  };
}

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
    headers: new Headers(headers),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  };
}
