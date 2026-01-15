/**
 * Secrets Management for Containers
 *
 * Provides a pluggable secrets backend for injecting sensitive data
 * into containers without exposing them in environment variables.
 *
 * @see docs/LIQUID_CONTAINER_ARCHITECTURE.md - Section 7.3
 */

import type {
    SecretsConfig,
    SecretsProvider,
    SecretsBackend,
} from './types.js';
import { ContainerClient } from './client.js';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.security.child({ component: 'secrets' });

// ============================================================================
// Environment Secrets Provider
// ============================================================================

/**
 * Reads secrets from environment variables with LIQUID_SECRET_ prefix
 */
export class EnvSecretsProvider implements SecretsProvider {
    private prefix: string;

    constructor(prefix: string = 'LIQUID_SECRET_') {
        this.prefix = prefix;
    }

    async getSecret(name: string): Promise<string> {
        const envKey = this.toEnvKey(name);
        const value = process.env[envKey];

        if (!value) {
            throw new Error(`Secret '${name}' not found (expected env var: ${envKey})`);
        }

        return value;
    }

    async hasSecret(name: string): Promise<boolean> {
        const envKey = this.toEnvKey(name);
        return envKey in process.env;
    }

    async listSecrets(): Promise<string[]> {
        return Object.keys(process.env)
            .filter(key => key.startsWith(this.prefix))
            .map(key => this.fromEnvKey(key));
    }

    private toEnvKey(name: string): string {
        return `${this.prefix}${name.toUpperCase().replace(/-/g, '_')}`;
    }

    private fromEnvKey(envKey: string): string {
        return envKey
            .slice(this.prefix.length)
            .toLowerCase()
            .replace(/_/g, '-');
    }
}

// ============================================================================
// Vault Secrets Provider
// ============================================================================

/**
 * Reads secrets from HashiCorp Vault
 */
export class VaultSecretsProvider implements SecretsProvider {
    private address: string;
    private token: string;
    private mountPath: string;
    private cache: Map<string, { value: string; expiresAt: number }> = new Map();
    private cacheTTL: number;

    constructor(config: {
        address: string;
        token?: string;
        mountPath?: string;
        cacheTTL?: number;
    }) {
        this.address = config.address.replace(/\/$/, '');
        this.token = config.token ?? process.env.VAULT_TOKEN ?? '';
        this.mountPath = config.mountPath ?? 'secret/data/liquid-container';
        this.cacheTTL = config.cacheTTL ?? 300000; // 5 minutes

        if (!this.token) {
            throw new Error('Vault token required (VAULT_TOKEN env var or config)');
        }
    }

    async getSecret(name: string): Promise<string> {
        // Check cache
        const cached = this.cache.get(name);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.value;
        }

        // Fetch from Vault
        const url = `${this.address}/v1/${this.mountPath}/${name}`;

        const response = await fetch(url, {
            headers: {
                'X-Vault-Token': this.token,
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Secret '${name}' not found in Vault`);
            }
            throw new Error(`Vault request failed: ${response.status}`);
        }

        const data = await response.json() as {
            data?: { data?: { value?: string } };
        };

        const value = data.data?.data?.value;
        if (!value) {
            throw new Error(`Secret '${name}' has no value`);
        }

        // Cache the value
        this.cache.set(name, {
            value,
            expiresAt: Date.now() + this.cacheTTL,
        });

        return value;
    }

    async hasSecret(name: string): Promise<boolean> {
        try {
            await this.getSecret(name);
            return true;
        } catch {
            return false;
        }
    }

    async listSecrets(): Promise<string[]> {
        const url = `${this.address}/v1/${this.mountPath}?list=true`;

        const response = await fetch(url, {
            headers: {
                'X-Vault-Token': this.token,
            },
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json() as {
            data?: { keys?: string[] };
        };

        return data.data?.keys ?? [];
    }

    /**
     * Clear the cache
     */
    clearCache(): void {
        this.cache.clear();
    }
}

// ============================================================================
// AWS Secrets Manager Provider
// ============================================================================

/**
 * Reads secrets from AWS Secrets Manager
 * Note: Requires AWS SDK to be installed
 */
export class AWSSecretsProvider implements SecretsProvider {
    private region: string;
    private prefix: string;

    constructor(config: { region?: string; prefix?: string }) {
        this.region = config.region ?? process.env.AWS_REGION ?? 'us-east-1';
        this.prefix = config.prefix ?? 'liquid-container/';
    }

    async getSecret(name: string): Promise<string> {
        // Dynamic import to avoid requiring AWS SDK if not used
         
        const { SecretsManagerClient, GetSecretValueCommand } = await import(
            /* @vite-ignore */ '@aws-sdk/client-secrets-manager'
        ).catch(() => {
            throw new Error('AWS SDK not installed. Run: bun add @aws-sdk/client-secrets-manager');
        });

        const client = new SecretsManagerClient({ region: this.region });
        const secretId = `${this.prefix}${name}`;

        try {
            const response = await client.send(
                new GetSecretValueCommand({ SecretId: secretId })
            );

            if (response.SecretString) {
                return response.SecretString;
            }

            if (response.SecretBinary) {
                return Buffer.from(response.SecretBinary).toString('utf-8');
            }

            throw new Error(`Secret '${name}' has no value`);
        } catch (error) {
            if ((error as { name?: string }).name === 'ResourceNotFoundException') {
                throw new Error(`Secret '${name}' not found in AWS Secrets Manager`);
            }
            throw error;
        }
    }

    async hasSecret(name: string): Promise<boolean> {
        try {
            await this.getSecret(name);
            return true;
        } catch {
            return false;
        }
    }

    async listSecrets(): Promise<string[]> {
        const { SecretsManagerClient, ListSecretsCommand } = await import(
            /* @vite-ignore */ '@aws-sdk/client-secrets-manager'
        ).catch(() => {
            throw new Error('AWS SDK not installed. Run: bun add @aws-sdk/client-secrets-manager');
        });

        const client = new SecretsManagerClient({ region: this.region });

        const response = await client.send(
            new ListSecretsCommand({
                Filters: [{ Key: 'name', Values: [this.prefix] }],
            })
        );

        return ((response.SecretList ?? []) as Array<{ Name?: string }>)
            .map((s: { Name?: string }) => s.Name)
            .filter((name: string | undefined): name is string => !!name)
            .map((name: string) => name.replace(this.prefix, ''));
    }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a secrets provider based on configuration
 */
export function createSecretsProvider(config: SecretsConfig): SecretsProvider {
    switch (config.backend) {
        case 'env':
            return new EnvSecretsProvider(config.config.prefix);

        case 'vault':
            return new VaultSecretsProvider({
                address: config.config.address ?? process.env.VAULT_ADDR ?? '',
                token: config.config.token,
                mountPath: config.config.mountPath,
            });

        case 'aws-sm':
            return new AWSSecretsProvider({
                region: config.config.region,
                prefix: config.config.prefix,
            });

        case 'gcp-sm':
            throw new Error('GCP Secret Manager not yet implemented');

        default:
            throw new Error(`Unknown secrets backend: ${config.backend}`);
    }
}

// ============================================================================
// Container Injection
// ============================================================================

/**
 * Inject secrets into a container
 *
 * Writes secrets to the container's /secrets/secrets.json file,
 * which is mounted as a tmpfs and never persisted to disk.
 */
export async function injectSecrets(
    client: ContainerClient,
    secretNames: string[],
    provider: SecretsProvider
): Promise<void> {
    if (secretNames.length === 0) {
        return;
    }

    const secrets: Record<string, string> = {};
    const errors: string[] = [];

    // Fetch all requested secrets
    for (const name of secretNames) {
        try {
            secrets[name] = await provider.getSecret(name);
        } catch (error) {
            errors.push(`${name}: ${(error as Error).message}`);
        }
    }

    if (errors.length > 0) {
        log.warn({ errors }, 'Some secrets could not be fetched');
    }

    if (Object.keys(secrets).length === 0) {
        throw new Error('No secrets could be fetched');
    }

    // Write secrets to container
    // The runtime server will read from /secrets/secrets.json
    const secretsJson = JSON.stringify(secrets);

    // Execute command to write secrets file
    const result = await client.execute({
        command: 'sh',
        args: [
            '-c',
            `echo '${secretsJson.replace(/'/g, "\\'")}' > /secrets/secrets.json && chmod 600 /secrets/secrets.json`,
        ],
        timeout: 5000,
    });

    if (result.exitCode !== 0) {
        throw new Error(`Failed to inject secrets: ${result.stderr}`);
    }

    log.debug({
        count: Object.keys(secrets).length,
        names: secretNames,
    }, 'Secrets injected into container');
}

/**
 * Clear secrets from a container
 */
export async function clearSecrets(client: ContainerClient): Promise<void> {
    try {
        await client.execute({
            command: 'rm',
            args: ['-f', '/secrets/secrets.json'],
            timeout: 5000,
        });
    } catch {
        // Ignore errors - file might not exist
    }
}

// ============================================================================
// Types Re-export
// ============================================================================

export type { SecretsProvider, SecretsBackend };
