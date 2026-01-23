import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Share2, Copy, Pin, PinOff, Edit3 } from 'lucide-react';
import type { AITarget, ResourceType } from './types';
import { RESOURCE_TYPES, getStoredItems } from './types';
import { useResourceStore, type AIResource } from '@/stores/resourceStore';
import { ShareDialog } from './ShareDialog';
import { PromptEditor } from './editors/PromptEditor';
import { MemoryEditor } from './editors/MemoryEditor';
import { ContextEditor } from './editors/ContextEditor';
import { KnowledgeEditor } from './editors/KnowledgeEditor';
import { ArtifactEditor } from './editors/ArtifactEditor';
import { SkillEditor } from './editors/SkillEditor';
import { MCPEditor } from './editors/MCPEditor';

interface AIExplorerEditorProps {
  resource: ResourceType;
  target: AITarget;
  onBack: () => void;
}

/** Map legacy plural resource types to API resource types */
function toApiType(resource: ResourceType): string {
  if (resource === 'prompts') return 'prompt';
  if (resource === 'artifacts') return 'artifact';
  if (resource === 'skills') return 'skill';
  return resource;
}

/** Render the type-specific editor for a resource */
function TypeEditor({ resource, onSave }: { resource: AIResource; onSave: (updates: Partial<AIResource>) => Promise<void> }) {
  const type = resource.resourceType || (resource.typeMetadata as any)?.type;
  switch (type) {
    case 'prompt':
      return <PromptEditor resource={resource} onSave={onSave} />;
    case 'memory':
      return <MemoryEditor resource={resource} onSave={onSave} />;
    case 'context':
      return <ContextEditor resource={resource} onSave={onSave} />;
    case 'knowledge':
      return <KnowledgeEditor resource={resource} onSave={onSave} />;
    case 'artifact':
      return <ArtifactEditor resource={resource} onSave={onSave} />;
    case 'skill':
      return <SkillEditor resource={resource} onSave={onSave} />;
    case 'mcp':
      return <MCPEditor resource={resource} onSave={onSave} />;
    default:
      return null;
  }
}

export const AIExplorerEditor: React.FC<AIExplorerEditorProps> = ({
  resource,
  target,
  onBack,
}) => {
  const [items, setItems] = useState<AIResource[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shareItem, setShareItem] = useState<AIResource | null>(null);
  const [expandedEditor, setExpandedEditor] = useState<string | null>(null);

  const { createResource, updateResource, deleteResource, copyResource } = useResourceStore();

  const resourceConfig = RESOURCE_TYPES.find(r => r.id === resource);
  const apiType = toApiType(resource);
  const ownerType = target.type === 'misc' ? 'system' : target.type;

  // Fetch resources from both API (PostgreSQL) and localStorage, merge results
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    let apiItems: AIResource[] = [];
    try {
      const params = new URLSearchParams({
        type: apiType,
        ownerType,
        ownerId: target.id,
        active: 'true',
      });
      const response = await fetch(`/api/resources/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        apiItems = data.resources || [];
      }
    } catch (err) {
      console.error('[AIExplorer] API fetch failed:', err);
    }
    // Also load from localStorage (seeded data)
    const localItems = getStoredItems(resource, target);
    const localAsResources: AIResource[] = localItems.map(item => ({
      id: item.id,
      resourceType: apiType as any,
      ownerType: ownerType as any,
      ownerId: target.id,
      name: item.metadata?.source || `${resourceConfig?.label} item`,
      content: item.content,
      parts: [],
      typeMetadata: item.metadata || {},
      version: 1,
      isActive: true,
      isPinned: false,
      tags: [],
      createdAt: new Date(item.addedAt).toISOString(),
      updatedAt: new Date(item.addedAt).toISOString(),
      accessedAt: new Date(item.addedAt).toISOString(),
      provenance: 'imported' as const,
      usageFrequency: 0,
      syncToFile: false,
    }));
    // Merge: API items first, then localStorage items not already in API (by id)
    const apiIds = new Set(apiItems.map(i => i.id));
    const merged = [...apiItems, ...localAsResources.filter(i => !apiIds.has(i.id))];
    setItems(merged);
    setIsLoading(false);
  }, [apiType, ownerType, target.id, resource, target, resourceConfig]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAdd = async () => {
    try {
      const created = await createResource({
        resourceType: apiType as any,
        ownerType: ownerType as any,
        ownerId: target.id,
        name: `New ${resourceConfig?.label || 'Resource'}`,
        content: '',
        tags: [],
        provenance: 'user_input',
      });
      setItems(prev => [created, ...prev]);
      setEditingId(created.id);
      setEditContent('');
      setExpandedEditor(created.id);
    } catch (err) {
      console.error('[AIExplorer] Error creating resource:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResource(id);
      setItems(prev => prev.filter(item => item.id !== id));
      if (editingId === id) setEditingId(null);
      if (expandedEditor === id) setExpandedEditor(null);
    } catch (err) {
      console.error('[AIExplorer] Error deleting resource:', err);
    }
  };

  const handleStartEdit = (item: AIResource) => {
    setEditingId(item.id);
    setEditContent(item.content || '');
  };

  const handleSave = async (id: string) => {
    setEditingId(null);
    if (!editContent.trim()) {
      await handleDelete(id);
      return;
    }
    try {
      const updated = await updateResource(id, { content: editContent });
      setItems(prev => prev.map(item => item.id === id ? updated : item));
    } catch (err) {
      console.error('[AIExplorer] Error updating resource:', err);
    }
  };

  const handleTypedSave = async (id: string, updates: Partial<AIResource>) => {
    try {
      const updated = await updateResource(id, updates);
      setItems(prev => prev.map(item => item.id === id ? updated : item));
      setExpandedEditor(null);
    } catch (err) {
      console.error('[AIExplorer] Error saving typed resource:', err);
    }
  };

  const handleTogglePin = async (item: AIResource) => {
    try {
      const updated = await updateResource(item.id, { isPinned: !item.isPinned } as any);
      setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    } catch (err) {
      console.error('[AIExplorer] Error toggling pin:', err);
    }
  };

  const handleCopy = (item: AIResource) => {
    copyResource(item);
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
            {target.type === 'app' ? 'App' : target.type === 'agent' ? 'A2A Agent' : 'System'} &middot; {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <button
          onClick={() => items.length > 0 && setShareItem(items[0])}
          className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/50 hover:text-white/80 transition-all"
          title="Share resources"
        >
          <Share2 size={10} />
          Share
        </button>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-white/30 animate-pulse">Loading...</p>
          </div>
        ) : items.length === 0 && !editingId ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <p className="text-sm text-white/30">No {resourceConfig?.label?.toLowerCase()} yet</p>
            <p className="text-[11px] text-white/20 max-w-[200px]">
              Add items to configure {resourceConfig?.label?.toLowerCase()} for this {target.type === 'app' ? 'app' : target.type === 'agent' ? 'agent' : 'system component'}.
            </p>
          </div>
        ) : (
          items.map(item => {
            const isEditing = editingId === item.id;
            const isExpanded = expandedEditor === item.id;
            return (
              <div
                key={item.id}
                className={'rounded-lg border transition-colors ' + (
                  isEditing || isExpanded
                    ? 'border-blue-500/30 bg-blue-500/5'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                )}
              >
                {isExpanded ? (
                  <div>
                    <div className="flex items-center justify-between px-3 pt-2">
                      <p className="text-[11px] font-medium text-white/60">{item.name}</p>
                      <button
                        onClick={() => setExpandedEditor(null)}
                        className="text-[9px] text-white/30 hover:text-white/60"
                      >
                        Collapse
                      </button>
                    </div>
                    <TypeEditor
                      resource={item}
                      onSave={(updates) => handleTypedSave(item.id, updates)}
                    />
                  </div>
                ) : isEditing ? (
                  <div className="p-3">
                    <textarea
                      autoFocus
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') { setEditingId(null); }
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
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] font-medium text-white/60 truncate">{item.name}</p>
                        {item.isPinned && <Pin size={9} className="text-amber-400/60" />}
                      </div>
                      <p className="text-xs text-white/70 whitespace-pre-wrap break-words mt-0.5">
                        {item.content || <span className="text-white/25 italic">Empty</span>}
                      </p>
                      <p className="text-[9px] text-white/20 mt-1.5">
                        v{item.version} &middot; {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => setExpandedEditor(item.id)}
                        className="p-1 rounded text-white/30 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="Type Editor"
                      >
                        <Edit3 size={11} />
                      </button>
                      <button
                        onClick={() => handleTogglePin(item)}
                        className="p-1 rounded text-white/30 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                        title={item.isPinned ? 'Unpin' : 'Pin'}
                      >
                        {item.isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                      </button>
                      <button
                        onClick={() => handleCopy(item)}
                        className="p-1 rounded text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                        title="Copy"
                      >
                        <Copy size={11} />
                      </button>
                      <button
                        onClick={() => setShareItem(item)}
                        className="p-1 rounded text-white/30 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="Share"
                      >
                        <Share2 size={11} />
                      </button>
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1 rounded text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                        title="Edit Content"
                      >
                        <Save size={11} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={11} />
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

      {/* Share Dialog */}
      {shareItem && (
        <ShareDialog
          resource={shareItem}
          onClose={() => setShareItem(null)}
        />
      )}
    </div>
  );
};
