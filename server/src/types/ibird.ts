/**
 * iBird Type Definitions
 * Email, Calendar, and Appointments System
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;
}

export type FolderType = 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive' | 'custom';
export type CalendarSource = 'local' | 'google' | 'microsoft' | 'caldav';
export type LocationType = 'in_person' | 'phone' | 'video' | 'custom';
export type VideoProvider = 'zoom' | 'google_meet' | 'teams' | 'custom';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type EventStatus = 'confirmed' | 'tentative' | 'cancelled';
export type TaskStatus = 'needs_action' | 'in_progress' | 'completed' | 'cancelled';
export type ReminderType = 'notification' | 'email';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

// ============================================================================
// MAIL TYPES
// ============================================================================

export interface MailAccount {
  id: string;
  userId: string;
  email: string;
  displayName?: string;
  provider?: string;

  // IMAP settings
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;

  // SMTP settings
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;

  // Auth
  authType: 'password' | 'oauth2';

  // Status
  status: 'active' | 'error' | 'disabled';
  lastSyncAt?: Date;
  lastError?: string;

  // Settings
  syncFrequencyMinutes: number;
  signatureHtml?: string;
  signatureText?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface MailAccountCreateInput {
  email: string;
  displayName?: string;
  provider?: string;
  imapHost: string;
  imapPort?: number;
  imapSecure?: boolean;
  smtpHost: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  authType: 'password' | 'oauth2';
  password?: string;
  oauthTokens?: OAuthTokens;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface MailIdentity {
  id: string;
  accountId: string;
  email: string;
  displayName?: string;
  replyTo?: string;
  signatureHtml?: string;
  signatureText?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MailFolder {
  id: string;
  accountId: string;
  parentId?: string;
  name: string;
  path: string;
  folderType: FolderType;
  delimiter: string;
  flags: string[];
  totalCount: number;
  unreadCount: number;
  uidvalidity?: number;
  lastUid?: number;
  lastSyncAt?: Date;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;

  // Client-side additions
  children?: MailFolder[];
}

export interface MailMessage {
  id: string;
  accountId: string;
  folderId: string;
  messageId?: string;
  threadId?: string;
  uid?: number;

  // Headers
  subject?: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  replyTo?: EmailAddress;

  // Dates
  sentAt?: Date;
  receivedAt: Date;

  // Content
  snippet?: string;
  bodyText?: string;
  bodyHtml?: string;
  hasAttachments: boolean;

  // Flags
  isRead: boolean;
  isStarred: boolean;
  isDraft: boolean;
  isDeleted: boolean;

  // Labels
  labels?: MailLabel[];

  // Raw
  sizeBytes?: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface MailMessageListItem {
  id: string;
  threadId?: string;
  subject?: string;
  from: EmailAddress;
  snippet?: string;
  receivedAt: Date;
  hasAttachments: boolean;
  isRead: boolean;
  isStarred: boolean;
  labels?: MailLabel[];
}

export interface MailAttachment {
  id: string;
  messageId: string;
  filename: string;
  contentType?: string;
  sizeBytes?: number;
  contentId?: string;
  isInline: boolean;
  storagePath?: string;
  createdAt: Date;
}

export interface MailLabel {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MailThread {
  id: string;
  messages: MailMessage[];
  subject?: string;
  latestDate: Date;
  unreadCount: number;
  messageCount: number;
}

export interface ComposeDraft {
  id?: string;
  accountId?: string;
  identityId?: string;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  subject: string;
  bodyHtml: string;
  bodyText: string;
  attachments: MailAttachment[];
  replyTo?: string; // message ID being replied to
  forwardFrom?: string; // message ID being forwarded
}

export interface MailSearchParams {
  query?: string;
  folderId?: string;
  accountId?: string;
  from?: string;
  to?: string;
  subject?: string;
  hasAttachments?: boolean;
  isUnread?: boolean;
  isStarred?: boolean;
  labelIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

// ============================================================================
// CALENDAR TYPES
// ============================================================================

export interface Calendar {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  source: CalendarSource;
  externalId?: string;
  syncUrl?: string;
  isVisible: boolean;
  isPrimary: boolean;
  timezone: string;
  syncToken?: string;
  lastSyncAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarCreateInput {
  name: string;
  description?: string;
  color?: string;
  source?: CalendarSource;
  timezone?: string;
  isPrimary?: boolean;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  externalId?: string;
  etag?: string;

  // Details
  title: string;
  description?: string;
  location?: string;
  videoLink?: string;

  // Time
  startTime: string; // ISO string
  endTime: string; // ISO string
  timezone?: string;
  isAllDay: boolean;

  // Recurrence
  recurrence?: RecurrenceRule;
  recurrenceId?: string;
  originalEventId?: string;

  // Status
  status: EventStatus;
  visibility: 'default' | 'public' | 'private';

  // Attendees
  attendees: EventAttendee[];
  organizer?: EmailAddress;

  // Appearance
  color?: string;

  // Meta
  metadata?: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;

  // Computed (client-side)
  calendarName?: string;
  calendarColor?: string;
  isRecurrenceInstance?: boolean;
}

export interface EventAttendee extends EmailAddress {
  status: 'accepted' | 'declined' | 'tentative' | 'needs_action';
  required: boolean;
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number;
  until?: string; // ISO date
  count?: number;
  byDayOfWeek?: number[]; // 0-6 for Sun-Sat
  byMonthDay?: number[];
  byMonth?: number[];
}

export interface CalendarEventCreateInput {
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  videoLink?: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  isAllDay?: boolean;
  recurrence?: RecurrenceRule;
  status?: EventStatus;
  attendees?: EventAttendee[];
  color?: string;
}

export interface CalendarReminder {
  id: string;
  eventId: string;
  reminderType: ReminderType;
  minutesBefore: number;
  isSent: boolean;
  sentAt?: Date;
  createdAt: Date;
}

export interface CalendarTask {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  priority: number;
  status: TaskStatus;
  percentComplete: number;
  completedAt?: Date;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// APPOINTMENTS TYPES
// ============================================================================

export interface AppointmentType {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;

  // Duration
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;

  // Location
  locationType: LocationType;
  locationAddress?: string;
  videoProvider?: VideoProvider;
  videoLink?: string;

  // Limits
  minNoticeMinutes: number;
  maxBookingDays: number;
  maxBookingsPerDay?: number;

  // Appearance
  color: string;

  // Status
  isActive: boolean;

  // Linked resources
  availabilityScheduleId?: string;
  calendarId?: string;

  // Custom fields
  customFields: CustomField[];

  createdAt: Date;
  updatedAt: Date;
}

export interface CustomField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select';
  required: boolean;
  options?: string[]; // For select type
}

export interface AppointmentTypeCreateInput {
  name: string;
  slug: string;
  description?: string;
  durationMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  locationType?: LocationType;
  locationAddress?: string;
  videoProvider?: VideoProvider;
  videoLink?: string;
  minNoticeMinutes?: number;
  maxBookingDays?: number;
  maxBookingsPerDay?: number;
  color?: string;
  customFields?: CustomField[];
  availabilityScheduleId?: string;
  calendarId?: string;
}

export interface AvailabilitySchedule {
  id: string;
  userId: string;
  name: string;
  timezone: string;
  weeklyHours: WeeklyHours;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyHours {
  sunday: TimeSlot[];
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
}

export interface AvailabilityOverride {
  id: string;
  scheduleId: string;
  date: string; // YYYY-MM-DD
  isAvailable: boolean;
  slots: TimeSlot[];
  reason?: string;
  createdAt: Date;
}

export interface Booking {
  id: string;
  appointmentTypeId: string;
  hostUserId: string;

  // Invitee
  inviteeName: string;
  inviteeEmail: string;
  inviteePhone?: string;
  inviteeTimezone?: string;

  // Time
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm

  // Status
  status: BookingStatus;

  // Location
  locationType?: LocationType;
  locationDetails?: string;

  // Notes
  notes?: string;
  customFieldResponses?: Record<string, string>;

  // Cancellation
  cancelledAt?: Date;
  cancelledBy?: 'host' | 'invitee';
  cancellationReason?: string;

  // Rescheduling
  rescheduledFromId?: string;

  // Linked
  calendarEventId?: string;

  // Notifications
  confirmationSentAt?: Date;
  reminderSentAt?: Date;

  createdAt: Date;
  updatedAt: Date;

  // Computed
  appointmentType?: AppointmentType;
}

export interface BookingCreateInput {
  appointmentTypeId: string;
  inviteeName: string;
  inviteeEmail: string;
  inviteePhone?: string;
  inviteeTimezone?: string;
  scheduledDate: string;
  startTime: string;
  notes?: string;
  customFieldResponses?: Record<string, string>;
}

export interface PublicBookingCreateInput {
  username: string;
  typeId: string;
  date: string;
  startTime: string;
  inviteeName: string;
  inviteeEmail: string;
  inviteePhone?: string;
  notes?: string;
  customFieldResponses?: Record<string, string>;
}

export interface AvailableSlot {
  start: string; // HH:mm
  end: string;
}

// ============================================================================
// USER SETTINGS
// ============================================================================

export interface IBirdUserSettings {
  userId: string;

  // General
  defaultModule: 'mail' | 'calendar' | 'appointments';
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';

  // Mail
  mailSignatureHtml?: string;
  mailSignatureText?: string;
  mailPreviewLines: number;
  mailThreadView: boolean;
  mailAutoMarkRead: boolean;

  // Calendar
  calendarWeekStart: number;
  calendarDefaultView: 'day' | 'week' | 'month' | 'year' | 'agenda';
  calendarDefaultDuration: number;
  calendarDefaultReminder: number;

  // Appointments
  appointmentsBookingPageUsername?: string;
  appointmentsDefaultTimezone?: string;

  // Notifications
  notificationsEmailEnabled: boolean;
  notificationsBrowserEnabled: boolean;
  notificationsSoundEnabled: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface IBirdUserSettingsUpdateInput {
  defaultModule?: 'mail' | 'calendar' | 'appointments';
  timezone?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  mailSignatureHtml?: string;
  mailSignatureText?: string;
  mailPreviewLines?: number;
  mailThreadView?: boolean;
  mailAutoMarkRead?: boolean;
  calendarWeekStart?: number;
  calendarDefaultView?: 'day' | 'week' | 'month' | 'year' | 'agenda';
  calendarDefaultDuration?: number;
  calendarDefaultReminder?: number;
  appointmentsBookingPageUsername?: string;
  appointmentsDefaultTimezone?: string;
  notificationsEmailEnabled?: boolean;
  notificationsBrowserEnabled?: boolean;
  notificationsSoundEnabled?: boolean;
}

// ============================================================================
// CONTACTS
// ============================================================================

export interface Contact {
  id: string;
  userId: string;
  email: string;
  name?: string;
  interactionCount: number;
  lastInteractionAt?: Date;
  source: 'manual' | 'mail' | 'calendar' | 'import';
  phone?: string;
  company?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt?: Date;
  error?: string;
}

// ============================================================================
// ENCRYPTION
// ============================================================================

export interface EncryptedCredentials {
  type: 'password' | 'oauth2';
  password?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}
