import React, { useState } from 'react';
import { Save } from 'lucide-react';
import type { AIResource } from '@/stores/resourceStore';

interface ContextEditorProps {
  resource: AIResource;
  onSave: (updates: Partial<AIResource>) => Promise<void>;
}

type ContextType = 'global' | 'page' | 'component' | 'user';
type ValueType = 'string' | 'json' | 'computed';

export const ContextEditor: React.FC<ContextEditorProps> = ({ resource, onSave }) => {
  const meta = resource.typeMetadata as any;
  const [content, setContent] = useState(resource.content || '');
  const [priority, setPriority] = useState(meta?.priority ?? 5);
  const [contextType, setContextType] = useState<ContextType>(meta?.contextType || 'global');
  const [valueType, setValueType] = useState<ValueType>(meta?.valueType || 'string');

  const handleSave = () => {
    onSave({
      content,
      typeMetadata: {
        ...meta,
        type: 'context',
        strategy: meta?.strategy || 'flat',
        priority,
        contextType,
        valueType,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Content */}
      <div>
        <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
          Context Value
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={valueType === 'json' ? '{\n  "key": "value"\n}' : 'Context content...'}
          className="w-full min-h-[100px] bg-white/[0.03] border border-white/10 rounded-lg p-3 text-xs text-white/80 placeholder-white/25 outline-none focus:border-blue-500/30 resize-y font-mono"
        />
      </div>

      {/* Context Type */}
      <div>
        <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
          Context Type
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {(['global', 'page', 'component', 'user'] as ContextType[]).map(t => (
            <button
              key={t}
              onClick={() => setContextType(t)}
              className={`px-2 py-1.5 rounded border text-[10px] capitalize transition-colors ${
                contextType === t
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : 'border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.04]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Value Type */}
      <div>
        <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
          Value Type
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['string', 'json', 'computed'] as ValueType[]).map(t => (
            <button
              key={t}
              onClick={() => setValueType(t)}
              className={`px-2 py-1.5 rounded border text-[10px] capitalize transition-colors ${
                valueType === t
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : 'border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.04]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
            Priority
          </label>
          <span className="text-[11px] text-white/40">{priority}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={priority}
          onChange={(e) => setPriority(parseInt(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-green-500"
        />
        <div className="flex justify-between text-[9px] text-white/20 mt-1">
          <span>Low priority</span>
          <span>High priority</span>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/20 text-xs text-green-400 transition-colors"
      >
        <Save size={12} />
        Save Context
      </button>
    </div>
  );
};
