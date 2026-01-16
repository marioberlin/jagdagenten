/**
 * DiffReviewer
 *
 * Full-featured diff review interface for sandbox changes.
 * Allows users to review, approve, reject, and resolve conflicts.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Plus,
    Minus,
    Edit3,
    AlertTriangle,
    Check,
    X,
    ChevronDown,
    ChevronRight,
    RotateCcw,
    Eye,
    Code,
    Loader2,
} from 'lucide-react';
import { useSandboxStore, FileChange, FileDecision } from '@/stores/sandboxStore';

// ============================================================================
// Helper Functions
// ============================================================================

function formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let size = bytes;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function getLanguageFromPath(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
        ts: 'typescript',
        tsx: 'typescript',
        js: 'javascript',
        jsx: 'javascript',
        json: 'json',
        md: 'markdown',
        css: 'css',
        scss: 'scss',
        html: 'html',
        py: 'python',
        rs: 'rust',
        go: 'go',
        sql: 'sql',
    };
    return languageMap[ext ?? ''] ?? 'plaintext';
}

// ============================================================================
// File Icon Component
// ============================================================================

function FileIcon({ change }: { change: FileChange }) {
    if (change.hasConflict) {
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }

    switch (change.changeType) {
        case 'added':
            return <Plus className="w-4 h-4 text-green-500" />;
        case 'deleted':
            return <Minus className="w-4 h-4 text-red-500" />;
        case 'modified':
            return <Edit3 className="w-4 h-4 text-blue-500" />;
        default:
            return <FileText className="w-4 h-4 text-gray-400" />;
    }
}

// ============================================================================
// File List Item
// ============================================================================

interface FileListItemProps {
    change: FileChange;
    isSelected: boolean;
    decision?: FileDecision;
    onSelect: () => void;
    onApprove: () => void;
    onReject: () => void;
}

function FileListItem({
    change,
    isSelected,
    decision,
    onSelect,
    onApprove,
    onReject,
}: FileListItemProps) {
    return (
        <div
            className={`
                flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
                hover:bg-white/5
                ${isSelected ? 'bg-white/10' : ''}
            `}
            onClick={onSelect}
        >
            <FileIcon change={change} />
            <span className="flex-1 truncate text-sm text-gray-200">
                {change.relativePath}
            </span>

            {/* Decision buttons */}
            {!change.hasConflict && (
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onApprove();
                        }}
                        className={`p-1 rounded transition-colors ${
                            decision?.action === 'apply'
                                ? 'bg-green-600'
                                : 'hover:bg-white/10'
                        }`}
                        title="Apply this change"
                    >
                        <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onReject();
                        }}
                        className={`p-1 rounded transition-colors ${
                            decision?.action === 'reject'
                                ? 'bg-red-600'
                                : 'hover:bg-white/10'
                        }`}
                        title="Reject this change"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Conflict indicator */}
            {change.hasConflict && (
                <span className="text-xs text-yellow-500 font-medium">
                    CONFLICT
                </span>
            )}
        </div>
    );
}

// ============================================================================
// Conflict Resolver
// ============================================================================

interface ConflictResolverProps {
    change: FileChange;
    onResolve: (content: string) => void;
}

function ConflictResolver({ change, onResolve }: ConflictResolverProps) {
    const [mode, setMode] = useState<'ours' | 'theirs' | 'manual'>('manual');
    const [resolvedContent, setResolvedContent] = useState(
        change.currentContent || ''
    );

    const handleResolve = () => {
        let content = resolvedContent;
        if (mode === 'ours') {
            content = change.currentContent || '';
        } else if (mode === 'theirs') {
            content = change.baselineContent || '';
        }
        onResolve(content);
    };

    return (
        <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/30">
            <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-200">
                    Conflict:{' '}
                    {change.conflictType === 'both_modified'
                        ? 'Both source and sandbox modified this file'
                        : 'Source file was deleted'}
                </span>
            </div>

            <div className="flex items-center gap-2 mb-3">
                <button
                    onClick={() => setMode('ours')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                        mode === 'ours'
                            ? 'bg-blue-600'
                            : 'bg-white/10 hover:bg-white/20'
                    }`}
                >
                    Keep My Changes
                </button>
                <button
                    onClick={() => setMode('theirs')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                        mode === 'theirs'
                            ? 'bg-blue-600'
                            : 'bg-white/10 hover:bg-white/20'
                    }`}
                >
                    Keep Source Changes
                </button>
                <button
                    onClick={() => setMode('manual')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                        mode === 'manual'
                            ? 'bg-blue-600'
                            : 'bg-white/10 hover:bg-white/20'
                    }`}
                >
                    Manual Merge
                </button>
            </div>

            {mode === 'manual' && (
                <textarea
                    value={resolvedContent}
                    onChange={(e) => setResolvedContent(e.target.value)}
                    className="w-full h-40 p-2 mb-3 bg-black/30 border border-white/10 rounded font-mono text-sm resize-none"
                    placeholder="Edit the resolved content..."
                />
            )}

            <button
                onClick={handleResolve}
                className="px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 rounded transition-colors"
            >
                Mark as Resolved
            </button>
        </div>
    );
}

// ============================================================================
// Diff View
// ============================================================================

interface DiffViewProps {
    change: FileChange;
}

function DiffView({ change }: DiffViewProps) {
    const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

    if (!change.baselineContent && !change.currentContent) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>No preview available for this file type</p>
            </div>
        );
    }

    const baselineLines = (change.baselineContent || '').split('\n');
    const currentLines = (change.currentContent || '').split('\n');

    return (
        <div className="h-full flex flex-col">
            {/* View mode toggle */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
                <button
                    onClick={() => setViewMode('split')}
                    className={`px-2 py-1 text-xs rounded ${
                        viewMode === 'split'
                            ? 'bg-white/20'
                            : 'bg-white/5 hover:bg-white/10'
                    }`}
                >
                    Split View
                </button>
                <button
                    onClick={() => setViewMode('unified')}
                    className={`px-2 py-1 text-xs rounded ${
                        viewMode === 'unified'
                            ? 'bg-white/20'
                            : 'bg-white/5 hover:bg-white/10'
                    }`}
                >
                    Unified View
                </button>
            </div>

            {/* Diff content */}
            <div className="flex-1 overflow-auto">
                {viewMode === 'split' ? (
                    <div className="flex h-full">
                        {/* Original */}
                        <div className="flex-1 border-r border-white/10 overflow-auto">
                            <div className="px-2 py-1 text-xs text-gray-500 bg-red-500/10 sticky top-0">
                                Original
                            </div>
                            <pre className="p-2 text-sm font-mono whitespace-pre-wrap">
                                {baselineLines.map((line, i) => (
                                    <div
                                        key={i}
                                        className="flex hover:bg-white/5"
                                    >
                                        <span className="w-10 text-right pr-2 text-gray-600 select-none">
                                            {i + 1}
                                        </span>
                                        <span className="flex-1">{line}</span>
                                    </div>
                                ))}
                            </pre>
                        </div>

                        {/* Modified */}
                        <div className="flex-1 overflow-auto">
                            <div className="px-2 py-1 text-xs text-gray-500 bg-green-500/10 sticky top-0">
                                Modified
                            </div>
                            <pre className="p-2 text-sm font-mono whitespace-pre-wrap">
                                {currentLines.map((line, i) => (
                                    <div
                                        key={i}
                                        className="flex hover:bg-white/5"
                                    >
                                        <span className="w-10 text-right pr-2 text-gray-600 select-none">
                                            {i + 1}
                                        </span>
                                        <span className="flex-1">{line}</span>
                                    </div>
                                ))}
                            </pre>
                        </div>
                    </div>
                ) : (
                    <pre className="p-2 text-sm font-mono whitespace-pre-wrap">
                        {change.currentContent}
                    </pre>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Main DiffReviewer Component
// ============================================================================

export function DiffReviewer() {
    const {
        activeSandbox,
        pendingChanges,
        diffSummary,
        fileDecisions,
        isLoadingDiff,
        isMerging,
        selectedFile,
        setSelectedFile,
        setFileDecision,
        setAllDecisions,
        applyChanges,
        discardSandbox,
        refreshDiff,
    } = useSandboxStore();

    // Group changes by type
    const groupedChanges = useMemo(() => {
        return {
            added: pendingChanges.filter((c) => c.changeType === 'added'),
            modified: pendingChanges.filter((c) => c.changeType === 'modified'),
            deleted: pendingChanges.filter((c) => c.changeType === 'deleted'),
            conflicted: pendingChanges.filter((c) => c.hasConflict),
        };
    }, [pendingChanges]);

    const selectedChange = pendingChanges.find(
        (c) => c.relativePath === selectedFile
    );

    const hasConflicts = diffSummary && diffSummary.conflicts > 0;

    const handleApply = async () => {
        try {
            await applyChanges();
        } catch (error) {
            console.error('Failed to apply changes:', error);
        }
    };

    if (!activeSandbox) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>No active sandbox</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-900/50 backdrop-blur-xl text-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">Review Changes</h2>
                    {diffSummary && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                                <Plus className="w-3 h-3 text-green-500" />
                                {diffSummary.added}
                            </span>
                            <span className="flex items-center gap-1">
                                <Edit3 className="w-3 h-3 text-blue-500" />
                                {diffSummary.modified}
                            </span>
                            <span className="flex items-center gap-1">
                                <Minus className="w-3 h-3 text-red-500" />
                                {diffSummary.deleted}
                            </span>
                            {diffSummary.conflicts > 0 && (
                                <span className="flex items-center gap-1 text-yellow-500">
                                    <AlertTriangle className="w-3 h-3" />
                                    {diffSummary.conflicts} conflicts
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={refreshDiff}
                        disabled={isLoadingDiff}
                        className="p-2 rounded hover:bg-white/10 transition-colors"
                        title="Refresh diff"
                    >
                        <RotateCcw
                            className={`w-4 h-4 ${
                                isLoadingDiff ? 'animate-spin' : ''
                            }`}
                        />
                    </button>
                    <button
                        onClick={() => setAllDecisions('apply')}
                        className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded transition-colors"
                    >
                        Accept All
                    </button>
                    <button
                        onClick={() => setAllDecisions('reject')}
                        className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded transition-colors"
                    >
                        Reject All
                    </button>
                    <button
                        onClick={discardSandbox}
                        className="px-3 py-1.5 text-sm bg-red-600/50 hover:bg-red-600 rounded transition-colors"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={isMerging || hasConflicts}
                        className="px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isMerging ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            'Apply to Project'
                        )}
                    </button>
                </div>
            </div>

            {/* Conflict Warning */}
            {hasConflicts && (
                <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/30 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-yellow-200">
                        {diffSummary.conflicts} file(s) have conflicts. Source
                        files were modified while you were working. Resolve
                        conflicts before applying changes.
                    </span>
                </div>
            )}

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* File List */}
                <div className="w-80 border-r border-white/10 overflow-y-auto">
                    {Object.entries(groupedChanges).map(([type, files]) => {
                        if (files.length === 0) return null;

                        const typeLabels: Record<string, string> = {
                            added: 'Added Files',
                            modified: 'Modified Files',
                            deleted: 'Deleted Files',
                            conflicted: 'Conflicts',
                        };

                        return (
                            <div key={type} className="border-b border-white/10">
                                <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase bg-white/5">
                                    {typeLabels[type]} ({files.length})
                                </div>
                                {files.map((change) => (
                                    <FileListItem
                                        key={change.relativePath}
                                        change={change}
                                        isSelected={
                                            selectedFile === change.relativePath
                                        }
                                        decision={fileDecisions.get(
                                            change.relativePath
                                        )}
                                        onSelect={() =>
                                            setSelectedFile(change.relativePath)
                                        }
                                        onApprove={() =>
                                            setFileDecision(
                                                change.relativePath,
                                                'apply'
                                            )
                                        }
                                        onReject={() =>
                                            setFileDecision(
                                                change.relativePath,
                                                'reject'
                                            )
                                        }
                                    />
                                ))}
                            </div>
                        );
                    })}

                    {pendingChanges.length === 0 && !isLoadingDiff && (
                        <div className="p-4 text-center text-gray-500">
                            No changes detected
                        </div>
                    )}

                    {isLoadingDiff && (
                        <div className="p-4 text-center">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                            <p className="text-sm text-gray-500 mt-2">
                                Loading changes...
                            </p>
                        </div>
                    )}
                </div>

                {/* Diff View */}
                <div className="flex-1 overflow-hidden">
                    {selectedChange ? (
                        <div className="h-full flex flex-col">
                            {/* File header */}
                            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <FileIcon change={selectedChange} />
                                    <span className="font-mono text-sm">
                                        {selectedChange.relativePath}
                                    </span>
                                </div>
                                {selectedChange.sizeBytes && (
                                    <span className="text-xs text-gray-400">
                                        {formatBytes(selectedChange.sizeBytes)}
                                    </span>
                                )}
                            </div>

                            {/* Conflict resolution UI */}
                            {selectedChange.hasConflict && (
                                <ConflictResolver
                                    change={selectedChange}
                                    onResolve={(content) =>
                                        setFileDecision(
                                            selectedChange.relativePath,
                                            'apply',
                                            content
                                        )
                                    }
                                />
                            )}

                            {/* Diff content */}
                            <div className="flex-1 overflow-hidden">
                                <DiffView change={selectedChange} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Select a file to view changes
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DiffReviewer;
