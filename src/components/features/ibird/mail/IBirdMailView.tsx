/**
 * IBird Mail View Component
 *
 * Main mail interface with message list and reading pane.
 */

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive,
  Trash2,
  Star,
  MoreHorizontal,
  RefreshCw,
  ChevronDown,
  CheckSquare,
  Square,
  Search,
  X,
} from 'lucide-react';
import { useIBirdStore, useFilteredMessages } from '@/stores/ibirdStore';
import { useMailApi } from '../hooks/useIBirdApi';
import { IBirdMessageList } from './IBirdMessageList';
import { IBirdMessageView } from './IBirdMessageView';
import { IBirdEmptyState } from '../IBirdEmptyState';
import { IBirdResizeHandle } from '../IBirdResizeHandle';
import { cn } from '@/lib/utils';

export function IBirdMailView() {
  const {
    ui,
    selectedMessage,
    setActiveFolder,
    selectMessage,
    toggleMessageSelection,
    selectAllMessages,
    setMailListWidth,
    deselectAllMessages,
    setSearchQuery,
  } = useIBirdStore();

  const messages = useFilteredMessages();
  const { fetchMessages, markAsRead, deleteMessages, moveMessages } = useMailApi();

  // Fetch messages when folder changes
  useEffect(() => {
    if (ui.activeAccountId && ui.activeFolderId) {
      fetchMessages(ui.activeAccountId, ui.activeFolderId);
    }
  }, [ui.activeAccountId, ui.activeFolderId, fetchMessages]);

  // Handle message selection
  const handleMessageClick = useCallback(
    (messageId: string) => {
      selectMessage(messageId);
      // Mark as read when selected
      markAsRead([messageId], true);
    },
    [selectMessage, markAsRead]
  );

  // Handle bulk actions
  const handleArchive = useCallback(async () => {
    if (ui.multiSelectMessageIds.length > 0) {
      // Find archive folder ID
      const folders = useIBirdStore.getState().folders[ui.activeAccountId || ''] || [];
      const archiveFolder = folders.find((f) => f.folderType === 'archive');
      if (archiveFolder) {
        await moveMessages(ui.multiSelectMessageIds, archiveFolder.id);
        deselectAllMessages();
      }
    }
  }, [ui.multiSelectMessageIds, ui.activeAccountId, moveMessages, deselectAllMessages]);

  const handleDelete = useCallback(async () => {
    if (ui.multiSelectMessageIds.length > 0) {
      await deleteMessages(ui.multiSelectMessageIds);
      deselectAllMessages();
    }
  }, [ui.multiSelectMessageIds, deleteMessages, deselectAllMessages]);

  const handleRefresh = useCallback(() => {
    if (ui.activeAccountId && ui.activeFolderId) {
      fetchMessages(ui.activeAccountId, ui.activeFolderId);
    }
  }, [ui.activeAccountId, ui.activeFolderId, fetchMessages]);

  // Selection state
  const hasSelection = ui.multiSelectMessageIds.length > 0;
  const allSelected = hasSelection && ui.multiSelectMessageIds.length === messages.length;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-12 flex items-center px-4 border-b border-[var(--glass-border)] bg-[var(--glass-surface)]/30">
        {/* Select All */}
        <button
          onClick={allSelected ? deselectAllMessages : selectAllMessages}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
            'hover:bg-[var(--glass-surface-hover)] transition-colors duration-150'
          )}
        >
          {allSelected ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
        </button>

        {/* Selection count */}
        {hasSelection && (
          <span className="ml-2 text-sm text-[var(--glass-text-secondary)]">
            {ui.multiSelectMessageIds.length} selected
          </span>
        )}

        {/* Bulk Actions */}
        {hasSelection && (
          <div className="flex items-center gap-1 ml-4">
            <button
              onClick={handleArchive}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                'hover:bg-[var(--glass-surface-hover)] transition-colors duration-150'
              )}
              title="Archive"
            >
              <Archive className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                'text-[var(--glass-text-secondary)] hover:text-red-500',
                'hover:bg-[var(--glass-surface-hover)] transition-colors duration-150'
              )}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="relative mr-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-tertiary)]" />
          <input
            type="text"
            value={ui.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mail..."
            className={cn(
              'w-48 pl-9 pr-8 py-1.5 rounded-lg text-sm',
              'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
              'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]/50'
            )}
          />
          {ui.searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-[var(--glass-surface-hover)] rounded"
            >
              <X className="w-3.5 h-3.5 text-[var(--glass-text-tertiary)]" />
            </button>
          )}
        </div>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={ui.isLoadingMessages}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
            'hover:bg-[var(--glass-surface-hover)] transition-colors duration-150',
            'disabled:opacity-50'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', ui.isLoadingMessages && 'animate-spin')} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Message List */}
        <div
          className="flex-shrink-0 border-r border-[var(--glass-border)] overflow-hidden"
          style={{ width: ui.mailListWidth }}
        >
          {messages.length === 0 && !ui.isLoadingMessages ? (
            <IBirdEmptyState
              type={ui.searchQuery ? "no-search-results" : "no-messages"}
              searchQuery={ui.searchQuery}
            />
          ) : (
            <IBirdMessageList
              messages={messages}
              selectedId={ui.selectedMessageId}
              selectedIds={ui.multiSelectMessageIds}
              onSelect={handleMessageClick}
              onToggleSelect={toggleMessageSelection}
              isLoading={ui.isLoadingMessages}
            />
          )}
        </div>

        {/* Resize Handle: Message List ↔ Reading Pane */}
        <IBirdResizeHandle
          onResize={(delta) => setMailListWidth(ui.mailListWidth + delta)}
        />

        {/* Reading Pane */}
        <div className="flex-1 overflow-hidden">
          {selectedMessage ? (
            <IBirdMessageView message={selectedMessage} />
          ) : (
            <IBirdEmptyState type="no-selection" />
          )}
        </div>
      </div>
    </div>
  );
}
