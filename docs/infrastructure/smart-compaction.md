# Smart Compaction Service

> **Version:** 1.0.0
> **Status:** Production Ready
> **Updated:** January 2026

The Smart Compaction Service manages context window overflow by intelligently extracting and preserving valuable memories before compacting conversation history. It uses NLWEB-inspired patterns for parallel pre-processing and LLM-powered importance classification.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Pipeline Stages](#pipeline-stages)
5. [Usage](#usage)
6. [Chat Commands](#chat-commands)
7. [Configuration](#configuration)
8. [API Reference](#api-reference)

---

## Overview

When AI conversations grow long, they can exceed the model's context window. The Smart Compaction Service:

1. **Detects** when token count approaches the threshold
2. **Extracts** valuable memories using LLM-powered importance scoring
3. **Decontextualizes** memories to make them self-contained
4. **Persists** memories to the Daily Memory Log
5. **Summarizes** older conversation turns
6. **Truncates** to fit within the token budget

**Key innovation:** Unlike simple truncation, this service preserves semantic value by identifying and saving important information before it's lost.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Compaction Pipeline                        │
│                                                              │
│  ┌──────────┐    ┌────────────────────┐    ┌─────────────┐ │
│  │ Conver-  │───▶│ ImportanceClassifier│───▶│ High-Score  │ │
│  │ sation   │    │ (Batch LLM Scoring) │    │ Turns       │ │
│  └──────────┘    └────────────────────┘    └──────┬──────┘ │
│                                                    │        │
│                                                    ▼        │
│                  ┌─────────────────────────────────────┐   │
│                  │   MemoryDecontextualizer            │   │
│                  │   (Resolve pronouns/references)     │   │
│                  └───────────────┬─────────────────────┘   │
│                                  │                          │
│                                  ▼                          │
│       ┌──────────────────────────────────────────────────┐ │
│       │        Daily Memory Log (PostgreSQL)             │ │
│       │  Categorized, tagged, with importance scores     │ │
│       └──────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Summarization / Truncation               │   │
│  │  Keep last N turns + summary of older conversation    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Components

### ImportanceClassifier

**File:** `server/src/agents/importance-classifier.ts`

LLM-powered classifier that scores conversation turns for memory importance (0-100).

```typescript
interface ImportanceResult {
    importance_score: number;     // 0-100
    category: MemoryCategory;     // observation|learning|preference|fact|correction|none
    confidence: number;           // 0-1
    should_persist: boolean;      // score >= threshold (default: 60)
    original_content: string;
}
```

**Features:**
- Single and batch classification modes
- Quick heuristic pre-filter (no LLM needed for obvious cases)
- Fallback scoring when LLM fails
- Configurable importance threshold

**Memory Categories:**
| Category | Description | Example |
|----------|-------------|---------|
| `observation` | Something noticed about user or work | "User works on crypto trading app" |
| `learning` | Technique or knowledge gained | "TypeScript strict mode catches type errors early" |
| `preference` | User preferences or working styles | "User prefers modular architecture" |
| `fact` | Concrete facts about projects/systems | "Database is PostgreSQL 15" |
| `correction` | Mistakes to avoid | "Don't use localStorage for AI resources" |

---

### MemoryDecontextualizer

**File:** `server/src/agents/memory-decontextualizer.ts`

Resolves pronouns and references to create self-contained memory statements.

```typescript
// Before: "I really like how you did that"
// After:  "User really likes the modular authentication pattern with JWT refresh tokens"
```

**Features:**
- Pattern detection for decontextualization candidates
- Context window of last 6 conversation turns
- Validation to reject corrupted resolutions
- Passthrough for already self-contained statements

---

### TopicClusterer

**File:** `server/src/agents/topic-clusterer.ts`

Groups conversation turns by topic for smarter, topic-aware summarization.

```typescript
interface TopicCluster {
    topic: string;           // e.g., "Authentication Implementation"
    turnIndices: number[];   // Indices of related turns
    summary?: string;        // Generated summary of this topic
    importance?: number;     // Topic importance (0-1)
}
```

**Features:**
- LLM-powered topic identification (max 5 topics)
- Per-topic summary generation
- Importance scoring for prioritization
- Fallback for conversations too short to cluster

**Usage in Hybrid Strategy:**
When `enableTopicClustering: true` (default), the `compactHybrid()` method:
1. Clusters conversation turns by topic
2. Generates a summary for each topic
3. Combines topic summaries into a single compacted message
4. Preserves more semantic structure than flat summarization

---

### CompactionService

**File:** `server/src/agents/compaction-service.ts`

Orchestrates the full compaction pipeline with stage tracking.

**Key Methods:**
| Method | Description |
|--------|-------------|
| `shouldCompact(tokens)` | Check if compaction needed |
| `compact(conversation, options)` | Execute full compaction pipeline |
| `handleCompactCommand(args, conversation)` | Handle `/compact` chat command |
| `getStage()` | Get current pipeline stage |
| `setStageCallback(fn)` | Set progress callback for UI |

---

## Pipeline Stages

The compaction service tracks progress through 7 stages:

| Stage | UI Message | Description |
|-------|------------|-------------|
| `idle` | - | Not compacting |
| `analyzing` | "Reviewing conversation insights..." | Scoring turn importance |
| `clustering` | "Grouping related topics..." | Topic-aware grouping (hybrid strategy) |
| `extracting` | "Finding key learnings..." | Decontextualizing memories |
| `summarizing` | "Creating memory snapshot..." | Generating summary |
| `persisting` | "Saving to long-term memory..." | Writing to Daily Memory Log |
| `complete` | "Memory refreshed! ✨" | Pipeline finished |

Use the `onStageChange` callback to update UI during compaction:

```typescript
const service = createCompactionService(
    'agent', 
    'crypto-advisor',
    { strategy: 'hybrid' },
    resourceStore,
    memoryLog,
    (stage, message) => {
        console.log(`[${stage}] ${message}`);
        updateUIProgress(message);
    }
);
```

---

## Usage

### Automatic Compaction

When token count exceeds the threshold, compaction triggers automatically:

```typescript
import { createCompactionService } from './agents/compaction-service.js';

const compaction = createCompactionService('agent', 'my-agent-id');

// Check before each message
const { needed, warning, percentUsed } = compaction.shouldCompact(conversation);

if (warning) {
    showWarning(`Context ${Math.round(percentUsed * 100)}% full`);
}

if (needed) {
    const { compactedConversation, result } = await compaction.compact(conversation, {
        flushMemories: true,
        summarizer: async (text) => gemini.summarize(text)
    });
    
    // Replace conversation with compacted version
    conversation = compactedConversation;
    
    console.log(`Compacted: ${result.removedTurns} turns, ${result.memoriesFlushed} memories saved`);
}
```

### Manual Compaction

Use the `/compact` chat command for user-initiated compaction.

---

## Chat Commands

The `/compact` command supports these subcommands:

| Command | Description |
|---------|-------------|
| `/compact` | Auto-compact if needed, show status otherwise |
| `/compact status` | Show current context usage stats |
| `/compact force` | Force compaction regardless of usage |
| `/compact config` | Show current configuration |
| `/compact config <key> <value>` | Update configuration |

**Config keys:**
- `threshold` - Token threshold (default: 80000)
- `strategy` - `summarize`, `truncate`, or `hybrid` (default: hybrid)
- `keepMessages` - Messages to keep (default: 10)
- `autoFlush` - Auto-flush memories before compaction (default: true)

---

## Configuration

```typescript
interface CompactionConfig {
    tokenThreshold: number;      // Default: 80000
    warningThreshold: number;    // Default: 0.8 (80%)
    strategy: 'summarize' | 'truncate' | 'hybrid';
    keepLastMessages: number;    // Default: 10
    autoFlushMemories: boolean;  // Default: true
    memoryFlushPrompt: string;   // Custom prompt for memory extraction
}
```

### Compaction Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| `truncate` | Keep last N messages, discard rest | Fast, simple, lossy |
| `summarize` | LLM-summarize old messages, keep recent | Preserves context, slower |
| `hybrid` | Summarize important parts, truncate rest | Best balance (default) |

---

## API Reference

### Factory Function

```typescript
function createCompactionService(
    ownerType: OwnerType,
    ownerId: string,
    config?: Partial<CompactionConfig>,
    resourceStore?: ResourceStore,
    memoryLog?: DailyMemoryLogService,
    onStageChange?: (stage: CompactionStage, message: string) => void
): CompactionService
```

### Methods

#### shouldCompact

```typescript
shouldCompact(currentTokens: number): { 
    needed: boolean;      // Over threshold
    warning: boolean;     // Over 80% of threshold
    percentUsed: number;  // 0-1
}
```

#### compact

```typescript
async compact(
    conversation: ConversationTurn[],
    options?: {
        flushMemories?: boolean;        // Extract memories first
        generateSummary?: boolean;
        summarizer?: (text: string) => Promise<string>;
    }
): Promise<{
    compactedConversation: ConversationTurn[];
    result: CompactionResult;
}>
```

#### handleCompactCommand

```typescript
async handleCompactCommand(
    args: string[],
    conversation: ConversationTurn[],
    summarizer?: (text: string) => Promise<string>
): Promise<{
    response: string;
    compactedConversation?: ConversationTurn[];
}>
```

---

## Integration with LiquidMind

The Smart Compaction Service integrates with the LiquidMind Memory Lifecycle:

1. **Extracted memories** go to the `DailyMemoryLogService`
2. **Memories are tagged** with `compaction`, `smart-extracted`, and category
3. **The Memory Scheduler** can include compaction-extracted memories in context
4. **Memory Decay** applies to extracted memories (unless pinned)
5. **Consolidation** can group related compaction memories

See [LiquidMind Documentation](./liquidmind.md#memory-lifecycle) for details.

---

## File Map

```
server/src/agents/
├── compaction-service.ts      # Main orchestrator
├── importance-classifier.ts   # LLM-powered scoring
├── memory-decontextualizer.ts # Reference resolution
└── topic-clusterer.ts         # Topic-aware grouping
```

---

## Change History

| Date | Change |
|------|--------|
| 2026-01-26 | Added TopicClusterer for topic-aware summarization in hybrid strategy |
| 2026-01-26 | Added NLWEB-inspired patterns: ImportanceClassifier, MemoryDecontextualizer, parallel pre-processing, stage tracking |
| 2026-01-20 | Initial implementation with basic keyword matching |
