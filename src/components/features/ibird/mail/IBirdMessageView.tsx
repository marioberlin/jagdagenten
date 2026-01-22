/**
 * IBird Message View Component
 *
 * Displays a single email message with full content.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Trash2,
  Star,
  MoreHorizontal,
  Paperclip,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { MailMessage } from '@/stores/ibirdStore';
import { useIBirdStore } from '@/stores/ibirdStore';
import { useMailApi } from '../hooks/useIBirdApi';
import { cn } from '@/lib/utils';

interface IBirdMessageViewProps {
  message: MailMessage;
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function IBirdMessageView({ message }: IBirdMessageViewProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { openCompose } = useIBirdStore();
  const { toggleStar, deleteMessages, moveMessages } = useMailApi();

  // Format recipients
  const toRecipients = useMemo(() => {
    return message.to.map((r) => r.name || r.email).join(', ');
  }, [message.to]);

  const ccRecipients = useMemo(() => {
    return message.cc.map((r) => r.name || r.email).join(', ');
  }, [message.cc]);

  // Handle actions
  const handleReply = () => {
    openCompose('reply', {
      to: [message.from],
      subject: `Re: ${message.subject || ''}`,
      replyToMessageId: message.id,
      threadId: message.threadId,
    });
  };

  const handleReplyAll = () => {
    openCompose('replyAll', {
      to: [message.from, ...message.to.filter((r) => r.email !== message.from.email)],
      cc: message.cc,
      subject: `Re: ${message.subject || ''}`,
      replyToMessageId: message.id,
      threadId: message.threadId,
    });
  };

  const handleForward = () => {
    openCompose('forward', {
      subject: `Fwd: ${message.subject || ''}`,
      forwardedMessageId: message.id,
      bodyHtml: `<br><br>---------- Forwarded message ---------<br>From: ${message.from.name || message.from.email}<br>Date: ${formatFullDate(message.receivedAt)}<br>Subject: ${message.subject}<br>To: ${toRecipients}<br><br>${message.bodyHtml || message.bodyText || ''}`,
    });
  };

  const handleStar = () => {
    toggleStar(message.id, !message.isStarred);
  };

  const handleDelete = () => {
    deleteMessages([message.id]);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--glass-surface)]/20">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--glass-border)]">
        {/* Actions Row */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handleReply}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
              'text-sm text-[var(--glass-text-secondary)]',
              'hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]',
              'transition-colors duration-150'
            )}
          >
            <Reply className="w-4 h-4" />
            <span>Reply</span>
          </button>
          <button
            onClick={handleReplyAll}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
              'text-sm text-[var(--glass-text-secondary)]',
              'hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]',
              'transition-colors duration-150'
            )}
          >
            <ReplyAll className="w-4 h-4" />
            <span>Reply All</span>
          </button>
          <button
            onClick={handleForward}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
              'text-sm text-[var(--glass-text-secondary)]',
              'hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]',
              'transition-colors duration-150'
            )}
          >
            <Forward className="w-4 h-4" />
            <span>Forward</span>
          </button>

          <div className="flex-1" />

          <button
            onClick={handleStar}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              'transition-colors duration-150',
              message.isStarred
                ? 'text-yellow-500'
                : 'text-[var(--glass-text-tertiary)] hover:text-yellow-500'
            )}
          >
            <Star className={cn('w-4 h-4', message.isStarred && 'fill-current')} />
          </button>
          <button
            onClick={handleDelete}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              'text-[var(--glass-text-tertiary)] hover:text-red-500',
              'transition-colors duration-150'
            )}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              'text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-primary)]',
              'hover:bg-[var(--glass-surface-hover)] transition-colors duration-150'
            )}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Subject */}
        <h1 className="text-xl font-semibold text-[var(--glass-text-primary)] mb-3">
          {message.subject || '(No subject)'}
        </h1>

        {/* Sender Info */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-[var(--glass-accent)] flex items-center justify-center text-white font-medium flex-shrink-0">
            {(message.from.name || message.from.email).charAt(0).toUpperCase()}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--glass-text-primary)]">
                {message.from.name || message.from.email}
              </span>
              {message.from.name && (
                <span className="text-sm text-[var(--glass-text-tertiary)]">
                  &lt;{message.from.email}&gt;
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-[var(--glass-text-secondary)]">
              <span>to {toRecipients}</span>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-[var(--glass-accent)] hover:underline flex items-center gap-0.5"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    <span>Hide details</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>Show details</span>
                  </>
                )}
              </button>
            </div>

            {/* Expanded Details */}
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 text-sm text-[var(--glass-text-secondary)] space-y-1"
              >
                <div>
                  <span className="text-[var(--glass-text-tertiary)]">From: </span>
                  {message.from.name ? `${message.from.name} <${message.from.email}>` : message.from.email}
                </div>
                <div>
                  <span className="text-[var(--glass-text-tertiary)]">To: </span>
                  {message.to.map((r) => r.name ? `${r.name} <${r.email}>` : r.email).join(', ')}
                </div>
                {message.cc.length > 0 && (
                  <div>
                    <span className="text-[var(--glass-text-tertiary)]">Cc: </span>
                    {ccRecipients}
                  </div>
                )}
                <div>
                  <span className="text-[var(--glass-text-tertiary)]">Date: </span>
                  {formatFullDate(message.receivedAt)}
                </div>
              </motion.div>
            )}
          </div>

          {/* Date */}
          <span className="text-sm text-[var(--glass-text-tertiary)] flex-shrink-0">
            {formatFullDate(message.receivedAt)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {message.bodyHtml ? (
          <div
            className="prose prose-sm max-w-none text-[var(--glass-text-primary)]"
            dangerouslySetInnerHTML={{ __html: message.bodyHtml }}
          />
        ) : (
          <pre className="whitespace-pre-wrap text-sm text-[var(--glass-text-primary)] font-sans">
            {message.bodyText}
          </pre>
        )}
      </div>

      {/* Attachments */}
      {message.hasAttachments && (
        <div className="flex-shrink-0 p-4 border-t border-[var(--glass-border)]">
          <div className="flex items-center gap-2 text-sm text-[var(--glass-text-secondary)] mb-2">
            <Paperclip className="w-4 h-4" />
            <span>Attachments</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Placeholder for attachments - would be populated from actual attachment data */}
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg',
                'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                'hover:bg-[var(--glass-surface-hover)] cursor-pointer transition-colors'
              )}
            >
              <Paperclip className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
              <span className="text-sm text-[var(--glass-text-primary)]">attachment.pdf</span>
              <Download className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
