/**
 * iBird Mail Message Service
 * Manages email messages, search, and operations
 */

import { pool } from '../../db.js';
import type {
  MailMessage,
  MailMessageListItem,
  MailAttachment,
  MailLabel,
  MailSearchParams,
  EmailAddress,
  PaginatedResponse,
} from '../../types/ibird.js';

export class MailMessageService {
  /**
   * List messages in a folder
   */
  async listMessages(
    folderId: string,
    options: { page?: number; limit?: number; includeRead?: boolean } = {}
  ): Promise<PaginatedResponse<MailMessageListItem>> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 50, 100);
    const offset = (page - 1) * limit;

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM ibird_mail_messages
       WHERE folder_id = $1 AND is_deleted = FALSE`,
      [folderId]
    );
    const total = parseInt(countResult.rows[0].count);

    // Get messages
    const result = await pool.query(
      `SELECT m.id, m.thread_id, m.subject, m.from_address, m.snippet,
              m.received_at, m.has_attachments, m.is_read, m.is_starred,
              COALESCE(
                json_agg(
                  json_build_object('id', l.id, 'name', l.name, 'color', l.color)
                ) FILTER (WHERE l.id IS NOT NULL),
                '[]'
              ) as labels
       FROM ibird_mail_messages m
       LEFT JOIN ibird_mail_message_labels ml ON ml.message_id = m.id
       LEFT JOIN ibird_mail_labels l ON l.id = ml.label_id
       WHERE m.folder_id = $1 AND m.is_deleted = FALSE
       GROUP BY m.id
       ORDER BY m.received_at DESC
       LIMIT $2 OFFSET $3`,
      [folderId, limit, offset]
    );

    return {
      data: result.rows.map(this.mapRowToListItem),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single message with full content
   */
  async getMessage(messageId: string): Promise<MailMessage | null> {
    const result = await pool.query(
      `SELECT m.*,
              COALESCE(
                json_agg(
                  json_build_object('id', l.id, 'name', l.name, 'color', l.color)
                ) FILTER (WHERE l.id IS NOT NULL),
                '[]'
              ) as labels
       FROM ibird_mail_messages m
       LEFT JOIN ibird_mail_message_labels ml ON ml.message_id = m.id
       LEFT JOIN ibird_mail_labels l ON l.id = ml.label_id
       WHERE m.id = $1
       GROUP BY m.id`,
      [messageId]
    );

    if (!result.rows[0]) return null;
    return this.mapRowToMessage(result.rows[0]);
  }

  /**
   * Create or update a message
   */
  async upsertMessage(data: {
    accountId: string;
    folderId: string;
    messageId?: string;
    threadId?: string;
    uid?: number;
    subject?: string;
    from: EmailAddress;
    to: EmailAddress[];
    cc?: EmailAddress[];
    bcc?: EmailAddress[];
    replyTo?: EmailAddress;
    sentAt?: Date;
    receivedAt: Date;
    snippet?: string;
    bodyText?: string;
    bodyHtml?: string;
    hasAttachments?: boolean;
    isRead?: boolean;
    isStarred?: boolean;
    isDraft?: boolean;
    sizeBytes?: number;
    rawHeaders?: string;
  }): Promise<MailMessage> {
    // Use message_id conflict for Gmail (uid is null), uid conflict for IMAP
    const conflictClause = data.uid
      ? `ON CONFLICT (account_id, folder_id, uid) WHERE uid IS NOT NULL`
      : `ON CONFLICT (account_id, message_id) WHERE message_id IS NOT NULL`;

    const result = await pool.query(
      `INSERT INTO ibird_mail_messages (
        account_id, folder_id, message_id, thread_id, uid,
        subject, from_address, to_addresses, cc_addresses, bcc_addresses,
        reply_to_address, sent_at, received_at, snippet,
        body_text, body_html, has_attachments,
        is_read, is_starred, is_draft, size_bytes, raw_headers
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      ${conflictClause}
      DO UPDATE SET
        subject = EXCLUDED.subject,
        from_address = EXCLUDED.from_address,
        to_addresses = EXCLUDED.to_addresses,
        cc_addresses = EXCLUDED.cc_addresses,
        bcc_addresses = EXCLUDED.bcc_addresses,
        snippet = EXCLUDED.snippet,
        body_text = EXCLUDED.body_text,
        body_html = EXCLUDED.body_html,
        has_attachments = EXCLUDED.has_attachments,
        is_read = EXCLUDED.is_read,
        is_starred = EXCLUDED.is_starred
      RETURNING *`,
      [
        data.accountId,
        data.folderId,
        data.messageId || null,
        data.threadId || null,
        data.uid || null,
        data.subject || null,
        JSON.stringify(data.from),
        JSON.stringify(data.to || []),
        JSON.stringify(data.cc || []),
        JSON.stringify(data.bcc || []),
        data.replyTo ? JSON.stringify(data.replyTo) : null,
        data.sentAt || null,
        data.receivedAt,
        data.snippet || null,
        data.bodyText || null,
        data.bodyHtml || null,
        data.hasAttachments || false,
        data.isRead || false,
        data.isStarred || false,
        data.isDraft || false,
        data.sizeBytes || null,
        data.rawHeaders || null,
      ]
    );

    return this.mapRowToMessage(result.rows[0]);
  }

  /**
   * Mark messages as read/unread
   */
  async setReadStatus(messageIds: string[], isRead: boolean): Promise<void> {
    await pool.query(
      `UPDATE ibird_mail_messages
       SET is_read = $2
       WHERE id = ANY($1)`,
      [messageIds, isRead]
    );
  }

  /**
   * Toggle star status
   */
  async setStarred(messageId: string, isStarred: boolean): Promise<void> {
    await pool.query(
      `UPDATE ibird_mail_messages SET is_starred = $2 WHERE id = $1`,
      [messageId, isStarred]
    );
  }

  /**
   * Move messages to a different folder
   */
  async moveMessages(messageIds: string[], targetFolderId: string): Promise<void> {
    await pool.query(
      `UPDATE ibird_mail_messages
       SET folder_id = $2
       WHERE id = ANY($1)`,
      [messageIds, targetFolderId]
    );
  }

  /**
   * Soft delete messages
   */
  async deleteMessages(messageIds: string[]): Promise<void> {
    await pool.query(
      `UPDATE ibird_mail_messages
       SET is_deleted = TRUE
       WHERE id = ANY($1)`,
      [messageIds]
    );
  }

  /**
   * Permanently delete messages
   */
  async permanentlyDelete(messageIds: string[]): Promise<void> {
    await pool.query(
      `DELETE FROM ibird_mail_messages WHERE id = ANY($1)`,
      [messageIds]
    );
  }

  /**
   * Search messages
   */
  async searchMessages(
    userId: string,
    params: MailSearchParams
  ): Promise<PaginatedResponse<MailMessageListItem>> {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 50, 100);
    const offset = (page - 1) * limit;

    const conditions: string[] = ['m.is_deleted = FALSE'];
    const values: any[] = [];
    let paramIndex = 1;

    // Must be user's account
    conditions.push(`a.user_id = $${paramIndex++}`);
    values.push(userId);

    if (params.accountId) {
      conditions.push(`m.account_id = $${paramIndex++}`);
      values.push(params.accountId);
    }

    if (params.folderId) {
      conditions.push(`m.folder_id = $${paramIndex++}`);
      values.push(params.folderId);
    }

    if (params.query) {
      conditions.push(`to_tsvector('english', coalesce(m.subject, '') || ' ' || coalesce(m.body_text, '')) @@ plainto_tsquery('english', $${paramIndex++})`);
      values.push(params.query);
    }

    if (params.from) {
      conditions.push(`m.from_address->>'email' ILIKE $${paramIndex++}`);
      values.push(`%${params.from}%`);
    }

    if (params.to) {
      conditions.push(`EXISTS (SELECT 1 FROM jsonb_array_elements(m.to_addresses) t WHERE t->>'email' ILIKE $${paramIndex++})`);
      values.push(`%${params.to}%`);
    }

    if (params.subject) {
      conditions.push(`m.subject ILIKE $${paramIndex++}`);
      values.push(`%${params.subject}%`);
    }

    if (params.hasAttachments !== undefined) {
      conditions.push(`m.has_attachments = $${paramIndex++}`);
      values.push(params.hasAttachments);
    }

    if (params.isUnread !== undefined) {
      conditions.push(`m.is_read = $${paramIndex++}`);
      values.push(!params.isUnread);
    }

    if (params.isStarred !== undefined) {
      conditions.push(`m.is_starred = $${paramIndex++}`);
      values.push(params.isStarred);
    }

    if (params.dateFrom) {
      conditions.push(`m.received_at >= $${paramIndex++}`);
      values.push(params.dateFrom);
    }

    if (params.dateTo) {
      conditions.push(`m.received_at <= $${paramIndex++}`);
      values.push(params.dateTo);
    }

    if (params.labelIds && params.labelIds.length > 0) {
      conditions.push(`EXISTS (SELECT 1 FROM ibird_mail_message_labels ml2 WHERE ml2.message_id = m.id AND ml2.label_id = ANY($${paramIndex++}))`);
      values.push(params.labelIds);
    }

    const whereClause = conditions.join(' AND ');

    // Count
    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT m.id)
       FROM ibird_mail_messages m
       JOIN ibird_mail_accounts a ON a.id = m.account_id
       WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    // Search
    values.push(limit, offset);
    const result = await pool.query(
      `SELECT DISTINCT m.id, m.thread_id, m.subject, m.from_address, m.snippet,
              m.received_at, m.has_attachments, m.is_read, m.is_starred
       FROM ibird_mail_messages m
       JOIN ibird_mail_accounts a ON a.id = m.account_id
       WHERE ${whereClause}
       ORDER BY m.received_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      values
    );

    return {
      data: result.rows.map(this.mapRowToListItem),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // =========================================================================
  // ATTACHMENTS
  // =========================================================================

  /**
   * List attachments for a message
   */
  async listAttachments(messageId: string): Promise<MailAttachment[]> {
    const result = await pool.query(
      `SELECT * FROM ibird_mail_attachments
       WHERE message_id = $1
       ORDER BY created_at`,
      [messageId]
    );

    return result.rows.map(this.mapRowToAttachment);
  }

  /**
   * Create an attachment record
   */
  async createAttachment(data: {
    messageId: string;
    filename: string;
    contentType?: string;
    sizeBytes?: number;
    contentId?: string;
    isInline?: boolean;
    storagePath?: string;
  }): Promise<MailAttachment> {
    const result = await pool.query(
      `INSERT INTO ibird_mail_attachments (
        message_id, filename, content_type, size_bytes,
        content_id, is_inline, storage_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        data.messageId,
        data.filename,
        data.contentType || null,
        data.sizeBytes || null,
        data.contentId || null,
        data.isInline || false,
        data.storagePath || null,
      ]
    );

    return this.mapRowToAttachment(result.rows[0]);
  }

  // =========================================================================
  // LABELS
  // =========================================================================

  /**
   * List labels for a user
   */
  async listLabels(userId: string): Promise<MailLabel[]> {
    const result = await pool.query(
      `SELECT * FROM ibird_mail_labels
       WHERE user_id = $1
       ORDER BY name`,
      [userId]
    );

    return result.rows.map(this.mapRowToLabel);
  }

  /**
   * Create a label
   */
  async createLabel(userId: string, name: string, color?: string): Promise<MailLabel> {
    const result = await pool.query(
      `INSERT INTO ibird_mail_labels (user_id, name, color)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, name, color || '#6366F1']
    );

    return this.mapRowToLabel(result.rows[0]);
  }

  /**
   * Update a label
   */
  async updateLabel(labelId: string, userId: string, updates: { name?: string; color?: string }): Promise<MailLabel | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.color) {
      updateFields.push(`color = $${paramIndex++}`);
      values.push(updates.color);
    }

    if (updateFields.length === 0) return null;

    values.push(labelId, userId);

    const result = await pool.query(
      `UPDATE ibird_mail_labels
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (!result.rows[0]) return null;
    return this.mapRowToLabel(result.rows[0]);
  }

  /**
   * Delete a label
   */
  async deleteLabel(labelId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM ibird_mail_labels WHERE id = $1 AND user_id = $2`,
      [labelId, userId]
    );
    return (result.rowCount || 0) > 0;
  }

  /**
   * Add labels to a message
   */
  async addLabelsToMessage(messageId: string, labelIds: string[]): Promise<void> {
    if (labelIds.length === 0) return;

    const values = labelIds.map((_, i) => `($1, $${i + 2})`).join(', ');
    await pool.query(
      `INSERT INTO ibird_mail_message_labels (message_id, label_id)
       VALUES ${values}
       ON CONFLICT DO NOTHING`,
      [messageId, ...labelIds]
    );
  }

  /**
   * Remove labels from a message
   */
  async removeLabelsFromMessage(messageId: string, labelIds: string[]): Promise<void> {
    if (labelIds.length === 0) return;

    await pool.query(
      `DELETE FROM ibird_mail_message_labels
       WHERE message_id = $1 AND label_id = ANY($2)`,
      [messageId, labelIds]
    );
  }

  // =========================================================================
  // MAPPERS
  // =========================================================================

  private mapRowToListItem(row: any): MailMessageListItem {
    return {
      id: row.id,
      threadId: row.thread_id,
      subject: row.subject,
      from: typeof row.from_address === 'string' ? JSON.parse(row.from_address) : row.from_address,
      snippet: row.snippet,
      receivedAt: new Date(row.received_at),
      hasAttachments: row.has_attachments,
      isRead: row.is_read,
      isStarred: row.is_starred,
      labels: row.labels || [],
    };
  }

  private mapRowToMessage(row: any): MailMessage {
    return {
      id: row.id,
      accountId: row.account_id,
      folderId: row.folder_id,
      messageId: row.message_id,
      threadId: row.thread_id,
      uid: row.uid,
      subject: row.subject,
      from: typeof row.from_address === 'string' ? JSON.parse(row.from_address) : row.from_address,
      to: typeof row.to_addresses === 'string' ? JSON.parse(row.to_addresses) : row.to_addresses || [],
      cc: typeof row.cc_addresses === 'string' ? JSON.parse(row.cc_addresses) : row.cc_addresses || [],
      bcc: typeof row.bcc_addresses === 'string' ? JSON.parse(row.bcc_addresses) : row.bcc_addresses || [],
      replyTo: row.reply_to_address ? (typeof row.reply_to_address === 'string' ? JSON.parse(row.reply_to_address) : row.reply_to_address) : undefined,
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      receivedAt: new Date(row.received_at),
      snippet: row.snippet,
      bodyText: row.body_text,
      bodyHtml: row.body_html,
      hasAttachments: row.has_attachments,
      isRead: row.is_read,
      isStarred: row.is_starred,
      isDraft: row.is_draft,
      isDeleted: row.is_deleted,
      labels: row.labels || [],
      sizeBytes: row.size_bytes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapRowToAttachment(row: any): MailAttachment {
    return {
      id: row.id,
      messageId: row.message_id,
      filename: row.filename,
      contentType: row.content_type,
      sizeBytes: row.size_bytes,
      contentId: row.content_id,
      isInline: row.is_inline,
      storagePath: row.storage_path,
      createdAt: new Date(row.created_at),
    };
  }

  private mapRowToLabel(row: any): MailLabel {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      color: row.color,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

// Export singleton
export const mailMessageService = new MailMessageService();
