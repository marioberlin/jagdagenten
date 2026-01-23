import React from 'react';
import { motion } from 'framer-motion';
import {
    Bot,
    Play,
    Pause,
    AlertTriangle,
    CheckCircle,
    Clock,
    Settings,
    Eye,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer, GlassButton } from '@/components';
import type { BotStatus } from '@/hooks/trading/useDashboardData';

interface BotOverviewProps {
    bots: BotStatus[];
    isLoading?: boolean;
    onBotClick?: (bot: BotStatus) => void;
    onToggleBot?: (botId: string) => void;
}

/**
 * BotStatusBadge - Status indicator with text
 */
const BotStatusBadge: React.FC<{
    status: BotStatus['status'];
    health: BotStatus['health'];
}> = ({ status, health }) => {
    const statusConfig = {
        running: {
            label: 'Running',
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/20',
            dotColor: 'bg-emerald-500',
            pulse: true,
        },
        paused: {
            label: 'Paused',
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/20',
            dotColor: 'bg-amber-500',
            pulse: false,
        },
        stopped: {
            label: 'Stopped',
            color: 'text-gray-400',
            bgColor: 'bg-gray-500/20',
            dotColor: 'bg-gray-500',
            pulse: false,
        },
        error: {
            label: 'Error',
            color: 'text-red-400',
            bgColor: 'bg-red-500/20',
            dotColor: 'bg-red-500',
            pulse: true,
        },
    };

    const config = statusConfig[status];

    return (
        <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium', config.bgColor, config.color)}>
            <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                config.dotColor,
                config.pulse && 'animate-pulse'
            )} />
            <span>{config.label}</span>
            {health === 'warning' && status === 'running' && (
                <AlertTriangle className="w-3 h-3 text-amber-400" />
            )}
        </div>
    );
};

/**
 * BotCard - Individual bot display card
 */
const BotCard: React.FC<{
    bot: BotStatus;
    index: number;
    onClick?: () => void;
    onToggle?: () => void;
}> = ({ bot, index, onClick, onToggle }) => {
    const isPnLPositive = bot.pnl >= 0;

    const formatPnL = (n: number) => {
        if (Math.abs(n) >= 1000) {
            return `${n >= 0 ? '+' : ''}$${(n / 1000).toFixed(1)}K`;
        }
        return `${n >= 0 ? '+' : ''}$${n.toFixed(2)}`;
    };

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
            className="group"
        >
            <div
                className={cn(
                    'relative p-4 rounded-xl',
                    'bg-gradient-to-br from-white/8 to-white/4',
                    'border border-white/10',
                    'hover:border-white/20 hover:bg-white/10',
                    'transition-all duration-200 cursor-pointer',
                    bot.health === 'error' && 'border-red-500/30 hover:border-red-500/50'
                )}
                onClick={onClick}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            'p-2 rounded-xl',
                            bot.status === 'running' && bot.health === 'healthy' && 'bg-emerald-500/20',
                            bot.status === 'running' && bot.health !== 'healthy' && 'bg-amber-500/20',
                            bot.status === 'paused' && 'bg-amber-500/20',
                            bot.status === 'error' && 'bg-red-500/20',
                            bot.status === 'stopped' && 'bg-gray-500/20'
                        )}>
                            <Bot className={cn(
                                'w-5 h-5',
                                bot.status === 'running' && bot.health === 'healthy' && 'text-emerald-400',
                                bot.status === 'running' && bot.health !== 'healthy' && 'text-amber-400',
                                bot.status === 'paused' && 'text-amber-400',
                                bot.status === 'error' && 'text-red-400',
                                bot.status === 'stopped' && 'text-gray-400'
                            )} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-primary text-sm">{bot.name}</h4>
                            <p className="text-xs text-secondary">{bot.strategy}</p>
                        </div>
                    </div>
                    <BotStatusBadge status={bot.status} health={bot.health} />
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                    {/* P&L */}
                    <div className="text-center">
                        <div className={cn(
                            'text-sm font-semibold tabular-nums',
                            isPnLPositive ? 'text-emerald-400' : 'text-red-400'
                        )}>
                            {formatPnL(bot.pnl)}
                        </div>
                        <div className="text-[10px] text-secondary">P&L</div>
                    </div>

                    {/* Win Rate */}
                    <div className="text-center">
                        <div className="text-sm font-semibold text-primary tabular-nums">
                            {bot.winRate}%
                        </div>
                        <div className="text-[10px] text-secondary">Win Rate</div>
                    </div>

                    {/* Positions */}
                    <div className="text-center">
                        <div className="text-sm font-semibold text-primary tabular-nums">
                            {bot.positions}
                        </div>
                        <div className="text-[10px] text-secondary">Positions</div>
                    </div>
                </div>

                {/* Last Action */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 mb-3">
                    <Clock className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    <span className="text-xs text-secondary truncate flex-1">
                        {bot.lastAction}
                    </span>
                    <span className="text-[10px] text-tertiary flex-shrink-0">
                        {formatTimeAgo(bot.lastActionTime)}
                    </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-secondary">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Uptime: {bot.uptime}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggle?.();
                            }}
                            className={cn(
                                'p-1.5 rounded-lg transition-colors',
                                bot.status === 'running'
                                    ? 'hover:bg-amber-500/20 text-amber-400'
                                    : 'hover:bg-emerald-500/20 text-emerald-400'
                            )}
                            title={bot.status === 'running' ? 'Pause' : 'Start'}
                        >
                            {bot.status === 'running' ? (
                                <Pause className="w-4 h-4" />
                            ) : (
                                <Play className="w-4 h-4" />
                            )}
                        </button>
                        <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-secondary"
                            title="Settings"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Error indicator */}
                {bot.health === 'error' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900"
                    />
                )}
            </div>
        </motion.div>
    );
};

/**
 * BotOverview - Grid of bot cards
 */
export const BotOverview: React.FC<BotOverviewProps> = ({
    bots,
    isLoading = false,
    onBotClick,
    onToggleBot,
}) => {
    const runningCount = bots.filter(b => b.status === 'running').length;
    const errorCount = bots.filter(b => b.health === 'error').length;

    if (isLoading) {
        return (
            <GlassContainer className="p-6" border>
                <div className="h-48 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                </div>
            </GlassContainer>
        );
    }

    return (
        <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="px-6"
        >
            <div className="max-w-7xl mx-auto">
                <GlassContainer className="p-6" border>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-cyan-500/20">
                                <Bot className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-primary">Trading Bots</h3>
                                <div className="flex items-center gap-3 text-xs text-secondary">
                                    <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        {runningCount} running
                                    </span>
                                    {errorCount > 0 && (
                                        <span className="flex items-center gap-1 text-red-400">
                                            <AlertTriangle className="w-3 h-3" />
                                            {errorCount} error{errorCount > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <GlassButton
                            variant="secondary"
                            size="sm"
                            onClick={() => window.location.href = '/terminal/bots'}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            View All
                        </GlassButton>
                    </div>

                    {/* Bot Grid */}
                    {bots.length === 0 ? (
                        <div className="text-center py-8">
                            <Bot className="w-12 h-12 mx-auto mb-3 text-secondary opacity-30" />
                            <p className="text-secondary">No bots configured</p>
                            <GlassButton
                                variant="primary"
                                size="sm"
                                className="mt-4"
                                onClick={() => window.location.href = '/terminal/bots'}
                            >
                                Create Your First Bot
                            </GlassButton>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {bots.map((bot, index) => (
                                <BotCard
                                    key={bot.id}
                                    bot={bot}
                                    index={index}
                                    onClick={() => onBotClick?.(bot)}
                                    onToggle={() => onToggleBot?.(bot.id)}
                                />
                            ))}
                        </div>
                    )}
                </GlassContainer>
            </div>
        </motion.section>
    );
};

export default BotOverview;
