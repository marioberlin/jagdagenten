/**
 * AgentCardsPanel
 *
 * Floating cards showing sub-agent status during parallel execution.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
    Loader2,
    Brain,
    Cog,
    CheckCircle,
    XCircle
} from 'lucide-react';

import type { AgentInstance } from '@/types/cowork';

interface AgentCardsPanelProps {
    agents: AgentInstance[];
}

export const AgentCardsPanel: React.FC<AgentCardsPanelProps> = ({ agents }) => {
    if (!agents || agents.length === 0) return null;

    return (
        <div className="mt-4">
            <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
                Active Agents ({agents.length})
            </h4>
            <div className="grid grid-cols-2 gap-3">
                {agents.map((agent) => (
                    <AgentStatusCard key={agent.id} agent={agent} />
                ))}
            </div>
        </div>
    );
};

interface AgentStatusCardProps {
    agent: AgentInstance;
}

const AgentStatusCard: React.FC<AgentStatusCardProps> = ({ agent }) => {
    const statusColors: Record<string, string> = {
        initializing: 'text-yellow-400',
        thinking: 'text-purple-400',
        working: 'text-indigo-400',
        waiting: 'text-white/50',
        completed: 'text-green-400',
        failed: 'text-red-400',
        terminated: 'text-red-400'
    };

    const statusIcons: Record<string, React.ElementType> = {
        initializing: Loader2,
        thinking: Brain,
        working: Cog,
        waiting: Loader2,
        completed: CheckCircle,
        failed: XCircle,
        terminated: XCircle
    };

    const Icon = statusIcons[agent.status] || Cog;
    const isAnimating = ['initializing', 'waiting'].includes(agent.status);
    const isPulsing = agent.status === 'thinking';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-xl bg-white/5 border border-white/10"
        >
            <div className="flex items-center gap-2 mb-2">
                <Icon
                    size={14}
                    className={`
                        ${statusColors[agent.status] || 'text-white/50'}
                        ${isAnimating ? 'animate-spin' : ''}
                        ${isPulsing ? 'animate-pulse' : ''}
                    `}
                />
                <span className="text-sm font-medium text-white/80 truncate">
                    {agent.name}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${agent.progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            {/* Current Thought */}
            {agent.currentThought && (
                <p className="text-xs text-white/40 italic line-clamp-2">
                    "{agent.currentThought}"
                </p>
            )}
        </motion.div>
    );
};

export default AgentCardsPanel;
