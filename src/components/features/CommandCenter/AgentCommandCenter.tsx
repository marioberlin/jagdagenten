import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentConfig } from '@/context/AgentConfigContext';
import { Activity, Cpu, Shield, Zap, Search, AlertTriangle, Send, Loader2, X, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ServiceInfoTooltip } from './ServiceInfoTooltip';
import { useServiceHealth, type ServiceHealthStatus } from '@/hooks/useServiceHealth';
import { SERVICE_DESCRIPTIONS } from '@/data/serviceDescriptions';
import { useLiquidAssistant } from '@/hooks/useLiquidAssistant';
import { useA2AVoice } from '@/hooks/useA2AVoice';
import { VoiceWaveform } from '@/components/primitives/VoiceWaveform';
import { useWakeWord } from '@/hooks/useWakeWord';
import { useWakeWordStore } from '@/stores/wakeWordStore';

/**
 * AgentCommandCenter
 * 
 * The central dashboard for the Spatial OS (Home Screen).
 * Displays system health, active agents, and an AI assistant chat.
 */
export const AgentCommandCenter: React.FC = () => {
    const { runtimeMode, llmProvider } = useAgentConfig();
    const { services, isRequiredUnhealthy } = useServiceHealth();
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [showChat, setShowChat] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const { messages, isLoading, sendMessage, clearMessages } = useLiquidAssistant();

    // Voice integration for hands-free input
    // Note: contextId must be a valid UUID for database storage
    const voice = useA2AVoice({
        contextId: '00000000-0000-4000-8000-000000000001', // Stable UUID for dashboard voice context
        onTranscript: (text) => {
            setInputValue(prev => prev + text);
        },
        onStateChange: (state) => {
            console.log('[Dashboard Voice] State:', state);
        },
    });

    // Wake word detection - activates voice when "Hey Liquid" is detected
    const wakeWordEnabled = useWakeWordStore((s) => s.enabled);
    const wakeWordTrained = useWakeWordStore((s) => s.isTrained);
    const wakeWordThreshold = useWakeWordStore((s) => s.threshold);
    const setWakeWordListeningState = useWakeWordStore((s) => s.setListeningState);

    // Callback when wake word detected - activate voice
    const handleWakeWordDetected = useCallback(() => {
        console.log('[Dashboard] Wake word detected! Activating voice...');
        setWakeWordListeningState('detected');
        // Small delay for visual feedback, then start voice
        setTimeout(() => {
            if (!voice.isActive) {
                voice.start();
            }
            setWakeWordListeningState('listening');
        }, 300);
    }, [voice, setWakeWordListeningState]);

    const { state: wakeWordState, startListening, stopListening } = useWakeWord({
        onWakeWord: handleWakeWordDetected,
        onStateChange: (state) => {
            console.log('[Dashboard Wake Word] State:', state);
            // Sync to global store
            if (state === 'listening') setWakeWordListeningState('listening');
            else if (state === 'loading') setWakeWordListeningState('loading');
            else if (state === 'error') setWakeWordListeningState('error');
            else if (state === 'ready') setWakeWordListeningState('idle');
        },
        config: {
            enabled: wakeWordEnabled && wakeWordTrained,
            threshold: wakeWordThreshold,
        },
    });

    // Auto-start wake word listening when enabled and trained
    useEffect(() => {
        if (wakeWordEnabled && wakeWordTrained && wakeWordState === 'ready') {
            console.log('[Dashboard] Starting wake word listening...');
            startListening();
        }
    }, [wakeWordEnabled, wakeWordTrained, wakeWordState, startListening]);

    // Stop wake word listening when voice is active
    useEffect(() => {
        if (voice.isActive && wakeWordState === 'listening') {
            stopListening();
        } else if (!voice.isActive && wakeWordEnabled && wakeWordTrained && wakeWordState === 'ready') {
            startListening();
        }
    }, [voice.isActive, wakeWordEnabled, wakeWordTrained, wakeWordState, startListening, stopListening]);

    // Determine overall system status based on health checks
    const getSystemStatus = () => {
        if (isRequiredUnhealthy) return { value: 'Degraded', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
        return { value: 'Operational', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    };

    const systemStatus = getSystemStatus();
    const runtimeHealth = services['liquid-runtime']?.status || 'unknown';

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const prompt = inputValue.trim();
        setInputValue('');
        setShowChat(true);
        await sendMessage(prompt);
    };

    // Handle ⌘K shortcut - dispatch event for command palette
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
        }
    };

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleClearChat = () => {
        clearMessages();
        setShowChat(false);
        setInputValue('');
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-4xl"
            >
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 tracking-tight mb-4 translate-x-3">
                        Liquid OS <span className="text-xl align-top opacity-50 font-mono">v2.0</span>
                    </h1>
                    <p className="text-xl text-white/60 font-light translate-y-[-10px]">
                        Experimental Agentic Operating System initialized
                    </p>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-4 gap-6 mb-12">
                    <StatusCard
                        icon={Zap}
                        label="System Status"
                        value={systemStatus.value}
                        color={systemStatus.color}
                        bg={systemStatus.bg}
                        serviceId="system"
                        isHovered={hoveredCard === 'System Status'}
                        onHover={setHoveredCard}
                        healthStatus={isRequiredUnhealthy ? 'unhealthy' : 'healthy'}
                        showWarning={isRequiredUnhealthy}
                        allServices={services}
                    />
                    <StatusCard
                        icon={Cpu}
                        label="AI Core"
                        value={llmProvider.toUpperCase()}
                        color="text-blue-400"
                        bg="bg-blue-500/10"
                        serviceId="ai-core"
                        isHovered={hoveredCard === 'AI Core'}
                        onHover={setHoveredCard}
                    />
                    <StatusCard
                        icon={Shield}
                        label="Runtime"
                        value={runtimeMode === 'production' ? 'LIVE' : 'SANDBOX'}
                        color={runtimeHealth === 'unhealthy' ? 'text-red-400' :
                            runtimeMode === 'production' ? 'text-red-400' : 'text-yellow-400'}
                        bg={runtimeHealth === 'unhealthy' ? 'bg-red-500/10' :
                            runtimeMode === 'production' ? 'bg-red-500/10' : 'bg-yellow-500/10'}
                        serviceId="liquid-runtime"
                        isHovered={hoveredCard === 'Runtime'}
                        onHover={setHoveredCard}
                        healthStatus={runtimeHealth}
                        showWarning={runtimeHealth === 'unhealthy'}
                        allServices={services}
                    />
                    <StatusCard
                        icon={Activity}
                        label="Network"
                        value="Connected"
                        color="text-purple-400"
                        bg="bg-purple-500/10"
                        serviceId="network"
                        isHovered={hoveredCard === 'Network'}
                        onHover={setHoveredCard}
                    />
                </div>

                {/* Chat Response Panel */}
                <AnimatePresence>
                    {showChat && messages.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4"
                        >
                            <div className="relative rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                                {/* Chat Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-cyan-400" />
                                        <span className="text-sm font-medium text-white/80">Liquid AI Assistant</span>
                                    </div>
                                    <button
                                        onClick={handleClearChat}
                                        className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                        aria-label="Clear chat"
                                    >
                                        <X className="w-4 h-4 text-white/40 hover:text-white/60" />
                                    </button>
                                </div>

                                {/* Messages */}
                                <div
                                    ref={chatContainerRef}
                                    className="max-h-[300px] overflow-y-auto p-4 space-y-4"
                                >
                                    {messages.map((message) => (
                                        <motion.div
                                            key={message.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "flex gap-3",
                                                message.role === 'user' && "justify-end"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "rounded-xl px-4 py-3 max-w-[80%]",
                                                    message.role === 'user'
                                                        ? "bg-cyan-500/20 text-white"
                                                        : "bg-white/10 text-white/90"
                                                )}
                                            >
                                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                                    {message.content}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* Loading indicator */}
                                    {isLoading && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center gap-2 text-white/40"
                                        >
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="text-sm">Thinking...</span>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Search / Command Prompt - Now Active Input */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <form onSubmit={handleSubmit}>
                        <div className="relative w-full flex items-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-4 flex-1">
                                {isLoading ? (
                                    <Loader2 className="text-cyan-400 animate-spin" />
                                ) : (
                                    <Search className="text-white/40" />
                                )}
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask Liquid AI anything..."
                                    className="flex-1 bg-transparent text-xl text-white placeholder-white/40 font-light outline-none"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                {inputValue.trim() && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        type="submit"
                                        disabled={isLoading}
                                        className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg transition-colors"
                                    >
                                        <Send className="w-5 h-5 text-cyan-400" />
                                    </motion.button>
                                )}
                                {/* Voice button with waveform icons */}
                                <button
                                    type="button"
                                    onClick={() => voice.isActive ? voice.stop() : voice.start()}
                                    disabled={isLoading}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-all flex items-center justify-center",
                                        voice.state === 'listening' && "bg-cyan-500/20 animate-pulse",
                                        voice.state === 'speaking' && "bg-amber-500/20",
                                        voice.state === 'connecting' && "bg-blue-500/20",
                                        voice.state === 'error' && "bg-red-500/20",
                                        voice.state === 'idle' && "bg-white/5 hover:bg-white/10 opacity-60 hover:opacity-100"
                                    )}
                                    aria-label={voice.isActive ? "Stop voice" : "Start voice"}
                                >
                                    {voice.state === 'connecting' ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                                    ) : (
                                        <VoiceWaveform state={voice.state} />
                                    )}
                                </button>
                                <div className="flex gap-2 ml-2">
                                    <kbd className="px-2 py-1 rounded bg-black/40 border border-white/10 text-xs text-white/60 font-mono">⌘</kbd>
                                    <kbd className="px-2 py-1 rounded bg-black/40 border border-white/10 text-xs text-white/60 font-mono">K</kbd>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Recent Modules - Placeholder suggestion */}
                <div className="mt-12 flex justify-center gap-6 text-sm text-white/30">
                    <span>Press <kbd className="font-mono text-white/50">Enter</kbd> to ask Liquid AI</span>
                    <span>•</span>
                    <span><kbd className="font-mono text-white/50">⌘K</kbd> for Command Palette</span>
                </div>
            </motion.div>
        </div>
    );
};

interface StatusCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
    bg: string;
    serviceId?: string;
    isHovered?: boolean;
    onHover?: (label: string | null) => void;
    healthStatus?: ServiceHealthStatus['status'];
    showWarning?: boolean;
    allServices?: Record<string, ServiceHealthStatus>;
}

const StatusCard: React.FC<StatusCardProps> = ({
    icon: Icon,
    label,
    value,
    color,
    bg,
    serviceId,
    isHovered,
    onHover,
    healthStatus = 'unknown',
    showWarning = false,
    allServices,
}) => {
    const service = serviceId ? SERVICE_DESCRIPTIONS[serviceId] : null;

    return (
        <div
            className="relative"
            onMouseEnter={() => onHover?.(label)}
            onMouseLeave={() => onHover?.(null)}
        >
            <div className={cn(
                "flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border backdrop-blur-sm transition-all duration-200",
                showWarning ? "border-yellow-500/30" : "border-white/5",
                isHovered && "border-white/20 bg-white/10"
            )}>
                <div className={cn("p-3 rounded-xl mb-3 relative", bg, color)}>
                    <Icon size={24} />
                    {showWarning && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                            <AlertTriangle size={10} className="text-black" />
                        </div>
                    )}
                </div>
                <div className="text-sm text-white/40 font-medium mb-1">{label}</div>
                <div className={cn("text-lg font-bold tracking-wide", color)}>{value}</div>
            </div>

            {/* Tooltip */}
            {service && (
                <ServiceInfoTooltip
                    service={service}
                    isVisible={isHovered || false}
                    healthStatus={healthStatus}
                    position="bottom"
                    allServices={allServices}
                />
            )}
        </div>
    );
};

