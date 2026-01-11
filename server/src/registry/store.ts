/**
 * Plugin Registry Store
 *
 * In-memory store with Redis persistence for the plugin registry.
 * Provides CRUD operations for plugins, versions, and users.
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 4.4 Federated Plugin Registry
 */

import { createHash, randomUUID } from 'crypto';
import type {
    Plugin,
    PluginVersion,
    PluginManifest,
    RegistryUser,
    APIToken,
    SearchQuery,
    SearchResult,
    SecurityScan,
    RegistryStats,
    TokenScope
} from './types.js';

// Lazy imports for optional dependencies
let _redis: any = null;

function getRedis() {
    if (_redis === null) {
        try {
            const { getRedisClient, isRedisConnected } = require('../cache.js');
            if (isRedisConnected()) {
                _redis = getRedisClient();
            } else {
                _redis = false;
            }
        } catch {
            _redis = false;
        }
    }
    return _redis || null;
}

/**
 * In-memory store for development/testing
 */
class MemoryStore {
    plugins: Map<string, Plugin> = new Map();
    versions: Map<string, PluginVersion> = new Map();
    users: Map<string, RegistryUser> = new Map();
    tokenIndex: Map<string, string> = new Map(); // hashedToken -> userId
}

const memoryStore = new MemoryStore();

/**
 * Generate deterministic plugin ID from name
 */
function generatePluginId(name: string): string {
    return `plugin:${name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
}

/**
 * Generate version key
 */
function versionKey(pluginId: string, version: string): string {
    return `${pluginId}@${version}`;
}

/**
 * Hash API token for storage
 */
function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

// ============================================================================
// Plugin Operations
// ============================================================================

/**
 * Get plugin by name
 */
export async function getPlugin(name: string): Promise<Plugin | null> {
    const id = generatePluginId(name);
    const redis = getRedis();

    if (redis) {
        try {
            const data = await redis.get(`registry:${id}`);
            return data ? JSON.parse(data) : null;
        } catch {
            // Fall back to memory
        }
    }

    return memoryStore.plugins.get(id) || null;
}

/**
 * Get plugin by ID
 */
export async function getPluginById(id: string): Promise<Plugin | null> {
    const redis = getRedis();

    if (redis) {
        try {
            const data = await redis.get(`registry:${id}`);
            return data ? JSON.parse(data) : null;
        } catch {
            // Fall back to memory
        }
    }

    return memoryStore.plugins.get(id) || null;
}

/**
 * Create or update plugin
 */
export async function savePlugin(plugin: Plugin): Promise<void> {
    const redis = getRedis();

    if (redis) {
        try {
            await redis.set(`registry:${plugin.id}`, JSON.stringify(plugin));
            // Add to search index
            await redis.sadd('registry:plugins', plugin.id);
            return;
        } catch {
            // Fall back to memory
        }
    }

    memoryStore.plugins.set(plugin.id, plugin);
}

/**
 * Delete plugin
 */
export async function deletePlugin(id: string): Promise<boolean> {
    const redis = getRedis();

    if (redis) {
        try {
            const deleted = await redis.del(`registry:${id}`);
            await redis.srem('registry:plugins', id);
            return deleted > 0;
        } catch {
            // Fall back to memory
        }
    }

    return memoryStore.plugins.delete(id);
}

/**
 * List all plugins
 */
export async function listPlugins(): Promise<Plugin[]> {
    const redis = getRedis();

    if (redis) {
        try {
            const ids = await redis.smembers('registry:plugins');
            const plugins: Plugin[] = [];
            for (const id of ids) {
                const data = await redis.get(`registry:${id}`);
                if (data) {
                    plugins.push(JSON.parse(data));
                }
            }
            return plugins;
        } catch {
            // Fall back to memory
        }
    }

    return Array.from(memoryStore.plugins.values());
}

/**
 * Search plugins
 */
export async function searchPlugins(query: SearchQuery): Promise<SearchResult> {
    const allPlugins = await listPlugins();
    let filtered = allPlugins;

    // Filter by query string
    if (query.query) {
        const q = query.query.toLowerCase();
        filtered = filtered.filter(
            p =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.keywords.some(k => k.toLowerCase().includes(q))
        );
    }

    // Filter by author
    if (query.author) {
        filtered = filtered.filter(p => p.author.toLowerCase() === query.author!.toLowerCase());
    }

    // Filter by keywords
    if (query.keywords?.length) {
        filtered = filtered.filter(p => query.keywords!.some(k => p.keywords.includes(k)));
    }

    // Sort
    const sortBy = query.sortBy || 'downloads';
    const sortOrder = query.sortOrder || 'desc';
    filtered.sort((a, b) => {
        let cmp = 0;
        switch (sortBy) {
            case 'downloads':
                cmp = a.downloads - b.downloads;
                break;
            case 'stars':
                cmp = a.stars - b.stars;
                break;
            case 'updated':
                cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                break;
            case 'name':
                cmp = a.name.localeCompare(b.name);
                break;
        }
        return sortOrder === 'asc' ? cmp : -cmp;
    });

    // Paginate
    const page = query.page || 1;
    const limit = query.limit || 20;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
        plugins: paginated,
        total: filtered.length,
        page,
        limit,
        hasMore: start + limit < filtered.length
    };
}

// ============================================================================
// Version Operations
// ============================================================================

/**
 * Get plugin version
 */
export async function getVersion(pluginId: string, version: string): Promise<PluginVersion | null> {
    const key = versionKey(pluginId, version);
    const redis = getRedis();

    if (redis) {
        try {
            const data = await redis.get(`registry:version:${key}`);
            return data ? JSON.parse(data) : null;
        } catch {
            // Fall back to memory
        }
    }

    return memoryStore.versions.get(key) || null;
}

/**
 * Get latest version of a plugin
 */
export async function getLatestVersion(pluginId: string): Promise<PluginVersion | null> {
    const plugin = await getPluginById(pluginId);
    if (!plugin?.latestVersion) return null;
    return getVersion(pluginId, plugin.latestVersion);
}

/**
 * List all versions of a plugin
 */
export async function listVersions(pluginId: string): Promise<PluginVersion[]> {
    const plugin = await getPluginById(pluginId);
    if (!plugin) return [];

    const versions: PluginVersion[] = [];
    for (const ver of plugin.versions) {
        const v = await getVersion(pluginId, ver);
        if (v) versions.push(v);
    }

    // Sort by semver (newest first)
    versions.sort((a, b) => compareSemver(b.version, a.version));

    return versions;
}

/**
 * Save plugin version
 */
export async function saveVersion(version: PluginVersion): Promise<void> {
    const key = versionKey(version.pluginId, version.version);
    const redis = getRedis();

    if (redis) {
        try {
            await redis.set(`registry:version:${key}`, JSON.stringify(version));
            return;
        } catch {
            // Fall back to memory
        }
    }

    memoryStore.versions.set(key, version);
}

/**
 * Delete plugin version
 */
export async function deleteVersion(pluginId: string, version: string): Promise<boolean> {
    const key = versionKey(pluginId, version);
    const redis = getRedis();

    if (redis) {
        try {
            const deleted = await redis.del(`registry:version:${key}`);
            return deleted > 0;
        } catch {
            // Fall back to memory
        }
    }

    return memoryStore.versions.delete(key);
}

// ============================================================================
// User Operations
// ============================================================================

/**
 * Get user by ID
 */
export async function getUser(id: string): Promise<RegistryUser | null> {
    const redis = getRedis();

    if (redis) {
        try {
            const data = await redis.get(`registry:user:${id}`);
            return data ? JSON.parse(data) : null;
        } catch {
            // Fall back to memory
        }
    }

    return memoryStore.users.get(id) || null;
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string): Promise<RegistryUser | null> {
    const redis = getRedis();

    if (redis) {
        try {
            const id = await redis.get(`registry:username:${username.toLowerCase()}`);
            if (id) {
                return getUser(id);
            }
            return null;
        } catch {
            // Fall back to memory
        }
    }

    for (const user of memoryStore.users.values()) {
        if (user.username.toLowerCase() === username.toLowerCase()) {
            return user;
        }
    }
    return null;
}

/**
 * Get user by API token
 */
export async function getUserByToken(token: string): Promise<RegistryUser | null> {
    const hashed = hashToken(token);
    const redis = getRedis();

    if (redis) {
        try {
            const userId = await redis.get(`registry:token:${hashed}`);
            if (userId) {
                const user = await getUser(userId);
                if (user) {
                    // Update last used timestamp
                    const tokenObj = user.tokens.find(t => t.hashedToken === hashed);
                    if (tokenObj) {
                        tokenObj.lastUsedAt = new Date();
                        await saveUser(user);
                    }
                }
                return user;
            }
            return null;
        } catch {
            // Fall back to memory
        }
    }

    const userId = memoryStore.tokenIndex.get(hashed);
    if (userId) {
        const user = memoryStore.users.get(userId);
        if (user) {
            const tokenObj = user.tokens.find(t => t.hashedToken === hashed);
            if (tokenObj) {
                tokenObj.lastUsedAt = new Date();
            }
        }
        return user || null;
    }
    return null;
}

/**
 * Save user
 */
export async function saveUser(user: RegistryUser): Promise<void> {
    const redis = getRedis();

    if (redis) {
        try {
            await redis.set(`registry:user:${user.id}`, JSON.stringify(user));
            await redis.set(`registry:username:${user.username.toLowerCase()}`, user.id);
            // Index all tokens
            for (const token of user.tokens) {
                await redis.set(`registry:token:${token.hashedToken}`, user.id);
            }
            return;
        } catch {
            // Fall back to memory
        }
    }

    memoryStore.users.set(user.id, user);
    for (const token of user.tokens) {
        memoryStore.tokenIndex.set(token.hashedToken, user.id);
    }
}

/**
 * Create new user
 */
export async function createUser(username: string, email: string): Promise<RegistryUser> {
    const existing = await getUserByUsername(username);
    if (existing) {
        throw new Error(`Username "${username}" is already taken`);
    }

    const user: RegistryUser = {
        id: randomUUID(),
        username,
        email,
        createdAt: new Date(),
        verified: false,
        tokens: []
    };

    await saveUser(user);
    return user;
}

/**
 * Create API token for user
 */
export async function createToken(
    userId: string,
    name: string,
    scopes: TokenScope[],
    expiresIn?: number // ms
): Promise<{ token: string; apiToken: APIToken }> {
    const user = await getUser(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const token = `lgr_${randomUUID().replace(/-/g, '')}`;
    const apiToken: APIToken = {
        id: randomUUID(),
        name,
        hashedToken: hashToken(token),
        createdAt: new Date(),
        expiresAt: expiresIn ? new Date(Date.now() + expiresIn) : undefined,
        scopes
    };

    user.tokens.push(apiToken);
    await saveUser(user);

    return { token, apiToken };
}

/**
 * Revoke API token
 */
export async function revokeToken(userId: string, tokenId: string): Promise<boolean> {
    const user = await getUser(userId);
    if (!user) return false;

    const index = user.tokens.findIndex(t => t.id === tokenId);
    if (index === -1) return false;

    const token = user.tokens[index];
    user.tokens.splice(index, 1);
    await saveUser(user);

    // Remove from index
    const redis = getRedis();
    if (redis) {
        try {
            await redis.del(`registry:token:${token.hashedToken}`);
        } catch {
            // Ignore
        }
    } else {
        memoryStore.tokenIndex.delete(token.hashedToken);
    }

    return true;
}

/**
 * Validate token scopes
 */
export function validateTokenScopes(token: APIToken, required: TokenScope[]): boolean {
    // Check expiry
    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
        return false;
    }

    // Check scopes
    return required.every(scope => token.scopes.includes(scope) || token.scopes.includes('admin'));
}

// ============================================================================
// Security Scan Operations
// ============================================================================

/**
 * Save security scan
 */
export async function saveScan(scan: SecurityScan): Promise<void> {
    const key = `${scan.pluginId}@${scan.version}`;
    const redis = getRedis();

    if (redis) {
        try {
            await redis.set(`registry:scan:${key}`, JSON.stringify(scan));
            return;
        } catch {
            // Ignore
        }
    }

    // Update version with scan
    const version = await getVersion(scan.pluginId, scan.version);
    if (version) {
        version.securityScan = scan;
        await saveVersion(version);
    }
}

/**
 * Get security scan for version
 */
export async function getScan(pluginId: string, version: string): Promise<SecurityScan | null> {
    const key = `${pluginId}@${version}`;
    const redis = getRedis();

    if (redis) {
        try {
            const data = await redis.get(`registry:scan:${key}`);
            return data ? JSON.parse(data) : null;
        } catch {
            // Ignore
        }
    }

    const ver = await getVersion(pluginId, version);
    return ver?.securityScan || null;
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get registry statistics
 */
export async function getStats(): Promise<RegistryStats> {
    const plugins = await listPlugins();
    let totalVersions = 0;
    let totalDownloads = 0;
    const recentPublishes: PluginVersion[] = [];

    for (const plugin of plugins) {
        totalVersions += plugin.versions.length;
        totalDownloads += plugin.downloads;

        const latest = await getLatestVersion(plugin.id);
        if (latest) {
            recentPublishes.push(latest);
        }
    }

    // Sort recent publishes by date
    recentPublishes.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Top plugins by downloads
    const topPlugins = [...plugins].sort((a, b) => b.downloads - a.downloads).slice(0, 10);

    return {
        totalPlugins: plugins.length,
        totalVersions,
        totalDownloads,
        totalUsers: memoryStore.users.size, // Approximation
        recentPublishes: recentPublishes.slice(0, 10),
        topPlugins
    };
}

/**
 * Increment download count
 */
export async function incrementDownloads(pluginId: string, version: string): Promise<void> {
    const plugin = await getPluginById(pluginId);
    if (plugin) {
        plugin.downloads++;
        await savePlugin(plugin);
    }

    const ver = await getVersion(pluginId, version);
    if (ver) {
        ver.downloads++;
        await saveVersion(ver);
    }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Compare semver versions
 */
function compareSemver(a: string, b: string): number {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
        const na = pa[i] || 0;
        const nb = pb[i] || 0;
        if (na > nb) return 1;
        if (na < nb) return -1;
    }

    return 0;
}

/**
 * Clear all data (for testing)
 */
export async function clearAll(): Promise<void> {
    const redis = getRedis();

    if (redis) {
        try {
            const keys = await redis.keys('registry:*');
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } catch {
            // Ignore
        }
    }

    memoryStore.plugins.clear();
    memoryStore.versions.clear();
    memoryStore.users.clear();
    memoryStore.tokenIndex.clear();
}

export { generatePluginId, versionKey, hashToken, compareSemver };
