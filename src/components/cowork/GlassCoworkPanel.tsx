/**
 * GlassCoworkPanel
 *
 * A deep work panel for complex, multi-step tasks.
 * Opens as an overlay window like GlassSettingsPanel.
 * Layout: Left (History) | Main (Input/Progress) | Right (Progress/Artifacts/Context)
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
    ChevronRight,
    FileText,
    FolderOpen,
    Wrench,
    X,
    Chrome,
    ExternalLink
} from 'lucide-react';

import { useCoworkStore } from '@/stores/coworkStore';
import { useCoworkWebSocket } from '@/hooks/useCoworkWebSocket';

import { CoworkInput } from '@/components/cowork/CoworkInput';
import { QuickActions } from '@/components/cowork/QuickActions';
import { TaskProgress } from '@/components/cowork/TaskProgress';
import { SteeringControls } from '@/components/cowork/SteeringControls';
import { AgentCardsPanel } from '@/components/cowork/AgentCardsPanel';
import { PlanReviewModal } from '@/components/cowork/PlanReviewModal';
import { AgentSelector } from '@/components/cowork/AgentSelector';
import { TaskQueuePanel } from '@/components/cowork/TaskQueuePanel';

import { cn } from '@/utils/cn';
import type { TaskOptions, SelectedAgent, CoworkSessionSummary } from '@/types/cowork';

interface GlassCoworkPanelProps {
    onClose?: () => void;
}

// Connector configuration
const SUGGESTED_CONNECTORS = [
    { id: 'claude-chrome', name: 'Claude in Chrome', icon: Chrome },
    { id: 'notion', name: 'Notion', icon: FileText },
    { id: 'linear', name: 'Linear', icon: ExternalLink },
];

export const GlassCoworkPanel: React.FC<GlassCoworkPanelProps> = ({ onClose: _onClose }) => {
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
    const [showConnectors, setShowConnectors] = useState(true);

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

    // Progress steps from active session
    const progressSteps = activeSession?.plan?.steps || [];
    const currentStepIndex = activeSession?.currentStep || 0;

    // Context items (files/tools in use)
    const contextItems = activeSession?.context || [];

    // Artifacts from active session
    const artifacts = activeSession?.artifacts || [];

    return (
        <div className="flex h-full bg-[#0a0a0a]/50 text-white font-sans">
            {/* ===== LEFT SIDEBAR: Recent Tasks ===== */}
            <div className="w-64 border-r border-white/10 flex flex-col bg-black/20">
                {/* Header */}
                <div className="p-5 border-b border-white/10">
                    <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Cowork Mode
                    </h2>
                    <p className="text-xs text-white/40 mt-1">Deep work with AI oversight</p>
                </div>

                {/* New Task Button */}
                <div className="p-3 border-b border-white/10">
                    <button
                        onClick={handleNewTask}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                            "bg-gradient-to-r from-indigo-500/20 to-purple-500/20",
                            "border border-indigo-500/30 hover:border-indigo-500/50",
                            "text-indigo-300 hover:text-indigo-200"
                        )}
                    >
                        <Plus size={16} />
                        <span className="text-sm font-medium">New Task</span>
                    </button>
                </div>

                {/* Recent Tasks List */}
                <div className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
                    <div className="text-xs text-white/40 uppercase tracking-wider mb-2 px-2">
                        Recent Tasks
                    </div>

                    {recentSessions.length === 0 ? (
                        <div className="text-center py-6 text-white/30">
                            <Clock size={20} className="mx-auto mb-2 opacity-50" />
                            <p className="text-xs">No tasks yet</p>
                        </div>
                    ) : (
                        recentSessions.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => handleSelectSession(session)}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left",
                                    activeSession?.id === session.id
                                        ? "bg-[var(--glass-accent)]/20 text-[var(--glass-accent)] border border-[var(--glass-accent)]/30"
                                        : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
                                )}
                            >
                                {getStatusIcon(session.status)}
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium truncate">
                                        {session.title}
                                    </div>
                                    <div className="text-[10px] text-white/40">
                                        {formatTimeAgo(session.createdAt)}
                                    </div>
                                </div>
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
                        className="p-6 max-w-3xl mx-auto"
                    >
                        {isIdle ? (
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                                        <Sparkles className="text-indigo-400" size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h1 className="text-xl font-bold text-white">
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
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ===== RIGHT SIDEBAR: Progress/Artifacts/Context ===== */}
            <div className="w-72 border-l border-white/10 flex flex-col bg-black/20 overflow-y-auto custom-scrollbar">
                {/* Progress Section */}
                <div className="p-4 border-b border-white/10">
                    <h3 className="text-sm font-semibold text-white mb-3">Progress</h3>
                    <div className="space-y-2">
                        {progressSteps.length === 0 ? (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center">
                                        <CheckCircle size={12} className="text-white/30" />
                                    </div>
                                    <div className="w-4 h-px bg-white/20" />
                                    <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center">
                                        <CheckCircle size={12} className="text-white/30" />
                                    </div>
                                    <div className="w-4 h-px bg-white/20" />
                                    <div className="w-5 h-5 rounded-full border border-white/20" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                {progressSteps.slice(0, 5).map((step, i) => (
                                    <React.Fragment key={step.id}>
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border flex items-center justify-center",
                                            i < currentStepIndex
                                                ? "border-green-500 bg-green-500/20"
                                                : i === currentStepIndex
                                                    ? "border-indigo-500 bg-indigo-500/20"
                                                    : "border-white/20"
                                        )}>
                                            {i < currentStepIndex ? (
                                                <CheckCircle size={12} className="text-green-400" />
                                            ) : i === currentStepIndex ? (
                                                <Loader2 size={12} className="text-indigo-400 animate-spin" />
                                            ) : (
                                                <span className="text-[10px] text-white/40">{i + 1}</span>
                                            )}
                                        </div>
                                        {i < progressSteps.length - 1 && i < 4 && (
                                            <div className={cn(
                                                "w-4 h-px",
                                                i < currentStepIndex ? "bg-green-500/50" : "bg-white/20"
                                            )} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-white/40">
                            Steps will show as the task unfolds.
                        </p>
                    </div>
                </div>

                {/* Artifacts Section */}
                <div className="p-4 border-b border-white/10">
                    <h3 className="text-sm font-semibold text-white mb-3">Artifacts</h3>
                    {artifacts.length === 0 ? (
                        <div className="space-y-2">
                            <div className="w-12 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                <div className="flex gap-0.5">
                                    <div className="w-1 h-4 bg-white/20 rounded-sm" />
                                    <div className="w-1 h-4 bg-white/20 rounded-sm" />
                                    <div className="w-1 h-4 bg-white/20 rounded-sm" />
                                </div>
                            </div>
                            <p className="text-xs text-white/40">
                                Outputs created during the task land here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {artifacts.slice(0, 5).map((artifact) => (
                                <div
                                    key={artifact.id}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10"
                                >
                                    <FileText size={14} className="text-indigo-400" />
                                    <span className="text-xs text-white/80 truncate flex-1">
                                        {artifact.name}
                                    </span>
                                </div>
                            ))}
                            {artifacts.length > 5 && (
                                <p className="text-xs text-white/40">
                                    +{artifacts.length - 5} more files
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Context Section */}
                <div className="p-4 border-b border-white/10">
                    <h3 className="text-sm font-semibold text-white mb-3">Context</h3>
                    {contextItems.length === 0 ? (
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                    <FolderOpen size={16} className="text-white/30" />
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                                    <Plus size={14} className="text-white/30" />
                                </div>
                            </div>
                            <p className="text-xs text-white/40">
                                Track the tools and files in use as Claude works.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {contextItems.slice(0, 4).map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10"
                                >
                                    {item.type === 'file' ? (
                                        <FileText size={14} className="text-amber-400" />
                                    ) : (
                                        <Wrench size={14} className="text-cyan-400" />
                                    )}
                                    <span className="text-xs text-white/80 truncate flex-1">
                                        {item.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Suggested Connectors Section */}
                <div className="p-4 flex-1">
                    {showConnectors && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-white">
                                    Suggested connectors
                                </h3>
                                <button
                                    onClick={() => setShowConnectors(false)}
                                    className="p-1 rounded hover:bg-white/10 transition-colors"
                                >
                                    <X size={14} className="text-white/40" />
                                </button>
                            </div>
                            <p className="text-xs text-white/40">
                                Cowork uses connectors to browse websites, manage tasks, and more.
                            </p>
                            <div className="space-y-2">
                                {SUGGESTED_CONNECTORS.map((connector) => {
                                    const Icon = connector.icon;
                                    return (
                                        <button
                                            key={connector.id}
                                            className="w-full flex items-center justify-between p-3 rounded-lg
                                                       bg-white/5 border border-white/10 hover:border-white/20
                                                       transition-all text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                                    <Icon size={16} className="text-white/70" />
                                                </div>
                                                <span className="text-sm text-white/80">
                                                    {connector.name}
                                                </span>
                                            </div>
                                            <Plus size={16} className="text-white/40" />
                                        </button>
                                    );
                                })}
                            </div>
                            <button className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors">
                                See all connectors
                                <ChevronRight size={12} />
                            </button>
                        </div>
                    )}
                </div>
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

export default GlassCoworkPanel;
