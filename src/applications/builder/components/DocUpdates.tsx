/**
 * DocUpdates
 *
 * UI component for reviewing and approving project documentation
 * update suggestions after a successful build.
 */

import { useState, useCallback } from 'react';
import { FileText, Check, X, Eye, ChevronDown, ChevronRight } from 'lucide-react';

interface DocUpdateSuggestion {
  filePath: string;
  reason: string;
  proposedChange: string;
  section?: string;
  priority: 'required' | 'recommended' | 'optional';
}

interface DocUpdatesProps {
  appId: string;
  suggestions: DocUpdateSuggestion[];
  onApply: (selected: DocUpdateSuggestion[]) => Promise<void>;
  onSkip: () => void;
}

const PRIORITY_STYLES = {
  required: 'bg-red-500/20 text-red-400 border-red-500/30',
  recommended: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  optional: 'bg-white/10 text-secondary border-white/20',
};

export function DocUpdates({ appId, suggestions, onApply, onSkip }: DocUpdatesProps) {
  const [selected, setSelected] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    suggestions.forEach((s, i) => {
      if (s.priority === 'required' || s.priority === 'recommended') {
        initial.add(i);
      }
    });
    return initial;
  });
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);

  const toggleSelected = useCallback((index: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleExpanded = useCallback((index: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const handleApply = useCallback(async () => {
    setApplying(true);
    try {
      const selectedSuggestions = suggestions.filter((_, i) => selected.has(i));
      await onApply(selectedSuggestions);
    } finally {
      setApplying(false);
    }
  }, [suggestions, selected, onApply]);

  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-col border border-white/10 rounded-xl bg-glass-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-accent" />
          <span className="text-xs font-semibold text-primary">
            Documentation Updates ({suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''})
          </span>
        </div>
        <span className="text-[10px] text-secondary">App: {appId}</span>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto max-h-80 divide-y divide-white/5">
        {suggestions.map((suggestion, i) => (
          <div key={i} className="px-4 py-3">
            {/* Row */}
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <button
                onClick={() => toggleSelected(i)}
                className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                  selected.has(i)
                    ? 'bg-accent/30 border-accent/50'
                    : 'bg-white/5 border-white/20 hover:border-white/40'
                }`}
              >
                {selected.has(i) && <Check size={10} className="text-accent" />}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary truncate">
                    {suggestion.filePath}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[suggestion.priority]}`}>
                    {suggestion.priority}
                  </span>
                </div>
                {suggestion.section && (
                  <div className="text-[10px] text-secondary/70 mb-1">
                    Section: {suggestion.section}
                  </div>
                )}
                <div className="text-[11px] text-secondary">
                  {suggestion.reason}
                </div>
              </div>

              {/* Preview toggle */}
              <button
                onClick={() => toggleExpanded(i)}
                className="flex items-center gap-1 text-[10px] text-secondary hover:text-primary transition-colors flex-shrink-0"
              >
                <Eye size={12} />
                {expanded.has(i) ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              </button>
            </div>

            {/* Expanded preview */}
            {expanded.has(i) && (
              <div className="mt-2 ml-7 p-2 rounded bg-white/5 border border-white/10">
                <pre className="text-[10px] text-primary/70 whitespace-pre-wrap font-mono overflow-x-auto">
                  {suggestion.proposedChange}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10">
        <button
          onClick={handleApply}
          disabled={applying || selected.size === 0}
          className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-50 transition-colors"
        >
          <Check size={14} />
          {applying ? 'Applying...' : `Apply Selected (${selected.size})`}
        </button>
        <button
          onClick={onSkip}
          className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg bg-white/5 text-secondary hover:text-primary hover:bg-white/10 transition-colors"
        >
          <X size={14} />
          Skip All
        </button>
      </div>
    </div>
  );
}
