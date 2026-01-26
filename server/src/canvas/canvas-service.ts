/**
 * Canvas Service
 * 
 * Dual-mode canvas rendering system for agent-driven UI.
 * 
 * Modes:
 * - HTML: File-based, hot-reload, simple HTML/CSS/JS
 * - Glass: TSX with live bundling via esbuild
 * 
 * Features:
 * - canvas.navigate: Navigate to a URL or file
 * - canvas.eval: Execute JavaScript in canvas context
 * - canvas.snapshot: Capture canvas as image
 * - Hot-reload for file changes
 * - Session-scoped or global canvas
 */

import { promises as fs } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { watch, type FSWatcher } from 'fs';
import { EventEmitter } from 'events';

// ============================================================================
// Types
// ============================================================================

export type CanvasMode = 'auto' | 'html' | 'glass';

export interface CanvasConfig {
    /** Base directory for canvas files */
    basePath: string;

    /** Default rendering mode */
    mode: CanvasMode;

    /** Enable hot-reload */
    hotReload: boolean;

    /** Port for dev server */
    devServerPort: number;

    /** Enable TypeScript/TSX bundling */
    enableBundling: boolean;
}

export interface CanvasSession {
    id: string;
    mode: CanvasMode;
    currentFile?: string;
    currentUrl?: string;
    history: string[];
    createdAt: Date;
    lastActiveAt: Date;
}

export interface CanvasFile {
    path: string;
    content: string;
    type: 'html' | 'css' | 'js' | 'tsx' | 'json';
    lastModified: Date;
}

export interface RenderResult {
    html: string;
    css?: string;
    js?: string;
    errors?: string[];
}

export interface SnapshotResult {
    success: boolean;
    imagePath?: string;
    error?: string;
}

export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
    basePath: './.canvas',
    mode: 'auto',
    hotReload: true,
    devServerPort: 3100,
    enableBundling: true,
};

// ============================================================================
// Canvas Service
// ============================================================================

export class CanvasService extends EventEmitter {
    private config: CanvasConfig;
    private sessions = new Map<string, CanvasSession>();
    private watcher: FSWatcher | null = null;
    private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

    constructor(config?: Partial<CanvasConfig>) {
        super();
        this.config = { ...DEFAULT_CANVAS_CONFIG, ...config };
    }

    // ============================================================================
    // Lifecycle
    // ============================================================================

    async initialize(): Promise<void> {
        // Ensure directories exist
        await fs.mkdir(join(this.config.basePath, 'global'), { recursive: true });
        await fs.mkdir(join(this.config.basePath, 'sessions'), { recursive: true });
        await fs.mkdir(join(this.config.basePath, 'templates'), { recursive: true });

        // Create default template if not exists
        await this.ensureDefaultTemplate();

        // Start file watcher if hot-reload enabled
        if (this.config.hotReload) {
            this.startWatcher();
        }

        console.info(`[Canvas] Initialized at ${this.config.basePath}`);
    }

    async shutdown(): Promise<void> {
        this.stopWatcher();
        this.sessions.clear();
    }

    // ============================================================================
    // Session Management
    // ============================================================================

    /**
     * Create or get canvas session
     */
    getSession(sessionId: string): CanvasSession {
        let session = this.sessions.get(sessionId);

        if (!session) {
            session = {
                id: sessionId,
                mode: this.config.mode,
                history: [],
                createdAt: new Date(),
                lastActiveAt: new Date(),
            };
            this.sessions.set(sessionId, session);
        }

        return session;
    }

    /**
     * Set session mode
     */
    setMode(sessionId: string, mode: CanvasMode): void {
        const session = this.getSession(sessionId);
        session.mode = mode;
        this.emit('mode-change', { sessionId, mode });
    }

    /**
     * Get session directory
     */
    getSessionDir(sessionId: string): string {
        return join(this.config.basePath, 'sessions', sessionId);
    }

    // ============================================================================
    // Canvas Tools
    // ============================================================================

    /**
     * canvas.navigate - Navigate to a file or URL
     */
    async navigate(sessionId: string, target: string): Promise<RenderResult> {
        const session = this.getSession(sessionId);
        session.lastActiveAt = new Date();
        session.history.push(target);

        // Determine if file or URL
        if (target.startsWith('http://') || target.startsWith('https://')) {
            session.currentUrl = target;
            session.currentFile = undefined;

            return {
                html: `<iframe src="${target}" style="width:100%;height:100%;border:none;"></iframe>`,
            };
        }

        // Load file
        const filePath = this.resolveFilePath(sessionId, target);
        session.currentFile = filePath;
        session.currentUrl = undefined;

        return this.renderFile(filePath, session.mode);
    }

    /**
     * canvas.render - Render HTML/TSX content directly
     */
    async render(sessionId: string, content: string, type: 'html' | 'tsx' = 'html'): Promise<RenderResult> {
        const session = this.getSession(sessionId);
        session.lastActiveAt = new Date();

        const mode = session.mode === 'auto'
            ? (type === 'tsx' ? 'glass' : 'html')
            : session.mode;

        if (type === 'tsx' && mode === 'glass') {
            return this.bundleTSX(content);
        }

        return { html: content };
    }

    /**
     * canvas.eval - Execute JavaScript in canvas context
     */
    async eval(sessionId: string, code: string): Promise<{ success: boolean; result?: unknown; error?: string }> {
        const session = this.getSession(sessionId);
        session.lastActiveAt = new Date();

        // In a real implementation, this would communicate with a sandboxed iframe
        // For now, return the code as a script tag to be executed client-side
        return {
            success: true,
            result: `<script>${code}</script>`,
        };
    }

    /**
     * canvas.snapshot - Capture canvas as image
     */
    async snapshot(sessionId: string, options?: {
        format?: 'png' | 'jpeg' | 'webp';
        quality?: number;
        selector?: string;
    }): Promise<SnapshotResult> {
        const session = this.getSession(sessionId);
        session.lastActiveAt = new Date();

        // In a real implementation, this would use puppeteer or a headless browser
        // For now, return a placeholder indicating the snapshot request
        const snapshotId = `snapshot-${Date.now()}`;
        const imagePath = join(
            this.getSessionDir(sessionId),
            'snapshots',
            `${snapshotId}.${options?.format ?? 'png'}`
        );

        await fs.mkdir(dirname(imagePath), { recursive: true });

        // Emit event for frontend to capture
        this.emit('snapshot-request', {
            sessionId,
            snapshotId,
            imagePath,
            options,
        });

        return {
            success: true,
            imagePath,
        };
    }

    /**
     * canvas.write - Write content to a canvas file
     */
    async write(sessionId: string, filename: string, content: string): Promise<{ success: boolean; path: string }> {
        const session = this.getSession(sessionId);
        session.lastActiveAt = new Date();

        const filePath = join(this.getSessionDir(sessionId), filename);
        await fs.mkdir(dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');

        return { success: true, path: filePath };
    }

    /**
     * canvas.read - Read content from a canvas file
     */
    async read(sessionId: string, filename: string): Promise<{ success: boolean; content?: string; error?: string }> {
        try {
            const filePath = join(this.getSessionDir(sessionId), filename);
            const content = await fs.readFile(filePath, 'utf-8');
            return { success: true, content };
        } catch (error) {
            return { success: false, error: `File not found: ${filename}` };
        }
    }

    /**
     * canvas.list - List files in canvas directory
     */
    async list(sessionId: string, subdir?: string): Promise<string[]> {
        try {
            const dir = subdir
                ? join(this.getSessionDir(sessionId), subdir)
                : this.getSessionDir(sessionId);

            const entries = await fs.readdir(dir, { withFileTypes: true });
            return entries.map(e => e.isDirectory() ? `${e.name}/` : e.name);
        } catch {
            return [];
        }
    }

    // ============================================================================
    // Rendering
    // ============================================================================

    /**
     * Render a canvas file
     */
    private async renderFile(filePath: string, mode: CanvasMode): Promise<RenderResult> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const ext = extname(filePath).toLowerCase();

            // Determine actual mode
            const actualMode = mode === 'auto'
                ? (ext === '.tsx' || ext === '.jsx' ? 'glass' : 'html')
                : mode;

            if (actualMode === 'glass' && (ext === '.tsx' || ext === '.jsx')) {
                return this.bundleTSX(content);
            }

            // For HTML mode, just return the content
            if (ext === '.html') {
                return { html: content };
            }

            // For other files, wrap appropriately
            if (ext === '.css') {
                return { html: '', css: content };
            }

            if (ext === '.js') {
                return { html: '', js: content };
            }

            return { html: content };
        } catch (error) {
            return {
                html: `<div class="error">Failed to render: ${filePath}</div>`,
                errors: [(error as Error).message],
            };
        }
    }

    /**
     * Bundle TSX content (Glass mode)
     */
    private async bundleTSX(content: string): Promise<RenderResult> {
        if (!this.config.enableBundling) {
            return {
                html: `<div class="error">TSX bundling is disabled</div>`,
                errors: ['Bundling disabled in config'],
            };
        }

        try {
            // Dynamic import esbuild only when needed
            const esbuild = await import('esbuild');

            const result = await esbuild.transform(content, {
                loader: 'tsx',
                jsx: 'automatic',
                target: 'es2020',
            });

            // Wrap in a self-contained HTML document
            const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    ${result.code}
    
    // Auto-render if there's a default export
    if (typeof App !== 'undefined') {
      ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
    }
  </script>
</body>
</html>`;

            return {
                html,
                js: result.code,
                errors: result.warnings.map(w => w.text),
            };
        } catch (error) {
            return {
                html: `<div class="error">TSX compilation failed</div>`,
                errors: [(error as Error).message],
            };
        }
    }

    // ============================================================================
    // File Watcher (Hot Reload)
    // ============================================================================

    private startWatcher(): void {
        if (this.watcher) return;

        try {
            this.watcher = watch(this.config.basePath, { recursive: true }, (_event, filename) => {
                if (!filename) return;

                // Debounce
                const key = filename;
                const existing = this.debounceTimers.get(key);
                if (existing) clearTimeout(existing);

                this.debounceTimers.set(key, setTimeout(() => {
                    this.debounceTimers.delete(key);

                    // Determine which session(s) to notify
                    const parts = filename.split('/');
                    if (parts[0] === 'sessions' && parts[1]) {
                        const sessionId = parts[1];
                        this.emit('file-change', { sessionId, filename });
                    } else if (parts[0] === 'global') {
                        // Notify all sessions
                        for (const sessionId of this.sessions.keys()) {
                            this.emit('file-change', { sessionId, filename });
                        }
                    }
                }, 200));
            });

            console.info('[Canvas] Hot-reload watcher started');
        } catch (err) {
            console.error('[Canvas] Failed to start watcher:', err);
        }
    }

    private stopWatcher(): void {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();
    }

    // ============================================================================
    // Helpers
    // ============================================================================

    private resolveFilePath(sessionId: string, target: string): string {
        // Check session directory first
        const sessionPath = join(this.getSessionDir(sessionId), target);

        // Fall back to global
        const globalPath = join(this.config.basePath, 'global', target);

        // Could add async existence check here, but return session path for simplicity
        return sessionPath;
    }

    private async ensureDefaultTemplate(): Promise<void> {
        const templatePath = join(this.config.basePath, 'templates', 'default.html');

        try {
            await fs.access(templatePath);
        } catch {
            const defaultTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Canvas</title>
  <style>
    :root {
      --bg: #0a0a0a;
      --fg: #fafafa;
      --accent: #3b82f6;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--fg);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 800px;
      padding: 2rem;
      text-align: center;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, var(--accent), #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p { color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Canvas Ready</h1>
    <p>Use canvas.navigate() or canvas.render() to display content.</p>
  </div>
</body>
</html>`;

            await fs.writeFile(templatePath, defaultTemplate, 'utf-8');
        }
    }

    /**
     * Get config
     */
    getConfig(): CanvasConfig {
        return { ...this.config };
    }

    /**
     * Update config
     */
    updateConfig(updates: Partial<CanvasConfig>): void {
        this.config = { ...this.config, ...updates };
    }
}

// ============================================================================
// Tool Declarations (A2A Format)
// ============================================================================

export const CANVAS_TOOL_DECLARATIONS = [
    {
        name: 'canvas.navigate',
        description: 'Navigate the canvas to a file or URL. Supports HTML files and external URLs.',
        parameters: {
            type: 'object',
            properties: {
                target: {
                    type: 'string',
                    description: 'File path (relative to canvas dir) or URL to navigate to',
                },
            },
            required: ['target'],
        },
    },
    {
        name: 'canvas.render',
        description: 'Render HTML or TSX content directly to the canvas.',
        parameters: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'HTML or TSX content to render',
                },
                type: {
                    type: 'string',
                    enum: ['html', 'tsx'],
                    description: 'Content type (default: html)',
                },
            },
            required: ['content'],
        },
    },
    {
        name: 'canvas.eval',
        description: 'Execute JavaScript code in the canvas context.',
        parameters: {
            type: 'object',
            properties: {
                code: {
                    type: 'string',
                    description: 'JavaScript code to execute',
                },
            },
            required: ['code'],
        },
    },
    {
        name: 'canvas.snapshot',
        description: 'Capture the current canvas as an image.',
        parameters: {
            type: 'object',
            properties: {
                format: {
                    type: 'string',
                    enum: ['png', 'jpeg', 'webp'],
                    description: 'Image format (default: png)',
                },
                selector: {
                    type: 'string',
                    description: 'CSS selector to capture (default: entire canvas)',
                },
            },
        },
    },
    {
        name: 'canvas.write',
        description: 'Write content to a file in the canvas directory.',
        parameters: {
            type: 'object',
            properties: {
                filename: {
                    type: 'string',
                    description: 'Filename to write to',
                },
                content: {
                    type: 'string',
                    description: 'File content',
                },
            },
            required: ['filename', 'content'],
        },
    },
    {
        name: 'canvas.read',
        description: 'Read content from a file in the canvas directory.',
        parameters: {
            type: 'object',
            properties: {
                filename: {
                    type: 'string',
                    description: 'Filename to read',
                },
            },
            required: ['filename'],
        },
    },
    {
        name: 'canvas.list',
        description: 'List files in the canvas directory.',
        parameters: {
            type: 'object',
            properties: {
                subdir: {
                    type: 'string',
                    description: 'Subdirectory to list (optional)',
                },
            },
        },
    },
];

// ============================================================================
// Factory
// ============================================================================

export function createCanvasService(config?: Partial<CanvasConfig>): CanvasService {
    return new CanvasService(config);
}

export default CanvasService;
