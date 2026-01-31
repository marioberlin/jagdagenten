/**
 * RevierSearchBar
 *
 * Floating search input for the Scout map that lets users find Jagdreviere
 * by name via natural-language-like queries. Results drop-up above the input.
 * On selection the parent is notified via onNavigate(center, zoom, layerId).
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, MapPin, Loader2 } from 'lucide-react';
import { useGeoLayerStore, type RevierSearchResult } from '@/stores/useGeoLayerStore';

// ============================================================================
// Props
// ============================================================================

export interface RevierSearchBarProps {
  /** Called when the user picks a result – parent should center the map */
  onNavigate: (center: [number, number], zoom: number, layerId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function RevierSearchBar({ onNavigate }: RevierSearchBarProps) {
  const searchFeatures = useGeoLayerStore((s) => s.searchFeatures);
  const showLayer = useGeoLayerStore((s) => s.showLayer);

  const [input, setInput] = useState('');
  const [results, setResults] = useState<RevierSearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ── Live search on typing ──
  useEffect(() => {
    const q = input.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setSearching(true);
    // Small debounce via rAF so typing stays snappy
    const id = requestAnimationFrame(() => {
      const hits = searchFeatures(q);
      setResults(hits);
      setSelectedIdx(0);
      setOpen(hits.length > 0);
      setSearching(false);
    });
    return () => cancelAnimationFrame(id);
  }, [input, searchFeatures]);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Pick a result ──
  const pick = useCallback(
    (result: RevierSearchResult) => {
      // Make sure the layer is visible
      showLayer(result.layerId);
      // Navigate the map
      onNavigate(result.center, 14, result.layerId);
      // Update UI
      setInput(result.featureName);
      setOpen(false);
    },
    [onNavigate, showLayer],
  );

  // ── Keyboard navigation ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!open || results.length === 0) {
      if (e.key === 'Enter') {
        // Try searching even if dropdown isn't showing yet
        const hits = searchFeatures(input.trim());
        if (hits.length > 0) {
          pick(hits[0]);
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIdx((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIdx((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        pick(results[selectedIdx]);
        break;
    }
  };

  const clear = () => {
    setInput('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  // ── Render ──
  return (
    <div ref={wrapperRef} className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[min(440px,90%)]">
      {/* ── Drop-UP results ── */}
      {open && results.length > 0 && (
        <div className="mb-1.5 rounded-xl overflow-hidden border border-[var(--glass-border)] bg-[var(--glass-bg-primary)]/95 backdrop-blur-xl shadow-2xl">
          {results.map((r, i) => (
            <button
              key={`${r.layerId}-${r.featureName}-${i}`}
              onClick={() => pick(r)}
              onMouseEnter={() => setSelectedIdx(i)}
              className={`w-full flex items-start gap-3 px-3.5 py-2.5 text-left transition-colors ${
                i === selectedIdx
                  ? 'bg-[var(--glass-accent)]/15'
                  : 'hover:bg-[var(--glass-surface-hover)]'
              }`}
            >
              <MapPin
                size={16}
                className="mt-0.5 flex-shrink-0"
                style={{ color: useGeoLayerStore.getState().layers.find((l) => l.id === r.layerId)?.strokeColor ?? 'var(--glass-accent)' }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {r.featureName}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                  <span className="px-1.5 py-0.5 rounded bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                    {r.layerLabel}
                  </span>
                  {r.area != null && <span>{Math.round(r.area)} ha</span>}
                  {r.hegering && <span>· {r.hegering}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg-primary)]/90 backdrop-blur-xl shadow-lg focus-within:ring-2 focus-within:ring-[var(--glass-accent)]/40 transition-shadow">
        {searching ? (
          <Loader2 size={16} className="flex-shrink-0 text-[var(--text-secondary)] animate-spin" />
        ) : (
          <Search size={16} className="flex-shrink-0 text-[var(--text-secondary)]" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Revier suchen … z.B. Heerde Kuppendorf"
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
        />
        {input && (
          <button
            onClick={clear}
            className="p-1 rounded-lg hover:bg-[var(--glass-surface-hover)] text-[var(--text-secondary)] transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
