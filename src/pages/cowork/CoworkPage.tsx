/**
 * CoworkPage
 *
 * The deep work interface for complex, multi-step tasks.
 * Layout: Left (History Sidebar) | Main (Input/Progress) | Right (Artifacts)
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase,
    Sparkles,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    Plus,
    ChevronRight
} from 'lucide-react';

import { useCoworkStore } from '@/stores/coworkStore';
import { useCoworkWebSocket } from '@/hooks/useCoworkWebSocket';

import { CoworkInput } from '@/components/cowork/CoworkInput';
import { QuickActions } from '@/components/cowork/QuickActions';
import { TaskProgress } from '@/components/cowork/TaskProgress';
import { SteeringControls } from '@/components/cowork/SteeringControls';
import { AgentCardsPanel } from '@/components/cowork/AgentCardsPanel';
import { ArtifactsPanel } from '@/components/cowork/ArtifactsPanel';
import { PlanReviewModal } from '@/components/cowork/PlanReviewModal';
import { AgentSelector } from '@/components/cowork/AgentSelector';
import { TaskQueuePanel } from '@/components/cowork/TaskQueuePanel';

import { cn } from '@/utils/cn';
import type { TaskOptions, SelectedAgent, CoworkSessionSummary } from '@/types/cowork';

export const CoworkPage: React.FC = () => {
    const {
        activeSession,
        recentSessions,
        status,
        planModalOpen,
        setPlanModalOpen,
        createSession,
        approvePlan,
        loadSession
    } = useCoworkStore();

    const [inputValue, setInputValue] = useState('');
    const [selectedAgent, setSelectedAgent] = useState<SelectedAgent | null>(null);
    const [queueExpanded, setQueueExpanded] = useState(false);

    // Connect WebSocket when we have an active session
    useCoworkWebSocket(activeSession?.id || null);

    const handleSubmit = useCallback(async (description: string, options: TaskOptions) => {
        try {
            await createSession(description, {
                workspacePath: options.workspacePath || undefined,
                agent: options.agent
            });
            setInputValue('');
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    }, [createSession]);

    const handleQuickAction = useCallback((prompt: string) => {
        setInputValue(prompt);
    }, []);

    const handleApprove = useCallback(async () => {
        await approvePlan();
    }, [approvePlan]);

    const handleModify = useCallback(() => {
        console.log('Modify plan');
    }, []);

    const handleReject = useCallback(() => {
        setPlanModalOpen(false);
    }, [setPlanModalOpen]);

    const handleSelectSession = useCallback((session: CoworkSessionSummary) => {
        loadSession(session.id);
    }, [loadSession]);

    const handleNewTask = useCallback(() => {
        setInputValue('');
        // Reset to idle state if needed
    }, []);

    const isIdle = status === 'idle';
    const isExecuting = status === 'executing';

    const getStatusIcon = (sessionStatus: string) => {
        switch (sessionStatus) {
            case 'completed':
                return <CheckCircle size={14} className="text-green-400" />;
            case 'failed':
                return <XCircle size={14} className="text-red-400" />;
            case 'executing':
            case 'planning':
                return <Loader2 size={14} className="text-indigo-400 animate-spin" />;
            default:
                return <Clock size={14} className="text-white/40" />;
        }
    };

    const formatTimeAgo = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    return (
        <div className="flex h-full bg-[#0a0a0a]/50 text-white font-sans">
            {/* ===== LEFT SIDEBAR: Recent Tasks ===== */}
            <div className="w-72 border-r border-white/10 flex flex-col bg-black/20">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Cowork Mode
                    </h2>
                    <p className="text-xs text-white/40 mt-1">Deep work with AI oversight</p>
                </div>

                {/* New Task Button */}
                <div className="p-4 border-b border-white/10">
                    <button
                        onClick={handleNewTask}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                            "bg-gradient-to-r from-indigo-500/20 to-purple-500/20",
                            "border border-indigo-500/30 hover:border-indigo-500/50",
                            "text-indigo-300 hover:text-indigo-200"
                        )}
                    >
                        <Plus size={18} />
                        <span className="font-medium">New Task</span>
                    </button>
                </div>

                {/* Recent Tasks List */}
                <div className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-3 px-2">
                        Recent Tasks
                    </div>

                    {recentSessions.length === 0 ? (
                        <div className="text-center py-8 text-white/30">
                            <Clock size={24} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No tasks yet</p>
                            <p className="text-xs">Start a new task to begin</p>
                        </div>
                    ) : (
                        recentSessions.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => handleSelectSession(session)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
                                    activeSession?.id === session.id
                                        ? "bg-[var(--glass-accent)]/20 text-[var(--glass-accent)] border border-[var(--glass-accent)]/30"
                                        : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
                                )}
                            >
                                {getStatusIcon(session.status)}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">
                                        {session.title}
                                    </div>
                                    <div className="text-xs text-white/40">
                                        {formatTimeAgo(session.createdAt)}
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-white/30" />
                            </button>
                        ))
                    )}
                </div>

                {/* Task Queue Toggle */}
                <TaskQueuePanel
                    isExpanded={queueExpanded}
                    onToggleExpand={() => setQueueExpanded(!queueExpanded)}
                />
            </div>

            {/* ===== MAIN CONTENT AREA ===== */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={status}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="p-8 max-w-4xl mx-auto"
                    >
                        {isIdle ? (
                            <div className="space-y-8">
                                {/* Header */}
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                                        <Sparkles className="text-indigo-400" size={28} />
                                    </div>
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-white">
                                            What would you like to accomplish?
                                        </h1>
                                        <p className="text-sm text-white/50">
                                            Describe your outcome. I'll plan and execute.
                                        </p>
                                    </div>
                                    <AgentSelector
                                        selectedAgent={selectedAgent}
                                        onSelect={setSelectedAgent}
                                        disabled={status !== 'idle'}
                                    />
                                </div>

                                {/* Input Area */}
                                <CoworkInput
                                    value={inputValue}
                                    onChange={setInputValue}
                                    onSubmit={handleSubmit}
                                    disabled={status !== 'idle'}
                                />

                                {/* Quick Actions */}
                                <QuickActions onSelect={handleQuickAction} />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Session Header */}
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-indigo-500/20">
                                        <Briefcase className="text-indigo-400" size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-lg font-semibold text-white">
                                            {activeSession?.title || 'Task in Progress'}
                                        </h2>
                                        <p className="text-xs text-white/40">
                                            Session ID: {activeSession?.id?.slice(0, 12)}...
                                        </p>
                                    </div>
                                </div>

                                {/* Progress Timeline */}
                                <TaskProgress session={activeSession} />

                                {/* Steering Controls */}
                                <SteeringControls session={activeSession} />

                                {/* Active Agents */}
                                {isExecuting && activeSession?.activeAgents && (
                                    <AgentCardsPanel agents={activeSession.activeAgents} />
                                )}

                                {/* Artifacts Panel - Inline during execution */}
                                {activeSession?.artifacts && activeSession.artifacts.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="text-sm font-medium text-white/60 mb-4">
                                            Generated Artifacts
                                        </h3>
                                        <ArtifactsPanel artifacts={activeSession.artifacts} />
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ===== PLAN REVIEW MODAL ===== */}
            <PlanReviewModal
                open={planModalOpen}
                plan={activeSession?.plan || null}
                onApprove={handleApprove}
                onModify={handleModify}
                onReject={handleReject}
                onClose={() => setPlanModalOpen(false)}
            />
        </div>
    );
};

export default CoworkPage;
