/**
 * CoworkInput
 *
 * The "describe your outcome" entry point.
 * Features: Auto-resizing textarea, workspace selector, attachments support,
 * sandbox creation for AI agent file operations.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Folder, FolderOpen, Paperclip, ArrowRight, X, AlertCircle, RefreshCw } from 'lucide-react';

import type { TaskOptions } from '@/types/cowork';
import { GlassFilePicker } from './GlassFilePicker';

interface SandboxSession {
    id: string;
    sourcePath: string;
    status: string;
    createdAt: string;
}

interface CoworkInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (description: string, options: TaskOptions) => void;
    disabled?: boolean;
}

const SANDBOX_API = '/api/v1/sandbox';

export const CoworkInput: React.FC<CoworkInputProps> = ({
    value,
    onChange,
    onSubmit,
    disabled
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [filePickerOpen, setFilePickerOpen] = useState(false);
    const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
    const [sandboxId, setSandboxId] = useState<string | null>(null);
    const [isCreatingSandbox, setIsCreatingSandbox] = useState(false);
    const [sandboxError, setSandboxError] = useState<string | null>(null);
    const [pendingSessions, setPendingSessions] = useState<SandboxSession[]>([]);
    const [showResumePrompt, setShowResumePrompt] = useState(false);

    // Check for pending resume sessions on mount
    useEffect(() => {
        const checkPendingSessions = async () => {
            try {
                const res = await fetch(`${SANDBOX_API}/pending-resume`);
                const data = await res.json();
                if (data.success && data.sessions?.length > 0) {
                    setPendingSessions(data.sessions);
                    setShowResumePrompt(true);
                }
            } catch (err) {
                console.error('Failed to check pending sessions:', err);
            }
        };
        checkPendingSessions();
    }, []);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const newHeight = Math.max(120, Math.min(textareaRef.current.scrollHeight, 400));
            textareaRef.current.style.height = `${newHeight}px`;
        }
    }, [value]);

    // Create sandbox for workspace
    const createSandbox = useCallback(async (workspacePath: string): Promise<string | null> => {
        setIsCreatingSandbox(true);
        setSandboxError(null);

        try {
            const res = await fetch(SANDBOX_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourcePath: workspacePath }),
            });

            const data = await res.json();

            if (!data.success) {
                setSandboxError(data.error || 'Failed to create sandbox');
                return null;
            }

            setSandboxId(data.sandbox.id);
            return data.sandbox.id;
        } catch (err: any) {
            setSandboxError(err.message || 'Network error');
            return null;
        } finally {
            setIsCreatingSandbox(false);
        }
    }, []);

    // Resume a pending session
    const resumeSession = async (session: SandboxSession) => {
        try {
            const res = await fetch(`${SANDBOX_API}/${session.id}/resume`, {
                method: 'POST',
            });
            const data = await res.json();

            if (data.success) {
                setSelectedWorkspace(session.sourcePath);
                setSandboxId(session.id);
                setShowResumePrompt(false);
                setPendingSessions([]);
            }
        } catch (err) {
            console.error('Failed to resume session:', err);
        }
    };

    // Discard a pending session
    const discardSession = async (session: SandboxSession) => {
        try {
            await fetch(`${SANDBOX_API}/${session.id}/discard`, { method: 'POST' });
            setPendingSessions(prev => prev.filter(s => s.id !== session.id));
            if (pendingSessions.length <= 1) {
                setShowResumePrompt(false);
            }
        } catch (err) {
            console.error('Failed to discard session:', err);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!value.trim() || disabled || isCreatingSandbox) return;

        let currentSandboxId = sandboxId;

        // Create sandbox if workspace selected but no sandbox yet
        if (selectedWorkspace && !currentSandboxId) {
            currentSandboxId = await createSandbox(selectedWorkspace);
            if (!currentSandboxId) return; // Error occurred
        }

        onSubmit(value.trim(), {
            workspacePath: selectedWorkspace,
            sandboxId: currentSandboxId || undefined,
        });
    };

    const handleFolderSelect = (path: string) => {
        setSelectedWorkspace(path);
        setSandboxId(null); // Clear any previous sandbox
        setSandboxError(null);
        setFilePickerOpen(false);
    };

    const clearWorkspace = () => {
        setSelectedWorkspace(null);
        setSandboxId(null);
        setSandboxError(null);
    };

    // Get display name for workspace path
    const getWorkspaceDisplayName = (path: string) => {
        const parts = path.split('/');
        return parts[parts.length - 1] || path;
    };

    return (
        <>
            {/* Pending Session Resume Prompt */}
            {showResumePrompt && pendingSessions.length > 0 && (
                <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-amber-400 mt-0.5" size={18} />
                        <div className="flex-1">
                            <p className="text-sm text-amber-400 font-medium mb-2">
                                You have {pendingSessions.length} pending session{pendingSessions.length > 1 ? 's' : ''}
                            </p>
                            {pendingSessions.map((session) => (
                                <div key={session.id} className="flex items-center justify-between mb-2 last:mb-0">
                                    <span className="text-sm text-white/70 truncate max-w-[200px]" title={session.sourcePath}>
                                        {getWorkspaceDisplayName(session.sourcePath)}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => resumeSession(session)}
                                            className="px-2 py-1 text-xs bg-amber-500/20 hover:bg-amber-500/30 
                                                     text-amber-400 rounded transition-colors"
                                        >
                                            Resume
                                        </button>
                                        <button
                                            onClick={() => discardSession(session)}
                                            className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 
                                                     text-white/50 rounded transition-colors"
                                        >
                                            Discard
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowResumePrompt(false)}
                            className="text-white/40 hover:text-white/60"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4">
                {/* Sandbox Error */}
                {sandboxError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {sandboxError}
                    </div>
                )}

                {/* Main Input */}
                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe what you want to accomplish...

Example: Organize my project's documentation folder. Group by topic, create a table of contents, and identify any outdated files."
                        className="w-full min-h-[120px] p-4 rounded-2xl bg-white/5
                                   border border-white/10 focus:border-indigo-500/50
                                   text-white placeholder:text-white/30
                                   resize-none outline-none transition-colors
                                   font-sans text-base leading-relaxed"
                        disabled={disabled || isCreatingSandbox}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-white/20">
                        {value.length} chars • ⌘+Enter to submit
                    </div>
                </div>

                {/* Options Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Workspace Selector */}
                        {selectedWorkspace ? (
                            <div className={`flex items-center gap-1 px-3 py-1.5
                                           rounded-lg border text-sm
                                           ${sandboxId
                                    ? 'bg-green-500/20 border-green-500/30 text-green-400'
                                    : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                                }`}>
                                <FolderOpen size={14} />
                                <span className="max-w-[200px] truncate" title={selectedWorkspace}>
                                    {getWorkspaceDisplayName(selectedWorkspace)}
                                </span>
                                {sandboxId && (
                                    <span className="ml-1 text-xs opacity-60">✓ sandbox</span>
                                )}
                                <button
                                    onClick={clearWorkspace}
                                    className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors"
                                    type="button"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setFilePickerOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5
                                           rounded-lg bg-white/5 hover:bg-white/10
                                           text-sm text-white/60 transition-colors"
                                type="button"
                                disabled={disabled || isCreatingSandbox}
                            >
                                <Folder size={14} />
                                Select folder...
                            </button>
                        )}

                        {/* Attachments */}
                        <button
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            type="button"
                            disabled={disabled || isCreatingSandbox}
                        >
                            <Paperclip size={14} className="text-white/60" />
                        </button>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!value.trim() || disabled || isCreatingSandbox}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                                   bg-gradient-to-r from-indigo-500 to-purple-500
                                   text-white font-medium
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   hover:shadow-lg hover:shadow-indigo-500/25
                                   transition-all active:scale-[0.98]"
                        type="button"
                    >
                        {isCreatingSandbox ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                Creating sandbox...
                            </>
                        ) : (
                            <>
                                Let's go
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* File Picker Modal */}
            <GlassFilePicker
                open={filePickerOpen}
                onClose={() => setFilePickerOpen(false)}
                onSelect={handleFolderSelect}
                mode="both"
                title="Select Workspace"
            />
        </>
    );
};

export default CoworkInput;

