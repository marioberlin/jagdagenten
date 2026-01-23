/**
 * App Bundle Storage
 *
 * Handles storage and retrieval of app bundles (compiled JS).
 * Uses local filesystem storage with SHA-256 integrity verification.
 */

import { createHash } from 'crypto';
import { mkdir, writeFile, readFile, unlink, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// ============================================================================
// Configuration
// ============================================================================

const BUNDLE_DIR = process.env.APP_BUNDLE_DIR
  || path.resolve(process.cwd(), 'data', 'app-bundles');

// ============================================================================
// Types
// ============================================================================

export interface StoredBundle {
  /** SHA-256 hash of the bundle content */
  hash: string;
  /** Size in bytes */
  size: number;
  /** Path on disk */
  filePath: string;
}

export interface BundleMetadata {
  hash: string;
  size: number;
  storedAt: string;
  appId: string;
  version: string;
}

// ============================================================================
// Storage Operations
// ============================================================================

/**
 * Ensure the bundle storage directory exists.
 */
async function ensureStorageDir(): Promise<void> {
  if (!existsSync(BUNDLE_DIR)) {
    await mkdir(BUNDLE_DIR, { recursive: true });
  }
}

/**
 * Compute SHA-256 hash of a buffer.
 */
function computeHash(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Get the file path for a bundle.
 */
function getBundlePath(appId: string, version: string): string {
  // Sanitize appId to prevent path traversal
  const safeId = appId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeVersion = version.replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(BUNDLE_DIR, `${safeId}@${safeVersion}.js`);
}

/**
 * Get the metadata file path for a bundle.
 */
function getMetadataPath(appId: string, version: string): string {
  const safeId = appId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeVersion = version.replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(BUNDLE_DIR, `${safeId}@${safeVersion}.meta.json`);
}

/**
 * Store a bundle from base64-encoded data.
 * Returns the hash and size.
 */
export async function storeBundle(
  appId: string,
  version: string,
  base64Data: string
): Promise<StoredBundle> {
  await ensureStorageDir();

  const buffer = Buffer.from(base64Data, 'base64');
  const hash = computeHash(buffer);
  const filePath = getBundlePath(appId, version);

  await writeFile(filePath, buffer);

  // Write metadata
  const metadata: BundleMetadata = {
    hash,
    size: buffer.length,
    storedAt: new Date().toISOString(),
    appId,
    version,
  };
  await writeFile(getMetadataPath(appId, version), JSON.stringify(metadata, null, 2));

  return { hash, size: buffer.length, filePath };
}

/**
 * Store a bundle from raw buffer data.
 */
export async function storeBundleBuffer(
  appId: string,
  version: string,
  buffer: Buffer
): Promise<StoredBundle> {
  await ensureStorageDir();

  const hash = computeHash(buffer);
  const filePath = getBundlePath(appId, version);

  await writeFile(filePath, buffer);

  const metadata: BundleMetadata = {
    hash,
    size: buffer.length,
    storedAt: new Date().toISOString(),
    appId,
    version,
  };
  await writeFile(getMetadataPath(appId, version), JSON.stringify(metadata, null, 2));

  return { hash, size: buffer.length, filePath };
}

/**
 * Retrieve a bundle's content.
 * Verifies SHA-256 integrity if expectedHash is provided.
 */
export async function getBundle(
  appId: string,
  version: string,
  expectedHash?: string
): Promise<{ content: Buffer; metadata: BundleMetadata } | null> {
  const filePath = getBundlePath(appId, version);
  const metaPath = getMetadataPath(appId, version);

  try {
    const [content, metaRaw] = await Promise.all([
      readFile(filePath),
      readFile(metaPath, 'utf-8'),
    ]);

    const metadata: BundleMetadata = JSON.parse(metaRaw);

    // Verify integrity
    if (expectedHash) {
      const actualHash = computeHash(content);
      if (actualHash !== expectedHash) {
        console.error(`[BundleStorage] Integrity check failed for ${appId}@${version}. Expected ${expectedHash}, got ${actualHash}`);
        return null;
      }
    }

    return { content, metadata };
  } catch {
    return null;
  }
}

/**
 * Check if a bundle exists.
 */
export async function bundleExists(appId: string, version: string): Promise<boolean> {
  const filePath = getBundlePath(appId, version);
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete a bundle and its metadata.
 */
export async function deleteBundle(appId: string, version: string): Promise<boolean> {
  const filePath = getBundlePath(appId, version);
  const metaPath = getMetadataPath(appId, version);

  try {
    await Promise.all([
      unlink(filePath).catch(() => {}),
      unlink(metaPath).catch(() => {}),
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get bundle metadata without reading the full content.
 */
export async function getBundleMetadata(appId: string, version: string): Promise<BundleMetadata | null> {
  const metaPath = getMetadataPath(appId, version);
  try {
    const raw = await readFile(metaPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
