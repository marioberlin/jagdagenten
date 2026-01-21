/**
 * GmailService - Gmail API Integration for Sparkles Email Client
 *
 * Handles OAuth authentication, email synchronization, and all Gmail operations.
 * Uses Google APIs with user-level OAuth tokens (not service account).
 */

import { google } from 'googleapis';
import type { gmail_v1 } from 'googleapis';
import { componentLoggers } from '../../logger.js';
import { cache } from '../../cache.js';

const logger = componentLoggers.http;

// =============================================================================
// Types
// =============================================================================

export interface GmailCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface GmailProfile {
  email: string;
  name: string;
  avatar?: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  date: string;
  bodyHtml?: string;
  bodyText?: string;
  attachments: GmailAttachment[];
  isUnread: boolean;
  isStarred: boolean;
  isDraft: boolean;
}

export interface GmailThread {
  id: string;
  historyId: string;
  snippet: string;
  messages: GmailMessage[];
  labelIds: string[];
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface GmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface GmailLabel {
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

export interface SyncResult {
  threads: GmailThread[];
  labels: GmailLabel[];
  historyId: string;
  hasMore: boolean;
  nextPageToken?: string;
}

export interface SendMessageOptions {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
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
// Service Implementation
// =============================================================================

export class GmailService {
  private oauth2Client;
  private gmail: gmail_v1.Gmail | null = null;
  private credentials: GmailCredentials | null = null;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/google/callback';

    if (!clientId || !clientSecret) {
      logger.warn('Google OAuth credentials missing. GmailService will require authentication.');
    }

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  /**
   * Generate OAuth URL for user authentication
   */
  getAuthUrl(state?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state,
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GmailCredentials> {
    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to obtain access tokens');
    }

    const credentials: GmailCredentials = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date || Date.now() + 3600 * 1000,
    };

    await this.setCredentials(credentials);
    return credentials;
  }

  /**
   * Set credentials and initialize Gmail client
   */
  async setCredentials(credentials: GmailCredentials): Promise<void> {
    this.credentials = credentials;

    // Check if token needs refresh
    if (Date.now() >= credentials.expiresAt - 60000) {
      await this.refreshAccessToken();
    }

    this.oauth2Client.setCredentials({
      access_token: this.credentials.accessToken,
      refresh_token: this.credentials.refreshToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<GmailCredentials> {
    if (!this.credentials?.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.oauth2Client.setCredentials({
      refresh_token: this.credentials.refreshToken,
    });

    const { credentials: newTokens } = await this.oauth2Client.refreshAccessToken();

    this.credentials = {
      accessToken: newTokens.access_token!,
      refreshToken: this.credentials.refreshToken,
      expiresAt: newTokens.expiry_date || Date.now() + 3600 * 1000,
    };

    return this.credentials;
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<GmailProfile> {
    if (!this.gmail) throw new Error('Gmail client not initialized');

    const profile = await this.gmail.users.getProfile({ userId: 'me' });
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    return {
      email: profile.data.emailAddress!,
      name: userInfo.data.name || profile.data.emailAddress!,
      avatar: userInfo.data.picture || undefined,
    };
  }

  /**
   * List labels
   */
  async listLabels(): Promise<GmailLabel[]> {
    if (!this.gmail) throw new Error('Gmail client not initialized');

    const response = await this.gmail.users.labels.list({ userId: 'me' });
    const labels: GmailLabel[] = [];

    for (const label of response.data.labels || []) {
      // Get detailed label info
      const detail = await this.gmail.users.labels.get({
        userId: 'me',
        id: label.id!,
      });

      labels.push({
        id: detail.data.id!,
        name: detail.data.name!,
        type: detail.data.type === 'system' ? 'system' : 'user',
        messageListVisibility: detail.data.messageListVisibility || undefined,
        labelListVisibility: detail.data.labelListVisibility || undefined,
        color: detail.data.color
          ? {
              textColor: detail.data.color.textColor || '#000000',
              backgroundColor: detail.data.color.backgroundColor || '#ffffff',
            }
          : undefined,
        messagesTotal: detail.data.messagesTotal || 0,
        messagesUnread: detail.data.messagesUnread || 0,
      });
    }

    return labels;
  }

  /**
   * List threads with optional label filter
   */
  async listThreads(options: {
    labelIds?: string[];
    query?: string;
    maxResults?: number;
    pageToken?: string;
  } = {}): Promise<{ threads: GmailThread[]; nextPageToken?: string }> {
    if (!this.gmail) throw new Error('Gmail client not initialized');

    const { labelIds, query, maxResults = 50, pageToken } = options;

    const response = await this.gmail.users.threads.list({
      userId: 'me',
      labelIds,
      q: query,
      maxResults,
      pageToken,
    });

    const threads: GmailThread[] = [];

    for (const threadMeta of response.data.threads || []) {
      const thread = await this.getThread(threadMeta.id!);
      if (thread) threads.push(thread);
    }

    return {
      threads,
      nextPageToken: response.data.nextPageToken || undefined,
    };
  }

  /**
   * Get full thread with messages
   */
  async getThread(threadId: string): Promise<GmailThread | null> {
    if (!this.gmail) throw new Error('Gmail client not initialized');

    try {
      const response = await this.gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'full',
      });

      const messages: GmailMessage[] = [];
      for (const msg of response.data.messages || []) {
        messages.push(this.parseMessage(msg));
      }

      return {
        id: response.data.id!,
        historyId: response.data.historyId!,
        snippet: response.data.snippet || '',
        messages,
        labelIds: messages[0]?.labelIds || [],
      };
    } catch (error) {
      logger.error({ threadId, error }, 'Failed to get thread');
      return null;
    }
  }

  /**
   * Get single message
   */
  async getMessage(messageId: string): Promise<GmailMessage | null> {
    if (!this.gmail) throw new Error('Gmail client not initialized');

    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      return this.parseMessage(response.data);
    } catch (error) {
      logger.error({ messageId, error }, 'Failed to get message');
      return null;
    }
  }

  /**
   * Modify thread labels
   */
  async modifyThread(
    threadId: string,
    options: { addLabelIds?: string[]; removeLabelIds?: string[] }
  ): Promise<void> {
    if (!this.gmail) throw new Error('Gmail client not initialized');

    await this.gmail.users.threads.modify({
      userId: 'me',
      id: threadId,
      requestBody: {
        addLabelIds: options.addLabelIds,
        removeLabelIds: options.removeLabelIds,
      },
    });

    logger.info({ threadId, ...options }, 'Thread labels modified');
  }

  /**
   * Trash thread
   */
  async trashThread(threadId: string): Promise<void> {
    if (!this.gmail) throw new Error('Gmail client not initialized');

    await this.gmail.users.threads.trash({
      userId: 'me',
      id: threadId,
    });

    logger.info({ threadId }, 'Thread trashed');
  }

  /**
   * Untrash thread
   */
  async untrashThread(threadId: string): Promise<void> {
    if (!this.gmail) throw new Error('Gmail client not initialized');

    await this.gmail.users.threads.untrash({
      userId: 'me',
      id: threadId,
    });

    logger.info({ threadId }, 'Thread untrashed');
  }

  /**
   * Delete thread permanently
   */
  async deleteThread(threadId: string): Promise<void> {
    if (!this.gmail) throw new Error('Gmail client not initialized');

    await this.gmail.users.threads.delete({
      userId: 'me',
      id: threadId,
    });

    logger.info({ threadId }, 'Thread deleted permanently');
  }

  /**
   * Send a message
   */
  async sendMessage(options: SendMessageOptions): Promise<string> {
    if (!this.gmail) throw new Error('Gmail client not initialized');

    const message = this.buildMessage(options);
    const encodedMessage = Buffer.from(message).toString('base64url');

    const response = await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: options.threadId,
      },
    });

    logger.info({ messageId: response.data.id, to: options.to }, 'Message sent');
    return response.data.id!;
  }

  /**
   * Create draft
   */
  async createDraft(options: SendMessageOptions): Promise<string> {
    if (!this.gmail) throw new Error('Gmail client not initialized');

    const message = this.buildMessage(options);
    const encodedMessage = Buffer.from(message).toString('base64url');

    const response = await this.gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedMessage,
          threadId: options.threadId,
        },
      },
    });

    logger.info({ draftId: response.data.id }, 'Draft created');
    return response.data.id!;
  }

  /**
   * Get attachment data
   */
  async getAttachment(messageId: string, attachmentId: string): Promise<string> {
    if (!this.gmail) throw new Error('Gmail client not initialized');

    const response = await this.gmail.users.messages.attachments.get({
      userId: 'me',
      messageId,
      id: attachmentId,
    });

    return response.data.data!;
  }

  /**
   * Create label
   */
  async createLabel(name: string, color?: { textColor: string; backgroundColor: string }): Promise<GmailLabel> {
    if (!this.gmail) throw new Error('Gmail client not initialized');

    const response = await this.gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
        color,
      },
    });

    return {
      id: response.data.id!,
      name: response.data.name!,
      type: 'user',
      color,
      messagesTotal: 0,
      messagesUnread: 0,
    };
  }

  /**
   * Delete label
   */
  async deleteLabel(labelId: string): Promise<void> {
    if (!this.gmail) throw new Error('Gmail client not initialized');

    await this.gmail.users.labels.delete({
      userId: 'me',
      id: labelId,
    });

    logger.info({ labelId }, 'Label deleted');
  }

  /**
   * Watch for changes (push notifications)
   */
  async watchMailbox(topicName: string): Promise<{ historyId: string; expiration: string }> {
    if (!this.gmail) throw new Error('Gmail client not initialized');

    const response = await this.gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName,
        labelIds: ['INBOX'],
      },
    });

    return {
      historyId: response.data.historyId!,
      expiration: response.data.expiration!,
    };
  }

  /**
   * Get history (incremental sync)
   */
  async getHistory(startHistoryId: string): Promise<{
    threads: string[];
    messages: string[];
    historyId: string;
  }> {
    if (!this.gmail) throw new Error('Gmail client not initialized');

    const response = await this.gmail.users.history.list({
      userId: 'me',
      startHistoryId,
      historyTypes: ['messageAdded', 'messageDeleted', 'labelAdded', 'labelRemoved'],
    });

    const threads = new Set<string>();
    const messages = new Set<string>();

    for (const history of response.data.history || []) {
      for (const added of history.messagesAdded || []) {
        messages.add(added.message!.id!);
        threads.add(added.message!.threadId!);
      }
      for (const deleted of history.messagesDeleted || []) {
        messages.add(deleted.message!.id!);
        threads.add(deleted.message!.threadId!);
      }
    }

    return {
      threads: Array.from(threads),
      messages: Array.from(messages),
      historyId: response.data.historyId || startHistoryId,
    };
  }

  /**
   * Batch modify messages
   */
  async batchModifyMessages(
    messageIds: string[],
    options: { addLabelIds?: string[]; removeLabelIds?: string[] }
  ): Promise<void> {
    if (!this.gmail) throw new Error('Gmail client not initialized');

    await this.gmail.users.messages.batchModify({
      userId: 'me',
      requestBody: {
        ids: messageIds,
        addLabelIds: options.addLabelIds,
        removeLabelIds: options.removeLabelIds,
      },
    });

    logger.info({ count: messageIds.length, ...options }, 'Batch modify completed');
  }

  // =============================================================================
  // Private Helpers
  // =============================================================================

  private parseMessage(msg: gmail_v1.Schema$Message): GmailMessage {
    const headers = msg.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value;

    // Parse email addresses
    const parseAddresses = (value?: string): EmailAddress[] => {
      if (!value) return [];
      const matches = value.match(/(?:"?([^"]*)"?\s)?<?([^\s<>]+@[^\s<>]+)>?/g) || [];
      return matches.map((match) => {
        const parts = match.match(/(?:"?([^"]*)"?\s)?<?([^\s<>]+@[^\s<>]+)>?/);
        return {
          name: parts?.[1]?.trim(),
          email: parts?.[2] || match.replace(/[<>]/g, ''),
        };
      });
    };

    // Get body content
    const getBody = (parts: gmail_v1.Schema$MessagePart[] | undefined, mimeType: string): string | undefined => {
      if (!parts) return undefined;

      for (const part of parts) {
        if (part.mimeType === mimeType && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
        if (part.parts) {
          const nested = getBody(part.parts, mimeType);
          if (nested) return nested;
        }
      }

      return undefined;
    };

    // Get attachments
    const getAttachments = (parts: gmail_v1.Schema$MessagePart[] | undefined): GmailAttachment[] => {
      const attachments: GmailAttachment[] = [];

      const processparts = (parts: gmail_v1.Schema$MessagePart[] | undefined) => {
        if (!parts) return;
        for (const part of parts) {
          if (part.filename && part.body?.attachmentId) {
            attachments.push({
              id: part.body.attachmentId,
              filename: part.filename,
              mimeType: part.mimeType || 'application/octet-stream',
              size: part.body.size || 0,
            });
          }
          if (part.parts) {
            processparts(part.parts);
          }
        }
      };

      processparts(parts);
      return attachments;
    };

    const from = parseAddresses(getHeader('From'))[0] || { email: 'unknown' };
    const bodyParts = msg.payload?.parts || (msg.payload ? [msg.payload] : []);

    return {
      id: msg.id!,
      threadId: msg.threadId!,
      labelIds: msg.labelIds || [],
      snippet: msg.snippet || '',
      from,
      to: parseAddresses(getHeader('To')),
      cc: parseAddresses(getHeader('Cc')),
      bcc: parseAddresses(getHeader('Bcc')),
      subject: getHeader('Subject') || '(no subject)',
      date: getHeader('Date') || new Date().toISOString(),
      bodyHtml: getBody(bodyParts, 'text/html'),
      bodyText: getBody(bodyParts, 'text/plain'),
      attachments: getAttachments(bodyParts),
      isUnread: msg.labelIds?.includes('UNREAD') || false,
      isStarred: msg.labelIds?.includes('STARRED') || false,
      isDraft: msg.labelIds?.includes('DRAFT') || false,
    };
  }

  private buildMessage(options: SendMessageOptions): string {
    const boundary = `----=_Part_${Date.now()}`;
    const headers: string[] = [];

    // Required headers
    headers.push(`To: ${options.to.map((a) => (a.name ? `"${a.name}" <${a.email}>` : a.email)).join(', ')}`);
    headers.push(`Subject: ${options.subject}`);
    headers.push(`MIME-Version: 1.0`);

    // Optional headers
    if (options.cc?.length) {
      headers.push(`Cc: ${options.cc.map((a) => (a.name ? `"${a.name}" <${a.email}>` : a.email)).join(', ')}`);
    }
    if (options.bcc?.length) {
      headers.push(`Bcc: ${options.bcc.map((a) => (a.name ? `"${a.name}" <${a.email}>` : a.email)).join(', ')}`);
    }
    if (options.inReplyTo) {
      headers.push(`In-Reply-To: ${options.inReplyTo}`);
    }
    if (options.references) {
      headers.push(`References: ${options.references}`);
    }

    // Build message
    if (options.attachments?.length) {
      headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);

      const parts = [
        `--${boundary}`,
        `Content-Type: ${options.isHtml ? 'text/html' : 'text/plain'}; charset="UTF-8"`,
        '',
        options.body,
      ];

      for (const attachment of options.attachments) {
        parts.push(
          `--${boundary}`,
          `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
          `Content-Disposition: attachment; filename="${attachment.filename}"`,
          `Content-Transfer-Encoding: base64`,
          '',
          attachment.content
        );
      }

      parts.push(`--${boundary}--`);

      return headers.join('\r\n') + '\r\n\r\n' + parts.join('\r\n');
    } else {
      headers.push(`Content-Type: ${options.isHtml ? 'text/html' : 'text/plain'}; charset="UTF-8"`);
      return headers.join('\r\n') + '\r\n\r\n' + options.body;
    }
  }
}

// Singleton export - each user session should create their own instance
export const createGmailService = () => new GmailService();
