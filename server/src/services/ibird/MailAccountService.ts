/**
 * iBird Mail Account Service
 * Manages email accounts and IMAP/SMTP connections
 */

import { pool } from '../../db.js';
import { encryptCredentials, decryptCredentials, type EncryptedCredentials } from './encryption.js';
import type {
  MailAccount,
  MailAccountCreateInput,
  MailFolder,
  FolderType,
} from '../../types/ibird.js';

export class MailAccountService {
  /**
   * List all mail accounts for a user
   */
  async listAccounts(userId: string): Promise<MailAccount[]> {
    const result = await pool.query(
      `SELECT id, user_id, email, display_name, provider,
              imap_host, imap_port, imap_secure,
              smtp_host, smtp_port, smtp_secure,
              auth_type, status, last_sync_at, last_error,
              sync_frequency_minutes, signature_html, signature_text,
              created_at, updated_at
       FROM ibird_mail_accounts
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    );

    return result.rows.map(this.mapRowToAccount);
  }

  /**
   * Get a single account by ID
   */
  async getAccount(accountId: string, userId: string): Promise<MailAccount | null> {
    const result = await pool.query(
      `SELECT id, user_id, email, display_name, provider,
              imap_host, imap_port, imap_secure,
              smtp_host, smtp_port, smtp_secure,
              auth_type, status, last_sync_at, last_error,
              sync_frequency_minutes, signature_html, signature_text,
              created_at, updated_at
       FROM ibird_mail_accounts
       WHERE id = $1 AND user_id = $2`,
      [accountId, userId]
    );

    if (!result.rows[0]) return null;
    return this.mapRowToAccount(result.rows[0]);
  }

  /**
   * Create a new mail account
   */
  async createAccount(userId: string, input: MailAccountCreateInput): Promise<MailAccount> {
    // Encrypt credentials
    const credentials: EncryptedCredentials = {
      type: input.authType,
      password: input.password,
      accessToken: input.oauthTokens?.accessToken,
      refreshToken: input.oauthTokens?.refreshToken,
      expiresAt: input.oauthTokens?.expiresAt instanceof Date
        ? input.oauthTokens.expiresAt.toISOString()
        : input.oauthTokens?.expiresAt as string | undefined,
    };

    const encryptedCreds = encryptCredentials(credentials);

    const result = await pool.query(
      `INSERT INTO ibird_mail_accounts (
        user_id, email, display_name, provider,
        imap_host, imap_port, imap_secure,
        smtp_host, smtp_port, smtp_secure,
        auth_type, credentials_encrypted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, user_id, email, display_name, provider,
                imap_host, imap_port, imap_secure,
                smtp_host, smtp_port, smtp_secure,
                auth_type, status, last_sync_at, last_error,
                sync_frequency_minutes, signature_html, signature_text,
                created_at, updated_at`,
      [
        userId,
        input.email,
        input.displayName || input.email,
        input.provider,
        input.imapHost,
        input.imapPort || 993,
        input.imapSecure ?? true,
        input.smtpHost,
        input.smtpPort || 587,
        input.smtpSecure ?? true,
        input.authType,
        encryptedCreds,
      ]
    );

    return this.mapRowToAccount(result.rows[0]);
  }

  /**
   * Update account settings (not credentials)
   */
  async updateAccount(
    accountId: string,
    userId: string,
    updates: Partial<Pick<MailAccount, 'displayName' | 'syncFrequencyMinutes' | 'signatureHtml' | 'signatureText'>>
  ): Promise<MailAccount | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.displayName !== undefined) {
      updateFields.push(`display_name = $${paramIndex++}`);
      values.push(updates.displayName);
    }
    if (updates.syncFrequencyMinutes !== undefined) {
      updateFields.push(`sync_frequency_minutes = $${paramIndex++}`);
      values.push(updates.syncFrequencyMinutes);
    }
    if (updates.signatureHtml !== undefined) {
      updateFields.push(`signature_html = $${paramIndex++}`);
      values.push(updates.signatureHtml);
    }
    if (updates.signatureText !== undefined) {
      updateFields.push(`signature_text = $${paramIndex++}`);
      values.push(updates.signatureText);
    }

    if (updateFields.length === 0) {
      return this.getAccount(accountId, userId);
    }

    values.push(accountId, userId);

    const result = await pool.query(
      `UPDATE ibird_mail_accounts
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING id, user_id, email, display_name, provider,
                 imap_host, imap_port, imap_secure,
                 smtp_host, smtp_port, smtp_secure,
                 auth_type, status, last_sync_at, last_error,
                 sync_frequency_minutes, signature_html, signature_text,
                 created_at, updated_at`,
      values
    );

    if (!result.rows[0]) return null;
    return this.mapRowToAccount(result.rows[0]);
  }

  /**
   * Delete an account and all associated data
   */
  async deleteAccount(accountId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM ibird_mail_accounts
       WHERE id = $1 AND user_id = $2`,
      [accountId, userId]
    );

    return (result.rowCount || 0) > 0;
  }

  /**
   * Get decrypted credentials for an account
   */
  async getCredentials(accountId: string, userId: string): Promise<EncryptedCredentials | null> {
    const result = await pool.query(
      `SELECT credentials_encrypted
       FROM ibird_mail_accounts
       WHERE id = $1 AND user_id = $2`,
      [accountId, userId]
    );

    if (!result.rows[0]?.credentials_encrypted) return null;
    return decryptCredentials(result.rows[0].credentials_encrypted);
  }

  /**
   * Update account status
   */
  async updateStatus(
    accountId: string,
    status: 'active' | 'error' | 'disabled',
    error?: string
  ): Promise<void> {
    await pool.query(
      `UPDATE ibird_mail_accounts
       SET status = $2, last_error = $3, last_sync_at = CASE WHEN $4 = 'active' THEN NOW() ELSE last_sync_at END
       WHERE id = $1`,
      [accountId, status, error || null, status]
    );
  }

  /**
   * Update OAuth tokens
   */
  async updateOAuthTokens(
    accountId: string,
    tokens: { accessToken: string; refreshToken?: string; expiresAt?: Date }
  ): Promise<void> {
    // Get existing credentials
    const result = await pool.query(
      `SELECT credentials_encrypted FROM ibird_mail_accounts WHERE id = $1`,
      [accountId]
    );

    if (!result.rows[0]?.credentials_encrypted) {
      throw new Error('Account not found');
    }

    const creds = decryptCredentials(result.rows[0].credentials_encrypted);
    creds.accessToken = tokens.accessToken;
    if (tokens.refreshToken) creds.refreshToken = tokens.refreshToken;
    if (tokens.expiresAt) creds.expiresAt = tokens.expiresAt.toISOString();

    const encrypted = encryptCredentials(creds);

    await pool.query(
      `UPDATE ibird_mail_accounts SET credentials_encrypted = $2 WHERE id = $1`,
      [accountId, encrypted]
    );
  }

  // =========================================================================
  // FOLDERS
  // =========================================================================

  /**
   * List folders for an account
   */
  async listFolders(accountId: string): Promise<MailFolder[]> {
    const result = await pool.query(
      `SELECT id, account_id, parent_id, name, path, folder_type,
              delimiter, flags, total_count, unread_count,
              uidvalidity, last_uid, last_sync_at, sort_order,
              created_at, updated_at
       FROM ibird_mail_folders
       WHERE account_id = $1
       ORDER BY sort_order, name`,
      [accountId]
    );

    return result.rows.map(this.mapRowToFolder);
  }

  /**
   * Get a single folder
   */
  async getFolder(folderId: string): Promise<MailFolder | null> {
    const result = await pool.query(
      `SELECT id, account_id, parent_id, name, path, folder_type,
              delimiter, flags, total_count, unread_count,
              uidvalidity, last_uid, last_sync_at, sort_order,
              created_at, updated_at
       FROM ibird_mail_folders
       WHERE id = $1`,
      [folderId]
    );

    if (!result.rows[0]) return null;
    return this.mapRowToFolder(result.rows[0]);
  }

  /**
   * Upsert a folder (create or update based on path)
   */
  async upsertFolder(
    accountId: string,
    data: {
      name: string;
      path: string;
      folderType?: FolderType;
      parentId?: string;
      delimiter?: string;
      flags?: string[];
      totalCount?: number;
      unreadCount?: number;
      uidvalidity?: number;
      lastUid?: number;
    }
  ): Promise<MailFolder> {
    const result = await pool.query(
      `INSERT INTO ibird_mail_folders (
        account_id, name, path, folder_type, parent_id,
        delimiter, flags, total_count, unread_count,
        uidvalidity, last_uid, last_sync_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      ON CONFLICT (account_id, path)
      DO UPDATE SET
        name = EXCLUDED.name,
        folder_type = EXCLUDED.folder_type,
        parent_id = EXCLUDED.parent_id,
        delimiter = EXCLUDED.delimiter,
        flags = EXCLUDED.flags,
        total_count = EXCLUDED.total_count,
        unread_count = EXCLUDED.unread_count,
        uidvalidity = EXCLUDED.uidvalidity,
        last_uid = EXCLUDED.last_uid,
        last_sync_at = NOW()
      RETURNING *`,
      [
        accountId,
        data.name,
        data.path,
        data.folderType || 'custom',
        data.parentId || null,
        data.delimiter || '/',
        data.flags || [],
        data.totalCount || 0,
        data.unreadCount || 0,
        data.uidvalidity || null,
        data.lastUid || null,
      ]
    );

    return this.mapRowToFolder(result.rows[0]);
  }

  /**
   * Update folder counts
   */
  async updateFolderCounts(folderId: string, totalCount: number, unreadCount: number): Promise<void> {
    await pool.query(
      `UPDATE ibird_mail_folders
       SET total_count = $2, unread_count = $3
       WHERE id = $1`,
      [folderId, totalCount, unreadCount]
    );
  }

  /**
   * Delete a folder
   */
  async deleteFolder(folderId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM ibird_mail_folders WHERE id = $1`,
      [folderId]
    );
    return (result.rowCount || 0) > 0;
  }

  // =========================================================================
  // MAPPERS
  // =========================================================================

  private mapRowToAccount(row: any): MailAccount {
    return {
      id: row.id,
      userId: row.user_id,
      email: row.email,
      displayName: row.display_name,
      provider: row.provider,
      imapHost: row.imap_host,
      imapPort: row.imap_port,
      imapSecure: row.imap_secure,
      smtpHost: row.smtp_host,
      smtpPort: row.smtp_port,
      smtpSecure: row.smtp_secure,
      authType: row.auth_type,
      status: row.status,
      lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at) : undefined,
      lastError: row.last_error,
      syncFrequencyMinutes: row.sync_frequency_minutes,
      signatureHtml: row.signature_html,
      signatureText: row.signature_text,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapRowToFolder(row: any): MailFolder {
    return {
      id: row.id,
      accountId: row.account_id,
      parentId: row.parent_id,
      name: row.name,
      path: row.path,
      folderType: row.folder_type,
      delimiter: row.delimiter,
      flags: row.flags || [],
      totalCount: row.total_count,
      unreadCount: row.unread_count,
      uidvalidity: row.uidvalidity,
      lastUid: row.last_uid,
      lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at) : undefined,
      sortOrder: row.sort_order,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

// Export singleton
export const mailAccountService = new MailAccountService();
