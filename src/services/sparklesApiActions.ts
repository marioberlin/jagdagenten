/**
 * Sparkles API Actions
 *
 * Async actions that bridge the sparklesApi client with the Zustand store.
 * These are standalone functions that can be imported and used in components.
 */

import { useSparklesStore } from '@/stores/sparklesStore';
import {
    threadsApi,
    messagesApi,
    profileApi,
    transformBackendThread,
    transformBackendLabel,
} from '@/services/sparklesApi';
import type { ComposeState, EmailThread } from '@/types/sparkles';

// =============================================================================
// Thread Actions
// =============================================================================

/**
 * Fetch threads from backend and update store
 */
export async function fetchThreads(options?: {
    labelIds?: string[];
    query?: string;
    maxResults?: number;
    pageToken?: string;
}): Promise<void> {
    const { setLoadingThreads, setThreads, addThreads, accounts, activeAccountId } =
        useSparklesStore.getState();

    const accountId = activeAccountId || accounts[0]?.id;
    if (!accountId) {
        console.warn('No account selected');
        return;
    }

    setLoadingThreads(true);

    try {
        const response = await threadsApi.list(options);
        const threads = response.threads.map((t) => transformBackendThread(t, accountId));

        if (options?.pageToken) {
            addThreads(threads);
        } else {
            setThreads(threads);
        }
    } catch (error) {
        console.error('Failed to fetch threads:', error);
        throw error;
    } finally {
        setLoadingThreads(false);
    }
}

/**
 * Fetch a single thread and cache it
 */
export async function fetchThread(threadId: string): Promise<EmailThread> {
    const { cacheThread, accounts, activeAccountId } = useSparklesStore.getState();

    const accountId = activeAccountId || accounts[0]?.id;
    if (!accountId) {
        throw new Error('No account selected');
    }

    const response = await threadsApi.get(threadId);
    const thread = transformBackendThread(response, accountId);
    cacheThread(thread);
    return thread;
}

/**
 * Mark thread as read
 */
export async function markAsRead(threadId: string): Promise<void> {
    const { updateThread } = useSparklesStore.getState();

    // Optimistic update
    updateThread(threadId, { isUnread: false });

    try {
        await threadsApi.markAsRead(threadId);
    } catch (error) {
        // Revert on failure
        updateThread(threadId, { isUnread: true });
        throw error;
    }
}

/**
 * Mark thread as unread
 */
export async function markAsUnread(threadId: string): Promise<void> {
    const { updateThread } = useSparklesStore.getState();

    // Optimistic update
    updateThread(threadId, { isUnread: true });

    try {
        await threadsApi.markAsUnread(threadId);
    } catch (error) {
        // Revert on failure
        updateThread(threadId, { isUnread: false });
        throw error;
    }
}

/**
 * Archive thread
 */
export async function archiveThread(threadId: string): Promise<void> {
    const { threads, removeThread, selectThread, settings, ui } = useSparklesStore.getState();

    // Find next thread for selection
    const currentIndex = threads.findIndex((t) => t.id === threadId);
    const nextThread =
        settings.afterArchiveDelete === 'next'
            ? threads[currentIndex + 1]
            : threads[currentIndex - 1];

    // Optimistic removal
    removeThread(threadId);

    // Select next thread
    if (ui.selectedThreadId === threadId && nextThread) {
        selectThread(nextThread.id);
    }

    try {
        await threadsApi.archive(threadId);
    } catch (error) {
        // Re-fetch threads on failure
        await fetchThreads();
        throw error;
    }
}

/**
 * Delete/trash thread
 */
export async function trashThread(threadId: string): Promise<void> {
    const { threads, removeThread, selectThread, settings, ui } = useSparklesStore.getState();

    // Find next thread for selection
    const currentIndex = threads.findIndex((t) => t.id === threadId);
    const nextThread =
        settings.afterArchiveDelete === 'next'
            ? threads[currentIndex + 1]
            : threads[currentIndex - 1];

    // Optimistic removal
    removeThread(threadId);

    // Select next thread
    if (ui.selectedThreadId === threadId && nextThread) {
        selectThread(nextThread.id);
    }

    try {
        await threadsApi.trash(threadId);
    } catch (error) {
        // Re-fetch threads on failure
        await fetchThreads();
        throw error;
    }
}

/**
 * Star thread
 */
export async function starThread(threadId: string): Promise<void> {
    const { updateThread } = useSparklesStore.getState();

    // Optimistic update
    updateThread(threadId, { isStarred: true });

    try {
        await threadsApi.star(threadId);
    } catch (error) {
        // Revert on failure
        updateThread(threadId, { isStarred: false });
        throw error;
    }
}

/**
 * Unstar thread
 */
export async function unstarThread(threadId: string): Promise<void> {
    const { updateThread } = useSparklesStore.getState();

    // Optimistic update
    updateThread(threadId, { isStarred: false });

    try {
        await threadsApi.unstar(threadId);
    } catch (error) {
        // Revert on failure
        updateThread(threadId, { isStarred: true });
        throw error;
    }
}

/**
 * Toggle thread star
 */
export async function toggleStar(threadId: string): Promise<void> {
    const { threads, threadCache } = useSparklesStore.getState();
    const thread = threadCache[threadId] || threads.find((t) => t.id === threadId);

    if (!thread) return;

    if (thread.isStarred) {
        await unstarThread(threadId);
    } else {
        await starThread(threadId);
    }
}

// =============================================================================
// Message Actions
// =============================================================================

/**
 * Send email
 */
export async function sendEmail(compose: ComposeState): Promise<string> {
    const { setSending, closeCompose } = useSparklesStore.getState();

    setSending(true);

    try {
        const result = await messagesApi.send({
            to: compose.to.map(email => ({ email })),
            cc: compose.cc?.map(email => ({ email })),
            bcc: compose.bcc?.map(email => ({ email })),
            subject: compose.subject,
            body: compose.bodyHtml || compose.bodyText,
            isHtml: !!compose.bodyHtml,
            threadId: compose.threadId,
            inReplyTo: compose.replyToMessageId,
        });

        closeCompose(compose.id);
        return result.messageId;
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    } finally {
        setSending(false);
    }
}

/**
 * Save draft
 */
export async function saveDraft(compose: ComposeState): Promise<string> {
    const result = await messagesApi.createDraft({
        to: compose.to.map(email => ({ email })),
        cc: compose.cc?.map(email => ({ email })),
        bcc: compose.bcc?.map(email => ({ email })),
        subject: compose.subject,
        body: compose.bodyHtml || compose.bodyText,
        isHtml: !!compose.bodyHtml,
        threadId: compose.threadId,
        inReplyTo: compose.replyToMessageId,
    });

    return result.draftId;
}

/**
 * Download attachment
 */
export async function downloadAttachment(
    messageId: string,
    attachmentId: string,
    filename: string
): Promise<void> {
    const result = await messagesApi.getAttachment(messageId, attachmentId);

    // Convert base64 to blob and download
    const byteCharacters = atob(result.data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray]);

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// =============================================================================
// Label Actions
// =============================================================================

/**
 * Fetch labels from backend
 */
export async function fetchLabels(accountId: string): Promise<void> {
    const { setLabels } = useSparklesStore.getState();

    const labels = await profileApi.listLabels();
    setLabels(accountId, labels.map((l) => transformBackendLabel(l, accountId)));
}

/**
 * Apply label to thread
 */
export async function applyLabel(threadId: string, labelId: string): Promise<void> {
    await threadsApi.modify(threadId, { addLabelIds: [labelId] });
    // Refresh thread
    await fetchThread(threadId);
}

/**
 * Remove label from thread
 */
export async function removeLabel(threadId: string, labelId: string): Promise<void> {
    await threadsApi.modify(threadId, { removeLabelIds: [labelId] });
    // Refresh thread
    await fetchThread(threadId);
}

// =============================================================================
// Bulk Actions
// =============================================================================

/**
 * Batch archive threads
 */
export async function batchArchive(threadIds: string[]): Promise<void> {
    const { removeThread, deselectAllThreads } = useSparklesStore.getState();

    // Optimistic removal
    threadIds.forEach((id) => removeThread(id));
    deselectAllThreads();

    try {
        // Get all message IDs from threads
        const { threads, threadCache } = useSparklesStore.getState();
        const messageIds: string[] = [];

        for (const threadId of threadIds) {
            const thread = threadCache[threadId] || threads.find((t) => t.id === threadId);
            if (thread) {
                messageIds.push(...thread.messages.map((m) => m.id));
            }
        }

        if (messageIds.length > 0) {
            await messagesApi.batchModify(messageIds, { removeLabelIds: ['INBOX'] });
        }
    } catch (error) {
        // Re-fetch on failure
        await fetchThreads();
        throw error;
    }
}

/**
 * Batch delete threads
 */
export async function batchDelete(threadIds: string[]): Promise<void> {
    const { removeThread, deselectAllThreads } = useSparklesStore.getState();

    // Optimistic removal
    threadIds.forEach((id) => removeThread(id));
    deselectAllThreads();

    try {
        for (const threadId of threadIds) {
            await threadsApi.trash(threadId);
        }
    } catch (error) {
        // Re-fetch on failure
        await fetchThreads();
        throw error;
    }
}

/**
 * Batch mark as read
 */
export async function batchMarkAsRead(threadIds: string[]): Promise<void> {
    const { updateThread, deselectAllThreads } = useSparklesStore.getState();

    // Optimistic update
    threadIds.forEach((id) => updateThread(id, { isUnread: false }));
    deselectAllThreads();

    try {
        const { threads, threadCache } = useSparklesStore.getState();
        const messageIds: string[] = [];

        for (const threadId of threadIds) {
            const thread = threadCache[threadId] || threads.find((t) => t.id === threadId);
            if (thread) {
                messageIds.push(...thread.messages.map((m) => m.id));
            }
        }

        if (messageIds.length > 0) {
            await messagesApi.batchModify(messageIds, { removeLabelIds: ['UNREAD'] });
        }
    } catch (error) {
        // Re-fetch on failure
        await fetchThreads();
        throw error;
    }
}

// =============================================================================
// Sync Actions
// =============================================================================

/**
 * Initial sync - fetch threads and labels
 */
export async function initialSync(accountId: string): Promise<void> {
    const { setSyncStatus } = useSparklesStore.getState();

    setSyncStatus(accountId, {
        accountId,
        status: 'syncing',
    });

    try {
        // Fetch labels first
        await fetchLabels(accountId);

        // Fetch threads
        await fetchThreads({ labelIds: ['INBOX'], maxResults: 50 });

        setSyncStatus(accountId, {
            accountId,
            status: 'idle',
            lastSyncAt: Date.now(),
        });
    } catch (error) {
        setSyncStatus(accountId, {
            accountId,
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Sync failed',
        });
        throw error;
    }
}

// =============================================================================
// Export all actions
// =============================================================================

export const sparklesActions = {
    // Threads
    fetchThreads,
    fetchThread,
    markAsRead,
    markAsUnread,
    archiveThread,
    trashThread,
    starThread,
    unstarThread,
    toggleStar,
    // Messages
    sendEmail,
    saveDraft,
    downloadAttachment,
    // Labels
    fetchLabels,
    applyLabel,
    removeLabel,
    // Bulk
    batchArchive,
    batchDelete,
    batchMarkAsRead,
    // Sync
    initialSync,
};

export default sparklesActions;
