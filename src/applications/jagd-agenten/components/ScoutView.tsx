/**
 * ScoutView
 *
 * Full-featured hunting territory view with interactive map, stand management,
 * wind compass, twilight times, weather, and cadastral parcel overlay.
 * Layout: left sidebar (stands) | center map | right panel (details).
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { MapPin, Wind, Plus, Trash2, Edit, Navigation, X, Check, Crosshair, Map as MapIcon, Layers, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useScoutStore, type HuntStand } from '@/stores/useScoutStore';
import { HuntingMap, type HuntStand as MapHuntStand, type WindData } from './HuntingMap';
import { JagdrevierLayers } from './JagdrevierLayers';
import { RevierSearchBar } from './RevierSearchBar';
import { useGeoLayerStore } from '@/stores/useGeoLayerStore';

// ============================================================================
// Diepholz center coordinates (Landkreis Diepholz, Niedersachsen)
// ============================================================================

const DIEPHOLZ_CENTER: [number, number] = [52.6064, 8.7018];

// ============================================================================
// Stand type options
// ============================================================================

const STAND_TYPES = [
  { value: 'hochsitz', label: 'Hochsitz' },
  { value: 'kanzel', label: 'Kanzel' },
  { value: 'druckjagdstand', label: 'Druckjagdstand' },
  { value: 'ansitzleiter', label: 'Ansitzleiter' },
  { value: 'bodenschirm', label: 'Bodenschirm' },
  { value: 'other', label: 'Sonstige' },
] as const;

// ============================================================================
// Wind Compass Rose
// ============================================================================

function WindCompass({ direction, speed }: { direction: number; speed: number }) {
  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const r = 60; // compass radius
  const cx = 75;
  const cy = 75;

  // Arrow tip position based on direction (0 = N, clockwise)
  const arrowRad = ((direction - 90) * Math.PI) / 180;
  const arrowLen = r - 10;
  const ax = cx + Math.cos(arrowRad) * arrowLen;
  const ay = cy + Math.sin(arrowRad) * arrowLen;

  // Tail (opposite)
  const tailLen = 18;
  const tx = cx - Math.cos(arrowRad) * tailLen;
  const ty = cy - Math.sin(arrowRad) * tailLen;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={150} height={150} viewBox="0 0 150 150" className="drop-shadow-md">
        {/* Outer circle */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--glass-border)" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={r - 1} fill="var(--glass-surface)" fillOpacity={0.3} />

        {/* Cardinal ticks and labels */}
        {cardinals.map((label, i) => {
          const angle = ((i * 45 - 90) * Math.PI) / 180;
          const tickOuter = r;
          const tickInner = r - 8;
          const labelR = r + 12;

          return (
            <g key={label}>
              <line
                x1={cx + Math.cos(angle) * tickInner}
                y1={cy + Math.sin(angle) * tickInner}
                x2={cx + Math.cos(angle) * tickOuter}
                y2={cy + Math.sin(angle) * tickOuter}
                stroke="var(--text-secondary)"
                strokeWidth={i % 2 === 0 ? 2 : 1}
              />
              {i % 2 === 0 && (
                <text
                  x={cx + Math.cos(angle) * labelR}
                  y={cy + Math.sin(angle) * labelR}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--text-secondary)"
                  fontSize={11}
                  fontWeight={label === 'N' ? 700 : 400}
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}

        {/* Wind arrow */}
        <line
          x1={tx}
          y1={ty}
          x2={ax}
          y2={ay}
          stroke="var(--glass-accent)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        {/* Arrowhead */}
        <circle cx={ax} cy={ay} r={4} fill="var(--glass-accent)" />

        {/* Centre dot */}
        <circle cx={cx} cy={cy} r={3} fill="var(--text-primary)" />
      </svg>

      <div className="text-center">
        <span className="text-lg font-semibold text-[var(--text-primary)]">{Math.round(direction)}</span>
        <span className="text-[var(--text-secondary)] ml-1">deg</span>
        <span className="mx-2 text-[var(--glass-border)]">|</span>
        <span className="text-lg font-semibold text-[var(--text-primary)]">{speed.toFixed(1)}</span>
        <span className="text-[var(--text-secondary)] ml-1">km/h</span>
      </div>
    </div>
  );
}

// ============================================================================
// Add Stand Form
// ============================================================================

interface AddFormData {
  name: string;
  standType: string;
  geoLat: string;
  geoLon: string;
}

function AddStandForm({ onClose }: { onClose: () => void }) {
  const addStand = useScoutStore((s) => s.addStand);
  const loading = useScoutStore((s) => s.loading);
  const [form, setForm] = useState<AddFormData>({
    name: '',
    standType: 'hochsitz',
    geoLat: '',
    geoLon: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(form.geoLat);
    const lon = parseFloat(form.geoLon);
    if (!form.name.trim() || Number.isNaN(lat) || Number.isNaN(lon)) return;

    await addStand({
      name: form.name.trim(),
      standType: form.standType,
      geoLat: lat,
      geoLon: lon,
    });
    onClose();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[var(--text-primary)]">Neuen Stand anlegen</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--glass-surface-hover)] text-[var(--text-secondary)]"
        >
          <X size={16} />
        </button>
      </div>

      <div>
        <label className="block text-sm text-[var(--text-secondary)] mb-1">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="z.B. Eichenkanzel"
          required
          className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg-primary)] border border-[var(--glass-border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--glass-accent)]"
        />
      </div>

      <div>
        <label className="block text-sm text-[var(--text-secondary)] mb-1">Typ</label>
        <select
          value={form.standType}
          onChange={(e) => setForm({ ...form, standType: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg-primary)] border border-[var(--glass-border)] text-[var(--text-primary)] outline-none focus:border-[var(--glass-accent)]"
        >
          {STAND_TYPES.map((st) => (
            <option key={st.value} value={st.value}>{st.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Breitengrad</label>
          <input
            type="number"
            step="any"
            value={form.geoLat}
            onChange={(e) => setForm({ ...form, geoLat: e.target.value })}
            placeholder="52.5200"
            required
            className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg-primary)] border border-[var(--glass-border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--glass-accent)]"
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Laengengrad</label>
          <input
            type="number"
            step="any"
            value={form.geoLon}
            onChange={(e) => setForm({ ...form, geoLon: e.target.value })}
            placeholder="13.4050"
            required
            className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg-primary)] border border-[var(--glass-border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--glass-accent)]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 rounded-lg bg-[var(--glass-accent)] text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Check size={16} />
        {loading ? 'Speichern...' : 'Stand anlegen'}
      </button>
    </form>
  );
}

// ============================================================================
// Stand List Item
// ============================================================================

function StandListItem({
  stand,
  isSelected,
  onSelect,
  onDelete,
}: {
  stand: HuntStand;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const typeLabel = STAND_TYPES.find((t) => t.value === stand.standType)?.label ?? stand.standType;

  return (
    <div
      onClick={onSelect}
      className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${
        isSelected
          ? 'bg-[var(--glass-accent)]/10 border-[var(--glass-accent)]'
          : 'bg-[var(--glass-surface)] border-[var(--glass-border)] hover:bg-[var(--glass-surface-hover)]'
      }`}
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[var(--glass-surface)] flex items-center justify-center border border-[var(--glass-border)]">
        <Crosshair size={16} className="text-[var(--glass-accent)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[var(--text-primary)] truncate">{stand.name}</div>
        <div className="text-xs text-[var(--text-secondary)]">{typeLabel}</div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[var(--glass-surface)] text-[var(--text-secondary)] hover:text-red-400 transition-all"
        title="Stand loeschen"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ============================================================================
// Stand Detail Panel
// ============================================================================

function StandDetail({ stand }: { stand: HuntStand }) {
  const updateStand = useScoutStore((s) => s.updateStand);
  const conditions = useScoutStore((s) => s.conditions);
  const windData = useScoutStore((s) => s.windData);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(stand.notes ?? '');

  // Sync notes when stand changes
  useEffect(() => {
    setNotes(stand.notes ?? '');
    setEditingNotes(false);
  }, [stand.id, stand.notes]);

  const saveNotes = async () => {
    await updateStand(stand.id, { notes });
    setEditingNotes(false);
  };

  const typeLabel = STAND_TYPES.find((t) => t.value === stand.standType)?.label ?? stand.standType;

  const latestWind = windData.length > 0
    ? windData[windData.length - 1]
    : conditions?.wind ?? { direction: 0, speed: 0 };

  // Format twilight times
  const formatTime = (iso: string) => {
    if (!iso) return '--:--';
    try {
      return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--glass-accent)]/15 flex items-center justify-center flex-shrink-0">
          <MapPin size={20} className="text-[var(--glass-accent)]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{stand.name}</h2>
          <p className="text-sm text-[var(--text-secondary)]">{typeLabel}</p>
        </div>
      </div>

      {/* Coordinates */}
      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <Navigation size={14} />
        <span>{stand.geoLat.toFixed(5)}, {stand.geoLon.toFixed(5)}</span>
      </div>

      {/* Wind Compass */}
      <div className="p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
        <div className="flex items-center gap-2 mb-3">
          <Wind size={16} className="text-[var(--glass-accent)]" />
          <h3 className="font-semibold text-[var(--text-primary)]">Wind</h3>
        </div>
        <WindCompass direction={latestWind.direction} speed={latestWind.speed} />
      </div>

      {/* Conditions */}
      {conditions && (
        <div className="p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-3">Bedingungen</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-[var(--text-secondary)]">Temperatur</span>
              <p className="font-medium text-[var(--text-primary)]">{conditions.temperature} C</p>
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Luftfeuchte</span>
              <p className="font-medium text-[var(--text-primary)]">{conditions.humidity}%</p>
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Luftdruck</span>
              <p className="font-medium text-[var(--text-primary)]">{conditions.pressure} hPa</p>
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Mondphase</span>
              <p className="font-medium text-[var(--text-primary)]">{Math.round(conditions.moonPhase * 100)}%</p>
            </div>
          </div>

          {/* Twilight */}
          <div className="mt-4 pt-3 border-t border-[var(--glass-border)]">
            <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Daemmerung</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-[var(--text-secondary)]">Buerg. Daemmerung</span>
                <p className="font-medium text-[var(--text-primary)]">{formatTime(conditions.twilight.civilDawn)}</p>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Sonnenaufgang</span>
                <p className="font-medium text-[var(--text-primary)]">{formatTime(conditions.twilight.sunrise)}</p>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Sonnenuntergang</span>
                <p className="font-medium text-[var(--text-primary)]">{formatTime(conditions.twilight.sunset)}</p>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Abenddaemmerung</span>
                <p className="font-medium text-[var(--text-primary)]">{formatTime(conditions.twilight.civilDusk)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-[var(--text-primary)]">Notizen</h3>
          {!editingNotes && (
            <button
              onClick={() => setEditingNotes(true)}
              className="p-1.5 rounded-lg hover:bg-[var(--glass-surface-hover)] text-[var(--text-secondary)]"
            >
              <Edit size={14} />
            </button>
          )}
        </div>

        {editingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg-primary)] border border-[var(--glass-border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--glass-accent)] resize-none"
              placeholder="Notizen zum Stand..."
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setNotes(stand.notes ?? '');
                  setEditingNotes(false);
                }}
                className="px-3 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--glass-surface-hover)]"
              >
                Abbrechen
              </button>
              <button
                onClick={saveNotes}
                className="px-3 py-1.5 rounded-lg text-sm bg-[var(--glass-accent)] text-white font-medium"
              >
                Speichern
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
            {stand.notes || 'Keine Notizen vorhanden.'}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main ScoutView
// ============================================================================

export default function ScoutView() {
  const { stands, selectedStand, conditions, loading, error, fetchStands, selectStand, deleteStand } = useScoutStore();
  const { layers: geoLayers, visibleLayers, loading: geoLoading, toggleLayer, fetchLayers: fetchGeoLayers } = useGeoLayerStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(true);
  const [showLayerPanel, setShowLayerPanel] = useState(true);

  // Search-driven navigation: overrides normal center/zoom when set
  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null);
  const [searchZoom, setSearchZoom] = useState<number | null>(null);

  useEffect(() => {
    fetchStands();
    fetchGeoLayers();
  }, [fetchStands, fetchGeoLayers]);

  // Called by RevierSearchBar when the user picks a revier
  const handleSearchNavigate = useCallback(
    (center: [number, number], zoom: number, _layerId: string) => {
      setSearchCenter(center);
      setSearchZoom(zoom);
    },
    [],
  );

  // Bridge store HuntStand → HuntingMap's HuntStand type
  const mapStands: MapHuntStand[] = useMemo(
    () =>
      stands.map((s) => ({
        id: s.id,
        name: s.name,
        type: (s.standType === 'hochsitz' || s.standType === 'kanzel' || s.standType === 'ansitz')
          ? s.standType as 'hochsitz' | 'kanzel' | 'ansitz'
          : 'other' as const,
        lat: s.geoLat,
        lon: s.geoLon,
        notes: s.notes,
      })),
    [stands],
  );

  // Wind data for the map
  const mapWind: WindData | undefined = useMemo(() => {
    if (conditions?.wind) return conditions.wind;
    return undefined;
  }, [conditions]);

  // Compute center: search override > selected stand > average > Diepholz default
  const mapCenter: [number, number] = useMemo(() => {
    if (searchCenter) return searchCenter;
    if (selectedStand) return [selectedStand.geoLat, selectedStand.geoLon];
    if (stands.length > 0) {
      const avgLat = stands.reduce((s, st) => s + st.geoLat, 0) / stands.length;
      const avgLon = stands.reduce((s, st) => s + st.geoLon, 0) / stands.length;
      return [avgLat, avgLon];
    }
    return DIEPHOLZ_CENTER; // Landkreis Diepholz default
  }, [searchCenter, selectedStand, stands]);

  // Zoom: search override > stand-based
  const mapZoom = useMemo(() => {
    if (searchZoom) return searchZoom;
    return selectedStand ? 15 : stands.length > 0 ? 14 : 11;
  }, [searchZoom, selectedStand, stands]);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-0">
      {/* ── Left sidebar: Stand list ── */}
      <div className="lg:w-72 flex-shrink-0 p-3 space-y-3 overflow-y-auto border-r border-[var(--glass-border)] bg-[var(--glass-surface)]/40 backdrop-blur-sm">
        {/* Header with Add button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapIcon size={18} className="text-[var(--glass-accent)]" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Ansitze</h2>
          </div>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="p-2 rounded-lg bg-[var(--glass-accent)] text-white hover:opacity-90 transition-opacity"
            title="Neuen Stand anlegen"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Layer control panel toggle */}
        <button
          onClick={() => setShowLayerPanel((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors border bg-[var(--glass-surface)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-surface-hover)]"
        >
          <div className="flex items-center gap-2">
            <Layers size={14} />
            Kartenebenen
            {visibleLayers.size > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[var(--glass-accent)]/20 text-[var(--glass-accent)] text-[10px] font-bold">
                {visibleLayers.size}
              </span>
            )}
          </div>
          {showLayerPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Geo layer toggles */}
        {showLayerPanel && geoLayers.length > 0 && (
          <div className="space-y-1.5 px-1">
            {geoLayers.map((layer) => {
              const isActive = visibleLayers.has(layer.id);
              const isLoading = geoLoading[layer.id];
              return (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  disabled={isLoading}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    isActive
                      ? 'border-opacity-50 bg-opacity-15'
                      : 'bg-[var(--glass-surface)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-surface-hover)]'
                  }`}
                  style={isActive ? {
                    backgroundColor: layer.color,
                    borderColor: layer.strokeColor,
                    color: layer.strokeColor,
                  } : undefined}
                >
                  <div
                    className="w-3 h-3 rounded-sm border-2 flex-shrink-0"
                    style={{ borderColor: layer.strokeColor, backgroundColor: isActive ? layer.strokeColor : 'transparent' }}
                  />
                  <span className="truncate">{layer.label}</span>
                  {isLoading && <Loader2 size={12} className="animate-spin ml-auto flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Add form (collapsible) */}
        {showAddForm && <AddStandForm onClose={() => setShowAddForm(false)} />}

        {/* Error state */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && stands.length === 0 && (
          <div className="p-4 text-center text-[var(--text-secondary)] text-sm">Lade Ansitze...</div>
        )}

        {/* Empty state */}
        {!loading && stands.length === 0 && (
          <div className="p-6 text-center rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
            <MapPin size={32} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-secondary)]">
              Noch keine Ansitze angelegt. Nutze den Plus-Button, um deinen ersten Stand zu erfassen.
            </p>
          </div>
        )}

        {/* Stand list */}
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-20rem)]">
          {stands.map((stand) => (
            <StandListItem
              key={stand.id}
              stand={stand}
              isSelected={selectedStand?.id === stand.id}
              onSelect={() => {
                selectStand(stand.id);
                setShowDetailPanel(true);
              }}
              onDelete={() => deleteStand(stand.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Center: Interactive Map ── */}
      <div className="flex-1 min-w-0 relative">
        <HuntingMap
          stands={mapStands}
          wind={mapWind}
          center={mapCenter}
          zoom={mapZoom}
          selectedStandId={selectedStand?.id}
          onStandClick={(stand) => {
            selectStand(stand.id);
            setShowDetailPanel(true);
            // Clear search override so stand selection works normally
            setSearchCenter(null);
            setSearchZoom(null);
          }}
          onAddStand={(_lat, _lon) => {
            // Pre-fill the add form with map-click coordinates
            setShowAddForm(true);
          }}
        >
          {/* Jagdrevier layers from Diepholz ArcGIS */}
          <JagdrevierLayers />
        </HuntingMap>

        {/* ── Floating Revier Search Bar ── */}
        <RevierSearchBar onNavigate={handleSearchNavigate} />
      </div>

      {/* ── Right panel: Stand detail (collapsible) ── */}
      {selectedStand && showDetailPanel && (
        <div className="lg:w-80 flex-shrink-0 p-4 overflow-y-auto border-l border-[var(--glass-border)] bg-[var(--glass-surface)]/40 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Details</h3>
            <button
              onClick={() => setShowDetailPanel(false)}
              className="p-1 rounded-lg hover:bg-[var(--glass-surface-hover)] text-[var(--text-secondary)]"
            >
              <X size={14} />
            </button>
          </div>
          <StandDetail stand={selectedStand} />
        </div>
      )}
    </div>
  );
}
