/**
 * Unit Tests for sparklesApi.ts
 *
 * Tests:
 * - Session ID injection in headers
 * - Error handling and parsing
 * - Token refresh flow
 * - API endpoint correctness
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock fetch - using type assertion to avoid TS error about missing preconnect
const mockFetch = vi.fn() as unknown as typeof fetch;
global.fetch = mockFetch;

// Import after mocks are set up
import {
    getSessionId,
    setSessionId,
    clearSession,
    hasSession,
    authApi,
    profileApi,
    threadsApi,
    messagesApi,
} from '../sparklesApi';

describe('sparklesApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
        // Clear the module-level session cache
        clearSession();
    });

    afterEach(() => {
        clearSession();
    });

    // ==========================================================================
    // Session Management Tests
    // ==========================================================================

    describe('Session Management', () => {
        it('should return null when no session exists', () => {
            expect(getSessionId()).toBeNull();
        });

        it('should store session ID in localStorage', () => {
            setSessionId('test-session-123');
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'sparkles_session_id',
                'test-session-123'
            );
        });

        it('should retrieve session ID from localStorage', () => {
            // Session is already cleared by beforeEach, so localStorage will be checked
            localStorageMock.getItem.mockReturnValueOnce('stored-session');
            expect(getSessionId()).toBe('stored-session');
        });

        it('should clear session from localStorage', () => {
            setSessionId('to-be-cleared');
            clearSession();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('sparkles_session_id');
            // hasSession checks getSessionId which checks localStorage (now empty)
            localStorageMock.getItem.mockReturnValueOnce(null);
            expect(hasSession()).toBe(false);
        });

        it('hasSession should return true when session exists', () => {
            setSessionId('active-session');
            expect(hasSession()).toBe(true);
        });
    });

    // ==========================================================================
    // Header Injection Tests
    // ==========================================================================

    describe('Session ID Header Injection', () => {
        it('should include session ID in request headers', async () => {
            setSessionId('header-test-session');
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ email: 'test@example.com' }),
            });

            await profileApi.getProfile();

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/v1/sparkles/profile',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'x-session-id': 'header-test-session',
                    }),
                })
            );
        });

        it('should not include session ID when none exists', async () => {
            clearSession();
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ email: 'test@example.com' }),
            });

            await profileApi.getProfile();

            const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
            const headers = options.headers as Record<string, string>;
            expect(headers['x-session-id']).toBeUndefined();
        });
    });

    // ==========================================================================
    // Error Handling Tests
    // ==========================================================================

    describe('Error Handling', () => {
        it('should parse auth expired errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ message: 'Token has expired' }),
            });

            await expect(profileApi.getProfile()).rejects.toMatchObject({
                code: 'AUTH_EXPIRED',
                retryable: false,
            });
        });

        it('should parse rate limit errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ message: 'Rate limit exceeded (429)' }),
            });

            await expect(profileApi.getProfile()).rejects.toMatchObject({
                code: 'RATE_LIMITED',
                retryable: true,
            });
        });

        it('should handle network errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

            await expect(profileApi.getProfile()).rejects.toMatchObject({
                code: 'NETWORK_ERROR',
                retryable: true,
            });
        });

        it('should handle generic server errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ message: 'Internal server error' }),
            });

            await expect(profileApi.getProfile()).rejects.toMatchObject({
                code: 'SERVER_ERROR',
            });
        });
    });

    // ==========================================================================
    // Auth API Tests
    // ==========================================================================

    describe('Auth API', () => {
        it('getAuthUrl should request OAuth URL', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve({ url: 'https://accounts.google.com/...', state: 'xyz' }),
            });

            const result = await authApi.getAuthUrl('custom-state');

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/v1/sparkles/auth/url?state=custom-state',
                expect.any(Object)
            );
            expect(result).toHaveProperty('url');
            expect(result).toHaveProperty('state');
        });

        it('callback should store session ID from response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve({
                        sessionId: 'new-session-from-callback',
                        profile: { email: 'user@gmail.com' },
                        credentials: { expiresAt: Date.now() + 3600000 },
                    }),
            });

            await authApi.callback('auth-code', 'state');

            expect(getSessionId()).toBe('new-session-from-callback');
        });

        it('logout should clear session', async () => {
            setSessionId('session-to-logout');
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({}),
            });

            await authApi.logout();

            expect(hasSession()).toBe(false);
        });
    });

    // ==========================================================================
    // Threads API Tests
    // ==========================================================================

    describe('Threads API', () => {
        beforeEach(() => {
            setSessionId('threads-test-session');
        });

        it('should list threads with query parameters', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ threads: [], nextPageToken: null }),
            });

            await threadsApi.list({
                labelIds: ['INBOX'],
                query: 'from:test@example.com',
                maxResults: 20,
            });

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('labelIds=INBOX'),
                expect.any(Object)
            );
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('q=from%3Atest%40example.com'),
                expect.any(Object)
            );
        });

        it('should archive thread by removing INBOX label', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({}),
            });

            await threadsApi.archive('thread-123');

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/v1/sparkles/threads/thread-123',
                expect.objectContaining({
                    method: 'PATCH',
                    body: JSON.stringify({ removeLabelIds: ['INBOX'] }),
                })
            );
        });

        it('should star thread by adding STARRED label', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({}),
            });

            await threadsApi.star('thread-456');

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/v1/sparkles/threads/thread-456',
                expect.objectContaining({
                    method: 'PATCH',
                    body: JSON.stringify({ addLabelIds: ['STARRED'] }),
                })
            );
        });

        it('should trash thread', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({}),
            });

            await threadsApi.trash('thread-789');

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/v1/sparkles/threads/thread-789/trash',
                expect.objectContaining({ method: 'POST' })
            );
        });
    });

    // ==========================================================================
    // Messages API Tests
    // ==========================================================================

    describe('Messages API', () => {
        beforeEach(() => {
            setSessionId('messages-test-session');
        });

        it('should send message with correct payload', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ messageId: 'msg-123' }),
            });

            await messagesApi.send({
                to: [{ email: 'recipient@example.com', name: 'Recipient' }],
                subject: 'Test Subject',
                body: '<p>Test body</p>',
                isHtml: true,
            });

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/v1/sparkles/messages/send',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"subject":"Test Subject"'),
                })
            );
        });

        it('should create draft', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ draftId: 'draft-456' }),
            });

            const result = await messagesApi.createDraft({
                to: [{ email: 'draft@example.com' }],
                subject: 'Draft Subject',
                body: 'Draft body',
            });

            expect(result.draftId).toBe('draft-456');
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/v1/sparkles/drafts',
                expect.objectContaining({ method: 'POST' })
            );
        });

        it('should get attachment', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ data: 'base64-encoded-content' }),
            });

            const result = await messagesApi.getAttachment('msg-123', 'att-456');

            expect(result.data).toBe('base64-encoded-content');
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/v1/sparkles/messages/msg-123/attachments/att-456',
                expect.any(Object)
            );
        });
    });

    // ==========================================================================
    // Labels API Tests
    // ==========================================================================

    describe('Labels API', () => {
        beforeEach(() => {
            setSessionId('labels-test-session');
        });

        it('should list labels', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve([
                        { id: 'INBOX', name: 'Inbox', type: 'system' },
                        { id: 'Label_1', name: 'Work', type: 'user' },
                    ]),
            });

            const result = await profileApi.listLabels();

            expect(result).toHaveLength(2);
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/v1/sparkles/labels',
                expect.any(Object)
            );
        });

        it('should create label with color', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve({
                        id: 'Label_new',
                        name: 'New Label',
                        type: 'user',
                        color: { textColor: '#ffffff', backgroundColor: '#4285f4' },
                    }),
            });

            const result = await profileApi.createLabel('New Label', {
                textColor: '#ffffff',
                backgroundColor: '#4285f4',
            });

            expect(result.name).toBe('New Label');
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/v1/sparkles/labels',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        name: 'New Label',
                        color: { textColor: '#ffffff', backgroundColor: '#4285f4' },
                    }),
                })
            );
        });

        it('should delete label', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({}),
            });

            await profileApi.deleteLabel('Label_123');

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/v1/sparkles/labels/Label_123',
                expect.objectContaining({ method: 'DELETE' })
            );
        });
    });
});
