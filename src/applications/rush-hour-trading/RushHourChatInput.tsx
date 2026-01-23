/**
 * RushHour Chat Input
 *
 * Trading-specific chat input component for AI interactions.
 * Matches the pattern used by AuroraWeatherChatInput and NeonTokyoChatInput.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface RushHourChatInputProps {
    onSend: (message: string) => void;
    isLoading?: boolean;
    placeholder?: string;
}

export const RushHourChatInput: React.FC<RushHourChatInputProps> = ({
    onSend,
    isLoading = false,
    placeholder = 'Ask about your portfolio, start a bot, analyze trades...',
}) => {
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        onSend(input.trim());
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                'relative border-t border-[var(--glass-border)]',
                'bg-gradient-to-t from-black/40 to-transparent',
                'p-4'
            )}
        >
            <div
                className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-2xl',
                    'bg-[var(--glass-bg-thick)] backdrop-blur-xl',
                    'border border-[var(--glass-border)]',
                    'focus-within:border-[var(--glass-accent)]/50',
                    'transition-colors'
                )}
            >
                {/* AI Indicator */}
                <div className="flex-shrink-0">
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                    ) : (
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                    )}
                </div>

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={isLoading}
                    className={cn(
                        'flex-1 bg-transparent border-none outline-none',
                        'text-sm text-primary placeholder:text-tertiary',
                        'disabled:opacity-50'
                    )}
                />

                {/* Send Button */}
                <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className={cn(
                        'flex-shrink-0 p-2 rounded-xl',
                        'bg-emerald-500/20 text-emerald-400',
                        'hover:bg-emerald-500/30',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'transition-all'
                    )}
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mt-2 px-2">
                <span className="text-xs text-tertiary">Try:</span>
                {['Portfolio summary', 'Start DCA bot', 'Show positions'].map((suggestion) => (
                    <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                            setInput(suggestion);
                            inputRef.current?.focus();
                        }}
                        disabled={isLoading}
                        className={cn(
                            'text-xs px-2 py-1 rounded-lg',
                            'bg-white/5 text-secondary',
                            'hover:bg-white/10 hover:text-primary',
                            'disabled:opacity-50',
                            'transition-all'
                        )}
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </form>
    );
};

export default RushHourChatInput;
