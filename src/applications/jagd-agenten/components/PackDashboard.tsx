/**
 * Pack Dashboard Component
 *
 * Displays hunting pack overview with members, upcoming events,
 * and safety status for group hunting coordination.
 */

import React, { useEffect, useState } from 'react';
import {
    Users,
    Calendar,
    MapPin,
    Phone,
    Shield,
    Plus,
    ChevronRight,
    UserPlus,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Target,
    Crosshair,
} from 'lucide-react';
import { usePackStore, type PackEvent, type PackMember } from '@/stores/usePackStore';

// ============================================================================
// Event Type Config
// ============================================================================

const EVENT_TYPE_CONFIG: Record<PackEvent['type'], { label: string; color: string; icon: React.ReactNode }> = {
    drueckjagd: { label: 'Drückjagd', color: 'text-red-400 bg-red-500/10', icon: <Target className="w-4 h-4" /> },
    treibjagd: { label: 'Treibjagd', color: 'text-orange-400 bg-orange-500/10', icon: <Users className="w-4 h-4" /> },
    ansitz: { label: 'Ansitz', color: 'text-green-400 bg-green-500/10', icon: <Crosshair className="w-4 h-4" /> },
    pirsch: { label: 'Pirsch', color: 'text-teal-400 bg-teal-500/10', icon: <MapPin className="w-4 h-4" /> },
    meeting: { label: 'Versammlung', color: 'text-blue-400 bg-blue-500/10', icon: <Users className="w-4 h-4" /> },
    other: { label: 'Sonstiges', color: 'text-gray-400 bg-gray-500/10', icon: <Calendar className="w-4 h-4" /> },
};

// ============================================================================
// Sub-Components
// ============================================================================

function MemberCard({ member }: { member: PackMember }) {
    const roleLabels: Record<PackMember['role'], string> = {
        leader: 'Leiter',
        member: 'Mitglied',
        guest: 'Gast',
    };

    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg bg-[var(--glass-surface)] ${!member.isActive ? 'opacity-50' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-green-600/30 flex items-center justify-center text-green-400 font-bold">
                {member.name.charAt(0)}
            </div>
            <div className="flex-1">
                <p className="font-medium text-[var(--text-primary)]">{member.name}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{roleLabels[member.role]}</p>
            </div>
            {member.phone && (
                <a
                    href={`tel:${member.phone}`}
                    className="p-2 rounded-lg bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-active)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                    <Phone className="w-4 h-4" />
                </a>
            )}
        </div>
    );
}

function EventCard({ event, onClick }: { event: PackEvent; onClick: () => void }) {
    const typeConfig = EVENT_TYPE_CONFIG[event.type];
    const confirmed = event.participants.filter((p) => p.status === 'confirmed').length;
    const checkedIn = event.participants.filter((p) => p.checkedIn).length;

    return (
        <div
            onClick={onClick}
            className="p-4 rounded-xl bg-[var(--glass-bg-regular)] border border-[var(--glass-border)] hover:border-[var(--glass-surface-active)] transition-all cursor-pointer"
        >
            <div className="flex items-start justify-between mb-2">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${typeConfig.color}`}>
                    {typeConfig.icon}
                    <span>{typeConfig.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
            </div>

            <h3 className="font-semibold text-[var(--text-primary)] mb-1">{event.title}</h3>

            <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-3">
                <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(event.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {event.startTime}
                </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400">
                    {confirmed} bestätigt
                </span>
                {event.status === 'active' && (
                    <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
                        {checkedIn} eingecheckt
                    </span>
                )}
            </div>
        </div>
    );
}

function SafetyStatusCard({ event }: { event: PackEvent | null }) {
    if (!event || event.status !== 'active') {
        return (
            <div className="p-4 rounded-xl bg-[var(--glass-bg-regular)] border border-[var(--glass-border)] text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
                <p className="text-[var(--text-tertiary)] text-sm">Keine aktive Veranstaltung</p>
            </div>
        );
    }

    const total = event.participants.filter((p) => p.status === 'confirmed').length;
    const checkedIn = event.participants.filter((p) => p.checkedIn && !p.checkedOut).length;
    const checkedOut = event.participants.filter((p) => p.checkedOut).length;
    const allSafe = checkedIn === 0 && checkedOut === total;

    return (
        <div className={`p-4 rounded-xl border ${allSafe ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
            <div className="flex items-center gap-2 mb-3">
                {allSafe ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                    <Shield className="w-5 h-5 text-yellow-400" />
                )}
                <span className="font-semibold text-[var(--text-primary)]">Sicherheitsstatus</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-[var(--glass-surface)]">
                    <p className="text-lg font-bold text-blue-400">{checkedIn}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Aktiv</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--glass-surface)]">
                    <p className="text-lg font-bold text-green-400">{checkedOut}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Ausgecheckt</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--glass-surface)]">
                    <p className="text-lg font-bold text-[var(--text-secondary)]">{total - checkedIn - checkedOut}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Ausstehend</p>
                </div>
            </div>

            {!allSafe && event.participants.filter((p) => p.checkedIn && !p.checkedOut).length > 0 && (
                <div className="mt-3 p-2 rounded-lg bg-[var(--glass-surface)]">
                    <p className="text-xs text-[var(--text-secondary)] mb-2">Noch im Feld:</p>
                    <div className="flex flex-wrap gap-1">
                        {event.participants
                            .filter((p) => p.checkedIn && !p.checkedOut)
                            .map((p) => (
                                <span key={p.memberId} className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs">
                                    {p.memberName}
                                </span>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function PackDashboard() {
    const {
        packs,
        currentPack,
        packsLoading,
        events,
        eventsLoading,
        alerts,
        fetchPacks,
        fetchPack,
        fetchEvents,
        fetchAlerts,
    } = usePackStore();

    const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
    // selectedEventId reserved for future event detail modal

    useEffect(() => {
        fetchPacks();
    }, [fetchPacks]);

    useEffect(() => {
        if (packs.length > 0 && !selectedPackId) {
            setSelectedPackId(packs[0].id);
        }
    }, [packs, selectedPackId]);

    useEffect(() => {
        if (selectedPackId) {
            fetchPack(selectedPackId);
            fetchEvents(selectedPackId);
            fetchAlerts(selectedPackId);
        }
    }, [selectedPackId, fetchPack, fetchEvents, fetchAlerts]);

    const upcomingEvents = events.filter((e) => e.status === 'planned' || e.status === 'active');
    const activeEvent = events.find((e) => e.status === 'active');

    if (packsLoading && packs.length === 0) {
        return (
            <div className="flex items-center justify-center h-full py-12">
                <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (packs.length === 0) {
        return (
            <div className="p-6 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-[var(--text-tertiary)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Kein Rudel vorhanden</h2>
                <p className="text-[var(--text-secondary)] mb-6">Erstellen Sie ein Rudel, um mit der Gruppenkoordination zu beginnen.</p>
                <button className="flex items-center gap-2 px-6 py-3 mx-auto rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium transition-all">
                    <Plus className="w-5 h-5" />
                    Rudel erstellen
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">{currentPack?.name || 'Rudel'}</h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        {currentPack?.revier && `Revier ${currentPack.revier}`}
                        {currentPack?.bundesland && ` · ${currentPack.bundesland}`}
                    </p>
                </div>

                {packs.length > 1 && (
                    <select
                        value={selectedPackId || ''}
                        onChange={(e) => setSelectedPackId(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)] text-sm"
                    >
                        {packs.map((pack) => (
                            <option key={pack.id} value={pack.id} className="bg-gray-900">
                                {pack.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Emergency Alerts */}
            {alerts.length > 0 && (
                <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40">
                    <div className="flex items-center gap-2 text-red-300 mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-semibold">Aktive Warnungen</span>
                    </div>
                    {alerts.slice(0, 2).map((alert) => (
                        <div key={alert.id} className="p-2 rounded-lg bg-[var(--glass-surface)] mb-2">
                            <p className="text-[var(--text-primary)] font-medium">{alert.message}</p>
                            <p className="text-xs text-red-300">
                                Von {alert.senderName} · {new Date(alert.createdAt).toLocaleTimeString('de-DE')}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Members */}
                <div className="bg-[var(--glass-bg-regular)] backdrop-blur-md rounded-xl border border-[var(--glass-border)] p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                            <Users className="w-5 h-5 text-green-400" />
                            Mitglieder
                        </h2>
                        <button className="p-2 rounded-lg bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-active)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                            <UserPlus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {currentPack?.members
                            .filter((m) => m.isActive)
                            .map((member) => (
                                <MemberCard key={member.id} member={member} />
                            ))}
                    </div>

                    <p className="text-xs text-[var(--text-tertiary)] mt-3">
                        {currentPack?.members.filter((m) => m.isActive).length} aktive Mitglieder
                    </p>
                </div>

                {/* Middle Column: Events */}
                <div className="bg-[var(--glass-bg-regular)] backdrop-blur-md rounded-xl border border-[var(--glass-border)] p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            Veranstaltungen
                        </h2>
                        <button className="p-2 rounded-lg bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-active)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {eventsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                        </div>
                    ) : upcomingEvents.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingEvents.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    onClick={() => console.log('Event selected:', event.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-[var(--text-tertiary)]">
                            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Keine anstehenden Veranstaltungen</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Safety */}
                <div className="space-y-4">
                    <SafetyStatusCard event={activeEvent || null} />

                    <button className="w-full p-4 rounded-xl bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 transition-all text-left">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                            <div>
                                <p className="font-semibold text-[var(--text-primary)]">Notfall melden</p>
                                <p className="text-xs text-red-300">Alle Mitglieder benachrichtigen</p>
                            </div>
                        </div>
                    </button>

                    <div className="p-4 rounded-xl bg-[var(--glass-bg-regular)] border border-[var(--glass-border)]">
                        <h3 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-green-400" />
                            Notfallkontakte
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-[var(--text-secondary)]">Notruf</span>
                                <a href="tel:112" className="text-green-400">112</a>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--text-secondary)]">Polizei</span>
                                <a href="tel:110" className="text-green-400">110</a>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--text-secondary)]">Revierleiter</span>
                                <a href="tel:+4917012345" className="text-green-400">Anrufen</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
