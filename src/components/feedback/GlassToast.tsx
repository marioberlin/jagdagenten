import React, { createContext, useContext, useState, useCallback } from 'react';
import { useTransition, animated } from '@react-spring/web';
import { GlassContainer } from '../primitives/GlassContainer';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface GlassToastContextType {
    toast: (message: string, type?: ToastType, duration?: number) => void;
}

const GlassToastContext = createContext<GlassToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(GlassToastContext);
    if (!context) {
        throw new Error('useToast must be used within a GlassToastProvider');
    }
    return context;
};

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

    // Stacked liquid animation
    const transitions = useTransition(toasts, {
        from: { opacity: 0, transform: 'translate3d(0, 20px, 0) scale(0.9)' },
        enter: { opacity: 1, transform: 'translate3d(0, 0px, 0) scale(1)' },
        leave: { opacity: 0, transform: 'translate3d(0, -20px, 0) scale(0.9)', pointerEvents: 'none' },
        config: { tension: 300, friction: 20 },
    });

    return (
        <GlassToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[150] flex flex-col gap-2 items-end pointer-events-none">
                {transitions((style, item) => (
                    <animated.div style={style} className="pointer-events-auto">
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
                            >
                                <X size={14} />
                            </button>
                        </GlassContainer>
                    </animated.div>
                ))}
            </div>
        </GlassToastContext.Provider>
    );
};

GlassToastProvider.displayName = 'GlassToastProvider';
