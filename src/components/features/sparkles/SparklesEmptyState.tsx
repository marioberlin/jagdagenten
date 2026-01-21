/**
 * SparklesEmptyState - Empty state displays for various scenarios
 */

import { Mail, Inbox, Search, Plus, Shield, Star, Trash2, Send, FileText } from 'lucide-react';
import { useSparklesStore } from '@/stores/sparklesStore';
import { cn } from '@/lib/utils';
import type { FolderType } from '@/types/sparkles';

// =============================================================================
// Props
// =============================================================================

interface SparklesEmptyStateProps {
  type: 'no-accounts' | 'no-threads' | 'no-selection' | 'no-search-results';
  folder?: FolderType;
}

// =============================================================================
// Component
// =============================================================================

export function SparklesEmptyState({ type, folder }: SparklesEmptyStateProps) {
  const { openModal, openCompose } = useSparklesStore();

  const config = getConfig(type, folder);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div
        className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
          'bg-[var(--glass-surface)]'
        )}
      >
        <config.icon className="w-8 h-8 text-[var(--glass-text-tertiary)]" />
      </div>

      <h3 className="text-lg font-semibold text-[var(--glass-text-primary)] mb-2">
        {config.title}
      </h3>

      <p className="text-sm text-[var(--glass-text-secondary)] max-w-xs mb-6">
        {config.description}
      </p>

      {config.action && (
        <button
          onClick={() => {
            if (config.action?.type === 'add-account') {
              openModal({ type: 'add-account' });
            } else if (config.action?.type === 'compose') {
              openCompose('new');
            }
          }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]',
            'text-white font-medium text-sm',
            'transition-colors duration-150'
          )}
        >
          {config.action.icon && <config.action.icon className="w-4 h-4" />}
          {config.action.label}
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Config
// =============================================================================

interface EmptyStateConfig {
  icon: typeof Mail;
  title: string;
  description: string;
  action?: {
    type: 'add-account' | 'compose';
    label: string;
    icon?: typeof Mail;
  };
}

function getConfig(type: SparklesEmptyStateProps['type'], folder?: FolderType): EmptyStateConfig {
  switch (type) {
    case 'no-accounts':
      return {
        icon: Mail,
        title: 'Welcome to Sparkles',
        description: 'Connect your Gmail account to get started with a smarter email experience.',
        action: {
          type: 'add-account',
          label: 'Add Account',
          icon: Plus,
        },
      };

    case 'no-selection':
      return {
        icon: Mail,
        title: 'Select an email',
        description: 'Choose an email from the list to read it here.',
      };

    case 'no-search-results':
      return {
        icon: Search,
        title: 'No results found',
        description: 'Try adjusting your search query or filters.',
      };

    case 'no-threads':
      return getFolderConfig(folder);

    default:
      return {
        icon: Inbox,
        title: 'No emails',
        description: 'Nothing to see here.',
      };
  }
}

function getFolderConfig(folder?: FolderType): EmptyStateConfig {
  switch (folder) {
    case 'SMART_INBOX':
    case 'INBOX':
      return {
        icon: Inbox,
        title: 'Inbox zero!',
        description: 'You\'ve processed all your emails. Nice work!',
        action: {
          type: 'compose',
          label: 'Compose',
          icon: Plus,
        },
      };

    case 'GATEKEEPER':
      return {
        icon: Shield,
        title: 'No pending senders',
        description: 'All new senders have been reviewed.',
      };

    case 'STARRED':
      return {
        icon: Star,
        title: 'No starred emails',
        description: 'Star important emails to find them here.',
      };

    case 'SENT':
      return {
        icon: Send,
        title: 'No sent emails',
        description: 'Emails you send will appear here.',
        action: {
          type: 'compose',
          label: 'Compose',
          icon: Plus,
        },
      };

    case 'DRAFT':
      return {
        icon: FileText,
        title: 'No drafts',
        description: 'Drafts you save will appear here.',
        action: {
          type: 'compose',
          label: 'New Draft',
          icon: Plus,
        },
      };

    case 'TRASH':
      return {
        icon: Trash2,
        title: 'Trash is empty',
        description: 'Deleted emails will appear here for 30 days.',
      };

    default:
      return {
        icon: Inbox,
        title: 'No emails',
        description: 'Nothing in this folder yet.',
      };
  }
}

export default SparklesEmptyState;
