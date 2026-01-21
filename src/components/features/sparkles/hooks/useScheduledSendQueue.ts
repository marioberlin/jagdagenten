/**
 * useScheduledSendQueue - Manages scheduled email sending
 *
 * Monitors scheduled emails and:
 * - Sends emails when their scheduled time arrives
 * - Updates status in the store
 * - Shows notifications on success/failure
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSparklesStore } from '@/stores/sparklesStore';
import { messagesApi } from '@/services/sparklesApi';

// How often to check for emails to send (30 seconds)
const CHECK_INTERVAL_MS = 30 * 1000;

// Maximum time to schedule a setTimeout
const MAX_TIMEOUT_MS = 2147483647;

export function useScheduledSendQueue() {
    const {
        scheduledEmails,
        updateScheduledEmail,
        removeScheduledEmail,
        settings,
    } = useSparklesStore();

    const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Send a scheduled email
    const sendScheduledEmail = useCallback(
        async (emailId: string) => {
            const email = useSparklesStore.getState().scheduledEmails.find((e) => e.id === emailId);
            if (!email || email.status !== 'pending') return;

            // Update status to sending
            updateScheduledEmail(emailId, { status: 'sending' });

            try {
                // Send the email via API
                await messagesApi.send({
                    to: email.to.map((addr) => ({ email: addr })),
                    cc: email.cc?.map((addr) => ({ email: addr })),
                    bcc: email.bcc?.map((addr) => ({ email: addr })),
                    subject: email.subject,
                    body: email.bodyHtml || email.bodyText,
                    isHtml: !!email.bodyHtml,
                    threadId: email.threadId,
                    inReplyTo: email.inReplyTo,
                });

                // Update status to sent
                updateScheduledEmail(emailId, { status: 'sent' });

                // Remove from queue after a delay
                setTimeout(() => {
                    removeScheduledEmail(emailId);
                }, 5000);

                // Show notification
                if (settings.desktopNotifications && Notification.permission === 'granted') {
                    new Notification('Sparkles Mail', {
                        body: `Scheduled email "${email.subject}" has been sent`,
                        icon: '/sparkles-icon.png',
                    });
                }

                console.log(`[ScheduledSend] Email ${emailId} sent successfully`);
            } catch (error) {
                console.error(`[ScheduledSend] Failed to send email ${emailId}:`, error);

                updateScheduledEmail(emailId, {
                    status: 'failed',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                });

                // Show error notification
                if (settings.desktopNotifications && Notification.permission === 'granted') {
                    new Notification('Sparkles Mail - Send Failed', {
                        body: `Failed to send "${email.subject}"`,
                        icon: '/sparkles-icon.png',
                    });
                }
            }
        },
        [updateScheduledEmail, removeScheduledEmail, settings.desktopNotifications]
    );

    // Check for emails that should be sent now
    const checkScheduledEmails = useCallback(() => {
        const now = Date.now();
        const pendingEmails = useSparklesStore.getState().scheduledEmails.filter(
            (e) => e.status === 'pending' && e.scheduledFor <= now
        );

        pendingEmails.forEach((email) => {
            sendScheduledEmail(email.id);
        });
    }, [sendScheduledEmail]);

    // Schedule a timer for a specific email
    const scheduleEmailTimer = useCallback(
        (emailId: string, scheduledFor: number) => {
            // Clear existing timer if any
            const existingTimer = timersRef.current.get(emailId);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }

            const delay = scheduledFor - Date.now();

            // If already due, send immediately
            if (delay <= 0) {
                sendScheduledEmail(emailId);
                return;
            }

            // If too far in the future, don't schedule (will be caught by interval check)
            if (delay > MAX_TIMEOUT_MS) {
                return;
            }

            // Schedule the send
            const timer = setTimeout(() => {
                sendScheduledEmail(emailId);
            }, delay);

            timersRef.current.set(emailId, timer);
        },
        [sendScheduledEmail]
    );

    // Set up timers for all scheduled emails
    useEffect(() => {
        // Check for immediately due emails on mount
        checkScheduledEmails();

        // Schedule timers for pending emails
        scheduledEmails
            .filter((e) => e.status === 'pending')
            .forEach((email) => {
                scheduleEmailTimer(email.id, email.scheduledFor);
            });

        // Set up periodic check for any missed sends
        intervalRef.current = setInterval(checkScheduledEmails, CHECK_INTERVAL_MS);

        return () => {
            // Cleanup all timers
            timersRef.current.forEach((timer) => clearTimeout(timer));
            timersRef.current.clear();

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [scheduledEmails, checkScheduledEmails, scheduleEmailTimer]);

    // Return stats for debugging/display
    const pendingCount = scheduledEmails.filter((e) => e.status === 'pending').length;
    const nextSendAt = pendingCount > 0
        ? Math.min(
            ...scheduledEmails
                .filter((e) => e.status === 'pending')
                .map((e) => e.scheduledFor)
        )
        : null;

    return {
        pendingCount,
        nextSendAt,
        scheduledEmails,
    };
}

export default useScheduledSendQueue;
