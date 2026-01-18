/**
 * GlassFilePicker (Finder-Style)
 *
 * macOS Finder-inspired file/folder picker for selecting workspace paths.
 * Features: Traffic lights, view modes, collapsible sidebar, column headers,
 * file type icons, path bar, and full keyboard navigation.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
    ChevronRight,
    ChevronDown,
    ChevronLeft,
    ArrowLeft,
    ArrowRight,
    Search,
    RefreshCw,
    Check,
    AlertCircle,
    Eye,
    EyeOff,
    List,
    LayoutGrid,
    FolderPlus,
    MoreHorizontal,
    Clock,
    Users,
    AppWindow,
    Image,
    Film,
    Music,
    Cloud,
    User,
    Laptop,
    HardDrive,
    Database,
    Share2,
    FileCode,
    Globe,
    Palette,
    FileJson,
    FileBox,
    Archive,
    ChevronUp,
    Minus,
    Maximize2,
    GripVertical,
    Trash2,
    Info,
    Edit3,
    Copy,
    ExternalLink,
    FolderSymlink,
    Scissors,
    Plus,
    MoreVertical,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

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

type ViewMode = 'list' | 'grid';
type SortColumn = 'name' | 'modified' | 'size' | 'kind';
type SortDirection = 'asc' | 'desc';
type WindowState = 'normal' | 'minimized' | 'maximized';

// ============================================================================
// Constants
// ============================================================================

const API_BASE = '/api/system/files';

// Sidebar sections configuration
const SIDEBAR_SECTIONS = [
    {
        id: 'favorites',
        title: 'Favorites',
        items: [
            { icon: 'Clock', name: 'Recents', path: '~/Recents' },
            { icon: 'AppWindow', name: 'Applications', path: '/Applications' },
            { icon: 'Monitor', name: 'Desktop', path: '~/Desktop' },
            { icon: 'FileText', name: 'Documents', path: '~/Documents' },
            { icon: 'Download', name: 'Downloads', path: '~/Downloads' },
            { icon: 'Image', name: 'Pictures', path: '~/Pictures' },
            { icon: 'Music', name: 'Music', path: '~/Music' },
            { icon: 'Film', name: 'Movies', path: '~/Movies' },
        ],
    },
    {
        id: 'locations',
        title: 'Locations',
        items: [
            { icon: 'Cloud', name: 'iCloud Drive', path: '~/Library/Mobile Documents' },
            { icon: 'User', name: 'mario', path: '~' },
            { icon: 'Laptop', name: 'On My Mac', path: '/' },
        ],
    },
    {
        id: 'drives',
        title: 'Drives',
        items: [
            { icon: 'Database', name: 'Macintosh HD', path: '/' },
        ],
    },
];

// Icon mapping for sidebar
const sidebarIconMap: Record<string, React.ReactNode> = {
    Clock: <Clock size={16} />,
    Users: <Users size={16} />,
    AppWindow: <AppWindow size={16} />,
    Image: <Image size={16} />,
    Download: <Download size={16} />,
    Monitor: <Monitor size={16} />,
    FileText: <FileText size={16} />,
    Film: <Film size={16} />,
    Music: <Music size={16} />,
    Cloud: <Cloud size={16} />,
    User: <User size={16} />,
    Laptop: <Laptop size={16} />,
    HardDrive: <HardDrive size={16} />,
    Database: <Database size={16} />,
    Share2: <Share2 size={16} />,
    Home: <Home size={16} />,
    'folder-open': <FolderOpen size={16} />,
};

// File extension to icon mapping
const getFileIcon = (name: string, type: 'file' | 'directory' | 'symlink') => {
    if (type === 'directory') {
        return <Folder size={18} className="text-amber-400/80" />;
    }

    const ext = name.split('.').pop()?.toLowerCase() || '';

    const iconConfig: Record<string, { icon: React.ReactNode; color: string }> = {
        md: { icon: <FileText size={18} />, color: 'text-blue-400' },
        txt: { icon: <FileText size={18} />, color: 'text-white/60' },
        py: { icon: <FileCode size={18} />, color: 'text-yellow-400' },
        js: { icon: <FileCode size={18} />, color: 'text-yellow-400' },
        ts: { icon: <FileCode size={18} />, color: 'text-blue-400' },
        tsx: { icon: <FileCode size={18} />, color: 'text-blue-400' },
        jsx: { icon: <FileCode size={18} />, color: 'text-yellow-400' },
        html: { icon: <Globe size={18} />, color: 'text-orange-400' },
        css: { icon: <Palette size={18} />, color: 'text-blue-400' },
        scss: { icon: <Palette size={18} />, color: 'text-pink-400' },
        json: { icon: <FileJson size={18} />, color: 'text-gray-400' },
        png: { icon: <Image size={18} />, color: 'text-pink-400' },
        jpg: { icon: <Image size={18} />, color: 'text-pink-400' },
        jpeg: { icon: <Image size={18} />, color: 'text-pink-400' },
        gif: { icon: <Image size={18} />, color: 'text-pink-400' },
        svg: { icon: <Image size={18} />, color: 'text-orange-400' },
        pdf: { icon: <FileBox size={18} />, color: 'text-red-400' },
        zip: { icon: <Archive size={18} />, color: 'text-gray-400' },
        tar: { icon: <Archive size={18} />, color: 'text-gray-400' },
        gz: { icon: <Archive size={18} />, color: 'text-gray-400' },
    };

    const config = iconConfig[ext] || { icon: <File size={18} />, color: 'text-white/50' };
    return <span className={config.color}>{config.icon}</span>;
};

// Get file kind description
const getFileKind = (name: string, type: 'file' | 'directory' | 'symlink'): string => {
    if (type === 'directory') return 'Folder';
    if (type === 'symlink') return 'Alias';

    const ext = name.split('.').pop()?.toLowerCase() || '';

    const kindMap: Record<string, string> = {
        md: 'Markdown document',
        txt: 'Plain Text',
        py: 'Python script',
        js: 'JavaScript',
        ts: 'TypeScript',
        tsx: 'TypeScript React',
        jsx: 'JavaScript React',
        html: 'HTML document',
        css: 'CSS stylesheet',
        scss: 'SCSS stylesheet',
        json: 'JSON document',
        png: 'PNG image',
        jpg: 'JPEG image',
        jpeg: 'JPEG image',
        gif: 'GIF image',
        svg: 'SVG image',
        pdf: 'PDF document',
        zip: 'ZIP archive',
    };

    return kindMap[ext] || 'Document';
};

// ============================================================================
// Context Menu Types and Component
// ============================================================================

interface ContextMenuItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    dividerAfter?: boolean;
    disabled?: boolean;
    danger?: boolean;
}

type ContextMenuType = 'sidebar' | 'folder' | 'file';

const getSidebarMenuItems = (): ContextMenuItem[] => [
    { id: 'open-tab', label: 'Open in New Tab', icon: <ExternalLink size={14} /> },
    { id: 'show-enclosing', label: 'Show in Enclosing Folder', icon: <FolderOpen size={14} /> },
    { id: 'remove-sidebar', label: 'Remove from Sidebar', icon: <X size={14} />, dividerAfter: true },
    { id: 'get-info', label: 'Get Info', icon: <Info size={14} /> },
    { id: 'add-dock', label: 'Add to Dock', icon: <Plus size={14} /> },
];

const getFolderMenuItems = (folderName: string): ContextMenuItem[] => [
    { id: 'open-tab', label: 'Open in New Tab', icon: <ExternalLink size={14} />, dividerAfter: true },
    { id: 'move-bin', label: 'Move to Bin', icon: <Trash2 size={14} />, danger: true, dividerAfter: true },
    { id: 'get-info', label: 'Get Info', icon: <Info size={14} /> },
    { id: 'rename', label: 'Rename', icon: <Edit3 size={14} /> },
    { id: 'compress', label: `Compress "${folderName}"`, icon: <Archive size={14} /> },
    { id: 'duplicate', label: 'Duplicate', icon: <Copy size={14} /> },
    { id: 'make-alias', label: 'Make Alias', icon: <FolderSymlink size={14} />, dividerAfter: true },
    { id: 'copy', label: 'Copy', icon: <Copy size={14} /> },
];

const getFileMenuItems = (fileName: string): ContextMenuItem[] => [
    { id: 'open', label: 'Open', icon: <ExternalLink size={14} /> },
    { id: 'open-with', label: 'Open With...', icon: <FolderOpen size={14} />, dividerAfter: true },
    { id: 'move-bin', label: 'Move to Bin', icon: <Trash2 size={14} />, danger: true, dividerAfter: true },
    { id: 'get-info', label: 'Get Info', icon: <Info size={14} /> },
    { id: 'rename', label: 'Rename', icon: <Edit3 size={14} /> },
    { id: 'compress', label: `Compress "${fileName}"`, icon: <Archive size={14} /> },
    { id: 'duplicate', label: 'Duplicate', icon: <Copy size={14} /> },
    { id: 'make-alias', label: 'Make Alias', icon: <FolderSymlink size={14} />, dividerAfter: true },
    { id: 'copy', label: 'Copy', icon: <Copy size={14} /> },
];

// Context Menu Component
const FinderContextMenu: React.FC<{
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
    onAction: (actionId: string) => void;
}> = ({ x, y, items, onClose, onAction }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // Adjust position to stay in viewport
    const adjustedX = Math.min(x, window.innerWidth - 220);
    const adjustedY = Math.min(y, window.innerHeight - (items.length * 32 + 16));

    return (
        <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-[100] min-w-[200px] py-1 rounded-lg
                       bg-[#2a2a3e]/98 backdrop-blur-xl border border-white/10
                       shadow-xl shadow-black/40"
            style={{ left: adjustedX, top: adjustedY }}
        >
            {items.map((item) => (
                <React.Fragment key={item.id}>
                    <button
                        onClick={() => {
                            if (!item.disabled) {
                                onAction(item.id);
                                onClose();
                            }
                        }}
                        disabled={item.disabled}
                        className={`w-full flex items-center gap-3 px-3 py-1.5 text-left text-sm
                                   transition-colors
                                   ${item.disabled
                                ? 'text-white/30 cursor-not-allowed'
                                : item.danger
                                    ? 'text-red-400 hover:bg-red-500/20'
                                    : 'text-white/90 hover:bg-white/10'
                            }`}
                    >
                        <span className={`w-4 flex-shrink-0 ${item.danger ? 'text-red-400' : 'text-white/50'}`}>
                            {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                    </button>
                    {item.dividerAfter && (
                        <div className="my-1 border-t border-white/10" />
                    )}
                </React.Fragment>
            ))}
        </motion.div>
    );
};

// ============================================================================
// Subcomponents
// ============================================================================

// Traffic Lights (Functional)
const TrafficLights: React.FC<{
    onClose: () => void;
    onMinimize: () => void;
    onMaximize: () => void;
    isMaximized: boolean;
}> = ({ onClose, onMinimize, onMaximize, isMaximized }) => (
    <div className="flex items-center gap-2 mr-4">
        <button
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57]/80 
                       transition-colors group relative"
            title="Close"
        >
            <X size={8} className="absolute inset-0 m-auto text-[#4a0002] opacity-0 group-hover:opacity-100" />
        </button>
        <button
            onClick={onMinimize}
            className="w-3 h-3 rounded-full bg-[#febc2e] hover:bg-[#febc2e]/80 
                       transition-colors group relative"
            title="Minimize"
        >
            <Minus size={8} className="absolute inset-0 m-auto text-[#995700] opacity-0 group-hover:opacity-100" />
        </button>
        <button
            onClick={onMaximize}
            className="w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#28c840]/80 
                       transition-colors group relative"
            title={isMaximized ? "Restore" : "Maximize"}
        >
            <Maximize2 size={7} className="absolute inset-0 m-auto text-[#006500] opacity-0 group-hover:opacity-100" />
        </button>
    </div>
);

// Finder Title Bar
const FinderTitleBar: React.FC<{
    title: string;
    currentPath: string;
    canGoBack: boolean;
    canGoForward: boolean;
    onClose: () => void;
    onMinimize: () => void;
    onMaximize: () => void;
    isMaximized: boolean;
    onBack: () => void;
    onForward: () => void;
    onDragStart: (e: React.MouseEvent) => void;
}> = ({ title, currentPath, canGoBack, canGoForward, onClose, onMinimize, onMaximize, isMaximized, onBack, onForward, onDragStart }) => {
    const folderName = currentPath.split('/').filter(Boolean).pop() || 'Root';

    return (
        <div
            className="flex items-center h-12 px-4 border-b border-white/10 bg-white/[0.02] cursor-grab active:cursor-grabbing select-none"
            onMouseDown={onDragStart}
        >
            {/* Traffic Lights */}
            <TrafficLights onClose={onClose} onMinimize={onMinimize} onMaximize={onMaximize} isMaximized={isMaximized} />

            {/* Navigation */}
            <div className="flex items-center gap-1 mr-4">
                <button
                    onClick={onBack}
                    disabled={!canGoBack}
                    className="p-1.5 rounded-md hover:bg-white/10 disabled:opacity-30 
                               disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={16} className="text-white/70" />
                </button>
                <button
                    onClick={onForward}
                    disabled={!canGoForward}
                    className="p-1.5 rounded-md hover:bg-white/10 disabled:opacity-30 
                               disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight size={16} className="text-white/70" />
                </button>
            </div>

            {/* Title (centered) */}
            <div className="flex-1 text-center">
                <h2 className="text-sm font-medium text-white/90">{folderName}</h2>
            </div>

            {/* Spacer for balance */}
            <div className="w-24" />
        </div>
    );
};

// Finder Toolbar
const FinderToolbar: React.FC<{
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    showHidden: boolean;
    onShowHiddenChange: (show: boolean) => void;
    onRefresh: () => void;
    loading: boolean;
}> = ({
    viewMode,
    onViewModeChange,
    searchQuery,
    onSearchChange,
    showHidden,
    onShowHiddenChange,
    onRefresh,
    loading,
}) => (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/[0.01]">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-white/5 rounded-lg p-0.5">
                <button
                    onClick={() => onViewModeChange('list')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/70'
                        }`}
                    title="List View"
                >
                    <List size={16} />
                </button>
                <button
                    onClick={() => onViewModeChange('grid')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/70'
                        }`}
                    title="Grid View"
                >
                    <LayoutGrid size={16} />
                </button>
            </div>

            {/* Separator */}
            <div className="w-px h-5 bg-white/10" />

            {/* Action Buttons */}
            <button
                className="p-1.5 rounded-md text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors"
                title="New Folder"
            >
                <FolderPlus size={16} />
            </button>

            <button
                onClick={onRefresh}
                className="p-1.5 rounded-md text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors"
                title="Refresh"
            >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
                className="p-1.5 rounded-md text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors"
                title="More Actions"
            >
                <MoreHorizontal size={16} />
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Toggle Hidden */}
            <button
                onClick={() => onShowHiddenChange(!showHidden)}
                className={`p-1.5 rounded-md transition-colors ${showHidden ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                    }`}
                title={showHidden ? 'Hide hidden files' : 'Show hidden files'}
            >
                {showHidden ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>

            {/* Search */}
            <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search"
                    className="w-44 pl-8 pr-3 py-1.5 rounded-lg bg-white/5
                           border border-white/10 text-sm text-white
                           placeholder:text-white/30 outline-none
                           focus:border-indigo-500/50 focus:bg-white/[0.07]
                           transition-all"
                />
            </div>
        </div>
    );

// Sidebar Section
const FinderSidebarSection: React.FC<{
    title: string;
    items: { icon: string; name: string; path: string }[];
    currentPath: string;
    onNavigate: (path: string) => void;
    onContextMenu: (e: React.MouseEvent, item: { name: string; path: string }) => void;
    defaultExpanded?: boolean;
}> = ({ title, items, currentPath, onNavigate, onContextMenu, defaultExpanded = true }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <div className="mb-2">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 w-full px-2 py-1 text-[10px] font-semibold 
                           text-white/40 uppercase tracking-wider hover:text-white/60 transition-colors"
            >
                <ChevronDown
                    size={10}
                    className={`transition-transform ${expanded ? '' : '-rotate-90'}`}
                />
                {title}
            </button>
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-0.5 mt-1">
                            {items.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => onNavigate(item.path)}
                                    onContextMenu={(e) => onContextMenu(e, item)}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5
                                               rounded-md text-sm text-left transition-colors
                                               ${currentPath === item.path || currentPath.startsWith(item.path + '/')
                                            ? 'bg-indigo-500/20 text-indigo-300'
                                            : 'text-white/70 hover:bg-white/5'
                                        }`}
                                >
                                    <span className="text-white/60">
                                        {sidebarIconMap[item.icon] || <Folder size={16} />}
                                    </span>
                                    <span className="truncate">{item.name}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Column Headers
const FinderColumnHeaders: React.FC<{
    sortColumn: SortColumn;
    sortDirection: SortDirection;
    onSort: (column: SortColumn) => void;
}> = ({ sortColumn, sortDirection, onSort }) => {
    const columns: { id: SortColumn; label: string; width: string }[] = [
        { id: 'name', label: 'Name', width: 'flex-1' },
        { id: 'modified', label: 'Date Modified', width: 'w-44' },
        { id: 'size', label: 'Size', width: 'w-20' },
        { id: 'kind', label: 'Kind', width: 'w-28' },
    ];

    const SortIcon = sortDirection === 'asc' ? ChevronUp : ChevronDown;

    return (
        <div className="flex items-center px-3 py-1.5 border-b border-white/10 bg-white/[0.03] text-xs">
            {/* Disclosure triangle + icon space */}
            <div className="w-12" />

            {columns.map((col) => (
                <button
                    key={col.id}
                    onClick={() => onSort(col.id)}
                    className={`${col.width} flex items-center gap-1 px-2 py-0.5 
                               text-left font-medium transition-colors
                               ${sortColumn === col.id ? 'text-white/90' : 'text-white/50 hover:text-white/70'}`}
                >
                    {col.label}
                    {sortColumn === col.id && (
                        <SortIcon size={12} className="text-white/50" />
                    )}
                </button>
            ))}
        </div>
    );
};

// File Row (List View)
const FinderFileRow: React.FC<{
    entry: FileEntry;
    isSelected: boolean;
    isEven: boolean;
    onClick: () => void;
    onDoubleClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
}> = ({ entry, isSelected, isEven, onClick, onDoubleClick, onContextMenu }) => {
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatSize = (bytes?: number) => {
        if (bytes === undefined) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    return (
        <button
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
            disabled={!entry.isAccessible}
            className={`w-full flex items-center px-3 py-1.5 text-left transition-colors
                       ${!entry.isAccessible
                    ? 'opacity-40 cursor-not-allowed'
                    : isSelected
                        ? 'bg-indigo-500/25 border-y border-indigo-500/30'
                        : isEven
                            ? 'bg-white/[0.02] hover:bg-white/[0.05]'
                            : 'hover:bg-white/[0.05]'
                }
                       ${entry.isHidden ? 'opacity-60' : ''}`}
        >
            {/* Disclosure Triangle */}
            <div className="w-5 flex-shrink-0">
                {entry.type === 'directory' && (
                    <ChevronRight size={12} className="text-white/30" />
                )}
            </div>

            {/* Icon */}
            <div className="w-7 flex-shrink-0">
                {getFileIcon(entry.name, entry.type)}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0 px-2">
                <span className="text-sm text-white/90 truncate block">{entry.name}</span>
            </div>

            {/* Date Modified */}
            <div className="w-44 flex-shrink-0 px-2">
                <span className="text-xs text-white/50">{formatDate(entry.modifiedAt)}</span>
            </div>

            {/* Size */}
            <div className="w-20 flex-shrink-0 px-2 text-right">
                <span className="text-xs text-white/50">
                    {entry.type === 'directory' ? '—' : formatSize(entry.size)}
                </span>
            </div>

            {/* Kind */}
            <div className="w-28 flex-shrink-0 px-2">
                <span className="text-xs text-white/50 truncate block">
                    {getFileKind(entry.name, entry.type)}
                </span>
            </div>
        </button>
    );
};

// File Grid Item
const FinderGridItem: React.FC<{
    entry: FileEntry;
    isSelected: boolean;
    onClick: () => void;
    onDoubleClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
}> = ({ entry, isSelected, onClick, onDoubleClick, onContextMenu }) => (
    <button
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        disabled={!entry.isAccessible}
        className={`flex flex-col items-center p-3 rounded-lg transition-colors
                   ${!entry.isAccessible
                ? 'opacity-40 cursor-not-allowed'
                : isSelected
                    ? 'bg-indigo-500/25 ring-1 ring-indigo-500/40'
                    : 'hover:bg-white/[0.05]'
            }
                   ${entry.isHidden ? 'opacity-60' : ''}`}
    >
        <div className="w-12 h-12 flex items-center justify-center mb-2">
            {entry.type === 'directory' ? (
                <Folder size={40} className="text-amber-400/80" />
            ) : (
                <div className="scale-150">{getFileIcon(entry.name, entry.type)}</div>
            )}
        </div>
        <span className="text-xs text-white/80 text-center line-clamp-2 w-full max-w-[80px]">
            {entry.name}
        </span>
    </button>
);

// Path Bar
const FinderPathBar: React.FC<{
    breadcrumbs: { name: string; path: string }[];
    onNavigate: (path: string) => void;
    itemCount: number;
}> = ({ breadcrumbs, onNavigate, itemCount }) => (
    <div className="flex items-center justify-between px-3 py-2 border-t border-white/10 bg-white/[0.02]">
        {/* Path */}
        <div className="flex items-center gap-1 overflow-x-auto">
            {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={crumb.path}>
                    {i > 0 && <ChevronRight size={10} className="text-white/30 flex-shrink-0" />}
                    <button
                        onClick={() => onNavigate(crumb.path)}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs 
                                   text-white/60 hover:text-white hover:bg-white/5 
                                   transition-colors whitespace-nowrap"
                    >
                        {i === 0 ? (
                            <Database size={12} className="text-white/50" />
                        ) : (
                            <Folder size={12} className="text-amber-400/60" />
                        )}
                        {crumb.name}
                    </button>
                </React.Fragment>
            ))}
        </div>

        {/* Item Count */}
        <div className="text-xs text-white/40 whitespace-nowrap ml-4">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </div>
    </div>
);

// ============================================================================
// Main Component
// ============================================================================

export const GlassFilePicker: React.FC<GlassFilePickerProps> = ({
    open,
    onClose,
    onSelect,
    mode = 'directory',
    title = 'Select Folder',
    initialPath,
}) => {
    // State
    const [currentPath, setCurrentPath] = useState<string>('');
    const [listing, setListing] = useState<DirectoryListing | null>(null);
    const [quickAccess, setQuickAccess] = useState<QuickAccessLocation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FileEntry[] | null>(null);
    const [showHidden, setShowHidden] = useState(false);
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [sortColumn, setSortColumn] = useState<SortColumn>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Window state for dragging/resizing
    const [windowState, setWindowState] = useState<WindowState>('normal');
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: 900, height: 600 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
    const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
    const modalRef = useRef<HTMLDivElement>(null);

    // Pre-minimize state for restore
    const preMinimizeRef = useRef({ width: 900, height: 600, x: 0, y: 0 });

    // Reset position when opening
    useEffect(() => {
        if (open) {
            setPosition({ x: 0, y: 0 });
            setSize({ width: 900, height: 600 });
            setWindowState('normal');
        }
    }, [open]);

    // Handle drag
    const handleDragStart = (e: React.MouseEvent) => {
        // Don't start drag if clicking on buttons
        if ((e.target as HTMLElement).closest('button')) return;
        if (windowState === 'maximized') return;

        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            posX: position.x,
            posY: position.y,
        };
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - dragStartRef.current.x;
            const deltaY = e.clientY - dragStartRef.current.y;
            setPosition({
                x: dragStartRef.current.posX + deltaX,
                y: dragStartRef.current.posY + deltaY,
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    // Handle resize
    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (windowState === 'maximized') return;

        setIsResizing(true);
        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height,
        };
    };

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - resizeStartRef.current.x;
            const deltaY = e.clientY - resizeStartRef.current.y;
            setSize({
                width: Math.max(500, resizeStartRef.current.width + deltaX),
                height: Math.max(400, resizeStartRef.current.height + deltaY),
            });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    // Traffic light handlers
    const handleMinimize = () => {
        if (windowState === 'minimized') {
            // Restore
            setWindowState('normal');
            setSize({ width: preMinimizeRef.current.width, height: preMinimizeRef.current.height });
            setPosition({ x: preMinimizeRef.current.x, y: preMinimizeRef.current.y });
        } else {
            // Minimize to small bar
            preMinimizeRef.current = { ...size, ...position };
            setWindowState('minimized');
        }
    };

    const handleMaximize = () => {
        if (windowState === 'maximized') {
            // Restore
            setWindowState('normal');
            setSize({ width: preMinimizeRef.current.width, height: preMinimizeRef.current.height });
            setPosition({ x: preMinimizeRef.current.x, y: preMinimizeRef.current.y });
        } else {
            // Maximize
            preMinimizeRef.current = { ...size, ...position };
            setWindowState('maximized');
            setPosition({ x: 0, y: 0 });
        }
    };

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        type: ContextMenuType;
        target: { name: string; path: string; entryType?: 'file' | 'directory' | 'symlink' };
    } | null>(null);

    const handleSidebarContextMenu = (e: React.MouseEvent, item: { name: string; path: string }) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            type: 'sidebar',
            target: { name: item.name, path: item.path },
        });
    };

    const handleFileContextMenu = (e: React.MouseEvent, entry: FileEntry) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            type: entry.type === 'directory' ? 'folder' : 'file',
            target: { name: entry.name, path: entry.path, entryType: entry.type },
        });
    };

    const handleContextMenuAction = (actionId: string) => {
        if (!contextMenu) return;

        // Handle actions (mostly decorative for now, but can be expanded)
        switch (actionId) {
            case 'open-tab':
                if (contextMenu.target.entryType === 'directory' || contextMenu.type === 'sidebar') {
                    fetchDirectory(contextMenu.target.path);
                }
                break;
            case 'get-info':
                // Could show an info modal in the future
                console.log('Get Info:', contextMenu.target);
                break;
            case 'copy':
                navigator.clipboard?.writeText(contextMenu.target.path);
                break;
            case 'rename':
                // Could enable inline editing
                console.log('Rename:', contextMenu.target.name);
                break;
            default:
                console.log('Action:', actionId, contextMenu.target);
        }

        setContextMenu(null);
    };

    // Fetch directory contents
    const fetchDirectory = useCallback(async (path: string, addToHistory = true) => {
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

                // Update history
                if (addToHistory) {
                    const newHistory = history.slice(0, historyIndex + 1);
                    newHistory.push(data.data.path);
                    setHistory(newHistory);
                    setHistoryIndex(newHistory.length - 1);
                }
            } else {
                setError(data.error || 'Failed to load directory');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    }, [showHidden, history, historyIndex]);

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
            fetchDirectory(initialPath || '', true);
        }
    }, [open, initialPath]);

    // Re-fetch when showHidden changes
    useEffect(() => {
        if (open && currentPath) {
            fetchDirectory(currentPath, false);
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

    // Navigation handlers
    const handleBack = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            fetchDirectory(history[newIndex], false);
        }
    };

    const handleForward = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            fetchDirectory(history[newIndex], false);
        }
    };

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

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

    const handleSidebarNavigate = (path: string) => {
        // Expand ~ to home directory (handled by API)
        fetchDirectory(path);
        setSelectedPath(null);
    };

    // Sort and filter entries
    const displayEntries = useMemo(() => {
        let entries = searchResults || listing?.entries || [];

        // Sort
        entries = [...entries].sort((a, b) => {
            // Directories first
            if (a.type === 'directory' && b.type !== 'directory') return -1;
            if (a.type !== 'directory' && b.type === 'directory') return 1;

            let comparison = 0;
            switch (sortColumn) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'modified':
                    comparison = (a.modifiedAt || '').localeCompare(b.modifiedAt || '');
                    break;
                case 'size':
                    comparison = (a.size || 0) - (b.size || 0);
                    break;
                case 'kind':
                    comparison = getFileKind(a.name, a.type).localeCompare(getFileKind(b.name, b.type));
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return entries;
    }, [searchResults, listing?.entries, sortColumn, sortDirection]);

    if (!open) return null;

    return (
        <>
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
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 pointer-events-none"
                            style={{
                                display: 'flex',
                                alignItems: windowState === 'maximized' ? 'stretch' : 'center',
                                justifyContent: windowState === 'maximized' ? 'stretch' : 'center',
                                padding: windowState === 'maximized' ? 0 : 16,
                            }}
                        >
                            <div
                                ref={modalRef}
                                className={`relative overflow-hidden rounded-xl
                                        bg-[#1e1e2e]/98 backdrop-blur-2xl border border-white/10
                                        shadow-2xl shadow-black/50 pointer-events-auto flex flex-col
                                        ${isDragging || isResizing ? 'select-none' : ''}
                                        ${windowState === 'minimized' ? 'h-12' : ''}`}
                                style={{
                                    width: windowState === 'maximized' ? '100%' :
                                        windowState === 'minimized' ? 400 : size.width,
                                    height: windowState === 'maximized' ? '100%' :
                                        windowState === 'minimized' ? 48 : size.height,
                                    transform: windowState === 'maximized' ? 'none' :
                                        `translate(${position.x}px, ${position.y}px)`,
                                    transition: isDragging || isResizing ? 'none' : 'width 0.2s, height 0.2s',
                                }}
                            >

                                {/* Title Bar */}
                                <FinderTitleBar
                                    title={title}
                                    currentPath={currentPath}
                                    canGoBack={historyIndex > 0}
                                    canGoForward={historyIndex < history.length - 1}
                                    onClose={onClose}
                                    onMinimize={handleMinimize}
                                    onMaximize={handleMaximize}
                                    isMaximized={windowState === 'maximized'}
                                    onBack={handleBack}
                                    onForward={handleForward}
                                    onDragStart={handleDragStart}
                                />

                                {/* Content (hidden when minimized) */}
                                {windowState !== 'minimized' && (
                                    <>
                                        {/* Toolbar */}
                                        <FinderToolbar
                                            viewMode={viewMode}
                                            onViewModeChange={setViewMode}
                                            searchQuery={searchQuery}
                                            onSearchChange={setSearchQuery}
                                            showHidden={showHidden}
                                            onShowHiddenChange={setShowHidden}
                                            onRefresh={() => fetchDirectory(currentPath, false)}
                                            loading={loading}
                                        />

                                        {/* Main Content */}
                                        <div className="flex-1 flex overflow-hidden">
                                            {/* Sidebar */}
                                            <div className="w-52 border-r border-white/5 overflow-y-auto py-2 px-1">
                                                {SIDEBAR_SECTIONS.map((section) => (
                                                    <FinderSidebarSection
                                                        key={section.id}
                                                        title={section.title}
                                                        items={section.items}
                                                        currentPath={currentPath}
                                                        onNavigate={handleSidebarNavigate}
                                                        onContextMenu={handleSidebarContextMenu}
                                                    />
                                                ))}
                                            </div>

                                            {/* File Area */}
                                            <div className="flex-1 flex flex-col overflow-hidden">
                                                {/* Column Headers (List View only) */}
                                                {viewMode === 'list' && (
                                                    <FinderColumnHeaders
                                                        sortColumn={sortColumn}
                                                        sortDirection={sortDirection}
                                                        onSort={handleSort}
                                                    />
                                                )}

                                                {/* File List / Grid */}
                                                <div className="flex-1 overflow-y-auto">
                                                    {error ? (
                                                        <div className="flex flex-col items-center justify-center h-full gap-3">
                                                            <AlertCircle size={48} className="text-red-400/50" />
                                                            <p className="text-red-400">{error}</p>
                                                            <button
                                                                onClick={() => fetchDirectory(currentPath, false)}
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
                                                    ) : viewMode === 'list' ? (
                                                        <div>
                                                            {displayEntries.map((entry, index) => (
                                                                <FinderFileRow
                                                                    key={entry.path}
                                                                    entry={entry}
                                                                    isSelected={selectedPath === entry.path}
                                                                    isEven={index % 2 === 0}
                                                                    onClick={() => handleEntryClick(entry)}
                                                                    onDoubleClick={() => handleEntryDoubleClick(entry)}
                                                                    onContextMenu={(e) => handleFileContextMenu(e, entry)}
                                                                />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-6 gap-2 p-3">
                                                            {displayEntries.map((entry) => (
                                                                <FinderGridItem
                                                                    key={entry.path}
                                                                    entry={entry}
                                                                    isSelected={selectedPath === entry.path}
                                                                    onClick={() => handleEntryClick(entry)}
                                                                    onDoubleClick={() => handleEntryDoubleClick(entry)}
                                                                    onContextMenu={(e) => handleFileContextMenu(e, entry)}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Path Bar */}
                                        <FinderPathBar
                                            breadcrumbs={listing?.breadcrumbs || []}
                                            onNavigate={(path) => fetchDirectory(path)}
                                            itemCount={displayEntries.length}
                                        />

                                        {/* Footer */}
                                        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                                            <div className="text-xs text-white/40">
                                                {selectedPath && (
                                                    <span className="text-indigo-400">
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
                                                    className="flex items-center gap-2 px-4 py-1.5 rounded-md
                                                   bg-[#0a84ff] hover:bg-[#409cff]
                                                   text-white font-medium text-sm
                                                   disabled:opacity-50 disabled:cursor-not-allowed
                                                   transition-colors active:bg-[#0060df]"
                                                >
                                                    <Check size={16} />
                                                    {mode === 'directory' ? 'Select This Folder' : 'Select'}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Resize Handle */}
                                {windowState === 'normal' && (
                                    <div
                                        onMouseDown={handleResizeStart}
                                        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize
                                               group flex items-center justify-center"
                                        title="Resize"
                                    >
                                        <div className="w-2 h-2 border-r-2 border-b-2 border-white/20 
                                                   group-hover:border-white/40 transition-colors" />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Context Menu Portal */}
            <AnimatePresence>
                {contextMenu && (
                    <FinderContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        items={
                            contextMenu.type === 'sidebar'
                                ? getSidebarMenuItems()
                                : contextMenu.type === 'folder'
                                    ? getFolderMenuItems(contextMenu.target.name)
                                    : getFileMenuItems(contextMenu.target.name)
                        }
                        onClose={() => setContextMenu(null)}
                        onAction={handleContextMenuAction}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default GlassFilePicker;
