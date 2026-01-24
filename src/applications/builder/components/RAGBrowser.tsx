/**
 * RAGBrowser
 *
 * Browse, query, and manage an app's RAG corpus documents.
 * Supports pruning, deletion, and natural language queries.
 */

import { useState, useEffect, useCallback } from 'react';
import { Database, Trash2, Search, Pin, FileText, AlertCircle } from 'lucide-react';

interface RAGDocument {
  name: string;
  displayName: string;
  createTime: string;
  sizeBytes?: number;
  pinned?: boolean;
}

interface RAGBrowserProps {
  appId: string;
  storeName: string;
}

const API_BASE = '/api/builder';

export function RAGBrowser({ appId, storeName }: RAGBrowserProps) {
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/apps/${appId}/rag/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch {
      // Failed to load
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    if (storeName) loadDocuments();
  }, [storeName, loadDocuments]);

  const handleQuery = async () => {
    if (!query.trim()) return;
    setIsQuerying(true);
    setQueryResult(null);
    try {
      const res = await fetch(`${API_BASE}/apps/${appId}/rag/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setQueryResult(data.answer || data.result || 'No results found.');
      }
    } catch {
      setQueryResult('Query failed.');
    } finally {
      setIsQuerying(false);
    }
  };

  const handleDelete = async () => {
    if (selected.size === 0) return;
    for (const docName of selected) {
      await fetch(`${API_BASE}/apps/${appId}/rag/documents/${encodeURIComponent(docName)}`, {
        method: 'DELETE',
      });
    }
    setSelected(new Set());
    loadDocuments();
  };

  const handlePrune = async () => {
    await fetch(`${API_BASE}/apps/${appId}/rag/prune`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keepPinned: true, maxIterations: 5 }),
    });
    loadDocuments();
  };

  const toggleSelect = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const isPinned = (name: string) => {
    return name.includes('requirements') || name.includes('architecture') ||
      name.includes('completion') || name.includes('prd');
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Database size={16} className="text-accent" />
        <span className="text-sm font-semibold text-primary">RAG Corpus</span>
        <span className="text-xs text-secondary ml-1">({documents.length} docs)</span>
      </div>

      {/* Query */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQuery()}
            placeholder="Query build history..."
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-primary placeholder:text-secondary/50 focus:outline-none focus:border-accent/50"
          />
        </div>
        <button
          onClick={handleQuery}
          disabled={isQuerying || !query.trim()}
          className="px-3 py-2 text-xs rounded-lg bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-50 transition-colors"
        >
          {isQuerying ? '...' : 'Ask'}
        </button>
      </div>

      {/* Query Result */}
      {queryResult && (
        <div className="p-3 rounded-lg bg-accent/5 border border-accent/20 text-xs text-primary/80">
          {queryResult}
        </div>
      )}

      {/* Document List */}
      <div className="max-h-64 overflow-y-auto space-y-1">
        {loading ? (
          <div className="text-xs text-secondary text-center py-4">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-secondary py-4 justify-center">
            <AlertCircle size={14} />
            No documents in corpus
          </div>
        ) : (
          documents.map(doc => (
            <div
              key={doc.name}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                selected.has(doc.name)
                  ? 'bg-accent/10 border-accent/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/8'
              }`}
              onClick={() => toggleSelect(doc.name)}
            >
              <input
                type="checkbox"
                checked={selected.has(doc.name)}
                onChange={() => toggleSelect(doc.name)}
                className="rounded border-white/20"
              />
              <FileText size={12} className="text-secondary" />
              <span className="text-xs text-primary flex-1 truncate">
                {doc.displayName || doc.name}
              </span>
              {isPinned(doc.displayName || doc.name) && (
                <Pin size={10} className="text-accent/60" />
              )}
              {doc.createTime && (
                <span className="text-xs text-secondary/50">
                  {new Date(doc.createTime).toLocaleDateString()}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handlePrune}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-secondary hover:text-primary hover:bg-white/10 transition-colors"
        >
          Prune Iterations
        </button>
        <button
          onClick={handleDelete}
          disabled={selected.size === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
        >
          <Trash2 size={12} />
          Delete ({selected.size})
        </button>
      </div>
    </div>
  );
}
