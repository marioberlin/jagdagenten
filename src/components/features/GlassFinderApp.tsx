import React, { useState, useEffect } from 'react';
import { GlassButton } from '@/components/primitives/GlassButton';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { FileSpreadsheet, Clock, HardDrive, Loader2, Sparkles, LogIn, LogOut, Grid, List as ListIcon } from 'lucide-react';

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
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        const stored = localStorage.getItem('liquid_recent_sheets');
        if (stored) {
            try {
                setRecentFiles(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse recent files', e);
            }
        }
    }, []);

    const handleFileSelect = (file: { id: string, name: string, url: string }) => {
        const newFile: ParsedFile = { ...file, lastOpened: Date.now() };

        // Update recent files
        const updated = [newFile, ...recentFiles.filter(f => f.id !== file.id)].slice(0, 10);
        setRecentFiles(updated);
        localStorage.setItem('liquid_recent_sheets', JSON.stringify(updated));

        if (onFileOpen) {
            onFileOpen(newFile);
        } else {
            // Default behavior if no handler: open in new tab or handle internally
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

            // 1. Ensure access to Master Template (Backend shares it with user)
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

            // 2. Client-side Copy (User copies to their own Drive)
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

            // Successfully created, open it
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

    return (
        <div className="flex flex-col h-full bg-black/40 text-white p-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <GlassButton
                        variant="secondary"
                        size="sm"
                        className={viewMode === 'grid' ? 'bg-white/20' : ''}
                        onClick={() => setViewMode('grid')}
                    >
                        <Grid size={16} />
                    </GlassButton>
                    <GlassButton
                        variant="secondary"
                        size="sm"
                        className={viewMode === 'list' ? 'bg-white/20' : ''}
                        onClick={() => setViewMode('list')}
                    >
                        <ListIcon size={16} />
                    </GlassButton>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                        <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-400' : 'bg-orange-400'}`} />
                        <span className="text-xs text-white/70">
                            {isAuthenticated ? 'Drive Connected' : 'Guest'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col h-full gap-6 overflow-hidden">
                {/* Actions */}
                <div className="grid grid-cols-2 gap-4 flex-shrink-0">
                    <GlassButton
                        variant="primary"
                        className="h-24 flex flex-col gap-2 items-center justify-center border-dashed border-2 border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10"
                        onClick={handleOpenPicker}
                        disabled={!isApiLoaded}
                    >
                        <div className="p-2 rounded-full bg-blue-500/20 text-blue-400">
                            <HardDrive size={24} />
                        </div>
                        <span className="text-sm font-medium">Open from Drive</span>
                        {!isApiLoaded && <span className="text-[10px] text-white/40">Loading API...</span>}
                    </GlassButton>

                    <GlassButton
                        variant="secondary"
                        className="h-24 flex flex-col gap-2 items-center justify-center border-dashed border-2 border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 relative overflow-hidden"
                        onClick={handleCreateNew}
                        disabled={isCreating}
                    >
                        {isCreating ? (
                            <>
                                <Loader2 size={24} className="animate-spin text-[var(--glass-accent)]" />
                                <span className="text-sm font-medium text-[var(--glass-accent)]">Cloning Template...</span>
                            </>
                        ) : (
                            <>
                                <div className="p-2 rounded-full bg-green-500/20 text-green-400">
                                    <Sparkles size={24} />
                                </div>
                                <span className="text-sm font-medium">New Smart Sheet</span>
                                <span className="text-[10px] text-white/40">From Master Template</span>
                            </>
                        )}
                    </GlassButton>
                </div>

                {createError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex-shrink-0">
                        Creation Error: {createError}. Check backend logs.
                    </div>
                )}

                {driveError && (
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs flex-shrink-0">
                        {driveError}
                    </div>
                )}

                {/* Auth Action if needed */}
                {!isAuthenticated && (
                    <div className="flex justify-center flex-shrink-0">
                        <GlassButton
                            variant="primary"
                            size="sm"
                            onClick={signIn}
                            disabled={isAuthLoading}
                            className="gap-2"
                        >
                            {isAuthLoading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                            Sign In to Access Drive
                        </GlassButton>
                    </div>
                )}

                {isAuthenticated && (
                    <div className="flex justify-center flex-shrink-0">
                        <GlassButton
                            variant="ghost"
                            size="sm"
                            onClick={signOut}
                            className="text-xs gap-1 text-white/40 hover:text-white"
                        >
                            <LogOut size={12} />
                            Sign Out
                        </GlassButton>
                    </div>
                )}

                {/* Recent Files */}
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <div className="flex items-center gap-2 mb-4 text-xs font-medium text-white/40 uppercase tracking-wider flex-shrink-0">
                        <Clock size={12} />
                        Recent Files
                    </div>

                    <div className="overflow-y-auto custom-scrollbar pr-2 flex-1">
                        {recentFiles.length === 0 ? (
                            <div className="text-center py-10 text-white/20 text-sm">
                                No recent sheets found
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-3" : "space-y-2"}>
                                {recentFiles.map((file) => (
                                    <button
                                        key={file.id}
                                        onClick={() => handleFileSelect(file)}
                                        className={`w-full flex ${viewMode === 'grid' ? 'flex-col items-center text-center p-4' : 'items-center text-left p-3 gap-4'} rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group`}
                                    >
                                        <div className="p-2 rounded-lg bg-green-500/10 text-green-400 group-hover:bg-green-500/20 transition-colors mb-2">
                                            <FileSpreadsheet size={24} />
                                        </div>
                                        <div className="min-w-0 w-full">
                                            <div className="text-sm font-medium text-white truncate">{file.name}</div>
                                            <div className="text-xs text-white/40 truncate">Google Sheet • {new Date(file.lastOpened || 0).toLocaleDateString()}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
