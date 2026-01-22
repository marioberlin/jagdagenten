# iBird - Backend API Routes

> Complete REST API specification for the iBird system

---

## API Overview

**Base URL**: `/api/ibird`

**Authentication**: Bearer token (JWT) required for all endpoints except public booking

**Rate Limits**:
- Authenticated: 100 requests per 15 minutes
- Public booking: 30 requests per 15 minutes

---

## 1. User & Settings API

### `GET /api/ibird/user`
Get current user profile and preferences.

**Response:**
```typescript
{
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  timezone: string;
  locale: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: 0 | 1;
  theme: 'light' | 'dark' | 'system';
  bookingUsername: string | null;
  bookingEnabled: boolean;
  createdAt: string;
}
```

### `PUT /api/ibird/user`
Update user profile and preferences.

**Request:**
```typescript
{
  displayName?: string;
  avatarUrl?: string;
  timezone?: string;
  locale?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  weekStartsOn?: 0 | 1;
  theme?: 'light' | 'dark' | 'system';
  bookingUsername?: string;
  bookingEnabled?: boolean;
}
```

### `POST /api/ibird/user/setup`
Initial user setup (creates ibird_users record).

**Request:**
```typescript
{
  displayName: string;
  timezone: string;
  bookingUsername?: string;
}
```

---

## 2. Mail Accounts API

### `GET /api/ibird/mail/accounts`
List all mail accounts for user.

**Response:**
```typescript
{
  accounts: Array<{
    id: string;
    name: string;
    email: string;
    provider: string | null;
    isDefault: boolean;
    color: string;
    syncEnabled: boolean;
    lastSyncAt: string | null;
    syncError: string | null;
    folderCount: number;
    unreadCount: number;
  }>;
}
```

### `POST /api/ibird/mail/accounts`
Add a new mail account.

**Request (Password Auth):**
```typescript
{
  name: string;
  email: string;
  provider?: string;
  imap: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
  };
  smtp: {
    host: string;
    port: number;
    secure: 'none' | 'ssl' | 'starttls';
    username: string;
    password: string;
  };
}
```

**Request (OAuth):**
```typescript
{
  provider: 'google' | 'microsoft';
  oauthCode: string;
  redirectUri: string;
}
```

### `GET /api/ibird/mail/accounts/:accountId`
Get single account details.

### `PUT /api/ibird/mail/accounts/:accountId`
Update account settings.

**Request:**
```typescript
{
  name?: string;
  color?: string;
  syncEnabled?: boolean;
  isDefault?: boolean;
}
```

### `DELETE /api/ibird/mail/accounts/:accountId`
Remove mail account and all associated data.

### `POST /api/ibird/mail/accounts/:accountId/sync`
Trigger manual sync for account.

**Response:**
```typescript
{
  syncId: string;
  status: 'started' | 'already_syncing';
}
```

### `GET /api/ibird/mail/accounts/:accountId/sync-status`
Get current sync status.

**Response:**
```typescript
{
  status: 'idle' | 'syncing' | 'error';
  progress: number;
  lastSyncAt: string | null;
  error: string | null;
}
```

---

## 3. Mail Identities API

### `GET /api/ibird/mail/accounts/:accountId/identities`
List identities for account.

### `POST /api/ibird/mail/accounts/:accountId/identities`
Add identity.

**Request:**
```typescript
{
  name: string;
  email: string;
  replyTo?: string;
  signatureHtml?: string;
  signatureText?: string;
  isDefault?: boolean;
}
```

### `PUT /api/ibird/mail/accounts/:accountId/identities/:identityId`
Update identity.

### `DELETE /api/ibird/mail/accounts/:accountId/identities/:identityId`
Delete identity.

---

## 4. Mail Folders API

### `GET /api/ibird/mail/folders`
List all folders across all accounts (tree structure).

**Query Params:**
- `accountId` (optional): Filter by account

**Response:**
```typescript
{
  folders: Array<{
    id: string;
    accountId: string;
    name: string;
    path: string;
    parentId: string | null;
    folderType: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive' | 'custom';
    totalCount: number;
    unreadCount: number;
    isSubscribed: boolean;
    isFavorite: boolean;
    children?: Array<...>;
  }>;
}
```

### `POST /api/ibird/mail/folders`
Create new folder.

**Request:**
```typescript
{
  accountId: string;
  name: string;
  parentId?: string;
}
```

### `PUT /api/ibird/mail/folders/:folderId`
Update folder (rename, favorite).

**Request:**
```typescript
{
  name?: string;
  isFavorite?: boolean;
}
```

### `DELETE /api/ibird/mail/folders/:folderId`
Delete folder.

### `POST /api/ibird/mail/folders/:folderId/move`
Move folder to new parent.

**Request:**
```typescript
{
  newParentId: string | null;
}
```

---

## 5. Mail Messages API

### `GET /api/ibird/mail/messages`
List messages with filtering and pagination.

**Query Params:**
- `folderId` (required unless unified): Folder ID
- `unified` (boolean): Show unified inbox
- `accountId` (optional): Filter by account
- `threadView` (boolean): Group by thread
- `page` (number): Page number
- `limit` (number): Items per page (default 50)
- `sort` (string): 'date' | 'from' | 'subject' | 'size'
- `sortDir` (string): 'asc' | 'desc'
- `unreadOnly` (boolean)
- `starredOnly` (boolean)
- `hasAttachments` (boolean)
- `labels` (string[]): Filter by labels
- `search` (string): Search query

**Response:**
```typescript
{
  messages: Array<{
    id: string;
    folderId: string;
    accountId: string;
    threadId: string | null;
    messageId: string;
    subject: string;
    from: { name: string; email: string };
    to: Array<{ name: string; email: string }>;
    snippet: string;
    dateSent: string;
    dateReceived: string;
    hasAttachments: boolean;
    attachmentCount: number;
    isRead: boolean;
    isStarred: boolean;
    isAnswered: boolean;
    isForwarded: boolean;
    isDraft: boolean;
    labels: string[];
    // Thread info (when threadView=true)
    threadCount?: number;
    threadUnreadCount?: number;
    threadMessages?: Array<{...}>;
  }>;
  total: number;
  page: number;
  totalPages: number;
}
```

### `GET /api/ibird/mail/messages/:messageId`
Get full message content.

**Response:**
```typescript
{
  id: string;
  folderId: string;
  accountId: string;
  threadId: string | null;
  messageId: string;
  subject: string;
  from: { name: string; email: string };
  to: Array<{ name: string; email: string }>;
  cc: Array<{ name: string; email: string }>;
  bcc: Array<{ name: string; email: string }>;
  replyTo: { name: string; email: string } | null;
  dateSent: string;
  dateReceived: string;
  bodyText: string;
  bodyHtml: string;
  hasAttachments: boolean;
  attachments: Array<{
    id: string;
    filename: string;
    contentType: string;
    sizeBytes: number;
    isInline: boolean;
    contentId: string | null;
  }>;
  isRead: boolean;
  isStarred: boolean;
  isAnswered: boolean;
  isForwarded: boolean;
  labels: string[];
  rawHeaders: string;
  // Thread messages
  threadMessages?: Array<{...}>;
}
```

### `PUT /api/ibird/mail/messages/:messageId`
Update message flags.

**Request:**
```typescript
{
  isRead?: boolean;
  isStarred?: boolean;
  labels?: string[];
}
```

### `POST /api/ibird/mail/messages/bulk`
Bulk update messages.

**Request:**
```typescript
{
  messageIds: string[];
  action: 'markRead' | 'markUnread' | 'star' | 'unstar' | 'addLabel' | 'removeLabel' | 'move' | 'delete' | 'spam' | 'notSpam';
  label?: string;
  targetFolderId?: string;
}
```

### `DELETE /api/ibird/mail/messages/:messageId`
Delete message (move to trash or permanent).

**Query Params:**
- `permanent` (boolean): Skip trash

### `POST /api/ibird/mail/messages/:messageId/move`
Move message to folder.

**Request:**
```typescript
{
  targetFolderId: string;
}
```

### `GET /api/ibird/mail/messages/:messageId/attachments/:attachmentId`
Download attachment.

**Response:** Binary file with Content-Disposition header

### `GET /api/ibird/mail/messages/:messageId/raw`
Get raw RFC 2822 message.

---

## 6. Mail Search API

### `POST /api/ibird/mail/search`
Advanced search.

**Request:**
```typescript
{
  query?: string;
  from?: string;
  to?: string;
  subject?: string;
  body?: string;
  dateFrom?: string;
  dateTo?: string;
  hasAttachments?: boolean;
  isUnread?: boolean;
  isStarred?: boolean;
  labels?: string[];
  folders?: string[];
  accounts?: string[];
  limit?: number;
  offset?: number;
}
```

**Response:** Same as `GET /messages`

---

## 7. Mail Compose & Send API

### `GET /api/ibird/mail/drafts`
List drafts.

### `POST /api/ibird/mail/drafts`
Create/save draft.

**Request:**
```typescript
{
  accountId: string;
  identityId?: string;
  draftType: 'new' | 'reply' | 'reply_all' | 'forward';
  originalMessageId?: string;
  to: Array<{ name?: string; email: string }>;
  cc?: Array<{ name?: string; email: string }>;
  bcc?: Array<{ name?: string; email: string }>;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
}
```

### `PUT /api/ibird/mail/drafts/:draftId`
Update draft.

### `DELETE /api/ibird/mail/drafts/:draftId`
Delete draft.

### `POST /api/ibird/mail/drafts/:draftId/attachments`
Add attachment to draft.

**Request:** `multipart/form-data` with file

### `DELETE /api/ibird/mail/drafts/:draftId/attachments/:attachmentId`
Remove attachment from draft.

### `POST /api/ibird/mail/send`
Send email.

**Request:**
```typescript
{
  draftId?: string;              // Send existing draft
  // OR inline compose:
  accountId: string;
  identityId?: string;
  to: Array<{ name?: string; email: string }>;
  cc?: Array<{ name?: string; email: string }>;
  bcc?: Array<{ name?: string; email: string }>;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  attachmentIds?: string[];      // Previously uploaded
  replyToMessageId?: string;
  forwardMessageId?: string;
  scheduledAt?: string;          // For scheduled send
}
```

**Response:**
```typescript
{
  success: boolean;
  messageId: string;
  sentAt: string;
}
```

### `POST /api/ibird/mail/upload-attachment`
Upload attachment for composing (before draft creation).

**Request:** `multipart/form-data`

**Response:**
```typescript
{
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}
```

---

## 8. Mail Labels API

### `GET /api/ibird/mail/labels`
List user's custom labels.

### `POST /api/ibird/mail/labels`
Create label.

**Request:**
```typescript
{
  name: string;
  color: string;
}
```

### `PUT /api/ibird/mail/labels/:labelId`
Update label.

### `DELETE /api/ibird/mail/labels/:labelId`
Delete label.

---

## 9. Calendar API

### `GET /api/ibird/calendars`
List all calendars.

**Response:**
```typescript
{
  calendars: Array<{
    id: string;
    name: string;
    description: string | null;
    color: string;
    calendarType: 'local' | 'caldav' | 'google' | 'ical';
    isVisible: boolean;
    isDefault: boolean;
    isReadonly: boolean;
    timezone: string;
    lastSyncAt: string | null;
    syncError: string | null;
  }>;
}
```

### `POST /api/ibird/calendars`
Create calendar.

**Request (Local):**
```typescript
{
  name: string;
  description?: string;
  color: string;
  calendarType: 'local';
  timezone?: string;
}
```

**Request (CalDAV):**
```typescript
{
  name: string;
  calendarType: 'caldav';
  remoteUrl: string;
  remoteUsername: string;
  remotePassword: string;
  color?: string;
}
```

**Request (Google):**
```typescript
{
  calendarType: 'google';
  oauthCode: string;
  redirectUri: string;
}
```

### `PUT /api/ibird/calendars/:calendarId`
Update calendar.

**Request:**
```typescript
{
  name?: string;
  description?: string;
  color?: string;
  isVisible?: boolean;
  isDefault?: boolean;
  timezone?: string;
}
```

### `DELETE /api/ibird/calendars/:calendarId`
Delete calendar.

### `POST /api/ibird/calendars/:calendarId/sync`
Trigger calendar sync.

---

## 10. Calendar Events API

### `GET /api/ibird/calendar/events`
List events.

**Query Params:**
- `calendarIds` (string[]): Filter by calendars
- `start` (ISO date): Range start (required)
- `end` (ISO date): Range end (required)
- `includeRecurring` (boolean): Expand recurring events

**Response:**
```typescript
{
  events: Array<{
    id: string;
    calendarId: string;
    uid: string;
    title: string;
    description: string | null;
    location: string | null;
    startTime: string;
    endTime: string;
    isAllDay: boolean;
    timezone: string | null;
    isRecurring: boolean;
    recurrenceRule: string | null;
    status: 'tentative' | 'confirmed' | 'cancelled';
    transparency: 'opaque' | 'transparent';
    organizer: { name: string; email: string } | null;
    attendees: Array<{
      name: string;
      email: string;
      status: 'needs-action' | 'accepted' | 'declined' | 'tentative';
      role: 'required' | 'optional' | 'chair';
    }>;
    reminders: Array<{
      id: string;
      triggerMinutes: number;
      action: 'display' | 'email' | 'audio';
    }>;
    color: string;  // Inherited from calendar
  }>;
}
```

### `POST /api/ibird/calendar/events`
Create event.

**Request:**
```typescript
{
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  isAllDay?: boolean;
  timezone?: string;
  recurrenceRule?: string;
  status?: 'tentative' | 'confirmed';
  transparency?: 'opaque' | 'transparent';
  attendees?: Array<{ name?: string; email: string; role?: string }>;
  reminders?: Array<{ triggerMinutes: number; action?: string }>;
  sendInvitations?: boolean;
}
```

### `GET /api/ibird/calendar/events/:eventId`
Get single event.

### `PUT /api/ibird/calendar/events/:eventId`
Update event.

**Query Params:**
- `updateType` (string): 'this' | 'thisAndFuture' | 'all' (for recurring)

**Request:** Same as POST

### `DELETE /api/ibird/calendar/events/:eventId`
Delete event.

**Query Params:**
- `deleteType` (string): 'this' | 'thisAndFuture' | 'all'

### `POST /api/ibird/calendar/events/:eventId/respond`
Respond to invitation.

**Request:**
```typescript
{
  response: 'accepted' | 'declined' | 'tentative';
  sendResponse?: boolean;
}
```

---

## 11. Calendar Reminders API

### `GET /api/ibird/calendar/reminders/pending`
Get pending reminders.

**Response:**
```typescript
{
  reminders: Array<{
    id: string;
    eventId: string;
    eventTitle: string;
    eventStart: string;
    eventEnd: string;
    calendarId: string;
    reminderTime: string;
    action: string;
  }>;
}
```

### `POST /api/ibird/calendar/reminders/:reminderId/acknowledge`
Dismiss reminder.

### `POST /api/ibird/calendar/reminders/:reminderId/snooze`
Snooze reminder.

**Request:**
```typescript
{
  snoozeMinutes: number;
}
```

---

## 12. Calendar Tasks API

### `GET /api/ibird/calendar/tasks`
List tasks.

**Query Params:**
- `calendarIds` (string[])
- `status` (string[]): Filter by status
- `dueFrom` (ISO date)
- `dueTo` (ISO date)
- `includeCompleted` (boolean)

**Response:**
```typescript
{
  tasks: Array<{
    id: string;
    calendarId: string;
    uid: string;
    title: string;
    description: string | null;
    location: string | null;
    startDate: string | null;
    dueDate: string | null;
    completedDate: string | null;
    status: 'needs-action' | 'in-progress' | 'completed' | 'cancelled';
    percentComplete: number;
    priority: number;
    isRecurring: boolean;
    recurrenceRule: string | null;
    reminders: Array<{...}>;
  }>;
}
```

### `POST /api/ibird/calendar/tasks`
Create task.

**Request:**
```typescript
{
  calendarId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: number;
  reminders?: Array<{ triggerMinutes: number }>;
}
```

### `PUT /api/ibird/calendar/tasks/:taskId`
Update task.

### `DELETE /api/ibird/calendar/tasks/:taskId`
Delete task.

### `POST /api/ibird/calendar/tasks/:taskId/complete`
Mark task complete.

---

## 13. Appointments API

### `GET /api/ibird/appointments`
List appointment types.

**Response:**
```typescript
{
  appointments: Array<{
    id: string;
    title: string;
    slug: string;
    description: string | null;
    locationType: 'online' | 'in_person' | 'phone';
    locationValue: string | null;
    meetingLinkProvider: string | null;
    durationMinutes: number;
    status: 'draft' | 'active' | 'inactive';
    bufferBeforeMinutes: number;
    bufferAfterMinutes: number;
    bookingUrl: string;
  }>;
}
```

### `POST /api/ibird/appointments`
Create appointment type.

**Request:**
```typescript
{
  title: string;
  slug: string;
  description?: string;
  locationType: 'online' | 'in_person' | 'phone';
  locationValue?: string;
  meetingLinkProvider?: 'zoom' | 'google_meet' | 'custom';
  durationMinutes: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
}
```

### `PUT /api/ibird/appointments/:appointmentId`
Update appointment type.

### `DELETE /api/ibird/appointments/:appointmentId`
Delete appointment type.

### `POST /api/ibird/appointments/:appointmentId/activate`
Activate appointment type.

### `POST /api/ibird/appointments/:appointmentId/deactivate`
Deactivate appointment type.

---

## 14. Availability API

### `GET /api/ibird/availability`
Get availability schedules.

**Response:**
```typescript
{
  schedules: Array<{
    id: string;
    appointmentId: string | null;
    name: string;
    calendarId: string | null;
    timezone: string;
    isActive: boolean;
    minimumNoticeHours: number;
    bookingWindowDays: number;
    autoConfirm: boolean;
    slots: Array<{
      id: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
    exceptions: Array<{
      id: string;
      exceptionDate: string;
      exceptionType: 'unavailable' | 'available';
      startTime: string | null;
      endTime: string | null;
      reason: string | null;
    }>;
  }>;
}
```

### `POST /api/ibird/availability`
Create availability schedule.

**Request:**
```typescript
{
  appointmentId?: string;
  name?: string;
  calendarId?: string;
  timezone: string;
  minimumNoticeHours?: number;
  bookingWindowDays?: number;
  autoConfirm?: boolean;
  slots: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}
```

### `PUT /api/ibird/availability/:scheduleId`
Update availability schedule.

### `DELETE /api/ibird/availability/:scheduleId`
Delete schedule.

### `POST /api/ibird/availability/:scheduleId/exceptions`
Add exception date.

**Request:**
```typescript
{
  exceptionDate: string;
  exceptionType: 'unavailable' | 'available';
  startTime?: string;
  endTime?: string;
  reason?: string;
}
```

### `DELETE /api/ibird/availability/:scheduleId/exceptions/:exceptionId`
Remove exception.

---

## 15. Bookings API

### `GET /api/ibird/bookings`
List bookings.

**Query Params:**
- `appointmentId` (optional)
- `status` (string[]): Filter by status
- `from` (ISO date)
- `to` (ISO date)
- `sort` (string): 'requested' | 'meeting'
- `sortDir` (string): 'asc' | 'desc'
- `page`, `limit`

**Response:**
```typescript
{
  bookings: Array<{
    id: string;
    appointmentId: string;
    appointmentTitle: string;
    attendeeName: string;
    attendeeEmail: string;
    attendeePhone: string | null;
    attendeeNotes: string | null;
    attendeeTimezone: string | null;
    startTime: string;
    endTime: string;
    status: 'pending' | 'confirmed' | 'declined' | 'cancelled';
    meetingLink: string | null;
    createdAt: string;
    confirmedAt: string | null;
    cancelledAt: string | null;
  }>;
  total: number;
  page: number;
  totalPages: number;
}
```

### `GET /api/ibird/bookings/:bookingId`
Get booking details.

### `POST /api/ibird/bookings/:bookingId/confirm`
Confirm booking.

**Request:**
```typescript
{
  sendNotification?: boolean;
  customMessage?: string;
}
```

### `POST /api/ibird/bookings/:bookingId/decline`
Decline booking.

**Request:**
```typescript
{
  reason?: string;
  sendNotification?: boolean;
}
```

### `POST /api/ibird/bookings/:bookingId/cancel`
Cancel booking.

**Request:**
```typescript
{
  reason?: string;
  sendNotification?: boolean;
}
```

### `DELETE /api/ibird/bookings/:bookingId`
Delete booking record.

---

## 16. Public Booking API (No Auth Required)

### `GET /api/ibird/public/booking/:username/:slug`
Get public booking page data.

**Response:**
```typescript
{
  appointment: {
    title: string;
    description: string | null;
    durationMinutes: number;
    locationType: string;
    locationValue: string | null;
  };
  organizer: {
    displayName: string;
    avatarUrl: string | null;
    timezone: string;
  };
}
```

### `GET /api/ibird/public/booking/:username/:slug/slots`
Get available slots.

**Query Params:**
- `start` (ISO date): Week start
- `end` (ISO date): Week end
- `timezone` (string): Attendee timezone

**Response:**
```typescript
{
  slots: Array<{
    startTime: string;
    endTime: string;
    available: boolean;
  }>;
  timezone: string;
}
```

### `POST /api/ibird/public/booking/:username/:slug/book`
Create booking.

**Request:**
```typescript
{
  startTime: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  attendeeNotes?: string;
  attendeeTimezone: string;
}
```

**Response:**
```typescript
{
  booking: {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    confirmationToken: string;
  };
  message: string;
}
```

### `GET /api/ibird/public/booking/confirm/:token`
Confirm booking via email link.

### `POST /api/ibird/public/booking/cancel/:token`
Cancel booking via management link.

**Request:**
```typescript
{
  reason?: string;
}
```

---

## 17. External Connections API

### `GET /api/ibird/connections`
List external service connections.

**Response:**
```typescript
{
  connections: Array<{
    id: string;
    serviceType: 'zoom' | 'google_meet' | 'teams';
    externalAccountEmail: string | null;
    connectedAt: string;
  }>;
}
```

### `POST /api/ibird/connections/zoom`
Connect Zoom account.

**Request:**
```typescript
{
  oauthCode: string;
  redirectUri: string;
}
```

### `DELETE /api/ibird/connections/:connectionId`
Disconnect service.

---

## 18. Contacts API

### `GET /api/ibird/contacts`
List contacts.

**Query Params:**
- `search` (string): Search by name or email
- `limit` (number)

**Response:**
```typescript
{
  contacts: Array<{
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    interactionCount: number;
  }>;
}
```

### `POST /api/ibird/contacts`
Add contact.

### `PUT /api/ibird/contacts/:contactId`
Update contact.

### `DELETE /api/ibird/contacts/:contactId`
Delete contact.

---

## Error Response Format

All errors return:
```typescript
{
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

**Common Error Codes:**
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Permission denied
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request body
- `RATE_LIMITED`: Too many requests
- `SYNC_ERROR`: Mail/calendar sync failed
- `PROVIDER_ERROR`: External provider error

---

## WebSocket Events

### Mail Events
- `mail:sync:started` - Sync started
- `mail:sync:progress` - Sync progress update
- `mail:sync:completed` - Sync finished
- `mail:sync:error` - Sync error
- `mail:new_message` - New message received
- `mail:message_updated` - Message flags changed

### Calendar Events
- `calendar:sync:completed`
- `calendar:event:created`
- `calendar:event:updated`
- `calendar:event:deleted`
- `calendar:reminder:triggered`

### Booking Events
- `booking:created`
- `booking:confirmed`
- `booking:cancelled`

---

*Document: 02-BACKEND-API.md*
*Version: 1.0*
*Total Endpoints: 85+*
