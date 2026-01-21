/**
 * Toast Notification Store
 * 
 * Lightweight toast notification system using Zustand.
 * Supports success, error, warning, and info toasts with auto-dismiss.
 */
import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastState {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => string;
    removeToast: (id: string) => void;
    clearToasts: () => void;
}

// ============================================================================
// Store
// ============================================================================

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],

    addToast: (toast) => {
        const id = crypto.randomUUID();
        const duration = toast.duration ?? (toast.type === 'error' ? 6000 : 4000);

        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }],
        }));

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }));
            }, duration);
        }

        return id;
    },

    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        }));
    },

    clearToasts: () => {
        set({ toasts: [] });
    },
}));

// ============================================================================
// Convenience Functions
// ============================================================================

export const toast = {
    success: (title: string, message?: string) =>
        useToastStore.getState().addToast({ type: 'success', title, message }),

    error: (title: string, message?: string) =>
        useToastStore.getState().addToast({ type: 'error', title, message }),

    warning: (title: string, message?: string) =>
        useToastStore.getState().addToast({ type: 'warning', title, message }),

    info: (title: string, message?: string) =>
        useToastStore.getState().addToast({ type: 'info', title, message }),

    custom: (toast: Omit<Toast, 'id'>) =>
        useToastStore.getState().addToast(toast),

    dismiss: (id: string) =>
        useToastStore.getState().removeToast(id),

    clear: () =>
        useToastStore.getState().clearToasts(),
};

export default toast;
