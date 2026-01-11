/**
 * Smart Enhancement API Routes
 * 
 * API endpoints for AI-powered content enhancement using Gemini 3.5 Flash.
 */

import { Elysia } from 'elysia';
import { z } from 'zod';
import { createSmartRouter } from '../services/smart';

// Request validation schema
const SmartEnhanceSchema = z.object({
    content: z.unknown(),
    contentType: z.enum(['card', 'table', 'chart', 'text']),
    options: z.object({
        summarize: z.boolean().optional(),
        maxSummaryLength: z.number().optional(),
        suggestions: z.boolean().optional(),
        patterns: z.boolean().optional(),
        anomalies: z.boolean().optional(),
        insights: z.boolean().optional(),
        aiPrompt: z.string().optional(),
        model: z.string().optional(),
    }).optional(),
});

export const smartRoutes = new Elysia({ prefix: '/api/v1/smart' })
    .post('/enhance', async ({ request, set }) => {
        try {
            const body = await request.json();
            const { content, contentType, options } = SmartEnhanceSchema.parse(body);

            const router = createSmartRouter();
            const result = await router.enhance(contentType, content, options || {});

            return {
                success: true,
                result,
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    })
    .post('/summarize', async ({ request, set }) => {
        try {
            const body = await request.json();
            const { content, contentType } = z.object({
                content: z.string(),
                contentType: z.enum(['card', 'table', 'chart', 'text']),
            }).parse(body);

            const router = createSmartRouter();
            const result = await router.enhance(contentType, content, { summarize: true });

            return {
                success: true,
                summary: result.summary,
                meta: result.meta,
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    })
    .post('/patterns', async ({ request, set }) => {
        try {
            const body = await request.json();
            const { content, contentType } = z.object({
                content: z.unknown(),
                contentType: z.enum(['card', 'table', 'chart']),
            }).parse(body);

            const router = createSmartRouter();
            const result = await router.enhance(contentType, content, { patterns: true });

            return {
                success: true,
                patterns: result.patterns,
                meta: result.meta,
            };
        } catch (error) {
            set.status = 400;
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    })
    .get('/health', () => {
        return {
            status: 'ok',
            service: 'smart',
            model: 'gemini-3.5-flash',
        };
    });
