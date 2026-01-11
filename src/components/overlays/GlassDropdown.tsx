import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { TRANSITIONS } from '@/styles/animations';

interface GlassDropdownProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    align?: 'left' | 'right';
}

export const GlassDropdown = ({ trigger, children, className, align = 'left' }: GlassDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={TRANSITIONS.spring}
                        className={cn(
                            "absolute z-50 mt-2 min-w-[200px] outline-none",
                            align === 'right' ? 'right-0' : 'left-0',
                            className
                        )}
                    >
                        <GlassContainer material="regular" className="p-1.5 shadow-xl">
                            <div className="flex flex-col gap-0.5">
                                {React.Children.map(children, child => {
                                    if (React.isValidElement<{ onClick?: (e: React.MouseEvent) => void }>(child)) {
                                        return React.cloneElement(child, {
                                            onClick: (e: React.MouseEvent) => {
                                                child.props.onClick?.(e);
                                                setIsOpen(false);
                                            }
                                        });
                                    }
                                    return child;
                                })}
                            </div>
                        </GlassContainer>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

interface GlassDropdownItemProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: React.ElementType;
    shortcut?: string;
    description?: string;
}

export const GlassDropdownItem = ({ className, children, icon: Icon, shortcut, description, onClick, ...props }: GlassDropdownItemProps) => {
    return (
        <div
            className={cn(
                "group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer hover:bg-glass-surface-hover select-none",
                className
            )}
            onClick={onClick}
            {...props}
        >
            <div className="flex items-center gap-2.5">
                {Icon && <Icon size={16} className="text-secondary group-hover:text-primary transition-colors" />}
                <div className="flex flex-col">
                    <span className="text-primary font-medium">{children}</span>
                    {description && <span className="text-[10px] text-secondary">{description}</span>}
                </div>
            </div>
            {shortcut && <span className="text-xs text-label-glass-tertiary font-mono group-hover:text-label-glass-secondary">{shortcut}</span>}
        </div>
    );
};

export const GlassDropdownSeparator = () => (
    <div className="h-px bg-glass-surface-hover my-1 mx-2" />
);

export const GlassDropdownLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="px-3 py-1.5 text-xs font-bold text-secondary uppercase tracking-wider opacity-70">
        {children}
    </div>
);

GlassDropdown.displayName = 'GlassDropdown';
GlassDropdownItem.displayName = 'GlassDropdownItem';
GlassDropdownSeparator.displayName = 'GlassDropdownSeparator';
GlassDropdownLabel.displayName = 'GlassDropdownLabel';
