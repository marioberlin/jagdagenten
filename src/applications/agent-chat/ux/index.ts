/**
 * Agent UX Configuration System
 *
 * This module provides per-agent UX customization through markdown configuration files.
 *
 * Usage:
 * 1. Create agentUX_{agent-id}.md files in the agent-chat directory
 * 2. Use useAgentUXConfig(agentId) hook in React components
 * 3. Access theme, formatting, input, and component settings
 *
 * Example:
 * ```tsx
 * const { config, isLoading } = useAgentUXConfig('my-agent');
 *
 * if (config) {
 *   const accentColor = config.theme?.accentColor;
 *   const enabledComponents = getEnabledComponents(config);
 * }
 * ```
 */

// Schema exports
export {
    // Types
    type AgentUXConfig,
    type ThemeConfig,
    type FormattingConfig,
    type InputConfig,
    type ContextualUIConfig,
    type QuickAction,
    type ResponseParsingConfig,
    type ComponentInfo,
    type ComponentCatalog,
    type SuggestionStrategy,

    // Defaults
    DEFAULT_AGENT_UX_CONFIG,
    DEFAULT_COMPONENT_CATALOG,
} from './schema';

// Parser exports
export {
    extractFrontmatter,
    parseAgentUXConfig,
    validateAgentUXConfig,
} from './parser';

// Loader exports
export {
    loadAgentUXConfig,
    clearUXConfigCache,
    getAvailableAgentUXConfigs,
    hasAgentUXConfig,
    useAgentUXConfig,
    mergeWithDefaults,
    getEnabledComponents,
    isComponentEnabled,
} from './loader';
