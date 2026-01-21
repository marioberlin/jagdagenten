/**
 * Drive Service for iCloud Drive API
 */

import { BaseService } from './BaseService';
import type {
  DriveItem,
  DriveRoot,
  DriveNodeDetails,
  DriveDownloadUrl,
  DriveCreateFolderInput,
  DriveRenameInput,
  DriveMoveInput,
  DriveDeleteInput,
  DriveUploadInput,
  DriveShareInfo,
  DriveQuota,
  DriveRecentDoc,
  DriveListOptions,
  DriveSearchOptions,
} from '../types/drive';
import { ICloudError } from '../errors/ICloudError';
import { generateShortId } from '../utils/ids';

export class DriveService extends BaseService {
  private _zones: string[] = [];
  private rootId: string | null = null;
  private initialized = false;

  get zones(): string[] {
    return this._zones;
  }

  protected getServiceConfig() {
    return this.client.account?.webservices.drive;
  }

  /**
   * Initialize Drive service
   */
  async startup(): Promise<DriveRoot> {
    const response = await this.get<DriveRoot>(
      'drive',
      '/ws/root',
      {
        depth: 2,
      }
    );

    this.rootId = response.drivewsid;
    this._zones = [response.zone];
    this.initialized = true;

    return response;
  }

  /**
   * Get the root folder
   */
  async getRoot(): Promise<DriveRoot> {
    if (!this.initialized) {
      return this.startup();
    }

    return this.get<DriveRoot>('drive', '/ws/root', { depth: 2 });
  }

  /**
   * List items in a folder
   */
  async listFolder(
    folderId?: string,
    options: DriveListOptions = {}
  ): Promise<DriveItem[]> {
    const id = folderId || this.rootId;
    if (!id) {
      const root = await this.getRoot();
      return root.items || [];
    }

    const response = await this.get<DriveNodeDetails>(
      'drive',
      `/ws/${id}`,
      {
        depth: options.includeItems ? 2 : 1,
      }
    );

    return response.items || [];
  }

  /**
   * Get item details
   */
  async getItem(itemId: string): Promise<DriveNodeDetails> {
    return this.get<DriveNodeDetails>('drive', `/ws/${itemId}`, {
      depth: 1,
    });
  }

  /**
   * Create a new folder
   */
  async createFolder(input: DriveCreateFolderInput): Promise<DriveItem> {
    const parentId = input.parentId || this.rootId;
    if (!parentId) {
      throw new ICloudError('Parent folder not specified', 'INVALID_REQUEST');
    }

    const response = await this.post<{ items: DriveItem[] }>(
      'drive',
      '/ws/createFolders',
      {
        folders: [{
          name: input.name,
          destinationDrivewsId: parentId,
          clientId: generateShortId(),
        }],
      }
    );

    if (!response.items?.length) {
      throw new ICloudError('Failed to create folder', 'UNKNOWN_ERROR');
    }

    return response.items[0];
  }

  /**
   * Rename an item
   */
  async rename(input: DriveRenameInput): Promise<DriveItem> {
    const response = await this.post<{ items: DriveItem[] }>(
      'drive',
      '/ws/renameItems',
      {
        items: [{
          drivewsid: input.drivewsid,
          docwsid: input.docwsid,
          etag: input.etag,
          name: input.name,
          extension: input.extension,
        }],
      }
    );

    if (!response.items?.length) {
      throw new ICloudError('Failed to rename item', 'UNKNOWN_ERROR');
    }

    return response.items[0];
  }

  /**
   * Move items to a different folder
   */
  async move(input: DriveMoveInput): Promise<DriveItem[]> {
    const response = await this.post<{ items: DriveItem[] }>(
      'drive',
      '/ws/moveItems',
      {
        destinationDrivewsId: input.destinationDrivewsid,
        items: input.items,
      }
    );

    return response.items || [];
  }

  /**
   * Move items to trash
   */
  async moveToTrash(input: DriveDeleteInput): Promise<void> {
    await this.post(
      'drive',
      '/ws/moveItemsToTrash',
      {
        items: input.items,
      }
    );
  }

  /**
   * Delete items permanently
   */
  async deletePermanently(input: DriveDeleteInput): Promise<void> {
    await this.post(
      'drive',
      '/ws/deleteItems',
      {
        items: input.items,
      }
    );
  }

  /**
   * Get download URL for a file
   */
  async getDownloadUrl(itemId: string): Promise<string> {
    const response = await this.get<DriveDownloadUrl>(
      'drive',
      `/ws/${itemId}/download`
    );

    return response.data_token?.url || '';
  }

  /**
   * Download a file
   */
  async download(itemId: string): Promise<Blob> {
    const url = await this.getDownloadUrl(itemId);
    if (!url) {
      throw new ICloudError('Download URL not available', 'NOT_FOUND');
    }

    const response = await this.client.http.get<Blob>(url, {
      responseType: 'blob',
    });

    return response.data;
  }

  /**
   * Upload a file
   */
  async upload(input: DriveUploadInput): Promise<DriveItem> {
    const parentId = input.parentId || this.rootId;
    if (!parentId) {
      throw new ICloudError('Parent folder not specified', 'INVALID_REQUEST');
    }

    // Get upload URL
    const uploadInfo = await this.post<{
      singleFile: {
        url: string;
        documentId: string;
      };
    }>(
      'drive',
      '/ws/createUploadToken',
      {
        filename: input.filename,
        contentType: input.contentType || 'application/octet-stream',
        size: input.content instanceof ArrayBuffer
          ? input.content.byteLength
          : typeof input.content === 'string'
            ? new Blob([input.content]).size
            : (input.content as Buffer).length,
      }
    );

    // Upload content
    const content = input.content instanceof ArrayBuffer
      ? new Blob([input.content])
      : typeof input.content === 'string'
        ? new Blob([input.content])
        : new Blob([new Uint8Array(input.content as Buffer)]);

    await this.client.http.post(
      uploadInfo.singleFile.url,
      content,
      {
        headers: {
          'Content-Type': input.contentType || 'application/octet-stream',
        },
      }
    );

    // Commit the upload
    const response = await this.post<{ items: DriveItem[] }>(
      'drive',
      '/ws/commitUpload',
      {
        documentId: uploadInfo.singleFile.documentId,
        destinationDrivewsId: parentId,
        filename: input.filename,
        contentType: input.contentType || 'application/octet-stream',
      }
    );

    if (!response.items?.length) {
      throw new ICloudError('Failed to upload file', 'UNKNOWN_ERROR');
    }

    return response.items[0];
  }

  /**
   * Get recent documents
   */
  async getRecentDocuments(limit: number = 20): Promise<DriveRecentDoc[]> {
    const response = await this.get<{ items: DriveRecentDoc[] }>(
      'drive',
      '/ws/recents',
      { limit }
    );

    return response.items || [];
  }

  /**
   * Search for items
   */
  async search(options: DriveSearchOptions): Promise<DriveItem[]> {
    const params: Record<string, string | number | boolean | undefined> = {
      query: options.query,
      limit: options.limit || 50,
    };

    if (options.scope) params.scope = options.scope;
    if (options.extension) params.extension = options.extension;
    if (options.modifiedAfter) params.modifiedAfter = options.modifiedAfter.toISOString();
    if (options.modifiedBefore) params.modifiedBefore = options.modifiedBefore.toISOString();

    const response = await this.get<{ items: DriveItem[] }>(
      'drive',
      '/ws/search',
      params
    );

    return response.items || [];
  }

  /**
   * Get storage quota information
   */
  async getQuota(): Promise<DriveQuota> {
    return this.get<DriveQuota>('drive', '/ws/quota');
  }

  /**
   * Share an item
   */
  async share(drivewsid: string, docwsid: string): Promise<DriveShareInfo> {
    const response = await this.post<DriveShareInfo>(
      'drive',
      '/ws/shareItem',
      {
        drivewsid,
        docwsid,
      }
    );

    return response;
  }

  /**
   * Unshare an item
   */
  async unshare(shareId: string): Promise<void> {
    await this.post(
      'drive',
      '/ws/unshareItem',
      { shareId }
    );
  }

  /**
   * Get shared items
   */
  async getSharedItems(): Promise<DriveItem[]> {
    const response = await this.get<{ items: DriveItem[] }>(
      'drive',
      '/ws/sharedItems'
    );

    return response.items || [];
  }

  /**
   * Get trash items
   */
  async getTrash(): Promise<DriveItem[]> {
    const response = await this.get<{ items: DriveItem[] }>(
      'drive',
      '/ws/trash'
    );

    return response.items || [];
  }

  /**
   * Restore items from trash
   */
  async restoreFromTrash(items: { drivewsid: string; docwsid: string; etag: string }[]): Promise<void> {
    await this.post(
      'drive',
      '/ws/restoreItems',
      { items }
    );
  }

  /**
   * Empty trash
   */
  async emptyTrash(): Promise<void> {
    await this.post('drive', '/ws/emptyTrash', {});
  }

  /**
   * Get file type icon URL
   */
  getIconUrl(extension: string): string {
    const host = this.getHost('drive');
    return `https://${host}/icons/${extension.toLowerCase()}.png`;
  }

  /**
   * Get breadcrumb path for an item
   */
  async getBreadcrumb(itemId: string): Promise<DriveItem[]> {
    const path: DriveItem[] = [];
    let currentId = itemId;

    while (currentId && currentId !== this.rootId) {
      const item = await this.getItem(currentId);
      path.unshift(item);
      currentId = item.parentId;
    }

    return path;
  }

  /**
   * Copy items
   */
  async copy(
    items: { drivewsid: string; docwsid: string; etag: string }[],
    destinationId: string
  ): Promise<DriveItem[]> {
    const response = await this.post<{ items: DriveItem[] }>(
      'drive',
      '/ws/copyItems',
      {
        destinationDrivewsId: destinationId,
        items,
      }
    );

    return response.items || [];
  }
}
