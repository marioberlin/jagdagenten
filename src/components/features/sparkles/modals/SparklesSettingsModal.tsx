/**
 * SparklesSettingsModal - Application settings modal
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useSparklesStore } from '@/stores/sparklesStore';
import { cn } from '@/lib/utils';
import type { SparklesSettings } from '@/types/sparkles';

// =============================================================================
// Types
// =============================================================================

interface SparklesSettingsModalProps {
    onClose: () => void;
}

type SettingsTab = 'general' | 'smart-inbox' | 'privacy' | 'notifications' | 'sync';

// =============================================================================
// Component
// =============================================================================

export function SparklesSettingsModal({ onClose }: SparklesSettingsModalProps) {
    const { settings, updateSettings } = useSparklesStore();
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [localSettings, setLocalSettings] = useState<SparklesSettings>(settings);

    const handleSave = useCallback(() => {
        updateSettings(localSettings);
        onClose();
    }, [localSettings, updateSettings, onClose]);

    const updateLocalSetting = <K extends keyof SparklesSettings>(
        key: K,
        value: SparklesSettings[K]
    ) => {
        setLocalSettings((prev) => ({ ...prev, [key]: value }));
    };

    const tabs: { id: SettingsTab; label: string }[] = [
        { id: 'general', label: 'General' },
        { id: 'smart-inbox', label: 'Smart Inbox' },
        { id: 'privacy', label: 'Privacy' },
        { id: 'notifications', label: 'Notifications' },
        { id: 'sync', label: 'Sync' },
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
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                className={cn(
                    'relative w-full max-w-2xl max-h-[80vh] mx-4',
                    'bg-[var(--glass-bg)] backdrop-blur-2xl',
                    'border border-[var(--glass-border)]',
                    'rounded-2xl shadow-2xl',
                    'overflow-hidden flex flex-col'
                )}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
                    <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                        Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className={cn(
                            'p-2 rounded-lg',
                            'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                            'hover:bg-[var(--glass-surface-hover)]',
                            'transition-colors duration-150'
                        )}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-6 pt-3 border-b border-[var(--glass-border)]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'px-4 py-2 text-sm font-medium rounded-t-lg -mb-px',
                                'transition-colors duration-150',
                                activeTab === tab.id
                                    ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                                    : 'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'general' && (
                        <GeneralSettings settings={localSettings} updateSetting={updateLocalSetting} />
                    )}
                    {activeTab === 'smart-inbox' && (
                        <SmartInboxSettings settings={localSettings} updateSetting={updateLocalSetting} />
                    )}
                    {activeTab === 'privacy' && (
                        <PrivacySettings settings={localSettings} updateSetting={updateLocalSetting} />
                    )}
                    {activeTab === 'notifications' && (
                        <NotificationSettings settings={localSettings} updateSetting={updateLocalSetting} />
                    )}
                    {activeTab === 'sync' && (
                        <SyncSettings settings={localSettings} updateSetting={updateLocalSetting} />
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--glass-border)]">
                    <button
                        onClick={onClose}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium',
                            'text-[var(--glass-text-secondary)]',
                            'hover:bg-[var(--glass-surface-hover)]',
                            'transition-colors duration-150'
                        )}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium',
                            'bg-[var(--color-accent)] text-white',
                            'hover:opacity-90',
                            'transition-opacity duration-150',
                            'flex items-center gap-2'
                        )}
                    >
                        <Check className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// =============================================================================
// Settings Sections
// =============================================================================

interface SettingsSectionProps {
    settings: SparklesSettings;
    updateSetting: <K extends keyof SparklesSettings>(key: K, value: SparklesSettings[K]) => void;
}

function GeneralSettings({ settings, updateSetting }: SettingsSectionProps) {
    return (
        <div className="space-y-6">
            <SettingToggle
                label="Show unread count in dock"
                description="Display the number of unread emails on the app icon"
                checked={settings.showUnreadInDock}
                onChange={(v) => updateSetting('showUnreadInDock', v)}
            />
            <SettingToggle
                label="Mark as read when viewed"
                description="Automatically mark emails as read when you open them"
                checked={settings.markAsReadWhenViewed}
                onChange={(v) => updateSetting('markAsReadWhenViewed', v)}
            />
            <SettingToggle
                label="Enable keyboard shortcuts"
                description="Use keyboard shortcuts for common actions"
                checked={settings.enableKeyboardShortcuts}
                onChange={(v) => updateSetting('enableKeyboardShortcuts', v)}
            />
            <SettingSelect
                label="Reading pane position"
                value={settings.readingPanePosition}
                options={[
                    { value: 'right', label: 'Right' },
                    { value: 'bottom', label: 'Bottom' },
                    { value: 'hidden', label: 'Hidden' },
                ]}
                onChange={(v) => updateSetting('readingPanePosition', v as SparklesSettings['readingPanePosition'])}
            />
            <SettingSelect
                label="After archive/delete"
                value={settings.afterArchiveDelete}
                options={[
                    { value: 'next', label: 'Go to next message' },
                    { value: 'previous', label: 'Go to previous message' },
                    { value: 'list', label: 'Return to list' },
                ]}
                onChange={(v) => updateSetting('afterArchiveDelete', v as SparklesSettings['afterArchiveDelete'])}
            />
        </div>
    );
}

function SmartInboxSettings({ settings, updateSetting }: SettingsSectionProps) {
    return (
        <div className="space-y-6">
            <SettingToggle
                label="Enable Smart Inbox"
                description="Automatically categorize emails into Primary, Social, Promotions, etc."
                checked={settings.smartInboxEnabled}
                onChange={(v) => updateSetting('smartInboxEnabled', v)}
            />
            <SettingToggle
                label="Show Primary section"
                description="Display important emails from people you know"
                checked={settings.showPrimarySection}
                onChange={(v) => updateSetting('showPrimarySection', v)}
            />
            <SettingToggle
                label="Show Newsletters section"
                description="Group newsletter subscriptions together"
                checked={settings.showNewslettersSection}
                onChange={(v) => updateSetting('showNewslettersSection', v)}
            />
            <SettingToggle
                label="Show Notifications section"
                description="Group automated notifications together"
                checked={settings.showNotificationsSection}
                onChange={(v) => updateSetting('showNotificationsSection', v)}
            />
            <SettingSelect
                label="Gatekeeper mode"
                value={settings.gatekeeperMode}
                options={[
                    { value: 'off', label: 'Off' },
                    { value: 'inside_inbox', label: 'Inside Inbox' },
                    { value: 'separate', label: 'Separate View' },
                ]}
                onChange={(v) => updateSetting('gatekeeperMode', v as SparklesSettings['gatekeeperMode'])}
            />
        </div>
    );
}

function PrivacySettings({ settings, updateSetting }: SettingsSectionProps) {
    return (
        <div className="space-y-6">
            <SettingToggle
                label="Block tracking pixels"
                description="Prevent senders from knowing when you open emails"
                checked={settings.blockTrackingPixels}
                onChange={(v) => updateSetting('blockTrackingPixels', v)}
            />
            <SettingToggle
                label="Load remote images"
                description="Automatically load images in emails (may expose your IP)"
                checked={settings.loadRemoteImages}
                onChange={(v) => updateSetting('loadRemoteImages', v)}
            />
            <SettingToggle
                label="Hide read receipts"
                description="Don't send read receipts to senders"
                checked={settings.hideReadReceipts}
                onChange={(v) => updateSetting('hideReadReceipts', v)}
            />
            <SettingToggle
                label="Trust contacts senders"
                description="Automatically allow emails from your contacts"
                checked={settings.trustContactsSenders}
                onChange={(v) => updateSetting('trustContactsSenders', v)}
            />
        </div>
    );
}

function NotificationSettings({ settings, updateSetting }: SettingsSectionProps) {
    return (
        <div className="space-y-6">
            <SettingToggle
                label="Desktop notifications"
                description="Show notifications for new emails"
                checked={settings.desktopNotifications}
                onChange={(v) => updateSetting('desktopNotifications', v)}
            />
            <SettingToggle
                label="Notification sound"
                description="Play a sound when new emails arrive"
                checked={settings.notificationSound}
                onChange={(v) => updateSetting('notificationSound', v)}
            />
            <SettingToggle
                label="Notify only for priority senders"
                description="Only show notifications for emails from priority senders"
                checked={settings.notifyOnlyPriority}
                onChange={(v) => updateSetting('notifyOnlyPriority', v)}
            />
        </div>
    );
}

function SyncSettings({ settings, updateSetting }: SettingsSectionProps) {
    return (
        <div className="space-y-6">
            <SettingSelect
                label="Sync frequency"
                value={settings.syncFrequency}
                options={[
                    { value: 'realtime', label: 'Real-time (push)' },
                    { value: 'frequent', label: 'Every 5 minutes' },
                    { value: 'normal', label: 'Every 15 minutes' },
                    { value: 'manual', label: 'Manual only' },
                ]}
                onChange={(v) => updateSetting('syncFrequency', v as SparklesSettings['syncFrequency'])}
            />
            <SettingSelect
                label="Sync period"
                value={settings.syncPeriodDays.toString()}
                options={[
                    { value: '7', label: 'Last 7 days' },
                    { value: '30', label: 'Last 30 days' },
                    { value: '90', label: 'Last 3 months' },
                    { value: '365', label: 'Last year' },
                ]}
                onChange={(v) => updateSetting('syncPeriodDays', parseInt(v, 10) as SparklesSettings['syncPeriodDays'])}
            />
            <SettingToggle
                label="Auto-download attachments"
                description="Automatically download attachments for offline access"
                checked={settings.downloadAttachmentsAuto}
                onChange={(v) => updateSetting('downloadAttachmentsAuto', v)}
            />
        </div>
    );
}

// =============================================================================
// Setting Components
// =============================================================================

interface SettingToggleProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}

function SettingToggle({ label, description, checked, onChange }: SettingToggleProps) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div>
                <div className="text-sm font-medium text-[var(--glass-text-primary)]">{label}</div>
                {description && (
                    <div className="text-xs text-[var(--glass-text-tertiary)] mt-0.5">{description}</div>
                )}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={cn(
                    'relative w-11 h-6 rounded-full transition-colors duration-200',
                    checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--glass-surface)]'
                )}
            >
                <span
                    className={cn(
                        'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                        checked ? 'translate-x-6' : 'translate-x-1'
                    )}
                />
            </button>
        </div>
    );
}

interface SettingSelectProps {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}

function SettingSelect({ label, value, options, onChange }: SettingSelectProps) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-medium text-[var(--glass-text-primary)]">{label}</div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    'px-3 py-1.5 rounded-lg text-sm',
                    'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                    'text-[var(--glass-text-primary)]',
                    'focus:outline-none focus:border-[var(--color-accent)]'
                )}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default SparklesSettingsModal;
