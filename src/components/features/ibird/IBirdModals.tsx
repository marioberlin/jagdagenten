/**
 * iBird Modals
 *
 * Settings, Add Account, and other modal dialogs for iBird.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Settings,
  Mail,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  Bell,
} from 'lucide-react';
import { useIBirdStore } from '@/stores/ibirdStore';
import { useSettingsApi, useMailApi } from './hooks/useIBirdApi';
import { cn } from '@/lib/utils';

// =============================================================================
// Add Account Modal
// =============================================================================

function AddAccountModal({ onClose }: { onClose: () => void }) {
  const { createAccount } = useMailApi();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGmailOAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Initiate Gmail OAuth flow
      // In a real implementation, this would:
      // 1. Open a popup or redirect to Google's OAuth consent screen
      // 2. User grants permission
      // 3. Receive auth code and exchange for tokens
      // 4. Create account with OAuth tokens

      // For now, simulate the OAuth flow
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (!clientId) {
        // Demo mode - show what would happen
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Create a mock account for demo purposes
        await createAccount({
          email: 'demo@gmail.com',
          displayName: 'Demo User',
          provider: 'gmail',
          imapHost: 'imap.gmail.com',
          imapPort: 993,
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          authType: 'oauth2' as const,
        });

        onClose();
        return;
      }

      // Real OAuth flow
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const scope = encodeURIComponent('https://mail.google.com/ https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile');
      const state = crypto.randomUUID();

      // Store state for verification
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_callback', 'ibird_add_account');

      // Redirect to Google OAuth
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;

      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Gmail');
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--glass-text-primary)]">
          Add Email Account
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--glass-surface-hover)] transition-colors"
        >
          <X className="w-5 h-5 text-[var(--glass-text-secondary)]" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <p className="text-sm text-[var(--glass-text-secondary)]">
          Connect your Gmail account to get started with your inbox, calendar, and appointments.
        </p>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-500">{error}</span>
          </div>
        )}

        {/* Gmail OAuth Button */}
        <button
          onClick={handleGmailOAuth}
          disabled={isLoading}
          className={cn(
            'w-full p-4 rounded-xl border border-[var(--glass-border)]',
            'bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-hover)]',
            'transition-all duration-150',
            'flex items-center gap-4',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
          )}
          <div className="flex-1 text-left">
            <span className="block font-semibold text-[var(--glass-text-primary)]">
              {isLoading ? 'Connecting...' : 'Sign in with Google'}
            </span>
            <span className="block text-sm text-[var(--glass-text-secondary)]">
              Connect your Gmail account securely with OAuth
            </span>
          </div>
        </button>

        {/* Info */}
        <div className="pt-4 border-t border-[var(--glass-border)]">
          <p className="text-xs text-[var(--glass-text-tertiary)] text-center">
            We'll only request access to read and send emails on your behalf.
            <br />
            You can revoke access at any time from your Google Account settings.
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Settings Modal
// =============================================================================

type SettingsTab = 'general' | 'mail' | 'calendar' | 'appointments' | 'notifications';

function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useIBirdStore();
  const { saveSettings } = useSettingsApi();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSaving, setIsSaving] = useState(false);

  const tabs: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'mail', label: 'Mail', icon: Mail },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'appointments', label: 'Appointments', icon: Clock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-48 border-r border-[var(--glass-border)] p-4 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                activeTab === tab.id
                  ? 'bg-[var(--glass-accent)] text-white'
                  : 'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-surface-hover)]'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
          <h2 className="text-xl font-semibold text-[var(--glass-text-primary)]">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--glass-surface-hover)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--glass-text-secondary)]" />
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <GeneralSettings settings={settings} updateSettings={updateSettings} />
          )}
          {activeTab === 'mail' && (
            <MailSettings settings={settings} updateSettings={updateSettings} />
          )}
          {activeTab === 'calendar' && (
            <CalendarSettings settings={settings} updateSettings={updateSettings} />
          )}
          {activeTab === 'appointments' && (
            <AppointmentsSettings settings={settings} updateSettings={updateSettings} />
          )}
          {activeTab === 'notifications' && (
            <NotificationsSettings settings={settings} updateSettings={updateSettings} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--glass-border)]">
          <button
            onClick={onClose}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
              'hover:bg-[var(--glass-surface-hover)] transition-colors'
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium',
              'bg-[var(--glass-accent)] text-white',
              'hover:bg-[var(--glass-accent-hover)] transition-colors',
              'disabled:opacity-50'
            )}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Settings Sub-components
function GeneralSettings({ settings, updateSettings }: { settings: any; updateSettings: (s: any) => void }) {
  return (
    <div className="space-y-6">
      <SettingsSection title="Appearance">
        <SettingsRow label="Theme" description="Choose your preferred theme">
          <select
            value={settings.theme || 'system'}
            onChange={(e) => updateSettings({ ...settings, theme: e.target.value })}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm',
              'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
              'text-[var(--glass-text-primary)]'
            )}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Regional">
        <SettingsRow label="Timezone" description="Your local timezone">
          <select
            value={settings.timezone || 'America/New_York'}
            onChange={(e) => updateSettings({ ...settings, timezone: e.target.value })}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm',
              'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
              'text-[var(--glass-text-primary)]'
            )}
          >
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
          </select>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

function MailSettings({ settings, updateSettings }: { settings: any; updateSettings: (s: any) => void }) {
  return (
    <div className="space-y-6">
      <SettingsSection title="Compose">
        <SettingsRow label="Default signature" description="Signature added to new emails">
          <textarea
            value={settings.mailSignature || ''}
            onChange={(e) => updateSettings({ ...settings, mailSignature: e.target.value })}
            placeholder="Best regards,&#10;Your Name"
            rows={3}
            className={cn(
              'w-64 px-3 py-2 rounded-lg text-sm',
              'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
              'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]',
              'resize-none'
            )}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Sync">
        <SettingsRow label="Auto-sync interval" description="How often to check for new mail">
          <select
            value={settings.mailSyncInterval || 5}
            onChange={(e) => updateSettings({ ...settings, mailSyncInterval: parseInt(e.target.value) })}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm',
              'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
              'text-[var(--glass-text-primary)]'
            )}
          >
            <option value="1">Every minute</option>
            <option value="5">Every 5 minutes</option>
            <option value="15">Every 15 minutes</option>
            <option value="30">Every 30 minutes</option>
            <option value="0">Manual only</option>
          </select>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

function CalendarSettings({ settings, updateSettings }: { settings: any; updateSettings: (s: any) => void }) {
  return (
    <div className="space-y-6">
      <SettingsSection title="Display">
        <SettingsRow label="Week starts on" description="First day of the week">
          <select
            value={settings.calendarWeekStartsOn || 0}
            onChange={(e) => updateSettings({ ...settings, calendarWeekStartsOn: parseInt(e.target.value) })}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm',
              'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
              'text-[var(--glass-text-primary)]'
            )}
          >
            <option value="0">Sunday</option>
            <option value="1">Monday</option>
          </select>
        </SettingsRow>
        <SettingsRow label="Default view" description="Calendar view when opening">
          <select
            value={settings.calendarDefaultView || 'week'}
            onChange={(e) => updateSettings({ ...settings, calendarDefaultView: e.target.value })}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm',
              'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
              'text-[var(--glass-text-primary)]'
            )}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="agenda">Agenda</option>
          </select>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

function AppointmentsSettings({ settings, updateSettings }: { settings: any; updateSettings: (s: any) => void }) {
  return (
    <div className="space-y-6">
      <SettingsSection title="Booking Page">
        <SettingsRow label="Username" description="Your booking page URL">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--glass-text-tertiary)]">
              {window.location.origin}/book/
            </span>
            <input
              type="text"
              value={settings.appointmentsBookingPageUsername || ''}
              onChange={(e) => updateSettings({ ...settings, appointmentsBookingPageUsername: e.target.value })}
              placeholder="username"
              className={cn(
                'w-32 px-3 py-1.5 rounded-lg text-sm',
                'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]'
              )}
            />
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Defaults">
        <SettingsRow label="Buffer time" description="Time between appointments">
          <select
            value={settings.appointmentsDefaultBuffer || 0}
            onChange={(e) => updateSettings({ ...settings, appointmentsDefaultBuffer: parseInt(e.target.value) })}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm',
              'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
              'text-[var(--glass-text-primary)]'
            )}
          >
            <option value="0">No buffer</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
          </select>
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

function NotificationsSettings({ settings, updateSettings }: { settings: any; updateSettings: (s: any) => void }) {
  return (
    <div className="space-y-6">
      <SettingsSection title="Email Notifications">
        <SettingsToggle
          label="New email notifications"
          description="Get notified when you receive new mail"
          checked={settings.notifyNewMail ?? true}
          onChange={(checked) => updateSettings({ ...settings, notifyNewMail: checked })}
        />
      </SettingsSection>

      <SettingsSection title="Calendar Notifications">
        <SettingsToggle
          label="Event reminders"
          description="Remind me before events start"
          checked={settings.notifyEventReminder ?? true}
          onChange={(checked) => updateSettings({ ...settings, notifyEventReminder: checked })}
        />
        <SettingsRow label="Default reminder time" description="How early to remind">
          <select
            value={settings.eventReminderMinutes || 15}
            onChange={(e) => updateSettings({ ...settings, eventReminderMinutes: parseInt(e.target.value) })}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm',
              'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
              'text-[var(--glass-text-primary)]'
            )}
          >
            <option value="5">5 minutes before</option>
            <option value="10">10 minutes before</option>
            <option value="15">15 minutes before</option>
            <option value="30">30 minutes before</option>
            <option value="60">1 hour before</option>
          </select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Appointment Notifications">
        <SettingsToggle
          label="New booking notifications"
          description="Get notified when someone books time with you"
          checked={settings.notifyNewBooking ?? true}
          onChange={(checked) => updateSettings({ ...settings, notifyNewBooking: checked })}
        />
      </SettingsSection>
    </div>
  );
}

// Reusable Settings Components
function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-[var(--glass-text-secondary)] uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-[var(--glass-text-primary)]">{label}</p>
        {description && (
          <p className="text-xs text-[var(--glass-text-tertiary)]">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function SettingsToggle({ label, description, checked, onChange }: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-[var(--glass-text-primary)]">{label}</p>
        {description && (
          <p className="text-xs text-[var(--glass-text-tertiary)]">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'w-10 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-[var(--glass-accent)]' : 'bg-[var(--glass-surface-hover)]'
        )}
      >
        <div
          className={cn(
            'w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
            'ml-1',
            checked && 'translate-x-4'
          )}
        />
      </button>
    </div>
  );
}

// =============================================================================
// Main Modal Container
// =============================================================================

export function IBirdModals() {
  const { ui, closeModal } = useIBirdStore();

  if (!ui.activeModal) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={closeModal}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'relative z-10 rounded-2xl overflow-hidden',
            'bg-[var(--glass-bg)] backdrop-blur-2xl',
            'border border-[var(--glass-border)]',
            'shadow-2xl',
            ui.activeModal === 'settings' ? 'w-[700px] h-[500px]' : 'w-[450px]'
          )}
        >
          {ui.activeModal === 'add-account' && (
            <AddAccountModal onClose={closeModal} />
          )}
          {ui.activeModal === 'settings' && (
            <SettingsModal onClose={closeModal} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
