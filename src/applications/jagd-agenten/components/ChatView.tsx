/**
 * ChatView Component
 *
 * AI hunting advisor chat interface. Displays a scrollable message list
 * with a fixed input area at the bottom. Supports Enter to send,
 * Shift+Enter for newlines, and shows a typing indicator while loading.
 */

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Send, MessageCircle, Bot, User, Loader2 } from 'lucide-react';
import { useJagdChatStore } from '@/stores/useJagdChatStore';
import type { ChatMessage } from '@/stores/useJagdChatStore';

// ============================================================================
// Helpers
// ============================================================================

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// Sub-components
// ============================================================================

function ToolCallChip({ toolCall }: { toolCall: NonNullable<ChatMessage['toolCalls']>[number] }) {
  const statusColor =
    toolCall.status === 'completed'
      ? 'text-green-400'
      : toolCall.status === 'error'
        ? 'text-red-400'
        : 'text-[var(--text-secondary)]';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-[var(--glass-border)] ${statusColor}`}
    >
      {toolCall.status === 'pending' && <Loader2 className="w-3 h-3 animate-spin" />}
      {toolCall.name}
    </span>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-[var(--glass-accent)]'
            : 'bg-[var(--glass-surface)] border border-[var(--glass-border)]'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-[var(--text-primary)]" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-[var(--glass-accent)] text-white'
            : 'bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-primary)]'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

        {/* Tool call chips */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.toolCalls.map((tc, i) => (
              <ToolCallChip key={i} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p
          className={`text-xs mt-1 ${
            isUser ? 'text-white/60' : 'text-[var(--text-secondary)]'
          }`}
        >
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[var(--glass-surface)] border border-[var(--glass-border)]">
        <Bot className="w-4 h-4 text-[var(--text-primary)]" />
      </div>
      <div className="bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-2xl px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-[var(--text-secondary)] animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-[var(--text-secondary)] animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-[var(--text-secondary)] animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-[var(--glass-surface)] border border-[var(--glass-border)] flex items-center justify-center mb-4">
        <MessageCircle className="w-8 h-8 text-[var(--glass-accent)]" />
      </div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        KI-Jagdberater
      </h2>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm">
        Willkommen! Ich bin Ihr KI-Jagdberater. Fragen Sie mich zu Jagdrecht,
        Wildbiologie, Reviermanagement oder Jagdpraxis.
      </p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ChatView() {
  const { messages, loading, error, sendMessage, clearChat } = useJagdChatStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput('');
    sendMessage(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[var(--glass-accent)]" />
          <span className="font-semibold text-sm text-[var(--text-primary)]">
            KI-Jagdberater
          </span>
        </div>
        {hasMessages && (
          <button
            onClick={clearChat}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-2 py-1 rounded"
          >
            Chat leeren
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!hasMessages && !loading ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 text-xs text-red-400 bg-red-400/10 border-t border-red-400/20">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-[var(--glass-border)] px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Fragen Sie Ihren Jagdberater..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--glass-accent)] transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--glass-accent)] text-white flex items-center justify-center transition-opacity disabled:opacity-40 hover:opacity-90"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 px-1">
          Shift+Enter fuer Zeilenumbruch
        </p>
      </div>
    </div>
  );
}
