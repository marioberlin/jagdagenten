import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import type { AITarget, ResourceType, ResourceItem } from './types';
import { RESOURCE_TYPES, getStoredItems, setStoredItems } from './types';

interface AIExplorerEditorProps {
  resource: ResourceType;
  target: AITarget;
  onBack: () => void;
}

export const AIExplorerEditor: React.FC<AIExplorerEditorProps> = ({
  resource,
  target,
  onBack,
}) => {
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const resourceConfig = RESOURCE_TYPES.find(r => r.id === resource);

  useEffect(() => {
    setItems(getStoredItems(resource, target));
  }, [resource, target]);

  const saveItems = (newItems: ResourceItem[]) => {
    setItems(newItems);
    setStoredItems(resource, target, newItems);
  };

  const handleAdd = () => {
    const newItem: ResourceItem = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      content: '',
      addedAt: Date.now(),
    };
    const newItems = [...items, newItem];
    saveItems(newItems);
    setEditingId(newItem.id);
  };

  const handleDelete = (id: string) => {
    saveItems(items.filter(item => item.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleUpdate = (id: string, content: string) => {
    saveItems(items.map(item => item.id === id ? { ...item, content } : item));
  };

  const handleSave = (id: string) => {
    setEditingId(null);
    const item = items.find(i => i.id === id);
    if (item && !item.content.trim()) {
      saveItems(items.filter(i => i.id !== id));
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors"
        >
          <ArrowLeft size={14} />
          <span className="text-xs">Back</span>
        </button>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-medium text-white/90 truncate">
            {resourceConfig?.label} for {target.name}
          </h2>
          <p className="text-[10px] text-white/35 truncate">
            {target.type === 'app' ? 'App' : 'A2A Agent'} &middot; {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {items.length === 0 && !editingId ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <p className="text-sm text-white/30">No {resourceConfig?.label?.toLowerCase()} yet</p>
            <p className="text-[11px] text-white/20 max-w-[200px]">
              Add items to configure {resourceConfig?.label?.toLowerCase()} for this {target.type === 'app' ? 'app' : 'agent'}.
            </p>
          </div>
        ) : (
          items.map(item => {
            const isEditing = editingId === item.id;
            return (
              <div
                key={item.id}
                className={'rounded-lg border transition-colors ' + (
                  isEditing
                    ? 'border-blue-500/30 bg-blue-500/5'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                )}
              >
                {isEditing ? (
                  <div className="p-3">
                    <textarea
                      autoFocus
                      value={item.content}
                      onChange={(e) => handleUpdate(item.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') handleSave(item.id);
                        if (e.key === 'Enter' && e.metaKey) handleSave(item.id);
                      }}
                      placeholder={'Enter ' + (resourceConfig?.label?.toLowerCase() || 'resource') + ' content...'}
                      className="w-full min-h-[80px] bg-transparent text-xs text-white/80 placeholder-white/25 outline-none resize-y"
                    />
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                      <span className="text-[9px] text-white/20">Cmd+Enter to save, Esc to cancel</span>
                      <button
                        onClick={() => handleSave(item.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-[10px] hover:bg-blue-500/30 transition-colors"
                      >
                        <Save size={10} />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 whitespace-pre-wrap break-words">
                        {item.content || <span className="text-white/25 italic">Empty</span>}
                      </p>
                      <p className="text-[9px] text-white/20 mt-1.5">
                        Added {new Date(item.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setEditingId(item.id)}
                        className="p-1 rounded text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                        title="Edit"
                      >
                        <Save size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer with Add button */}
      <div className="flex items-center px-4 py-2.5 border-t border-white/10 flex-shrink-0">
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/70 hover:text-white/90 transition-all"
        >
          <Plus size={12} />
          Add Item
        </button>
        <span className="ml-auto text-[10px] text-white/25">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>
    </div>
  );
};
