/**
 * Mail Service for iCloud API
 */

import { BaseService } from './BaseService';
import type {
  MailMessage,
  MailFolder,
  MailListResponse,
  MailFolderListResponse,
  MailSearchOptions,
  MailSendInput,
  MailMoveInput,
  MailFlagInput,
} from '../types/mail';
import { ICloudError } from '../errors/ICloudError';
import { generateUUID } from '../utils/ids';

export class MailService extends BaseService {
  private folders: MailFolder[] = [];
  private initialized = false;

  protected getServiceConfig() {
    return this.client.account?.webservices.mail;
  }

  /**
   * Initialize mail service and get folders
   */
  async startup(): Promise<MailFolder[]> {
    const response = await this.get<MailFolderListResponse>(
      'mail',
      '/wm/folders'
    );

    this.folders = response.folders || [];
    this.initialized = true;

    return this.folders;
  }

  /**
   * Get all mail folders
   */
  async listFolders(): Promise<MailFolder[]> {
    if (!this.initialized) {
      await this.startup();
    }
    return this.folders;
  }

  /**
   * Get a specific folder by GUID or type
   */
  async getFolder(folderGuidOrType: string): Promise<MailFolder | null> {
    const folders = await this.listFolders();
    return folders.find(
      f => f.guid === folderGuidOrType || f.type === folderGuidOrType
    ) || null;
  }

  /**
   * Get inbox folder
   */
  async getInbox(): Promise<MailFolder | null> {
    return this.getFolder('inbox');
  }

  /**
   * Get messages in a folder
   */
  async listMessages(
    folderGuid?: string,
    options: {
      limit?: number;
      offset?: number;
      pageToken?: string;
    } = {}
  ): Promise<MailListResponse> {
    const folder = folderGuid || (await this.getInbox())?.guid;
    if (!folder) {
      throw new ICloudError('No folder specified and inbox not found', 'NOT_FOUND');
    }

    const params: Record<string, string | number | boolean | undefined> = {
      limit: options.limit || 50,
      offset: options.offset || 0,
    };

    if (options.pageToken) {
      params.pageToken = options.pageToken;
    }

    const response = await this.get<MailListResponse>(
      'mail',
      `/wm/folders/${folder}/messages`,
      params
    );

    return response;
  }

  /**
   * Get unread messages
   */
  async getUnreadMessages(limit: number = 50): Promise<MailMessage[]> {
    const inbox = await this.getInbox();
    if (!inbox) {
      throw new ICloudError('Inbox not found', 'NOT_FOUND');
    }

    const response = await this.listMessages(inbox.guid, { limit });
    return response.messages.filter(m => !m.read);
  }

  /**
   * Get a specific message
   */
  async getMessage(messageGuid: string, folderGuid: string): Promise<MailMessage | null> {
    try {
      const response = await this.get<MailMessage>(
        'mail',
        `/wm/folders/${folderGuid}/messages/${messageGuid}`
      );
      return response;
    } catch (error) {
      if (error instanceof ICloudError && error.code === 'NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get message body/content
   */
  async getMessageBody(messageGuid: string, folderGuid: string): Promise<{
    body: string;
    bodyHtml?: string;
  }> {
    const response = await this.get<{ body: string; bodyHtml?: string }>(
      'mail',
      `/wm/folders/${folderGuid}/messages/${messageGuid}/body`
    );
    return response;
  }

  /**
   * Search messages
   */
  async search(options: MailSearchOptions): Promise<MailMessage[]> {
    const params: Record<string, string | number | boolean | undefined> = {
      limit: options.limit || 50,
      offset: options.offset || 0,
    };

    if (options.query) params.q = options.query;
    if (options.from) params.from = options.from;
    if (options.to) params.to = options.to;
    if (options.subject) params.subject = options.subject;
    if (options.hasAttachment !== undefined) params.hasAttachment = options.hasAttachment;
    if (options.isRead !== undefined) params.isRead = options.isRead;
    if (options.isFlagged !== undefined) params.isFlagged = options.isFlagged;
    if (options.after) params.after = options.after.toISOString();
    if (options.before) params.before = options.before.toISOString();
    if (options.folder) params.folder = options.folder;

    const response = await this.get<MailListResponse>(
      'mail',
      '/wm/messages/search',
      params
    );

    return response.messages || [];
  }

  /**
   * Send a new message
   */
  async send(input: MailSendInput): Promise<MailMessage> {
    const message = {
      guid: generateUUID(),
      to: input.to.map(addr => ({
        address: addr.address,
        name: addr.name || addr.address,
      })),
      cc: input.cc?.map(addr => ({
        address: addr.address,
        name: addr.name || addr.address,
      })),
      bcc: input.bcc?.map(addr => ({
        address: addr.address,
        name: addr.name || addr.address,
      })),
      subject: input.subject,
      body: input.body,
      bodyHtml: input.bodyHtml,
      replyTo: input.replyTo,
      inReplyTo: input.inReplyTo,
      references: input.references,
      importance: input.importance || 'normal',
    };

    const response = await this.post<MailMessage>(
      'mail',
      '/wm/messages/send',
      message
    );

    return response;
  }

  /**
   * Save a draft
   */
  async saveDraft(input: MailSendInput): Promise<MailMessage> {
    const draftsFolder = await this.getFolder('drafts');
    if (!draftsFolder) {
      throw new ICloudError('Drafts folder not found', 'NOT_FOUND');
    }

    const message = {
      guid: generateUUID(),
      folder: draftsFolder.guid,
      to: input.to,
      cc: input.cc,
      bcc: input.bcc,
      subject: input.subject,
      body: input.body,
      bodyHtml: input.bodyHtml,
      draft: true,
    };

    const response = await this.post<MailMessage>(
      'mail',
      `/wm/folders/${draftsFolder.guid}/messages`,
      message
    );

    return response;
  }

  /**
   * Reply to a message
   */
  async reply(
    originalMessage: MailMessage,
    body: string,
    replyAll: boolean = false
  ): Promise<MailMessage> {
    const to = replyAll
      ? [originalMessage.from, ...(originalMessage.to || []).filter(addr =>
          addr.address !== this.client.account?.dsInfo.primaryEmail
        )]
      : [originalMessage.from];

    const cc = replyAll ? originalMessage.cc : undefined;

    return this.send({
      to,
      cc,
      subject: originalMessage.subject.startsWith('Re:')
        ? originalMessage.subject
        : `Re: ${originalMessage.subject}`,
      body,
      inReplyTo: originalMessage.messageId,
      references: [
        ...(originalMessage.references || []),
        originalMessage.messageId,
      ],
    });
  }

  /**
   * Forward a message
   */
  async forward(
    originalMessage: MailMessage,
    to: { address: string; name?: string }[],
    additionalBody?: string
  ): Promise<MailMessage> {
    const body = additionalBody
      ? `${additionalBody}\n\n---------- Forwarded message ---------\n${originalMessage.body}`
      : `---------- Forwarded message ---------\n${originalMessage.body}`;

    return this.send({
      to,
      subject: originalMessage.subject.startsWith('Fwd:')
        ? originalMessage.subject
        : `Fwd: ${originalMessage.subject}`,
      body,
    });
  }

  /**
   * Move messages to a folder
   */
  async moveMessages(input: MailMoveInput): Promise<void> {
    await this.post(
      'mail',
      '/wm/messages/move',
      {
        messageGuids: input.messageGuids,
        fromFolder: input.fromFolder,
        toFolder: input.toFolder,
      }
    );
  }

  /**
   * Move messages to trash
   */
  async moveToTrash(messageGuids: string[], fromFolder: string): Promise<void> {
    const trashFolder = await this.getFolder('trash');
    if (!trashFolder) {
      throw new ICloudError('Trash folder not found', 'NOT_FOUND');
    }

    await this.moveMessages({
      messageGuids,
      fromFolder,
      toFolder: trashFolder.guid,
    });
  }

  /**
   * Delete messages permanently
   */
  async deleteMessages(messageGuids: string[], folderGuid: string): Promise<void> {
    await this.post(
      'mail',
      '/wm/messages/delete',
      {
        messageGuids,
        folder: folderGuid,
      }
    );
  }

  /**
   * Set message flags
   */
  async setFlags(input: MailFlagInput): Promise<void> {
    await this.post(
      'mail',
      '/wm/messages/flags',
      {
        messageGuids: input.messageGuids,
        [input.flag]: input.value,
      }
    );
  }

  /**
   * Mark messages as read
   */
  async markAsRead(messageGuids: string[]): Promise<void> {
    await this.setFlags({
      messageGuids,
      flag: 'read',
      value: true,
    });
  }

  /**
   * Mark messages as unread
   */
  async markAsUnread(messageGuids: string[]): Promise<void> {
    await this.setFlags({
      messageGuids,
      flag: 'read',
      value: false,
    });
  }

  /**
   * Toggle flagged status
   */
  async toggleFlagged(messageGuids: string[], flagged: boolean): Promise<void> {
    await this.setFlags({
      messageGuids,
      flag: 'flagged',
      value: flagged,
    });
  }

  /**
   * Get unread count for a folder
   */
  async getUnreadCount(folderGuid?: string): Promise<number> {
    if (folderGuid) {
      const folder = await this.getFolder(folderGuid);
      return folder?.unreadCount || 0;
    }

    const inbox = await this.getInbox();
    return inbox?.unreadCount || 0;
  }

  /**
   * Get total unread count across all folders
   */
  async getTotalUnreadCount(): Promise<number> {
    const folders = await this.listFolders();
    return folders.reduce((total, folder) => total + (folder.unreadCount || 0), 0);
  }

  /**
   * Archive messages
   */
  async archive(messageGuids: string[], fromFolder: string): Promise<void> {
    const archiveFolder = await this.getFolder('archive');
    if (!archiveFolder) {
      throw new ICloudError('Archive folder not found', 'NOT_FOUND');
    }

    await this.moveMessages({
      messageGuids,
      fromFolder,
      toFolder: archiveFolder.guid,
    });
  }

  /**
   * Mark as spam
   */
  async markAsSpam(messageGuids: string[], fromFolder: string): Promise<void> {
    const junkFolder = await this.getFolder('junk');
    if (!junkFolder) {
      throw new ICloudError('Junk folder not found', 'NOT_FOUND');
    }

    await this.moveMessages({
      messageGuids,
      fromFolder,
      toFolder: junkFolder.guid,
    });
  }

  /**
   * Mark as not spam
   */
  async markAsNotSpam(messageGuids: string[]): Promise<void> {
    const inbox = await this.getInbox();
    const junkFolder = await this.getFolder('junk');

    if (!inbox || !junkFolder) {
      throw new ICloudError('Required folders not found', 'NOT_FOUND');
    }

    await this.moveMessages({
      messageGuids,
      fromFolder: junkFolder.guid,
      toFolder: inbox.guid,
    });
  }
}
