/**
 * WakeWordIndicator - Menu bar status icon for wake word listening
 *
 * Shows the current state of wake word detection:
 * - Hidden: Wake word disabled
 * - Gray mic: Enabled but not listening (idle)
 * - Blue mic: Loading/initializing
 * - Green pulsing mic: Actively listening for "Hey Liquid"
 * - Cyan flash: Wake word detected (briefly)
 * - Red: Error state
 */

import { useEffect, useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useWakeWordStore, type WakeWordListeningState } from '@/stores/wakeWordStore';

export const WakeWordIndicator: React.FC = () => {
    const enabled = useWakeWordStore((s) => s.enabled);
    const listeningState = useWakeWordStore((s) => s.listeningState);
    const isTrained = useWakeWordStore((s) => s.isTrained);
    const [showFlash, setShowFlash] = useState(false);

    // Flash animation when wake word detected
    useEffect(() => {
        if (listeningState === 'detected') {
            setShowFlash(true);
            const timer = setTimeout(() => setShowFlash(false), 500);
            return () => clearTimeout(timer);
        }
    }, [listeningState]);

    // Don't show if wake word is disabled
    if (!enabled) return null;

    const getConfig = (state: WakeWordListeningState) => {
        switch (state) {
            case 'loading':
                return {
                    icon: Loader2,
                    color: 'var(--system-blue)',
                    tooltip: 'Wake word: Initializing...',
                    animate: 'spin',
                };
            case 'listening':
                return {
                    icon: Mic,
                    color: 'var(--system-green)',
                    tooltip: 'Listening for "Hey Liquid"',
                    animate: 'pulse',
                };
            case 'detected':
                return {
                    icon: Mic,
                    color: 'var(--system-cyan)',
                    tooltip: 'Wake word detected!',
                    animate: 'flash',
                };
            case 'error':
                return {
                    icon: MicOff,
                    color: 'var(--system-red)',
                    tooltip: 'Wake word error',
                    animate: null,
                };
            case 'idle':
            default:
                return {
                    icon: Mic,
                    color: isTrained ? 'var(--glass-text-tertiary)' : 'var(--system-orange)',
                    tooltip: isTrained ? 'Wake word: Ready (not listening)' : 'Wake word: Not trained',
                    animate: null,
                };
        }
    };

    const config = getConfig(listeningState);
    const Icon = config.icon;

    return (
        <AnimatePresence>
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-[4px]",
                    "transition-colors duration-75",
                    "hover:bg-[var(--glass-surface-hover)]",
                    config.animate === 'pulse' && "animate-pulse"
                )}
                title={config.tooltip}
            >
                {config.animate === 'spin' ? (
                    <Icon size={14} className="animate-spin" style={{ color: config.color }} />
                ) : showFlash ? (
                    <motion.div
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.3 }}
                    >
                        <Icon size={14} style={{ color: config.color }} />
                    </motion.div>
                ) : (
                    <Icon size={14} style={{ color: config.color }} />
                )}
            </motion.button>
        </AnimatePresence>
    );
};

WakeWordIndicator.displayName = 'WakeWordIndicator';
