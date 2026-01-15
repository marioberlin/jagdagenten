import React, { useState } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassInput } from '../forms/GlassInput';
import { GlassButton } from '../primitives/GlassButton';
import { X, ExternalLink, RefreshCw, Send, Maximize2, Minimize2, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/utils/cn';

interface GlassSmartSheetProps {
    docId: string;
    title?: string;
    isOpen: boolean;
    onClose: () => void;
    className?: string;
}

export const GlassSmartSheet: React.FC<GlassSmartSheetProps> = ({
    docId,
    title = 'Untitled Smart Sheet',
    isOpen,
    onClose,
    className
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [agentPrompt, setAgentPrompt] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    if (!isOpen) return null;

    const handleRefresh = () => {
        setIsRefreshing(true);
        // Force iframe reload hack
        const iframe = document.getElementById('smart-sheet-frame') as HTMLIFrameElement;
        if (iframe) {
            // eslint-disable-next-line no-self-assign
            iframe.src = iframe.src;
        }
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const handleAgentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!agentPrompt.trim()) return;

        // Mock agent interaction
        console.log('Sending to agent:', agentPrompt);
        setAgentPrompt('');
    };

    // Construct the embedded URL with clean parameters
    // rm=minimal: Hides menus (we want some menus, but minimal usually still shows context)
    // Actually for "Trojan Horse" we need to ensure users can see the custom menu.
    // rm=minimal often HIDES custom menus. We might need standard view with chrome=false.
    // Let's us rm=demo first to check, or just standard /edit.
    // Best compat for custom menus is standard /edit but maybe hide some UI via other means if possible.
    // For now, let's stick to a clean-ish URL.
    const embedUrl = `https://docs.google.com/spreadsheets/d/${docId}/edit?rm=minimal`;

    return (
        <div className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all",
            !isOpen && "pointer-events-none opacity-0"
        )}>
            <GlassContainer
                className={cn(
                    "flex flex-col overflow-hidden transition-all duration-300 ease-spring-item",
                    isExpanded ? "w-[95vw] h-[95vh]" : "w-[90vw] max-w-6xl h-[85vh]",
                    className
                )}
                material="thick" // Strong glass for heavy content
            >
                {/* === Header === */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 select-none">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                            <FileSpreadsheet size={18} />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-sm font-semibold text-white">{title}</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-white/40 font-mono">ID: {docId.substring(0, 8)}...</span>
                                <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px]">
                                    AI Connected
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <GlassButton
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/40 hover:text-white"
                            onClick={handleRefresh}
                            title="Refresh Sheet"
                        >
                            <RefreshCw size={14} className={cn(isRefreshing && "animate-spin")} />
                        </GlassButton>
                        <GlassButton
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/40 hover:text-white"
                            onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${docId}/edit`, '_blank')}
                            title="Open in New Tab"
                        >
                            <ExternalLink size={14} />
                        </GlassButton>
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <GlassButton
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/40 hover:text-white"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </GlassButton>
                        <GlassButton
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400/60 hover:text-red-400 hover:bg-red-400/10"
                            onClick={onClose}
                        >
                            <X size={14} />
                        </GlassButton>
                    </div>
                </div>

                {/* === Iframe Content === */}
                <div className="flex-1 relative bg-white">
                    <iframe
                        id="smart-sheet-frame"
                        src={embedUrl}
                        className="absolute inset-0 w-full h-full border-none"
                        allow="clipboard-write"
                        title="Google Smart Sheet"
                    />
                </div>

                {/* === Agent Command Bar === */}
                <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-xl">
                    <form onSubmit={handleAgentSubmit} className="flex gap-3 max-w-4xl mx-auto">
                        <div className="flex-1 relative group">
                            <GlassInput
                                value={agentPrompt}
                                onChange={(e) => setAgentPrompt(e.target.value)}
                                placeholder="Ask the agent to analyze, format, or enrich this sheet..."
                                className="w-full pr-10 border-white/10 focus:border-[var(--glass-accent)]/50 bg-black/20"
                                autoFocus
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none opacity-40">
                                <span className="text-xs px-1.5 py-0.5 rounded border border-white/20">⌘</span>
                                <span className="text-xs px-1.5 py-0.5 rounded border border-white/20">K</span>
                            </div>
                        </div>
                        <GlassButton
                            type="submit"
                            variant="primary"
                            disabled={!agentPrompt.trim()}
                            className="px-6 shadow-lg shadow-[var(--glass-accent)]/20"
                        >
                            <Send size={16} className="mr-2" />
                            Run
                        </GlassButton>
                    </form>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-white/30">
                            Agent has read/write access via Bridge API • Last synced: Just now
                        </p>
                    </div>
                </div>
            </GlassContainer>
        </div>
    );
};
