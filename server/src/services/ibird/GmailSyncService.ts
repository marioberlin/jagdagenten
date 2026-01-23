/**
 * Gmail Sync Service
 * Fetches emails from Gmail API using stored OAuth tokens
 */

import { mailAccountService } from './index.js';
import { mailMessageService } from './index.js';
import { pool } from '../../db.js';

const GMAIL_API_BASE = 'https://www.googleapis.com/gmail/v1/users/me';

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  payload: {
    mimeType: string;
    headers: Array<{ name: string; value: string }>;
    body?: { size: number; data?: string };
    parts?: Array<{
      mimeType: string;
      body?: { size: number; data?: string };
      parts?: any[];
    }>;
  };
  internalDate: string;
  sizeEstimate: number;
}

export class GmailSyncService {
  /**
   * Sync inbox messages from Gmail for an account
   */
  async syncInbox(accountId: string, userId: string, maxResults = 20): Promise<{ synced: number; errors: string[] }> {
    console.log('[GmailSync] Starting sync for account:', accountId);
    const errors: string[] = [];

    // Get credentials
    const credentials = await mailAccountService.getCredentials(accountId, userId);
    if (!credentials?.accessToken) {
      throw new Error('No OAuth credentials found for this account');
    }

    let accessToken = credentials.accessToken;

    // Try to refresh token if we have a refresh token
    if (credentials.refreshToken) {
      try {
        const refreshed = await this.refreshTokenIfNeeded(accountId, credentials);
        if (refreshed) accessToken = refreshed;
      } catch (err) {
        console.warn('[GmailSync] Token refresh failed, trying existing token:', err);
      }
    }

    // Ensure inbox folder exists
    const folderId = await this.ensureInboxFolder(accountId);

    // Fetch message list from Gmail
    const listRes = await fetch(
      `${GMAIL_API_BASE}/messages?maxResults=${maxResults}&labelIds=INBOX`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!listRes.ok) {
      const errText = await listRes.text();
      throw new Error(`Gmail API error (${listRes.status}): ${errText}`);
    }

    const listData = await listRes.json() as { messages?: Array<{ id: string; threadId: string }> };
    if (!listData.messages?.length) {
      await mailAccountService.updateStatus(accountId, 'active');
      return { synced: 0, errors };
    }

    console.log('[GmailSync] Fetching', listData.messages.length, 'messages from Gmail');

    // Fetch each message detail
    let synced = 0;
    for (const msg of listData.messages) {
      try {
        const msgRes = await fetch(
          `${GMAIL_API_BASE}/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!msgRes.ok) {
          errors.push(`Failed to fetch message ${msg.id}: ${msgRes.status}`);
          continue;
        }

        const gmailMsg = await msgRes.json() as GmailMessage;
        await this.upsertGmailMessage(gmailMsg, folderId, accountId);
        synced++;
      } catch (err: any) {
        console.error('[GmailSync] Error syncing message:', msg.id, err.message);
        errors.push(`Error processing message ${msg.id}: ${err.message}`);
        break;
      }
    }

    // Update account status
    await mailAccountService.updateStatus(accountId, 'active');

    return { synced, errors };
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshTokenIfNeeded(
    accountId: string,
    credentials: { accessToken: string; refreshToken?: string; expiresAt?: string }
  ): Promise<string | null> {
    // Check if token is expired or about to expire (within 5 minutes)
    if (credentials.expiresAt) {
      const expiresAt = new Date(credentials.expiresAt).getTime();
      const now = Date.now();
      if (expiresAt > now + 5 * 60 * 1000) {
        return null; // Token still valid
      }
    }

    if (!credentials.refreshToken) return null;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: credentials.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) return null;

    const tokens = await response.json() as { access_token: string; expires_in: number };
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await mailAccountService.updateOAuthTokens(accountId, {
      accessToken: tokens.access_token,
      refreshToken: credentials.refreshToken,
      expiresAt,
    });

    return tokens.access_token;
  }

  /**
   * Ensure the inbox folder exists for the account, return its ID
   */
  private async ensureInboxFolder(accountId: string): Promise<string> {
    const folders = await mailAccountService.listFolders(accountId);
    const inbox = folders.find(f => f.folderType === 'inbox');
    if (inbox) return inbox.id;

    // Create inbox folder
    const result = await pool.query(
      `INSERT INTO ibird_mail_folders (account_id, name, folder_type, path)
       VALUES ($1, 'Inbox', 'inbox', 'INBOX')
       RETURNING id`,
      [accountId]
    );
    return result.rows[0].id;
  }

  /**
   * Convert Gmail message to our format and upsert
   */
  private async upsertGmailMessage(gmail: GmailMessage, folderId: string, accountId: string): Promise<void> {
    const headers = gmail.payload.headers;
    const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const fromRaw = getHeader('From');
    const toRaw = getHeader('To');
    const ccRaw = getHeader('Cc');
    const subject = getHeader('Subject');
    const date = getHeader('Date');
    const messageId = getHeader('Message-ID') || gmail.id;

    // Extract body
    const body = this.extractBody(gmail.payload);

    // Parse email address string into EmailAddress object
    const parseAddress = (addr: string): { email: string; name?: string } => {
      const match = addr.match(/^(.+?)\s*<(.+?)>$/);
      if (match) {
        return { email: match[2], name: match[1].replace(/"/g, '').trim() };
      }
      return { email: addr.trim() };
    };

    // Parse multiple addresses
    const parseAddresses = (raw: string): { email: string; name?: string }[] => {
      if (!raw) return [];
      return raw.split(',').map(s => parseAddress(s.trim())).filter(a => a.email);
    };

    // Check if unread (UNREAD label present)
    const isUnread = gmail.labelIds?.includes('UNREAD') ?? false;
    const isStarred = gmail.labelIds?.includes('STARRED') ?? false;

    const receivedAt = date ? new Date(date) : new Date(parseInt(gmail.internalDate));

    await mailMessageService.upsertMessage({
      accountId,
      folderId,
      messageId,
      threadId: gmail.threadId,
      subject: subject || '(no subject)',
      from: parseAddress(fromRaw),
      to: parseAddresses(toRaw),
      cc: parseAddresses(ccRaw),
      receivedAt,
      sentAt: receivedAt,
      snippet: gmail.snippet,
      bodyText: body.text,
      bodyHtml: body.html,
      isRead: !isUnread,
      isStarred,
      sizeBytes: gmail.sizeEstimate,
    });
  }

  /**
   * Extract text/html body from Gmail message payload
   */
  private extractBody(payload: GmailMessage['payload']): { text?: string; html?: string } {
    const result: { text?: string; html?: string } = {};

    if (payload.mimeType === 'text/plain' && payload.body?.data) {
      result.text = this.decodeBase64(payload.body.data);
    } else if (payload.mimeType === 'text/html' && payload.body?.data) {
      result.html = this.decodeBase64(payload.body.data);
    } else if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          result.text = this.decodeBase64(part.body.data);
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          result.html = this.decodeBase64(part.body.data);
        } else if (part.mimeType === 'multipart/alternative' && part.parts) {
          for (const subpart of part.parts) {
            if (subpart.mimeType === 'text/plain' && subpart.body?.data) {
              result.text = this.decodeBase64(subpart.body.data);
            } else if (subpart.mimeType === 'text/html' && subpart.body?.data) {
              result.html = this.decodeBase64(subpart.body.data);
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Decode base64url encoded string
   */
  private decodeBase64(data: string): string {
    // Gmail uses URL-safe base64
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  }
}

export const gmailSyncService = new GmailSyncService();
