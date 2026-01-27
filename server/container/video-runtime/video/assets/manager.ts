/**
 * Asset Manager
 *
 * Handles asset lifecycle: upload, storage, retrieval, and deletion.
 * Provides the `staticFile()` equivalent for Remotion compatibility.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import type { Asset, AssetType, AssetUpload } from '../types.js';

export interface AssetManagerConfig {
  assetDir: string;
  publicBaseUrl?: string;
  maxFileSizeBytes?: number;
}

export interface AssetMetadata {
  width?: number;
  height?: number;
  duration?: number;
  fps?: number;
  format?: string;
}

/**
 * Asset Manager for handling media files.
 */
export class AssetManager {
  private config: AssetManagerConfig;
  private assets: Map<string, Asset> = new Map();

  constructor(config: AssetManagerConfig) {
    this.config = {
      maxFileSizeBytes: 100 * 1024 * 1024, // 100MB default
      ...config,
    };
  }

  /**
   * Initialize the asset manager.
   */
  async initialize(): Promise<void> {
    // Create asset directories
    const dirs = ['images', 'videos', 'audio', 'fonts', 'lottie', 'data'];
    for (const dir of dirs) {
      await fs.mkdir(path.join(this.config.assetDir, dir), { recursive: true });
    }
    console.log('[AssetManager] Initialized directories');
  }

  /**
   * Upload an asset from base64 data.
   */
  async uploadFromBase64(
    upload: AssetUpload,
    data: string
  ): Promise<Asset> {
    const buffer = Buffer.from(data, 'base64');
    return this.uploadFromBuffer(upload, buffer);
  }

  /**
   * Upload an asset from a buffer.
   */
  async uploadFromBuffer(
    upload: AssetUpload,
    buffer: Buffer
  ): Promise<Asset> {
    // Validate file size
    if (this.config.maxFileSizeBytes && buffer.length > this.config.maxFileSizeBytes) {
      throw new Error(`File size ${buffer.length} exceeds maximum ${this.config.maxFileSizeBytes}`);
    }

    // Generate asset ID based on content hash
    const hash = createHash('sha256').update(buffer).digest('hex').substring(0, 16);
    const assetId = `${upload.type}-${hash}`;

    // Determine file extension
    const ext = this.getExtension(upload.name, upload.mimeType);

    // Determine storage path
    const fileName = `${assetId}${ext}`;
    const subDir = this.getSubDir(upload.type);
    const filePath = path.join(this.config.assetDir, subDir, fileName);

    // Write file
    await fs.writeFile(filePath, buffer);

    // Create asset record
    const asset: Asset = {
      id: assetId,
      assetId,
      name: upload.name,
      type: upload.type,
      mimeType: upload.mimeType,
      filePath,
      publicUrl: this.getPublicUrl(subDir, fileName),
      fileSize: buffer.length,
      ownerType: upload.ownerType,
      ownerId: upload.ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.assets.set(assetId, asset);

    return asset;
  }

  /**
   * Upload an asset from a URL.
   */
  async uploadFromUrl(
    upload: AssetUpload,
    url: string
  ): Promise<Asset> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return this.uploadFromBuffer(upload, buffer);
  }

  /**
   * Get an asset by ID.
   */
  async get(assetId: string): Promise<Asset | null> {
    return this.assets.get(assetId) || null;
  }

  /**
   * Get asset buffer.
   */
  async getBuffer(assetId: string): Promise<Buffer | null> {
    const asset = this.assets.get(assetId);
    if (!asset || !asset.filePath) return null;

    try {
      return await fs.readFile(asset.filePath);
    } catch {
      return null;
    }
  }

  /**
   * Resolve a static file path (Remotion compatibility).
   * Similar to Remotion's staticFile() function.
   */
  staticFile(relativePath: string): string {
    return path.join(this.config.assetDir, relativePath);
  }

  /**
   * Get public URL for a static file.
   */
  getStaticUrl(relativePath: string): string {
    if (this.config.publicBaseUrl) {
      return `${this.config.publicBaseUrl}/assets/${relativePath}`;
    }
    return `/assets/${relativePath}`;
  }

  /**
   * Delete an asset.
   */
  async delete(assetId: string): Promise<boolean> {
    const asset = this.assets.get(assetId);
    if (!asset) return false;

    if (asset.filePath) {
      try {
        await fs.unlink(asset.filePath);
      } catch {
        // File may not exist
      }
    }

    this.assets.delete(assetId);
    return true;
  }

  /**
   * List assets by type.
   */
  async listByType(type: AssetType): Promise<Asset[]> {
    return Array.from(this.assets.values()).filter((a) => a.type === type);
  }

  /**
   * List assets by owner.
   */
  async listByOwner(ownerType: string, ownerId: string): Promise<Asset[]> {
    return Array.from(this.assets.values()).filter(
      (a) => a.ownerType === ownerType && a.ownerId === ownerId
    );
  }

  /**
   * Check if an asset exists.
   */
  async exists(assetId: string): Promise<boolean> {
    const asset = this.assets.get(assetId);
    if (!asset || !asset.filePath) return false;

    try {
      await fs.access(asset.filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file extension from name or mime type.
   */
  private getExtension(name: string, mimeType?: string): string {
    // Try to get from filename
    const nameExt = path.extname(name);
    if (nameExt) return nameExt;

    // Fall back to mime type
    const mimeMap: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg',
      'audio/aac': '.aac',
      'font/woff': '.woff',
      'font/woff2': '.woff2',
      'font/ttf': '.ttf',
      'font/otf': '.otf',
      'application/json': '.json',
      'application/lottie+json': '.json',
    };

    return mimeType ? mimeMap[mimeType] || '' : '';
  }

  /**
   * Get subdirectory for asset type.
   */
  private getSubDir(type: AssetType): string {
    const dirMap: Record<AssetType, string> = {
      image: 'images',
      video: 'videos',
      audio: 'audio',
      font: 'fonts',
      lottie: 'lottie',
      data: 'data',
    };
    return dirMap[type] || 'data';
  }

  /**
   * Get public URL for an asset.
   */
  private getPublicUrl(subDir: string, fileName: string): string {
    if (this.config.publicBaseUrl) {
      return `${this.config.publicBaseUrl}/assets/${subDir}/${fileName}`;
    }
    return `/assets/${subDir}/${fileName}`;
  }
}

/**
 * Create a new asset manager.
 */
export function createAssetManager(config: AssetManagerConfig): AssetManager {
  return new AssetManager(config);
}
