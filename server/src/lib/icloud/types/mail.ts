/**
 * Mail types for iCloud Mail API
 */

export interface MailMessage {
  guid: string;
  longHeader: string;
  folder: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress[];
  date: number; // Unix timestamp
  receivedDate: number;
  sentDate: number;
  snippet: string;
  body?: string;
  bodyHtml?: string;
  bodyStructure?: BodyStructure;
  read: boolean;
  flagged: boolean;
  answered: boolean;
  forwarded?: boolean;
  draft?: boolean;
  deleted?: boolean;
  attachments?: MailAttachment[];
  messageId: string;
  references?: string[];
  inReplyTo?: string;
  importance?: 'low' | 'normal' | 'high';
  size: number;
  threadId?: string;
}

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface BodyStructure {
  type: string;
  subtype: string;
  params?: Record<string, string>;
  id?: string;
  description?: string;
  encoding?: string;
  size?: number;
  parts?: BodyStructure[];
}

export interface MailAttachment {
  guid: string;
  name: string;
  mimeType: string;
  size: number;
  contentId?: string;
  isInline: boolean;
  downloadUrl?: string;
}

export interface MailFolder {
  guid: string;
  name: string;
  type: MailFolderType;
  unreadCount: number;
  totalCount: number;
  parent?: string;
  delimiter: string;
  selectable: boolean;
  role?: string;
  children?: MailFolder[];
}

export type MailFolderType =
  | 'inbox'
  | 'sent'
  | 'drafts'
  | 'trash'
  | 'junk'
  | 'archive'
  | 'all'
  | 'custom';

export interface MailListResponse {
  messages: MailMessage[];
  total: number;
  unread: number;
  nextPageToken?: string;
}

export interface MailFolderListResponse {
  folders: MailFolder[];
}

export interface MailSearchOptions {
  query?: string;
  from?: string;
  to?: string;
  subject?: string;
  hasAttachment?: boolean;
  isRead?: boolean;
  isFlagged?: boolean;
  after?: Date;
  before?: Date;
  folder?: string;
  limit?: number;
  offset?: number;
}

export interface MailSendInput {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: string;
  bodyHtml?: string;
  replyTo?: EmailAddress[];
  inReplyTo?: string;
  references?: string[];
  attachments?: MailAttachmentInput[];
  importance?: 'low' | 'normal' | 'high';
  isDraft?: boolean;
}

export interface MailAttachmentInput {
  name: string;
  mimeType: string;
  content: string | Buffer;
}

export interface MailMoveInput {
  messageGuids: string[];
  fromFolder: string;
  toFolder: string;
}

export interface MailFlagInput {
  messageGuids: string[];
  flag: 'read' | 'flagged' | 'answered' | 'deleted';
  value: boolean;
}

export interface MailRuleAction {
  type: 'move' | 'copy' | 'delete' | 'flag' | 'forward' | 'redirect' | 'notify';
  destination?: string;
  email?: string;
}

export interface MailRule {
  guid: string;
  name: string;
  enabled: boolean;
  conditions: MailRuleCondition[];
  conditionType: 'all' | 'any';
  actions: MailRuleAction[];
}

export interface MailRuleCondition {
  field: 'from' | 'to' | 'cc' | 'subject' | 'body' | 'header';
  operator: 'contains' | 'notContains' | 'equals' | 'notEquals' | 'startsWith' | 'endsWith';
  value: string;
  headerName?: string;
}

export interface MailSettings {
  signature?: string;
  defaultFromAddress?: string;
  forwardingAddress?: string;
  autoResponder?: {
    enabled: boolean;
    subject: string;
    body: string;
    startDate?: Date;
    endDate?: Date;
  };
}
