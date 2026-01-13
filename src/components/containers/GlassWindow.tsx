import React, { useRef, useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { cn } from '../../utils/cn';
import { X, Minus, Maximize2 } from 'lucide-react';

interface GlassWindowProps {
    /** Unique identifier for the window */
    id: string;
    title: string;
    children: React.ReactNode;
    initialPosition?: { x: number; y: number };
    initialSize?: { width: number; height: number };
    onClose?: () => void;
    onMinimize?: () => void;
    isActive?: boolean;
    onFocus?: () => void;
    className?: string;
}

/**
 * GlassWindow
 *
 * A Draggable, Z-Current, Glassmorphic window container.
 * Uses framer-motion for smooth Drag physics.
 */
export const GlassWindow: React.FC<GlassWindowProps> = ({
    id,
    title,
    children,
    initialPosition = { x: 100, y: 100 },
    initialSize = { width: 600, height: 400 },
    onClose,
    onMinimize,
    isActive = false,
    onFocus,
    className
}) => {
    const dragControls = useDragControls();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMaximized, setIsMaximized] = useState(false);

    return (
        <motion.div
            ref={containerRef}
            data-window-id={id}
            drag={!isMaximized}
            dragListener={false} // Only drag from header
            dragControls={dragControls}
            dragMomentum={false}
            initial={initialPosition}
            onPointerDown={onFocus}
            style={{
                position: 'absolute',
                width: isMaximized ? '100%' : initialSize.width,
                height: isMaximized ? '100%' : initialSize.height,
                zIndex: isActive ? 50 : 10,
                top: 0,
                left: 0,
                ...(isMaximized && { right: 0, bottom: 0 })
            }}
            animate={{
                scale: isActive ? 1 : 0.98,
                opacity: 1,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
                "group rounded-2xl overflow-hidden shadow-2xl backdrop-blur-3xl border border-white/10",
                isActive ? "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border-white/20" : "shadow-xl border-white/5",
                className
            )}
        >
            {/* Glass Background Layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <div className={cn(
                "absolute inset-0 bg-[var(--glass-bg)] opacity-[var(--glass-opacity)] transition-opacity",
                isActive ? "opacity-90" : "opacity-70"
            )} />

            {/* Window Header (Handle) */}
            <div
                className="relative h-10 flex items-center justify-between px-4 select-none cursor-grab active:cursor-grabbing border-b border-white/10 bg-white/5"
                onPointerDown={(e) => dragControls.start(e)}
            >
                <div className="flex items-center gap-2">
                    {/* Traffic Lights */}
                    <div className="flex gap-1.5 group/lights">
                        <button
                            onClick={onClose}
                            className="w-3 h-3 rounded-full bg-slate-500/50 hover:bg-red-500 transition-colors flex items-center justify-center group-hover/lights:text-black/50"
                        >
                            <X size={8} className="opacity-0 group-hover/lights:opacity-100" strokeWidth={3} />
                        </button>
                        <button
                            onClick={onMinimize}
                            className="w-3 h-3 rounded-full bg-slate-500/50 hover:bg-yellow-500 transition-colors flex items-center justify-center group-hover/lights:text-black/50"
                        >
                            <Minus size={8} className="opacity-0 group-hover/lights:opacity-100" strokeWidth={3} />
                        </button>
                        <button
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="w-3 h-3 rounded-full bg-slate-500/50 hover:bg-green-500 transition-colors flex items-center justify-center group-hover/lights:text-black/50"
                        >
                            <Maximize2 size={8} className="opacity-0 group-hover/lights:opacity-100" strokeWidth={3} />
                        </button>
                    </div>
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 font-medium text-sm text-white/70">
                    {title}
                </div>
            </div>

            {/* Content Area */}
            <div className="relative h-[calc(100%-40px)] overflow-auto p-4 custom-scrollbar">
                {children}
            </div>
        </motion.div>
    );
};
