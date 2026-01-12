import React from 'react';
import { motion } from 'framer-motion';
import { useAgentConfig } from '@/context/AgentConfigContext';
import { Activity, Cpu, Shield, Zap, Search, Command } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * AgentCommandCenter
 * 
 * The central dashboard for the Spatial OS (Home Screen).
 * Displays system health, active agents, and quick actions.
 */
export const AgentCommandCenter: React.FC = () => {
    const { runtimeMode, llmProvider } = useAgentConfig();

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-4xl"
            >
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 tracking-tight mb-4">
                        Liquid OS <span className="text-xl align-top opacity-50 font-mono">v2.0</span>
                    </h1>
                    <p className="text-xl text-white/60 font-light">
                        Spatial Operating System initialized.
                    </p>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-4 gap-6 mb-12">
                    <StatusCard
                        icon={Zap}
                        label="System Status"
                        value="Operational"
                        color="text-emerald-400"
                        bg="bg-emerald-500/10"
                    />
                    <StatusCard
                        icon={Cpu}
                        label="AI Core"
                        value={llmProvider.toUpperCase()}
                        color="text-blue-400"
                        bg="bg-blue-500/10"
                    />
                    <StatusCard
                        icon={Shield}
                        label="Runtime"
                        value={runtimeMode === 'production' ? 'LIVE' : 'SANDBOX'}
                        color={runtimeMode === 'production' ? 'text-red-400' : 'text-yellow-400'}
                        bg={runtimeMode === 'production' ? 'bg-red-500/10' : 'bg-yellow-500/10'}
                    />
                    <StatusCard
                        icon={Activity}
                        label="Network"
                        value="Connected"
                        color="text-purple-400"
                        bg="bg-purple-500/10"
                    />
                </div>

                {/* Search / Command Prompt */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <button
                        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                        className="relative w-full flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all cursor-text text-left"
                    >
                        <div className="flex items-center gap-4">
                            <Search className="text-white/40" />
                            <span className="text-xl text-white/40 font-light">Ask Liquid AI anything...</span>
                        </div>
                        <div className="flex gap-2">
                            <kbd className="px-2 py-1 rounded bg-black/40 border border-white/10 text-xs text-white/60 font-mono">⌘</kbd>
                            <kbd className="px-2 py-1 rounded bg-black/40 border border-white/10 text-xs text-white/60 font-mono">K</kbd>
                        </div>
                    </button>
                </div>

                {/* Recent Modules - Placeholder suggestion */}
                <div className="mt-12 flex justify-center gap-6 text-sm text-white/30">
                    <span>Press <kbd className="font-mono text-white/50">⌘K</kbd> to open Command Palette</span>
                    <span>•</span>
                    <span>Use <kbd className="font-mono text-white/50">Space</kbd> to verify modules</span>
                </div>
            </motion.div>
        </div>
    );
};

const StatusCard = ({ icon: Icon, label, value, color, bg }: any) => (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
        <div className={cn("p-3 rounded-xl mb-3", bg, color)}>
            <Icon size={24} />
        </div>
        <div className="text-sm text-white/40 font-medium mb-1">{label}</div>
        <div className={cn("text-lg font-bold tracking-wide", color)}>{value}</div>
    </div>
);
