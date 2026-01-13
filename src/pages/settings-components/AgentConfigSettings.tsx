import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot,
    Plus,
    X,
    Save,
    RotateCcw,
    Copy,
    Check,
    Sparkles,
    Shield,
    Zap,
    Database,
    ChevronRight,
    Settings2,
    Brain,
    Lock,
    Server,
    FileSearch,
    Layers,
    Wand2,
} from 'lucide-react';
import { GlassContainer, GlassButton, GlassInput, GlassTextarea, GlassToggle } from '@/components';
import { useAgentConfig, FileSearchConfig } from '../../context/AgentConfigContext';
import { GeminiService } from '../../services/gemini';
import { useOptionalLiquidClient } from '../../liquid-engine/react';
import { GlassFileSearch } from '../../components/generative/GlassFileSearch';
import { cn } from '@/utils/cn';

// ============================================
// Types
// ============================================

interface RouteConfig {
    title: string;
    route: string;
    icon: React.ElementType;
    description: string;
}

// Hardcoded list of demos for now, could be dynamic
const DEMO_ROUTES: RouteConfig[] = [
    { title: 'Generative Showcase', route: '/demos/generative', icon: Sparkles, description: 'Interactive AI demonstrations' },
    { title: 'Generative Extensions', route: '/demos/generative-extensions', icon: Layers, description: 'Extended AI capabilities' },
    { title: 'Form Copilot', route: '/demos/copilot-form', icon: Wand2, description: 'AI-assisted form filling' },
    { title: 'Dynamic Dashboard', route: '/demos/dynamic-dashboard', icon: Settings2, description: 'Real-time data visualization' },
    { title: 'State Machine', route: '/demos/state-machine', icon: Zap, description: 'Workflow automation' },
    { title: 'Q&A Agent', route: '/demos/qa-agent', icon: Brain, description: 'Question answering system' },
    { title: 'Research Canvas', route: '/demos/research-canvas', icon: FileSearch, description: 'AI research assistant' },
    { title: 'Travel Planner', route: '/demos/travel-planner', icon: Bot, description: 'Trip planning assistant' },
    { title: 'AI Researcher', route: '/demos/ai-researcher', icon: Database, description: 'Deep research agent' },
];

// ============================================
// Sub-components
// ============================================

interface SettingCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    children: React.ReactNode;
    className?: string;
}

const SettingCard: React.FC<SettingCardProps> = ({ icon, title, description, children, className }) => (
    <div className={cn(
        'p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3',
        'hover:border-white/20 transition-colors',
        className
    )}>
        <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                {icon}
            </div>
            <div className="flex-1">
                <div className="text-sm font-semibold text-primary">{title}</div>
                <div className="text-xs text-secondary mt-0.5">{description}</div>
            </div>
        </div>
        {children}
    </div>
);

interface ToggleButtonGroupProps {
    options: { value: string; label: string; color?: string }[];
    value: string;
    onChange: (value: string) => void;
}

const ToggleButtonGroup: React.FC<ToggleButtonGroupProps> = ({ options, value, onChange }) => (
    <div className="flex bg-black/20 p-1 rounded-xl">
        {options.map((option) => (
            <button
                key={option.value}
                onClick={() => onChange(option.value)}
                className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all',
                    value === option.value
                        ? `${option.color || 'bg-primary'} text-white shadow-lg`
                        : 'text-secondary hover:text-primary'
                )}
            >
                {option.label}
            </button>
        ))}
    </div>
);

// JSON-LD Editor Component
const JsonCodeEditor: React.FC<{
    value: string;
    onChange: (val: string) => void;
    onRemove: () => void;
    onRefine: (refinement: string) => Promise<void>;
}> = ({ value, onChange, onRemove, onRefine }) => {
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
            <GlassContainer className="flex-1 overflow-hidden border border-white/10 bg-black/40">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                    <span className="text-xs text-tertiary font-mono">JSON-LD Context</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowRefine(!showRefine)}
                            className={cn(
                                'p-1.5 rounded-md transition-colors',
                                showRefine ? 'bg-primary/20 text-white' : 'hover:bg-white/10 text-tertiary hover:text-white'
                            )}
                            title="Refine with AI"
                        >
                            <Wand2 size={12} />
                        </button>
                        <button
                            onClick={handleCopy}
                            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-tertiary hover:text-white"
                            title="Copy JSON"
                        >
                            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                    </div>
                </div>

                {/* Refinement Input */}
                <AnimatePresence>
                    {showRefine && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
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
                        </motion.div>
                    )}
                </AnimatePresence>

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
                className="p-2 mt-2 hover:bg-red-500/20 text-tertiary hover:text-red-400 rounded-lg transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

// Route Card Component
const RouteCard: React.FC<{
    route: RouteConfig;
    isSelected: boolean;
    onClick: () => void;
}> = ({ route, isSelected, onClick }) => {
    const Icon = route.icon;
    return (
        <motion.button
            onClick={onClick}
            className={cn(
                'w-full text-left p-4 rounded-xl transition-all',
                'border border-transparent',
                isSelected
                    ? 'bg-primary/15 border-primary/30'
                    : 'hover:bg-white/5'
            )}
            whileHover={{ x: 4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    'p-2 rounded-lg',
                    isSelected ? 'bg-primary/20 text-primary' : 'bg-white/5 text-secondary'
                )}>
                    <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className={cn(
                        'text-sm font-medium truncate',
                        isSelected ? 'text-primary' : 'text-primary'
                    )}>
                        {route.title}
                    </div>
                    <div className="text-xs text-secondary truncate">
                        {route.description}
                    </div>
                </div>
                <ChevronRight
                    size={14}
                    className={cn(
                        'text-tertiary transition-transform',
                        isSelected && 'text-primary rotate-90'
                    )}
                />
            </div>
        </motion.button>
    );
};

// ============================================
// Main Component
// ============================================

export const AgentConfigSettings: React.FC = () => {
    const {
        getConfigForRoute,
        updatePageConfig,
        contextStrategy,
        setContextStrategy,
        runtimeMode,
        setRuntimeMode,
        nlwebMode,
        setNLWebMode,
        llmProvider,
        setLLMProvider,
        claudeApiKey,
        setClaudeApiKey,
        securityBlacklist,
        setSecurityBlacklist
    } = useAgentConfig();

    const [selectedRoute, setSelectedRoute] = useState(DEMO_ROUTES[0].route);
    const [systemPrompt, setSystemPrompt] = useState('');
    const [knowledge, setKnowledge] = useState<string[]>([]);
    const [fileSearchConfig, setFileSearchConfig] = useState<FileSearchConfig | undefined>(undefined);
    const [hasChanges, setHasChanges] = useState(false);
    const [showGlobalSettings, setShowGlobalSettings] = useState(true);

    const client = useOptionalLiquidClient();
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

    // Initialize Gemini Service for File Search operations
    const geminiService = useMemo(() => {
        if (!apiKey) return null;

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

    // Track route changes
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

    const selectedRouteConfig = DEMO_ROUTES.find(d => d.route === selectedRoute);

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="sticky top-0 z-30 mb-8 p-4 rounded-3xl bg-glass-bg-thick/95 backdrop-blur-2xl shadow-lg border border-[var(--glass-border)] transition-all duration-300 flex items-center justify-between group hover:border-accent/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20">
                        <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-label-glass-primary">Agent Configuration</h2>
                        <p className="text-xs text-label-glass-secondary mt-1 uppercase tracking-wider font-medium">
                            Configure AI behavior and capabilities
                        </p>
                    </div>
                </div>
            </div>

            {/* Global Settings Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                    <Settings2 className="w-5 h-5 text-secondary" />
                    <span className="text-sm font-medium text-primary">Global Settings</span>
                </div>
                <GlassToggle
                    pressed={showGlobalSettings}
                    onPressedChange={setShowGlobalSettings}
                />
            </div>

            {/* Global Settings Panel */}
            <AnimatePresence>
                {showGlobalSettings && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Runtime Mode */}
                            <SettingCard
                                icon={<Server size={16} />}
                                title="Runtime Mode"
                                description={runtimeMode === 'demo'
                                    ? 'Client-side API calls. Fast prototyping.'
                                    : 'Proxy via backend. Secure, scalable.'}
                            >
                                <ToggleButtonGroup
                                    options={[
                                        { value: 'demo', label: 'Demo (Client)', color: 'bg-violet-500' },
                                        { value: 'production', label: 'Production (Proxy)', color: 'bg-violet-500' },
                                    ]}
                                    value={runtimeMode}
                                    onChange={(v) => setRuntimeMode(v as 'demo' | 'production')}
                                />
                            </SettingCard>

                            {/* Context Strategy */}
                            <SettingCard
                                icon={<Layers size={16} />}
                                title="Context Strategy"
                                description={contextStrategy === 'flat'
                                    ? 'Sends ALL contexts to AI. Good for debugging.'
                                    : 'Prunes irrelevant contexts. More efficient.'}
                            >
                                <ToggleButtonGroup
                                    options={[
                                        { value: 'flat', label: 'Flat (All)', color: 'bg-blue-500' },
                                        { value: 'tree', label: 'Tree (Smart)', color: 'bg-blue-500' },
                                    ]}
                                    value={contextStrategy}
                                    onChange={(v) => setContextStrategy(v as 'flat' | 'tree')}
                                />
                            </SettingCard>

                            {/* Agent Pipeline */}
                            <SettingCard
                                icon={<Shield size={16} />}
                                title="Agent Pipeline"
                                description={nlwebMode === 'standard'
                                    ? 'Direct LLM chat. Simple and fast.'
                                    : 'Guard Dog security + parallel processing.'}
                            >
                                <ToggleButtonGroup
                                    options={[
                                        { value: 'standard', label: 'Standard', color: 'bg-sky-500' },
                                        { value: 'secure', label: 'Secure NLWeb', color: 'bg-emerald-500' },
                                    ]}
                                    value={nlwebMode}
                                    onChange={(v) => setNLWebMode(v as 'standard' | 'secure')}
                                />
                            </SettingCard>

                            {/* LLM Provider */}
                            <SettingCard
                                icon={<Brain size={16} />}
                                title="LLM Provider"
                                description={
                                    llmProvider === 'gemini' ? 'Google Gemini 2.0 Flash - Fast, multimodal.' :
                                    llmProvider === 'claude' ? 'Anthropic Claude - Excellent reasoning.' :
                                    'Route through backend proxy - Production mode.'
                                }
                            >
                                <select
                                    value={llmProvider}
                                    onChange={(e) => setLLMProvider(e.target.value as 'gemini' | 'claude' | 'proxy')}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="gemini">Gemini (Google)</option>
                                    <option value="claude">Claude (Anthropic)</option>
                                    <option value="proxy">Proxy (Backend)</option>
                                </select>

                                {/* Claude API Key (conditional) */}
                                {llmProvider === 'claude' && (
                                    <div className="mt-3 pt-3 border-t border-white/10">
                                        <label className="text-xs text-secondary block mb-2">Claude API Key</label>
                                        <GlassInput
                                            type="password"
                                            value={claudeApiKey}
                                            onChange={(e) => setClaudeApiKey(e.target.value)}
                                            placeholder="sk-ant-..."
                                            className="w-full text-sm"
                                        />
                                        <p className="text-xs text-tertiary mt-1">
                                            {claudeApiKey ? '✓ Key saved' : 'Required for Claude provider'}
                                        </p>
                                    </div>
                                )}
                            </SettingCard>
                        </div>

                        {/* Security Blacklist (when secure mode) */}
                        {nlwebMode === 'secure' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4"
                            >
                                <SettingCard
                                    icon={<Lock size={16} />}
                                    title="Security Blacklist"
                                    description="Custom phrases to block. One per line. Supplements built-in filters."
                                    className="border-red-500/20"
                                >
                                    <GlassTextarea
                                        value={securityBlacklist.join('\n')}
                                        onChange={(e) => setSecurityBlacklist(e.target.value.split('\n').filter(s => s.trim()))}
                                        placeholder="e.g., ignore safety rules&#10;credit card number&#10;my password is"
                                        className="w-full text-xs min-h-[80px] font-mono"
                                    />
                                    <p className="text-xs text-tertiary">
                                        {securityBlacklist.length} custom phrase{securityBlacklist.length !== 1 ? 's' : ''} added
                                    </p>
                                </SettingCard>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Per-Route Configuration */}
            <GlassContainer className="overflow-hidden" border>
                <div className="flex flex-col lg:flex-row min-h-[500px]">
                    {/* Route List Sidebar */}
                    <div className="w-full lg:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 p-4 bg-white/[0.02]">
                        <div className="flex items-center gap-2 mb-4 px-2">
                            <Sparkles size={14} className="text-primary" />
                            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                                Page Configurations
                            </span>
                        </div>
                        <div className="space-y-1 max-h-[400px] overflow-y-auto">
                            {DEMO_ROUTES.map((route) => (
                                <RouteCard
                                    key={route.route}
                                    route={route}
                                    isSelected={selectedRoute === route.route}
                                    onClick={() => setSelectedRoute(route.route)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Config Panel */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {/* Panel Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                {selectedRouteConfig && (
                                    <div className="p-2 rounded-xl bg-primary/10">
                                        <selectedRouteConfig.icon size={20} className="text-primary" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-lg font-bold text-primary">
                                        {selectedRouteConfig?.title || 'Configuration'}
                                    </h3>
                                    <p className="text-xs text-secondary">
                                        {selectedRouteConfig?.description}
                                    </p>
                                </div>
                            </div>
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
                        <div className="space-y-3 mb-6">
                            <div>
                                <label className="text-sm font-medium text-primary">System Prompt</label>
                                <p className="text-xs text-secondary mt-0.5">
                                    Instructions that define the AI's persona and behavior for this page.
                                </p>
                            </div>
                            <GlassTextarea
                                value={systemPrompt}
                                onChange={(e) => {
                                    setSystemPrompt(e.target.value);
                                    setHasChanges(true);
                                }}
                                placeholder="You are a helpful assistant..."
                                className="min-h-[120px] font-mono text-sm"
                            />
                        </div>

                        {/* Knowledge Base */}
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <label className="text-sm font-medium text-primary">Knowledge Base</label>
                                    <p className="text-xs text-secondary">
                                        Specific facts or context the AI should know about this page.
                                    </p>
                                </div>
                                <GlassButton size="sm" variant="secondary" onClick={addKnowledgeItem}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Item
                                </GlassButton>
                            </div>

                            <div className="space-y-3">
                                {knowledge.length === 0 ? (
                                    <div className="text-center py-8 text-tertiary italic border border-dashed border-white/10 rounded-xl">
                                        <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        No custom knowledge added.
                                    </div>
                                ) : (
                                    knowledge.map((item, idx) => {
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
                                                                try {
                                                                    const schemaRes = await fetch('/src/assets/schema.json');
                                                                    const schemaJson = await schemaRes.text();

                                                                    updateKnowledgeItem(idx, "Converting to Schema...");

                                                                    const jsonLd = await geminiService.convertTextToSchema(item, schemaJson);
                                                                    updateKnowledgeItem(idx, jsonLd);
                                                                } catch (e) {
                                                                    console.error("Schema conversion failed", e);
                                                                    updateKnowledgeItem(idx, item);
                                                                }
                                                            }}
                                                            className="absolute right-2 top-2 p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 opacity-0 group-hover:opacity-100 transition-all"
                                                            title="Convert to Schema.org JSON-LD"
                                                        >
                                                            <Wand2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => removeKnowledgeItem(idx)}
                                                    className="p-2 mt-1 hover:bg-red-500/20 text-tertiary hover:text-red-400 rounded-lg transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* File Search Config */}
                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <div>
                                <label className="text-sm font-medium text-primary">File Search (RAG)</label>
                                <p className="text-xs text-secondary">
                                    Select a Knowledge Store to enable RAG capabilities for this page.
                                </p>
                            </div>
                            {geminiService ? (
                                <div className="bg-black/20 rounded-xl overflow-hidden border border-white/5">
                                    <GlassFileSearch
                                        geminiService={geminiService}
                                        onConfigChange={(config) => {
                                            setFileSearchConfig(config);
                                            setHasChanges(true);
                                        }}
                                    />
                                    {fileSearchConfig?.enabled && (
                                        <div className="px-4 py-2 bg-primary/10 text-primary text-xs flex items-center gap-2">
                                            <Check size={12} />
                                            <span>File Search enabled with store: {fileSearchConfig.stores.join(', ')}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-xs text-red-400 p-3 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center gap-2">
                                    <Lock size={14} />
                                    Gemini Service not available (Check API Key)
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </GlassContainer>
        </div>
    );
};
