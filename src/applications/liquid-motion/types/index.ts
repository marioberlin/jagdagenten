/**
 * Liquid Motion Types
 */

// ============================================================================
// Composition Types
// ============================================================================

export interface AudioTrack {
  id: string;
  name: string;
  src: string;
  startFrame: number;
  endFrame?: number;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  playbackRate?: number;
  loop?: boolean;
  muted?: boolean;
}

export interface Composition {
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  backgroundColor?: string;
  metadata?: Record<string, unknown>;
  audioTracks?: AudioTrack[];
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'image' | 'shape' | 'effect';
  events: TimelineEvent[];
  locked?: boolean;
  visible?: boolean;
  muted?: boolean;
}

export interface TimelineEvent {
  id: string;
  trackId: string;
  type: TimelineTrack['type'];
  startFrame: number;
  endFrame: number;
  name?: string;
  properties: Record<string, unknown>;
  effects?: Effect[];
  keyframes?: Keyframe[];
}

// ============================================================================
// Effect Types
// ============================================================================

export interface Effect {
  id: string;
  type: EffectType;
  name: string;
  parameters: Record<string, unknown>;
  enabled: boolean;
}

export type EffectType =
  | 'fade'
  | 'blur'
  | 'slide'
  | 'zoom'
  | 'wipe'
  | 'dissolve'
  | 'spin'
  | 'bounce'
  | 'spring'
  | 'typewriter'
  | 'custom';

export interface EffectPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  type: EffectType;
  parameters: Record<string, unknown>;
  previewUri?: string;
}

// ============================================================================
// Animation Types
// ============================================================================

export interface Keyframe {
  frame: number;
  value: number | string | Record<string, unknown>;
  easing?: EasingType;
}

export type EasingType =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'spring'
  | 'bounce';

export interface SpringConfig {
  mass: number;
  damping: number;
  stiffness: number;
  velocity?: number;
}

// ============================================================================
// Video Types (defined first as they're used in ElementProperties)
// ============================================================================

export interface VideoTrimOptions {
  /** Start time in seconds */
  start: number;
  /** End time in seconds (optional) */
  end?: number;
}

export type VideoFitMode = 'contain' | 'cover' | 'fill' | 'none';

export interface ChromaKeyOptions {
  /** Color to key out (hex color, e.g., '#00ff00' for green screen) */
  color: string;
  /** Similarity threshold (0-1, default 0.3) */
  similarity?: number;
  /** Blend amount for edge softening (0-1, default 0.1) */
  blend?: number;
}

export type VideoFilterType =
  | 'blur'
  | 'brightness'
  | 'contrast'
  | 'saturation'
  | 'hue'
  | 'grayscale'
  | 'sepia'
  | 'invert';

export interface VideoFilter {
  type: VideoFilterType;
  /** Filter value (interpretation depends on type) */
  value?: number;
}

export interface VideoOverlay {
  id: string;
  /** Video source URL or path */
  src: string;
  /** X position on canvas */
  x: number;
  /** Y position on canvas */
  y: number;
  /** Width of the video */
  width: number;
  /** Height of the video */
  height: number;
  /** Frame to start showing the video */
  startFrame: number;
  /** Frame to stop showing the video */
  endFrame?: number;
  /** Z-index for layering */
  zIndex?: number;
  /** Audio volume (0-1) */
  volume?: number;
  /** Mute audio */
  muted?: boolean;
  /** Loop the video */
  loop?: boolean;
  /** Playback speed multiplier */
  playbackRate?: number;
  /** Trim options */
  trim?: VideoTrimOptions;
  /** How to fit the video in its bounds */
  fit?: VideoFitMode;
  /** Opacity (0-1) */
  opacity?: number;
  /** Chroma key (green screen) settings */
  chromaKey?: ChromaKeyOptions;
  /** Video filters to apply */
  filters?: VideoFilter[];
}

// ============================================================================
// HTML Element Types (Puppeteer-based rendering)
// ============================================================================

/** Built-in React components available for HTML elements */
export type HtmlReactComponent =
  | 'DataCard'
  | 'BarChart'
  | 'PriceDisplay';

export interface HtmlElement {
  id: string;
  /** HTML content to render (can include <style> tags) */
  html?: string;
  /** URL to load and render */
  url?: string;
  /** CSS to inject into the page */
  css?: string;
  /** JavaScript to execute before screenshot (for dynamic content) */
  script?: string;
  /** Selector to wait for before rendering */
  waitForSelector?: string;
  /** Time to wait in ms before rendering (for animations) */
  waitTime?: number;
  /** X position on canvas */
  x: number;
  /** Y position on canvas */
  y: number;
  /** Width of the element */
  width: number;
  /** Height of the element */
  height: number;
  /** Frame to start showing the element */
  startFrame: number;
  /** Frame to stop showing the element */
  endFrame?: number;
  /** Z-index for layering */
  zIndex?: number;
  /** Opacity (0-1) */
  opacity?: number;
  /** Device scale factor for high-DPI rendering (default: 2) */
  deviceScaleFactor?: number;
  /** Transparent background (default: true) */
  transparent?: boolean;
  /** Tailwind CSS classes to apply to the container */
  tailwindClasses?: string;
  /** React component name to render (from built-in components) */
  reactComponent?: HtmlReactComponent;
  /** Props to pass to the React component */
  reactProps?: Record<string, unknown>;
}

/** Props for the DataCard React component */
export interface DataCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink';
}

/** Props for the BarChart React component */
export interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  colors?: string[];
}

/** Props for the PriceDisplay React component */
export interface PriceDisplayProps {
  symbol: string;
  price: string | number;
  change: string | number;
  changePercent: string | number;
  positive: boolean;
}

// ============================================================================
// Element Types
// ============================================================================

export interface CompositionElement {
  id: string;
  type: ElementType;
  name: string;
  properties: ElementProperties;
  transform: Transform;
  style?: StyleProperties;
}

export type ElementType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'shape'
  | 'chart'
  | 'lottie'
  | 'three'
  | 'html';

export interface ElementProperties {
  // Text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  textAlign?: 'left' | 'center' | 'right';

  // Media
  src?: string;
  volume?: number;
  playbackRate?: number;

  // Video-specific
  muted?: boolean;
  loop?: boolean;
  trim?: VideoTrimOptions;
  fit?: VideoFitMode;
  chromaKey?: ChromaKeyOptions;
  videoFilters?: VideoFilter[];

  // Shape
  shapeType?: 'rectangle' | 'circle' | 'ellipse' | 'polygon';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;

  // Chart
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  chartData?: ChartData;

  // Lottie
  lottieData?: unknown;

  // Three.js 3D
  threeScene?: ThreeSceneDefinition;
  threePreset?: ThreePreset;

  // HTML (Puppeteer-based rendering)
  /** HTML content to render */
  htmlContent?: string;
  /** URL to load and render */
  htmlUrl?: string;
  /** CSS to inject into the page */
  htmlCss?: string;
  /** JavaScript to execute before screenshot */
  htmlScript?: string;
  /** Selector to wait for before rendering */
  htmlWaitForSelector?: string;
  /** Time to wait in ms before rendering */
  htmlWaitTime?: number;
  /** Device scale factor for high-DPI rendering */
  htmlDeviceScaleFactor?: number;
  /** Transparent background */
  htmlTransparent?: boolean;
  /** Tailwind CSS classes for container */
  htmlTailwindClasses?: string;
  /** React component name to render */
  htmlReactComponent?: HtmlReactComponent;
  /** Props for React component */
  htmlReactProps?: Record<string, unknown>;
}

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  anchorX?: number;
  anchorY?: number;
}

export interface StyleProperties {
  backgroundColor?: string;
  color?: string;
  borderRadius?: number;
  boxShadow?: string;
  filter?: string;
  mixBlendMode?: string;
}

// ============================================================================
// Three.js 3D Types
// ============================================================================

export interface ThreeSceneDefinition {
  backgroundColor?: string;
  camera?: {
    type: 'perspective' | 'orthographic';
    position?: [number, number, number];
    lookAt?: [number, number, number];
    fov?: number;
    zoom?: number;
  };
  lights?: ThreeLightDefinition[];
  objects?: ThreeObjectDefinition[];
}

export interface ThreeLightDefinition {
  type: 'ambient' | 'directional' | 'point' | 'spot';
  color?: string;
  intensity?: number;
  position?: [number, number, number];
}

export interface ThreeObjectDefinition {
  type: 'box' | 'sphere' | 'cylinder' | 'plane' | 'torus' | 'text' | 'gltf';
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color?: string;
  material?: 'basic' | 'standard' | 'phong' | 'lambert';
  opacity?: number;
  wireframe?: boolean;
  args?: number[];
  text?: string;
  url?: string;
  animation?: {
    property: 'rotation' | 'position' | 'scale';
    axis: 'x' | 'y' | 'z';
    speed: number;
  };
}

// Pre-configured 3D scene presets
export type ThreePreset =
  | 'rotatingCube'
  | 'floatingSpheres'
  | 'wireframeTorus'
  | 'productShowcase';

// ============================================================================
// Chart Types
// ============================================================================

export interface ChartData {
  series: ChartSeries[];
  labels?: string[];
  options?: ChartOptions;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartOptions {
  title?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showValues?: boolean;
  animation?: {
    enabled: boolean;
    duration: number;
    type?: 'draw' | 'grow' | 'fade';
  };
}

// ============================================================================
// Render Types
// ============================================================================

export interface RenderOptions {
  format: 'mp4' | 'webm' | 'gif' | 'mov' | 'png-sequence';
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores';
  quality?: 'low' | 'medium' | 'high' | 'lossless';
  crf?: number;
  bitrate?: string;
  frameRange?: {
    start: number;
    end: number;
  };
}

export type RenderStatus =
  | 'idle'
  | 'queued'
  | 'rendering'
  | 'encoding'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

export interface RenderProgress {
  jobId: string;
  status: RenderStatus;
  progress: number;
  currentFrame: number;
  totalFrames: number;
  eta?: number;
  previewFrame?: string;
  error?: string;
}

export interface RenderResult {
  jobId: string;
  success: boolean;
  outputUri?: string;
  duration?: number;
  fileSize?: number;
  error?: string;
}
