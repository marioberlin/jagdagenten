import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Loader2, CheckCircle, XCircle, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { AgentCard } from '@/a2a/types';

interface AgentProbeProps {
    onAgentDiscovered?: (url: string, card: AgentCard) => void;
    className?: string;
}

type ProbeState = 'idle' | 'probing' | 'success' | 'error';

/**
 * AgentProbe
 *
 * A beautiful URL input for discovering A2A agents.
 * Probes the /.well-known/agent.json endpoint and displays results.
 */
export const AgentProbe: React.FC<AgentProbeProps> = ({
    onAgentDiscovered,
    className
}) => {
    const [url, setUrl] = useState('');
    const [state, setState] = useState<ProbeState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [discoveredAgent, setDiscoveredAgent] = useState<AgentCard | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    const probe = useCallback(async () => {
        if (!url.trim()) return;

        setState('probing');
        setError(null);
        setDiscoveredAgent(null);

        try {
            // Normalize URL
            let normalizedUrl = url.trim();
            if (!normalizedUrl.startsWith('http')) {
                normalizedUrl = `https://${normalizedUrl}`;
            }
            normalizedUrl = normalizedUrl.replace(/\/$/, '');

            // Probe agent card
            const response = await fetch(`${normalizedUrl}/.well-known/agent.json`, {
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) {
                throw new Error(`Agent not found (${response.status})`);
            }

            const card: AgentCard = await response.json();

            // Validate required fields
            if (!card.name || !card.url) {
                throw new Error('Invalid agent card: missing required fields');
            }

            setDiscoveredAgent(card);
            setState('success');
            onAgentDiscovered?.(normalizedUrl, card);

        } catch (err) {
            setState('error');
            setError(err instanceof Error ? err.message : 'Failed to probe agent');
        }
    }, [url, onAgentDiscovered]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            probe();
        }
    };

    const handleClear = () => {
        setUrl('');
        setState('idle');
        setError(null);
        setDiscoveredAgent(null);
    };

    return (
        <div className={cn('relative', className)}>
            {/* Main Input Container */}
            <motion.div
                className={cn(
                    'relative flex items-center gap-3 p-4 rounded-2xl',
                    'bg-white/5 border transition-all duration-300',
                    isFocused ? 'border-white/20 bg-white/10' : 'border-white/10',
                    state === 'success' && 'border-green-500/30 bg-green-500/5',
                    state === 'error' && 'border-red-500/30 bg-red-500/5'
                )}
                animate={{
                    boxShadow: isFocused
                        ? '0 0 40px rgba(99, 102, 241, 0.15), 0 0 80px rgba(99, 102, 241, 0.05)'
                        : 'none'
                }}
            >
                {/* Icon */}
                <div className="flex-shrink-0">
                    <AnimatePresence mode="wait">
                        {state === 'probing' ? (
                            <motion.div
                                key="probing"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                            >
                                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                            </motion.div>
                        ) : state === 'success' ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                            >
                                <CheckCircle className="w-5 h-5 text-green-400" />
                            </motion.div>
                        ) : state === 'error' ? (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                            >
                                <XCircle className="w-5 h-5 text-red-400" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                            >
                                <Globe className="w-5 h-5 text-white/40" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input */}
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Enter any A2A agent URL to discover..."
                    className={cn(
                        'flex-1 bg-transparent text-white placeholder:text-white/30',
                        'outline-none text-base font-light'
                    )}
                />

                {/* Action Button */}
                <motion.button
                    onClick={url.trim() ? probe : undefined}
                    disabled={!url.trim() || state === 'probing'}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm',
                        'transition-all duration-200',
                        url.trim()
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400'
                            : 'bg-white/5 text-white/30 cursor-not-allowed'
                    )}
                >
                    {state === 'probing' ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Probing</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} />
                            <span>Discover</span>
                        </>
                    )}
                </motion.button>
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
                {state === 'error' && error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                    >
                        <p className="text-sm text-red-400">{error}</p>
                        <p className="text-xs text-red-400/60 mt-1">
                            Make sure the URL points to a valid A2A-compatible agent.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success - Discovered Agent Card */}
            <AnimatePresence>
                {state === 'success' && discoveredAgent && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="mt-4"
                    >
                        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
                            <div className="flex items-start gap-4">
                                {/* Agent Icon */}
                                <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center text-2xl">
                                    {discoveredAgent.name.slice(0, 2)}
                                </div>

                                {/* Agent Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-white">
                                        {discoveredAgent.name}
                                    </h3>
                                    <p className="text-sm text-white/60 line-clamp-2 mb-2">
                                        {discoveredAgent.description}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-white/40">
                                        <span>v{discoveredAgent.version}</span>
                                        <span>•</span>
                                        <span>{discoveredAgent.url}</span>
                                    </div>
                                </div>

                                {/* Connect Button */}
                                <button
                                    onClick={handleClear}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2 rounded-xl',
                                        'bg-green-500 hover:bg-green-400 text-white font-medium text-sm',
                                        'transition-colors'
                                    )}
                                >
                                    <span>Connect</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>

                            {/* Capabilities */}
                            {discoveredAgent.capabilities && (
                                <div className="mt-3 pt-3 border-t border-green-500/20 flex flex-wrap gap-2">
                                    {discoveredAgent.capabilities.streaming && (
                                        <span className="px-2 py-1 rounded-md bg-white/5 text-xs text-white/60">
                                            Streaming
                                        </span>
                                    )}
                                    {discoveredAgent.capabilities.pushNotifications && (
                                        <span className="px-2 py-1 rounded-md bg-white/5 text-xs text-white/60">
                                            Push Notifications
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hint Text */}
            {state === 'idle' && !isFocused && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-xs text-white/30 text-center"
                >
                    Try: <span className="text-white/50">restaurant-agent.example.com</span> or any A2A-compatible endpoint
                </motion.p>
            )}
        </div>
    );
};

export default AgentProbe;
