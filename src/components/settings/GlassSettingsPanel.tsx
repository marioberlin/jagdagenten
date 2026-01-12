import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '@/stores/themeStore';
import { useAgentConfig } from '@/context/AgentConfigContext';

import { Backgrounds } from '../Backgrounds/BackgroundRegistry';
import { Check, Monitor, Cpu, Eye, Shield } from 'lucide-react';
import { cn } from '@/utils/cn';

interface GlassSettingsPanelProps {
    onClose?: () => void;
}

export const GlassSettingsPanel: React.FC<GlassSettingsPanelProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = React.useState('visual');

    // Global Theme State
    const {
        glassIntensity, setGlassIntensity,
        glassBlur, setGlassBlur,
        glassSaturation, setGlassSaturation,
        glassRadius, setGlassRadius,
        glassMaterial, setGlassMaterial,
        outlineOpacity, setOutlineOpacity,
        shadowStrength, setShadowStrength,
        theme, setMode,
        activeBackgroundId, setBackground
    } = useThemeStore();



    // Agent & System Config
    const {
        contextStrategy, setContextStrategy,
        runtimeMode, setRuntimeMode,
        nlwebMode, setNLWebMode,
        llmProvider, setLLMProvider,
        claudeApiKey, setClaudeApiKey
    } = useAgentConfig();

    const tabs = [
        { id: 'visual', label: 'Visual', icon: Eye },
        { id: 'agent', label: 'Agent', icon: Cpu },
        { id: 'system', label: 'System', icon: Monitor },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    return (
        <div className="flex h-full bg-[#0a0a0a]/50 text-white font-sans">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/10 p-4 flex flex-col gap-2 bg-black/20">
                <div className="mb-6 px-2">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Settings
                    </h2>
                </div>

                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                                activeTab === tab.id
                                    ? "bg-[var(--glass-accent)]/20 text-[var(--glass-accent)] border border-[var(--glass-accent)]/30"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="max-w-3xl mx-auto space-y-8"
                    >
                        {/* === VISUAL SETTINGS === */}
                        {activeTab === 'visual' && (
                            <>
                                <Section title="Appearance">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            onClick={() => setMode('dark')}
                                            className={cn("cursor-pointer rounded-xl border-2 p-4 transition-all", theme === 'dark' ? "border-[var(--glass-accent)] bg-[var(--glass-accent)]/10" : "border-white/10 hover:border-white/20")}
                                        >
                                            <div className="h-20 rounded-lg bg-gradient-to-br from-gray-900 to-black mb-3 border border-white/10" />
                                            <div className="text-sm font-medium">Dark Mode</div>
                                        </div>
                                        <div
                                            onClick={() => setMode('light')}
                                            className={cn("cursor-pointer rounded-xl border-2 p-4 transition-all", theme === 'light' ? "border-[var(--glass-accent)] bg-[var(--glass-accent)]/10" : "border-white/10 hover:border-white/20")}
                                        >
                                            <div className="h-20 rounded-lg bg-gradient-to-br from-gray-100 to-white mb-3 border border-black/5" />
                                            <div className="text-sm font-medium">Light Mode</div>
                                        </div>
                                    </div>
                                </Section>

                                <Section title="Glass Physics">
                                    <RangeControl label="Blur Strength" value={glassBlur} min={0} max={40} unit="px" onChange={setGlassBlur} />
                                    <RangeControl label="Saturation" value={glassSaturation} min={100} max={200} unit="%" onChange={setGlassSaturation} />
                                    <RangeControl label="Opacity" value={glassIntensity} min={0} max={1} step={0.05} onChange={setGlassIntensity} />
                                    <RangeControl label="Corner Radius" value={glassRadius} min={0} max={32} unit="px" onChange={setGlassRadius} />
                                    <RangeControl label="Outline Opacity" value={outlineOpacity} min={0} max={1} step={0.05} onChange={setOutlineOpacity} />
                                </Section>

                                <Section title="Immersive Background">
                                    <div className="grid grid-cols-3 gap-3">
                                        {Backgrounds.map((bg) => (
                                            <button
                                                key={bg.id}
                                                onClick={() => setBackground(bg.id)}
                                                className={cn(
                                                    "relative aspect-video rounded-lg overflow-hidden border-2 transition-all",
                                                    activeBackgroundId === bg.id ? "border-[var(--glass-accent)]" : "border-transparent opacity-60 hover:opacity-100"
                                                )}
                                            >
                                                {bg.type === 'image' && <img src={bg.src} className="w-full h-full object-cover" alt={bg.name} />}
                                                {bg.type === 'video' && <div className="w-full h-full bg-black flex items-center justify-center text-xs text-white/50">Video</div>}
                                                {bg.type === 'element' && <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900" />}

                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5 text-xs text-white backdrop-blur-sm truncate">
                                                    {bg.name}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </Section>
                            </>
                        )}

                        {/* === AGENT SETTINGS === */}
                        {activeTab === 'agent' && (
                            <>
                                <Section title="LLM Provider">
                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            {(['gemini', 'claude', 'proxy'] as const).map((p) => (
                                                <button
                                                    key={p}
                                                    onClick={() => setLLMProvider(p)}
                                                    className={cn(
                                                        "flex-1 py-3 px-4 rounded-xl border border-white/10 text-sm font-medium capitalize transition-all",
                                                        llmProvider === p ? "bg-[var(--glass-accent)] text-white border-transparent" : "hover:bg-white/5"
                                                    )}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>

                                        {llmProvider === 'claude' && (
                                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                                <label className="block text-xs font-medium text-white/40 mb-2">Anthropic API Key</label>
                                                <input
                                                    type="password"
                                                    value={claudeApiKey}
                                                    onChange={(e) => setClaudeApiKey(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--glass-accent)]"
                                                    placeholder="sk-ant-..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                </Section>

                                <Section title="Context Strategy">
                                    <div className="grid grid-cols-2 gap-4">
                                        <SelectCard
                                            title="Flat Context"
                                            description="Simple, single-layer context. Best for simple queries."
                                            active={contextStrategy === 'flat'}
                                            onClick={() => setContextStrategy('flat')}
                                        />
                                        <SelectCard
                                            title="Tree Context"
                                            description="Hierarchical, routed-aware context. Best for complex tasks."
                                            active={contextStrategy === 'tree'}
                                            onClick={() => setContextStrategy('tree')}
                                        />
                                    </div>
                                </Section>

                                <Section title="Runtime Mode">
                                    <div className="flex bg-white/5 p-1 rounded-xl">
                                        <button
                                            onClick={() => setRuntimeMode('demo')}
                                            className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all", runtimeMode === 'demo' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white")}
                                        >
                                            Demo / Sandbox
                                        </button>
                                        <button
                                            onClick={() => setRuntimeMode('production')}
                                            className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all", runtimeMode === 'production' ? "bg-red-500/20 text-red-400 shadow-sm" : "text-white/40 hover:text-white")}
                                        >
                                            Production (Live Money)
                                        </button>
                                    </div>
                                    <p className="text-xs text-white/40 mt-2">
                                        Production mode enables real trading execution. Use with caution.
                                    </p>
                                </Section>
                            </>
                        )}

                        {/* === SYSTEM SETTINGS === */}
                        {activeTab === 'system' && (
                            <Section title="Environment">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">Rate Limits</span>
                                            <span className="text-xs text-white/40">Tier: Session</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-mono text-[var(--glass-accent)]">50 req/15min</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">NLWeb Mode</span>
                                            <span className="text-xs text-white/40">Natural Language Web Access</span>
                                        </div>
                                        <select
                                            value={nlwebMode}
                                            onChange={(e) => setNLWebMode(e.target.value as any)}
                                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                                        >
                                            <option value="standard">Standard</option>
                                            <option value="secure">Secure (No External)</option>
                                        </select>
                                    </div>
                                </div>
                            </Section>
                        )}

                        {/* === SECURITY SETTINGS === */}
                        {activeTab === 'security' && (
                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                                <Shield size={48} className="mb-4" />
                                <h3 className="text-lg font-medium">Security Center</h3>
                                <p className="text-sm max-w-xs mt-2">Security audits and blacklist management coming in Phase 4.</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

// --- Subcomponents ---

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">{title}</h3>
        {children}
    </div>
);

const RangeControl: React.FC<{ label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (val: number) => void }> = ({ label, value, min, max, step = 1, unit = '', onChange }) => (
    <div className="flex items-center gap-4">
        <div className="w-32 text-sm font-medium text-white/80">{label}</div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="flex-1 accent-[var(--glass-accent)] h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
        />
        <div className="w-12 text-right text-xs font-mono text-white/60">
            {value}{unit}
        </div>
    </div>
);

const SelectCard: React.FC<{ title: string; description: string; active: boolean; onClick: () => void }> = ({ title, description, active, onClick }) => (
    <div
        onClick={onClick}
        className={cn(
            "p-4 rounded-xl border-2 cursor-pointer transition-all text-left",
            active ? "border-[var(--glass-accent)] bg-[var(--glass-accent)]/10" : "border-white/10 hover:border-white/20 bg-white/5"
        )}
    >
        <div className="flex justify-between items-start mb-1">
            <span className="font-medium text-sm">{title}</span>
            {active && <Check size={14} className="text-[var(--glass-accent)]" />}
        </div>
        <p className="text-xs text-white/50 leading-relaxed">{description}</p>
    </div>
);
