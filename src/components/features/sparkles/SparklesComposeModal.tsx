/**
 * SparklesComposeModal - Email compose modal
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Minimize2,
  Maximize2,
  Send,
  Paperclip,
  Clock,
  Trash2,
  Bold,
  Italic,
  Underline,
  Link,
  List,
  ListOrdered,
  Image as ImageIcon,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useSparklesStore } from '@/stores/sparklesStore';
import { cn } from '@/lib/utils';
import type { ComposeState } from '@/types/sparkles';

// =============================================================================
// Props
// =============================================================================

interface SparklesComposeModalProps {
  compose: ComposeState;
}

// =============================================================================
// Component
// =============================================================================

export function SparklesComposeModal({ compose }: SparklesComposeModalProps) {
  const {
    accounts,
    updateCompose,
    closeCompose,
    openModal,
  } = useSparklesStore();

  const [toInput, setToInput] = useState(compose.to.join(', '));
  const [ccInput, setCcInput] = useState(compose.cc.join(', '));
  const [bccInput, setBccInput] = useState(compose.bcc.join(', '));
  const [showCcBcc, setShowCcBcc] = useState(compose.cc.length > 0 || compose.bcc.length > 0);

  const bodyRef = useRef<HTMLDivElement>(null);

  // Sync to input back to store
  useEffect(() => {
    const to = toInput.split(',').map((e) => e.trim()).filter(Boolean);
    updateCompose(compose.id, { to });
  }, [toInput, compose.id, updateCompose]);

  // Handle close
  const handleClose = useCallback(() => {
    if (compose.isDirty) {
      // TODO: Prompt to save draft
    }
    closeCompose(compose.id);
  }, [compose.id, compose.isDirty, closeCompose]);

  // Handle minimize
  const handleMinimize = useCallback(() => {
    updateCompose(compose.id, { isMinimized: true, isMaximized: false });
  }, [compose.id, updateCompose]);

  // Handle maximize
  const handleMaximize = useCallback(() => {
    updateCompose(compose.id, { isMaximized: !compose.isMaximized, isMinimized: false });
  }, [compose.id, compose.isMaximized, updateCompose]);

  // Handle send
  const handleSend = useCallback(async () => {
    // TODO: Implement send via API
    console.log('Sending email:', compose);
    closeCompose(compose.id);
  }, [compose, closeCompose]);

  // Handle schedule
  const handleSchedule = useCallback(() => {
    openModal({ type: 'schedule-send', composeId: compose.id });
  }, [compose.id, openModal]);

  // Handle body change
  const handleBodyChange = useCallback(() => {
    if (bodyRef.current) {
      updateCompose(compose.id, { bodyHtml: bodyRef.current.innerHTML });
    }
  }, [compose.id, updateCompose]);

  // Get from account
  const fromAccount = accounts.find((a) => a.id === compose.fromAccountId);

  // Position based on minimized/maximized
  const position = compose.isMinimized
    ? 'bottom-4 right-4 w-72'
    : compose.isMaximized
    ? 'inset-4'
    : 'bottom-4 right-4 w-[600px] h-[500px]';

  if (compose.isMinimized) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className={cn(
          'fixed z-50',
          'bg-[var(--glass-surface)] backdrop-blur-xl',
          'border border-[var(--glass-border)]',
          'rounded-xl shadow-2xl',
          position
        )}
      >
        <button
          onClick={handleMaximize}
          className="w-full p-3 flex items-center gap-2 text-left"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center">
            <Send className="w-4 h-4 text-[var(--color-accent)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[var(--glass-text-primary)] truncate">
              {compose.subject || 'New Message'}
            </div>
            <div className="text-xs text-[var(--glass-text-tertiary)] truncate">
              {compose.to.length > 0 ? compose.to.join(', ') : 'Draft'}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="p-1 rounded hover:bg-[var(--glass-surface-hover)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
          </button>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 20, opacity: 0, scale: 0.95 }}
      className={cn(
        'fixed z-50 flex flex-col',
        'bg-[var(--glass-bg)] backdrop-blur-2xl',
        'border border-[var(--glass-border)]',
        'rounded-xl shadow-2xl',
        position
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--glass-border)]">
        <span className="text-sm font-medium text-[var(--glass-text-primary)] flex-1">
          {compose.mode === 'new'
            ? 'New Message'
            : compose.mode === 'reply'
            ? 'Reply'
            : compose.mode === 'replyAll'
            ? 'Reply All'
            : compose.mode === 'forward'
            ? 'Forward'
            : 'Draft'}
        </span>
        <button
          onClick={handleMinimize}
          className="p-1.5 rounded-md hover:bg-[var(--glass-surface-hover)] transition-colors"
        >
          <Minimize2 className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
        </button>
        <button
          onClick={handleMaximize}
          className="p-1.5 rounded-md hover:bg-[var(--glass-surface-hover)] transition-colors"
        >
          <Maximize2 className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
        </button>
        <button
          onClick={handleClose}
          className="p-1.5 rounded-md hover:bg-[var(--glass-surface-hover)] transition-colors"
        >
          <X className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
        </button>
      </div>

      {/* Recipients */}
      <div className="px-4 py-2 space-y-2 border-b border-[var(--glass-border)]">
        {/* From */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--glass-text-tertiary)] w-12">From</span>
          <button className="flex items-center gap-1 text-sm text-[var(--glass-text-primary)]">
            {fromAccount?.email ?? 'Select account'}
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* To */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--glass-text-tertiary)] w-12">To</span>
          <input
            type="text"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            placeholder="Recipients"
            className={cn(
              'flex-1 bg-transparent text-sm text-[var(--glass-text-primary)]',
              'placeholder:text-[var(--glass-text-tertiary)]',
              'focus:outline-none'
            )}
          />
          {!showCcBcc && (
            <button
              onClick={() => setShowCcBcc(true)}
              className="text-xs text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-primary)]"
            >
              Cc/Bcc
            </button>
          )}
        </div>

        {/* Cc/Bcc */}
        {showCcBcc && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--glass-text-tertiary)] w-12">Cc</span>
              <input
                type="text"
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                placeholder="Carbon copy"
                className={cn(
                  'flex-1 bg-transparent text-sm text-[var(--glass-text-primary)]',
                  'placeholder:text-[var(--glass-text-tertiary)]',
                  'focus:outline-none'
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--glass-text-tertiary)] w-12">Bcc</span>
              <input
                type="text"
                value={bccInput}
                onChange={(e) => setBccInput(e.target.value)}
                placeholder="Blind carbon copy"
                className={cn(
                  'flex-1 bg-transparent text-sm text-[var(--glass-text-primary)]',
                  'placeholder:text-[var(--glass-text-tertiary)]',
                  'focus:outline-none'
                )}
              />
            </div>
          </>
        )}

        {/* Subject */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--glass-text-tertiary)] w-12">Subject</span>
          <input
            type="text"
            value={compose.subject}
            onChange={(e) => updateCompose(compose.id, { subject: e.target.value })}
            placeholder="Subject"
            className={cn(
              'flex-1 bg-transparent text-sm text-[var(--glass-text-primary)]',
              'placeholder:text-[var(--glass-text-tertiary)]',
              'focus:outline-none'
            )}
          />
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--glass-border)]">
        <ToolbarButton icon={Bold} title="Bold" />
        <ToolbarButton icon={Italic} title="Italic" />
        <ToolbarButton icon={Underline} title="Underline" />
        <div className="w-px h-4 bg-[var(--glass-border)] mx-1" />
        <ToolbarButton icon={List} title="Bullet list" />
        <ToolbarButton icon={ListOrdered} title="Numbered list" />
        <div className="w-px h-4 bg-[var(--glass-border)] mx-1" />
        <ToolbarButton icon={Link} title="Link" />
        <ToolbarButton icon={ImageIcon} title="Image" />
        <div className="flex-1" />
        <ToolbarButton icon={Sparkles} title="AI Assist" accent />
      </div>

      {/* Body */}
      <div
        ref={bodyRef}
        contentEditable
        onInput={handleBodyChange}
        dangerouslySetInnerHTML={{ __html: compose.bodyHtml }}
        className={cn(
          'flex-1 px-4 py-3 overflow-y-auto',
          'text-sm text-[var(--glass-text-primary)]',
          'focus:outline-none',
          'prose prose-sm max-w-none'
        )}
        data-placeholder="Write your message..."
      />

      {/* Footer */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--glass-border)]">
        <button
          onClick={handleSend}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]',
            'text-white font-medium text-sm',
            'transition-colors duration-150'
          )}
        >
          <Send className="w-4 h-4" />
          Send
        </button>

        <button
          onClick={handleSchedule}
          className={cn(
            'p-2 rounded-lg',
            'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
            'hover:bg-[var(--glass-surface-hover)]',
            'transition-colors duration-150'
          )}
          title="Schedule send"
        >
          <Clock className="w-4 h-4" />
        </button>

        <button
          className={cn(
            'p-2 rounded-lg',
            'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
            'hover:bg-[var(--glass-surface-hover)]',
            'transition-colors duration-150'
          )}
          title="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        <button
          onClick={handleClose}
          className={cn(
            'p-2 rounded-lg',
            'text-[var(--glass-text-secondary)] hover:text-[var(--system-red)]',
            'hover:bg-[var(--glass-surface-hover)]',
            'transition-colors duration-150'
          )}
          title="Discard"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function ToolbarButton({
  icon: Icon,
  title,
  accent,
}: {
  icon: typeof Bold;
  title: string;
  accent?: boolean;
}) {
  return (
    <button
      className={cn(
        'p-1.5 rounded-md',
        'transition-colors duration-150',
        accent
          ? 'text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10'
          : 'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]'
      )}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

export default SparklesComposeModal;
