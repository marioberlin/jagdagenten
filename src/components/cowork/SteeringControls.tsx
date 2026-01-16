/**
 * SteeringControls
 *
 * User intervention controls during execution (pause, resume, steer, stop).
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Pause,
    Play,
    Square,
    MessageSquare,
    Send
} from 'lucide-react';

import { useCoworkStore } from '@/stores/coworkStore';
import type { CoworkSession } from '@/types/cowork';

interface SteeringControlsProps {
    session: CoworkSession | null;
}

export const SteeringControls: React.FC<SteeringControlsProps> = ({ session }) => {
    const [guidanceInput, setGuidanceInput] = useState('');
    const [showGuidanceInput, setShowGuidanceInput] = useState(false);

    const {
        pauseSession,
        resumeSession,
        cancelSession,
        steerSession
    } = useCoworkStore();

    if (!session) return null;

    const isPaused = session.status === 'paused';
    const isExecuting = session.status === 'executing';

    const handleSendGuidance = () => {
        if (guidanceInput.trim()) {
            steerSession(session.id, guidanceInput);
            setGuidanceInput('');
            setShowGuidanceInput(false);
        }
    };

    return (
        <div className="border-t border-white/10 pt-4 mt-4">
            <div className="flex items-center gap-3">
                {/* Pause/Resume */}
                {isExecuting && (
                    <button
                        onClick={() => pauseSession(session.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg
                                   bg-white/5 hover:bg-white/10 text-white/70
                                   transition-colors"
                        type="button"
                    >
                        <Pause size={16} />
                        Pause
                    </button>
                )}

                {isPaused && (
                    <button
                        onClick={() => resumeSession(session.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg
                                   bg-indigo-500/20 hover:bg-indigo-500/30
                                   text-indigo-400 transition-colors"
                        type="button"
                    >
                        <Play size={16} />
                        Resume
                    </button>
                )}

                {/* Steer */}
                <button
                    onClick={() => setShowGuidanceInput(!showGuidanceInput)}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                        ${showGuidanceInput
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-white/5 hover:bg-white/10 text-white/70'
                        }
                    `}
                    type="button"
                >
                    <MessageSquare size={16} />
                    Send Guidance
                </button>

                {/* Stop */}
                <button
                    onClick={() => cancelSession(session.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg
                               bg-red-500/10 hover:bg-red-500/20 text-red-400
                               transition-colors ml-auto"
                    type="button"
                >
                    <Square size={16} />
                    Stop
                </button>
            </div>

            {/* Guidance Input */}
            <AnimatePresence>
                {showGuidanceInput && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden"
                    >
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={guidanceInput}
                                onChange={(e) => setGuidanceInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendGuidance()}
                                placeholder="Provide guidance to the agent..."
                                className="flex-1 px-4 py-2 rounded-lg bg-white/5
                                           border border-white/10 text-white
                                           placeholder:text-white/30 outline-none
                                           focus:border-purple-500/50 transition-colors"
                            />
                            <button
                                onClick={handleSendGuidance}
                                disabled={!guidanceInput.trim()}
                                className="px-4 py-2 rounded-lg bg-purple-500
                                           text-white disabled:opacity-50
                                           disabled:cursor-not-allowed transition-opacity"
                                type="button"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SteeringControls;
