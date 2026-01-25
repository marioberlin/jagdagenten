import React, { useState, useMemo } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { Send, Bot } from 'lucide-react';
import { GeminiProxyService } from '../../services/proxy/gemini';
import { ClaudeProxyService, CLAUDE_MODELS, ClaudeModelId } from '../../services/proxy/claude';
import { useLiquidClient } from '../../liquid-engine/react';
import { useLocation } from 'react-router-dom';
import { useAgentConfig } from '../../context/AgentConfigContext';


// Provider types
type Provider = 'gemini' | 'claude';

// Gemini models
const GEMINI_MODELS = {
    'gemini-2.0-flash': 'Gemini 2.0 Flash',
    'gemini-1.5-flash': 'Gemini 1.5 Flash',
    'gemini-1.5-pro': 'Gemini 1.5 Pro',
} as const;

type GeminiModelId = keyof typeof GEMINI_MODELS;

interface AgSidebarProps {
    apiKey?: string;
    claudeApiKey?: string;
    initialService?: any; // Allow injecting a custom service (like an A2A agent client)
}

export const AgSidebar: React.FC<AgSidebarProps> = ({
    apiKey: _apiKey = '',
    claudeApiKey = '',
    initialService
}) => {
    const client = useLiquidClient();
    const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Provider and model selection
    const [provider, setProvider] = useState<Provider>(() => {
        // Default to Claude if Claude key is available, otherwise Gemini
        return claudeApiKey ? 'claude' : 'gemini';
    });
    const [geminiModel, setGeminiModel] = useState<GeminiModelId>("gemini-2.0-flash");
    const [claudeModel, setClaudeModel] = useState<ClaudeModelId>("claude-opus-4-5-20251101");

    // Agent Config Integration
    const location = useLocation();
    const { getConfigForRoute, runtimeMode: _runtimeMode } = useAgentConfig();

    React.useEffect(() => {
        const config = getConfigForRoute(location.pathname);
        if (!config.systemPrompt && (!config.knowledge || config.knowledge.length === 0)) return;

        const fileSearchStores = config.fileSearch?.enabled ? config.fileSearch.stores : [];

        const unregister = client.registerReadable({
            id: 'agent_configuration',
            description: 'CRITICAL: System Instructions and Knowledge Base for the current page',
            value: {
                current_page: location.pathname,
                system_instructions: config.systemPrompt,
                knowledge_base: config.knowledge,
                file_search_stores: fileSearchStores,
            }
        });

        return () => unregister();
    }, [location.pathname, getConfigForRoute, client]);

    // Initialize services (Factory Pattern)
    const geminiService = useMemo(() => {
        // Updated to prefer Server Proxy for all modes (Demo & Production) to avoid exposing VITE keys
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
        return new GeminiProxyService(client, baseUrl);
    }, [client]);

    const claudeService = useMemo(() => {
        try {
            // Always use proxy service to avoid exposing API keys
            const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
            return new ClaudeProxyService(client, baseUrl);
        } catch (e) {
            console.error("Failed to init ClaudeProxyService:", e);
            return null;
        }
    }, [client]);


    // Get current service and model
    const currentService = initialService || (provider === 'gemini' ? geminiService : claudeService);


    // Update service models when selection changes
    React.useEffect(() => {
        if (geminiService) {
            geminiService.setModel(geminiModel);
        }
    }, [geminiModel, geminiService]);

    React.useEffect(() => {
        if (claudeService) {
            claudeService.setModel(claudeModel);
        }
    }, [claudeModel, claudeService]);

    // Determine which models to show based on provider
    const availableModels = provider === 'gemini' ? GEMINI_MODELS : CLAUDE_MODELS;
    const currentModel = provider === 'gemini' ? geminiModel : claudeModel;
    const setCurrentModel = provider === 'gemini'
        ? (v: string) => setGeminiModel(v as GeminiModelId)
        : (v: string) => setClaudeModel(v as ClaudeModelId);

    const handleSend = async () => {
        if (!inputValue.trim() || isSending) return;

        // We now default to Proxy, so we don't strictly need a client-side API key.
        // If the service is initialized (which it should be via Proxy), we proceed.
        if (!currentService) {
            setMessages(prev => [...prev, { role: 'user', text: inputValue }]);
            setMessages(prev => [...prev, { role: 'model', text: "Error: Service not initialized. Check server connection." }]);
            setInputValue('');
            return;
        }

        const text = inputValue;
        setInputValue('');
        setIsSending(true);

        setMessages(prev => [...prev, { role: 'user', text }]);

        try {
            const responseText = await currentService.sendMessage(text);
            setMessages(prev => [...prev, { role: 'model', text: responseText || "Done! Check the main view." }]);
        } catch (e: any) {
            const errorMsg = e?.message?.includes('429') || e?.message?.includes('quota')
                ? "API quota exceeded. Try again later or switch providers."
                : "Error sending message.";
            setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <GlassContainer className="w-80 h-full flex flex-col border-l border-white/10 bg-black/20 backdrop-blur-xl">
            <div className="p-4 border-b border-white/5 flex flex-col space-y-3">
                <div className="flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-white">Liquid Copilot</span>
                </div>
            </div>

            {/* Provider & Model Selector */}
            <div className="px-4 py-2 space-y-2 border-b border-white/5">
                {/* Provider Toggle */}
                <div className="flex rounded-lg overflow-hidden border border-white/10">
                    <button
                        onClick={() => setProvider('gemini')}
                        className={`flex-1 py-1.5 text-xs font-medium transition-colors ${provider === 'gemini'
                            ? 'bg-blue-500/20 text-blue-400 border-r border-white/10'
                            : 'bg-black/20 text-gray-400 hover:bg-white/5 border-r border-white/10'
                            }`}
                    >
                        Gemini
                    </button>
                    <button
                        onClick={() => setProvider('claude')}
                        className={`flex-1 py-1.5 text-xs font-medium transition-colors ${provider === 'claude'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-black/20 text-gray-400 hover:bg-white/5'
                            }`}
                    >
                        Claude
                    </button>
                </div>

                {/* Model Dropdown */}
                <select
                    value={currentModel}
                    onChange={(e) => setCurrentModel(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded text-xs text-gray-300 py-1.5 px-2 focus:outline-none focus:border-primary/50"
                >
                    {Object.entries(availableModels).map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                    ))}
                </select>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 text-sm mt-10">
                        <>
                            Ask {provider === 'gemini' ? 'Gemini' : 'Claude'} to help.<br />
                            Try: "Fill the form with sample data"
                        </>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.role === 'user'
                            ? 'bg-primary/20 text-white border border-primary/20'
                            : 'bg-white/5 text-gray-300 border border-white/5'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}

                {isSending && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 text-gray-400 border border-white/5 p-3 rounded-lg text-xs italic flex items-center space-x-2">
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                            <span>Generating...</span>
                        </div>
                    </div>
                )}

            </div>



            <div className="p-4 border-t border-white/5">
                <div className="relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a command..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-4 pr-10 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                        disabled={isSending}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isSending}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-md transition-colors disabled:opacity-50"
                    >
                        <Send className="w-4 h-4 text-primary" />
                    </button>
                </div>
            </div>
        </GlassContainer>
    );
};
