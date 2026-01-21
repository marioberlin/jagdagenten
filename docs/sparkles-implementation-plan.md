# Sparkles Email Client - Comprehensive Implementation Plan

## Executive Summary

This document provides a complete, developer-ready implementation plan for building Sparkles, a Gmail and Google Calendar client integrated into the LiquidOS desktop environment. The plan includes all file paths, code structures, API specifications, and step-by-step implementation details.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Phase 1: Foundation & Types](#2-phase-1-foundation--types)
3. [Phase 2: Store Implementation](#3-phase-2-store-implementation)
4. [Phase 3: Authentication & OAuth](#4-phase-3-authentication--oauth)
5. [Phase 4: Backend API Services](#5-phase-4-backend-api-services)
6. [Phase 5: Core UI Components](#6-phase-5-core-ui-components)
7. [Phase 6: Smart Inbox & Gatekeeper](#7-phase-6-smart-inbox--gatekeeper)
8. [Phase 7: Email Detail & Thread View](#8-phase-7-email-detail--thread-view)
9. [Phase 8: Compose & Send](#9-phase-8-compose--send)
10. [Phase 9: Calendar Integration](#10-phase-9-calendar-integration)
11. [Phase 10: Menu Bar Integration](#11-phase-10-menu-bar-integration)
12. [Phase 11: AI Features](#12-phase-11-ai-features)
13. [Phase 12: Polish & Optimization](#13-phase-12-polish--optimization)
14. [File Structure Reference](#14-file-structure-reference)
15. [API Endpoint Reference](#15-api-endpoint-reference)
16. [Environment Variables](#16-environment-variables)

---

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │  SparklesStore  │  │  MenuBarContext │  │  LiquidEngine (AI)          │ │
│  │  (Zustand)      │  │                 │  │                             │ │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┬──────────────┘ │
│           │                    │                          │                 │
│  ┌────────▼────────────────────▼──────────────────────────▼──────────────┐ │
│  │                        SparklesApp.tsx                                 │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐ │ │
│  │  │   Sidebar    │  │   MailList   │  │        MailView              │ │ │
│  │  │  - Folders   │  │  - Threads   │  │  - Thread Header             │ │ │
│  │  │  - Labels    │  │  - Priority  │  │  - Messages                  │ │ │
│  │  │  - Calendar  │  │  - Search    │  │  - Quick Reply               │ │ │
│  │  │  - Accounts  │  │  - Actions   │  │  - Attachments               │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND (Bun + Elysia)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │  Gmail Routes   │  │ Calendar Routes │  │  Push Notification Handler  │ │
│  │  /api/v1/gmail  │  │ /api/v1/calendar│  │  (Cloud Pub/Sub Webhook)    │ │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┬──────────────┘ │
│           │                    │                          │                 │
│  ┌────────▼────────────────────▼──────────────────────────▼──────────────┐ │
│  │                         Service Layer                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐ │ │
│  │  │ GmailService │  │CalendarService│  │    TokenManager              │ │ │
│  │  │              │  │              │  │    (Refresh + Storage)       │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Google APIs
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            GOOGLE CLOUD                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │   Gmail API     │  │  Calendar API   │  │     Cloud Pub/Sub           │ │
│  │                 │  │                 │  │  (Push Notifications)       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend Framework | React 18 + TypeScript | UI components |
| State Management | Zustand + Persist | App state, caching |
| Styling | Tailwind CSS + CSS Variables | Glass design system |
| Animations | Framer Motion | Transitions, micro-interactions |
| Rich Text Editor | TipTap | Email compose |
| Backend Framework | Bun + Elysia | API server |
| Database | PostgreSQL | User data, settings |
| Cache | Redis | Session cache, pub/sub |
| Email API | Gmail API v1 | Email operations |
| Calendar API | Google Calendar API v3 | Calendar operations |
| Push | Google Cloud Pub/Sub | Real-time notifications |

---

## 2. Phase 1: Foundation & Types

### 2.1 Create Type Definitions

**File:** `src/types/sparkles.ts`

```typescript
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
  color: string; // Account accent color
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
  lastMessageAt: number; // Unix timestamp
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
  contentId?: string; // For inline images
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
  riskScore: number; // 0-100, higher = more likely spam
}

export type GatekeeperMode =
  | 'before_inbox'  // Quarantine unknown senders
  | 'inside_inbox'  // Show inline prompts
  | 'disabled';     // Accept all

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
  | 'later_today'    // 3 hours from now
  | 'tonight'        // 8 PM today
  | 'tomorrow'       // 8 AM tomorrow
  | 'this_weekend'   // Saturday 9 AM
  | 'next_week'      // Monday 9 AM
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
  threadId?: string; // If reply
  inReplyTo?: string;
}

export interface ScheduledAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  data: string; // Base64 encoded
}

// -----------------------------------------------------------------------------
// Compose Types
// -----------------------------------------------------------------------------

export interface ComposeState {
  id: string; // Unique compose window ID
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
  raw: string; // Raw query string
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
  newerThan?: string; // e.g., "7d", "1m", "1y"
  olderThan?: string;
  largerThan?: number; // bytes
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
  dateTime?: string; // RFC3339 timestamp
  date?: string;     // YYYY-MM-DD for all-day
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
  timeMin: string; // RFC3339
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
  // General
  defaultAccountId: string | null;
  showUnreadInDock: boolean;
  markAsReadWhenViewed: boolean;
  loadRemoteImages: boolean;
  enableKeyboardShortcuts: boolean;

  // Reading Pane
  readingPanePosition: 'right' | 'bottom' | 'hidden';
  messagePreviewLines: 0 | 1 | 2 | 3;
  afterArchiveDelete: 'next' | 'previous' | 'list';

  // Smart Inbox
  smartInboxEnabled: boolean;
  showPrimarySection: boolean;
  showNewslettersSection: boolean;
  showNotificationsSection: boolean;
  prioritySenderPreviewCount: number; // 1-10

  // Gatekeeper
  gatekeeperMode: GatekeeperMode;
  autoBlockSpam: boolean;
  trustContactsSenders: boolean;

  // Notifications
  desktopNotifications: boolean;
  notificationSound: boolean;
  notifyOnlyPriority: boolean;

  // Sync
  syncFrequency: 'realtime' | '1min' | '5min' | '15min' | 'manual';
  syncPeriodDays: 7 | 14 | 30 | 90 | 365 | 0; // 0 = all
  downloadAttachmentsAuto: boolean;
  offlineAttachments: boolean;

  // Compose
  defaultReplyBehavior: 'reply' | 'replyAll';
  sendAndArchive: boolean;
  undoSendDelaySeconds: 0 | 5 | 10 | 20 | 30;

  // Privacy
  blockTrackingPixels: boolean;
  hideReadReceipts: boolean;
}

// -----------------------------------------------------------------------------
// UI State Types
// -----------------------------------------------------------------------------

export type FolderType =
  | 'SMART_INBOX'
  | 'GATEKEEPER'
  | SystemLabelId
  | string; // Custom label ID

export interface SparklesUIState {
  // Navigation
  activeFolder: FolderType;
  activeFolderAccountId: string | 'all'; // 'all' for unified view

  // View Mode
  viewMode: 'smart' | 'traditional' | 'focused';

  // Selection
  selectedThreadId: string | null;
  selectedMessageId: string | null;
  multiSelectThreadIds: string[];

  // Layout
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  mailListWidth: number;

  // Compose Windows
  composeWindows: ComposeState[];
  activeComposeId: string | null;

  // Modals
  activeModal: SparklesModal | null;

  // Search
  searchQuery: string;
  searchFocused: boolean;
  recentSearches: string[];

  // Loading States
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
  | { type: 'labels' }
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
  code: string;
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
```

### 2.2 Register Panel ID

**File:** `src/stores/desktopStore.ts`

Add `'sparkles'` to the PanelId union:

```typescript
export type PanelId =
  | 'settings'
  | 'cowork'
  | 'agents'
  | 'console'
  | 'artifacts'
  | 'showcase'
  | 'finder'
  | 'neonTokyo'
  | 'auroraWeather'
  | 'rushHourTrading'
  | 'sparkles'  // ADD THIS
  | null;
```

---

## 3. Phase 2: Store Implementation

### 3.1 Create Sparkles Store

**File:** `src/stores/sparklesStore.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type {
  GmailAccount,
  AccountSyncStatus,
  EmailThread,
  EmailMessage,
  Label,
  PendingSender,
  GatekeeperDecision,
  SnoozedThread,
  ScheduledEmail,
  GoogleCalendar,
  CalendarEvent,
  PushChannel,
  SparklesSettings,
  SparklesUIState,
  ComposeState,
  FolderType,
  SparklesModal,
  EmailCategory,
} from '@/types/sparkles';

// -----------------------------------------------------------------------------
// State Interface
// -----------------------------------------------------------------------------

interface SparklesState {
  // ===== Accounts =====
  accounts: GmailAccount[];
  activeAccountId: string | null;
  accountSyncStatus: Record<string, AccountSyncStatus>;

  // ===== Threads & Messages =====
  threads: EmailThread[];
  threadCache: Record<string, EmailThread>; // Full thread with messages
  selectedThread: EmailThread | null;

  // ===== Labels =====
  labels: Record<string, Label[]>; // accountId -> labels

  // ===== Gatekeeper =====
  pendingSenders: PendingSender[];
  blockedSenders: string[];
  allowedSenders: string[];
  gatekeeperDecisions: GatekeeperDecision[];

  // ===== Priority =====
  prioritySenders: string[];

  // ===== Snooze =====
  snoozedThreads: SnoozedThread[];

  // ===== Scheduled =====
  scheduledEmails: ScheduledEmail[];

  // ===== Calendar =====
  calendars: GoogleCalendar[];
  events: CalendarEvent[];
  selectedDate: string | null; // YYYY-MM-DD

  // ===== Push =====
  pushChannels: PushChannel[];

  // ===== Settings =====
  settings: SparklesSettings;

  // ===== UI State =====
  ui: SparklesUIState;

  // ===== Actions =====
  // Account Actions
  addAccount: (account: GmailAccount) => void;
  removeAccount: (accountId: string) => void;
  updateAccount: (accountId: string, updates: Partial<GmailAccount>) => void;
  setActiveAccount: (accountId: string | null) => void;
  refreshAccountToken: (accountId: string) => Promise<void>;

  // Sync Actions
  syncAccount: (accountId: string) => Promise<void>;
  syncAllAccounts: () => Promise<void>;
  setSyncStatus: (accountId: string, status: AccountSyncStatus) => void;

  // Thread Actions
  setThreads: (threads: EmailThread[]) => void;
  addThreads: (threads: EmailThread[]) => void;
  updateThread: (threadId: string, updates: Partial<EmailThread>) => void;
  removeThread: (threadId: string) => void;
  selectThread: (threadId: string | null) => void;
  cacheThread: (thread: EmailThread) => void;
  getCachedThread: (threadId: string) => EmailThread | null;

  // Thread Batch Actions
  archiveThreads: (threadIds: string[]) => Promise<void>;
  deleteThreads: (threadIds: string[]) => Promise<void>;
  markThreadsRead: (threadIds: string[], read: boolean) => Promise<void>;
  starThreads: (threadIds: string[], starred: boolean) => Promise<void>;
  moveThreadsToFolder: (threadIds: string[], labelId: string) => Promise<void>;
  applyLabelToThreads: (threadIds: string[], labelId: string, apply: boolean) => Promise<void>;

  // Snooze Actions
  snoozeThread: (threadId: string, wakeAt: number) => Promise<void>;
  unsnoozeThread: (threadId: string) => Promise<void>;
  checkSnoozedThreads: () => void;

  // Label Actions
  setLabels: (accountId: string, labels: Label[]) => void;
  createLabel: (accountId: string, name: string, color?: string) => Promise<Label>;
  updateLabel: (accountId: string, labelId: string, updates: Partial<Label>) => Promise<void>;
  deleteLabel: (accountId: string, labelId: string) => Promise<void>;

  // Gatekeeper Actions
  setPendingSenders: (senders: PendingSender[]) => void;
  acceptSender: (email: string) => Promise<void>;
  blockSender: (email: string) => Promise<void>;
  acceptAllPending: () => Promise<void>;
  blockAllPending: () => Promise<void>;

  // Priority Actions
  addPrioritySender: (email: string) => void;
  removePrioritySender: (email: string) => void;

  // Compose Actions
  openCompose: (mode: ComposeState['mode'], options?: Partial<ComposeState>) => string;
  updateCompose: (composeId: string, updates: Partial<ComposeState>) => void;
  closeCompose: (composeId: string, save?: boolean) => Promise<void>;
  minimizeCompose: (composeId: string) => void;
  maximizeCompose: (composeId: string) => void;
  sendEmail: (composeId: string) => Promise<void>;
  saveDraft: (composeId: string) => Promise<void>;

  // Schedule Actions
  scheduleEmail: (composeId: string, scheduledFor: number) => Promise<void>;
  cancelScheduledEmail: (scheduleId: string) => Promise<void>;

  // Calendar Actions
  setCalendars: (calendars: GoogleCalendar[]) => void;
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (eventId: string) => Promise<void>;
  setSelectedDate: (date: string | null) => void;

  // Settings Actions
  updateSettings: (updates: Partial<SparklesSettings>) => void;
  resetSettings: () => void;

  // UI Actions
  setActiveFolder: (folder: FolderType, accountId?: string) => void;
  setViewMode: (mode: SparklesUIState['viewMode']) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setMailListWidth: (width: number) => void;
  openModal: (modal: SparklesModal) => void;
  closeModal: () => void;
  setSearchQuery: (query: string) => void;
  setSearchFocused: (focused: boolean) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  setMultiSelect: (threadIds: string[]) => void;
  toggleThreadSelection: (threadId: string) => void;
  selectAllThreads: () => void;
  deselectAllThreads: () => void;

  // Loading States
  setLoadingThreads: (loading: boolean) => void;
  setLoadingMessages: (loading: boolean) => void;
  setSending: (sending: boolean) => void;

  // Reset
  reset: () => void;
}

// -----------------------------------------------------------------------------
// Default Values
// -----------------------------------------------------------------------------

const defaultSettings: SparklesSettings = {
  defaultAccountId: null,
  showUnreadInDock: true,
  markAsReadWhenViewed: true,
  loadRemoteImages: false,
  enableKeyboardShortcuts: true,
  readingPanePosition: 'right',
  messagePreviewLines: 2,
  afterArchiveDelete: 'next',
  smartInboxEnabled: true,
  showPrimarySection: true,
  showNewslettersSection: true,
  showNotificationsSection: true,
  prioritySenderPreviewCount: 3,
  gatekeeperMode: 'inside_inbox',
  autoBlockSpam: true,
  trustContactsSenders: true,
  desktopNotifications: true,
  notificationSound: true,
  notifyOnlyPriority: false,
  syncFrequency: 'realtime',
  syncPeriodDays: 30,
  downloadAttachmentsAuto: true,
  offlineAttachments: false,
  defaultReplyBehavior: 'reply',
  sendAndArchive: true,
  undoSendDelaySeconds: 5,
  blockTrackingPixels: true,
  hideReadReceipts: false,
};

const defaultUIState: SparklesUIState = {
  activeFolder: 'SMART_INBOX',
  activeFolderAccountId: 'all',
  viewMode: 'smart',
  selectedThreadId: null,
  selectedMessageId: null,
  multiSelectThreadIds: [],
  sidebarCollapsed: false,
  sidebarWidth: 220,
  mailListWidth: 350,
  composeWindows: [],
  activeComposeId: null,
  activeModal: null,
  searchQuery: '',
  searchFocused: false,
  recentSearches: [],
  isLoadingThreads: false,
  isLoadingMessages: false,
  isSending: false,
};

// -----------------------------------------------------------------------------
// Store Implementation
// -----------------------------------------------------------------------------

export const useSparklesStore = create<SparklesState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        accounts: [],
        activeAccountId: null,
        accountSyncStatus: {},
        threads: [],
        threadCache: {},
        selectedThread: null,
        labels: {},
        pendingSenders: [],
        blockedSenders: [],
        allowedSenders: [],
        gatekeeperDecisions: [],
        prioritySenders: [],
        snoozedThreads: [],
        scheduledEmails: [],
        calendars: [],
        events: [],
        selectedDate: null,
        pushChannels: [],
        settings: defaultSettings,
        ui: defaultUIState,

        // ===== Account Actions =====
        addAccount: (account) =>
          set((state) => ({
            accounts: [...state.accounts, account],
            activeAccountId: state.activeAccountId ?? account.id,
          })),

        removeAccount: (accountId) =>
          set((state) => ({
            accounts: state.accounts.filter((a) => a.id !== accountId),
            activeAccountId:
              state.activeAccountId === accountId
                ? state.accounts[0]?.id ?? null
                : state.activeAccountId,
            threads: state.threads.filter((t) => t.accountId !== accountId),
            labels: { ...state.labels, [accountId]: undefined },
          })),

        updateAccount: (accountId, updates) =>
          set((state) => ({
            accounts: state.accounts.map((a) =>
              a.id === accountId ? { ...a, ...updates } : a
            ),
          })),

        setActiveAccount: (accountId) =>
          set({ activeAccountId: accountId }),

        refreshAccountToken: async (accountId) => {
          const account = get().accounts.find((a) => a.id === accountId);
          if (!account) return;

          try {
            const response = await fetch('/api/v1/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: account.refreshToken }),
            });

            if (!response.ok) throw new Error('Token refresh failed');

            const { accessToken, expiresIn } = await response.json();

            get().updateAccount(accountId, {
              accessToken,
              expiresAt: Date.now() + expiresIn * 1000,
            });
          } catch (error) {
            console.error('Failed to refresh token:', error);
            // Mark account as needing re-auth
            get().updateAccount(accountId, { isEnabled: false });
          }
        },

        // ===== Sync Actions =====
        syncAccount: async (accountId) => {
          const { setSyncStatus, setThreads, setLabels, accounts } = get();
          const account = accounts.find((a) => a.id === accountId);
          if (!account) return;

          setSyncStatus(accountId, {
            accountId,
            status: 'syncing',
            lastSyncAt: Date.now(),
          });

          try {
            // Fetch threads
            const threadsResponse = await fetch(
              `/api/v1/gmail/threads?accountId=${accountId}`,
              {
                headers: { Authorization: `Bearer ${account.accessToken}` },
              }
            );
            const { threads } = await threadsResponse.json();

            // Fetch labels
            const labelsResponse = await fetch(
              `/api/v1/gmail/labels?accountId=${accountId}`,
              {
                headers: { Authorization: `Bearer ${account.accessToken}` },
              }
            );
            const { labels } = await labelsResponse.json();

            setThreads(threads);
            setLabels(accountId, labels);

            setSyncStatus(accountId, {
              accountId,
              status: 'idle',
              lastSyncAt: Date.now(),
              emailsSynced: threads.length,
            });
          } catch (error) {
            setSyncStatus(accountId, {
              accountId,
              status: 'error',
              errorMessage: error instanceof Error ? error.message : 'Sync failed',
            });
          }
        },

        syncAllAccounts: async () => {
          const { accounts, syncAccount } = get();
          await Promise.all(
            accounts.filter((a) => a.isEnabled).map((a) => syncAccount(a.id))
          );
        },

        setSyncStatus: (accountId, status) =>
          set((state) => ({
            accountSyncStatus: {
              ...state.accountSyncStatus,
              [accountId]: status,
            },
          })),

        // ===== Thread Actions =====
        setThreads: (threads) => set({ threads }),

        addThreads: (threads) =>
          set((state) => ({
            threads: [...state.threads, ...threads],
          })),

        updateThread: (threadId, updates) =>
          set((state) => ({
            threads: state.threads.map((t) =>
              t.id === threadId ? { ...t, ...updates } : t
            ),
            threadCache: state.threadCache[threadId]
              ? {
                  ...state.threadCache,
                  [threadId]: { ...state.threadCache[threadId], ...updates },
                }
              : state.threadCache,
          })),

        removeThread: (threadId) =>
          set((state) => ({
            threads: state.threads.filter((t) => t.id !== threadId),
            selectedThread:
              state.selectedThread?.id === threadId ? null : state.selectedThread,
          })),

        selectThread: (threadId) =>
          set((state) => ({
            selectedThread: threadId
              ? state.threadCache[threadId] ??
                state.threads.find((t) => t.id === threadId) ??
                null
              : null,
            ui: {
              ...state.ui,
              selectedThreadId: threadId,
            },
          })),

        cacheThread: (thread) =>
          set((state) => ({
            threadCache: {
              ...state.threadCache,
              [thread.id]: thread,
            },
          })),

        getCachedThread: (threadId) => get().threadCache[threadId] ?? null,

        // ===== Thread Batch Actions =====
        archiveThreads: async (threadIds) => {
          const { accounts, threads, updateThread } = get();

          // Group by account
          const byAccount = threadIds.reduce((acc, id) => {
            const thread = threads.find((t) => t.id === id);
            if (thread) {
              acc[thread.accountId] = acc[thread.accountId] ?? [];
              acc[thread.accountId].push(id);
            }
            return acc;
          }, {} as Record<string, string[]>);

          // Optimistic update
          threadIds.forEach((id) => {
            updateThread(id, { labelIds: [] }); // Remove from INBOX
          });

          // API calls
          for (const [accountId, ids] of Object.entries(byAccount)) {
            const account = accounts.find((a) => a.id === accountId);
            if (!account) continue;

            await fetch('/api/v1/gmail/threads/batch', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${account.accessToken}`,
              },
              body: JSON.stringify({
                action: 'archive',
                threadIds: ids,
              }),
            });
          }
        },

        deleteThreads: async (threadIds) => {
          const { accounts, threads, removeThread } = get();

          const byAccount = threadIds.reduce((acc, id) => {
            const thread = threads.find((t) => t.id === id);
            if (thread) {
              acc[thread.accountId] = acc[thread.accountId] ?? [];
              acc[thread.accountId].push(id);
            }
            return acc;
          }, {} as Record<string, string[]>);

          // Optimistic update
          threadIds.forEach((id) => removeThread(id));

          for (const [accountId, ids] of Object.entries(byAccount)) {
            const account = accounts.find((a) => a.id === accountId);
            if (!account) continue;

            await fetch('/api/v1/gmail/threads/batch', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${account.accessToken}`,
              },
              body: JSON.stringify({
                action: 'trash',
                threadIds: ids,
              }),
            });
          }
        },

        markThreadsRead: async (threadIds, read) => {
          const { accounts, threads, updateThread } = get();

          const byAccount = threadIds.reduce((acc, id) => {
            const thread = threads.find((t) => t.id === id);
            if (thread) {
              acc[thread.accountId] = acc[thread.accountId] ?? [];
              acc[thread.accountId].push(id);
            }
            return acc;
          }, {} as Record<string, string[]>);

          threadIds.forEach((id) => {
            updateThread(id, { isUnread: !read });
          });

          for (const [accountId, ids] of Object.entries(byAccount)) {
            const account = accounts.find((a) => a.id === accountId);
            if (!account) continue;

            await fetch('/api/v1/gmail/threads/batch', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${account.accessToken}`,
              },
              body: JSON.stringify({
                action: read ? 'markRead' : 'markUnread',
                threadIds: ids,
              }),
            });
          }
        },

        starThreads: async (threadIds, starred) => {
          const { accounts, threads, updateThread } = get();

          const byAccount = threadIds.reduce((acc, id) => {
            const thread = threads.find((t) => t.id === id);
            if (thread) {
              acc[thread.accountId] = acc[thread.accountId] ?? [];
              acc[thread.accountId].push(id);
            }
            return acc;
          }, {} as Record<string, string[]>);

          threadIds.forEach((id) => {
            updateThread(id, { isStarred: starred });
          });

          for (const [accountId, ids] of Object.entries(byAccount)) {
            const account = accounts.find((a) => a.id === accountId);
            if (!account) continue;

            await fetch('/api/v1/gmail/threads/batch', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${account.accessToken}`,
              },
              body: JSON.stringify({
                action: starred ? 'star' : 'unstar',
                threadIds: ids,
              }),
            });
          }
        },

        moveThreadsToFolder: async (threadIds, labelId) => {
          // Implementation similar to above
        },

        applyLabelToThreads: async (threadIds, labelId, apply) => {
          // Implementation similar to above
        },

        // ===== Snooze Actions =====
        snoozeThread: async (threadId, wakeAt) => {
          const { threads, updateThread, snoozedThreads } = get();
          const thread = threads.find((t) => t.id === threadId);
          if (!thread) return;

          // Add to snoozed list
          set((state) => ({
            snoozedThreads: [
              ...state.snoozedThreads,
              {
                threadId,
                accountId: thread.accountId,
                snoozedAt: Date.now(),
                wakeAt,
                originalLabelIds: thread.labelIds,
              },
            ],
          }));

          // Update thread
          updateThread(threadId, { snoozedUntil: wakeAt });

          // API call to remove from inbox
          // ...
        },

        unsnoozeThread: async (threadId) => {
          set((state) => ({
            snoozedThreads: state.snoozedThreads.filter(
              (s) => s.threadId !== threadId
            ),
          }));
          get().updateThread(threadId, { snoozedUntil: undefined });
        },

        checkSnoozedThreads: () => {
          const now = Date.now();
          const { snoozedThreads, unsnoozeThread } = get();

          snoozedThreads
            .filter((s) => s.wakeAt <= now)
            .forEach((s) => unsnoozeThread(s.threadId));
        },

        // ===== Label Actions =====
        setLabels: (accountId, labels) =>
          set((state) => ({
            labels: { ...state.labels, [accountId]: labels },
          })),

        createLabel: async (accountId, name, color) => {
          const account = get().accounts.find((a) => a.id === accountId);
          if (!account) throw new Error('Account not found');

          const response = await fetch('/api/v1/gmail/labels', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${account.accessToken}`,
            },
            body: JSON.stringify({ name, color }),
          });

          const label = await response.json();

          set((state) => ({
            labels: {
              ...state.labels,
              [accountId]: [...(state.labels[accountId] ?? []), label],
            },
          }));

          return label;
        },

        updateLabel: async (accountId, labelId, updates) => {
          // Implementation
        },

        deleteLabel: async (accountId, labelId) => {
          // Implementation
        },

        // ===== Gatekeeper Actions =====
        setPendingSenders: (senders) => set({ pendingSenders: senders }),

        acceptSender: async (email) => {
          set((state) => ({
            allowedSenders: [...state.allowedSenders, email],
            pendingSenders: state.pendingSenders.filter((s) => s.email !== email),
            gatekeeperDecisions: [
              ...state.gatekeeperDecisions,
              { senderEmail: email, decision: 'accept', decidedAt: Date.now(), autoDecision: false },
            ],
          }));
        },

        blockSender: async (email) => {
          set((state) => ({
            blockedSenders: [...state.blockedSenders, email],
            pendingSenders: state.pendingSenders.filter((s) => s.email !== email),
            gatekeeperDecisions: [
              ...state.gatekeeperDecisions,
              { senderEmail: email, decision: 'block', decidedAt: Date.now(), autoDecision: false },
            ],
          }));
        },

        acceptAllPending: async () => {
          const { pendingSenders, acceptSender } = get();
          await Promise.all(pendingSenders.map((s) => acceptSender(s.email)));
        },

        blockAllPending: async () => {
          const { pendingSenders, blockSender } = get();
          await Promise.all(pendingSenders.map((s) => blockSender(s.email)));
        },

        // ===== Priority Actions =====
        addPrioritySender: (email) =>
          set((state) => ({
            prioritySenders: [...state.prioritySenders, email.toLowerCase()],
          })),

        removePrioritySender: (email) =>
          set((state) => ({
            prioritySenders: state.prioritySenders.filter(
              (e) => e !== email.toLowerCase()
            ),
          })),

        // ===== Compose Actions =====
        openCompose: (mode, options = {}) => {
          const composeId = crypto.randomUUID();
          const { activeAccountId, accounts } = get();

          const newCompose: ComposeState = {
            id: composeId,
            mode,
            fromAccountId: options.fromAccountId ?? activeAccountId ?? accounts[0]?.id ?? '',
            to: options.to ?? [],
            cc: options.cc ?? [],
            bcc: options.bcc ?? [],
            subject: options.subject ?? '',
            bodyHtml: options.bodyHtml ?? '',
            bodyText: options.bodyText ?? '',
            attachments: [],
            replyToMessageId: options.replyToMessageId,
            forwardedMessageId: options.forwardedMessageId,
            draftId: options.draftId,
            threadId: options.threadId,
            isDirty: false,
            isMinimized: false,
            isMaximized: false,
          };

          set((state) => ({
            ui: {
              ...state.ui,
              composeWindows: [...state.ui.composeWindows, newCompose],
              activeComposeId: composeId,
            },
          }));

          return composeId;
        },

        updateCompose: (composeId, updates) =>
          set((state) => ({
            ui: {
              ...state.ui,
              composeWindows: state.ui.composeWindows.map((c) =>
                c.id === composeId ? { ...c, ...updates, isDirty: true } : c
              ),
            },
          })),

        closeCompose: async (composeId, save = false) => {
          const { ui, saveDraft } = get();
          const compose = ui.composeWindows.find((c) => c.id === composeId);

          if (compose?.isDirty && save) {
            await saveDraft(composeId);
          }

          set((state) => ({
            ui: {
              ...state.ui,
              composeWindows: state.ui.composeWindows.filter((c) => c.id !== composeId),
              activeComposeId:
                state.ui.activeComposeId === composeId
                  ? state.ui.composeWindows[0]?.id ?? null
                  : state.ui.activeComposeId,
            },
          }));
        },

        minimizeCompose: (composeId) =>
          set((state) => ({
            ui: {
              ...state.ui,
              composeWindows: state.ui.composeWindows.map((c) =>
                c.id === composeId ? { ...c, isMinimized: true, isMaximized: false } : c
              ),
            },
          })),

        maximizeCompose: (composeId) =>
          set((state) => ({
            ui: {
              ...state.ui,
              composeWindows: state.ui.composeWindows.map((c) =>
                c.id === composeId ? { ...c, isMinimized: false, isMaximized: true } : c
              ),
            },
          })),

        sendEmail: async (composeId) => {
          const { ui, accounts, closeCompose, setSending } = get();
          const compose = ui.composeWindows.find((c) => c.id === composeId);
          if (!compose) return;

          const account = accounts.find((a) => a.id === compose.fromAccountId);
          if (!account) throw new Error('Account not found');

          setSending(true);

          try {
            const response = await fetch('/api/v1/gmail/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${account.accessToken}`,
              },
              body: JSON.stringify({
                to: compose.to,
                cc: compose.cc,
                bcc: compose.bcc,
                subject: compose.subject,
                bodyHtml: compose.bodyHtml,
                bodyText: compose.bodyText,
                threadId: compose.threadId,
                inReplyTo: compose.replyToMessageId,
              }),
            });

            if (!response.ok) throw new Error('Send failed');

            await closeCompose(composeId, false);
          } finally {
            setSending(false);
          }
        },

        saveDraft: async (composeId) => {
          const { ui, accounts, updateCompose } = get();
          const compose = ui.composeWindows.find((c) => c.id === composeId);
          if (!compose) return;

          const account = accounts.find((a) => a.id === compose.fromAccountId);
          if (!account) return;

          const response = await fetch('/api/v1/gmail/draft', {
            method: compose.draftId ? 'PUT' : 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${account.accessToken}`,
            },
            body: JSON.stringify({
              draftId: compose.draftId,
              to: compose.to,
              cc: compose.cc,
              bcc: compose.bcc,
              subject: compose.subject,
              bodyHtml: compose.bodyHtml,
              threadId: compose.threadId,
            }),
          });

          const { id } = await response.json();
          updateCompose(composeId, { draftId: id, isDirty: false, lastSavedAt: Date.now() });
        },

        // ===== Schedule Actions =====
        scheduleEmail: async (composeId, scheduledFor) => {
          // Implementation
        },

        cancelScheduledEmail: async (scheduleId) => {
          // Implementation
        },

        // ===== Calendar Actions =====
        setCalendars: (calendars) => set({ calendars }),
        setEvents: (events) => set({ events }),
        addEvent: (event) =>
          set((state) => ({ events: [...state.events, event] })),
        updateEvent: (eventId, updates) =>
          set((state) => ({
            events: state.events.map((e) =>
              e.id === eventId ? { ...e, ...updates } : e
            ),
          })),
        deleteEvent: async (eventId) => {
          // Implementation with API call
        },
        setSelectedDate: (date) => set({ selectedDate: date }),

        // ===== Settings Actions =====
        updateSettings: (updates) =>
          set((state) => ({
            settings: { ...state.settings, ...updates },
          })),

        resetSettings: () => set({ settings: defaultSettings }),

        // ===== UI Actions =====
        setActiveFolder: (folder, accountId = 'all') =>
          set((state) => ({
            ui: {
              ...state.ui,
              activeFolder: folder,
              activeFolderAccountId: accountId,
              selectedThreadId: null,
              multiSelectThreadIds: [],
            },
          })),

        setViewMode: (mode) =>
          set((state) => ({
            ui: { ...state.ui, viewMode: mode },
          })),

        toggleSidebar: () =>
          set((state) => ({
            ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed },
          })),

        setSidebarWidth: (width) =>
          set((state) => ({
            ui: { ...state.ui, sidebarWidth: width },
          })),

        setMailListWidth: (width) =>
          set((state) => ({
            ui: { ...state.ui, mailListWidth: width },
          })),

        openModal: (modal) =>
          set((state) => ({
            ui: { ...state.ui, activeModal: modal },
          })),

        closeModal: () =>
          set((state) => ({
            ui: { ...state.ui, activeModal: null },
          })),

        setSearchQuery: (query) =>
          set((state) => ({
            ui: { ...state.ui, searchQuery: query },
          })),

        setSearchFocused: (focused) =>
          set((state) => ({
            ui: { ...state.ui, searchFocused: focused },
          })),

        addRecentSearch: (query) =>
          set((state) => ({
            ui: {
              ...state.ui,
              recentSearches: [
                query,
                ...state.ui.recentSearches.filter((s) => s !== query),
              ].slice(0, 10),
            },
          })),

        clearRecentSearches: () =>
          set((state) => ({
            ui: { ...state.ui, recentSearches: [] },
          })),

        setMultiSelect: (threadIds) =>
          set((state) => ({
            ui: { ...state.ui, multiSelectThreadIds: threadIds },
          })),

        toggleThreadSelection: (threadId) =>
          set((state) => ({
            ui: {
              ...state.ui,
              multiSelectThreadIds: state.ui.multiSelectThreadIds.includes(threadId)
                ? state.ui.multiSelectThreadIds.filter((id) => id !== threadId)
                : [...state.ui.multiSelectThreadIds, threadId],
            },
          })),

        selectAllThreads: () =>
          set((state) => ({
            ui: {
              ...state.ui,
              multiSelectThreadIds: state.threads.map((t) => t.id),
            },
          })),

        deselectAllThreads: () =>
          set((state) => ({
            ui: { ...state.ui, multiSelectThreadIds: [] },
          })),

        // Loading States
        setLoadingThreads: (loading) =>
          set((state) => ({
            ui: { ...state.ui, isLoadingThreads: loading },
          })),

        setLoadingMessages: (loading) =>
          set((state) => ({
            ui: { ...state.ui, isLoadingMessages: loading },
          })),

        setSending: (sending) =>
          set((state) => ({
            ui: { ...state.ui, isSending: sending },
          })),

        // Reset
        reset: () =>
          set({
            accounts: [],
            activeAccountId: null,
            accountSyncStatus: {},
            threads: [],
            threadCache: {},
            selectedThread: null,
            labels: {},
            pendingSenders: [],
            blockedSenders: [],
            allowedSenders: [],
            gatekeeperDecisions: [],
            prioritySenders: [],
            snoozedThreads: [],
            scheduledEmails: [],
            calendars: [],
            events: [],
            selectedDate: null,
            pushChannels: [],
            settings: defaultSettings,
            ui: defaultUIState,
          }),
      }),
      {
        name: 'sparkles-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          accounts: state.accounts.map((a) => ({
            ...a,
            accessToken: '', // Don't persist tokens in localStorage
          })),
          activeAccountId: state.activeAccountId,
          blockedSenders: state.blockedSenders,
          allowedSenders: state.allowedSenders,
          prioritySenders: state.prioritySenders,
          settings: state.settings,
          ui: {
            viewMode: state.ui.viewMode,
            sidebarCollapsed: state.ui.sidebarCollapsed,
            sidebarWidth: state.ui.sidebarWidth,
            mailListWidth: state.ui.mailListWidth,
            recentSearches: state.ui.recentSearches,
          },
        }),
      }
    ),
    { name: 'SparklesStore' }
  )
);

// -----------------------------------------------------------------------------
// Selectors
// -----------------------------------------------------------------------------

export const useActiveAccount = () =>
  useSparklesStore((state) =>
    state.accounts.find((a) => a.id === state.activeAccountId)
  );

export const useAccountLabels = (accountId: string) =>
  useSparklesStore((state) => state.labels[accountId] ?? []);

export const useUnreadCount = () =>
  useSparklesStore((state) =>
    state.threads.filter((t) => t.isUnread).length
  );

export const usePendingSenderCount = () =>
  useSparklesStore((state) => state.pendingSenders.length);

export const useSyncStatus = () =>
  useSparklesStore((state) => {
    const statuses = Object.values(state.accountSyncStatus);
    if (statuses.some((s) => s.status === 'syncing')) return 'syncing';
    if (statuses.some((s) => s.status === 'error')) return 'error';
    return 'idle';
  });

export const useFilteredThreads = () =>
  useSparklesStore((state) => {
    const { ui, threads, settings, prioritySenders, allowedSenders, blockedSenders } = state;

    let filtered = threads;

    // Filter by account
    if (ui.activeFolderAccountId !== 'all') {
      filtered = filtered.filter((t) => t.accountId === ui.activeFolderAccountId);
    }

    // Filter by folder
    switch (ui.activeFolder) {
      case 'SMART_INBOX':
        // Show all except blocked
        filtered = filtered.filter(
          (t) => !blockedSenders.includes(t.participants[0]?.email)
        );
        break;
      case 'GATEKEEPER':
        // Show threads from pending senders
        const pendingEmails = state.pendingSenders.map((s) => s.email);
        filtered = filtered.filter((t) =>
          pendingEmails.includes(t.participants[0]?.email)
        );
        break;
      case 'STARRED':
        filtered = filtered.filter((t) => t.isStarred);
        break;
      case 'SENT':
        filtered = filtered.filter((t) =>
          t.labelIds.includes('SENT')
        );
        break;
      // ... other system folders
      default:
        // Custom label
        if (ui.activeFolder.startsWith('Label_')) {
          filtered = filtered.filter((t) =>
            t.labelIds.includes(ui.activeFolder)
          );
        }
    }

    // Mark priority
    filtered = filtered.map((t) => ({
      ...t,
      isPriority: prioritySenders.includes(t.participants[0]?.email?.toLowerCase()),
    }));

    // Sort: Priority first, then by date
    filtered.sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return b.lastMessageAt - a.lastMessageAt;
    });

    return filtered;
  });

export const useTodayEvents = () =>
  useSparklesStore((state) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return state.events.filter((e) => {
      const start = new Date(e.start.dateTime ?? e.start.date ?? '');
      return start >= today && start < tomorrow;
    });
  });
```

---

## 4. Phase 3: Authentication & OAuth

### 4.1 OAuth Configuration

**File:** `server/src/config/oauth.ts`

```typescript
export const SPARKLES_OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: `${process.env.BASE_URL}/api/v1/auth/google/callback`,
  scopes: [
    // Gmail
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.labels',
    // Calendar
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.freebusy',
    // Profile
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
};

export const ACCOUNT_COLORS = [
  '#0A84FF', // Blue
  '#BF5AF2', // Purple
  '#FF9F0A', // Orange
  '#30D158', // Green
  '#FF453A', // Red
  '#64D2FF', // Cyan
];
```

### 4.2 Auth Routes Extension

**File:** `server/src/routes/sparkles-auth.ts`

```typescript
import { Elysia, t } from 'elysia';
import { google } from 'googleapis';
import { SPARKLES_OAUTH_CONFIG, ACCOUNT_COLORS } from '../config/oauth';
import { db } from '../db';
import { sparklesAccounts } from '../db/schema';
import { eq } from 'drizzle-orm';

const oauth2Client = new google.auth.OAuth2(
  SPARKLES_OAUTH_CONFIG.clientId,
  SPARKLES_OAUTH_CONFIG.clientSecret,
  SPARKLES_OAUTH_CONFIG.redirectUri
);

export const sparklesAuthRoutes = new Elysia({ prefix: '/api/v1/sparkles/auth' })
  // Initiate OAuth flow
  .get('/connect', ({ query, set }) => {
    const state = JSON.stringify({
      userId: query.userId,
      returnUrl: query.returnUrl ?? '/',
      timestamp: Date.now(),
    });

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SPARKLES_OAUTH_CONFIG.scopes,
      state: Buffer.from(state).toString('base64'),
      prompt: 'consent', // Force consent to get refresh token
    });

    set.redirect = authUrl;
  }, {
    query: t.Object({
      userId: t.String(),
      returnUrl: t.Optional(t.String()),
    }),
  })

  // OAuth callback
  .get('/callback', async ({ query, set }) => {
    const { code, state: encodedState } = query;

    if (!code) {
      set.status = 400;
      return { error: 'No authorization code received' };
    }

    try {
      // Decode state
      const state = JSON.parse(Buffer.from(encodedState, 'base64').toString());
      const { userId, returnUrl } = state;

      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Get user profile
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data: profile } = await oauth2.userinfo.get();

      // Check if account already exists
      const existing = await db.query.sparklesAccounts.findFirst({
        where: eq(sparklesAccounts.email, profile.email!),
      });

      if (existing) {
        // Update tokens
        await db.update(sparklesAccounts)
          .set({
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token ?? existing.refreshToken,
            expiresAt: new Date(tokens.expiry_date!),
            updatedAt: new Date(),
          })
          .where(eq(sparklesAccounts.id, existing.id));

        // Return via postMessage for popup flow
        return generateCallbackHtml({
          success: true,
          accountId: existing.id,
          email: profile.email!,
          isNew: false,
        }, returnUrl);
      }

      // Count existing accounts for color assignment
      const accountCount = await db.query.sparklesAccounts.findMany({
        where: eq(sparklesAccounts.userId, userId),
      });

      // Create new account
      const [newAccount] = await db.insert(sparklesAccounts).values({
        userId,
        email: profile.email!,
        name: profile.name ?? profile.email!,
        avatar: profile.picture,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiresAt: new Date(tokens.expiry_date!),
        color: ACCOUNT_COLORS[accountCount.length % ACCOUNT_COLORS.length],
        isEnabled: true,
        syncMode: 'all',
      }).returning();

      return generateCallbackHtml({
        success: true,
        accountId: newAccount.id,
        email: profile.email!,
        name: profile.name,
        avatar: profile.picture,
        color: newAccount.color,
        isNew: true,
      }, returnUrl);

    } catch (error) {
      console.error('OAuth callback error:', error);
      return generateCallbackHtml({
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }, '/');
    }
  }, {
    query: t.Object({
      code: t.Optional(t.String()),
      state: t.String(),
      error: t.Optional(t.String()),
    }),
  })

  // Refresh token
  .post('/refresh', async ({ body }) => {
    const { accountId } = body;

    const account = await db.query.sparklesAccounts.findFirst({
      where: eq(sparklesAccounts.id, accountId),
    });

    if (!account) {
      return { error: 'Account not found' };
    }

    oauth2Client.setCredentials({
      refresh_token: account.refreshToken,
    });

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      await db.update(sparklesAccounts)
        .set({
          accessToken: credentials.access_token!,
          expiresAt: new Date(credentials.expiry_date!),
          updatedAt: new Date(),
        })
        .where(eq(sparklesAccounts.id, accountId));

      return {
        accessToken: credentials.access_token,
        expiresAt: credentials.expiry_date,
      };
    } catch (error) {
      console.error('Token refresh error:', error);

      // Mark account as needing re-auth
      await db.update(sparklesAccounts)
        .set({ isEnabled: false })
        .where(eq(sparklesAccounts.id, accountId));

      return { error: 'Token refresh failed', needsReauth: true };
    }
  }, {
    body: t.Object({
      accountId: t.String(),
    }),
  })

  // Disconnect account
  .delete('/disconnect/:accountId', async ({ params }) => {
    const { accountId } = params;

    // Revoke tokens
    const account = await db.query.sparklesAccounts.findFirst({
      where: eq(sparklesAccounts.id, accountId),
    });

    if (account) {
      try {
        await oauth2Client.revokeToken(account.accessToken);
      } catch (e) {
        // Token may already be invalid
      }

      await db.delete(sparklesAccounts)
        .where(eq(sparklesAccounts.id, accountId));
    }

    return { success: true };
  });

// Helper to generate callback HTML for popup flow
function generateCallbackHtml(result: Record<string, unknown>, returnUrl: string) {
  return new Response(`
    <!DOCTYPE html>
    <html>
      <head><title>Sparkles - Authentication</title></head>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage(${JSON.stringify({
              type: 'sparkles-oauth-callback',
              ...result,
            })}, '*');
            window.close();
          } else {
            window.location.href = '${returnUrl}';
          }
        </script>
        <p>Authentication complete. This window should close automatically.</p>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' },
  });
}
```

### 4.3 Frontend OAuth Hook

**File:** `src/components/features/sparkles/hooks/useSparklesAuth.ts`

```typescript
import { useCallback, useEffect } from 'react';
import { useSparklesStore } from '@/stores/sparklesStore';
import type { GmailAccount } from '@/types/sparkles';

export function useSparklesAuth() {
  const { addAccount, updateAccount, accounts } = useSparklesStore();

  // Listen for OAuth callback messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'sparkles-oauth-callback') return;

      const { success, accountId, email, name, avatar, color, isNew, error } = event.data;

      if (success) {
        if (isNew) {
          // Fetch full account details from server
          fetchAccountDetails(accountId).then((account) => {
            if (account) addAccount(account);
          });
        } else {
          // Just refresh the existing account's token status
          updateAccount(accountId, { isEnabled: true });
        }
      } else {
        console.error('OAuth failed:', error);
        // Show error toast
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addAccount, updateAccount]);

  const connectAccount = useCallback(() => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      `/api/v1/sparkles/auth/connect?userId=${getUserId()}&returnUrl=${encodeURIComponent(window.location.href)}`,
      'sparkles-oauth',
      `width=${width},height=${height},left=${left},top=${top},popup=yes`
    );

    // Focus popup
    popup?.focus();
  }, []);

  const disconnectAccount = useCallback(async (accountId: string) => {
    await fetch(`/api/v1/sparkles/auth/disconnect/${accountId}`, {
      method: 'DELETE',
    });
    useSparklesStore.getState().removeAccount(accountId);
  }, []);

  const refreshToken = useCallback(async (accountId: string) => {
    const response = await fetch('/api/v1/sparkles/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId }),
    });

    const data = await response.json();

    if (data.needsReauth) {
      updateAccount(accountId, { isEnabled: false });
      // Show re-auth prompt
      return false;
    }

    if (data.accessToken) {
      updateAccount(accountId, {
        accessToken: data.accessToken,
        expiresAt: data.expiresAt,
      });
      return true;
    }

    return false;
  }, [updateAccount]);

  return {
    accounts,
    connectAccount,
    disconnectAccount,
    refreshToken,
  };
}

async function fetchAccountDetails(accountId: string): Promise<GmailAccount | null> {
  const response = await fetch(`/api/v1/sparkles/accounts/${accountId}`);
  if (!response.ok) return null;
  return response.json();
}

function getUserId(): string {
  // Get from auth context or session
  return 'current-user-id';
}
```

---

## 5. Phase 4: Backend API Services

### 5.1 Gmail Service

**File:** `server/src/services/gmail/GmailService.ts`

```typescript
import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import type {
  EmailThread,
  EmailMessage,
  Label,
  Attachment,
  Participant,
  EmailHeaders,
  EmailCategory,
} from '@/types/sparkles';

export class GmailService {
  private gmail: gmail_v1.Gmail;
  private accountId: string;

  constructor(accessToken: string, accountId: string) {
    const auth = new OAuth2Client();
    auth.setCredentials({ access_token: accessToken });
    this.gmail = google.gmail({ version: 'v1', auth });
    this.accountId = accountId;
  }

  // =========================================================================
  // THREADS
  // =========================================================================

  async listThreads(options: {
    labelIds?: string[];
    query?: string;
    maxResults?: number;
    pageToken?: string;
    includeSpamTrash?: boolean;
  } = {}): Promise<{ threads: EmailThread[]; nextPageToken?: string }> {
    const { labelIds, query, maxResults = 50, pageToken, includeSpamTrash = false } = options;

    const response = await this.gmail.users.threads.list({
      userId: 'me',
      labelIds,
      q: query,
      maxResults,
      pageToken,
      includeSpamTrash,
    });

    if (!response.data.threads) {
      return { threads: [] };
    }

    // Fetch thread details in parallel (batch)
    const threads = await Promise.all(
      response.data.threads.map((t) => this.getThread(t.id!))
    );

    return {
      threads: threads.filter(Boolean) as EmailThread[],
      nextPageToken: response.data.nextPageToken ?? undefined,
    };
  }

  async getThread(threadId: string): Promise<EmailThread | null> {
    try {
      const response = await this.gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'full',
      });

      return this.parseThread(response.data);
    } catch (error) {
      console.error(`Failed to get thread ${threadId}:`, error);
      return null;
    }
  }

  async modifyThread(
    threadId: string,
    options: {
      addLabelIds?: string[];
      removeLabelIds?: string[];
    }
  ): Promise<void> {
    await this.gmail.users.threads.modify({
      userId: 'me',
      id: threadId,
      requestBody: {
        addLabelIds: options.addLabelIds,
        removeLabelIds: options.removeLabelIds,
      },
    });
  }

  async trashThread(threadId: string): Promise<void> {
    await this.gmail.users.threads.trash({
      userId: 'me',
      id: threadId,
    });
  }

  async untrashThread(threadId: string): Promise<void> {
    await this.gmail.users.threads.untrash({
      userId: 'me',
      id: threadId,
    });
  }

  async deleteThread(threadId: string): Promise<void> {
    await this.gmail.users.threads.delete({
      userId: 'me',
      id: threadId,
    });
  }

  // =========================================================================
  // BATCH OPERATIONS
  // =========================================================================

  async batchModifyThreads(
    threadIds: string[],
    action: 'archive' | 'trash' | 'markRead' | 'markUnread' | 'star' | 'unstar' | 'addLabel' | 'removeLabel',
    labelId?: string
  ): Promise<{ success: boolean; errors?: Array<{ id: string; error: string }> }> {
    const errors: Array<{ id: string; error: string }> = [];

    // Process in batches of 50
    const batches = chunk(threadIds, 50);

    for (const batch of batches) {
      try {
        let addLabelIds: string[] = [];
        let removeLabelIds: string[] = [];

        switch (action) {
          case 'archive':
            removeLabelIds = ['INBOX'];
            break;
          case 'trash':
            addLabelIds = ['TRASH'];
            removeLabelIds = ['INBOX'];
            break;
          case 'markRead':
            removeLabelIds = ['UNREAD'];
            break;
          case 'markUnread':
            addLabelIds = ['UNREAD'];
            break;
          case 'star':
            addLabelIds = ['STARRED'];
            break;
          case 'unstar':
            removeLabelIds = ['STARRED'];
            break;
          case 'addLabel':
            if (labelId) addLabelIds = [labelId];
            break;
          case 'removeLabel':
            if (labelId) removeLabelIds = [labelId];
            break;
        }

        await this.gmail.users.messages.batchModify({
          userId: 'me',
          requestBody: {
            ids: batch,
            addLabelIds,
            removeLabelIds,
          },
        });
      } catch (error) {
        batch.forEach((id) => {
          errors.push({
            id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });
      }
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // =========================================================================
  // MESSAGES
  // =========================================================================

  async getMessage(messageId: string): Promise<EmailMessage | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      return this.parseMessage(response.data);
    } catch (error) {
      console.error(`Failed to get message ${messageId}:`, error);
      return null;
    }
  }

  async sendMessage(options: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    threadId?: string;
    inReplyTo?: string;
    references?: string[];
    attachments?: Array<{ filename: string; mimeType: string; data: string }>;
  }): Promise<{ id: string; threadId: string; labelIds: string[] }> {
    const message = this.buildRawMessage(options);

    const response = await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: message,
        threadId: options.threadId,
      },
    });

    return {
      id: response.data.id!,
      threadId: response.data.threadId!,
      labelIds: response.data.labelIds ?? [],
    };
  }

  // =========================================================================
  // DRAFTS
  // =========================================================================

  async createDraft(options: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    bodyHtml: string;
    threadId?: string;
  }): Promise<{ id: string; messageId: string }> {
    const message = this.buildRawMessage(options);

    const response = await this.gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: message,
          threadId: options.threadId,
        },
      },
    });

    return {
      id: response.data.id!,
      messageId: response.data.message?.id!,
    };
  }

  async updateDraft(
    draftId: string,
    options: {
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      bodyHtml: string;
      threadId?: string;
    }
  ): Promise<{ id: string; messageId: string }> {
    const message = this.buildRawMessage(options);

    const response = await this.gmail.users.drafts.update({
      userId: 'me',
      id: draftId,
      requestBody: {
        message: {
          raw: message,
          threadId: options.threadId,
        },
      },
    });

    return {
      id: response.data.id!,
      messageId: response.data.message?.id!,
    };
  }

  async deleteDraft(draftId: string): Promise<void> {
    await this.gmail.users.drafts.delete({
      userId: 'me',
      id: draftId,
    });
  }

  async sendDraft(draftId: string): Promise<{ id: string; threadId: string }> {
    const response = await this.gmail.users.drafts.send({
      userId: 'me',
      requestBody: { id: draftId },
    });

    return {
      id: response.data.id!,
      threadId: response.data.threadId!,
    };
  }

  // =========================================================================
  // LABELS
  // =========================================================================

  async listLabels(): Promise<Label[]> {
    const response = await this.gmail.users.labels.list({
      userId: 'me',
    });

    if (!response.data.labels) return [];

    // Get detailed info for each label
    const labels = await Promise.all(
      response.data.labels.map(async (l) => {
        const detail = await this.gmail.users.labels.get({
          userId: 'me',
          id: l.id!,
        });
        return this.parseLabel(detail.data);
      })
    );

    return labels;
  }

  async createLabel(
    name: string,
    options?: {
      messageListVisibility?: 'show' | 'hide';
      labelListVisibility?: 'labelShow' | 'labelShowIfUnread' | 'labelHide';
      backgroundColor?: string;
      textColor?: string;
    }
  ): Promise<Label> {
    const response = await this.gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name,
        messageListVisibility: options?.messageListVisibility ?? 'show',
        labelListVisibility: options?.labelListVisibility ?? 'labelShow',
        color: options?.backgroundColor ? {
          backgroundColor: options.backgroundColor,
          textColor: options.textColor ?? '#000000',
        } : undefined,
      },
    });

    return this.parseLabel(response.data);
  }

  async updateLabel(labelId: string, updates: Partial<Label>): Promise<Label> {
    const response = await this.gmail.users.labels.update({
      userId: 'me',
      id: labelId,
      requestBody: {
        name: updates.name,
        messageListVisibility: updates.messageListVisibility,
        labelListVisibility: updates.labelListVisibility,
        color: updates.color ? {
          backgroundColor: updates.color.backgroundColor,
          textColor: updates.color.textColor,
        } : undefined,
      },
    });

    return this.parseLabel(response.data);
  }

  async deleteLabel(labelId: string): Promise<void> {
    await this.gmail.users.labels.delete({
      userId: 'me',
      id: labelId,
    });
  }

  // =========================================================================
  // ATTACHMENTS
  // =========================================================================

  async getAttachment(messageId: string, attachmentId: string): Promise<{ data: string; size: number }> {
    const response = await this.gmail.users.messages.attachments.get({
      userId: 'me',
      messageId,
      id: attachmentId,
    });

    return {
      data: response.data.data!,
      size: response.data.size!,
    };
  }

  // =========================================================================
  // PUSH NOTIFICATIONS
  // =========================================================================

  async watchMailbox(topicName: string, labelIds?: string[]): Promise<{
    historyId: string;
    expiration: string;
  }> {
    const response = await this.gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName,
        labelIds: labelIds ?? ['INBOX'],
        labelFilterAction: 'include',
      },
    });

    return {
      historyId: response.data.historyId!,
      expiration: response.data.expiration!,
    };
  }

  async stopWatch(): Promise<void> {
    await this.gmail.users.stop({
      userId: 'me',
    });
  }

  async getHistory(startHistoryId: string, historyTypes?: string[]): Promise<{
    history: gmail_v1.Schema$History[];
    nextPageToken?: string;
    historyId: string;
  }> {
    const response = await this.gmail.users.history.list({
      userId: 'me',
      startHistoryId,
      historyTypes: historyTypes ?? ['messageAdded', 'messageDeleted', 'labelAdded', 'labelRemoved'],
    });

    return {
      history: response.data.history ?? [],
      nextPageToken: response.data.nextPageToken ?? undefined,
      historyId: response.data.historyId!,
    };
  }

  // =========================================================================
  // PROFILE
  // =========================================================================

  async getProfile(): Promise<{
    email: string;
    messagesTotal: number;
    threadsTotal: number;
    historyId: string;
  }> {
    const response = await this.gmail.users.getProfile({
      userId: 'me',
    });

    return {
      email: response.data.emailAddress!,
      messagesTotal: response.data.messagesTotal!,
      threadsTotal: response.data.threadsTotal!,
      historyId: response.data.historyId!,
    };
  }

  // =========================================================================
  // PRIVATE HELPERS
  // =========================================================================

  private parseThread(data: gmail_v1.Schema$Thread): EmailThread {
    const messages = (data.messages ?? []).map((m) => this.parseMessage(m));
    const lastMessage = messages[messages.length - 1];
    const firstMessage = messages[0];

    // Extract unique participants
    const participantMap = new Map<string, Participant>();
    messages.forEach((m) => {
      [m.from, ...(m.to ?? []), ...(m.cc ?? [])].forEach((p) => {
        if (p && !participantMap.has(p.email)) {
          participantMap.set(p.email, p);
        }
      });
    });

    // Determine category based on labels and headers
    const category = this.categorizeThread(messages, data.messages?.[0]?.labelIds ?? []);

    return {
      id: data.id!,
      accountId: this.accountId,
      historyId: data.historyId!,
      snippet: data.snippet ?? '',
      subject: firstMessage?.subject ?? '(no subject)',
      participants: Array.from(participantMap.values()),
      messages,
      labelIds: data.messages?.[0]?.labelIds ?? [],
      isUnread: data.messages?.some((m) => m.labelIds?.includes('UNREAD')) ?? false,
      isStarred: data.messages?.some((m) => m.labelIds?.includes('STARRED')) ?? false,
      isImportant: data.messages?.some((m) => m.labelIds?.includes('IMPORTANT')) ?? false,
      isPriority: false, // Set by frontend based on priority senders
      category,
      lastMessageAt: lastMessage ? parseInt(lastMessage.internalDate.toString()) : Date.now(),
      messageCount: messages.length,
      hasAttachments: messages.some((m) => m.attachments.length > 0),
      isMuted: false,
    };
  }

  private parseMessage(data: gmail_v1.Schema$Message): EmailMessage {
    const headers = this.parseHeaders(data.payload?.headers ?? []);
    const { bodyHtml, bodyText } = this.parseBody(data.payload);
    const attachments = this.parseAttachments(data.payload);

    return {
      id: data.id!,
      threadId: data.threadId!,
      accountId: this.accountId,
      from: this.parseParticipant(headers.from),
      to: this.parseParticipants(headers.to),
      cc: headers.cc ? this.parseParticipants(headers.cc) : undefined,
      bcc: headers.bcc ? this.parseParticipants(headers.bcc) : undefined,
      replyTo: headers.replyTo ? this.parseParticipant(headers.replyTo) : undefined,
      subject: headers.subject ?? '(no subject)',
      bodyHtml,
      bodyText,
      snippet: data.snippet ?? '',
      attachments,
      internalDate: parseInt(data.internalDate ?? '0'),
      receivedAt: parseInt(data.internalDate ?? '0'),
      headers: {
        messageId: headers.messageId ?? '',
        inReplyTo: headers.inReplyTo,
        references: headers.references?.split(/\s+/),
        listUnsubscribe: headers.listUnsubscribe,
        listUnsubscribePost: headers.listUnsubscribePost,
        contentType: headers.contentType ?? 'text/plain',
        mimeVersion: headers.mimeVersion ?? '1.0',
      },
      labelIds: data.labelIds ?? [],
      isRead: !data.labelIds?.includes('UNREAD'),
      hasUnsubscribe: !!headers.listUnsubscribe,
      unsubscribeLink: headers.listUnsubscribe,
    };
  }

  private parseHeaders(headers: gmail_v1.Schema$MessagePartHeader[]): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((h) => {
      if (h.name && h.value) {
        result[this.camelCase(h.name)] = h.value;
      }
    });
    return result;
  }

  private parseBody(payload?: gmail_v1.Schema$MessagePart): { bodyHtml: string; bodyText: string } {
    let bodyHtml = '';
    let bodyText = '';

    if (!payload) return { bodyHtml, bodyText };

    const processPayload = (part: gmail_v1.Schema$MessagePart) => {
      if (part.mimeType === 'text/html' && part.body?.data) {
        bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }

      part.parts?.forEach(processPayload);
    };

    processPayload(payload);

    return { bodyHtml, bodyText };
  }

  private parseAttachments(payload?: gmail_v1.Schema$MessagePart): Attachment[] {
    const attachments: Attachment[] = [];

    const processPayload = (part: gmail_v1.Schema$MessagePart, messageId: string) => {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          id: part.body.attachmentId,
          messageId,
          filename: part.filename,
          mimeType: part.mimeType ?? 'application/octet-stream',
          size: part.body.size ?? 0,
          contentId: part.headers?.find((h) => h.name === 'Content-ID')?.value,
          isInline: part.headers?.some(
            (h) => h.name === 'Content-Disposition' && h.value?.includes('inline')
          ) ?? false,
        });
      }

      part.parts?.forEach((p) => processPayload(p, messageId));
    };

    if (payload) {
      processPayload(payload, '');
    }

    return attachments;
  }

  private parseParticipant(value: string): Participant {
    const match = value.match(/^(?:(.+?)\s*)?<(.+?)>$/);
    if (match) {
      return { name: match[1]?.trim(), email: match[2].trim() };
    }
    return { email: value.trim() };
  }

  private parseParticipants(value: string): Participant[] {
    return value.split(',').map((v) => this.parseParticipant(v.trim()));
  }

  private parseLabel(data: gmail_v1.Schema$Label): Label {
    return {
      id: data.id!,
      accountId: this.accountId,
      name: data.name!,
      type: data.type === 'system' ? 'system' : 'user',
      messageListVisibility: (data.messageListVisibility as 'show' | 'hide') ?? 'show',
      labelListVisibility: (data.labelListVisibility as Label['labelListVisibility']) ?? 'labelShow',
      color: data.color ? {
        textColor: data.color.textColor!,
        backgroundColor: data.color.backgroundColor!,
      } : undefined,
      unreadCount: data.messagesUnread ?? 0,
      totalCount: data.messagesTotal ?? 0,
      threadsUnread: data.threadsUnread ?? 0,
      threadsTotal: data.threadsTotal ?? 0,
    };
  }

  private categorizeThread(messages: EmailMessage[], labelIds: string[]): EmailCategory {
    // Check Gmail categories first
    if (labelIds.includes('CATEGORY_SOCIAL')) return 'social';
    if (labelIds.includes('CATEGORY_PROMOTIONS')) return 'promotions';
    if (labelIds.includes('CATEGORY_UPDATES')) return 'updates';
    if (labelIds.includes('CATEGORY_FORUMS')) return 'forums';

    // Check for newsletter indicators
    const hasUnsubscribe = messages.some((m) => m.hasUnsubscribe);
    const fromNoreply = messages.some((m) =>
      m.from.email.includes('noreply') ||
      m.from.email.includes('no-reply') ||
      m.from.email.includes('notifications')
    );

    if (hasUnsubscribe && !fromNoreply) return 'newsletters';
    if (fromNoreply) return 'notifications';

    return 'primary';
  }

  private buildRawMessage(options: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    inReplyTo?: string;
    references?: string[];
    attachments?: Array<{ filename: string; mimeType: string; data: string }>;
  }): string {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let raw = '';
    raw += `To: ${options.to.join(', ')}\r\n`;
    if (options.cc?.length) raw += `Cc: ${options.cc.join(', ')}\r\n`;
    if (options.bcc?.length) raw += `Bcc: ${options.bcc.join(', ')}\r\n`;
    raw += `Subject: ${options.subject}\r\n`;
    raw += 'MIME-Version: 1.0\r\n';

    if (options.inReplyTo) {
      raw += `In-Reply-To: ${options.inReplyTo}\r\n`;
    }
    if (options.references?.length) {
      raw += `References: ${options.references.join(' ')}\r\n`;
    }

    if (options.attachments?.length) {
      raw += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
      raw += `--${boundary}\r\n`;
    }

    raw += 'Content-Type: multipart/alternative; boundary="alt_boundary"\r\n\r\n';

    // Plain text part
    if (options.bodyText) {
      raw += '--alt_boundary\r\n';
      raw += 'Content-Type: text/plain; charset="UTF-8"\r\n\r\n';
      raw += options.bodyText + '\r\n\r\n';
    }

    // HTML part
    raw += '--alt_boundary\r\n';
    raw += 'Content-Type: text/html; charset="UTF-8"\r\n\r\n';
    raw += options.bodyHtml + '\r\n\r\n';
    raw += '--alt_boundary--\r\n';

    // Attachments
    if (options.attachments?.length) {
      for (const att of options.attachments) {
        raw += `--${boundary}\r\n`;
        raw += `Content-Type: ${att.mimeType}; name="${att.filename}"\r\n`;
        raw += 'Content-Transfer-Encoding: base64\r\n';
        raw += `Content-Disposition: attachment; filename="${att.filename}"\r\n\r\n`;
        raw += att.data + '\r\n';
      }
      raw += `--${boundary}--\r\n`;
    }

    return Buffer.from(raw).toString('base64url');
  }

  private camelCase(str: string): string {
    return str.toLowerCase().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  }
}

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

### 5.2 Gmail API Routes

**File:** `server/src/routes/gmail.ts`

```typescript
import { Elysia, t } from 'elysia';
import { GmailService } from '../services/gmail/GmailService';
import { getAccountToken } from '../services/auth/tokenManager';

export const gmailRoutes = new Elysia({ prefix: '/api/v1/gmail' })
  // Middleware to get account token
  .derive(async ({ headers, query }) => {
    const accountId = query.accountId ?? headers['x-account-id'];
    if (!accountId) {
      throw new Error('Account ID required');
    }

    const { accessToken } = await getAccountToken(accountId as string);
    const gmail = new GmailService(accessToken, accountId as string);

    return { gmail, accountId };
  })

  // =========================================================================
  // THREADS
  // =========================================================================

  .get('/threads', async ({ gmail, query }) => {
    return gmail.listThreads({
      labelIds: query.labelIds?.split(','),
      query: query.q,
      maxResults: query.maxResults ? parseInt(query.maxResults) : 50,
      pageToken: query.pageToken,
    });
  }, {
    query: t.Object({
      accountId: t.String(),
      labelIds: t.Optional(t.String()),
      q: t.Optional(t.String()),
      maxResults: t.Optional(t.String()),
      pageToken: t.Optional(t.String()),
    }),
  })

  .get('/threads/:threadId', async ({ gmail, params }) => {
    const thread = await gmail.getThread(params.threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }
    return thread;
  })

  .patch('/threads/:threadId', async ({ gmail, params, body }) => {
    await gmail.modifyThread(params.threadId, {
      addLabelIds: body.addLabelIds,
      removeLabelIds: body.removeLabelIds,
    });
    return { success: true };
  }, {
    body: t.Object({
      addLabelIds: t.Optional(t.Array(t.String())),
      removeLabelIds: t.Optional(t.Array(t.String())),
    }),
  })

  .delete('/threads/:threadId', async ({ gmail, params, query }) => {
    if (query.permanent === 'true') {
      await gmail.deleteThread(params.threadId);
    } else {
      await gmail.trashThread(params.threadId);
    }
    return { success: true };
  }, {
    query: t.Object({
      accountId: t.String(),
      permanent: t.Optional(t.String()),
    }),
  })

  .post('/threads/:threadId/untrash', async ({ gmail, params }) => {
    await gmail.untrashThread(params.threadId);
    return { success: true };
  })

  // =========================================================================
  // BATCH OPERATIONS
  // =========================================================================

  .post('/threads/batch', async ({ gmail, body }) => {
    return gmail.batchModifyThreads(
      body.threadIds,
      body.action,
      body.labelId
    );
  }, {
    body: t.Object({
      threadIds: t.Array(t.String()),
      action: t.Union([
        t.Literal('archive'),
        t.Literal('trash'),
        t.Literal('markRead'),
        t.Literal('markUnread'),
        t.Literal('star'),
        t.Literal('unstar'),
        t.Literal('addLabel'),
        t.Literal('removeLabel'),
      ]),
      labelId: t.Optional(t.String()),
    }),
  })

  // =========================================================================
  // MESSAGES
  // =========================================================================

  .get('/messages/:messageId', async ({ gmail, params }) => {
    const message = await gmail.getMessage(params.messageId);
    if (!message) {
      throw new Error('Message not found');
    }
    return message;
  })

  .post('/send', async ({ gmail, body }) => {
    return gmail.sendMessage({
      to: body.to,
      cc: body.cc,
      bcc: body.bcc,
      subject: body.subject,
      bodyHtml: body.bodyHtml,
      bodyText: body.bodyText,
      threadId: body.threadId,
      inReplyTo: body.inReplyTo,
      references: body.references,
      attachments: body.attachments,
    });
  }, {
    body: t.Object({
      to: t.Array(t.String()),
      cc: t.Optional(t.Array(t.String())),
      bcc: t.Optional(t.Array(t.String())),
      subject: t.String(),
      bodyHtml: t.String(),
      bodyText: t.Optional(t.String()),
      threadId: t.Optional(t.String()),
      inReplyTo: t.Optional(t.String()),
      references: t.Optional(t.Array(t.String())),
      attachments: t.Optional(t.Array(t.Object({
        filename: t.String(),
        mimeType: t.String(),
        data: t.String(),
      }))),
    }),
  })

  // =========================================================================
  // DRAFTS
  // =========================================================================

  .post('/draft', async ({ gmail, body }) => {
    return gmail.createDraft({
      to: body.to,
      cc: body.cc,
      bcc: body.bcc,
      subject: body.subject,
      bodyHtml: body.bodyHtml,
      threadId: body.threadId,
    });
  }, {
    body: t.Object({
      to: t.Array(t.String()),
      cc: t.Optional(t.Array(t.String())),
      bcc: t.Optional(t.Array(t.String())),
      subject: t.String(),
      bodyHtml: t.String(),
      threadId: t.Optional(t.String()),
    }),
  })

  .put('/draft/:draftId', async ({ gmail, params, body }) => {
    return gmail.updateDraft(params.draftId, {
      to: body.to,
      cc: body.cc,
      bcc: body.bcc,
      subject: body.subject,
      bodyHtml: body.bodyHtml,
      threadId: body.threadId,
    });
  }, {
    body: t.Object({
      to: t.Array(t.String()),
      cc: t.Optional(t.Array(t.String())),
      bcc: t.Optional(t.Array(t.String())),
      subject: t.String(),
      bodyHtml: t.String(),
      threadId: t.Optional(t.String()),
    }),
  })

  .delete('/draft/:draftId', async ({ gmail, params }) => {
    await gmail.deleteDraft(params.draftId);
    return { success: true };
  })

  .post('/draft/:draftId/send', async ({ gmail, params }) => {
    return gmail.sendDraft(params.draftId);
  })

  // =========================================================================
  // LABELS
  // =========================================================================

  .get('/labels', async ({ gmail }) => {
    return { labels: await gmail.listLabels() };
  })

  .post('/labels', async ({ gmail, body }) => {
    return gmail.createLabel(body.name, {
      backgroundColor: body.backgroundColor,
      textColor: body.textColor,
    });
  }, {
    body: t.Object({
      name: t.String(),
      backgroundColor: t.Optional(t.String()),
      textColor: t.Optional(t.String()),
    }),
  })

  .patch('/labels/:labelId', async ({ gmail, params, body }) => {
    return gmail.updateLabel(params.labelId, body);
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      color: t.Optional(t.Object({
        backgroundColor: t.String(),
        textColor: t.String(),
      })),
    }),
  })

  .delete('/labels/:labelId', async ({ gmail, params }) => {
    await gmail.deleteLabel(params.labelId);
    return { success: true };
  })

  // =========================================================================
  // ATTACHMENTS
  // =========================================================================

  .get('/messages/:messageId/attachments/:attachmentId', async ({ gmail, params }) => {
    return gmail.getAttachment(params.messageId, params.attachmentId);
  })

  // =========================================================================
  // PUSH NOTIFICATIONS
  // =========================================================================

  .post('/push/watch', async ({ gmail, body }) => {
    return gmail.watchMailbox(body.topicName, body.labelIds);
  }, {
    body: t.Object({
      topicName: t.String(),
      labelIds: t.Optional(t.Array(t.String())),
    }),
  })

  .post('/push/stop', async ({ gmail }) => {
    await gmail.stopWatch();
    return { success: true };
  })

  // =========================================================================
  // PROFILE
  // =========================================================================

  .get('/profile', async ({ gmail }) => {
    return gmail.getProfile();
  });
```

---

*[Document continues with remaining phases...]*

Due to length constraints, I've included the most critical phases. The full document continues with:

## 6. Phase 5: Core UI Components
- SparklesApp.tsx (main container)
- SparklesSidebar.tsx
- SparklesMailList.tsx
- SparklesThreadItem.tsx

## 7. Phase 6: Smart Inbox & Gatekeeper
- Category sorting logic
- Gatekeeper modal
- Priority sender highlighting

## 8. Phase 7: Email Detail & Thread View
- SparklesMailView.tsx
- SparklesMessageItem.tsx
- HTML sanitization

## 9. Phase 8: Compose & Send
- Rich text editor integration
- Draft auto-save
- Snooze and Send Later

## 10. Phase 9: Calendar Integration
- Calendar widget
- Free/busy API
- Event creation

## 11. Phase 10: Menu Bar Integration
- useSparklesMenuBar hook
- Status icons
- Keyboard shortcuts

## 12. Phase 11: AI Features
- Email summarization
- Smart compose
- AI writing assist

## 13. Phase 12: Polish & Optimization
- Virtual scrolling
- Offline support
- Accessibility

---

## 14. File Structure Reference

```
src/
├── components/
│   └── features/
│       └── sparkles/
│           ├── SparklesApp.tsx
│           ├── SparklesSidebar.tsx
│           ├── SparklesMailList.tsx
│           ├── SparklesMailView.tsx
│           ├── SparklesComposeModal.tsx
│           ├── SparklesGatekeeper.tsx
│           ├── SparklesSmartInbox.tsx
│           ├── SparklesPrioritySection.tsx
│           ├── SparklesSnoozeModal.tsx
│           ├── SparklesSendLater.tsx
│           ├── SparklesSearchBar.tsx
│           ├── SparklesCalendarWidget.tsx
│           ├── SparklesAccountSwitcher.tsx
│           ├── SparklesThreadItem.tsx
│           ├── SparklesMessageItem.tsx
│           ├── SparklesAttachments.tsx
│           ├── SparklesAIAssist.tsx
│           ├── SparklesSettings/
│           │   ├── SparklesSettingsModal.tsx
│           │   ├── GeneralSettings.tsx
│           │   ├── AccountsSettings.tsx
│           │   ├── GatekeeperSettings.tsx
│           │   └── SmartInboxSettings.tsx
│           └── hooks/
│               ├── useSparklesAuth.ts
│               ├── useSparklesMenuBar.ts
│               ├── useGmail.ts
│               ├── useGmailPush.ts
│               ├── useGoogleCalendar.ts
│               ├── useFreeBusy.ts
│               ├── useSmartInbox.ts
│               ├── useSparklesSearch.ts
│               └── useSparklesShortcuts.ts
├── stores/
│   └── sparklesStore.ts
├── types/
│   └── sparkles.ts
└── services/
    └── a2a/
        ├── SparklesEmailService.ts
        └── SparklesCalendarService.ts

server/src/
├── routes/
│   ├── sparkles-auth.ts
│   ├── gmail.ts
│   └── calendar.ts
├── services/
│   ├── gmail/
│   │   └── GmailService.ts
│   ├── calendar/
│   │   └── CalendarService.ts
│   └── auth/
│       └── tokenManager.ts
├── db/
│   └── schema/
│       └── sparkles.ts
└── config/
    └── oauth.ts
```

---

## 15. API Endpoint Reference

### Gmail API (`/api/v1/gmail`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/threads` | List threads with pagination |
| GET | `/threads/:id` | Get thread with messages |
| PATCH | `/threads/:id` | Modify thread labels |
| DELETE | `/threads/:id` | Trash thread |
| POST | `/threads/:id/untrash` | Restore from trash |
| POST | `/threads/batch` | Batch modify threads |
| GET | `/messages/:id` | Get single message |
| POST | `/send` | Send email |
| POST | `/draft` | Create draft |
| PUT | `/draft/:id` | Update draft |
| DELETE | `/draft/:id` | Delete draft |
| POST | `/draft/:id/send` | Send draft |
| GET | `/labels` | List labels |
| POST | `/labels` | Create label |
| PATCH | `/labels/:id` | Update label |
| DELETE | `/labels/:id` | Delete label |
| GET | `/messages/:id/attachments/:aid` | Download attachment |
| POST | `/push/watch` | Start push notifications |
| POST | `/push/stop` | Stop push notifications |
| GET | `/profile` | Get account profile |

### Calendar API (`/api/v1/calendar`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calendars` | List calendars |
| GET | `/events` | List events |
| GET | `/events/:id` | Get event |
| POST | `/events` | Create event |
| PATCH | `/events/:id` | Update event |
| DELETE | `/events/:id` | Delete event |
| POST | `/events/:id/rsvp` | Respond to invite |
| POST | `/freebusy` | Query availability |
| POST | `/push/watch` | Start push notifications |

---

## 16. Environment Variables

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Push Notifications
GOOGLE_PUBSUB_TOPIC=projects/your-project/topics/sparkles-push

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/liquidcrypto

# Redis
REDIS_URL=redis://localhost:6379

# Server
BASE_URL=http://localhost:3000
PORT=3000
```

---

*Document Version: 1.0*
*Last Updated: 2026-01-21*
