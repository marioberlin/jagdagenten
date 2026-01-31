/**
 * Analytics Dashboard Component
 *
 * Shows key metrics: hunt completion, safety adoption, trust signals.
 */


import { Target, Shield, Heart, Calendar } from 'lucide-react';
import { useAnalyticsSummary } from '../stores/analyticsStore';

export function AnalyticsDashboard() {
    const { hunts, safety, trust } = useAnalyticsSummary();

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Nutzungs-Statistiken
            </h2>

            {/* Hunt Metrics */}
            <div className="bg-[var(--glass-surface)] rounded-xl border border-[var(--glass-border)] p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-900/30 rounded-lg">
                        <Target className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="font-medium text-[var(--text-primary)]">
                        Jagden
                    </h3>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <MetricCard
                        label="Gestartet"
                        value={hunts.started}
                        suffix="Jagden"
                    />
                    <MetricCard
                        label="Abgeschlossen"
                        value={hunts.completed}
                        suffix="Jagden"
                    />
                    <MetricCard
                        label="Abschlussrate"
                        value={hunts.completionRate}
                        suffix="%"
                        highlight
                    />
                </div>

                {hunts.lastHunt && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <Calendar className="w-4 h-4" />
                        Letzte Jagd: {new Date(hunts.lastHunt).toLocaleDateString('de-DE')}
                    </div>
                )}
            </div>

            {/* Safety Metrics */}
            <div className="bg-[var(--glass-surface)] rounded-xl border border-[var(--glass-border)] p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-900/30 rounded-lg">
                        <Shield className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="font-medium text-[var(--text-primary)]">
                        Sicherheit
                    </h3>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <MetricCard
                        label="Events"
                        value={safety.events}
                        suffix="gesamt"
                    />
                    <MetricCard
                        label="Check-In"
                        value={safety.checkInRate}
                        suffix="%"
                    />
                    <MetricCard
                        label="Safety-Rate"
                        value={safety.adoptionRate}
                        suffix="%"
                        highlight
                    />
                </div>
            </div>

            {/* Trust Metrics */}
            <div className="bg-[var(--glass-surface)] rounded-xl border border-[var(--glass-border)] p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-900/30 rounded-lg">
                        <Heart className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="font-medium text-[var(--text-primary)]">
                        Vertrauen & Community
                    </h3>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <MetricCard
                        label="Sichtungen"
                        value={trust.sightingsShared}
                        suffix="geteilt"
                    />
                    <MetricCard
                        label="Stories"
                        value={trust.storiesPublished}
                        suffix="veröffentlicht"
                    />
                    <MetricCard
                        label="Sharing-Rate"
                        value={trust.sharingRate}
                        suffix="%"
                        highlight
                    />
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm">
                    {trust.insightsOptIn ? (
                        <span className="text-green-400">
                            ✓ Insights-Beitrag aktiviert
                        </span>
                    ) : (
                        <span className="text-[var(--text-secondary)]">
                            Insights-Beitrag deaktiviert
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

interface MetricCardProps {
    label: string;
    value: number;
    suffix?: string;
    highlight?: boolean;
}

function MetricCard({ label, value, suffix, highlight }: MetricCardProps) {
    return (
        <div className="text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-1">
                {label}
            </p>
            <p
                className={`text-2xl font-bold ${highlight
                    ? 'text-green-400'
                    : 'text-[var(--text-primary)]'
                    }`}
            >
                {value}
                {suffix && <span className="text-sm font-normal ml-1">{suffix}</span>}
            </p>
        </div>
    );
}
