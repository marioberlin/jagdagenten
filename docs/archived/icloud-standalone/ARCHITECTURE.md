# Architecture Overview

## System Design

The iCloud AI Agent is a full-stack application with three main layers:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ iCloudAgent │  │  Components  │  │    Services       │  │
│  │   Provider  │  │  (UI Layer)  │  │  (API Adapters)   │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Express)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │   Session   │  │   iCloud     │  │       AI          │  │
│  │  Middleware │  │   Routes     │  │     Routes        │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────────┐
        │  Apple   │   │ Anthropic│   │  Encrypted   │
        │  iCloud  │   │  Claude  │   │  Sessions    │
        │  APIs    │   │   API    │   │  (.sessions) │
        └──────────┘   └──────────┘   └──────────────┘
```

## Data Flow

### Authentication Flow

```
User → Frontend → Backend → Apple iCloud
  │                            │
  │  1. Enter credentials      │
  │  ─────────────────────────>│
  │                            │
  │  2. 2FA required           │
  │  <─────────────────────────│
  │                            │
  │  3. Enter 2FA code         │
  │  ─────────────────────────>│
  │                            │
  │  4. Session created        │
  │  <─────────────────────────│
  │       (encrypted cookie)   │
```

### AI Agent Flow

```
User → Frontend → Backend → Claude AI → Backend → iCloud → Response
  │                   │                      │
  │  "Show my emails" │                      │
  │  ────────────────>│  Tool call needed    │
  │                   │  ─────────────────>  │
  │                   │                      │
  │                   │  Execute tool        │
  │                   │  <─────────────────  │
  │                   │                      │
  │                   │  Fetch from iCloud   │
  │                   │  ────────────────────>
  │                   │                      │
  │  Formatted result │  Return data         │
  │  <────────────────│  <────────────────────
```

## Component Architecture

### Frontend Components

```
src/pages/iCloudAgent/
├── index.tsx                 # Main page component
├── iCloudAgentProvider.tsx   # Global state context
│
├── components/
│   ├── Agent/               # AI interaction UI
│   │   ├── AgentInterface.tsx
│   │   ├── ConversationThread.tsx
│   │   ├── ToolExecutionCard.tsx
│   │   └── ConfirmationDialog.tsx
│   │
│   ├── Auth/                # Authentication
│   │   ├── BiometricSetup.tsx
│   │   └── BiometricUnlock.tsx
│   │
│   ├── AuthFlow/            # Login flow
│   │   ├── LoginForm.tsx
│   │   └── TwoFactorInput.tsx
│   │
│   ├── Common/              # Shared components
│   │   ├── ErrorBoundary.tsx
│   │   ├── NetworkStatusBanner.tsx
│   │   └── DownloadProgress.tsx
│   │
│   ├── Navigation/          # Navigation
│   │   └── ServiceSidebar.tsx
│   │
│   └── Panels/              # Service panels
│       ├── UnifiedDashboard.tsx
│       ├── MailPanel.tsx
│       ├── CalendarPanel.tsx
│       ├── ContactsPanel.tsx
│       ├── DrivePanel.tsx
│       ├── NotesPanel.tsx
│       ├── RemindersPanel.tsx
│       ├── PhotosPanel.tsx
│       └── FindMyPanel.tsx
│
├── services/                # API layer
│   ├── index.ts            # Service exports
│   ├── iCloudService.ts    # iCloud API adapter
│   ├── aiService.ts        # Claude AI adapter
│   ├── biometricService.ts # WebAuthn service
│   └── downloadService.ts  # File download manager
│
├── types/                   # TypeScript definitions
│   └── index.ts
│
└── utils/                   # Utilities
    ├── index.ts
    └── serviceWorker.ts
```

### Backend Structure

```
server/
├── index.ts                 # Express app setup
│
├── middleware/
│   └── session.ts          # Session management
│       ├── SessionManager  # In-memory session store
│       ├── encrypt()       # AES-256-CBC encryption
│       └── decrypt()       # Session decryption
│
└── routes/
    ├── icloud.ts           # iCloud proxy routes
    │   ├── POST /login     # Authenticate
    │   ├── POST /2fa       # Submit 2FA code
    │   ├── GET /session    # Check session
    │   ├── POST /logout    # End session
    │   ├── GET /mail       # Fetch emails
    │   ├── GET /calendar   # Fetch events
    │   ├── GET /contacts   # Fetch contacts
    │   ├── GET /drive      # Fetch files
    │   ├── GET /notes      # Fetch notes
    │   ├── GET /reminders  # Fetch reminders
    │   ├── GET /photos     # Fetch photos
    │   └── GET /findmy     # Fetch devices
    │
    └── ai.ts               # Claude AI routes
        └── POST /chat      # Send message to Claude
```

## State Management

### Frontend State (Context)

```typescript
interface ICloudState {
  // Authentication
  authState: 'unauthenticated' | 'needs_2fa' | 'authenticated';
  sessionInfo: SessionInfo | null;

  // UI State
  activeService: ServiceType;
  sidebarCollapsed: boolean;

  // Data Cache
  mail: MailMessage[];
  calendar: CalendarEvent[];
  contacts: Contact[];
  // ... other service data

  // AI State
  messages: ConversationMessage[];
  isAgentThinking: boolean;
}
```

### Backend State

- **Sessions**: Encrypted files in `.sessions/` directory
- **iCloud Clients**: In-memory map of active ICloud instances
- **No Database**: Stateless design, all persistence via sessions

## Security Architecture

### Session Security

1. **Session ID**: Cryptographically random UUID
2. **Cookie**: HttpOnly, Secure, SameSite=Strict
3. **Encryption**: AES-256-CBC with random IV
4. **Storage**: Encrypted files, not plain JSON

### API Security

1. **CORS**: Restricted to frontend origin
2. **Input Validation**: All inputs sanitized
3. **No Credential Storage**: Passwords never persisted
4. **Session Timeout**: Configurable expiration

## Scalability Considerations

### Current Limitations

- Single-server deployment
- In-memory session index
- No horizontal scaling

### Future Improvements

- Redis for session storage
- Load balancer support
- WebSocket for real-time updates
- Background job queue for long operations
