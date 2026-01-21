import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';
import { cn } from '../../utils/cn';

interface DockItem {
    id: string;
    icon: React.ElementType;
    label: string;
    onClick?: () => void;
    isActive?: boolean;
}

interface GlassDockProps {
    items: DockItem[];
    className?: string;
}

/**
 * GlassDock
 *
 * A macOS-inspired floating dock with magnification physics.
 * Lives at the bottom of the Liquid OS screen.
 */
export const GlassDock: React.FC<GlassDockProps> = ({ items, className }) => {
    const mouseX = useMotionValue(Infinity);

    return (
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
                <DockIcon key={item.id} mouseX={mouseX} item={item} />
            ))}
        </div>
    );
};

const DockIcon = ({ mouseX, item }: { mouseX: MotionValue; item: DockItem }) => {
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
