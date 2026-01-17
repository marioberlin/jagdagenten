import React, { useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { Send, Bot, User, Sparkles, Plus } from 'lucide-react';

// --- Chat Container ---
interface GlassChatContainerProps {
    children: React.ReactNode;
    className?: string;
}

export const GlassChatContainer = ({ children, className }: GlassChatContainerProps) => {
    return (
        <div className={cn("flex flex-col h-full w-full", className)}>
            {children}
        </div>
    );
};

// --- Chat Message ---
interface GlassChatMessageProps {
    role: 'user' | 'assistant' | 'system';
    children: React.ReactNode;
    timestamp?: string;
    avatar?: string;
}

export const GlassChatMessage = ({ role, children, timestamp, avatar }: GlassChatMessageProps) => {
    const isUser = role === 'user';
    const isSystem = role === 'system';

    if (isSystem) {
        return (
            <div className="flex justify-center my-4">
                <span className="text-xs text-label-glass-tertiary bg-glass-surface px-3 py-1.5 rounded-full">
                    {children}
                </span>
            </div>
        );
    }

    return (
        <div className={cn(
            "flex gap-3 mb-4 px-4",
            isUser ? "flex-row-reverse" : "flex-row"
        )}>
            {/* Avatar */}
            <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                isUser
                    ? "bg-gradient-to-br from-accent to-accent/80 shadow-lg shadow-accent/25"
                    : "bg-gradient-to-br from-[var(--system-indigo)] to-[var(--system-purple)] shadow-lg shadow-[var(--system-purple)]/25"
            )}>
                {avatar ? (
                    <img src={avatar} alt={role} className="w-full h-full rounded-full object-cover" />
                ) : isUser ? (
                    <User size={14} className="text-primary" />
                ) : (
                    <Bot size={14} className="text-primary" />
                )}
            </div>

            {/* Message Content */}
            <div className={cn(
                "flex flex-col max-w-[75%]",
                isUser ? "items-end" : "items-start"
            )}>
                <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                    isUser
                        ? "bg-gradient-to-br from-accent to-accent/80 text-primary rounded-br-md shadow-lg shadow-accent/20"
                        : "bg-glass-surface-hover backdrop-blur-sm text-label-glass-primary rounded-bl-md border border-[var(--glass-border)]"
                )}>
                    {children}
                </div>
                {timestamp && (
                    <span className="text-[10px] text-label-glass-tertiary mt-1.5 px-2">
                        {timestamp}
                    </span>
                )}
            </div>
        </div>
    );
};

// --- Chat Input Bar ---
interface GlassChatInputProps {
    onSend: (message: string) => void;
    isLoading?: boolean;
    placeholder?: string;
    className?: string;
}

export const GlassChatInput = ({
    onSend,
    isLoading = false,
    placeholder = "Type a message...",
    className
}: GlassChatInputProps) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!message.trim() || isLoading) return;
        onSend(message);
        setMessage('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        const target = e.target;
        target.style.height = 'auto';
        target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
    };

    const hasMessage = message.trim().length > 0;

    return (
        <div className={cn(
            "relative bg-glass-surface backdrop-blur-xl border border-[var(--glass-border)] rounded-2xl",
            "flex items-end gap-2 p-2",
            "shadow-lg shadow-black/10",
            className
        )}>
            {/* Attachment Button */}
            <button
                type="button"
                className="flex-shrink-0 w-9 h-9 rounded-xl bg-glass-surface hover:bg-glass-surface-hover flex items-center justify-center text-label-glass-tertiary hover:text-label-glass-primary transition-colors"
            >
                <Plus size={18} />
            </button>

            {/* Text Input */}
            <textarea
                ref={textareaRef}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={1}
                disabled={isLoading}
                className={cn(
                    "flex-1 bg-transparent border-0 outline-none resize-none",
                    "text-sm text-label-glass-primary placeholder:text-label-glass-tertiary",
                    "py-2 px-1 max-h-[120px]",
                    "scrollbar-hide"
                )}
                style={{ minHeight: '36px' }}
            />

            {/* Send Button */}
            <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!hasMessage || isLoading}
                className={cn(
                    "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                    hasMessage && !isLoading
                        ? "bg-gradient-to-r from-accent to-accent/80 text-primary shadow-lg shadow-accent/30 hover:shadow-accent/50"
                        : "bg-glass-surface text-label-glass-tertiary cursor-not-allowed"
                )}
            >
                {isLoading ? (
                    <Sparkles size={16} className="animate-pulse" />
                ) : (
                    <Send size={16} className={hasMessage ? "translate-x-px" : ""} />
                )}
            </button>
        </div>
    );
};

// --- Full Chat Window Component ---
interface GlassChatWindowProps {
    messages: Array<{
        id: string;
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp?: string;
    }>;
    onSend: (message: string) => void;
    isLoading?: boolean;
    className?: string;
    title?: string;
}

export const GlassChatWindow = ({
    messages,
    onSend,
    isLoading = false,
    className,
    title = "Chat"
}: GlassChatWindowProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className={cn(
            "flex flex-col h-full bg-[var(--glass-bg-regular)] backdrop-blur-xl rounded-3xl border border-[var(--glass-border)] overflow-hidden",
            "shadow-2xl shadow-black/20",
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--system-indigo)] to-[var(--system-purple)] flex items-center justify-center shadow-lg shadow-[var(--system-purple)]/25">
                        <Bot size={14} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-label-glass-primary">{title}</h3>
                        <span className="text-xs text-label-glass-tertiary">
                            {isLoading ? "Typing..." : "Online"}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-success shadow-lg shadow-success/50" />
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
                {messages.map((msg) => (
                    <GlassChatMessage
                        key={msg.id}
                        role={msg.role}
                        timestamp={msg.timestamp}
                    >
                        {msg.content}
                    </GlassChatMessage>
                ))}
                {isLoading && (
                    <div className="flex gap-3 mb-4 px-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--system-indigo)] to-[var(--system-purple)] flex items-center justify-center shadow-lg shadow-[var(--system-purple)]/25">
                            <Bot size={14} className="text-primary" />
                        </div>
                        <div className="bg-glass-surface-hover backdrop-blur-sm rounded-2xl rounded-bl-md px-4 py-3 border border-[var(--glass-border)]">
                            <div className="flex gap-1.5">
                                <span className="w-2 h-2 bg-label-glass-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-label-glass-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-label-glass-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[var(--glass-border)]">
                <GlassChatInput
                    onSend={onSend}
                    isLoading={isLoading}
                    placeholder="Message AI Assistant..."
                />
            </div>
        </div>
    );
};

GlassChatContainer.displayName = 'GlassChatContainer';
GlassChatMessage.displayName = 'GlassChatMessage';
GlassChatInput.displayName = 'GlassChatInput';
GlassChatWindow.displayName = 'GlassChatWindow';
