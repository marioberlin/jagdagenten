/**
 * GlassAgentSettings
 *
 * Main settings panel for AI agent configuration.
 * Follows the "zero-config" philosophy with progressive disclosure.
 *
 * - Tier 1: Auto-detected, just works
 * - Tier 2: Quick setup with one-click presets
 * - Tier 3: Full control via Advanced tab
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Brain, Sparkles, Shield, Key,
    Check, ChevronDown, RefreshCw,
    Globe, Server, Container, Cpu, HardDrive,
    AlertCircle, CheckCircle2, XCircle, Loader2,
    ExternalLink, Info, Settings, Layers,
    TestTube, Layout, Lock, DollarSign,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import {
    useContainerStore,
    type SDKType,
} from '@/stores/containerStore';
import { AgentStatusOverview } from './AgentStatusOverview';

// ============================================================================
// Types
// ============================================================================

interface EnvironmentCapabilities {
    docker: {
        available: boolean;
        version?: string;
        platform?: string;
    };
    system: {
        platform: string;
        arch: string;
        totalMemory: number;
        cpuCores: number;
    };
    apiKeys: {
        anthropic: boolean;
        openai: boolean;
        google: boolean;
        minimax: boolean;
    };
    cliTools: {
        geminiCli: boolean;
        claudeCode: boolean;
    };
}

type TabId = 'quick' | 'sdk' | 'keys' | 'advanced';

// ============================================================================
// Reusable Components
// ============================================================================

interface SectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    description?: string;
    collapsed?: boolean;
    onToggle?: () => void;
}

const Section: React.FC<SectionProps> = ({
    title,
    icon,
    children,
    description,
    collapsed,
    onToggle,
}) => (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
        <button
            onClick={onToggle}
            className={cn(
                "w-full flex items-center gap-3 p-4",
                onToggle && "hover:bg-white/[0.02] cursor-pointer"
            )}
        >
            <div className="p-2 rounded-xl bg-[var(--glass-accent)]/20 text-[var(--glass-accent)]">
                {icon}
            </div>
            <div className="flex-1 text-left">
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                {description && (
                    <p className="text-xs text-white/50 mt-0.5">{description}</p>
                )}
            </div>
            {onToggle && (
                <ChevronDown
                    size={16}
                    className={cn(
                        "text-white/40 transition-transform",
                        collapsed && "-rotate-90"
                    )}
                />
            )}
        </button>
        {!collapsed && <div className="px-4 pb-4 pt-2">{children}</div>}
    </div>
);

interface PreferenceCardProps {
    name: string;
    description: string;
    icon: React.ReactNode;
    selected: boolean;
    onSelect: () => void;
    cost: string;
    speed: string;
    quality: string;
    available: boolean;
    recommended?: boolean;
}

const PreferenceCard: React.FC<PreferenceCardProps> = ({
    name,
    description,
    icon,
    selected,
    onSelect,
    cost,
    speed,
    quality,
    available,
    recommended,
}) => (
    <button
        onClick={onSelect}
        disabled={!available}
        className={cn(
            "relative flex flex-col p-4 rounded-xl transition-all text-left",
            available && "hover:scale-[1.02]",
            selected
                ? "bg-[var(--glass-accent)]/20 border-2 border-[var(--glass-accent)]"
                : "bg-white/[0.03] border border-white/10",
            !available && "opacity-50 cursor-not-allowed"
        )}
    >
        {recommended && (
            <div className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold bg-emerald-500 text-white rounded-full">
                Recommended
            </div>
        )}
        <div className="flex items-center gap-3 mb-3">
            <div className={cn(
                "p-2 rounded-lg",
                selected ? "bg-[var(--glass-accent)]/30" : "bg-white/10"
            )}>
                {icon}
            </div>
            <div className="flex-1">
                <div className="font-semibold text-white">{name}</div>
                <div className="text-xs text-white/50">{description}</div>
            </div>
            {selected && (
                <Check className="text-[var(--glass-accent)]" size={20} />
            )}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-auto">
            <div className="text-center p-2 rounded-lg bg-black/20">
                <div className="text-xs text-white/40">Cost</div>
                <div className="text-sm font-medium text-emerald-400">{cost}</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-black/20">
                <div className="text-xs text-white/40">Speed</div>
                <div className="text-sm font-medium text-blue-400">{speed}</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-black/20">
                <div className="text-xs text-white/40">Quality</div>
                <div className="text-sm font-medium text-purple-400">{quality}</div>
            </div>
        </div>

        {!available && (
            <div className="mt-3 text-xs text-amber-400 flex items-center gap-1">
                <AlertCircle size={12} />
                API key required
            </div>
        )}
    </button>
);

interface TaskModelRowProps {
    task: string;
    description: string;
    icon: React.ReactNode;
    value: SDKType;
    onChange: (value: SDKType) => void;
    recommended: SDKType;
    locked?: boolean;
}

const TaskModelRow: React.FC<TaskModelRowProps> = ({
    task,
    description,
    icon,
    value,
    onChange,
    recommended,
    locked,
}) => {
    const options: Array<{ value: SDKType; label: string }> = [
        { value: 'auto', label: 'Auto (Best match)' },
        { value: 'claude-agent-sdk', label: 'Claude' },
        { value: 'gemini-cli', label: 'Gemini CLI' },
        { value: 'openai-agents-sdk', label: 'OpenAI' },
        { value: 'google-adk', label: 'Google ADK' },
    ];

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="p-2 rounded-lg bg-white/5 text-white/60">{icon}</div>
            <div className="flex-1">
                <div className="text-sm font-medium text-white">{task}</div>
                <div className="text-xs text-white/40">{description}</div>
            </div>
            {locked ? (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-amber-400">
                    <Lock size={14} />
                    Claude Only
                </div>
            ) : (
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value as SDKType)}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                            {opt.value === recommended && ' (Rec.)'}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
};

// ============================================================================
// API Key Provider Component
// ============================================================================

interface ApiKeyCardProps {
    provider: {
        id: string;
        name: string;
        envVar: string;
        detected: boolean;
        icon: React.ReactNode;
        color: string;
        getKeyUrl: string;
    };
    onValidate?: () => void;
    validating?: boolean;
}

const ApiKeyCard: React.FC<ApiKeyCardProps> = ({ provider, onValidate, validating }) => (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <div className={cn("p-2.5 rounded-xl", provider.detected ? "bg-emerald-500/20" : "bg-white/5")}>
            {provider.icon}
        </div>
        <div className="flex-1">
            <div className="flex items-center gap-2">
                <span className="font-medium text-white">{provider.name}</span>
                {provider.detected ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 size={12} />
                        Detected
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-xs text-white/40">
                        <XCircle size={12} />
                        Not found
                    </span>
                )}
            </div>
            <div className="text-xs text-white/40 font-mono mt-0.5">
                {provider.envVar}
            </div>
        </div>
        <div className="flex items-center gap-2">
            {provider.detected && onValidate && (
                <button
                    onClick={onValidate}
                    disabled={validating}
                    className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                    {validating ? <Loader2 className="animate-spin" size={14} /> : 'Validate'}
                </button>
            )}
            <a
                href={provider.getKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--glass-accent)] hover:bg-[var(--glass-accent)]/10 rounded-lg transition-colors"
            >
                Get Key <ExternalLink size={12} />
            </a>
        </div>
    </div>
);

// ============================================================================
// Tab Content Components
// ============================================================================

interface QuickSetupTabProps {
    env: EnvironmentCapabilities | null;
    loading: boolean;
    onDetect: () => void;
}

const QuickSetupTab: React.FC<QuickSetupTabProps> = ({ env, loading, onDetect }) => {
    const isSetupComplete = useMemo(() => {
        if (!env) return false;
        const hasDocker = env.docker.available;
        const hasApiKey = env.apiKeys.anthropic || env.apiKeys.google || env.apiKeys.openai;
        return hasDocker && hasApiKey;
    }, [env]);

    return (
        <div className="space-y-6">
            {/* Status Banner */}
            <div className={cn(
                "p-4 rounded-xl border flex items-center gap-4",
                isSetupComplete
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-amber-500/10 border-amber-500/30"
            )}>
                {isSetupComplete ? (
                    <>
                        <CheckCircle2 className="text-emerald-400" size={24} />
                        <div>
                            <div className="font-semibold text-emerald-400">Ready to Go!</div>
                            <div className="text-sm text-emerald-400/70">
                                Your system is configured and ready to run AI agents.
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <AlertCircle className="text-amber-400" size={24} />
                        <div>
                            <div className="font-semibold text-amber-400">Setup Required</div>
                            <div className="text-sm text-amber-400/70">
                                Complete the steps below to enable AI agent execution.
                            </div>
                        </div>
                    </>
                )}
                <button
                    onClick={onDetect}
                    disabled={loading}
                    className="ml-auto px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                    Re-detect
                </button>
            </div>

            {/* Checklist */}
            <div className="space-y-4">
                {/* Docker */}
                <div className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                    env?.docker.available
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-white/[0.02] border-white/10"
                )}>
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        env?.docker.available ? "bg-emerald-500/20" : "bg-white/10"
                    )}>
                        {env?.docker.available ? (
                            <Check className="text-emerald-400" size={20} />
                        ) : (
                            <Container className="text-white/40" size={20} />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="font-medium text-white">Docker Runtime</div>
                        <div className="text-sm text-white/50">
                            {env?.docker.available
                                ? `${env.docker.platform || 'Docker'} v${env.docker.version}`
                                : 'Install Docker Desktop or OrbStack'}
                        </div>
                    </div>
                    {!env?.docker.available && (
                        <a
                            href="https://www.docker.com/products/docker-desktop/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 text-sm font-medium bg-[var(--glass-accent)] text-white rounded-lg hover:bg-[var(--glass-accent)]/80 transition-colors"
                        >
                            Install Docker
                        </a>
                    )}
                </div>

                {/* API Keys */}
                <div className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                    (env?.apiKeys.anthropic || env?.apiKeys.google || env?.apiKeys.openai)
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-white/[0.02] border-white/10"
                )}>
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        (env?.apiKeys.anthropic || env?.apiKeys.google || env?.apiKeys.openai)
                            ? "bg-emerald-500/20"
                            : "bg-white/10"
                    )}>
                        {(env?.apiKeys.anthropic || env?.apiKeys.google || env?.apiKeys.openai) ? (
                            <Check className="text-emerald-400" size={20} />
                        ) : (
                            <Key className="text-white/40" size={20} />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="font-medium text-white">AI Provider API Key</div>
                        <div className="text-sm text-white/50">
                            {[
                                env?.apiKeys.anthropic && 'Anthropic',
                                env?.apiKeys.google && 'Google',
                                env?.apiKeys.openai && 'OpenAI',
                            ].filter(Boolean).join(', ') || 'At least one provider required'}
                        </div>
                    </div>
                    <span className="text-xs text-white/30">
                        See API Keys tab
                    </span>
                </div>

                {/* Optional: Gemini CLI */}
                <div className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-colors opacity-70",
                    env?.cliTools.geminiCli
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-white/[0.02] border-white/10"
                )}>
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        env?.cliTools.geminiCli ? "bg-emerald-500/20" : "bg-white/10"
                    )}>
                        {env?.cliTools.geminiCli ? (
                            <Check className="text-emerald-400" size={20} />
                        ) : (
                            <Zap className="text-white/40" size={20} />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-white">Gemini CLI</span>
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-white/10 rounded-full">
                                Optional
                            </span>
                        </div>
                        <div className="text-sm text-white/50">
                            {env?.cliTools.geminiCli
                                ? 'Installed - Fast, cost-effective execution available'
                                : 'Fastest execution for simple tasks'}
                        </div>
                    </div>
                    {!env?.cliTools.geminiCli && (
                        <a
                            href="https://github.com/google-gemini/gemini-cli"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 text-sm font-medium text-white/70 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                        >
                            Learn More
                        </a>
                    )}
                </div>
            </div>

            {/* System Info */}
            {env && (
                <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                        <Cpu className="mx-auto text-white/40 mb-1" size={16} />
                        <div className="text-sm font-medium text-white">{env.system.cpuCores}</div>
                        <div className="text-xs text-white/40">CPU Cores</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                        <HardDrive className="mx-auto text-white/40 mb-1" size={16} />
                        <div className="text-sm font-medium text-white">
                            {Math.round(env.system.totalMemory / (1024 * 1024 * 1024))} GB
                        </div>
                        <div className="text-xs text-white/40">Memory</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                        <Globe className="mx-auto text-white/40 mb-1" size={16} />
                        <div className="text-sm font-medium text-white">{env.system.platform}</div>
                        <div className="text-xs text-white/40">Platform</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                        <Server className="mx-auto text-white/40 mb-1" size={16} />
                        <div className="text-sm font-medium text-white">{env.system.arch}</div>
                        <div className="text-xs text-white/40">Architecture</div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface SDKPreferencesTabProps {
    env: EnvironmentCapabilities | null;
}

const SDKPreferencesTab: React.FC<SDKPreferencesTabProps> = ({ env }) => {
    const { config, setSdkPreference } = useContainerStore();
    // Provide defaults in case sdkPreferences is undefined (e.g., from old localStorage)
    const prefs = config.sdkPreferences ?? {
        default: 'auto',
        uiSpecialist: 'auto',
        apiSpecialist: 'auto',
        testSpecialist: 'auto',
        securitySpecialist: 'claude-agent-sdk',
        costOptimization: 'balanced',
    };
    void env; // Mark as used (used in SDK availability checks)

    return (
        <div className="space-y-6">
            {/* Default Model Selection */}
            <Section title="Default AI Model" icon={<Brain size={18} />} description="Used when no specific preference applies">
                <div className="grid grid-cols-3 gap-4">
                    <PreferenceCard
                        name="Claude"
                        description="Best quality, careful reasoning"
                        icon={<Sparkles className="text-orange-400" size={18} />}
                        selected={prefs.default === 'claude-agent-sdk'}
                        onSelect={() => setSdkPreference('default', 'claude-agent-sdk')}
                        cost="$$"
                        speed="Medium"
                        quality="Excellent"
                        available={!!env?.apiKeys.anthropic}
                    />
                    <PreferenceCard
                        name="Gemini"
                        description="Fastest, most cost-effective"
                        icon={<Zap className="text-blue-400" size={18} />}
                        selected={prefs.default === 'gemini-cli'}
                        onSelect={() => setSdkPreference('default', 'gemini-cli')}
                        cost="$"
                        speed="Fast"
                        quality="Good"
                        available={!!env?.apiKeys.google}
                        recommended
                    />
                    <PreferenceCard
                        name="OpenAI"
                        description="Balanced performance"
                        icon={<Brain className="text-emerald-400" size={18} />}
                        selected={prefs.default === 'openai-agents-sdk'}
                        onSelect={() => setSdkPreference('default', 'openai-agents-sdk')}
                        cost="$$"
                        speed="Medium"
                        quality="Very Good"
                        available={!!env?.apiKeys.openai}
                    />
                </div>
            </Section>

            {/* Task-Specific Models */}
            <Section title="Task-Specific Models" icon={<Layers size={18} />} description="Override defaults for specific task types">
                <div className="space-y-3">
                    <TaskModelRow
                        task="UI & Components"
                        description="React, CSS, visual design"
                        icon={<Layout size={16} />}
                        value={prefs.uiSpecialist}
                        onChange={(v) => setSdkPreference('uiSpecialist', v)}
                        recommended="claude-agent-sdk"
                    />
                    <TaskModelRow
                        task="API & Backend"
                        description="Server code, databases"
                        icon={<Server size={16} />}
                        value={prefs.apiSpecialist}
                        onChange={(v) => setSdkPreference('apiSpecialist', v)}
                        recommended="gemini-cli"
                    />
                    <TaskModelRow
                        task="Tests"
                        description="Unit tests, integration tests"
                        icon={<TestTube size={16} />}
                        value={prefs.testSpecialist}
                        onChange={(v) => setSdkPreference('testSpecialist', v)}
                        recommended="gemini-cli"
                    />
                    <TaskModelRow
                        task="Security"
                        description="Auth, validation, encryption"
                        icon={<Shield size={16} />}
                        value={prefs.securitySpecialist}
                        onChange={(v) => setSdkPreference('securitySpecialist', v)}
                        recommended="claude-agent-sdk"
                        locked // Security always uses Claude
                    />
                </div>
            </Section>

            {/* Cost Optimization */}
            <Section title="Optimization Priority" icon={<DollarSign size={18} />}>
                <div className="flex gap-3">
                    {(['quality', 'balanced', 'cost'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setSdkPreference('costOptimization', mode)}
                            className={cn(
                                "flex-1 p-4 rounded-xl border transition-all",
                                prefs.costOptimization === mode
                                    ? "bg-[var(--glass-accent)]/20 border-[var(--glass-accent)]"
                                    : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
                            )}
                        >
                            <div className="font-medium text-white capitalize mb-1">{mode}</div>
                            <div className="text-xs text-white/50">
                                {mode === 'quality' && 'Best results, higher cost'}
                                {mode === 'balanced' && 'Good balance of both'}
                                {mode === 'cost' && 'Minimize spending'}
                            </div>
                        </button>
                    ))}
                </div>
            </Section>
        </div>
    );
};

interface ApiKeysTabProps {
    env: EnvironmentCapabilities | null;
}

const ApiKeysTab: React.FC<ApiKeysTabProps> = ({ env }) => {
    const providers = [
        {
            id: 'anthropic',
            name: 'Anthropic (Claude)',
            envVar: 'ANTHROPIC_API_KEY',
            detected: env?.apiKeys.anthropic ?? false,
            icon: <Sparkles className="text-orange-400" size={18} />,
            color: 'text-orange-400',
            getKeyUrl: 'https://console.anthropic.com/settings/keys',
        },
        {
            id: 'google',
            name: 'Google (Gemini)',
            envVar: 'GOOGLE_API_KEY',
            detected: env?.apiKeys.google ?? false,
            icon: <Zap className="text-blue-400" size={18} />,
            color: 'text-blue-400',
            getKeyUrl: 'https://makersuite.google.com/app/apikey',
        },
        {
            id: 'openai',
            name: 'OpenAI (GPT)',
            envVar: 'OPENAI_API_KEY',
            detected: env?.apiKeys.openai ?? false,
            icon: <Brain className="text-emerald-400" size={18} />,
            color: 'text-emerald-400',
            getKeyUrl: 'https://platform.openai.com/api-keys',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-3">
                    <Info className="text-blue-400 mt-0.5 shrink-0" size={18} />
                    <div>
                        <p className="text-sm text-white">
                            API keys are automatically detected from environment variables.
                        </p>
                        <p className="text-xs text-white/60 mt-1">
                            Set <code className="bg-black/30 px-1.5 py-0.5 rounded font-mono">ANTHROPIC_API_KEY</code> in
                            your shell profile (<code className="bg-black/30 px-1 py-0.5 rounded font-mono">~/.zshrc</code> or <code className="bg-black/30 px-1 py-0.5 rounded font-mono">~/.bashrc</code>) for persistence.
                        </p>
                    </div>
                </div>
            </div>

            {/* Provider Cards */}
            <div className="space-y-3">
                {providers.map((provider) => (
                    <ApiKeyCard
                        key={provider.id}
                        provider={provider}
                    />
                ))}
            </div>

            {/* Setup Help */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                <h4 className="font-medium text-white mb-3">Quick Setup</h4>
                <div className="bg-black/40 rounded-lg p-3 font-mono text-xs text-white/70 overflow-x-auto">
                    <code>
                        # Add to ~/.zshrc or ~/.bashrc
                        {'\n'}export ANTHROPIC_API_KEY="sk-ant-..."
                        {'\n'}export GOOGLE_API_KEY="AIza..."
                        {'\n'}export OPENAI_API_KEY="sk-..."
                        {'\n\n'}# Then reload your shell
                        {'\n'}source ~/.zshrc
                    </code>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// Main Component
// ============================================================================

interface GlassAgentSettingsProps {
    onClose?: () => void;
}

export const GlassAgentSettings: React.FC<GlassAgentSettingsProps> = () => {
    const [activeTab, setActiveTab] = useState<TabId>('quick');
    const [env, setEnv] = useState<EnvironmentCapabilities | null>(null);
    const [loading, setLoading] = useState(true);
    const { updateAutoConfigState } = useContainerStore();

    // Fetch environment capabilities on mount
    const detectEnvironment = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/container/detect');
            if (response.ok) {
                const data = await response.json();
                setEnv(data);
                // Update store with detected info
                updateAutoConfigState({
                    lastDetected: Date.now(),
                    dockerAvailable: data.docker.available,
                    dockerPlatform: data.docker.platform,
                    detectedApiKeys: data.apiKeys,
                    detectedCliTools: data.cliTools,
                    systemMemory: data.system.totalMemory,
                    cpuCores: data.system.cpuCores,
                });
            }
        } catch (error) {
            console.error('Failed to detect environment:', error);
            // Use mock data for development
            setEnv({
                docker: { available: true, version: '24.0.7', platform: 'docker-desktop' },
                system: { platform: 'darwin', arch: 'arm64', totalMemory: 32 * 1024 * 1024 * 1024, cpuCores: 10 },
                apiKeys: { anthropic: true, openai: false, google: true, minimax: false },
                cliTools: { geminiCli: true, claudeCode: true },
            });
        } finally {
            setLoading(false);
        }
    }, [updateAutoConfigState]);

    useEffect(() => {
        detectEnvironment();
    }, [detectEnvironment]);

    // Check if setup is complete
    const setupComplete = useMemo(() => {
        if (!env) return false;
        return (
            env.docker.available &&
            (env.apiKeys.anthropic || env.apiKeys.google || env.apiKeys.openai)
        );
    }, [env]);

    const tabs = [
        { id: 'quick' as const, label: 'Quick Setup', icon: Zap, badge: !setupComplete ? '!' : undefined },
        { id: 'sdk' as const, label: 'AI Models', icon: Brain },
        { id: 'keys' as const, label: 'API Keys', icon: Key },
        { id: 'advanced' as const, label: 'Advanced', icon: Settings },
    ];

    return (
        <div className="space-y-6">
            {/* Status Overview */}
            <AgentStatusOverview env={env} loading={loading} />

            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 rounded-xl bg-black/20">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                                activeTab === tab.id
                                    ? "bg-[var(--glass-accent)] text-white shadow-lg"
                                    : "text-white/60 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Icon size={16} />
                            {tab.label}
                            {tab.badge && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold bg-amber-500 text-white rounded-full">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'quick' && (
                        <QuickSetupTab env={env} loading={loading} onDetect={detectEnvironment} />
                    )}
                    {activeTab === 'sdk' && <SDKPreferencesTab env={env} />}
                    {activeTab === 'keys' && <ApiKeysTab env={env} />}
                    {activeTab === 'advanced' && (
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-center text-white/50">
                            <Server className="mx-auto mb-3" size={32} />
                            <p>Advanced container settings are available in the Containers tab.</p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default GlassAgentSettings;
