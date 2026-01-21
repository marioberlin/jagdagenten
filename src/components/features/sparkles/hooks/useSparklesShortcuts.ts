/**
 * useSparklesShortcuts - Registers keyboard shortcuts for Sparkles email client
 */

import { useEffect, useCallback } from 'react';
import { useSparklesStore } from '@/stores/sparklesStore';

export function useSparklesShortcuts() {
  const {
    selectedThread,
    ui,
    openCompose,
    selectThread,
    updateThread,
    openModal,
    toggleSidebar,
    setActiveFolder,
  } = useSparklesStore();

  // Navigate to next/previous thread
  const navigateThreads = useCallback(
    (direction: 'next' | 'prev') => {
      const state = useSparklesStore.getState();
      const threads = state.threads;
      if (threads.length === 0) return;

      const currentIndex = selectedThread
        ? threads.findIndex((t) => t.id === selectedThread.id)
        : -1;

      let newIndex: number;
      if (direction === 'next') {
        newIndex = currentIndex < threads.length - 1 ? currentIndex + 1 : 0;
      } else {
        newIndex = currentIndex > 0 ? currentIndex - 1 : threads.length - 1;
      }

      selectThread(threads[newIndex].id);
    },
    [selectedThread, selectThread]
  );

  // Archive current thread
  const archiveThread = useCallback(() => {
    if (!selectedThread) return;
    updateThread(selectedThread.id, {
      labelIds: selectedThread.labelIds.filter((l) => l !== 'INBOX'),
    });
    navigateThreads('next');
  }, [selectedThread, updateThread, navigateThreads]);

  // Delete current thread
  const deleteThread = useCallback(() => {
    if (!selectedThread) return;
    updateThread(selectedThread.id, {
      labelIds: [...selectedThread.labelIds, 'TRASH'],
    });
    navigateThreads('next');
  }, [selectedThread, updateThread, navigateThreads]);

  // Toggle star on current thread
  const toggleStar = useCallback(() => {
    if (!selectedThread) return;
    updateThread(selectedThread.id, { isStarred: !selectedThread.isStarred });
  }, [selectedThread, updateThread]);

  // Mark thread as read/unread
  const toggleRead = useCallback(() => {
    if (!selectedThread) return;
    updateThread(selectedThread.id, { isUnread: !selectedThread.isUnread });
  }, [selectedThread, updateThread]);

  // Reply to thread
  const reply = useCallback(() => {
    if (!selectedThread) return;
    openCompose('reply', { threadId: selectedThread.id });
  }, [selectedThread, openCompose]);

  // Reply all
  const replyAll = useCallback(() => {
    if (!selectedThread) return;
    openCompose('replyAll', { threadId: selectedThread.id });
  }, [selectedThread, openCompose]);

  // Forward thread
  const forward = useCallback(() => {
    if (!selectedThread) return;
    openCompose('forward', { threadId: selectedThread.id });
  }, [selectedThread, openCompose]);

  // New message
  const newMessage = useCallback(() => {
    openCompose('new');
  }, [openCompose]);

  // Snooze thread
  const snooze = useCallback(() => {
    if (!selectedThread) return;
    openModal({ type: 'snooze', threadId: selectedThread.id });
  }, [selectedThread, openModal]);

  // Main keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if in modal or compose
      if (ui.activeModal || ui.composeWindows.length > 0) return;

      // Don't handle shortcuts if typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMeta = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      // Navigation shortcuts (without modifiers)
      if (!isMeta && !e.altKey) {
        switch (e.key) {
          case 'j':
          case 'ArrowDown':
            e.preventDefault();
            navigateThreads('next');
            return;
          case 'k':
          case 'ArrowUp':
            e.preventDefault();
            navigateThreads('prev');
            return;
          case 'o':
          case 'Enter':
            // Open thread (already selected, could open in expanded view)
            return;
          case 'u':
            // Go back to inbox
            e.preventDefault();
            selectThread(null);
            return;
          case 'x':
            // Select/deselect thread
            if (selectedThread) {
              e.preventDefault();
              useSparklesStore.getState().toggleThreadSelection(selectedThread.id);
            }
            return;
          case 's':
            if (!isMeta) {
              e.preventDefault();
              toggleStar();
            }
            return;
          case 'e':
            if (!isMeta) {
              e.preventDefault();
              archiveThread();
            }
            return;
          case '#':
            e.preventDefault();
            deleteThread();
            return;
          case 'r':
            if (!isMeta) {
              e.preventDefault();
              reply();
            }
            return;
          case 'a':
            if (!isMeta) {
              e.preventDefault();
              replyAll();
            }
            return;
          case 'f':
            if (!isMeta) {
              e.preventDefault();
              forward();
            }
            return;
          case 'c':
            if (!isMeta) {
              e.preventDefault();
              newMessage();
            }
            return;
          case 'b':
            if (!isMeta) {
              e.preventDefault();
              snooze();
            }
            return;
        }
      }

      // Meta key shortcuts
      if (isMeta) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            newMessage();
            return;
          case 'r':
            e.preventDefault();
            if (isShift) {
              replyAll();
            } else {
              reply();
            }
            return;
          case 'j':
            e.preventDefault();
            forward();
            return;
          case 'e':
            e.preventDefault();
            archiveThread();
            return;
          case 's':
            e.preventDefault();
            toggleStar();
            return;
          case 'b':
            e.preventDefault();
            snooze();
            return;
          case 'm':
            // Mute thread
            if (selectedThread) {
              e.preventDefault();
              updateThread(selectedThread.id, { isMuted: true });
            }
            return;
          case 'u':
            // Mark as unread
            e.preventDefault();
            toggleRead();
            return;
          case ',':
            // Open settings
            e.preventDefault();
            openModal({ type: 'settings' });
            return;
          case 'k':
            // Command center
            e.preventDefault();
            // TODO: Open command palette
            return;
          case '/':
            // Focus search
            e.preventDefault();
            useSparklesStore.getState().setSearchFocused(true);
            return;
        }

        // Folder navigation with Cmd+number
        if (e.key >= '1' && e.key <= '6') {
          e.preventDefault();
          const folders = ['SMART_INBOX', 'INBOX', 'STARRED', 'SENT', 'DRAFT', 'TRASH'] as const;
          const index = parseInt(e.key) - 1;
          if (index < folders.length) {
            setActiveFolder(folders[index]);
          }
          return;
        }
      }

      // Backspace to delete
      if (e.key === 'Backspace' && !isMeta) {
        e.preventDefault();
        deleteThread();
        return;
      }

      // Toggle sidebar with [
      if (e.key === '[' && !isMeta) {
        e.preventDefault();
        toggleSidebar();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    ui.activeModal,
    ui.composeWindows.length,
    selectedThread,
    navigateThreads,
    selectThread,
    archiveThread,
    deleteThread,
    toggleStar,
    toggleRead,
    reply,
    replyAll,
    forward,
    newMessage,
    snooze,
    updateThread,
    openModal,
    toggleSidebar,
    setActiveFolder,
  ]);
}

export default useSparklesShortcuts;
