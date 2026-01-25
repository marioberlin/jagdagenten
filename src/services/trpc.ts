/**
 * tRPC Client for Frontend
 * 
 * Type-safe API client with end-to-end type inference from the server.
 */

import { createTRPCClient, httpBatchLink, createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../server/src/trpc/router';

// ============================================================================
// Configuration
// ============================================================================

const getBaseUrl = () => {
    // Browser - use relative path (proxied by Vite)
    if (typeof window !== 'undefined') {
        return '/api/trpc';
    }
    // Server-side or build - use full URL
    return process.env.API_URL || '/api/trpc';
};

// ============================================================================
// Vanilla Client (for non-React usage)
// ============================================================================

/**
 * Vanilla tRPC client for use outside React components
 * 
 * @example
 * const response = await trpcClient.ai.chat.mutate({
 *   provider: 'gemini',
 *   messages: [{ role: 'user', content: 'Hello' }]
 * });
 */
export const trpcClient = createTRPCClient<AppRouter>({
    links: [
        httpBatchLink({
            url: getBaseUrl(),
            headers: () => {
                // Add any auth headers here
                return {
                    'x-request-id': crypto.randomUUID(),
                };
            },
        }),
    ],
});

// ============================================================================
// React Query Client
// ============================================================================

/**
 * React Query hooks for tRPC
 * 
 * @example
 * // In a component:
 * const { data, isLoading } = trpc.health.status.useQuery();
 * const { mutate: sendMessage } = trpc.ai.chat.useMutation();
 */
export const trpc = createTRPCReact<AppRouter>();

// ============================================================================
// Type Re-exports
// ============================================================================

export type { AppRouter };
