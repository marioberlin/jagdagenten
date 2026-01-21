import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type {
  GmailAccount,
  AccountSyncStatus,
  EmailThread,
  Label,
  PendingSender,
  GatekeeperDecision,
  SnoozedThread,
  ScheduledEmail,
  GoogleCalendar,
  CalendarEvent,
  PushChannel,
  SparklesSettings,
  SparklesUIState,
  ComposeState,
  FolderType,
  SparklesModal,
  GatekeeperMode,
} from '@/types/sparkles';

// =============================================================================
// Default Values
// =============================================================================

const defaultSettings: SparklesSettings = {
  defaultAccountId: null,
  showUnreadInDock: true,
  markAsReadWhenViewed: true,
  loadRemoteImages: false,
  enableKeyboardShortcuts: true,
  readingPanePosition: 'right',
  messagePreviewLines: 2,
  afterArchiveDelete: 'next',
  smartInboxEnabled: true,
  showPrimarySection: true,
  showNewslettersSection: true,
  showNotificationsSection: true,
  prioritySenderPreviewCount: 3,
  gatekeeperMode: 'inside_inbox',
  autoBlockSpam: true,
  trustContactsSenders: true,
  desktopNotifications: true,
  notificationSound: true,
  notifyOnlyPriority: false,
  syncFrequency: 'realtime',
  syncPeriodDays: 30,
  downloadAttachmentsAuto: true,
  offlineAttachments: false,
  defaultReplyBehavior: 'reply',
  sendAndArchive: true,
  undoSendDelaySeconds: 5,
  blockTrackingPixels: true,
  hideReadReceipts: false,
};

const defaultUIState: SparklesUIState = {
  activeFolder: 'SMART_INBOX',
  activeFolderAccountId: 'all',
  viewMode: 'smart',
  selectedThreadId: null,
  selectedMessageId: null,
  multiSelectThreadIds: [],
  sidebarCollapsed: false,
  sidebarWidth: 220,
  mailListWidth: 350,
  composeWindows: [],
  activeComposeId: null,
  activeModal: null,
  searchQuery: '',
  searchFocused: false,
  recentSearches: [],
  isLoadingThreads: false,
  isLoadingMessages: false,
  isSending: false,
};

// =============================================================================
// State Interface
// =============================================================================

interface SparklesState {
  // Accounts
  accounts: GmailAccount[];
  activeAccountId: string | null;
  accountSyncStatus: Record<string, AccountSyncStatus>;

  // Threads & Messages
  threads: EmailThread[];
  threadCache: Record<string, EmailThread>;
  selectedThread: EmailThread | null;

  // Labels
  labels: Record<string, Label[]>;

  // Gatekeeper
  pendingSenders: PendingSender[];
  blockedSenders: string[];
  allowedSenders: string[];
  gatekeeperDecisions: GatekeeperDecision[];

  // Priority
  prioritySenders: string[];

  // Snooze
  snoozedThreads: SnoozedThread[];

  // Scheduled
  scheduledEmails: ScheduledEmail[];

  // Calendar
  calendars: GoogleCalendar[];
  events: CalendarEvent[];
  selectedDate: string | null;

  // Push
  pushChannels: PushChannel[];

  // Settings
  settings: SparklesSettings;

  // UI State
  ui: SparklesUIState;
}

interface SparklesActions {
  // Account Actions
  addAccount: (account: GmailAccount) => void;
  removeAccount: (accountId: string) => void;
  updateAccount: (accountId: string, updates: Partial<GmailAccount>) => void;
  setActiveAccount: (accountId: string | null) => void;

  // Sync Actions
  setSyncStatus: (accountId: string, status: AccountSyncStatus) => void;

  // Thread Actions
  setThreads: (threads: EmailThread[]) => void;
  addThreads: (threads: EmailThread[]) => void;
  updateThread: (threadId: string, updates: Partial<EmailThread>) => void;
  removeThread: (threadId: string) => void;
  selectThread: (threadId: string | null) => void;
  cacheThread: (thread: EmailThread) => void;

  // Label Actions
  setLabels: (accountId: string, labels: Label[]) => void;
  addLabel: (accountId: string, label: Label) => void;

  // Gatekeeper Actions
  setPendingSenders: (senders: PendingSender[]) => void;
  acceptSender: (email: string) => void;
  blockSender: (email: string) => void;

  // Priority Actions
  addPrioritySender: (email: string) => void;
  removePrioritySender: (email: string) => void;

  // Snooze Actions
  addSnoozedThread: (snooze: SnoozedThread) => void;
  removeSnoozedThread: (threadId: string) => void;

  // Scheduled Email Actions
  addScheduledEmail: (email: ScheduledEmail) => void;
  updateScheduledEmail: (id: string, updates: Partial<ScheduledEmail>) => void;
  removeScheduledEmail: (id: string) => void;
  cancelScheduledEmail: (id: string) => void;

  // Compose Actions
  openCompose: (mode: ComposeState['mode'], options?: Partial<ComposeState>) => string;
  updateCompose: (composeId: string, updates: Partial<ComposeState>) => void;
  closeCompose: (composeId: string) => void;

  // Calendar Actions
  setCalendars: (calendars: GoogleCalendar[]) => void;
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  removeEvent: (eventId: string) => void;
  setSelectedDate: (date: string | null) => void;

  // Settings Actions
  updateSettings: (updates: Partial<SparklesSettings>) => void;

  // UI Actions
  setActiveFolder: (folder: FolderType, accountId?: string) => void;
  setViewMode: (mode: SparklesUIState['viewMode']) => void;
  toggleSidebar: () => void;
  openModal: (modal: SparklesModal) => void;
  closeModal: () => void;
  setSearchQuery: (query: string) => void;
  setSearchFocused: (focused: boolean) => void;
  addRecentSearch: (query: string) => void;
  toggleThreadSelection: (threadId: string) => void;
  selectAllThreads: () => void;
  deselectAllThreads: () => void;
  setLoadingThreads: (loading: boolean) => void;
  setLoadingMessages: (loading: boolean) => void;
  setSending: (sending: boolean) => void;

  // Reset
  reset: () => void;
}

type SparklesStore = SparklesState & SparklesActions;

// =============================================================================
// Store Implementation
// =============================================================================

export const useSparklesStore = create<SparklesStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        accounts: [],
        activeAccountId: null,
        accountSyncStatus: {},
        threads: [],
        threadCache: {},
        selectedThread: null,
        labels: {},
        pendingSenders: [],
        blockedSenders: [],
        allowedSenders: [],
        gatekeeperDecisions: [],
        prioritySenders: [],
        snoozedThreads: [],
        scheduledEmails: [],
        calendars: [],
        events: [],
        selectedDate: null,
        pushChannels: [],
        settings: defaultSettings,
        ui: defaultUIState,

        // =====================================================================
        // Account Actions
        // =====================================================================

        addAccount: (account) =>
          set((state) => ({
            accounts: [...state.accounts, account],
            activeAccountId: state.activeAccountId ?? account.id,
          })),

        removeAccount: (accountId) =>
          set((state) => ({
            accounts: state.accounts.filter((a) => a.id !== accountId),
            activeAccountId:
              state.activeAccountId === accountId
                ? state.accounts[0]?.id ?? null
                : state.activeAccountId,
            threads: state.threads.filter((t) => t.accountId !== accountId),
          })),

        updateAccount: (accountId, updates) =>
          set((state) => ({
            accounts: state.accounts.map((a) =>
              a.id === accountId ? { ...a, ...updates } : a
            ),
          })),

        setActiveAccount: (accountId) =>
          set({ activeAccountId: accountId }),

        // =====================================================================
        // Sync Actions
        // =====================================================================

        setSyncStatus: (accountId, status) =>
          set((state) => ({
            accountSyncStatus: {
              ...state.accountSyncStatus,
              [accountId]: status,
            },
          })),

        // =====================================================================
        // Thread Actions
        // =====================================================================

        setThreads: (threads) => set({ threads }),

        addThreads: (threads) =>
          set((state) => ({
            threads: [...state.threads, ...threads],
          })),

        updateThread: (threadId, updates) =>
          set((state) => ({
            threads: state.threads.map((t) =>
              t.id === threadId ? { ...t, ...updates } : t
            ),
            threadCache: state.threadCache[threadId]
              ? {
                ...state.threadCache,
                [threadId]: { ...state.threadCache[threadId], ...updates },
              }
              : state.threadCache,
            selectedThread:
              state.selectedThread?.id === threadId
                ? { ...state.selectedThread, ...updates }
                : state.selectedThread,
          })),

        removeThread: (threadId) =>
          set((state) => ({
            threads: state.threads.filter((t) => t.id !== threadId),
            selectedThread:
              state.selectedThread?.id === threadId ? null : state.selectedThread,
            ui: {
              ...state.ui,
              selectedThreadId:
                state.ui.selectedThreadId === threadId
                  ? null
                  : state.ui.selectedThreadId,
            },
          })),

        selectThread: (threadId) =>
          set((state) => {
            const thread = threadId
              ? state.threadCache[threadId] ??
              state.threads.find((t) => t.id === threadId) ??
              null
              : null;
            return {
              selectedThread: thread,
              ui: {
                ...state.ui,
                selectedThreadId: threadId,
              },
            };
          }),

        cacheThread: (thread) =>
          set((state) => ({
            threadCache: {
              ...state.threadCache,
              [thread.id]: thread,
            },
          })),

        // =====================================================================
        // Label Actions
        // =====================================================================

        setLabels: (accountId, labels) =>
          set((state) => ({
            labels: { ...state.labels, [accountId]: labels },
          })),

        addLabel: (accountId, label) =>
          set((state) => ({
            labels: {
              ...state.labels,
              [accountId]: [...(state.labels[accountId] || []), label],
            },
          })),

        // =====================================================================
        // Gatekeeper Actions
        // =====================================================================

        setPendingSenders: (senders) => set({ pendingSenders: senders }),

        acceptSender: (email) =>
          set((state) => ({
            allowedSenders: [...state.allowedSenders, email.toLowerCase()],
            pendingSenders: state.pendingSenders.filter(
              (s) => s.email.toLowerCase() !== email.toLowerCase()
            ),
            gatekeeperDecisions: [
              ...state.gatekeeperDecisions,
              {
                senderEmail: email,
                decision: 'accept',
                decidedAt: Date.now(),
                autoDecision: false,
              },
            ],
          })),

        blockSender: (email) =>
          set((state) => ({
            blockedSenders: [...state.blockedSenders, email.toLowerCase()],
            pendingSenders: state.pendingSenders.filter(
              (s) => s.email.toLowerCase() !== email.toLowerCase()
            ),
            gatekeeperDecisions: [
              ...state.gatekeeperDecisions,
              {
                senderEmail: email,
                decision: 'block',
                decidedAt: Date.now(),
                autoDecision: false,
              },
            ],
          })),

        // =====================================================================
        // Priority Actions
        // =====================================================================

        addPrioritySender: (email) =>
          set((state) => ({
            prioritySenders: [...state.prioritySenders, email.toLowerCase()],
          })),

        removePrioritySender: (email) =>
          set((state) => ({
            prioritySenders: state.prioritySenders.filter(
              (e) => e !== email.toLowerCase()
            ),
          })),

        // =====================================================================
        // Snooze Actions
        // =====================================================================

        addSnoozedThread: (snooze) =>
          set((state) => ({
            snoozedThreads: [...state.snoozedThreads, snooze],
          })),

        removeSnoozedThread: (threadId) =>
          set((state) => ({
            snoozedThreads: state.snoozedThreads.filter(
              (s) => s.threadId !== threadId
            ),
          })),

        // =====================================================================
        // Scheduled Email Actions
        // =====================================================================

        addScheduledEmail: (email) =>
          set((state) => ({
            scheduledEmails: [...state.scheduledEmails, email],
          })),

        updateScheduledEmail: (id, updates) =>
          set((state) => ({
            scheduledEmails: state.scheduledEmails.map((e) =>
              e.id === id ? { ...e, ...updates } : e
            ),
          })),

        removeScheduledEmail: (id) =>
          set((state) => ({
            scheduledEmails: state.scheduledEmails.filter((e) => e.id !== id),
          })),

        cancelScheduledEmail: (id) =>
          set((state) => ({
            scheduledEmails: state.scheduledEmails.map((e) =>
              e.id === id ? { ...e, status: 'failed' as const, errorMessage: 'Cancelled by user' } : e
            ),
          })),

        // =====================================================================
        // Compose Actions
        // =====================================================================

        openCompose: (mode, options = {}) => {
          const composeId = crypto.randomUUID();
          const { activeAccountId, accounts } = get();

          const newCompose: ComposeState = {
            id: composeId,
            mode,
            fromAccountId:
              options.fromAccountId ?? activeAccountId ?? accounts[0]?.id ?? '',
            to: options.to ?? [],
            cc: options.cc ?? [],
            bcc: options.bcc ?? [],
            subject: options.subject ?? '',
            bodyHtml: options.bodyHtml ?? '',
            bodyText: options.bodyText ?? '',
            attachments: [],
            replyToMessageId: options.replyToMessageId,
            forwardedMessageId: options.forwardedMessageId,
            draftId: options.draftId,
            threadId: options.threadId,
            isDirty: false,
            isMinimized: false,
            isMaximized: false,
          };

          set((state) => ({
            ui: {
              ...state.ui,
              composeWindows: [...state.ui.composeWindows, newCompose],
              activeComposeId: composeId,
            },
          }));

          return composeId;
        },

        updateCompose: (composeId, updates) =>
          set((state) => ({
            ui: {
              ...state.ui,
              composeWindows: state.ui.composeWindows.map((c) =>
                c.id === composeId ? { ...c, ...updates, isDirty: true } : c
              ),
            },
          })),

        closeCompose: (composeId) =>
          set((state) => ({
            ui: {
              ...state.ui,
              composeWindows: state.ui.composeWindows.filter(
                (c) => c.id !== composeId
              ),
              activeComposeId:
                state.ui.activeComposeId === composeId
                  ? state.ui.composeWindows[0]?.id ?? null
                  : state.ui.activeComposeId,
            },
          })),

        // =====================================================================
        // Calendar Actions
        // =====================================================================

        setCalendars: (calendars) => set({ calendars }),
        setEvents: (events) => set({ events }),
        addEvent: (event) =>
          set((state) => ({
            events: [...state.events, event],
          })),
        removeEvent: (eventId) =>
          set((state) => ({
            events: state.events.filter((e) => e.id !== eventId),
          })),
        setSelectedDate: (date) => set({ selectedDate: date }),

        // =====================================================================
        // Settings Actions
        // =====================================================================

        updateSettings: (updates) =>
          set((state) => ({
            settings: { ...state.settings, ...updates },
          })),

        // =====================================================================
        // UI Actions
        // =====================================================================

        setActiveFolder: (folder, accountId = 'all') =>
          set((state) => ({
            ui: {
              ...state.ui,
              activeFolder: folder,
              activeFolderAccountId: accountId,
              selectedThreadId: null,
              multiSelectThreadIds: [],
            },
          })),

        setViewMode: (mode) =>
          set((state) => ({
            ui: { ...state.ui, viewMode: mode },
          })),

        toggleSidebar: () =>
          set((state) => ({
            ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed },
          })),

        openModal: (modal) =>
          set((state) => ({
            ui: { ...state.ui, activeModal: modal },
          })),

        closeModal: () =>
          set((state) => ({
            ui: { ...state.ui, activeModal: null },
          })),

        setSearchQuery: (query) =>
          set((state) => ({
            ui: { ...state.ui, searchQuery: query },
          })),

        setSearchFocused: (focused) =>
          set((state) => ({
            ui: { ...state.ui, searchFocused: focused },
          })),

        addRecentSearch: (query) =>
          set((state) => ({
            ui: {
              ...state.ui,
              recentSearches: [
                query,
                ...state.ui.recentSearches.filter((s) => s !== query),
              ].slice(0, 10),
            },
          })),

        toggleThreadSelection: (threadId) =>
          set((state) => ({
            ui: {
              ...state.ui,
              multiSelectThreadIds: state.ui.multiSelectThreadIds.includes(threadId)
                ? state.ui.multiSelectThreadIds.filter((id) => id !== threadId)
                : [...state.ui.multiSelectThreadIds, threadId],
            },
          })),

        selectAllThreads: () =>
          set((state) => ({
            ui: {
              ...state.ui,
              multiSelectThreadIds: state.threads.map((t) => t.id),
            },
          })),

        deselectAllThreads: () =>
          set((state) => ({
            ui: { ...state.ui, multiSelectThreadIds: [] },
          })),

        setLoadingThreads: (loading) =>
          set((state) => ({
            ui: { ...state.ui, isLoadingThreads: loading },
          })),

        setLoadingMessages: (loading) =>
          set((state) => ({
            ui: { ...state.ui, isLoadingMessages: loading },
          })),

        setSending: (sending) =>
          set((state) => ({
            ui: { ...state.ui, isSending: sending },
          })),

        // =====================================================================
        // Reset
        // =====================================================================

        reset: () =>
          set({
            accounts: [],
            activeAccountId: null,
            accountSyncStatus: {},
            threads: [],
            threadCache: {},
            selectedThread: null,
            labels: {},
            pendingSenders: [],
            blockedSenders: [],
            allowedSenders: [],
            gatekeeperDecisions: [],
            prioritySenders: [],
            snoozedThreads: [],
            scheduledEmails: [],
            calendars: [],
            events: [],
            selectedDate: null,
            pushChannels: [],
            settings: defaultSettings,
            ui: defaultUIState,
          }),
      }),
      {
        name: 'sparkles-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          activeAccountId: state.activeAccountId,
          blockedSenders: state.blockedSenders,
          allowedSenders: state.allowedSenders,
          prioritySenders: state.prioritySenders,
          settings: state.settings,
          ui: {
            viewMode: state.ui.viewMode,
            sidebarCollapsed: state.ui.sidebarCollapsed,
            sidebarWidth: state.ui.sidebarWidth,
            mailListWidth: state.ui.mailListWidth,
            recentSearches: state.ui.recentSearches,
          },
        }),
      }
    ),
    { name: 'SparklesStore' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

export const useActiveAccount = () =>
  useSparklesStore((state) =>
    state.accounts.find((a) => a.id === state.activeAccountId)
  );

export const useAccountLabels = (accountId: string) =>
  useSparklesStore((state) => state.labels[accountId] ?? []);

export const useUnreadCount = () =>
  useSparklesStore((state) => state.threads.filter((t) => t.isUnread).length);

export const usePendingSenderCount = () =>
  useSparklesStore((state) => state.pendingSenders.length);

export const useSyncStatus = () =>
  useSparklesStore((state) => {
    const statuses = Object.values(state.accountSyncStatus);
    if (statuses.some((s) => s.status === 'syncing')) return 'syncing';
    if (statuses.some((s) => s.status === 'error')) return 'error';
    return 'idle';
  });

export const useFilteredThreads = () =>
  useSparklesStore((state) => {
    const { ui, threads, prioritySenders, blockedSenders, pendingSenders } = state;

    // If no threads, return stable empty array (this avoids re-renders on empty state)
    if (threads.length === 0) return threads;

    let filtered = threads;

    // Filter by account
    if (ui.activeFolderAccountId !== 'all') {
      filtered = filtered.filter((t) => t.accountId === ui.activeFolderAccountId);
    }

    // Filter by folder
    switch (ui.activeFolder) {
      case 'SMART_INBOX':
        filtered = filtered.filter(
          (t) => !blockedSenders.includes(t.participants[0]?.email?.toLowerCase() ?? '')
        );
        break;
      case 'GATEKEEPER':
        const pendingEmails = new Set(pendingSenders.map((s) => s.email.toLowerCase()));
        filtered = filtered.filter((t) =>
          pendingEmails.has(t.participants[0]?.email?.toLowerCase() ?? '')
        );
        break;
      case 'STARRED':
        filtered = filtered.filter((t) => t.isStarred);
        break;
      case 'SENT':
        filtered = filtered.filter((t) => t.labelIds.includes('SENT'));
        break;
      case 'DRAFT':
        filtered = filtered.filter((t) => t.labelIds.includes('DRAFT'));
        break;
      case 'TRASH':
        filtered = filtered.filter((t) => t.labelIds.includes('TRASH'));
        break;
      case 'SPAM':
        filtered = filtered.filter((t) => t.labelIds.includes('SPAM'));
        break;
      case 'IMPORTANT':
        filtered = filtered.filter((t) => t.isImportant);
        break;
      case 'INBOX':
        filtered = filtered.filter((t) => t.labelIds.includes('INBOX'));
        break;
      default:
        if (!ui.activeFolder.startsWith('SMART_') && !ui.activeFolder.startsWith('CATEGORY_')) {
          filtered = filtered.filter((t) => t.labelIds.includes(ui.activeFolder));
        }
    }

    // Check if any threads have priority (without mutating objects)
    const prioritySet = new Set(prioritySenders);

    // Sort by priority first, then by date
    // NOTE: We use slice() to avoid mutating the original filtered array
    return [...filtered].sort((a, b) => {
      const aPriority = prioritySet.has(a.participants[0]?.email?.toLowerCase() ?? '');
      const bPriority = prioritySet.has(b.participants[0]?.email?.toLowerCase() ?? '');
      if (aPriority && !bPriority) return -1;
      if (!aPriority && bPriority) return 1;
      return b.lastMessageAt - a.lastMessageAt;
    });
  });

export const useTodayEvents = () =>
  useSparklesStore((state) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return state.events.filter((e) => {
      const start = new Date(e.start.dateTime ?? e.start.date ?? '');
      return start >= today && start < tomorrow;
    });
  });
