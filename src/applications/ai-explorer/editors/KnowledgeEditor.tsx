import React, { useState } from 'react';
import { Save, Upload, Link, Database } from 'lucide-react';
import type { AIResource } from '@/stores/resourceStore';

interface KnowledgeEditorProps {
  resource: AIResource;
  onSave: (updates: Partial<AIResource>) => Promise<void>;
}

type SourceType = 'file' | 'url' | 'input' | 'rag';

export const KnowledgeEditor: React.FC<KnowledgeEditorProps> = ({ resource, onSave }) => {
  const meta = resource.typeMetadata as any;
  const [content, setContent] = useState(resource.content || '');
  const [sourceType, setSourceType] = useState<SourceType>(meta?.sourceType || 'input');
  const [urlInput, setUrlInput] = useState('');
  const [ragStoreId, setRagStoreId] = useState(meta?.ragStoreId || '');

  const handleSave = () => {
    onSave({
      content,
      typeMetadata: {
        ...meta,
        type: 'knowledge',
        sourceType,
        ragStoreId: ragStoreId || undefined,
      },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setContent(text);
    setSourceType('file');

    onSave({
      name: file.name,
      content: text,
      typeMetadata: {
        ...meta,
        type: 'knowledge',
        sourceType: 'file',
        mimeType: file.type,
        fileSize: file.size,
      },
    });
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return;
    setSourceType('url');
    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType: 'knowledge',
          ownerType: resource.ownerType,
          ownerId: resource.ownerId,
          name: `Import: ${urlInput}`,
          content: `Source URL: ${urlInput}`,
          typeMetadata: { type: 'knowledge', sourceType: 'url' },
          tags: ['url_import'],
          provenance: 'imported',
        }),
      });
      if (response.ok) {
        setUrlInput('');
      }
    } catch (err) {
      console.error('[KnowledgeEditor] URL import failed:', err);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Source Type Selector */}
      <div>
        <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
          Source Type
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {([
            { id: 'input', label: 'Text', icon: '✏️' },
            { id: 'file', label: 'File', icon: '📄' },
            { id: 'url', label: 'URL', icon: '🔗' },
            { id: 'rag', label: 'RAG', icon: '🧠' },
          ] as const).map(s => (
            <button
              key={s.id}
              onClick={() => setSourceType(s.id)}
              className={`px-2 py-2 rounded-lg border text-center transition-colors ${
                sourceType === s.id
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  : 'border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.04]'
              }`}
            >
              <div className="text-sm">{s.icon}</div>
              <div className="text-[10px] mt-0.5">{s.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Content (for text input) */}
      {sourceType === 'input' && (
        <div>
          <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
            Knowledge Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter knowledge content..."
            className="w-full min-h-[120px] bg-white/[0.03] border border-white/10 rounded-lg p-3 text-xs text-white/80 placeholder-white/25 outline-none focus:border-amber-500/30 resize-y"
          />
        </div>
      )}

      {/* File Upload */}
      {sourceType === 'file' && (
        <div>
          <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
            Upload File
          </label>
          <label className="flex flex-col items-center justify-center gap-2 py-6 px-4 border-2 border-dashed border-white/10 rounded-lg hover:border-amber-500/30 cursor-pointer transition-colors">
            <Upload size={20} className="text-white/30" />
            <span className="text-[11px] text-white/40">Click to upload or drag & drop</span>
            <span className="text-[9px] text-white/20">PDF, TXT, MD, JSON</span>
            <input
              type="file"
              accept=".txt,.md,.json,.pdf,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {meta?.fileSize && (
            <p className="text-[9px] text-white/25 mt-1.5">
              {meta.mimeType} &middot; {(meta.fileSize / 1024).toFixed(1)}KB
            </p>
          )}
        </div>
      )}

      {/* URL Input */}
      {sourceType === 'url' && (
        <div>
          <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
            Import from URL
          </label>
          <div className="flex gap-1.5">
            <div className="flex-1 flex items-center gap-1.5 bg-white/[0.03] border border-white/10 rounded px-2">
              <Link size={10} className="text-white/30" />
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
                placeholder="https://..."
                className="flex-1 bg-transparent py-1.5 text-[11px] text-white/70 outline-none"
              />
            </div>
            <button
              onClick={handleUrlImport}
              className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-[10px] text-amber-400 border border-amber-500/20"
            >
              Import
            </button>
          </div>
        </div>
      )}

      {/* RAG Store */}
      {sourceType === 'rag' && (
        <div>
          <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
            RAG Store ID
          </label>
          <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/10 rounded px-2">
            <Database size={10} className="text-white/30" />
            <input
              value={ragStoreId}
              onChange={(e) => setRagStoreId(e.target.value)}
              placeholder="gemini-file-store-id"
              className="flex-1 bg-transparent py-1.5 text-[11px] text-white/70 outline-none font-mono"
            />
          </div>
          <p className="text-[9px] text-white/20 mt-1">Gemini FileSearch store for RAG grounding</p>
        </div>
      )}

      {/* Extracted Metadata */}
      {(meta?.summary || meta?.entities?.length > 0 || meta?.topics?.length > 0) && (
        <div className="border border-white/5 rounded-lg p-3 bg-white/[0.01]">
          <p className="text-[10px] font-medium text-white/40 mb-2">Extracted Metadata</p>
          {meta.summary && (
            <p className="text-[11px] text-white/50 mb-1.5">{meta.summary}</p>
          )}
          {meta.entities?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {meta.entities.slice(0, 10).map((e: any, i: number) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-white/40">
                  {e.name} ({e.type})
                </span>
              ))}
            </div>
          )}
          {meta.topics?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {meta.topics.map((t: string, i: number) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-amber-500/10 text-[9px] text-amber-400/60">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/20 text-xs text-amber-400 transition-colors"
      >
        <Save size={12} />
        Save Knowledge
      </button>
    </div>
  );
};
