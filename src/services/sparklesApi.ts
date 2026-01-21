/**
 * Sparkles API Client
 *
 * Typed API client for communicating with the Sparkles Gmail backend.
 * Handles session management, automatic token refresh, and error handling.
 */

import type {
    GmailAccount,
    EmailThread,
    EmailMessage,
    Label,
    SparklesError,
    SparklesErrorCode,
    ComposeState,
} from '@/types/sparkles';

// =============================================================================
// Types (Backend Response Types)
// =============================================================================

interface GmailProfile {
    email: string;
    name: string;
    avatar?: string;
}

interface GmailCredentials {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

interface AuthCallbackResponse {
    sessionId: string;
    profile: GmailProfile;
    credentials: {
        expiresAt: number;
    };
}

interface ThreadListResponse {
    threads: BackendThread[];
    nextPageToken?: string;
}

interface BackendThread {
    id: string;
    historyId: string;
    snippet: string;
    messages: BackendMessage[];
    labelIds: string[];
}

interface BackendMessage {
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    from: { email: string; name?: string };
    to: { email: string; name?: string }[];
    cc?: { email: string; name?: string }[];
    bcc?: { email: string; name?: string }[];
    subject: string;
    date: string;
    bodyHtml?: string;
    bodyText?: string;
    attachments: Array<{
        id: string;
        filename: string;
        mimeType: string;
        size: number;
    }>;
    isUnread: boolean;
    isStarred: boolean;
    isDraft: boolean;
}

interface BackendLabel {
    id: string;
    name: string;
    type: 'system' | 'user';
    messageListVisibility?: string;
    labelListVisibility?: string;
    color?: {
        textColor: string;
        backgroundColor: string;
    };
    messagesTotal: number;
    messagesUnread: number;
}

interface SendMessageOptions {
    to: Array<{ email: string; name?: string }>;
    cc?: Array<{ email: string; name?: string }>;
    bcc?: Array<{ email: string; name?: string }>;
    subject: string;
    body: string;
    isHtml?: boolean;
    threadId?: string;
    inReplyTo?: string;
    references?: string;
    attachments?: Array<{
        filename: string;
        mimeType: string;
        content: string; // base64
    }>;
}

// =============================================================================
// Constants
// =============================================================================

const API_BASE = '/api/v1/sparkles';
const SESSION_STORAGE_KEY = 'sparkles_session_id';

// =============================================================================
// Error Handling
// =============================================================================

function createSparklesError(
    code: SparklesErrorCode,
    message: string,
    details?: Record<string, unknown>
): SparklesError {
    return {
        code,
        message,
        details,
        retryable: ['RATE_LIMITED', 'NETWORK_ERROR', 'SERVER_ERROR'].includes(code),
    };
}

function parseError(error: unknown): SparklesError {
    if (error instanceof Error) {
        // Check for auth errors
        if (error.message.includes('expired') || error.message.includes('token')) {
            return createSparklesError('AUTH_EXPIRED', error.message);
        }
        if (error.message.includes('revoked')) {
            return createSparklesError('AUTH_REVOKED', error.message);
        }
        if (error.message.includes('rate') || error.message.includes('429')) {
            return createSparklesError('RATE_LIMITED', error.message);
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
            return createSparklesError('NETWORK_ERROR', error.message);
        }
        return createSparklesError('SERVER_ERROR', error.message);
    }
    return createSparklesError('SERVER_ERROR', 'Unknown error occurred');
}

// =============================================================================
// Session Management
// =============================================================================

let currentSessionId: string | null = null;

export function getSessionId(): string | null {
    if (currentSessionId) return currentSessionId;
    currentSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    return currentSessionId;
}

export function setSessionId(sessionId: string): void {
    currentSessionId = sessionId;
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
}

export function clearSession(): void {
    currentSessionId = null;
    localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function hasSession(): boolean {
    return !!getSessionId();
}

// =============================================================================
// HTTP Client
// =============================================================================

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const sessionId = getSessionId();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (sessionId) {
        headers['x-session-id'] = sessionId;
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        return response.json();
    } catch (error) {
        throw parseError(error);
    }
}

// =============================================================================
// Auth API
// =============================================================================

export const authApi = {
    /**
     * Get OAuth URL for Gmail authentication
     */
    async getAuthUrl(state?: string): Promise<{ url: string; state: string }> {
        const params = state ? `?state=${encodeURIComponent(state)}` : '';
        return request(`/auth/url${params}`);
    },

    /**
     * Exchange OAuth code for tokens
     */
    async callback(code: string, state?: string): Promise<AuthCallbackResponse> {
        const result = await request<AuthCallbackResponse>('/auth/callback', {
            method: 'POST',
            body: JSON.stringify({ code, state }),
        });
        setSessionId(result.sessionId);
        return result;
    },

    /**
     * Restore session from stored credentials
     */
    async restore(credentials: GmailCredentials): Promise<{ sessionId: string; profile: GmailProfile }> {
        const result = await request<{ sessionId: string; profile: GmailProfile }>('/auth/restore', {
            method: 'POST',
            body: JSON.stringify({ credentials }),
        });
        setSessionId(result.sessionId);
        return result;
    },

    /**
     * Refresh access token
     */
    async refresh(): Promise<{ credentials: { accessToken: string; expiresAt: number } }> {
        return request('/auth/refresh', { method: 'POST' });
    },

    /**
     * End session
     */
    async logout(): Promise<void> {
        await request('/auth/logout', { method: 'POST' });
        clearSession();
    },
};

// =============================================================================
// Token Storage API (Server-Side)
// =============================================================================

export interface TokenStoreRequest {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    email: string;
    name?: string;
    avatar?: string;
}

export interface TokenRetrieveResponse {
    email: string;
    name?: string;
    avatar?: string;
    expiresAt: number;
    isValid: boolean;
}

export const tokenApi = {
    /**
     * Store tokens on server (for secure server-side storage)
     * Returns a session ID that can be used for subsequent requests
     */
    async store(tokenData: TokenStoreRequest): Promise<{ sessionId: string }> {
        const result = await request<{ sessionId: string }>('/tokens/store', {
            method: 'POST',
            body: JSON.stringify(tokenData),
        });
        setSessionId(result.sessionId);
        return result;
    },

    /**
     * Retrieve token metadata from server
     * Note: Does not return actual tokens for security
     */
    async retrieve(): Promise<TokenRetrieveResponse> {
        return request<TokenRetrieveResponse>('/tokens/retrieve');
    },

    /**
     * Check if current session is valid
     */
    async checkSession(): Promise<boolean> {
        try {
            const session = await this.retrieve();
            return session.isValid;
        } catch {
            return false;
        }
    },

    /**
     * Revoke tokens and end session
     */
    async revoke(): Promise<void> {
        await request('/tokens/revoke', { method: 'DELETE' });
        clearSession();
    },
};

// =============================================================================
// Profile & Labels API
// =============================================================================

export const profileApi = {
    /**
     * Get user profile
     */
    async getProfile(): Promise<GmailProfile> {
        return request('/profile');
    },

    /**
     * List labels
     */
    async listLabels(): Promise<BackendLabel[]> {
        return request('/labels');
    },

    /**
     * Create label
     */
    async createLabel(
        name: string,
        color?: { textColor: string; backgroundColor: string }
    ): Promise<BackendLabel> {
        return request('/labels', {
            method: 'POST',
            body: JSON.stringify({ name, color }),
        });
    },

    /**
     * Delete label
     */
    async deleteLabel(labelId: string): Promise<void> {
        await request(`/labels/${labelId}`, { method: 'DELETE' });
    },
};

// =============================================================================
// Threads API
// =============================================================================

export const threadsApi = {
    /**
     * List threads
     */
    async list(options?: {
        labelIds?: string[];
        query?: string;
        maxResults?: number;
        pageToken?: string;
    }): Promise<ThreadListResponse> {
        const params = new URLSearchParams();
        if (options?.labelIds?.length) params.set('labelIds', options.labelIds.join(','));
        if (options?.query) params.set('q', options.query);
        if (options?.maxResults) params.set('maxResults', options.maxResults.toString());
        if (options?.pageToken) params.set('pageToken', options.pageToken);

        const queryString = params.toString();
        return request(`/threads${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get thread
     */
    async get(threadId: string): Promise<BackendThread> {
        return request(`/threads/${threadId}`);
    },

    /**
     * Modify thread labels
     */
    async modify(
        threadId: string,
        options: { addLabelIds?: string[]; removeLabelIds?: string[] }
    ): Promise<void> {
        await request(`/threads/${threadId}`, {
            method: 'PATCH',
            body: JSON.stringify(options),
        });
    },

    /**
     * Trash thread
     */
    async trash(threadId: string): Promise<void> {
        await request(`/threads/${threadId}/trash`, { method: 'POST' });
    },

    /**
     * Untrash thread
     */
    async untrash(threadId: string): Promise<void> {
        await request(`/threads/${threadId}/untrash`, { method: 'POST' });
    },

    /**
     * Delete thread permanently
     */
    async delete(threadId: string): Promise<void> {
        await request(`/threads/${threadId}`, { method: 'DELETE' });
    },

    /**
     * Mark as read
     */
    async markAsRead(threadId: string): Promise<void> {
        await this.modify(threadId, { removeLabelIds: ['UNREAD'] });
    },

    /**
     * Mark as unread
     */
    async markAsUnread(threadId: string): Promise<void> {
        await this.modify(threadId, { addLabelIds: ['UNREAD'] });
    },

    /**
     * Archive (remove from inbox)
     */
    async archive(threadId: string): Promise<void> {
        await this.modify(threadId, { removeLabelIds: ['INBOX'] });
    },

    /**
     * Star
     */
    async star(threadId: string): Promise<void> {
        await this.modify(threadId, { addLabelIds: ['STARRED'] });
    },

    /**
     * Unstar
     */
    async unstar(threadId: string): Promise<void> {
        await this.modify(threadId, { removeLabelIds: ['STARRED'] });
    },
};

// =============================================================================
// Messages API
// =============================================================================

export const messagesApi = {
    /**
     * Get message
     */
    async get(messageId: string): Promise<BackendMessage> {
        return request(`/messages/${messageId}`);
    },

    /**
     * Send message
     */
    async send(options: SendMessageOptions): Promise<{ messageId: string }> {
        return request('/messages/send', {
            method: 'POST',
            body: JSON.stringify(options),
        });
    },

    /**
     * Create draft
     */
    async createDraft(options: Omit<SendMessageOptions, 'attachments'>): Promise<{ draftId: string }> {
        return request('/drafts', {
            method: 'POST',
            body: JSON.stringify(options),
        });
    },

    /**
     * Get attachment
     */
    async getAttachment(messageId: string, attachmentId: string): Promise<{ data: string }> {
        return request(`/messages/${messageId}/attachments/${attachmentId}`);
    },

    /**
     * Batch modify messages
     */
    async batchModify(
        messageIds: string[],
        options: { addLabelIds?: string[]; removeLabelIds?: string[] }
    ): Promise<void> {
        await request('/messages/batch', {
            method: 'POST',
            body: JSON.stringify({ messageIds, ...options }),
        });
    },
};

// =============================================================================
// Sync API
// =============================================================================

export const syncApi = {
    /**
     * Get history (incremental sync)
     */
    async getHistory(startHistoryId: string): Promise<{
        threads: string[];
        messages: string[];
        historyId: string;
    }> {
        return request(`/sync/history?startHistoryId=${startHistoryId}`);
    },

    /**
     * Set up push notifications
     */
    async watch(topicName: string): Promise<{ historyId: string; expiration: string }> {
        return request('/sync/watch', {
            method: 'POST',
            body: JSON.stringify({ topicName }),
        });
    },
};

// =============================================================================
// Utility: Transform Backend Types to Frontend Types
// =============================================================================

export function transformBackendThread(backend: BackendThread, accountId: string): EmailThread {
    const messages = backend.messages.map((m) => transformBackendMessage(m, accountId));
    const lastMessage = messages[messages.length - 1];
    const firstMessage = messages[0];

    return {
        id: backend.id,
        accountId,
        historyId: backend.historyId,
        snippet: backend.snippet,
        subject: firstMessage?.subject ?? '(no subject)',
        participants: getUniqueParticipants(messages),
        messages,
        labelIds: backend.labelIds,
        isUnread: messages.some((m) => !m.isRead),
        isStarred: backend.labelIds.includes('STARRED'),
        isImportant: backend.labelIds.includes('IMPORTANT'),
        isPriority: false, // Determined by store based on priority senders
        category: categorizeThread(backend.labelIds),
        lastMessageAt: lastMessage ? new Date(lastMessage.receivedAt).getTime() : Date.now(),
        messageCount: messages.length,
        hasAttachments: messages.some((m) => m.attachments.length > 0),
        isMuted: false,
    };
}

export function transformBackendMessage(backend: BackendMessage, accountId: string): EmailMessage {
    return {
        id: backend.id,
        threadId: backend.threadId,
        accountId,
        from: {
            email: backend.from.email,
            name: backend.from.name,
        },
        to: backend.to.map((p) => ({ email: p.email, name: p.name })),
        cc: backend.cc?.map((p) => ({ email: p.email, name: p.name })),
        bcc: backend.bcc?.map((p) => ({ email: p.email, name: p.name })),
        subject: backend.subject,
        bodyHtml: backend.bodyHtml ?? '',
        bodyText: backend.bodyText ?? '',
        snippet: backend.snippet,
        attachments: backend.attachments.map((a) => ({
            id: a.id,
            messageId: backend.id,
            filename: a.filename,
            mimeType: a.mimeType,
            size: a.size,
            isInline: false,
        })),
        internalDate: new Date(backend.date).getTime(),
        receivedAt: new Date(backend.date).getTime(),
        headers: {
            messageId: backend.id,
            contentType: 'text/html',
            mimeVersion: '1.0',
        },
        labelIds: backend.labelIds,
        isRead: !backend.isUnread,
        hasUnsubscribe: false,
    };
}

export function transformBackendLabel(backend: BackendLabel, accountId: string): Label {
    return {
        id: backend.id,
        accountId,
        name: backend.name,
        type: backend.type,
        messageListVisibility: (backend.messageListVisibility as 'show' | 'hide') ?? 'show',
        labelListVisibility: (backend.labelListVisibility as 'labelShow' | 'labelShowIfUnread' | 'labelHide') ?? 'labelShow',
        color: backend.color,
        unreadCount: backend.messagesUnread,
        totalCount: backend.messagesTotal,
        threadsUnread: backend.messagesUnread,
        threadsTotal: backend.messagesTotal,
    };
}

function getUniqueParticipants(messages: EmailMessage[]): EmailMessage['from'][] {
    const seen = new Set<string>();
    const participants: EmailMessage['from'][] = [];

    for (const message of messages) {
        if (!seen.has(message.from.email)) {
            seen.add(message.from.email);
            participants.push(message.from);
        }
        for (const to of message.to) {
            if (!seen.has(to.email)) {
                seen.add(to.email);
                participants.push(to);
            }
        }
    }

    return participants;
}

function categorizeThread(labelIds: string[]): EmailThread['category'] {
    if (labelIds.includes('CATEGORY_PROMOTIONS')) return 'promotions';
    if (labelIds.includes('CATEGORY_SOCIAL')) return 'social';
    if (labelIds.includes('CATEGORY_UPDATES')) return 'notifications';
    if (labelIds.includes('CATEGORY_FORUMS')) return 'forums';
    return 'primary';
}

// =============================================================================
// Unified Export
// =============================================================================

export const sparklesApi = {
    auth: authApi,
    profile: profileApi,
    threads: threadsApi,
    messages: messagesApi,
    sync: syncApi,
    // Session helpers
    hasSession,
    getSessionId,
    clearSession,
    // Transformers
    transformBackendThread,
    transformBackendMessage,
    transformBackendLabel,
};

export default sparklesApi;
