/**
 * FileHasher
 *
 * Utility for computing file and directory hashes for change detection.
 */

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { createReadStream } from 'fs';
import path from 'path';

export class FileHasher {
    /**
     * Compute SHA-256 hash of a file
     */
    async hashFile(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = createHash('sha256');
            const stream = createReadStream(filePath);

            stream.on('data', (data) => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }

    /**
     * Compute a manifest hash for an entire directory
     * The hash is deterministic based on file paths and their individual hashes
     */
    async hashDirectory(dirPath: string): Promise<string> {
        const files: { path: string; hash: string }[] = [];

        const walk = async (dir: string): Promise<void> => {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    await walk(fullPath);
                } else if (entry.isFile()) {
                    const relativePath = path.relative(dirPath, fullPath);
                    const fileHash = await this.hashFile(fullPath);
                    files.push({ path: relativePath, hash: fileHash });
                }
            }
        };

        await walk(dirPath);

        // Sort for deterministic ordering
        files.sort((a, b) => a.path.localeCompare(b.path));

        // Create manifest hash
        const manifestHash = createHash('sha256');
        for (const file of files) {
            manifestHash.update(`${file.path}:${file.hash}\n`);
        }

        return manifestHash.digest('hex');
    }

    /**
     * Quick hash for small strings/content (in-memory)
     */
    hashString(content: string): string {
        return createHash('sha256').update(content).digest('hex');
    }

    /**
     * Check if a file exists and get its hash, returns null if not exists
     */
    async safeHashFile(filePath: string): Promise<string | null> {
        try {
            return await this.hashFile(filePath);
        } catch (err: any) {
            if (err.code === 'ENOENT') {
                return null;
            }
            throw err;
        }
    }
}

// Export singleton
export const fileHasher = new FileHasher();
