import React, { useState } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassAgent, AgentState } from './GlassAgent';
import { cn } from '@/utils/cn';
import { X, Maximize2, Minimize2, FileText, Sparkles } from 'lucide-react';

interface GlassCopilotProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Current state of the copilot agent */
    state?: AgentState;
    /** Context being analyzed (e.g., "Reading file.tsx") */
    context?: string;
    /** Whether the copilot is expanded or collapsed */
    defaultExpanded?: boolean;
    /** Callback when collapse/expand state changes */
    onExpandedChange?: (expanded: boolean) => void;
    /** Callback when closed */
    onClose?: () => void;
    /** Position on screen (for floating mode) */
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    /** Interaction mode */
    mode?: 'floating' | 'sidebar';
}

const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
};

export const GlassCopilot = React.forwardRef<HTMLDivElement, GlassCopilotProps>(
    ({
        className,
        state = 'idle',
        context,
        defaultExpanded = false,
        onExpandedChange,
        onClose,
        position = 'bottom-right',
        mode = 'floating',
        children,
        ...props
    }, ref) => {
        const [expanded, setExpanded] = useState(defaultExpanded);

        const toggleExpanded = () => {
            // For sidebar, we might trigger a persistent open/close or just collapse to a thin strip
            const newState = !expanded;
            setExpanded(newState);
            onExpandedChange?.(newState);
        };

        // SIDEBAR MODE
        if (mode === 'sidebar') {
            return (
                <div
                    ref={ref}
                    className={cn(
                        "fixed top-0 bottom-0 right-0 z-40 transition-all duration-300 ease-in-out border-l border-white/10",
                        expanded ? "w-[400px]" : "w-[60px]",
                        className
                    )}
                    {...props}
                >
                    <GlassContainer
                        material="thick"
                        className="w-full h-full flex flex-col rounded-none rounded-l-2xl overflow-hidden"
                    >
                        {/* Sidebar Header */}
                        <div className={cn(
                            "flex items-center p-4 border-b border-white/10 h-16",
                            expanded ? "justify-between" : "justify-center"
                        )}>
                            <div className="flex items-center gap-3">
                                <GlassAgent state={state} size="sm" className={cn("p-0 bg-transparent shadow-none border-none", !expanded && "scale-75")} />
                                {expanded && (
                                    <div className="flex flex-col">
                                        <h3 className="font-bold text-primary leading-tight">Copilot</h3>
                                        {context && <span className="text-xs text-secondary truncate max-w-[200px]">{context}</span>}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={toggleExpanded}
                                className="p-1.5 rounded-full hover:bg-glass-surface-hover text-secondary hover:text-primary transition-colors"
                            >
                                {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                        </div>

                        {/* Sidebar Content */}
                        {expanded && (
                            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                                {children || (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                                        <GlassAgent state="idle" size="lg" variant="flux" />
                                        <p className="text-sm">Ready to assist.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Sidebar Footer/Actions when collapsed */}
                        {!expanded && (
                            <div className="flex-1 flex flex-col items-center py-4 gap-4">
                                <button className="p-2 rounded-full hover:bg-white/10 text-secondary" title="New Chat">
                                    <Sparkles size={20} />
                                </button>
                            </div>
                        )}
                    </GlassContainer>
                </div>
            )
        }

        // FLOATING MODE (Default) - Collapsed pill state
        if (!expanded) {
            return (
                <div
                    ref={ref}
                    className={cn(
                        'fixed z-50',
                        positionClasses[position],
                        className
                    )}
                    {...props}
                >
                    <GlassContainer
                        material="thick"
                        interactive
                        className={cn(
                            'flex items-center gap-3 px-4 py-2 cursor-pointer',
                            'hover:scale-105 transition-transform duration-300'
                        )}
                        onClick={toggleExpanded}
                    >
                        <GlassAgent state={state} size="sm" className="p-0 bg-transparent shadow-none border-none" />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-primary">Copilot</span>
                            {context && (
                                <span className="text-xs text-secondary flex items-center gap-1">
                                    <FileText size={10} />
                                    {context}
                                </span>
                            )}
                        </div>
                        <Maximize2 size={14} className="text-secondary ml-2" />
                    </GlassContainer>
                </div>
            );
        }

        // FLOATING MODE (Default) - Expanded chat state
        return (
            <div
                ref={ref}
                className={cn(
                    'fixed z-50',
                    positionClasses[position],
                    className
                )}
                {...props}
            >
                <GlassContainer
                    material="thick"
                    className="w-[360px] max-h-[500px] flex flex-col overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-glass-border">
                        <div className="flex items-center gap-3">
                            <GlassAgent state={state} size="sm" className="p-0 bg-transparent shadow-none border-none" />
                            <div>
                                <h3 className="font-semibold text-primary flex items-center gap-1.5">
                                    Copilot
                                    <Sparkles size={12} className="text-accent" />
                                </h3>
                                {context && (
                                    <span className="text-xs text-secondary flex items-center gap-1">
                                        <FileText size={10} />
                                        {context}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={toggleExpanded}
                                className="p-1.5 rounded-full hover:bg-glass-surface-hover text-secondary hover:text-primary transition-colors"
                            >
                                <Minimize2 size={14} />
                            </button>
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-full hover:bg-glass-surface-hover text-secondary hover:text-primary transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-4 min-h-[200px]">
                        {children || (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                                <GlassAgent state={state} size="lg" />
                                <p className="text-sm text-secondary max-w-[200px]">
                                    I'm your AI assistant. Ask me anything about your code.
                                </p>
                            </div>
                        )}
                    </div>
                </GlassContainer>
            </div>
        );
    }
);

GlassCopilot.displayName = 'GlassCopilot';
