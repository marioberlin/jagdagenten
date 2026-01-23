import React, { useState } from 'react';
import { Save, Plus, X, Tag } from 'lucide-react';
import type { AIResource } from '@/stores/resourceStore';

interface PromptEditorProps {
  resource: AIResource;
  onSave: (updates: Partial<AIResource>) => Promise<void>;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ resource, onSave }) => {
  const meta = resource.typeMetadata as any;
  const [template, setTemplate] = useState(meta?.template || resource.content || '');
  const [variables, setVariables] = useState<string[]>(meta?.variables || []);
  const [newVar, setNewVar] = useState('');

  // Extract variables from template (pattern: {variableName})
  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{(\w+)\}/g) || [];
    return [...new Set(matches.map(m => m.slice(1, -1)))];
  };

  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    setVariables(extractVariables(value));
  };

  const handleAddVariable = () => {
    if (newVar.trim() && !variables.includes(newVar.trim())) {
      setVariables([...variables, newVar.trim()]);
      setNewVar('');
    }
  };

  const handleRemoveVariable = (v: string) => {
    setVariables(variables.filter(x => x !== v));
  };

  const handleSave = () => {
    onSave({
      content: template,
      typeMetadata: {
        ...meta,
        type: 'prompt',
        template,
        variables,
      },
    });
  };

  // Highlight {variables} in the template display
  const highlightedPreview = template.replace(
    /\{(\w+)\}/g,
    '<span class="text-blue-400 font-medium">{$1}</span>'
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Template Editor */}
      <div>
        <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
          Prompt Template
        </label>
        <textarea
          value={template}
          onChange={(e) => handleTemplateChange(e.target.value)}
          placeholder="Enter your prompt template. Use {variableName} for dynamic values..."
          className="w-full min-h-[160px] bg-white/[0.03] border border-white/10 rounded-lg p-3 text-xs text-white/80 placeholder-white/25 outline-none focus:border-blue-500/30 resize-y font-mono"
        />
      </div>

      {/* Preview */}
      {template && (
        <div>
          <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
            Preview
          </label>
          <div
            className="bg-white/[0.02] border border-white/5 rounded-lg p-3 text-xs text-white/60 font-mono whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: highlightedPreview }}
          />
        </div>
      )}

      {/* Variables */}
      <div>
        <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
          Variables ({variables.length})
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {variables.map(v => (
            <span key={v} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400">
              <Tag size={8} />
              {v}
              <button onClick={() => handleRemoveVariable(v)} className="hover:text-red-400 ml-0.5">
                <X size={8} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input
            value={newVar}
            onChange={(e) => setNewVar(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddVariable()}
            placeholder="Add variable..."
            className="flex-1 bg-white/[0.03] border border-white/10 rounded px-2 py-1 text-[11px] text-white/70 outline-none"
          />
          <button onClick={handleAddVariable} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/60">
            <Plus size={10} />
          </button>
        </div>
      </div>

      {/* Analytics */}
      {meta?.analytics && (
        <div className="flex gap-4 text-[10px] text-white/30">
          <span>Used {meta.analytics.usageCount || 0} times</span>
          <span>Avg response: {meta.analytics.avgResponseTime || 0}ms</span>
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/20 text-xs text-blue-400 transition-colors"
      >
        <Save size={12} />
        Save Prompt
      </button>
    </div>
  );
};
