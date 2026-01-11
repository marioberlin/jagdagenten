/**
 * GlassThinking.tsx
 * 
 * Visual component for displaying NLWeb pipeline stages.
 * Shows abstract, user-friendly stage messages during processing.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import type { PipelineStage } from '../../liquid-engine/nlweb';

export interface GlassThinkingProps {
    /** Current pipeline stage */
    stage: PipelineStage;
    /** Custom message to display (overrides default stage message) */
    message?: string;
    /** Additional CSS classes */
    className?: string;
}

// Abstract/Jolly stage messages
const STAGE_MESSAGES: Record<PipelineStage, string> = {
    idle: '',
    filtering: 'Warming up...',
    analyzing: 'Connecting the dots...',
    retrieving: 'Exploring...',
    synthesizing: 'Crafting your answer...',
    blocked: "Let's try something else!",
    complete: '',
};

// Stage icons
const STAGE_ICONS: Record<PipelineStage, React.ReactNode> = {
    idle: null,
    filtering: <Loader2 className="w-4 h-4 animate-spin" />,
    analyzing: <Sparkles className="w-4 h-4 animate-pulse" />,
    retrieving: <Loader2 className="w-4 h-4 animate-spin" />,
    synthesizing: <Sparkles className="w-4 h-4 animate-pulse" />,
    blocked: <XCircle className="w-4 h-4" />,
    complete: <CheckCircle2 className="w-4 h-4" />,
};

// Stage colors
const STAGE_COLORS: Record<PipelineStage, string> = {
    idle: 'text-gray-400',
    filtering: 'text-blue-400',
    analyzing: 'text-cyan-400',
    retrieving: 'text-purple-400',
    synthesizing: 'text-emerald-400',
    blocked: 'text-red-400',
    complete: 'text-green-400',
};

const STAGE_BG_COLORS: Record<PipelineStage, string> = {
    idle: 'bg-gray-500/10',
    filtering: 'bg-blue-500/10',
    analyzing: 'bg-cyan-500/10',
    retrieving: 'bg-purple-500/10',
    synthesizing: 'bg-emerald-500/10',
    blocked: 'bg-red-500/10',
    complete: 'bg-green-500/10',
};

export const GlassThinking: React.FC<GlassThinkingProps> = ({
    stage,
    message,
    className = ''
}) => {
    const displayMessage = message || STAGE_MESSAGES[stage];
    const isVisible = stage !== 'idle' && stage !== 'complete';

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`
                        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                        backdrop-blur-md border border-white/10
                        ${STAGE_BG_COLORS[stage]}
                        ${className}
                    `}
                >
                    <span className={STAGE_COLORS[stage]}>
                        {STAGE_ICONS[stage]}
                    </span>
                    <span className={`text-xs font-medium ${STAGE_COLORS[stage]}`}>
                        {displayMessage}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

GlassThinking.displayName = 'GlassThinking';

export default GlassThinking;
