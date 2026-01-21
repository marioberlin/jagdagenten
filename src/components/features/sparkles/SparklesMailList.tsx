/**
 * SparklesMailList - Email thread list with search and filters
 */

import { useMemo, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  RefreshCw,
  Archive,
  Trash2,
  Star,
  MoreHorizontal,
  CheckSquare,
  Square,
  Filter,
  Clock,
  Paperclip,
  ChevronDown,
} from 'lucide-react';
import { useSparklesStore, useSyncStatus } from '@/stores/sparklesStore';
import { cn } from '@/lib/utils';
import type { EmailThread, EmailCategory } from '@/types/sparkles';
import {
  fetchThreads,
  batchArchive,
  batchDelete,
  toggleStar,
} from '@/services/sparklesApiActions';

// =============================================================================
// Props
// =============================================================================

interface SparklesMailListProps {
  threads: EmailThread[];
}

// =============================================================================
// Component
// =============================================================================

export function SparklesMailList({ threads }: SparklesMailListProps) {
  const {
    ui,
    settings,
    selectThread,
    updateThread,
    setSearchQuery,
    setSearchFocused,
    toggleThreadSelection,
    selectAllThreads,
    deselectAllThreads,
  } = useSparklesStore();

  const syncStatus = useSyncStatus();
  const listRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Group threads by category if in smart view
  const groupedThreads = useMemo(() => {
    if (ui.viewMode !== 'smart' || ui.activeFolder !== 'SMART_INBOX') {
      return { all: threads };
    }

    const groups: Record<string, EmailThread[]> = {
      priority: [],
      primary: [],
      newsletters: [],
      notifications: [],
      other: [],
    };

    threads.forEach((thread) => {
      if (thread.isPriority) {
        groups.priority.push(thread);
      } else if (thread.category === 'primary') {
        groups.primary.push(thread);
      } else if (thread.category === 'newsletters') {
        groups.newsletters.push(thread);
      } else if (thread.category === 'notifications') {
        groups.notifications.push(thread);
      } else {
        groups.other.push(thread);
      }
    });

    return groups;
  }, [threads, ui.viewMode, ui.activeFolder]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await fetchThreads({ labelIds: ['INBOX'], maxResults: 50 });
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const handleBulkArchive = useCallback(async () => {
    if (isBulkProcessing || ui.multiSelectThreadIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await batchArchive(ui.multiSelectThreadIds);
    } catch (error) {
      console.error('Failed to archive:', error);
    } finally {
      setIsBulkProcessing(false);
    }
  }, [isBulkProcessing, ui.multiSelectThreadIds]);

  const handleBulkDelete = useCallback(async () => {
    if (isBulkProcessing || ui.multiSelectThreadIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await batchDelete(ui.multiSelectThreadIds);
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setIsBulkProcessing(false);
    }
  }, [isBulkProcessing, ui.multiSelectThreadIds]);

  const handleThreadClick = useCallback(
    (threadId: string) => {
      selectThread(threadId);
    },
    [selectThread]
  );

  const handleStarClick = useCallback(
    async (e: React.MouseEvent, threadId: string, isStarred: boolean) => {
      e.stopPropagation();
      // Optimistic update happens inside toggleStar
      try {
        await toggleStar(threadId);
      } catch (error) {
        console.error('Failed to toggle star:', error);
      }
    },
    []
  );

  const handleSelectClick = useCallback(
    (e: React.MouseEvent, threadId: string) => {
      e.stopPropagation();
      toggleThreadSelection(threadId);
    },
    [toggleThreadSelection]
  );

  const hasSelection = ui.multiSelectThreadIds.length > 0;

  return (
    <div className="h-full flex flex-col bg-[var(--glass-bg-thin)]">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-[var(--glass-border)]">
        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--glass-text-tertiary)]" />
          <input
            type="text"
            placeholder="Search mail..."
            value={ui.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-lg',
              'bg-[var(--glass-surface)] border border-transparent',
              'text-sm text-[var(--glass-text-primary)]',
              'placeholder:text-[var(--glass-text-tertiary)]',
              'focus:outline-none focus:border-[var(--color-accent)]',
              'transition-colors duration-150'
            )}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Select All */}
            <button
              onClick={() =>
                hasSelection ? deselectAllThreads() : selectAllThreads()
              }
              className={cn(
                'p-1.5 rounded-md',
                'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                'hover:bg-[var(--glass-surface-hover)]',
                'transition-colors duration-150'
              )}
              title={hasSelection ? 'Deselect all' : 'Select all'}
            >
              {hasSelection ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={cn(
                'p-1.5 rounded-md',
                'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                'hover:bg-[var(--glass-surface-hover)]',
                'transition-colors duration-150',
                'disabled:opacity-50',
                isRefreshing && 'animate-spin'
              )}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Bulk Actions (when selected) */}
            {hasSelection && (
              <>
                <div className="w-px h-4 bg-[var(--glass-border)] mx-1" />
                <button
                  onClick={handleBulkArchive}
                  disabled={isBulkProcessing}
                  className={cn(
                    'p-1.5 rounded-md',
                    'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                    'hover:bg-[var(--glass-surface-hover)]',
                    'transition-colors duration-150',
                    'disabled:opacity-50'
                  )}
                  title="Archive"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkProcessing}
                  className={cn(
                    'p-1.5 rounded-md',
                    'text-[var(--glass-text-secondary)] hover:text-[var(--system-red)]',
                    'hover:bg-[var(--glass-surface-hover)]',
                    'transition-colors duration-150',
                    'disabled:opacity-50'
                  )}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Filter */}
            <button
              className={cn(
                'p-1.5 rounded-md',
                'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                'hover:bg-[var(--glass-surface-hover)]',
                'transition-colors duration-150'
              )}
              title="Filter"
            >
              <Filter className="w-4 h-4" />
            </button>

            {/* More */}
            <button
              className={cn(
                'p-1.5 rounded-md',
                'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                'hover:bg-[var(--glass-surface-hover)]',
                'transition-colors duration-150'
              )}
              title="More"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Thread List */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {ui.viewMode === 'smart' && ui.activeFolder === 'SMART_INBOX' ? (
          // Grouped view for Smart Inbox
          <>
            {groupedThreads.priority?.length > 0 && (
              <ThreadSection
                title="Priority"
                threads={groupedThreads.priority}
                selectedThreadId={ui.selectedThreadId}
                multiSelectIds={ui.multiSelectThreadIds}
                onThreadClick={handleThreadClick}
                onStarClick={handleStarClick}
                onSelectClick={handleSelectClick}
                color="var(--system-yellow)"
              />
            )}
            {groupedThreads.primary?.length > 0 && (
              <ThreadSection
                title="Primary"
                threads={groupedThreads.primary}
                selectedThreadId={ui.selectedThreadId}
                multiSelectIds={ui.multiSelectThreadIds}
                onThreadClick={handleThreadClick}
                onStarClick={handleStarClick}
                onSelectClick={handleSelectClick}
              />
            )}
            {groupedThreads.newsletters?.length > 0 && (
              <ThreadSection
                title="Newsletters"
                threads={groupedThreads.newsletters}
                selectedThreadId={ui.selectedThreadId}
                multiSelectIds={ui.multiSelectThreadIds}
                onThreadClick={handleThreadClick}
                onStarClick={handleStarClick}
                onSelectClick={handleSelectClick}
              />
            )}
            {groupedThreads.notifications?.length > 0 && (
              <ThreadSection
                title="Notifications"
                threads={groupedThreads.notifications}
                selectedThreadId={ui.selectedThreadId}
                multiSelectIds={ui.multiSelectThreadIds}
                onThreadClick={handleThreadClick}
                onStarClick={handleStarClick}
                onSelectClick={handleSelectClick}
              />
            )}
          </>
        ) : (
          // Flat list for other views
          <div className="divide-y divide-[var(--glass-border)]">
            {threads.map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                isSelected={ui.selectedThreadId === thread.id}
                isMultiSelected={ui.multiSelectThreadIds.includes(thread.id)}
                onClick={() => handleThreadClick(thread.id)}
                onStarClick={(e) => handleStarClick(e, thread.id, thread.isStarred)}
                onSelectClick={(e) => handleSelectClick(e, thread.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-3 py-2 border-t border-[var(--glass-border)]">
        <div className="text-xs text-[var(--glass-text-tertiary)]">
          {threads.length} conversations
          {hasSelection && ` · ${ui.multiSelectThreadIds.length} selected`}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function ThreadSection({
  title,
  threads,
  selectedThreadId,
  multiSelectIds,
  onThreadClick,
  onStarClick,
  onSelectClick,
  color,
}: {
  title: string;
  threads: EmailThread[];
  selectedThreadId: string | null;
  multiSelectIds: string[];
  onThreadClick: (id: string) => void;
  onStarClick: (e: React.MouseEvent, id: string, isStarred: boolean) => void;
  onSelectClick: (e: React.MouseEvent, id: string) => void;
  color?: string;
}) {
  return (
    <div className="border-b border-[var(--glass-border)]">
      <div
        className="px-3 py-2 text-xs font-medium uppercase tracking-wider flex items-center gap-2"
        style={{ color: color ?? 'var(--glass-text-tertiary)' }}
      >
        {title}
        <span className="opacity-60">({threads.length})</span>
      </div>
      <div className="divide-y divide-[var(--glass-border)]/50">
        {threads.map((thread) => (
          <ThreadRow
            key={thread.id}
            thread={thread}
            isSelected={selectedThreadId === thread.id}
            isMultiSelected={multiSelectIds.includes(thread.id)}
            onClick={() => onThreadClick(thread.id)}
            onStarClick={(e) => onStarClick(e, thread.id, thread.isStarred)}
            onSelectClick={(e) => onSelectClick(e, thread.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ThreadRow({
  thread,
  isSelected,
  isMultiSelected,
  onClick,
  onStarClick,
  onSelectClick,
}: {
  thread: EmailThread;
  isSelected: boolean;
  isMultiSelected: boolean;
  onClick: () => void;
  onStarClick: (e: React.MouseEvent) => void;
  onSelectClick: (e: React.MouseEvent) => void;
}) {
  const sender = thread.participants[0];
  const date = new Date(thread.lastMessageAt);
  const isToday = new Date().toDateString() === date.toDateString();
  const dateStr = isToday
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <motion.div
      onClick={onClick}
      className={cn(
        'px-3 py-2.5 cursor-pointer',
        'transition-colors duration-150',
        isSelected
          ? 'bg-[var(--glass-surface-active)]'
          : isMultiSelected
            ? 'bg-[var(--glass-surface)]'
            : 'hover:bg-[var(--glass-surface-hover)]',
        thread.isUnread && 'border-l-2 border-l-[var(--color-accent)]'
      )}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
    >
      <div className="flex items-start gap-2">
        {/* Checkbox */}
        <button
          onClick={onSelectClick}
          className={cn(
            'mt-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity',
            isMultiSelected && 'opacity-100'
          )}
        >
          {isMultiSelected ? (
            <CheckSquare className="w-4 h-4 text-[var(--color-accent)]" />
          ) : (
            <Square className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
          )}
        </button>

        {/* Avatar */}
        <div className="flex-shrink-0">
          {sender?.avatar ? (
            <img
              src={sender.avatar}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                thread.isPriority
                  ? 'bg-[var(--system-yellow)]/20 text-[var(--system-yellow)]'
                  : 'bg-[var(--glass-surface)] text-[var(--glass-text-secondary)]'
              )}
            >
              {(sender?.name ?? sender?.email ?? '?')[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={cn(
                'text-sm truncate',
                thread.isUnread
                  ? 'font-semibold text-[var(--glass-text-primary)]'
                  : 'text-[var(--glass-text-primary)]'
              )}
            >
              {sender?.name ?? sender?.email ?? 'Unknown'}
            </span>
            {thread.messageCount > 1 && (
              <span className="text-xs text-[var(--glass-text-tertiary)]">
                ({thread.messageCount})
              </span>
            )}
            <span className="ml-auto text-xs text-[var(--glass-text-tertiary)] flex-shrink-0">
              {dateStr}
            </span>
          </div>

          <div
            className={cn(
              'text-sm truncate mb-0.5',
              thread.isUnread
                ? 'font-medium text-[var(--glass-text-primary)]'
                : 'text-[var(--glass-text-secondary)]'
            )}
          >
            {thread.subject || '(no subject)'}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--glass-text-tertiary)] truncate flex-1">
              {thread.snippet}
            </span>

            {/* Indicators */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {thread.hasAttachments && (
                <Paperclip className="w-3 h-3 text-[var(--glass-text-tertiary)]" />
              )}
              {thread.snoozedUntil && (
                <Clock className="w-3 h-3 text-[var(--system-orange)]" />
              )}
              <button
                onClick={onStarClick}
                className="p-0.5 rounded hover:bg-[var(--glass-surface-hover)] transition-colors"
              >
                <Star
                  className={cn(
                    'w-3.5 h-3.5',
                    thread.isStarred
                      ? 'fill-[var(--system-yellow)] text-[var(--system-yellow)]'
                      : 'text-[var(--glass-text-tertiary)]'
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default SparklesMailList;
