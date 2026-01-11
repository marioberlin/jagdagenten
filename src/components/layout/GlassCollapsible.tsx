import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { TRANSITIONS } from '@/styles/animations';

interface GlassCollapsibleProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

export const GlassCollapsible = ({ trigger, children, defaultOpen = false, className }: GlassCollapsibleProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={cn("w-full", className)}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={TRANSITIONS.spring}
                        className="overflow-hidden"
                    >
                        <div className="pt-2">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

GlassCollapsible.displayName = 'GlassCollapsible';
