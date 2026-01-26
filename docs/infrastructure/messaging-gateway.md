# Unified Messaging Gateway

The Messaging Gateway provides a unified interface for multi-platform messaging across Telegram, Slack, Discord, WhatsApp, iMessage, Email, and more.

## Overview

The gateway normalizes messages from different platforms into a consistent format, manages sessions, and routes messages to the appropriate AI agents.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Messaging Gateway                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Telegram │ │  Slack   │ │ Discord  │ │ WhatsApp │  ...      │
│  │ Adapter  │ │ Adapter  │ │ Adapter  │ │ Adapter  │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │            │            │            │                  │
│       └────────────┴──────┬─────┴────────────┘                  │
│                           ▼                                      │
│                 ┌─────────────────┐                             │
│                 │ Message Router  │                             │
│                 └────────┬────────┘                             │
│                          ▼                                       │
│                 ┌─────────────────┐                             │
│                 │ Session Manager │                             │
│                 └────────┬────────┘                             │
│                          ▼                                       │
│                 ┌─────────────────┐                             │
│                 │ Identity Linker │                             │
│                 └─────────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

## Supported Channels

| Channel | Adapter | Features |
|---------|---------|----------|
| Telegram | grammY | Buttons, threads, reactions, typing |
| Slack | Bolt | Buttons, threads, reactions, typing |
| Discord | discord.js | Buttons, threads, reactions, typing |
| WhatsApp | Baileys | Media, reactions, read receipts |
| iMessage | AppleScript | macOS only, polling-based |
| Email | IMAP/SMTP | Attachments, HTML, threading |
| Webhook | Generic HTTP | Custom integrations |

## Key Concepts

### Normalized Messages

All incoming messages are converted to a common format:

```typescript
interface NormalizedMessage {
  id: string;
  channelType: 'telegram' | 'slack' | 'discord' | ...;
  channelId: string;
  threadId?: string;
  from: { id: string; username?: string; displayName?: string };
  text: string;
  media: Array<{ type: string; url: string }>;
  timestamp: Date;
  isGroup: boolean;
  isMention: boolean;
}
```

### Session Scopes

| Scope | Description |
|-------|-------------|
| `global` | Single session across all channels |
| `per-sender` | One session per user across channels |
| `per-channel-peer` | Separate session per channel+user |

### Identity Linking

Users can link accounts across platforms for unified sessions:

```typescript
// Link Discord to existing Telegram identity
await identityService.linkPlatform(identityId, {
  platform: 'discord',
  platformUserId: 'discord-user-123',
});
```

## Configuration

```typescript
const gateway = new MessagingGateway({
  channels: {
    telegram: { enabled: true, botToken: process.env.TELEGRAM_TOKEN },
    slack: { enabled: true, botToken: process.env.SLACK_TOKEN },
  },
  session: {
    scope: 'per-sender',
    reset: { mode: 'daily', atHour: 4 },
  },
  messages: {
    groupChat: {
      mentionPatterns: ['@liquid', '@bot'],
      defaultActivation: 'mention',
    },
  },
});
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/gateway/channels` | List configured channels |
| POST | `/api/v1/gateway/channels` | Add/update channel config |
| GET | `/api/v1/gateway/sessions` | List active sessions |
| POST | `/api/v1/gateway/send` | Send a message |

## Key Files

| File | Purpose |
|------|---------|
| `server/src/messaging-gateway/gateway.ts` | Main orchestrator |
| `server/src/messaging-gateway/types.ts` | Type definitions |
| `server/src/messaging-gateway/adapters/` | Platform adapters |
| `server/src/messaging-gateway/identity-linking.ts` | Cross-platform identity |
| `server/src/routes/gateway.ts` | REST API routes |
| `server/sql/011_identity_linking.sql` | Database migration |
