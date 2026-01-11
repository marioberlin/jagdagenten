import { z } from 'zod';

// Chat message schema
export const ChatMessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(32000)
});

// Chat request schema
export const ChatRequestSchema = z.object({
    provider: z.enum(['gemini', 'claude']).default('gemini'),
    messages: z.array(ChatMessageSchema).min(1).max(100)
});

// Chat response schema
export const ChatResponseSchema = z.object({
    response: z.string()
});

// Parallel chat request schema
export const ParallelChatRequestSchema = z.object({
    messages: z.array(ChatMessageSchema).min(1).max(100)
});

// Parallel chat response schema
export const ParallelChatResponseSchema = z.object({
    responses: z.object({
        gemini: z.string(),
        claude: z.string()
    }),
    timestamp: z.string().datetime({ offset: true })
});

// GraphQL request schema
export const GraphQLRequestSchema = z.object({
    query: z.string().min(1),
    variables: z.record(z.unknown()).optional()
});
