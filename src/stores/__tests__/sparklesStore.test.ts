/**
 * Integration Tests for sparklesStore.ts
 *
 * Tests:
 * - Thread CRUD operations
 * - Account management
 * - UI state transitions
 * - Gatekeeper actions
 * - Snooze/scheduled email management
 * - Selectors
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSparklesStore } from '../sparklesStore';
import { act } from '@testing-library/react';
import type { EmailThread, GmailAccount, PendingSender, SnoozedThread, ScheduledEmail } from '@/types/sparkles';

// Helper to create a mock thread
function createMockThread(overrides: Partial<EmailThread> = {}): EmailThread {
    return {
        id: `thread-${Date.now()}-${Math.random()}`,
        accountId: 'account-1',
        historyId: 'history-1',
        snippet: 'Test snippet',
        subject: 'Test Subject',
        participants: [{ email: 'sender@example.com', name: 'Sender' }],
        messages: [],
        labelIds: ['INBOX', 'UNREAD'],
        isUnread: true,
        isStarred: false,
        isImportant: false,
        isPriority: false,
        category: 'primary',
        lastMessageAt: Date.now(),
        messageCount: 1,
        hasAttachments: false,
        isMuted: false,
        ...overrides,
    };
}

// Helper to create a mock account
function createMockAccount(overrides: Partial<GmailAccount> = {}): GmailAccount {
    return {
        id: `account-${Date.now()}`,
        email: 'test@gmail.com',
        name: 'Test User',
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: Date.now() + 3600000,
        isEnabled: true,
        syncMode: 'inbox',
        color: '#4285f4',
        ...overrides,
    };
}

describe('sparklesStore', () => {
    beforeEach(() => {
        // Clear store state before each test by setting empty arrays
        act(() => {
            const store = useSparklesStore.getState();
            store.setThreads([]);
            // Clear accounts by removing each one
            store.accounts.forEach(acc => store.removeAccount(acc.id));
            store.setPendingSenders([]);
        });
    });

    // ==========================================================================
    // Account Management Tests
    // ==========================================================================

    describe('Account Management', () => {
        it('should add an account', () => {
            const account = createMockAccount({ id: 'acc-1', email: 'user1@gmail.com' });

            act(() => {
                useSparklesStore.getState().addAccount(account);
            });

            const state = useSparklesStore.getState();
            expect(state.accounts).toHaveLength(1);
            expect(state.accounts[0].email).toBe('user1@gmail.com');
        });

        it('should update an account', () => {
            const account = createMockAccount({ id: 'acc-2' });

            act(() => {
                useSparklesStore.getState().addAccount(account);
                useSparklesStore.getState().updateAccount('acc-2', { name: 'Updated Name' });
            });

            const state = useSparklesStore.getState();
            expect(state.accounts[0].name).toBe('Updated Name');
        });

        it('should remove an account', () => {
            const account = createMockAccount({ id: 'acc-3' });

            act(() => {
                useSparklesStore.getState().addAccount(account);
                useSparklesStore.getState().removeAccount('acc-3');
            });

            const state = useSparklesStore.getState();
            expect(state.accounts).toHaveLength(0);
        });

        it('should set active account', () => {
            const account1 = createMockAccount({ id: 'acc-a' });
            const account2 = createMockAccount({ id: 'acc-b' });

            act(() => {
                useSparklesStore.getState().addAccount(account1);
                useSparklesStore.getState().addAccount(account2);
                useSparklesStore.getState().setActiveAccount('acc-b');
            });

            const state = useSparklesStore.getState();
            expect(state.activeAccountId).toBe('acc-b');
        });
    });

    // ==========================================================================
    // Thread Management Tests
    // ==========================================================================

    describe('Thread Management', () => {
        it('should set threads', () => {
            const threads = [
                createMockThread({ id: 'thread-1' }),
                createMockThread({ id: 'thread-2' }),
            ];

            act(() => {
                useSparklesStore.getState().setThreads(threads);
            });

            const state = useSparklesStore.getState();
            expect(state.threads).toHaveLength(2);
        });

        it('should update a thread', () => {
            const thread = createMockThread({ id: 'thread-update', isStarred: false });

            act(() => {
                useSparklesStore.getState().setThreads([thread]);
                useSparklesStore.getState().updateThread('thread-update', { isStarred: true });
            });

            const state = useSparklesStore.getState();
            expect(state.threads[0].isStarred).toBe(true);
        });

        it('should add thread to cache', () => {
            const thread = createMockThread({ id: 'cached-thread' });

            act(() => {
                useSparklesStore.getState().cacheThread(thread);
            });

            const state = useSparklesStore.getState();
            expect(state.threadCache['cached-thread']).toBeDefined();
            expect(state.threadCache['cached-thread'].subject).toBe('Test Subject');
        });

        it('should select and deselect threads', () => {
            act(() => {
                useSparklesStore.getState().selectThread('selected-thread-id');
            });

            expect(useSparklesStore.getState().ui.selectedThreadId).toBe('selected-thread-id');

            act(() => {
                useSparklesStore.getState().selectThread(null);
            });

            expect(useSparklesStore.getState().ui.selectedThreadId).toBeNull();
        });
    });

    // ==========================================================================
    // Gatekeeper Tests
    // ==========================================================================

    describe('Gatekeeper Actions', () => {
        it('should accept a sender', () => {
            const sender: PendingSender = {
                email: 'pending@example.com',
                name: 'Pending Sender',
                domain: 'example.com',
                firstSeenAt: Date.now(),
                lastSeenAt: Date.now(),
                messageCount: 1,
                previewSubjects: [],
                previewSnippets: [],
                isNewsletter: false,
                isNotification: false,
                riskScore: 0,
            };

            act(() => {
                useSparklesStore.getState().setPendingSenders([sender]);
                useSparklesStore.getState().acceptSender('pending@example.com');
            });

            const state = useSparklesStore.getState();
            expect(state.pendingSenders).toHaveLength(0);
            expect(state.allowedSenders).toContain('pending@example.com');
        });

        it('should block a sender', () => {
            const sender: PendingSender = {
                email: 'spam@example.com',
                name: 'Spammer',
                domain: 'example.com',
                firstSeenAt: Date.now(),
                lastSeenAt: Date.now(),
                messageCount: 5,
                previewSubjects: [],
                previewSnippets: [],
                isNewsletter: true,
                isNotification: false,
                riskScore: 80,
            };

            act(() => {
                useSparklesStore.getState().setPendingSenders([sender]);
                useSparklesStore.getState().blockSender('spam@example.com');
            });

            const state = useSparklesStore.getState();
            expect(state.pendingSenders).toHaveLength(0);
            expect(state.blockedSenders).toContain('spam@example.com');
        });

        it('should add and remove priority senders', () => {
            act(() => {
                useSparklesStore.getState().addPrioritySender('vip@example.com');
            });

            expect(useSparklesStore.getState().prioritySenders).toContain('vip@example.com');

            act(() => {
                useSparklesStore.getState().removePrioritySender('vip@example.com');
            });

            expect(useSparklesStore.getState().prioritySenders).not.toContain('vip@example.com');
        });
    });

    // ==========================================================================
    // Snooze Tests
    // ==========================================================================

    describe('Snooze Actions', () => {
        it('should add a snoozed thread', () => {
            const snooze: SnoozedThread = {
                threadId: 'snooze-thread-1',
                accountId: 'account-1',
                snoozedAt: Date.now(),
                wakeAt: Date.now() + 3600000,
                originalLabelIds: ['INBOX'],
            };

            act(() => {
                useSparklesStore.getState().addSnoozedThread(snooze);
            });

            const state = useSparklesStore.getState();
            expect(state.snoozedThreads).toHaveLength(1);
            expect(state.snoozedThreads[0].threadId).toBe('snooze-thread-1');
        });

        it('should remove a snoozed thread', () => {
            const snooze: SnoozedThread = {
                threadId: 'snooze-thread-2',
                accountId: 'account-1',
                snoozedAt: Date.now(),
                wakeAt: Date.now() + 3600000,
                originalLabelIds: ['INBOX'],
            };

            act(() => {
                useSparklesStore.getState().addSnoozedThread(snooze);
                useSparklesStore.getState().removeSnoozedThread('snooze-thread-2');
            });

            const state = useSparklesStore.getState();
            expect(state.snoozedThreads).toHaveLength(0);
        });
    });

    // ==========================================================================
    // Scheduled Email Tests
    // ==========================================================================

    describe('Scheduled Email Actions', () => {
        it('should add a scheduled email', () => {
            const email: ScheduledEmail = {
                id: 'scheduled-1',
                accountId: 'account-1',
                to: ['recipient@example.com'],
                subject: 'Scheduled Email',
                bodyHtml: '<p>Body</p>',
                bodyText: 'Body',
                attachments: [],
                scheduledFor: Date.now() + 3600000,
                createdAt: Date.now(),
                status: 'pending',
            };

            act(() => {
                useSparklesStore.getState().addScheduledEmail(email);
            });

            const state = useSparklesStore.getState();
            expect(state.scheduledEmails).toHaveLength(1);
            expect(state.scheduledEmails[0].status).toBe('pending');
        });

        it('should update a scheduled email status', () => {
            const email: ScheduledEmail = {
                id: 'scheduled-2',
                accountId: 'account-1',
                to: ['recipient@example.com'],
                subject: 'Test',
                bodyHtml: '',
                bodyText: '',
                attachments: [],
                scheduledFor: Date.now() + 3600000,
                createdAt: Date.now(),
                status: 'pending',
            };

            act(() => {
                useSparklesStore.getState().addScheduledEmail(email);
                useSparklesStore.getState().updateScheduledEmail('scheduled-2', { status: 'sent' });
            });

            const state = useSparklesStore.getState();
            expect(state.scheduledEmails[0].status).toBe('sent');
        });

        it('should cancel a scheduled email', () => {
            const email: ScheduledEmail = {
                id: 'scheduled-3',
                accountId: 'account-1',
                to: ['recipient@example.com'],
                subject: 'To Cancel',
                bodyHtml: '',
                bodyText: '',
                attachments: [],
                scheduledFor: Date.now() + 3600000,
                createdAt: Date.now(),
                status: 'pending',
            };

            act(() => {
                useSparklesStore.getState().addScheduledEmail(email);
                useSparklesStore.getState().cancelScheduledEmail('scheduled-3');
            });

            const state = useSparklesStore.getState();
            expect(state.scheduledEmails[0].status).toBe('failed');
            expect(state.scheduledEmails[0].errorMessage).toBe('Cancelled by user');
        });
    });

    // ==========================================================================
    // Label Tests
    // ==========================================================================

    describe('Label Actions', () => {
        it('should set labels for an account', () => {
            const labels = [
                { id: 'INBOX', accountId: 'acc-1', name: 'Inbox', type: 'system' as const, messageListVisibility: 'show' as const, labelListVisibility: 'labelShow' as const, unreadCount: 5, totalCount: 100, threadsUnread: 5, threadsTotal: 100 },
                { id: 'Label_1', accountId: 'acc-1', name: 'Work', type: 'user' as const, messageListVisibility: 'show' as const, labelListVisibility: 'labelShow' as const, unreadCount: 2, totalCount: 20, threadsUnread: 2, threadsTotal: 20 },
            ];

            act(() => {
                useSparklesStore.getState().setLabels('acc-1', labels);
            });

            const state = useSparklesStore.getState();
            expect(state.labels['acc-1']).toHaveLength(2);
        });

        it('should add a label to an account', () => {
            const newLabel = {
                id: 'Label_new',
                accountId: 'acc-2',
                name: 'New Label',
                type: 'user' as const,
                messageListVisibility: 'show' as const,
                labelListVisibility: 'labelShow' as const,
                unreadCount: 0,
                totalCount: 0,
                threadsUnread: 0,
                threadsTotal: 0,
            };

            act(() => {
                useSparklesStore.getState().addLabel('acc-2', newLabel);
            });

            const state = useSparklesStore.getState();
            expect(state.labels['acc-2']).toContainEqual(expect.objectContaining({ id: 'Label_new' }));
        });
    });

    // ==========================================================================
    // UI State Tests
    // ==========================================================================

    describe('UI State', () => {
        it('should set active folder', () => {
            act(() => {
                useSparklesStore.getState().setActiveFolder('SENT', 'acc-1');
            });

            const state = useSparklesStore.getState();
            expect(state.ui.activeFolder).toBe('SENT');
            expect(state.ui.activeFolderAccountId).toBe('acc-1');
        });

        it('should set view mode', () => {
            act(() => {
                useSparklesStore.getState().setViewMode('traditional');
            });

            expect(useSparklesStore.getState().ui.viewMode).toBe('traditional');
        });

        it('should open and close modals', () => {
            act(() => {
                useSparklesStore.getState().openModal({ type: 'settings' });
            });

            expect(useSparklesStore.getState().ui.activeModal).toEqual({ type: 'settings' });

            act(() => {
                useSparklesStore.getState().closeModal();
            });

            expect(useSparklesStore.getState().ui.activeModal).toBeNull();
        });
    });

    // ==========================================================================
    // Settings Tests
    // ==========================================================================

    describe('Settings', () => {
        it('should update settings', () => {
            act(() => {
                useSparklesStore.getState().updateSettings({
                    smartInboxEnabled: false,
                    syncFrequency: '5min',
                });
            });

            const state = useSparklesStore.getState();
            expect(state.settings.smartInboxEnabled).toBe(false);
            expect(state.settings.syncFrequency).toBe('5min');
        });
    });
});
