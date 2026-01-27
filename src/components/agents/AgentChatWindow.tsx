import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Paperclip, Mic, Send, MoreHorizontal, User, Sparkles, AlertCircle, RefreshCcw, Loader2,
    Rocket, Zap, Star, Heart, Flame, ThumbsUp, Check, X as XIcon, ArrowRight, Lightbulb,
    Brain, Laptop, Terminal
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/utils/cn';
import { GlassWindow } from '@/components/containers/GlassWindow';
import { GlassA2UIRenderer } from '@/components/agentic/GlassA2UIRenderer';
// Use SDK client instead of local implementation
import {
    A2AClient,
    createA2AClient,
    v1,
    a2ui,
} from '@liquidcrypto/a2a-sdk';
import type { CuratedAgent } from '@/services/agents/registry';

// ============================================================================
// Types
// ============================================================================

// Legacy A2UIMessage type for GlassA2UIRenderer compatibility
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

interface AgentChatWindowProps {
    /** The agent to chat with */
    agent: CuratedAgent;
    /** Agent card from discovery */
    agentCard?: v1.AgentCard;
    /** Window position */
    position?: { x: number; y: number };
    /** Callback when window is closed */
    onClose?: () => void;
    /** Callback when window is minimized */
    onMinimize?: () => void;
    /** Whether the window is active */
    isActive?: boolean;
    /** Callback when window receives focus */
    onFocus?: () => void;
    /** Optional auth token for the agent */
    authToken?: string;
    className?: string;
}

// ============================================================================
// Component
// ============================================================================

// --- Smart Components ---

const EMOJI_MAP: Record<string, React.ElementType> = {
    '🚀': Rocket,
    '⚡': Zap,
    '⭐': Star,
    '❤️': Heart,
    '🔥': Flame,
    '👍': ThumbsUp,
    '✅': Check,
    '❌': XIcon,
    '💡': Lightbulb,
    '🧠': Brain,
    '💻': Laptop,
    '🖥️': Terminal,
    '📝': Paperclip,
    '✨': Sparkles
};

// Replaces emojis with Lucide icons in text
const SmartMessageContent: React.FC<{ content: string }> = ({ content }) => {
    // 1. Logic to enhance formatting (ensure blank lines between paragraphs)
    const formattedContent = content
        .replace(/([.!?])\s*\n/g, '$1\n\n') // Ensure breaks after sentences ending with newline
        .replace(/\n(?!\n)/g, '\n\n'); // Aggressively ensure paragraphs

    return (
        <ReactMarkdown
            components={{
                p: ({ children }) => {
                    return (
                        <p className="mb-4 last:mb-0 leading-relaxed">
                            {React.Children.map(children, child => {
                                if (typeof child === 'string') {
                                    return replaceEmojisToIcons(child);
                                }
                                return child;
                            })}
                        </p>
                    );
                },
                li: ({ children }) => (
                    <li className="flex items-start gap-2">
                        {/* Custom bullet if needed, or rely on prose */}
                        <div className="mt-1.5 w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />
                        <span className="flex-1">{children}</span>
                    </li>
                )
            }}
        >
            {formattedContent}
        </ReactMarkdown>
    );
};

const replaceEmojisToIcons = (text: string) => {
    // Regex to match emojis in the map
    const emojiRegex = new RegExp(`(${Object.keys(EMOJI_MAP).join('|').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g');

    const parts = text.split(emojiRegex);
    return parts.map((part, index) => {
        if (EMOJI_MAP[part]) {
            const Icon = EMOJI_MAP[part];
            return <Icon key={index} size={14} className="inline-block mx-0.5 -mt-0.5 text-indigo-400" />;
        }
        return part;
    });
};

const SuggestedActions: React.FC<{ content: string; onAction: (action: string) => void }> = ({ content, onAction }) => {
    // Simple heuristic to generate relevant suggestions based on content length/type
    // In a real system, this would come from the A2A response or an LLM
    const getSuggestions = () => {
        const length = content.length;
        if (content.includes('?')) {
            return ["I'm not sure", "Give me an example", "Let's proceed"];
        }
        if (length < 50) {
            return ["Tell me more", "Why?", "Interesting"];
        }
        if (content.includes("code") || content.includes("function")) {
            return ["Explain this code", "Optimize it", "Any alternatives?"];
        }
        return ["Continue", "Elaborate", "Show examples"];
    };

    const suggestions = getSuggestions();

    return (
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5">
            {suggestions.map((suggestion, idx) => (
                <button
                    key={idx}
                    onClick={() => onAction(suggestion)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-xs text-white/70 hover:text-white group"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                    {suggestion}
                    <ArrowRight size={10} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                </button>
            ))}
        </div>
    );
};

// --- Main Component ---
export const AgentChatWindow: React.FC<AgentChatWindowProps> = ({
    agent,
    agentCard: _agentCard, // Reserved for future AgentCard-specific features
    position = { x: 200, y: 100 },
    onClose,
    onMinimize,
    isActive = true,
    onFocus,
    authToken,
    className
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [client, setClient] = useState<A2AClient | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize client using new SDK
    useEffect(() => {
        const initClient = async () => {
            try {
                // Create SDK client with v1.0 compliant config
                // Remote agents (e.g., /remote-a2a) accept RPC at base URL, not /a2a suffix
                const isRemoteAgent = agent.url.startsWith('/remote-');
                const newClient = createA2AClient({
                    baseUrl: agent.url,
                    authToken,
                    enableA2UI: true,
                    rpcPath: isRemoteAgent ? '' : '/a2a',
                });

                // Try to get agent card to verify connection
                await newClient.getAgentCard();
                setClient(newClient);
                setIsConnected(true);
                setError(null);

                // Add welcome message
                setMessages([{
                    id: 'welcome',
                    role: 'agent',
                    content: `Hello! I'm ${agent.name}. ${agent.shortDescription} How can I help you today?`,
                    timestamp: new Date(),
                }]);
            } catch (err) {
                console.error('[AgentChatWindow] Connection error:', err);
                const errorMessage = err instanceof Error ? err.message : String(err);
                setError(`Connection Failed: ${errorMessage} (URL: ${agent.url})`);
                setIsConnected(false);
            }
        };

        initClient();
    }, [agent.url, agent.name, agent.shortDescription, authToken]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when window becomes active
    useEffect(() => {
        if (isActive) {
            inputRef.current?.focus();
        }
    }, [isActive]);

    // Helper: Extract text and A2UI from SDK task
    // Supports both v1.0 (status.message) and v0.x (history) response formats
    const extractTaskContent = useCallback((task: v1.Task): { content: string; a2uiMessages: LegacyA2UIMessage[] } => {
        let content = '';
        const a2uiMessages: LegacyA2UIMessage[] = [];

        // v1.0 format: Extract from status message
        if (task.status.message) {
            content = task.status.message.parts
                ?.filter((p: any): p is v1.TextPart => 'text' in p && typeof (p as any).text === 'string')
                ?.map((p: any) => p.text)
                ?.join('\n') ?? '';
        }

        // v0.x format: Extract from history (last agent message)
        // Remote agents like ShowHeroes return the response in history array
        if (!content && task.history && task.history.length > 0) {
            // Find the last agent message in history
            const agentMessages = task.history.filter((m: any) => m.role === 'agent');
            const lastAgentMessage = agentMessages[agentMessages.length - 1];

            if (lastAgentMessage && lastAgentMessage.parts) {
                // Handle both v1.0 (p.text) and v0.x (p.kind === 'text') part formats
                content = lastAgentMessage.parts
                    .filter((p: any) => p.text !== undefined || p.kind === 'text')
                    .map((p: any) => p.text || '')
                    .join('\n');
            }
        }

        // Extract text and A2UI from artifacts
        // Local agents (e.g., Restaurant Finder) return responses in artifacts array
        if (task.artifacts) {
            for (const artifact of task.artifacts) {
                // Extract text from artifact parts (local agent format: parts[].text)
                if (!content && artifact.parts) {
                    for (const part of artifact.parts) {
                        // Handle both {text: string} and {type: 'text', text: string} formats
                        if ('text' in part && typeof (part as any).text === 'string') {
                            content = (part as any).text;
                            break;
                        }
                    }
                }

                // Extract A2UI messages
                if (a2ui.isA2UIArtifact(artifact)) {
                    a2uiMessages.push(...a2ui.extractA2UIMessages(artifact));
                }
            }
        }

        return { content, a2uiMessages };
    }, []);

    // Send message
    const sendMessage = useCallback(async (contentOverride?: string) => {
        const textToSend = typeof contentOverride === 'string' ? contentOverride : inputValue.trim();

        if (!textToSend || !client || isLoading) return;

        console.log('[AgentChatWindow] Sending message...', {
            hasSendText: typeof client.sendText === 'function',
            hasStreamText: typeof client.streamText === 'function',
            clientKeys: Object.keys(client || {})
        });

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: textToSend,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);

        // Only clear input if we sent what was in the box
        if (textToSend === inputValue.trim()) {
            setInputValue('');
        }
        setIsLoading(true);
        setError(null);

        // Add placeholder for agent response
        const agentMessageId = `agent-${Date.now()}`;
        setMessages(prev => [...prev, {
            id: agentMessageId,
            role: 'agent' as const,
            content: '',
            timestamp: new Date(),
            taskState: v1.TaskState.WORKING,
        }]);

        try {
            // First try non-streaming for reliability with remote agents
            // (Many agents advertise streaming:true but don't implement StreamMessage)
            if (typeof client.sendText !== 'function') {
                throw new Error(`Client missing sendText method. Available: ${Object.keys(client || {}).join(', ')}`);
            }


            console.log('[AgentChatWindow] Sending message via sendText...');
            const task = await client.sendText(userMessage.content);
            console.log('[AgentChatWindow] Got task response:', {
                id: task.id,
                state: task.status.state,
                hasHistory: !!(task.history?.length),
                hasStatusMessage: !!task.status.message
            });

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
        } catch (err) {
            console.error('[AgentChatWindow] Send error:', err);

            // Format user-friendly error message
            const formatErrorMessage = (error: unknown): string => {
                const rawMessage = error instanceof Error ? error.message : String(error);

                // Remote server environment errors
                if (rawMessage.includes('Environment is not ready') || rawMessage.includes('Environment error')) {
                    return '🔧 Remote service temporarily unavailable. The external agent is experiencing issues. Please try again later.';
                }

                // Network/connection errors
                if (rawMessage.includes('Failed to fetch') || rawMessage.includes('NetworkError')) {
                    return '🌐 Network error. Please check your connection and try again.';
                }

                // Timeout errors
                if (rawMessage.includes('timeout') || rawMessage.includes('Timeout')) {
                    return '⏱️ Request timed out. The agent took too long to respond.';
                }

                // HTTP errors
                if (rawMessage.includes('HTTP 5')) {
                    return '🔧 Server error. The agent service is experiencing issues.';
                }
                if (rawMessage.includes('HTTP 4')) {
                    return '⚠️ Request error. Please try a different message.';
                }

                // Internal errors from remote servers
                if (rawMessage.includes('Internal error')) {
                    return `⚠️ ${rawMessage.replace('Internal error:', 'Service error:').trim()}`;
                }

                // Default: show the raw message
                return rawMessage;
            };

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
        } finally {
            setIsLoading(false);
        }
    }, [inputValue, client, isLoading, extractTaskContent]);

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Handle A2UI action
    const handleA2UIAction = useCallback(async (actionId: string, data?: unknown) => {
        console.log('[AgentChatWindow] A2UI Action:', actionId, data);

        // If action has an input text, send it as a user message
        const actionData = data as { input?: { text?: string } } | undefined;
        if (actionData?.input?.text) {
            const userMessage: ChatMessage = {
                id: `user-${Date.now()}`,
                role: 'user',
                content: actionData.input.text,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, userMessage]);
            setIsLoading(true);
            setError(null);

            // Add placeholder for agent response
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

                // Send the action text as a message
                const task = await client.sendText(actionData.input.text);
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

            } catch (err) {
                console.error('[AgentChatWindow] Action error:', err);
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
            } finally {
                setIsLoading(false);
            }
        }
    }, [client, extractTaskContent]);

    // Retry connection
    const retryConnection = () => {
    setError(null);
    setClient(null);
    // Re-trigger effect by updating key state
    setMessages([]);
};

const headerTitle = (
    <div className="flex items-center gap-2 pointer-events-auto">
        <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-sm"
            style={{ backgroundColor: `${agent.color}20` }}
        >
            {React.createElement(agent.icon as React.ElementType, { size: 14, className: "text-white" })}
        </div>
        <div className="flex flex-col items-start leading-none gap-0.5">
            <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-white/90">{agent.name}</span>
                {agent.verified && (
                    <span className="px-1 py-px text-[8px] rounded-full bg-blue-500/20 text-blue-400 font-medium">
                        Verified
                    </span>
                )}
            </div>
            {/* Connection Status tiny */}
            <span className={cn(
                'flex items-center gap-1 text-[9px]',
                isConnected ? 'text-green-400/80' : 'text-red-400/80'
            )}>
                <span className={cn(
                    'w-1 h-1 rounded-full',
                    isConnected ? 'bg-green-400' : 'bg-red-400'
                )} />
                {isConnected ? 'Connected' : 'Disconnected'}
            </span>
        </div>
    </div>
);

const headerRight = (
    <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors pointer-events-auto">
        <MoreHorizontal size={16} className="text-white/50" />
    </button>
);

return (
    <GlassWindow
        id={`agent-chat-${agent.id}`}
        title={headerTitle}
        headerRight={headerRight}
        initialPosition={position}
        initialSize={{ width: 750, height: 700 }}
        onClose={onClose}
        onMinimize={onMinimize}
        isActive={isActive}
        onFocus={onFocus}
        className={className}
    >
        {/* Agent-Specific Background (WR-Demo) */}
        {agent.id === 'remote-wr-demo' && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="w-full h-full"
                >
                    <img
                        src="/images/backgrounds/sticklikov-retro.png"
                        alt=""
                        className="w-full h-full object-cover opacity-50"
                    />
                    {/* Gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60" />
                </motion.div>
            </div>
        )}

        <motion.div
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{
                type: "spring",
                damping: 20,
                stiffness: 100,
                delay: 0.1
            }}
            className="flex flex-col h-full -m-4 relative z-10 perspective-1000"
            style={{ transformStyle: 'preserve-3d', transformOrigin: 'center center' }}
        >
            {/* Messages Area - Header removed (moved to window title) */}
            <div className="flex-1 overflow-y-auto px-8 py-4 space-y-4 custom-scrollbar mt-4">
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
                {messages.map((message) => (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        agentIcon={agent.icon}
                        agentColor={agent.color}
                        onA2UIAction={handleA2UIAction}
                        isRetroStyle={agent.id === 'remote-wr-demo'}
                    />
                ))}

                {/* Loading indicator */}
                <AnimatePresence>
                    {isLoading && messages[messages.length - 1]?.content === '' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2 text-white/40 text-sm"
                        >
                            <Loader2 size={14} className="animate-spin" />
                            <span>{agent.name} is thinking...</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={cn(
                "px-6 pb-6 pt-4", // Removed border-t, increased padding
                agent.id === 'remote-wr-demo' ? "bg-black/60 backdrop-blur-md" : "bg-white/5"
            )}>
                <div className="flex items-center gap-2">
                    <button
                        className="p-3 rounded-xl hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                        title="Attach file"
                    >
                        <Paperclip size={20} />
                    </button>
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={isConnected ? `Message ${agent.name}...` : 'Connecting...'}
                            disabled={!isConnected || isLoading}
                            className={cn(
                                'w-full px-5 py-4 rounded-2xl transition-all', // Increased padding and rounding
                                'text-white placeholder:text-white/30',
                                'focus:outline-none focus:border-white/20',
                                agent.id === 'remote-wr-demo'
                                    ? 'bg-black/50 border border-white/20 focus:bg-black/70'
                                    : 'bg-white/5 border border-white/10 focus:bg-white/10',
                                (!isConnected || isLoading) && 'opacity-50 cursor-not-allowed'
                            )}
                        />
                    </div>
                    <button
                        className="p-3 rounded-xl hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                        title="Voice input"
                    >
                        <Mic size={20} />
                    </button>
                    <motion.button
                        onClick={sendMessage}
                        disabled={!inputValue.trim() || !isConnected || isLoading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                            'p-4 rounded-xl transition-all', // Larger button
                            inputValue.trim() && isConnected && !isLoading
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                                : 'bg-white/5 text-white/30 cursor-not-allowed'
                        )}
                    >
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <Send size={20} />
                        )}
                    </motion.button>
                </div>

                {/* Capabilities hint */}
                {isConnected && (
                    <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-white/30">
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
        </motion.div>
    </GlassWindow>
);
};

// ============================================================================
// Message Bubble Component
// ============================================================================

const MessageBubble: React.FC<{
    message: ChatMessage;
    agentIcon: React.ElementType;
    agentColor?: string;
    onA2UIAction: (actionId: string, data?: unknown) => void;
    isRetroStyle?: boolean;
}> = ({ message, agentIcon: AgentIcon, agentColor, onA2UIAction, isRetroStyle }) => {
    const isUser = message.role === 'user';
    const isError = message.taskState === 'failed' || !!message.error;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'flex gap-3',
                isUser && 'flex-row-reverse'
            )}
        >
            {/* Avatar */}
            <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                isUser
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-lg'
            )}
                style={{
                    backgroundColor: !isUser ? `${agentColor}20` : undefined
                }}
            >
                {isUser ? <User size={16} /> : <AgentIcon size={16} className="text-white" />}
            </div>

            {/* Content */}
            <div className={cn(
                'flex-1 max-w-[80%]',
                isUser && 'flex flex-col items-end'
            )}>
                {/* Text Content */}
                {message.content && (
                    <div className={cn(
                        'px-5 py-4 rounded-2xl backdrop-blur-sm',
                        isUser
                            ? 'bg-indigo-500/20 text-white rounded-tr-md'
                            : cn(
                                'text-white/90 rounded-tl-md border relative group',
                                isRetroStyle
                                    ? 'bg-black/60 border-white/20 shadow-lg'
                                    : 'bg-white/5 border-white/10 text-white/80'
                            ),
                        isError && 'border-red-500/30 bg-red-500/10'
                    )}>
                        <div className={cn(
                            "text-sm prose prose-invert max-w-none",
                            "prose-p:leading-relaxed prose-p:mb-4 last:prose-p:mb-0",
                            "prose-headings:font-semibold prose-headings:text-white prose-headings:mb-2 prose-headings:mt-4",
                            "prose-pre:bg-black/30 prose-pre:rounded-lg prose-pre:p-3 prose-pre:border prose-pre:border-white/10",
                            "prose-code:text-indigo-300 prose-code:bg-white/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
                            "prose-ul:my-2 prose-li:my-1"
                        )}>
                            <SmartMessageContent content={message.content} />
                        </div>

                        {!isUser && !message.error && (
                            <SuggestedActions
                                content={message.content}
                                onAction={(action) => onA2UIAction('suggested_reply', action)}
                            />
                        )}
                    </div>
                )}

                {/* Error Message */}
                {message.error && (
                    <div className="mt-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-sm text-red-400">{message.error}</p>
                    </div>
                )}

                {/* A2UI Content */}
                {message.a2ui && message.a2ui.length > 0 && (
                    <div className="mt-3 w-full">
                        <GlassA2UIRenderer
                            messages={message.a2ui}
                            onAction={onA2UIAction}
                            className="rounded-xl overflow-hidden"
                        />
                    </div>
                )}

                {/* Timestamp */}
                <div className={cn(
                    'mt-1 text-[10px] text-white/30',
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

export default AgentChatWindow;
