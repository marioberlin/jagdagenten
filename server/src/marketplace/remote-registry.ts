/**
 * Remote Registry Service
 * 
 * Enables discovering and installing skills from external LiquidOS registries.
 */

// ============================================================================
// Types
// ============================================================================

export interface RemoteRegistry {
    url: string;
    name: string;
    apiVersion: string;
}

export interface RemoteSkill {
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    author: string;
    version: string;
    stars: number;
    downloads: number;
    sourceRegistry: string;
}

// ============================================================================
// Default Registries
// ============================================================================

const DEFAULT_REGISTRIES: RemoteRegistry[] = [
    {
        url: 'https://liquid-os.app/api/v1/public',
        name: 'LiquidOS Official',
        apiVersion: '1.0',
    },
];

// ============================================================================
// Remote Registry Service
// ============================================================================

export class RemoteRegistryService {
    private registries: RemoteRegistry[] = [...DEFAULT_REGISTRIES];

    /**
     * Add a custom registry
     */
    addRegistry(registry: RemoteRegistry): void {
        if (!this.registries.find(r => r.url === registry.url)) {
            this.registries.push(registry);
        }
    }

    /**
     * Remove a registry
     */
    removeRegistry(url: string): void {
        this.registries = this.registries.filter(r => r.url !== url);
    }

    /**
     * Get all configured registries
     */
    getRegistries(): RemoteRegistry[] {
        return [...this.registries];
    }

    /**
     * Fetch skills from a remote registry
     */
    async fetchSkills(
        registryUrl: string,
        options?: { query?: string; category?: string; limit?: number }
    ): Promise<RemoteSkill[]> {
        try {
            const params = new URLSearchParams();
            if (options?.query) params.set('q', options.query);
            if (options?.category) params.set('category', options.category);
            if (options?.limit) params.set('limit', options.limit.toString());

            const url = `${registryUrl}/skills?${params}`;
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                throw new Error(`Registry returned ${response.status}`);
            }

            const data = await response.json();

            return (data.skills || []).map((skill: any) => ({
                ...skill,
                sourceRegistry: registryUrl,
            }));
        } catch (error) {
            console.error(`[RemoteRegistry] Failed to fetch from ${registryUrl}:`, error);
            return [];
        }
    }

    /**
     * Search across all registries
     */
    async searchAllRegistries(query: string, limit = 20): Promise<RemoteSkill[]> {
        const results = await Promise.all(
            this.registries.map(r =>
                this.fetchSkills(r.url, { query, limit: Math.ceil(limit / this.registries.length) })
            )
        );

        // Merge and dedupe by skill ID
        const seen = new Set<string>();
        const merged: RemoteSkill[] = [];

        for (const skills of results) {
            for (const skill of skills) {
                const key = `${skill.sourceRegistry}:${skill.id}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    merged.push(skill);
                }
            }
        }

        return merged.slice(0, limit);
    }

    /**
     * Get skill details from a remote registry
     */
    async getRemoteSkill(registryUrl: string, skillId: string): Promise<RemoteSkill | null> {
        try {
            const response = await fetch(`${registryUrl}/skills/${skillId}`, {
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return {
                ...data.skill,
                sourceRegistry: registryUrl,
            };
        } catch (error) {
            console.error(`[RemoteRegistry] Failed to get skill ${skillId}:`, error);
            return null;
        }
    }

    /**
     * Check if a registry is reachable
     */
    async pingRegistry(registryUrl: string): Promise<boolean> {
        try {
            const response = await fetch(`${registryUrl}/info`, {
                signal: AbortSignal.timeout(5000),
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

// ============================================================================
// Singleton
// ============================================================================

let instance: RemoteRegistryService | null = null;

export function getRemoteRegistryService(): RemoteRegistryService {
    if (!instance) {
        instance = new RemoteRegistryService();
    }
    return instance;
}

export default RemoteRegistryService;
