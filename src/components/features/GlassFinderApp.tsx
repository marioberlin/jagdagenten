import React, { useState, useEffect } from 'react';
import { GlassButton } from '@/components/primitives/GlassButton';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { FileSpreadsheet, Clock, Cloud, Loader2, Sparkles, LogIn, LogOut, FolderOpen, Plus, ExternalLink } from 'lucide-react';

interface ParsedFile {
    id: string;
    name: string;
    url: string;
    lastOpened?: number;
}

interface GlassFinderAppProps {
    onClose?: () => void;
    onFileOpen?: (file: ParsedFile) => void;
}

export const GlassFinderApp: React.FC<GlassFinderAppProps> = ({
    onClose,
    onFileOpen,
}) => {
    const {
        openPicker,
        isApiLoaded,
        error: driveError,
        isAuthenticated,
        signIn,
        signOut,
        isAuthLoading,
        accessToken
    } = useGoogleDrive();
    const [recentFiles, setRecentFiles] = useState<ParsedFile[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    // Fetch recent spreadsheets from Google Drive when authenticated
    useEffect(() => {
        if (!isAuthenticated || !accessToken) return;

        async function fetchRecentFiles() {
            setIsLoadingFiles(true);
            try {
                const params = new URLSearchParams({
                    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
                    orderBy: 'viewedByMeTime desc',
                    pageSize: '20',
                    fields: 'files(id,name,viewedByMeTime,modifiedTime)',
                });
                const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    const files: ParsedFile[] = (data.files || []).map((f: any) => ({
                        id: f.id,
                        name: f.name,
                        url: `https://docs.google.com/spreadsheets/d/${f.id}/edit`,
                        lastOpened: f.viewedByMeTime ? new Date(f.viewedByMeTime).getTime() : undefined,
                    }));
                    setRecentFiles(files);
                }
            } catch (e) {
                console.error('Failed to fetch recent Drive files', e);
            } finally {
                setIsLoadingFiles(false);
            }
        }
        fetchRecentFiles();
    }, [isAuthenticated, accessToken]);

    const handleFileSelect = (file: { id: string, name: string, url: string }) => {
        const newFile: ParsedFile = { ...file, lastOpened: Date.now() };

        const updated = [newFile, ...recentFiles.filter(f => f.id !== file.id)].slice(0, 20);
        setRecentFiles(updated);

        if (onFileOpen) {
            onFileOpen(newFile);
        } else {
            window.open(newFile.url, '_blank');
        }

        if (onClose) onClose();
    };

    const handleOpenPicker = () => {
        openPicker({
            onSelect: handleFileSelect,
            onCancel: () => console.log('Picker cancelled')
        });
    };

    const handleCreateNew = async () => {
        setIsCreating(true);
        setCreateError(null);
        try {
            if (!isAuthenticated || !accessToken) {
                signIn();
                throw new Error("Please sign in to Google Drive first.");
            }

            const userEmail = prompt('Enter your Google Email (to ensure template access):', 'user@example.com');
            if (!userEmail) {
                setIsCreating(false);
                return;
            }

            try {
                const shareResponse = await fetch('http://localhost:3000/api/v1/sheets/share-template', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userEmail })
                });
                if (!shareResponse.ok) console.warn("Share template warning:", await shareResponse.text());
            } catch (e) {
                console.warn("Share template failed, proceeding anyway...", e);
            }

            const templateId = import.meta.env.VITE_GOOGLE_MASTER_TEMPLATE_ID;
            if (!templateId) throw new Error("Template ID not configured in environment");

            const metadata = {
                name: `LiquidCrypto Smart Sheet - ${new Date().toLocaleDateString()}`,
                mimeType: 'application/vnd.google-apps.spreadsheet'
            };

            const copyRes = await fetch(`https://www.googleapis.com/drive/v3/files/${templateId}/copy`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metadata)
            });

            if (!copyRes.ok) {
                const errData = await copyRes.json();
                throw new Error(errData.error?.message || "Failed to copy file to your Drive");
            }

            const newFile = await copyRes.json();

            handleFileSelect({
                id: newFile.id,
                name: newFile.name,
                url: `https://docs.google.com/spreadsheets/d/${newFile.id}/edit`
            });

        } catch (err: any) {
            console.error('Create failed', err);
            setCreateError(err.message || 'Failed to create sheet');
        } finally {
            setIsCreating(false);
        }
    };

    // Not authenticated — show connection prompt
    if (!isAuthenticated) {
        return (
            <div className="flex flex-col h-full text-white">
                {/* Header bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Cloud size={14} className="text-white/50" />
                        <span className="text-xs text-white/60">Google Drive</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                        <span className="text-[10px] text-orange-400">Not Connected</span>
                    </div>
                </div>

                {/* Connection prompt */}
                <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <Cloud size={32} className="text-white/30" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-sm font-medium text-white/80">Connect to Google Drive</h3>
                        <p className="text-xs text-white/40 max-w-[240px]">
                            Sign in to browse files, open spreadsheets, and create new sheets from templates.
                        </p>
                    </div>
                    <GlassButton
                        variant="primary"
                        size="sm"
                        onClick={signIn}
                        disabled={isAuthLoading}
                        className="gap-2"
                    >
                        {isAuthLoading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                        Sign In with Google
                    </GlassButton>
                    {driveError && (
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] text-center max-w-[280px]">
                            {driveError}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Authenticated — show Drive content
    return (
        <div className="flex flex-col h-full text-white">
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Cloud size={14} className="text-blue-400" />
                    <span className="text-xs text-white/70">Google Drive</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        <span className="text-[10px] text-green-400">Connected</span>
                    </div>
                    <button
                        onClick={signOut}
                        className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                    >
                        <LogOut size={12} />
                    </button>
                </div>
            </div>

            {/* Actions row */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 flex-shrink-0">
                <button
                    onClick={handleOpenPicker}
                    disabled={!isApiLoaded}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <FolderOpen size={14} className="text-blue-400" />
                    <span className="text-xs text-white/80">Open from Drive</span>
                </button>
                <button
                    onClick={handleCreateNew}
                    disabled={isCreating}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isCreating ? (
                        <Loader2 size={14} className="animate-spin text-green-400" />
                    ) : (
                        <Plus size={14} className="text-green-400" />
                    )}
                    <span className="text-xs text-white/80">
                        {isCreating ? 'Creating...' : 'New Smart Sheet'}
                    </span>
                </button>
            </div>

            {/* Error messages */}
            {(createError || driveError) && (
                <div className="px-4 pt-2 flex-shrink-0">
                    {createError && (
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px]">
                            {createError}
                        </div>
                    )}
                    {driveError && (
                        <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] mt-1">
                            {driveError}
                        </div>
                    )}
                </div>
            )}

            {/* Recent files list */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Section header */}
                <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-medium text-white/40 uppercase tracking-wider flex-shrink-0">
                    <Clock size={10} />
                    Recent Files
                </div>

                {/* File list */}
                <div className="flex-1 overflow-y-auto">
                    {isLoadingFiles ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <Loader2 size={20} className="animate-spin text-white/30" />
                            <p className="text-xs text-white/30">Loading files...</p>
                        </div>
                    ) : recentFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
                            <Sparkles size={20} className="text-white/15" />
                            <div className="text-center space-y-1">
                                <p className="text-xs text-white/30">No recent files</p>
                                <p className="text-[11px] text-white/20">
                                    Open a file from Drive or create a new sheet to get started.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="px-1">
                            {recentFiles.map((file) => (
                                <button
                                    key={file.id}
                                    onClick={() => handleFileSelect(file)}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors rounded-md group"
                                >
                                    <div className="p-1.5 rounded-md bg-green-500/10 text-green-400 group-hover:bg-green-500/15 transition-colors flex-shrink-0">
                                        <FileSpreadsheet size={16} />
                                    </div>
                                    <div className="min-w-0 flex-1 text-left">
                                        <div className="text-xs font-medium text-white/80 truncate">{file.name}</div>
                                        <div className="text-[10px] text-white/35 truncate">
                                            Google Sheet {file.lastOpened ? `\u00b7 ${new Date(file.lastOpened).toLocaleDateString()}` : ''}
                                        </div>
                                    </div>
                                    <ExternalLink size={12} className="text-white/0 group-hover:text-white/30 transition-colors flex-shrink-0" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer status */}
            <div className="flex items-center justify-between px-4 py-1.5 border-t border-white/10 flex-shrink-0">
                <span className="text-[10px] text-white/30">
                    {recentFiles.length} {recentFiles.length === 1 ? 'file' : 'files'}
                </span>
                <span className="text-[10px] text-white/20">Google Drive</span>
            </div>
        </div>
    );
};
