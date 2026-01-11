import React, { createContext, useContext, useState, useRef } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { motion, HTMLMotionProps } from 'framer-motion';
import { TRANSITIONS } from '@/styles/animations';

// Context
interface TabsContextType {
    value: string;
    onValueChange: (value: string) => void;
}
const TabsContext = createContext<TabsContextType | undefined>(undefined);

// Root
interface GlassTabsProps {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}
export const GlassTabs = ({ value: controlledValue, defaultValue, onValueChange, children, className }: GlassTabsProps) => {
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleValueChange = (newValue: string) => {
        setInternalValue(newValue);
        onValueChange?.(newValue);
    };

    return (
        <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
            <div className={cn("w-full", className)}>{children}</div>
        </TabsContext.Provider>
    );
};

// List (The container for triggers)
export const GlassTabsList = ({ className, children }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <GlassContainer
            material="thin"
            enableLiquid={false}
            className={cn("inline-flex h-12 items-center justify-center rounded-3xl p-1 text-secondary", className)}
        >
            {children}
        </GlassContainer>
    );
};

// Trigger (The clickable tab)
interface GlassTabsTriggerProps extends HTMLMotionProps<"button"> {
    value: string;
}
export const GlassTabsTrigger = ({ className, value, children, ...props }: GlassTabsTriggerProps) => {
    const context = useContext(TabsContext);
    if (!context) throw new Error("GlassTabsTrigger must be used within GlassTabs");

    const isActive = context.value === value;
    const ref = useRef<HTMLButtonElement>(null);

    return (
        <motion.button
            ref={ref}
            type="button"
            onClick={(e) => {
                context.onValueChange(value);
                props.onClick?.(e);
            }}
            animate={{
                scale: isActive ? 1 : 0.95,
                opacity: isActive ? 1 : 0.7,
            }}
            transition={TRANSITIONS.spring}
            className={cn(
                "relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-2xl px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive ? "text-label-glass-primary shadow-sm bg-glass-surface-hover backdrop-blur-md" : "hover:bg-glass-surface",
                className
            )}
            {...props}
        >
            {/* Active Pill Indicator (Simulated) */}
            {/* In a more complex version, this would be a shared layout animated div in the parent, but simplified here for reliability */}
            {children}
        </motion.button>
    );
};

// Content (The body)
interface GlassTabsContentProps extends HTMLMotionProps<"div"> {
    value: string;
}
export const GlassTabsContent = ({ className, value, children, ...props }: GlassTabsContentProps) => {
    const context = useContext(TabsContext);
    if (!context) throw new Error("GlassTabsContent must be used within GlassTabs");

    const isActive = context.value === value;

    if (!isActive) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={TRANSITIONS.spring}
            className={cn(
                "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
};

GlassTabs.displayName = 'GlassTabs';
GlassTabsList.displayName = 'GlassTabsList';
GlassTabsTrigger.displayName = 'GlassTabsTrigger';
GlassTabsContent.displayName = 'GlassTabsContent';
