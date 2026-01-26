/**
 * Canvas Module
 * 
 * Dual-mode canvas rendering system for agent-driven UI.
 * Supports HTML mode (file-based) and Glass mode (TSX with live bundling).
 */

export {
    CanvasService,
    createCanvasService,
    CANVAS_TOOL_DECLARATIONS,
    DEFAULT_CANVAS_CONFIG,
    type CanvasConfig,
    type CanvasMode,
    type CanvasSession,
    type CanvasFile,
    type RenderResult,
    type SnapshotResult,
} from './canvas-service';
