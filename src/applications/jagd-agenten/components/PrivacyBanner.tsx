/**
 * PrivacyBanner
 *
 * Displays privacy-related messaging throughout the app.
 * Key component of Phase D: Privacy & Trust.
 */

import { useState } from 'react';
import { Shield, X, Lock, Eye, EyeOff, Server, Smartphone } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PrivacyBannerProps {
    variant: 'weapon' | 'location' | 'document' | 'general';
    dismissible?: boolean;
    onDismiss?: () => void;
    className?: string;
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const PRIVACY_CONTENT = {
    weapon: {
        icon: Lock,
        title: 'Waffendaten-Schutz',
        message: 'Ihre Waffendaten bleiben auf Ihrem Gerät, sofern Sie kein Backup aktivieren.',
        detail: 'Gemäß WaffG §36 werden sensible Daten nur lokal gespeichert.',
    },
    location: {
        icon: Eye,
        title: 'Standort-Privatsphäre',
        message: 'Ihre genauen Jagdpositionen werden niemals mit Dritten geteilt.',
        detail: 'Standortdaten können optional unscharf oder gar nicht gespeichert werden.',
    },
    document: {
        icon: Shield,
        title: 'Dokumenten-Sicherheit',
        message: 'Jagdscheine und persönliche Dokumente sind verschlüsselt gespeichert.',
        detail: 'Ende-zu-Ende-Verschlüsselung mit Ihrem persönlichen Passwort.',
    },
    general: {
        icon: Smartphone,
        title: 'Ihre Daten, Ihre Kontrolle',
        message: 'Alle Daten können jederzeit exportiert oder vollständig gelöscht werden.',
        detail: 'Keine versteckten Backups, keine Weitergabe an Dritte.',
    },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PrivacyBanner({
    variant,
    dismissible = true,
    onDismiss,
    className = '',
}: PrivacyBannerProps) {
    const [isDismissed, setIsDismissed] = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    if (isDismissed) return null;

    const content = PRIVACY_CONTENT[variant];
    const Icon = content.icon;

    const handleDismiss = () => {
        setIsDismissed(true);
        onDismiss?.();
    };

    return (
        <div className={`
            rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4
            ${className}
        `}>
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Icon size={18} className="text-emerald-400" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-medium text-emerald-400">{content.title}</h4>
                        {dismissible && (
                            <button
                                onClick={handleDismiss}
                                className="ml-auto text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <p className="text-sm text-[var(--text-primary)] mt-1">
                        {content.message}
                    </p>

                    {showDetail && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-2 p-2 rounded bg-[var(--glass-surface)]">
                            {content.detail}
                        </p>
                    )}

                    <button
                        onClick={() => setShowDetail(!showDetail)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 mt-2"
                    >
                        {showDetail ? 'Weniger anzeigen' : 'Mehr erfahren'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Privacy Settings Section
// ---------------------------------------------------------------------------

interface PrivacySettingsProps {
    settings: {
        localOnlyMode: boolean;
        locationPrivacy: 'exact' | 'blurred' | 'none';
        encryptDocuments: boolean;
    };
    onChange: (settings: PrivacySettingsProps['settings']) => void;
}

export function PrivacySettings({ settings, onChange }: PrivacySettingsProps) {
    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Shield size={18} className="text-emerald-400" />
                Datenschutz-Einstellungen
            </h3>

            {/* Local Only Mode */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                <div className="flex items-center gap-3">
                    <Server size={18} className="text-[var(--text-tertiary)]" />
                    <div>
                        <div className="text-[var(--text-primary)]">Nur-Lokal-Modus</div>
                        <div className="text-xs text-[var(--text-tertiary)]">
                            Keine Daten werden synchronisiert
                        </div>
                    </div>
                </div>
                <input
                    type="checkbox"
                    checked={settings.localOnlyMode}
                    onChange={(e) => onChange({ ...settings, localOnlyMode: e.target.checked })}
                    className="w-5 h-5 rounded accent-emerald-500"
                />
            </label>

            {/* Location Privacy */}
            <div className="p-3 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                <div className="flex items-center gap-3 mb-3">
                    <Eye size={18} className="text-[var(--text-tertiary)]" />
                    <div className="text-[var(--text-primary)]">Standort-Speicherung</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { value: 'exact', label: 'Genau', icon: Eye },
                        { value: 'blurred', label: 'Unscharf', icon: EyeOff },
                        { value: 'none', label: 'Keine', icon: X },
                    ].map(({ value, label, icon: ItemIcon }) => (
                        <button
                            key={value}
                            onClick={() => onChange({ ...settings, locationPrivacy: value as 'exact' | 'blurred' | 'none' })}
                            className={`
                                p-2 rounded-lg text-sm flex flex-col items-center gap-1 transition-colors
                                ${settings.locationPrivacy === value
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-[var(--glass-surface-hover)] text-[var(--text-secondary)] border border-transparent'
                                }
                            `}
                        >
                            <ItemIcon size={16} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Document Encryption */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                <div className="flex items-center gap-3">
                    <Lock size={18} className="text-[var(--text-tertiary)]" />
                    <div>
                        <div className="text-[var(--text-primary)]">Dokumente verschlüsseln</div>
                        <div className="text-xs text-[var(--text-tertiary)]">
                            Passphrase-geschützte Verschlüsselung
                        </div>
                    </div>
                </div>
                <input
                    type="checkbox"
                    checked={settings.encryptDocuments}
                    onChange={(e) => onChange({ ...settings, encryptDocuments: e.target.checked })}
                    className="w-5 h-5 rounded accent-emerald-500"
                />
            </label>

            {/* Info Banner */}
            <PrivacyBanner variant="general" dismissible={false} />
        </div>
    );
}

export default PrivacyBanner;
