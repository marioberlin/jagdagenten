import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, LayoutDashboard, ListTodo, MessageSquare, Shield, RefreshCw } from 'lucide-react';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { cn } from '@/utils/cn';

// Tab components
import { DashboardTab } from './tabs/DashboardTab';
import { TasksTab } from './tabs/TasksTab';
import { ContextsTab } from './tabs/ContextsTab';
import { SecurityTab } from './tabs/SecurityTab';

type TabId = 'dashboard' | 'tasks' | 'contexts' | 'security';

interface Tab {
    id: TabId;
    label: string;
    icon: React.ElementType;
}

const TABS: Tab[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'contexts', label: 'Contexts', icon: MessageSquare },
    { id: 'security', label: 'Security', icon: Shield },
];

/**
 * ConsolePage
 * 
 * A2A Management Console - Admin interface for tasks, contexts, and security.
 */
export function ConsolePage() {
    const [activeTab, setActiveTab] = useState<TabId>('dashboard');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Trigger refresh in active tab (via context or callback)
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsRefreshing(false);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardTab />;
            case 'tasks':
                return <TasksTab />;
            case 'contexts':
                return <ContextsTab />;
            case 'security':
                return <SecurityTab />;
            default:
                return <DashboardTab />;
        }
    };

    return (
        <div className="min-h-screen p-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Terminal className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">A2A Console</h1>
                            <p className="text-white/60">Manage tasks, contexts, and security</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Live indicator */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-white/60">Live</span>
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Tab Navigation */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
            >
                <GlassContainer className="inline-flex p-1.5 gap-1" border>
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                    isActive
                                        ? 'bg-white/10 text-white shadow-lg'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                )}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </GlassContainer>
            </motion.div>

            {/* Tab Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {renderTabContent()}
            </motion.div>
        </div>
    );
}

export default ConsolePage;
