import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, XCircle, Clock, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { GlassButton } from '@/components/primitives/GlassButton';
import { GlassChip } from '@/components/primitives/GlassChip';

interface DashboardStats {
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalContexts: number;
    avgDuration: string;
}

interface ActivityItem {
    id: string;
    type: 'completed' | 'failed' | 'working' | 'submitted';
    taskId: string;
    agent: string;
    timestamp: string;
}

/**
 * DashboardTab
 * 
 * Overview of A2A system health with stats, activity feed, and quick actions.
 */
export function DashboardTab() {
    const [stats, setStats] = useState<DashboardStats>({
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        totalContexts: 0,
        avgDuration: '0s',
    });
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // Fetch from API
            const response = await fetch('/api/admin/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data.stats || stats);
                setActivity(data.recentActivity || []);
            }
        } catch (error) {
            console.error('[Console] Failed to fetch dashboard data:', error);
            // Use mock data for now
            setStats({
                totalTasks: 1234,
                activeTasks: 12,
                completedTasks: 1180,
                failedTasks: 42,
                totalContexts: 89,
                avgDuration: '1.2s',
            });
            setActivity([
                { id: '1', type: 'completed', taskId: 'abc-123', agent: 'Crypto Advisor', timestamp: '2m ago' },
                { id: '2', type: 'working', taskId: 'def-456', agent: 'Travel Planner', timestamp: '5m ago' },
                { id: '3', type: 'failed', taskId: 'ghi-789', agent: 'DocuMind', timestamp: '12m ago' },
                { id: '4', type: 'completed', taskId: 'jkl-012', agent: 'Restaurant Finder', timestamp: '15m ago' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'completed':
                return <CheckCircle2 className="w-4 h-4 text-green-400" />;
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-400" />;
            case 'working':
                return <Activity className="w-4 h-4 text-yellow-400 animate-pulse" />;
            default:
                return <Clock className="w-4 h-4 text-blue-400" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <GlassContainer className="p-4" border>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-white/60 text-xs">Total Tasks</p>
                            <p className="text-xl font-bold text-white">{stats.totalTasks.toLocaleString()}</p>
                        </div>
                    </div>
                </GlassContainer>

                <GlassContainer className="p-4" border>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-white/60 text-xs">Active</p>
                            <p className="text-xl font-bold text-white">{stats.activeTasks}</p>
                        </div>
                    </div>
                </GlassContainer>

                <GlassContainer className="p-4" border>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-white/60 text-xs">Completed</p>
                            <p className="text-xl font-bold text-white">{stats.completedTasks.toLocaleString()}</p>
                        </div>
                    </div>
                </GlassContainer>

                <GlassContainer className="p-4" border>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <p className="text-white/60 text-xs">Failed</p>
                            <p className="text-xl font-bold text-white">{stats.failedTasks}</p>
                        </div>
                    </div>
                </GlassContainer>

                <GlassContainer className="p-4" border>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-white/60 text-xs">Contexts</p>
                            <p className="text-xl font-bold text-white">{stats.totalContexts}</p>
                        </div>
                    </div>
                </GlassContainer>

                <GlassContainer className="p-4" border>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-white/60 text-xs">Avg Duration</p>
                            <p className="text-xl font-bold text-white">{stats.avgDuration}</p>
                        </div>
                    </div>
                </GlassContainer>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Feed */}
                <GlassContainer className="lg:col-span-2 p-6" border>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                        <GlassChip size="sm" variant="default">Live</GlassChip>
                    </div>

                    <div className="space-y-3">
                        {activity.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(item.type)}
                                    <div>
                                        <p className="text-sm text-white">
                                            Task <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">{item.taskId}</code>
                                            <span className="text-white/60 ml-2">{item.type}</span>
                                        </p>
                                        <p className="text-xs text-white/40">{item.agent}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-white/40">{item.timestamp}</span>
                            </motion.div>
                        ))}

                        {activity.length === 0 && !isLoading && (
                            <div className="text-center py-8 text-white/40">
                                No recent activity
                            </div>
                        )}
                    </div>
                </GlassContainer>

                {/* Quick Actions */}
                <GlassContainer className="p-6" border>
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>

                    <div className="space-y-3">
                        <GlassButton
                            variant="secondary"
                            className="w-full justify-between"
                            onClick={() => window.location.href = '/os/agents'}
                        >
                            <span>Browse Agents</span>
                            <ArrowRight size={16} />
                        </GlassButton>

                        <GlassButton
                            variant="secondary"
                            className="w-full justify-between"
                            onClick={() => window.location.href = '/os/artifacts'}
                        >
                            <span>View Artifacts</span>
                            <ArrowRight size={16} />
                        </GlassButton>

                        <GlassButton
                            variant="secondary"
                            className="w-full justify-between"
                            onClick={() => { }}
                        >
                            <span>Generate API Token</span>
                            <ArrowRight size={16} />
                        </GlassButton>

                        <GlassButton
                            variant="secondary"
                            className="w-full justify-between"
                            onClick={() => { }}
                        >
                            <span>Export Tasks (JSON)</span>
                            <ArrowRight size={16} />
                        </GlassButton>
                    </div>

                    {/* System Health */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <h4 className="text-sm font-medium text-white/60 mb-3">System Health</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-white/80">Server</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-xs text-green-400">Healthy</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-white/80">Database</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-xs text-green-400">Connected</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-white/80">SSE Stream</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs text-green-400">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassContainer>
            </div>
        </div>
    );
}
