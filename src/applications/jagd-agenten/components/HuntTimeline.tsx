/**
 * HuntTimeline Component
 *
 * Displays the active hunt session, allows starting/stopping hunts,
 * and shows a chronological timeline of events with an "Add Event" form.
 */

import { useEffect, useState } from 'react';
import {
  Play,
  Square,
  Plus,
  Clock,
  Crosshair,
  Target,
  FileText,
  Eye,
  Package,
  ArrowRightLeft,
} from 'lucide-react';
import { useHuntTimelineStore } from '@/stores/useHuntTimelineStore';
import type { TimelineEvent, HuntSession } from '@/stores/useHuntTimelineStore';

// ============================================================================
// Constants
// ============================================================================

const SESSION_TYPE_LABELS: Record<HuntSession['sessionType'], string> = {
  ansitz: 'Ansitz',
  pirsch: 'Pirsch',
  drueckjagd: 'Drueckjagd',
  other: 'Sonstige',
};

const EVENT_TYPE_OPTIONS: { value: TimelineEvent['eventType']; label: string }[] = [
  { value: 'sighting', label: 'Sichtung' },
  { value: 'shot', label: 'Schuss' },
  { value: 'harvest', label: 'Erlegung' },
  { value: 'note', label: 'Notiz' },
  { value: 'processing', label: 'Verarbeitung' },
  { value: 'handover', label: 'Uebergabe' },
];

const EVENT_TYPE_ICONS: Record<TimelineEvent['eventType'], typeof Eye> = {
  sighting: Eye,
  shot: Target,
  harvest: Crosshair,
  note: FileText,
  processing: Package,
  handover: ArrowRightLeft,
};

// ============================================================================
// Helpers
// ============================================================================

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function elapsedLabel(start: string): string {
  const ms = Date.now() - new Date(start).getTime();
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  if (hrs > 0) return `${hrs}h ${remainMins}m`;
  return `${mins}m`;
}

// ============================================================================
// Sub-components
// ============================================================================

function ActiveSessionBanner({
  session,
  onEnd,
  loading,
}: {
  session: HuntSession;
  onEnd: () => void;
  loading: boolean;
}) {
  return (
    <div className="p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-accent)] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          <span className="font-semibold text-[var(--text-primary)]">
            Aktive Jagd: {SESSION_TYPE_LABELS[session.sessionType]}
          </span>
        </div>
        <button
          onClick={onEnd}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <Square size={14} />
          Beenden
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
        <span className="flex items-center gap-1">
          <Clock size={14} />
          Gestartet {formatTime(session.startTime)}
        </span>
        <span>Dauer: {elapsedLabel(session.startTime)}</span>
      </div>
    </div>
  );
}

function StartSessionPanel({
  onStart,
  loading,
}: {
  onStart: (sessionType: HuntSession['sessionType']) => void;
  loading: boolean;
}) {
  return (
    <div className="p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] space-y-3">
      <p className="text-[var(--text-secondary)] text-sm">Keine aktive Jagd</p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(SESSION_TYPE_LABELS) as HuntSession['sessionType'][]).map(
          (type) => (
            <button
              key={type}
              onClick={() => onStart(type)}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--glass-accent)] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Play size={14} />
              {SESSION_TYPE_LABELS[type]}
            </button>
          )
        )}
      </div>
    </div>
  );
}

function AddEventForm({
  sessionId,
  onSubmit,
  loading,
}: {
  sessionId: string;
  onSubmit: (eventType: TimelineEvent['eventType'], notes: string) => void;
  loading: boolean;
}) {
  const [eventType, setEventType] = useState<TimelineEvent['eventType']>('note');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(eventType, notes);
    setNotes('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] space-y-3"
    >
      <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
        <Plus size={16} />
        Ereignis hinzufuegen
      </h3>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={eventType}
          onChange={(e) =>
            setEventType(e.target.value as TimelineEvent['eventType'])
          }
          className="px-3 py-2 rounded-lg bg-[var(--glass-bg-primary)] border border-[var(--glass-border)] text-[var(--text-primary)] text-sm"
        >
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notizen..."
          rows={2}
          className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-bg-primary)] border border-[var(--glass-border)] text-[var(--text-primary)] text-sm resize-none placeholder:text-[var(--text-secondary)]"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-[var(--glass-accent)] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        Speichern
      </button>
    </form>
  );
}

function EventCard({ event }: { event: TimelineEvent }) {
  const Icon = EVENT_TYPE_ICONS[event.eventType] ?? FileText;
  const label =
    EVENT_TYPE_OPTIONS.find((o) => o.value === event.eventType)?.label ??
    event.eventType;

  const notesText =
    typeof event.data?.notes === 'string' ? event.data.notes : null;

  return (
    <div className="flex gap-3 items-start">
      {/* Timeline dot + connector */}
      <div className="flex flex-col items-center pt-1">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--glass-surface)] border border-[var(--glass-border)]">
          <Icon size={14} className="text-[var(--glass-accent)]" />
        </div>
        <div className="w-px flex-1 bg-[var(--glass-border)]" />
      </div>

      {/* Content */}
      <div className="pb-4 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-[var(--text-primary)]">{label}</span>
          <span className="text-[var(--text-secondary)]">
            {formatTime(event.time)}
          </span>
        </div>
        {notesText && (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{notesText}</p>
        )}
        {event.photos.length > 0 && (
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {event.photos.length} Foto{event.photos.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function HuntTimeline() {
  const {
    activeSession,
    events,
    loading,
    error,
    startSession,
    endSession,
    logEvent,
    fetchSessions,
    fetchEvents,
  } = useHuntTimelineStore();

  // Initial data load
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Fetch events when active session changes
  useEffect(() => {
    if (activeSession) {
      fetchEvents(activeSession.id);
    }
  }, [activeSession?.id, fetchEvents]);

  const handleStart = (sessionType: HuntSession['sessionType']) => {
    startSession({ sessionType });
  };

  const handleEnd = () => {
    if (activeSession) {
      endSession(activeSession.id);
    }
  };

  const handleLogEvent = (
    eventType: TimelineEvent['eventType'],
    notes: string
  ) => {
    if (!activeSession) return;
    logEvent({
      sessionId: activeSession.id,
      eventType,
      data: notes ? { notes } : {},
    });
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">
        Jagd-Timeline
      </h1>

      {/* Error display */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Active session or start panel */}
      {activeSession ? (
        <>
          <ActiveSessionBanner
            session={activeSession}
            onEnd={handleEnd}
            loading={loading}
          />
          <AddEventForm
            sessionId={activeSession.id}
            onSubmit={handleLogEvent}
            loading={loading}
          />
        </>
      ) : (
        <StartSessionPanel onStart={handleStart} loading={loading} />
      )}

      {/* Timeline events */}
      <div className="space-y-0">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
          Ereignisse
        </h2>
        {events.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            Noch keine Ereignisse{activeSession ? ' in dieser Sitzung' : ''}.
          </p>
        ) : (
          events.map((ev) => <EventCard key={ev.id} event={ev} />)
        )}
      </div>
    </div>
  );
}
