/**
 * IBird Compose Modal Component
 *
 * Email composition modal with rich text editing.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Maximize2,
  Minimize2,
  Send,
  Paperclip,
  Link,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Trash2,
  Sparkles,
  MessageCircle,
  FileText,
  Bell,
  Forward,
  AtSign,
  List,
  ListOrdered,
  Quote,
  IndentDecrease,
  IndentIncrease,
  Heading1,
  Type,
  Image,
  Table,
  Palette,
} from 'lucide-react';
import type { ComposeState } from '@/stores/ibirdStore';
import { useIBirdStore } from '@/stores/ibirdStore';

interface IBirdComposeModalProps {
  compose: ComposeState;
}

export function IBirdComposeModal({ compose }: IBirdComposeModalProps) {
  const { updateCompose, closeCompose, setSending, accounts } = useIBirdStore();
  const activeAccount = accounts.length > 0 ? accounts[0] : null;
  const [showCc, setShowCc] = useState(compose.cc.length > 0);
  const [showBcc, setShowBcc] = useState(compose.bcc.length > 0);
  const [hasBodyContent, setHasBodyContent] = useState(!!compose.bodyHtml || !!compose.bodyText);
  const bodyRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

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

  // Track body content via ref to avoid re-renders that reset cursor position
  const bodyContentRef = useRef({ html: compose.bodyHtml || '', text: compose.bodyText || '' });

  const handleBodyChange = useCallback(() => {
    if (bodyRef.current) {
      const text = bodyRef.current.innerText;
      bodyContentRef.current = {
        html: bodyRef.current.innerHTML,
        text,
      };
      setHasBodyContent(text.trim().length > 0);
    }
  }, []);

  // Handle send
  const handleSend = useCallback(async () => {
    if (compose.to.length === 0 || !compose.to[0].email) {
      alert('Please add at least one recipient');
      return;
    }

    // Save body content from ref before sending
    updateCompose(compose.id, {
      bodyHtml: bodyContentRef.current.html,
      bodyText: bodyContentRef.current.text,
    });

    setSending(true);
    try {
      // TODO: Implement actual send via API
      console.log('Sending email:', {
        ...compose,
        bodyHtml: bodyContentRef.current.html,
        bodyText: bodyContentRef.current.text,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated delay
      closeCompose(compose.id);
    } catch (error) {
      console.error('Failed to send:', error);
      alert('Failed to send email');
    } finally {
      setSending(false);
    }
  }, [compose, closeCompose, setSending, updateCompose]);

  // Handle minimize/maximize
  const toggleMinimize = useCallback(() => {
    updateCompose(compose.id, { isMinimized: !compose.isMinimized });
  }, [compose.id, compose.isMinimized, updateCompose]);

  const toggleMaximize = useCallback(() => {
    updateCompose(compose.id, { isMaximized: !compose.isMaximized });
  }, [compose.id, compose.isMaximized, updateCompose]);

  // Set initial content and auto-focus body editor on mount
  useEffect(() => {
    if (bodyRef.current) {
      // Set initial HTML content if any (reply/forward)
      if (compose.bodyHtml) {
        bodyRef.current.innerHTML = compose.bodyHtml;
      }
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        bodyRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Format commands
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleBodyChange();
  }, [handleBodyChange]);

  // Handle text selection to show/hide floating toolbar
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (
      selection &&
      !selection.isCollapsed &&
      selection.rangeCount > 0 &&
      bodyRef.current?.contains(selection.anchorNode)
    ) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setToolbarPosition({
        top: rect.top - 48,
        left: rect.left + rect.width / 2,
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  }, []);

  // Hide toolbar when clicking outside
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        // Small delay to allow button clicks to process first
        setTimeout(() => {
          const selection = window.getSelection();
          if (!selection || selection.isCollapsed) {
            setShowToolbar(false);
          }
        }, 100);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-[60] flex flex-col bg-white overflow-hidden"
    >
      {/* Header bar with action icons */}
      <div className="flex items-center justify-between px-6 py-3">
        {/* Window controls - rounded pill style */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => closeCompose(compose.id)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={toggleMinimize}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors border-r border-gray-200"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={toggleMaximize}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right side: action icons + account + send */}
        <div className="flex items-center gap-1">
          <button
            className="w-7 h-7 rounded-md flex items-center justify-center text-blue-600 hover:bg-blue-50"
            title="AI Assist"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            title="Chat"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <button
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            title="Templates"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            title="Remind me"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            title="Send later"
          >
            <Forward className="w-4 h-4" />
          </button>
          <button
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            title="Mention"
          >
            <AtSign className="w-4 h-4" />
          </button>
          {/* Account info */}
          {activeAccount && (
            <div className="ml-3 flex items-center gap-1">
              <span className="text-sm text-gray-600 truncate max-w-[200px]">
                {activeAccount.email}
              </span>
              <span className="text-xs text-gray-400 uppercase">
                {activeAccount.displayName}
              </span>
            </div>
          )}
          {/* Send button */}
          <button
            onClick={handleSend}
            className="ml-2 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subject */}
      <div className="px-6 pb-2">
        <input
          type="text"
          value={compose.subject}
          onChange={(e) => handleSubjectChange(e.target.value)}
          className="w-full text-2xl font-semibold text-gray-900 placeholder:text-gray-300 placeholder:font-semibold outline-none"
          placeholder="Subject"
        />
      </div>

      {/* Recipients */}
      <div className="px-6 pb-4 border-b border-gray-100">
        <div className="flex items-center py-1.5">
          <input
            type="text"
            value={compose.to.map((r) => r.email).join(', ')}
            onChange={(e) => handleToChange(e.target.value)}
            className="flex-1 text-sm text-gray-600 placeholder:text-gray-300 outline-none"
            placeholder="To, Cc, Bcc"
          />
          {!showCc && (
            <button
              onClick={() => setShowCc(true)}
              className="text-xs text-blue-500 hover:underline ml-2"
            >
              Cc
            </button>
          )}
          {!showBcc && (
            <button
              onClick={() => setShowBcc(true)}
              className="text-xs text-blue-500 hover:underline ml-2"
            >
              Bcc
            </button>
          )}
        </div>

        {showCc && (
          <div className="flex items-center py-1.5">
            <span className="w-8 text-xs text-gray-400">Cc</span>
            <input
              type="text"
              value={compose.cc.map((r) => r.email).join(', ')}
              onChange={(e) => handleCcChange(e.target.value)}
              className="flex-1 text-sm text-gray-600 placeholder:text-gray-300 outline-none"
              placeholder="Cc recipients"
            />
          </div>
        )}

        {showBcc && (
          <div className="flex items-center py-1.5">
            <span className="w-8 text-xs text-gray-400">Bcc</span>
            <input
              type="text"
              value={compose.bcc.map((r) => r.email).join(', ')}
              onChange={(e) => handleBccChange(e.target.value)}
              className="flex-1 text-sm text-gray-600 placeholder:text-gray-300 outline-none"
              placeholder="Bcc recipients"
            />
          </div>
        )}
      </div>

      {/* AI Quick Actions */}
      <div className="px-6 py-3 flex items-center gap-2 flex-wrap">
        <button className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors">
          +ai
        </button>
        <button className="px-4 py-1.5 rounded-full bg-gray-100 text-sm text-gray-600 hover:bg-gray-200 transition-colors">
          Generate a Draft
        </button>
        <button className="px-4 py-1.5 rounded-full bg-gray-100 text-sm text-gray-600 hover:bg-gray-200 transition-colors">
          Invite to a meeting...
        </button>
        <button className="px-4 py-1.5 rounded-full bg-gray-100 text-sm text-gray-600 hover:bg-gray-200 transition-colors">
          Make an intro to...
        </button>
      </div>

      {/* Body Editor */}
      <div className="flex-1 px-6 py-4 overflow-y-auto relative" style={{ minHeight: '200px' }}>
        {/* Placeholder with blinking cursor at the beginning */}
        {!hasBodyContent && (
          <div className="absolute inset-0 px-6 py-4 pointer-events-none flex items-start">
            <span
              className="w-[2px] h-4 bg-blue-500"
              style={{ animation: 'blink 1s step-end infinite' }}
            />
            <span className="text-sm text-gray-300 ml-1">Enter text</span>
          </div>
        )}
        <div
          ref={bodyRef}
          contentEditable
          onInput={handleBodyChange}
          onMouseUp={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          className="w-full h-full text-sm text-gray-900 outline-none"
        />

      </div>

      {/* Footer with attachment & delete */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <button
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('bold')}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('italic')}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <Link className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => closeCompose(compose.id)}
          className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-gray-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Formatting Toolbar - fixed position above selection */}
      {showToolbar && (
        <div
          ref={toolbarRef}
          className="fixed z-[100] flex items-center gap-0.5 px-2 py-1.5 rounded-lg bg-gray-900 shadow-2xl"
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
            transform: 'translateX(-50%)',
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button onClick={() => execCommand('bold')} className="w-7 h-7 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10" title="Bold">
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => execCommand('italic')} className="w-7 h-7 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10" title="Italic">
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => execCommand('underline')} className="w-7 h-7 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10" title="Underline">
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => execCommand('strikeThrough')} className="w-7 h-7 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10" title="Strikethrough">
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <button onClick={() => execCommand('createLink', prompt('Enter URL:') || '')} className="w-7 h-7 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10" title="Link">
            <Link className="w-3.5 h-3.5" />
          </button>
          <button className="w-7 h-7 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10" title="Text Color">
            <Palette className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <button onClick={() => execCommand('insertUnorderedList')} className="w-7 h-7 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10" title="Bullet List">
            <List className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => execCommand('insertOrderedList')} className="w-7 h-7 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10" title="Numbered List">
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => execCommand('formatBlock', 'blockquote')} className="w-7 h-7 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10" title="Quote">
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => execCommand('outdent')} className="w-7 h-7 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10" title="Decrease Indent">
            <IndentDecrease className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => execCommand('indent')} className="w-7 h-7 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10" title="Increase Indent">
            <IndentIncrease className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <button onClick={() => execCommand('formatBlock', 'h1')} className="w-7 h-7 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10" title="Heading">
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button className="h-7 px-1.5 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 text-xs" title="Font">
            <Type className="w-3.5 h-3.5 mr-0.5" />
          </button>
          <button onClick={() => execCommand('removeFormat')} className="w-7 h-7 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10" title="Clear Formatting">
            <span className="text-xs font-medium">T<sub>x</sub></span>
          </button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <button className="w-7 h-7 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10" title="Insert Image">
            <Image className="w-3.5 h-3.5" />
          </button>
          <button className="w-7 h-7 rounded flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10" title="Insert Table">
            <Table className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <button className="h-7 px-2 rounded flex items-center justify-center text-blue-400 hover:text-blue-300 hover:bg-white/10 text-xs font-medium" title="AI Assist">
            +ai
          </button>
        </div>
      )}
    </motion.div>
  );
}
