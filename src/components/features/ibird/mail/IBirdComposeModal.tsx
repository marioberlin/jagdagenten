/**
 * IBird Compose Modal Component
 *
 * Email composition modal with rich text editing.
 */

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Send,
  Paperclip,
  Image,
  Link,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Trash2,
} from 'lucide-react';
import type { ComposeState } from '@/stores/ibirdStore';
import { useIBirdStore } from '@/stores/ibirdStore';
import { cn } from '@/lib/utils';

interface IBirdComposeModalProps {
  compose: ComposeState;
}

export function IBirdComposeModal({ compose }: IBirdComposeModalProps) {
  const { updateCompose, closeCompose, setSending } = useIBirdStore();
  const [showCc, setShowCc] = useState(compose.cc.length > 0);
  const [showBcc, setShowBcc] = useState(compose.bcc.length > 0);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Handle recipient input
  const handleToChange = useCallback(
    (value: string) => {
      const emails = value.split(',').map((e) => {
        const trimmed = e.trim();
        return { email: trimmed, name: undefined };
      });
      updateCompose(compose.id, { to: emails });
    },
    [compose.id, updateCompose]
  );

  const handleCcChange = useCallback(
    (value: string) => {
      const emails = value.split(',').map((e) => {
        const trimmed = e.trim();
        return { email: trimmed, name: undefined };
      });
      updateCompose(compose.id, { cc: emails });
    },
    [compose.id, updateCompose]
  );

  const handleBccChange = useCallback(
    (value: string) => {
      const emails = value.split(',').map((e) => {
        const trimmed = e.trim();
        return { email: trimmed, name: undefined };
      });
      updateCompose(compose.id, { bcc: emails });
    },
    [compose.id, updateCompose]
  );

  const handleSubjectChange = useCallback(
    (value: string) => {
      updateCompose(compose.id, { subject: value });
    },
    [compose.id, updateCompose]
  );

  const handleBodyChange = useCallback(() => {
    if (bodyRef.current) {
      updateCompose(compose.id, {
        bodyHtml: bodyRef.current.innerHTML,
        bodyText: bodyRef.current.innerText,
      });
    }
  }, [compose.id, updateCompose]);

  // Handle send
  const handleSend = useCallback(async () => {
    if (compose.to.length === 0 || !compose.to[0].email) {
      alert('Please add at least one recipient');
      return;
    }

    setSending(true);
    try {
      // TODO: Implement actual send via API
      console.log('Sending email:', compose);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated delay
      closeCompose(compose.id);
    } catch (error) {
      console.error('Failed to send:', error);
      alert('Failed to send email');
    } finally {
      setSending(false);
    }
  }, [compose, closeCompose, setSending]);

  // Handle minimize/maximize
  const toggleMinimize = useCallback(() => {
    updateCompose(compose.id, { isMinimized: !compose.isMinimized });
  }, [compose.id, compose.isMinimized, updateCompose]);

  const toggleMaximize = useCallback(() => {
    updateCompose(compose.id, { isMaximized: !compose.isMaximized });
  }, [compose.id, compose.isMaximized, updateCompose]);

  // Format commands
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleBodyChange();
  }, [handleBodyChange]);

  // Modal sizing
  const modalClasses = compose.isMaximized
    ? 'fixed inset-4 z-[60]'
    : compose.isMinimized
    ? 'fixed bottom-4 right-4 w-80 h-12 z-[60]'
    : 'fixed bottom-4 right-4 w-[600px] h-[500px] z-[60]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        modalClasses,
        'flex flex-col rounded-xl overflow-hidden',
        'bg-[var(--glass-bg)] backdrop-blur-2xl',
        'border border-[var(--glass-border)]',
        'shadow-2xl shadow-black/20'
      )}
    >
      {/* Header */}
      <div className="h-10 flex items-center px-3 bg-[var(--glass-surface)] border-b border-[var(--glass-border)]">
        <span className="text-sm font-medium text-[var(--glass-text-primary)] flex-1 truncate">
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
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMinimize}
            className="w-6 h-6 rounded flex items-center justify-center text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleMaximize}
            className="w-6 h-6 rounded flex items-center justify-center text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]"
          >
            {compose.isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={() => closeCompose(compose.id)}
            className="w-6 h-6 rounded flex items-center justify-center text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body - Hidden when minimized */}
      {!compose.isMinimized && (
        <>
          {/* Recipients */}
          <div className="flex-shrink-0 border-b border-[var(--glass-border)]">
            {/* To */}
            <div className="flex items-center px-4 py-2 border-b border-[var(--glass-border)]/50">
              <span className="w-12 text-sm text-[var(--glass-text-tertiary)]">To</span>
              <input
                type="text"
                value={compose.to.map((r) => r.email).join(', ')}
                onChange={(e) => handleToChange(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[var(--glass-text-primary)] outline-none"
                placeholder="Recipients"
              />
              {!showCc && (
                <button
                  onClick={() => setShowCc(true)}
                  className="text-xs text-[var(--glass-accent)] hover:underline"
                >
                  Cc
                </button>
              )}
              {!showBcc && (
                <button
                  onClick={() => setShowBcc(true)}
                  className="ml-2 text-xs text-[var(--glass-accent)] hover:underline"
                >
                  Bcc
                </button>
              )}
            </div>

            {/* Cc */}
            {showCc && (
              <div className="flex items-center px-4 py-2 border-b border-[var(--glass-border)]/50">
                <span className="w-12 text-sm text-[var(--glass-text-tertiary)]">Cc</span>
                <input
                  type="text"
                  value={compose.cc.map((r) => r.email).join(', ')}
                  onChange={(e) => handleCcChange(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-[var(--glass-text-primary)] outline-none"
                  placeholder="Cc recipients"
                />
              </div>
            )}

            {/* Bcc */}
            {showBcc && (
              <div className="flex items-center px-4 py-2 border-b border-[var(--glass-border)]/50">
                <span className="w-12 text-sm text-[var(--glass-text-tertiary)]">Bcc</span>
                <input
                  type="text"
                  value={compose.bcc.map((r) => r.email).join(', ')}
                  onChange={(e) => handleBccChange(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-[var(--glass-text-primary)] outline-none"
                  placeholder="Bcc recipients"
                />
              </div>
            )}

            {/* Subject */}
            <div className="flex items-center px-4 py-2">
              <span className="w-12 text-sm text-[var(--glass-text-tertiary)]">Subject</span>
              <input
                type="text"
                value={compose.subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[var(--glass-text-primary)] outline-none"
                placeholder="Subject"
              />
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex-shrink-0 h-10 flex items-center gap-1 px-2 border-b border-[var(--glass-border)] bg-[var(--glass-surface)]/30">
            <button
              onClick={() => execCommand('bold')}
              className="w-8 h-8 rounded flex items-center justify-center text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => execCommand('italic')}
              className="w-8 h-8 rounded flex items-center justify-center text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => execCommand('underline')}
              className="w-8 h-8 rounded flex items-center justify-center text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]"
            >
              <Underline className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-[var(--glass-border)] mx-1" />
            <button
              onClick={() => execCommand('insertUnorderedList')}
              className="w-8 h-8 rounded flex items-center justify-center text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => execCommand('insertOrderedList')}
              className="w-8 h-8 rounded flex items-center justify-center text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-[var(--glass-border)] mx-1" />
            <button
              className="w-8 h-8 rounded flex items-center justify-center text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]"
            >
              <Link className="w-4 h-4" />
            </button>
            <button
              className="w-8 h-8 rounded flex items-center justify-center text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]"
            >
              <Image className="w-4 h-4" />
            </button>
          </div>

          {/* Body Editor */}
          <div
            ref={bodyRef}
            contentEditable
            onInput={handleBodyChange}
            className="flex-1 p-4 overflow-y-auto text-sm text-[var(--glass-text-primary)] outline-none"
            dangerouslySetInnerHTML={{ __html: compose.bodyHtml }}
          />

          {/* Footer */}
          <div className="flex-shrink-0 h-12 flex items-center justify-between px-4 border-t border-[var(--glass-border)] bg-[var(--glass-surface)]/30">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSend}
                className={cn(
                  'flex items-center gap-2 px-4 py-1.5 rounded-lg',
                  'bg-[var(--glass-accent)] text-white font-medium',
                  'hover:bg-[var(--glass-accent-hover)] transition-colors duration-150'
                )}
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
              <button
                className="w-8 h-8 rounded flex items-center justify-center text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => closeCompose(compose.id)}
              className="w-8 h-8 rounded flex items-center justify-center text-[var(--glass-text-tertiary)] hover:text-red-500 hover:bg-[var(--glass-surface-hover)]"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
