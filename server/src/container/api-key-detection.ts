/**
 * API Key Detection and Validation
 *
 * Detects API keys from environment variables and config files,
 * validates them against provider APIs, and tracks quota/status.
 *
 * @see docs/LIQUID_CONTAINER_COMPLETE_IMPLEMENTATION_PLAN.md
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';

// ============================================================================
// Types
// ============================================================================

/**
 * Source where an API key was found
 */
export type KeySource = 'env' | 'file' | 'keychain' | 'manual' | 'none';

/**
 * Status of a detected API key
 */
export interface ApiKeyStatus {
    /** Provider identifier */
    provider: string;
    /** Provider display name */
    displayName: string;
    /** Whether key was detected */
    detected: boolean;
    /** Where the key was found */
    source: KeySource;
    /** Whether the key is valid (if validated) */
    valid: boolean | null;
    /** When validation was last performed */
    lastValidated?: number;
    /** Remaining quota (if available from API) */
    quotaRemaining?: number;
    /** Error message if validation failed */
    error?: string;
    /** Environment variable name where key is stored */
    envVar?: string;
    /** Partial key for display (first and last 4 chars) */
    maskedKey?: string;
}

/**
 * Provider configuration for detection
 */
interface ProviderConfig {
    id: string;
    displayName: string;
    envVars: string[];
    configPaths: string[];
    validateUrl?: string;
    validateMethod?: 'GET' | 'POST';
    validateHeaders?: (key: string) => Record<string, string>;
    getKeyUrl: string;
}

// ============================================================================
// Provider Configurations
// ============================================================================

const PROVIDERS: ProviderConfig[] = [
    {
        id: 'anthropic',
        displayName: 'Anthropic (Claude)',
        envVars: ['ANTHROPIC_API_KEY', 'CLAUDE_API_KEY'],
        configPaths: [
            '~/.anthropic/api_key',
            '~/.config/anthropic/credentials',
        ],
        validateUrl: 'https://api.anthropic.com/v1/messages',
        validateMethod: 'POST',
        validateHeaders: (key) => ({
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        }),
        getKeyUrl: 'https://console.anthropic.com/settings/keys',
    },
    {
        id: 'openai',
        displayName: 'OpenAI (GPT)',
        envVars: ['OPENAI_API_KEY'],
        configPaths: [
            '~/.openai/credentials',
            '~/.config/openai/credentials',
        ],
        validateUrl: 'https://api.openai.com/v1/models',
        validateMethod: 'GET',
        validateHeaders: (key) => ({
            'Authorization': `Bearer ${key}`,
        }),
        getKeyUrl: 'https://platform.openai.com/api-keys',
    },
    {
        id: 'google',
        displayName: 'Google (Gemini)',
        envVars: ['GOOGLE_API_KEY', 'GEMINI_API_KEY'],
        configPaths: [
            '~/.config/gcloud/application_default_credentials.json',
        ],
        validateUrl: 'https://generativelanguage.googleapis.com/v1/models',
        validateMethod: 'GET',
        validateHeaders: (key) => ({
            'x-goog-api-key': key,
        }),
        getKeyUrl: 'https://makersuite.google.com/app/apikey',
    },
    {
        id: 'minimax',
        displayName: 'MiniMax',
        envVars: ['MINIMAX_API_KEY'],
        configPaths: [],
        getKeyUrl: 'https://platform.minimaxi.com/user-center/basic-information/interface-key',
    },
];

// ============================================================================
// Detection Functions
// ============================================================================

/**
 * Expand ~ to home directory in path
 */
function expandPath(path: string): string {
    if (path.startsWith('~/')) {
        return join(os.homedir(), path.slice(2));
    }
    return path;
}

/**
 * Mask an API key for display (show first 4 and last 4 chars)
 */
function maskKey(key: string): string {
    if (key.length <= 8) {
        return '****';
    }
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

/**
 * Detect a single provider's API key
 */
async function detectProviderKey(provider: ProviderConfig): Promise<ApiKeyStatus> {
    const status: ApiKeyStatus = {
        provider: provider.id,
        displayName: provider.displayName,
        detected: false,
        source: 'none',
        valid: null,
    };

    // Check environment variables
    for (const envVar of provider.envVars) {
        const value = process.env[envVar];
        if (value && value.trim().length > 0) {
            status.detected = true;
            status.source = 'env';
            status.envVar = envVar;
            status.maskedKey = maskKey(value);
            return status;
        }
    }

    // Check config files
    for (const configPath of provider.configPaths) {
        const fullPath = expandPath(configPath);
        try {
            if (existsSync(fullPath)) {
                const content = readFileSync(fullPath, 'utf-8').trim();
                if (content.length > 0) {
                    // For JSON files, try to extract the key
                    if (fullPath.endsWith('.json')) {
                        try {
                            const json = JSON.parse(content);
                            // Google credentials format
                            if (json.client_id || json.type === 'authorized_user') {
                                status.detected = true;
                                status.source = 'file';
                                return status;
                            }
                        } catch {
                            // Not valid JSON
                        }
                    } else {
                        // Plain text key file
                        status.detected = true;
                        status.source = 'file';
                        status.maskedKey = maskKey(content);
                        return status;
                    }
                }
            }
        } catch {
            // File not readable
        }
    }

    return status;
}

/**
 * Detect all API keys without validation
 */
export async function detectApiKeys(): Promise<Record<string, ApiKeyStatus>> {
    const results: Record<string, ApiKeyStatus> = {};

    for (const provider of PROVIDERS) {
        results[provider.id] = await detectProviderKey(provider);
    }

    return results;
}

/**
 * Validate a single API key against the provider's API
 */
export async function validateApiKey(
    providerId: string,
    key?: string
): Promise<{ valid: boolean; error?: string }> {
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider) {
        return { valid: false, error: 'Unknown provider' };
    }

    if (!provider.validateUrl || !provider.validateHeaders) {
        // Provider doesn't support validation
        return { valid: true };
    }

    // Get key from env if not provided
    const apiKey = key || provider.envVars.map(v => process.env[v]).find(Boolean);
    if (!apiKey) {
        return { valid: false, error: 'No API key found' };
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(provider.validateUrl, {
            method: provider.validateMethod || 'GET',
            headers: provider.validateHeaders(apiKey),
            signal: controller.signal,
            // For POST methods, send minimal body
            body: provider.validateMethod === 'POST'
                ? JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 1,
                    messages: [{ role: 'user', content: 'test' }],
                })
                : undefined,
        });

        clearTimeout(timeoutId);

        // 200-299: Valid
        // 401/403: Invalid key
        // 429: Rate limited but valid
        // 400: Bad request but key is valid (for Anthropic, means key works)
        if (response.ok || response.status === 429 || response.status === 400) {
            return { valid: true };
        }

        if (response.status === 401 || response.status === 403) {
            return { valid: false, error: 'Invalid API key' };
        }

        return { valid: false, error: `Unexpected status: ${response.status}` };

    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return { valid: false, error: 'Validation timed out' };
        }
        return { valid: false, error: `Validation failed: ${error}` };
    }
}

/**
 * Detect and optionally validate all API keys
 */
export async function detectAndValidateApiKeys(
    validate = false
): Promise<Record<string, ApiKeyStatus>> {
    const results = await detectApiKeys();

    if (validate) {
        await Promise.all(
            Object.entries(results).map(async ([providerId, status]) => {
                if (status.detected) {
                    const validation = await validateApiKey(providerId);
                    status.valid = validation.valid;
                    status.error = validation.error;
                    status.lastValidated = Date.now();
                }
            })
        );
    }

    return results;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the URL to create/manage API keys for a provider
 */
export function getKeyManagementUrl(providerId: string): string | undefined {
    return PROVIDERS.find(p => p.id === providerId)?.getKeyUrl;
}

/**
 * Get provider information
 */
export function getProviderInfo(providerId: string): ProviderConfig | undefined {
    return PROVIDERS.find(p => p.id === providerId);
}

/**
 * Get all supported providers
 */
export function getSupportedProviders(): Array<{ id: string; displayName: string; getKeyUrl: string }> {
    return PROVIDERS.map(p => ({
        id: p.id,
        displayName: p.displayName,
        getKeyUrl: p.getKeyUrl,
    }));
}

/**
 * Check if minimum viable configuration exists
 * (At least one AI provider key detected)
 */
export function hasMinimumApiKeys(keys: Record<string, ApiKeyStatus>): boolean {
    return Object.values(keys).some(k => k.detected);
}

/**
 * Get a summary of detected keys
 */
export function getKeysSummary(keys: Record<string, ApiKeyStatus>): string {
    const detected = Object.values(keys).filter(k => k.detected);

    if (detected.length === 0) {
        return 'No API keys detected';
    }

    const providers = detected.map(k => k.displayName).join(', ');
    return `${detected.length} API key(s) detected: ${providers}`;
}
