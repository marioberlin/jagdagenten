/**
 * Remote A2A Proxy Plugin
 * 
 * Proxies requests from frontend to remote A2A agents.
 * This is necessary in production since Vite's dev proxy isn't available.
 */
import { Elysia } from 'elysia';

interface RemoteAgentConfig {
    id: string;
    name: string;
    proxyPath: string;
    targetUrl: string;
    authType: 'none' | 'bearer' | 'api_key' | 'oauth';
    token?: string;
}

// Remote agent configurations (mirrored from frontend config)
const REMOTE_AGENTS: RemoteAgentConfig[] = [
    {
        id: 'remote-password',
        name: 'Password Generator',
        proxyPath: '/remote-a2a',
        targetUrl: 'https://wr-demo.showheroes.com',
        authType: 'bearer',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYjc3ZWNlYS0wZGQ3LTRmMDUtYjAwMy0yNDcwNzVkMTdjODkiLCJhZ2VudF9pZCI6IjYzNmEzMTVkLWE4M2EtNDMwOC1iOWMyLTJkMWE2YmE1OTBlZSIsIm1vZGUiOiJjb252ZXJzYXRpb24iLCJzY29wZSI6ImxpbWl0ZWQiLCJ0b2tlbl90eXBlIjoiYWdlbnQiLCJleHAiOjE5MjYzMzUzNzR9.4XwjmQW6NJxLH55KgDtsBxcfDsY2WRmg_-9yNmUd1B4',
    },
    {
        id: 'remote-oneflow',
        name: 'OneFlow Status Checker',
        proxyPath: '/remote-oneflow',
        targetUrl: 'https://wr-demo.showheroes.com',
        authType: 'bearer',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0N2IxODUzOC0yNGI2LTRmOTQtOTU3My1kYTA4MmVkMGYyOWUiLCJhZ2VudF9pZCI6IjE4MDZkY2IzLTkzZWYtNGI1Zi04Nzk2LWE2NDY0ZTI4OTA2NiIsIm1vZGUiOiJjb252ZXJzYXRpb24iLCJzY29wZSI6ImxpbWl0ZWQiLCJ0b2tlbl90eXBlIjoiYWdlbnQiLCJleHAiOjE5MjY3OTA2NzJ9.ZTgv0CL2JrS0NOZztDZQgB2a8I7NW-Uud5MihIk_PoQ',
    },
    {
        id: 'remote-wr-demo',
        name: 'WR-Demo Agent',
        proxyPath: '/remote-wr-demo',
        targetUrl: 'https://wr-demo.showheroes.com',
        authType: 'bearer',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZTllMjYxYy1jYWY4LTRhMGUtYjUyYS1lZjI2N2M0YjU0MjAiLCJhZ2VudF9pZCI6IjQyZDJiMzExLTk5MzItNDUzMy1hOTc2LTEyYzM2YzlkY2E1MiIsIm1vZGUiOiJjb252ZXJzYXRpb24iLCJzY29wZSI6ImxpbWl0ZWQiLCJ0b2tlbl90eXBlIjoiYWdlbnQiLCJleHAiOjE5MjcwOTk3NDN9.sJA-g54OqBpYujtzmagPbcwzDi4_V0YOvCoG8t7fhZU',
    },
];

/**
 * Create the remote A2A proxy plugin
 */
export function createRemoteA2AProxyPlugin() {
    const plugin = new Elysia({ name: 'remote-a2a-proxy' });

    // Register routes for each remote agent
    for (const agent of REMOTE_AGENTS) {
        // Handle all HTTP methods for the proxy path
        plugin.all(`${agent.proxyPath}/*`, async ({ request, params }) => {
            const wildcardPath = (params as { '*'?: string })['*'] || '';
            const targetPath = `${agent.targetUrl}/${wildcardPath}`;

            console.log(`[Remote A2A Proxy] ${request.method} ${agent.proxyPath}/* -> ${targetPath}`);

            try {
                // Build headers
                const headers: HeadersInit = {
                    'Content-Type': request.headers.get('content-type') || 'application/json',
                    'Accept': request.headers.get('accept') || 'application/json',
                };

                // Add authorization if configured
                if (agent.authType === 'bearer' && agent.token) {
                    headers['Authorization'] = `Bearer ${agent.token}`;
                }

                // Get request body for non-GET requests
                let body: string | undefined;
                if (request.method !== 'GET' && request.method !== 'HEAD') {
                    body = await request.text();
                }

                // Forward the request
                const response = await fetch(targetPath, {
                    method: request.method,
                    headers,
                    body,
                });

                // Get response body
                const responseText = await response.text();

                // Return the proxied response
                return new Response(responseText, {
                    status: response.status,
                    headers: {
                        'Content-Type': response.headers.get('content-type') || 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            } catch (error) {
                console.error(`[Remote A2A Proxy] Error proxying to ${targetPath}:`, error);
                return new Response(JSON.stringify({
                    error: 'Proxy error',
                    message: error instanceof Error ? error.message : 'Unknown error',
                }), {
                    status: 502,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        });

        // Handle OPTIONS for CORS preflight
        plugin.options(`${agent.proxyPath}/*`, () => {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
                    'Access-Control-Max-Age': '86400',
                },
            });
        });

        console.log(`[Remote A2A Proxy] Registered proxy: ${agent.proxyPath}/* -> ${agent.targetUrl}`);
    }

    return plugin;
}
