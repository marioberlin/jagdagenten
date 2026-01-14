/**
 * AgentStatusOverview
 *
 * Displays a visual overview of the agent runtime status.
 * Shows Docker, API keys, and system health at a glance.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
    Container, Sparkles, Zap, Brain,
    CheckCircle2, XCircle, Loader2,
} from 'lucide-react';
import { cn } from '@/utils/cn';

// ============================================================================
// Types
// ============================================================================

interface EnvironmentCapabilities {
    docker: {
        available: boolean;
        version?: string;
        platform?: string;
    };
    system: {
        platform: string;
        arch: string;
        totalMemory: number;
        cpuCores: number;
    };
    apiKeys: {
        anthropic: boolean;
        openai: boolean;
        google: boolean;
        minimax: boolean;
    };
    cliTools: {
        geminiCli: boolean;
        claudeCode: boolean;
    };
}

interface AgentStatusOverviewProps {
    env: EnvironmentCapabilities | null;
    loading: boolean;
}

// ============================================================================
// Status Card Component
// ============================================================================

interface StatusCardProps {
    icon: React.ReactNode;
    label: string;
    status: 'ready' | 'missing' | 'loading';
    detail: string;
}

const StatusCard: React.FC<StatusCardProps> = ({ icon, label, status, detail }) => (
    <div className={cn(
        "flex flex-col items-center p-3 rounded-xl transition-colors",
        status === 'ready' && "bg-emerald-500/10 border border-emerald-500/20",
        status === 'missing' && "bg-white/[0.02] border border-white/10",
        status === 'loading' && "bg-white/[0.02] border border-white/10"
    )}>
        <div className={cn(
            "p-2 rounded-lg mb-2",
            status === 'ready' && "bg-emerald-500/20 text-emerald-400",
            status === 'missing' && "bg-white/10 text-white/40",
            status === 'loading' && "bg-white/10 text-white/40"
        )}>
            {status === 'loading' ? (
                <Loader2 className="animate-spin" size={18} />
            ) : (
                icon
            )}
        </div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className={cn(
            "text-xs mt-0.5 flex items-center gap-1",
            status === 'ready' && "text-emerald-400",
            status === 'missing' && "text-white/40",
            status === 'loading' && "text-white/40"
        )}>
            {status === 'ready' && <CheckCircle2 size={10} />}
            {status === 'missing' && <XCircle size={10} />}
            {detail}
        </div>
    </div>
);

// ============================================================================
// Main Component
// ============================================================================

export const AgentStatusOverview: React.FC<AgentStatusOverviewProps> = ({
    env,
    loading,
}) => {
    const status = {
        docker: loading ? 'loading' : (env?.docker.available ? 'ready' : 'missing'),
        claude: loading ? 'loading' : (env?.apiKeys.anthropic ? 'ready' : 'missing'),
        gemini: loading ? 'loading' : (env?.apiKeys.google ? 'ready' : 'missing'),
        openai: loading ? 'loading' : (env?.apiKeys.openai ? 'ready' : 'missing'),
    } as const;

    const readyCount = Object.values(status).filter(s => s === 'ready').length;
    const totalCount = Object.values(status).length;

    // Overall health
    const health = loading
        ? 'checking'
        : readyCount === totalCount
            ? 'ready'
            : readyCount >= 2
                ? 'partial'
                : 'setup';

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-white">Agent Runtime Status</h3>
                    <p className="text-sm text-white/50">
                        {loading && 'Detecting environment...'}
                        {!loading && readyCount === totalCount && 'All systems ready'}
                        {!loading && readyCount < totalCount && readyCount > 0 && `${readyCount}/${totalCount} components configured`}
                        {!loading && readyCount === 0 && 'Setup required'}
                    </p>
                </div>
                <div className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium",
                    health === 'ready' && "bg-emerald-500/20 text-emerald-400",
                    health === 'partial' && "bg-amber-500/20 text-amber-400",
                    health === 'setup' && "bg-red-500/20 text-red-400",
                    health === 'checking' && "bg-white/10 text-white/60"
                )}>
                    {health === 'ready' && 'Ready'}
                    {health === 'partial' && 'Partial'}
                    {health === 'setup' && 'Setup Required'}
                    {health === 'checking' && 'Checking...'}
                </div>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-4 gap-3">
                <StatusCard
                    icon={<Container size={18} />}
                    label="Docker"
                    status={status.docker}
                    detail={
                        loading
                            ? 'Detecting...'
                            : env?.docker.available
                                ? env.docker.platform || 'Available'
                                : 'Not installed'
                    }
                />
                <StatusCard
                    icon={<Sparkles size={18} />}
                    label="Claude"
                    status={status.claude}
                    detail={
                        loading
                            ? 'Detecting...'
                            : env?.apiKeys.anthropic
                                ? 'API key found'
                                : 'Add API key'
                    }
                />
                <StatusCard
                    icon={<Zap size={18} />}
                    label="Gemini"
                    status={status.gemini}
                    detail={
                        loading
                            ? 'Detecting...'
                            : env?.apiKeys.google
                                ? env?.cliTools.geminiCli ? 'CLI installed' : 'API only'
                                : 'Optional'
                    }
                />
                <StatusCard
                    icon={<Brain size={18} />}
                    label="OpenAI"
                    status={status.openai}
                    detail={
                        loading
                            ? 'Detecting...'
                            : env?.apiKeys.openai
                                ? 'API key found'
                                : 'Optional'
                    }
                />
            </div>

            {/* Capacity Bar */}
            {!loading && env && (
                <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                        <span>Estimated Capacity</span>
                        <span>{Math.min(env.system.cpuCores * 2, Math.floor(env.system.totalMemory / (512 * 1024 * 1024)))} concurrent agents</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[var(--glass-accent)] to-emerald-400"
                            initial={{ width: 0 }}
                            animate={{
                                width: `${Math.min(100, (readyCount / totalCount) * 100)}%`
                            }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        />
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default AgentStatusOverview;
