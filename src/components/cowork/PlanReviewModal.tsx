/**
 * PlanReviewModal
 *
 * Plan approval dialog before execution.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ClipboardList,
    AlertTriangle,
    ChevronRight
} from 'lucide-react';

import type { TaskPlan, PlanModification } from '@/types/cowork';

interface PlanReviewModalProps {
    open: boolean;
    plan: TaskPlan | null;
    onApprove: (modifications?: PlanModification[]) => void;
    onModify: () => void;
    onReject: () => void;
    onClose: () => void;
}

export const PlanReviewModal: React.FC<PlanReviewModalProps> = ({
    open,
    plan,
    onApprove,
    onModify,
    onReject,
    onClose
}) => {
    if (!open || !plan) return null;

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
                    >
                        <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl
                                        bg-[#1a1a2e]/95 backdrop-blur-2xl border border-white/10
                                        shadow-2xl pointer-events-auto flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-indigo-500/20">
                                        <ClipboardList className="text-indigo-400" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">
                                            Review Plan
                                        </h2>
                                        <p className="text-sm text-white/50">
                                            Here's how I'll approach this task
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <X size={20} className="text-white/60" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Task Analysis */}
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <h3 className="text-sm font-medium text-white/70 mb-2">
                                        Task Analysis
                                    </h3>
                                    <p className="text-white/90 leading-relaxed">
                                        {plan.approach}
                                    </p>
                                </div>

                                {/* Execution Steps */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-medium text-white/70">
                                            Execution Plan ({plan.steps.length} steps)
                                        </h3>
                                        <span className="text-xs text-white/40">
                                            Est. {plan.estimatedDuration}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {plan.steps.map((step, index) => (
                                            <div
                                                key={step.id}
                                                className="flex items-start gap-3 p-3 rounded-lg
                                                           bg-white/5 border border-white/5
                                                           hover:border-white/10 transition-colors"
                                            >
                                                <span className="flex items-center justify-center
                                                                 w-6 h-6 rounded-full bg-indigo-500/20
                                                                 text-xs text-indigo-400 font-medium flex-shrink-0">
                                                    {index + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm text-white/90">
                                                        {step.title}
                                                    </div>
                                                    {step.description && (
                                                        <div className="text-xs text-white/40 mt-0.5 line-clamp-2">
                                                            {step.description}
                                                        </div>
                                                    )}
                                                </div>
                                                <ChevronRight size={16} className="text-white/20 flex-shrink-0" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Warnings & Estimates */}
                                <div className="flex items-center gap-4 p-3 rounded-lg
                                                bg-amber-500/10 border border-amber-500/20">
                                    <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
                                    <div className="flex-1 text-sm">
                                        <span className="text-white/70">Will modify: </span>
                                        <span className="text-white/90 font-medium">{plan.filesAffected} files</span>
                                        <span className="text-white/40 mx-2">|</span>
                                        <span className="text-white/70">Est. cost: </span>
                                        <span className="text-white/90 font-medium">${plan.estimatedCost.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between p-6 border-t border-white/10 bg-black/20">
                                <button
                                    onClick={onReject}
                                    className="px-4 py-2 text-sm text-white/60
                                               hover:text-white/90 transition-colors"
                                    type="button"
                                >
                                    ← Try Different Approach
                                </button>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={onModify}
                                        className="px-4 py-2 rounded-lg bg-white/5
                                                   hover:bg-white/10 text-white/70
                                                   text-sm transition-colors"
                                        type="button"
                                    >
                                        Modify Plan
                                    </button>
                                    <button
                                        onClick={() => onApprove()}
                                        className="px-5 py-2 rounded-lg bg-gradient-to-r
                                                   from-indigo-500 to-purple-500 text-white
                                                   font-medium text-sm hover:shadow-lg
                                                   hover:shadow-indigo-500/25 transition-all"
                                        type="button"
                                    >
                                        Looks Good, Let's Go →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default PlanReviewModal;
