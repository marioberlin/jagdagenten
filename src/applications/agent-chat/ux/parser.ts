/**
 * Agent UX Configuration Parser
 *
 * Parses agentUX_{agent-id}.md files from YAML frontmatter + markdown content.
 */

import {
    AgentUXConfig,
    ThemeConfig,
    FormattingConfig,
    InputConfig,
    ContextualUIConfig,
    QuickAction,
    ResponseParsingConfig,
    ComponentCatalog,
    DEFAULT_AGENT_UX_CONFIG,
    DEFAULT_COMPONENT_CATALOG
} from './schema';

// ============================================================================
// YAML Frontmatter Parser
// ============================================================================

interface ParsedFrontmatter {
    frontmatter: Record<string, any>;
    content: string;
}

/**
 * Extract YAML frontmatter from markdown content.
 * Frontmatter is delimited by --- at the start and end.
 */
export function extractFrontmatter(markdown: string): ParsedFrontmatter {
    const lines = markdown.split('\n');

    // Check if file starts with ---
    if (lines[0]?.trim() !== '---') {
        return { frontmatter: {}, content: markdown };
    }

    // Find closing ---
    let endIndex = -1;
    for (let i = 1; i < lines.length; i++) {
        if (lines[i]?.trim() === '---') {
            endIndex = i;
            break;
        }
    }

    if (endIndex === -1) {
        return { frontmatter: {}, content: markdown };
    }

    const yamlContent = lines.slice(1, endIndex).join('\n');
    const markdownContent = lines.slice(endIndex + 1).join('\n').trim();

    // Parse YAML (simple key-value parser for our use case)
    const frontmatter = parseSimpleYAML(yamlContent);

    return { frontmatter, content: markdownContent };
}

/**
 * Simple YAML parser for our configuration format.
 * Supports nested objects and arrays.
 */
function parseSimpleYAML(yaml: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = yaml.split('\n');
    const stack: { indent: number; obj: Record<string, any>; key?: string }[] = [
        { indent: -1, obj: result }
    ];

    for (const line of lines) {
        // Skip empty lines and comments
        if (!line.trim() || line.trim().startsWith('#')) continue;

        // Calculate indent level
        const indent = line.search(/\S/);
        const content = line.trim();

        // Handle array items
        if (content.startsWith('- ')) {
            const value = content.slice(2).trim();
            const parent = stack[stack.length - 1];

            if (parent.key && !Array.isArray(parent.obj[parent.key])) {
                parent.obj[parent.key] = [];
            }

            if (parent.key && Array.isArray(parent.obj[parent.key])) {
                // Check if it's an object item or simple value
                if (value.includes(':')) {
                    const itemObj: Record<string, any> = {};
                    const [itemKey, itemValue] = value.split(':').map(s => s.trim());
                    itemObj[itemKey] = parseValue(itemValue);
                    parent.obj[parent.key].push(itemObj);
                } else {
                    parent.obj[parent.key].push(parseValue(value));
                }
            }
            continue;
        }

        // Handle key-value pairs
        const colonIndex = content.indexOf(':');
        if (colonIndex === -1) continue;

        const key = content.slice(0, colonIndex).trim();
        const value = content.slice(colonIndex + 1).trim();

        // Pop stack to correct level
        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
            stack.pop();
        }

        const current = stack[stack.length - 1].obj;

        if (value === '' || value === null) {
            // Nested object
            current[key] = {};
            stack.push({ indent, obj: current[key], key });
        } else {
            // Simple value
            current[key] = parseValue(value);
            // Update key for array handling
            stack[stack.length - 1] = { ...stack[stack.length - 1], key };
        }
    }

    return result;
}

/**
 * Parse a YAML value into appropriate type.
 */
function parseValue(value: string): any {
    if (value === '' || value === 'null' || value === '~') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Handle quoted strings
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1);
    }

    // Handle numbers
    const num = Number(value);
    if (!isNaN(num) && value !== '') return num;

    // Handle arrays inline [a, b, c]
    if (value.startsWith('[') && value.endsWith(']')) {
        const items = value.slice(1, -1).split(',').map(s => parseValue(s.trim()));
        return items;
    }

    return value;
}

// ============================================================================
// Config Parser
// ============================================================================

/**
 * Parse a complete agentUX markdown file into an AgentUXConfig.
 */
export function parseAgentUXConfig(markdown: string, agentId: string): AgentUXConfig {
    const { frontmatter, content } = extractFrontmatter(markdown);

    // Start with defaults
    const config: AgentUXConfig = {
        ...DEFAULT_AGENT_UX_CONFIG,
        version: frontmatter.version || '1.0',
        agent: agentId,
        rawContent: content,
    };

    // Parse display name
    if (frontmatter.displayName) {
        config.displayName = frontmatter.displayName;
    }

    // Parse theme configuration
    if (frontmatter.theme) {
        config.theme = parseThemeConfig(frontmatter.theme);
    }

    // Parse formatting configuration
    if (frontmatter.formatting) {
        config.formatting = parseFormattingConfig(frontmatter.formatting);
    }

    // Parse input configuration
    if (frontmatter.input) {
        config.input = parseInputConfig(frontmatter.input);
    }

    // Parse contextual UI configuration
    if (frontmatter.contextualUI) {
        config.contextualUI = parseContextualUIConfig(frontmatter.contextualUI);
    }

    // Parse quick actions
    if (frontmatter.quickActions && Array.isArray(frontmatter.quickActions)) {
        config.quickActions = frontmatter.quickActions.map(parseQuickAction);
    }

    // Parse response parsing configuration
    if (frontmatter.responseParsing) {
        config.responseParsing = parseResponseParsingConfig(frontmatter.responseParsing);
    }

    // Parse component catalog (or use default)
    config.components = frontmatter.components
        ? parseComponentCatalog(frontmatter.components)
        : DEFAULT_COMPONENT_CATALOG;

    // Parse custom class
    if (frontmatter.customClass) {
        config.customClass = frontmatter.customClass;
    }

    return config;
}

function parseThemeConfig(data: Record<string, any>): ThemeConfig {
    return {
        accentColor: data.accentColor,
        secondaryColor: data.secondaryColor,
        backgroundImage: data.backgroundImage,
        messageStyle: data.messageStyle,
        avatarStyle: data.avatarStyle,
        glassEffects: data.glassEffects,
    };
}

function parseFormattingConfig(data: Record<string, any>): FormattingConfig {
    return {
        markdown: data.markdown,
        emojiToIcons: data.emojiToIcons,
        codeHighlighting: data.codeHighlighting,
        codeTheme: data.codeTheme,
        mathRendering: data.mathRendering,
        maxMessageLength: data.maxMessageLength,
    };
}

function parseInputConfig(data: Record<string, any>): InputConfig {
    return {
        placeholder: data.placeholder,
        voiceEnabled: data.voiceEnabled,
        fileUpload: data.fileUpload,
        allowedFileTypes: data.allowedFileTypes,
        maxFileSize: data.maxFileSize,
        multiline: data.multiline,
        showCharCount: data.showCharCount,
        maxLength: data.maxLength,
    };
}

function parseContextualUIConfig(data: Record<string, any>): ContextualUIConfig {
    return {
        suggestionsEnabled: data.suggestionsEnabled,
        suggestionStrategy: data.suggestionStrategy,
        maxSuggestions: data.maxSuggestions,
        suggestionLayout: data.suggestionLayout,
    };
}

function parseQuickAction(data: Record<string, any>): QuickAction {
    return {
        label: data.label || '',
        value: data.value || '',
        icon: data.icon,
        description: data.description,
    };
}

function parseResponseParsingConfig(data: Record<string, any>): ResponseParsingConfig {
    return {
        parseFormat: data.parseFormat,
        extractStructuredData: data.extractStructuredData,
        enableA2UI: data.enableA2UI,
        extractionPatterns: data.extractionPatterns,
    };
}

function parseComponentCatalog(data: Record<string, any>): ComponentCatalog {
    const defaultCatalog = DEFAULT_COMPONENT_CATALOG;

    return {
        layout: data.layout || defaultCatalog.layout,
        form: data.form || defaultCatalog.form,
        display: data.display || defaultCatalog.display,
        interactive: data.interactive || defaultCatalog.interactive,
        media: data.media || defaultCatalog.media,
        data: data.data || defaultCatalog.data,
    };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate an AgentUXConfig and return any errors.
 */
export function validateAgentUXConfig(config: AgentUXConfig): string[] {
    const errors: string[] = [];

    if (!config.version) {
        errors.push('Missing required field: version');
    }

    if (!config.agent) {
        errors.push('Missing required field: agent');
    }

    // Validate theme colors if present
    if (config.theme?.accentColor && !isValidHexColor(config.theme.accentColor)) {
        errors.push(`Invalid accentColor: ${config.theme.accentColor}`);
    }

    if (config.theme?.secondaryColor && !isValidHexColor(config.theme.secondaryColor)) {
        errors.push(`Invalid secondaryColor: ${config.theme.secondaryColor}`);
    }

    // Validate message style
    const validMessageStyles = ['glass', 'solid', 'minimal', 'retro'];
    if (config.theme?.messageStyle && !validMessageStyles.includes(config.theme.messageStyle)) {
        errors.push(`Invalid messageStyle: ${config.theme.messageStyle}`);
    }

    // Validate suggestion strategy
    const validStrategies = ['semantic', 'heuristic', 'none', 'agent-defined'];
    if (config.contextualUI?.suggestionStrategy &&
        !validStrategies.includes(config.contextualUI.suggestionStrategy)) {
        errors.push(`Invalid suggestionStrategy: ${config.contextualUI.suggestionStrategy}`);
    }

    return errors;
}

function isValidHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}
