/**
 * SparklesAboutModal - About Sparkles Mail
 *
 * Shows application information:
 * - Version and build info
 * - Credits and acknowledgments
 * - Links to documentation and support
 */

import { motion } from 'framer-motion';
import {
    X,
    Sparkles,
    Heart,
    ExternalLink,
    Github,
    MessageCircle,
    BookOpen,
    Shield,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SparklesAboutModalProps {
    onClose: () => void;
}

const APP_VERSION = '1.0.0';
const BUILD_DATE = new Date().toISOString().split('T')[0];

export function SparklesAboutModal({ onClose }: SparklesAboutModalProps) {
    const features = [
        { icon: Zap, label: 'Smart Inbox', description: 'AI-powered email organization' },
        { icon: Shield, label: 'Gatekeeper', description: 'Spam and sender protection' },
        { icon: Sparkles, label: 'Priority Senders', description: 'Never miss important emails' },
    ];

    const links = [
        { icon: BookOpen, label: 'Documentation', href: '#' },
        { icon: Github, label: 'Source Code', href: '#' },
        { icon: MessageCircle, label: 'Send Feedback', href: '#' },
    ];

    return (
        <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                className={cn(
                    'relative w-full max-w-sm mx-4',
                    'bg-[var(--glass-bg)] backdrop-blur-2xl',
                    'border border-[var(--glass-border)]',
                    'rounded-2xl shadow-2xl',
                    'overflow-hidden'
                )}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className={cn(
                        'absolute top-4 right-4 z-10',
                        'w-8 h-8 rounded-full',
                        'flex items-center justify-center',
                        'hover:bg-[var(--glass-surface-hover)]',
                        'text-[var(--glass-text-secondary)]',
                        'transition-colors'
                    )}
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Hero Section */}
                <div className="relative pt-8 pb-6 px-6 text-center">
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-accent)]/10 to-transparent" />

                    {/* App Icon */}
                    <motion.div
                        initial={{ scale: 0.5, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="relative inline-flex"
                    >
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-purple-600 flex items-center justify-center shadow-lg">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        {/* Glow effect */}
                        <div className="absolute inset-0 rounded-2xl bg-[var(--color-accent)] blur-xl opacity-30" />
                    </motion.div>

                    {/* App Name */}
                    <h1 className="mt-4 text-2xl font-bold text-[var(--glass-text-primary)]">
                        Sparkles Mail
                    </h1>
                    <p className="text-sm text-[var(--glass-text-secondary)]">
                        Your intelligent email companion
                    </p>

                    {/* Version Badge */}
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                        <span className="text-xs font-medium text-[var(--glass-text-primary)]">
                            Version {APP_VERSION}
                        </span>
                        <span className="text-xs text-[var(--glass-text-tertiary)]">
                            ({BUILD_DATE})
                        </span>
                    </div>
                </div>

                {/* Features */}
                <div className="px-6 pb-4">
                    <div className="space-y-2">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.label}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * index }}
                                className={cn(
                                    'flex items-center gap-3 p-3 rounded-xl',
                                    'bg-[var(--glass-surface)]'
                                )}
                            >
                                <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
                                    <feature.icon className="w-4 h-4 text-[var(--color-accent)]" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[var(--glass-text-primary)]">
                                        {feature.label}
                                    </p>
                                    <p className="text-xs text-[var(--glass-text-tertiary)]">
                                        {feature.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Links */}
                <div className="px-6 pb-4">
                    <div className="flex items-center justify-center gap-4">
                        {links.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className={cn(
                                    'flex flex-col items-center gap-1 p-2',
                                    'text-[var(--glass-text-secondary)]',
                                    'hover:text-[var(--color-accent)] transition-colors'
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <link.icon className="w-5 h-5" />
                                <span className="text-xs">{link.label}</span>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[var(--glass-border)] text-center">
                    <p className="text-xs text-[var(--glass-text-tertiary)]">
                        Part of the <span className="font-medium">LiquidOS</span> ecosystem
                    </p>
                    <p className="flex items-center justify-center gap-1 mt-1 text-xs text-[var(--glass-text-tertiary)]">
                        Made with <Heart className="w-3 h-3 text-red-400 inline" /> by the Liquid Glass team
                    </p>
                </div>

                {/* Legal Links */}
                <div className="flex items-center justify-center gap-4 px-6 pb-4">
                    <a
                        href="#"
                        className="text-xs text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-secondary)] transition-colors"
                    >
                        Privacy Policy
                    </a>
                    <span className="text-[var(--glass-text-tertiary)]">•</span>
                    <a
                        href="#"
                        className="text-xs text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-secondary)] transition-colors"
                    >
                        Terms of Service
                    </a>
                    <span className="text-[var(--glass-text-tertiary)]">•</span>
                    <a
                        href="#"
                        className="text-xs text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-secondary)] transition-colors"
                    >
                        Licenses
                    </a>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default SparklesAboutModal;
