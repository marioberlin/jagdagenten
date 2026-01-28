/**
 * Session Menu
 *
 * Dropdown menu for session management actions in the agent chat window.
 * Triggered by the "..." button in the header.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    History, Plus, Edit2, Download, Trash2, Copy, Archive,
    RefreshCw, BookOpen
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { AgentSession } from '@/stores/agentSessionStore';

// ============================================================================
// Types
// ============================================================================

interface SessionMenuProps {
    /** Whether the menu is open */
    isOpen: boolean;
    /** Callback when menu should close */
    onClose: () => void;
    /** Anchor element for positioning */
    anchorRef: React.RefObject<HTMLElement | null>;
    /** Agent accent color */
    accentColor?: string;
    /** Current session (if any) */
    currentSession?: AgentSession | null;
    /** Callbacks */
    onShowHistory: () => void;
    onNewSession: () => void;
    onRenameSession: () => void;
    onExportSession: () => void;
    onCopyConversation: () => void;
    onArchiveSession: () => void;
    onDeleteSession: () => void;
    onClearMessages: () => void;
    onShowMemories?: () => void;
}

interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
    disabled?: boolean;
    shortcut?: string;
}

// ============================================================================
// Menu Item Component
// ============================================================================

const MenuItem: React.FC<MenuItemProps> = ({
    icon,
    label,
    onClick,
    variant = 'default',
    disabled = false,
    shortcut
}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
            'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            variant === 'default' && 'text-white/80 hover:bg-white/10 hover:text-white',
            variant === 'danger' && 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
        )}
    >
        <span className="w-4 h-4 flex items-center justify-center">
            {icon}
        </span>
        <span className="flex-1 text-left">{label}</span>
        {shortcut && (
            <span className="text-xs text-white/30">{shortcut}</span>
        )}
    </button>
);

const MenuDivider: React.FC = () => (
    <div className="my-1 h-px bg-white/10" />
);

const MenuSection: React.FC<{ title: string }> = ({ title }) => (
    <div className="px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
            {title}
        </span>
    </div>
);

// ============================================================================
// Main Menu Component
// ============================================================================

export const SessionMenu: React.FC<SessionMenuProps> = ({
    isOpen,
    onClose,
    anchorRef,
    accentColor: _accentColor = '#6366f1', // Reserved for future themed menu styling
    currentSession,
    onShowHistory,
    onNewSession,
    onRenameSession,
    onExportSession,
    onCopyConversation,
    onArchiveSession,
    onDeleteSession,
    onClearMessages,
    onShowMemories
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, right: 0 });

    // Calculate position relative to anchor
    useEffect(() => {
        if (isOpen && anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 4,
                right: window.innerWidth - rect.right,
            });
        }
    }, [isOpen, anchorRef]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, onClose]);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    const hasSession = !!currentSession;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="fixed z-[100] min-w-[220px] bg-black/90 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                    style={{
                        top: position.top,
                        right: position.right,
                    }}
                >
                    {/* Session Info (if active) */}
                    {hasSession && (
                        <div className="px-3 py-2 border-b border-white/10">
                            <p className="text-xs text-white/50 truncate">
                                Current: {currentSession.title}
                            </p>
                        </div>
                    )}

                    {/* Session Actions */}
                    <MenuSection title="Sessions" />
                    <MenuItem
                        icon={<History size={14} />}
                        label="Session History"
                        onClick={() => { onShowHistory(); onClose(); }}
                        shortcut="⌘H"
                    />
                    <MenuItem
                        icon={<Plus size={14} />}
                        label="New Session"
                        onClick={() => { onNewSession(); onClose(); }}
                        shortcut="⌘N"
                    />

                    <MenuDivider />

                    {/* Current Session Actions */}
                    <MenuSection title="Current Session" />
                    <MenuItem
                        icon={<Edit2 size={14} />}
                        label="Rename Session"
                        onClick={() => { onRenameSession(); onClose(); }}
                        disabled={!hasSession}
                    />
                    <MenuItem
                        icon={<Copy size={14} />}
                        label="Copy Conversation"
                        onClick={() => { onCopyConversation(); onClose(); }}
                        shortcut="⌘C"
                    />
                    <MenuItem
                        icon={<Download size={14} />}
                        label="Export Session"
                        onClick={() => { onExportSession(); onClose(); }}
                    />
                    {onShowMemories && (
                        <MenuItem
                            icon={<BookOpen size={14} />}
                            label="View Memories"
                            onClick={() => { onShowMemories(); onClose(); }}
                            disabled={!hasSession}
                        />
                    )}

                    <MenuDivider />

                    {/* Danger Zone */}
                    <MenuItem
                        icon={<RefreshCw size={14} />}
                        label="Clear Messages"
                        onClick={() => { onClearMessages(); onClose(); }}
                    />
                    <MenuItem
                        icon={<Archive size={14} />}
                        label="Archive Session"
                        onClick={() => { onArchiveSession(); onClose(); }}
                        disabled={!hasSession}
                    />
                    <MenuItem
                        icon={<Trash2 size={14} />}
                        label="Delete Session"
                        onClick={() => { onDeleteSession(); onClose(); }}
                        variant="danger"
                        disabled={!hasSession}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SessionMenu;
