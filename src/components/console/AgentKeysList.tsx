import { motion } from 'framer-motion';
import { RefreshCw, ExternalLink, Trash2, Shield, Plus } from 'lucide-react';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { GlassButton } from '@/components/primitives/GlassButton';
import { cn } from '@/utils/cn';

export interface AgentKey {
    id: string;
    agent: string;
    url: string;
    status: 'up' | 'down' | 'unknown';
    lastChecked: string;
}

interface AgentKeysListProps {
    agentKeys: AgentKey[];
    onRefresh?: (keyId: string) => void;
    onVisit?: (keyId: string) => void;
    onRemove?: (keyId: string) => void;
    onAdd?: () => void;
    isLoading?: boolean;
}

const STATUS_CONFIG: Record<AgentKey['status'], { color: string; label: string }> = {
    'up': { color: 'bg-green-500', label: 'Online' },
    'down': { color: 'bg-red-500', label: 'Offline' },
    'unknown': { color: 'bg-yellow-500', label: 'Unknown' },
};

/**
 * AgentKeysList
 * 
 * List component for displaying connected remote agents with:
 * - Status indicator
 * - Agent URL
 * - Actions (refresh, visit, remove)
 */
export function AgentKeysList({
    agentKeys,
    onRefresh,
    onVisit,
    onRemove,
    onAdd,
    isLoading = false,
}: AgentKeysListProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <GlassContainer className="p-6" border>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Connected Remote Agents</h3>
                        <p className="text-sm text-white/60">External agents you've connected to via Agent Hub</p>
                    </div>
                </div>
                {onAdd && (
                    <GlassButton variant="ghost" size="sm" onClick={onAdd}>
                        <Plus size={14} />
                        Add Agent
                    </GlassButton>
                )}
            </div>

            {/* Agent List */}
            {agentKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-white/40">
                    <Shield className="w-8 h-8 mb-2 opacity-50" />
                    <p>No remote agents connected</p>
                    <p className="text-xs mt-1">Use Agent Hub to discover and connect to agents</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {agentKeys.map((key, idx) => {
                        const statusConfig = STATUS_CONFIG[key.status];

                        return (
                            <motion.div
                                key={key.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Status indicator */}
                                    <div className="relative">
                                        <div className={cn(
                                            'w-3 h-3 rounded-full',
                                            statusConfig.color
                                        )} />
                                        {key.status === 'up' && (
                                            <div className={cn(
                                                'absolute inset-0 w-3 h-3 rounded-full animate-ping',
                                                statusConfig.color,
                                                'opacity-75'
                                            )} />
                                        )}
                                    </div>

                                    {/* Agent info */}
                                    <div>
                                        <p className="text-sm text-white font-medium">{key.agent}</p>
                                        <p className="text-xs text-white/40">{key.url}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Status & last checked */}
                                    <div className="text-right hidden sm:block">
                                        <p className={cn(
                                            'text-xs font-medium',
                                            key.status === 'up' ? 'text-green-400' :
                                                key.status === 'down' ? 'text-red-400' : 'text-yellow-400'
                                        )}>
                                            {statusConfig.label}
                                        </p>
                                        <p className="text-xs text-white/40">Checked {key.lastChecked}</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        {onRefresh && (
                                            <button
                                                className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                                onClick={() => onRefresh(key.id)}
                                                title="Refresh Status"
                                            >
                                                <RefreshCw size={14} />
                                            </button>
                                        )}
                                        {onVisit && (
                                            <button
                                                className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                                onClick={() => onVisit(key.id)}
                                                title="Visit Agent"
                                            >
                                                <ExternalLink size={14} />
                                            </button>
                                        )}
                                        {onRemove && (
                                            <button
                                                className="p-1.5 rounded hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                                                onClick={() => onRemove(key.id)}
                                                title="Remove Agent"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </GlassContainer>
    );
}
