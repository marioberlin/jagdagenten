/**
 * Tests for Federated Plugin Registry
 * @see docs/IMPLEMENTATION_PLAN.md - Item 4.4
 */

import { describe, it, expect, beforeEach, afterAll } from 'bun:test';

// Test the validator module
describe('Plugin Validator', () => {
    // Import validator functions
    const validatorPath = '../../server/src/registry/validator.js';
    let validateManifest: any;
    let scanCode: any;
    let calculateScore: any;

    beforeEach(async () => {
        const validator = await import(validatorPath);
        validateManifest = validator.validateManifest;
        scanCode = validator.scanCode;
        calculateScore = validator.calculateScore;
    });

    describe('validateManifest', () => {
        it('should validate a correct manifest', () => {
            const manifest = {
                name: 'my-plugin',
                version: '1.0.0',
                description: 'A test plugin for validation',
                author: 'Test Author',
                license: 'MIT'
            };

            const result = validateManifest(manifest);
            expect(result.valid).toBe(true);
            expect(result.issues.filter((i: any) => i.severity === 'error')).toHaveLength(0);
        });

        it('should reject missing required fields', () => {
            const manifest = {
                name: 'my-plugin'
            };

            const result = validateManifest(manifest);
            expect(result.valid).toBe(false);
            expect(result.issues.some((i: any) => i.field === 'version')).toBe(true);
            expect(result.issues.some((i: any) => i.field === 'description')).toBe(true);
            expect(result.issues.some((i: any) => i.field === 'author')).toBe(true);
            expect(result.issues.some((i: any) => i.field === 'license')).toBe(true);
        });

        it('should reject invalid plugin name format', () => {
            const manifest = {
                name: 'MyPlugin', // Should be lowercase
                version: '1.0.0',
                description: 'A test plugin',
                author: 'Test Author',
                license: 'MIT'
            };

            const result = validateManifest(manifest);
            expect(result.valid).toBe(false);
            expect(result.issues.some((i: any) => i.field === 'name')).toBe(true);
        });

        it('should reject reserved plugin names', () => {
            const reservedNames = ['core', 'liquid', 'glass', 'system', 'admin'];

            for (const name of reservedNames) {
                const manifest = {
                    name,
                    version: '1.0.0',
                    description: 'A test plugin',
                    author: 'Test Author',
                    license: 'MIT'
                };

                const result = validateManifest(manifest);
                expect(result.valid).toBe(false);
                expect(
                    result.issues.some(
                        (i: any) => i.field === 'name' && i.message.includes('reserved')
                    )
                ).toBe(true);
            }
        });

        it('should reject invalid semver versions', () => {
            const invalidVersions = ['1.0', 'v1.0.0', '1.0.0.0', 'latest', 'abc'];

            for (const version of invalidVersions) {
                const manifest = {
                    name: 'my-plugin',
                    version,
                    description: 'A test plugin',
                    author: 'Test Author',
                    license: 'MIT'
                };

                const result = validateManifest(manifest);
                expect(result.valid).toBe(false);
                expect(result.issues.some((i: any) => i.field === 'version')).toBe(true);
            }
        });

        it('should accept valid semver versions', () => {
            const validVersions = ['1.0.0', '0.1.0', '10.20.30', '1.0.0-beta.1', '1.0.0+build'];

            for (const version of validVersions) {
                const manifest = {
                    name: 'my-plugin',
                    version,
                    description: 'A test plugin',
                    author: 'Test Author',
                    license: 'MIT'
                };

                const result = validateManifest(manifest);
                expect(result.valid).toBe(true);
            }
        });

        it('should validate capabilities', () => {
            const manifest = {
                name: 'my-plugin',
                version: '1.0.0',
                description: 'A test plugin',
                author: 'Test Author',
                license: 'MIT',
                capabilities: ['filesystem:read', 'network:http', 'invalid-capability']
            };

            const result = validateManifest(manifest);
            expect(result.valid).toBe(false);
            expect(
                result.issues.some(
                    (i: any) =>
                        i.field === 'capabilities' && i.message.includes('invalid-capability')
                )
            ).toBe(true);
        });

        it('should warn about dangerous capability combinations', () => {
            const manifest = {
                name: 'my-plugin',
                version: '1.0.0',
                description: 'A test plugin',
                author: 'Test Author',
                license: 'MIT',
                capabilities: ['system:exec', 'network:http']
            };

            const result = validateManifest(manifest);
            expect(result.warnings.length).toBeGreaterThan(0);
            expect(result.warnings.some((w: string) => w.includes('system:exec'))).toBe(true);
        });

        it('should validate hook types', () => {
            const manifest = {
                name: 'my-plugin',
                version: '1.0.0',
                description: 'A test plugin',
                author: 'Test Author',
                license: 'MIT',
                hooks: {
                    PreToolUse: [{ command: 'echo test' }],
                    InvalidHook: [{ command: 'echo test' }]
                }
            };

            const result = validateManifest(manifest);
            expect(result.valid).toBe(false);
            expect(
                result.issues.some(
                    (i: any) => i.field === 'hooks' && i.message.includes('InvalidHook')
                )
            ).toBe(true);
        });

        it('should require command or prompt in hooks', () => {
            const manifest = {
                name: 'my-plugin',
                version: '1.0.0',
                description: 'A test plugin',
                author: 'Test Author',
                license: 'MIT',
                hooks: {
                    PreToolUse: [{}] // Missing both command and prompt
                }
            };

            const result = validateManifest(manifest);
            expect(result.valid).toBe(false);
            expect(
                result.issues.some(
                    (i: any) => i.field === 'hooks' && i.message.includes('command or prompt')
                )
            ).toBe(true);
        });

        it('should validate commands', () => {
            const manifest = {
                name: 'my-plugin',
                version: '1.0.0',
                description: 'A test plugin',
                author: 'Test Author',
                license: 'MIT',
                commands: [
                    { name: 'test-cmd', description: 'Test command', file: 'commands/test.md' },
                    { description: 'Missing name' } // Invalid
                ]
            };

            const result = validateManifest(manifest);
            expect(result.valid).toBe(false);
        });

        it('should validate MCP servers', () => {
            const manifest = {
                name: 'my-plugin',
                version: '1.0.0',
                description: 'A test plugin',
                author: 'Test Author',
                license: 'MIT',
                mcp: [
                    { name: 'test-mcp', type: 'stdio', command: 'bun run server.ts' },
                    { name: 'http-mcp', type: 'http' } // Missing URL
                ]
            };

            const result = validateManifest(manifest);
            expect(result.valid).toBe(false);
            expect(result.issues.some((i: any) => i.message.includes('must have a URL'))).toBe(
                true
            );
        });
    });

    describe('scanCode', () => {
        it('should detect eval usage', () => {
            const code = `
                const result = eval(userInput);
            `;
            const findings = scanCode(code, 'test.ts');
            expect(findings.some(f => f.message.includes('eval'))).toBe(true);
        });

        it('should detect dynamic function creation', () => {
            const code = `
                const fn = new Function('a', 'return a * 2');
            `;
            const findings = scanCode(code, 'test.ts');
            expect(findings.some(f => f.message.includes('Dynamic function'))).toBe(true);
        });

        it('should detect child_process usage', () => {
            const code = `
                import { exec } from 'child_process';
                exec('ls -la');
            `;
            const findings = scanCode(code, 'test.ts');
            expect(findings.some(f => f.message.includes('child_process'))).toBe(true);
        });

        it('should detect potential command injection', () => {
            const code = `
                exec(\`rm -rf \${userPath}\`);
            `;
            const findings = scanCode(code, 'test.ts');
            expect(findings.some(f => f.message.includes('command injection'))).toBe(true);
        });

        it('should detect hardcoded secrets', () => {
            const code = `
                const api_key = "sk_live_abc123";
            `;
            const findings = scanCode(code, 'test.ts');
            expect(findings.some(f => f.message.includes('secret'))).toBe(true);
        });

        it('should detect dangerous file operations', () => {
            const code = `
                rm -rf /var/log
            `;
            const findings = scanCode(code, 'test.sh');
            expect(
                findings.some(f => f.message.includes('Dangerous file deletion'))
            ).toBe(true);
        });

        it('should not flag safe code', () => {
            const code = `
                function add(a: number, b: number): number {
                    return a + b;
                }
                console.log(add(1, 2));
            `;
            const findings = scanCode(code, 'test.ts');
            expect(findings).toHaveLength(0);
        });
    });

    describe('calculateScore', () => {
        it('should start at 100 for no findings', () => {
            const score = calculateScore([]);
            expect(score).toBe(100);
        });

        it('should deduct 30 for critical findings', () => {
            const findings = [
                { severity: 'critical' as const, type: 'test', message: 'test' }
            ];
            const score = calculateScore(findings);
            expect(score).toBe(70);
        });

        it('should deduct 20 for high findings', () => {
            const findings = [{ severity: 'high' as const, type: 'test', message: 'test' }];
            const score = calculateScore(findings);
            expect(score).toBe(80);
        });

        it('should deduct 10 for medium findings', () => {
            const findings = [
                { severity: 'medium' as const, type: 'test', message: 'test' }
            ];
            const score = calculateScore(findings);
            expect(score).toBe(90);
        });

        it('should deduct 5 for low findings', () => {
            const findings = [{ severity: 'low' as const, type: 'test', message: 'test' }];
            const score = calculateScore(findings);
            expect(score).toBe(95);
        });

        it('should not go below 0', () => {
            const findings = [
                { severity: 'critical' as const, type: 'test', message: 'test1' },
                { severity: 'critical' as const, type: 'test', message: 'test2' },
                { severity: 'critical' as const, type: 'test', message: 'test3' },
                { severity: 'critical' as const, type: 'test', message: 'test4' }
            ];
            const score = calculateScore(findings);
            expect(score).toBe(0);
        });
    });
});

// Test the store module
describe('Plugin Store', () => {
    const storePath = '../../server/src/registry/store.js';
    let store: any;

    beforeEach(async () => {
        store = await import(storePath);
        // Clear store before each test
        await store.clearAll();
    });

    afterAll(async () => {
        if (store) {
            await store.clearAll();
        }
    });

    describe('Plugin Operations', () => {
        it('should save and retrieve a plugin', async () => {
            const plugin = {
                id: 'plugin:test-plugin',
                name: 'test-plugin',
                description: 'A test plugin',
                author: 'Test Author',
                authorId: 'user-123',
                createdAt: new Date(),
                updatedAt: new Date(),
                latestVersion: '1.0.0',
                versions: ['1.0.0'],
                keywords: ['test'],
                license: 'MIT',
                downloads: 0,
                stars: 0,
                verified: false,
                deprecated: false
            };

            await store.savePlugin(plugin);
            const retrieved = await store.getPlugin('test-plugin');

            expect(retrieved).not.toBeNull();
            expect(retrieved.name).toBe('test-plugin');
            expect(retrieved.description).toBe('A test plugin');
        });

        it('should return null for non-existent plugin', async () => {
            const plugin = await store.getPlugin('non-existent');
            expect(plugin).toBeNull();
        });

        it('should delete a plugin', async () => {
            const plugin = {
                id: 'plugin:delete-me',
                name: 'delete-me',
                description: 'Plugin to delete',
                author: 'Test',
                authorId: 'user-123',
                createdAt: new Date(),
                updatedAt: new Date(),
                latestVersion: '1.0.0',
                versions: ['1.0.0'],
                keywords: [],
                license: 'MIT',
                downloads: 0,
                stars: 0,
                verified: false,
                deprecated: false
            };

            await store.savePlugin(plugin);
            const deleted = await store.deletePlugin(plugin.id);

            expect(deleted).toBe(true);

            const retrieved = await store.getPlugin('delete-me');
            expect(retrieved).toBeNull();
        });

        it('should list all plugins', async () => {
            const plugins = [
                {
                    id: 'plugin:list-test-1',
                    name: 'list-test-1',
                    description: 'Plugin 1',
                    author: 'Test',
                    authorId: 'user-123',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    latestVersion: '1.0.0',
                    versions: ['1.0.0'],
                    keywords: [],
                    license: 'MIT',
                    downloads: 10,
                    stars: 0,
                    verified: false,
                    deprecated: false
                },
                {
                    id: 'plugin:list-test-2',
                    name: 'list-test-2',
                    description: 'Plugin 2',
                    author: 'Test',
                    authorId: 'user-123',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    latestVersion: '1.0.0',
                    versions: ['1.0.0'],
                    keywords: [],
                    license: 'MIT',
                    downloads: 5,
                    stars: 0,
                    verified: false,
                    deprecated: false
                }
            ];

            for (const p of plugins) {
                await store.savePlugin(p);
            }

            const list = await store.listPlugins();
            expect(list.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Search Operations', () => {
        beforeEach(async () => {
            // Seed test data
            const plugins = [
                {
                    id: 'plugin:search-ui',
                    name: 'search-ui',
                    description: 'UI components for search',
                    author: 'UI Team',
                    authorId: 'user-1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    latestVersion: '1.0.0',
                    versions: ['1.0.0'],
                    keywords: ['ui', 'search'],
                    license: 'MIT',
                    downloads: 100,
                    stars: 10,
                    verified: false,
                    deprecated: false
                },
                {
                    id: 'plugin:search-api',
                    name: 'search-api',
                    description: 'API utilities for search',
                    author: 'API Team',
                    authorId: 'user-2',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    latestVersion: '2.0.0',
                    versions: ['1.0.0', '2.0.0'],
                    keywords: ['api', 'search'],
                    license: 'Apache-2.0',
                    downloads: 50,
                    stars: 5,
                    verified: false,
                    deprecated: false
                }
            ];

            for (const p of plugins) {
                await store.savePlugin(p);
            }
        });

        it('should search by query string', async () => {
            const result = await store.searchPlugins({ query: 'search' });
            expect(result.plugins.length).toBeGreaterThanOrEqual(2);
        });

        it('should search by author', async () => {
            const result = await store.searchPlugins({ author: 'UI Team' });
            expect(result.plugins.length).toBe(1);
            expect(result.plugins[0].name).toBe('search-ui');
        });

        it('should search by keywords', async () => {
            const result = await store.searchPlugins({ keywords: ['ui'] });
            expect(result.plugins.some(p => p.name === 'search-ui')).toBe(true);
        });

        it('should sort by downloads', async () => {
            const result = await store.searchPlugins({
                query: 'search',
                sortBy: 'downloads',
                sortOrder: 'desc'
            });

            if (result.plugins.length >= 2) {
                expect(result.plugins[0].downloads).toBeGreaterThanOrEqual(
                    result.plugins[1].downloads
                );
            }
        });

        it('should paginate results', async () => {
            const result = await store.searchPlugins({ page: 1, limit: 1 });
            expect(result.plugins.length).toBeLessThanOrEqual(1);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(1);
        });
    });

    describe('User Operations', () => {
        it('should create a user', async () => {
            const user = await store.createUser('testuser', 'test@example.com');
            expect(user.username).toBe('testuser');
            expect(user.email).toBe('test@example.com');
            expect(user.verified).toBe(false);
        });

        it('should reject duplicate usernames', async () => {
            await store.createUser('duplicateuser', 'test1@example.com');

            try {
                await store.createUser('duplicateuser', 'test2@example.com');
                expect(true).toBe(false); // Should not reach here
            } catch (error) {
                expect((error as Error).message).toContain('already taken');
            }
        });

        it('should get user by username', async () => {
            await store.createUser('findme', 'findme@example.com');
            const user = await store.getUserByUsername('findme');

            expect(user).not.toBeNull();
            expect(user.username).toBe('findme');
        });

        it('should create and validate API tokens', async () => {
            const user = await store.createUser('tokenuser', 'token@example.com');
            const { token, apiToken } = await store.createToken(user.id, 'test-token', [
                'read',
                'publish'
            ]);

            expect(token).toMatch(/^lgr_/);
            expect(apiToken.scopes).toContain('read');
            expect(apiToken.scopes).toContain('publish');

            // Verify token works
            const foundUser = await store.getUserByToken(token);
            expect(foundUser).not.toBeNull();
            expect(foundUser.username).toBe('tokenuser');
        });

        it('should revoke tokens', async () => {
            const user = await store.createUser('revokeuser', 'revoke@example.com');
            const { token, apiToken } = await store.createToken(user.id, 'revoke-me', ['read']);

            const revoked = await store.revokeToken(user.id, apiToken.id);
            expect(revoked).toBe(true);

            // Token should no longer work
            const foundUser = await store.getUserByToken(token);
            expect(foundUser).toBeNull();
        });

        it('should validate token scopes', () => {
            const token = {
                id: 'test',
                name: 'test',
                hashedToken: 'hash',
                createdAt: new Date(),
                scopes: ['read', 'publish']
            };

            expect(store.validateTokenScopes(token, ['read'])).toBe(true);
            expect(store.validateTokenScopes(token, ['publish'])).toBe(true);
            expect(store.validateTokenScopes(token, ['admin'])).toBe(false);
        });

        it('should reject expired tokens', () => {
            const token = {
                id: 'test',
                name: 'test',
                hashedToken: 'hash',
                createdAt: new Date(),
                expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
                scopes: ['read']
            };

            expect(store.validateTokenScopes(token, ['read'])).toBe(false);
        });
    });

    describe('Version Operations', () => {
        it('should save and retrieve versions', async () => {
            const version = {
                id: 'ver-123',
                pluginId: 'plugin:ver-test',
                version: '1.0.0',
                status: 'published',
                manifest: {
                    name: 'ver-test',
                    version: '1.0.0',
                    description: 'Test',
                    author: 'Test',
                    license: 'MIT'
                },
                tarballUrl: 'https://example.com/tarball.tgz',
                tarballSha256: 'abc123',
                size: 1000,
                publishedAt: new Date(),
                publishedBy: 'testuser',
                downloads: 0
            };

            await store.saveVersion(version);
            const retrieved = await store.getVersion('plugin:ver-test', '1.0.0');

            expect(retrieved).not.toBeNull();
            expect(retrieved.version).toBe('1.0.0');
        });

        it('should get latest version', async () => {
            const plugin = {
                id: 'plugin:latest-test',
                name: 'latest-test',
                description: 'Test',
                author: 'Test',
                authorId: 'user-123',
                createdAt: new Date(),
                updatedAt: new Date(),
                latestVersion: '2.0.0',
                versions: ['1.0.0', '2.0.0'],
                keywords: [],
                license: 'MIT',
                downloads: 0,
                stars: 0,
                verified: false,
                deprecated: false
            };

            await store.savePlugin(plugin);

            for (const ver of ['1.0.0', '2.0.0']) {
                await store.saveVersion({
                    id: `ver-${ver}`,
                    pluginId: 'plugin:latest-test',
                    version: ver,
                    status: 'published',
                    manifest: { name: 'latest-test', version: ver, description: '', author: '', license: '' },
                    tarballUrl: `https://example.com/${ver}.tgz`,
                    tarballSha256: 'abc',
                    size: 100,
                    publishedAt: new Date(),
                    publishedBy: 'test',
                    downloads: 0
                });
            }

            const latest = await store.getLatestVersion('plugin:latest-test');
            expect(latest).not.toBeNull();
            expect(latest.version).toBe('2.0.0');
        });
    });

    describe('Utility Functions', () => {
        it('should generate consistent plugin IDs', () => {
            const id1 = store.generatePluginId('my-plugin');
            const id2 = store.generatePluginId('my-plugin');
            expect(id1).toBe(id2);
            expect(id1).toBe('plugin:my-plugin');
        });

        it('should compare semver correctly', () => {
            expect(store.compareSemver('1.0.0', '2.0.0')).toBeLessThan(0);
            expect(store.compareSemver('2.0.0', '1.0.0')).toBeGreaterThan(0);
            expect(store.compareSemver('1.0.0', '1.0.0')).toBe(0);
            expect(store.compareSemver('1.1.0', '1.0.0')).toBeGreaterThan(0);
            expect(store.compareSemver('1.0.1', '1.0.0')).toBeGreaterThan(0);
        });
    });
});

// Test types existence
describe('Registry Types', () => {
    it('should export all required types', async () => {
        const types = await import('../../server/src/registry/types.js');

        // Verify type exports exist (they won't have runtime values but the module should load)
        expect(types).toBeDefined();
    });
});
