/**
 * JournalView Component
 *
 * Displays a filterable list of hunting journal entries (sightings, harvests,
 * notes) and provides a form to add new entries.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Eye,
  Target,
  FileText,
  Plus,
  Filter,
  Calendar,
  Trash2,
  Edit,
  Camera,
  X,
  ChevronDown,
} from 'lucide-react';
import { useJournalStore } from '@/stores/useJournalStore';
import type { JournalEntry } from '@/stores/useJournalStore';

// ============================================================================
// Constants
// ============================================================================

const ENTRY_TYPE_OPTIONS = [
  { value: '', label: 'Alle' },
  { value: 'sighting', label: 'Sichtungen' },
  { value: 'harvest', label: 'Erlegungen' },
  { value: 'note', label: 'Notizen' },
] as const;

const ENTRY_TYPE_ICONS: Record<JournalEntry['entryType'], typeof Eye> = {
  sighting: Eye,
  harvest: Target,
  note: FileText,
};

const ENTRY_TYPE_LABELS: Record<JournalEntry['entryType'], string> = {
  sighting: 'Sichtung',
  harvest: 'Erlegung',
  note: 'Notiz',
};

const COMMON_SPECIES = [
  'Rehwild',
  'Rotwild',
  'Damwild',
  'Schwarzwild',
  'Fuchs',
  'Feldhase',
  'Fasan',
  'Wildente',
  'Sonstige',
];

// ============================================================================
// Helpers
// ============================================================================

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '...';
}

// ============================================================================
// Sub-components
// ============================================================================

/** Filter bar with entry-type buttons and optional species dropdown */
function FilterBar({
  activeType,
  species,
  onTypeChange,
  onSpeciesChange,
}: {
  activeType: string;
  species: string;
  onTypeChange: (type: string) => void;
  onSpeciesChange: (species: string) => void;
}) {
  const [showSpecies, setShowSpecies] = useState(false);

  return (
    <div className="space-y-2">
      {/* Type filter buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} className="text-[var(--text-secondary)]" />
        {ENTRY_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onTypeChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeType === opt.value
                ? 'bg-[var(--glass-accent)] text-white'
                : 'bg-[var(--glass-surface)] text-[var(--text-secondary)] hover:bg-[var(--glass-surface-hover)] border border-[var(--glass-border)]'
            }`}
          >
            {opt.label}
          </button>
        ))}

        {/* Species dropdown toggle */}
        <button
          onClick={() => setShowSpecies(!showSpecies)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--glass-surface)] text-[var(--text-secondary)] hover:bg-[var(--glass-surface-hover)] border border-[var(--glass-border)] transition-colors"
        >
          <ChevronDown size={14} className={`transition-transform ${showSpecies ? 'rotate-180' : ''}`} />
          {species || 'Wildart'}
        </button>
      </div>

      {/* Species dropdown */}
      {showSpecies && (
        <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
          <button
            onClick={() => { onSpeciesChange(''); setShowSpecies(false); }}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              !species
                ? 'bg-[var(--glass-accent)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--glass-surface-hover)]'
            }`}
          >
            Alle
          </button>
          {COMMON_SPECIES.map((sp) => (
            <button
              key={sp}
              onClick={() => { onSpeciesChange(sp); setShowSpecies(false); }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                species === sp
                  ? 'bg-[var(--glass-accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--glass-surface-hover)]'
              }`}
            >
              {sp}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Card displaying a single journal entry */
function EntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = ENTRY_TYPE_ICONS[entry.entryType] ?? FileText;

  return (
    <div className="p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] space-y-2 group">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--glass-bg-primary)] border border-[var(--glass-border)] shrink-0">
            <Icon size={14} className="text-[var(--glass-accent)]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-[var(--text-primary)]">
                {ENTRY_TYPE_LABELS[entry.entryType]}
              </span>
              {entry.species && (
                <span className="text-[var(--glass-accent)] font-medium">
                  {entry.species}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Calendar size={12} />
              <span>{formatDateTime(entry.time)}</span>
              {entry.location && (
                <span className="truncate">
                  ({entry.location.lat.toFixed(4)}, {entry.location.lon.toFixed(4)})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(entry)}
            className="p-1.5 rounded-lg hover:bg-[var(--glass-surface-hover)] text-[var(--text-secondary)] transition-colors"
            title="Bearbeiten"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400 transition-colors"
            title="Loeschen"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Notes preview */}
      {entry.notes && (
        <p className="text-sm text-[var(--text-secondary)] pl-10">
          {truncate(entry.notes, 200)}
        </p>
      )}

      {/* Harvest-specific: weight */}
      {entry.entryType === 'harvest' && entry.wildbretWeight != null && (
        <p className="text-xs text-[var(--text-secondary)] pl-10">
          Wildbret: {entry.wildbretWeight} kg
        </p>
      )}

      {/* Photo thumbnails */}
      {entry.photos.length > 0 && (
        <div className="flex items-center gap-2 pl-10">
          <Camera size={12} className="text-[var(--text-secondary)]" />
          <div className="flex gap-1.5">
            {entry.photos.slice(0, 4).map((url, idx) => (
              <div
                key={idx}
                className="w-10 h-10 rounded-lg bg-[var(--glass-bg-primary)] border border-[var(--glass-border)] overflow-hidden"
              >
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
            {entry.photos.length > 4 && (
              <div className="w-10 h-10 rounded-lg bg-[var(--glass-bg-primary)] border border-[var(--glass-border)] flex items-center justify-center text-xs text-[var(--text-secondary)]">
                +{entry.photos.length - 4}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Add / Edit entry form */
function EntryForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: JournalEntry;
  onSubmit: (data: Omit<JournalEntry, 'id'>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [entryType, setEntryType] = useState<JournalEntry['entryType']>(
    initial?.entryType ?? 'note',
  );
  const [species, setSpecies] = useState(initial?.species ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [wildbretWeight, setWildbretWeight] = useState<string>(
    initial?.wildbretWeight != null ? String(initial.wildbretWeight) : '',
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      entryType,
      species: species || undefined,
      time: initial?.time ?? new Date().toISOString(),
      notes,
      photos: initial?.photos ?? [],
      wildbretWeight:
        entryType === 'harvest' && wildbretWeight
          ? parseFloat(wildbretWeight)
          : undefined,
      sessionId: initial?.sessionId,
      location: initial?.location,
      processingSteps: initial?.processingSteps,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-accent)] space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Plus size={16} />
          {initial ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg hover:bg-[var(--glass-surface-hover)] text-[var(--text-secondary)] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Entry type selector */}
      <div className="flex gap-2">
        {(['sighting', 'harvest', 'note'] as const).map((type) => {
          const Icon = ENTRY_TYPE_ICONS[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => setEntryType(type)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                entryType === type
                  ? 'bg-[var(--glass-accent)] text-white'
                  : 'bg-[var(--glass-bg-primary)] text-[var(--text-secondary)] border border-[var(--glass-border)] hover:bg-[var(--glass-surface-hover)]'
              }`}
            >
              <Icon size={14} />
              {ENTRY_TYPE_LABELS[type]}
            </button>
          );
        })}
      </div>

      {/* Species select */}
      <div>
        <label className="block text-xs text-[var(--text-secondary)] mb-1">
          Wildart
        </label>
        <select
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg-primary)] border border-[var(--glass-border)] text-[var(--text-primary)] text-sm"
        >
          <option value="">-- Keine Angabe --</option>
          {COMMON_SPECIES.map((sp) => (
            <option key={sp} value={sp}>
              {sp}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs text-[var(--text-secondary)] mb-1">
          Notizen
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Beobachtungen, Details..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg-primary)] border border-[var(--glass-border)] text-[var(--text-primary)] text-sm resize-none placeholder:text-[var(--text-secondary)]"
        />
      </div>

      {/* Weight field (harvest only) */}
      {entryType === 'harvest' && (
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">
            Wildbretgewicht (kg)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={wildbretWeight}
            onChange={(e) => setWildbretWeight(e.target.value)}
            placeholder="z.B. 12.5"
            className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg-primary)] border border-[var(--glass-border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-secondary)]"
          />
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-[var(--glass-accent)] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {initial ? 'Aktualisieren' : 'Speichern'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-secondary)] text-sm hover:bg-[var(--glass-surface-hover)] transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}

/** Empty state placeholder */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--glass-surface)] border border-[var(--glass-border)] flex items-center justify-center mb-4">
        <FileText size={24} className="text-[var(--text-secondary)]" />
      </div>
      <p className="text-[var(--text-secondary)] text-sm max-w-xs mb-4">
        Noch keine Eintraege. Starten Sie eine Jagd oder fuegen Sie einen Eintrag hinzu.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--glass-accent)] text-white font-medium text-sm hover:opacity-90 transition-opacity"
      >
        <Plus size={14} />
        Eintrag hinzufuegen
      </button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function JournalView() {
  const {
    entries,
    loading,
    error,
    filter,
    fetchEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    setFilter,
  } = useJournalStore();

  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Fetch on mount and when filter changes
  useEffect(() => {
    fetchEntries();
  }, [filter.entryType, filter.species, fetchEntries]);

  // Handlers
  const handleTypeChange = useCallback(
    (type: string) => {
      setFilter({ entryType: type || undefined });
    },
    [setFilter],
  );

  const handleSpeciesChange = useCallback(
    (species: string) => {
      setFilter({ species: species || undefined });
    },
    [setFilter],
  );

  const handleAdd = useCallback(
    async (data: Omit<JournalEntry, 'id'>) => {
      await addEntry(data);
      setShowForm(false);
    },
    [addEntry],
  );

  const handleUpdate = useCallback(
    async (data: Omit<JournalEntry, 'id'>) => {
      if (!editingEntry) return;
      await updateEntry(editingEntry.id, data);
      setEditingEntry(null);
    },
    [editingEntry, updateEntry],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteEntry(id);
    },
    [deleteEntry],
  );

  const handleEdit = useCallback((entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowForm(false);
  }, []);

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Journal</h1>
        {!showForm && !editingEntry && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--glass-accent)] text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            Neuer Eintrag
          </button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <EntryForm
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
          loading={loading}
        />
      )}

      {/* Edit form */}
      {editingEntry && (
        <EntryForm
          initial={editingEntry}
          onSubmit={handleUpdate}
          onCancel={() => setEditingEntry(null)}
          loading={loading}
        />
      )}

      {/* Filter bar */}
      <FilterBar
        activeType={filter.entryType ?? ''}
        species={filter.species ?? ''}
        onTypeChange={handleTypeChange}
        onSpeciesChange={handleSpeciesChange}
      />

      {/* Loading indicator */}
      {loading && entries.length === 0 && (
        <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
          Lade Eintraege...
        </div>
      )}

      {/* Entry list or empty state */}
      {!loading && entries.length === 0 ? (
        <EmptyState onAdd={() => setShowForm(true)} />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
