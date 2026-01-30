/**
 * ExpirationAlerts
 *
 * Banner component showing upcoming document expirations.
 * Displays in Daily Cockpit as a dismissible alert.
 */

import { useState, useEffect } from 'react';
import {
    AlertTriangle,
    Clock,
    FileText,
    X,
    ChevronRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExpirationAlert {
    documentId: string;
    documentName: string;
    docType: string;
    expiresAt: string;
    daysRemaining: number;
    alertLevel: 'info' | 'warning' | 'urgent' | 'critical';
}

interface ExpirationAlertsProps {
    onViewDocument?: (documentId: string) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALERT_STYLES = {
    critical: {
        bg: 'bg-red-500/20',
        border: 'border-red-500/50',
        text: 'text-red-400',
        icon: 'text-red-400',
    },
    urgent: {
        bg: 'bg-orange-500/20',
        border: 'border-orange-500/50',
        text: 'text-orange-400',
        icon: 'text-orange-400',
    },
    warning: {
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500/50',
        text: 'text-yellow-400',
        icon: 'text-yellow-400',
    },
    info: {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/50',
        text: 'text-blue-400',
        icon: 'text-blue-400',
    },
};

const DOC_TYPE_ICONS: Record<string, string> = {
    jagdschein: '🪪',
    waffenbesitzkarte: '🔫',
    versicherung: '📋',
    pachtvertrag: '📜',
    begehungsschein: '🎫',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDaysRemaining(days: number): string {
    if (days <= 0) return 'Abgelaufen!';
    if (days === 1) return 'Morgen';
    if (days < 7) return `${days} Tage`;
    if (days < 14) return '~1 Woche';
    if (days < 30) return '~2 Wochen';
    return '~1 Monat';
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ExpirationAlerts({ onViewDocument }: ExpirationAlertsProps) {
    const [alerts, setAlerts] = useState<ExpirationAlert[]>([]);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    // Fetch expiration alerts
    useEffect(() => {
        async function fetchAlerts() {
            try {
                const res = await fetch('/api/v1/jagd/vault/expirations');
                if (res.ok) {
                    const data = await res.json();
                    setAlerts(data.alerts || []);
                }
            } catch (error) {
                console.error('Failed to fetch expiration alerts:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchAlerts();
    }, []);

    // Get dismissed IDs from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('dismissed-expiration-alerts');
        if (stored) {
            try {
                const ids = JSON.parse(stored);
                setDismissedIds(new Set(ids));
            } catch {
                // Ignore invalid JSON
            }
        }
    }, []);

    const dismissAlert = (id: string) => {
        const newDismissed = new Set(dismissedIds);
        newDismissed.add(id);
        setDismissedIds(newDismissed);
        localStorage.setItem(
            'dismissed-expiration-alerts',
            JSON.stringify([...newDismissed])
        );
    };

    // Filter out dismissed alerts
    const visibleAlerts = alerts.filter(
        (a) => !dismissedIds.has(a.documentId) && a.daysRemaining <= 30
    );

    if (loading || visibleAlerts.length === 0) {
        return null;
    }

    // Show most urgent alert first
    const sortedAlerts = [...visibleAlerts].sort(
        (a, b) => a.daysRemaining - b.daysRemaining
    );
    const primaryAlert = sortedAlerts[0];
    const otherCount = sortedAlerts.length - 1;
    const styles = ALERT_STYLES[primaryAlert.alertLevel];

    return (
        <div
            className={`
                p-3 rounded-xl border ${styles.bg} ${styles.border}
                flex items-center gap-3
            `}
        >
            {/* Icon */}
            <div className={`shrink-0 ${styles.icon}`}>
                <AlertTriangle size={20} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span>{DOC_TYPE_ICONS[primaryAlert.docType] || '📄'}</span>
                    <span className={`font-medium ${styles.text}`}>
                        {primaryAlert.documentName}
                    </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Clock size={12} />
                    Läuft ab in: {formatDaysRemaining(primaryAlert.daysRemaining)}
                    {otherCount > 0 && (
                        <span className="ml-2 text-xs opacity-70">
                            +{otherCount} weitere
                        </span>
                    )}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
                {onViewDocument && (
                    <button
                        onClick={() => onViewDocument(primaryAlert.documentId)}
                        className={`
                            p-1.5 rounded-lg hover:bg-white/10 transition-colors
                            ${styles.text}
                        `}
                        title="Dokument anzeigen"
                    >
                        <ChevronRight size={18} />
                    </button>
                )}
                <button
                    onClick={() => dismissAlert(primaryAlert.documentId)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-[var(--text-secondary)]"
                    title="Ausblenden"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

/**
 * Compact badge showing count of expiring documents
 */
export function ExpirationBadge() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        async function fetchCount() {
            try {
                const res = await fetch('/api/v1/jagd/vault/expirations');
                if (res.ok) {
                    const data = await res.json();
                    const urgent = (data.alerts || []).filter(
                        (a: ExpirationAlert) => a.daysRemaining <= 14
                    );
                    setCount(urgent.length);
                }
            } catch {
                // Ignore
            }
        }
        fetchCount();
    }, []);

    if (count === 0) return null;

    return (
        <div className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium flex items-center gap-1">
            <FileText size={10} />
            {count}
        </div>
    );
}

export default ExpirationAlerts;
