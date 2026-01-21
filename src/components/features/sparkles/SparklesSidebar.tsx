/**
 * SparklesSidebar - Navigation sidebar with folders, labels, and calendar
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Inbox,
  Send,
  FileText,
  Trash2,
  Star,
  AlertCircle,
  Archive,
  Tag,
  Shield,
  Sparkles,
  Calendar,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  Clock,
  Mail,
} from 'lucide-react';
import {
  useSparklesStore,
  useUnreadCount,
  usePendingSenderCount,
  useAccountLabels,
} from '@/stores/sparklesStore';
import { cn } from '@/lib/utils';
import type { FolderType, Label } from '@/types/sparkles';

// =============================================================================
// Types
// =============================================================================

interface FolderItem {
  id: FolderType;
  label: string;
  icon: React.ElementType;
  count?: number;
  color?: string;
}

// =============================================================================
// Component
// =============================================================================

export function SparklesSidebar() {
  const {
    accounts,
    activeAccountId,
    ui,
    settings,
    labels,
    setActiveFolder,
    setActiveAccount,
    openCompose,
    openModal,
  } = useSparklesStore();

  const unreadCount = useUnreadCount();
  const pendingSenderCount = usePendingSenderCount();

  // Get labels for all accounts or active account
  const currentLabels = useMemo(() => {
    if (activeAccountId && labels[activeAccountId]) {
      return labels[activeAccountId];
    }
    // Combine labels from all accounts
    return Object.values(labels).flat();
  }, [labels, activeAccountId]);

  const userLabels = useMemo(
    () => currentLabels.filter((l) => l.type === 'user'),
    [currentLabels]
  );

  // Smart Folders
  const smartFolders: FolderItem[] = useMemo(
    () => [
      {
        id: 'SMART_INBOX',
        label: 'Smart Inbox',
        icon: Sparkles,
        count: unreadCount,
        color: 'var(--color-accent)',
      },
      ...(settings.gatekeeperMode !== 'disabled'
        ? [
            {
              id: 'GATEKEEPER' as FolderType,
              label: 'Gatekeeper',
              icon: Shield,
              count: pendingSenderCount,
              color: 'var(--system-orange)',
            },
          ]
        : []),
    ],
    [unreadCount, pendingSenderCount, settings.gatekeeperMode]
  );

  // System Folders
  const systemFolders: FolderItem[] = useMemo(
    () => [
      { id: 'INBOX', label: 'Inbox', icon: Inbox, count: unreadCount },
      { id: 'STARRED', label: 'Starred', icon: Star },
      { id: 'SENT', label: 'Sent', icon: Send },
      { id: 'DRAFT', label: 'Drafts', icon: FileText },
      { id: 'IMPORTANT', label: 'Important', icon: AlertCircle },
      { id: 'TRASH', label: 'Trash', icon: Trash2 },
    ],
    [unreadCount]
  );

  const handleFolderClick = (folderId: FolderType) => {
    setActiveFolder(folderId, ui.activeFolderAccountId);
  };

  const handleComposeClick = () => {
    openCompose('new');
  };

  return (
    <div className="h-full flex flex-col bg-[var(--glass-bg-thin)]">
      {/* Account Switcher */}
      <div className="p-3 border-b border-[var(--glass-border)]">
        <button
          onClick={() => openModal({ type: 'accounts' })}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
            'bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-hover)]',
            'transition-colors duration-150'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[var(--glass-text-primary)]">
              {accounts.length > 0
                ? activeAccountId
                  ? accounts.find((a) => a.id === activeAccountId)?.email ?? 'All Accounts'
                  : 'All Accounts'
                : 'Add Account'}
            </div>
            {accounts.length > 1 && (
              <div className="text-xs text-[var(--glass-text-tertiary)]">
                {accounts.length} accounts
              </div>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
        </button>
      </div>

      {/* Compose Button */}
      <div className="p-3">
        <button
          onClick={handleComposeClick}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl',
            'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]',
            'text-white font-medium text-sm',
            'shadow-lg shadow-[var(--color-accent)]/25',
            'transition-all duration-150 hover:scale-[1.02]'
          )}
        >
          <Plus className="w-4 h-4" />
          Compose
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {/* Smart Folders */}
        <FolderSection title="Smart">
          {smartFolders.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              isActive={ui.activeFolder === folder.id}
              onClick={() => handleFolderClick(folder.id)}
            />
          ))}
        </FolderSection>

        {/* System Folders */}
        <FolderSection title="Folders">
          {systemFolders.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              isActive={ui.activeFolder === folder.id}
              onClick={() => handleFolderClick(folder.id)}
            />
          ))}
        </FolderSection>

        {/* User Labels */}
        {userLabels.length > 0 && (
          <FolderSection
            title="Labels"
            action={
              <button
                onClick={() => openModal({ type: 'create-label' })}
                className="p-1 rounded hover:bg-[var(--glass-surface-hover)] transition-colors"
              >
                <Plus className="w-3 h-3 text-[var(--glass-text-tertiary)]" />
              </button>
            }
          >
            {userLabels.map((label) => (
              <LabelRow
                key={label.id}
                label={label}
                isActive={ui.activeFolder === label.id}
                onClick={() => handleFolderClick(label.id)}
              />
            ))}
          </FolderSection>
        )}

        {/* Mini Calendar */}
        <div className="mt-4 p-2">
          <MiniCalendar />
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-[var(--glass-border)]">
        <button
          onClick={() => openModal({ type: 'settings' })}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
            'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
            'hover:bg-[var(--glass-surface-hover)]',
            'transition-colors duration-150'
          )}
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function FolderSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between px-3 py-1">
        <span className="text-xs font-medium text-[var(--glass-text-tertiary)] uppercase tracking-wider">
          {title}
        </span>
        {action}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function FolderRow({
  folder,
  isActive,
  onClick,
}: {
  folder: FolderItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = folder.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg',
        'transition-colors duration-150',
        isActive
          ? 'bg-[var(--glass-surface-active)] text-[var(--glass-text-primary)]'
          : 'text-[var(--glass-text-secondary)] hover:bg-[var(--glass-surface-hover)] hover:text-[var(--glass-text-primary)]'
      )}
    >
      <Icon
        className="w-4 h-4 flex-shrink-0"
        style={{ color: folder.color }}
      />
      <span className="flex-1 text-left text-sm truncate">{folder.label}</span>
      {folder.count !== undefined && folder.count > 0 && (
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
            isActive
              ? 'bg-[var(--color-accent)] text-white'
              : 'bg-[var(--glass-surface)] text-[var(--glass-text-tertiary)]'
          )}
        >
          {folder.count}
        </span>
      )}
    </button>
  );
}

function LabelRow({
  label,
  isActive,
  onClick,
}: {
  label: Label;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg',
        'transition-colors duration-150',
        isActive
          ? 'bg-[var(--glass-surface-active)] text-[var(--glass-text-primary)]'
          : 'text-[var(--glass-text-secondary)] hover:bg-[var(--glass-surface-hover)] hover:text-[var(--glass-text-primary)]'
      )}
    >
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{
          backgroundColor: label.color?.backgroundColor ?? 'var(--glass-text-tertiary)',
        }}
      />
      <span className="flex-1 text-left text-sm truncate">{label.name}</span>
      {label.unreadCount > 0 && (
        <span className="text-xs text-[var(--glass-text-tertiary)]">
          {label.unreadCount}
        </span>
      )}
    </button>
  );
}

function MiniCalendar() {
  const { selectedDate, setSelectedDate, openModal } = useSparklesStore();

  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'long' });
  const currentYear = today.getFullYear();

  return (
    <div className="bg-[var(--glass-surface)] rounded-xl p-3">
      <button
        onClick={() => openModal({ type: 'calendar' })}
        className="flex items-center gap-2 mb-2 text-sm font-medium text-[var(--glass-text-primary)] hover:text-[var(--color-accent)] transition-colors"
      >
        <Calendar className="w-4 h-4" />
        {currentMonth} {currentYear}
      </button>
      <div className="text-xs text-[var(--glass-text-tertiary)]">
        Click to view full calendar
      </div>
    </div>
  );
}

export default SparklesSidebar;
