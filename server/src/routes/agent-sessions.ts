/**
 * Agent Session Routes
 *
 * REST API endpoints for managing agent chat sessions.
 * Uses the A2A PostgreSQL stores for persistence.
 */

import { Elysia, t } from 'elysia';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { createMemoryDecontextualizer, type ConversationTurn } from '../agents/memory-decontextualizer.js';

// ============================================================================
// Types
// ============================================================================

interface AgentSession {
    id: string;
    agentId: string;
    title: string;
    preview: string;
    messageCount: number;
    createdAt: Date;
    lastActiveAt: Date;
    isArchived: boolean;
}

interface SessionMessage {
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
    error?: string;
}

interface SessionMemory {
    content: string;
    importance: number;
    extractedAt: Date;
    sourceMessageId?: string;
}

// ============================================================================
// Database Setup
// ============================================================================

const DATABASE_URL = process.env.DATABASE_URL;
let pool: Pool | null = null;

function getPool(): Pool {
    if (!pool && DATABASE_URL) {
        pool = new Pool({
            connectionString: DATABASE_URL,
            max: 10,
            idleTimeoutMillis: 30000,
        });
    }
    if (!pool) {
        throw new Error('Database not configured');
    }
    return pool;
}

async function initializeTable() {
    const pool = getPool();
    await pool.query(`
        CREATE TABLE IF NOT EXISTS agent_chat_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            agent_id VARCHAR(255) NOT NULL,
            title VARCHAR(500) NOT NULL,
            preview TEXT DEFAULT '',
            message_count INTEGER DEFAULT 0,
            messages JSONB DEFAULT '[]'::jsonb,
            memories JSONB DEFAULT '[]'::jsonb,
            is_archived BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            last_active_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent_id
        ON agent_chat_sessions (agent_id);

        CREATE INDEX IF NOT EXISTS idx_agent_sessions_last_active
        ON agent_chat_sessions (last_active_at DESC);
    `);
    console.log('[AgentSessions] Table initialized');
}

// Initialize on module load
if (DATABASE_URL) {
    initializeTable().catch(err => {
        console.error('[AgentSessions] Failed to initialize:', err);
    });
}

// ============================================================================
// Helper Functions
// ============================================================================

function deserializeSession(row: Record<string, unknown>): AgentSession {
    return {
        id: row.id as string,
        agentId: row.agent_id as string,
        title: row.title as string,
        preview: row.preview as string || '',
        messageCount: row.message_count as number || 0,
        createdAt: new Date(row.created_at as string),
        lastActiveAt: new Date(row.last_active_at as string),
        isArchived: row.is_archived as boolean || false,
    };
}

// ============================================================================
// Routes
// ============================================================================

export const agentSessionRoutes = new Elysia({ prefix: '/api/agent-sessions' })

    // List sessions for an agent
    .get('/:agentId', async ({ params }) => {
        const pool = getPool();
        const result = await pool.query(
            `SELECT * FROM agent_chat_sessions
             WHERE agent_id = $1 AND is_archived = FALSE
             ORDER BY last_active_at DESC
             LIMIT 50`,
            [params.agentId]
        );

        return {
            sessions: result.rows.map(deserializeSession),
        };
    }, {
        params: t.Object({
            agentId: t.String(),
        }),
    })

    // Create a new session
    .post('/:agentId', async ({ params, body }) => {
        const pool = getPool();
        const sessionId = randomUUID();

        const result = await pool.query(
            `INSERT INTO agent_chat_sessions (id, agent_id, title)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [sessionId, params.agentId, body.title]
        );

        return {
            session: deserializeSession(result.rows[0]),
        };
    }, {
        params: t.Object({
            agentId: t.String(),
        }),
        body: t.Object({
            title: t.String(),
        }),
    })

    // Update a session
    .patch('/:agentId/:sessionId', async ({ params, body }) => {
        const pool = getPool();
        const updates: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;

        if (body.title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(body.title);
        }
        if (body.isArchived !== undefined) {
            updates.push(`is_archived = $${paramIndex++}`);
            values.push(body.isArchived);
        }

        updates.push('last_active_at = NOW()');
        values.push(params.sessionId);

        await pool.query(
            `UPDATE agent_chat_sessions
             SET ${updates.join(', ')}
             WHERE id = $${paramIndex}`,
            values
        );

        return { success: true };
    }, {
        params: t.Object({
            agentId: t.String(),
            sessionId: t.String(),
        }),
        body: t.Object({
            title: t.Optional(t.String()),
            isArchived: t.Optional(t.Boolean()),
        }),
    })

    // Delete a session
    .delete('/:agentId/:sessionId', async ({ params }) => {
        const pool = getPool();
        await pool.query(
            `DELETE FROM agent_chat_sessions WHERE id = $1`,
            [params.sessionId]
        );

        return { success: true };
    }, {
        params: t.Object({
            agentId: t.String(),
            sessionId: t.String(),
        }),
    })

    // Get messages for a session
    .get('/:agentId/:sessionId/messages', async ({ params }) => {
        const pool = getPool();
        const result = await pool.query(
            `SELECT messages FROM agent_chat_sessions WHERE id = $1`,
            [params.sessionId]
        );

        if (result.rows.length === 0) {
            return { messages: [] };
        }

        const messages = result.rows[0].messages;
        return {
            messages: (typeof messages === 'string' ? JSON.parse(messages) : messages) as SessionMessage[],
        };
    }, {
        params: t.Object({
            agentId: t.String(),
            sessionId: t.String(),
        }),
    })

    // Save messages for a session
    .put('/:agentId/:sessionId/messages', async ({ params, body }) => {
        const pool = getPool();
        const messages = body.messages;
        const lastMessage = messages[messages.length - 1];
        const preview = lastMessage?.content?.substring(0, 100) || '';

        await pool.query(
            `UPDATE agent_chat_sessions
             SET messages = $1,
                 message_count = $2,
                 preview = $3,
                 last_active_at = NOW()
             WHERE id = $4`,
            [JSON.stringify(messages), messages.length, preview, params.sessionId]
        );

        return { success: true };
    }, {
        params: t.Object({
            agentId: t.String(),
            sessionId: t.String(),
        }),
        body: t.Object({
            messages: t.Array(t.Object({
                id: t.String(),
                role: t.Union([t.Literal('user'), t.Literal('agent')]),
                content: t.String(),
                timestamp: t.Union([t.String(), t.Date()]),
                error: t.Optional(t.String()),
            })),
        }),
    })

    // Add a memory to a session
    .post('/:agentId/:sessionId/memories', async ({ params, body }) => {
        const pool = getPool();

        // Append memory to the memories array
        await pool.query(
            `UPDATE agent_chat_sessions
             SET memories = memories || $1::jsonb,
                 last_active_at = NOW()
             WHERE id = $2`,
            [JSON.stringify([body.memory]), params.sessionId]
        );

        return { success: true };
    }, {
        params: t.Object({
            agentId: t.String(),
            sessionId: t.String(),
        }),
        body: t.Object({
            memory: t.Object({
                content: t.String(),
                importance: t.Number(),
                extractedAt: t.Union([t.String(), t.Date()]),
                sourceMessageId: t.Optional(t.String()),
            }),
        }),
    })

    // Get memories for a session
    .get('/:agentId/:sessionId/memories', async ({ params }) => {
        const pool = getPool();
        const result = await pool.query(
            `SELECT memories FROM agent_chat_sessions WHERE id = $1`,
            [params.sessionId]
        );

        if (result.rows.length === 0) {
            return { memories: [] };
        }

        const memories = result.rows[0].memories;
        return {
            memories: (typeof memories === 'string' ? JSON.parse(memories) : memories) as SessionMemory[],
        };
    }, {
        params: t.Object({
            agentId: t.String(),
            sessionId: t.String(),
        }),
    })

    // Extract memory from a message using decontextualizer
    .post('/:agentId/:sessionId/extract-memory', async ({ params, body }) => {
        const pool = getPool();
        const decontextualizer = createMemoryDecontextualizer();

        // Get recent messages for context
        const result = await pool.query(
            `SELECT messages FROM agent_chat_sessions WHERE id = $1`,
            [params.sessionId]
        );

        if (result.rows.length === 0) {
            return { error: 'Session not found' };
        }

        const messagesRaw = result.rows[0].messages;
        const messages = (typeof messagesRaw === 'string' ? JSON.parse(messagesRaw) : messagesRaw) as SessionMessage[];

        // Convert to conversation turns for decontextualizer
        const conversationContext: ConversationTurn[] = messages
            .slice(-6) // Last 6 messages for context
            .map(msg => ({
                role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
                content: msg.content,
                timestamp: new Date(msg.timestamp),
            }));

        // Decontextualize the content
        const decontextResult = await decontextualizer.decontextualize(
            body.content,
            conversationContext
        );

        if (!decontextResult.wasResolved && !body.forceStore) {
            return {
                extracted: false,
                reason: 'Content is already self-contained or could not be resolved',
                original: body.content,
            };
        }

        // Calculate importance (basic heuristic - can be enhanced)
        const importance = calculateImportance(decontextResult.resolved);

        // Create the memory entry
        const memory: SessionMemory = {
            content: decontextResult.resolved,
            importance,
            extractedAt: new Date(),
            sourceMessageId: body.sourceMessageId,
        };

        // Store the memory
        await pool.query(
            `UPDATE agent_chat_sessions
             SET memories = memories || $1::jsonb,
                 last_active_at = NOW()
             WHERE id = $2`,
            [JSON.stringify([memory]), params.sessionId]
        );

        return {
            extracted: true,
            memory,
            wasResolved: decontextResult.wasResolved,
            original: decontextResult.original,
        };
    }, {
        params: t.Object({
            agentId: t.String(),
            sessionId: t.String(),
        }),
        body: t.Object({
            content: t.String(),
            sourceMessageId: t.Optional(t.String()),
            forceStore: t.Optional(t.Boolean()),
        }),
    })

    // Batch extract memories from multiple messages
    .post('/:agentId/:sessionId/extract-memories-batch', async ({ params, body }) => {
        const pool = getPool();
        const decontextualizer = createMemoryDecontextualizer();

        // Get recent messages for context
        const result = await pool.query(
            `SELECT messages FROM agent_chat_sessions WHERE id = $1`,
            [params.sessionId]
        );

        if (result.rows.length === 0) {
            return { error: 'Session not found' };
        }

        const messagesRaw = result.rows[0].messages;
        const messages = (typeof messagesRaw === 'string' ? JSON.parse(messagesRaw) : messagesRaw) as SessionMessage[];

        // Convert to conversation turns for decontextualizer
        const conversationContext: ConversationTurn[] = messages
            .slice(-6)
            .map(msg => ({
                role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
                content: msg.content,
                timestamp: new Date(msg.timestamp),
            }));

        // Process each content item
        const results = await decontextualizer.decontextualizeBatch(
            body.contents,
            conversationContext
        );

        // Create memory entries for resolved content
        const memories: SessionMemory[] = [];
        const extractedResults: Array<{
            original: string;
            resolved: string;
            wasResolved: boolean;
            stored: boolean;
        }> = [];

        for (let i = 0; i < results.length; i++) {
            const decontextResult = results[i];

            if (decontextResult.wasResolved || body.forceStore) {
                const memory: SessionMemory = {
                    content: decontextResult.resolved,
                    importance: calculateImportance(decontextResult.resolved),
                    extractedAt: new Date(),
                    sourceMessageId: body.sourceMessageIds?.[i],
                };
                memories.push(memory);
                extractedResults.push({
                    original: decontextResult.original,
                    resolved: decontextResult.resolved,
                    wasResolved: decontextResult.wasResolved,
                    stored: true,
                });
            } else {
                extractedResults.push({
                    original: decontextResult.original,
                    resolved: decontextResult.resolved,
                    wasResolved: false,
                    stored: false,
                });
            }
        }

        // Store all memories at once
        if (memories.length > 0) {
            await pool.query(
                `UPDATE agent_chat_sessions
                 SET memories = memories || $1::jsonb,
                     last_active_at = NOW()
                 WHERE id = $2`,
                [JSON.stringify(memories), params.sessionId]
            );
        }

        return {
            extracted: memories.length,
            total: body.contents.length,
            results: extractedResults,
        };
    }, {
        params: t.Object({
            agentId: t.String(),
            sessionId: t.String(),
        }),
        body: t.Object({
            contents: t.Array(t.String()),
            sourceMessageIds: t.Optional(t.Array(t.String())),
            forceStore: t.Optional(t.Boolean()),
        }),
    });

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate importance score for a memory (0-100)
 * Uses heuristics based on content characteristics
 */
function calculateImportance(content: string): number {
    let score = 50; // Base score

    // Keywords that indicate high importance
    const highImportanceKeywords = [
        'prefer', 'always', 'never', 'important', 'remember',
        'don\'t forget', 'key', 'critical', 'must', 'should',
        'like', 'dislike', 'hate', 'love', 'favorite',
    ];

    // Keywords that indicate lower importance
    const lowImportanceKeywords = [
        'maybe', 'perhaps', 'sometimes', 'might', 'could',
        'not sure', 'think', 'guess',
    ];

    const lowerContent = content.toLowerCase();

    // Adjust for high importance keywords
    for (const keyword of highImportanceKeywords) {
        if (lowerContent.includes(keyword)) {
            score += 10;
        }
    }

    // Adjust for low importance keywords
    for (const keyword of lowImportanceKeywords) {
        if (lowerContent.includes(keyword)) {
            score -= 5;
        }
    }

    // Longer content is generally more important
    if (content.length > 100) score += 5;
    if (content.length > 200) score += 5;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, score));
}

export default agentSessionRoutes;
