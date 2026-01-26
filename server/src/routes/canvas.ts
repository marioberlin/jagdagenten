/**
 * Canvas API Routes
 * 
 * REST API for canvas operations.
 */

import { Elysia, t } from 'elysia';
import { CanvasService } from '../canvas/canvas-service';
import { componentLoggers } from '../logger';

const logger = componentLoggers.http;

// Create service instance
const canvas = new CanvasService({
    basePath: process.env.CANVAS_BASE_PATH || './.canvas',
});

// Initialize on startup
canvas.initialize().catch(err => {
    logger.error({ error: err }, 'Failed to initialize canvas service');
});

// ============================================================================
// Routes
// ============================================================================

export const canvasRoutes = new Elysia({ prefix: '/api/v1/canvas' })
    // Navigate to a file or URL
    .post('/navigate', async ({ body }) => {
        const { sessionId, target } = body as any;

        try {
            const result = await canvas.navigate(sessionId, target);
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    })

    // Render content directly
    .post('/render', async ({ body }) => {
        const { sessionId, content, type = 'html' } = body as any;

        try {
            const result = await canvas.render(sessionId, content, type);
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    })

    // Execute JavaScript
    .post('/eval', async ({ body }) => {
        const { sessionId, code } = body as any;

        const result = await canvas.eval(sessionId, code);
        return result;
    })

    // Take a snapshot
    .post('/snapshot', async ({ body }) => {
        const { sessionId, format, selector } = body as any;

        const result = await canvas.snapshot(sessionId, { format, selector });
        return result;
    })

    // Write a file
    .post('/write', async ({ body }) => {
        const { sessionId, filename, content } = body as any;

        const result = await canvas.write(sessionId, filename, content);
        return result;
    })

    // Read a file
    .get('/read/:sessionId/:filename', async ({ params }) => {
        const result = await canvas.read(params.sessionId, params.filename);
        return result;
    }, {
        params: t.Object({
            sessionId: t.String(),
            filename: t.String(),
        }),
    })

    // List files
    .get('/list/:sessionId', async ({ params, query }) => {
        const files = await canvas.list(params.sessionId, (query as any).subdir);
        return { files };
    }, {
        params: t.Object({
            sessionId: t.String(),
        }),
    })

    // Get/set session mode
    .get('/mode/:sessionId', async ({ params }) => {
        const session = canvas.getSession(params.sessionId);
        return { mode: session.mode };
    }, {
        params: t.Object({
            sessionId: t.String(),
        }),
    })

    .post('/mode/:sessionId', async ({ params, body }) => {
        const { mode } = body as any;
        canvas.setMode(params.sessionId, mode);
        return { success: true, mode };
    }, {
        params: t.Object({
            sessionId: t.String(),
        }),
    })

    // Get session history
    .get('/history/:sessionId', async ({ params }) => {
        const session = canvas.getSession(params.sessionId);
        return { history: session.history };
    }, {
        params: t.Object({
            sessionId: t.String(),
        }),
    })

    // Canvas config
    .get('/config', async () => {
        return { config: canvas.getConfig() };
    })

    .post('/config', async ({ body }) => {
        canvas.updateConfig(body as any);
        return { success: true, config: canvas.getConfig() };
    });

export default canvasRoutes;
