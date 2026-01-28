/**
 * Agent Chat Application
 *
 * A desktop-level application for chatting with A2A agents.
 * Reads agent data from the agentChatStore and renders the chat UI.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Loader2,
    User,
    Sparkles,
    AlertCircle,
    Paperclip,
    Mic,
    RefreshCcw,
    MessageCircle,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassA2UIRenderer } from '@/components/agentic/GlassA2UIRenderer';
import {
    A2AClient,
    createA2AClient,
    v1,
    a2ui,
} from '@liquidcrypto/a2a-sdk';
import { useAgentChatStore, selectFocusedAgent } from '@/stores/agentChatStore';
import { useAppStoreStore } from '@/system/app-store/appStoreStore';
import { generateContextualUI, type GeneratedUI } from '@/components/agents/contextualUIGenerator';
import { useAgentUXConfig } from './ux';

// ============================================================================
// Types
// ============================================================================

type LegacyA2UIMessage = a2ui.A2UIMessage;
type TaskState = v1.TaskState;

interface ChatMessage {
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
    a2ui?: LegacyA2UIMessage[];
    taskState?: TaskState;
    error?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export default function AgentChatApp() {
    const agent = useAgentChatStore(selectFocusedAgent);
    const setConnectionStatus = useAgentChatStore(state => state.setConnectionStatus);
    const setAgentMessages = useAgentChatStore(state => state.setAgentMessages);
    const closeApp = useAppStoreStore(state => state.closeApp);

    // Load agent-specific UX configuration
    const { config: uxConfig } = useAgentUXConfig(agent?.id ?? null);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [client, setClient] = useState<A2AClient | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Derive theme values from UX config
    const accentColor = uxConfig?.theme?.accentColor ?? '#6366f1';
    const inputPlaceholder = uxConfig?.input?.placeholder ?? `Message ${agent?.name ?? 'agent'}...`;
    const quickActions = uxConfig?.quickActions ?? [];

    // Initialize client - must be before any conditional returns
    useEffect(() => {
        if (!agent) return;

        const initClient = async () => {
            try {
                setConnectionStatus(agent.id, 'connecting');

                const isRemoteAgent = agent.url.startsWith('/remote-');
                const newClient = createA2AClient({
                    baseUrl: agent.url,
                    enableA2UI: true,
                    rpcPath: isRemoteAgent ? '' : '/a2a',
                });

                await newClient.getAgentCard();
                setClient(newClient);
                setIsConnected(true);
                setConnectionStatus(agent.id, 'connected');
                setError(null);

                setMessages([{
                    id: 'welcome',
                    role: 'agent',
                    content: `Hello! I'm ${agent.name}. ${agent.shortDescription} How can I help you today?`,
                    timestamp: new Date(),
                }]);
            } catch (err) {
                console.error('[AgentChat] Connection error:', err);
                const errorMessage = err instanceof Error ? err.message : String(err);
                setError(`Connection Failed: ${errorMessage}`);
                setIsConnected(false);
                setConnectionStatus(agent.id, 'disconnected');
            }
        };

        initClient();
    }, [agent, setConnectionStatus]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Sync messages to store for copy feature
    useEffect(() => {
        if (!agent) return;
        // Convert to stored format (without a2ui for simplicity)
        const storedMessages = messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            error: msg.error,
        }));
        setAgentMessages(agent.id, storedMessages);
    }, [messages, agent, setAgentMessages]);

    // Helper: Extract text and A2UI from SDK task
    const extractTaskContent = useCallback((task: v1.Task): { content: string; a2uiMessages: LegacyA2UIMessage[] } => {
        let content = '';
        const a2uiMessages: LegacyA2UIMessage[] = [];

        if (task.status.message) {
            content = task.status.message.parts
                ?.filter((p: any): p is v1.TextPart => 'text' in p && typeof (p as any).text === 'string')
                ?.map((p: any) => p.text)
                ?.join('\n') ?? '';
        }

        if (!content && task.history && task.history.length > 0) {
            const agentMessages = task.history.filter((m: any) => m.role === 'agent');
            const lastAgentMessage = agentMessages[agentMessages.length - 1];

            if (lastAgentMessage && lastAgentMessage.parts) {
                content = lastAgentMessage.parts
                    .filter((p: any) => p.text !== undefined || p.kind === 'text')
                    .map((p: any) => p.text || '')
                    .join('\n');
            }
        }

        if (task.artifacts) {
            for (const artifact of task.artifacts) {
                if (!content && artifact.parts) {
                    for (const part of artifact.parts) {
                        if ('text' in part && typeof (part as any).text === 'string') {
                            content = (part as any).text;
                            break;
                        }
                    }
                }

                if (a2ui.isA2UIArtifact(artifact)) {
                    a2uiMessages.push(...a2ui.extractA2UIMessages(artifact));
                }
            }
        }

        return { content, a2uiMessages };
    }, []);

    // Format error message
    const formatErrorMessage = (error: unknown): string => {
        const rawMessage = error instanceof Error ? error.message : String(error);

        if (rawMessage.includes('Environment is not ready') || rawMessage.includes('Environment error')) {
            return 'Remote service temporarily unavailable. Please try again later.';
        }
        if (rawMessage.includes('Failed to fetch') || rawMessage.includes('NetworkError')) {
            return 'Network error. Please check your connection.';
        }
        if (rawMessage.includes('timeout') || rawMessage.includes('Timeout')) {
            return 'Request timed out.';
        }
        if (rawMessage.includes('HTTP 5')) {
            return 'Server error. The agent service is experiencing issues.';
        }
        if (rawMessage.includes('HTTP 4')) {
            return 'Request error. Please try a different message.';
        }

        return rawMessage;
    };

    // Send message
    const sendMessage = useCallback(async () => {
        if (!inputValue.trim() || !client || isLoading || !agent) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setConnectionStatus(agent.id, 'working');
        setError(null);

        const agentMessageId = `agent-${Date.now()}`;
        setMessages(prev => [...prev, {
            id: agentMessageId,
            role: 'agent' as const,
            content: '',
            timestamp: new Date(),
            taskState: v1.TaskState.WORKING,
        }]);

        try {
            const task = await client.sendText(userMessage.content);
            const { content, a2uiMessages } = extractTaskContent(task);

            setMessages(prev => prev.map(msg =>
                msg.id === agentMessageId
                    ? {
                        ...msg,
                        content: content || 'Task completed.',
                        a2ui: a2uiMessages.length > 0 ? a2uiMessages : undefined,
                        taskState: task.status.state
                    }
                    : msg
            ));
            setConnectionStatus(agent.id, 'connected');
        } catch (err) {
            console.error('[AgentChat] Send error:', err);
            setMessages(prev => prev.map(msg =>
                msg.id === agentMessageId
                    ? {
                        ...msg,
                        content: '',
                        error: formatErrorMessage(err),
                        taskState: v1.TaskState.FAILED
                    }
                    : msg
            ));
            setConnectionStatus(agent.id, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [inputValue, client, isLoading, extractTaskContent, agent, setConnectionStatus]);

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Handle A2UI action
    const handleA2UIAction = useCallback(async (_actionId: string, data?: unknown) => {
        if (!agent) return;

        let textToSend: string | undefined;

        if (typeof data === 'string') {
            textToSend = data;
        } else if (data && typeof data === 'object') {
            const actionData = data as { input?: { text?: string }; text?: string };
            textToSend = actionData.input?.text || actionData.text;
        }

        if (textToSend) {
            const userMessage: ChatMessage = {
                id: `user-${Date.now()}`,
                role: 'user',
                content: textToSend,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, userMessage]);
            setIsLoading(true);
            setConnectionStatus(agent.id, 'working');
            setError(null);

            const agentMessageId = `agent-${Date.now()}`;
            setMessages(prev => [...prev, {
                id: agentMessageId,
                role: 'agent' as const,
                content: '',
                timestamp: new Date(),
                taskState: v1.TaskState.WORKING,
            }]);

            try {
                if (!client) throw new Error("Client not connected");

                const task = await client.sendText(textToSend);
                const { content, a2uiMessages } = extractTaskContent(task);

                setMessages(prev => prev.map(msg =>
                    msg.id === agentMessageId
                        ? {
                            ...msg,
                            content: content || 'Task completed.',
                            a2ui: a2uiMessages.length > 0 ? a2uiMessages : undefined,
                            taskState: task.status.state
                        }
                        : msg
                ));
                setConnectionStatus(agent.id, 'connected');
            } catch (err) {
                console.error('[AgentChat] Action error:', err);
                setMessages(prev => prev.map(msg =>
                    msg.id === agentMessageId
                        ? {
                            ...msg,
                            content: '',
                            error: err instanceof Error ? err.message : 'Action failed',
                            taskState: v1.TaskState.FAILED
                        }
                        : msg
                ));
                setConnectionStatus(agent.id, 'error');
            } finally {
                setIsLoading(false);
            }
        }
    }, [client, extractTaskContent, agent, setConnectionStatus]);

    // Retry connection
    const retryConnection = () => {
        setError(null);
        setClient(null);
        setMessages([]);
    };

    // Handle missing agent - AFTER all hooks
    if (!agent) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white/50 gap-4">
                <MessageCircle size={48} className="opacity-30" />
                <p>No agent selected</p>
                <button
                    onClick={closeApp}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-sm"
                >
                    Close
                </button>
            </div>
        );
    }

    const AgentIcon = agent.icon;

    return (
        <div className="flex flex-col h-full bg-black/20">
            {/* Agent-Specific Background (WR-Demo) */}
            {agent.id === 'remote-wr-demo' && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <img
                        src="/images/backgrounds/sticklikov-retro.png"
                        alt=""
                        className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60" />
                </div>
            )}

            {/* Chat content container - max 2/3 width on large screens, centered */}
            <div className="flex flex-col h-full relative z-10 w-full max-w-[100%] lg:max-w-[66%] xl:max-w-[60%] mx-auto">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 xl:p-8 space-y-4 lg:space-y-6 custom-scrollbar">
                    {/* Error Banner */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                            >
                                <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                                <span className="flex-1 text-sm text-red-400">{error}</span>
                                <button
                                    onClick={retryConnection}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs transition-colors"
                                >
                                    <RefreshCcw size={12} />
                                    <span>Retry</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Messages */}
                    {messages.map((message, index) => {
                        const isLatestAgentMessage = message.role === 'agent' &&
                            !messages.slice(index + 1).some(m => m.role === 'agent');

                        return (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                agentIcon={AgentIcon}
                                agentColor={agent.color}
                                onA2UIAction={handleA2UIAction}
                                isLatestAgentMessage={isLatestAgentMessage}
                            />
                        );
                    })}

                    {/* Loading indicator */}
                    <AnimatePresence>
                        {isLoading && messages[messages.length - 1]?.content === '' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 text-white/40 text-sm lg:text-base"
                            >
                                <Loader2 size={14} className="animate-spin lg:hidden" />
                                <Loader2 size={18} className="animate-spin hidden lg:block" />
                                <span>{agent.name} is thinking...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 lg:p-6 border-t border-white/20 bg-black/40 backdrop-blur-sm">
                    {/* Quick Actions */}
                    {isConnected && quickActions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {quickActions.map((action, index) => {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const IconComponent = action.icon
                                    ? (LucideIcons as any)[action.icon]
                                    : null;

                                return (
                                    <motion.button
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setInputValue(action.value);
                                            inputRef.current?.focus();
                                        }}
                                        title={action.description}
                                        className={cn(
                                            'px-3 py-1.5 rounded-lg text-xs transition-all',
                                            'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20',
                                            'text-white/70 hover:text-white',
                                            'flex items-center gap-1.5'
                                        )}
                                    >
                                        {IconComponent && <IconComponent size={12} />}
                                        <span>{action.label}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex items-center gap-2 lg:gap-3">
                        <button
                            className="p-2 lg:p-3 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                            title="Attach file"
                        >
                            <Paperclip size={18} className="lg:hidden" />
                            <Paperclip size={22} className="hidden lg:block" />
                        </button>
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder={isConnected ? inputPlaceholder : 'Connecting...'}
                                disabled={!isConnected || isLoading}
                                className={cn(
                                    'w-full px-4 py-3 lg:px-5 lg:py-4 rounded-xl',
                                    'bg-black/30 border border-white/20',
                                    'text-white placeholder:text-white/50',
                                    'text-sm lg:text-base',
                                    'focus:outline-none focus:border-white/40 focus:bg-black/40',
                                    'transition-all',
                                    (!isConnected || isLoading) && 'opacity-50 cursor-not-allowed'
                                )}
                            />
                        </div>
                        <button
                            className="p-2 lg:p-3 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                            title="Voice input"
                        >
                            <Mic size={18} className="lg:hidden" />
                            <Mic size={22} className="hidden lg:block" />
                        </button>
                        <motion.button
                            onClick={sendMessage}
                            disabled={!inputValue.trim() || !isConnected || isLoading}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                                'p-3 lg:p-4 rounded-xl transition-all',
                                inputValue.trim() && isConnected && !isLoading
                                    ? 'text-white'
                                    : 'bg-white/10 text-white/50 cursor-not-allowed'
                            )}
                            style={
                                inputValue.trim() && isConnected && !isLoading
                                    ? { backgroundColor: accentColor }
                                    : undefined
                            }
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin lg:hidden" />
                                    <Loader2 size={22} className="animate-spin hidden lg:block" />
                                </>
                            ) : (
                                <>
                                    <Send size={18} className="lg:hidden" />
                                    <Send size={22} className="hidden lg:block" />
                                </>
                            )}
                        </motion.button>
                    </div>

                    {/* Capabilities hint */}
                    {isConnected && (
                        <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-white/30">
                            {agent.capabilities.streaming && (
                                <span className="flex items-center gap-1">
                                    <Sparkles size={10} />
                                    Streaming
                                </span>
                            )}
                            {agent.capabilities.a2ui && (
                                <span className="flex items-center gap-1">
                                    <Sparkles size={10} />
                                    Rich UI
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Markdown Renderer
// ============================================================================

const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
    const renderContent = React.useMemo(() => {
        const lines = content.split('\n');
        const elements: React.ReactNode[] = [];
        let inList = false;
        let listItems: string[] = [];
        let listType: 'ul' | 'ol' = 'ul';

        const flushList = () => {
            if (listItems.length > 0) {
                const ListTag = listType;
                elements.push(
                    <ListTag
                        key={`list-${elements.length}`}
                        className={cn(
                            'my-2 lg:my-3 space-y-1 lg:space-y-2',
                            listType === 'ul' ? 'list-none' : 'list-decimal list-inside'
                        )}
                    >
                        {listItems.map((item, i) => (
                            <li
                                key={i}
                                className={cn(
                                    'flex items-start gap-2 text-sm lg:text-base xl:text-lg',
                                    listType === 'ul' && 'before:content-["•"] before:text-indigo-400 before:font-bold before:flex-shrink-0 before:text-sm before:lg:text-base before:xl:text-lg before:leading-relaxed'
                                )}
                            >
                                <span className="flex-1">{renderInlineMarkdown(item)}</span>
                            </li>
                        ))}
                    </ListTag>
                );
                listItems = [];
                inList = false;
            }
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headerMatch) {
                flushList();
                const level = headerMatch[1].length;
                const text = headerMatch[2];
                const sizeClass = level === 1 ? 'text-lg lg:text-xl xl:text-2xl font-bold' :
                    level === 2 ? 'text-base lg:text-lg xl:text-xl font-semibold' :
                        'text-sm lg:text-base xl:text-lg font-medium';
                if (level === 1) {
                    elements.push(<h1 key={`h-${i}`} className={cn(sizeClass, 'my-2 lg:my-3 text-white')}>{renderInlineMarkdown(text)}</h1>);
                } else if (level === 2) {
                    elements.push(<h2 key={`h-${i}`} className={cn(sizeClass, 'my-2 lg:my-3 text-white')}>{renderInlineMarkdown(text)}</h2>);
                } else if (level === 3) {
                    elements.push(<h3 key={`h-${i}`} className={cn(sizeClass, 'my-2 lg:my-3 text-white')}>{renderInlineMarkdown(text)}</h3>);
                } else {
                    elements.push(<h4 key={`h-${i}`} className={cn(sizeClass, 'my-2 lg:my-3 text-white')}>{renderInlineMarkdown(text)}</h4>);
                }
                continue;
            }

            const ulMatch = line.match(/^\s*[-*•]\s+(.+)$/);
            if (ulMatch) {
                if (!inList || listType !== 'ul') {
                    flushList();
                    inList = true;
                    listType = 'ul';
                }
                listItems.push(ulMatch[1]);
                continue;
            }

            const olMatch = line.match(/^\s*(\d+)[.)]\s+(.+)$/);
            if (olMatch) {
                if (!inList || listType !== 'ol') {
                    flushList();
                    inList = true;
                    listType = 'ol';
                }
                listItems.push(olMatch[2]);
                continue;
            }

            if (!line.trim()) {
                flushList();
                continue;
            }

            flushList();
            elements.push(
                <p key={`p-${i}`} className="text-sm lg:text-base xl:text-lg my-1 lg:my-2">
                    {renderInlineMarkdown(line)}
                </p>
            );
        }

        flushList();
        return elements;
    }, [content]);

    return <div className="space-y-1 lg:space-y-2">{renderContent}</div>;
};

function renderInlineMarkdown(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*/);
        if (boldMatch) {
            if (boldMatch[1]) parts.push(boldMatch[1]);
            parts.push(<strong key={key++} className="font-semibold text-white">{boldMatch[2]}</strong>);
            remaining = remaining.slice(boldMatch[0].length);
            continue;
        }

        const italicMatch = remaining.match(/^(.*?)\*(.+?)\*/);
        if (italicMatch && !italicMatch[1].endsWith('*')) {
            if (italicMatch[1]) parts.push(italicMatch[1]);
            parts.push(<em key={key++} className="italic">{italicMatch[2]}</em>);
            remaining = remaining.slice(italicMatch[0].length);
            continue;
        }

        const codeMatch = remaining.match(/^(.*?)`(.+?)`/);
        if (codeMatch) {
            if (codeMatch[1]) parts.push(codeMatch[1]);
            parts.push(
                <code key={key++} className="px-1.5 py-0.5 rounded bg-white/10 text-indigo-300 font-mono text-xs">
                    {codeMatch[2]}
                </code>
            );
            remaining = remaining.slice(codeMatch[0].length);
            continue;
        }

        parts.push(remaining);
        break;
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
}

// ============================================================================
// Contextual UI Buttons
// ============================================================================

const ContextualUIButtons: React.FC<{
    generatedUI: GeneratedUI;
    onAction: (value: string) => void;
}> = ({ generatedUI, onAction }) => {
    const { elements, layout } = generatedUI;

    return (
        <div className={cn(
            'mt-3 flex flex-wrap gap-2',
            layout === 'vertical' && 'flex-col',
            layout === 'grid' && 'grid grid-cols-2'
        )}>
            {elements.map((element, index) => (
                <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAction(element.value)}
                    className={cn(
                        'px-3 py-2 rounded-xl text-sm transition-all',
                        'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20',
                        'text-white/80 hover:text-white',
                        'flex items-center gap-2',
                        layout === 'vertical' && 'justify-start',
                        (layout === 'horizontal' || layout === 'grid') && 'justify-center'
                    )}
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                    <span className="truncate">{element.label}</span>
                </motion.button>
            ))}
        </div>
    );
};

// ============================================================================
// Message Bubble
// ============================================================================

const MessageBubble: React.FC<{
    message: ChatMessage;
    agentIcon: React.ElementType;
    agentColor?: string;
    onA2UIAction: (actionId: string, data?: unknown) => void;
    isLatestAgentMessage?: boolean;
}> = ({ message, agentIcon: AgentIcon, agentColor, onA2UIAction, isLatestAgentMessage }) => {
    const isUser = message.role === 'user';
    const isError = message.taskState === 'failed' || !!message.error;

    const generatedUI = (() => {
        if (isUser || !isLatestAgentMessage || !message.content) return null;
        if (message.a2ui && message.a2ui.length > 0) return null;
        return generateContextualUI(message.content);
    })();

    const handleContextualAction = React.useCallback((value: string) => {
        onA2UIAction('contextual_action', { text: value });
    }, [onA2UIAction]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'flex gap-3 lg:gap-4',
                isUser && 'flex-row-reverse'
            )}
        >
            {/* Avatar */}
            <div className={cn(
                'flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center',
                isUser
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-lg'
            )}
                style={{
                    backgroundColor: !isUser ? `${agentColor}20` : undefined
                }}
            >
                {isUser ? (
                    <>
                        <User size={16} className="lg:hidden" />
                        <User size={20} className="hidden lg:block" />
                    </>
                ) : (
                    <>
                        <AgentIcon size={16} className="text-white lg:hidden" />
                        <AgentIcon size={20} className="text-white hidden lg:block" />
                    </>
                )}
            </div>

            {/* Content */}
            <div className={cn(
                'flex-1 max-w-[80%]',
                isUser && 'flex flex-col items-end'
            )}>
                {message.content && (
                    <div className={cn(
                        'px-4 py-3 lg:px-5 lg:py-4 rounded-2xl',
                        isUser
                            ? 'bg-indigo-500/20 text-white rounded-tr-md'
                            : 'bg-white/5 border border-white/10 text-white/80 rounded-tl-md',
                        isError && 'border-red-500/30 bg-red-500/10'
                    )}>
                        {isUser ? (
                            <p className="text-sm lg:text-base xl:text-lg whitespace-pre-wrap">{message.content}</p>
                        ) : (
                            <MarkdownContent content={message.content} />
                        )}
                    </div>
                )}

                {message.error && (
                    <div className="mt-2 px-4 py-2 lg:px-5 lg:py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-sm lg:text-base text-red-400">{message.error}</p>
                    </div>
                )}

                {message.a2ui && message.a2ui.length > 0 && (
                    <div className="mt-3 lg:mt-4 w-full">
                        <GlassA2UIRenderer
                            messages={message.a2ui}
                            onAction={onA2UIAction}
                            className="rounded-xl overflow-hidden"
                        />
                    </div>
                )}

                {generatedUI && (
                    <ContextualUIButtons
                        generatedUI={generatedUI}
                        onAction={handleContextualAction}
                    />
                )}

                <div className={cn(
                    'mt-1 lg:mt-2 text-[10px] lg:text-xs text-white/30',
                    isUser && 'text-right'
                )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {message.taskState && message.taskState !== 'completed' && (
                        <span className="ml-2 text-yellow-400/60">
                            {message.taskState}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
