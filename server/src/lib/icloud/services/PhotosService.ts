/**
 * Photos Service for iCloud Photos API
 */

import { BaseService } from './BaseService';
import type {
  Photo,
  Album,
  ParsedPhoto,
  ParsedAlbum,
  PhotoQueryOptions,
  PhotoSearchOptions,
  AlbumCreateInput,
  AlbumUpdateInput,
  PhotoUpdateInput,
  PhotoDeleteInput,
  PhotoLibraryStats,
  PhotoDownloadOptions,
} from '../types/photos';
import { ICloudError } from '../errors/ICloudError';
import { generateRecordName } from '../utils/ids';

export class PhotosService extends BaseService {
  private _syncToken?: string;
  private _initialized = false;

  get syncToken(): string | undefined {
    return this._syncToken;
  }

  get isInitialized(): boolean {
    return this._initialized;
  }

  protected getServiceConfig() {
    return this.client.account?.webservices.photos;
  }

  /**
   * Initialize Photos service
   */
  async startup(): Promise<{ stats: PhotoLibraryStats }> {
    const response = await this.cloudKitQuery<{ totalCount: number }>(
      'recordQuery',
      'CPLAsset',
      [],
      { count: true }
    );

    this._initialized = true;

    return {
      stats: {
        photosCount: response.records?.[0]?.totalCount || 0,
        videosCount: 0, // Would need separate query
        totalSize: 0,
        albumsCount: 0,
        sharedAlbumsCount: 0,
        favoritesCount: 0,
        recentlyDeletedCount: 0,
      },
    };
  }

  /**
   * Get photos with pagination
   */
  async listPhotos(options: PhotoQueryOptions = {}): Promise<Photo[]> {
    const filters: unknown[] = [];

    // Date range filter
    if (options.startDate) {
      filters.push({
        fieldName: 'assetDate',
        comparator: 'GREATER_THAN_OR_EQUALS',
        fieldValue: { value: options.startDate.getTime(), type: 'TIMESTAMP' },
      });
    }

    if (options.endDate) {
      filters.push({
        fieldName: 'assetDate',
        comparator: 'LESS_THAN_OR_EQUALS',
        fieldValue: { value: options.endDate.getTime(), type: 'TIMESTAMP' },
      });
    }

    // Hidden filter
    if (!options.includeHidden) {
      filters.push({
        fieldName: 'isHidden',
        comparator: 'EQUALS',
        fieldValue: { value: 0, type: 'INT64' },
      });
    }

    // Deleted filter
    if (!options.includeDeleted) {
      filters.push({
        fieldName: 'isDeleted',
        comparator: 'EQUALS',
        fieldValue: { value: 0, type: 'INT64' },
      });
    }

    // Media type filter
    if (options.mediaType && options.mediaType !== 'all') {
      const itemType = options.mediaType === 'video' ? 'public.movie' : 'public.image';
      filters.push({
        fieldName: 'itemType',
        comparator: 'EQUALS',
        fieldValue: { value: itemType, type: 'STRING' },
      });
    }

    const response = await this.cloudKitQuery<Photo>(
      'recordQuery',
      'CPLAsset',
      filters,
      {
        limit: options.limit || 100,
        offset: options.offset || 0,
        sortBy: options.sortBy === 'addedDate' ? 'addedDate' : 'assetDate',
        sortOrder: options.sortOrder || 'desc',
      }
    );

    return response.records || [];
  }

  /**
   * Get photos for a specific album
   */
  async getAlbumPhotos(albumId: string, options: PhotoQueryOptions = {}): Promise<Photo[]> {
    // First get the album assets
    const albumAssets = await this.cloudKitQuery<{ asset: { recordName: string } }>(
      'recordQuery',
      'CPLAlbumAsset',
      [{
        fieldName: 'album',
        comparator: 'EQUALS',
        fieldValue: {
          value: { recordName: albumId },
          type: 'REFERENCE',
        },
      }],
      { limit: options.limit || 100 }
    );

    if (!albumAssets.records?.length) {
      return [];
    }

    // Then fetch the actual photos
    const recordNames = albumAssets.records.map(r => r.asset.recordName);
    const response = await this.cloudKitLookup<Photo>(recordNames);

    return response.records || [];
  }

  /**
   * Get a single photo
   */
  async getPhoto(recordName: string): Promise<Photo | null> {
    try {
      const response = await this.cloudKitLookup<Photo>([recordName]);
      return response.records?.[0] || null;
    } catch (error) {
      if (error instanceof ICloudError && error.code === 'NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get parsed photo with extracted metadata
   */
  async getParsedPhoto(recordName: string): Promise<ParsedPhoto | null> {
    const photo = await this.getPhoto(recordName);
    if (!photo) return null;

    return this.parsePhoto(photo);
  }

  /**
   * Get all albums
   */
  async listAlbums(): Promise<Album[]> {
    const response = await this.cloudKitQuery<Album>(
      'recordQuery',
      'CPLAlbum',
      [{
        fieldName: 'isDeleted',
        comparator: 'EQUALS',
        fieldValue: { value: 0, type: 'INT64' },
      }]
    );

    return response.records || [];
  }

  /**
   * Get a specific album
   */
  async getAlbum(recordName: string): Promise<Album | null> {
    try {
      const response = await this.cloudKitLookup<Album>([recordName]);
      return response.records?.[0] || null;
    } catch (error) {
      if (error instanceof ICloudError && error.code === 'NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get parsed album
   */
  async getParsedAlbum(recordName: string): Promise<ParsedAlbum | null> {
    const album = await this.getAlbum(recordName);
    if (!album) return null;

    return this.parseAlbum(album);
  }

  /**
   * Search photos
   */
  async search(options: PhotoSearchOptions): Promise<Photo[]> {
    // Photos search is limited - we mainly filter by date and favorites
    const queryOptions: PhotoQueryOptions = {
      limit: options.limit || 50,
      mediaType: options.mediaType,
    };

    if (options.dateRange) {
      queryOptions.startDate = options.dateRange.start;
      queryOptions.endDate = options.dateRange.end;
    }

    let photos = await this.listPhotos(queryOptions);

    // Filter by favorite if specified
    if (options.isFavorite !== undefined) {
      photos = photos.filter(p =>
        (p.fields.isFavorite?.value === 1) === options.isFavorite
      );
    }

    // TODO: Implement location and face search
    // These would require additional CloudKit queries

    return photos;
  }

  /**
   * Get favorite photos
   */
  async getFavorites(limit: number = 100): Promise<Photo[]> {
    const response = await this.cloudKitQuery<Photo>(
      'recordQuery',
      'CPLAsset',
      [
        {
          fieldName: 'isFavorite',
          comparator: 'EQUALS',
          fieldValue: { value: 1, type: 'INT64' },
        },
        {
          fieldName: 'isDeleted',
          comparator: 'EQUALS',
          fieldValue: { value: 0, type: 'INT64' },
        },
      ],
      { limit }
    );

    return response.records || [];
  }

  /**
   * Get recently added photos
   */
  async getRecentlyAdded(limit: number = 50): Promise<Photo[]> {
    return this.listPhotos({
      limit,
      sortBy: 'addedDate',
      sortOrder: 'desc',
    });
  }

  /**
   * Get recently deleted photos
   */
  async getRecentlyDeleted(limit: number = 100): Promise<Photo[]> {
    const response = await this.cloudKitQuery<Photo>(
      'recordQuery',
      'CPLAsset',
      [{
        fieldName: 'isDeleted',
        comparator: 'EQUALS',
        fieldValue: { value: 1, type: 'INT64' },
      }],
      { limit }
    );

    return response.records || [];
  }

  /**
   * Create a new album
   */
  async createAlbum(input: AlbumCreateInput): Promise<Album> {
    const recordName = generateRecordName();

    const album = await this.cloudKitModify<Album>([{
      operationType: 'create',
      record: {
        recordType: 'CPLAlbum',
        recordName,
        fields: {
          albumNameEnc: {
            value: btoa(input.name),
            type: 'ENCRYPTED_BYTES',
          },
          albumType: {
            value: 0,
            type: 'INT64',
          },
          sortAscending: {
            value: 0,
            type: 'INT64',
          },
          sortType: {
            value: 0,
            type: 'INT64',
          },
          isHidden: {
            value: 0,
            type: 'INT64',
          },
        },
      },
    }]);

    if (!album.records?.length) {
      throw new ICloudError('Failed to create album', 'UNKNOWN_ERROR');
    }

    // Add photos if provided
    if (input.photoIds?.length) {
      await this.addPhotosToAlbum(album.records[0].recordName, input.photoIds);
    }

    return album.records[0];
  }

  /**
   * Update an album
   */
  async updateAlbum(input: AlbumUpdateInput): Promise<Album> {
    const existing = await this.getAlbum(input.recordName);
    if (!existing) {
      throw new ICloudError('Album not found', 'NOT_FOUND');
    }

    const fields: Record<string, unknown> = {};

    if (input.name) {
      fields.albumNameEnc = {
        value: btoa(input.name),
        type: 'ENCRYPTED_BYTES',
      };
    }

    const result = await this.cloudKitModify<Album>([{
      operationType: 'update',
      record: {
        recordType: 'CPLAlbum',
        recordName: input.recordName,
        recordChangeTag: existing.recordChangeTag,
        fields,
      },
    }]);

    if (!result.records?.length) {
      throw new ICloudError('Failed to update album', 'UNKNOWN_ERROR');
    }

    // Handle photo additions/removals
    if (input.addPhotoIds?.length) {
      await this.addPhotosToAlbum(input.recordName, input.addPhotoIds);
    }

    if (input.removePhotoIds?.length) {
      await this.removePhotosFromAlbum(input.recordName, input.removePhotoIds);
    }

    return result.records[0];
  }

  /**
   * Add photos to an album
   */
  async addPhotosToAlbum(albumId: string, photoIds: string[]): Promise<void> {
    const operations = photoIds.map(photoId => ({
      operationType: 'create' as const,
      record: {
        recordType: 'CPLAlbumAsset',
        recordName: generateRecordName(),
        fields: {
          album: {
            value: { recordName: albumId },
            type: 'REFERENCE',
          },
          asset: {
            value: { recordName: photoId },
            type: 'REFERENCE',
          },
        },
      },
    }));

    await this.cloudKitModify(operations);
  }

  /**
   * Remove photos from an album
   */
  async removePhotosFromAlbum(albumId: string, photoIds: string[]): Promise<void> {
    // First find the album asset records
    const albumAssets = await this.cloudKitQuery<{
      recordName: string;
      asset: { recordName: string };
    }>(
      'recordQuery',
      'CPLAlbumAsset',
      [{
        fieldName: 'album',
        comparator: 'EQUALS',
        fieldValue: { value: { recordName: albumId }, type: 'REFERENCE' },
      }]
    );

    const photoIdSet = new Set(photoIds);
    const toDelete = albumAssets.records?.filter(r =>
      photoIdSet.has(r.asset.recordName)
    ) || [];

    if (toDelete.length > 0) {
      await this.cloudKitModify(toDelete.map(r => ({
        operationType: 'delete' as const,
        record: {
          recordType: 'CPLAlbumAsset',
          recordName: r.recordName,
        },
      })));
    }
  }

  /**
   * Update photo metadata
   */
  async updatePhoto(input: PhotoUpdateInput): Promise<Photo> {
    const existing = await this.getPhoto(input.recordName);
    if (!existing) {
      throw new ICloudError('Photo not found', 'NOT_FOUND');
    }

    const fields: Record<string, unknown> = {};

    if (input.isFavorite !== undefined) {
      fields.isFavorite = {
        value: input.isFavorite ? 1 : 0,
        type: 'INT64',
      };
    }

    if (input.isHidden !== undefined) {
      fields.isHidden = {
        value: input.isHidden ? 1 : 0,
        type: 'INT64',
      };
    }

    if (input.caption !== undefined) {
      fields.captionEnc = {
        value: btoa(input.caption),
        type: 'ENCRYPTED_BYTES',
      };
    }

    const result = await this.cloudKitModify<Photo>([{
      operationType: 'update',
      record: {
        recordType: 'CPLAsset',
        recordName: input.recordName,
        recordChangeTag: existing.recordChangeTag,
        fields,
      },
    }]);

    if (!result.records?.length) {
      throw new ICloudError('Failed to update photo', 'UNKNOWN_ERROR');
    }

    return result.records[0];
  }

  /**
   * Delete photos
   */
  async deletePhotos(input: PhotoDeleteInput): Promise<void> {
    // Move to recently deleted (soft delete)
    const operations = input.recordNames.map(recordName => ({
      operationType: 'update' as const,
      record: {
        recordType: 'CPLAsset',
        recordName,
        fields: {
          isDeleted: {
            value: 1,
            type: 'INT64',
          },
        },
      },
    }));

    await this.cloudKitModify(operations);

    // If permanent deletion requested
    if (input.permanent) {
      const deleteOps = input.recordNames.map(recordName => ({
        operationType: 'delete' as const,
        record: {
          recordType: 'CPLAsset',
          recordName,
        },
      }));

      await this.cloudKitModify(deleteOps);
    }
  }

  /**
   * Restore deleted photos
   */
  async restorePhotos(recordNames: string[]): Promise<void> {
    const operations = recordNames.map(recordName => ({
      operationType: 'update' as const,
      record: {
        recordType: 'CPLAsset',
        recordName,
        fields: {
          isDeleted: {
            value: 0,
            type: 'INT64',
          },
        },
      },
    }));

    await this.cloudKitModify(operations);
  }

  /**
   * Get download URL for a photo
   */
  async getDownloadUrl(
    recordName: string,
    options: PhotoDownloadOptions = { quality: 'full' }
  ): Promise<string> {
    const photo = await this.getPhoto(recordName);
    if (!photo) {
      throw new ICloudError('Photo not found', 'NOT_FOUND');
    }

    // Select appropriate resolution field
    let assetField;
    switch (options.quality) {
      case 'thumb':
        assetField = photo.fields.resJPEGThumbRes;
        break;
      case 'medium':
        assetField = photo.fields.resJPEGMedRes;
        break;
      case 'full':
        assetField = photo.fields.resJPEGFullRes;
        break;
      case 'original':
        assetField = photo.fields.resOriginalRes;
        break;
    }

    if (!assetField?.value?.downloadURL) {
      throw new ICloudError('Download URL not available', 'NOT_FOUND');
    }

    return assetField.value.downloadURL;
  }

  /**
   * Download a photo
   */
  async download(
    recordName: string,
    options: PhotoDownloadOptions = { quality: 'full' }
  ): Promise<Blob> {
    const url = await this.getDownloadUrl(recordName, options);

    const response = await this.client.http.get<Blob>(url, {
      responseType: 'blob',
    });

    return response.data;
  }

  // Private helpers
  private async cloudKitQuery<T>(
    _operation: string,
    recordType: string,
    filters: unknown[],
    options: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: string;
      count?: boolean;
    } = {}
  ): Promise<{ records: T[]; continuationMarker?: string }> {
    const response = await this.post<{ records: T[]; continuationMarker?: string }>(
      'ckdatabasews',
      '/database/1/com.apple.photos.cloud/production/private/records/query',
      {
        query: {
          recordType,
          filterBy: filters,
          sortBy: options.sortBy
            ? [{ fieldName: options.sortBy, ascending: options.sortOrder === 'asc' }]
            : undefined,
        },
        resultsLimit: options.limit || 100,
        zoneID: {
          zoneName: 'PrimarySync',
          ownerRecordName: '_defaultOwner',
        },
      }
    );

    if (response.continuationMarker) {
      this._syncToken = response.continuationMarker;
    }

    return response;
  }

  private async cloudKitLookup<T>(
    recordNames: string[]
  ): Promise<{ records: T[] }> {
    return this.post<{ records: T[] }>(
      'ckdatabasews',
      '/database/1/com.apple.photos.cloud/production/private/records/lookup',
      {
        records: recordNames.map(recordName => ({ recordName })),
        zoneID: {
          zoneName: 'PrimarySync',
          ownerRecordName: '_defaultOwner',
        },
      }
    );
  }

  private async cloudKitModify<T>(
    operations: Array<{
      operationType: 'create' | 'update' | 'delete';
      record: Record<string, unknown>;
    }>
  ): Promise<{ records: T[] }> {
    return this.post<{ records: T[] }>(
      'ckdatabasews',
      '/database/1/com.apple.photos.cloud/production/private/records/modify',
      {
        operations,
        zoneID: {
          zoneName: 'PrimarySync',
          ownerRecordName: '_defaultOwner',
        },
      }
    );
  }

  private parsePhoto(photo: Photo): ParsedPhoto {
    const fields = photo.fields;

    // Decrypt filename
    let filename = 'Unknown';
    if (fields.filenameEnc?.value) {
      try {
        filename = atob(fields.filenameEnc.value);
      } catch {
        filename = 'Unknown';
      }
    }

    // Determine if video
    const itemType = fields.itemType?.value || '';
    const isVideo = itemType.includes('movie') || itemType.includes('video');

    return {
      recordName: photo.recordName,
      filename,
      width: fields.resOriginalWidth?.value || 0,
      height: fields.resOriginalHeight?.value || 0,
      orientation: fields.orientation?.value || 1,
      fileType: itemType,
      fileSize: fields.resOriginalRes?.value?.size || 0,
      assetDate: new Date(fields.assetDate?.value || photo.created.timestamp),
      addedDate: new Date(fields.addedDate?.value || photo.created.timestamp),
      isFavorite: fields.isFavorite?.value === 1,
      isHidden: fields.isHidden?.value === 1,
      isVideo,
      duration: fields.duration?.value,
      isHDR: fields.assetHDRType?.value === 1,
      isBurst: !!fields.burstId?.value,
      burstId: fields.burstId?.value,
      downloadUrl: fields.resOriginalRes?.value?.downloadURL || '',
      thumbUrl: fields.resJPEGThumbRes?.value?.downloadURL || '',
      mediumUrl: fields.resJPEGMedRes?.value?.downloadURL,
      fullUrl: fields.resJPEGFullRes?.value?.downloadURL,
    };
  }

  private parseAlbum(album: Album): ParsedAlbum {
    const fields = album.fields;

    // Decrypt album name
    let name = 'Untitled Album';
    if (fields.albumNameEnc?.value) {
      try {
        name = atob(fields.albumNameEnc.value);
      } catch {
        name = 'Untitled Album';
      }
    }

    // Determine album type based on iCloud's internal types
    const albumTypeNum = fields.albumType?.value || 0;
    let type: ParsedAlbum['type'] = 'regular';
    if (albumTypeNum === 1) type = 'smart';
    else if (albumTypeNum === 2) type = 'event';
    else if (albumTypeNum === 3) type = 'faces';

    return {
      recordName: album.recordName,
      name,
      type,
      itemCount: fields.itemCount?.value || 0,
      isHidden: fields.isHidden?.value === 1,
      sortAscending: fields.sortAscending?.value === 1,
      posterAssetId: fields.posterAsset?.value?.recordName,
      createdAt: new Date(album.created.timestamp),
      modifiedAt: new Date(album.modified.timestamp),
    };
  }
}
