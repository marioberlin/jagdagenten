import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

interface PortalFrameProps {
    children: React.ReactNode;
    activeMode: 'os' | 'rush-hour';
    className?: string;
}

/**
 * PortalFrame
 *
 * A specialized transition wrapper that handles the "Dimensional Jump"
 * between the Liquid OS (Spatial) and RushHour (Grid/Dense).
 */
export const PortalFrame: React.FC<PortalFrameProps> = ({
    children,
    activeMode,
    className
}) => {
    return (
        <div className={cn("relative w-full h-full overflow-hidden", className)}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeMode}
                    initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                    transition={{
                        duration: 0.5,
                        ease: [0.32, 0.72, 0, 1]
                    }}
                    className="w-full h-full"
                >
                    {children}
                </motion.div>
            </AnimatePresence>

            {/* Optional Grain Overlay to unify the worlds */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-repeat bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
    );
};
