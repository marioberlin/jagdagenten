/**
 * TaskProgress
 *
 * Execution timeline with progress bar and step details.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
    Loader2,
    Circle,
    CheckCircle,
    XCircle,
    Brain,
    Clock
} from 'lucide-react';

import { calculateProgress, getCurrentStep, getStepStatus, formatDuration } from '@/stores/coworkStore';
import type { CoworkSession, PlanStep } from '@/types/cowork';

interface TaskProgressProps {
    session: CoworkSession | null;
}

export const TaskProgress: React.FC<TaskProgressProps> = ({ session }) => {
    if (!session) return null;

    const progressPercent = calculateProgress(session);
    const currentStep = getCurrentStep(session);
    const elapsedTime = session.startedAt
        ? Date.now() - new Date(session.startedAt).getTime()
        : 0;

    return (
        <div className="flex-1 flex flex-col">
            {/* Overall Progress Bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70">Overall Progress</span>
                    <span className="text-sm text-white/50">
                        {Math.round(progressPercent)}%
                    </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-white/40">
                    <span>
                        Step {currentStep?.order || 0} of {session.plan?.steps.length || 0}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock size={12} />
                        Elapsed: {formatDuration(elapsedTime)}
                    </span>
                </div>
            </div>

            {/* Current Step Detail */}
            {currentStep && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Loader2 className="animate-spin text-indigo-400" size={16} />
                        <span className="text-sm font-medium text-white/70">
                            Step {currentStep.order}: {currentStep.title}
                        </span>
                    </div>

                    {/* Agent Thought Process */}
                    {session.currentThought && (
                        <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                            <div className="flex items-start gap-2">
                                <Brain size={14} className="text-purple-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-white/60 italic leading-relaxed">
                                    "{session.currentThought}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step Timeline */}
            <div className="flex-1 overflow-y-auto">
                <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
                    Task Timeline
                </h4>
                <div className="space-y-2">
                    {session.plan?.steps.map((step) => (
                        <StepTimelineItem
                            key={step.id}
                            step={step}
                            status={getStepStatus(session, step.id)}
                            isCurrent={currentStep?.planStepId === step.id}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

interface StepTimelineItemProps {
    step: PlanStep;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    isCurrent: boolean;
}

const StepTimelineItem: React.FC<StepTimelineItemProps> = ({ step, status, isCurrent }) => {
    const statusIcons = {
        pending: <Circle size={16} className="text-white/30" />,
        in_progress: <Loader2 size={16} className="text-indigo-400 animate-spin" />,
        completed: <CheckCircle size={16} className="text-green-400" />,
        failed: <XCircle size={16} className="text-red-400" />
    };

    return (
        <div
            className={`
                flex items-start gap-3 p-3 rounded-lg transition-colors
                ${isCurrent ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-white/5'}
            `}
        >
            <div className="flex-shrink-0 mt-0.5">
                {statusIcons[status]}
            </div>
            <div className="flex-1 min-w-0">
                <div
                    className={`text-sm ${status === 'completed' ? 'text-white/50' : 'text-white/90'
                        }`}
                >
                    {step.title}
                </div>
                {step.result && status === 'completed' && (
                    <div className="text-xs text-white/40 mt-1 line-clamp-2">
                        {step.result}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskProgress;
