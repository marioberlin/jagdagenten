import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Loader2,
    User,
    Sparkles,
    AlertCircle,
    Paperclip,
    Mic,
    MoreHorizontal,
    RefreshCcw,
} from 'lucide-react';
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

/**
 * AgentChatWindow
 *
 * A beautiful chat window for conversing with A2A agents.
 * Renders in a GlassWindow with full A2UI support.
 */
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
                const newClient = createA2AClient({
                    baseUrl: agent.url,
                    authToken,
                    enableA2UI: true,
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
    const extractTaskContent = useCallback((task: v1.Task): { content: string; a2uiMessages: LegacyA2UIMessage[] } => {
        let content = '';
        const a2uiMessages: LegacyA2UIMessage[] = [];

        // Extract from status message
        if (task.status.message) {
            content = client?.extractText(task.status.message) ?? '';
        }

        // Extract A2UI from artifacts
        if (task.artifacts) {
            for (const artifact of task.artifacts) {
                if (a2ui.isA2UIArtifact(artifact)) {
                    a2uiMessages.push(...a2ui.extractA2UIMessages(artifact));
                }
            }
        }

        return { content, a2uiMessages };
    }, [client]);

    // Send message
    const sendMessage = useCallback(async () => {
        if (!inputValue.trim() || !client || isLoading) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
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
            // Check if agent supports streaming
            const card = await client.getAgentCard();
            const supportsStreaming = card.capabilities?.streaming;

            if (supportsStreaming) {
                // Use streaming with new SDK API
                let a2uiMessages: LegacyA2UIMessage[] = [];

                for await (const event of client.streamText(userMessage.content)) {
                    if (event.type === 'complete') {
                        // Final task received
                        const { content, a2uiMessages: msgs } = extractTaskContent(event.task);
                        setMessages(prev => prev.map(msg =>
                            msg.id === agentMessageId
                                ? {
                                    ...msg,
                                    content: content || 'Task completed.',
                                    a2ui: msgs.length > 0 ? msgs : undefined,
                                    taskState: event.task.status.state
                                }
                                : msg
                        ));
                    } else if (event.type === 'status') {
                        // Status update
                        setMessages(prev => prev.map(msg =>
                            msg.id === agentMessageId
                                ? { ...msg, taskState: event.data.status.state }
                                : msg
                        ));
                    } else if (event.type === 'artifact') {
                        // Artifact update - extract A2UI
                        if (a2ui.isA2UIArtifact(event.data.artifact)) {
                            a2uiMessages = [...a2uiMessages, ...a2ui.extractA2UIMessages(event.data.artifact)];
                            setMessages(prev => prev.map(msg =>
                                msg.id === agentMessageId
                                    ? { ...msg, a2ui: a2uiMessages }
                                    : msg
                            ));
                        }
                    } else if (event.type === 'error') {
                        // Stream error
                        setMessages(prev => prev.map(msg =>
                            msg.id === agentMessageId
                                ? {
                                    ...msg,
                                    content: '',
                                    error: event.error.message,
                                    taskState: v1.TaskState.FAILED
                                }
                                : msg
                        ));
                    }
                }
            } else {
                // Non-streaming request
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
            }
        } catch (err) {
            console.error('[AgentChatWindow] Send error:', err);
            setMessages(prev => prev.map(msg =>
                msg.id === agentMessageId
                    ? {
                        ...msg,
                        content: '',
                        error: err instanceof Error ? err.message : 'Failed to get response',
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

    return (
        <GlassWindow
            id={`agent-chat-${agent.id}`}
            title={agent.name}
            initialPosition={position}
            initialSize={{ width: 500, height: 650 }}
            onClose={onClose}
            onMinimize={onMinimize}
            isActive={isActive}
            onFocus={onFocus}
            className={className}
        >
            <div className="flex flex-col h-full -m-4">
                {/* Agent Header */}
                <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/5">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${agent.color}20` }}
                    >
                        {React.createElement(agent.icon as React.ElementType, { size: 24, className: "text-white" })}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-white truncate">{agent.name}</span>
                            {agent.verified && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-400">
                                    Verified
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className={cn(
                                'flex items-center gap-1',
                                isConnected ? 'text-green-400' : 'text-red-400'
                            )}>
                                <span className={cn(
                                    'w-1.5 h-1.5 rounded-full',
                                    isConnected ? 'bg-green-400' : 'bg-red-400'
                                )} />
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </span>
                            {agent.capabilities.streaming && (
                                <span className="text-white/40">Streaming</span>
                            )}
                        </div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <MoreHorizontal size={18} className="text-white/50" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
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
                <div className="p-4 border-t border-white/10 bg-white/5">
                    <div className="flex items-center gap-2">
                        <button
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                            title="Attach file"
                        >
                            <Paperclip size={18} />
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
                                    'w-full px-4 py-3 rounded-xl',
                                    'bg-white/5 border border-white/10',
                                    'text-white placeholder:text-white/30',
                                    'focus:outline-none focus:border-white/20 focus:bg-white/10',
                                    'transition-all',
                                    (!isConnected || isLoading) && 'opacity-50 cursor-not-allowed'
                                )}
                            />
                        </div>
                        <button
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                            title="Voice input"
                        >
                            <Mic size={18} />
                        </button>
                        <motion.button
                            onClick={sendMessage}
                            disabled={!inputValue.trim() || !isConnected || isLoading}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                                'p-3 rounded-xl transition-all',
                                inputValue.trim() && isConnected && !isLoading
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                            )}
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Send size={18} />
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
        </GlassWindow>
    );
};

// ============================================================================
// Message Bubble Component
// ============================================================================

const MessageBubble: React.FC<{
    message: ChatMessage;
    agentIcon: React.ElementType; // Changed from string
    agentColor?: string;
    onA2UIAction: (actionId: string, data?: unknown) => void;
}> = ({ message, agentIcon: AgentIcon, agentColor, onA2UIAction }) => {
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
                        'px-4 py-3 rounded-2xl',
                        isUser
                            ? 'bg-indigo-500/20 text-white rounded-tr-md'
                            : 'bg-white/5 border border-white/10 text-white/80 rounded-tl-md',
                        isError && 'border-red-500/30 bg-red-500/10'
                    )}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
