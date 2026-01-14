/**
 * Container API Routes
 *
 * Endpoints for container auto-configuration and management.
 *
 * @see docs/LIQUID_CONTAINER_COMPLETE_IMPLEMENTATION_PLAN.md
 */

import { Elysia } from 'elysia';
import { detectEnvironment, getEnvironmentSummary, isMinimumViable } from '../container/auto-config.js';
import { generateSmartDefaults, toContainerConfig, SDK_COST_ESTIMATES, SDK_CAPABILITIES } from '../container/smart-defaults.js';
import { detectAndValidateApiKeys, getKeyManagementUrl, getSupportedProviders, hasMinimumApiKeys, getKeysSummary } from '../container/api-key-detection.js';
import { analyzeTask, getAvailableSdks, estimateCost, type SubPRD } from '../container/sdk-intelligence.js';
import { parseNLConfig, validateNLConfigChanges, summarizePreferences, type NLConfigRequest } from '../container/nl-config.js';
import { generateSecurityConfig, validateSecurityConfig, calculateSecurityScore, getSecurityPreset, type SecurityPreset } from '../container/security-auto.js';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.http.child({ component: 'container-routes' });

// Cache environment detection for 30 seconds
let cachedEnv: Awaited<ReturnType<typeof detectEnvironment>> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000;

async function getCachedEnvironment() {
    const now = Date.now();
    if (cachedEnv && now - cacheTimestamp < CACHE_TTL) {
        return cachedEnv;
    }
    cachedEnv = await detectEnvironment();
    cacheTimestamp = now;
    return cachedEnv;
}

export const containerRoutes = new Elysia({ prefix: '/api/container' })
    /**
     * Detect environment capabilities
     * Returns Docker status, API keys, CLI tools, system info
     */
    .get('/detect', async () => {
        try {
            const env = await getCachedEnvironment();
            log.info({ docker: env.docker.available, apiKeys: env.apiKeys }, 'Environment detected');
            return env;
        } catch (error) {
            log.error({ error }, 'Environment detection failed');
            return {
                error: 'Detection failed',
                message: (error as Error).message,
            };
        }
    })

    /**
     * Get smart defaults based on detected environment
     * Returns recommended configuration
     */
    .get('/smart-defaults', async () => {
        try {
            const env = await getCachedEnvironment();
            const defaults = generateSmartDefaults(env);
            const config = toContainerConfig(defaults);

            return {
                defaults,
                config,
                viable: isMinimumViable(env),
                summary: getEnvironmentSummary(env),
            };
        } catch (error) {
            log.error({ error }, 'Smart defaults generation failed');
            return {
                error: 'Generation failed',
                message: (error as Error).message,
            };
        }
    })

    /**
     * Detect and optionally validate API keys
     */
    .get('/api-keys', async ({ query }) => {
        try {
            const validate = query.validate === 'true';
            const keys = await detectAndValidateApiKeys(validate);

            return {
                keys,
                hasMinimum: hasMinimumApiKeys(keys),
                summary: getKeysSummary(keys),
                providers: getSupportedProviders(),
            };
        } catch (error) {
            log.error({ error }, 'API key detection failed');
            return {
                error: 'Detection failed',
                message: (error as Error).message,
            };
        }
    })

    /**
     * Validate a specific API key
     */
    .post('/api-keys/validate', async ({ body }) => {
        try {
            const { provider, key } = body as { provider: string; key?: string };
            const { validateApiKey } = await import('../container/api-key-detection.js');
            const result = await validateApiKey(provider, key);

            return {
                provider,
                ...result,
                managementUrl: getKeyManagementUrl(provider),
            };
        } catch (error) {
            log.error({ error }, 'API key validation failed');
            return {
                error: 'Validation failed',
                message: (error as Error).message,
            };
        }
    })

    /**
     * Get SDK information (costs, capabilities)
     */
    .get('/sdk-info', () => {
        return {
            costs: SDK_COST_ESTIMATES,
            capabilities: SDK_CAPABILITIES,
        };
    })

    /**
     * Health check for container system
     */
    .get('/health', async () => {
        try {
            const env = await getCachedEnvironment();
            const status = isMinimumViable(env) ? 'ready' : 'setup-required';

            return {
                status,
                docker: env.docker.available,
                apiKeys: Object.entries(env.apiKeys)
                    .filter(([, v]) => v)
                    .map(([k]) => k),
                timestamp: Date.now(),
            };
        } catch (error) {
            return {
                status: 'error',
                error: (error as Error).message,
                timestamp: Date.now(),
            };
        }
    })

    /**
     * Clear cached environment (force re-detection)
     */
    .post('/detect/refresh', async () => {
        cachedEnv = null;
        cacheTimestamp = 0;
        const env = await getCachedEnvironment();
        log.info('Environment cache cleared and refreshed');
        return {
            success: true,
            env,
        };
    })

    // ========================================================================
    // SDK Intelligence Routes
    // ========================================================================

    /**
     * Analyze a task and get SDK recommendation
     */
    .post('/analyze-task', async ({ body }) => {
        try {
            const subPrd = body as SubPRD;
            const env = await getCachedEnvironment();
            const analysis = analyzeTask(subPrd, env);

            log.info({
                domain: subPrd.domain,
                suggestedSdk: analysis.suggestedSdk,
                complexity: analysis.complexity,
            }, 'Task analyzed');

            return {
                analysis,
                availableSdks: getAvailableSdks(env),
            };
        } catch (error) {
            log.error({ error }, 'Task analysis failed');
            return {
                error: 'Analysis failed',
                message: (error as Error).message,
            };
        }
    })

    /**
     * Get available SDKs based on environment
     */
    .get('/available-sdks', async () => {
        try {
            const env = await getCachedEnvironment();
            const sdks = getAvailableSdks(env);

            return {
                sdks,
                details: sdks.map(sdk => ({
                    sdk,
                    capabilities: SDK_CAPABILITIES[sdk],
                    costs: SDK_COST_ESTIMATES[sdk],
                })),
            };
        } catch (error) {
            log.error({ error }, 'Failed to get available SDKs');
            return {
                error: 'Failed',
                message: (error as Error).message,
            };
        }
    })

    /**
     * Estimate cost for a task
     */
    .post('/estimate-cost', async ({ body }) => {
        try {
            const { sdk, turns } = body as { sdk: string; turns: number };
            const cost = estimateCost(sdk as any, turns);

            return {
                sdk,
                turns,
                cost,
            };
        } catch (error) {
            log.error({ error }, 'Cost estimation failed');
            return {
                error: 'Estimation failed',
                message: (error as Error).message,
            };
        }
    })

    // ========================================================================
    // Natural Language Configuration Routes
    // ========================================================================

    /**
     * Parse natural language configuration
     */
    .post('/nl-config', async ({ body }) => {
        try {
            const request = body as NLConfigRequest;
            const result = parseNLConfig(request);

            // Validate against available SDKs
            const env = await getCachedEnvironment();
            const availableSdks = getAvailableSdks(env);
            const validation = validateNLConfigChanges(result.changes, availableSdks);

            log.info({
                input: request.input,
                understood: result.understood,
                confidence: result.confidence,
            }, 'NL config parsed');

            return {
                ...result,
                validation,
            };
        } catch (error) {
            log.error({ error }, 'NL config parsing failed');
            return {
                error: 'Parsing failed',
                message: (error as Error).message,
            };
        }
    })

    /**
     * Get summary of current SDK preferences
     */
    .post('/preferences/summary', async ({ body }) => {
        try {
            const prefs = body as any;
            const summary = summarizePreferences(prefs);

            return {
                summary,
            };
        } catch (error) {
            log.error({ error }, 'Preferences summary failed');
            return {
                error: 'Summary failed',
                message: (error as Error).message,
            };
        }
    })

    // ========================================================================
    // Security Configuration Routes
    // ========================================================================

    /**
     * Generate security configuration
     */
    .get('/security/config', async () => {
        try {
            const env = await getCachedEnvironment();
            const config = generateSecurityConfig(env);
            const issues = validateSecurityConfig(config);
            const score = calculateSecurityScore(config);

            return {
                config,
                issues,
                score,
            };
        } catch (error) {
            log.error({ error }, 'Security config generation failed');
            return {
                error: 'Generation failed',
                message: (error as Error).message,
            };
        }
    })

    /**
     * Validate a security configuration
     */
    .post('/security/validate', async ({ body }) => {
        try {
            const config = body as any;
            const issues = validateSecurityConfig(config);
            const score = calculateSecurityScore(config);

            return {
                valid: issues.filter(i => i.severity === 'critical').length === 0,
                issues,
                score,
            };
        } catch (error) {
            log.error({ error }, 'Security validation failed');
            return {
                error: 'Validation failed',
                message: (error as Error).message,
            };
        }
    })

    /**
     * Get security preset configurations
     */
    .get('/security/presets', async ({ query }) => {
        try {
            const preset = (query.preset as SecurityPreset) || 'standard';
            const env = await getCachedEnvironment();
            const config = getSecurityPreset(preset, env);
            const issues = validateSecurityConfig(config);
            const score = calculateSecurityScore(config);

            return {
                preset,
                config,
                issues,
                score,
                availablePresets: ['maximum', 'strict', 'standard', 'permissive'] as SecurityPreset[],
            };
        } catch (error) {
            log.error({ error }, 'Security preset fetch failed');
            return {
                error: 'Fetch failed',
                message: (error as Error).message,
            };
        }
    });

export default containerRoutes;
