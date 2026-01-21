/**
 * SparklesGatekeeperModal - Pending sender review modal
 *
 * Review and manage senders who haven't been approved:
 * - View pending senders with message previews
 * - Approve senders (add to priority list)
 * - Block senders (add to blocked list)
 * - Bulk actions for domains
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Shield,
    Check,
    Ban,
    Mail,
    ChevronRight,
    Users,
    AlertTriangle,
    Star,
    Trash2,
} from 'lucide-react';
import { useSparklesStore } from '@/stores/sparklesStore';
import { cn } from '@/lib/utils';

interface SparklesGatekeeperModalProps {
    onClose: () => void;
}

interface GroupedSender {
    email: string;
    name: string;
    domain: string;
    messageCount: number;
    firstSeenAt: number;
    lastMessageSubject: string;
}

export function SparklesGatekeeperModal({ onClose }: SparklesGatekeeperModalProps) {
    const {
        pendingSenders,
        threads,
        acceptSender,
        blockSender,
    } = useSparklesStore();

    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<'all' | 'recent' | 'frequent'>('all');

    // Group pending senders with additional metadata
    const groupedSenders = useMemo(() => {
        const senderMap = new Map<string, GroupedSender>();

        pendingSenders.forEach((sender) => {
            const domain = sender.email.split('@')[1] || 'unknown';
            const threadCount = threads.filter(
                (t) => t.participants[0]?.email?.toLowerCase() === sender.email.toLowerCase()
            ).length;

            senderMap.set(sender.email, {
                email: sender.email,
                name: sender.name || sender.email.split('@')[0],
                domain,
                messageCount: threadCount,
                firstSeenAt: sender.firstSeenAt,
                lastMessageSubject: 'Recent email', // TODO: Get from threads
            });
        });

        let result = Array.from(senderMap.values());

        // Apply filter
        switch (filter) {
            case 'recent':
                result = result.sort((a, b) => b.firstSeenAt - a.firstSeenAt);
                break;
            case 'frequent':
                result = result.sort((a, b) => b.messageCount - a.messageCount);
                break;
        }

        return result;
    }, [pendingSenders, threads, filter]);

    // Group by domain
    const domains = useMemo(() => {
        const domainMap = new Map<string, GroupedSender[]>();

        groupedSenders.forEach((sender) => {
            const existing = domainMap.get(sender.domain) || [];
            domainMap.set(sender.domain, [...existing, sender]);
        });

        return Array.from(domainMap.entries())
            .map(([domain, senders]) => ({
                domain,
                senders,
                count: senders.length,
            }))
            .sort((a, b) => b.count - a.count);
    }, [groupedSenders]);

    const handleApprove = async (email: string) => {
        setProcessingIds((prev) => new Set([...prev, email]));
        try {
            acceptSender(email); // This also removes from pendingSenders
        } finally {
            setProcessingIds((prev) => {
                const next = new Set(prev);
                next.delete(email);
                return next;
            });
        }
    };

    const handleBlock = async (email: string) => {
        setProcessingIds((prev) => new Set([...prev, email]));
        try {
            blockSender(email); // This also removes from pendingSenders
        } finally {
            setProcessingIds((prev) => {
                const next = new Set(prev);
                next.delete(email);
                return next;
            });
        }
    };

    const handleApproveDomain = async (domain: string) => {
        const domainSenders = groupedSenders.filter((s) => s.domain === domain);
        for (const sender of domainSenders) {
            await handleApprove(sender.email);
        }
    };

    const handleBlockDomain = async (domain: string) => {
        const domainSenders = groupedSenders.filter((s) => s.domain === domain);
        for (const sender of domainSenders) {
            await handleBlock(sender.email);
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 86400000) return 'Today';
        if (diff < 172800000) return 'Yesterday';
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
        return date.toLocaleDateString();
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
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                className={cn(
                    'relative w-full max-w-2xl mx-4',
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
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">
                                Gatekeeper
                            </h2>
                            <p className="text-xs text-[var(--glass-text-tertiary)]">
                                {pendingSenders.length} pending sender{pendingSenders.length !== 1 ? 's' : ''} to review
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={cn(
                            'w-8 h-8 rounded-full',
                            'flex items-center justify-center',
                            'hover:bg-[var(--glass-surface-hover)]',
                            'text-[var(--glass-text-secondary)]',
                            'transition-colors'
                        )}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="flex items-center gap-2 p-3 border-b border-[var(--glass-border)]">
                    {[
                        { id: 'all' as const, label: 'All' },
                        { id: 'recent' as const, label: 'Most Recent' },
                        { id: 'frequent' as const, label: 'Most Frequent' },
                    ].map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                                filter === f.id
                                    ? 'bg-[var(--color-accent)] text-white'
                                    : 'text-[var(--glass-text-secondary)] hover:bg-[var(--glass-surface)]'
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="max-h-[500px] overflow-y-auto">
                    {pendingSenders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                                <Check className="w-8 h-8 text-green-500" />
                            </div>
                            <p className="text-[var(--glass-text-primary)] font-medium mb-1">
                                All caught up!
                            </p>
                            <p className="text-sm text-[var(--glass-text-tertiary)]">
                                No pending senders to review
                            </p>
                        </div>
                    ) : selectedDomain ? (
                        // Domain Detail View
                        <div className="p-4">
                            <button
                                onClick={() => setSelectedDomain(null)}
                                className="flex items-center gap-2 text-sm text-[var(--color-accent)] mb-4"
                            >
                                <ChevronRight className="w-4 h-4 rotate-180" />
                                Back to all domains
                            </button>

                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-[var(--glass-text-secondary)]" />
                                    <span className="font-medium text-[var(--glass-text-primary)]">
                                        @{selectedDomain}
                                    </span>
                                    <span className="text-sm text-[var(--glass-text-tertiary)]">
                                        ({domains.find((d) => d.domain === selectedDomain)?.count || 0} senders)
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleApproveDomain(selectedDomain)}
                                        className={cn(
                                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm',
                                            'bg-green-500/10 text-green-500',
                                            'hover:bg-green-500/20 transition-colors'
                                        )}
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        Approve All
                                    </button>
                                    <button
                                        onClick={() => handleBlockDomain(selectedDomain)}
                                        className={cn(
                                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm',
                                            'bg-red-500/10 text-red-500',
                                            'hover:bg-red-500/20 transition-colors'
                                        )}
                                    >
                                        <Ban className="w-3.5 h-3.5" />
                                        Block All
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {groupedSenders
                                    .filter((s) => s.domain === selectedDomain)
                                    .map((sender) => (
                                        <SenderRow
                                            key={sender.email}
                                            sender={sender}
                                            isProcessing={processingIds.has(sender.email)}
                                            onApprove={() => handleApprove(sender.email)}
                                            onBlock={() => handleBlock(sender.email)}
                                            formatDate={formatDate}
                                        />
                                    ))}
                            </div>
                        </div>
                    ) : (
                        // Domain List View
                        <div className="p-4 space-y-2">
                            {domains.map(({ domain, senders, count }) => (
                                <button
                                    key={domain}
                                    onClick={() => setSelectedDomain(domain)}
                                    className={cn(
                                        'w-full flex items-center gap-3 p-3 rounded-xl',
                                        'bg-[var(--glass-surface)] border border-transparent',
                                        'hover:border-[var(--glass-border)] transition-colors',
                                        'text-left'
                                    )}
                                >
                                    <div className="w-10 h-10 rounded-full bg-[var(--glass-bg-highlight)] flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-[var(--glass-text-secondary)]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-[var(--glass-text-primary)]">
                                            @{domain}
                                        </p>
                                        <p className="text-sm text-[var(--glass-text-tertiary)] truncate">
                                            {count} sender{count !== 1 ? 's' : ''} • {senders.slice(0, 3).map(s => s.name).join(', ')}
                                            {count > 3 && ` +${count - 3} more`}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-[var(--glass-text-tertiary)]" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-[var(--glass-border)]">
                    <div className="flex items-center gap-2 text-xs text-[var(--glass-text-tertiary)]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Blocked senders won't appear in your inbox</span>
                    </div>
                    <button
                        onClick={onClose}
                        className={cn(
                            'px-4 py-2 rounded-xl',
                            'bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-hover)]',
                            'text-[var(--glass-text-primary)]',
                            'transition-colors'
                        )}
                    >
                        Done
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Individual sender row component
function SenderRow({
    sender,
    isProcessing,
    onApprove,
    onBlock,
    formatDate,
}: {
    sender: GroupedSender;
    isProcessing: boolean;
    onApprove: () => void;
    onBlock: () => void;
    formatDate: (timestamp: number) => string;
}) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className={cn(
                'flex items-center gap-3 p-3 rounded-xl',
                'bg-[var(--glass-surface)] border border-[var(--glass-border)]',
                isProcessing && 'opacity-50 pointer-events-none'
            )}
        >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-medium">
                {sender.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--glass-text-primary)] truncate">
                        {sender.name}
                    </p>
                    {sender.messageCount > 3 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">
                            {sender.messageCount} emails
                        </span>
                    )}
                </div>
                <p className="text-sm text-[var(--glass-text-secondary)] truncate">
                    {sender.email}
                </p>
                <p className="text-xs text-[var(--glass-text-tertiary)]">
                    First seen: {formatDate(sender.firstSeenAt)}
                </p>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={onApprove}
                    disabled={isProcessing}
                    className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center',
                        'bg-green-500/10 text-green-500',
                        'hover:bg-green-500/20 transition-colors'
                    )}
                    title="Approve sender"
                >
                    <Check className="w-4 h-4" />
                </button>
                <button
                    onClick={onBlock}
                    disabled={isProcessing}
                    className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center',
                        'bg-red-500/10 text-red-500',
                        'hover:bg-red-500/20 transition-colors'
                    )}
                    title="Block sender"
                >
                    <Ban className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}

export default SparklesGatekeeperModal;
