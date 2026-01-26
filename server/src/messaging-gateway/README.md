# Messaging Gateway

Unified multi-channel messaging gateway that bridges external messaging platforms (Telegram, Slack, Discord, Google Chat) into the LiquidOS agent ecosystem.

## Quick Start

### 1. Install Dependencies

```bash
bun add grammy @slack/bolt discord.js googleapis ioredis
```

### 2. Configure Environment

```bash
# .env
REDIS_URL=redis://localhost:6379

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token

# Slack
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-signing-secret
# Or for Socket Mode:
SLACK_APP_TOKEN=xapp-your-token

# Discord
DISCORD_BOT_TOKEN=your-bot-token

# Google Chat
GOOGLE_CHAT_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

### 3. Enable Gateway Plugin

```typescript
// server/src/index-elysia.ts
import { createMessagingGatewayPlugin } from './messaging-gateway';

const app = new Elysia()
  // ... other plugins
  .use(createMessagingGatewayPlugin({
    config: {
      channels: {
        telegram: {
          type: 'telegram',
          enabled: true,
          credentials: {
            botToken: process.env.TELEGRAM_BOT_TOKEN!,
          },
        },
        slack: {
          type: 'slack',
          enabled: true,
          credentials: {
            botToken: process.env.SLACK_BOT_TOKEN!,
            signingSecret: process.env.SLACK_SIGNING_SECRET!,
          },
        },
        discord: {
          type: 'discord',
          enabled: true,
          credentials: {
            botToken: process.env.DISCORD_BOT_TOKEN!,
          },
        },
      },
    },
  }));
```

### 4. Connect Agent Handler

```typescript
import { getGateway } from './messaging-gateway';

const gateway = getGateway();

gateway.onAgent(async (context) => {
  const { message, session, replyTo, sendTyping } = context;
  
  // Show typing indicator
  await sendTyping();
  
  // Process with your agent
  const response = await yourAgent.process(message.text);
  
  // Return normalized response
  return {
    text: response.text,
    buttons: response.actions?.map(a => ({
      text: a.label,
      callback: a.id,
    })),
  };
});
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Messaging Gateway                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐   │
│  │Telegram │  │  Slack  │  │ Discord │  │ Google Chat │   │
│  │ Adapter │  │ Adapter │  │ Adapter │  │   Adapter   │   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └──────┬──────┘   │
│       │            │            │              │           │
│       └────────────┴─────┬──────┴──────────────┘           │
│                          │                                  │
│                   ┌──────▼──────┐                          │
│                   │   Gateway   │                          │
│                   │   Service   │                          │
│                   └──────┬──────┘                          │
│                          │                                  │
│  ┌───────────────────────┼───────────────────────────────┐ │
│  │                       │                                │ │
│  │  ┌─────────────┐ ┌────▼────┐ ┌──────────────────┐    │ │
│  │  │  Session    │ │ Router  │ │ Identity Linking │    │ │
│  │  │   Store     │ │         │ │                  │    │ │
│  │  └─────────────┘ └─────────┘ └──────────────────┘    │ │
│  │         (Redis)                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                          │                                  │
│                   ┌──────▼──────┐                          │
│                   │ Agent Handler│                         │
│                   └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/gateway/status` | GET | Gateway status and active adapters |
| `/api/v1/gateway/sessions` | GET | List active sessions |
| `/api/v1/gateway/send` | POST | Send message to channel |
| `/api/v1/gateway/agent.json` | GET | A2A agent card |
| `/api/v1/gateway/tasks/send` | POST | A2A task execution |
| `/webhook/telegram/:token` | POST | Telegram webhook |
| `/webhook/slack` | POST | Slack events |
| `/webhook/discord` | POST | Discord interactions |
| `/webhook/google-chat` | POST | Google Chat events |

## Configuration Reference

```typescript
interface GatewayConfig {
  name: string;              // Gateway name
  version: string;           // Version string
  
  channels: {                // Per-channel configuration
    telegram?: ChannelConfig;
    slack?: ChannelConfig;
    discord?: ChannelConfig;
    webchat?: ChannelConfig; // Google Chat
  };
  
  session: {
    scope: 'global' | 'per-sender' | 'per-channel-peer';
    dmScope: 'main' | 'per-peer' | 'per-channel-peer';
    identityLinks: Record<string, string[]>; // Cross-channel identity
    reset: {
      mode: 'daily' | 'idle' | 'manual';
      atHour?: number;      // For daily reset (0-23)
      idleMinutes?: number; // For idle reset
    };
    resetTriggers: string[]; // Commands that reset session
  };
  
  messages: {
    groupChat: {
      mentionPatterns: string[];
      defaultActivation: 'mention' | 'always' | 'never';
    };
  };
  
  agentRouting: {
    defaultAgent: string;
    rules?: AgentRoutingRule[];
  };
}
```

## Identity Linking

Map users across platforms for unified context:

```typescript
const config: GatewayConfig = {
  session: {
    identityLinks: {
      'alice': [
        'telegram:123456789',
        'discord:987654321',
        'slack:U01ABC123',
      ],
    },
  },
};
```

Alice's session will be shared across all linked channels.

## Session Reset Policies

```typescript
// Daily reset at 4 AM
reset: { mode: 'daily', atHour: 4 }

// Reset after 2 hours idle
reset: { mode: 'idle', idleMinutes: 120 }

// Manual reset via commands
resetTriggers: ['/new', '/reset']
```

## Using Redis Session Store

```typescript
import { createMessagingGatewayPlugin } from './messaging-gateway';
import { createRedisSessionStore } from './messaging-gateway/redis-session-store';

const sessionStore = createRedisSessionStore({
  url: process.env.REDIS_URL,
  prefix: 'gateway:session:',
});

await sessionStore.connect();

const app = new Elysia()
  .use(createMessagingGatewayPlugin({
    sessionStore,
    config: { /* ... */ },
  }));
```

## Files

| File | Description |
|------|-------------|
| `types.ts` | Core types (NormalizedMessage, GatewaySession, etc.) |
| `config.ts` | Configuration schema and defaults |
| `gateway.ts` | Main orchestrator service |
| `elysia-plugin.ts` | Elysia HTTP integration |
| `redis-session-store.ts` | Redis session persistence |
| `adapters/base.adapter.ts` | Abstract adapter base class |
| `adapters/telegram.adapter.ts` | Telegram (grammY) |
| `adapters/slack.adapter.ts` | Slack (Bolt) |
| `adapters/discord.adapter.ts` | Discord (discord.js) |
| `adapters/google-chat.adapter.ts` | Google Chat (googleapis) |
