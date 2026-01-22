# iBird - Backend Services

> Service layer implementations for mail, calendar, and appointments

---

## Service Architecture

```
server/src/services/ibird/
├── MailService.ts              # High-level mail operations
├── ImapClient.ts               # IMAP connection management
├── SmtpClient.ts               # SMTP connection management
├── MailParser.ts               # Email parsing utilities
├── CalendarService.ts          # High-level calendar operations
├── CalDavClient.ts             # CalDAV protocol client
├── GoogleCalendarClient.ts     # Google Calendar API client
├── ICalParser.ts               # iCalendar parsing utilities
├── AppointmentService.ts       # Appointment/booking operations
├── AvailabilityService.ts      # Slot availability calculations
├── NotificationService.ts      # Email notifications
├── EncryptionService.ts        # Password/token encryption
└── SyncService.ts              # Background sync orchestration
```

---

## 1. Mail Service

### `MailService.ts`

```typescript
/**
 * MailService - High-level email operations
 *
 * Responsibilities:
 * - Account management (add, remove, update)
 * - Folder operations
 * - Message retrieval and manipulation
 * - Send/draft operations
 * - Sync orchestration
 */

import { ImapClient } from './ImapClient';
import { SmtpClient } from './SmtpClient';
import { MailParser } from './MailParser';
import { query } from '../../db';
import { EncryptionService } from './EncryptionService';

export interface MailAccount {
  id: string;
  userId: string;
  name: string;
  email: string;
  provider: string | null;
  imap: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
  };
  smtp: {
    host: string;
    port: number;
    secure: 'none' | 'ssl' | 'starttls';
    username: string;
  };
}

export interface MailMessage {
  id: string;
  folderId: string;
  messageId: string;
  threadId: string | null;
  subject: string;
  from: { name: string; email: string };
  to: Array<{ name: string; email: string }>;
  cc: Array<{ name: string; email: string }>;
  snippet: string;
  bodyText: string;
  bodyHtml: string;
  dateSent: Date;
  dateReceived: Date;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments: Attachment[];
  labels: string[];
}

export class MailService {
  private imapClients: Map<string, ImapClient> = new Map();
  private smtpClients: Map<string, SmtpClient> = new Map();

  constructor(
    private encryption: EncryptionService
  ) {}

  // ============================================================
  // ACCOUNT MANAGEMENT
  // ============================================================

  async addAccount(userId: string, config: AddAccountConfig): Promise<MailAccount> {
    // 1. Test IMAP connection
    const imapClient = new ImapClient({
      host: config.imap.host,
      port: config.imap.port,
      secure: config.imap.secure,
      username: config.imap.username,
      password: config.imap.password,
    });
    await imapClient.testConnection();

    // 2. Test SMTP connection
    const smtpClient = new SmtpClient({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      username: config.smtp.username,
      password: config.smtp.password,
    });
    await smtpClient.testConnection();

    // 3. Encrypt passwords
    const imapPasswordEncrypted = await this.encryption.encrypt(config.imap.password);
    const smtpPasswordEncrypted = await this.encryption.encrypt(config.smtp.password);

    // 4. Insert into database
    const result = await query(`
      INSERT INTO ibird_mail_accounts (
        user_id, name, email, provider,
        imap_host, imap_port, imap_secure, imap_username, imap_password_encrypted,
        smtp_host, smtp_port, smtp_secure, smtp_username, smtp_password_encrypted,
        is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      userId, config.name, config.email, config.provider,
      config.imap.host, config.imap.port, config.imap.secure,
      config.imap.username, imapPasswordEncrypted,
      config.smtp.host, config.smtp.port, config.smtp.secure,
      config.smtp.username, smtpPasswordEncrypted,
      false // is_default
    ]);

    // 5. Create default identity
    await query(`
      INSERT INTO ibird_mail_identities (account_id, name, email, is_default)
      VALUES ($1, $2, $3, true)
    `, [result.rows[0].id, config.name, config.email]);

    // 6. Trigger initial folder sync
    await this.syncFolders(result.rows[0].id);

    return this.mapAccountRow(result.rows[0]);
  }

  async addOAuthAccount(userId: string, provider: string, oauthCode: string): Promise<MailAccount> {
    // 1. Exchange code for tokens
    const tokens = await this.exchangeOAuthCode(provider, oauthCode);

    // 2. Get user email from provider
    const userInfo = await this.getOAuthUserInfo(provider, tokens.accessToken);

    // 3. Get provider's IMAP/SMTP settings
    const providerSettings = this.getProviderSettings(provider);

    // 4. Insert account with OAuth tokens
    const result = await query(`
      INSERT INTO ibird_mail_accounts (
        user_id, name, email, provider,
        imap_host, imap_port, imap_secure, imap_username,
        smtp_host, smtp_port, smtp_secure, smtp_username,
        oauth_access_token_encrypted, oauth_refresh_token_encrypted, oauth_expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      userId, userInfo.name, userInfo.email, provider,
      providerSettings.imap.host, providerSettings.imap.port, true, userInfo.email,
      providerSettings.smtp.host, providerSettings.smtp.port, 'starttls', userInfo.email,
      await this.encryption.encrypt(tokens.accessToken),
      await this.encryption.encrypt(tokens.refreshToken),
      tokens.expiresAt
    ]);

    return this.mapAccountRow(result.rows[0]);
  }

  async removeAccount(accountId: string): Promise<void> {
    // Close active connections
    this.imapClients.get(accountId)?.disconnect();
    this.imapClients.delete(accountId);
    this.smtpClients.delete(accountId);

    // Delete from database (cascades to folders, messages)
    await query('DELETE FROM ibird_mail_accounts WHERE id = $1', [accountId]);
  }

  // ============================================================
  // FOLDER OPERATIONS
  // ============================================================

  async syncFolders(accountId: string): Promise<void> {
    const client = await this.getImapClient(accountId);
    const remoteFolders = await client.listFolders();

    // Get existing folders
    const existingFolders = await query(
      'SELECT * FROM ibird_mail_folders WHERE account_id = $1',
      [accountId]
    );
    const existingPaths = new Set(existingFolders.rows.map(f => f.path));

    // Add new folders
    for (const folder of remoteFolders) {
      if (!existingPaths.has(folder.path)) {
        await query(`
          INSERT INTO ibird_mail_folders (
            account_id, name, path, folder_type, is_subscribed
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          accountId,
          folder.name,
          folder.path,
          this.detectFolderType(folder),
          folder.subscribed
        ]);
      }
    }

    // Update folder counts
    await this.updateFolderCounts(accountId);
  }

  async createFolder(accountId: string, name: string, parentPath?: string): Promise<Folder> {
    const client = await this.getImapClient(accountId);
    const fullPath = parentPath ? `${parentPath}/${name}` : name;

    await client.createFolder(fullPath);

    const result = await query(`
      INSERT INTO ibird_mail_folders (account_id, name, path, folder_type)
      VALUES ($1, $2, $3, 'custom')
      RETURNING *
    `, [accountId, name, fullPath]);

    return this.mapFolderRow(result.rows[0]);
  }

  async deleteFolder(folderId: string): Promise<void> {
    const folder = await query('SELECT * FROM ibird_mail_folders WHERE id = $1', [folderId]);
    if (!folder.rows[0]) throw new Error('Folder not found');

    const client = await this.getImapClient(folder.rows[0].account_id);
    await client.deleteFolder(folder.rows[0].path);

    await query('DELETE FROM ibird_mail_folders WHERE id = $1', [folderId]);
  }

  // ============================================================
  // MESSAGE OPERATIONS
  // ============================================================

  async syncMessages(folderId: string, options?: SyncOptions): Promise<SyncResult> {
    const folder = await this.getFolder(folderId);
    const client = await this.getImapClient(folder.accountId);

    // Open folder and get status
    const status = await client.selectFolder(folder.path);

    // Check for changes using UIDVALIDITY
    if (folder.uidvalidity && status.uidvalidity !== folder.uidvalidity) {
      // UIDVALIDITY changed - need full resync
      await query('DELETE FROM ibird_mail_messages WHERE folder_id = $1', [folderId]);
    }

    // Fetch new messages since last sync
    const newMessages = await client.fetchMessagesSince(folder.uidnext || 1);

    // Parse and store messages
    for (const msg of newMessages) {
      const parsed = MailParser.parse(msg);
      await this.storeMessage(folderId, folder.accountId, parsed);
    }

    // Update folder state
    await query(`
      UPDATE ibird_mail_folders
      SET uidvalidity = $1, uidnext = $2, highest_modseq = $3
      WHERE id = $4
    `, [status.uidvalidity, status.uidnext, status.highestModseq, folderId]);

    // Update counts
    await this.updateFolderCounts(folder.accountId);

    return {
      newCount: newMessages.length,
      totalCount: status.messages,
    };
  }

  async getMessage(messageId: string): Promise<MailMessage> {
    const result = await query(`
      SELECT m.*, f.account_id
      FROM ibird_mail_messages m
      JOIN ibird_mail_folders f ON m.folder_id = f.id
      WHERE m.id = $1
    `, [messageId]);

    if (!result.rows[0]) throw new Error('Message not found');

    // If body not cached, fetch from server
    if (!result.rows[0].body_html && !result.rows[0].body_text) {
      await this.fetchMessageBody(messageId);
      return this.getMessage(messageId);
    }

    return this.mapMessageRow(result.rows[0]);
  }

  async getMessages(folderId: string, options: GetMessagesOptions): Promise<PaginatedMessages> {
    const { page = 1, limit = 50, sort = 'date', sortDir = 'desc', filters } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE m.folder_id = $1';
    const params: any[] = [folderId];
    let paramIndex = 2;

    // Apply filters
    if (filters?.unreadOnly) {
      whereClause += ` AND m.is_read = false`;
    }
    if (filters?.starredOnly) {
      whereClause += ` AND m.is_starred = true`;
    }
    if (filters?.hasAttachments) {
      whereClause += ` AND m.has_attachments = true`;
    }
    if (filters?.labels?.length) {
      whereClause += ` AND m.labels && $${paramIndex++}`;
      params.push(filters.labels);
    }
    if (filters?.search) {
      whereClause += ` AND (
        m.subject ILIKE $${paramIndex} OR
        m.body_text ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM ibird_mail_messages m ${whereClause}`,
      params.slice(0, paramIndex - 1)
    );

    // Get messages
    const sortColumn = this.getSortColumn(sort);
    const result = await query(`
      SELECT m.*,
        (SELECT COUNT(*) FROM ibird_mail_attachments WHERE message_id = m.id) as attachment_count
      FROM ibird_mail_messages m
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDir.toUpperCase()}
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `, [...params, limit, offset]);

    return {
      messages: result.rows.map(this.mapMessageRow),
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    };
  }

  async updateMessageFlags(messageId: string, flags: Partial<MessageFlags>): Promise<void> {
    const message = await this.getMessageWithFolder(messageId);
    const client = await this.getImapClient(message.accountId);

    // Update on server
    await client.selectFolder(message.folderPath);
    if (flags.isRead !== undefined) {
      await client.setFlag(message.uid, '\\Seen', flags.isRead);
    }
    if (flags.isStarred !== undefined) {
      await client.setFlag(message.uid, '\\Flagged', flags.isStarred);
    }

    // Update in database
    const updates: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (flags.isRead !== undefined) {
      updates.push(`is_read = $${i++}`);
      values.push(flags.isRead);
    }
    if (flags.isStarred !== undefined) {
      updates.push(`is_starred = $${i++}`);
      values.push(flags.isStarred);
    }
    if (flags.labels !== undefined) {
      updates.push(`labels = $${i++}`);
      values.push(flags.labels);
    }

    await query(
      `UPDATE ibird_mail_messages SET ${updates.join(', ')} WHERE id = $${i}`,
      [...values, messageId]
    );
  }

  async moveMessage(messageId: string, targetFolderId: string): Promise<void> {
    const message = await this.getMessageWithFolder(messageId);
    const targetFolder = await this.getFolder(targetFolderId);

    if (message.accountId !== targetFolder.accountId) {
      throw new Error('Cannot move message between accounts');
    }

    const client = await this.getImapClient(message.accountId);

    // Move on server
    await client.selectFolder(message.folderPath);
    await client.moveMessage(message.uid, targetFolder.path);

    // Update in database
    await query(
      'UPDATE ibird_mail_messages SET folder_id = $1 WHERE id = $2',
      [targetFolderId, messageId]
    );

    // Update folder counts
    await this.updateFolderCounts(message.accountId);
  }

  async deleteMessage(messageId: string, permanent: boolean = false): Promise<void> {
    const message = await this.getMessageWithFolder(messageId);
    const client = await this.getImapClient(message.accountId);

    if (permanent) {
      // Permanently delete
      await client.selectFolder(message.folderPath);
      await client.deleteMessage(message.uid);
      await query('DELETE FROM ibird_mail_messages WHERE id = $1', [messageId]);
    } else {
      // Move to trash
      const trashFolder = await this.getTrashFolder(message.accountId);
      await this.moveMessage(messageId, trashFolder.id);
    }
  }

  // ============================================================
  // SEND OPERATIONS
  // ============================================================

  async sendMessage(accountId: string, message: SendMessageRequest): Promise<string> {
    const client = await this.getSmtpClient(accountId);
    const account = await this.getAccount(accountId);
    const identity = message.identityId
      ? await this.getIdentity(message.identityId)
      : await this.getDefaultIdentity(accountId);

    // Build email
    const email = {
      from: { name: identity.name, address: identity.email },
      to: message.to,
      cc: message.cc,
      bcc: message.bcc,
      subject: message.subject,
      html: message.bodyHtml,
      text: message.bodyText || this.htmlToText(message.bodyHtml),
      attachments: await this.prepareAttachments(message.attachmentIds),
      inReplyTo: message.replyToMessageId
        ? await this.getMessageIdHeader(message.replyToMessageId)
        : undefined,
    };

    // Send via SMTP
    const result = await client.send(email);

    // Save to Sent folder
    const sentFolder = await this.getSentFolder(accountId);
    const imapClient = await this.getImapClient(accountId);
    await imapClient.appendMessage(sentFolder.path, result.rawMessage, ['\\Seen']);

    // Delete draft if exists
    if (message.draftId) {
      await query('DELETE FROM ibird_mail_drafts WHERE id = $1', [message.draftId]);
    }

    // Log activity
    await this.logActivity(account.userId, 'email_sent', 'message', result.messageId);

    return result.messageId;
  }

  // ============================================================
  // DRAFT OPERATIONS
  // ============================================================

  async saveDraft(userId: string, draft: SaveDraftRequest): Promise<Draft> {
    const result = await query(`
      INSERT INTO ibird_mail_drafts (
        user_id, account_id, identity_id, draft_type, original_message_id,
        to_addresses, cc_addresses, bcc_addresses, subject, body_html, body_text
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        to_addresses = $6, cc_addresses = $7, bcc_addresses = $8,
        subject = $9, body_html = $10, body_text = $11, updated_at = NOW()
      RETURNING *
    `, [
      userId, draft.accountId, draft.identityId, draft.draftType,
      draft.originalMessageId, JSON.stringify(draft.to),
      JSON.stringify(draft.cc || []), JSON.stringify(draft.bcc || []),
      draft.subject, draft.bodyHtml, draft.bodyText
    ]);

    return this.mapDraftRow(result.rows[0]);
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private async getImapClient(accountId: string): Promise<ImapClient> {
    if (!this.imapClients.has(accountId)) {
      const account = await this.getAccountWithCredentials(accountId);
      const client = new ImapClient({
        host: account.imapHost,
        port: account.imapPort,
        secure: account.imapSecure,
        username: account.imapUsername,
        password: account.oauthAccessToken
          ? await this.getOAuthAccessToken(account)
          : await this.encryption.decrypt(account.imapPasswordEncrypted),
        authMethod: account.oauthAccessToken ? 'XOAUTH2' : 'PLAIN',
      });
      await client.connect();
      this.imapClients.set(accountId, client);
    }
    return this.imapClients.get(accountId)!;
  }

  private async getSmtpClient(accountId: string): Promise<SmtpClient> {
    if (!this.smtpClients.has(accountId)) {
      const account = await this.getAccountWithCredentials(accountId);
      const client = new SmtpClient({
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.smtpSecure,
        username: account.smtpUsername,
        password: account.oauthAccessToken
          ? await this.getOAuthAccessToken(account)
          : await this.encryption.decrypt(account.smtpPasswordEncrypted),
        authMethod: account.oauthAccessToken ? 'XOAUTH2' : 'PLAIN',
      });
      this.smtpClients.set(accountId, client);
    }
    return this.smtpClients.get(accountId)!;
  }

  private detectFolderType(folder: RemoteFolder): FolderType {
    const name = folder.name.toLowerCase();
    const path = folder.path.toLowerCase();

    if (folder.specialUse) return folder.specialUse;
    if (name === 'inbox') return 'inbox';
    if (name === 'sent' || path.includes('sent')) return 'sent';
    if (name === 'drafts' || path.includes('draft')) return 'drafts';
    if (name === 'trash' || path.includes('trash') || path.includes('deleted')) return 'trash';
    if (name === 'spam' || name === 'junk' || path.includes('spam') || path.includes('junk')) return 'spam';
    if (name === 'archive' || path.includes('archive')) return 'archive';
    return 'custom';
  }

  private getProviderSettings(provider: string): ProviderSettings {
    const settings: Record<string, ProviderSettings> = {
      google: {
        imap: { host: 'imap.gmail.com', port: 993 },
        smtp: { host: 'smtp.gmail.com', port: 587 },
      },
      microsoft: {
        imap: { host: 'outlook.office365.com', port: 993 },
        smtp: { host: 'smtp.office365.com', port: 587 },
      },
      yahoo: {
        imap: { host: 'imap.mail.yahoo.com', port: 993 },
        smtp: { host: 'smtp.mail.yahoo.com', port: 587 },
      },
    };
    return settings[provider] || settings.google;
  }
}
```

---

## 2. IMAP Client

### `ImapClient.ts`

```typescript
/**
 * ImapClient - Low-level IMAP protocol client
 *
 * Uses node-imap or similar library for protocol implementation.
 * Handles connection pooling, IDLE, and reconnection.
 */

import Imap from 'node-imap';
import { simpleParser } from 'mailparser';

export interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  authMethod?: 'PLAIN' | 'XOAUTH2';
}

export class ImapClient {
  private imap: Imap;
  private connected: boolean = false;
  private idleSupported: boolean = false;

  constructor(private config: ImapConfig) {
    this.imap = new Imap({
      user: config.username,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.secure,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
      xoauth2: config.authMethod === 'XOAUTH2' ? config.password : undefined,
    });
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        this.connected = true;
        this.idleSupported = this.imap.serverSupports('IDLE');
        resolve();
      });
      this.imap.once('error', reject);
      this.imap.connect();
    });
  }

  async disconnect(): Promise<void> {
    this.imap.end();
    this.connected = false;
  }

  async testConnection(): Promise<boolean> {
    await this.connect();
    await this.disconnect();
    return true;
  }

  async listFolders(): Promise<RemoteFolder[]> {
    return new Promise((resolve, reject) => {
      this.imap.getBoxes((err, boxes) => {
        if (err) return reject(err);
        resolve(this.flattenBoxes(boxes));
      });
    });
  }

  async selectFolder(path: string): Promise<FolderStatus> {
    return new Promise((resolve, reject) => {
      this.imap.openBox(path, false, (err, box) => {
        if (err) return reject(err);
        resolve({
          messages: box.messages.total,
          recent: box.messages.new,
          unseen: box.messages.unseen || 0,
          uidvalidity: box.uidvalidity,
          uidnext: box.uidnext,
          highestModseq: box.highestmodseq,
        });
      });
    });
  }

  async fetchMessagesSince(uid: number): Promise<RawMessage[]> {
    return new Promise((resolve, reject) => {
      const messages: RawMessage[] = [];
      const fetch = this.imap.fetch(`${uid}:*`, {
        bodies: ['HEADER', 'TEXT'],
        struct: true,
      });

      fetch.on('message', (msg, seqno) => {
        const message: Partial<RawMessage> = {};
        msg.on('body', (stream, info) => {
          let buffer = '';
          stream.on('data', chunk => buffer += chunk.toString('utf8'));
          stream.on('end', () => {
            if (info.which === 'HEADER') message.headers = buffer;
            else message.body = buffer;
          });
        });
        msg.once('attributes', attrs => {
          message.uid = attrs.uid;
          message.flags = attrs.flags;
          message.date = attrs.date;
          message.struct = attrs.struct;
        });
        msg.once('end', () => messages.push(message as RawMessage));
      });

      fetch.once('error', reject);
      fetch.once('end', () => resolve(messages));
    });
  }

  async fetchMessageBody(uid: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const fetch = this.imap.fetch(uid.toString(), { bodies: '' });
      let body = '';

      fetch.on('message', msg => {
        msg.on('body', stream => {
          stream.on('data', chunk => body += chunk.toString('utf8'));
        });
      });
      fetch.once('error', reject);
      fetch.once('end', () => resolve(body));
    });
  }

  async setFlag(uid: number, flag: string, add: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const method = add ? 'addFlags' : 'delFlags';
      this.imap[method](uid.toString(), flag, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async moveMessage(uid: number, targetPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.move(uid.toString(), targetPath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async deleteMessage(uid: number): Promise<void> {
    await this.setFlag(uid, '\\Deleted', true);
    return new Promise((resolve, reject) => {
      this.imap.expunge((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async appendMessage(folderPath: string, message: string, flags: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.append(message, { mailbox: folderPath, flags }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async createFolder(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.addBox(path, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async deleteFolder(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.delBox(path, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // IDLE support for real-time updates
  async startIdle(onNewMail: () => void): Promise<void> {
    if (!this.idleSupported) return;

    this.imap.on('mail', onNewMail);
    // node-imap handles IDLE internally when box is open
  }

  private flattenBoxes(boxes: any, prefix = ''): RemoteFolder[] {
    const folders: RemoteFolder[] = [];
    for (const [name, box] of Object.entries(boxes) as [string, any][]) {
      const path = prefix ? `${prefix}${box.delimiter}${name}` : name;
      folders.push({
        name,
        path,
        delimiter: box.delimiter,
        specialUse: box.special_use_attrib,
        subscribed: true,
      });
      if (box.children) {
        folders.push(...this.flattenBoxes(box.children, path));
      }
    }
    return folders;
  }
}
```

---

## 3. Calendar Service

### `CalendarService.ts`

```typescript
/**
 * CalendarService - High-level calendar operations
 *
 * Supports local calendars, CalDAV, and Google Calendar sync.
 */

import { CalDavClient } from './CalDavClient';
import { GoogleCalendarClient } from './GoogleCalendarClient';
import { ICalParser } from './ICalParser';
import { query } from '../../db';

export class CalendarService {
  private caldavClients: Map<string, CalDavClient> = new Map();
  private googleClients: Map<string, GoogleCalendarClient> = new Map();

  // ============================================================
  // CALENDAR MANAGEMENT
  // ============================================================

  async getCalendars(userId: string): Promise<Calendar[]> {
    const result = await query(
      'SELECT * FROM ibird_calendars WHERE user_id = $1 ORDER BY is_default DESC, name',
      [userId]
    );
    return result.rows.map(this.mapCalendarRow);
  }

  async createCalendar(userId: string, data: CreateCalendarRequest): Promise<Calendar> {
    if (data.calendarType === 'caldav') {
      // Test CalDAV connection first
      const client = new CalDavClient({
        url: data.remoteUrl!,
        username: data.remoteUsername!,
        password: data.remotePassword!,
      });
      await client.testConnection();
    }

    const result = await query(`
      INSERT INTO ibird_calendars (
        user_id, name, description, color, calendar_type,
        remote_url, remote_username, remote_password_encrypted, timezone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      userId, data.name, data.description, data.color, data.calendarType,
      data.remoteUrl, data.remoteUsername,
      data.remotePassword ? await this.encryption.encrypt(data.remotePassword) : null,
      data.timezone || 'UTC'
    ]);

    // Trigger initial sync for remote calendars
    if (data.calendarType !== 'local') {
      await this.syncCalendar(result.rows[0].id);
    }

    return this.mapCalendarRow(result.rows[0]);
  }

  // ============================================================
  // EVENT OPERATIONS
  // ============================================================

  async getEvents(userId: string, options: GetEventsOptions): Promise<CalendarEvent[]> {
    const { calendarIds, start, end, includeRecurring } = options;

    let whereClause = 'WHERE e.user_id = $1 AND e.start_time < $3 AND e.end_time > $2';
    const params: any[] = [userId, start, end];
    let paramIndex = 4;

    if (calendarIds?.length) {
      whereClause += ` AND e.calendar_id = ANY($${paramIndex++})`;
      params.push(calendarIds);
    }

    // Only get visible calendars
    whereClause += ` AND c.is_visible = true`;

    const result = await query(`
      SELECT e.*, c.color as calendar_color
      FROM ibird_calendar_events e
      JOIN ibird_calendars c ON e.calendar_id = c.id
      ${whereClause}
      ORDER BY e.start_time
    `, params);

    let events = result.rows.map(this.mapEventRow);

    // Expand recurring events
    if (includeRecurring) {
      events = this.expandRecurringEvents(events, start, end);
    }

    // Get reminders for each event
    for (const event of events) {
      event.reminders = await this.getEventReminders(event.id);
    }

    return events;
  }

  async createEvent(userId: string, data: CreateEventRequest): Promise<CalendarEvent> {
    const calendar = await this.getCalendar(data.calendarId);
    if (calendar.userId !== userId) throw new Error('Permission denied');

    const uid = this.generateUID();

    const result = await query(`
      INSERT INTO ibird_calendar_events (
        calendar_id, user_id, uid, title, description, location,
        start_time, end_time, is_all_day, timezone,
        is_recurring, recurrence_rule, status, transparency,
        organizer, attendees
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      data.calendarId, userId, uid, data.title, data.description, data.location,
      data.startTime, data.endTime, data.isAllDay || false, data.timezone,
      !!data.recurrenceRule, data.recurrenceRule, data.status || 'confirmed',
      data.transparency || 'opaque',
      JSON.stringify(data.organizer), JSON.stringify(data.attendees || [])
    ]);

    // Create reminders
    if (data.reminders?.length) {
      for (const reminder of data.reminders) {
        await this.createReminder(result.rows[0].id, reminder);
      }
    }

    // Sync to remote calendar if applicable
    if (calendar.calendarType !== 'local') {
      await this.syncEventToRemote(result.rows[0].id);
    }

    // Send invitations if requested
    if (data.sendInvitations && data.attendees?.length) {
      await this.sendInvitations(result.rows[0].id, data.attendees);
    }

    return this.mapEventRow(result.rows[0]);
  }

  async updateEvent(
    eventId: string,
    data: UpdateEventRequest,
    updateType: 'this' | 'thisAndFuture' | 'all' = 'all'
  ): Promise<CalendarEvent> {
    const event = await this.getEvent(eventId);

    if (event.isRecurring && updateType !== 'all') {
      return this.updateRecurringInstance(eventId, data, updateType);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let i = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const column = this.camelToSnake(key);
        updates.push(`${column} = $${i++}`);
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
      }
    }

    const result = await query(
      `UPDATE ibird_calendar_events SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      [...values, eventId]
    );

    return this.mapEventRow(result.rows[0]);
  }

  async deleteEvent(
    eventId: string,
    deleteType: 'this' | 'thisAndFuture' | 'all' = 'all'
  ): Promise<void> {
    const event = await this.getEvent(eventId);

    if (event.isRecurring && deleteType !== 'all') {
      await this.deleteRecurringInstance(eventId, deleteType);
      return;
    }

    await query('DELETE FROM ibird_calendar_events WHERE id = $1', [eventId]);
  }

  // ============================================================
  // RECURRING EVENT EXPANSION
  // ============================================================

  private expandRecurringEvents(
    events: CalendarEvent[],
    start: Date,
    end: Date
  ): CalendarEvent[] {
    const expanded: CalendarEvent[] = [];

    for (const event of events) {
      if (!event.isRecurring || !event.recurrenceRule) {
        expanded.push(event);
        continue;
      }

      // Parse RRULE and generate instances
      const instances = ICalParser.expandRRule(
        event.recurrenceRule,
        event.startTime,
        start,
        end
      );

      for (const instanceStart of instances) {
        const duration = event.endTime.getTime() - event.startTime.getTime();
        expanded.push({
          ...event,
          id: `${event.id}_${instanceStart.getTime()}`,
          startTime: instanceStart,
          endTime: new Date(instanceStart.getTime() + duration),
          isRecurringInstance: true,
          masterEventId: event.id,
        });
      }
    }

    return expanded;
  }

  // ============================================================
  // REMINDER OPERATIONS
  // ============================================================

  async getPendingReminders(userId: string): Promise<PendingReminder[]> {
    const result = await query(`
      SELECT * FROM ibird_pending_reminders
      WHERE user_id = $1 AND reminder_time <= NOW() + INTERVAL '5 minutes'
      ORDER BY reminder_time
    `, [userId]);

    return result.rows;
  }

  async acknowledgeReminder(reminderId: string): Promise<void> {
    await query(`
      UPDATE ibird_calendar_reminders
      SET is_acknowledged = true, acknowledged_at = NOW()
      WHERE id = $1
    `, [reminderId]);
  }

  async snoozeReminder(reminderId: string, minutes: number): Promise<void> {
    await query(`
      UPDATE ibird_calendar_reminders
      SET snoozed_until = NOW() + INTERVAL '${minutes} minutes'
      WHERE id = $1
    `, [reminderId]);
  }

  // ============================================================
  // CALDAV SYNC
  // ============================================================

  async syncCalendar(calendarId: string): Promise<SyncResult> {
    const calendar = await this.getCalendarWithCredentials(calendarId);

    if (calendar.calendarType === 'caldav') {
      return this.syncCalDavCalendar(calendar);
    } else if (calendar.calendarType === 'google') {
      return this.syncGoogleCalendar(calendar);
    }

    return { added: 0, updated: 0, deleted: 0 };
  }

  private async syncCalDavCalendar(calendar: CalendarWithCredentials): Promise<SyncResult> {
    const client = await this.getCalDavClient(calendar.id);

    // Check for changes using ctag
    const currentCtag = await client.getCtag(calendar.remoteUrl);
    if (currentCtag === calendar.ctag) {
      return { added: 0, updated: 0, deleted: 0 };
    }

    // Get all events from server
    const remoteEvents = await client.getEvents(calendar.remoteUrl);

    // Get local events
    const localEvents = await query(
      'SELECT * FROM ibird_calendar_events WHERE calendar_id = $1',
      [calendar.id]
    );
    const localByUid = new Map(localEvents.rows.map(e => [e.uid, e]));

    let added = 0, updated = 0, deleted = 0;

    // Process remote events
    for (const remote of remoteEvents) {
      const local = localByUid.get(remote.uid);

      if (!local) {
        // New event
        await this.createEventFromRemote(calendar.id, calendar.userId, remote);
        added++;
      } else if (remote.etag !== local.etag) {
        // Updated event
        await this.updateEventFromRemote(local.id, remote);
        updated++;
      }
      localByUid.delete(remote.uid);
    }

    // Delete events no longer on server
    for (const [uid, local] of localByUid) {
      await query('DELETE FROM ibird_calendar_events WHERE id = $1', [local.id]);
      deleted++;
    }

    // Update sync state
    await query(
      'UPDATE ibird_calendars SET ctag = $1, last_sync_at = NOW() WHERE id = $2',
      [currentCtag, calendar.id]
    );

    return { added, updated, deleted };
  }

  private generateUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@ibird`;
  }
}
```

---

## 4. Appointment Service

### `AppointmentService.ts`

```typescript
/**
 * AppointmentService - Appointment booking system
 *
 * Handles availability schedules, slot calculation, and bookings.
 */

import { query } from '../../db';
import { NotificationService } from './NotificationService';
import { CalendarService } from './CalendarService';

export class AppointmentService {
  constructor(
    private notifications: NotificationService,
    private calendar: CalendarService
  ) {}

  // ============================================================
  // APPOINTMENT TYPE MANAGEMENT
  // ============================================================

  async createAppointment(userId: string, data: CreateAppointmentRequest): Promise<Appointment> {
    // Check slug uniqueness
    const existing = await query(
      'SELECT id FROM ibird_appointments WHERE user_id = $1 AND slug = $2',
      [userId, data.slug]
    );
    if (existing.rows.length) throw new Error('Slug already exists');

    const result = await query(`
      INSERT INTO ibird_appointments (
        user_id, title, slug, description,
        location_type, location_value, meeting_link_provider,
        duration_minutes, buffer_before_minutes, buffer_after_minutes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      userId, data.title, data.slug, data.description,
      data.locationType, data.locationValue, data.meetingLinkProvider,
      data.durationMinutes, data.bufferBeforeMinutes || 0, data.bufferAfterMinutes || 0
    ]);

    return this.mapAppointmentRow(result.rows[0]);
  }

  // ============================================================
  // AVAILABILITY MANAGEMENT
  // ============================================================

  async setAvailability(userId: string, data: SetAvailabilityRequest): Promise<AvailabilitySchedule> {
    // Upsert schedule
    const scheduleResult = await query(`
      INSERT INTO ibird_availability_schedules (
        user_id, appointment_id, name, calendar_id, timezone,
        minimum_notice_hours, booking_window_days, auto_confirm, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        calendar_id = $4, timezone = $5, minimum_notice_hours = $6,
        booking_window_days = $7, auto_confirm = $8, is_active = $9,
        updated_at = NOW()
      RETURNING *
    `, [
      userId, data.appointmentId, data.name || 'Default', data.calendarId,
      data.timezone, data.minimumNoticeHours || 24, data.bookingWindowDays || 60,
      data.autoConfirm || false, data.isActive !== false
    ]);

    const scheduleId = scheduleResult.rows[0].id;

    // Replace slots
    await query('DELETE FROM ibird_availability_slots WHERE schedule_id = $1', [scheduleId]);

    for (const slot of data.slots) {
      await query(`
        INSERT INTO ibird_availability_slots (schedule_id, day_of_week, start_time, end_time)
        VALUES ($1, $2, $3, $4)
      `, [scheduleId, slot.dayOfWeek, slot.startTime, slot.endTime]);
    }

    return this.getAvailabilitySchedule(scheduleId);
  }

  // ============================================================
  // SLOT CALCULATION
  // ============================================================

  async getAvailableSlots(
    appointmentId: string,
    start: Date,
    end: Date,
    attendeeTimezone: string
  ): Promise<TimeSlot[]> {
    const appointment = await this.getAppointment(appointmentId);
    const schedule = await this.getScheduleForAppointment(appointmentId);

    if (!schedule || !schedule.isActive) {
      return [];
    }

    const slots: TimeSlot[] = [];
    const now = new Date();
    const minimumBookingTime = new Date(
      now.getTime() + schedule.minimumNoticeHours * 60 * 60 * 1000
    );
    const maxBookingTime = new Date(
      now.getTime() + schedule.bookingWindowDays * 24 * 60 * 60 * 1000
    );

    // Get existing bookings and calendar events for conflict checking
    const existingBookings = await this.getBookingsInRange(
      appointment.userId, start, end
    );
    const calendarEvents = schedule.calendarId
      ? await this.calendar.getEvents(appointment.userId, {
          calendarIds: [schedule.calendarId],
          start,
          end,
          includeRecurring: true,
        })
      : [];

    // Iterate through each day in range
    const currentDate = new Date(start);
    while (currentDate < end) {
      const dayOfWeek = currentDate.getDay();

      // Get slots for this day of week
      const daySlots = schedule.slots.filter(s => s.dayOfWeek === dayOfWeek);

      // Check for exceptions
      const exception = schedule.exceptions.find(
        e => this.isSameDate(e.exceptionDate, currentDate)
      );

      if (exception?.exceptionType === 'unavailable') {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const effectiveSlots = exception?.exceptionType === 'available'
        ? [{ startTime: exception.startTime!, endTime: exception.endTime! }]
        : daySlots;

      // Generate slots for this day
      for (const daySlot of effectiveSlots) {
        const slotStart = this.combineDateAndTime(
          currentDate, daySlot.startTime, schedule.timezone
        );
        const slotEnd = this.combineDateAndTime(
          currentDate, daySlot.endTime, schedule.timezone
        );

        // Generate individual appointment slots
        let current = new Date(slotStart);
        while (current < slotEnd) {
          const slotEndTime = new Date(
            current.getTime() + appointment.durationMinutes * 60 * 1000
          );

          if (slotEndTime <= slotEnd) {
            const available = this.isSlotAvailable(
              current,
              slotEndTime,
              appointment,
              existingBookings,
              calendarEvents,
              minimumBookingTime,
              maxBookingTime
            );

            slots.push({
              startTime: current.toISOString(),
              endTime: slotEndTime.toISOString(),
              available,
            });
          }

          current = new Date(
            current.getTime() + appointment.durationMinutes * 60 * 1000
          );
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  private isSlotAvailable(
    start: Date,
    end: Date,
    appointment: Appointment,
    bookings: Booking[],
    events: CalendarEvent[],
    minTime: Date,
    maxTime: Date
  ): boolean {
    // Check minimum notice
    if (start < minTime) return false;

    // Check max booking window
    if (start > maxTime) return false;

    // Check buffer times
    const bufferedStart = new Date(
      start.getTime() - appointment.bufferBeforeMinutes * 60 * 1000
    );
    const bufferedEnd = new Date(
      end.getTime() + appointment.bufferAfterMinutes * 60 * 1000
    );

    // Check against existing bookings
    for (const booking of bookings) {
      if (booking.status === 'cancelled' || booking.status === 'declined') continue;
      if (this.timeRangesOverlap(bufferedStart, bufferedEnd, booking.startTime, booking.endTime)) {
        return false;
      }
    }

    // Check against calendar events
    for (const event of events) {
      if (event.transparency === 'transparent') continue; // Free/available
      if (this.timeRangesOverlap(bufferedStart, bufferedEnd, event.startTime, event.endTime)) {
        return false;
      }
    }

    return true;
  }

  // ============================================================
  // BOOKING OPERATIONS
  // ============================================================

  async createBooking(
    appointmentId: string,
    data: CreateBookingRequest
  ): Promise<Booking> {
    const appointment = await this.getAppointment(appointmentId);
    const schedule = await this.getScheduleForAppointment(appointmentId);

    // Verify slot is available
    const slots = await this.getAvailableSlots(
      appointmentId,
      new Date(data.startTime),
      new Date(new Date(data.startTime).getTime() + appointment.durationMinutes * 60 * 1000),
      data.attendeeTimezone
    );

    const slot = slots.find(s => s.startTime === data.startTime);
    if (!slot?.available) {
      throw new Error('Selected time slot is not available');
    }

    const endTime = new Date(
      new Date(data.startTime).getTime() + appointment.durationMinutes * 60 * 1000
    );

    // Generate tokens
    const confirmationToken = this.generateToken();
    const managementToken = this.generateToken();

    // Determine initial status
    const status = schedule?.autoConfirm ? 'confirmed' : 'pending';

    const result = await query(`
      INSERT INTO ibird_bookings (
        appointment_id, user_id, attendee_name, attendee_email,
        attendee_phone, attendee_notes, attendee_timezone,
        start_time, end_time, status,
        confirmation_token, management_token,
        confirmed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      appointmentId, appointment.userId, data.attendeeName, data.attendeeEmail,
      data.attendeePhone, data.attendeeNotes, data.attendeeTimezone,
      data.startTime, endTime.toISOString(), status,
      confirmationToken, managementToken,
      status === 'confirmed' ? new Date() : null
    ]);

    const booking = this.mapBookingRow(result.rows[0]);

    // Create meeting link if provider configured
    if (appointment.meetingLinkProvider) {
      const meetingLink = await this.createMeetingLink(appointment, booking);
      await query('UPDATE ibird_bookings SET meeting_link = $1 WHERE id = $2', [meetingLink, booking.id]);
      booking.meetingLink = meetingLink;
    }

    // Create calendar event if auto-confirmed
    if (status === 'confirmed' && schedule?.calendarId) {
      const calendarEvent = await this.createBookingCalendarEvent(booking, appointment, schedule.calendarId);
      await query('UPDATE ibird_bookings SET calendar_event_id = $1 WHERE id = $2', [calendarEvent.id, booking.id]);
    }

    // Send notifications
    if (status === 'confirmed') {
      await this.notifications.sendBookingConfirmed(booking, appointment);
    } else {
      await this.notifications.sendBookingRequested(booking, appointment);
    }

    return booking;
  }

  async confirmBooking(
    bookingId: string,
    options?: { sendNotification?: boolean; customMessage?: string }
  ): Promise<Booking> {
    const booking = await this.getBooking(bookingId);
    if (booking.status !== 'pending') {
      throw new Error('Booking is not pending');
    }

    await query(`
      UPDATE ibird_bookings
      SET status = 'confirmed', confirmed_at = NOW()
      WHERE id = $1
    `, [bookingId]);

    const appointment = await this.getAppointment(booking.appointmentId);
    const schedule = await this.getScheduleForAppointment(booking.appointmentId);

    // Create calendar event
    if (schedule?.calendarId) {
      const calendarEvent = await this.createBookingCalendarEvent(
        booking, appointment, schedule.calendarId
      );
      await query('UPDATE ibird_bookings SET calendar_event_id = $1 WHERE id = $2', [calendarEvent.id, bookingId]);
    }

    // Send notification
    if (options?.sendNotification !== false) {
      await this.notifications.sendBookingConfirmed(
        { ...booking, status: 'confirmed' },
        appointment,
        options?.customMessage
      );
    }

    return this.getBooking(bookingId);
  }

  async declineBooking(
    bookingId: string,
    options?: { reason?: string; sendNotification?: boolean }
  ): Promise<Booking> {
    const booking = await this.getBooking(bookingId);

    await query(`
      UPDATE ibird_bookings
      SET status = 'declined', cancellation_reason = $1
      WHERE id = $2
    `, [options?.reason, bookingId]);

    if (options?.sendNotification !== false) {
      const appointment = await this.getAppointment(booking.appointmentId);
      await this.notifications.sendBookingDeclined(
        { ...booking, status: 'declined' },
        appointment,
        options?.reason
      );
    }

    return this.getBooking(bookingId);
  }

  async cancelBooking(
    bookingId: string,
    cancelledBy: 'organizer' | 'attendee',
    options?: { reason?: string; sendNotification?: boolean }
  ): Promise<Booking> {
    const booking = await this.getBooking(bookingId);

    await query(`
      UPDATE ibird_bookings
      SET status = 'cancelled', cancelled_at = NOW(),
          cancelled_by = $1, cancellation_reason = $2
      WHERE id = $3
    `, [cancelledBy, options?.reason, bookingId]);

    // Delete calendar event if exists
    if (booking.calendarEventId) {
      await this.calendar.deleteEvent(booking.calendarEventId);
    }

    if (options?.sendNotification !== false) {
      const appointment = await this.getAppointment(booking.appointmentId);
      await this.notifications.sendBookingCancelled(
        { ...booking, status: 'cancelled' },
        appointment,
        cancelledBy,
        options?.reason
      );
    }

    return this.getBooking(bookingId);
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private timeRangesOverlap(
    start1: Date, end1: Date,
    start2: Date, end2: Date
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private combineDateAndTime(date: Date, time: string, timezone: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    // Adjust for timezone...
    return result;
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }
}
```

---

## 5. Notification Service

### `NotificationService.ts`

```typescript
/**
 * NotificationService - Email notifications for appointments
 */

import nodemailer from 'nodemailer';

export class NotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendBookingRequested(booking: Booking, appointment: Appointment): Promise<void> {
    // Send to organizer
    await this.send({
      to: appointment.organizerEmail,
      subject: `New booking request: ${appointment.title}`,
      html: this.renderTemplate('booking-requested-organizer', { booking, appointment }),
    });

    // Send to attendee
    await this.send({
      to: booking.attendeeEmail,
      subject: `Booking request submitted: ${appointment.title}`,
      html: this.renderTemplate('booking-requested-attendee', { booking, appointment }),
    });
  }

  async sendBookingConfirmed(
    booking: Booking,
    appointment: Appointment,
    customMessage?: string
  ): Promise<void> {
    await this.send({
      to: booking.attendeeEmail,
      subject: `Booking confirmed: ${appointment.title}`,
      html: this.renderTemplate('booking-confirmed', { booking, appointment, customMessage }),
    });
  }

  async sendBookingDeclined(
    booking: Booking,
    appointment: Appointment,
    reason?: string
  ): Promise<void> {
    await this.send({
      to: booking.attendeeEmail,
      subject: `Booking declined: ${appointment.title}`,
      html: this.renderTemplate('booking-declined', { booking, appointment, reason }),
    });
  }

  async sendBookingCancelled(
    booking: Booking,
    appointment: Appointment,
    cancelledBy: 'organizer' | 'attendee',
    reason?: string
  ): Promise<void> {
    const recipient = cancelledBy === 'organizer'
      ? booking.attendeeEmail
      : appointment.organizerEmail;

    await this.send({
      to: recipient,
      subject: `Booking cancelled: ${appointment.title}`,
      html: this.renderTemplate('booking-cancelled', { booking, appointment, cancelledBy, reason }),
    });
  }

  private async send(options: { to: string; subject: string; html: string }): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@ibird.app',
      ...options,
    });
  }

  private renderTemplate(template: string, data: any): string {
    // Template rendering logic...
    // Use a template engine like handlebars or ejs
    return `<html>...</html>`;
  }
}
```

---

## Service Dependencies

```typescript
// server/src/services/ibird/index.ts

import { MailService } from './MailService';
import { CalendarService } from './CalendarService';
import { AppointmentService } from './AppointmentService';
import { NotificationService } from './NotificationService';
import { EncryptionService } from './EncryptionService';
import { SyncService } from './SyncService';

// Singleton instances
const encryption = new EncryptionService(process.env.ENCRYPTION_KEY!);
const notifications = new NotificationService();
const mailService = new MailService(encryption);
const calendarService = new CalendarService(encryption);
const appointmentService = new AppointmentService(notifications, calendarService);
const syncService = new SyncService(mailService, calendarService);

export {
  mailService,
  calendarService,
  appointmentService,
  notifications,
  syncService,
};
```

---

*Document: 03-BACKEND-SERVICES.md*
*Version: 1.0*
