/**
 * Remote Agent Configuration
 * 
 * Single source of truth for remote A2A agent connectivity.
 * This file contains all configuration needed to connect to external agents.
 * 
 * IMPORTANT: In production, tokens should be stored in environment variables
 * or a secure secrets manager, not in code.
 */

export interface RemoteAgentConfig {
    /** Agent ID matching registry.ts */
    id: string;
    /** Display name */
    name: string;
    /** Local proxy path (e.g., '/remote-a2a') */
    proxyPath: string;
    /** Remote target URL */
    targetUrl: string;
    /** Authentication type */
    authType: 'none' | 'bearer' | 'api_key' | 'oauth';
    /** Bearer token or API key (for dev - use env vars in production) */
    token?: string;
    /** Whether to change origin header */
    changeOrigin?: boolean;
}

/**
 * All remote agent configurations
 * Add new remote agents here
 */
export const REMOTE_AGENTS: RemoteAgentConfig[] = [
    {
        id: 'remote-password',
        name: 'Password Generator',
        proxyPath: '/remote-a2a',
        targetUrl: 'https://wr-demo.showheroes.com',
        authType: 'bearer',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYjc3ZWNlYS0wZGQ3LTRmMDUtYjAwMy0yNDcwNzVkMTdjODkiLCJhZ2VudF9pZCI6IjYzNmEzMTVkLWE4M2EtNDMwOC1iOWMyLTJkMWE2YmE1OTBlZSIsIm1vZGUiOiJjb252ZXJzYXRpb24iLCJzY29wZSI6ImxpbWl0ZWQiLCJ0b2tlbl90eXBlIjoiYWdlbnQiLCJleHAiOjE5MjYzMzUzNzR9.4XwjmQW6NJxLH55KgDtsBxcfDsY2WRmg_-9yNmUd1B4',
        changeOrigin: true,
    },
    {
        id: 'remote-oneflow',
        name: 'OneFlow Status Checker',
        proxyPath: '/remote-oneflow',
        targetUrl: 'https://wr-demo.showheroes.com',
        authType: 'bearer',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0N2IxODUzOC0yNGI2LTRmOTQtOTU3My1kYTA4MmVkMGYyOWUiLCJhZ2VudF9pZCI6IjE4MDZkY2IzLTkzZWYtNGI1Zi04Nzk2LWE2NDY0ZTI4OTA2NiIsIm1vZGUiOiJjb252ZXJzYXRpb24iLCJzY29wZSI6ImxpbWl0ZWQiLCJ0b2tlbl90eXBlIjoiYWdlbnQiLCJleHAiOjE5MjY3OTA2NzJ9.ZTgv0CL2JrS0NOZztDZQgB2a8I7NW-Uud5MihIk_PoQ',
        changeOrigin: true,
    },
    {
        id: 'remote-wr-demo',
        name: 'WR-Demo Agent',
        proxyPath: '/remote-wr-demo',
        targetUrl: 'https://wr-demo.showheroes.com',
        authType: 'bearer',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZTllMjYxYy1jYWY4LTRhMGUtYjUyYS1lZjI2N2M0YjU0MjAiLCJhZ2VudF9pZCI6IjQyZDJiMzExLTk5MzItNDUzMy1hOTc2LTEyYzM2YzlkY2E1MiIsIm1vZGUiOiJjb252ZXJzYXRpb24iLCJzY29wZSI6ImxpbWl0ZWQiLCJ0b2tlbl90eXBlIjoiYWdlbnQiLCJleHAiOjE5MjcwOTk3NDN9.sJA-g54OqBpYujtzmagPbcwzDi4_V0YOvCoG8t7fhZU',
        changeOrigin: true,
    },
];

/**
 * Get remote agent config by ID
 */
export function getRemoteAgentConfig(id: string): RemoteAgentConfig | undefined {
    return REMOTE_AGENTS.find(a => a.id === id);
}

/**
 * Get remote agent config by proxy path
 */
export function getRemoteAgentByPath(proxyPath: string): RemoteAgentConfig | undefined {
    return REMOTE_AGENTS.find(a => a.proxyPath === proxyPath);
}

/**
 * Build Vite proxy configuration from remote agents
 * Use this in vite.config.ts
 */
export function buildViteProxyConfig(): Record<string, any> {
    const proxyConfig: Record<string, any> = {};

    for (const agent of REMOTE_AGENTS) {
        proxyConfig[agent.proxyPath] = {
            target: agent.targetUrl,
            changeOrigin: agent.changeOrigin ?? true,
            secure: true,
            ...(agent.authType === 'bearer' && agent.token ? {
                headers: {
                    'Authorization': `Bearer ${agent.token}`
                }
            } : {}),
            rewrite: (path: string) => {
                // Extract the path after the proxy prefix
                const agentPath = agent.targetUrl.replace(/^https?:\/\/[^/]+/, '');
                const suffix = path.replace(new RegExp(`^${agent.proxyPath}\\/?`), '');
                // Ensure proper path joining
                const fullPath = agentPath.endsWith('/')
                    ? `${agentPath}${suffix}`
                    : `${agentPath}/${suffix}`;
                return fullPath;
            },
        };
    }

    return proxyConfig;
}
