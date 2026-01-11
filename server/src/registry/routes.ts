/**
 * Plugin Registry API Routes
 *
 * RESTful API for the federated plugin registry.
 * Provides endpoints for searching, downloading, and publishing plugins.
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 4.4 Federated Plugin Registry
 */

import { Elysia, t } from 'elysia';
import { randomUUID, createHash } from 'crypto';
import {
    getPlugin,
    getPluginById,
    savePlugin,
    searchPlugins,
    getVersion,
    getLatestVersion,
    listVersions,
    saveVersion,
    getUserByToken,
    createUser,
    createToken,
    getUser,
    revokeToken,
    validateTokenScopes,
    getStats,
    incrementDownloads,
    generatePluginId
} from './store.js';
import { validateManifest, scanPlugin } from './validator.js';
import type {
    Plugin,
    PluginVersion,
    PluginManifest,
    SearchQuery,
    PublishResult,
    TokenScope
} from './types.js';

// Lazy logger import
let _logger: any = null;

function getLogger() {
    if (_logger === null) {
        try {
            const { componentLoggers } = require('../logger.js');
            _logger = componentLoggers.http;
        } catch {
            _logger = {
                info: console.log,
                error: console.error,
                warn: console.warn,
                debug: () => {}
            };
        }
    }
    return _logger;
}

/**
 * Extract and validate API token from request
 */
async function authenticateRequest(authorization?: string): Promise<{
    user: any;
    token: any;
} | null> {
    if (!authorization?.startsWith('Bearer ')) {
        return null;
    }

    const token = authorization.slice(7);
    const user = await getUserByToken(token);

    if (!user) {
        return null;
    }

    const tokenObj = user.tokens.find(
        (t: any) => t.hashedToken === createHash('sha256').update(token).digest('hex')
    );

    return { user, token: tokenObj };
}

/**
 * Create registry routes
 */
export function createRegistryRoutes() {
    const log = getLogger();

    return new Elysia({ prefix: '/registry' })
        // ====================================================================
        // Public Endpoints
        // ====================================================================

        // Get registry stats
        .get('/stats', async () => {
            const stats = await getStats();
            return stats;
        })

        // Search plugins
        .get(
            '/search',
            async ({ query }) => {
                const searchQuery: SearchQuery = {
                    query: query.q,
                    author: query.author,
                    keywords: query.keywords?.split(','),
                    sortBy: query.sort as any,
                    sortOrder: query.order as any,
                    page: query.page ? parseInt(query.page) : 1,
                    limit: query.limit ? parseInt(query.limit) : 20
                };

                return searchPlugins(searchQuery);
            },
            {
                query: t.Object({
                    q: t.Optional(t.String()),
                    author: t.Optional(t.String()),
                    keywords: t.Optional(t.String()),
                    sort: t.Optional(t.String()),
                    order: t.Optional(t.String()),
                    page: t.Optional(t.String()),
                    limit: t.Optional(t.String())
                })
            }
        )

        // Get plugin by name
        .get(
            '/plugins/:name',
            async ({ params, set }) => {
                const plugin = await getPlugin(params.name);
                if (!plugin) {
                    set.status = 404;
                    return { error: 'Plugin not found' };
                }
                return plugin;
            },
            {
                params: t.Object({
                    name: t.String()
                })
            }
        )

        // List plugin versions
        .get(
            '/plugins/:name/versions',
            async ({ params, set }) => {
                const plugin = await getPlugin(params.name);
                if (!plugin) {
                    set.status = 404;
                    return { error: 'Plugin not found' };
                }

                const versions = await listVersions(plugin.id);
                return { versions };
            },
            {
                params: t.Object({
                    name: t.String()
                })
            }
        )

        // Get specific version
        .get(
            '/plugins/:name/:version',
            async ({ params, set }) => {
                const plugin = await getPlugin(params.name);
                if (!plugin) {
                    set.status = 404;
                    return { error: 'Plugin not found' };
                }

                const version =
                    params.version === 'latest'
                        ? await getLatestVersion(plugin.id)
                        : await getVersion(plugin.id, params.version);

                if (!version) {
                    set.status = 404;
                    return { error: 'Version not found' };
                }

                // Increment download count
                await incrementDownloads(plugin.id, version.version);

                return version;
            },
            {
                params: t.Object({
                    name: t.String(),
                    version: t.String()
                })
            }
        )

        // Download tarball
        .get(
            '/plugins/:name/:version/tarball',
            async ({ params, set }) => {
                const plugin = await getPlugin(params.name);
                if (!plugin) {
                    set.status = 404;
                    return { error: 'Plugin not found' };
                }

                const version =
                    params.version === 'latest'
                        ? await getLatestVersion(plugin.id)
                        : await getVersion(plugin.id, params.version);

                if (!version) {
                    set.status = 404;
                    return { error: 'Version not found' };
                }

                // In a real implementation, this would redirect to blob storage
                // For now, return the URL
                set.headers['Location'] = version.tarballUrl;
                set.status = 302;
                return { tarballUrl: version.tarballUrl };
            },
            {
                params: t.Object({
                    name: t.String(),
                    version: t.String()
                })
            }
        )

        // ====================================================================
        // Authenticated Endpoints
        // ====================================================================

        // Publish new version
        .post(
            '/plugins',
            async ({ body, headers, set }) => {
                const auth = await authenticateRequest(headers.authorization);
                if (!auth) {
                    set.status = 401;
                    return { error: 'Authentication required' };
                }

                if (!validateTokenScopes(auth.token, ['publish'])) {
                    set.status = 403;
                    return { error: 'Insufficient permissions' };
                }

                const manifest = body.manifest as PluginManifest;

                // Validate manifest
                const validation = validateManifest(manifest);
                if (!validation.valid) {
                    set.status = 400;
                    return { error: 'Invalid manifest', issues: validation.issues };
                }

                // Check if plugin exists
                let plugin = await getPlugin(manifest.name);
                const isNewPlugin = !plugin;

                if (plugin) {
                    // Check ownership
                    if (plugin.authorId !== auth.user.id) {
                        set.status = 403;
                        return { error: 'Not authorized to publish to this plugin' };
                    }

                    // Check version doesn't exist
                    const existing = await getVersion(plugin.id, manifest.version);
                    if (existing) {
                        set.status = 409;
                        return { error: `Version ${manifest.version} already exists` };
                    }
                } else {
                    // Create new plugin
                    const id = generatePluginId(manifest.name);
                    plugin = {
                        id,
                        name: manifest.name,
                        description: manifest.description,
                        author: auth.user.username,
                        authorId: auth.user.id,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        latestVersion: manifest.version,
                        versions: [],
                        keywords: manifest.keywords || [],
                        homepage: manifest.homepage,
                        repository: manifest.repository,
                        license: manifest.license,
                        downloads: 0,
                        stars: 0,
                        verified: false,
                        deprecated: false
                    };
                }

                // In a real implementation, we'd:
                // 1. Upload tarball to blob storage
                // 2. Calculate hash
                // 3. Run security scan
                // For now, simulate
                const tarballUrl = `https://registry.example.com/tarballs/${manifest.name}/${manifest.version}.tgz`;
                const tarballSha256 = createHash('sha256')
                    .update(JSON.stringify(manifest))
                    .digest('hex');

                // Create version
                const version: PluginVersion = {
                    id: randomUUID(),
                    pluginId: plugin.id,
                    version: manifest.version,
                    status: 'published',
                    manifest,
                    tarballUrl,
                    tarballSha256,
                    size: JSON.stringify(manifest).length,
                    publishedAt: new Date(),
                    publishedBy: auth.user.username,
                    downloads: 0
                };

                // Update plugin
                plugin.versions.push(manifest.version);
                plugin.latestVersion = manifest.version;
                plugin.updatedAt = new Date();

                // Save
                await savePlugin(plugin);
                await saveVersion(version);

                // Start async security scan
                scanPlugin(plugin.id, manifest.version).catch(err => {
                    log.error({ error: err.message }, 'Security scan failed');
                });

                log.info(
                    {
                        plugin: manifest.name,
                        version: manifest.version,
                        user: auth.user.username
                    },
                    isNewPlugin ? 'New plugin published' : 'New version published'
                );

                const result: PublishResult = {
                    success: true,
                    pluginId: plugin.id,
                    version: manifest.version,
                    tarballUrl,
                    message: isNewPlugin
                        ? `Plugin ${manifest.name} published successfully`
                        : `Version ${manifest.version} published successfully`
                };

                set.status = isNewPlugin ? 201 : 200;
                return result;
            },
            {
                body: t.Object({
                    manifest: t.Object({
                        name: t.String(),
                        version: t.String(),
                        description: t.String(),
                        author: t.String(),
                        license: t.String(),
                        homepage: t.Optional(t.String()),
                        repository: t.Optional(t.String()),
                        keywords: t.Optional(t.Array(t.String())),
                        capabilities: t.Optional(t.Array(t.String())),
                        dependencies: t.Optional(t.Record(t.String(), t.String())),
                        hooks: t.Optional(t.Any()),
                        commands: t.Optional(t.Any()),
                        skills: t.Optional(t.Any()),
                        agents: t.Optional(t.Any()),
                        mcp: t.Optional(t.Any())
                    })
                })
            }
        )

        // Deprecate plugin
        .post(
            '/plugins/:name/deprecate',
            async ({ params, body, headers, set }) => {
                const auth = await authenticateRequest(headers.authorization);
                if (!auth) {
                    set.status = 401;
                    return { error: 'Authentication required' };
                }

                const plugin = await getPlugin(params.name);
                if (!plugin) {
                    set.status = 404;
                    return { error: 'Plugin not found' };
                }

                if (plugin.authorId !== auth.user.id) {
                    set.status = 403;
                    return { error: 'Not authorized' };
                }

                plugin.deprecated = true;
                plugin.deprecationMessage = body.message;
                plugin.updatedAt = new Date();

                await savePlugin(plugin);

                log.info(
                    { plugin: params.name, user: auth.user.username },
                    'Plugin deprecated'
                );

                return { success: true, message: 'Plugin deprecated' };
            },
            {
                params: t.Object({
                    name: t.String()
                }),
                body: t.Object({
                    message: t.Optional(t.String())
                })
            }
        )

        // Yank version (remove from downloads)
        .delete(
            '/plugins/:name/:version',
            async ({ params, headers, set }) => {
                const auth = await authenticateRequest(headers.authorization);
                if (!auth) {
                    set.status = 401;
                    return { error: 'Authentication required' };
                }

                const plugin = await getPlugin(params.name);
                if (!plugin) {
                    set.status = 404;
                    return { error: 'Plugin not found' };
                }

                if (plugin.authorId !== auth.user.id) {
                    set.status = 403;
                    return { error: 'Not authorized' };
                }

                const version = await getVersion(plugin.id, params.version);
                if (!version) {
                    set.status = 404;
                    return { error: 'Version not found' };
                }

                version.status = 'yanked';
                await saveVersion(version);

                log.info(
                    {
                        plugin: params.name,
                        version: params.version,
                        user: auth.user.username
                    },
                    'Version yanked'
                );

                return { success: true, message: 'Version yanked' };
            },
            {
                params: t.Object({
                    name: t.String(),
                    version: t.String()
                })
            }
        )

        // ====================================================================
        // User Endpoints
        // ====================================================================

        // Register user
        .post(
            '/users',
            async ({ body, set }) => {
                try {
                    const user = await createUser(body.username, body.email);

                    // Create initial token
                    const { token } = await createToken(user.id, 'default', [
                        'read',
                        'publish'
                    ]);

                    log.info({ username: body.username }, 'User registered');

                    set.status = 201;
                    return {
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email
                        },
                        token
                    };
                } catch (error) {
                    set.status = 400;
                    return { error: (error as Error).message };
                }
            },
            {
                body: t.Object({
                    username: t.String({ minLength: 3, maxLength: 32 }),
                    email: t.String({ format: 'email' })
                })
            }
        )

        // Get current user
        .get('/users/me', async ({ headers, set }) => {
            const auth = await authenticateRequest(headers.authorization);
            if (!auth) {
                set.status = 401;
                return { error: 'Authentication required' };
            }

            return {
                id: auth.user.id,
                username: auth.user.username,
                email: auth.user.email,
                createdAt: auth.user.createdAt,
                verified: auth.user.verified,
                tokens: auth.user.tokens.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    createdAt: t.createdAt,
                    lastUsedAt: t.lastUsedAt,
                    scopes: t.scopes
                }))
            };
        })

        // Create new token
        .post(
            '/users/me/tokens',
            async ({ body, headers, set }) => {
                const auth = await authenticateRequest(headers.authorization);
                if (!auth) {
                    set.status = 401;
                    return { error: 'Authentication required' };
                }

                const { token, apiToken } = await createToken(
                    auth.user.id,
                    body.name,
                    body.scopes as TokenScope[]
                );

                set.status = 201;
                return {
                    token,
                    id: apiToken.id,
                    name: apiToken.name,
                    scopes: apiToken.scopes
                };
            },
            {
                body: t.Object({
                    name: t.String(),
                    scopes: t.Array(t.String())
                })
            }
        )

        // Revoke token
        .delete(
            '/users/me/tokens/:tokenId',
            async ({ params, headers, set }) => {
                const auth = await authenticateRequest(headers.authorization);
                if (!auth) {
                    set.status = 401;
                    return { error: 'Authentication required' };
                }

                const success = await revokeToken(auth.user.id, params.tokenId);
                if (!success) {
                    set.status = 404;
                    return { error: 'Token not found' };
                }

                return { success: true, message: 'Token revoked' };
            },
            {
                params: t.Object({
                    tokenId: t.String()
                })
            }
        );
}

export default createRegistryRoutes;
