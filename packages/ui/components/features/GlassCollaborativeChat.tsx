import React, { useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { Send, Plus } from 'lucide-react';
import { GlassCollaborators } from '../layout/GlassCollaborators';

// --- Types ---
interface Participant {
    id: string;
    name: string;
    avatar?: string;
    isActive?: boolean;
    isTyping?: boolean;
    color?: string;
}

interface CollaborativeChatMessage {
    id: string;
    senderId: string;
    content: string;
    timestamp?: string;
}

// --- Chat Container ---
interface GlassCollaborativeChatContainerProps {
    children: React.ReactNode;
    className?: string;
}

export const GlassCollaborativeChatContainer = ({ children, className }: GlassCollaborativeChatContainerProps) => {
    return (
        <div className={cn("flex flex-col h-full w-full", className)}>
            {children}
        </div>
    );
};

// --- Chat Message ---
interface GlassCollaborativeChatMessageProps {
    message: CollaborativeChatMessage;
    sender: Participant;
    isOwnMessage: boolean;
}

export const GlassCollaborativeChatMessage = ({ message, sender, isOwnMessage }: GlassCollaborativeChatMessageProps) => {
    // Generate a consistent color from sender id
    const getDefaultColor = (id: string): string => {
        const colors = [
            'var(--system-blue)',
            'var(--system-purple)',
            'var(--system-pink)',
            'var(--system-orange)',
            'var(--system-teal)',
            'var(--system-indigo)',
        ];
        const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[index % colors.length];
    };

    const senderColor = sender.color || getDefaultColor(sender.id);

    return (
        <div className={cn(
            "flex gap-3 mb-4 px-4",
            isOwnMessage ? "flex-row-reverse" : "flex-row"
        )}>
            {/* Avatar */}
            <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white shadow-lg"
                style={{ backgroundColor: senderColor }}
                title={sender.name}
            >
                {sender.avatar ? (
                    <img src={sender.avatar} alt={sender.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                    sender.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
                )}
            </div>

            {/* Message Content */}
            <div className={cn(
                "flex flex-col max-w-[75%]",
                isOwnMessage ? "items-end" : "items-start"
            )}>
                {/* Sender name (for others' messages) */}
                {!isOwnMessage && (
                    <span className="text-[10px] text-label-glass-tertiary mb-1 px-2">{sender.name}</span>
                )}
                <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                    isOwnMessage
                        ? "bg-gradient-to-br from-accent to-accent/80 text-primary rounded-br-md shadow-lg shadow-accent/20"
                        : "bg-glass-surface-hover backdrop-blur-sm text-label-glass-primary rounded-bl-md border border-[var(--glass-border)]"
                )}>
                    {message.content}
                </div>
                {message.timestamp && (
                    <span className="text-[10px] text-label-glass-tertiary mt-1.5 px-2">
                        {message.timestamp}
                    </span>
                )}
            </div>
        </div>
    );
};

// --- Chat Input Bar ---
interface GlassCollaborativeChatInputProps {
    onSend: (message: string) => void;
    isLoading?: boolean;
    placeholder?: string;
    className?: string;
}

export const GlassCollaborativeChatInput = ({
    onSend,
    isLoading = false,
    placeholder = "Type a message...",
    className
}: GlassCollaborativeChatInputProps) => {
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
                <Send size={16} className={hasMessage ? "translate-x-px" : ""} />
            </button>
        </div>
    );
};

// --- Full Collaborative Chat Window ---
interface GlassCollaborativeChatWindowProps {
    /** Current user's ID */
    currentUserId: string;
    /** All participants in the chat */
    participants: Participant[];
    /** Messages in the chat */
    messages: CollaborativeChatMessage[];
    /** Callback when sending a message */
    onSend: (message: string) => void;
    /** Whether input is disabled (e.g., sending) */
    isLoading?: boolean;
    /** Additional class names */
    className?: string;
    /** Chat title */
    title?: string;
}

export const GlassCollaborativeChatWindow = ({
    currentUserId,
    participants,
    messages,
    onSend,
    isLoading = false,
    className,
    title = "Team Chat"
}: GlassCollaborativeChatWindowProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Get sender info from participants
    const getSender = (senderId: string): Participant => {
        return participants.find(p => p.id === senderId) || { id: senderId, name: 'Unknown' };
    };

    // Find who is typing (excluding current user)
    const typingParticipants = participants.filter(p => p.isTyping && p.id !== currentUserId);

    return (
        <div className={cn(
            "flex flex-col h-full bg-[var(--glass-bg-regular)] backdrop-blur-xl rounded-3xl border border-[var(--glass-border)] overflow-hidden",
            "shadow-2xl shadow-black/20",
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)]">
                <div className="flex items-center gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-label-glass-primary">{title}</h3>
                        <span className="text-xs text-label-glass-tertiary">
                            {participants.filter(p => p.isActive).length} online
                        </span>
                    </div>
                </div>
                <GlassCollaborators
                    users={participants}
                    maxVisible={4}
                    size="sm"
                />
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
                {messages.map((msg) => (
                    <GlassCollaborativeChatMessage
                        key={msg.id}
                        message={msg}
                        sender={getSender(msg.senderId)}
                        isOwnMessage={msg.senderId === currentUserId}
                    />
                ))}

                {/* Typing indicator */}
                {typingParticipants.length > 0 && (
                    <div className="flex gap-3 mb-4 px-4">
                        <div className="bg-glass-surface-hover backdrop-blur-sm rounded-2xl rounded-bl-md px-4 py-3 border border-[var(--glass-border)]">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-label-glass-tertiary">
                                    {typingParticipants.map(p => p.name).join(', ')} {typingParticipants.length === 1 ? 'is' : 'are'} typing
                                </span>
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-label-glass-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 bg-label-glass-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 bg-label-glass-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[var(--glass-border)]">
                <GlassCollaborativeChatInput
                    onSend={onSend}
                    isLoading={isLoading}
                    placeholder="Message the team..."
                />
            </div>
        </div>
    );
};

GlassCollaborativeChatContainer.displayName = 'GlassCollaborativeChatContainer';
GlassCollaborativeChatMessage.displayName = 'GlassCollaborativeChatMessage';
GlassCollaborativeChatInput.displayName = 'GlassCollaborativeChatInput';
GlassCollaborativeChatWindow.displayName = 'GlassCollaborativeChatWindow';
