// ============================================================================
// SPARKLES TYPE DEFINITIONS
// ============================================================================

// -----------------------------------------------------------------------------
// Account Types
// -----------------------------------------------------------------------------

export interface GmailAccount {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  isEnabled: boolean;
  syncMode: 'all' | 'inbox' | 'custom';
  customFolders?: string[];
  signature?: string;
  color: string;
  lastSyncAt?: number;
  quotaUsed?: number;
}

export interface AccountSyncStatus {
  accountId: string;
  status: 'idle' | 'syncing' | 'error';
  lastSyncAt?: number;
  errorMessage?: string;
  emailsSynced?: number;
}

// -----------------------------------------------------------------------------
// Email Types
// -----------------------------------------------------------------------------

export interface EmailThread {
  id: string;
  accountId: string;
  historyId: string;
  snippet: string;
  subject: string;
  participants: Participant[];
  messages: EmailMessage[];
  labelIds: string[];
  isUnread: boolean;
  isStarred: boolean;
  isImportant: boolean;
  isPriority: boolean;
  category: EmailCategory;
  lastMessageAt: number;
  messageCount: number;
  hasAttachments: boolean;
  snoozedUntil?: number;
  isMuted: boolean;
}

export type EmailCategory =
  | 'primary'
  | 'newsletters'
  | 'notifications'
  | 'promotions'
  | 'social'
  | 'updates'
  | 'forums'
  | 'uncategorized';

export interface EmailMessage {
  id: string;
  threadId: string;
  accountId: string;
  from: Participant;
  to: Participant[];
  cc?: Participant[];
  bcc?: Participant[];
  replyTo?: Participant;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  snippet: string;
  attachments: Attachment[];
  internalDate: number;
  receivedAt: number;
  headers: EmailHeaders;
  labelIds: string[];
  isRead: boolean;
  hasUnsubscribe: boolean;
  unsubscribeLink?: string;
}

export interface EmailHeaders {
  messageId: string;
  inReplyTo?: string;
  references?: string[];
  listUnsubscribe?: string;
  listUnsubscribePost?: string;
  contentType: string;
  mimeVersion: string;
}

export interface Participant {
  email: string;
  name?: string;
  avatar?: string;
  isPrioritySender?: boolean;
}

export interface Attachment {
  id: string;
  messageId: string;
  filename: string;
  mimeType: string;
  size: number;
  contentId?: string;
  isInline: boolean;
  thumbnailUrl?: string;
}

// -----------------------------------------------------------------------------
// Label Types
// -----------------------------------------------------------------------------

export interface Label {
  id: string;
  accountId: string;
  name: string;
  type: 'system' | 'user';
  messageListVisibility: 'show' | 'hide';
  labelListVisibility: 'labelShow' | 'labelShowIfUnread' | 'labelHide';
  color?: LabelColor;
  unreadCount: number;
  totalCount: number;
  threadsUnread: number;
  threadsTotal: number;
}

export interface LabelColor {
  textColor: string;
  backgroundColor: string;
}

export type SystemLabelId =
  | 'INBOX'
  | 'SENT'
  | 'DRAFT'
  | 'TRASH'
  | 'SPAM'
  | 'STARRED'
  | 'IMPORTANT'
  | 'UNREAD'
  | 'CATEGORY_PERSONAL'
  | 'CATEGORY_SOCIAL'
  | 'CATEGORY_PROMOTIONS'
  | 'CATEGORY_UPDATES'
  | 'CATEGORY_FORUMS';

// -----------------------------------------------------------------------------
// Gatekeeper Types
// -----------------------------------------------------------------------------

export interface PendingSender {
  email: string;
  name?: string;
  domain: string;
  firstSeenAt: number;
  lastSeenAt: number;
  messageCount: number;
  previewSubjects: string[];
  previewSnippets: string[];
  isNewsletter: boolean;
  isNotification: boolean;
  riskScore: number;
}

export type GatekeeperMode = 'before_inbox' | 'inside_inbox' | 'disabled';

export interface GatekeeperDecision {
  senderEmail: string;
  decision: 'accept' | 'block';
  decidedAt: number;
  autoDecision: boolean;
}

// -----------------------------------------------------------------------------
// Snooze Types
// -----------------------------------------------------------------------------

export interface SnoozedThread {
  threadId: string;
  accountId: string;
  snoozedAt: number;
  wakeAt: number;
  originalLabelIds: string[];
}

export type SnoozePreset =
  | 'later_today'
  | 'tonight'
  | 'tomorrow'
  | 'this_weekend'
  | 'next_week'
  | 'custom';

// -----------------------------------------------------------------------------
// Scheduled Send Types
// -----------------------------------------------------------------------------

export interface ScheduledEmail {
  id: string;
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml: string;
  bodyText: string;
  attachments: ScheduledAttachment[];
  scheduledFor: number;
  createdAt: number;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  errorMessage?: string;
  threadId?: string;
  inReplyTo?: string;
}

export interface ScheduledAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  data: string;
}

// -----------------------------------------------------------------------------
// Compose Types
// -----------------------------------------------------------------------------

export interface ComposeState {
  id: string;
  mode: 'new' | 'reply' | 'replyAll' | 'forward' | 'draft';
  fromAccountId: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  bodyHtml: string;
  bodyText: string;
  attachments: ComposeAttachment[];
  replyToMessageId?: string;
  forwardedMessageId?: string;
  draftId?: string;
  threadId?: string;
  isDirty: boolean;
  lastSavedAt?: number;
  scheduledFor?: number;
  isMinimized: boolean;
  isMaximized: boolean;
}

export interface ComposeAttachment {
  id: string;
  file: File;
  filename: string;
  mimeType: string;
  size: number;
  uploadProgress: number;
  uploadedUrl?: string;
  error?: string;
}

// -----------------------------------------------------------------------------
// Search & Filter Types
// -----------------------------------------------------------------------------

export interface SearchQuery {
  raw: string;
  parsed: ParsedSearchQuery;
}

export interface ParsedSearchQuery {
  terms: string[];
  from?: string[];
  to?: string[];
  subject?: string;
  hasAttachment?: boolean;
  isUnread?: boolean;
  isStarred?: boolean;
  isImportant?: boolean;
  labelIds?: string[];
  after?: number;
  before?: number;
  newerThan?: string;
  olderThan?: string;
  largerThan?: number;
  smallerThan?: number;
  filename?: string;
  category?: EmailCategory;
}

export interface SearchResult {
  query: string;
  threads: EmailThread[];
  totalCount: number;
  hasMore: boolean;
  nextPageToken?: string;
}

// -----------------------------------------------------------------------------
// Calendar Types
// -----------------------------------------------------------------------------

export interface GoogleCalendar {
  id: string;
  accountId: string;
  summary: string;
  description?: string;
  timeZone: string;
  colorId: string;
  backgroundColor: string;
  foregroundColor: string;
  accessRole: 'freeBusyReader' | 'reader' | 'writer' | 'owner';
  isPrimary: boolean;
  isSelected: boolean;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  accountId: string;
  summary: string;
  description?: string;
  location?: string;
  start: EventDateTime;
  end: EventDateTime;
  isAllDay: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink: string;
  created: number;
  updated: number;
  creator: EventParticipant;
  organizer: EventParticipant;
  attendees?: EventAttendee[];
  recurrence?: string[];
  recurringEventId?: string;
  conferenceData?: ConferenceData;
  reminders: EventReminders;
  colorId?: string;
  visibility: 'default' | 'public' | 'private' | 'confidential';
}

export interface EventDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface EventParticipant {
  email: string;
  displayName?: string;
  self?: boolean;
}

export interface EventAttendee extends EventParticipant {
  responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  optional?: boolean;
  organizer?: boolean;
  resource?: boolean;
  comment?: string;
}

export interface ConferenceData {
  conferenceId: string;
  conferenceSolution: {
    name: string;
    iconUri: string;
  };
  entryPoints: ConferenceEntryPoint[];
}

export interface ConferenceEntryPoint {
  entryPointType: 'video' | 'phone' | 'sip' | 'more';
  uri: string;
  label?: string;
  pin?: string;
  meetingCode?: string;
}

export interface EventReminders {
  useDefault: boolean;
  overrides?: Array<{
    method: 'email' | 'popup';
    minutes: number;
  }>;
}

// -----------------------------------------------------------------------------
// Free/Busy Types
// -----------------------------------------------------------------------------

export interface FreeBusyRequest {
  timeMin: string;
  timeMax: string;
  timeZone?: string;
  groupExpansionMax?: number;
  calendarExpansionMax?: number;
  items: Array<{ id: string }>;
}

export interface FreeBusyResponse {
  kind: 'calendar#freeBusy';
  timeMin: string;
  timeMax: string;
  calendars: Record<string, FreeBusyCalendar>;
  groups?: Record<string, FreeBusyGroup>;
}

export interface FreeBusyCalendar {
  busy: Array<{ start: string; end: string }>;
  errors?: Array<{ domain: string; reason: string }>;
}

export interface FreeBusyGroup {
  calendars: string[];
  errors?: Array<{ domain: string; reason: string }>;
}

// -----------------------------------------------------------------------------
// Push Notification Types
// -----------------------------------------------------------------------------

export interface PushChannel {
  id: string;
  resourceId: string;
  resourceUri: string;
  token: string;
  expiration: number;
  type: 'gmail' | 'calendar';
  accountId: string;
}

export interface GmailPushNotification {
  emailAddress: string;
  historyId: string;
}

export interface CalendarPushNotification {
  kind: 'api#channel';
  resourceId: string;
  resourceUri: string;
  resourceState: 'sync' | 'exists' | 'not_exists';
  channelId: string;
  channelToken: string;
  channelExpiration: string;
}

// -----------------------------------------------------------------------------
// Settings Types
// -----------------------------------------------------------------------------

export interface SparklesSettings {
  defaultAccountId: string | null;
  showUnreadInDock: boolean;
  markAsReadWhenViewed: boolean;
  loadRemoteImages: boolean;
  enableKeyboardShortcuts: boolean;
  readingPanePosition: 'right' | 'bottom' | 'hidden';
  messagePreviewLines: 0 | 1 | 2 | 3;
  afterArchiveDelete: 'next' | 'previous' | 'list';
  smartInboxEnabled: boolean;
  showPrimarySection: boolean;
  showNewslettersSection: boolean;
  showNotificationsSection: boolean;
  prioritySenderPreviewCount: number;
  gatekeeperMode: GatekeeperMode;
  autoBlockSpam: boolean;
  trustContactsSenders: boolean;
  desktopNotifications: boolean;
  notificationSound: boolean;
  notifyOnlyPriority: boolean;
  syncFrequency: 'realtime' | '1min' | '5min' | '15min' | 'manual';
  syncPeriodDays: 7 | 14 | 30 | 90 | 365 | 0;
  downloadAttachmentsAuto: boolean;
  offlineAttachments: boolean;
  defaultReplyBehavior: 'reply' | 'replyAll';
  sendAndArchive: boolean;
  undoSendDelaySeconds: 0 | 5 | 10 | 20 | 30;
  blockTrackingPixels: boolean;
  hideReadReceipts: boolean;
}

// -----------------------------------------------------------------------------
// UI State Types
// -----------------------------------------------------------------------------

export type FolderType = 'SMART_INBOX' | 'GATEKEEPER' | SystemLabelId | string;

export interface SparklesUIState {
  activeFolder: FolderType;
  activeFolderAccountId: string | 'all';
  viewMode: 'smart' | 'traditional' | 'focused';
  selectedThreadId: string | null;
  selectedMessageId: string | null;
  multiSelectThreadIds: string[];
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  mailListWidth: number;
  composeWindows: ComposeState[];
  activeComposeId: string | null;
  activeModal: SparklesModal | null;
  searchQuery: string;
  searchFocused: boolean;
  recentSearches: string[];
  isLoadingThreads: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
}

export type SparklesModal =
  | { type: 'settings'; tab?: string }
  | { type: 'accounts' }
  | { type: 'account-settings'; accountId: string }
  | { type: 'add-account' }
  | { type: 'snooze'; threadId: string }
  | { type: 'schedule-send'; composeId: string }
  | { type: 'calendar'; date?: string }
  | { type: 'create-event'; date?: string }
  | { type: 'event-details'; eventId: string }
  | { type: 'gatekeeper' }
  | { type: 'labels'; threadId?: string }
  | { type: 'create-label' }
  | { type: 'keyboard-shortcuts' }
  | { type: 'about' };

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------

export interface ThreadListResponse {
  threads: EmailThread[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}

export interface MessageListResponse {
  messages: EmailMessage[];
  nextPageToken?: string;
}

export interface BatchModifyResponse {
  success: boolean;
  modifiedIds: string[];
  errors?: Array<{ id: string; error: string }>;
}

export interface SendEmailResponse {
  id: string;
  threadId: string;
  labelIds: string[];
}

// -----------------------------------------------------------------------------
// Error Types
// -----------------------------------------------------------------------------

export interface SparklesError {
  code: SparklesErrorCode;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

export type SparklesErrorCode =
  | 'AUTH_EXPIRED'
  | 'AUTH_REVOKED'
  | 'RATE_LIMITED'
  | 'QUOTA_EXCEEDED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'INVALID_REQUEST'
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'ATTACHMENT_TOO_LARGE'
  | 'RECIPIENTS_LIMIT'
  | 'DAILY_SEND_LIMIT';

// -----------------------------------------------------------------------------
// Menu Bar Types
// -----------------------------------------------------------------------------

export interface SparklesMenuBarState {
  syncStatus: 'idle' | 'syncing' | 'error';
  unreadCount: number;
  pendingSenderCount: number;
}
