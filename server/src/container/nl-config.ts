/**
 * Natural Language Configuration Parser
 *
 * Allows users to configure SDK preferences using natural language.
 * E.g., "use Claude for UI work, Gemini for everything else"
 *
 * @see docs/LIQUID_CONTAINER_COMPLETE_IMPLEMENTATION_PLAN.md
 */

import type { SDKType, SDKPreferences } from './smart-defaults.js';

// ============================================================================
// Types
// ============================================================================

export interface NLConfigRequest {
    /** Natural language input */
    input: string;
}

export interface NLConfigResult {
    /** Whether the input was understood */
    understood: boolean;
    /** Human-readable interpretation */
    interpretation: string;
    /** Configuration changes to apply */
    changes: Partial<SDKPreferences>;
    /** Confidence in interpretation (0-1) */
    confidence: number;
    /** Suggestions if input was ambiguous */
    suggestions?: string[];
}

export interface PatternMatch {
    sdk?: SDKType;
    domain?: string;
    preference?: string;
    priority?: string;
}

// ============================================================================
// Pattern Definitions
// ============================================================================

/**
 * Map provider names to SDK types
 */
function mapProviderToSdk(provider: string): SDKType | null {
    const normalized = provider.toLowerCase().trim();

    const mappings: Record<string, SDKType> = {
        'claude': 'claude-agent-sdk',
        'anthropic': 'claude-agent-sdk',
        'gemini': 'gemini-cli',
        'google': 'google-adk',
        'openai': 'openai-agents-sdk',
        'gpt': 'openai-agents-sdk',
        'gpt-4': 'openai-agents-sdk',
        'chatgpt': 'openai-agents-sdk',
        'minimax': 'minimax',
    };

    return mappings[normalized] || null;
}

/**
 * Map domain names to preference keys
 */
function mapDomainToKey(domain: string): keyof SDKPreferences | null {
    const normalized = domain.toLowerCase().trim();

    const mappings: Record<string, keyof SDKPreferences> = {
        'ui': 'uiSpecialist',
        'frontend': 'uiSpecialist',
        'react': 'uiSpecialist',
        'components': 'uiSpecialist',
        'api': 'apiSpecialist',
        'backend': 'apiSpecialist',
        'server': 'apiSpecialist',
        'test': 'testSpecialist',
        'tests': 'testSpecialist',
        'testing': 'testSpecialist',
        'security': 'securitySpecialist',
        'auth': 'securitySpecialist',
        'everything': 'default',
        'default': 'default',
        'all': 'default',
    };

    return mappings[normalized] || null;
}

// ============================================================================
// Pattern Matching
// ============================================================================

interface PatternDefinition {
    pattern: RegExp;
    handler: (match: RegExpMatchArray) => PatternMatch;
}

const NL_PATTERNS: PatternDefinition[] = [
    // "use Claude for UI"
    {
        pattern: /use\s+(claude|gemini|openai|gpt|anthropic|minimax|google)\s+for\s+(ui|api|test|security|backend|frontend|everything|all|default)/gi,
        handler: (match) => ({
            sdk: mapProviderToSdk(match[1]) || undefined,
            domain: match[2].toLowerCase(),
        }),
    },
    // "prefer quality/speed/cost"
    {
        pattern: /prefer\s+(speed|quality|cost|balance|balanced)/gi,
        handler: (match) => ({
            preference: match[1].toLowerCase(),
        }),
    },
    // "Claude is best for UI"
    {
        pattern: /(claude|gemini|openai|gpt|anthropic|minimax|google)\s+(?:is\s+)?(?:best|great|good)\s+for\s+(ui|api|test|security|backend|frontend)/gi,
        handler: (match) => ({
            sdk: mapProviderToSdk(match[1]) || undefined,
            domain: match[2].toLowerCase(),
        }),
    },
    // "prioritize cost" or "prioritize quality"
    {
        pattern: /prioritize\s+(speed|quality|cost)/gi,
        handler: (match) => ({
            priority: match[1].toLowerCase(),
        }),
    },
    // "default to Claude"
    {
        pattern: /default\s+to\s+(claude|gemini|openai|gpt|anthropic|minimax|google)/gi,
        handler: (match) => ({
            sdk: mapProviderToSdk(match[1]) || undefined,
            domain: 'default',
        }),
    },
    // "always use Claude for security"
    {
        pattern: /always\s+use\s+(claude|gemini|openai|gpt|anthropic|minimax|google)\s+for\s+(ui|api|test|security|backend|frontend)/gi,
        handler: (match) => ({
            sdk: mapProviderToSdk(match[1]) || undefined,
            domain: match[2].toLowerCase(),
        }),
    },
    // "I want Gemini for tests"
    {
        pattern: /(?:i\s+)?want\s+(claude|gemini|openai|gpt|anthropic|minimax|google)\s+for\s+(ui|api|test|security|backend|frontend|everything)/gi,
        handler: (match) => ({
            sdk: mapProviderToSdk(match[1]) || undefined,
            domain: match[2].toLowerCase(),
        }),
    },
    // "set UI to Claude"
    {
        pattern: /set\s+(ui|api|test|security|backend|frontend|default)\s+to\s+(claude|gemini|openai|gpt|anthropic|minimax|google)/gi,
        handler: (match) => ({
            domain: match[1].toLowerCase(),
            sdk: mapProviderToSdk(match[2]) || undefined,
        }),
    },
];

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Parse natural language configuration input
 */
export function parseNLConfig(request: NLConfigRequest): NLConfigResult {
    const { input } = request;
    const normalizedInput = input.trim();

    if (!normalizedInput) {
        return {
            understood: false,
            interpretation: 'Empty input provided',
            changes: {},
            confidence: 0,
            suggestions: ['Try: "use Claude for UI work"', 'Try: "prefer quality over cost"'],
        };
    }

    const matches: PatternMatch[] = [];
    let totalConfidence = 0;

    // Try all patterns
    for (const { pattern, handler } of NL_PATTERNS) {
        // Reset lastIndex for global patterns
        pattern.lastIndex = 0;

        let match: RegExpExecArray | null;
        while ((match = pattern.exec(normalizedInput)) !== null) {
            const result = handler(match);
            if (result.sdk || result.preference || result.priority) {
                matches.push(result);
                totalConfidence += 0.3;
            }
        }
    }

    // No matches found
    if (matches.length === 0) {
        return {
            understood: false,
            interpretation: `Could not understand: "${normalizedInput}"`,
            changes: {},
            confidence: 0,
            suggestions: generateSuggestions(normalizedInput),
        };
    }

    // Build changes from matches
    const changes: Partial<SDKPreferences> = {};
    const interpretations: string[] = [];

    for (const match of matches) {
        if (match.sdk && match.domain) {
            const key = mapDomainToKey(match.domain);
            if (key) {
                (changes as Record<string, SDKType | string>)[key] = match.sdk;
                interpretations.push(`${match.sdk} for ${match.domain}`);
            }
        }

        if (match.preference || match.priority) {
            const pref = match.preference || match.priority;
            if (pref === 'quality') {
                changes.costOptimization = 'quality';
                interpretations.push('prioritizing quality');
            } else if (pref === 'cost') {
                changes.costOptimization = 'cost';
                interpretations.push('prioritizing cost savings');
            } else if (pref === 'speed' || pref === 'balance' || pref === 'balanced') {
                changes.costOptimization = 'balanced';
                interpretations.push('balancing speed and cost');
            }
        }
    }

    // Calculate confidence (cap at 1.0)
    const confidence = Math.min(1.0, totalConfidence + (matches.length * 0.2));

    return {
        understood: true,
        interpretation: interpretations.join(', '),
        changes,
        confidence,
    };
}

/**
 * Generate suggestions when input wasn't understood
 */
function generateSuggestions(input: string): string[] {
    const suggestions: string[] = [];
    const normalizedInput = input.toLowerCase();

    // Check if they mentioned a provider
    const providers = ['claude', 'gemini', 'openai', 'gpt'];
    const mentionedProvider = providers.find(p => normalizedInput.includes(p));

    // Check if they mentioned a domain
    const domains = ['ui', 'api', 'test', 'security', 'frontend', 'backend'];
    const mentionedDomain = domains.find(d => normalizedInput.includes(d));

    if (mentionedProvider && !mentionedDomain) {
        suggestions.push(`Try: "use ${mentionedProvider} for UI"`);
        suggestions.push(`Try: "use ${mentionedProvider} for API"`);
    } else if (mentionedDomain && !mentionedProvider) {
        suggestions.push(`Try: "use Claude for ${mentionedDomain}"`);
        suggestions.push(`Try: "use Gemini for ${mentionedDomain}"`);
    } else {
        suggestions.push('Try: "use Claude for UI, Gemini for API"');
        suggestions.push('Try: "prefer quality over cost"');
        suggestions.push('Try: "default to Gemini"');
    }

    return suggestions;
}

// ============================================================================
// Batch Processing
// ============================================================================

/**
 * Parse multiple configuration statements
 */
export function parseNLConfigBatch(inputs: string[]): NLConfigResult {
    const allChanges: Partial<SDKPreferences> = {};
    const allInterpretations: string[] = [];
    let totalConfidence = 0;

    for (const input of inputs) {
        const result = parseNLConfig({ input });

        if (result.understood) {
            Object.assign(allChanges, result.changes);
            if (result.interpretation) {
                allInterpretations.push(result.interpretation);
            }
            totalConfidence += result.confidence;
        }
    }

    const avgConfidence = inputs.length > 0 ? totalConfidence / inputs.length : 0;

    return {
        understood: allInterpretations.length > 0,
        interpretation: allInterpretations.join('; '),
        changes: allChanges,
        confidence: Math.min(1.0, avgConfidence),
    };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate that changes are compatible with environment
 */
export function validateNLConfigChanges(
    changes: Partial<SDKPreferences>,
    availableSdks: SDKType[]
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, value] of Object.entries(changes)) {
        if (typeof value === 'string' && value !== 'auto') {
            const sdk = value as SDKType;
            if (!availableSdks.includes(sdk)) {
                errors.push(`${sdk} is not available for ${key} (missing API key or CLI tool)`);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// ============================================================================
// Human-Readable Output
// ============================================================================

/**
 * Generate human-readable summary of SDK preferences
 */
export function summarizePreferences(prefs: SDKPreferences): string {
    const parts: string[] = [];

    if (prefs.default !== 'raw') {
        parts.push(`Default: ${formatSdkName(prefs.default)}`);
    }

    if (prefs.uiSpecialist !== 'auto') {
        parts.push(`UI: ${formatSdkName(prefs.uiSpecialist as SDKType)}`);
    }

    if (prefs.apiSpecialist !== 'auto') {
        parts.push(`API: ${formatSdkName(prefs.apiSpecialist as SDKType)}`);
    }

    if (prefs.testSpecialist !== 'auto') {
        parts.push(`Tests: ${formatSdkName(prefs.testSpecialist as SDKType)}`);
    }

    parts.push(`Security: ${formatSdkName(prefs.securitySpecialist)}`);

    const optimization = {
        quality: 'Quality-focused',
        balanced: 'Balanced',
        cost: 'Cost-optimized',
    };
    parts.push(`Mode: ${optimization[prefs.costOptimization]}`);

    return parts.join(' | ');
}

/**
 * Format SDK name for display
 */
function formatSdkName(sdk: SDKType): string {
    const names: Record<SDKType, string> = {
        'claude-agent-sdk': 'Claude',
        'openai-agents-sdk': 'OpenAI',
        'google-adk': 'Google ADK',
        'gemini-cli': 'Gemini CLI',
        'minimax': 'MiniMax',
        'raw': 'Direct',
    };
    return names[sdk] || sdk;
}
