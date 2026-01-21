/**
 * SparklesAccountSettingsModal - Per-account settings
 *
 * Configure individual account settings:
 * - Email signature
 * - Vacation responder
 * - Send mail as
 * - Default reply behavior
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    X,
    Settings,
    Pen,
    Plane,
    Mail,
    Reply,
    Save,
    AlertCircle,
} from 'lucide-react';
import { useSparklesStore } from '@/stores/sparklesStore';
import { cn } from '@/lib/utils';

interface SparklesAccountSettingsModalProps {
    accountId: string;
    onClose: () => void;
}

interface AccountSettings {
    signature: string;
    signatureEnabled: boolean;
    vacationResponder: {
        enabled: boolean;
        subject: string;
        message: string;
        startDate: string;
        endDate: string;
        contactsOnly: boolean;
    };
    defaultReplyBehavior: 'reply' | 'reply-all';
    sendAs: {
        name: string;
        email: string;
        isDefault: boolean;
    }[];
}

const defaultSettings: AccountSettings = {
    signature: '',
    signatureEnabled: false,
    vacationResponder: {
        enabled: false,
        subject: '',
        message: '',
        startDate: '',
        endDate: '',
        contactsOnly: false,
    },
    defaultReplyBehavior: 'reply',
    sendAs: [],
};

export function SparklesAccountSettingsModal({
    accountId,
    onClose,
}: SparklesAccountSettingsModalProps) {
    const { accounts } = useSparklesStore();
    const account = accounts.find((a) => a.id === accountId);

    const [settings, setSettings] = useState<AccountSettings>(defaultSettings);
    const [activeTab, setActiveTab] = useState<'signature' | 'vacation' | 'sendas'>('signature');
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Load settings on mount
    useEffect(() => {
        // TODO: Load settings from API
        // For now, use defaults with account email
        if (account) {
            setSettings({
                ...defaultSettings,
                sendAs: [
                    {
                        name: account.name || '',
                        email: account.email,
                        isDefault: true,
                    },
                ],
            });
        }
    }, [account]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // TODO: Save settings via API
            await new Promise((resolve) => setTimeout(resolve, 500));
            setHasChanges(false);
            onClose();
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const updateSettings = (updates: Partial<AccountSettings>) => {
        setSettings((prev) => ({ ...prev, ...updates }));
        setHasChanges(true);
    };

    if (!account) {
        return null;
    }

    const tabs = [
        { id: 'signature' as const, label: 'Signature', icon: Pen },
        { id: 'vacation' as const, label: 'Vacation', icon: Plane },
        { id: 'sendas' as const, label: 'Send as', icon: Mail },
    ];

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
                    'relative w-full max-w-lg mx-4',
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
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Settings className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                Account Settings
                            </h2>
                            <p className="text-xs text-[var(--glass-text-tertiary)]">
                                {account.email}
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

                {/* Tab Bar */}
                <div className="flex border-b border-[var(--glass-border)]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 py-3 px-4',
                                'text-sm font-medium transition-colors',
                                activeTab === tab.id
                                    ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                                    : 'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]'
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-4 max-h-[400px] overflow-y-auto">
                    {/* Signature Tab */}
                    {activeTab === 'signature' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-[var(--glass-text-primary)]">
                                    Enable Signature
                                </label>
                                <button
                                    onClick={() =>
                                        updateSettings({ signatureEnabled: !settings.signatureEnabled })
                                    }
                                    className={cn(
                                        'w-10 h-6 rounded-full transition-colors',
                                        settings.signatureEnabled
                                            ? 'bg-[var(--color-accent)]'
                                            : 'bg-[var(--glass-surface)]'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                                            settings.signatureEnabled ? 'translate-x-5' : 'translate-x-1'
                                        )}
                                    />
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--glass-text-primary)] mb-2">
                                    Email Signature
                                </label>
                                <textarea
                                    value={settings.signature}
                                    onChange={(e) => updateSettings({ signature: e.target.value })}
                                    disabled={!settings.signatureEnabled}
                                    placeholder="Enter your email signature..."
                                    rows={6}
                                    className={cn(
                                        'w-full px-3 py-2 rounded-xl',
                                        'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                                        'text-[var(--glass-text-primary)] placeholder-[var(--glass-text-tertiary)]',
                                        'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]',
                                        'resize-none',
                                        !settings.signatureEnabled && 'opacity-50 cursor-not-allowed'
                                    )}
                                />
                                <p className="mt-1 text-xs text-[var(--glass-text-tertiary)]">
                                    HTML formatting is supported
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Vacation Tab */}
                    {activeTab === 'vacation' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-[var(--glass-text-primary)]">
                                        Vacation Responder
                                    </label>
                                    <p className="text-xs text-[var(--glass-text-tertiary)]">
                                        Auto-reply to incoming emails
                                    </p>
                                </div>
                                <button
                                    onClick={() =>
                                        updateSettings({
                                            vacationResponder: {
                                                ...settings.vacationResponder,
                                                enabled: !settings.vacationResponder.enabled,
                                            },
                                        })
                                    }
                                    className={cn(
                                        'w-10 h-6 rounded-full transition-colors',
                                        settings.vacationResponder.enabled
                                            ? 'bg-[var(--color-accent)]'
                                            : 'bg-[var(--glass-surface)]'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                                            settings.vacationResponder.enabled ? 'translate-x-5' : 'translate-x-1'
                                        )}
                                    />
                                </button>
                            </div>

                            {settings.vacationResponder.enabled && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-[var(--glass-text-secondary)] mb-1">
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={settings.vacationResponder.startDate}
                                                onChange={(e) =>
                                                    updateSettings({
                                                        vacationResponder: {
                                                            ...settings.vacationResponder,
                                                            startDate: e.target.value,
                                                        },
                                                    })
                                                }
                                                className={cn(
                                                    'w-full px-3 py-2 rounded-xl',
                                                    'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                                                    'text-[var(--glass-text-primary)]',
                                                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]'
                                                )}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-[var(--glass-text-secondary)] mb-1">
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                value={settings.vacationResponder.endDate}
                                                onChange={(e) =>
                                                    updateSettings({
                                                        vacationResponder: {
                                                            ...settings.vacationResponder,
                                                            endDate: e.target.value,
                                                        },
                                                    })
                                                }
                                                className={cn(
                                                    'w-full px-3 py-2 rounded-xl',
                                                    'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                                                    'text-[var(--glass-text-primary)]',
                                                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]'
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-[var(--glass-text-secondary)] mb-1">
                                            Subject
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.vacationResponder.subject}
                                            onChange={(e) =>
                                                updateSettings({
                                                    vacationResponder: {
                                                        ...settings.vacationResponder,
                                                        subject: e.target.value,
                                                    },
                                                })
                                            }
                                            placeholder="Out of Office"
                                            className={cn(
                                                'w-full px-3 py-2 rounded-xl',
                                                'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                                                'text-[var(--glass-text-primary)] placeholder-[var(--glass-text-tertiary)]',
                                                'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]'
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs text-[var(--glass-text-secondary)] mb-1">
                                            Message
                                        </label>
                                        <textarea
                                            value={settings.vacationResponder.message}
                                            onChange={(e) =>
                                                updateSettings({
                                                    vacationResponder: {
                                                        ...settings.vacationResponder,
                                                        message: e.target.value,
                                                    },
                                                })
                                            }
                                            placeholder="I'm currently out of office..."
                                            rows={4}
                                            className={cn(
                                                'w-full px-3 py-2 rounded-xl',
                                                'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                                                'text-[var(--glass-text-primary)] placeholder-[var(--glass-text-tertiary)]',
                                                'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]',
                                                'resize-none'
                                            )}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="contactsOnly"
                                            checked={settings.vacationResponder.contactsOnly}
                                            onChange={(e) =>
                                                updateSettings({
                                                    vacationResponder: {
                                                        ...settings.vacationResponder,
                                                        contactsOnly: e.target.checked,
                                                    },
                                                })
                                            }
                                            className="w-4 h-4 rounded accent-[var(--color-accent)]"
                                        />
                                        <label
                                            htmlFor="contactsOnly"
                                            className="text-sm text-[var(--glass-text-secondary)]"
                                        >
                                            Only send to people in my contacts
                                        </label>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Send As Tab */}
                    {activeTab === 'sendas' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                <p className="text-xs text-blue-400">
                                    Send As settings require verification. Contact support to add aliases.
                                </p>
                            </div>

                            <div className="space-y-2">
                                {settings.sendAs.map((alias, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            'flex items-center gap-3 p-3 rounded-xl',
                                            'bg-[var(--glass-surface)] border border-[var(--glass-border)]'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'w-8 h-8 rounded-full flex items-center justify-center',
                                                alias.isDefault
                                                    ? 'bg-[var(--color-accent)]'
                                                    : 'bg-[var(--glass-surface)]'
                                            )}
                                        >
                                            <Mail
                                                className={cn(
                                                    'w-4 h-4',
                                                    alias.isDefault ? 'text-white' : 'text-[var(--glass-text-tertiary)]'
                                                )}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[var(--glass-text-primary)] truncate">
                                                {alias.name || alias.email}
                                            </p>
                                            <p className="text-xs text-[var(--glass-text-secondary)] truncate">
                                                {alias.email}
                                            </p>
                                        </div>
                                        {alias.isDefault && (
                                            <span className="text-xs text-[var(--color-accent)] font-medium">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <label className="text-sm font-medium text-[var(--glass-text-primary)]">
                                    Default Reply Behavior
                                </label>
                                <select
                                    value={settings.defaultReplyBehavior}
                                    onChange={(e) =>
                                        updateSettings({
                                            defaultReplyBehavior: e.target.value as 'reply' | 'reply-all',
                                        })
                                    }
                                    className={cn(
                                        'px-3 py-1.5 rounded-xl',
                                        'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                                        'text-sm text-[var(--glass-text-primary)]',
                                        'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]'
                                    )}
                                >
                                    <option value="reply">Reply</option>
                                    <option value="reply-all">Reply All</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-[var(--glass-border)]">
                    <button
                        onClick={onClose}
                        className={cn(
                            'px-4 py-2 rounded-xl',
                            'text-[var(--glass-text-secondary)]',
                            'hover:bg-[var(--glass-surface)] transition-colors'
                        )}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl',
                            'bg-[var(--color-accent)] text-white',
                            'hover:opacity-90 transition-opacity',
                            (!hasChanges || isSaving) && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default SparklesAccountSettingsModal;
