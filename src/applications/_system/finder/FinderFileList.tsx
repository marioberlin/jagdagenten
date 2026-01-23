/**
 * FinderFileList - List/grid view with column headers and file entries
 */

import React from 'react';
import {
  Folder,
  File,
  FileText,
  FileCode,
  Image,
  Film,
  Music,
  Archive,
  FileJson,
  Globe,
  ChevronUp,
  ChevronDown,
  FolderSymlink,
} from 'lucide-react';
import type { FileEntry, ViewMode, SortColumn, SortDirection } from './types';

// File extension to icon/color mapping
const FILE_ICON_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  ts: { icon: FileCode, color: 'text-blue-400' },
  tsx: { icon: FileCode, color: 'text-blue-400' },
  js: { icon: FileCode, color: 'text-yellow-400' },
  jsx: { icon: FileCode, color: 'text-yellow-400' },
  json: { icon: FileJson, color: 'text-green-400' },
  md: { icon: FileText, color: 'text-white/60' },
  txt: { icon: FileText, color: 'text-white/60' },
  html: { icon: Globe, color: 'text-orange-400' },
  css: { icon: FileCode, color: 'text-purple-400' },
  scss: { icon: FileCode, color: 'text-pink-400' },
  png: { icon: Image, color: 'text-green-400' },
  jpg: { icon: Image, color: 'text-green-400' },
  jpeg: { icon: Image, color: 'text-green-400' },
  gif: { icon: Image, color: 'text-green-400' },
  svg: { icon: Image, color: 'text-orange-400' },
  mp4: { icon: Film, color: 'text-purple-400' },
  mov: { icon: Film, color: 'text-purple-400' },
  mp3: { icon: Music, color: 'text-pink-400' },
  wav: { icon: Music, color: 'text-pink-400' },
  zip: { icon: Archive, color: 'text-yellow-400' },
  tar: { icon: Archive, color: 'text-yellow-400' },
  gz: { icon: Archive, color: 'text-yellow-400' },
};

function getFileIconInfo(entry: FileEntry): { icon: React.ElementType; color: string } {
  if (entry.type === 'directory') {
    return { icon: Folder, color: 'text-blue-400' };
  }
  if (entry.type === 'symlink') {
    return { icon: FolderSymlink, color: 'text-cyan-400' };
  }
  const ext = entry.name.includes('.') ? entry.name.split('.').pop()?.toLowerCase() || '' : '';
  return FILE_ICON_MAP[ext] || { icon: File, color: 'text-white/50' };
}

function formatSize(bytes?: number): string {
  if (bytes === undefined || bytes === null) return '--';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getFileKind(entry: FileEntry): string {
  if (entry.type === 'directory') return 'Folder';
  if (entry.type === 'symlink') return 'Symlink';
  const ext = entry.name.includes('.') ? entry.name.split('.').pop()?.toUpperCase() || '' : '';
  return ext ? `${ext} File` : 'File';
}

interface FinderFileListProps {
  entries: FileEntry[];
  viewMode: ViewMode;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  loading: boolean;
  error: string | null;
  onNavigate: (path: string) => void;
  onSortChange: (column: SortColumn) => void;
}

export const FinderFileList: React.FC<FinderFileListProps> = ({
  entries,
  viewMode,
  sortColumn,
  sortDirection,
  loading,
  error,
  onNavigate,
  onSortChange,
}) => {
  const SortIndicator = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc'
      ? <ChevronUp size={10} className="text-white/50" />
      : <ChevronDown size={10} className="text-white/50" />;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-white/40 text-sm">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-red-400/80 text-sm text-center">{error}</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-white/30 text-sm">This folder is empty</div>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-4 gap-3">
          {entries.map(entry => {
            const { icon: IconComp, color } = getFileIconInfo(entry);
            return (
              <button
                key={entry.path}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                onDoubleClick={() => entry.type === 'directory' && onNavigate(entry.path)}
              >
                <IconComp size={28} className={`${color} group-hover:scale-110 transition-transform`} />
                <span className="text-[11px] text-white/80 truncate w-full text-center leading-tight">
                  {entry.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Column headers */}
      <div className="flex items-center px-3 py-1.5 border-b border-white/10 text-[10px] font-medium text-white/40 uppercase tracking-wider flex-shrink-0">
        <button
          className="flex items-center gap-1 flex-1 min-w-0 hover:text-white/60 transition-colors"
          onClick={() => onSortChange('name')}
        >
          Name <SortIndicator column="name" />
        </button>
        <button
          className="flex items-center gap-1 w-28 hover:text-white/60 transition-colors"
          onClick={() => onSortChange('modified')}
        >
          Modified <SortIndicator column="modified" />
        </button>
        <button
          className="flex items-center gap-1 w-20 hover:text-white/60 transition-colors"
          onClick={() => onSortChange('size')}
        >
          Size <SortIndicator column="size" />
        </button>
        <button
          className="flex items-center gap-1 w-24 hover:text-white/60 transition-colors"
          onClick={() => onSortChange('kind')}
        >
          Kind <SortIndicator column="kind" />
        </button>
      </div>

      {/* File rows */}
      <div className="flex-1 overflow-y-auto">
        {entries.map(entry => {
          const { icon: IconComp, color } = getFileIconInfo(entry);
          return (
            <button
              key={entry.path}
              className="w-full flex items-center px-3 py-1.5 hover:bg-white/5 transition-colors text-left group"
              onDoubleClick={() => entry.type === 'directory' && onNavigate(entry.path)}
            >
              {/* Name */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <IconComp size={14} className={color} />
                <span className={`text-xs truncate ${entry.isHidden ? 'text-white/40' : 'text-white/80'}`}>
                  {entry.name}
                </span>
              </div>
              {/* Modified */}
              <div className="w-28 text-[11px] text-white/40">
                {formatDate(entry.modifiedAt)}
              </div>
              {/* Size */}
              <div className="w-20 text-[11px] text-white/40">
                {entry.type === 'directory' ? '--' : formatSize(entry.size)}
              </div>
              {/* Kind */}
              <div className="w-24 text-[11px] text-white/40 truncate">
                {getFileKind(entry)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
