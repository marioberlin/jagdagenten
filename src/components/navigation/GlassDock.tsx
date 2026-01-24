import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, MotionValue, AnimatePresence } from 'framer-motion';
import { Minus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppStoreStore } from '@/system/app-store/appStoreStore';

export interface DockItem {
    id: string;
    icon: React.ElementType;
    label: string;
    onClick?: () => void;
    isActive?: boolean;
    isPermanent?: boolean;
}

interface GlassDockProps {
    items: DockItem[];
    className?: string;
}

interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    item: DockItem | null;
}

/**
 * GlassDock
 *
 * A macOS-inspired floating dock with magnification physics.
 * Lives at the bottom of the Liquid OS screen.
 */
export const GlassDock: React.FC<GlassDockProps> = ({ items, className }) => {
    const mouseX = useMotionValue(Infinity);
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        visible: false, x: 0, y: 0, item: null
    });

    const handleContextMenu = useCallback((e: React.MouseEvent, item: DockItem) => {
        if (item.isPermanent) return;
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item });
    }, []);

    const closeContextMenu = useCallback(() => {
        setContextMenu(prev => ({ ...prev, visible: false, item: null }));
    }, []);

    return (
        <>
            <div
                className={cn(
                    "fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
                    "flex items-center h-16 gap-3 px-4 rounded-2xl",
                    "bg-[var(--glass-bg)]/80 backdrop-blur-2xl border border-white/10 shadow-2xl",
                    className
                )}
                onMouseMove={(e) => mouseX.set(e.pageX)}
                onMouseLeave={() => mouseX.set(Infinity)}
            >
                {items.map((item) => (
                    <DockIcon
                        key={item.id}
                        mouseX={mouseX}
                        item={item}
                        onContextMenu={handleContextMenu}
                    />
                ))}
            </div>

            <AnimatePresence>
                {contextMenu.visible && contextMenu.item && (
                    <DockContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        item={contextMenu.item}
                        onClose={closeContextMenu}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

// ── Dock Icon ────────────────────────────────────────────────────────────────

const DockIcon = ({
    mouseX,
    item,
    onContextMenu,
}: {
    mouseX: MotionValue;
    item: DockItem;
    onContextMenu: (e: React.MouseEvent, item: DockItem) => void;
}) => {
    const ref = useRef<HTMLDivElement>(null);

    const distance = useTransform(mouseX, (val) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    const widthSync = useTransform(distance, [-150, 0, 150], [50, 100, 50]);
    const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

    const Icon = item.icon;

    return (
        <motion.div
            ref={ref}
            style={{ width, height: width }}
            onClick={item.onClick}
            onContextMenu={(e) => onContextMenu(e, item)}
            className={cn(
                "relative flex items-center justify-center rounded-xl cursor-pointer transition-colors group text-white/50 hover:text-white",
                item.isActive ? "bg-[var(--glass-accent)]/20 text-[var(--glass-accent)]" : "bg-white/5 hover:bg-white/10",
                "aspect-square"
            )}
        >
            {/* Active Indicator */}
            {item.isActive && (
                <div className="absolute -bottom-2 w-1 h-1 rounded-full bg-[var(--glass-accent)]" />
            )}

            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 rounded-md text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {item.label}
            </div>

            <Icon className="w-1/2 h-1/2" />
        </motion.div>
    );
};

// ── Context Menu (macOS-style) ───────────────────────────────────────────────

const DockContextMenu: React.FC<{
    x: number;
    y: number;
    item: DockItem;
    onClose: () => void;
}> = ({ x, y, item, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const removeFromDock = useAppStoreStore((s) => s.removeFromDock);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const handleRemove = () => {
        removeFromDock(item.id);
        onClose();
    };

    // Position menu above the dock, clamped to viewport
    const menuY = Math.max(8, y - 80);
    const menuX = Math.max(8, Math.min(x - 80, window.innerWidth - 180));

    return (
        <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.92, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 4 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[200] min-w-[160px]"
            style={{ top: menuY, left: menuX }}
        >
            <div className="rounded-lg overflow-hidden bg-[#2a2a2e]/95 backdrop-blur-2xl border border-white/10 shadow-2xl py-1">
                {/* App name header */}
                <div className="px-3 py-1.5 text-[11px] font-medium text-white/50 truncate">
                    {item.label}
                </div>
                <div className="h-px bg-white/10 mx-2" />
                {/* Remove from Dock */}
                <button
                    onClick={handleRemove}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-white/90 hover:bg-[var(--glass-accent)]/30 hover:text-white transition-colors text-left"
                >
                    <Minus size={14} className="text-white/50" />
                    Remove from Dock
                </button>
            </div>
        </motion.div>
    );
};
