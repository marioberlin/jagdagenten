/**
 * CockpitChatPanel
 *
 * Embedded chat panel for the Daily Cockpit.
 * Connects to the Jagd Chat store for AI-powered hunting advice.
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, MessageCircle, Loader2 } from 'lucide-react';
import { useJagdChatStore, type ChatMessage } from '@/stores/useJagdChatStore';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ChatBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user';

    return (
        <div
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            <div
                className={`
          max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
          ${isUser
                        ? 'bg-[var(--glass-accent)] text-white rounded-br-md'
                        : 'bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)] rounded-bl-md'
                    }
        `}
            >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <span
                    className={`text-[10px] mt-1 block ${isUser ? 'text-white/70' : 'text-[var(--text-secondary)]'
                        }`}
                >
                    {new Date(message.timestamp).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CockpitChatPanel() {
    const { messages, loading, error, sendMessage, clearChat } = useJagdChatStore();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || loading) return;

        setInput('');
        await sendMessage(text);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[400px] rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]">
                <div className="flex items-center gap-2">
                    <MessageCircle size={18} style={{ color: 'var(--glass-accent)' }} />
                    <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                        Jagd-Berater
                    </h3>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={clearChat}
                        className="p-1.5 rounded-lg hover:bg-[var(--glass-bg-primary)] transition-colors"
                        title="Chat leeren"
                    >
                        <Trash2 size={16} style={{ color: 'var(--text-secondary)' }} />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircle size={32} style={{ color: 'var(--text-secondary)' }} className="mb-2 opacity-50" />
                        <p className="text-sm text-[var(--text-secondary)]">
                            Frag mich zu Jagdrecht, Wildbiologie oder Reviermanagement.
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)
                )}

                {loading && (
                    <div className="flex justify-start">
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl rounded-bl-md bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                            <Loader2 size={14} className="animate-spin" style={{ color: 'var(--glass-accent)' }} />
                            <span className="text-sm text-[var(--text-secondary)]">Denke nach...</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[var(--glass-border)]">
                <div className="flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Nachricht eingeben..."
                        rows={1}
                        className="
              flex-1 resize-none px-4 py-2.5 rounded-xl
              bg-[var(--glass-bg-primary)] border border-[var(--glass-border)]
              text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]
              focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]/50
              max-h-24 overflow-y-auto
            "
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="
              p-2.5 rounded-xl bg-[var(--glass-accent)] text-white
              transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
            "
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
