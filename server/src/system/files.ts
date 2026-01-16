/**
 * System Files API
 *
 * Provides secure file system browsing for the Cowork file picker.
 * Includes path validation, sanitization, and access controls.
 */

import { Elysia, t } from 'elysia';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Allowed base paths for browsing (security boundary)
const ALLOWED_BASE_PATHS = [
    os.homedir(),
    '/tmp',
    process.cwd(),
];

// Paths that should never be accessible
const BLOCKED_PATHS = [
    '/etc',
    '/var',
    '/usr',
    '/bin',
    '/sbin',
    '/root',
    '/System',
    '/Library',
    '/private',
    path.join(os.homedir(), '.ssh'),
    path.join(os.homedir(), '.gnupg'),
    path.join(os.homedir(), '.aws'),
    path.join(os.homedir(), '.config'),
];

// File patterns to hide
const HIDDEN_PATTERNS = [
    /^\.git$/,
    /^\.env/,
    /^\.ssh$/,
    /^\.gnupg$/,
    /^\.aws$/,
    /node_modules$/,
    /\.pem$/,
    /\.key$/,
    /^\.DS_Store$/,
    /^Thumbs\.db$/,
];

export interface FileEntry {
    name: string;
    path: string;
    type: 'file' | 'directory' | 'symlink';
    size?: number;
    modifiedAt?: string;
    isHidden: boolean;
    isAccessible: boolean;
}

export interface DirectoryListing {
    path: string;
    parent: string | null;
    entries: FileEntry[];
    breadcrumbs: { name: string; path: string }[];
}

/**
 * Validate and sanitize a file path
 */
function sanitizePath(inputPath: string): string {
    // Normalize the path to resolve .. and .
    let normalized = path.normalize(inputPath);

    // Resolve to absolute path
    if (!path.isAbsolute(normalized)) {
        normalized = path.resolve(process.cwd(), normalized);
    }

    // Remove any null bytes (security)
    normalized = normalized.replace(/\0/g, '');

    return normalized;
}

/**
 * Check if a path is within allowed boundaries
 */
function isPathAllowed(targetPath: string): boolean {
    const normalized = sanitizePath(targetPath);

    // Check if blocked
    for (const blocked of BLOCKED_PATHS) {
        if (normalized.startsWith(blocked)) {
            return false;
        }
    }

    // Check if within allowed base paths
    for (const allowed of ALLOWED_BASE_PATHS) {
        if (normalized.startsWith(allowed)) {
            return true;
        }
    }

    return false;
}

/**
 * Check if a file/folder should be hidden from listing
 */
function shouldHide(name: string): boolean {
    return HIDDEN_PATTERNS.some(pattern => pattern.test(name));
}

/**
 * Generate breadcrumb navigation for a path
 */
function generateBreadcrumbs(targetPath: string): { name: string; path: string }[] {
    const parts = targetPath.split(path.sep).filter(Boolean);
    const breadcrumbs: { name: string; path: string }[] = [];

    let currentPath = path.sep;
    breadcrumbs.push({ name: 'Root', path: currentPath });

    for (const part of parts) {
        currentPath = path.join(currentPath, part);
        breadcrumbs.push({ name: part, path: currentPath });
    }

    return breadcrumbs;
}

/**
 * List directory contents
 */
async function listDirectory(dirPath: string, showHidden: boolean = false): Promise<DirectoryListing> {
    const normalized = sanitizePath(dirPath);

    if (!isPathAllowed(normalized)) {
        throw new Error(`Access denied: ${dirPath}`);
    }

    // Check if directory exists and is accessible
    const stat = await fs.stat(normalized);
    if (!stat.isDirectory()) {
        throw new Error(`Not a directory: ${dirPath}`);
    }

    const entries: FileEntry[] = [];
    const dirEntries = await fs.readdir(normalized, { withFileTypes: true });

    for (const entry of dirEntries) {
        const fullPath = path.join(normalized, entry.name);
        const isHidden = entry.name.startsWith('.') || shouldHide(entry.name);

        // Skip hidden files unless requested
        if (isHidden && !showHidden) {
            continue;
        }

        // Check if child path is accessible
        const isAccessible = isPathAllowed(fullPath);

        let fileEntry: FileEntry = {
            name: entry.name,
            path: fullPath,
            type: entry.isDirectory() ? 'directory' : entry.isSymbolicLink() ? 'symlink' : 'file',
            isHidden,
            isAccessible,
        };

        // Get file stats if accessible
        if (isAccessible) {
            try {
                const fileStat = await fs.stat(fullPath);
                fileEntry.size = fileStat.size;
                fileEntry.modifiedAt = fileStat.mtime.toISOString();
            } catch {
                // Can't stat, mark as inaccessible
                fileEntry.isAccessible = false;
            }
        }

        entries.push(fileEntry);
    }

    // Sort: directories first, then alphabetically
    entries.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
    });

    // Compute parent path
    const parentPath = path.dirname(normalized);
    const parent = parentPath !== normalized && isPathAllowed(parentPath) ? parentPath : null;

    return {
        path: normalized,
        parent,
        entries,
        breadcrumbs: generateBreadcrumbs(normalized),
    };
}

/**
 * Get quick access locations (home, desktop, documents, etc.)
 */
function getQuickAccessLocations(): { name: string; path: string; icon: string }[] {
    const home = os.homedir();

    const locations = [
        { name: 'Home', path: home, icon: 'home' },
        { name: 'Desktop', path: path.join(home, 'Desktop'), icon: 'monitor' },
        { name: 'Documents', path: path.join(home, 'Documents'), icon: 'file-text' },
        { name: 'Downloads', path: path.join(home, 'Downloads'), icon: 'download' },
        { name: 'Projects', path: path.join(home, 'projects'), icon: 'folder-code' },
        { name: 'Current Directory', path: process.cwd(), icon: 'folder-open' },
    ];

    // Filter to only existing and accessible paths
    return locations.filter(loc => {
        try {
            return isPathAllowed(loc.path);
        } catch {
            return false;
        }
    });
}

/**
 * Elysia routes for file system access
 */
export const systemFilesRoutes = new Elysia({ prefix: '/api/system/files' })
    // List directory contents
    .get('/', async ({ query }) => {
        const dirPath = query.path || os.homedir();
        const showHidden = query.showHidden === 'true';

        try {
            const listing = await listDirectory(dirPath, showHidden);
            return { success: true, data: listing };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }, {
        query: t.Object({
            path: t.Optional(t.String()),
            showHidden: t.Optional(t.String()),
        })
    })

    // Get quick access locations
    .get('/quick-access', () => {
        return {
            success: true,
            data: getQuickAccessLocations(),
        };
    })

    // Validate a path (check if it's accessible and is a directory)
    .post('/validate', async ({ body }) => {
        const targetPath = sanitizePath(body.path);

        try {
            if (!isPathAllowed(targetPath)) {
                return {
                    success: false,
                    valid: false,
                    reason: 'Path is not accessible',
                };
            }

            const stat = await fs.stat(targetPath);

            return {
                success: true,
                valid: true,
                isDirectory: stat.isDirectory(),
                isFile: stat.isFile(),
                size: stat.size,
                modifiedAt: stat.mtime.toISOString(),
            };
        } catch (error: any) {
            return {
                success: false,
                valid: false,
                reason: error.code === 'ENOENT' ? 'Path does not exist' : error.message,
            };
        }
    }, {
        body: t.Object({
            path: t.String(),
        })
    })

    // Search for files/directories by name
    .get('/search', async ({ query }) => {
        const basePath = query.basePath || os.homedir();
        const searchQuery = query.q || '';
        const maxResults = Math.min(parseInt(query.limit || '50'), 100);

        if (!searchQuery || searchQuery.length < 2) {
            return { success: false, error: 'Search query too short', data: [] };
        }

        const normalized = sanitizePath(basePath);
        if (!isPathAllowed(normalized)) {
            return { success: false, error: 'Access denied', data: [] };
        }

        const results: FileEntry[] = [];
        const searchLower = searchQuery.toLowerCase();

        async function searchDir(dir: string, depth: number = 0): Promise<void> {
            if (depth > 5 || results.length >= maxResults) return;

            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    if (results.length >= maxResults) break;

                    // Skip hidden and blocked
                    if (entry.name.startsWith('.') || shouldHide(entry.name)) continue;

                    const fullPath = path.join(dir, entry.name);
                    if (!isPathAllowed(fullPath)) continue;

                    // Check if name matches
                    if (entry.name.toLowerCase().includes(searchLower)) {
                        results.push({
                            name: entry.name,
                            path: fullPath,
                            type: entry.isDirectory() ? 'directory' : 'file',
                            isHidden: false,
                            isAccessible: true,
                        });
                    }

                    // Recurse into directories
                    if (entry.isDirectory()) {
                        await searchDir(fullPath, depth + 1);
                    }
                }
            } catch {
                // Skip inaccessible directories
            }
        }

        await searchDir(normalized);

        return { success: true, data: results };
    }, {
        query: t.Object({
            basePath: t.Optional(t.String()),
            q: t.Optional(t.String()),
            limit: t.Optional(t.String()),
        })
    });

export default systemFilesRoutes;
