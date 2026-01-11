#!/usr/bin/env bun
/**
 * Directive Version Checksum Verification
 *
 * Verifies that directive files have valid checksums for their script dependencies.
 * This ensures agents don't execute outdated instructions when scripts change.
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 3.4 Directive Version Checksums
 *
 * Usage:
 *   bun run scripts/verify_directives.ts
 *   bun run scripts/verify_directives.ts --fix  # Auto-update hashes
 */

import { createHash } from 'crypto';
import { readdir, readFile, stat } from 'fs/promises';
import { join, relative } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

interface DirectiveDependency {
    path: string;
    sha256: string;
    version?: string;
}

interface DirectiveFrontmatter {
    name: string;
    version: string;
    updated: string;
    dependencies?: DirectiveDependency[];
}

interface VerificationResult {
    directive: string;
    valid: boolean;
    issues: string[];
    dependencies: {
        path: string;
        expected: string;
        actual: string;
        match: boolean;
    }[];
}

const DIRECTIVES_DIR = join(process.cwd(), 'directives');
const SCRIPTS_DIR = join(process.cwd(), 'scripts');

/**
 * Extract YAML frontmatter from markdown content
 */
function extractFrontmatter(content: string): DirectiveFrontmatter | null {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    try {
        return parseYaml(match[1]) as DirectiveFrontmatter;
    } catch (e) {
        return null;
    }
}

/**
 * Calculate SHA-256 hash of file contents
 */
async function hashFile(filePath: string): Promise<string> {
    try {
        const content = await readFile(filePath, 'utf-8');
        return createHash('sha256').update(content).digest('hex');
    } catch (e) {
        return 'FILE_NOT_FOUND';
    }
}

/**
 * Verify a single directive file
 */
async function verifyDirective(filePath: string): Promise<VerificationResult> {
    const content = await readFile(filePath, 'utf-8');
    const relativePath = relative(process.cwd(), filePath);
    const frontmatter = extractFrontmatter(content);

    const result: VerificationResult = {
        directive: relativePath,
        valid: true,
        issues: [],
        dependencies: []
    };

    // Check if frontmatter exists
    if (!frontmatter) {
        result.issues.push('Missing YAML frontmatter');
        // Don't mark as invalid - just a warning for directives without dependencies
        return result;
    }

    // Validate required fields
    if (!frontmatter.name) {
        result.issues.push('Missing "name" field in frontmatter');
    }
    if (!frontmatter.version) {
        result.issues.push('Missing "version" field in frontmatter');
    }
    if (!frontmatter.updated) {
        result.issues.push('Missing "updated" field in frontmatter');
    }

    // If no dependencies, directive is valid
    if (!frontmatter.dependencies || frontmatter.dependencies.length === 0) {
        return result;
    }

    // Verify each dependency
    for (const dep of frontmatter.dependencies) {
        const fullPath = join(process.cwd(), dep.path);
        const actualHash = await hashFile(fullPath);

        const depResult = {
            path: dep.path,
            expected: dep.sha256,
            actual: actualHash,
            match: dep.sha256 === actualHash
        };

        result.dependencies.push(depResult);

        if (!depResult.match) {
            result.valid = false;
            if (actualHash === 'FILE_NOT_FOUND') {
                result.issues.push(`Dependency not found: ${dep.path}`);
            } else {
                result.issues.push(
                    `Hash mismatch for ${dep.path}: expected ${dep.sha256.slice(0, 12)}..., got ${actualHash.slice(0, 12)}...`
                );
            }
        }
    }

    return result;
}

/**
 * Scan content for script references
 */
function findScriptReferences(content: string): string[] {
    const references: string[] = [];

    // Match patterns like:
    // - `scripts/healer.ts`
    // - scripts/ralph_runner.ts
    // - Run `bun run scripts/foo.ts`
    const patterns = [
        /`scripts\/([^`]+\.ts)`/g,
        /scripts\/([^\s\)]+\.ts)/g,
        /bun run scripts\/([^\s\)]+)/g
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const scriptPath = `scripts/${match[1].replace(/\.ts$/, '')}.ts`;
            if (!references.includes(scriptPath)) {
                references.push(scriptPath);
            }
        }
    }

    return references;
}

/**
 * Generate frontmatter for a directive
 */
async function generateFrontmatter(
    filePath: string,
    existingFrontmatter: DirectiveFrontmatter | null
): Promise<DirectiveFrontmatter> {
    const content = await readFile(filePath, 'utf-8');
    const name = relative(DIRECTIVES_DIR, filePath).replace(/\.md$/, '');
    const scriptRefs = findScriptReferences(content);

    const dependencies: DirectiveDependency[] = [];

    for (const scriptPath of scriptRefs) {
        const fullPath = join(process.cwd(), scriptPath);
        try {
            await stat(fullPath);
            const hash = await hashFile(fullPath);
            dependencies.push({
                path: scriptPath,
                sha256: hash
            });
        } catch {
            // Script doesn't exist, skip
        }
    }

    return {
        name: existingFrontmatter?.name || name,
        version: existingFrontmatter?.version || '1.0.0',
        updated: new Date().toISOString().split('T')[0],
        dependencies: dependencies.length > 0 ? dependencies : undefined
    };
}

/**
 * Update frontmatter in a directive file
 */
async function updateDirectiveFrontmatter(filePath: string): Promise<void> {
    let content = await readFile(filePath, 'utf-8');
    const existingFrontmatter = extractFrontmatter(content);
    const newFrontmatter = await generateFrontmatter(filePath, existingFrontmatter);

    const frontmatterYaml = stringifyYaml(newFrontmatter, {
        lineWidth: 0,
        defaultStringType: 'QUOTE_DOUBLE'
    }).trim();

    // Replace or add frontmatter
    if (content.match(/^---\n[\s\S]*?\n---/)) {
        content = content.replace(/^---\n[\s\S]*?\n---/, `---\n${frontmatterYaml}\n---`);
    } else {
        content = `---\n${frontmatterYaml}\n---\n\n${content}`;
    }

    await Bun.write(filePath, content);
}

/**
 * Main verification function
 */
async function main() {
    const args = process.argv.slice(2);
    const fixMode = args.includes('--fix');
    const verbose = args.includes('--verbose') || args.includes('-v');

    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║  Directive Version Checksum Verification               ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    // Find all directive files
    const files = await readdir(DIRECTIVES_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    console.log(`Found ${mdFiles.length} directive files\n`);

    const results: VerificationResult[] = [];
    let hasErrors = false;

    for (const file of mdFiles) {
        const filePath = join(DIRECTIVES_DIR, file);

        if (fixMode) {
            console.log(`Updating: ${file}`);
            await updateDirectiveFrontmatter(filePath);
        }

        const result = await verifyDirective(filePath);
        results.push(result);

        if (!result.valid) {
            hasErrors = true;
        }
    }

    // Print results
    console.log('\n─────────────────────────────────────────────────────────');
    console.log('Results:\n');

    for (const result of results) {
        const status = result.valid ? '✓' : '✗';
        const color = result.valid ? '\x1b[32m' : '\x1b[31m';
        console.log(`${color}${status}\x1b[0m ${result.directive}`);

        if (verbose || !result.valid) {
            for (const issue of result.issues) {
                console.log(`    └─ ${issue}`);
            }
            for (const dep of result.dependencies) {
                const depStatus = dep.match ? '✓' : '✗';
                const depColor = dep.match ? '\x1b[32m' : '\x1b[31m';
                console.log(`    ${depColor}${depStatus}\x1b[0m ${dep.path}`);
            }
        }
    }

    // Summary
    console.log('\n─────────────────────────────────────────────────────────');
    const valid = results.filter(r => r.valid).length;
    const invalid = results.filter(r => !r.valid).length;
    const withDeps = results.filter(r => r.dependencies.length > 0).length;

    console.log(`\nSummary:`);
    console.log(`  Total directives: ${results.length}`);
    console.log(`  With dependencies: ${withDeps}`);
    console.log(`  \x1b[32mValid: ${valid}\x1b[0m`);
    if (invalid > 0) {
        console.log(`  \x1b[31mInvalid: ${invalid}\x1b[0m`);
    }

    if (fixMode) {
        console.log(`\n✓ All directives updated with current checksums`);
    }

    if (hasErrors && !fixMode) {
        console.log(`\n\x1b[33mTip: Run with --fix to auto-update hashes\x1b[0m`);
        process.exit(1);
    }

    console.log('\n✓ Verification complete');
}

main().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});
