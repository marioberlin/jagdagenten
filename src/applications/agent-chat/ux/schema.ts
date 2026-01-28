/**
 * Agent UX Configuration Schema
 *
 * Defines the structure for per-agent UX customization files.
 * These are loaded from agentUX_{agent-id}.md files in the agent-chat directory.
 */

// ============================================================================
// Theme Configuration
// ============================================================================

export interface ThemeConfig {
    /** Primary accent color (hex) */
    accentColor?: string;
    /** Secondary accent color (hex) */
    secondaryColor?: string;
    /** Background image URL or null */
    backgroundImage?: string | null;
    /** Message bubble style */
    messageStyle?: 'glass' | 'solid' | 'minimal' | 'retro';
    /** Avatar display style */
    avatarStyle?: 'rounded' | 'square' | 'circle';
    /** Enable glassmorphism effects */
    glassEffects?: boolean;
}

// ============================================================================
// Response Formatting Configuration
// ============================================================================

export interface FormattingConfig {
    /** Enable markdown parsing */
    markdown?: boolean;
    /** Replace emojis with Lucide icons */
    emojiToIcons?: boolean;
    /** Enable syntax highlighting for code blocks */
    codeHighlighting?: boolean;
    /** Code theme */
    codeTheme?: 'dark' | 'light' | 'auto';
    /** Enable LaTeX/math rendering */
    mathRendering?: boolean;
    /** Maximum message length before truncation */
    maxMessageLength?: number;
}

// ============================================================================
// Input Configuration
// ============================================================================

export interface InputConfig {
    /** Custom placeholder text */
    placeholder?: string;
    /** Enable voice input */
    voiceEnabled?: boolean;
    /** Enable file upload */
    fileUpload?: boolean;
    /** Allowed file types for upload */
    allowedFileTypes?: string[];
    /** Max file size in MB */
    maxFileSize?: number;
    /** Enable multiline input */
    multiline?: boolean;
    /** Show character count */
    showCharCount?: boolean;
    /** Max input length */
    maxLength?: number;
}

// ============================================================================
// Contextual UI Configuration
// ============================================================================

export type SuggestionStrategy = 'semantic' | 'heuristic' | 'none' | 'agent-defined';

export interface ContextualUIConfig {
    /** Enable suggestion buttons */
    suggestionsEnabled?: boolean;
    /** Strategy for generating suggestions */
    suggestionStrategy?: SuggestionStrategy;
    /** Maximum number of suggestion buttons */
    maxSuggestions?: number;
    /** Layout for suggestion buttons */
    suggestionLayout?: 'horizontal' | 'vertical' | 'grid';
}

// ============================================================================
// Quick Actions Configuration
// ============================================================================

export interface QuickAction {
    /** Display label */
    label: string;
    /** Value to send when clicked */
    value: string;
    /** Optional icon name (Lucide) */
    icon?: string;
    /** Optional description/tooltip */
    description?: string;
}

// ============================================================================
// Available A2UI Components
// ============================================================================

export interface ComponentInfo {
    /** Component name */
    name: string;
    /** Human-readable description */
    description: string;
    /** Component category */
    category: 'layout' | 'form' | 'display' | 'interactive' | 'media' | 'data';
    /** Whether this component is available for this agent */
    enabled: boolean;
    /** Any restrictions or notes */
    notes?: string;
}

export interface ComponentCatalog {
    /** Layout components */
    layout: ComponentInfo[];
    /** Form input components */
    form: ComponentInfo[];
    /** Display/presentation components */
    display: ComponentInfo[];
    /** Interactive components */
    interactive: ComponentInfo[];
    /** Media components */
    media: ComponentInfo[];
    /** Data visualization components */
    data: ComponentInfo[];
}

// ============================================================================
// Response Parsing Configuration
// ============================================================================

export interface ResponseParsingConfig {
    /** Parse format for agent responses */
    parseFormat?: 'markdown' | 'json' | 'plain' | 'auto';
    /** Extract structured data from responses */
    extractStructuredData?: boolean;
    /** Look for A2UI artifacts in responses */
    enableA2UI?: boolean;
    /** Custom extraction patterns */
    extractionPatterns?: {
        name: string;
        pattern: string;
        transform?: string;
    }[];
}

// ============================================================================
// Main Agent UX Configuration
// ============================================================================

export interface AgentUXConfig {
    /** Config file version */
    version: string;
    /** Agent ID this config applies to */
    agent: string;
    /** Display name override */
    displayName?: string;
    /** Theme configuration */
    theme?: ThemeConfig;
    /** Response formatting */
    formatting?: FormattingConfig;
    /** Input configuration */
    input?: InputConfig;
    /** Contextual UI configuration */
    contextualUI?: ContextualUIConfig;
    /** Quick action buttons */
    quickActions?: QuickAction[];
    /** Response parsing configuration */
    responseParsing?: ResponseParsingConfig;
    /** Available A2UI components */
    components?: ComponentCatalog;
    /** Custom CSS class to apply */
    customClass?: string;
    /** Raw markdown content (for documentation) */
    rawContent?: string;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_AGENT_UX_CONFIG: AgentUXConfig = {
    version: '1.0',
    agent: 'default',
    theme: {
        accentColor: '#6366f1',
        messageStyle: 'glass',
        avatarStyle: 'rounded',
        glassEffects: true,
    },
    formatting: {
        markdown: true,
        emojiToIcons: true,
        codeHighlighting: true,
        codeTheme: 'dark',
    },
    input: {
        voiceEnabled: true,
        fileUpload: false,
        multiline: false,
    },
    contextualUI: {
        suggestionsEnabled: true,
        suggestionStrategy: 'heuristic',
        maxSuggestions: 4,
        suggestionLayout: 'horizontal',
    },
    quickActions: [],
    responseParsing: {
        parseFormat: 'auto',
        enableA2UI: true,
    },
};

// ============================================================================
// Component Catalog Defaults
// ============================================================================

export const DEFAULT_COMPONENT_CATALOG: ComponentCatalog = {
    layout: [
        { name: 'GlassContainer', description: 'Basic container with glass effect', category: 'layout', enabled: true },
        { name: 'GlassCard', description: 'Card with header/body/footer', category: 'layout', enabled: true },
        { name: 'GlassStack', description: 'Vertical/horizontal stack', category: 'layout', enabled: true },
        { name: 'GlassGrid', description: 'Responsive grid layout', category: 'layout', enabled: true },
    ],
    form: [
        { name: 'GlassButton', description: 'Button with variants', category: 'form', enabled: true },
        { name: 'GlassInput', description: 'Text input field', category: 'form', enabled: true },
        { name: 'GlassTextarea', description: 'Multi-line text input', category: 'form', enabled: true },
        { name: 'GlassCheckbox', description: 'Checkbox with label', category: 'form', enabled: true },
        { name: 'GlassRadioGroup', description: 'Radio button group', category: 'form', enabled: true },
        { name: 'GlassSelect', description: 'Dropdown select', category: 'form', enabled: true },
        { name: 'GlassSlider', description: 'Range slider', category: 'form', enabled: true },
        { name: 'GlassSwitch', description: 'Toggle switch', category: 'form', enabled: true },
        { name: 'GlassDatePicker', description: 'Date selection', category: 'form', enabled: true },
        { name: 'GlassTimePicker', description: 'Time selection', category: 'form', enabled: true },
        { name: 'GlassColorPicker', description: 'Color selection', category: 'form', enabled: true },
        { name: 'GlassRating', description: 'Star rating input', category: 'form', enabled: true },
        { name: 'GlassUpload', description: 'File upload dropzone', category: 'form', enabled: true },
        { name: 'GlassCombobox', description: 'Autocomplete input', category: 'form', enabled: true },
        { name: 'GlassNumberInput', description: 'Number input with controls', category: 'form', enabled: true },
    ],
    display: [
        { name: 'GlassAvatar', description: 'User/agent avatar', category: 'display', enabled: true },
        { name: 'GlassBadge', description: 'Status badge', category: 'display', enabled: true },
        { name: 'GlassMetric', description: 'KPI metric display', category: 'display', enabled: true },
        { name: 'GlassCode', description: 'Code block with highlighting', category: 'display', enabled: true },
        { name: 'GlassTimeline', description: 'Event timeline', category: 'display', enabled: true },
        { name: 'GlassProfileCard', description: 'User profile card', category: 'display', enabled: true },
        { name: 'GlassProductCard', description: 'Product display card', category: 'display', enabled: true },
        { name: 'GlassMediaCard', description: 'Media content card', category: 'display', enabled: true },
        { name: 'GlassStatsBar', description: 'Statistics bar', category: 'display', enabled: true },
        { name: 'GlassWeather', description: 'Weather display', category: 'display', enabled: true },
    ],
    interactive: [
        { name: 'GlassAccordion', description: 'Collapsible sections', category: 'interactive', enabled: true },
        { name: 'GlassTabs', description: 'Tab navigation', category: 'interactive', enabled: true },
        { name: 'GlassModal', description: 'Modal dialog', category: 'interactive', enabled: true },
        { name: 'GlassCarousel', description: 'Image/card carousel', category: 'interactive', enabled: true },
        { name: 'GlassTooltip', description: 'Hover tooltips', category: 'interactive', enabled: true },
        { name: 'GlassPopover', description: 'Click popover', category: 'interactive', enabled: true },
        { name: 'GlassSearchBar', description: 'Search with suggestions', category: 'interactive', enabled: true },
    ],
    media: [
        { name: 'GlassImage', description: 'Image with loading states', category: 'media', enabled: true },
        { name: 'GlassVideo', description: 'Video player', category: 'media', enabled: true },
        { name: 'GlassAudio', description: 'Audio player', category: 'media', enabled: true },
        { name: 'GlassMap', description: 'Interactive map', category: 'media', enabled: true },
        { name: 'GlassGoogleMap', description: 'Google Maps integration', category: 'media', enabled: true },
    ],
    data: [
        { name: 'GlassTable', description: 'Simple data table', category: 'data', enabled: true },
        { name: 'GlassDataTable', description: 'Advanced data table with sorting/filtering', category: 'data', enabled: true },
        { name: 'GlassChart', description: 'Line/bar/area charts', category: 'data', enabled: true },
        { name: 'GlassDonutChart', description: 'Donut/pie chart', category: 'data', enabled: true },
        { name: 'GlassRadarChart', description: 'Radar/spider chart', category: 'data', enabled: true },
        { name: 'GlassScatterChart', description: 'Scatter plot', category: 'data', enabled: true },
        { name: 'GlassHeatmap', description: 'Heatmap visualization', category: 'data', enabled: true },
        { name: 'GlassGauge', description: 'Gauge/speedometer', category: 'data', enabled: true },
        { name: 'GlassSankey', description: 'Sankey diagram', category: 'data', enabled: true },
        { name: 'GlassTreemap', description: 'Treemap visualization', category: 'data', enabled: true },
        { name: 'GlassFunnelChart', description: 'Funnel chart', category: 'data', enabled: true },
        { name: 'GlassCandlestickChart', description: 'Financial candlestick chart', category: 'data', enabled: true },
    ],
};
