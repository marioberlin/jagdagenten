/**
 * Demo Data Settings Component
 *
 * Admin panel for seeding and clearing demo data.
 * Integrates with /api/v1/demo endpoints.
 */

import { useState } from 'react';
import { Database, Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface DemoStats {
    sessions: number;
    events: number;
    packEvents: number;
    feedPosts: number;
    moderationCases: number;
    equipment: number;
    activeSessions: number;
    totalHarvests: number;
}

interface DemoDataSettingsProps {
    onDataChange?: () => void;
}

export function DemoDataSettings({ onDataChange }: DemoDataSettingsProps) {
    const [stats, setStats] = useState<DemoStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/v1/demo/stats');
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (err) {
            console.error('Failed to fetch demo stats:', err);
        }
    };

    const seedData = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const res = await fetch('/api/v1/demo/seed', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setStatus({ type: 'success', message: 'Demo-Daten erfolgreich geladen!' });
                onDataChange?.();
            } else {
                setStatus({ type: 'error', message: data.error || 'Fehler beim Laden' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Netzwerkfehler' });
        } finally {
            setLoading(false);
        }
    };

    const clearData = async () => {
        if (!confirm('Möchten Sie wirklich alle Demo-Daten löschen?')) return;

        setLoading(true);
        setStatus(null);
        try {
            const res = await fetch('/api/v1/demo/clear', { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setStats(null);
                setStatus({ type: 'success', message: 'Demo-Daten gelöscht!' });
                onDataChange?.();
            } else {
                setStatus({ type: 'error', message: data.error || 'Fehler beim Löschen' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Netzwerkfehler' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-[var(--glass-surface)] rounded-xl border border-[var(--glass-border)] space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Database className="text-[var(--text-secondary)]" size={20} />
                    <h3 className="font-semibold text-[var(--text-primary)]">Demo-Daten</h3>
                </div>
                <button
                    onClick={fetchStats}
                    className="p-1.5 rounded-lg hover:bg-[var(--glass-surface)] transition-colors"
                    title="Status aktualisieren"
                >
                    <RefreshCw size={16} className="text-[var(--text-secondary)]" />
                </button>
            </div>

            {/* Stats Display */}
            {stats && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-[var(--glass-surface)] rounded-lg">
                        <div className="text-[var(--text-secondary)]">Jagdsessions</div>
                        <div className="font-semibold text-[var(--text-primary)]">
                            {stats.sessions} ({stats.activeSessions} aktiv)
                        </div>
                    </div>
                    <div className="p-2 bg-[var(--glass-surface)] rounded-lg">
                        <div className="text-[var(--text-secondary)]">Ereignisse</div>
                        <div className="font-semibold text-[var(--text-primary)]">
                            {stats.events} ({stats.totalHarvests} Erlegungen)
                        </div>
                    </div>
                    <div className="p-2 bg-[var(--glass-surface)] rounded-lg">
                        <div className="text-[var(--text-secondary)]">Rudel-Events</div>
                        <div className="font-semibold text-[var(--text-primary)]">{stats.packEvents}</div>
                    </div>
                    <div className="p-2 bg-[var(--glass-surface)] rounded-lg">
                        <div className="text-[var(--text-secondary)]">Feed-Beiträge</div>
                        <div className="font-semibold text-[var(--text-primary)]">{stats.feedPosts}</div>
                    </div>
                </div>
            )}

            {/* Status Message */}
            {status && (
                <div
                    className={`flex items-center gap-2 p-3 rounded-lg text-sm ${status.type === 'success'
                            ? 'bg-green-900/20 text-green-400'
                            : 'bg-red-900/20 text-red-400'
                        }`}
                >
                    {status.type === 'success' ? (
                        <CheckCircle size={16} />
                    ) : (
                        <AlertCircle size={16} />
                    )}
                    <span>{status.message}</span>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={seedData}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors"
                >
                    <Database size={16} />
                    <span>Demo-Daten laden</span>
                </button>
                <button
                    onClick={clearData}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 disabled:opacity-50 text-red-400 font-medium rounded-lg transition-colors"
                >
                    <Trash2 size={16} />
                    <span>Löschen</span>
                </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
                Demo-Daten umfassen Jagdsessions, Timeline-Ereignisse, Feed-Beiträge und Ausrüstung
                zur UI-Demonstration.
            </p>
        </div>
    );
}

export default DemoDataSettings;
