# Skill Marketplace

The Skill Marketplace enables users to discover, publish, share, and install AI skills.

## Overview

Skills are reusable AI capabilities that can be shared across agents and apps. The marketplace provides:
- **Discovery**: Search and browse skills by category, tags, popularity
- **Publishing**: Share your skills with version control and changelogs
- **Community**: Star, comment, and rate skills
- **Installation**: One-click install to any agent or app

## Skill Format

```typescript
interface Skill {
  id: string;
  name: string;                    // Unique slug: "data-analyzer"
  displayName: string;             // Human-readable: "Data Analyzer"
  description: string;             // Min 20 characters
  version: string;                 // Semver: "1.2.0"
  category: SkillCategory;         // automation, data, coding, etc.
  tags: string[];
  triggers: string[];              // Natural language triggers
  toolNames: string[];             // Tool function names
  parameters: SkillParameter[];    // Input parameters
  content: string;                 // Skill instructions/prompts
  examples: SkillExample[];        // Usage examples
  author: { id, username, avatar };
  stats: { stars, downloads, usages, rating };
}
```

## Categories

| Category | Description |
|----------|-------------|
| `automation` | Workflow and task automation |
| `data` | Data analysis and transformation |
| `coding` | Code generation and assistance |
| `research` | Information gathering and synthesis |
| `communication` | Messaging and notifications |
| `creative` | Content generation |
| `productivity` | Time and task management |
| `integration` | Third-party service connections |
| `security` | Security and compliance |
| `other` | Everything else |

## API Routes

### Discovery

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/marketplace/skills` | Search skills |
| GET | `/api/v1/marketplace/skills/featured` | Get featured skills |
| GET | `/api/v1/marketplace/skills/category/:cat` | Browse by category |
| GET | `/api/v1/marketplace/skills/:id` | Get skill details |

### Publishing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/marketplace/skills` | Publish new skill |
| POST | `/api/v1/marketplace/skills/:id/versions` | Publish new version |

### Community

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/marketplace/skills/:id/star` | Star a skill |
| DELETE | `/api/v1/marketplace/skills/:id/star` | Unstar a skill |
| GET | `/api/v1/marketplace/skills/:id/comments` | Get comments |
| POST | `/api/v1/marketplace/skills/:id/comments` | Add comment |

### Installation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/marketplace/skills/:id/install` | Install to agent/app |

## Usage Examples

### Search Skills

```bash
GET /api/v1/marketplace/skills?q=trading&category=data&limit=10
```

### Publish a Skill

```bash
POST /api/v1/marketplace/skills
{
  "name": "crypto-sentiment",
  "displayName": "Crypto Sentiment Analyzer",
  "description": "Analyzes social media sentiment for cryptocurrencies",
  "category": "data",
  "tags": ["crypto", "sentiment", "analysis"],
  "content": "You analyze crypto sentiment from social data..."
}
```

### Install to Agent

```bash
POST /api/v1/marketplace/skills/123/install
{
  "ownerType": "agent",
  "ownerId": "my-trading-agent"
}
```

## Key Files

| File | Purpose |
|------|---------|
| `server/src/marketplace/skill-marketplace.ts` | Marketplace service |
| `server/src/routes/marketplace.ts` | REST API routes |
| `server/sql/010_marketplace_system.sql` | Database tables |
