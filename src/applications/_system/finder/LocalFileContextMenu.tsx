import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Copy, Edit3, Trash2, BrainCircuit, BookOpen, Database } from 'lucide-react';
import { FileTargetPicker, TargetSelection } from '@/components/features/FileTargetPicker';
import type { FileEntry } from './types';

interface ContextMenuItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    dividerAfter?: boolean;
    danger?: boolean;
    hideForDir?: boolean;
}

interface LocalFileContextMenuProps {
    x: number;
    y: number;
    entry: FileEntry;
    onClose: () => void;
    onNavigate: (path: string) => void;
    onFileUpdated?: () => void;
}

const MENU_ITEMS: ContextMenuItem[] = [
    { id: 'open', label: 'Open', icon: <ExternalLink size={14} /> },
    { id: 'duplicate', label: 'Duplicate', icon: <Copy size={14} />, hideForDir: true },
    { id: 'rename', label: 'Rename', icon: <Edit3 size={14} /> },
    { id: 'delete', label: 'Delete', icon: <Trash2 size={14} />, danger: true, dividerAfter: true },
    { id: 'add-context', label: 'Add to Context', icon: <BrainCircuit size={14} />, hideForDir: true },
    { id: 'add-knowledge', label: 'Add to Knowledge', icon: <BookOpen size={14} />, hideForDir: true },
    { id: 'add-rag', label: 'Add to RAG', icon: <Database size={14} />, hideForDir: true },
];

export const LocalFileContextMenu: React.FC<LocalFileContextMenuProps> = ({
    x, y, entry, onClose, onNavigate, onFileUpdated,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [pickerMode, setPickerMode] = useState<'context' | 'knowledge' | 'rag' | null>(null);
    const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });

    const visibleItems = entry.type === 'directory'
        ? MENU_ITEMS.filter(item => !item.hideForDir)
        : MENU_ITEMS;

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
                if (entry.type === 'directory') {
                    onNavigate(entry.path);
                }
                onClose();
                break;

            case 'duplicate': {
                try {
                    const ext = entry.name.includes('.') ? '.' + entry.name.split('.').pop() : '';
                    const baseName = entry.name.replace(ext, '');
                    const newPath = entry.path.replace(entry.name, `${baseName} (copy)${ext}`);
                    await fetch('/api/system/files/copy', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ source: entry.path, destination: newPath }),
                    });
                    onFileUpdated?.();
                } catch (e) {
                    console.error('Duplicate failed:', e);
                }
                onClose();
                break;
            }

            case 'rename': {
                const newName = prompt('Rename:', entry.name);
                if (newName && newName !== entry.name) {
                    try {
                        const newPath = entry.path.replace(entry.name, newName);
                        await fetch('/api/system/files/rename', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ source: entry.path, destination: newPath }),
                        });
                        onFileUpdated?.();
                    } catch (e) {
                        console.error('Rename failed:', e);
                    }
                }
                onClose();
                break;
            }

            case 'delete': {
                if (confirm(`Delete "${entry.name}"?`)) {
                    try {
                        await fetch('/api/system/files/delete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path: entry.path }),
                        });
                        onFileUpdated?.();
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
            path: entry.path,
            name: entry.name,
            type: entry.type,
            source: 'local',
            addedAt: Date.now(),
        };

        if (pickerMode === 'context') {
            const key = `liquid_context_${target.type}_${target.id}`;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            if (!existing.some((item: any) => item.path === entry.path)) {
                existing.push(contextItem);
                localStorage.setItem(key, JSON.stringify(existing));
            }
        } else {
            const storeName = `${target.type}_${target.id}`;
            fetch('/api/file-search/stores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: storeName, displayName: `${target.name} Knowledge` }),
            }).catch(() => {});

            const ragKey = `liquid_rag_${target.type}_${target.id}`;
            const existing = JSON.parse(localStorage.getItem(ragKey) || '[]');
            if (!existing.some((item: any) => item.path === entry.path)) {
                existing.push(contextItem);
                localStorage.setItem(ragKey, JSON.stringify(existing));
            }
        }

        setPickerMode(null);
        onClose();
    };

    const adjustedX = Math.min(x, window.innerWidth - 220);
    const adjustedY = Math.min(y, window.innerHeight - (visibleItems.length * 32 + 16));

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
                {visibleItems.map((item) => (
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
