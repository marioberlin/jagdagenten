/**
 * Finder App - Shared Types
 */

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

export interface QuickAccessLocation {
  name: string;
  path: string;
  icon: string;
}

export type ViewMode = 'list' | 'grid';
export type SortColumn = 'name' | 'modified' | 'size' | 'kind';
export type SortDirection = 'asc' | 'desc';

export interface SidebarItem {
  id: string;
  name: string;
  icon: string;
  path?: string;
  type: 'local' | 'google-drive';
}

export interface SidebarSection {
  id: string;
  title: string;
  items: SidebarItem[];
  collapsible?: boolean;
}
