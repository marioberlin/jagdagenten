/**
 * IBird Agent Input
 * 
 * Persistent AI agent input bar at the bottom of the app.
 * Matches Aurora Travel Weather's chat input pattern.
 */

import React, { useState, useCallback } from 'react';
import { Send, Mic, Loader2 } from 'lucide-react';
import { useIBirdStore, type IBirdModule } from '../store';
import { cn } from '@/lib/utils';

// =============================================================================
// Module-specific placeholders
// =============================================================================

const modulePlaceholders: Record<IBirdModule, string> = {
    mail: 'Search emails, compose, or ask about messages...',
    calendar: 'Create event, check schedule, or ask about availability...',
    appointments: 'Check bookings, manage availability, or share booking link...',
};

// =============================================================================
// Props
// =============================================================================

interface IBirdAgentInputProps {
    onSend?: (message: string) => void;
    isLoading?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function IBirdAgentInput({ onSend, isLoading = false }: IBirdAgentInputProps) {
    const [message, setMessage] = useState('');
    const activeModule = useIBirdStore((state) => state.ui.activeModule);

    const placeholder = modulePlaceholders[activeModule] || 'Ask iBird anything...';

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && onSend) {
            onSend(message.trim());
            setMessage('');
        }
    }, [message, onSend]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    }, [handleSubmit]);

    return (
        <div className="px-4 py-3 border-t border-[var(--glass-border)] bg-black/20 relative z-20">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <div className={cn(
                    'flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl',
                    'bg-white/10 backdrop-blur-xl',
                    'border border-white/20',
                    'focus-within:ring-2 focus-within:ring-[var(--glass-accent)]/50',
                    'transition-all duration-150'
                )}>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={isLoading}
                        className={cn(
                            'flex-1 bg-transparent text-sm',
                            'text-white placeholder:text-white/50',
                            'focus:outline-none',
                            'disabled:opacity-50'
                        )}
                    />

                    {/* Voice input button (placeholder) */}
                    <button
                        type="button"
                        className={cn(
                            'p-1.5 rounded-lg',
                            'text-white/50 hover:text-white',
                            'hover:bg-white/10 transition-colors duration-150'
                        )}
                        aria-label="Voice input"
                    >
                        <Mic className="w-4 h-4" />
                    </button>
                </div>

                {/* Send button */}
                <button
                    type="submit"
                    disabled={!message.trim() || isLoading}
                    className={cn(
                        'p-2.5 rounded-xl',
                        'bg-[var(--glass-accent)] text-white',
                        'hover:bg-[var(--glass-accent-hover)]',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'transition-all duration-150',
                        'shadow-lg shadow-[var(--glass-accent)]/25'
                    )}
                    aria-label="Send message"
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                </button>
            </form>
        </div>
    );
}

export default IBirdAgentInput;
