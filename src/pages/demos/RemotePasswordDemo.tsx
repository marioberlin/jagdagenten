import React, { useMemo, useState, useCallback } from 'react';
import { RemoteAgentService } from '@/services/a2a/RemoteAgentService';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { GlassButton } from '@/components/primitives/GlassButton';
import { Send, Key, Loader2 } from 'lucide-react';

// Use local proxy to bypass CORS (see vite.config.ts)
const REMOTE_URL = '/remote-a2a';
const REMOTE_TOKEN = ''; // Handled by Vite proxy

interface ChatMessage {
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
}

const RemotePasswordDemo: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'agent',
            content: "Hello! I'm the Password Generator Agent. Ask me to generate a secure password for you!",
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Initialize the remote service
    const remoteService = useMemo(() => {
        return new RemoteAgentService(REMOTE_URL, REMOTE_TOKEN, 'demo-session');
    }, []);

    const sendMessage = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await remoteService.sendMessage(userMessage.content);

            const agentMessage: ChatMessage = {
                id: `agent-${Date.now()}`,
                role: 'agent',
                content: response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, agentMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                role: 'agent',
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, remoteService]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex h-screen w-full bg-[#050510] text-white">
            <div className="flex-1 flex flex-col max-w-3xl mx-auto p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4">
                        <Key className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-light tracking-tight">
                        Remote <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 font-medium">Password Agent</span>
                    </h1>
                    <div className="flex items-center justify-center gap-2 mt-2 text-xs text-white/40">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        Connected to {REMOTE_URL}
                    </div>
                </div>

                {/* Chat Messages - 2/3 screen height, scrollable */}
                <GlassContainer className="max-h-[66vh] overflow-y-auto p-4 space-y-4 mb-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                                    : 'bg-white/10 text-white/90'
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                <p className="text-[10px] opacity-50 mt-1">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                                <span className="text-sm text-white/60">Generating...</span>
                            </div>
                        </div>
                    )}
                </GlassContainer>

                {/* Input Area */}
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Ask for a password... (e.g., 'Generate a 16-character password')"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                        disabled={isLoading}
                    />
                    <GlassButton
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        className="px-4"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </GlassButton>
                </div>
            </div>
        </div>
    );
};

export default RemotePasswordDemo;
