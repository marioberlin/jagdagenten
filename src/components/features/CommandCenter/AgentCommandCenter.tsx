import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAgentConfig } from '@/context/AgentConfigContext';
import { Activity, Cpu, Shield, Zap, Search, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ServiceInfoTooltip } from './ServiceInfoTooltip';
import { useServiceHealth } from '@/hooks/useServiceHealth';
import { SERVICE_DESCRIPTIONS } from '@/data/serviceDescriptions';

/**
 * AgentCommandCenter
 * 
 * The central dashboard for the Spatial OS (Home Screen).
 * Displays system health, active agents, and quick actions.
 */
export const AgentCommandCenter: React.FC = () => {
    const { runtimeMode, llmProvider } = useAgentConfig();
    const { services, isAnyUnhealthy } = useServiceHealth();
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);

    // Determine overall system status based on health checks
    const getSystemStatus = () => {
        if (isAnyUnhealthy) return { value: 'Degraded', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
        return { value: 'Operational', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    };

    const systemStatus = getSystemStatus();
    const runtimeHealth = services['liquid-runtime']?.status || 'unknown';

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
                    <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 tracking-tight mb-4 translate-x-3">
                        Liquid OS <span className="text-xl align-top opacity-50 font-mono">v2.0</span>
                    </h1>
                    <p className="text-xl text-white/60 font-light translate-y-[-10px]">
                        Experimental Agentic Operating System initialized
                    </p>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-4 gap-6 mb-12">
                    <StatusCard
                        icon={Zap}
                        label="System Status"
                        value={systemStatus.value}
                        color={systemStatus.color}
                        bg={systemStatus.bg}
                        serviceId="system"
                        isHovered={hoveredCard === 'System Status'}
                        onHover={setHoveredCard}
                        healthStatus={isAnyUnhealthy ? 'unhealthy' : 'healthy'}
                        showWarning={isAnyUnhealthy}
                        allServices={services}
                    />
                    <StatusCard
                        icon={Cpu}
                        label="AI Core"
                        value={llmProvider.toUpperCase()}
                        color="text-blue-400"
                        bg="bg-blue-500/10"
                        serviceId="ai-core"
                        isHovered={hoveredCard === 'AI Core'}
                        onHover={setHoveredCard}
                    />
                    <StatusCard
                        icon={Shield}
                        label="Runtime"
                        value={runtimeMode === 'production' ? 'LIVE' : 'SANDBOX'}
                        color={runtimeHealth === 'unhealthy' ? 'text-red-400' :
                            runtimeMode === 'production' ? 'text-red-400' : 'text-yellow-400'}
                        bg={runtimeHealth === 'unhealthy' ? 'bg-red-500/10' :
                            runtimeMode === 'production' ? 'bg-red-500/10' : 'bg-yellow-500/10'}
                        serviceId="liquid-runtime"
                        isHovered={hoveredCard === 'Runtime'}
                        onHover={setHoveredCard}
                        healthStatus={runtimeHealth}
                        showWarning={runtimeHealth === 'unhealthy'}
                        allServices={services}
                    />
                    <StatusCard
                        icon={Activity}
                        label="Network"
                        value="Connected"
                        color="text-purple-400"
                        bg="bg-purple-500/10"
                        serviceId="network"
                        isHovered={hoveredCard === 'Network'}
                        onHover={setHoveredCard}
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

interface StatusCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
    bg: string;
    serviceId?: string;
    isHovered?: boolean;
    onHover?: (label: string | null) => void;
    healthStatus?: 'healthy' | 'unhealthy' | 'unknown' | 'checking';
    showWarning?: boolean;
    allServices?: Record<string, { status: 'healthy' | 'unhealthy' | 'unknown' | 'checking' }>;
}

const StatusCard: React.FC<StatusCardProps> = ({
    icon: Icon,
    label,
    value,
    color,
    bg,
    serviceId,
    isHovered,
    onHover,
    healthStatus = 'unknown',
    showWarning = false,
    allServices,
}) => {
    const service = serviceId ? SERVICE_DESCRIPTIONS[serviceId] : null;

    return (
        <div
            className="relative"
            onMouseEnter={() => onHover?.(label)}
            onMouseLeave={() => onHover?.(null)}
        >
            <div className={cn(
                "flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border backdrop-blur-sm transition-all duration-200",
                showWarning ? "border-yellow-500/30" : "border-white/5",
                isHovered && "border-white/20 bg-white/10"
            )}>
                <div className={cn("p-3 rounded-xl mb-3 relative", bg, color)}>
                    <Icon size={24} />
                    {showWarning && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                            <AlertTriangle size={10} className="text-black" />
                        </div>
                    )}
                </div>
                <div className="text-sm text-white/40 font-medium mb-1">{label}</div>
                <div className={cn("text-lg font-bold tracking-wide", color)}>{value}</div>
            </div>

            {/* Tooltip */}
            {service && (
                <ServiceInfoTooltip
                    service={service}
                    isVisible={isHovered || false}
                    healthStatus={healthStatus}
                    position="bottom"
                    allServices={allServices}
                />
            )}
        </div>
    );
};

