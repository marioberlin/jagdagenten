# Liquid Motion - Video Rendering System

A Remotion-compatible video rendering system with Canvas + FFmpeg architecture.

## Overview

Liquid Motion is a programmatic video rendering system that provides:

- **Canvas-based frame rendering** - Fast default for most element types
- **FFmpeg video encoding** - Professional H.264/H.265/VP9/ProRes output
- **Puppeteer HTML rendering** - Optional full CSS/HTML support when needed
- **Video compositing** - Overlay videos with chroma key, filters, timing
- **Audio mixing** - Multi-track audio with fades, volume, timing

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Liquid Motion                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│   │  Composition │     │    Render    │     │   FFmpeg     │   │
│   │   Definition │ ──▶ │   Pipeline   │ ──▶ │   Encoding   │   │
│   └──────────────┘     └──────────────┘     └──────────────┘   │
│                               │                                  │
│            ┌──────────────────┼──────────────────┐              │
│            ▼                  ▼                  ▼              │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │
│   │    Canvas    │   │  Puppeteer   │   │   Three.js   │       │
│   │   Renderer   │   │   (HTML)     │   │    (3D)      │       │
│   │   (fast)     │   │   (slow)     │   │              │       │
│   └──────────────┘   └──────────────┘   └──────────────┘       │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                     Video Overlay                        │   │
│   │              (FFmpeg filter_complex)                     │   │
│   │   - Chroma key (green screen)                           │   │
│   │   - Video filters (blur, brightness, etc.)              │   │
│   │   - Timing control                                       │   │
│   │   - Audio extraction                                     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      Audio Mixer                         │   │
│   │   - Multi-track mixing                                   │   │
│   │   - Volume keyframes                                     │   │
│   │   - Fade in/out                                          │   │
│   │   - Playback rate                                        │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Element Types

### Text Element

Renders text with effects, shadows, and strokes.

```typescript
interface TextElement {
  type: 'text';
  text: string;
  x: number;
  y: number;
  fontSize?: number;         // default: 24
  fontFamily?: string;       // default: 'Arial'
  fontWeight?: 'normal' | 'bold' | 'light';
  color?: string;            // default: '#ffffff'
  align?: 'left' | 'center' | 'right';
  effect?: 'none' | 'fade' | 'slide-up' | 'slide-down' | 'typewriter' | 'glow' | 'bounce';
  effectDuration?: number;   // frames
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  stroke?: {
    color: string;
    width: number;
  };
}
```

### Image Element

Renders images with fit modes and effects.

```typescript
interface ImageElement {
  type: 'image';
  src: string;              // file path or URL
  x: number;
  y: number;
  width?: number;
  height?: number;
  fit?: 'contain' | 'cover' | 'fill' | 'none';
  effect?: 'none' | 'fade' | 'scale' | 'pan' | 'zoom' | 'ken-burns';
  effectDuration?: number;
}
```

### Video Element

Embeds video files with full control.

```typescript
interface VideoElement {
  type: 'video';
  src: string;              // video file path
  x: number;
  y: number;
  width: number;
  height: number;
  startFrame: number;
  endFrame?: number;
  volume?: number;          // 0-1
  muted?: boolean;
  loop?: boolean;
  playbackRate?: number;    // 1 = normal
  trim?: {
    start: number;          // seconds
    end?: number;
  };
  fit?: 'contain' | 'cover' | 'fill' | 'none';
  chromaKey?: {
    color: string;          // '#00ff00' for green screen
    similarity?: number;    // 0-1, default 0.3
    blend?: number;         // 0-1, default 0.1
  };
  filters?: VideoFilter[];
}

interface VideoFilter {
  type: 'blur' | 'brightness' | 'contrast' | 'saturation' | 'hue' | 'grayscale' | 'sepia' | 'invert';
  value?: number;
}
```

**Video Overlay Processing:**
- Videos are composited using FFmpeg `filter_complex`
- No intermediate frame extraction needed
- Audio automatically extracted and mixed
- Supports multiple overlapping videos with z-index

### Audio Element

Audio tracks with timing and effects.

```typescript
interface AudioElement {
  type: 'audio';
  src: string;              // audio file path
  startFrame: number;
  endFrame?: number;
  volume?: number;          // 0-1
  fadeIn?: number;          // frames
  fadeOut?: number;         // frames
  playbackRate?: number;
  loop?: boolean;
  muted?: boolean;
}
```

### Shape Element

Vector shapes with fills and strokes.

```typescript
interface ShapeElement {
  type: 'shape';
  shape: 'rectangle' | 'circle' | 'ellipse' | 'line' | 'polygon' | 'rounded-rect';
  x: number;
  y: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;    // for rounded-rect
  points?: { x: number; y: number }[];  // for polygon
}
```

### Chart Element

Animated data visualizations.

```typescript
interface ChartElement {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie' | 'donut' | 'area';
  x: number;
  y: number;
  width: number;
  height: number;
  data: { label: string; value: number; color?: string }[];
  animated?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
  colors?: string[];
}
```

### Lottie Element

Lottie JSON animations.

```typescript
interface LottieElement {
  type: 'lottie';
  src: string;              // Lottie JSON file path
  x: number;
  y: number;
  width?: number;
  height?: number;
  loop?: boolean;
  speed?: number;
}
```

### Three.js 3D Element

3D scenes with animations.

```typescript
interface ThreeElement {
  type: 'three';
  x: number;
  y: number;
  width: number;
  height: number;
  scene: {
    backgroundColor?: string;
    camera?: {
      type: 'perspective' | 'orthographic';
      position?: [number, number, number];
      lookAt?: [number, number, number];
      fov?: number;
    };
    lights?: Array<{
      type: 'ambient' | 'directional' | 'point' | 'spot';
      color?: string;
      intensity?: number;
      position?: [number, number, number];
    }>;
    objects?: Array<{
      type: 'box' | 'sphere' | 'cylinder' | 'plane' | 'torus' | 'text' | 'gltf';
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
      color?: string;
      material?: 'basic' | 'standard' | 'phong' | 'lambert';
      wireframe?: boolean;
      animation?: {
        property: 'rotation' | 'position' | 'scale';
        axis: 'x' | 'y' | 'z';
        speed: number;
      };
    }>;
  };
}
```

### HTML Element (Puppeteer)

Full HTML/CSS rendering for complex layouts.

```typescript
interface HtmlElement {
  type: 'html';
  x: number;
  y: number;
  width: number;
  height: number;
  startFrame: number;
  endFrame?: number;

  // Content options (choose one)
  html?: string;            // HTML content
  url?: string;             // URL to load
  reactComponent?: 'DataCard' | 'BarChart' | 'PriceDisplay';
  reactProps?: Record<string, unknown>;

  // Styling
  css?: string;             // CSS to inject
  tailwindClasses?: string; // Tailwind classes for container

  // Behavior
  script?: string;          // JS to execute before screenshot
  waitForSelector?: string; // Wait for element
  waitTime?: number;        // Wait ms for animations

  // Rendering
  deviceScaleFactor?: number; // default: 2 (retina)
  transparent?: boolean;      // default: true
}
```

**Built-in React Components:**

```typescript
// DataCard - Metric display card
interface DataCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink';
}

// BarChart - Simple bar chart
interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  colors?: string[];
}

// PriceDisplay - Crypto/stock price card
interface PriceDisplayProps {
  symbol: string;
  price: string | number;
  change: string | number;
  changePercent: string | number;
  positive: boolean;
}
```

**Example:**
```typescript
{
  type: 'html',
  x: 100,
  y: 100,
  width: 300,
  height: 200,
  startFrame: 0,
  reactComponent: 'DataCard',
  reactProps: {
    title: 'Revenue',
    value: '$123,456',
    subtitle: '+15% from last month',
    color: 'green',
  },
}
```

## Composition Definition

```typescript
interface CompositionDefinition {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  backgroundColor?: string;
  elements: CompositionElement[];
  audioTracks?: AudioTrackDefinition[];
  videoOverlays?: VideoOverlayDefinition[];
}
```

## Render Options

```typescript
interface RenderOptions {
  format: 'mp4' | 'webm' | 'gif' | 'mov' | 'png-sequence';
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores';
  quality?: 'low' | 'medium' | 'high' | 'lossless';
  crf?: number;             // 0-51, lower = better quality
  preset?: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow';
}
```

**Quality Presets:**
| Quality | CRF | Preset | Use Case |
|---------|-----|--------|----------|
| low | 28 | fast | Preview, draft |
| medium | 23 | medium | General use |
| high | 18 | slow | Final output |
| lossless | 0 | veryslow | Archive, editing |

## API Endpoints

### Health Check
```
GET /health
Response: { "status": "ok", "service": "video", "version": "1.0.0" }
```

### Start Render
```
POST /video
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "video/render",
  "params": {
    "composition": { ... },
    "options": {
      "format": "mp4",
      "codec": "h264",
      "quality": "high"
    }
  },
  "id": "1"
}
```

### Get Preview Frame
```
POST /video
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "video/preview",
  "params": {
    "composition": { ... },
    "frame": 30,
    "format": "png"
  },
  "id": "2"
}
```

## Docker Deployment

### Build
```bash
cd server/container
./build.sh video
```

### Run Standalone
```bash
docker run -d \
  --name video-runtime \
  -p 8082:8082 \
  -v video_renders:/data/renders \
  -v video_assets:/data/assets \
  liquidcrypto/video-runtime:latest
```

### Docker Compose
```yaml
video-runtime:
  image: liquidcrypto/video-runtime:latest
  ports:
    - "8082:8082"
  environment:
    VIDEO_MAX_CONCURRENT_RENDERS: 4
    VIDEO_DEFAULT_CODEC: h264
    VIDEO_DEFAULT_CRF: 18
  volumes:
    - video_renders:/data/renders
    - video_assets:/data/assets
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| VIDEO_PORT | 8082 | HTTP server port |
| VIDEO_OUTPUT_DIR | /data/renders | Output directory |
| VIDEO_ASSET_DIR | /data/assets | Asset directory |
| VIDEO_TEMP_DIR | /data/temp | Temp directory |
| VIDEO_MAX_CONCURRENT_RENDERS | 4 | Max parallel renders |
| VIDEO_DEFAULT_CODEC | h264 | Default codec |
| VIDEO_DEFAULT_CRF | 18 | Default quality |
| VIDEO_MAX_DURATION | 3600 | Max video length (sec) |
| FFMPEG_PATH | /usr/bin/ffmpeg | FFmpeg binary |
| FFPROBE_PATH | /usr/bin/ffprobe | FFprobe binary |

## Performance Considerations

### Canvas vs Puppeteer

| Renderer | Speed | Use When |
|----------|-------|----------|
| Canvas | ~50 fps | Text, shapes, images, charts, Lottie |
| Puppeteer | ~2-5 fps | Complex CSS, React components, web fonts |

**Recommendation:** Use Canvas for most elements. Only use HTML elements when you need full CSS (flexbox, grid, gradients, web fonts) or existing React components.

### Video Overlays

FFmpeg filter_complex composites videos directly during encoding:
- No intermediate frame extraction
- Single-pass encoding
- Hardware acceleration support (when available)
- Memory efficient for multiple overlays

### Memory Usage

| Operation | Typical RAM |
|-----------|-------------|
| Basic composition (1080p) | 200-500 MB |
| With 3D (Three.js) | +100-300 MB |
| With Puppeteer | +200-400 MB |
| Per video overlay | +50-100 MB |

## Comparison with Remotion

| Feature | Liquid Motion | Remotion |
|---------|--------------|----------|
| Rendering | Canvas + FFmpeg | React + Puppeteer |
| Speed | ~50 fps (Canvas) | ~2-5 fps |
| CSS Support | Via HTML element | Full |
| React Components | Built-in set | Custom |
| Video Compositing | FFmpeg native | Frame extraction |
| 3D Support | Three.js | @remotion/three |
| Audio | FFmpeg mixing | Web Audio |
| Output Formats | mp4, webm, gif, mov, png-seq | mp4, webm, gif |

## Example Composition

```typescript
const composition: CompositionDefinition = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150, // 5 seconds
  backgroundColor: '#1a1a2e',
  elements: [
    // Animated title
    {
      id: 'title',
      type: 'text',
      text: 'Q4 Performance Report',
      x: 960,
      y: 100,
      fontSize: 72,
      fontWeight: 'bold',
      color: '#ffffff',
      align: 'center',
      effect: 'fade',
      effectDuration: 30,
      startFrame: 0,
    },
    // Data card using HTML/React
    {
      id: 'revenue-card',
      type: 'html',
      x: 100,
      y: 200,
      width: 350,
      height: 200,
      startFrame: 30,
      reactComponent: 'DataCard',
      reactProps: {
        title: 'Revenue',
        value: '$2.4M',
        subtitle: '+23% YoY',
        color: 'green',
      },
    },
    // Animated chart
    {
      id: 'chart',
      type: 'chart',
      chartType: 'bar',
      x: 500,
      y: 200,
      width: 600,
      height: 400,
      data: [
        { label: 'Q1', value: 1200000 },
        { label: 'Q2', value: 1500000 },
        { label: 'Q3', value: 1800000 },
        { label: 'Q4', value: 2400000 },
      ],
      animated: true,
      showValues: true,
      startFrame: 30,
    },
    // Background video with chroma key
    {
      id: 'presenter',
      type: 'video',
      src: '/assets/presenter-greenscreen.mp4',
      x: 1400,
      y: 500,
      width: 480,
      height: 540,
      startFrame: 60,
      chromaKey: {
        color: '#00ff00',
        similarity: 0.4,
        blend: 0.1,
      },
    },
  ],
  audioTracks: [
    {
      id: 'bgm',
      src: '/assets/background-music.mp3',
      startFrame: 0,
      volume: 0.3,
      fadeIn: 30,
      fadeOut: 30,
    },
  ],
};
```

## Files Reference

### Backend

| File | Purpose |
|------|---------|
| `server/src/a2a/executors/composition-renderer.ts` | Core renderer, element definitions |
| `server/src/a2a/executors/video-render-pipeline.ts` | Render orchestration |
| `server/src/a2a/video/ffmpeg/video-overlay.ts` | FFmpeg video compositing |
| `server/src/a2a/video/ffmpeg/audio.ts` | Audio mixing |
| `server/src/a2a/video/renderer/html/renderer.ts` | Puppeteer HTML rendering |
| `server/src/a2a/video/renderer/three/renderer.ts` | Three.js 3D rendering |

### Frontend

| File | Purpose |
|------|---------|
| `src/applications/liquid-motion/types/index.ts` | Frontend type definitions |
| `src/applications/liquid-motion/stores/compositionStore.ts` | Zustand composition state |
| `src/applications/liquid-motion/components/` | UI components |

### Docker

| File | Purpose |
|------|---------|
| `server/container/Dockerfile.video` | Video runtime container |
| `server/container/video-runtime/` | Container entry point |
| `docker-compose.yml` | Development stack |

## Tests

```bash
# Run all video tests
bun test server/src/a2a/__tests__/

# Run specific test suites
bun test server/src/a2a/__tests__/video-render-pipeline.test.ts
bun test server/src/a2a/__tests__/video-overlay.test.ts
bun test server/src/a2a/__tests__/html-renderer.test.ts
```

Test coverage:
- 89 passing unit tests
- 11 E2E tests (require infrastructure)
