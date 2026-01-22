# iBird Implementation Phases

## Overview

The implementation is divided into 8 phases across 15 sprints. Each phase builds on the previous one, ensuring a stable foundation before adding complexity.

---

## Phase 1: Foundation (Sprints 1-2)

### Sprint 1: Database & Project Setup

**Objectives:**
- Set up database schema
- Configure project structure
- Implement core utilities

**Tasks:**

1. **Database Migration**
   ```bash
   # Create migration file
   server/src/db/migrations/007_ibird_system.sql
   ```
   - Create all tables from 01-DATABASE-SCHEMA.md
   - Add indexes and constraints
   - Set up triggers for updated_at
   - Run migration and verify

2. **Project Structure**
   ```
   client/src/
   ├── components/ibird/
   │   ├── mail/
   │   ├── calendar/
   │   ├── appointments/
   │   └── shared/
   ├── stores/ibird/
   ├── hooks/ibird/
   └── utils/ibird/

   server/src/
   ├── routes/ibird/
   ├── services/ibird/
   └── types/ibird.ts
   ```

3. **TypeScript Types**
   - Define all interfaces from schema
   - Export from `types/ibird.ts`

4. **Shared UI Components**
   - `GlassContainer` wrapper
   - `IconButton`, `Toggle`, `Spinner`
   - `ColorPicker`, `TimezoneSelector`

**Deliverables:**
- [ ] Database schema deployed
- [ ] TypeScript types complete
- [ ] Project directories created
- [ ] Shared components built

---

### Sprint 2: Authentication & User Settings

**Objectives:**
- User settings API and UI
- OAuth setup for Gmail/Outlook

**Tasks:**

1. **User Settings API**
   ```typescript
   // Routes
   GET  /api/ibird/user/settings
   PUT  /api/ibird/user/settings
   ```

2. **OAuth Configuration**
   - Google OAuth client setup
   - Microsoft OAuth client setup
   - Token storage (encrypted)

3. **Settings UI**
   - Settings modal component
   - Theme toggle
   - Timezone selector
   - Notification preferences

**Deliverables:**
- [ ] Settings API functional
- [ ] OAuth apps configured
- [ ] Settings UI complete

---

## Phase 2: Mail Core (Sprints 3-4)

### Sprint 3: Mail Account Management

**Objectives:**
- Add/remove mail accounts
- IMAP connection
- Folder sync

**Tasks:**

1. **Mail Account API**
   ```typescript
   POST   /api/ibird/mail/accounts              // Add account
   GET    /api/ibird/mail/accounts              // List accounts
   DELETE /api/ibird/mail/accounts/:id          // Remove account
   POST   /api/ibird/mail/accounts/:id/test     // Test connection
   ```

2. **IMAP Client Service**
   - Connection management
   - Credential encryption/decryption
   - Connection pooling

3. **Folder Sync**
   - Fetch folder structure
   - Map to standard types (inbox, sent, etc.)
   - Store in database

4. **Mail Sidebar UI**
   - Account list
   - Folder tree
   - Add account modal

**Deliverables:**
- [ ] Account CRUD working
- [ ] IMAP connections functional
- [ ] Folder sync complete
- [ ] Sidebar UI built

---

### Sprint 4: Message Display

**Objectives:**
- Fetch and display messages
- Message detail view
- Threading

**Tasks:**

1. **Message API**
   ```typescript
   GET /api/ibird/mail/folders/:id/messages    // List messages
   GET /api/ibird/mail/messages/:id            // Get single message
   ```

2. **Message Sync**
   - Incremental sync (only new messages)
   - Full sync option
   - Body fetching (lazy load)

3. **Message List UI**
   - Virtual scrolling
   - Message row component
   - Thread grouping
   - Sorting/filtering

4. **Message Detail UI**
   - Header with sender info
   - HTML body rendering
   - Remote image blocking
   - Attachment list

**Deliverables:**
- [ ] Message sync working
- [ ] List view with virtualization
- [ ] Detail view with HTML rendering
- [ ] Threading implemented

---

## Phase 3: Mail Actions (Sprints 5-6)

### Sprint 5: Message Operations

**Objectives:**
- Star, read/unread
- Move, delete
- Labels

**Tasks:**

1. **Message Actions API**
   ```typescript
   POST /api/ibird/mail/messages/:id/star
   POST /api/ibird/mail/messages/:id/read
   POST /api/ibird/mail/messages/move
   POST /api/ibird/mail/messages/delete
   ```

2. **Labels API**
   ```typescript
   GET    /api/ibird/mail/labels
   POST   /api/ibird/mail/labels
   PUT    /api/ibird/mail/labels/:id
   DELETE /api/ibird/mail/labels/:id
   POST   /api/ibird/mail/messages/:id/labels
   ```

3. **Bulk Operations UI**
   - Checkbox selection
   - Bulk action toolbar
   - Confirmation dialogs

4. **Context Menus**
   - Message context menu
   - Folder context menu

**Deliverables:**
- [ ] All message actions working
- [ ] Label system functional
- [ ] Bulk operations UI complete
- [ ] Context menus implemented

---

### Sprint 6: Compose & Send

**Objectives:**
- Compose new messages
- Reply/Forward
- Draft saving

**Tasks:**

1. **Send API**
   ```typescript
   POST /api/ibird/mail/send
   POST /api/ibird/mail/drafts
   PUT  /api/ibird/mail/drafts/:id
   ```

2. **SMTP Service**
   - SMTP connection
   - Send with attachments
   - Identity selection

3. **Compose Modal**
   - Recipient autocomplete
   - Rich text editor
   - Attachment upload
   - Identity selector

4. **Reply/Forward**
   - Quote original message
   - Maintain thread
   - Forward with attachments

**Deliverables:**
- [ ] Send messages working
- [ ] Draft auto-save
- [ ] Reply/Forward functional
- [ ] Attachments working

---

## Phase 4: Mail Advanced (Sprint 7)

### Sprint 7: Search & Filters

**Objectives:**
- Full-text search
- Advanced filters
- Quick filters

**Tasks:**

1. **Search API**
   ```typescript
   GET /api/ibird/mail/search
   ```
   - Full-text search on subject, body
   - Filter by date, sender, attachments
   - Search across accounts

2. **Search UI**
   - Search bar with autocomplete
   - Filter panel
   - Search results view

3. **Quick Filters**
   - Unread
   - Starred
   - Has attachments
   - Date ranges

4. **Saved Searches**
   - Save filter combinations
   - Quick access from sidebar

**Deliverables:**
- [ ] Search API with filters
- [ ] Search UI complete
- [ ] Quick filters working
- [ ] Saved searches implemented

---

## Phase 5: Calendar Core (Sprints 8-9)

### Sprint 8: Calendar Management

**Objectives:**
- Create/manage calendars
- CalDAV sync
- Calendar list UI

**Tasks:**

1. **Calendar API**
   ```typescript
   GET    /api/ibird/calendars
   POST   /api/ibird/calendars
   PUT    /api/ibird/calendars/:id
   DELETE /api/ibird/calendars/:id
   POST   /api/ibird/calendars/:id/sync
   ```

2. **CalDAV Service**
   - CalDAV client
   - Calendar discovery
   - Sync with external providers

3. **Calendar Sidebar**
   - Mini calendar
   - Calendar list with toggles
   - Create calendar button

4. **Calendar Store**
   - Calendar state
   - Visibility toggles
   - Sync status

**Deliverables:**
- [ ] Calendar CRUD working
- [ ] CalDAV sync functional
- [ ] Sidebar UI complete
- [ ] Store implemented

---

### Sprint 9: Events & Views

**Objectives:**
- Event CRUD
- Week/Month views
- Event interactions

**Tasks:**

1. **Events API**
   ```typescript
   GET    /api/ibird/events
   POST   /api/ibird/events
   PUT    /api/ibird/events/:id
   DELETE /api/ibird/events/:id
   ```

2. **Week View**
   - Time grid
   - Event positioning
   - Overlap handling
   - Current time indicator

3. **Month View**
   - Day cells
   - Event dots
   - Click to expand

4. **Event Components**
   - Event card
   - Event popover
   - Drag-to-create

**Deliverables:**
- [ ] Events CRUD complete
- [ ] Week view implemented
- [ ] Month view implemented
- [ ] Event interactions working

---

## Phase 6: Calendar Advanced (Sprint 10)

### Sprint 10: Event Modal & Recurrence

**Objectives:**
- Full event editor
- Recurring events
- Reminders

**Tasks:**

1. **Event Modal**
   - Date/time pickers
   - Location input
   - Video link
   - Description
   - Calendar selector

2. **Recurrence**
   - Recurrence rule editor
   - Instance expansion
   - Exception handling
   - "This occurrence" vs "All occurrences"

3. **Reminders API**
   ```typescript
   GET  /api/ibird/reminders
   POST /api/ibird/events/:id/reminders
   ```

4. **Reminder System**
   - Background job for reminders
   - Browser notifications
   - Email reminders

**Deliverables:**
- [ ] Event modal complete
- [ ] Recurrence fully working
- [ ] Reminders implemented
- [ ] Notifications functional

---

## Phase 7: Appointments (Sprints 11-13)

### Sprint 11: Appointment Types

**Objectives:**
- Create appointment types
- Availability schedules
- Basic settings

**Tasks:**

1. **Appointment Types API**
   ```typescript
   GET    /api/ibird/appointments/types
   POST   /api/ibird/appointments/types
   PUT    /api/ibird/appointments/types/:id
   DELETE /api/ibird/appointments/types/:id
   ```

2. **Availability API**
   ```typescript
   GET    /api/ibird/availability/schedules
   POST   /api/ibird/availability/schedules
   PUT    /api/ibird/availability/schedules/:id
   ```

3. **Type Editor UI**
   - Basic settings tab
   - Duration selector
   - Location options
   - Color picker

4. **Availability Editor**
   - Weekly hours editor
   - Date overrides
   - Timezone selector

**Deliverables:**
- [ ] Appointment types CRUD
- [ ] Availability schedules working
- [ ] Type editor complete
- [ ] Availability editor complete

---

### Sprint 12: Public Booking

**Objectives:**
- Public booking page
- Slot calculation
- Booking form

**Tasks:**

1. **Public API (No Auth)**
   ```typescript
   GET  /api/ibird/public/:username/types
   GET  /api/ibird/public/:username/types/:typeId/slots
   POST /api/ibird/public/:username/book
   ```

2. **Slot Calculation Service**
   - Check availability schedule
   - Account for existing bookings
   - Apply buffer times
   - Respect booking limits

3. **Public Booking Page**
   - Type selector
   - Date picker
   - Time slot grid
   - Booking form

4. **Confirmation**
   - Confirmation page
   - Email to invitee
   - Email to host

**Deliverables:**
- [ ] Public booking page working
- [ ] Slot calculation accurate
- [ ] Booking confirmation sent
- [ ] Calendar event created

---

### Sprint 13: Booking Management

**Objectives:**
- View bookings dashboard
- Confirm/cancel/reschedule
- Booking notifications

**Tasks:**

1. **Bookings API**
   ```typescript
   GET  /api/ibird/bookings
   GET  /api/ibird/bookings/:id
   POST /api/ibird/bookings/:id/confirm
   POST /api/ibird/bookings/:id/cancel
   POST /api/ibird/bookings/:id/reschedule
   ```

2. **Dashboard**
   - Upcoming bookings list
   - Stats overview
   - Quick actions

3. **Booking Detail**
   - Full booking info
   - Action buttons
   - History/activity log

4. **Notifications Service**
   - Confirmation emails
   - Reminder emails
   - Cancellation emails
   - Reschedule emails

**Deliverables:**
- [ ] Bookings dashboard complete
- [ ] All booking actions working
- [ ] Email notifications sending
- [ ] Booking detail view

---

## Phase 8: Polish & Integration (Sprints 14-15)

### Sprint 14: Cross-Module Integration

**Objectives:**
- Unified notifications
- Cross-module navigation
- Data consistency

**Tasks:**

1. **Unified Notifications**
   - Notification center component
   - New mail notifications
   - Event reminders
   - Booking updates

2. **Cross-Module Links**
   - Calendar event → Mail thread
   - Booking → Calendar event
   - Contact → Mail history

3. **Keyboard Shortcuts**
   - Mail: j/k navigation, r reply, a archive
   - Calendar: t today, arrow navigation
   - Global: 1/2/3 module switch

4. **Command Palette**
   - Quick actions
   - Navigation
   - Search across modules

**Deliverables:**
- [ ] Notification center working
- [ ] Cross-module navigation
- [ ] Keyboard shortcuts
- [ ] Command palette

---

### Sprint 15: Performance & Testing

**Objectives:**
- Performance optimization
- Error handling
- Testing

**Tasks:**

1. **Performance**
   - Virtual scrolling everywhere
   - Lazy loading of message bodies
   - Optimistic UI updates
   - Cache invalidation

2. **Error Handling**
   - Offline support
   - Retry logic
   - Error boundaries
   - User-friendly errors

3. **Testing**
   - Unit tests for services
   - Integration tests for API
   - E2E tests for critical flows
   - Load testing for sync

4. **Documentation**
   - API documentation
   - User guide
   - Admin setup guide

**Deliverables:**
- [ ] Performance targets met
- [ ] Error handling complete
- [ ] Test coverage adequate
- [ ] Documentation complete

---

## Feature Checklist

### Mail Features (70 total)

| # | Feature | Sprint | Status |
|---|---------|--------|--------|
| 1 | Multi-account support | 3 | ⬜ |
| 2 | IMAP/SMTP protocols | 3-4 | ⬜ |
| 3 | OAuth (Gmail, Outlook) | 2 | ⬜ |
| 4 | Folder management | 3 | ⬜ |
| 5 | Nested folders | 3 | ⬜ |
| 6 | Message list virtualization | 4 | ⬜ |
| 7 | Thread view | 4 | ⬜ |
| 8 | Conversation grouping | 4 | ⬜ |
| 9 | HTML rendering | 4 | ⬜ |
| 10 | Remote image blocking | 4 | ⬜ |
| 11 | Attachment preview | 4 | ⬜ |
| 12 | Attachment download | 4 | ⬜ |
| 13 | Star/flag messages | 5 | ⬜ |
| 14 | Read/unread status | 5 | ⬜ |
| 15 | Move to folder | 5 | ⬜ |
| 16 | Delete messages | 5 | ⬜ |
| 17 | Bulk operations | 5 | ⬜ |
| 18 | Custom labels | 5 | ⬜ |
| 19 | Label colors | 5 | ⬜ |
| 20 | Compose new message | 6 | ⬜ |
| 21 | Reply | 6 | ⬜ |
| 22 | Reply all | 6 | ⬜ |
| 23 | Forward | 6 | ⬜ |
| 24 | Rich text editor | 6 | ⬜ |
| 25 | Inline images | 6 | ⬜ |
| 26 | Attachment upload | 6 | ⬜ |
| 27 | Draft auto-save | 6 | ⬜ |
| 28 | Multiple identities | 6 | ⬜ |
| 29 | Signature management | 6 | ⬜ |
| 30 | Full-text search | 7 | ⬜ |
| 31 | Advanced filters | 7 | ⬜ |
| 32 | Quick filters | 7 | ⬜ |
| 33 | Saved searches | 7 | ⬜ |
| 34 | Date range filter | 7 | ⬜ |

### Calendar Features (50 total)

| # | Feature | Sprint | Status |
|---|---------|--------|--------|
| 1 | Multiple calendars | 8 | ⬜ |
| 2 | Calendar colors | 8 | ⬜ |
| 3 | Calendar visibility toggle | 8 | ⬜ |
| 4 | CalDAV sync | 8 | ⬜ |
| 5 | Google Calendar sync | 8 | ⬜ |
| 6 | Outlook Calendar sync | 8 | ⬜ |
| 7 | Day view | 9 | ⬜ |
| 8 | Week view | 9 | ⬜ |
| 9 | Month view | 9 | ⬜ |
| 10 | Year view | 9 | ⬜ |
| 11 | Agenda view | 9 | ⬜ |
| 12 | Mini calendar | 8 | ⬜ |
| 13 | Event creation | 9 | ⬜ |
| 14 | Event editing | 9 | ⬜ |
| 15 | Event deletion | 9 | ⬜ |
| 16 | Event popover | 9 | ⬜ |
| 17 | All-day events | 9 | ⬜ |
| 18 | Multi-day events | 9 | ⬜ |
| 19 | Recurring events | 10 | ⬜ |
| 20 | Recurrence exceptions | 10 | ⬜ |
| 21 | Event reminders | 10 | ⬜ |
| 22 | Browser notifications | 10 | ⬜ |
| 23 | Email reminders | 10 | ⬜ |
| 24 | Location field | 10 | ⬜ |
| 25 | Video conferencing link | 10 | ⬜ |
| 26 | Event description | 10 | ⬜ |
| 27 | Drag-to-create | 9 | ⬜ |
| 28 | Drag-to-reschedule | 9 | ⬜ |
| 29 | Resize events | 9 | ⬜ |

### Appointments Features (32 total)

| # | Feature | Sprint | Status |
|---|---------|--------|--------|
| 1 | Appointment types | 11 | ⬜ |
| 2 | Custom durations | 11 | ⬜ |
| 3 | Buffer times | 11 | ⬜ |
| 4 | Location options | 11 | ⬜ |
| 5 | Video provider integration | 11 | ⬜ |
| 6 | Availability schedules | 11 | ⬜ |
| 7 | Weekly hours | 11 | ⬜ |
| 8 | Date overrides | 11 | ⬜ |
| 9 | Timezone handling | 11 | ⬜ |
| 10 | Public booking page | 12 | ⬜ |
| 11 | Type selector | 12 | ⬜ |
| 12 | Date picker | 12 | ⬜ |
| 13 | Available slots display | 12 | ⬜ |
| 14 | Booking form | 12 | ⬜ |
| 15 | Custom fields | 12 | ⬜ |
| 16 | Booking confirmation | 12 | ⬜ |
| 17 | Calendar event creation | 12 | ⬜ |
| 18 | Booking dashboard | 13 | ⬜ |
| 19 | Upcoming bookings | 13 | ⬜ |
| 20 | Booking history | 13 | ⬜ |
| 21 | Confirm booking | 13 | ⬜ |
| 22 | Cancel booking | 13 | ⬜ |
| 23 | Reschedule booking | 13 | ⬜ |
| 24 | Booking notifications | 13 | ⬜ |
| 25 | Reminder emails | 13 | ⬜ |
| 26 | Cancellation emails | 13 | ⬜ |
| 27 | Stats overview | 13 | ⬜ |

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation |
|------|------------|
| IMAP compatibility issues | Test with major providers early; use node-imap's robust parser |
| CalDAV variations | Use caldav-client library; test with Google, Apple, Fastmail |
| Performance with large mailboxes | Virtual scrolling; incremental sync; pagination |
| Email rendering security | Use DOMPurify; sandbox iframes; CSP headers |
| OAuth token refresh | Background refresh; error handling; re-auth flow |

### Schedule Risks

| Risk | Mitigation |
|------|------------|
| IMAP complexity underestimated | Sprint 3 buffer; simplify initial sync |
| Recurrence complexity | Use rrule.js library; test edge cases early |
| Integration complexity | Start integration work in Sprint 10 |

---

## Success Metrics

### Phase 1-2 (Foundation)
- Database migrations run without errors
- OAuth flows work for Google/Microsoft
- Settings persist correctly

### Phase 3-4 (Mail Core)
- Accounts connect via IMAP
- Messages sync within 30 seconds
- Send/receive works reliably

### Phase 5-6 (Calendar)
- Events sync with Google/Outlook
- Recurrence expands correctly
- Reminders fire on time

### Phase 7 (Appointments)
- Public booking flow completes
- Bookings create calendar events
- Notifications send within 1 minute

### Phase 8 (Polish)
- < 100ms for UI interactions
- < 2s for initial mail load
- All keyboard shortcuts work

---

## Dependencies

### External Libraries

| Library | Purpose | Sprint |
|---------|---------|--------|
| `node-imap` | IMAP client | 3 |
| `nodemailer` | SMTP client | 6 |
| `caldav-client` | CalDAV sync | 8 |
| `rrule` | Recurrence rules | 10 |
| `dompurify` | HTML sanitization | 4 |
| `tiptap` | Rich text editor | 6 |
| `@tanstack/virtual` | List virtualization | 4 |
| `date-fns` | Date utilities | All |

### Environment Variables

```bash
# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# Encryption
IBIRD_ENCRYPTION_KEY=

# Notifications
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

---

## Conclusion

This implementation plan provides a comprehensive roadmap for building iBird, covering all 170 features across Mail, Calendar, and Appointments modules. By following the phased approach, we ensure each component is properly tested before building on it, reducing risk and ensuring quality.

**Total estimated sprints:** 15
**Core features:** 152 (Mail 70 + Calendar 50 + Appointments 32)
**Additional features:** 18 (Settings, Integration, Polish)
