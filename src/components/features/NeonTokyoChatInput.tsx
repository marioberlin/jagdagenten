/**
 * NeonTokyo Chat Input
 * 
 * A dedicated chat input component for the NeonTokyo travel concierge.
 * Positioned at the bottom of the panel with neon aesthetic.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { GlassButton } from '@/components/primitives/GlassButton';
import { cn } from '@/utils/cn';

interface NeonTokyoChatInputProps {
    onSend: (message: string) => Promise<void>;
    isLoading?: boolean;
    placeholder?: string;
    className?: string;
}

export const NeonTokyoChatInput: React.FC<NeonTokyoChatInputProps> = ({
    onSend,
    isLoading = false,
    placeholder = "Ask about your Tokyo adventure...",
    className
}) => {
    const [message, setMessage] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        const text = message.trim();
        setMessage('');
        await onSend(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                "flex items-center gap-3 p-4",
                "bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-cyan-500/5",
                "border-t border-white/10",
                className
            )}
        >
            {/* Decorative glow */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />

            {/* Input container */}
            <div className="flex-1 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-cyan-500/10 rounded-xl blur-sm" />
                <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={isLoading}
                    className={cn(
                        "relative w-full px-4 py-3 rounded-xl",
                        "bg-black/40 backdrop-blur-sm",
                        "border border-white/10 hover:border-pink-500/30 focus:border-pink-500/50",
                        "text-white placeholder:text-white/40",
                        "outline-none transition-all duration-300",
                        "focus:ring-2 focus:ring-pink-500/20",
                        isLoading && "opacity-50 cursor-not-allowed"
                    )}
                />

                {/* Sparkle indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-400/50">
                    <Sparkles size={16} />
                </div>
            </div>

            {/* Send button */}
            <GlassButton
                type="submit"
                variant="primary"
                size="sm"
                disabled={!message.trim() || isLoading}
                className={cn(
                    "!bg-gradient-to-r from-pink-500/20 to-purple-500/20",
                    "hover:from-pink-500/30 hover:to-purple-500/30",
                    "border-pink-500/30",
                    "min-w-[44px] h-[44px]"
                )}
            >
                {isLoading ? (
                    <Loader2 size={18} className="animate-spin text-pink-400" />
                ) : (
                    <Send size={18} className="text-pink-400" />
                )}
            </GlassButton>
        </form>
    );
};
