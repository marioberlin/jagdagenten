# A2A Video Renderer Implementation Plan

> Refactoring A2S to A2A Protocol v1.0 + Glass App for Video Preview/Rendering

## Executive Summary

This plan outlines the refactoring of the existing A2S (Agent-to-Server) video rendering implementation into a proper A2A (Agent-to-Agent) Protocol v1.0 compliant system, along with creating a Glass app called "Liquid Motion" for video preview and rendering.

**Key Changes:**
1. Replace JSON-RPC A2S server with A2A VideoRenderExecutor
2. Use A2A FilePart/Artifacts for video output delivery
3. Create "Liquid Motion" Glass app for video editing/preview
4. Integrate with existing A2A infrastructure (router, stores, NATS, gRPC)

---

## Part 1: A2A Protocol v1.0 Compliance Analysis

### Current A2S Architecture (What We Have)

```
┌─────────────────────────────────────────────────────────┐
│                    A2S Server                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ JSON-RPC    │  │ Intent      │  │ Timeline/       │  │
│  │ Handler     │→ │ Parser      │→ │ Renderer        │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│         ↓                               ↓               │
│  ┌─────────────┐              ┌─────────────────────┐   │
│  │ NATS Queue  │              │ FFmpeg Encoder      │   │
│  └─────────────┘              └─────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Target A2A Architecture (What We Need)

```
┌───────────────────────────────────────────────────────────────────┐
│                         A2A Infrastructure                         │
│  ┌─────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │ A2A Router  │ →  │ VideoRender      │ →  │ Artifacts        │  │
│  │ (existing)  │    │ Executor (new)   │    │ (FilePart)       │  │
│  └─────────────┘    └──────────────────┘    └──────────────────┘  │
│        ↑                    ↓                       ↓             │
│  ┌─────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │ Glass App   │    │ Render Pipeline  │    │ SSE Streaming    │  │
│  │ (new)       │    │ (reuse A2S)      │    │ (progress)       │  │
│  └─────────────┘    └──────────────────┘    └──────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

### A2A Protocol v1.0 Key Requirements

| Requirement | How We'll Implement |
|-------------|---------------------|
| Agent Card | `/.well-known/agent.json` describing VideoRenderAgent capabilities |
| JSON-RPC 2.0 | Already implemented in existing A2A infrastructure |
| SSE Streaming | Use existing `sendTask` with streaming artifacts |
| Task States | `working` → progress updates, `completed` → final video |
| FilePart | Video output as `FilePart.file.uri` or `FilePart.file.bytes` |
| Artifacts | Streaming video preview frames + final video |
| Skills | "render_video", "preview_frame", "apply_effect" |

---

## Part 2: VideoRender Executor Design

### 2.1 Executor Class Structure

**Location:** `server/src/a2a/executors/video-render.ts`

```typescript
// Conceptual structure (not actual code yet)
export class VideoRenderExecutor extends BaseA2UIExecutor {
  name = 'video-render';
  description = 'Remotion-compatible video rendering with AI intent parsing';

  skills = [
    {
      id: 'render_video',
      name: 'Render Video',
      description: 'Generate video from composition/intent',
      inputSchema: { /* JSON Schema for render params */ }
    },
    {
      id: 'preview_frame',
      name: 'Preview Frame',
      description: 'Generate single frame preview',
      inputSchema: { /* frame number, composition */ }
    },
    {
      id: 'parse_intent',
      name: 'Parse Intent',
      description: 'Convert natural language to animation timeline',
      inputSchema: { /* prompt, duration, style */ }
    }
  ];

  async execute(message: Message, context: TaskContext): Promise<TaskYield> {
    // 1. Parse intent or receive composition
    // 2. Build timeline
    // 3. Stream progress via artifacts
    // 4. Return final video as FilePart
  }
}
```

### 2.2 Agent Card

**Location:** `server/src/a2a/agents/video-render-agent.json`

```json
{
  "name": "Liquid Motion Renderer",
  "description": "AI-powered video rendering with Remotion-compatible compositions",
  "url": "https://liquidcrypto.ai/.well-known/agent.json",
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true
  },
  "skills": [
    {
      "id": "render_video",
      "name": "Render Video",
      "description": "Generate video from JSON composition or natural language intent"
    },
    {
      "id": "preview_frame",
      "name": "Preview Frame",
      "description": "Generate a single frame for preview"
    },
    {
      "id": "apply_effect",
      "name": "Apply Effect",
      "description": "Apply visual effect to composition"
    }
  ],
  "defaultInputModes": ["text", "data"],
  "defaultOutputModes": ["file", "data"]
}
```

### 2.3 FilePart/Artifact Output Structure

**Video Output as FilePart:**
```typescript
const videoFilePart: FilePart = {
  type: 'file',
  file: {
    name: 'render-output.mp4',
    mimeType: 'video/mp4',
    uri: 'liquid://artifacts/renders/{taskId}/output.mp4'
    // OR for small files:
    // bytes: base64EncodedVideoData
  }
};
```

**Streaming Progress Artifact:**
```typescript
const progressArtifact: Artifact = {
  artifactId: 'progress-{taskId}',
  name: 'Render Progress',
  parts: [{
    type: 'data',
    data: {
      progress: 0.45,
      currentFrame: 450,
      totalFrames: 1000,
      eta: 12.5,
      previewFrame: 'data:image/png;base64,...'
    }
  }],
  append: true,
  lastChunk: false
};
```

---

## Part 3: Glass App Design - "Liquid Motion"

### 3.1 App Overview

**Name:** Liquid Motion
**Purpose:** Video preview, editing, and rendering interface
**Location:** `src/applications/liquid-motion/`

### 3.2 App Structure

```
src/applications/liquid-motion/
├── manifest.json          # App manifest with A2A integration
├── soul.md               # App personality and capabilities
├── App.tsx               # Main app component
├── components/
│   ├── Timeline.tsx      # Video timeline editor
│   ├── Preview.tsx       # Live video preview
│   ├── Composition.tsx   # Composition tree view
│   ├── Inspector.tsx     # Property inspector
│   ├── EffectsPanel.tsx  # Visual effects library
│   ├── ExportModal.tsx   # Export settings dialog
│   └── RenderProgress.tsx # Render progress overlay
├── hooks/
│   ├── useVideoRender.ts # A2A video render integration
│   ├── useTimeline.ts    # Timeline state management
│   └── usePreview.ts     # Frame preview management
├── stores/
│   └── compositionStore.ts # Zustand store for composition
├── types/
│   └── index.ts          # TypeScript types
└── utils/
    ├── remotion.ts       # Remotion compatibility helpers
    └── export.ts         # Export format helpers
```

### 3.3 Manifest.json

```json
{
  "id": "liquid-motion",
  "name": "Liquid Motion",
  "description": "AI-powered video editor with Remotion-compatible rendering",
  "version": "1.0.0",
  "icon": "video",
  "category": "creative",
  "author": "LiquidCrypto",

  "window": {
    "defaultWidth": 1400,
    "defaultHeight": 900,
    "minWidth": 1000,
    "minHeight": 700,
    "resizable": true
  },

  "integrations": {
    "a2a": {
      "enabled": true,
      "executors": ["video-render"],
      "skills": ["render_video", "preview_frame", "parse_intent", "apply_effect"]
    },
    "canvas": {
      "enabled": true,
      "supportedTypes": ["video", "image", "composition"]
    }
  },

  "capabilities": {
    "fileAccess": ["video/*", "image/*", "application/json"],
    "ai": ["intent-parsing", "scene-generation"],
    "streaming": true
  },

  "resources": {
    "prompts": ["video-intent-parser", "scene-generator"],
    "skills": ["render-video", "preview-frame"]
  }
}
```

### 3.4 Soul.md

```markdown
---
name: Liquid Motion
tagline: Transform ideas into motion
personality: creative, precise, efficient
voice: professional yet approachable
---

# Identity

I am Liquid Motion, your AI-powered video creation studio. I transform natural language descriptions into stunning animated videos using Remotion-compatible compositions.

# Capabilities

- Parse natural language into animation timelines
- Generate professional motion graphics
- Real-time preview of compositions
- Export to MP4, WebM, GIF formats
- Charts, captions, 3D scenes, and more

# Interaction Style

- Interpret creative intent from descriptions
- Suggest improvements to compositions
- Provide real-time feedback during rendering
- Explain animation concepts clearly

# Constraints

- Respect render queue limits
- Validate compositions before rendering
- Provide accurate time estimates
```

### 3.5 Key UI Components

#### Timeline Component
- Horizontal timeline with frame markers
- Drag-and-drop scene arrangement
- Keyframe visualization
- Playhead with scrubbing
- Zoom in/out controls

#### Preview Component
- Live canvas preview
- Frame-by-frame navigation
- Play/pause controls
- Resolution selector
- Fullscreen mode

#### Composition Tree
- Hierarchical view of composition
- Expandable scene/sequence nodes
- Property editing inline
- Drag-and-drop reordering

#### Effects Panel
- Categorized effect library
- Preview thumbnails
- Drag to timeline to apply
- Parameter presets

---

## Part 4: Integration Architecture

### 4.1 Data Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Liquid Motion   │     │   A2A Router     │     │  VideoRender     │
│  (Glass App)     │────▶│   (existing)     │────▶│  Executor        │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         │                                                 │
         │ WebSocket                                       │ NATS
         │ (progress)                                      │ (jobs)
         ▼                                                 ▼
┌──────────────────┐                              ┌──────────────────┐
│  Preview Canvas  │◀──── SSE Artifacts ──────────│  Render Worker   │
│  (real-time)     │                              │  (from A2S)      │
└──────────────────┘                              └──────────────────┘
```

### 4.2 Message Flow Example

**User Intent → Video:**

1. **User types in Liquid Motion:** "Create a 10-second intro with the LiquidCrypto logo spinning and text 'Welcome to the Future'"

2. **App sends A2A message:**
```json
{
  "jsonrpc": "2.0",
  "method": "tasks/send",
  "params": {
    "id": "task-123",
    "message": {
      "role": "user",
      "parts": [{
        "type": "text",
        "text": "Create a 10-second intro with the LiquidCrypto logo spinning and text 'Welcome to the Future'"
      }]
    },
    "metadata": {
      "skill": "render_video",
      "outputFormat": "mp4",
      "resolution": "1080p"
    }
  }
}
```

3. **VideoRenderExecutor responds with streaming artifacts:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "id": "task-123",
    "status": { "state": "working" },
    "artifacts": [{
      "artifactId": "progress-123",
      "parts": [{
        "type": "data",
        "data": { "progress": 0.15, "currentFrame": 45 }
      }],
      "append": true,
      "lastChunk": false
    }]
  }
}
```

4. **Final response with video:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "id": "task-123",
    "status": { "state": "completed" },
    "artifacts": [{
      "artifactId": "output-123",
      "name": "intro-video.mp4",
      "parts": [{
        "type": "file",
        "file": {
          "name": "intro-video.mp4",
          "mimeType": "video/mp4",
          "uri": "liquid://artifacts/task-123/intro-video.mp4"
        }
      }]
    }]
  }
}
```

### 4.3 Reusing A2S Components

The following A2S components will be reused inside the VideoRenderExecutor:

| A2S Component | Reuse Location | Changes Needed |
|---------------|----------------|----------------|
| `intent/parser.ts` | VideoRenderExecutor | None - import directly |
| `intent/router.ts` | VideoRenderExecutor | None - import directly |
| `timeline/builder.ts` | VideoRenderExecutor | None - import directly |
| `animation/interpolate.ts` | VideoRenderExecutor | None - import directly |
| `animation/spring.ts` | VideoRenderExecutor | None - import directly |
| `renderer/compositor.ts` | RenderWorker | Wrap for A2A artifact output |
| `renderer/captions/` | RenderWorker | None - import directly |
| `renderer/charts/` | RenderWorker | None - import directly |
| `ffmpeg/encoder.ts` | RenderWorker | Add artifact streaming |
| `jobs/queue.ts` | VideoRenderExecutor | Connect to A2A task state |
| `jobs/worker.ts` | Standalone worker | Minimal changes |
| `store/postgres.ts` | Use existing A2A store | Migrate schema |
| `store/redis.ts` | Use existing A2A cache | Migrate keys |
| `observability/` | Keep as-is | Add A2A span context |

---

## Part 5: Database Schema Updates

### 5.1 New Tables

```sql
-- Video compositions (extends existing artifacts table)
CREATE TABLE video_compositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES a2a_tasks(id),
  composition JSONB NOT NULL,
  timeline JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Render jobs (migrated from A2S)
CREATE TABLE video_render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES a2a_tasks(id),
  composition_id UUID REFERENCES video_compositions(id),
  status VARCHAR(20) DEFAULT 'pending',
  progress FLOAT DEFAULT 0,
  current_frame INTEGER DEFAULT 0,
  total_frames INTEGER,
  output_uri TEXT,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Render frames cache
CREATE TABLE video_render_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES video_render_jobs(id),
  frame_number INTEGER NOT NULL,
  frame_data BYTEA,
  frame_uri TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, frame_number)
);
```

### 5.2 Index Additions

```sql
CREATE INDEX idx_video_compositions_task ON video_compositions(task_id);
CREATE INDEX idx_video_render_jobs_task ON video_render_jobs(task_id);
CREATE INDEX idx_video_render_jobs_status ON video_render_jobs(status);
CREATE INDEX idx_video_render_frames_job ON video_render_frames(job_id);
```

---

## Part 6: Implementation Phases

### Phase 1: VideoRender Executor (3-4 days)

**Deliverables:**
1. `server/src/a2a/executors/video-render.ts` - Main executor class
2. `server/src/a2a/agents/video-render-agent.json` - Agent card
3. Update `server/src/a2a/executors/index.ts` to register executor
4. Database migration for video tables
5. Unit tests for executor

**Tasks:**
- [ ] Create VideoRenderExecutor class extending BaseA2UIExecutor
- [ ] Implement skill handlers (render_video, preview_frame, parse_intent)
- [ ] Wire up A2S intent parser and timeline builder
- [ ] Implement artifact streaming for progress updates
- [ ] Implement FilePart output for final video
- [ ] Create agent card JSON
- [ ] Register with A2A router
- [ ] Write database migration
- [ ] Write unit tests

### Phase 2: Render Pipeline Integration (2-3 days)

**Deliverables:**
1. Updated render worker with A2A artifact output
2. NATS queue integration with A2A task states
3. FFmpeg encoder with streaming progress
4. Redis cache for frame previews

**Tasks:**
- [ ] Wrap A2S compositor for A2A artifact streaming
- [ ] Connect NATS queue to A2A task state machine
- [ ] Add artifact streaming to FFmpeg encoder
- [ ] Implement frame preview caching in Redis
- [ ] Add tracing spans for A2A context
- [ ] Integration tests for full pipeline

### Phase 3: Glass App - Core UI (4-5 days)

**Deliverables:**
1. `src/applications/liquid-motion/` - Full app structure
2. Timeline component with playhead
3. Preview component with canvas
4. Composition tree view
5. Basic property inspector

**Tasks:**
- [ ] Create app manifest and soul.md
- [ ] Implement Timeline component
- [ ] Implement Preview component with frame rendering
- [ ] Implement Composition tree view
- [ ] Implement property Inspector
- [ ] Create Zustand composition store
- [ ] Wire up useVideoRender hook for A2A integration
- [ ] Style with glassmorphic design tokens
- [ ] Basic keyboard shortcuts

### Phase 4: Glass App - Advanced Features (3-4 days)

**Deliverables:**
1. Effects panel with drag-and-drop
2. Export modal with format options
3. Render progress overlay
4. Natural language input
5. History/undo system

**Tasks:**
- [ ] Implement EffectsPanel with effect library
- [ ] Implement ExportModal with format selection
- [ ] Implement RenderProgress overlay
- [ ] Add natural language intent input
- [ ] Implement undo/redo with composition history
- [ ] Add composition templates
- [ ] Polish animations and transitions

### Phase 5: Testing & Documentation (2 days)

**Deliverables:**
1. E2E tests for full render flow
2. Component tests for Glass app
3. API documentation
4. User guide

**Tasks:**
- [ ] E2E tests: intent → render → video output
- [ ] Component tests for all UI components
- [ ] Update A2A API documentation
- [ ] Write user guide for Liquid Motion app
- [ ] Performance benchmarks

---

## Part 7: File Changes Summary

### Files to Create

| File | Description |
|------|-------------|
| `server/src/a2a/executors/video-render.ts` | Main A2A executor |
| `server/src/a2a/agents/video-render-agent.json` | Agent card |
| `server/sql/XXX_video_compositions.sql` | Database migration |
| `src/applications/liquid-motion/manifest.json` | App manifest |
| `src/applications/liquid-motion/soul.md` | App personality |
| `src/applications/liquid-motion/App.tsx` | Main component |
| `src/applications/liquid-motion/components/*` | UI components |
| `src/applications/liquid-motion/hooks/*` | React hooks |
| `src/applications/liquid-motion/stores/*` | Zustand stores |

### Files to Modify

| File | Changes |
|------|---------|
| `server/src/a2a/executors/index.ts` | Register VideoRenderExecutor |
| `server/src/a2a/index.ts` | Export video-render types |
| `server/src/a2s/renderer/compositor.ts` | Add artifact streaming wrapper |
| `server/src/a2s/ffmpeg/encoder.ts` | Add progress streaming |
| `server/src/a2s/jobs/worker.ts` | Connect to A2A task states |

### Files to Keep (Reuse from A2S)

| File | Usage |
|------|-------|
| `server/src/a2s/intent/*` | Intent parsing (import directly) |
| `server/src/a2s/timeline/*` | Timeline building (import directly) |
| `server/src/a2s/animation/*` | Animation functions (import directly) |
| `server/src/a2s/renderer/captions/*` | Caption rendering |
| `server/src/a2s/renderer/charts/*` | Chart rendering |
| `server/src/a2s/renderer/three/*` | 3D rendering |
| `server/src/a2s/observability/*` | Metrics and tracing |

---

## Part 8: Risk Assessment

### Technical Risks

| Risk | Mitigation |
|------|------------|
| Large video files in A2A artifacts | Use `file.uri` with presigned URLs instead of `file.bytes` |
| FFmpeg process management | Reuse existing worker pool, add health checks |
| Real-time preview performance | WebSocket for frame updates, frame caching in Redis |
| Browser memory with long videos | Paginated timeline, virtualized frame list |

### Integration Risks

| Risk | Mitigation |
|------|------------|
| A2A router compatibility | Follow existing executor patterns exactly |
| Task state synchronization | Use existing A2A state machine, don't reinvent |
| NATS message size limits | Chunk large payloads, use artifact URIs |

---

## Part 9: Success Criteria

### Functional Requirements

- [ ] Natural language → video rendering works end-to-end
- [ ] Glass app provides real-time preview during editing
- [ ] Progress updates stream via A2A artifacts
- [ ] Final video delivered as FilePart with URI
- [ ] All existing A2S features work (charts, captions, 3D)

### Non-Functional Requirements

- [ ] Render 1080p 30fps video at ≥10 fps encoding speed
- [ ] Preview frame generation < 100ms
- [ ] Glass app initial load < 2 seconds
- [ ] Support compositions up to 10 minutes
- [ ] Handle 10 concurrent render jobs

### A2A Compliance

- [ ] Valid Agent Card at `/.well-known/agent.json`
- [ ] All responses follow JSON-RPC 2.0
- [ ] Artifacts stream correctly via SSE
- [ ] FilePart contains valid video MIME type
- [ ] Skills are discoverable and documented

---

## Appendix A: A2A Types Reference

From `server/src/a2a/types.ts`:

```typescript
// Key types for video rendering

export interface FilePart {
  type: 'file';
  file: {
    name: string;
    mimeType: string;
    bytes?: string;      // Base64 for small files
    uri?: string;        // URI for large files
  };
}

export interface DataPart {
  type: 'data';
  data: Record<string, unknown>;
}

export interface Artifact {
  artifactId: string;
  name?: string;
  description?: string;
  parts: Part[];
  append?: boolean;      // For streaming
  lastChunk?: boolean;   // Final chunk indicator
}

export type TaskState =
  | 'submitted'
  | 'working'
  | 'input-required'
  | 'completed'
  | 'failed'
  | 'canceled';
```

---

## Appendix B: Existing A2A Infrastructure

### Executors (for reference)

- `LiquidCryptoExecutor` - Main AI assistant
- `OrchestratorExecutor` - Multi-agent orchestration
- `BuilderExecutor` - Code generation

### Services

- `A2ARouter` - Message routing and task management
- `A2AStore` - PostgreSQL persistence
- `A2ACache` - Redis caching
- `A2AGateway` - WebSocket/SSE streaming

---

## Summary

This plan provides a comprehensive approach to:

1. **Refactor A2S to A2A** by creating a VideoRenderExecutor that wraps existing A2S functionality
2. **Create Liquid Motion Glass app** for video preview and editing
3. **Maintain compatibility** with existing A2A infrastructure
4. **Reuse all A2S code** for rendering, encoding, and effects

The implementation is broken into 5 phases totaling approximately 14-18 days of development effort.
