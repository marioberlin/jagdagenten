/**
 * Session List Panel
 *
 * A slide-out panel showing recent chat sessions for an agent.
 * Allows users to switch between sessions, create new ones, or manage existing ones.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Plus, MessageSquare, Clock, Archive, Trash2, Edit2, Check,
    History, ChevronRight, MoreVertical, Search
} from 'lucide-react';
import { cn } from '@/utils/cn';
import {
    useAgentSessionStore,
    type AgentSession,
    selectRecentSessions,
    selectActiveSession,
    selectIsLoading
} from '@/stores/agentSessionStore';

// ============================================================================
// Types
// ============================================================================

interface SessionListPanelProps {
    /** Agent ID to show sessions for */
    agentId: string;
    /** Agent name for display */
    agentName: string;
    /** Agent accent color */
    accentColor?: string;
    /** Whether the panel is open */
    isOpen: boolean;
    /** Callback when panel should close */
    onClose: () => void;
    /** Callback when a session is selected */
    onSelectSession: (session: AgentSession) => void;
    /** Callback when new session is requested */
    onNewSession: () => void;
}

interface SessionItemProps {
    session: AgentSession;
    isActive: boolean;
    accentColor: string;
    onSelect: () => void;
    onRename: (newTitle: string) => void;
    onArchive: () => void;
    onDelete: () => void;
}

// ============================================================================
// Session Item Component
// ============================================================================

const SessionItem: React.FC<SessionItemProps> = ({
    session,
    isActive,
    accentColor,
    onSelect,
    onRename,
    onArchive,
    onDelete
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(session.title);
    const [showMenu, setShowMenu] = useState(false);

    const handleSaveRename = () => {
        if (editTitle.trim() && editTitle !== session.title) {
            onRename(editTitle.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveRename();
        } else if (e.key === 'Escape') {
            setEditTitle(session.title);
            setIsEditing(false);
        }
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={cn(
                'group relative rounded-lg p-3 cursor-pointer transition-all duration-200',
                'hover:bg-white/5 border border-transparent',
                isActive && 'bg-white/10 border-white/10'
            )}
            style={{
                borderColor: isActive ? `${accentColor}40` : undefined,
                backgroundColor: isActive ? `${accentColor}10` : undefined,
            }}
            onClick={onSelect}
        >
            {/* Session Icon */}
            <div className="flex items-start gap-3">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${accentColor}20` }}
                >
                    <MessageSquare size={14} style={{ color: accentColor }} />
                </div>

                <div className="flex-1 min-w-0">
                    {/* Title */}
                    {isEditing ? (
                        <div className="flex items-center gap-1">
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={handleSaveRename}
                                autoFocus
                                className="flex-1 bg-white/10 rounded px-2 py-0.5 text-sm text-white outline-none focus:ring-1 focus:ring-white/30"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveRename();
                                }}
                                className="p-1 hover:bg-white/10 rounded"
                            >
                                <Check size={12} className="text-green-400" />
                            </button>
                        </div>
                    ) : (
                        <h4 className="text-sm font-medium text-white/90 truncate">
                            {session.title}
                        </h4>
                    )}

                    {/* Preview */}
                    <p className="text-xs text-white/50 truncate mt-0.5">
                        {session.preview || 'No messages yet'}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-white/40">
                            <Clock size={10} />
                            {formatDate(session.lastActiveAt)}
                        </span>
                        <span className="text-[10px] text-white/40">
                            {session.messageCount} messages
                        </span>
                    </div>
                </div>

                {/* Actions Menu */}
                <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="p-1 hover:bg-white/10 rounded"
                    >
                        <MoreVertical size={14} className="text-white/50" />
                    </button>

                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 top-full mt-1 z-50 bg-black/80 backdrop-blur-xl rounded-lg border border-white/10 shadow-xl overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => {
                                        setIsEditing(true);
                                        setShowMenu(false);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 w-full"
                                >
                                    <Edit2 size={12} />
                                    Rename
                                </button>
                                <button
                                    onClick={() => {
                                        onArchive();
                                        setShowMenu(false);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 w-full"
                                >
                                    <Archive size={12} />
                                    Archive
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete();
                                        setShowMenu(false);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 w-full"
                                >
                                    <Trash2 size={12} />
                                    Delete
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Active Indicator */}
                {isActive && (
                    <ChevronRight
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: accentColor }}
                    />
                )}
            </div>
        </motion.div>
    );
};

// ============================================================================
// Main Panel Component
// ============================================================================

export const SessionListPanel: React.FC<SessionListPanelProps> = ({
    agentId,
    agentName,
    accentColor = '#6366f1',
    isOpen,
    onClose,
    onSelectSession,
    onNewSession
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Store hooks
    const sessions = useAgentSessionStore(selectRecentSessions(agentId));
    const activeSession = useAgentSessionStore(selectActiveSession(agentId));
    const isLoading = useAgentSessionStore(selectIsLoading(agentId));
    const { loadSessions, renameSession, archiveSession, deleteSession } = useAgentSessionStore();

    // Load sessions when panel opens
    useEffect(() => {
        if (isOpen) {
            loadSessions(agentId);
        }
    }, [isOpen, agentId, loadSessions]);

    // Filter sessions by search
    const filteredSessions = sessions.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.preview.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: -320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -320, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed left-0 top-0 bottom-0 w-80 bg-black/80 backdrop-blur-xl border-r border-white/10 z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <History size={18} style={{ color: accentColor }} />
                                    <h2 className="text-lg font-semibold text-white">
                                        Sessions
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X size={18} className="text-white/60" />
                                </button>
                            </div>
                            <p className="text-xs text-white/50">
                                Chat history with {agentName}
                            </p>
                        </div>

                        {/* New Session Button */}
                        <div className="p-3 border-b border-white/5">
                            <button
                                onClick={onNewSession}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all"
                                style={{
                                    backgroundColor: `${accentColor}20`,
                                    color: accentColor,
                                }}
                            >
                                <Plus size={16} />
                                New Session
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-3 border-b border-white/5">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Search sessions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:ring-1 focus:ring-white/20"
                                />
                            </div>
                        </div>

                        {/* Session List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                                </div>
                            ) : filteredSessions.length === 0 ? (
                                <div className="text-center py-8">
                                    <MessageSquare size={32} className="mx-auto mb-2 text-white/20" />
                                    <p className="text-sm text-white/50">
                                        {searchQuery ? 'No sessions found' : 'No previous sessions'}
                                    </p>
                                    <p className="text-xs text-white/30 mt-1">
                                        Start a new conversation
                                    </p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredSessions.map((session) => (
                                        <SessionItem
                                            key={session.id}
                                            session={session}
                                            isActive={activeSession?.id === session.id}
                                            accentColor={accentColor}
                                            onSelect={() => onSelectSession(session)}
                                            onRename={(newTitle) => renameSession(agentId, session.id, newTitle)}
                                            onArchive={() => archiveSession(agentId, session.id)}
                                            onDelete={() => deleteSession(agentId, session.id)}
                                        />
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-white/10">
                            <p className="text-xs text-white/40 text-center">
                                {sessions.length} session{sessions.length !== 1 ? 's' : ''} • Last 50 kept
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SessionListPanel;
