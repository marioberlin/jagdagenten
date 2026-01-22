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
  Plus,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  Globe,
  Bell,
  Palette,
  User,
} from 'lucide-react';
import { useIBirdStore } from '@/stores/ibirdStore';
import { useSettingsApi, useMailApi } from './hooks/useIBirdApi';
import { cn } from '@/lib/utils';

// =============================================================================
// Add Account Modal
// =============================================================================

interface AddAccountFormData {
  email: string;
  password: string;
  displayName: string;
  provider: 'gmail' | 'outlook' | 'icloud' | 'other';
  imapHost?: string;
  imapPort?: number;
  smtpHost?: string;
  smtpPort?: number;
}

function AddAccountModal({ onClose }: { onClose: () => void }) {
  const { createAccount } = useMailApi();
  const [step, setStep] = useState<'provider' | 'credentials' | 'testing'>('provider');
  const [formData, setFormData] = useState<AddAccountFormData>({
    email: '',
    password: '',
    displayName: '',
    provider: 'gmail',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const providers = [
    { id: 'gmail', name: 'Gmail', icon: '📧', color: 'from-red-500 to-yellow-500' },
    { id: 'outlook', name: 'Outlook', icon: '📬', color: 'from-blue-500 to-cyan-500' },
    { id: 'icloud', name: 'iCloud', icon: '☁️', color: 'from-blue-400 to-gray-400' },
    { id: 'other', name: 'Other (IMAP)', icon: '📮', color: 'from-gray-500 to-gray-600' },
  ];

  const handleProviderSelect = (provider: AddAccountFormData['provider']) => {
    setFormData({ ...formData, provider });
    setStep('credentials');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setStep('testing');

    try {
      // In a real app, this would validate credentials with the mail server
      await createAccount({
        email: formData.email,
        displayName: formData.displayName || formData.email.split('@')[0],
        provider: formData.provider,
        imapHost: formData.imapHost || getDefaultImapHost(formData.provider),
        imapPort: formData.imapPort || 993,
        smtpHost: formData.smtpHost || getDefaultSmtpHost(formData.provider),
        smtpPort: formData.smtpPort || 587,
        authType: 'password' as const,
        password: formData.password,
      });

      // Success - close modal
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add account');
      setStep('credentials');
    } finally {
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

      {/* Step: Provider Selection */}
      {step === 'provider' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--glass-text-secondary)]">
            Choose your email provider to get started.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleProviderSelect(provider.id as AddAccountFormData['provider'])}
                className={cn(
                  'p-4 rounded-xl border border-[var(--glass-border)]',
                  'bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-hover)]',
                  'transition-all duration-150 text-left'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center mb-2',
                  'bg-gradient-to-br', provider.color
                )}>
                  <span className="text-xl">{provider.icon}</span>
                </div>
                <span className="font-medium text-[var(--glass-text-primary)]">
                  {provider.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Credentials */}
      {step === 'credentials' && (
        <div className="space-y-4">
          <button
            onClick={() => setStep('provider')}
            className="text-sm text-[var(--glass-accent)] hover:underline"
          >
            ← Back to providers
          </button>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-500">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className={cn(
                  'w-full px-3 py-2 rounded-lg',
                  'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                  'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]/50'
                )}
              />
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1">
                Display Name (optional)
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Your Name"
                className={cn(
                  'w-full px-3 py-2 rounded-lg',
                  'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                  'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]/50'
                )}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1">
                Password / App Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  className={cn(
                    'w-full px-3 py-2 pr-10 rounded-lg',
                    'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                    'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]/50'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--glass-surface-hover)] rounded"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
                  ) : (
                    <Eye className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
                  )}
                </button>
              </div>
              {formData.provider === 'gmail' && (
                <p className="mt-1 text-xs text-[var(--glass-text-tertiary)]">
                  For Gmail, use an App Password. Enable 2FA and create one at{' '}
                  <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-[var(--glass-accent)] hover:underline">
                    Google Account
                  </a>
                </p>
              )}
            </div>

            {/* Custom IMAP/SMTP for 'other' provider */}
            {formData.provider === 'other' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1">
                      IMAP Host
                    </label>
                    <input
                      type="text"
                      value={formData.imapHost || ''}
                      onChange={(e) => setFormData({ ...formData, imapHost: e.target.value })}
                      placeholder="imap.example.com"
                      className={cn(
                        'w-full px-3 py-2 rounded-lg',
                        'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                        'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]',
                        'focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]/50'
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1">
                      IMAP Port
                    </label>
                    <input
                      type="number"
                      value={formData.imapPort || 993}
                      onChange={(e) => setFormData({ ...formData, imapPort: parseInt(e.target.value) })}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg',
                        'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                        'text-[var(--glass-text-primary)]',
                        'focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]/50'
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={formData.smtpHost || ''}
                      onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                      placeholder="smtp.example.com"
                      className={cn(
                        'w-full px-3 py-2 rounded-lg',
                        'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                        'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)]',
                        'focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]/50'
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      value={formData.smtpPort || 587}
                      onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg',
                        'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                        'text-[var(--glass-text-primary)]',
                        'focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]/50'
                      )}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!formData.email || !formData.password}
            className={cn(
              'w-full py-2.5 rounded-lg font-medium transition-all duration-150',
              'bg-[var(--glass-accent)] text-white',
              'hover:bg-[var(--glass-accent-hover)]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Add Account
          </button>
        </div>
      )}

      {/* Step: Testing */}
      {step === 'testing' && (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="w-8 h-8 text-[var(--glass-accent)] animate-spin" />
          <p className="text-[var(--glass-text-secondary)]">
            Connecting to mail server...
          </p>
        </div>
      )}
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
// Helper Functions
// =============================================================================

function getDefaultImapHost(provider: string): string {
  switch (provider) {
    case 'gmail': return 'imap.gmail.com';
    case 'outlook': return 'outlook.office365.com';
    case 'icloud': return 'imap.mail.me.com';
    default: return '';
  }
}

function getDefaultSmtpHost(provider: string): string {
  switch (provider) {
    case 'gmail': return 'smtp.gmail.com';
    case 'outlook': return 'smtp.office365.com';
    case 'icloud': return 'smtp.mail.me.com';
    default: return '';
  }
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
