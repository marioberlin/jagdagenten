
import { motion, AnimatePresence } from 'framer-motion';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { cn } from '@/utils/cn';
import { TRANSITIONS } from '@/styles/animations';

export interface GlassAlertDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when the dialog should close */
    onOpenChange: (open: boolean) => void;
    /** Dialog title */
    title: string;
    /** Dialog description/message */
    description: string;
    /** Type of alert - affects icon and styling */
    variant?: 'default' | 'destructive' | 'warning' | 'success';
    /** Text for the cancel button */
    cancelText?: string;
    /** Text for the confirm button */
    confirmText?: string;
    /** Callback when confirm is clicked */
    onConfirm?: () => void;
    /** Callback when cancel is clicked */
    onCancel?: () => void;
    /** Whether the confirm action is loading */
    loading?: boolean;
}

const variantConfig = {
    default: {
        icon: Info,
        iconColor: 'text-accent',
        confirmVariant: 'primary' as const,
    },
    destructive: {
        icon: XCircle,
        iconColor: 'text-destructive',
        confirmVariant: 'destructive' as const,
    },
    warning: {
        icon: AlertTriangle,
        iconColor: 'text-warning',
        confirmVariant: 'primary' as const,
    },
    success: {
        icon: CheckCircle,
        iconColor: 'text-success',
        confirmVariant: 'primary' as const,
    },
};

/**
 * GlassAlertDialog - Confirmation dialog for important/destructive actions
 * 
 * Features:
 * - Focus trapping for accessibility
 * - Escape key to close
 * - Variant-based icons and styling
 * - Loading state for async confirmations
 * - Proper ARIA attributes
 * 
 * @example
 * ```tsx
 * <GlassAlertDialog
 *   open={showDeleteConfirm}
 *   onOpenChange={setShowDeleteConfirm}
 *   variant="destructive"
 *   title="Delete Item?"
 *   description="This action cannot be undone."
 *   confirmText="Delete"
 *   onConfirm={handleDelete}
 * />
 * ```
 */
export const GlassAlertDialog = ({
    open,
    onOpenChange,
    title,
    description,
    variant = 'default',
    cancelText = 'Cancel',
    confirmText = 'Continue',
    onConfirm,
    onCancel,
    loading = false,
}: GlassAlertDialogProps) => {
    const focusTrapRef = useFocusTrap(open, () => onOpenChange(false));
    const config = variantConfig[variant];
    const Icon = config.icon;

    const handleCancel = () => {
        onCancel?.();
        onOpenChange(false);
    };

    const handleConfirm = () => {
        onConfirm?.();
    };

    return createPortal(
        <AnimatePresence>
            {open && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleCancel}
                        aria-hidden="true"
                    />

                    {/* Dialog Content */}
                    <motion.div
                        ref={focusTrapRef}
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={TRANSITIONS.spring}
                        className="relative z-10 w-full max-w-md"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="alert-dialog-title"
                        aria-describedby="alert-dialog-description"
                    >
                        <GlassContainer
                            material="thick"
                            border
                            className="p-6"
                        >
                            {/* Icon + Content */}
                            <div className="flex gap-4">
                                {/* Icon */}
                                <div className={cn(
                                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                                    variant === 'destructive' && "bg-destructive-muted",
                                    variant === 'warning' && "bg-warning-muted",
                                    variant === 'success' && "bg-success-muted",
                                    variant === 'default' && "bg-accent-muted"
                                )}>
                                    <Icon size={20} className={config.iconColor} />
                                </div>

                                {/* Text Content */}
                                <div className="flex-1 min-w-0">
                                    <h2
                                        id="alert-dialog-title"
                                        className="text-lg font-bold text-primary mb-1"
                                    >
                                        {title}
                                    </h2>
                                    <p
                                        id="alert-dialog-description"
                                        className="text-sm text-secondary leading-relaxed"
                                    >
                                        {description}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 mt-6">
                                <GlassButton
                                    variant="ghost"
                                    onClick={handleCancel}
                                    disabled={loading}
                                >
                                    {cancelText}
                                </GlassButton>
                                <GlassButton
                                    variant={config.confirmVariant}
                                    onClick={handleConfirm}
                                    loading={loading}
                                >
                                    {confirmText}
                                </GlassButton>
                            </div>
                        </GlassContainer>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

GlassAlertDialog.displayName = 'GlassAlertDialog';
