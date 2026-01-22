/**
 * KnowledgeStoresPanel - FileSearch Store Management UI
 * 
 * Clean, organized layout with:
 * - Card-based containers for each section
 * - Drag-drop upload zone
 * - Better empty states
 * - Collapsible info
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Plus, Trash2, RefreshCw, FileText, Loader2,
    CheckCircle, AlertCircle, FolderOpen, X,
    Sparkles, CloudUpload, ChevronDown, Zap
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface FileSearchStore {
    name: string;
    displayName?: string;
    createTime?: string;
}

interface FileSearchDocument {
    name: string;
    displayName?: string;
    createTime?: string;
}

interface AutoIndexResult {
    storeName: string;
    filesProcessed: number;
    filesSkipped: number;
    errors: string[];
}

const API_BASE = 'http://localhost:3000/api/file-search';

export const KnowledgeStoresPanel: React.FC = () => {
    const [stores, setStores] = useState<FileSearchStore[]>([]);
    const [selectedStore, setSelectedStore] = useState<string | null>(null);
    const [documents, setDocuments] = useState<FileSearchDocument[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isIndexing, setIsIndexing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
    const [indexProgress, setIndexProgress] = useState<AutoIndexResult | null>(null);
    const [newStoreName, setNewStoreName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isInfoExpanded, setIsInfoExpanded] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load stores on mount
    const loadStores = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/stores`);
            const data = await res.json();
            setStores(data.stores || []);
        } catch (err: any) {
            setError('Failed to load stores');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadStores(); }, [loadStores]);

    // Load documents when store is selected
    const loadDocuments = useCallback(async (storeName: string) => {
        setIsLoading(true);
        try {
            const storeId = storeName.replace('fileSearchStores/', '');
            const res = await fetch(`${API_BASE}/stores/${storeId}/documents`);
            const data = await res.json();
            setDocuments(data.documents || []);
        } catch (err) {
            setDocuments([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedStore) loadDocuments(selectedStore);
        else setDocuments([]);
    }, [selectedStore, loadDocuments]);

    const handleCreateStore = async () => {
        if (!newStoreName.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/stores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayName: newStoreName.trim() })
            });
            const data = await res.json();
            if (data.success) {
                setNewStoreName('');
                setIsCreating(false);
                await loadStores();
                if (data.store?.name) setSelectedStore(data.store.name);
            } else {
                setError(data.error || 'Failed to create store');
            }
        } catch (err) {
            setError('Failed to create store');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteStore = async (storeName: string) => {
        const storeId = storeName.replace('fileSearchStores/', '');
        if (!confirm(`Delete store "${storeId}"? This will remove all indexed documents.`)) return;
        setIsLoading(true);
        try {
            await fetch(`${API_BASE}/stores/${storeId}`, { method: 'DELETE' });
            if (selectedStore === storeName) setSelectedStore(null);
            await loadStores();
        } catch (err) {
            setError('Failed to delete store');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAutoIndex = async () => {
        if (!selectedStore) return;
        const storeId = selectedStore.replace('fileSearchStores/', '');
        setIsIndexing(true);
        setIndexProgress(null);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/stores/${storeId}/auto-index-project`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                setIndexProgress(data.result);
                await loadDocuments(selectedStore);
            } else {
                setError(data.error || 'Failed to index documents');
            }
        } catch (err) {
            setError('Failed to start indexing');
        } finally {
            setIsIndexing(false);
        }
    };

    const uploadFile = async (file: File) => {
        if (!selectedStore) return;
        const storeId = selectedStore.replace('fileSearchStores/', '');
        setIsUploading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('displayName', file.name);
            const res = await fetch(`${API_BASE}/stores/${storeId}/upload-file`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) await loadDocuments(selectedStore);
            else setError(data.error || 'Failed to upload file');
        } catch (err) {
            setError('Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) await uploadFile(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (selectedStore) setIsDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
        if (!selectedStore) return;
        const file = e.dataTransfer.files?.[0];
        if (file) await uploadFile(file);
    };

    const getStoreDisplayName = (store: FileSearchStore) => {
        return store.displayName || store.name?.split('/').pop() || 'Unknown';
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-base font-semibold">Knowledge Stores</h3>
                    <p className="text-xs text-white/40">FileSearch RAG stores for AI agents</p>
                </div>
                <motion.button
                    onClick={loadStores}
                    disabled={isLoading}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    whileTap={{ scale: 0.95 }}
                >
                    <RefreshCw size={14} className={cn(isLoading && 'animate-spin', 'text-white/50')} />
                </motion.button>
            </div>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                    >
                        <AlertCircle size={14} />
                        <span className="flex-1">{error}</span>
                        <button onClick={() => setError(null)}><X size={12} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content - Two Card Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* STORES CARD */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                    {/* Card Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                        <span className="text-sm font-medium text-white/70">
                            Stores
                            <span className="ml-1.5 text-white/30">({stores.length})</span>
                        </span>
                        <motion.button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--glass-accent)]/20 text-[var(--glass-accent)] text-xs font-medium hover:bg-[var(--glass-accent)]/30 transition-colors"
                            whileTap={{ scale: 0.95 }}
                        >
                            <Plus size={12} /> New
                        </motion.button>
                    </div>

                    {/* Card Body */}
                    <div className="p-3">
                        {/* Create Form */}
                        <AnimatePresence>
                            {isCreating && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-3"
                                >
                                    <div className="flex gap-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={newStoreName}
                                            onChange={(e) => setNewStoreName(e.target.value)}
                                            placeholder="Store name..."
                                            className="flex-1 px-3 py-1.5 rounded-md bg-black/30 border border-white/10 text-sm focus:outline-none focus:border-[var(--glass-accent)]"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleCreateStore();
                                                if (e.key === 'Escape') setIsCreating(false);
                                            }}
                                        />
                                        <button
                                            onClick={handleCreateStore}
                                            disabled={!newStoreName.trim()}
                                            className="px-3 py-1.5 rounded-md bg-[var(--glass-accent)] text-white text-xs font-medium disabled:opacity-50"
                                        >
                                            Create
                                        </button>
                                        <button
                                            onClick={() => { setIsCreating(false); setNewStoreName(''); }}
                                            className="px-2 py-1.5 rounded-md bg-white/10 text-white/60 text-xs"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Store List */}
                        <div className="space-y-1.5 max-h-[240px] overflow-y-auto custom-scrollbar">
                            {isLoading && stores.length === 0 ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 size={20} className="animate-spin text-white/30" />
                                </div>
                            ) : stores.length === 0 ? (
                                <div className="text-center py-8 px-4">
                                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 flex items-center justify-center">
                                        <Database size={20} className="text-white/20" />
                                    </div>
                                    <p className="text-sm text-white/40 mb-1">No stores yet</p>
                                    <p className="text-xs text-white/25">Click "New" to create one</p>
                                </div>
                            ) : (
                                stores.map((store) => (
                                    <motion.div
                                        key={store.name}
                                        onClick={() => setSelectedStore(store.name)}
                                        className={cn(
                                            "group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                                            selectedStore === store.name
                                                ? "bg-[var(--glass-accent)]/15 border border-[var(--glass-accent)]/30"
                                                : "hover:bg-white/5 border border-transparent"
                                        )}
                                        whileHover={{ x: 2 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <FolderOpen size={14} className={cn(
                                                selectedStore === store.name ? "text-[var(--glass-accent)]" : "text-white/40"
                                            )} />
                                            <span className="text-sm truncate">{getStoreDisplayName(store)}</span>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteStore(store.name); }}
                                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* DOCUMENTS CARD */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                    {/* Card Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                        <span className="text-sm font-medium text-white/70">
                            Documents
                            {selectedStore && <span className="ml-1.5 text-white/30">({documents.length})</span>}
                        </span>
                        {selectedStore && (
                            <div className="flex items-center gap-1.5">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept=".md,.txt,.pdf,.json,.ts,.tsx,.js,.jsx,.html,.css"
                                />
                                <motion.button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/15 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-colors"
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {isUploading ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                                    Upload
                                </motion.button>
                                <motion.button
                                    onClick={handleAutoIndex}
                                    disabled={isIndexing}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {isIndexing ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
                                    Auto-Index
                                </motion.button>
                            </div>
                        )}
                    </div>

                    {/* Card Body - Drop Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            "p-3 min-h-[240px] transition-colors",
                            isDragActive && "bg-blue-500/5"
                        )}
                    >
                        {/* Index Progress */}
                        <AnimatePresence>
                            {indexProgress && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="mb-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2"
                                >
                                    <CheckCircle size={12} className="text-emerald-400" />
                                    <span className="text-xs text-emerald-400">
                                        Indexed {indexProgress.filesProcessed} files
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!selectedStore ? (
                            /* No store selected */
                            <div className="flex flex-col items-center justify-center h-[200px] text-center">
                                <div className="w-14 h-14 mb-4 rounded-xl bg-white/5 flex items-center justify-center">
                                    <FolderOpen size={24} className="text-white/15" />
                                </div>
                                <p className="text-sm text-white/40">Select a store</p>
                                <p className="text-xs text-white/25">to view documents</p>
                            </div>
                        ) : isLoading ? (
                            <div className="flex items-center justify-center h-[200px]">
                                <Loader2 size={20} className="animate-spin text-white/30" />
                            </div>
                        ) : documents.length === 0 ? (
                            /* Empty - show drop zone */
                            <div
                                className={cn(
                                    "flex flex-col items-center justify-center h-[200px] text-center rounded-lg border-2 border-dashed transition-all cursor-pointer",
                                    isDragActive
                                        ? "border-blue-500/40 bg-blue-500/5"
                                        : "border-white/[0.06] hover:border-white/10"
                                )}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <motion.div
                                    className="w-12 h-12 mb-3 rounded-xl bg-blue-500/10 flex items-center justify-center"
                                    animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                                >
                                    <CloudUpload size={20} className="text-blue-400/60" />
                                </motion.div>
                                <p className="text-sm text-white/40 mb-1">
                                    {isDragActive ? 'Drop file here' : 'No documents'}
                                </p>
                                <p className="text-xs text-white/25 mb-3">
                                    Drag & drop or click to upload
                                </p>
                                {!isDragActive && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleAutoIndex(); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
                                    >
                                        <Zap size={12} /> Auto-Index Docs
                                    </button>
                                )}
                            </div>
                        ) : (
                            /* Document list */
                            <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.name}
                                        className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                                    >
                                        <FileText size={12} className="text-white/30 flex-shrink-0" />
                                        <span className="text-xs text-white/60 truncate">
                                            {doc.displayName || doc.name?.split('/').pop()}
                                        </span>
                                    </div>
                                ))}
                                {/* Drop hint when dragging */}
                                {isDragActive && (
                                    <div className="flex items-center justify-center gap-2 p-3 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs">
                                        <CloudUpload size={14} /> Drop to add
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Collapsible Info */}
            <motion.div className="rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                <button
                    onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/[0.02] transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Sparkles size={12} className="text-blue-400/50" />
                        <span className="text-xs text-white/40">About FileSearch RAG</span>
                    </div>
                    <motion.div animate={{ rotate: isInfoExpanded ? 180 : 0 }}>
                        <ChevronDown size={12} className="text-white/25" />
                    </motion.div>
                </button>
                <AnimatePresence>
                    {isInfoExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <p className="px-3 pb-3 text-xs text-white/30 leading-relaxed">
                                Knowledge stores use Google's File Search to index your project documentation.
                                The Project Assistant automatically uses indexed content to provide accurate, cited answers.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default KnowledgeStoresPanel;
