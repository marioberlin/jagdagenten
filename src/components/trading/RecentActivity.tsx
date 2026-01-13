import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    ArrowUpRight,
    Bot,
    Bell,
    Download,
    Upload,
    AlertCircle,
    CheckCircle,
    AlertTriangle,
    Info,
    ChevronDown,
    Filter,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer } from '@/components';
import type { Activity as ActivityType } from '@/hooks/trading/useDashboardData';

interface RecentActivityProps {
    activities: ActivityType[];
    isLoading?: boolean;
}

type ActivityFilter = 'all' | 'trade' | 'bot_action' | 'alert' | 'deposit' | 'withdrawal' | 'system';

const FILTER_OPTIONS: { value: ActivityFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'trade', label: 'Trades' },
    { value: 'bot_action', label: 'Bot Actions' },
    { value: 'alert', label: 'Alerts' },
    { value: 'deposit', label: 'Deposits' },
    { value: 'withdrawal', label: 'Withdrawals' },
    { value: 'system', label: 'System' },
];

/**
 * Activity type configuration
 */
const getActivityConfig = (type: ActivityType['type']) => {
    const configs = {
        trade: {
            icon: ArrowUpRight,
            bgColor: 'bg-blue-500/20',
            iconColor: 'text-blue-400',
        },
        bot_action: {
            icon: Bot,
            bgColor: 'bg-cyan-500/20',
            iconColor: 'text-cyan-400',
        },
        alert: {
            icon: Bell,
            bgColor: 'bg-amber-500/20',
            iconColor: 'text-amber-400',
        },
        deposit: {
            icon: Download,
            bgColor: 'bg-emerald-500/20',
            iconColor: 'text-emerald-400',
        },
        withdrawal: {
            icon: Upload,
            bgColor: 'bg-orange-500/20',
            iconColor: 'text-orange-400',
        },
        system: {
            icon: AlertCircle,
            bgColor: 'bg-purple-500/20',
            iconColor: 'text-purple-400',
        },
    };
    return configs[type];
};

/**
 * Status configuration
 */
const getStatusConfig = (status: ActivityType['status']) => {
    const configs = {
        success: {
            icon: CheckCircle,
            color: 'text-emerald-400',
        },
        warning: {
            icon: AlertTriangle,
            color: 'text-amber-400',
        },
        error: {
            icon: AlertCircle,
            color: 'text-red-400',
        },
        info: {
            icon: Info,
            color: 'text-blue-400',
        },
    };
    return configs[status];
};

/**
 * ActivityItem - Single activity item
 */
const ActivityItem: React.FC<{
    activity: ActivityType;
    index: number;
}> = ({ activity, index }) => {
    const typeConfig = getActivityConfig(activity.type);
    const statusConfig = getStatusConfig(activity.status);
    const TypeIcon = typeConfig.icon;
    const StatusIcon = statusConfig.icon;

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const formatAmount = (n: number) => {
        if (n >= 1000) {
            return `$${(n / 1000).toFixed(1)}K`;
        }
        return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
            className="relative flex gap-4 py-4 group"
        >
            {/* Timeline line */}
            <div className="absolute left-4 top-12 bottom-0 w-px bg-white/10 group-last:hidden" />

            {/* Icon */}
            <div className={cn(
                'relative z-10 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center',
                typeConfig.bgColor
            )}>
                <TypeIcon className={cn('w-4 h-4', typeConfig.iconColor)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-primary text-sm">{activity.title}</h4>
                            <StatusIcon className={cn('w-3.5 h-3.5', statusConfig.color)} />
                        </div>
                        <p className="text-xs text-secondary mt-0.5 line-clamp-2">{activity.description}</p>
                    </div>

                    <div className="flex-shrink-0 text-right">
                        <div className="text-xs text-tertiary">{formatTimeAgo(activity.timestamp)}</div>
                        {activity.amount !== undefined && (
                            <div className={cn(
                                'text-sm font-medium mt-0.5',
                                activity.side === 'buy' && 'text-emerald-400',
                                activity.side === 'sell' && 'text-red-400',
                                !activity.side && 'text-primary'
                            )}>
                                {activity.side === 'buy' && '+'}
                                {activity.side === 'sell' && '-'}
                                {formatAmount(activity.amount)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 mt-2">
                    {activity.symbol && (
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-secondary">
                            {activity.symbol}
                        </span>
                    )}
                    <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs',
                        activity.status === 'success' && 'bg-emerald-500/10 text-emerald-400',
                        activity.status === 'warning' && 'bg-amber-500/10 text-amber-400',
                        activity.status === 'error' && 'bg-red-500/10 text-red-400',
                        activity.status === 'info' && 'bg-blue-500/10 text-blue-400'
                    )}>
                        {activity.status}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

/**
 * RecentActivity - Timeline of recent activities
 */
export const RecentActivity: React.FC<RecentActivityProps> = ({
    activities,
    isLoading = false,
}) => {
    const [filter, setFilter] = useState<ActivityFilter>('all');
    const [showFilters, setShowFilters] = useState(false);

    const filteredActivities = filter === 'all'
        ? activities
        : activities.filter(a => a.type === filter);

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
            transition={{ delay: 0.8 }}
            className="px-6"
        >
            <div className="max-w-7xl mx-auto">
                <GlassContainer className="p-6" border>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-violet-500/20">
                                <Activity className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-primary">Recent Activity</h3>
                                <p className="text-xs text-secondary">{filteredActivities.length} events</p>
                            </div>
                        </div>

                        {/* Filter Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                                    showFilters
                                        ? 'bg-white/15 text-white'
                                        : 'bg-white/5 text-secondary hover:bg-white/10 hover:text-primary'
                                )}
                            >
                                <Filter className="w-4 h-4" />
                                <span>{FILTER_OPTIONS.find(f => f.value === filter)?.label}</span>
                                <ChevronDown className={cn('w-4 h-4 transition-transform', showFilters && 'rotate-180')} />
                            </button>

                            {/* Filter Dropdown */}
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 top-full mt-2 w-40 py-2 rounded-xl bg-gray-900/95 border border-white/10 backdrop-blur-xl shadow-xl z-10"
                                    >
                                        {FILTER_OPTIONS.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    setFilter(option.value);
                                                    setShowFilters(false);
                                                }}
                                                className={cn(
                                                    'w-full text-left px-4 py-2 text-sm transition-colors',
                                                    filter === option.value
                                                        ? 'bg-white/10 text-white'
                                                        : 'text-secondary hover:bg-white/5 hover:text-primary'
                                                )}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Activity List */}
                    {filteredActivities.length === 0 ? (
                        <div className="text-center py-12">
                            <Activity className="w-12 h-12 mx-auto mb-3 text-secondary opacity-30" />
                            <p className="text-secondary mb-1">No activity yet</p>
                            <p className="text-xs text-tertiary">Your trading activity will appear here</p>
                        </div>
                    ) : (
                        <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-white/5">
                            {filteredActivities.map((activity, index) => (
                                <ActivityItem
                                    key={activity.id}
                                    activity={activity}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </GlassContainer>
            </div>
        </motion.section>
    );
};

export default RecentActivity;
