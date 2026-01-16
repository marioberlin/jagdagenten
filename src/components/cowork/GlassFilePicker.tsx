/**
 * GlassFilePicker
 *
 * Modal file/folder picker for selecting workspace paths.
 * Features: Directory browsing, quick access, search, breadcrumbs.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Folder,
    FolderOpen,
    File,
    Home,
    Monitor,
    FileText,
    Download,
    FolderCode,
    ChevronRight,
    ArrowLeft,
    Search,
    RefreshCw,
    Check,
    AlertCircle,
    Eye,
    EyeOff,
} from 'lucide-react';

interface FileEntry {
    name: string;
    path: string;
    type: 'file' | 'directory' | 'symlink';
    size?: number;
    modifiedAt?: string;
    isHidden: boolean;
    isAccessible: boolean;
}

interface DirectoryListing {
    path: string;
    parent: string | null;
    entries: FileEntry[];
    breadcrumbs: { name: string; path: string }[];
}

interface QuickAccessLocation {
    name: string;
    path: string;
    icon: string;
}

interface GlassFilePickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (path: string) => void;
    mode?: 'directory' | 'file' | 'both';
    title?: string;
    initialPath?: string;
}

const API_BASE = '/api/system/files';

const iconMap: Record<string, React.ReactNode> = {
    home: <Home size={16} />,
    monitor: <Monitor size={16} />,
    'file-text': <FileText size={16} />,
    download: <Download size={16} />,
    'folder-code': <FolderCode size={16} />,
    'folder-open': <FolderOpen size={16} />,
};

export const GlassFilePicker: React.FC<GlassFilePickerProps> = ({
    open,
    onClose,
    onSelect,
    mode = 'directory',
    title = 'Select Folder',
    initialPath,
}) => {
    const [currentPath, setCurrentPath] = useState<string>('');
    const [listing, setListing] = useState<DirectoryListing | null>(null);
    const [quickAccess, setQuickAccess] = useState<QuickAccessLocation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FileEntry[] | null>(null);
    const [showHidden, setShowHidden] = useState(false);
    const [selectedPath, setSelectedPath] = useState<string | null>(null);

    // Fetch directory contents
    const fetchDirectory = useCallback(async (path: string) => {
        setLoading(true);
        setError(null);
        setSearchResults(null);
        setSearchQuery('');

        try {
            const params = new URLSearchParams({
                path,
                showHidden: showHidden.toString(),
            });
            const response = await fetch(`${API_BASE}?${params}`);
            const data = await response.json();

            if (data.success) {
                setListing(data.data);
                setCurrentPath(data.data.path);
            } else {
                setError(data.error || 'Failed to load directory');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    }, [showHidden]);

    // Fetch quick access locations
    const fetchQuickAccess = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/quick-access`);
            const data = await response.json();
            if (data.success) {
                setQuickAccess(data.data);
            }
        } catch {
            // Ignore errors for quick access
        }
    }, []);

    // Search files
    const handleSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults(null);
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams({
                basePath: currentPath,
                q: query,
                limit: '50',
            });
            const response = await fetch(`${API_BASE}/search?${params}`);
            const data = await response.json();

            if (data.success) {
                setSearchResults(data.data);
            }
        } catch {
            // Ignore search errors
        } finally {
            setLoading(false);
        }
    }, [currentPath]);

    // Initial load
    useEffect(() => {
        if (open) {
            fetchQuickAccess();
            fetchDirectory(initialPath || '');
        }
    }, [open, initialPath, fetchDirectory, fetchQuickAccess]);

    // Re-fetch when showHidden changes
    useEffect(() => {
        if (open && currentPath) {
            fetchDirectory(currentPath);
        }
    }, [showHidden]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) {
                handleSearch(searchQuery);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    const handleEntryClick = (entry: FileEntry) => {
        if (!entry.isAccessible) return;

        if (entry.type === 'directory') {
            fetchDirectory(entry.path);
            setSelectedPath(null);
        } else if (mode === 'file' || mode === 'both') {
            setSelectedPath(entry.path);
        }
    };

    const handleEntryDoubleClick = (entry: FileEntry) => {
        if (!entry.isAccessible) return;

        if (entry.type === 'directory') {
            if (mode === 'directory' || mode === 'both') {
                onSelect(entry.path);
                onClose();
            }
        } else if (mode === 'file' || mode === 'both') {
            onSelect(entry.path);
            onClose();
        }
    };

    const handleSelectCurrent = () => {
        if (mode === 'directory' || mode === 'both') {
            onSelect(currentPath);
            onClose();
        } else if (selectedPath) {
            onSelect(selectedPath);
            onClose();
        }
    };

    const handleGoUp = () => {
        if (listing?.parent) {
            fetchDirectory(listing.parent);
            setSelectedPath(null);
        }
    };

    const formatSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    const displayEntries = searchResults || listing?.entries || [];

    if (!open) return null;

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
                    >
                        <div className="w-full max-w-3xl h-[80vh] overflow-hidden rounded-2xl
                                        bg-[#1a1a2e]/95 backdrop-blur-2xl border border-white/10
                                        shadow-2xl pointer-events-auto flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-indigo-500/20">
                                        <FolderOpen className="text-indigo-400" size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">{title}</h2>
                                        <p className="text-xs text-white/50 truncate max-w-md">
                                            {currentPath || 'Loading...'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <X size={20} className="text-white/60" />
                                </button>
                            </div>

                            {/* Toolbar */}
                            <div className="flex items-center gap-2 p-3 border-b border-white/5">
                                {/* Navigation */}
                                <button
                                    onClick={handleGoUp}
                                    disabled={!listing?.parent}
                                    className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30
                                               disabled:cursor-not-allowed transition-colors"
                                >
                                    <ArrowLeft size={16} className="text-white/60" />
                                </button>

                                <button
                                    onClick={() => fetchDirectory(currentPath)}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <RefreshCw size={16} className={`text-white/60 ${loading ? 'animate-spin' : ''}`} />
                                </button>

                                {/* Breadcrumbs */}
                                <div className="flex-1 flex items-center gap-1 overflow-x-auto px-2">
                                    {listing?.breadcrumbs.map((crumb, i) => (
                                        <React.Fragment key={crumb.path}>
                                            {i > 0 && <ChevronRight size={12} className="text-white/30 flex-shrink-0" />}
                                            <button
                                                onClick={() => fetchDirectory(crumb.path)}
                                                className="text-xs text-white/60 hover:text-white
                                                           whitespace-nowrap transition-colors"
                                            >
                                                {crumb.name}
                                            </button>
                                        </React.Fragment>
                                    ))}
                                </div>

                                {/* Search */}
                                <div className="relative">
                                    <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search..."
                                        className="w-40 pl-7 pr-3 py-1.5 rounded-lg bg-white/5
                                                   border border-white/10 text-sm text-white
                                                   placeholder:text-white/30 outline-none
                                                   focus:border-indigo-500/50 transition-colors"
                                    />
                                </div>

                                {/* Toggle hidden */}
                                <button
                                    onClick={() => setShowHidden(!showHidden)}
                                    className={`p-2 rounded-lg transition-colors ${
                                        showHidden ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/10 text-white/60'
                                    }`}
                                    title={showHidden ? 'Hide hidden files' : 'Show hidden files'}
                                >
                                    {showHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 flex overflow-hidden">
                                {/* Quick Access Sidebar */}
                                <div className="w-48 border-r border-white/5 p-3 overflow-y-auto">
                                    <h3 className="text-xs font-medium text-white/40 uppercase mb-2">
                                        Quick Access
                                    </h3>
                                    <div className="space-y-1">
                                        {quickAccess.map((loc) => (
                                            <button
                                                key={loc.path}
                                                onClick={() => fetchDirectory(loc.path)}
                                                className={`w-full flex items-center gap-2 px-2 py-1.5
                                                           rounded-lg text-sm text-left transition-colors
                                                           ${currentPath === loc.path
                                                               ? 'bg-indigo-500/20 text-indigo-400'
                                                               : 'text-white/70 hover:bg-white/5'
                                                           }`}
                                            >
                                                {iconMap[loc.icon] || <Folder size={16} />}
                                                <span className="truncate">{loc.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* File List */}
                                <div className="flex-1 overflow-y-auto p-2">
                                    {error ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-3">
                                            <AlertCircle size={48} className="text-red-400/50" />
                                            <p className="text-red-400">{error}</p>
                                            <button
                                                onClick={() => fetchDirectory(currentPath)}
                                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10
                                                           text-white/70 text-sm transition-colors"
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    ) : displayEntries.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-2 text-white/40">
                                            <Folder size={48} className="opacity-50" />
                                            <p>{searchQuery ? 'No results found' : 'Empty directory'}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-0.5">
                                            {displayEntries.map((entry) => (
                                                <button
                                                    key={entry.path}
                                                    onClick={() => handleEntryClick(entry)}
                                                    onDoubleClick={() => handleEntryDoubleClick(entry)}
                                                    disabled={!entry.isAccessible}
                                                    className={`w-full flex items-center gap-3 px-3 py-2
                                                               rounded-lg text-left transition-colors
                                                               ${!entry.isAccessible
                                                                   ? 'opacity-40 cursor-not-allowed'
                                                                   : selectedPath === entry.path
                                                                       ? 'bg-indigo-500/20 border border-indigo-500/30'
                                                                       : 'hover:bg-white/5'
                                                               }
                                                               ${entry.isHidden ? 'opacity-60' : ''}`}
                                                >
                                                    {entry.type === 'directory' ? (
                                                        <Folder size={18} className="text-amber-400/70 flex-shrink-0" />
                                                    ) : (
                                                        <File size={18} className="text-white/40 flex-shrink-0" />
                                                    )}
                                                    <span className="flex-1 text-sm text-white/90 truncate">
                                                        {entry.name}
                                                    </span>
                                                    {entry.type === 'file' && entry.size && (
                                                        <span className="text-xs text-white/30">
                                                            {formatSize(entry.size)}
                                                        </span>
                                                    )}
                                                    {entry.type === 'directory' && (
                                                        <ChevronRight size={14} className="text-white/20" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between p-4 border-t border-white/10">
                                <div className="text-xs text-white/40">
                                    {displayEntries.length} items
                                    {selectedPath && (
                                        <span className="ml-2 text-indigo-400">
                                            Selected: {selectedPath.split('/').pop()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 rounded-lg text-sm text-white/70
                                                   hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSelectCurrent}
                                        disabled={mode === 'file' && !selectedPath}
                                        className="flex items-center gap-2 px-5 py-2 rounded-xl
                                                   bg-gradient-to-r from-indigo-500 to-purple-500
                                                   text-white font-medium text-sm
                                                   disabled:opacity-50 disabled:cursor-not-allowed
                                                   hover:shadow-lg hover:shadow-indigo-500/25
                                                   transition-all active:scale-[0.98]"
                                    >
                                        <Check size={16} />
                                        {mode === 'directory' ? 'Select This Folder' : 'Select'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default GlassFilePicker;
