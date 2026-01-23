/**
 * FinderToolbar - View mode, search, navigation arrows, refresh, hidden toggle
 */

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { ViewMode } from './types';

interface FinderToolbarProps {
  viewMode: ViewMode;
  showHidden: boolean;
  searchQuery: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isGoogleDrive: boolean;
  onViewModeChange: (mode: ViewMode) => void;
  onShowHiddenChange: (show: boolean) => void;
  onSearchChange: (query: string) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onRefresh: () => void;
}

export const FinderToolbar: React.FC<FinderToolbarProps> = ({
  viewMode,
  showHidden,
  searchQuery,
  canGoBack,
  canGoForward,
  isGoogleDrive,
  onViewModeChange,
  onShowHiddenChange,
  onSearchChange,
  onGoBack,
  onGoForward,
  onRefresh,
}) => {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 flex-shrink-0">
      {/* Navigation arrows */}
      <div className="flex items-center gap-1">
        <button
          className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          onClick={onGoBack}
          disabled={canGoBack === false || isGoogleDrive}
          title="Back"
        >
          <ChevronLeft size={16} className="text-white/70" />
        </button>
        <button
          className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          onClick={onGoForward}
          disabled={canGoForward === false || isGoogleDrive}
          title="Forward"
        >
          <ChevronRight size={16} className="text-white/70" />
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Local-only controls */}
      {!isGoogleDrive && (
        <>
          {/* View mode toggle */}
          <div className="flex items-center bg-white/5 rounded-md border border-white/10">
            <button
              className={`p-1.5 rounded-l-md transition-colors ${viewMode === 'list' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70'}`}
              onClick={() => onViewModeChange('list')}
              title="List view"
            >
              <List size={14} />
            </button>
            <button
              className={`p-1.5 rounded-r-md transition-colors ${viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70'}`}
              onClick={() => onViewModeChange('grid')}
              title="Grid view"
            >
              <LayoutGrid size={14} />
            </button>
          </div>

          {/* Show hidden toggle */}
          <button
            className={`p-1.5 rounded transition-colors ${showHidden ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70 hover:bg-white/5'}`}
            onClick={() => onShowHiddenChange(!showHidden)}
            title={showHidden ? 'Hide hidden files' : 'Show hidden files'}
          >
            {showHidden ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>

          {/* Refresh */}
          <button
            className="p-1.5 rounded text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors"
            onClick={onRefresh}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>

          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search"
              className="w-36 pl-7 pr-2 py-1 text-xs bg-white/5 border border-white/10 rounded-md text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-colors"
            />
          </div>
        </>
      )}
    </div>
  );
};
