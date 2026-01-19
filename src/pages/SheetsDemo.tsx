import { useState } from 'react';
import { GlassSmartSheet } from '@/components/features/GlassSmartSheet';
import { GlassFilesApp } from '@/components/features/GlassFilesApp';
import { GlassButton } from '@/components/primitives/GlassButton';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { FileSpreadsheet, FolderOpen } from 'lucide-react';

export const SheetsDemo = () => {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [filesOpen, setFilesOpen] = useState(false);
    const [currentDocId, setCurrentDocId] = useState(
        import.meta.env.VITE_GOOGLE_MASTER_TEMPLATE_ID || '1XjNGCjk2szcnZVB2T1iZpnVN95Bq2dsXo2mFiXjxzb0'
    ); // Uses template ID from env or fallback
    const [currentTitle, setCurrentTitle] = useState('Demo Smart Sheet');

    const handleFileSelect = (file: { id: string, name: string }) => {
        setCurrentDocId(file.id);
        setCurrentTitle(file.name);
        setSheetOpen(true);
    };

    return (
        <div className="min-h-screen pt-24 px-8 pb-8 flex flex-col items-center justify-center gap-8 relative overflow-hidden">
            {/* Background Ambient */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-900/10 to-black pointer-events-none" />

            <GlassContainer className="max-w-xl w-full p-8 flex flex-col items-center text-center gap-6 z-10">
                <div className="p-4 rounded-full bg-green-500/20 text-green-400 mb-2">
                    <FileSpreadsheet size={48} />
                </div>

                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">
                        Liquid Sheets
                    </h1>
                    <p className="text-white/40">
                        Experience the "Trojan Horse" integration. Open a Google Sheet and chat with it using our AI Agent bridge.
                    </p>
                </div>

                <div className="flex gap-4 w-full">
                    <GlassButton
                        variant="primary"
                        size="lg"
                        className="flex-1 justify-center"
                        onClick={() => setSheetOpen(true)}
                    >
                        <FileSpreadsheet size={18} className="mr-2" />
                        Open Demo Sheet
                    </GlassButton>
                    <GlassButton
                        variant="secondary"
                        size="lg"
                        className="flex-1 justify-center"
                        onClick={() => setFilesOpen(true)}
                    >
                        <FolderOpen size={18} className="mr-2" />
                        Browse Drive
                    </GlassButton>
                </div>

                <div className="text-xs text-white/20 mt-4">
                    Requires .env keys for Drive Picker. <br />
                    Requires "LiquidCrypto Bridge" script for Agent Chat.
                </div>
            </GlassContainer>

            {/* Components */}
            <GlassSmartSheet
                docId={currentDocId}
                title={currentTitle}
                isOpen={sheetOpen}
                onClose={() => setSheetOpen(false)}
            />

            <GlassFilesApp
                open={filesOpen}
                onClose={() => setFilesOpen(false)}
                onFileOpen={handleFileSelect}
            />
        </div>
    );
};
