#!/usr/bin/env bun
/**
 * Legacy Cleanup Script
 * 
 * Identifies and archives legacy code in the LiquidCrypto project.
 * Run with --dry-run to preview changes, or --execute to perform cleanup.
 * 
 * Usage:
 *   bun run scripts/cleanup_legacy.ts --dry-run    # Preview only
 *   bun run scripts/cleanup_legacy.ts --execute    # Actually perform cleanup
 *   bun run scripts/cleanup_legacy.ts --archive    # Archive to archive/ dir
 */

import { readdir, stat, mkdir, rename, rm } from 'fs/promises';
import { join, basename } from 'path';

const PROJECT_ROOT = join(import.meta.dir, '..');
const ARCHIVE_DIR = join(PROJECT_ROOT, 'archive');

// Legacy directories/files to clean up
const LEGACY_ITEMS = [
    {
        path: 'TraderOld',
        type: 'directory' as const,
        action: 'archive' as const,
        reason: 'Old trading implementation, superseded by new trading module',
    },
    {
        path: 'n8n_backup',
        type: 'directory' as const,
        action: 'archive' as const,
        reason: 'n8n workflow backup, not actively used',
    },
    {
        path: 'ClaudeSkills_backup',
        type: 'directory' as const,
        action: 'archive' as const,
        reason: 'Backup directory, redundant with ClaudeSkills',
    },
    {
        path: 'HIG_web',
        type: 'directory' as const,
        action: 'archive' as const,
        reason: 'Apple HIG documentation, can be archived',
    },
    // Root-level trading scripts
    {
        path: 'trading_full_run.cjs',
        type: 'file' as const,
        action: 'move' as const,
        destination: 'scripts/trading/',
        reason: 'Trading script should be in scripts/trading/',
    },
    {
        path: 'trading_simulation.cjs',
        type: 'file' as const,
        action: 'move' as const,
        destination: 'scripts/trading/',
        reason: 'Trading script should be in scripts/trading/',
    },
    {
        path: 'monitor_trades.cjs',
        type: 'file' as const,
        action: 'move' as const,
        destination: 'scripts/trading/',
        reason: 'Trading script should be in scripts/trading/',
    },
    {
        path: 'position_monitor.cjs',
        type: 'file' as const,
        action: 'move' as const,
        destination: 'scripts/trading/',
        reason: 'Trading script should be in scripts/trading/',
    },
    {
        path: 'generate_svg.cjs',
        type: 'file' as const,
        action: 'move' as const,
        destination: 'scripts/',
        reason: 'Utility script should be in scripts/',
    },
];

interface CleanupResult {
    action: 'archived' | 'moved' | 'deleted' | 'skipped' | 'error';
    path: string;
    destination?: string;
    reason: string;
    error?: string;
}

async function exists(path: string): Promise<boolean> {
    try {
        await stat(path);
        return true;
    } catch {
        return false;
    }
}

async function ensureDir(path: string): Promise<void> {
    if (!(await exists(path))) {
        await mkdir(path, { recursive: true });
    }
}

async function cleanupItem(
    item: typeof LEGACY_ITEMS[number],
    mode: 'dry-run' | 'execute' | 'archive'
): Promise<CleanupResult> {
    const fullPath = join(PROJECT_ROOT, item.path);

    if (!(await exists(fullPath))) {
        return {
            action: 'skipped',
            path: item.path,
            reason: 'Path does not exist',
        };
    }

    const result: CleanupResult = {
        action: 'skipped',
        path: item.path,
        reason: item.reason,
    };

    if (mode === 'dry-run') {
        result.action = item.action === 'archive' ? 'archived' : 'moved';
        if (item.action === 'move' && 'destination' in item) {
            result.destination = item.destination;
        } else if (item.action === 'archive') {
            result.destination = `archive/${item.path}`;
        }
        return result;
    }

    try {
        if (item.action === 'archive') {
            await ensureDir(ARCHIVE_DIR);
            const archivePath = join(ARCHIVE_DIR, basename(item.path));

            if (await exists(archivePath)) {
                // Already archived, just delete the original
                await rm(fullPath, { recursive: true });
                result.action = 'deleted';
            } else {
                await rename(fullPath, archivePath);
                result.action = 'archived';
                result.destination = `archive/${basename(item.path)}`;
            }
        } else if (item.action === 'move' && 'destination' in item) {
            const destDir = join(PROJECT_ROOT, item.destination);
            await ensureDir(destDir);
            const destPath = join(destDir, basename(item.path));

            if (await exists(destPath)) {
                // Already exists at destination
                await rm(fullPath);
                result.action = 'deleted';
                result.reason = 'Already exists at destination, deleted original';
            } else {
                await rename(fullPath, destPath);
                result.action = 'moved';
                result.destination = item.destination;
            }
        }
    } catch (e) {
        result.action = 'error';
        result.error = e instanceof Error ? e.message : String(e);
    }

    return result;
}

async function findAdditionalLegacy(): Promise<string[]> {
    const potential: string[] = [];

    try {
        const rootFiles = await readdir(PROJECT_ROOT, { withFileTypes: true });

        for (const entry of rootFiles) {
            // Look for backup directories
            if (entry.isDirectory() && entry.name.includes('backup')) {
                potential.push(entry.name);
            }
            // Look for old/archive patterns
            if (entry.isDirectory() && (entry.name.includes('Old') || entry.name.includes('_old'))) {
                potential.push(entry.name);
            }
            // Root-level .cjs files (usually should be in scripts/)
            if (entry.isFile() && entry.name.endsWith('.cjs')) {
                potential.push(entry.name);
            }
        }
    } catch (e) {
        console.error('Error scanning for additional legacy items:', e);
    }

    // Filter out items we're already handling
    const alreadyHandled = new Set(LEGACY_ITEMS.map(i => i.path));
    return potential.filter(p => !alreadyHandled.has(p));
}

async function main() {
    const args = process.argv.slice(2);
    const mode = args.includes('--execute') ? 'execute' :
        args.includes('--archive') ? 'archive' : 'dry-run';

    console.log('🧹 Legacy Cleanup Script');
    console.log('─'.repeat(50));
    console.log(`Mode: ${mode.toUpperCase()}`);
    console.log('');

    if (mode === 'dry-run') {
        console.log('⚠️  This is a DRY RUN. No changes will be made.');
        console.log('   Use --execute to perform actual cleanup.');
        console.log('');
    }

    // Find additional legacy items not in our list
    const additional = await findAdditionalLegacy();
    if (additional.length > 0) {
        console.log('📋 Additional legacy items detected (not in cleanup list):');
        for (const item of additional) {
            console.log(`   - ${item}`);
        }
        console.log('');
    }

    console.log('📂 Processing known legacy items:');
    console.log('');

    const results: CleanupResult[] = [];

    for (const item of LEGACY_ITEMS) {
        const result = await cleanupItem(item, mode);
        results.push(result);

        const icon = result.action === 'error' ? '❌' :
            result.action === 'skipped' ? '⏭️' :
                result.action === 'archived' ? '📦' :
                    result.action === 'moved' ? '→' : '🗑️';

        console.log(`${icon} ${item.path}`);
        console.log(`   Action: ${result.action}`);
        if (result.destination) {
            console.log(`   Destination: ${result.destination}`);
        }
        console.log(`   Reason: ${result.reason}`);
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
        console.log('');
    }

    // Summary
    console.log('─'.repeat(50));
    console.log('📊 Summary:');
    console.log(`   Archived: ${results.filter(r => r.action === 'archived').length}`);
    console.log(`   Moved: ${results.filter(r => r.action === 'moved').length}`);
    console.log(`   Deleted: ${results.filter(r => r.action === 'deleted').length}`);
    console.log(`   Skipped: ${results.filter(r => r.action === 'skipped').length}`);
    console.log(`   Errors: ${results.filter(r => r.action === 'error').length}`);

    if (mode === 'dry-run') {
        console.log('');
        console.log('💡 Run with --execute to perform these actions.');
    }
}

main().catch(console.error);
