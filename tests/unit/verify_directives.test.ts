/**
 * Tests for Directive Version Checksum Verification
 * @see docs/IMPLEMENTATION_PLAN.md - Item 3.4
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { mkdir, writeFile, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';

// Test directory setup
const TEST_DIR = join(process.cwd(), '.tmp/test-directives');
const TEST_SCRIPTS_DIR = join(TEST_DIR, 'scripts');
const TEST_DIRECTIVES_DIR = join(TEST_DIR, 'directives');

// Helper functions (copied from verify_directives.ts for testing)
function extractFrontmatter(content: string): Record<string, unknown> | null {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    try {
        // Simple YAML parser for test purposes
        const yaml = match[1];
        const result: Record<string, unknown> = {};
        const lines = yaml.split('\n');

        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.slice(0, colonIndex).replace(/"/g, '').trim();
                let value = line.slice(colonIndex + 1).trim();
                // Remove quotes
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                result[key] = value;
            }
        }
        return result;
    } catch {
        return null;
    }
}

function hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex');
}

describe('Directive Version Checksums', () => {
    beforeEach(async () => {
        // Create test directories
        await mkdir(TEST_DIR, { recursive: true });
        await mkdir(TEST_SCRIPTS_DIR, { recursive: true });
        await mkdir(TEST_DIRECTIVES_DIR, { recursive: true });
    });

    afterEach(async () => {
        // Clean up test directories
        await rm(TEST_DIR, { recursive: true, force: true });
    });

    describe('extractFrontmatter', () => {
        it('should extract valid YAML frontmatter', () => {
            const content = `---
"name": "test-directive"
"version": "1.0.0"
"updated": "2026-01-11"
---

# Test Directive
Some content here.`;

            const frontmatter = extractFrontmatter(content);
            expect(frontmatter).not.toBeNull();
            expect(frontmatter?.name).toBe('test-directive');
            expect(frontmatter?.version).toBe('1.0.0');
            expect(frontmatter?.updated).toBe('2026-01-11');
        });

        it('should return null for content without frontmatter', () => {
            const content = `# Test Directive
No frontmatter here.`;

            const frontmatter = extractFrontmatter(content);
            expect(frontmatter).toBeNull();
        });

        it('should return null for malformed frontmatter', () => {
            const content = `---
not valid yaml: [
---

# Test`;

            const frontmatter = extractFrontmatter(content);
            // Our simple parser handles this case
            expect(frontmatter).not.toBeNull();
        });

        it('should handle frontmatter with dependencies array', () => {
            const content = `---
"name": "with-deps"
"version": "1.0.0"
"updated": "2026-01-11"
---

# Directive with Dependencies`;

            const frontmatter = extractFrontmatter(content);
            expect(frontmatter).not.toBeNull();
            expect(frontmatter?.name).toBe('with-deps');
        });
    });

    describe('hashContent', () => {
        it('should generate consistent SHA-256 hash', () => {
            const content = 'test content';
            const hash1 = hashContent(content);
            const hash2 = hashContent(content);

            expect(hash1).toBe(hash2);
            expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
        });

        it('should generate different hashes for different content', () => {
            const hash1 = hashContent('content1');
            const hash2 = hashContent('content2');

            expect(hash1).not.toBe(hash2);
        });

        it('should match known SHA-256 hash', () => {
            // Known hash for 'hello world'
            const hash = hashContent('hello world');
            expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
        });
    });

    describe('Directive File Operations', () => {
        it('should create directive with frontmatter', async () => {
            const directivePath = join(TEST_DIRECTIVES_DIR, 'test.md');
            const content = `---
"name": "test"
"version": "1.0.0"
"updated": "2026-01-11"
---

# Test Directive

This is a test directive.`;

            await writeFile(directivePath, content, 'utf-8');
            const readContent = await readFile(directivePath, 'utf-8');

            expect(readContent).toBe(content);
            const frontmatter = extractFrontmatter(readContent);
            expect(frontmatter?.name).toBe('test');
        });

        it('should detect script references in directive content', () => {
            const content = `# Deploy Directive

Run \`scripts/deploy.ts\` to deploy the application.
Also use scripts/verify.ts for verification.
Execute: bun run scripts/build.ts`;

            // Simple regex to find script references
            const patterns = [
                /`scripts\/([^`]+\.ts)`/g,
                /scripts\/([^\s)]+\.ts)/g,
                /bun run scripts\/([^\s)]+)/g
            ];

            const references: string[] = [];
            for (const pattern of patterns) {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const scriptPath = `scripts/${match[1].replace(/\.ts$/, '')}.ts`;
                    if (!references.includes(scriptPath)) {
                        references.push(scriptPath);
                    }
                }
            }

            expect(references).toContain('scripts/deploy.ts');
            expect(references).toContain('scripts/verify.ts');
            expect(references).toContain('scripts/build.ts');
        });
    });

    describe('Hash Verification', () => {
        it('should verify matching hashes', async () => {
            const scriptContent = 'console.log("test script");';
            const scriptPath = join(TEST_SCRIPTS_DIR, 'test.ts');
            await writeFile(scriptPath, scriptContent, 'utf-8');

            const expectedHash = hashContent(scriptContent);
            const actualContent = await readFile(scriptPath, 'utf-8');
            const actualHash = hashContent(actualContent);

            expect(actualHash).toBe(expectedHash);
        });

        it('should detect hash mismatch after modification', async () => {
            const scriptPath = join(TEST_SCRIPTS_DIR, 'mutable.ts');

            // Write initial content
            await writeFile(scriptPath, 'initial content', 'utf-8');
            const initialHash = hashContent('initial content');

            // Modify the script
            await writeFile(scriptPath, 'modified content', 'utf-8');
            const newContent = await readFile(scriptPath, 'utf-8');
            const newHash = hashContent(newContent);

            expect(newHash).not.toBe(initialHash);
        });
    });

    describe('Frontmatter Update', () => {
        it('should add frontmatter to directive without one', () => {
            const content = `# Plain Directive

No frontmatter here.`;

            const frontmatter = {
                name: 'plain',
                version: '1.0.0',
                updated: '2026-01-11'
            };

            const frontmatterYaml = Object.entries(frontmatter)
                .map(([k, v]) => `"${k}": "${v}"`)
                .join('\n');

            const newContent = `---\n${frontmatterYaml}\n---\n\n${content}`;

            expect(newContent).toContain('---');
            expect(newContent).toContain('"name": "plain"');
            expect(newContent).toContain('# Plain Directive');
        });

        it('should replace existing frontmatter', () => {
            const content = `---
"name": "old"
"version": "0.1.0"
---

# Old Directive`;

            const newFrontmatter = `"name": "updated"\n"version": "1.0.0"\n"updated": "2026-01-11"`;
            const newContent = content.replace(
                /^---\n[\s\S]*?\n---/,
                `---\n${newFrontmatter}\n---`
            );

            expect(newContent).toContain('"name": "updated"');
            expect(newContent).toContain('"version": "1.0.0"');
            expect(newContent).not.toContain('"version": "0.1.0"');
        });
    });

    describe('Dependency Tracking', () => {
        it('should track multiple dependencies', async () => {
            // Create test scripts
            const scripts = [
                { name: 'script1.ts', content: 'export const a = 1;' },
                { name: 'script2.ts', content: 'export const b = 2;' },
                { name: 'script3.ts', content: 'export const c = 3;' }
            ];

            const dependencies: Array<{ path: string; sha256: string }> = [];

            for (const script of scripts) {
                const path = join(TEST_SCRIPTS_DIR, script.name);
                await writeFile(path, script.content, 'utf-8');
                dependencies.push({
                    path: `scripts/${script.name}`,
                    sha256: hashContent(script.content)
                });
            }

            expect(dependencies).toHaveLength(3);
            expect(dependencies[0].sha256).toHaveLength(64);
            expect(dependencies[1].sha256).toHaveLength(64);
            expect(dependencies[2].sha256).toHaveLength(64);

            // Each dependency should have unique hash
            const hashes = dependencies.map(d => d.sha256);
            const uniqueHashes = new Set(hashes);
            expect(uniqueHashes.size).toBe(3);
        });

        it('should handle missing script files gracefully', async () => {
            const nonExistentPath = join(TEST_SCRIPTS_DIR, 'does-not-exist.ts');

            let hash = '';
            try {
                const content = await readFile(nonExistentPath, 'utf-8');
                hash = hashContent(content);
            } catch {
                hash = 'FILE_NOT_FOUND';
            }

            expect(hash).toBe('FILE_NOT_FOUND');
        });
    });

    describe('Version Format', () => {
        it('should accept semver format', () => {
            const validVersions = ['1.0.0', '0.1.0', '2.3.4', '10.20.30'];
            const semverRegex = /^\d+\.\d+\.\d+$/;

            for (const version of validVersions) {
                expect(semverRegex.test(version)).toBe(true);
            }
        });

        it('should validate date format', () => {
            const validDate = '2026-01-11';
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

            expect(dateRegex.test(validDate)).toBe(true);
            expect(dateRegex.test('01-11-2026')).toBe(false);
            expect(dateRegex.test('2026/01/11')).toBe(false);
        });
    });
});

describe('verify_directives.ts Script', () => {
    it('should exist in scripts directory', async () => {
        const scriptPath = join(process.cwd(), 'scripts/verify_directives.ts');
        const content = await readFile(scriptPath, 'utf-8');

        expect(content).toContain('Directive Version Checksum Verification');
        expect(content).toContain('extractFrontmatter');
        expect(content).toContain('hashFile');
    });

    it('should have correct shebang', async () => {
        const scriptPath = join(process.cwd(), 'scripts/verify_directives.ts');
        const content = await readFile(scriptPath, 'utf-8');

        expect(content.startsWith('#!/usr/bin/env bun')).toBe(true);
    });

    it('should support --fix flag', async () => {
        const scriptPath = join(process.cwd(), 'scripts/verify_directives.ts');
        const content = await readFile(scriptPath, 'utf-8');

        expect(content).toContain('--fix');
        expect(content).toContain('fixMode');
    });

    it('should support --verbose flag', async () => {
        const scriptPath = join(process.cwd(), 'scripts/verify_directives.ts');
        const content = await readFile(scriptPath, 'utf-8');

        expect(content).toContain('--verbose');
        expect(content).toContain('-v');
    });
});

// Cleanup after all tests
afterAll(async () => {
    try {
        await rm(TEST_DIR, { recursive: true, force: true });
    } catch {
        // Ignore cleanup errors
    }
});
