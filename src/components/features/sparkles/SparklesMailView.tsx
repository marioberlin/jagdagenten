/**
 * SparklesMailView - Email thread detail view
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Trash2,
  Star,
  Clock,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Download,
  ExternalLink,
  Shield,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react';
import { useSparklesStore } from '@/stores/sparklesStore';
import { cn } from '@/lib/utils';
import type { EmailThread, EmailMessage, Attachment } from '@/types/sparkles';
import DOMPurify from 'dompurify';

// =============================================================================
// Props
// =============================================================================

interface SparklesMailViewProps {
  thread: EmailThread;
  onClose: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function SparklesMailView({ thread, onClose }: SparklesMailViewProps) {
  const {
    settings,
    updateThread,
    openCompose,
    openModal,
    addPrioritySender,
    removePrioritySender,
  } = useSparklesStore();

  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(() => {
    // Expand last message by default
    const lastId = thread.messages[thread.messages.length - 1]?.id;
    return new Set(lastId ? [lastId] : []);
  });

  // Toggle message expansion
  const toggleMessage = useCallback((messageId: string) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  }, []);

  // Expand/collapse all
  const expandAll = useCallback(() => {
    setExpandedMessages(new Set(thread.messages.map((m) => m.id)));
  }, [thread.messages]);

  const collapseAll = useCallback(() => {
    const lastId = thread.messages[thread.messages.length - 1]?.id;
    setExpandedMessages(new Set(lastId ? [lastId] : []));
  }, [thread.messages]);

  // Actions
  const handleReply = useCallback(() => {
    const lastMessage = thread.messages[thread.messages.length - 1];
    openCompose('reply', {
      threadId: thread.id,
      replyToMessageId: lastMessage?.id,
      to: [lastMessage?.from.email ?? ''],
      subject: `Re: ${thread.subject}`,
    });
  }, [thread, openCompose]);

  const handleReplyAll = useCallback(() => {
    const lastMessage = thread.messages[thread.messages.length - 1];
    const allRecipients = new Set<string>();
    allRecipients.add(lastMessage?.from.email ?? '');
    lastMessage?.to?.forEach((p) => allRecipients.add(p.email));
    lastMessage?.cc?.forEach((p) => allRecipients.add(p.email));

    openCompose('replyAll', {
      threadId: thread.id,
      replyToMessageId: lastMessage?.id,
      to: Array.from(allRecipients),
      subject: `Re: ${thread.subject}`,
    });
  }, [thread, openCompose]);

  const handleForward = useCallback(() => {
    const lastMessage = thread.messages[thread.messages.length - 1];
    openCompose('forward', {
      threadId: thread.id,
      forwardedMessageId: lastMessage?.id,
      subject: `Fwd: ${thread.subject}`,
      bodyHtml: lastMessage?.bodyHtml ?? '',
    });
  }, [thread, openCompose]);

  const handleArchive = useCallback(() => {
    updateThread(thread.id, { labelIds: thread.labelIds.filter((l) => l !== 'INBOX') });
    onClose();
  }, [thread, updateThread, onClose]);

  const handleDelete = useCallback(() => {
    updateThread(thread.id, { labelIds: [...thread.labelIds, 'TRASH'] });
    onClose();
  }, [thread, updateThread, onClose]);

  const handleStar = useCallback(() => {
    updateThread(thread.id, { isStarred: !thread.isStarred });
  }, [thread, updateThread]);

  const handleSnooze = useCallback(() => {
    openModal({ type: 'snooze', threadId: thread.id });
  }, [thread.id, openModal]);

  const sender = thread.participants[0];

  return (
    <div className="h-full flex flex-col bg-[var(--glass-bg-thin)]">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--glass-border)]">
        <div className="flex items-start gap-3">
          {/* Subject & Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-[var(--glass-text-primary)] mb-1">
              {thread.subject || '(no subject)'}
            </h2>
            <div className="flex items-center gap-2 text-sm text-[var(--glass-text-secondary)]">
              <span>{thread.messageCount} messages</span>
              <span>·</span>
              <span>{thread.participants.length} participants</span>
              {thread.hasAttachments && (
                <>
                  <span>·</span>
                  <Paperclip className="w-3.5 h-3.5" />
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleArchive}
              className={cn(
                'p-2 rounded-lg',
                'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                'hover:bg-[var(--glass-surface-hover)]',
                'transition-colors duration-150'
              )}
              title="Archive"
            >
              <Archive className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className={cn(
                'p-2 rounded-lg',
                'text-[var(--glass-text-secondary)] hover:text-[var(--system-red)]',
                'hover:bg-[var(--glass-surface-hover)]',
                'transition-colors duration-150'
              )}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSnooze}
              className={cn(
                'p-2 rounded-lg',
                'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                'hover:bg-[var(--glass-surface-hover)]',
                'transition-colors duration-150'
              )}
              title="Snooze"
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              onClick={handleStar}
              className={cn(
                'p-2 rounded-lg',
                'hover:bg-[var(--glass-surface-hover)]',
                'transition-colors duration-150',
                thread.isStarred
                  ? 'text-[var(--system-yellow)]'
                  : 'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]'
              )}
              title={thread.isStarred ? 'Unstar' : 'Star'}
            >
              <Star className={cn('w-4 h-4', thread.isStarred && 'fill-current')} />
            </button>
            <button
              className={cn(
                'p-2 rounded-lg',
                'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                'hover:bg-[var(--glass-surface-hover)]',
                'transition-colors duration-150'
              )}
              title="More"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className={cn(
                'p-2 rounded-lg ml-2',
                'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                'hover:bg-[var(--glass-surface-hover)]',
                'transition-colors duration-150'
              )}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {thread.messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            isExpanded={expandedMessages.has(message.id)}
            isLast={index === thread.messages.length - 1}
            onToggle={() => toggleMessage(message.id)}
            settings={settings}
          />
        ))}
      </div>

      {/* Quick Reply */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--glass-border)]">
        <div className="flex items-center gap-2">
          <button
            onClick={handleReply}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]',
              'text-white font-medium text-sm',
              'transition-colors duration-150'
            )}
          >
            <Reply className="w-4 h-4" />
            Reply
          </button>
          <button
            onClick={handleReplyAll}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-hover)]',
              'text-[var(--glass-text-primary)] font-medium text-sm',
              'transition-colors duration-150'
            )}
          >
            <ReplyAll className="w-4 h-4" />
            Reply All
          </button>
          <button
            onClick={handleForward}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-hover)]',
              'text-[var(--glass-text-primary)] font-medium text-sm',
              'transition-colors duration-150'
            )}
          >
            <Forward className="w-4 h-4" />
            Forward
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function MessageItem({
  message,
  isExpanded,
  isLast,
  onToggle,
  settings,
}: {
  message: EmailMessage;
  isExpanded: boolean;
  isLast: boolean;
  onToggle: () => void;
  settings: { loadRemoteImages: boolean; blockTrackingPixels: boolean };
}) {
  const date = new Date(message.internalDate);
  const dateStr = date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Sanitize HTML content
  const sanitizedHtml = useMemo(() => {
    if (!message.bodyHtml) return '';

    let html = message.bodyHtml;

    // Block tracking pixels if enabled
    if (settings.blockTrackingPixels) {
      // Remove 1x1 images (common tracking pixels)
      html = html.replace(/<img[^>]*(?:width|height)\s*=\s*["']?1["']?[^>]*>/gi, '');
    }

    // Block remote images if not enabled
    if (!settings.loadRemoteImages) {
      html = html.replace(/<img[^>]*src\s*=\s*["']https?:\/\/[^"']*["'][^>]*>/gi, '[Image blocked]');
    }

    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'div', 'span', 'a', 'b', 'i', 'u', 'strong', 'em',
        'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'h1', 'h2', 'h3',
        'h4', 'h5', 'h6', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target'],
      ALLOW_DATA_ATTR: false,
    });
  }, [message.bodyHtml, settings.loadRemoteImages, settings.blockTrackingPixels]);

  return (
    <motion.div
      className={cn(
        'rounded-xl border border-[var(--glass-border)]',
        'bg-[var(--glass-surface)]',
        'overflow-hidden'
      )}
      initial={false}
      animate={{ opacity: 1 }}
    >
      {/* Header (always visible) */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full p-4 flex items-start gap-3 text-left',
          'hover:bg-[var(--glass-surface-hover)]',
          'transition-colors duration-150'
        )}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {message.from.avatar ? (
            <img
              src={message.from.avatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)] font-medium">
              {(message.from.name ?? message.from.email)[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-[var(--glass-text-primary)]">
              {message.from.name ?? message.from.email}
            </span>
            <span className="text-sm text-[var(--glass-text-tertiary)]">
              {message.from.email}
            </span>
          </div>
          <div className="text-sm text-[var(--glass-text-secondary)]">
            To: {message.to.map((p) => p.name ?? p.email).join(', ')}
            {message.cc && message.cc.length > 0 && (
              <span className="ml-2">
                Cc: {message.cc.map((p) => p.name ?? p.email).join(', ')}
              </span>
            )}
          </div>
          {!isExpanded && (
            <div className="mt-1 text-sm text-[var(--glass-text-tertiary)] truncate">
              {message.snippet}
            </div>
          )}
        </div>

        {/* Date & Toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-[var(--glass-text-tertiary)]">{dateStr}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
          )}
        </div>
      </button>

      {/* Body (expandable) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Email Body */}
            <div
              className="px-4 pb-4 prose prose-sm max-w-none text-[var(--glass-text-primary)]"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml || message.bodyText }}
            />

            {/* Attachments */}
            {message.attachments.length > 0 && (
              <div className="px-4 pb-4 border-t border-[var(--glass-border)] pt-3">
                <div className="text-xs font-medium text-[var(--glass-text-tertiary)] uppercase mb-2">
                  Attachments ({message.attachments.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.attachments.map((att) => (
                    <AttachmentItem key={att.id} attachment={att} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AttachmentItem({ attachment }: { attachment: Attachment }) {
  const isImage = attachment.mimeType.startsWith('image/');
  const sizeStr = formatFileSize(attachment.size);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-[var(--glass-bg)] border border-[var(--glass-border)]',
        'hover:bg-[var(--glass-surface-hover)]',
        'transition-colors duration-150 cursor-pointer'
      )}
    >
      {isImage ? (
        <ImageIcon className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
      ) : (
        <Paperclip className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
      )}
      <div className="min-w-0">
        <div className="text-sm text-[var(--glass-text-primary)] truncate max-w-[150px]">
          {attachment.filename}
        </div>
        <div className="text-xs text-[var(--glass-text-tertiary)]">{sizeStr}</div>
      </div>
      <button className="p-1 rounded hover:bg-[var(--glass-surface)] transition-colors">
        <Download className="w-3.5 h-3.5 text-[var(--glass-text-tertiary)]" />
      </button>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default SparklesMailView;
