/**
 * DrueckjagdPackGenerator
 *
 * Component for generating printable document packs for driven hunts (Drückjagd).
 * Includes event details, stand cards, participant list, and safety briefing.
 */

import { useState } from 'react';
import {
    FileText,
    Users,
    AlertTriangle,
    Download,
    Printer,
    Plus,
    Trash2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ParticipantRole = 'stand' | 'treiber' | 'hundefuehrer' | 'jagdleiter';

export interface DruckjagdParticipant {
    id: string;
    name: string;
    role: ParticipantRole;
    standNumber?: number;
    phone?: string;
}

export interface DruckjagdEvent {
    id: string;
    name: string;
    date: string;
    startTime: string;
    endTime?: string;
    location: string;
    meetingPoint: string;
    participants: DruckjagdParticipant[];
    emergencyContact: {
        name: string;
        phone: string;
    };
    notes?: string;
}

interface DrueckjagdPackGeneratorProps {
    event?: DruckjagdEvent;
    onGenerate?: (event: DruckjagdEvent) => void;
    className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<ParticipantRole, string> = {
    stand: 'Schütze',
    treiber: 'Treiber',
    hundefuehrer: 'Hundeführer',
    jagdleiter: 'Jagdleiter',
};

const ROLE_COLORS: Record<ParticipantRole, string> = {
    stand: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    treiber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    hundefuehrer: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    jagdleiter: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const SAFETY_BRIEFING = `
SICHERHEITSBELEHRUNG DRÜCKJAGD

1. ALLGEMEINE REGELN
   • Niemals auf Treiberlinien oder in unbekannte Richtungen schießen
   • Schüsse nur freigeben, wenn Kugelfang gesichert ist
   • Wildbretverwertung hat Vorrang vor Trophäe

2. STAND-VERHALTEN
   • Stand erst nach Signal des Jagdleiters verlassen
   • Waffe erst bei Erreichen des Standes laden
   • Schussfeld vor Jagdbeginn prüfen

3. NOTFALL
   • Bei Unfall: SOFORT Jagdleiter informieren
   • Notfallnummer: 112
   • Sammelplatz: siehe Karte

4. SIGNALE
   • 1× Horn = Jagd beginnt
   • 2× Horn = Jagd unterbrochen
   • 3× Horn = Jagd beendet

WAIDMANNSHEIL!
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DrueckjagdPackGenerator({
    event: initialEvent,
    onGenerate,
    className = '',
}: DrueckjagdPackGeneratorProps) {
    const [event, setEvent] = useState<DruckjagdEvent>(
        initialEvent || {
            id: `dj-${Date.now()}`,
            name: '',
            date: new Date().toISOString().split('T')[0],
            startTime: '08:00',
            location: '',
            meetingPoint: '',
            participants: [],
            emergencyContact: { name: '', phone: '' },
        }
    );

    const [newParticipant, setNewParticipant] = useState({
        name: '',
        role: 'stand' as ParticipantRole,
        phone: '',
    });

    const addParticipant = () => {
        if (!newParticipant.name.trim()) return;

        const standCount = event.participants.filter(p => p.role === 'stand').length;

        setEvent({
            ...event,
            participants: [
                ...event.participants,
                {
                    id: `p-${Date.now()}`,
                    name: newParticipant.name,
                    role: newParticipant.role,
                    standNumber: newParticipant.role === 'stand' ? standCount + 1 : undefined,
                    phone: newParticipant.phone || undefined,
                },
            ],
        });

        setNewParticipant({ name: '', role: 'stand', phone: '' });
    };

    const removeParticipant = (id: string) => {
        setEvent({
            ...event,
            participants: event.participants.filter(p => p.id !== id),
        });
    };

    const generatePack = () => {
        const content = generatePackHTML(event);
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        // Open in new tab for printing
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
            printWindow.onload = () => {
                printWindow.print();
            };
        }

        onGenerate?.(event);
    };

    const standCount = event.participants.filter(p => p.role === 'stand').length;
    const treiberCount = event.participants.filter(p => p.role === 'treiber').length;
    const isValid = event.name && event.date && event.location && event.participants.length > 0;

    return (
        <div className={`rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface)] ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-[var(--glass-border)]">
                <div className="flex items-center gap-2">
                    <FileText size={20} className="text-purple-400" />
                    <h2 className="font-semibold text-[var(--text-primary)]">Drückjagd-Paket erstellen</h2>
                </div>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">
                    Standkarten, Teilnehmerliste & Sicherheitsbelehrung
                </p>
            </div>

            {/* Event Details */}
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs text-[var(--text-tertiary)] mb-1">Jagdname</label>
                        <input
                            type="text"
                            value={event.name}
                            onChange={(e) => setEvent({ ...event, name: e.target.value })}
                            placeholder="z.B. Herbstdrückjagd 2026"
                            className="w-full px-3 py-2 rounded-lg bg-[var(--glass-surface-hover)] border border-[var(--glass-border)] text-[var(--text-primary)]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-[var(--text-tertiary)] mb-1">Datum</label>
                        <input
                            type="date"
                            value={event.date}
                            onChange={(e) => setEvent({ ...event, date: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--glass-surface-hover)] border border-[var(--glass-border)] text-[var(--text-primary)]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-[var(--text-tertiary)] mb-1">Beginn</label>
                        <input
                            type="time"
                            value={event.startTime}
                            onChange={(e) => setEvent({ ...event, startTime: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--glass-surface-hover)] border border-[var(--glass-border)] text-[var(--text-primary)]"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs text-[var(--text-tertiary)] mb-1">Revier / Ort</label>
                        <input
                            type="text"
                            value={event.location}
                            onChange={(e) => setEvent({ ...event, location: e.target.value })}
                            placeholder="z.B. Revier Schwarzwald-Nord"
                            className="w-full px-3 py-2 rounded-lg bg-[var(--glass-surface-hover)] border border-[var(--glass-border)] text-[var(--text-primary)]"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs text-[var(--text-tertiary)] mb-1">Treffpunkt</label>
                        <input
                            type="text"
                            value={event.meetingPoint}
                            onChange={(e) => setEvent({ ...event, meetingPoint: e.target.value })}
                            placeholder="z.B. Parkplatz am Waldrand, Koordinaten..."
                            className="w-full px-3 py-2 rounded-lg bg-[var(--glass-surface-hover)] border border-[var(--glass-border)] text-[var(--text-primary)]"
                        />
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={16} className="text-red-400" />
                        <span className="text-sm font-medium text-red-400">Notfallkontakt</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="text"
                            value={event.emergencyContact.name}
                            onChange={(e) => setEvent({
                                ...event,
                                emergencyContact: { ...event.emergencyContact, name: e.target.value }
                            })}
                            placeholder="Name"
                            className="px-3 py-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)] text-sm"
                        />
                        <input
                            type="tel"
                            value={event.emergencyContact.phone}
                            onChange={(e) => setEvent({
                                ...event,
                                emergencyContact: { ...event.emergencyContact, phone: e.target.value }
                            })}
                            placeholder="Telefon"
                            className="px-3 py-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)] text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Participants */}
            <div className="p-4 border-t border-[var(--glass-border)]">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-[var(--text-tertiary)]" />
                        <span className="font-medium text-[var(--text-primary)]">Teilnehmer</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                        <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">
                            {standCount} Schützen
                        </span>
                        <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400">
                            {treiberCount} Treiber
                        </span>
                    </div>
                </div>

                {/* Add Participant */}
                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={newParticipant.name}
                        onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                        placeholder="Name"
                        className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-surface-hover)] border border-[var(--glass-border)] text-[var(--text-primary)] text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                    />
                    <select
                        value={newParticipant.role}
                        onChange={(e) => setNewParticipant({ ...newParticipant, role: e.target.value as ParticipantRole })}
                        className="px-3 py-2 rounded-lg bg-[var(--glass-surface-hover)] border border-[var(--glass-border)] text-[var(--text-primary)] text-sm"
                    >
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                    <button
                        onClick={addParticipant}
                        disabled={!newParticipant.name.trim()}
                        className="px-3 py-2 rounded-lg bg-emerald-500 text-white disabled:opacity-50"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                {/* Participant List */}
                <div className="space-y-1 max-h-48 overflow-y-auto">
                    {event.participants.map((p) => (
                        <div
                            key={p.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-[var(--glass-surface-hover)]"
                        >
                            <div className="flex items-center gap-2">
                                {p.standNumber && (
                                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">
                                        {p.standNumber}
                                    </span>
                                )}
                                <span className="text-[var(--text-primary)]">{p.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded border ${ROLE_COLORS[p.role]}`}>
                                    {ROLE_LABELS[p.role]}
                                </span>
                            </div>
                            <button
                                onClick={() => removeParticipant(p.id)}
                                className="text-[var(--text-tertiary)] hover:text-red-400"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {event.participants.length === 0 && (
                        <p className="text-center text-sm text-[var(--text-tertiary)] py-4">
                            Noch keine Teilnehmer hinzugefügt
                        </p>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-[var(--glass-border)] flex gap-2">
                <button
                    onClick={generatePack}
                    disabled={!isValid}
                    className="flex-1 py-3 rounded-xl bg-purple-500 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-purple-600 transition-colors"
                >
                    <Printer size={18} />
                    Paket drucken
                </button>
                <button
                    onClick={() => {
                        const content = generatePackHTML(event);
                        const blob = new Blob([content], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `drueckjagd-${event.date}.html`;
                        a.click();
                    }}
                    disabled={!isValid}
                    className="px-4 py-3 rounded-xl bg-[var(--glass-surface-hover)] border border-[var(--glass-border)] text-[var(--text-primary)] disabled:opacity-50"
                >
                    <Download size={18} />
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// HTML Generator
// ---------------------------------------------------------------------------

function generatePackHTML(event: DruckjagdEvent): string {
    const stands = event.participants.filter(p => p.role === 'stand');
    const treiber = event.participants.filter(p => p.role === 'treiber');
    const hundefuehrer = event.participants.filter(p => p.role === 'hundefuehrer');
    // Note: jagdleiter role used for display in participant table

    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>${event.name} - Drückjagd-Paket</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.4; }
        .page { page-break-after: always; padding: 20mm; }
        .page:last-child { page-break-after: avoid; }
        h1 { font-size: 18pt; margin-bottom: 10mm; border-bottom: 2px solid #333; padding-bottom: 5mm; }
        h2 { font-size: 14pt; margin: 8mm 0 4mm; color: #444; }
        table { width: 100%; border-collapse: collapse; margin: 5mm 0; }
        th, td { border: 1px solid #ccc; padding: 3mm; text-align: left; }
        th { background: #f5f5f5; }
        .stand-card { border: 2px solid #333; padding: 10mm; margin: 5mm 0; page-break-inside: avoid; }
        .stand-number { font-size: 48pt; font-weight: bold; text-align: center; }
        .safety { white-space: pre-line; font-family: monospace; font-size: 10pt; }
        .emergency { background: #fee; border: 2px solid #c00; padding: 5mm; margin: 5mm 0; }
        @media print {
            .page { page-break-after: always; }
        }
    </style>
</head>
<body>
    <!-- Cover Page -->
    <div class="page">
        <h1>🦌 ${event.name}</h1>
        <table>
            <tr><th width="30%">Datum</th><td>${formatDateGerman(event.date)}</td></tr>
            <tr><th>Beginn</th><td>${event.startTime} Uhr</td></tr>
            <tr><th>Revier</th><td>${event.location}</td></tr>
            <tr><th>Treffpunkt</th><td>${event.meetingPoint}</td></tr>
        </table>
        
        <div class="emergency">
            <strong>⚠️ NOTFALLKONTAKT</strong><br>
            ${event.emergencyContact.name}: ${event.emergencyContact.phone}<br>
            Notruf: 112
        </div>
        
        <h2>Teilnehmer (${event.participants.length})</h2>
        <table>
            <tr><th>Nr.</th><th>Name</th><th>Rolle</th><th>Telefon</th></tr>
            ${event.participants.map((p) => `
                <tr>
                    <td>${p.standNumber || '-'}</td>
                    <td>${p.name}</td>
                    <td>${ROLE_LABELS[p.role]}</td>
                    <td>${p.phone || '-'}</td>
                </tr>
            `).join('')}
        </table>
        
        <h2>Übersicht</h2>
        <p>${stands.length} Schützen · ${treiber.length} Treiber · ${hundefuehrer.length} Hundeführer</p>
    </div>
    
    <!-- Safety Briefing -->
    <div class="page">
        <h1>⚠️ Sicherheitsbelehrung</h1>
        <pre class="safety">${SAFETY_BRIEFING}</pre>
        
        <h2 style="margin-top: 20mm;">Unterschrift Jagdleiter</h2>
        <p style="margin-top: 15mm; border-top: 1px solid #000; width: 60%;">
            Datum, Unterschrift
        </p>
    </div>
    
    <!-- Stand Cards -->
    ${stands.map(s => `
        <div class="page">
            <div class="stand-card">
                <div class="stand-number">${s.standNumber}</div>
                <h2 style="text-align: center; margin: 5mm 0;">${s.name}</h2>
                <table>
                    <tr><th>Jagd</th><td>${event.name}</td></tr>
                    <tr><th>Datum</th><td>${formatDateGerman(event.date)}</td></tr>
                    <tr><th>Stand-Nr.</th><td>${s.standNumber}</td></tr>
                </table>
                <p style="margin-top: 10mm; font-size: 10pt; color: #666;">
                    Bitte diese Karte während der Jagd am Stand aufbewahren.
                </p>
            </div>
        </div>
    `).join('')}
</body>
</html>
    `;
}

function formatDateGerman(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

export default DrueckjagdPackGenerator;
