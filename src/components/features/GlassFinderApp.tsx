import React, { useState, useEffect } from 'react';
import { GlassButton } from '@/components/primitives/GlassButton';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { FileSpreadsheet, FileText, Presentation, Clock, Cloud, Loader2, Sparkles, LogIn, LogOut, FolderOpen, Plus, ExternalLink } from 'lucide-react';

type DriveFileType = 'spreadsheet' | 'document' | 'presentation';

interface ParsedFile {
    id: string;
    name: string;
    url: string;
    mimeType?: string;
    fileType?: DriveFileType;
    lastOpened?: number;
}

interface GlassFinderAppProps {
    onClose?: () => void;
    onFileOpen?: (file: ParsedFile) => void;
}

const MIME_TYPES: Record<DriveFileType, string> = {
    spreadsheet: 'application/vnd.google-apps.spreadsheet',
    document: 'application/vnd.google-apps.document',
    presentation: 'application/vnd.google-apps.presentation',
};

const FILE_TYPE_CONFIG: Record<DriveFileType, { label: string; color: string; bgColor: string; urlBase: string }> = {
    spreadsheet: { label: 'Sheets', color: 'text-green-400', bgColor: 'bg-green-500/10', urlBase: 'https://docs.google.com/spreadsheets/d/' },
    document: { label: 'Docs', color: 'text-blue-400', bgColor: 'bg-blue-500/10', urlBase: 'https://docs.google.com/document/d/' },
    presentation: { label: 'Slides', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', urlBase: 'https://docs.google.com/presentation/d/' },
};

function getFileType(mimeType?: string): DriveFileType {
    if (mimeType?.includes('spreadsheet')) return 'spreadsheet';
    if (mimeType?.includes('presentation')) return 'presentation';
    return 'document';
}

function FileIcon({ type, size = 16 }: { type: DriveFileType; size?: number }) {
    switch (type) {
        case 'spreadsheet': return <FileSpreadsheet size={size} />;
        case 'presentation': return <Presentation size={size} />;
        default: return <FileText size={size} />;
    }
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
    const [creatingType, setCreatingType] = useState<DriveFileType | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);

    // Fetch recent Docs, Sheets, and Slides from Google Drive
    useEffect(() => {
        if (!isAuthenticated || !accessToken) return;

        async function fetchRecentFiles() {
            setIsLoadingFiles(true);
            try {
                const mimeQuery = Object.values(MIME_TYPES)
                    .map(m => `mimeType='${m}'`)
                    .join(' or ');
                const params = new URLSearchParams({
                    q: `(${mimeQuery}) and trashed=false`,
                    orderBy: 'viewedByMeTime desc',
                    pageSize: '30',
                    fields: 'files(id,name,mimeType,viewedByMeTime,modifiedTime)',
                });
                const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    const files: ParsedFile[] = (data.files || []).map((f: any) => {
                        const fileType = getFileType(f.mimeType);
                        const config = FILE_TYPE_CONFIG[fileType];
                        return {
                            id: f.id,
                            name: f.name,
                            mimeType: f.mimeType,
                            fileType,
                            url: `${config.urlBase}${f.id}/edit`,
                            lastOpened: f.viewedByMeTime ? new Date(f.viewedByMeTime).getTime() : undefined,
                        };
                    });
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

    const handleFileSelect = (file: ParsedFile) => {
        if (onFileOpen) {
            onFileOpen(file);
        } else {
            window.open(file.url, '_blank');
        }
        if (onClose) onClose();
    };

    const handleOpenPicker = () => {
        openPicker({
            onSelect: handleFileSelect,
            onCancel: () => console.log('Picker cancelled')
        });
    };

    const handleCreateNew = async (type: DriveFileType) => {
        setCreatingType(type);
        setCreateError(null);
        try {
            if (!isAuthenticated || !accessToken) {
                signIn();
                throw new Error("Please sign in to Google Drive first.");
            }

            const config = FILE_TYPE_CONFIG[type];
            const metadata = {
                name: `Untitled ${config.label.slice(0, -1)} - ${new Date().toLocaleDateString()}`,
                mimeType: MIME_TYPES[type],
            };

            const res = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(metadata),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error?.message || `Failed to create ${config.label}`);
            }

            const newFile = await res.json();
            const created: ParsedFile = {
                id: newFile.id,
                name: newFile.name,
                fileType: type,
                mimeType: MIME_TYPES[type],
                url: `${config.urlBase}${newFile.id}/edit`,
                lastOpened: Date.now(),
            };

            // Open immediately and prepend to list
            setRecentFiles(prev => [created, ...prev]);
            window.open(created.url, '_blank');

        } catch (err: any) {
            console.error('Create failed', err);
            setCreateError(err.message || 'Failed to create file');
        } finally {
            setCreatingType(null);
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
                            Sign in to browse files, open spreadsheets, docs, and presentations.
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
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 flex-shrink-0 overflow-x-auto">
                <button
                    onClick={handleOpenPicker}
                    disabled={!isApiLoaded}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                    <FolderOpen size={14} className="text-blue-400" />
                    <span className="text-xs text-white/80">Open</span>
                </button>
                <div className="w-px h-5 bg-white/10 flex-shrink-0" />
                <button
                    onClick={() => handleCreateNew('document')}
                    disabled={creatingType !== null}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    title="New Google Doc"
                >
                    {creatingType === 'document' ? (
                        <Loader2 size={13} className="animate-spin text-blue-400" />
                    ) : (
                        <FileText size={13} className="text-blue-400" />
                    )}
                    <Plus size={10} className="text-white/50" />
                </button>
                <button
                    onClick={() => handleCreateNew('spreadsheet')}
                    disabled={creatingType !== null}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    title="New Google Sheet"
                >
                    {creatingType === 'spreadsheet' ? (
                        <Loader2 size={13} className="animate-spin text-green-400" />
                    ) : (
                        <FileSpreadsheet size={13} className="text-green-400" />
                    )}
                    <Plus size={10} className="text-white/50" />
                </button>
                <button
                    onClick={() => handleCreateNew('presentation')}
                    disabled={creatingType !== null}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    title="New Google Slides"
                >
                    {creatingType === 'presentation' ? (
                        <Loader2 size={13} className="animate-spin text-yellow-400" />
                    ) : (
                        <Presentation size={13} className="text-yellow-400" />
                    )}
                    <Plus size={10} className="text-white/50" />
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
                                    Open a file from Drive or create a new document to get started.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="px-1">
                            {recentFiles.map((file) => {
                                const type = file.fileType || getFileType(file.mimeType);
                                const config = FILE_TYPE_CONFIG[type];
                                return (
                                    <button
                                        key={file.id}
                                        onClick={() => handleFileSelect(file)}
                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors rounded-md group"
                                    >
                                        <div className={`p-1.5 rounded-md ${config.bgColor} ${config.color} group-hover:opacity-80 transition-colors flex-shrink-0`}>
                                            <FileIcon type={type} size={16} />
                                        </div>
                                        <div className="min-w-0 flex-1 text-left">
                                            <div className="text-xs font-medium text-white/80 truncate">{file.name}</div>
                                            <div className="text-[10px] text-white/35 truncate">
                                                {config.label} {file.lastOpened ? `\u00b7 ${new Date(file.lastOpened).toLocaleDateString()}` : ''}
                                            </div>
                                        </div>
                                        <ExternalLink size={12} className="text-white/0 group-hover:text-white/30 transition-colors flex-shrink-0" />
                                    </button>
                                );
                            })}
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
