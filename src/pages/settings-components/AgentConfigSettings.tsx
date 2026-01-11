import { GlassContainer, GlassButton, GlassInput, GlassTextarea } from '@/components';
import { useAgentConfig, FileSearchConfig } from '../../context/AgentConfigContext';
import { Bot, Plus, X, Save, RotateCcw, Copy, Check } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { GeminiService } from '../../services/gemini';
import { useOptionalLiquidClient } from '../../liquid-engine/react';
import { GlassFileSearch } from '../../components/generative/GlassFileSearch';

// Hardcoded list of demos for now, could be dynamic
const DEMO_ROUTES = [
    { title: 'Generative Showcase', route: '/demos/generative' },
    { title: 'Generative Extensions', route: '/demos/generative-extensions' },
    { title: 'Form Copilot', route: '/demos/copilot-form' },
    { title: 'Dynamic Dashboard', route: '/demos/dynamic-dashboard' },
    { title: 'State Machine', route: '/demos/state-machine' },
    { title: 'Q&A Agent', route: '/demos/qa-agent' },
    { title: 'Research Canvas', route: '/demos/research-canvas' },
    { title: 'Travel Planner', route: '/demos/travel-planner' },
    { title: 'AI Researcher', route: '/demos/ai-researcher' },
];

const JsonCodeEditor = ({ value, onChange, onRemove, onRefine }: { value: string, onChange: (val: string) => void, onRemove: () => void, onRefine: (refinement: string) => Promise<void> }) => {
    const [copied, setCopied] = useState(false);
    const [showRefine, setShowRefine] = useState(false);
    const [refineText, setRefineText] = useState('');
    const [isRefining, setIsRefining] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRefineSubmit = async () => {
        if (!refineText.trim()) return;
        setIsRefining(true);
        await onRefine(refineText);
        setIsRefining(false);
        setRefineText('');
        setShowRefine(false);
    };

    return (
        <div className="flex gap-2 items-start w-full">
            <GlassContainer className="flex-1 overflow-hidden group border border-white/10 bg-black/40">
                {/* Header mimicking GlassCode */}
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                    <span className="text-xs text-gray-400 font-mono">JSON-LD Context</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowRefine(!showRefine)}
                            className={`p-1.5 rounded-md transition-colors ${showRefine ? 'bg-primary/20 text-white' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                            title="Add info to this block"
                        >
                            <Plus size={12} />
                        </button>
                        <button
                            onClick={handleCopy}
                            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white"
                            title="Copy JSON"
                        >
                            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        </button>
                    </div>
                </div>

                {/* Refinement Input */}
                {showRefine && (
                    <div className="p-2 border-b border-white/10 bg-white/5 flex gap-2">
                        <GlassInput
                            autoFocus
                            value={refineText}
                            onChange={(e) => setRefineText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRefineSubmit()}
                            placeholder="Add more context (e.g. 'Also, he lives in Berlin')..."
                            className="flex-1 h-8 text-xs"
                        />
                        <GlassButton
                            size="sm"
                            onClick={handleRefineSubmit}
                            disabled={isRefining}
                            className="h-8 px-3"
                        >
                            {isRefining ? <RotateCcw className="animate-spin w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        </GlassButton>
                    </div>
                )}

                {/* Editor Area */}
                <GlassTextarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="JSON-LD Content..."
                    className="w-full font-mono text-xs min-h-[150px] bg-transparent border-0 focus:ring-0 rounded-none resize-y p-4 text-gray-300"
                />
            </GlassContainer>
            <button
                onClick={onRemove}
                className="p-2 mt-2 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export const AgentConfigSettings = () => {
    const { getConfigForRoute, updatePageConfig, contextStrategy, setContextStrategy, runtimeMode, setRuntimeMode, nlwebMode, setNLWebMode, llmProvider, setLLMProvider, claudeApiKey, setClaudeApiKey, securityBlacklist, setSecurityBlacklist } = useAgentConfig();
    const [selectedRoute, setSelectedRoute] = useState(DEMO_ROUTES[0].route);
    const [systemPrompt, setSystemPrompt] = useState('');
    const [knowledge, setKnowledge] = useState<string[]>([]);
    const [fileSearchConfig, setFileSearchConfig] = useState<FileSearchConfig | undefined>(undefined);
    const [hasChanges, setHasChanges] = useState(false);

    const client = useOptionalLiquidClient();
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

    // Initialize Gemini Service for File Search operations
    const geminiService = useMemo(() => {
        if (!apiKey) return null;

        // Mock client if not provided (e.g. in Settings page)
        const targetClient = client || ({
            getActions: () => [],
            buildContextPrompt: () => "",
            ingest: () => { },
            executeAction: async () => ({})
        } as any);

        try {
            return new GeminiService(apiKey, targetClient);
        } catch (e) {
            console.error("Failed to init GeminiService in Settings:", e);
            return null;
        }
    }, [apiKey, client]);

    // Initialize ref with current route to track changes
    const prevRouteRef = React.useRef(selectedRoute);

    // Load config when route changes
    useEffect(() => {
        const routeChanged = prevRouteRef.current !== selectedRoute;

        if (routeChanged || !hasChanges) {
            const config = getConfigForRoute(selectedRoute);
            setSystemPrompt(config.systemPrompt || '');
            setKnowledge(config.knowledge || []);
            setFileSearchConfig(config.fileSearch);
            setHasChanges(false);

            prevRouteRef.current = selectedRoute;
        }
    }, [selectedRoute, getConfigForRoute, hasChanges]);

    const handleSave = () => {
        updatePageConfig(selectedRoute, {
            systemPrompt,
            knowledge,
            fileSearch: fileSearchConfig
        });
        setHasChanges(false);
    };

    const handleReset = () => {
        const config = getConfigForRoute(selectedRoute);
        setSystemPrompt(config.systemPrompt || '');
        setKnowledge(config.knowledge || []);
        setFileSearchConfig(config.fileSearch);
        setHasChanges(false);
    };

    const addKnowledgeItem = () => {
        setKnowledge([...knowledge, '']);
        setHasChanges(true);
    };

    const updateKnowledgeItem = (index: number, value: string) => {
        const newKnowledge = [...knowledge];
        newKnowledge[index] = value;
        setKnowledge(newKnowledge);
        setHasChanges(true);
    };

    const removeKnowledgeItem = (index: number) => {
        setKnowledge(knowledge.filter((_, i) => i !== index));
        setHasChanges(true);
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 h-full">
            {/* Sidebar List */}
            <div className="w-full md:w-64 flex flex-col gap-4 overflow-y-auto">

                {/* RUNTIME MODE TOGGLE */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Runtime Mode</div>
                    <div className="flex bg-black/20 p-1 rounded-lg">
                        <button
                            onClick={() => setRuntimeMode('demo')}
                            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${runtimeMode === 'demo'
                                ? 'bg-purple-500 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Demo (Client)
                        </button>
                        <button
                            onClick={() => setRuntimeMode('production')}
                            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${runtimeMode === 'production'
                                ? 'bg-purple-500 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Production (Proxy)
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight">
                        {runtimeMode === 'demo'
                            ? 'Client-side API calls. Requires local API keys. Fast prototyping.'
                            : 'Proxy via Node.js backend. Secure, scalable, no exposed keys.'}
                    </p>
                </div>

                {/* GLOBAL STRATEGY TOGGLE */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Context Strategy</div>
                    <div className="flex bg-black/20 p-1 rounded-lg">
                        <button
                            onClick={() => setContextStrategy('flat')}
                            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${contextStrategy === 'flat'
                                ? 'bg-primary text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Flat (All)
                        </button>
                        <button
                            onClick={() => setContextStrategy('tree')}
                            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${contextStrategy === 'tree'
                                ? 'bg-primary text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Tree (Smart)
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight">
                        {contextStrategy === 'flat'
                            ? 'Sends ALL contexts to the AI. Good for debugging, but expensive.'
                            : 'Prunes irrelevant contexts based on your current page. efficient.'}
                    </p>
                </div>

                {/* SECURE NLWEB MODE TOGGLE */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Agent Pipeline</div>
                    <div className="flex bg-black/20 p-1 rounded-lg">
                        <button
                            onClick={() => setNLWebMode('standard')}
                            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${nlwebMode === 'standard'
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Standard
                        </button>
                        <button
                            onClick={() => setNLWebMode('secure')}
                            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${nlwebMode === 'secure'
                                ? 'bg-green-500 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Secure NLWeb
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight">
                        {nlwebMode === 'standard'
                            ? 'Direct LLM chat. Simple and fast for basic interactions.'
                            : 'Guard Dog security + parallel processing + memory. Best for public-facing agents.'}
                    </p>
                </div>

                {/* LLM PROVIDER SELECTOR */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">LLM Provider</div>
                    <select
                        value={llmProvider}
                        onChange={(e) => setLLMProvider(e.target.value as 'gemini' | 'claude' | 'proxy')}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="gemini">Gemini (Google)</option>
                        <option value="claude">Claude (Anthropic)</option>
                        <option value="proxy">Proxy (Backend)</option>
                    </select>
                    <p className="text-[10px] text-gray-500 leading-tight">
                        {llmProvider === 'gemini' && 'Google Gemini 2.0 Flash - Fast, multimodal, with file search.'}
                        {llmProvider === 'claude' && 'Anthropic Claude 3.5/4.5 - Excellent reasoning and coding.'}
                        {llmProvider === 'proxy' && 'Route through backend proxy - Production mode, secure keys.'}
                    </p>

                    {/* Claude API Key (conditional) */}
                    {llmProvider === 'claude' && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                            <label className="text-[10px] text-gray-400 block mb-1">Claude API Key</label>
                            <GlassInput
                                type="password"
                                value={claudeApiKey}
                                onChange={(e) => setClaudeApiKey(e.target.value)}
                                placeholder="sk-ant-..."
                                className="w-full text-xs"
                            />
                            <p className="text-[9px] text-gray-600 mt-1">
                                {claudeApiKey ? '✓ Key saved' : 'Required for Claude provider'}
                            </p>
                        </div>
                    )}
                </div>

                {/* SECURITY BLACKLIST EDITOR */}
                {nlwebMode === 'secure' && (
                    <div className="p-4 rounded-xl bg-white/5 border border-red-500/20 space-y-3">
                        <div className="text-xs font-bold text-red-400 uppercase tracking-wider">Security Blacklist</div>
                        <p className="text-[10px] text-gray-500 leading-tight mb-2">
                            Custom phrases to block. One per line. These supplement the built-in security filters.
                        </p>
                        <GlassTextarea
                            value={securityBlacklist.join('\n')}
                            onChange={(e) => setSecurityBlacklist(e.target.value.split('\n').filter(s => s.trim()))}
                            placeholder="e.g., ignore safety rules\ncredit card number\nmy password is"
                            className="w-full text-xs min-h-[80px] font-mono"
                        />
                        <p className="text-[9px] text-gray-600">
                            {securityBlacklist.length} custom phrase{securityBlacklist.length !== 1 ? 's' : ''} added
                        </p>
                    </div>
                )}

                <div className="space-y-2">
                    {DEMO_ROUTES.map((demo) => (
                        <button
                            key={demo.route}
                            onClick={() => setSelectedRoute(demo.route)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedRoute === demo.route
                                ? 'bg-primary/20 text-white font-medium border border-primary/30'
                                : 'hover:bg-white/5 text-gray-400'
                                }`}
                        >
                            <div className="flex items-center">
                                <Bot className={`w-4 h-4 mr-3 ${selectedRoute === demo.route ? 'text-primary' : 'text-gray-600'}`} />
                                <span className="truncate">{demo.title}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Config Panel */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <GlassContainer className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">
                            {DEMO_ROUTES.find(d => d.route === selectedRoute)?.title} Config
                        </h3>
                        {hasChanges && (
                            <div className="flex gap-2">
                                <GlassButton size="sm" variant="ghost" onClick={handleReset}>
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Reset
                                </GlassButton>
                                <GlassButton size="sm" onClick={handleSave}>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save
                                </GlassButton>
                            </div>
                        )}
                    </div>

                    {/* System Prompt */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">System Prompt</label>
                        <p className="text-xs text-gray-500 mb-2">
                            Instructions that define the persona and behavior of the AI for this page.
                        </p>
                        <GlassTextarea
                            value={systemPrompt}
                            onChange={(e) => {
                                setSystemPrompt(e.target.value);
                                setHasChanges(true);
                            }}
                            placeholder="You are a helpful assistant..."
                            className="min-h-[150px] font-mono text-sm"
                        />
                    </div>

                    {/* Knowledge Base */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <label className="text-sm font-medium text-gray-300">Knowledge Base</label>
                                <p className="text-xs text-gray-500">
                                    Specific facts or context the AI should know about this page.
                                </p>
                            </div>
                            <GlassButton size="sm" variant="secondary" onClick={addKnowledgeItem}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Item
                            </GlassButton>
                        </div>

                        <div className="space-y-3">
                            {knowledge.length === 0 && (
                                <div className="text-center py-6 text-gray-600 italic border border-dashed border-gray-700 rounded-lg">
                                    No custom knowledge added.
                                </div>
                            )}
                            {knowledge.map((item, idx) => {
                                const isJson = item.trim().startsWith('{');

                                if (isJson) {
                                    return (
                                        <JsonCodeEditor
                                            key={idx}
                                            value={item}
                                            onChange={(val) => updateKnowledgeItem(idx, val)}
                                            onRemove={() => removeKnowledgeItem(idx)}
                                            onRefine={async (refinement) => {
                                                if (!geminiService) return;
                                                try {
                                                    const schemaRes = await fetch('/src/assets/schema.json');
                                                    const schemaJson = await schemaRes.text();

                                                    const updatedJson = await geminiService.updateSchema(item, refinement, schemaJson);
                                                    updateKnowledgeItem(idx, updatedJson);
                                                } catch (e) {
                                                    console.error("Failed to refine schema", e);
                                                }
                                            }}
                                        />
                                    );
                                }

                                return (
                                    <div key={idx} className="flex gap-2 items-start">
                                        <div className="flex-1 relative group">
                                            <GlassTextarea
                                                value={item}
                                                onChange={(e) => updateKnowledgeItem(idx, e.target.value)}
                                                placeholder="e.g. The user prefers dark mode..."
                                                className="w-full pr-10 min-h-[80px]"
                                            />

                                            {/* Schema Conversion Trigger */}
                                            {geminiService && item.length > 10 && (
                                                <button
                                                    onClick={async () => {
                                                        // Load schema context
                                                        try {
                                                            const schemaRes = await fetch('/src/assets/schema.json');
                                                            const schemaJson = await schemaRes.text();

                                                            // Show loading state (optimistic)
                                                            updateKnowledgeItem(idx, "Converting to Schema...");

                                                            const jsonLd = await geminiService.convertTextToSchema(item, schemaJson);
                                                            updateKnowledgeItem(idx, jsonLd);
                                                        } catch (e) {
                                                            console.error("Schema conversion failed", e);
                                                            updateKnowledgeItem(idx, item); // Revert on failure
                                                        }
                                                    }}
                                                    className="absolute right-2 top-2 p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Convert to Schema.org JSON-LD"
                                                >
                                                    <Bot size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => removeKnowledgeItem(idx)}
                                            className="p-2 mt-1 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>


                    {/* File Search Config */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="mb-2">
                            <label className="text-sm font-medium text-gray-300">File Search (RAG)</label>
                            <p className="text-xs text-list-secondary">
                                Select a Knowledge Store to enable RAG capabilities for this page.
                            </p>
                        </div>
                        {geminiService ? (
                            <div className="bg-black/20 rounded-lg overflow-hidden border border-white/5">
                                <GlassFileSearch
                                    geminiService={geminiService}
                                    onConfigChange={(config) => {
                                        setFileSearchConfig(config);
                                        setHasChanges(true); // Treat as a change to be saved
                                    }}
                                />
                                {fileSearchConfig?.enabled && (
                                    <div className="px-4 py-2 bg-primary/10 text-primary text-xs flex items-center gap-2">
                                        <Bot size={12} />
                                        <span>File Search enabled with store: {fileSearchConfig.stores.join(', ')}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-xs text-red-400 p-2 bg-red-500/10 rounded">
                                Gemini Service not available (Check API Key)
                            </div>
                        )}
                    </div>
                </GlassContainer>
            </div>
        </div>
    );
};
