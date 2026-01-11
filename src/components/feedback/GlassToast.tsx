import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassContainer } from '../primitives/GlassContainer';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import { TRANSITIONS } from '@/styles/animations';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface GlassToastContextType {
    /** 
     * Trigger a toast notification.
     * @param message - The text to display.
     * @param type - The semantic type ('success', 'error', 'warning', 'info').
     * @param duration - Duration in ms (default 3000). Set to 0 for persistent (needs manual dismissal logic if not implemented).
     */
    toast: (message: string, type?: ToastType, duration?: number) => void;
}

const GlassToastContext = createContext<GlassToastContextType | undefined>(undefined);

/**
 * Hook to access the Toast system.
 * Must be used within a GlassToastProvider.
 */
export const useToast = () => {
    const context = useContext(GlassToastContext);
    if (!context) {
        throw new Error('useToast must be used within a GlassToastProvider');
    }
    return context;
};

/**
 * GlassToastProvider
 * 
 * Context provider that manages the state and rendering of toast notifications.
 * Should be placed at the root of the application (or close to it).
 * Renders a fixed container for toast messages.
 */
export const GlassToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    return (
        <GlassToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[150] flex flex-col gap-2 items-end pointer-events-none" role="region" aria-live="polite" aria-label="Notifications">
                <AnimatePresence mode="popLayout" initial={false}>
                    {toasts.map((item) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.9 }}
                            transition={TRANSITIONS.spring}
                            className="pointer-events-auto"
                            role={item.type === 'error' ? 'alert' : 'status'}
                        >
                            <GlassContainer
                                material="thick"
                                className="flex items-center gap-3 p-4 min-w-[300px] shadow-2xl border-l-4"
                                style={{
                                    borderLeftColor:
                                        item.type === 'success' ? '#4ade80' :
                                            item.type === 'error' ? '#f87171' :
                                                item.type === 'warning' ? '#fbbf24' : '#60a5fa'
                                }}
                            >
                                {item.type === 'success' && <CheckCircle size={18} className="text-success" />}
                                {item.type === 'error' && <AlertOctagon size={18} className="text-destructive" />}
                                {item.type === 'warning' && <AlertTriangle size={18} className="text-warning" />}
                                {item.type === 'info' && <Info size={18} className="text-accent" />}

                                <p className="text-sm font-medium text-primary flex-1">{item.message}</p>

                                <button
                                    onClick={() => removeToast(item.id)}
                                    className="text-secondary hover:text-primary transition-colors p-1"
                                    aria-label="Dismiss notification"
                                >
                                    <X size={14} />
                                </button>
                            </GlassContainer>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </GlassToastContext.Provider>
    );
};

GlassToastProvider.displayName = 'GlassToastProvider';
