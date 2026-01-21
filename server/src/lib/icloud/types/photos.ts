/**
 * Photos types for iCloud Photos API
 */

export interface Photo {
  recordName: string;
  recordType: string;
  recordChangeTag: string;
  fields: PhotoFields;
  zoneID: PhotoZoneID;
  created: PhotoTimestamp;
  modified: PhotoTimestamp;
  deleted?: boolean;
}

export interface PhotoFields {
  assetDate?: TimestampValue;
  addedDate?: TimestampValue;
  adjustmentType?: StringValue;
  masterFingerprint?: StringValue;
  filenameEnc?: EncryptedValue;
  resOriginalWidth?: NumberValue;
  resOriginalHeight?: NumberValue;
  resOriginalRes?: AssetValue;
  resJPEGThumbRes?: AssetValue;
  resJPEGMedRes?: AssetValue;
  resJPEGFullRes?: AssetValue;
  resVidSmallRes?: AssetValue;
  resVidMedRes?: AssetValue;
  resVidFullRes?: AssetValue;
  resOriginalVidComplRes?: AssetValue;
  orientation?: NumberValue;
  duration?: NumberValue;
  isFavorite?: NumberValue;
  isHidden?: NumberValue;
  isDeleted?: NumberValue;
  adjustmentRenderType?: NumberValue;
  captionEnc?: EncryptedValue;
  burstFlags?: NumberValue;
  burstFlagsExt?: NumberValue;
  burstId?: StringValue;
  importedBy?: StringValue;
  importedByBundleIdentifier?: StringValue;
  locationEnc?: EncryptedValue;
  mediaMetaDataEnc?: EncryptedValue;
  vidComplDispValue?: StringValue;
  vidComplDurScale?: NumberValue;
  vidComplDurValue?: NumberValue;
  vidComplDispScale?: NumberValue;
  timeZoneOffset?: NumberValue;
  itemType?: StringValue;
  dataClassType?: NumberValue;
  assetSubtypeV2?: NumberValue;
  assetHDRType?: NumberValue;
  masterRef?: ReferenceValue;
  adjustmentSimpleDataRef?: ReferenceValue;
}

export interface PhotoZoneID {
  zoneName: string;
  ownerRecordName: string;
  zoneType: string;
}

export interface PhotoTimestamp {
  timestamp: number;
  userRecordName?: string;
  deviceID?: string;
}

interface StringValue {
  value: string;
  type: 'STRING';
}

interface NumberValue {
  value: number;
  type: 'INT64' | 'DOUBLE';
}

interface TimestampValue {
  value: number;
  type: 'TIMESTAMP';
}

interface EncryptedValue {
  value: string;
  type: 'ENCRYPTED_BYTES';
}

interface AssetValue {
  value: {
    downloadURL: string;
    fileChecksum: string;
    size: number;
    wrappingKey?: string;
    referenceChecksum?: string;
  };
  type: 'ASSETID';
}

interface ReferenceValue {
  value: {
    recordName: string;
    action: 'DELETE_SELF' | 'NONE' | 'VALIDATE';
    zoneID: PhotoZoneID;
  };
  type: 'REFERENCE';
}

export interface Album {
  recordName: string;
  recordType: string;
  recordChangeTag: string;
  fields: AlbumFields;
  zoneID: PhotoZoneID;
  created: PhotoTimestamp;
  modified: PhotoTimestamp;
  isDeleted?: boolean;
}

export interface AlbumFields {
  albumNameEnc?: EncryptedValue;
  albumType?: NumberValue;
  sortAscending?: NumberValue;
  sortType?: NumberValue;
  sortTypeExt?: NumberValue;
  position?: NumberValue;
  isHidden?: NumberValue;
  itemCount?: NumberValue;
  posterAsset?: ReferenceValue;
  keyAsset?: ReferenceValue;
  cloudGUID?: StringValue;
}

export interface PhotoMoment {
  recordName: string;
  recordType: string;
  recordChangeTag: string;
  fields: MomentFields;
  zoneID: PhotoZoneID;
}

export interface MomentFields {
  startDate?: TimestampValue;
  endDate?: TimestampValue;
  assetCount?: NumberValue;
  locationEnc?: EncryptedValue;
  titleEnc?: EncryptedValue;
}

export interface PhotoLibraryStats {
  photosCount: number;
  videosCount: number;
  totalSize: number;
  albumsCount: number;
  sharedAlbumsCount: number;
  favoritesCount: number;
  recentlyDeletedCount: number;
}

export interface PhotoListResponse {
  records: Photo[];
  continuationMarker?: string;
  syncToken?: string;
}

export interface AlbumListResponse {
  records: Album[];
}

export interface ParsedPhoto {
  recordName: string;
  filename: string;
  width: number;
  height: number;
  orientation: number;
  fileType: string;
  fileSize: number;
  assetDate: Date;
  addedDate: Date;
  isFavorite: boolean;
  isHidden: boolean;
  isVideo: boolean;
  duration?: number;
  isHDR: boolean;
  isBurst: boolean;
  burstId?: string;
  caption?: string;
  location?: PhotoLocation;
  downloadUrl: string;
  thumbUrl: string;
  mediumUrl?: string;
  fullUrl?: string;
}

export interface PhotoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  course?: number;
  speed?: number;
  horizontalAccuracy?: number;
  verticalAccuracy?: number;
}

export interface ParsedAlbum {
  recordName: string;
  name: string;
  type: AlbumType;
  itemCount: number;
  isHidden: boolean;
  sortAscending: boolean;
  posterAssetId?: string;
  createdAt: Date;
  modifiedAt: Date;
}

export type AlbumType =
  | 'regular'
  | 'smart'
  | 'event'
  | 'faces'
  | 'places'
  | 'import'
  | 'lastImport'
  | 'favorites'
  | 'videos'
  | 'panoramas'
  | 'bursts'
  | 'screenshots'
  | 'selfPortraits'
  | 'livePhotos'
  | 'depthEffect'
  | 'timelapses'
  | 'slomos'
  | 'animations'
  | 'longExposures'
  | 'rawPhotos'
  | 'recentlyDeleted'
  | 'hidden';

export interface PhotoQueryOptions {
  albumId?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
  includeHidden?: boolean;
  includeDeleted?: boolean;
  mediaType?: 'photo' | 'video' | 'all';
  sortBy?: 'date' | 'addedDate' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface PhotoSearchOptions {
  query?: string;
  faces?: string[];
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in meters
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  mediaType?: 'photo' | 'video' | 'all';
  isFavorite?: boolean;
  limit?: number;
}

export interface AlbumCreateInput {
  name: string;
  photoIds?: string[];
}

export interface AlbumUpdateInput {
  recordName: string;
  name?: string;
  addPhotoIds?: string[];
  removePhotoIds?: string[];
}

export interface PhotoUpdateInput {
  recordName: string;
  isFavorite?: boolean;
  isHidden?: boolean;
  caption?: string;
}

export interface PhotoDeleteInput {
  recordNames: string[];
  permanent?: boolean;
}

export interface SharedAlbum extends Album {
  shareToken?: string;
  isOwner?: boolean;
  subscribers?: SharedAlbumSubscriber[];
  publicURL?: string;
}

export interface SharedAlbumSubscriber {
  email: string;
  firstName?: string;
  lastName?: string;
  isSubscribed: boolean;
  canPost: boolean;
}

export interface SharedAlbumCreateInput {
  name: string;
  photoIds?: string[];
  subscriberEmails?: string[];
  isPublic?: boolean;
}

export interface PhotoDownloadOptions {
  quality: 'thumb' | 'medium' | 'full' | 'original';
  includeAdjustments?: boolean;
}
