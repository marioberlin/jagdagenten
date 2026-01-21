/**
 * SparklesAuthModal - Add Gmail Account Modal
 *
 * Provides Google OAuth authentication flow for adding Gmail accounts.
 */

import { motion } from 'framer-motion';
import { X, Mail, Shield, Check } from 'lucide-react';
import { useSparklesAuth } from '../hooks/useSparklesAuth';
import { cn } from '@/lib/utils';

// =============================================================================
// Props
// =============================================================================

interface SparklesAuthModalProps {
    onClose: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function SparklesAuthModal({ onClose }: SparklesAuthModalProps) {
    const { isAuthenticating, error, initiateAuth } = useSparklesAuth();

    const handleConnect = async () => {
        await initiateAuth();
        // Note: This will redirect to Google OAuth
        // The callback is handled by useSparklesAuth on the /auth/google/callback route
    };

    return (
        <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                className={cn(
                    'relative w-full max-w-md mx-4',
                    'bg-[var(--glass-bg)] backdrop-blur-2xl',
                    'border border-[var(--glass-border)]',
                    'rounded-2xl shadow-2xl',
                    'overflow-hidden'
                )}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
                    <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                        Add Gmail Account
                    </h2>
                    <button
                        onClick={onClose}
                        className={cn(
                            'p-2 rounded-lg',
                            'text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]',
                            'hover:bg-[var(--glass-surface-hover)]',
                            'transition-colors duration-150'
                        )}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div
                            className={cn(
                                'w-20 h-20 rounded-2xl',
                                'bg-gradient-to-br from-[#4285F4] via-[#34A853] to-[#FBBC05]',
                                'flex items-center justify-center',
                                'shadow-lg shadow-[#4285F4]/30'
                            )}
                        >
                            <Mail className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-center text-[var(--glass-text-primary)] mb-2">
                        Connect with Google
                    </h3>

                    {/* Description */}
                    <p className="text-center text-[var(--glass-text-secondary)] mb-6">
                        Securely connect your Gmail account to access your emails in Sparkles.
                    </p>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-[var(--system-red)]/10 text-[var(--system-red)] text-sm">
                            {error}
                        </div>
                    )}

                    {/* Permissions */}
                    <div className="mb-6 space-y-3">
                        <div className="flex items-start gap-3 text-sm">
                            <Check className="w-4 h-4 text-[var(--system-green)] mt-0.5 flex-shrink-0" />
                            <span className="text-[var(--glass-text-secondary)]">
                                Read, send, and manage your emails
                            </span>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                            <Check className="w-4 h-4 text-[var(--system-green)] mt-0.5 flex-shrink-0" />
                            <span className="text-[var(--glass-text-secondary)]">
                                Manage labels and organize your inbox
                            </span>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                            <Shield className="w-4 h-4 text-[var(--color-accent)] mt-0.5 flex-shrink-0" />
                            <span className="text-[var(--glass-text-secondary)]">
                                Your data stays secure with Google OAuth
                            </span>
                        </div>
                    </div>

                    {/* Connect Button */}
                    <button
                        onClick={handleConnect}
                        disabled={isAuthenticating}
                        className={cn(
                            'w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl',
                            'bg-white text-gray-800 font-medium',
                            'border border-gray-200',
                            'shadow-lg hover:shadow-xl',
                            'transition-all duration-200',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            !isAuthenticating && 'hover:scale-[1.02]'
                        )}
                    >
                        {isAuthenticating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-gray-300 border-t-[#4285F4] rounded-full animate-spin" />
                                Connecting...
                            </>
                        ) : (
                            <>
                                <GoogleIcon />
                                Continue with Google
                            </>
                        )}
                    </button>

                    {/* Privacy Note */}
                    <p className="mt-4 text-xs text-center text-[var(--glass-text-tertiary)]">
                        By connecting, you agree to let Sparkles access your Gmail data.{' '}
                        <a href="#" className="text-[var(--color-accent)] hover:underline">
                            Learn more
                        </a>
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}

// =============================================================================
// Google Icon
// =============================================================================

function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24">
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    );
}

export default SparklesAuthModal;
