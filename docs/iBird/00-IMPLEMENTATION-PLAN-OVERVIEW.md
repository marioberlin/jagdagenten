# iBird - Complete Implementation Plan

> A LiquidGlass unified communication and scheduling app combining Email, Calendar, and Appointment Booking

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Implementation Phases](#5-implementation-phases)

---

## 1. Overview

### 1.1 What is iBird?

iBird is a comprehensive communication hub that combines:
- **Mail**: Full-featured email client with multi-account support, threading, composition, and smart filtering
- **Calendar**: Event management with multiple views, CalDAV sync, recurring events, and reminders
- **Appointments**: Public booking pages with availability management and calendar integration

### 1.2 Design Philosophy

- **LiquidGlass Aesthetic**: Glassmorphism with backdrop blur, subtle animations, and depth
- **Three-Panel Layout**: Consistent with Sparkles pattern (sidebar, list, detail)
- **Module Tabs**: Switch between Mail, Calendar, and Appointments
- **Unified Experience**: Shared contacts, calendars, and settings across modules

### 1.3 Feature Scope (Complete List)

#### Mail Module (47 Features)
| # | Feature | Priority |
|---|---------|----------|
| 1 | Multi-account support (IMAP/SMTP) | P0 |
| 2 | OAuth2 authentication (Google, Microsoft, Yahoo) | P0 |
| 3 | Folder tree with nested hierarchy | P0 |
| 4 | Unified inbox view | P0 |
| 5 | Smart folders (Unread, Starred, Important) | P1 |
| 6 | Folder unread count badges | P0 |
| 7 | Folder context menu (rename, delete, move) | P1 |
| 8 | Drag-drop messages to folders | P1 |
| 9 | Message list with table view | P0 |
| 10 | Message list with cards view | P1 |
| 11 | Thread/conversation grouping | P0 |
| 12 | Thread expand/collapse | P0 |
| 13 | Column sorting (date, from, subject, size) | P0 |
| 14 | Column customization | P2 |
| 15 | Date grouping (Today, Yesterday, Week, Month) | P1 |
| 16 | Multi-select with checkboxes | P0 |
| 17 | Shift-click range selection | P1 |
| 18 | Keyboard navigation (arrows, enter, delete) | P1 |
| 19 | Quick filter bar | P0 |
| 20 | Filter by unread | P0 |
| 21 | Filter by starred/flagged | P0 |
| 22 | Filter by has attachments | P0 |
| 23 | Filter by sender in contacts | P1 |
| 24 | Filter by tags/labels | P1 |
| 25 | Text search in current folder | P0 |
| 26 | Global search across all folders | P1 |
| 27 | Advanced search builder | P2 |
| 28 | Save search as virtual folder | P2 |
| 29 | Message reading pane | P0 |
| 30 | Expandable message headers | P0 |
| 31 | Sender avatar display | P1 |
| 32 | Attachment list with preview | P0 |
| 33 | Attachment download (single/all) | P0 |
| 34 | Inline image display | P1 |
| 35 | HTML/Plain text toggle | P1 |
| 36 | Remote content blocking | P0 |
| 37 | Message zoom controls | P2 |
| 38 | Reply action | P0 |
| 39 | Reply All action | P0 |
| 40 | Forward action | P0 |
| 41 | Archive action | P0 |
| 42 | Delete action | P0 |
| 43 | Mark as spam action | P0 |
| 44 | Star/flag toggle | P0 |
| 45 | Mark read/unread | P0 |
| 46 | Move to folder | P0 |
| 47 | Print message | P2 |

#### Compose Features (23 Features)
| # | Feature | Priority |
|---|---------|----------|
| 48 | Compose modal window | P0 |
| 49 | Multiple draft tabs | P1 |
| 50 | Recipient chip input (To) | P0 |
| 51 | Cc field (expandable) | P0 |
| 52 | Bcc field (expandable) | P0 |
| 53 | Recipient autocomplete from contacts | P0 |
| 54 | Subject line | P0 |
| 55 | Rich text editor (bold, italic, underline) | P0 |
| 56 | Text formatting (lists, alignment) | P1 |
| 57 | Insert links | P0 |
| 58 | Insert images | P1 |
| 59 | Plain text mode toggle | P1 |
| 60 | Attachment upload (browse) | P0 |
| 61 | Attachment drag-drop | P0 |
| 62 | Attachment list with remove | P0 |
| 63 | Signature auto-insert | P1 |
| 64 | Identity/From selection | P0 |
| 65 | Draft auto-save | P0 |
| 66 | Send now | P0 |
| 67 | Schedule send (send later) | P2 |
| 68 | Discard draft | P0 |
| 69 | Reply/Forward quote handling | P0 |
| 70 | Spell check | P2 |

#### Calendar Module (38 Features)
| # | Feature | Priority |
|---|---------|----------|
| 71 | Mini month calendar sidebar | P0 |
| 72 | Multiple calendar list | P0 |
| 73 | Calendar visibility toggles | P0 |
| 74 | Calendar color coding | P0 |
| 75 | Add/remove calendars | P0 |
| 76 | CalDAV calendar sync | P1 |
| 77 | Google Calendar sync | P1 |
| 78 | Day view | P0 |
| 79 | Week view | P0 |
| 80 | Month view | P0 |
| 81 | Agenda/list view | P1 |
| 82 | View switcher tabs | P0 |
| 83 | Today indicator | P0 |
| 84 | Current time indicator line | P0 |
| 85 | Date navigation (prev/next) | P0 |
| 86 | Go to today button | P0 |
| 87 | Time grid with hourly slots | P0 |
| 88 | All-day event bar | P0 |
| 89 | Event block display | P0 |
| 90 | Event color by calendar | P0 |
| 91 | Click to create event | P0 |
| 92 | Drag to create event | P1 |
| 93 | Drag event to reschedule | P0 |
| 94 | Resize event to change duration | P1 |
| 95 | Event detail modal | P0 |
| 96 | Event title field | P0 |
| 97 | Event location field | P0 |
| 98 | Event date/time pickers | P0 |
| 99 | All-day event toggle | P0 |
| 100 | Recurring event support | P1 |
| 101 | Recurrence rule builder | P1 |
| 102 | Event description (rich text) | P0 |
| 103 | Event calendar selector | P0 |
| 104 | Event reminders | P0 |
| 105 | Multiple reminders per event | P1 |
| 106 | Reminder notification dialog | P0 |
| 107 | Snooze reminder | P0 |
| 108 | Dismiss reminder | P0 |

#### Task Features (12 Features)
| # | Feature | Priority |
|---|---------|----------|
| 109 | Task list panel | P1 |
| 110 | Task creation | P1 |
| 111 | Task title | P1 |
| 112 | Task due date | P1 |
| 113 | Task priority | P1 |
| 114 | Task completion checkbox | P1 |
| 115 | Task completion percentage | P2 |
| 116 | Task calendar assignment | P1 |
| 117 | Task recurrence | P2 |
| 118 | Task reminders | P1 |
| 119 | Filter completed tasks | P1 |
| 120 | Quick add task | P1 |

#### Appointment Module (32 Features)
| # | Feature | Priority |
|---|---------|----------|
| 121 | Appointments dashboard | P0 |
| 122 | Quick actions sidebar | P0 |
| 123 | Pending bookings badge | P0 |
| 124 | Week calendar with slots | P0 |
| 125 | Copy booking URL button | P0 |
| 126 | Availability settings page | P0 |
| 127 | Bookable toggle switch | P0 |
| 128 | Calendar selection for availability | P0 |
| 129 | Timezone selector | P0 |
| 130 | Available days picker (weekday bubbles) | P0 |
| 131 | Default time window (start/end) | P0 |
| 132 | Per-day custom times | P1 |
| 133 | Minimum notice setting | P1 |
| 134 | Booking window setting | P1 |
| 135 | Auto-confirm toggle | P1 |
| 136 | Slot duration setting | P0 |
| 137 | Buffer time between appointments | P1 |
| 138 | Public booking page | P0 |
| 139 | Public page appointment details | P0 |
| 140 | Public page slot selector | P0 |
| 141 | Public page timezone display | P0 |
| 142 | Attendee form (name, email, notes) | P0 |
| 143 | Booking confirmation flow | P0 |
| 144 | Booking success page | P0 |
| 145 | Booking error handling | P0 |
| 146 | Bookings management list | P0 |
| 147 | Bookings filter (all/unconfirmed) | P0 |
| 148 | Bookings sort (date requested/meeting date) | P0 |
| 149 | Booking detail sliding panel | P0 |
| 150 | Confirm booking action | P0 |
| 151 | Decline booking action | P0 |
| 152 | Cancel booking action | P0 |

#### Settings & Account Features (18 Features)
| # | Feature | Priority |
|---|---------|----------|
| 153 | Settings modal/page | P0 |
| 154 | Account settings tab | P0 |
| 155 | Add mail account | P0 |
| 156 | Remove mail account | P0 |
| 157 | Account sync settings | P1 |
| 158 | Identity management | P1 |
| 159 | Signature editor | P1 |
| 160 | Preferences tab | P0 |
| 161 | Theme selection (dark/light/system) | P0 |
| 162 | Timezone preference | P0 |
| 163 | Date format preference | P1 |
| 164 | Time format (12h/24h) | P0 |
| 165 | Week start day (Sun/Mon) | P0 |
| 166 | Language selection | P2 |
| 167 | Notification preferences | P1 |
| 168 | Connected apps management | P1 |
| 169 | Calendar connections | P1 |
| 170 | Video meeting connections (Zoom) | P2 |

**Total: 170 Features**

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         iBird Frontend                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    iBirdApp.tsx                              │    │
│  │  ┌─────────┐  ┌─────────────────────────────────────────┐   │    │
│  │  │ Header  │  │              Module Tabs                 │   │    │
│  │  │ Search  │  │  [Mail]  [Calendar]  [Appointments]      │   │    │
│  │  └─────────┘  └─────────────────────────────────────────┘   │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │              Active Module Content                   │    │    │
│  │  │  ┌─────────┬────────────────┬──────────────────┐    │    │    │
│  │  │  │ Sidebar │   List View    │   Detail View    │    │    │    │
│  │  │  │         │                │                  │    │    │    │
│  │  │  │ Folders │   Messages/    │   Message/       │    │    │    │
│  │  │  │ Cals    │   Events/      │   Event/         │    │    │    │
│  │  │  │ Quick   │   Bookings     │   Booking        │    │    │    │
│  │  │  │ Actions │                │                  │    │    │    │
│  │  │  └─────────┴────────────────┴──────────────────┘    │    │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                      Zustand Store                                   │
│                     (iBirdStore.ts)                                  │
└─────────────────────────────────────────────────────────────────────┘
                               │
                          REST API
                               │
┌─────────────────────────────────────────────────────────────────────┐
│                         iBird Backend                                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Elysia Server                             │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐                │    │
│  │  │ /api/mail │  │/api/calendar│ │/api/appts │                │    │
│  │  └───────────┘  └───────────┘  └───────────┘                │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      Services                                │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │    │
│  │  │MailService   │  │CalendarService│ │AppointmentSvc│       │    │
│  │  │ (IMAP/SMTP)  │  │  (CalDAV)     │ │              │       │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    PostgreSQL                                │    │
│  │  accounts, folders, messages, calendars, events, bookings   │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Module Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MAIL MODULE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  MailSidebar │    │   MailList   │    │  MailReader  │       │
│  │              │    │              │    │              │       │
│  │ - Accounts   │    │ - Threads    │    │ - Headers    │       │
│  │ - Folders    │    │ - Messages   │    │ - Body       │       │
│  │ - Labels     │    │ - Filters    │    │ - Actions    │       │
│  │ - Compose    │    │ - Sort       │    │ - Attachments│       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                   ComposeModal                        │       │
│  │  Recipients | Subject | Editor | Attachments | Send   │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      CALENDAR MODULE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────────────────────────┐       │
│  │CalendarSidebar│   │         Calendar View             │       │
│  │              │    │                                   │       │
│  │ - MiniMonth  │    │  ┌─────┬─────┬─────┬─────┐       │       │
│  │ - Calendars  │    │  │ Day │Week │Month│Agenda│       │       │
│  │ - Tasks      │    │  └─────┴─────┴─────┴─────┘       │       │
│  │              │    │                                   │       │
│  │              │    │  ┌───────────────────────────┐   │       │
│  │              │    │  │      Time Grid / Grid     │   │       │
│  │              │    │  │      (events rendered)    │   │       │
│  │              │    │  └───────────────────────────┘   │       │
│  └──────────────┘    └──────────────────────────────────┘       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                   EventModal                          │       │
│  │  Title | DateTime | Location | Recurrence | Reminders │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    APPOINTMENTS MODULE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────────────────────────┐       │
│  │ QuickActions │    │        Main Content               │       │
│  │              │    │                                   │       │
│  │ - Copy URL   │    │  Dashboard: WeekCalendar          │       │
│  │ - Avail.     │    │  Availability: Settings Form      │       │
│  │ - Bookings   │    │  Bookings: BookingsList           │       │
│  │ - Pending    │    │                                   │       │
│  └──────────────┘    └──────────────────────────────────┘       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              BookingDetailPanel (sliding)             │       │
│  │  Details | Status | Actions (Confirm/Decline/Cancel)  │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI Framework |
| TypeScript | 5.7.x | Type Safety |
| Vite | 6.x | Build Tool |
| Tailwind CSS | 4.x | Styling |
| Framer Motion | 11.x | Animations |
| Zustand | Latest | State Management |
| React Router | 7.x | Routing |
| TipTap | Latest | Rich Text Editor |
| date-fns | Latest | Date Utilities |
| Lucide React | Latest | Icons |

### 3.2 Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Bun | Latest | Runtime |
| Elysia | 1.x | HTTP Framework |
| PostgreSQL | 17.x | Database |
| Redis | 7.x | Caching |
| node-imap | Latest | IMAP Protocol |
| nodemailer | Latest | SMTP Protocol |
| tsdav | Latest | CalDAV Protocol |
| ical.js | Latest | iCalendar Parsing |
| zod | Latest | Validation |

### 3.3 External APIs

| Service | Purpose |
|---------|---------|
| Google OAuth | Authentication |
| Microsoft OAuth | Authentication |
| Google Calendar API | Calendar Sync |
| Zoom API | Video Meeting Links |

---

## 4. Project Structure

### 4.1 Frontend Structure

```
src/
├── components/
│   └── features/
│       └── ibird/
│           ├── iBirdApp.tsx                    # Main app container
│           ├── iBirdHeader.tsx                 # Top navigation
│           ├── iBirdModuleTabs.tsx             # Mail/Calendar/Appointments tabs
│           │
│           ├── mail/
│           │   ├── MailModule.tsx              # Mail module container
│           │   ├── MailSidebar.tsx             # Folder sidebar
│           │   ├── MailList.tsx                # Message list
│           │   ├── MailReader.tsx              # Reading pane
│           │   ├── MailCompose.tsx             # Compose modal
│           │   ├── MailSearch.tsx              # Search interface
│           │   ├── MailQuickFilters.tsx        # Filter bar
│           │   └── components/
│           │       ├── FolderTree.tsx          # Folder hierarchy
│           │       ├── FolderItem.tsx          # Single folder
│           │       ├── MessageRow.tsx          # Table row
│           │       ├── MessageCard.tsx         # Card view
│           │       ├── ThreadItem.tsx          # Thread display
│           │       ├── MessageHeaders.tsx      # Header display
│           │       ├── AttachmentList.tsx      # Attachments
│           │       ├── AttachmentItem.tsx      # Single attachment
│           │       ├── RecipientInput.tsx      # Email chip input
│           │       ├── RecipientChip.tsx       # Single chip
│           │       └── RichTextEditor.tsx      # TipTap editor
│           │
│           ├── calendar/
│           │   ├── CalendarModule.tsx          # Calendar module container
│           │   ├── CalendarSidebar.tsx         # Sidebar with mini month
│           │   ├── CalendarViews.tsx           # View container
│           │   ├── CalendarDay.tsx             # Day view
│           │   ├── CalendarWeek.tsx            # Week view
│           │   ├── CalendarMonth.tsx           # Month view
│           │   ├── CalendarAgenda.tsx          # Agenda view
│           │   ├── EventModal.tsx              # Event editor
│           │   ├── TasksPanel.tsx              # Tasks sidebar
│           │   ├── AlarmDialog.tsx             # Reminder popup
│           │   └── components/
│           │       ├── MiniMonth.tsx           # Mini calendar
│           │       ├── CalendarList.tsx        # Calendar checkboxes
│           │       ├── CalendarItem.tsx        # Single calendar
│           │       ├── TimeGrid.tsx            # Hour grid
│           │       ├── DayColumn.tsx           # Single day column
│           │       ├── EventBlock.tsx          # Event rectangle
│           │       ├── AllDayBar.tsx           # All-day events
│           │       ├── MonthDay.tsx            # Month grid cell
│           │       ├── AgendaItem.tsx          # Agenda row
│           │       ├── RecurrenceEditor.tsx    # Recurrence UI
│           │       ├── ReminderEditor.tsx      # Reminder UI
│           │       ├── TaskItem.tsx            # Single task
│           │       └── TaskQuickAdd.tsx        # Quick add input
│           │
│           ├── appointments/
│           │   ├── AppointmentsModule.tsx      # Appointments container
│           │   ├── AppointmentsDashboard.tsx   # Dashboard view
│           │   ├── AvailabilitySettings.tsx    # Availability editor
│           │   ├── BookingsView.tsx            # Bookings list
│           │   ├── BookingDetailPanel.tsx      # Booking detail
│           │   ├── PublicBookingPage.tsx       # Public booking UI
│           │   └── components/
│           │       ├── QuickActions.tsx        # Action buttons
│           │       ├── WeekCalendar.tsx        # Week grid
│           │       ├── SlotSelector.tsx        # Time slot picker
│           │       ├── BookingForm.tsx         # Attendee form
│           │       ├── BookingItem.tsx         # Booking row
│           │       ├── StatusBadge.tsx         # Status indicator
│           │       ├── WeekdayBubbles.tsx      # Day selector
│           │       └── TimeWindowPicker.tsx    # Start/end times
│           │
│           ├── settings/
│           │   ├── SettingsModal.tsx           # Settings container
│           │   ├── AccountSettings.tsx         # Account tab
│           │   ├── PreferencesSettings.tsx     # Preferences tab
│           │   ├── ConnectedApps.tsx           # Connections tab
│           │   └── components/
│           │       ├── AccountForm.tsx         # Add account form
│           │       ├── IdentityEditor.tsx      # Identity form
│           │       ├── SignatureEditor.tsx     # Signature form
│           │       └── CalendarConnect.tsx     # CalDAV form
│           │
│           └── shared/
│               ├── GlassPanel.tsx              # Glass container
│               ├── GlassButton.tsx             # Glass button
│               ├── GlassInput.tsx              # Glass input
│               ├── GlassSelect.tsx             # Glass dropdown
│               ├── GlassModal.tsx              # Glass modal
│               ├── GlassSlidingPanel.tsx       # Sliding panel
│               ├── DatePicker.tsx              # Date picker
│               ├── TimePicker.tsx              # Time picker
│               ├── DateTimePicker.tsx          # Combined picker
│               ├── ColorPicker.tsx             # Color selector
│               ├── EmptyState.tsx              # Empty placeholder
│               ├── LoadingState.tsx            # Loading skeleton
│               └── NoticeBar.tsx               # Notification bar
│
├── stores/
│   └── iBirdStore.ts                           # Zustand store
│
├── hooks/
│   ├── useiBird.ts                             # Main hook
│   ├── useiBirdMail.ts                         # Mail hook
│   ├── useiBirdCalendar.ts                     # Calendar hook
│   ├── useiBirdAppointments.ts                 # Appointments hook
│   ├── useiBirdMenuBar.ts                      # Menu bar hook
│   └── useiBirdShortcuts.ts                    # Keyboard shortcuts
│
├── types/
│   └── ibird.ts                                # TypeScript types
│
└── services/
    └── ibird/
        ├── MailService.ts                      # Mail API client
        ├── CalendarService.ts                  # Calendar API client
        └── AppointmentService.ts               # Appointments API client
```

### 4.2 Backend Structure

```
server/
├── src/
│   ├── routes/
│   │   └── ibird/
│   │       ├── index.ts                        # Route aggregator
│   │       ├── mail.ts                         # Mail endpoints
│   │       ├── calendar.ts                     # Calendar endpoints
│   │       ├── appointments.ts                 # Appointment endpoints
│   │       └── public.ts                       # Public booking endpoints
│   │
│   ├── services/
│   │   └── ibird/
│   │       ├── MailService.ts                  # IMAP/SMTP service
│   │       ├── ImapClient.ts                   # IMAP connection
│   │       ├── SmtpClient.ts                   # SMTP connection
│   │       ├── CalendarService.ts              # Calendar service
│   │       ├── CalDavClient.ts                 # CalDAV client
│   │       ├── GoogleCalendarClient.ts         # Google Calendar
│   │       ├── AppointmentService.ts           # Appointment service
│   │       └── NotificationService.ts          # Email notifications
│   │
│   ├── schemas/
│   │   └── ibird/
│   │       ├── mail.ts                         # Mail schemas
│   │       ├── calendar.ts                     # Calendar schemas
│   │       └── appointments.ts                 # Appointment schemas
│   │
│   └── agents/
│       └── ibird.ts                            # iBird A2A agent
│
└── sql/
    └── 007_ibird_system.sql                    # Database migrations
```

---

## 5. Implementation Phases

### Phase Overview

| Phase | Name | Duration | Features |
|-------|------|----------|----------|
| 1 | Foundation | 2 sprints | Database, Auth, Basic UI Shell |
| 2 | Mail Core | 3 sprints | IMAP/SMTP, Message List, Reader |
| 3 | Mail Advanced | 2 sprints | Compose, Search, Filters |
| 4 | Calendar Core | 2 sprints | Views, Events, Basic CRUD |
| 5 | Calendar Advanced | 2 sprints | Recurrence, Reminders, CalDAV |
| 6 | Appointments | 2 sprints | Full appointment system |
| 7 | Integration | 1 sprint | Cross-module features |
| 8 | Polish | 1 sprint | Performance, UX refinement |

**Total: 15 sprints (~30 weeks)**

### Detailed Phase Breakdown

See subsequent documents:
- `01-DATABASE-SCHEMA.md` - Complete database schema
- `02-BACKEND-API.md` - All API endpoints
- `03-BACKEND-SERVICES.md` - Service implementations
- `04-FRONTEND-MAIL.md` - Mail module components
- `05-FRONTEND-CALENDAR.md` - Calendar module components
- `06-FRONTEND-APPOINTMENTS.md` - Appointments module components
- `07-STATE-MANAGEMENT.md` - Store and hooks
- `08-IMPLEMENTATION-PHASES.md` - Detailed phase plans

---

*Document: 00-IMPLEMENTATION-PLAN-OVERVIEW.md*
*Version: 1.0*
*Created: January 2026*
