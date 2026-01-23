import React, { useState } from 'react';
import { Save, Brain } from 'lucide-react';
import type { AIResource } from '@/stores/resourceStore';

interface MemoryEditorProps {
  resource: AIResource;
  onSave: (updates: Partial<AIResource>) => Promise<void>;
}

type MemoryLayer = 'working' | 'short_term' | 'long_term';

const LAYERS: { id: MemoryLayer; label: string; description: string }[] = [
  { id: 'working', label: 'Working', description: 'Current session only' },
  { id: 'short_term', label: 'Short-term', description: 'Persists for hours' },
  { id: 'long_term', label: 'Long-term', description: 'Permanent until decayed' },
];

export const MemoryEditor: React.FC<MemoryEditorProps> = ({ resource, onSave }) => {
  const meta = resource.typeMetadata as any;
  const [content, setContent] = useState(resource.content || '');
  const [layer, setLayer] = useState<MemoryLayer>(meta?.layer || 'long_term');
  const [importance, setImportance] = useState(meta?.importance ?? 0.7);
  const [expiresAt, setExpiresAt] = useState(meta?.expiresAt || '');

  const handleSave = () => {
    onSave({
      content,
      typeMetadata: {
        ...meta,
        type: 'memory',
        layer,
        importance,
        expiresAt: expiresAt || undefined,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Content */}
      <div>
        <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
          Memory Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What should be remembered..."
          className="w-full min-h-[100px] bg-white/[0.03] border border-white/10 rounded-lg p-3 text-xs text-white/80 placeholder-white/25 outline-none focus:border-blue-500/30 resize-y"
        />
      </div>

      {/* Layer Selector */}
      <div>
        <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
          Memory Layer
        </label>
        <div className="flex gap-2">
          {LAYERS.map(l => (
            <button
              key={l.id}
              onClick={() => setLayer(l.id)}
              className={`flex-1 px-3 py-2 rounded-lg border text-center transition-colors ${
                layer === l.id
                  ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                  : 'border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.04]'
              }`}
            >
              <div className="text-[11px] font-medium">{l.label}</div>
              <div className="text-[9px] opacity-60 mt-0.5">{l.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Importance Slider */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
            Importance
          </label>
          <span className="text-[11px] text-white/40">{(importance * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={importance}
          onChange={(e) => setImportance(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-purple-500"
        />
        <div className="flex justify-between text-[9px] text-white/20 mt-1">
          <span>Low (will decay quickly)</span>
          <span>High (preserved longer)</span>
        </div>
      </div>

      {/* Expiry (for short_term) */}
      {layer === 'short_term' && (
        <div>
          <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
            Expires At
          </label>
          <input
            type="datetime-local"
            value={expiresAt ? expiresAt.slice(0, 16) : ''}
            onChange={(e) => setExpiresAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
            className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-1.5 text-xs text-white/70 outline-none"
          />
        </div>
      )}

      {/* Metadata Info */}
      <div className="flex items-center gap-3 text-[10px] text-white/25">
        <Brain size={10} />
        <span>Usage: {resource.usageFrequency} times</span>
        <span>Provenance: {resource.provenance}</span>
        {meta?.consolidatedFrom?.length > 0 && (
          <span>Consolidated from {meta.consolidatedFrom.length} memories</span>
        )}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/20 text-xs text-purple-400 transition-colors"
      >
        <Save size={12} />
        Save Memory
      </button>
    </div>
  );
};
