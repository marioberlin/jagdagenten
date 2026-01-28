/**
 * Agent UX Configuration Loader
 *
 * Handles loading agentUX_{agent-id}.md files from the application directory.
 * Uses Vite's import.meta.glob for static file discovery.
 */

import { AgentUXConfig, DEFAULT_AGENT_UX_CONFIG, DEFAULT_COMPONENT_CATALOG } from './schema';
import { parseAgentUXConfig, validateAgentUXConfig } from './parser';

// ============================================================================
// File Discovery
// ============================================================================

// Use Vite's glob import to discover all agentUX_*.md files at build time
const uxModules = import.meta.glob('/src/applications/agent-chat/agentUX_*.md', {
    query: '?raw',
    import: 'default',
});

// Cache for loaded configurations
const configCache = new Map<string, AgentUXConfig>();

// ============================================================================
// Loader Functions
// ============================================================================

/**
 * Get the file path for an agent's UX configuration.
 */
function getUXFilePath(agentId: string): string {
    // Sanitize agent ID for use in filename
    const safeId = agentId.replace(/[^a-zA-Z0-9-_]/g, '-');
    return `/src/applications/agent-chat/agentUX_${safeId}.md`;
}

/**
 * Load the UX configuration for a specific agent.
 * Falls back to default configuration if agent-specific file doesn't exist.
 *
 * @param agentId - The agent ID (e.g., "remote-wr-demo", "local-assistant")
 * @returns The parsed AgentUXConfig
 */
export async function loadAgentUXConfig(agentId: string): Promise<AgentUXConfig> {
    // Check cache first
    if (configCache.has(agentId)) {
        return configCache.get(agentId)!;
    }

    const filePath = getUXFilePath(agentId);

    // Try to load agent-specific config
    if (uxModules[filePath]) {
        try {
            const content = await uxModules[filePath]() as string;
            const config = parseAgentUXConfig(content, agentId);

            // Validate config
            const errors = validateAgentUXConfig(config);
            if (errors.length > 0) {
                console.warn(`[AgentUX] Validation warnings for ${agentId}:`, errors);
            }

            // Cache and return
            configCache.set(agentId, config);
            return config;
        } catch (error) {
            console.error(`[AgentUX] Failed to load config for ${agentId}:`, error);
        }
    }

    // Try to load default config
    const defaultPath = '/src/applications/agent-chat/agentUX_default.md';
    if (uxModules[defaultPath]) {
        try {
            const content = await uxModules[defaultPath]() as string;
            const config = parseAgentUXConfig(content, agentId);

            // Override agent ID
            config.agent = agentId;

            // Cache and return
            configCache.set(agentId, config);
            return config;
        } catch (error) {
            console.error(`[AgentUX] Failed to load default config:`, error);
        }
    }

    // Fall back to hardcoded default
    const fallbackConfig: AgentUXConfig = {
        ...DEFAULT_AGENT_UX_CONFIG,
        agent: agentId,
        components: DEFAULT_COMPONENT_CATALOG,
    };

    configCache.set(agentId, fallbackConfig);
    return fallbackConfig;
}

/**
 * Clear the configuration cache for an agent or all agents.
 */
export function clearUXConfigCache(agentId?: string): void {
    if (agentId) {
        configCache.delete(agentId);
    } else {
        configCache.clear();
    }
}

/**
 * Get all available agent UX configurations.
 * Returns agent IDs that have custom UX files.
 */
export function getAvailableAgentUXConfigs(): string[] {
    const agentIds: string[] = [];
    const pattern = /\/agentUX_(.+)\.md$/;

    for (const path of Object.keys(uxModules)) {
        const match = path.match(pattern);
        if (match && match[1] !== 'default') {
            agentIds.push(match[1]);
        }
    }

    return agentIds;
}

/**
 * Check if an agent has a custom UX configuration file.
 */
export function hasAgentUXConfig(agentId: string): boolean {
    const filePath = getUXFilePath(agentId);
    return filePath in uxModules;
}

// ============================================================================
// React Hook
// ============================================================================

import { useState, useEffect } from 'react';

/**
 * React hook to load and use an agent's UX configuration.
 *
 * @param agentId - The agent ID
 * @returns The loaded configuration and loading state
 */
export function useAgentUXConfig(agentId: string | null): {
    config: AgentUXConfig | null;
    isLoading: boolean;
    error: Error | null;
} {
    const [config, setConfig] = useState<AgentUXConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!agentId) {
            setConfig(null);
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        setIsLoading(true);
        setError(null);

        loadAgentUXConfig(agentId)
            .then((loadedConfig) => {
                if (!cancelled) {
                    setConfig(loadedConfig);
                    setIsLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err);
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [agentId]);

    return { config, isLoading, error };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Merge a partial config with the default config.
 * Useful for applying overrides.
 */
export function mergeWithDefaults(
    partial: Partial<AgentUXConfig>,
    agentId: string
): AgentUXConfig {
    return {
        ...DEFAULT_AGENT_UX_CONFIG,
        ...partial,
        agent: agentId,
        theme: {
            ...DEFAULT_AGENT_UX_CONFIG.theme,
            ...partial.theme,
        },
        formatting: {
            ...DEFAULT_AGENT_UX_CONFIG.formatting,
            ...partial.formatting,
        },
        input: {
            ...DEFAULT_AGENT_UX_CONFIG.input,
            ...partial.input,
        },
        contextualUI: {
            ...DEFAULT_AGENT_UX_CONFIG.contextualUI,
            ...partial.contextualUI,
        },
        responseParsing: {
            ...DEFAULT_AGENT_UX_CONFIG.responseParsing,
            ...partial.responseParsing,
        },
        components: partial.components || DEFAULT_COMPONENT_CATALOG,
        quickActions: partial.quickActions || [],
    };
}

/**
 * Get a list of enabled components for an agent.
 */
export function getEnabledComponents(config: AgentUXConfig): string[] {
    const enabled: string[] = [];

    if (!config.components) return enabled;

    const categories = ['layout', 'form', 'display', 'interactive', 'media', 'data'] as const;

    for (const category of categories) {
        const components = config.components[category];
        if (components) {
            for (const component of components) {
                if (component.enabled) {
                    enabled.push(component.name);
                }
            }
        }
    }

    return enabled;
}

/**
 * Check if a specific component is enabled for an agent.
 */
export function isComponentEnabled(config: AgentUXConfig, componentName: string): boolean {
    if (!config.components) return true; // Default to enabled if no catalog

    const categories = ['layout', 'form', 'display', 'interactive', 'media', 'data'] as const;

    for (const category of categories) {
        const components = config.components[category];
        if (components) {
            const component = components.find(c => c.name === componentName);
            if (component) {
                return component.enabled;
            }
        }
    }

    // Component not found in catalog - default to enabled
    return true;
}
