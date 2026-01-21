/**
 * Drive types for iCloud Drive API
 */

export interface DriveItem {
  drivewsid: string;
  docwsid: string;
  zone: string;
  name: string;
  extension?: string;
  type: DriveItemType;
  size?: number;
  dateCreated: string;
  dateModified: string;
  dateChanged: string;
  etag: string;
  parentId: string;
  directChildrenCount?: number;
  items?: DriveItem[];
  lastOpenedTime?: string;
  assetQuota?: number;
  fileCount?: number;
  isChainedToParent?: boolean;
  shortGUID?: string;
}

export type DriveItemType =
  | 'FILE'
  | 'FOLDER'
  | 'APP_LIBRARY'
  | 'PACKAGE'
  | 'TRASH'
  | 'APP_CONTAINER';

export interface DriveRoot {
  drivewsid: string;
  docwsid: string;
  zone: string;
  name: string;
  type: DriveItemType;
  items: DriveItem[];
  numberOfItems: number;
}

export interface DriveNodeDetails {
  drivewsid: string;
  docwsid: string;
  zone: string;
  name: string;
  extension?: string;
  type: DriveItemType;
  size?: number;
  dateCreated: string;
  dateModified: string;
  dateChanged: string;
  etag: string;
  parentId: string;
  directChildrenCount?: number;
  items?: DriveItem[];
  urls?: {
    urlDownload?: string;
    urlUpload?: string;
  };
}

export interface DriveDownloadUrl {
  data_token: {
    url: string;
    signature: string;
    wrapping_key: string;
    reference_signature: string;
  };
  package_token?: {
    url: string;
    signature: string;
    wrapping_key: string;
    reference_signature: string;
  };
  double_etag?: string;
}

export interface DriveUploadToken {
  url: string;
  document_id: string;
  owner: string;
  owner_id: string;
}

export interface DriveCreateFolderInput {
  name: string;
  parentId?: string;
}

export interface DriveRenameInput {
  drivewsid: string;
  docwsid: string;
  etag: string;
  name: string;
  extension?: string;
}

export interface DriveMoveInput {
  items: {
    drivewsid: string;
    docwsid: string;
    etag: string;
  }[];
  destinationDrivewsid: string;
}

export interface DriveDeleteInput {
  items: {
    drivewsid: string;
    docwsid: string;
    etag: string;
  }[];
}

export interface DriveUploadInput {
  parentId?: string;
  filename: string;
  content: string | Buffer | ArrayBuffer;
  contentType?: string;
}

export interface DriveShareInput {
  drivewsid: string;
  docwsid: string;
}

export interface DriveShareInfo {
  shareId: string;
  publicUrl: string;
  permissions: 'read' | 'readwrite';
  expiresAt?: Date;
}

export interface DriveQuota {
  storageUsedInBytes: number;
  storageAvailableInBytes: number;
  storageCapacityInBytes: number;
  photoLibrarySizeInBytes: number;
  backupSizeInBytes: number;
  mailSizeInBytes: number;
  driveSizeInBytes: number;
}

export interface DriveRecentDoc {
  drivewsid: string;
  docwsid: string;
  zone: string;
  name: string;
  extension?: string;
  type: DriveItemType;
  size?: number;
  dateModified: string;
  lastOpenedTime: string;
  parentId: string;
  app?: string;
}

export interface DriveListOptions {
  parentId?: string;
  zone?: string;
  includeItems?: boolean;
}

export interface DriveSearchOptions {
  query: string;
  scope?: 'all' | 'documents' | 'images' | 'videos' | 'audio';
  extension?: string;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
  limit?: number;
}

export interface DriveResponse<T> {
  items: T[];
  numberOfItems?: number;
}
