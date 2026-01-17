import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Clock,
    FileText,
    MessageSquare,
    Package,
    AlertCircle,
    CheckCircle,
    Loader,
    RotateCcw,
    Copy,
    ChevronRight
} from 'lucide-react';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { GlassButton } from '@/components/primitives/GlassButton';
import { GlassChip } from '@/components/primitives/GlassChip';
import { cn } from '@/utils/cn';
import type { TaskState } from './TaskFilters';

interface TaskArtifact {
    id: string;
    name: string;
    type: string;
    size: string;
    createdAt: string;
}

interface TaskMessage {
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: string;
}

interface TaskDetail {
    id: string;
    contextId: string;
    state: TaskState;
    agent: string;
    agentId: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    duration?: string;
    error?: string;
    artifacts: TaskArtifact[];
    messages: TaskMessage[];
}

interface TaskDetailSheetProps {
    taskId: string | null;
    onClose: () => void;
    onRetry?: (taskId: string) => void;
    onCancel?: (taskId: string) => void;
}

type DetailTab = 'overview' | 'messages' | 'artifacts' | 'logs';

const STATE_ICONS: Record<TaskState, typeof CheckCircle> = {
    'submitted': Clock,
    'working': Loader,
    'completed': CheckCircle,
    'failed': AlertCircle,
    'cancelled': X,
    'input-required': MessageSquare,
};

const STATE_COLORS: Record<TaskState, string> = {
    'submitted': 'text-blue-400',
    'working': 'text-yellow-400 animate-spin',
    'completed': 'text-green-400',
    'failed': 'text-red-400',
    'cancelled': 'text-gray-400',
    'input-required': 'text-purple-400',
};

/**
 * TaskDetailSheet
 * 
 * Slide-out panel for viewing task details with sub-tabs:
 * - Overview: Task metadata and status
 * - Messages: Conversation history
 * - Artifacts: Files produced by the task
 * - Logs: Debug/trace information (future)
 */
export function TaskDetailSheet({ taskId, onClose, onRetry, onCancel }: TaskDetailSheetProps) {
    const [activeTab, setActiveTab] = useState<DetailTab>('overview');
    const [task, setTask] = useState<TaskDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch task details when taskId changes
    useState(() => {
        if (taskId) {
            fetchTaskDetails(taskId);
        }
    });

    const fetchTaskDetails = async (id: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/tasks/${id}`);
            if (response.ok) {
                const data = await response.json();
                setTask(data);
            }
        } catch (error) {
            console.error('[Console] Failed to fetch task details:', error);
            // Mock data for development
            setTask({
                id,
                contextId: 'ctx-abc123',
                state: 'completed',
                agent: 'Crypto Advisor',
                agentId: 'crypto-advisor',
                createdAt: '2025-01-17T21:00:00Z',
                updatedAt: '2025-01-17T21:00:02Z',
                completedAt: '2025-01-17T21:00:02Z',
                duration: '1.2s',
                artifacts: [
                    { id: 'art-001', name: 'market_analysis.json', type: 'application/json', size: '4.2 KB', createdAt: '2 min ago' },
                    { id: 'art-002', name: 'trading_signals.png', type: 'image/png', size: '128 KB', createdAt: '2 min ago' },
                ],
                messages: [
                    { id: 'msg-001', role: 'user', content: 'What are the top gainers today?', timestamp: '2 min ago' },
                    { id: 'msg-002', role: 'agent', content: 'Based on the latest market data, here are the top 5 gainers...', timestamp: '2 min ago' },
                ],
            });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const TABS: Array<{ key: DetailTab; label: string; icon: typeof FileText }> = [
        { key: 'overview', label: 'Overview', icon: FileText },
        { key: 'messages', label: 'Messages', icon: MessageSquare },
        { key: 'artifacts', label: 'Artifacts', icon: Package },
        { key: 'logs', label: 'Logs', icon: Clock },
    ];

    return (
        <AnimatePresence>
            {taskId && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-black/80 backdrop-blur-xl border-l border-white/10 z-50 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-semibold text-white">Task Details</h2>
                                {task && (
                                    <code className="text-xs bg-white/10 px-2 py-1 rounded text-white/60">
                                        {task.id.slice(0, 16)}...
                                    </code>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="Close"
                                className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex items-center gap-1 px-6 py-2 border-b border-white/10">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all',
                                        activeTab === tab.key
                                            ? 'bg-white/10 text-white'
                                            : 'text-white/60 hover:text-white hover:bg-white/5'
                                    )}
                                >
                                    <tab.icon size={14} />
                                    {tab.label}
                                    {tab.key === 'artifacts' && task && task.artifacts.length > 0 && (
                                        <span className="ml-1 px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                                            {task.artifacts.length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader className="w-8 h-8 text-cyan-500 animate-spin" />
                                </div>
                            ) : task ? (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        {activeTab === 'overview' && (
                                            <OverviewTab task={task} copyToClipboard={copyToClipboard} />
                                        )}
                                        {activeTab === 'messages' && (
                                            <MessagesTab messages={task.messages} />
                                        )}
                                        {activeTab === 'artifacts' && (
                                            <ArtifactsTab artifacts={task.artifacts} />
                                        )}
                                        {activeTab === 'logs' && (
                                            <LogsTab taskId={task.id} />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            ) : (
                                <div className="flex items-center justify-center h-full text-white/40">
                                    Task not found
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        {task && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
                                <div className="flex items-center gap-2">
                                    {task.state === 'failed' && onRetry && (
                                        <GlassButton
                                            variant="primary"
                                            size="sm"
                                            onClick={() => onRetry(task.id)}
                                        >
                                            <RotateCcw size={14} />
                                            Retry Task
                                        </GlassButton>
                                    )}
                                    {task.state === 'working' && onCancel && (
                                        <GlassButton
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => onCancel(task.id)}
                                        >
                                            <X size={14} />
                                            Cancel Task
                                        </GlassButton>
                                    )}
                                </div>
                                <GlassButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClose}
                                >
                                    Close
                                </GlassButton>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Sub-components for each tab

function OverviewTab({ task, copyToClipboard }: { task: TaskDetail; copyToClipboard: (text: string) => void }) {
    const StatusIcon = STATE_ICONS[task.state];

    return (
        <div className="space-y-6">
            {/* Status Banner */}
            <GlassContainer className="p-4" border>
                <div className="flex items-center gap-4">
                    <div className={cn('p-3 rounded-xl bg-white/5', STATE_COLORS[task.state])}>
                        <StatusIcon size={24} />
                    </div>
                    <div>
                        <p className="text-white font-medium capitalize">{task.state.replace('-', ' ')}</p>
                        <p className="text-white/60 text-sm">
                            {task.duration ? `Completed in ${task.duration}` : 'In progress...'}
                        </p>
                    </div>
                </div>
                {task.error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 text-sm">{task.error}</p>
                    </div>
                )}
            </GlassContainer>

            {/* Metadata */}
            <div className="space-y-3">
                <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider">Details</h3>
                <GlassContainer className="divide-y divide-white/5" border>
                    <MetadataRow
                        label="Task ID"
                        value={task.id}
                        copyable
                        onCopy={() => copyToClipboard(task.id)}
                    />
                    <MetadataRow
                        label="Context ID"
                        value={task.contextId}
                        copyable
                        onCopy={() => copyToClipboard(task.contextId)}
                    />
                    <MetadataRow label="Agent" value={task.agent} />
                    <MetadataRow label="Created" value={task.createdAt} />
                    <MetadataRow label="Updated" value={task.updatedAt} />
                    {task.completedAt && <MetadataRow label="Completed" value={task.completedAt} />}
                </GlassContainer>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <GlassContainer className="p-4 text-center" border>
                    <p className="text-2xl font-bold text-white">{task.messages.length}</p>
                    <p className="text-white/60 text-sm">Messages</p>
                </GlassContainer>
                <GlassContainer className="p-4 text-center" border>
                    <p className="text-2xl font-bold text-white">{task.artifacts.length}</p>
                    <p className="text-white/60 text-sm">Artifacts</p>
                </GlassContainer>
            </div>
        </div>
    );
}

function MetadataRow({
    label,
    value,
    copyable = false,
    onCopy
}: {
    label: string;
    value: string;
    copyable?: boolean;
    onCopy?: () => void
}) {
    return (
        <div className="flex items-center justify-between px-4 py-3">
            <span className="text-white/60 text-sm">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-white text-sm font-mono">{value}</span>
                {copyable && onCopy && (
                    <button
                        onClick={onCopy}
                        className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                    >
                        <Copy size={12} />
                    </button>
                )}
            </div>
        </div>
    );
}

function MessagesTab({ messages }: { messages: TaskMessage[] }) {
    if (messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-white/40">
                <MessageSquare size={32} className="mb-2" />
                <p>No messages</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {messages.map((msg) => (
                <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        'p-4 rounded-xl',
                        msg.role === 'user'
                            ? 'bg-cyan-500/10 border border-cyan-500/20 ml-8'
                            : 'bg-white/5 border border-white/10 mr-8'
                    )}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                            'text-xs font-medium uppercase',
                            msg.role === 'user' ? 'text-cyan-400' : 'text-white/60'
                        )}>
                            {msg.role}
                        </span>
                        <span className="text-xs text-white/40">{msg.timestamp}</span>
                    </div>
                    <p className="text-white/80 text-sm whitespace-pre-wrap">{msg.content}</p>
                </motion.div>
            ))}
        </div>
    );
}

function ArtifactsTab({ artifacts }: { artifacts: TaskArtifact[] }) {
    if (artifacts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-white/40">
                <Package size={32} className="mb-2" />
                <p>No artifacts</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {artifacts.map((artifact) => (
                <motion.div
                    key={artifact.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <FileText size={16} className="text-white/60" />
                        </div>
                        <div>
                            <p className="text-white text-sm font-medium">{artifact.name}</p>
                            <p className="text-white/40 text-xs">{artifact.type} • {artifact.size}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <GlassChip size="sm">{artifact.createdAt}</GlassChip>
                        <ChevronRight size={16} className="text-white/40 group-hover:text-white transition-colors" />
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

function LogsTab({ taskId }: { taskId: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-white/40">
            <Clock size={32} className="mb-2" />
            <p>Logs coming soon</p>
            <p className="text-xs mt-1">Task: {taskId.slice(0, 8)}</p>
        </div>
    );
}
