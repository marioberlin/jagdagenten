/**
 * TaskHistorySidebar
 *
 * Recent tasks list in the right sidebar.
 */

import React from 'react';
import { History, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

import { useCoworkStore } from '@/stores/coworkStore';
import type { CoworkSessionSummary, CoworkSessionStatus } from '@/types/cowork';

export const TaskHistorySidebar: React.FC = () => {
    const { recentSessions, loadSession } = useCoworkStore();

    const formatTimeAgo = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;

        return new Date(date).toLocaleDateString();
    };

    const statusIcons: Record<CoworkSessionStatus, React.ReactNode> = {
        planning: <Loader2 size={12} className="text-yellow-400 animate-spin" />,
        awaiting_approval: <Clock size={12} className="text-yellow-400" />,
        executing: <Loader2 size={12} className="text-indigo-400 animate-spin" />,
        paused: <Clock size={12} className="text-amber-400" />,
        merging: <Loader2 size={12} className="text-purple-400 animate-spin" />,
        completed: <CheckCircle size={12} className="text-green-400" />,
        failed: <XCircle size={12} className="text-red-400" />,
        cancelled: <XCircle size={12} className="text-white/40" />
    };

    return (
        <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white/70 flex items-center gap-2">
                    <History size={14} />
                    Recent Tasks
                </h3>
            </div>

            {recentSessions.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-sm text-white/40">
                        No recent tasks
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {recentSessions.map((session) => (
                        <SessionListItem
                            key={session.id}
                            session={session}
                            statusIcon={statusIcons[session.status]}
                            timeAgo={formatTimeAgo(session.createdAt)}
                            onClick={() => loadSession(session.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface SessionListItemProps {
    session: CoworkSessionSummary;
    statusIcon: React.ReactNode;
    timeAgo: string;
    onClick: () => void;
}

const SessionListItem: React.FC<SessionListItemProps> = ({
    session,
    statusIcon,
    timeAgo,
    onClick
}) => {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-start gap-3 p-3 rounded-lg
                       bg-white/5 hover:bg-white/10 transition-colors text-left"
            type="button"
        >
            <div className="mt-1 flex-shrink-0">
                {statusIcon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm text-white/90 truncate">
                    {session.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                    <span>{timeAgo}</span>
                    {session.artifactCount > 0 && (
                        <>
                            <span>•</span>
                            <span>{session.artifactCount} artifacts</span>
                        </>
                    )}
                </div>
            </div>
        </button>
    );
};

export default TaskHistorySidebar;
