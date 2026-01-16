/**
 * SandboxIndicator
 *
 * Shows the current sandbox status in the UI.
 * Displays when a sandbox is active, creating, or has conflicts.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Loader2, Check, X } from 'lucide-react';
import { useSandboxStore } from '@/stores/sandboxStore';

export function SandboxIndicator() {
    const {
        activeSandbox,
        diffSummary,
        isCreating,
        isMerging,
    } = useSandboxStore();

    if (!activeSandbox && !isCreating) {
        return null;
    }

    const hasConflicts = diffSummary && diffSummary.conflicts > 0;
    const hasChanges = diffSummary && diffSummary.total > 0;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-xl border"
                style={{
                    background: hasConflicts
                        ? 'rgba(234, 179, 8, 0.1)'
                        : 'rgba(34, 197, 94, 0.1)',
                    borderColor: hasConflicts
                        ? 'rgba(234, 179, 8, 0.3)'
                        : 'rgba(34, 197, 94, 0.3)',
                }}
            >
                {isCreating && (
                    <>
                        <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                        <span className="text-sm text-green-300">
                            Creating sandbox...
                        </span>
                    </>
                )}

                {isMerging && (
                    <>
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        <span className="text-sm text-blue-300">
                            Applying changes...
                        </span>
                    </>
                )}

                {activeSandbox && !isCreating && !isMerging && (
                    <>
                        {hasConflicts ? (
                            <>
                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm text-yellow-300">
                                    Sandboxed ({diffSummary.conflicts} conflicts)
                                </span>
                            </>
                        ) : (
                            <>
                                <Shield className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-green-300">
                                    Sandboxed
                                    {hasChanges && ` (${diffSummary.total} changes)`}
                                </span>
                            </>
                        )}
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
}

/**
 * Compact version for use in toolbars
 */
export function SandboxIndicatorCompact() {
    const { activeSandbox, diffSummary, isCreating, isMerging } = useSandboxStore();

    if (!activeSandbox && !isCreating) {
        return null;
    }

    const hasConflicts = diffSummary && diffSummary.conflicts > 0;

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="relative"
        >
            {isCreating || isMerging ? (
                <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
            ) : hasConflicts ? (
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
            ) : (
                <Shield className="w-5 h-5 text-green-400" />
            )}

            {/* Badge for change count */}
            {diffSummary && diffSummary.total > 0 && (
                <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{
                        background: hasConflicts ? '#eab308' : '#22c55e',
                        color: '#000',
                    }}
                >
                    {diffSummary.total > 9 ? '9+' : diffSummary.total}
                </span>
            )}
        </motion.div>
    );
}

export default SandboxIndicator;
