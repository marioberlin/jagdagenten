import React, { useState, useEffect } from 'react';
import { Plus, Upload, Loader2, Database } from 'lucide-react';
import { GeminiProxyService } from '../../services/proxy/gemini';

interface GlassFileSearchProps {
    geminiService: GeminiProxyService | null;
    onConfigChange: (config: { enabled: boolean; stores: string[] }) => void;
}

interface FileStore {
    name: string;
    displayName: string;
}

export const GlassFileSearch: React.FC<GlassFileSearchProps> = ({
    geminiService,
    onConfigChange
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [stores, setStores] = useState<FileStore[]>([]);
    const [selectedStore, setSelectedStore] = useState<string>('');
    const [isCreatingStore, setIsCreatingStore] = useState(false);
    const [newStoreName, setNewStoreName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [isLoadingStores, setIsLoadingStores] = useState(false);

    // Initial Load of Stores
    useEffect(() => {
        if (isOpen && geminiService) {
            loadStores();
        }
    }, [isOpen, geminiService]);

    const loadStores = async () => {
        if (!geminiService) return;
        setIsLoadingStores(true);
        try {
            const response = await geminiService.listFileSearchStores();
            if (response.fileSearchStores) {
                setStores(response.fileSearchStores);

                // Auto-select first store if none selected
                if (!selectedStore && response.fileSearchStores.length > 0) {
                    const firstStore = response.fileSearchStores[0].name;
                    setSelectedStore(firstStore);
                    onConfigChange({ enabled: true, stores: [firstStore] });
                }
            }
        } catch (error) {
            console.error("Failed to list stores:", error);
            setUploadStatus("Failed to load stores");
        } finally {
            setIsLoadingStores(false);
        }
    };

    const handleCreateStore = async () => {
        if (!geminiService || !newStoreName.trim()) return;
        setIsLoadingStores(true);
        try {
            const response = await geminiService.createFileSearchStore(newStoreName);
            setNewStoreName('');
            setIsCreatingStore(false);
            await loadStores();

            if (response.name) {
                setSelectedStore(response.name);
                onConfigChange({ enabled: true, stores: [response.name] });
            }
        } catch (error) {
            console.error("Failed to create store:", error);
            setUploadStatus("Failed to create store");
        } finally {
            setIsLoadingStores(false);
        }
    };

    const handleStoreSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const storeName = e.target.value;
        setSelectedStore(storeName);
        if (storeName) {
            onConfigChange({ enabled: true, stores: [storeName] });
        } else {
            onConfigChange({ enabled: false, stores: [] });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!geminiService || !selectedStore || !e.target.files?.length) return;

        const file = e.target.files[0];
        setIsUploading(true);
        setUploadStatus(`Uploading ${file.name}...`);

        try {
            await geminiService.uploadToFileSearchStore(selectedStore, file);
            setUploadStatus("Upload complete & indexed!");
            setTimeout(() => setUploadStatus(''), 3000);
        } catch (error: any) {
            console.error("Upload failed:", error);
            setUploadStatus(`Error: ${error.message}`);
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    if (!geminiService) return null;

    return (
        <div className="border-t border-white/5">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-4 text-sm font-medium transition-colors ${isOpen ? 'text-primary bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                <div className="flex items-center gap-2">
                    <Database size={16} />
                    <span>Data Sources</span>
                </div>
                <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                </div>
            </button>

            {isOpen && (
                <div className="p-4 bg-black/20 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {/* Store Selector */}
                    <div className="space-y-2">
                        <label className="text-xs text-secondary uppercase font-semibold">Knowledge Store</label>

                        {isLoadingStores ? (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Loader2 size={12} className="animate-spin" /> Loading stores...
                            </div>
                        ) : stores.length > 0 ? (
                            <div className="flex gap-2">
                                <select
                                    value={selectedStore}
                                    onChange={handleStoreSelection}
                                    className="flex-1 bg-white/5 border border-white/10 rounded text-xs text-white p-2 focus:outline-none focus:border-primary/50"
                                >
                                    <option value="" disabled>Select a store...</option>
                                    {stores.map(store => (
                                        <option key={store.name} value={store.name}>
                                            {store.displayName || store.name.split('/').pop()}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setIsCreatingStore(true)}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded border border-white/10"
                                    title="Create New Store"
                                >
                                    <Plus size={14} className="text-white" />
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-2">
                                <p className="text-xs text-gray-500 mb-2">No data stores found.</p>
                                <button
                                    onClick={() => setIsCreatingStore(true)}
                                    className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto"
                                >
                                    <Plus size={12} /> Create Store
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Create Store Form */}
                    {isCreatingStore && (
                        <div className="bg-white/5 p-3 rounded-lg space-y-2 border border-white/10">
                            <input
                                type="text"
                                value={newStoreName}
                                onChange={(e) => setNewStoreName(e.target.value)}
                                placeholder="Store Name (e.g. Project Docs)"
                                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setIsCreatingStore(false)}
                                    className="px-2 py-1 text-xs text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateStore}
                                    disabled={!newStoreName.trim() || isLoadingStores}
                                    className="px-2 py-1 bg-primary/20 text-primary border border-primary/20 rounded text-xs hover:bg-primary/30"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    )}

                    {/* File Upload */}
                    {selectedStore && (
                        <div className="space-y-2">
                            <label className="text-xs text-secondary uppercase font-semibold">Add Documents</label>

                            <div className="relative group">
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    disabled={isUploading}
                                />
                                <div className="border border-dashed border-white/20 rounded-lg p-4 text-center group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                                    {isUploading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 size={20} className="animate-spin text-primary" />
                                            <span className="text-xs text-primary">Uploading...</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <Upload size={16} className="text-gray-400 group-hover:text-primary" />
                                            <span className="text-xs text-gray-400 group-hover:text-white">Click to upload file</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {uploadStatus && (
                                <div className={`text-xs px-2 py-1 rounded ${uploadStatus.includes('Error') || uploadStatus.includes('Failed') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                    {uploadStatus}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
