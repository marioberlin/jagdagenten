/**
 * SparklesAccountsModal - Multi-account management modal
 *
 * Allows users to:
 * - View all connected Gmail accounts
 * - Switch between accounts
 * - Remove accounts
 * - Add new accounts
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    X,
    User,
    Check,
    Trash2,
    Plus,
    RefreshCw,
    Mail,
    AlertCircle,
    Clock,
} from 'lucide-react';
import { useSparklesStore } from '@/stores/sparklesStore';
import { cn } from '@/lib/utils';

interface SparklesAccountsModalProps {
    onClose: () => void;
}

export function SparklesAccountsModal({ onClose }: SparklesAccountsModalProps) {
    const {
        accounts,
        ui,
        removeAccount,
        setActiveAccount,
        openModal,
    } = useSparklesStore();

    const [removingAccountId, setRemovingAccountId] = useState<string | null>(null);
    const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

    const handleSwitchAccount = (accountId: string) => {
        setActiveAccount(accountId);
        onClose();
    };

    const handleRemoveAccount = async (accountId: string) => {
        if (confirmRemove !== accountId) {
            setConfirmRemove(accountId);
            return;
        }

        setRemovingAccountId(accountId);
        try {
            removeAccount(accountId);
            setConfirmRemove(null);
        } catch (error) {
            console.error('Failed to remove account:', error);
        } finally {
            setRemovingAccountId(null);
        }
    };

    const handleAddAccount = () => {
        openModal({ type: 'add-account' });
    };

    const getSyncStatusIcon = (account: { lastSyncAt?: number }) => {
        if (!account.lastSyncAt) return null;
        // If synced in the last minute, show "synced" indicator
        const diff = Date.now() - account.lastSyncAt;
        if (diff < 60000) {
            return <Check className="w-3.5 h-3.5 text-green-400" />;
        }
        return null;
    };

    const getLastSyncText = (account: { lastSyncAt?: number }) => {
        if (!account.lastSyncAt) return 'Never synced';

        const diff = Date.now() - account.lastSyncAt;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return new Date(account.lastSyncAt).toLocaleDateString();
    };

    return (
        <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                className={cn(
                    'relative w-full max-w-md mx-4',
                    'bg-[var(--glass-bg)] backdrop-blur-2xl',
                    'border border-[var(--glass-border)]',
                    'rounded-2xl shadow-2xl',
                    'overflow-hidden'
                )}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                Gmail Accounts
                            </h2>
                            <p className="text-xs text-[var(--glass-text-tertiary)]">
                                {accounts.length} account{accounts.length !== 1 ? 's' : ''} connected
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={cn(
                            'w-8 h-8 rounded-full',
                            'flex items-center justify-center',
                            'hover:bg-[var(--glass-surface-hover)]',
                            'text-[var(--glass-text-secondary)]',
                            'transition-colors'
                        )}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Account List */}
                <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                    {accounts.length === 0 ? (
                        <div className="text-center py-8">
                            <Mail className="w-12 h-12 mx-auto mb-3 text-[var(--glass-text-tertiary)] opacity-50" />
                            <p className="text-[var(--glass-text-secondary)] mb-1">
                                No accounts connected
                            </p>
                            <p className="text-sm text-[var(--glass-text-tertiary)]">
                                Add a Gmail account to get started
                            </p>
                        </div>
                    ) : (
                        accounts.map((account) => {
                            const isActive = ui.activeFolderAccountId === account.id ||
                                (ui.activeFolderAccountId === 'all' && accounts[0]?.id === account.id);
                            const isConfirming = confirmRemove === account.id;
                            const isRemoving = removingAccountId === account.id;

                            return (
                                <div
                                    key={account.id}
                                    className={cn(
                                        'group relative p-3 rounded-xl',
                                        'border transition-all duration-150',
                                        isActive
                                            ? 'bg-[var(--glass-bg-highlight)] border-[var(--color-accent)]'
                                            : 'bg-[var(--glass-surface)] border-transparent hover:border-[var(--glass-border)]'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div className="relative">
                                            {account.avatar ? (
                                                <img
                                                    src={account.avatar}
                                                    alt={account.name}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-white">
                                                        {account.name?.charAt(0) || account.email.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            {isActive && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-[var(--glass-bg)] flex items-center justify-center">
                                                    <Check className="w-2.5 h-2.5 text-white" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Account Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-[var(--glass-text-primary)] truncate">
                                                    {account.name || 'Gmail User'}
                                                </p>
                                                {getSyncStatusIcon(account)}
                                            </div>
                                            <p className="text-sm text-[var(--glass-text-secondary)] truncate">
                                                {account.email}
                                            </p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Clock className="w-3 h-3 text-[var(--glass-text-tertiary)]" />
                                                <span className="text-xs text-[var(--glass-text-tertiary)]">
                                                    {getLastSyncText(account)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            {!isActive && !isConfirming && (
                                                <button
                                                    onClick={() => handleSwitchAccount(account.id)}
                                                    className={cn(
                                                        'px-3 py-1.5 rounded-lg text-sm font-medium',
                                                        'bg-[var(--color-accent)] text-white',
                                                        'hover:opacity-90 transition-opacity'
                                                    )}
                                                >
                                                    Switch
                                                </button>
                                            )}

                                            {isConfirming ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleRemoveAccount(account.id)}
                                                        disabled={isRemoving}
                                                        className={cn(
                                                            'px-3 py-1.5 rounded-lg text-sm font-medium',
                                                            'bg-red-500 text-white',
                                                            'hover:bg-red-600 transition-colors',
                                                            isRemoving && 'opacity-50 cursor-not-allowed'
                                                        )}
                                                    >
                                                        {isRemoving ? 'Removing...' : 'Confirm'}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmRemove(null)}
                                                        className={cn(
                                                            'px-3 py-1.5 rounded-lg text-sm',
                                                            'text-[var(--glass-text-secondary)]',
                                                            'hover:bg-[var(--glass-surface)] transition-colors'
                                                        )}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleRemoveAccount(account.id)}
                                                    className={cn(
                                                        'w-8 h-8 rounded-lg',
                                                        'flex items-center justify-center',
                                                        'text-[var(--glass-text-tertiary)]',
                                                        'hover:text-red-400 hover:bg-red-500/10',
                                                        'transition-colors',
                                                        'opacity-0 group-hover:opacity-100'
                                                    )}
                                                    title="Remove account"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--glass-border)]">
                    <button
                        onClick={handleAddAccount}
                        className={cn(
                            'w-full flex items-center justify-center gap-2',
                            'py-2.5 px-4 rounded-xl',
                            'bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-hover)]',
                            'text-[var(--glass-text-primary)]',
                            'border border-dashed border-[var(--glass-border)]',
                            'transition-colors'
                        )}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="font-medium">Add Gmail Account</span>
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default SparklesAccountsModal;
