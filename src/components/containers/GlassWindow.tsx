import React, { useRef, useState } from 'react';
import { motion, useDragControls, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { X, Minus, Maximize2, MoreVertical } from 'lucide-react';

export interface WindowMenuItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
}

interface GlassWindowProps {
    /** Unique identifier for the window */
    id: string;
    title: string | React.ReactNode;
    /** Optional icon to show before the title */
    titleIcon?: React.ReactNode;
    /** Optional badge to show next to the title (e.g., "Verified") */
    titleBadge?: React.ReactNode;
    /** Optional status element to show on the right side of the title bar */
    titleStatus?: React.ReactNode;
    /** Optional dropdown menu items for the three-dots menu */
    titleMenu?: WindowMenuItem[];
    /** Optional custom header right content (alternative to titleMenu) */
    headerRight?: React.ReactNode;
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
    titleIcon,
    titleBadge,
    titleStatus,
    titleMenu,
    headerRight,
    children,
    initialPosition = { x: 100, y: 100 },
    initialSize = { width: 600, height: 400 },
    onClose,
    onMinimize: _onMinimize,
    isActive = false,
    onFocus,
    className
}) => {
    const dragControls = useDragControls();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Window State
    const [position, setPosition] = useState(initialPosition);
    const [size, setSize] = useState(initialSize);
    const previousState = useRef({ position: initialPosition, size: initialSize });

    // Resizing State
    const [_isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef<{
        startX: number;
        startY: number;
        startWidth: number;
        startHeight: number;
        startLeft: number;
        startTop: number;
        direction: string;
    } | null>(null);

    // Sync drag position
    const handleDragEnd = (_event: any, info: any) => {
        if (!isMaximized) {
            const newPos = { x: position.x + info.offset.x, y: position.y + info.offset.y };
            setPosition(newPos);
        }
    };

    // Traffic Light Handlers
    const handleMaximize = () => {
        if (!isMaximized) {
            // Save state before maximizing
            previousState.current = { position, size };

            // Maximize with constraints (Menu Bar: 30px top, 5px margin sides)
            setPosition({ x: 5, y: 30 });
            setSize({
                width: window.innerWidth - 10,
                height: window.innerHeight - 30
            });
            setIsMaximized(true);
        } else {
            // Restore or Re-Maximize if state mismatch
            if (!isMaximized) {
                previousState.current = { position, size };
                setPosition({ x: 5, y: 30 });
                setSize({
                    width: window.innerWidth - 10,
                    height: window.innerHeight - 30
                });
                setIsMaximized(true);
            }
        }
    };

    const handleRestore = () => {
        if (isMaximized) {
            setPosition(previousState.current.position);
            setSize(previousState.current.size);
            setIsMaximized(false);
        }
    };

    // Resize Handlers
    const startResize = (e: React.PointerEvent, direction: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (isMaximized) return;

        setIsResizing(true);
        resizeRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startWidth: size.width,
            startHeight: size.height,
            startLeft: position.x,
            startTop: position.y,
            direction
        };

        document.addEventListener('pointermove', handleResizeMove);
        document.addEventListener('pointerup', handleResizeEnd);
    };

    const handleResizeMove = (e: PointerEvent) => {
        if (!resizeRef.current) return;

        const { startX, startY, startWidth, startHeight, startLeft, startTop, direction } = resizeRef.current;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startLeft;
        let newY = startTop;

        if (direction.includes('e')) newWidth = Math.max(300, startWidth + deltaX);
        if (direction.includes('s')) newHeight = Math.max(200, startHeight + deltaY);
        if (direction.includes('w')) {
            const possibleWidth = Math.max(300, startWidth - deltaX);
            newWidth = possibleWidth;
            newX = startLeft + (startWidth - possibleWidth);
        }
        if (direction.includes('n')) {
            const possibleHeight = Math.max(200, startHeight - deltaY);
            newHeight = possibleHeight;
            newY = startTop + (startHeight - possibleHeight);
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
    };

    const handleResizeEnd = () => {
        setIsResizing(false);
        resizeRef.current = null;
        document.removeEventListener('pointermove', handleResizeMove);
        document.removeEventListener('pointerup', handleResizeEnd);
    };

    // Cleanup listeners on unmount
    React.useEffect(() => {
        return () => {
            document.removeEventListener('pointermove', handleResizeMove);
            document.removeEventListener('pointerup', handleResizeEnd);
        };
    }, []);

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isMenuOpen]);

    return (
        <motion.div
            ref={containerRef}
            data-window-id={id}
            drag={!isMaximized}
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            initial={{
                x: initialPosition.x,
                y: initialPosition.y,
                width: initialSize.width,
                height: initialSize.height,
                scale: 0.95,
                opacity: 0
            }}
            animate={{
                x: position.x,
                y: position.y,
                width: size.width,
                height: size.height,
                scale: isActive ? 1 : 0.98,
                opacity: 1,
            }}
            onPointerDown={onFocus}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: isActive ? 50 : 10,
            }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
            }}
            className={cn(
                "group rounded-xl overflow-hidden shadow-2xl backdrop-blur-3xl border border-white/10 flex flex-col",
                isActive ? "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border-white/20" : "shadow-xl border-white/5",
                className
            )}
        >
            {/* Glass Background Layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none -z-10" />
            <div className={cn(
                "absolute inset-0 bg-[var(--glass-bg)] opacity-[var(--glass-opacity)] transition-opacity -z-10",
                isActive ? "opacity-90" : "opacity-70"
            )} />

            {/* Window Header (Handle) */}
            <div
                className="relative h-10 flex-shrink-0 flex items-center justify-between px-4 select-none cursor-default border-b border-white/10 bg-white/5"
                onPointerDown={(e) => {
                    dragControls.start(e);
                }}
            >
                <div className="flex items-center gap-2 z-20">
                    {/* Traffic Lights */}
                    <div className="flex gap-2 group/lights">
                        {/* Red: Close */}
                        <button
                            onClick={onClose}
                            className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] flex items-center justify-center group-hover/lights:opacity-100 opacity-80 hover:opacity-100 transition-opacity"
                        >
                            <X size={8} className="text-black/60 opacity-0 group-hover/lights:opacity-100" strokeWidth={3} />
                        </button>

                        {/* Yellow: Restore */}
                        <button
                            onClick={handleRestore}
                            className={cn(
                                "w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] flex items-center justify-center group-hover/lights:opacity-100 opacity-80 hover:opacity-100 transition-opacity",
                                !isMaximized && "opacity-40 cursor-default"
                            )}
                        >
                            <Minus size={8} className="text-black/60 opacity-0 group-hover/lights:opacity-100" strokeWidth={3} />
                        </button>

                        {/* Green: Maximize */}
                        <button
                            onClick={handleMaximize}
                            className={cn(
                                "w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] flex items-center justify-center group-hover/lights:opacity-100 opacity-80 hover:opacity-100 transition-opacity",
                                isMaximized && "opacity-40 cursor-default"
                            )}
                        >
                            <Maximize2 size={8} className="text-black/60 opacity-0 group-hover/lights:opacity-100" strokeWidth={3} />
                        </button>
                    </div>
                </div>

                <div
                    className="absolute inset-0 flex items-center justify-center gap-2 font-medium text-sm text-white/70 pointer-events-none"
                >
                    {titleIcon}
                    <span>{title}</span>
                    {titleBadge}
                </div>

                {/* Right side: status + menu OR headerRight */}
                <div className="flex items-center gap-2 z-20 pr-1">
                    {titleStatus}

                    {/* Three dots menu */}
                    {titleMenu && titleMenu.length > 0 && (
                        <div ref={menuRef} className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(!isMenuOpen);
                                }}
                                className="p-1 rounded hover:bg-white/10 transition-colors"
                            >
                                <MoreVertical size={14} className="text-white/50 hover:text-white/80" />
                            </button>

                            <AnimatePresence>
                                {isMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-1 min-w-[180px] py-1 rounded-lg bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl z-50"
                                    >
                                        {titleMenu.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    item.onClick();
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2 transition-colors"
                                            >
                                                {item.icon}
                                                {item.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Header Right Content (alternative to titleMenu) */}
                    {headerRight && (
                        <div className="relative flex items-center">
                            {headerRight}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="relative flex-1 overflow-hidden">
                {children}
            </div>

            {/* Resize Handles - Only visible/active when not maximized */}
            {!isMaximized && (
                <>
                    {/* Corners */}
                    <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50" onPointerDown={(e) => startResize(e, 'se')} />
                    <div className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-50" onPointerDown={(e) => startResize(e, 'sw')} />
                    <div className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize z-50" onPointerDown={(e) => startResize(e, 'ne')} />
                    <div className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-50" onPointerDown={(e) => startResize(e, 'nw')} />

                    {/* Edges */}
                    <div className="absolute bottom-0 left-4 right-4 h-1 cursor-s-resize z-40" onPointerDown={(e) => startResize(e, 's')} />
                    <div className="absolute top-0 left-4 right-4 h-1 cursor-n-resize z-40" onPointerDown={(e) => startResize(e, 'n')} />
                    <div className="absolute left-0 top-4 bottom-4 w-1 cursor-w-resize z-40" onPointerDown={(e) => startResize(e, 'w')} />
                    <div className="absolute right-0 top-4 bottom-4 w-1 cursor-e-resize z-40" onPointerDown={(e) => startResize(e, 'e')} />
                </>
            )}
        </motion.div>
    );
};
