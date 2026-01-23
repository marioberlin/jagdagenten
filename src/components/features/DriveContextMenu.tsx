import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Copy, Edit3, Trash2, BrainCircuit, BookOpen, Database } from 'lucide-react';
import { FileTargetPicker, TargetSelection } from './FileTargetPicker';

interface ContextMenuItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    dividerAfter?: boolean;
    danger?: boolean;
}

export interface DriveFile {
    id: string;
    name: string;
    url: string;
    mimeType?: string;
    fileType?: string;
}

interface DriveContextMenuProps {
    x: number;
    y: number;
    file: DriveFile;
    accessToken: string;
    onClose: () => void;
    onFileUpdated?: (action: 'duplicate' | 'rename' | 'delete', file: DriveFile, newFile?: DriveFile) => void;
}

const MENU_ITEMS: ContextMenuItem[] = [
    { id: 'open', label: 'Open', icon: <ExternalLink size={14} /> },
    { id: 'duplicate', label: 'Duplicate', icon: <Copy size={14} /> },
    { id: 'rename', label: 'Rename', icon: <Edit3 size={14} /> },
    { id: 'delete', label: 'Delete', icon: <Trash2 size={14} />, danger: true, dividerAfter: true },
    { id: 'add-context', label: 'Add to Context', icon: <BrainCircuit size={14} /> },
    { id: 'add-knowledge', label: 'Add to Knowledge', icon: <BookOpen size={14} /> },
    { id: 'add-rag', label: 'Add to RAG', icon: <Database size={14} /> },
];

export const DriveContextMenu: React.FC<DriveContextMenuProps> = ({
    x, y, file, accessToken, onClose, onFileUpdated,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [pickerMode, setPickerMode] = useState<'context' | 'knowledge' | 'rag' | null>(null);
    const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                if (!pickerMode) onClose();
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (pickerMode) setPickerMode(null);
                else onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose, pickerMode]);

    const handleAction = async (actionId: string) => {
        switch (actionId) {
            case 'open':
                window.open(file.url, '_blank');
                onClose();
                break;

            case 'duplicate': {
                try {
                    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}/copy`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ name: `${file.name} (copy)` }),
                    });
                    if (res.ok) {
                        const newFile = await res.json();
                        onFileUpdated?.('duplicate', file, {
                            id: newFile.id,
                            name: newFile.name,
                            url: file.url.replace(file.id, newFile.id),
                            mimeType: file.mimeType,
                            fileType: file.fileType,
                        });
                    }
                } catch (e) {
                    console.error('Duplicate failed:', e);
                }
                onClose();
                break;
            }

            case 'rename': {
                const newName = prompt('Rename file:', file.name);
                if (newName && newName !== file.name) {
                    try {
                        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ name: newName }),
                        });
                        if (res.ok) {
                            onFileUpdated?.('rename', file, { ...file, name: newName });
                        }
                    } catch (e) {
                        console.error('Rename failed:', e);
                    }
                }
                onClose();
                break;
            }

            case 'delete': {
                if (confirm(`Move "${file.name}" to trash?`)) {
                    try {
                        await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ trashed: true }),
                        });
                        onFileUpdated?.('delete', file);
                    } catch (e) {
                        console.error('Delete failed:', e);
                    }
                }
                onClose();
                break;
            }

            case 'add-context':
            case 'add-knowledge':
            case 'add-rag': {
                const mode = actionId === 'add-context' ? 'context'
                    : actionId === 'add-knowledge' ? 'knowledge' : 'rag';
                setPickerMode(mode);
                const menuX = Math.min(x, window.innerWidth - 220);
                setPickerPos({ x: menuX + 210, y: Math.min(y, window.innerHeight - 360) });
                break;
            }
        }
    };

    const handleTargetSelect = (target: TargetSelection) => {
        const contextItem = {
            fileId: file.id,
            name: file.name,
            url: file.url,
            mimeType: file.mimeType,
            source: 'google-drive',
            addedAt: Date.now(),
        };

        if (pickerMode === 'context') {
            const key = `liquid_context_${target.type}_${target.id}`;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            if (!existing.some((item: any) => item.fileId === file.id)) {
                existing.push(contextItem);
                localStorage.setItem(key, JSON.stringify(existing));
            }
        } else {
            // knowledge or rag — upload to FileSearch store
            const storeName = `${target.type}_${target.id}`;
            fetch(`http://localhost:3000/api/file-search/stores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: storeName, displayName: `${target.name} Knowledge` }),
            }).catch(() => {});

            // For Google Drive files, store the reference
            const ragKey = `liquid_rag_${target.type}_${target.id}`;
            const existing = JSON.parse(localStorage.getItem(ragKey) || '[]');
            if (!existing.some((item: any) => item.fileId === file.id)) {
                existing.push(contextItem);
                localStorage.setItem(ragKey, JSON.stringify(existing));
            }
        }

        setPickerMode(null);
        onClose();
    };

    const adjustedX = Math.min(x, window.innerWidth - 220);
    const adjustedY = Math.min(y, window.innerHeight - (MENU_ITEMS.length * 32 + 16));

    const pickerTitle = pickerMode === 'context' ? 'Add to Context'
        : pickerMode === 'knowledge' ? 'Add to Knowledge'
        : 'Add to RAG';

    return (
        <>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="fixed z-[100] min-w-[200px] py-1 rounded-lg bg-[#2a2a3e]/98 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/40"
                style={{ left: adjustedX, top: adjustedY }}
            >
                {MENU_ITEMS.map((item) => (
                    <React.Fragment key={item.id}>
                        <button
                            onClick={() => handleAction(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-1.5 text-left text-sm transition-colors ${
                                item.danger
                                    ? 'text-red-400 hover:bg-red-500/20'
                                    : 'text-white/90 hover:bg-white/10'
                            }`}
                        >
                            <span className={`w-4 flex-shrink-0 ${item.danger ? 'text-red-400' : 'text-white/50'}`}>
                                {item.icon}
                            </span>
                            <span className="truncate">{item.label}</span>
                        </button>
                        {item.dividerAfter && <div className="my-1 border-t border-white/10" />}
                    </React.Fragment>
                ))}
            </motion.div>

            <AnimatePresence>
                {pickerMode && (
                    <FileTargetPicker
                        x={pickerPos.x}
                        y={pickerPos.y}
                        title={pickerTitle}
                        onSelect={handleTargetSelect}
                        onClose={() => setPickerMode(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};
