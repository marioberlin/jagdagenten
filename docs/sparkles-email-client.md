# Sparkles: Liquid Glass Email Client
## Comprehensive Implementation Plan

---

## 1. Executive Summary

**Sparkles** is a modern email client built with the Liquid Glass design system, integrating two Gmail accounts and two Google Calendar instances. The UI draws inspiration from Spark Mail's innovative UX patterns combined with the reference screenshot's 3-column layout.

### Key Features
- Multi-account Gmail integration (2 accounts)
- **Smart Inbox** with automatic categorization (Primary, Newsletters, Notifications)
- **Gatekeeper** for screening unknown senders
- **Priority Sender** highlighting
- Google Calendar integration with **Free/Busy** availability
- Liquid Glass aesthetic with glassmorphism effects
- AI-powered email features (smart compose, summarization, translation)
- Thread-based conversation view with **Group by Sender**
- Search with Gmail query syntax support
- Labels/folders management
- Quick actions (archive, delete, **snooze**, **send later**)
- **Push Notifications** via Cloud Pub/Sub

---

## 2. Research Findings

### 2.1 Gmail API Capabilities

Based on [Gmail API documentation](https://developers.google.com/workspace/gmail/api/guides):

**Core Features:**
- **Threads**: Group related messages into conversations. Threads can have labels applied, but cannot be created—only messages can be inserted into threads.
- **Labels**: Many-to-many relationship with messages. System labels (INBOX, SENT) + custom user labels with colors.
- **Batch Operations**: Up to 100 calls per batch request (50 recommended). Use `messages.batchModify` for bulk label changes.
- **Push Notifications**: Via Cloud Pub/Sub webhooks—eliminates polling. Can filter by specific labels.

**Rate Limits** (from [Usage Limits](https://developers.google.com/workspace/gmail/api/reference/quota)):
- **250 quota units per user per second** (different operations cost different units)
- **Per-project daily limits** aggregate across all users
- **Sending limits**:
  - Google Workspace: 2,000 emails/day, 10,000 recipients/day
  - Free Gmail: 500 emails/day, 500 recipients/day
- Exceeding limits = 24-hour sending pause

**2026 Updates** (from [Google Blog](https://blog.google/products-and-platforms/products/gmail/gmail-is-entering-the-gemini-era/)):
- Gmail now in "Gemini era" with AI Overviews
- AI-powered inbox assistant features rolling out
- Postmaster Tools v2beta API with batch operations

### 2.2 Google Calendar API Features

Based on [Calendar API documentation](https://developers.google.com/workspace/calendar/api/guides/push):

**Free/Busy API** ([FreeBusy endpoint](https://developers.google.com/workspace/calendar/api/v3/reference/freebusy)):
- Query availability across multiple calendars
- Returns busy time blocks with start/end times
- Supports Google Group identifiers for team scheduling
- Essential for "find a time to meet" feature

**Push Notifications** ([Watch API](https://developers.google.com/workspace/calendar/api/v3/reference/events/watch)):
- Webhook-based real-time updates
- Requires HTTPS endpoint with valid SSL
- Supports Acl, CalendarList, Events, and Settings resources
- Channels expire and need manual renewal
- Notifications are minimal—must fetch full data after notification

### 2.3 Spark Mail UX Patterns

Based on [Spark Mail Features](https://sparkmailapp.com/features):

**Smart Inbox Organization:**
| Category | Description |
|----------|-------------|
| **Primary** | Direct communications from real people—clients, colleagues |
| **Newsletters** | Subscriptions, industry updates, reports |
| **Notifications** | App updates (Trello, Airtable, etc.) |

**Key Features to Adopt:**

1. **Gatekeeper** - Screens unknown senders before inbox
   - Accept/Block decision for new senders
   - 70-80% inbox noise reduction reported
   - Three modes: Screen before inbox, Screen inside inbox, Accept all

2. **Priority Sender** - Visual highlighting of important contacts
   - User-defined priority contacts
   - Highlighted at top of inbox
   - Configurable preview count (1-10 emails)

3. **Group by Sender** - Bundle messages from same sender
   - Streamlined navigation
   - Similar to Gmail's "Conversations" but sender-centric

4. **Snooze** - Temporarily hide emails
   - Return at specified time
   - "Set Aside" for later review

5. **Send Later** - Schedule email delivery
   - Optimal timing suggestions
   - Queue management

6. **Mute Threads** - Auto-archive future messages in thread

7. **Reminders** - Follow-up prompts for specific emails

8. **Home Screen vs Smart Inbox** - Two view modes
   - Home: Focus mode with priorities
   - Smart Inbox: Full categorized view

---

## 3. Architecture Overview

### 3.1 Enhanced Component Hierarchy

```
SparklesApp (Panel Container)
├── SparklesSidebar
│   ├── AccountSwitcher (2 accounts with avatars)
│   ├── ComposeButton (prominent CTA)
│   ├── SmartFolders
│   │   ├── Primary (real people)
│   │   ├── Newsletters
│   │   ├── Notifications
│   │   └── Gatekeeper (pending review)
│   ├── SystemFolders
│   │   ├── Inbox, Sent, Drafts, Trash, Spam
│   │   └── Starred, Important, All Mail
│   ├── UserLabels (collapsible, colored)
│   ├── CalendarWidget
│   │   ├── MiniCalendar (month view)
│   │   └── UpcomingEvents (next 24h)
│   └── SidebarFooter (settings, help)
│
├── SparklesMailList
│   ├── SearchBar (with filter chips)
│   ├── ViewToggle (Smart Inbox / All)
│   ├── ListControls
│   │   ├── SelectAll, Refresh
│   │   ├── BulkActions (archive, delete, move)
│   │   └── SortBy (date, sender, unread)
│   ├── PrioritySection (highlighted, collapsible)
│   ├── EmailThreadList (virtualized)
│   │   └── EmailThreadItem
│   │       ├── Avatar (with priority indicator)
│   │       ├── SenderName + Subject
│   │       ├── Snippet + Date
│   │       ├── Labels (chips)
│   │       └── QuickActions (on hover: archive, snooze, star)
│   └── LoadMore / InfiniteScroll
│
├── SparklesMailView
│   ├── ThreadHeader
│   │   ├── Subject
│   │   ├── Participants (avatars)
│   │   └── Actions (reply, forward, archive, delete, snooze, more)
│   ├── MessageList
│   │   └── MessageItem (expandable)
│   │       ├── SenderInfo (avatar, name, email, time)
│   │       ├── EmailBody (sanitized HTML)
│   │       ├── AttachmentBar
│   │       └── MessageActions (reply, forward)
│   ├── AttachmentGallery (images, files)
│   └── QuickReply
│       ├── MinimalCompose
│       ├── ExpandButton
│       └── AIAssist (suggestions)
│
├── SparklesGatekeeper (modal/panel)
│   ├── PendingSenders list
│   ├── Accept/Block buttons
│   └── BulkActions
│
├── SparklesComposeModal
│   ├── FromSelector (account dropdown)
│   ├── RecipientFields (To, Cc, Bcc with autocomplete)
│   ├── SubjectInput
│   ├── RichTextEditor
│   │   ├── FormattingToolbar
│   │   └── AIWritingAssist
│   ├── AttachmentBar (drag-drop)
│   ├── ScheduleButton (send later)
│   └── SendControls (Send, Save Draft, Discard)
│
└── SparklesCalendarModal (optional full view)
    ├── CalendarGrid (week/month)
    ├── EventDetails
    └── CreateEvent
```

### 3.2 Enhanced State Management

```typescript
// src/stores/sparklesStore.ts
interface SparklesState {
  // === Accounts ===
  accounts: GmailAccount[];
  activeAccountId: string | null;

  // === Smart Inbox ===
  smartInboxEnabled: boolean;
  categories: {
    primary: EmailThread[];
    newsletters: EmailThread[];
    notifications: EmailThread[];
  };

  // === Gatekeeper ===
  gatekeeperMode: 'before_inbox' | 'inside_inbox' | 'disabled';
  pendingSenders: PendingSender[];
  blockedSenders: string[];

  // === Priority ===
  prioritySenders: string[]; // email addresses
  priorityPreviewCount: number; // 1-10

  // === Folders & Labels ===
  activeFolder: FolderType | 'SMART_INBOX';
  labels: Label[];

  // === Emails ===
  threads: EmailThread[];
  selectedThreadId: string | null;
  isLoadingThreads: boolean;
  threadCache: Map<string, EmailThread>; // LRU cache

  // === Search & Filters ===
  searchQuery: string;
  filters: EmailFilters;
  recentSearches: string[];

  // === Compose ===
  composeState: ComposeState | null;
  scheduledEmails: ScheduledEmail[];
  draftId: string | null;

  // === Snooze ===
  snoozedThreads: SnoozedThread[];

  // === Calendar ===
  calendars: GoogleCalendar[];
  upcomingEvents: CalendarEvent[];
  freeBusyData: FreeBusyResponse | null;

  // === Push Notifications ===
  pushChannelId: string | null;
  pushExpiration: number | null;

  // === UI State ===
  viewMode: 'smart' | 'traditional' | 'focused';
  sidebarCollapsed: boolean;
  readingPanePosition: 'right' | 'bottom' | 'hidden';
}
```

### 3.3 File Structure

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
│           ├── SparklesGatekeeper.tsx          # NEW: Sender screening
│           ├── SparklesSmartInbox.tsx          # NEW: Categorized view
│           ├── SparklesPrioritySection.tsx     # NEW: Priority emails
│           ├── SparklesSnoozeModal.tsx         # NEW: Snooze picker
│           ├── SparklesSendLater.tsx           # NEW: Schedule send
│           ├── SparklesSearchBar.tsx
│           ├── SparklesCalendarWidget.tsx
│           ├── SparklesAccountSwitcher.tsx
│           ├── SparklesThreadItem.tsx
│           ├── SparklesMessageItem.tsx
│           ├── SparklesAttachments.tsx
│           ├── SparklesAIAssist.tsx            # NEW: AI writing helper
│           └── hooks/
│               ├── useGmail.ts
│               ├── useGmailPush.ts             # NEW: Push notifications
│               ├── useGoogleCalendar.ts
│               ├── useFreeBusy.ts              # NEW: Availability
│               ├── useSmartInbox.ts            # NEW: Categorization
│               └── useSparklesSearch.ts
│
├── stores/
│   └── sparklesStore.ts
│
├── services/
│   └── a2a/
│       ├── SparklesEmailService.ts
│       ├── SparklesCalendarService.ts
│       └── SparklesCategorizationService.ts   # NEW: ML categorization
│
└── types/
    └── sparkles.ts
```

---

## 4. Implementation Phases

### Phase 1: Foundation & Authentication
**Files to create/modify:**
- `src/stores/sparklesStore.ts`
- `src/types/sparkles.ts`
- `src/hooks/useMultiAccountGoogleAuth.ts`
- `src/stores/desktopStore.ts` (add `'sparkles'` to PanelId)
- `src/layouts/LiquidOSLayout.tsx` (register Sparkles panel)

**Tasks:**
1. Define comprehensive TypeScript types
2. Create Zustand store with persist middleware
3. Implement multi-account OAuth flow (extend existing auth)
4. Secure token storage with account association
5. Register Sparkles in desktop panel system
6. Add dock icon (Mail icon from lucide-react)

### Phase 2: Gmail API Integration
**Files to create:**
- `src/components/features/sparkles/hooks/useGmail.ts`
- `src/components/features/sparkles/hooks/useGmailPush.ts`
- `server/src/services/gmail/GmailService.ts`
- `server/src/routes/gmail.ts`

**Tasks:**
1. Create Gmail API wrapper service on backend
2. Implement all CRUD endpoints (see API section)
3. **Batch operations** for bulk actions (up to 50 per batch)
4. Implement token refresh with exponential backoff
5. **Push notification setup** via Cloud Pub/Sub
6. Handle rate limiting (250 quota units/user/sec)

### Phase 3: Smart Inbox & Categorization
**Files to create:**
- `src/components/features/sparkles/SparklesSmartInbox.tsx`
- `src/components/features/sparkles/hooks/useSmartInbox.ts`
- `src/services/a2a/SparklesCategorizationService.ts`

**Tasks:**
1. Implement email categorization logic:
   - **Primary**: Emails from contacts, direct replies
   - **Newsletters**: Detected by unsubscribe headers, sender patterns
   - **Notifications**: App notifications, transactional emails
2. Build Smart Inbox UI with collapsible sections
3. Priority sender highlighting
4. Category learning from user actions

### Phase 4: Gatekeeper
**Files to create:**
- `src/components/features/sparkles/SparklesGatekeeper.tsx`

**Tasks:**
1. Build Gatekeeper review queue UI
2. Implement accept/block sender logic
3. Store blocked senders in local + sync
4. Three screening modes:
   - Screen before inbox (quarantine)
   - Screen inside inbox (inline prompts)
   - Disabled (accept all)
5. Bulk accept/block actions

### Phase 5: Core UI Components
**Files to create:**
- `src/components/features/sparkles/SparklesApp.tsx`
- `src/components/features/sparkles/SparklesSidebar.tsx`
- `src/components/features/sparkles/SparklesMailList.tsx`
- `src/components/features/sparkles/SparklesThreadItem.tsx`
- `src/components/features/sparkles/SparklesPrioritySection.tsx`

**Tasks:**
1. Create main app container with responsive 3-column layout
2. Build sidebar with all navigation elements
3. Build mail list with:
   - Virtual scrolling (performance)
   - Priority section at top
   - Thread items with quick actions
   - Hover actions (archive, snooze, star)
4. Swipe gestures for mobile

### Phase 6: Email Detail & Thread View
**Files to create:**
- `src/components/features/sparkles/SparklesMailView.tsx`
- `src/components/features/sparkles/SparklesMessageItem.tsx`
- `src/components/features/sparkles/SparklesAttachments.tsx`

**Tasks:**
1. Build thread header with actions
2. Build collapsible message list
3. **Sanitize HTML** with DOMPurify
4. Attachment preview and download
5. Quick reply with expand option

### Phase 7: Compose, Snooze & Send Later
**Files to create:**
- `src/components/features/sparkles/SparklesComposeModal.tsx`
- `src/components/features/sparkles/SparklesRichEditor.tsx`
- `src/components/features/sparkles/SparklesSnoozeModal.tsx`
- `src/components/features/sparkles/SparklesSendLater.tsx`

**Tasks:**
1. Build compose modal with rich editor
2. Implement draft auto-save
3. **Snooze feature**: Pick return time, store locally, resurface
4. **Send Later**: Schedule queue, backend cron job
5. Reply/Reply All/Forward modes
6. Signature per account

### Phase 8: Search & Filters
**Files to create:**
- `src/components/features/sparkles/SparklesSearchBar.tsx`
- `src/components/features/sparkles/hooks/useSparklesSearch.ts`

**Tasks:**
1. Build search bar with filter chips
2. Support Gmail query syntax:
   - `from:`, `to:`, `subject:`
   - `has:attachment`, `is:unread`, `is:starred`
   - `after:`, `before:`, `newer_than:`
   - `label:`, `in:`
3. Recent searches with suggestions
4. Advanced search modal

### Phase 9: Google Calendar Integration
**Files to create:**
- `src/components/features/sparkles/SparklesCalendarWidget.tsx`
- `src/components/features/sparkles/hooks/useGoogleCalendar.ts`
- `src/components/features/sparkles/hooks/useFreeBusy.ts`
- `server/src/services/calendar/CalendarService.ts`
- `server/src/routes/calendar.ts`

**Tasks:**
1. Create Calendar API wrapper
2. Build mini calendar widget
3. **Free/Busy API** integration for availability
4. Upcoming events display (24h)
5. Quick event creation from email
6. Push notifications for calendar changes

### Phase 10: AI Features
**Files to create:**
- `src/services/a2a/SparklesEmailService.ts`
- `src/components/features/sparkles/SparklesChatInput.tsx`
- `src/components/features/sparkles/SparklesAIAssist.tsx`

**Tasks:**
1. Email summarization (thread/message)
2. Smart compose suggestions
3. **AI Writing Assistant** in compose
4. Translation support
5. Priority scoring
6. Unsubscribe detection
7. Chat interface for commands

### Phase 11: Polish & Optimization
**Tasks:**
1. Keyboard shortcuts (j/k, e, r, c, /, ?)
2. Performance:
   - Lazy loading
   - Thread content caching
   - Prefetching
   - **Batch API calls**
3. Responsive design (mobile/tablet/desktop)
4. Accessibility (ARIA, focus management)
5. Error handling & empty states
6. Offline support (IndexedDB)

---

## 5. Data Models

### 5.1 TypeScript Types

```typescript
// src/types/sparkles.ts

export interface GmailAccount {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  isActive: boolean;
  signature?: string;
  quotaUsed?: number;
}

export interface EmailThread {
  id: string;
  accountId: string;
  historyId: string;
  snippet: string;
  subject: string;
  participants: Participant[];
  messages: EmailMessage[];
  labels: string[];
  isUnread: boolean;
  isStarred: boolean;
  isPriority: boolean;           // NEW
  category: EmailCategory;       // NEW
  lastMessageAt: Date;
  messageCount: number;
  snoozedUntil?: Date;          // NEW
}

export type EmailCategory = 'primary' | 'newsletters' | 'notifications' | 'uncategorized';

export interface EmailMessage {
  id: string;
  threadId: string;
  from: Participant;
  to: Participant[];
  cc?: Participant[];
  bcc?: Participant[];
  subject: string;
  bodyHtml: string;
  bodyText: string;
  attachments: Attachment[];
  internalDate: Date;
  isExpanded: boolean;
  hasUnsubscribe?: boolean;     // NEW: Detected unsubscribe link
}

export interface Participant {
  email: string;
  name?: string;
  avatar?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  thumbnailUrl?: string;
  downloadUrl?: string;
}

export interface Label {
  id: string;
  name: string;
  type: 'system' | 'user';
  color?: string;
  unreadCount: number;
  totalCount: number;
}

// === Gatekeeper Types ===
export interface PendingSender {
  email: string;
  name?: string;
  firstSeenAt: Date;
  messageCount: number;
  previewSubjects: string[];
}

export type GatekeeperMode = 'before_inbox' | 'inside_inbox' | 'disabled';

// === Snooze Types ===
export interface SnoozedThread {
  threadId: string;
  accountId: string;
  snoozedAt: Date;
  wakeAt: Date;
}

// === Scheduled Send Types ===
export interface ScheduledEmail {
  id: string;
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments: File[];
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed';
}

// === Calendar Types ===
export interface GoogleCalendar {
  id: string;
  accountId: string;
  name: string;
  color: string;
  isPrimary: boolean;
  accessRole: 'owner' | 'writer' | 'reader';
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
  attendees?: EventAttendee[];
  conferenceLink?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
}

export interface EventAttendee {
  email: string;
  name?: string;
  responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
}

// === Free/Busy Types ===
export interface FreeBusyRequest {
  timeMin: Date;
  timeMax: Date;
  calendarIds: string[];
}

export interface FreeBusyResponse {
  calendars: Record<string, {
    busy: Array<{ start: Date; end: Date }>;
    errors?: Array<{ domain: string; reason: string }>;
  }>;
}

// === Push Notification Types ===
export interface PushChannel {
  id: string;
  resourceId: string;
  resourceUri: string;
  expiration: number;
  token?: string;
}

export type FolderType =
  | 'INBOX'
  | 'SENT'
  | 'DRAFT'
  | 'TRASH'
  | 'SPAM'
  | 'STARRED'
  | 'IMPORTANT'
  | 'ALL';

export interface EmailFilters {
  hasAttachment?: boolean;
  isUnread?: boolean;
  isStarred?: boolean;
  isPriority?: boolean;
  from?: string;
  to?: string;
  subject?: string;
  after?: Date;
  before?: Date;
  labelId?: string;
  category?: EmailCategory;
}

export interface ComposeState {
  mode: 'new' | 'reply' | 'replyAll' | 'forward';
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  attachments: File[];
  fromAccountId: string;
  replyToMessageId?: string;
  draftId?: string;
  isDirty: boolean;
  scheduledFor?: Date;           // NEW: Send later
}
```

---

## 6. API Endpoints

### 6.1 Gmail Routes (`/api/v1/gmail`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/threads` | List threads (with pagination, filters) |
| GET | `/threads/:id` | Get thread with all messages |
| GET | `/messages/:id` | Get single message |
| GET | `/messages/:id/attachment/:attachmentId` | Download attachment |
| POST | `/send` | Send email immediately |
| POST | `/send/schedule` | **NEW**: Schedule email for later |
| POST | `/draft` | Create/update draft |
| DELETE | `/draft/:id` | Delete draft |
| PATCH | `/threads/:id` | Modify thread (labels, read, archive) |
| POST | `/threads/batch` | **NEW**: Batch modify multiple threads |
| DELETE | `/threads/:id` | Move to trash |
| POST | `/threads/:id/untrash` | Restore from trash |
| POST | `/threads/:id/snooze` | **NEW**: Snooze thread |
| DELETE | `/threads/:id/snooze` | **NEW**: Unsnooze thread |
| GET | `/labels` | List labels |
| POST | `/labels` | Create label |
| PATCH | `/labels/:id` | Update label |
| DELETE | `/labels/:id` | Delete label |
| GET | `/profile` | Get user profile info |
| POST | `/push/watch` | **NEW**: Set up push notifications |
| DELETE | `/push/stop` | **NEW**: Stop push notifications |

### 6.2 Calendar Routes (`/api/v1/calendar`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calendars` | List all calendars |
| GET | `/events` | List events (date range, calendar filter) |
| GET | `/events/:id` | Get event details |
| POST | `/events` | Create event |
| PATCH | `/events/:id` | Update event |
| DELETE | `/events/:id` | Delete event |
| POST | `/events/:id/rsvp` | Respond to invitation |
| POST | `/freebusy` | **NEW**: Query free/busy times |
| POST | `/push/watch` | **NEW**: Set up calendar push |

---

## 7. UI/UX Specifications

### 7.1 Layout (Inspired by Spark Mail)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ GlassWindow Title Bar                                    [−] [□] [×]    │
├───────────┬─────────────────────────────┬───────────────────────────────┤
│           │ [Search: has:attachment...] │                               │
│ [Account] │─────────────────────────────│                               │
│ [▼ mario] │ [Smart Inbox ▼] [Refresh]   │   ✉ Re: Project Proposal      │
│           │                             │   From: John Smith            │
│ [Compose] │ ── PRIORITY (3) ──────────  │   To: me, Sarah               │
│           │ ★ John Smith    Project...  │   Jan 21, 2026 at 10:30 AM    │
│ ▼ Smart   │   Sarah Lee     Meeting...  │─────────────────────────────  │
│   Primary │   Boss          Q1 Review   │                               │
│   News    │                             │   Hi Mario,                   │
│   Notifs  │ ── PRIMARY ───────────────  │                               │
│   Gate(5) │   Mike Chen     Code rev... │   Thanks for sending over     │
│           │   Amy Wong      Design...   │   the proposal. I've reviewed │
│ ▼ Folders │   Team          Standup     │   it with the team and we     │
│   Inbox   │                             │   have a few questions...     │
│   Sent    │ ── NEWSLETTERS ───────────  │                               │
│   Drafts  │   TechCrunch    Daily...    │   [image.png]  [doc.pdf]      │
│   Trash   │   Product Hunt  New...      │                               │
│           │                             │─────────────────────────────  │
│ ▼ Labels  │ ── NOTIFICATIONS ─────────  │ [Reply] [Reply All] [Forward] │
│   🔴 Work │   GitHub        PR merged   │                               │
│   🟢 Personal   Slack         3 new...  │ ┌─────────────────────────┐   │
│   🔵 Travel│                            │ │ Quick reply...          │   │
│           │                             │ │ [AI Assist] [Expand]    │   │
│ ┌───────┐ │                             │ └─────────────────────────┘   │
│ │Jan 26 │ │                             │                               │
│ │ ○○●○○ │ │                             │                               │
│ └───────┘ │                             │                               │
│ Today:    │                             │                               │
│ 2pm Meet  │                             │                               │
└───────────┴─────────────────────────────┴───────────────────────────────┘
```

### 7.2 Smart Inbox Categories (Spark-Inspired)

| Category | Visual Treatment | Source |
|----------|-----------------|--------|
| **Priority** | Yellow highlight, top section, larger preview | User-defined priority senders |
| **Primary** | Normal weight, person icon | Emails from contacts, direct replies |
| **Newsletters** | Muted color, newspaper icon | List-Unsubscribe header, sender patterns |
| **Notifications** | Smallest, bell icon | Transactional, app notifications |
| **Gatekeeper** | Orange badge, shield icon | Unknown senders awaiting review |

### 7.3 Thread Item States

| State | Visual |
|-------|--------|
| Unread | Bold text, blue left border |
| Priority | Yellow star filled, highlighted row |
| Snoozed | Clock icon, muted with "Snoozed until..." |
| Has Attachment | Paperclip icon |
| Starred | Yellow star |
| From Priority Sender | Avatar has gold ring |

### 7.4 Glass Materials

| Component | Material | Blur |
|-----------|----------|------|
| Sidebar | `nav-glass` | 32px |
| Mail List | `surface` | 16px |
| Mail View | `regular` | 16px |
| Compose Modal | `prominent` | 24px |
| Thread Item (hover) | `thin` | 8px |
| Snooze/Schedule Popup | `thick` | 32px |

### 7.5 Quick Actions (On Hover)

```
┌─────────────────────────────────────────────────┐
│ ★ John Smith          Re: Project Proposal      │ [Archive] [Snooze] [Delete]
│   Thanks for sending over the proposal...  10:30│
└─────────────────────────────────────────────────┘
```

---

## 8. Integration Points

### 8.1 Desktop Store Integration

```typescript
// Update src/stores/desktopStore.ts
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
  | 'sparkles'  // ADD
  | null;
```

### 8.2 Auth Scopes

```typescript
const SPARKLES_SCOPES = [
  // Gmail
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',

  // Calendar
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy',  // NEW: For availability

  // Profile
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];
```

---

## 9. Security Considerations

1. **Token Storage**: Encrypted IndexedDB with per-account isolation
2. **HTML Sanitization**: DOMPurify for all email HTML
3. **CSP**: Strict CSP for email rendering iframe
4. **Rate Limiting**: Client-side throttling (250 units/sec max)
5. **Push Webhook**: HTTPS only, verify X-Goog-Resource-ID
6. **Batch Limits**: Max 50 operations per batch request

---

## 10. API Rate Limits Summary

| Resource | Limit | Notes |
|----------|-------|-------|
| Quota units/user/sec | 250 | Different ops = different units |
| Batch operations | 50 (100 max) | Recommended 50 for stability |
| Sending (Workspace) | 2,000/day | 10,000 recipients/day |
| Sending (Free Gmail) | 500/day | 500 recipients/day |
| Push channel expiry | ~7 days | Must renew manually |

---

## 11. Milestones

| Phase | Deliverable | Key Features |
|-------|-------------|--------------|
| 1 | Foundation | Types, Store, Multi-account Auth |
| 2 | Gmail API | Backend service, Batch ops, Push setup |
| 3 | Smart Inbox | Categorization, Priority senders |
| 4 | Gatekeeper | Sender screening, Accept/Block |
| 5 | Core UI | 3-column layout, Virtual lists |
| 6 | Detail View | Thread view, Sanitized HTML |
| 7 | Compose | Rich editor, Snooze, Send Later |
| 8 | Search | Gmail query syntax, Filters |
| 9 | Calendar | Widget, Free/Busy, Events |
| 10 | AI Features | Summarize, Compose assist, Translate |
| 11 | Polish | Shortcuts, Offline, A11y |

---

## 12. Open Questions Resolved

| Question | Decision |
|----------|----------|
| Rich Text Editor | TipTap (extensible, good React support) |
| Offline Support | IndexedDB for thread cache, queue for sends |
| Push Notifications | Yes, via Cloud Pub/Sub |
| Account Limit | Start with 2, extensible to more |
| Calendar View | Mini widget default, modal for full view |

---

## 13. References

### Gmail API
- [Gmail API Overview](https://developers.google.com/workspace/gmail/api/guides)
- [Push Notifications](https://developers.google.com/workspace/gmail/api/guides/push)
- [Batching Requests](https://developers.google.com/workspace/gmail/api/guides/batch)
- [Usage Limits](https://developers.google.com/workspace/gmail/api/reference/quota)

### Calendar API
- [Calendar Push Notifications](https://developers.google.com/workspace/calendar/api/guides/push)
- [Free/Busy Query](https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query)
- [Events Watch](https://developers.google.com/workspace/calendar/api/v3/reference/events/watch)

### UX Inspiration
- [Spark Mail Features](https://sparkmailapp.com/features)
- [Spark Smart Inbox](https://sparkmailapp.com/features/smart_inbox)
- [Zapier: 8 Spark Email Features](https://zapier.com/blog/spark-email/)

---

*Document Version: 2.0*
*Last Updated: 2026-01-21*
