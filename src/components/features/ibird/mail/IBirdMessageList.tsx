/**
 * IBird Message List Component
 *
 * Displays a list of email messages with selection support.
 */

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, Paperclip, CheckSquare, Square } from 'lucide-react';
import type { MailMessageListItem } from '@/stores/ibirdStore';
import { cn } from '@/lib/utils';

interface IBirdMessageListProps {
  messages: MailMessageListItem[];
  selectedId: string | null;
  selectedIds: string[];
  onSelect: (messageId: string) => void;
  onToggleSelect: (messageId: string) => void;
  isLoading?: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

export function IBirdMessageList({
  messages,
  selectedId,
  selectedIds,
  onSelect,
  onToggleSelect,
  isLoading,
}: IBirdMessageListProps) {
  const handleCheckboxClick = useCallback(
    (e: React.MouseEvent, messageId: string) => {
      e.stopPropagation();
      onToggleSelect(messageId);
    },
    [onToggleSelect]
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[var(--glass-accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[var(--glass-text-secondary)]">Loading messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {messages.map((message, index) => {
        const isSelected = selectedId === message.id;
        const isMultiSelected = selectedIds.includes(message.id);

        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02, duration: 0.15 }}
            onClick={() => onSelect(message.id)}
            className={cn(
              'group flex items-start gap-3 px-4 py-3 cursor-pointer',
              'border-b border-[var(--glass-border)]/50',
              'transition-colors duration-150',
              isSelected && 'bg-[var(--glass-accent)]/10',
              isMultiSelected && 'bg-[var(--glass-accent)]/5',
              !isSelected && !isMultiSelected && 'hover:bg-[var(--glass-surface-hover)]'
            )}
          >
            {/* Checkbox */}
            <button
              onClick={(e) => handleCheckboxClick(e, message.id)}
              className={cn(
                'flex-shrink-0 w-5 h-5 mt-0.5 rounded flex items-center justify-center',
                'text-[var(--glass-text-tertiary)]',
                'hover:text-[var(--glass-text-secondary)]',
                isMultiSelected && 'text-[var(--glass-accent)]'
              )}
            >
              {isMultiSelected ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header Row */}
              <div className="flex items-center gap-2">
                {/* Sender */}
                <span
                  className={cn(
                    'flex-1 truncate text-sm',
                    message.isRead
                      ? 'text-[var(--glass-text-secondary)]'
                      : 'font-semibold text-[var(--glass-text-primary)]'
                  )}
                >
                  {message.from?.name || message.from?.email || 'Unknown'}
                </span>

                {/* Date */}
                <span className="flex-shrink-0 text-xs text-[var(--glass-text-tertiary)]">
                  {formatDate(message.receivedAt)}
                </span>
              </div>

              {/* Subject */}
              <div
                className={cn(
                  'text-sm truncate mt-0.5',
                  message.isRead
                    ? 'text-[var(--glass-text-secondary)]'
                    : 'font-medium text-[var(--glass-text-primary)]'
                )}
              >
                {message.subject || '(No subject)'}
              </div>

              {/* Snippet */}
              <div className="text-xs text-[var(--glass-text-tertiary)] truncate mt-0.5">
                {message.snippet}
              </div>
            </div>

            {/* Indicators */}
            <div className="flex-shrink-0 flex items-center gap-1.5">
              {message.hasAttachments && (
                <Paperclip className="w-3.5 h-3.5 text-[var(--glass-text-tertiary)]" />
              )}
              {message.isStarred && (
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
