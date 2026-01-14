import React, { useState, useEffect } from 'react';
import { GlassSheet } from '@/components/overlays/GlassSheet';
import { GlassButton } from '@/components/primitives/GlassButton';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { FileSpreadsheet, Clock, HardDrive, Loader2, Sparkles } from 'lucide-react';

interface ParsedFile {
    id: string;
    name: string;
    url: string;
    lastOpened?: number;
}

interface GlassFilesPanelProps {
    open: boolean;
    onClose: () => void;
    onFileOpen: (file: ParsedFile) => void;
}

export const GlassFilesPanel: React.FC<GlassFilesPanelProps> = ({
    open,
    onClose,
    onFileOpen,
}) => {
    const { openPicker, isApiLoaded, error: driveError } = useGoogleDrive();
    const [recentFiles, setRecentFiles] = useState<ParsedFile[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

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

        onFileOpen(newFile);
        onClose();
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
            // In a real app, you'd get the user's email from the auth context
            // For now, prompt or hardcode for demo
            const userEmail = prompt('Enter your Google Email to share the sheet with:', 'user@example.com');
            if (!userEmail) {
                setIsCreating(false);
                return;
            }

            const response = await fetch('http://localhost:3000/api/v1/sheets/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, title: 'New Smart Sheet' })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create sheet');
            }

            // Successfully created, open it
            handleFileSelect({
                id: result.data.id,
                name: result.data.name,
                url: result.data.url
            });

        } catch (err) {
            console.error('Create failed', err);
            setCreateError(err instanceof Error ? err.message : 'Failed to create sheet');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <GlassSheet
            open={open}
            onOpenChange={onClose}
            title="Smart Sheets"
            description="Open Google Sheets with AI superpowers"
            side="right"
            className="w-[400px] sm:w-[540px]"
        >
            <div className="flex flex-col h-full gap-6">
                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
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
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                        Creation Error: {createError}. Check backend logs.
                    </div>
                )}

                {driveError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                        Error loading Drive API: {driveError}. Check .env configuration.
                    </div>
                )}

                {/* Recent Files */}
                <div className="flex-1 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                        <Clock size={12} />
                        Recent Files
                    </div>

                    <div className="space-y-2">
                        {recentFiles.length === 0 ? (
                            <div className="text-center py-10 text-white/20 text-sm">
                                No recent sheets found
                            </div>
                        ) : (
                            recentFiles.map((file) => (
                                <button
                                    key={file.id}
                                    onClick={() => handleFileSelect(file)}
                                    className="w-full flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group text-left"
                                >
                                    <div className="p-2 rounded-lg bg-green-500/10 text-green-400 group-hover:bg-green-500/20 transition-colors">
                                        <FileSpreadsheet size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-white truncate">{file.name}</div>
                                        <div className="text-xs text-white/40 truncate">Google Sheet • {new Date(file.lastOpened || 0).toLocaleDateString()}</div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </GlassSheet>
    );
};
