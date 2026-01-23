import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, AppWindow, Bot, X } from 'lucide-react';
import { useAppStoreStore } from '@/system/app-store/appStoreStore';
import { CURATED_AGENTS } from '@/services/agents/registry';

export interface TargetSelection {
    type: 'app' | 'agent';
    id: string;
    name: string;
}

interface FileTargetPickerProps {
    x: number;
    y: number;
    title: string;
    onSelect: (target: TargetSelection) => void;
    onClose: () => void;
}

export const FileTargetPicker: React.FC<FileTargetPickerProps> = ({
    x, y, title, onSelect, onClose,
}) => {
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const installedApps = useAppStoreStore((s) => s.installedApps);

    const apps = useMemo(() =>
        Object.values(installedApps).map(app => ({
            type: 'app' as const,
            id: app.id,
            name: app.manifest.name,
            icon: app.manifest.icon,
        })),
    [installedApps]);

    const agents = useMemo(() =>
        CURATED_AGENTS.slice(0, 20).map(agent => ({
            type: 'agent' as const,
            id: agent.id,
            name: agent.name,
        })),
    []);

    const filteredApps = useMemo(() => {
        if (!search.trim()) return apps;
        const q = search.toLowerCase();
        return apps.filter(a => a.name.toLowerCase().includes(q));
    }, [apps, search]);

    const filteredAgents = useMemo(() => {
        if (!search.trim()) return agents;
        const q = search.toLowerCase();
        return agents.filter(a => a.name.toLowerCase().includes(q));
    }, [agents, search]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const adjustedX = Math.min(x, window.innerWidth - 260);
    const adjustedY = Math.min(y, window.innerHeight - 360);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[110] w-[240px] rounded-lg bg-[#1e1e2e]/98 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/50 overflow-hidden"
            style={{ left: adjustedX, top: adjustedY }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                <span className="text-[11px] font-medium text-white/60">{title}</span>
                <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
                    <X size={12} />
                </button>
            </div>

            {/* Search */}
            <div className="px-2 py-1.5 border-b border-white/5">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white/5">
                    <Search size={12} className="text-white/30 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full bg-transparent text-xs text-white/80 placeholder-white/25 outline-none"
                    />
                </div>
            </div>

            {/* List */}
            <div className="max-h-[280px] overflow-y-auto py-1">
                {/* Apps section */}
                {filteredApps.length > 0 && (
                    <>
                        <div className="px-3 py-1 text-[9px] font-semibold text-white/30 uppercase tracking-wider">Apps</div>
                        {filteredApps.map(app => (
                            <button
                                key={app.id}
                                onClick={() => onSelect({ type: 'app', id: app.id, name: app.name })}
                                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-white/8 transition-colors"
                            >
                                <AppWindow size={13} className="text-blue-400 flex-shrink-0" />
                                <span className="text-[11px] text-white/80 truncate">{app.name}</span>
                            </button>
                        ))}
                    </>
                )}

                {/* Agents section */}
                {filteredAgents.length > 0 && (
                    <>
                        <div className="px-3 py-1 mt-1 text-[9px] font-semibold text-white/30 uppercase tracking-wider">Agents</div>
                        {filteredAgents.map(agent => (
                            <button
                                key={agent.id}
                                onClick={() => onSelect({ type: 'agent', id: agent.id, name: agent.name })}
                                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-white/8 transition-colors"
                            >
                                <Bot size={13} className="text-purple-400 flex-shrink-0" />
                                <span className="text-[11px] text-white/80 truncate">{agent.name}</span>
                            </button>
                        ))}
                    </>
                )}

                {filteredApps.length === 0 && filteredAgents.length === 0 && (
                    <div className="px-3 py-4 text-center text-[11px] text-white/25">No results</div>
                )}
            </div>
        </motion.div>
    );
};
