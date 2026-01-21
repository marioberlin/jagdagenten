/**
 * useSnoozeWatcher - Manages snooze wake notifications
 *
 * Monitors snoozed threads and:
 * - Wakes threads when their snooze time expires
 * - Shows desktop notifications for woken threads
 * - Cleans up expired snooze entries
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSparklesStore } from '@/stores/sparklesStore';

// How often to check for expired snoozes (1 minute)
const CHECK_INTERVAL_MS = 60 * 1000;

// Maximum time to schedule a setTimeout (to avoid overflow)
const MAX_TIMEOUT_MS = 2147483647; // ~24.8 days

export function useSnoozeWatcher() {
    const {
        snoozedThreads,
        threads,
        threadCache,
        removeSnoozedThread,
        settings,
    } = useSparklesStore();

    const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Show notification for a woken thread
    const showWakeNotification = useCallback(
        (threadId: string) => {
            const thread = threadCache[threadId] || threads.find((t) => t.id === threadId);
            if (!thread) return;

            // Check if notifications are enabled
            if (!settings.desktopNotifications) return;

            // Request permission if needed
            if (Notification.permission === 'default') {
                Notification.requestPermission();
                return;
            }

            if (Notification.permission === 'granted') {
                const notification = new Notification('Sparkles Mail - Snoozed Email', {
                    body: `"${thread.subject}" is back in your inbox`,
                    icon: '/sparkles-icon.png',
                    tag: `snooze-wake-${threadId}`,
                    requireInteraction: false,
                });

                notification.onclick = () => {
                    // Focus the window and select the thread
                    window.focus();
                    useSparklesStore.getState().selectThread(threadId);
                };
            }
        },
        [threadCache, threads, settings.desktopNotifications]
    );

    // Process a single woken thread
    const processWokenThread = useCallback(
        (threadId: string) => {
            // Remove from snoozed list
            removeSnoozedThread(threadId);

            // Clear any scheduled timer
            const timer = timersRef.current.get(threadId);
            if (timer) {
                clearTimeout(timer);
                timersRef.current.delete(threadId);
            }

            // Show notification
            showWakeNotification(threadId);

            // In a real implementation, we would also:
            // - Move the thread back to INBOX via API
            // - Update the thread's labels in the store
            console.log(`[Snooze] Thread ${threadId} woke up`);
        },
        [removeSnoozedThread, showWakeNotification]
    );

    // Check for expired snoozes
    const checkExpiredSnoozes = useCallback(() => {
        const now = Date.now();

        snoozedThreads.forEach((snooze) => {
            if (snooze.wakeAt <= now) {
                processWokenThread(snooze.threadId);
            }
        });
    }, [snoozedThreads, processWokenThread]);

    // Schedule a timer for a specific snooze
    const scheduleSnoozeTimer = useCallback(
        (threadId: string, wakeAt: number) => {
            // Clear existing timer if any
            const existingTimer = timersRef.current.get(threadId);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }

            const delay = wakeAt - Date.now();

            // If already expired, process immediately
            if (delay <= 0) {
                processWokenThread(threadId);
                return;
            }

            // If too far in the future, don't schedule (will be caught by interval check)
            if (delay > MAX_TIMEOUT_MS) {
                return;
            }

            // Schedule the wake
            const timer = setTimeout(() => {
                processWokenThread(threadId);
            }, delay);

            timersRef.current.set(threadId, timer);
        },
        [processWokenThread]
    );

    // Set up timers for all snoozed threads
    useEffect(() => {
        // Check for immediately expired snoozes on mount
        checkExpiredSnoozes();

        // Schedule timers for non-expired snoozes
        snoozedThreads.forEach((snooze) => {
            if (snooze.wakeAt > Date.now()) {
                scheduleSnoozeTimer(snooze.threadId, snooze.wakeAt);
            }
        });

        // Set up periodic check for any missed wakes
        intervalRef.current = setInterval(checkExpiredSnoozes, CHECK_INTERVAL_MS);

        return () => {
            // Cleanup all timers
            timersRef.current.forEach((timer) => clearTimeout(timer));
            timersRef.current.clear();

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [snoozedThreads, checkExpiredSnoozes, scheduleSnoozeTimer]);

    // Return stats for debugging/display
    return {
        snoozedCount: snoozedThreads.length,
        nextWakeAt: snoozedThreads.length > 0
            ? Math.min(...snoozedThreads.map((s) => s.wakeAt))
            : null,
    };
}

export default useSnoozeWatcher;
