/**
 * Toast Container Component
 * 
 * Renders toast notifications in a fixed position.
 * Uses Framer Motion for smooth enter/exit animations.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useToastStore, type Toast, type ToastType } from '@/stores/toastStore';

// ============================================================================
// Icons & Styles
// ============================================================================

const TOAST_CONFIG: Record<ToastType, { icon: React.ElementType; colors: string }> = {
    success: {
        icon: Check,
        colors: 'bg-green-500/20 border-green-500/40 text-green-400',
    },
    error: {
        icon: AlertCircle,
        colors: 'bg-red-500/20 border-red-500/40 text-red-400',
    },
    warning: {
        icon: AlertTriangle,
        colors: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
    },
    info: {
        icon: Info,
        colors: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
    },
};

// ============================================================================
// Individual Toast
// ============================================================================

interface ToastItemProps {
    toast: Toast;
    onDismiss: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
    const config = TOAST_CONFIG[toast.type];
    const Icon = config.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            className={cn(
                'flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl',
                'shadow-lg min-w-72 max-w-md',
                config.colors
            )}
        >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
                <Icon size={18} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary">{toast.title}</p>
                {toast.message && (
                    <p className="text-xs text-secondary mt-0.5">{toast.message}</p>
                )}
                {toast.action && (
                    <button
                        onClick={toast.action.onClick}
                        className="text-xs font-medium mt-2 underline hover:no-underline"
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>

            {/* Dismiss */}
            <button
                onClick={onDismiss}
                className="shrink-0 p-1 rounded-lg hover:bg-white/10 text-tertiary hover:text-primary transition-colors"
            >
                <X size={14} />
            </button>
        </motion.div>
    );
};

// ============================================================================
// Toast Container
// ============================================================================

export const ToastContainer: React.FC = () => {
    const toasts = useToastStore((state) => state.toasts);
    const removeToast = useToastStore((state) => state.removeToast);

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onDismiss={() => removeToast(toast.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;
