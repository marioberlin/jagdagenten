import React, { useState } from 'react';
import { Save, Plus, X, Zap } from 'lucide-react';
import type { AIResource } from '@/stores/resourceStore';

interface SkillEditorProps {
  resource: AIResource;
  onSave: (updates: Partial<AIResource>) => Promise<void>;
}

export const SkillEditor: React.FC<SkillEditorProps> = ({ resource, onSave }) => {
  const meta = resource.typeMetadata as any;
  const [triggers, setTriggers] = useState<string[]>(meta?.triggers || []);
  const [toolNames, setToolNames] = useState<string[]>(meta?.toolNames || []);
  const [newTrigger, setNewTrigger] = useState('');
  const [newTool, setNewTool] = useState('');
  const [description, setDescription] = useState(resource.description || '');

  const handleAddTrigger = () => {
    if (newTrigger.trim() && !triggers.includes(newTrigger.trim())) {
      setTriggers([...triggers, newTrigger.trim()]);
      setNewTrigger('');
    }
  };

  const handleAddTool = () => {
    if (newTool.trim() && !toolNames.includes(newTool.trim())) {
      setToolNames([...toolNames, newTool.trim()]);
      setNewTool('');
    }
  };

  const handleSave = () => {
    onSave({
      description,
      typeMetadata: {
        ...meta,
        type: 'skill',
        triggers,
        toolNames,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Description */}
      <div>
        <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
          Skill Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this skill do?"
          className="w-full min-h-[60px] bg-white/[0.03] border border-white/10 rounded-lg p-3 text-xs text-white/80 placeholder-white/25 outline-none focus:border-yellow-500/30 resize-y"
        />
      </div>

      {/* Trigger Words */}
      <div>
        <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
          Trigger Words ({triggers.length})
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {triggers.map(t => (
            <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[10px] text-yellow-400">
              <Zap size={8} />
              {t}
              <button onClick={() => setTriggers(triggers.filter(x => x !== t))} className="hover:text-red-400 ml-0.5">
                <X size={8} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input
            value={newTrigger}
            onChange={(e) => setNewTrigger(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTrigger()}
            placeholder="Add trigger word..."
            className="flex-1 bg-white/[0.03] border border-white/10 rounded px-2 py-1 text-[11px] text-white/70 outline-none"
          />
          <button onClick={handleAddTrigger} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/60">
            <Plus size={10} />
          </button>
        </div>
      </div>

      {/* Tool Names */}
      <div>
        <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
          Tool Names ({toolNames.length})
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {toolNames.map(t => (
            <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/50 font-mono">
              {t}
              <button onClick={() => setToolNames(toolNames.filter(x => x !== t))} className="hover:text-red-400 ml-0.5">
                <X size={8} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input
            value={newTool}
            onChange={(e) => setNewTool(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTool()}
            placeholder="Add tool name..."
            className="flex-1 bg-white/[0.03] border border-white/10 rounded px-2 py-1 text-[11px] text-white/70 outline-none font-mono"
          />
          <button onClick={handleAddTool} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/60">
            <Plus size={10} />
          </button>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/20 text-xs text-yellow-400 transition-colors"
      >
        <Save size={12} />
        Save Skill
      </button>
    </div>
  );
};
