# iCloud AI Agent

A conversational AI interface for interacting with Apple iCloud services using natural language. Built with React, Express, and the Claude AI API.

## Features

- **Natural Language Interface**: Chat with an AI agent to manage your iCloud data
- **iCloud Services Support**:
  - Mail - Read, compose, and manage emails
  - Calendar - View and create events
  - Contacts - Browse and search contacts
  - Drive - Navigate and manage files
  - Notes - View and create notes
  - Reminders - Manage tasks and reminders
  - Photos - Browse your photo library
  - Find My - Locate devices and people
- **Secure Authentication**: 2FA support with session persistence
- **Biometric Unlock**: Optional Face ID/Touch ID for quick access
- **Glass UI Design**: Modern translucent interface

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key (for Claude AI)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# - Add your ANTHROPIC_API_KEY
```

### Development

```bash
# Start both frontend and backend
npm run dev:all

# Or start separately:
npm run dev        # Frontend (port 5180)
npm run dev:server # Backend (port 3010)
```

### Production Build

```bash
npm run build
npm run server
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
SERVER_PORT=3010
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5180

# Anthropic API Key (required for AI features)
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Enable debug logging
ICLOUD_DEBUG=true
```

## Project Structure

```
├── server/                    # Express backend
│   ├── index.ts              # Server entry point
│   ├── middleware/           # Express middleware
│   │   └── session.ts        # Session management
│   └── routes/
│       ├── icloud.ts         # iCloud API proxy
│       └── ai.ts             # Claude AI integration
│
├── src/
│   ├── components/           # UI components (stubs)
│   ├── lib/icloud-api/       # iCloud API client
│   ├── pages/iCloudAgent/    # Main application
│   │   ├── components/       # Page components
│   │   ├── services/         # API services
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Utilities
│   └── utils/
│       └── cn.ts             # Tailwind class utility
│
├── public/
│   └── sw.js                 # Service worker
│
└── docs/                     # Documentation
    ├── ARCHITECTURE.md       # System design
    ├── API.md               # API endpoints
    └── COMPONENTS.md        # Component interfaces
```

## UI Components

This package includes **stub implementations** of Glass UI components. These are minimal working components that you can replace with your own implementations.

See [docs/COMPONENTS.md](docs/COMPONENTS.md) for component interfaces and replacement instructions.

**Included stubs:**
- `GlassContainer` - Glass-morphism container
- `GlassButton` - Styled button with variants
- `GlassInput` - Text input with label support
- `GlassCheckbox` - Checkbox with label
- `GlassCalendar` - Date picker
- `GlassAgent` - AI agent visualization orb
- `GlassPrompt` - Chat input with send button

## Security Notes

- **Never commit `.env` files** - Contains sensitive API keys
- **Session encryption** - Sessions are encrypted with AES-256-CBC
- **No credentials stored** - iCloud credentials are only held in memory during active sessions
- **CORS restricted** - Backend only accepts requests from configured frontend URL

## API Documentation

See [docs/API.md](docs/API.md) for detailed API endpoint documentation.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design and data flow diagrams.

## License

MIT
