/**
 * useSparklesMenuBar - Registers Sparkles menus and status icons in the LiquidMenuBar
 */

import { useEffect, useCallback, useMemo } from 'react';
import {
  Mail,
  RefreshCw,
  Shield,
  Settings,
  Users,
  UserPlus,
  Share2,
  Command,
  Power,
  Info,
  Reply,
  Forward,
  Archive,
  Trash2,
  Star,
  Clock,
  VolumeX,
} from 'lucide-react';
import { useMenuBar } from '@/context/MenuBarContext';
import {
  useSparklesStore,
  useUnreadCount,
  usePendingSenderCount,
  useSyncStatus,
} from '@/stores/sparklesStore';
import { useDesktopStore } from '@/stores/desktopStore';
import type { MenuDef, StatusIconDef } from '@/components/menu-bar';

export function useSparklesMenuBar() {
  const { setAppIdentity, registerMenu, unregisterMenu, registerStatusIcon, unregisterStatusIcon } =
    useMenuBar();
  const { closePanel } = useDesktopStore();

  const {
    accounts,
    activeAccountId,
    settings,
    ui,
    selectedThread,
    setActiveAccount,
    updateSettings,
    openModal,
    openCompose,
    selectThread,
    updateThread,
  } = useSparklesStore();

  const unreadCount = useUnreadCount();
  const pendingSenderCount = usePendingSenderCount();
  const syncStatus = useSyncStatus();

  // Actions
  const syncAllMail = useCallback(() => {
    // TODO: Implement sync
    console.log('Syncing all mail...');
  }, []);

  const openGatekeeper = useCallback(() => {
    openModal({ type: 'gatekeeper' });
  }, [openModal]);

  const goToInbox = useCallback(() => {
    useSparklesStore.getState().setActiveFolder('INBOX');
  }, []);

  // Sparkles App Menu
  const sparklesAppMenu: MenuDef = useMemo(
    () => ({
      id: 'sparkles-app',
      label: 'Sparkles',
      items: [
        {
          id: 'about',
          label: 'About Sparkles',
          icon: Info,
          action: () => openModal({ type: 'about' }),
        },
        { id: 'div-about', label: '', dividerAfter: true },
        {
          id: 'settings',
          label: 'Settings...',
          icon: Settings,
          shortcut: '⌘,',
          action: () => openModal({ type: 'settings' }),
        },
        { id: 'div-settings', label: '', dividerAfter: true },
        {
          id: 'teams',
          label: 'Teams...',
          icon: Users,
          action: () => openModal({ type: 'accounts' }),
        },
        { id: 'div-teams', label: '', dividerAfter: true },
        {
          id: 'accounts',
          label: 'Accounts',
          icon: Mail,
          submenu: [
            ...accounts.map((account) => ({
              id: `account-${account.id}`,
              label: account.email,
              checked: account.id === activeAccountId,
              action: () => setActiveAccount(account.id),
            })),
            { id: 'div-accounts', label: '', dividerAfter: true },
            {
              id: 'account-settings',
              label: 'Account Settings...',
              icon: Settings,
              action: () => openModal({ type: 'accounts' }),
            },
          ],
        },
        { id: 'div-accounts-main', label: '', dividerAfter: true },
        {
          id: 'add-account',
          label: 'Add Account...',
          icon: UserPlus,
          action: () => openModal({ type: 'add-account' }),
        },
        {
          id: 'add-shared-account',
          label: 'Add Shared Account...',
          icon: Share2,
          action: () => openModal({ type: 'add-account' }),
        },
        { id: 'div-add', label: '', dividerAfter: true },
        {
          id: 'command-center',
          label: 'Command Center',
          icon: Command,
          shortcut: '⌘K',
          action: () => {
            // TODO: Open command palette
          },
        },
        { id: 'div-command', label: '', dividerAfter: true },
        {
          id: 'quit',
          label: 'Close Sparkles',
          icon: Power,
          shortcut: '⌘Q',
          action: () => closePanel(),
          danger: true,
        },
      ],
    }),
    [accounts, activeAccountId, setActiveAccount, openModal, closePanel]
  );

  // Mailbox Menu
  const mailboxMenu: MenuDef = useMemo(
    () => ({
      id: 'sparkles-mailbox',
      label: 'Mailbox',
      items: [
        {
          id: 'get-mail',
          label: 'Get All New Mail',
          icon: RefreshCw,
          shortcut: '⇧⌘N',
          action: syncAllMail,
        },
        { id: 'div-1', label: '', dividerAfter: true },
        {
          id: 'gatekeeper',
          label: 'Gatekeeper',
          icon: Shield,
          submenu: [
            {
              id: 'review-pending',
              label: `Review Pending (${pendingSenderCount})`,
              icon: Shield,
              action: openGatekeeper,
              disabled: pendingSenderCount === 0,
            },
            { id: 'div-gk', label: '', dividerAfter: true },
            {
              id: 'gk-before',
              label: 'Screen Before Inbox',
              checked: settings.gatekeeperMode === 'before_inbox',
              action: () => updateSettings({ gatekeeperMode: 'before_inbox' }),
            },
            {
              id: 'gk-inside',
              label: 'Screen Inside Inbox',
              checked: settings.gatekeeperMode === 'inside_inbox',
              action: () => updateSettings({ gatekeeperMode: 'inside_inbox' }),
            },
            {
              id: 'gk-disabled',
              label: 'Accept All Senders',
              checked: settings.gatekeeperMode === 'disabled',
              action: () => updateSettings({ gatekeeperMode: 'disabled' }),
            },
          ],
        },
        { id: 'div-2', label: '', dividerAfter: true },
        {
          id: 'sync-all',
          label: 'Synchronize All',
          icon: RefreshCw,
          action: syncAllMail,
        },
      ],
    }),
    [pendingSenderCount, settings.gatekeeperMode, syncAllMail, openGatekeeper, updateSettings]
  );

  // Message Menu
  const messageMenu: MenuDef = useMemo(
    () => ({
      id: 'sparkles-message',
      label: 'Message',
      items: [
        {
          id: 'new-message',
          label: 'New Message',
          icon: Mail,
          shortcut: '⌘N',
          action: () => openCompose('new'),
        },
        { id: 'div-1', label: '', dividerAfter: true },
        {
          id: 'reply',
          label: 'Reply',
          icon: Reply,
          shortcut: '⌘R',
          disabled: !selectedThread,
          action: () => {
            if (selectedThread) {
              openCompose('reply', { threadId: selectedThread.id });
            }
          },
        },
        {
          id: 'reply-all',
          label: 'Reply All',
          shortcut: '⇧⌘R',
          disabled: !selectedThread,
          action: () => {
            if (selectedThread) {
              openCompose('replyAll', { threadId: selectedThread.id });
            }
          },
        },
        {
          id: 'forward',
          label: 'Forward',
          icon: Forward,
          shortcut: '⌘J',
          disabled: !selectedThread,
          action: () => {
            if (selectedThread) {
              openCompose('forward', { threadId: selectedThread.id });
            }
          },
        },
        { id: 'div-2', label: '', dividerAfter: true },
        {
          id: 'archive',
          label: 'Archive',
          icon: Archive,
          shortcut: '⌘E',
          disabled: !selectedThread,
          action: () => {
            if (selectedThread) {
              updateThread(selectedThread.id, {
                labelIds: selectedThread.labelIds.filter((l) => l !== 'INBOX'),
              });
              selectThread(null);
            }
          },
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: Trash2,
          shortcut: '⌫',
          disabled: !selectedThread,
          danger: true,
          action: () => {
            if (selectedThread) {
              updateThread(selectedThread.id, {
                labelIds: [...selectedThread.labelIds, 'TRASH'],
              });
              selectThread(null);
            }
          },
        },
        { id: 'div-3', label: '', dividerAfter: true },
        {
          id: 'toggle-star',
          label: 'Toggle Star',
          icon: Star,
          shortcut: '⌘S',
          disabled: !selectedThread,
          action: () => {
            if (selectedThread) {
              updateThread(selectedThread.id, { isStarred: !selectedThread.isStarred });
            }
          },
        },
        { id: 'div-4', label: '', dividerAfter: true },
        {
          id: 'snooze',
          label: 'Snooze...',
          icon: Clock,
          shortcut: '⌘B',
          disabled: !selectedThread,
          action: () => {
            if (selectedThread) {
              openModal({ type: 'snooze', threadId: selectedThread.id });
            }
          },
        },
        {
          id: 'mute',
          label: 'Mute Thread',
          icon: VolumeX,
          shortcut: '⌘M',
          disabled: !selectedThread,
          action: () => {
            if (selectedThread) {
              updateThread(selectedThread.id, { isMuted: true });
            }
          },
        },
      ],
    }),
    [selectedThread, openCompose, updateThread, selectThread, openModal]
  );

  // Status Icons
  const statusIcons: StatusIconDef[] = useMemo(
    () => [
      {
        id: 'sparkles-sync',
        icon: RefreshCw,
        color:
          syncStatus === 'syncing'
            ? 'var(--system-blue)'
            : syncStatus === 'error'
            ? 'var(--system-red)'
            : 'var(--glass-text-tertiary)',
        tooltip:
          syncStatus === 'syncing'
            ? 'Syncing mail...'
            : syncStatus === 'error'
            ? 'Sync failed - click to retry'
            : 'All mail synced',
        onClick: syncAllMail,
        priority: 10,
      },
      {
        id: 'sparkles-gatekeeper',
        icon: Shield,
        color: pendingSenderCount > 0 ? 'var(--system-orange)' : 'var(--glass-text-tertiary)',
        tooltip:
          pendingSenderCount > 0
            ? `${pendingSenderCount} senders awaiting review`
            : 'Gatekeeper: No pending senders',
        onClick: openGatekeeper,
        priority: 20,
      },
      {
        id: 'sparkles-unread',
        icon: Mail,
        color: unreadCount > 0 ? 'var(--system-blue)' : 'var(--glass-text-tertiary)',
        tooltip: unreadCount > 0 ? `${unreadCount} unread emails` : 'No unread emails',
        onClick: goToInbox,
        priority: 30,
      },
    ],
    [syncStatus, pendingSenderCount, unreadCount, syncAllMail, openGatekeeper, goToInbox]
  );

  // Register app identity
  useEffect(() => {
    setAppIdentity('Sparkles', Mail);

    return () => {
      setAppIdentity(null, undefined);
    };
  }, [setAppIdentity]);

  // Register menus
  useEffect(() => {
    registerMenu(sparklesAppMenu);
    registerMenu(mailboxMenu);
    registerMenu(messageMenu);

    return () => {
      unregisterMenu('sparkles-app');
      unregisterMenu('sparkles-mailbox');
      unregisterMenu('sparkles-message');
    };
  }, [sparklesAppMenu, mailboxMenu, messageMenu, registerMenu, unregisterMenu]);

  // Register status icons
  useEffect(() => {
    statusIcons.forEach((icon) => registerStatusIcon(icon));

    return () => {
      statusIcons.forEach((icon) => unregisterStatusIcon(icon.id));
    };
  }, [statusIcons, registerStatusIcon, unregisterStatusIcon]);
}

export default useSparklesMenuBar;
