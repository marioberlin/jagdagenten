import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '@/stores/themeStore';
import { useAgentConfig } from '@/context/AgentConfigContext';

import { Backgrounds } from '../Backgrounds/BackgroundRegistry';
import {
    Check, Monitor, Cpu, Eye, Palette, Image as ImageIcon,
    Sparkles, Video, LayoutGrid, Sun, Moon, Zap,
    Contrast, Volume2, VolumeX, Keyboard, ChevronDown, ChevronRight,
    Download, Upload, Trash2, Database, RefreshCw, Settings,
    RotateCcw, Search, X, Copy, Plus, Save, Play,
    MonitorPlay, Ear, FileJson, FileText, Bot, BarChart3,
    AlertTriangle, ShieldAlert, Clock, Lock, Brain, Wand2, FileSearch,
    Book, Tag, Globe, Edit3, Star, StarOff,
    Package, Server, ShieldCheck, Puzzle, Shield,
    Lightbulb, Type, Layers, Layout, Settings2, Move, Minimize2, Info, Key,
    Mail, Calendar, ChevronLeft,
} from 'lucide-react';
import { AIWallpaperGenerator } from '@/pages/settings-components/AIWallpaperGenerator';
import { GlassContainerSettings } from './GlassContainerSettings';
import { GlassAgentSettings } from './GlassAgentSettings';
import { cn } from '@/utils/cn';

interface GlassSettingsPanelProps {
    onClose?: () => void;  // eslint-disable-line @typescript-eslint/no-unused-vars
}

// ============================================
// Tab Configuration
// ============================================

const tabs = [
    { id: 'visual', label: 'Appearance', icon: Palette, description: 'Themes, backgrounds, glass effects' },
    { id: 'ai-agents', label: 'AI Agents', icon: Brain, description: 'SDK preferences, API keys, auto-config' },
    { id: 'agent', label: 'Agent', icon: Cpu, description: 'LLM provider, context strategy' },
    { id: 'knowledge', label: 'Knowledge', icon: Book, description: 'Agent knowledge base' },
    { id: 'plugins', label: 'Plugins', icon: Puzzle, description: 'Extensions & MCP servers' },
    { id: 'containers', label: 'Containers', icon: Server, description: 'Remote deployment, pool settings' },
    { id: 'accessibility', label: 'Accessibility', icon: Eye, description: 'Motion, vision, audio' },
    { id: 'keyboard', label: 'Shortcuts', icon: Keyboard, description: 'Keyboard shortcuts' },
    { id: 'credentials', label: 'Credentials', icon: Key, description: 'API keys & secrets' },
    { id: 'data', label: 'Data', icon: Database, description: 'Export, import, reset' },
    { id: 'system', label: 'System', icon: Monitor, description: 'Rate limits, environment' },
];

// ============================================
// Main Component
// ============================================

export const GlassSettingsPanel: React.FC<GlassSettingsPanelProps> = () => {
    const [activeTab, setActiveTab] = useState('visual');
    const [visualSubTab, setVisualSubTab] = useState<'themes' | 'backgrounds' | 'glass' | 'customization'>('themes');
    const [backgroundFilter, setBackgroundFilter] = useState<'all' | 'element' | 'image' | 'video' | 'ai'>('all');

    // Global Theme State
    const {
        glass,
        visual,
        mode,
        setMode,
        activeBackgroundId,
        setBackground,
        themes,
        applyTheme,
        createTheme,
        duplicateTheme,
        deleteTheme,
        setGlassIntensity,
        setBlurStrength,
        setGlassSaturation,
        setRadius,
        setOutlineOpacity,
        setShadowStrength,
        setGlassTintColor,
        setAccentColor,
        setGlassMaterial,
        setSpecularEnabled,
        setNoiseOpacity,
        setTextVibrancy,
        setTextShadowEnabled,
        setOverlayEnabled,
        setOverlayIntensity,
        density,
        setDensity,
        setBounceIntensity,
        setPulseIntensity,
        setScaleIntensity,
        setWiggleIntensity,
        performance,
        setPerformanceMode,
    } = useThemeStore();

    // Agent & System Config
    const {
        contextStrategy, setContextStrategy,
        runtimeMode, setRuntimeMode,
        nlwebMode, setNLWebMode,
        llmProvider, setLLMProvider,
        claudeApiKey, setClaudeApiKey,
        securityBlacklist, setSecurityBlacklist,
        getConfigForRoute, updatePageConfig
    } = useAgentConfig();

    // Filter backgrounds
    const filteredBackgrounds = useMemo(() => {
        if (backgroundFilter === 'all') return Backgrounds;
        return Backgrounds.filter(bg => bg.type === backgroundFilter);
    }, [backgroundFilter]);

    return (
        <div className="flex h-full bg-[#0a0a0a]/50 text-white font-sans">
            {/* Sidebar */}
            <div className="w-72 border-r border-white/10 flex flex-col bg-black/20">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Settings
                    </h2>
                    <p className="text-xs text-white/40 mt-1">Customize your experience</p>
                </div>

                {/* Tab List */}
                <div className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
                                    activeTab === tab.id
                                        ? "bg-[var(--glass-accent)]/20 text-[var(--glass-accent)] border border-[var(--glass-accent)]/30"
                                        : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
                                )}
                            >
                                <Icon size={18} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium">{tab.label}</div>
                                    <div className="text-xs text-white/40 truncate">{tab.description}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Theme Mode Toggle */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                        <div className="flex items-center gap-2">
                            {mode === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                            <span className="text-sm font-medium">{mode === 'dark' ? 'Dark' : 'Light'} Mode</span>
                        </div>
                        <button
                            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            {mode === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="p-8"
                    >
                        {/* === APPEARANCE SETTINGS === */}
                        {activeTab === 'visual' && (
                            <div className="max-w-4xl mx-auto space-y-6">
                                {/* Sub-tab Navigation */}
                                <div className="flex gap-2 p-1 rounded-xl bg-white/5 w-fit">
                                    {[
                                        { id: 'themes', label: 'Themes', icon: Palette },
                                        { id: 'backgrounds', label: 'Backgrounds', icon: ImageIcon },
                                        { id: 'glass', label: 'Glass Effects', icon: Sparkles },
                                        { id: 'customization', label: 'Customization', icon: Settings2 },
                                    ].map((sub) => (
                                        <button
                                            key={sub.id}
                                            onClick={() => setVisualSubTab(sub.id as typeof visualSubTab)}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                                visualSubTab === sub.id
                                                    ? "bg-[var(--glass-accent)] text-white"
                                                    : "text-white/60 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <sub.icon size={16} />
                                            {sub.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Themes Sub-tab */}
                                {visualSubTab === 'themes' && (
                                    <ThemesPanel
                                        themes={themes}
                                        activeThemeId={themes.activeId}
                                        applyTheme={applyTheme}
                                        createTheme={createTheme}
                                        duplicateTheme={duplicateTheme}
                                        deleteTheme={deleteTheme}
                                    />
                                )}

                                {/* Backgrounds Sub-tab */}
                                {visualSubTab === 'backgrounds' && (
                                    <BackgroundsPanel
                                        backgrounds={filteredBackgrounds}
                                        activeBackgroundId={activeBackgroundId}
                                        setBackground={setBackground}
                                        filter={backgroundFilter}
                                        setFilter={setBackgroundFilter}
                                    />
                                )}

                                {/* Glass Effects Sub-tab */}
                                {visualSubTab === 'glass' && (
                                    <GlassEffectsPanel
                                        glassIntensity={glass.intensity}
                                        setGlassIntensity={setGlassIntensity}
                                        glassBlur={glass.blurStrength}
                                        setGlassBlur={setBlurStrength}
                                        glassSaturation={glass.saturation}
                                        setGlassSaturation={setGlassSaturation}
                                        radius={visual.radius}
                                        setRadius={setRadius}
                                        outlineOpacity={visual.outlineOpacity}
                                        setOutlineOpacity={setOutlineOpacity}
                                        shadowStrength={visual.shadowStrength}
                                        setShadowStrength={setShadowStrength}
                                    />
                                )}

                                {/* Customization Sub-tab */}
                                {visualSubTab === 'customization' && (
                                    <CustomizationPanel
                                        mode={mode}
                                        glass={glass}
                                        visual={visual}
                                        density={density}
                                        performanceMode={performance.mode}
                                        setGlassTintColor={setGlassTintColor}
                                        setAccentColor={setAccentColor}
                                        setGlassMaterial={setGlassMaterial}
                                        setSpecularEnabled={setSpecularEnabled}
                                        setNoiseOpacity={setNoiseOpacity}
                                        setTextVibrancy={setTextVibrancy}
                                        setTextShadowEnabled={setTextShadowEnabled}
                                        setOverlayEnabled={setOverlayEnabled}
                                        setOverlayIntensity={setOverlayIntensity}
                                        setDensity={setDensity}
                                        setBounceIntensity={setBounceIntensity}
                                        setPulseIntensity={setPulseIntensity}
                                        setScaleIntensity={setScaleIntensity}
                                        setWiggleIntensity={setWiggleIntensity}
                                        setPerformanceMode={setPerformanceMode}
                                    />
                                )}
                            </div>
                        )}

                        {/* === AGENT SETTINGS === */}
                        {/* === AI AGENTS (NEW) === */}
                        {activeTab === 'ai-agents' && (
                            <div className="max-w-4xl mx-auto">
                                <GlassAgentSettings />
                            </div>
                        )}

                        {activeTab === 'agent' && (
                            <AgentConfigPanel
                                llmProvider={llmProvider}
                                setLLMProvider={setLLMProvider}
                                contextStrategy={contextStrategy}
                                setContextStrategy={setContextStrategy}
                                runtimeMode={runtimeMode}
                                setRuntimeMode={setRuntimeMode}
                                nlwebMode={nlwebMode}
                                setNLWebMode={setNLWebMode}
                                securityBlacklist={securityBlacklist}
                                setSecurityBlacklist={setSecurityBlacklist}
                                getConfigForRoute={getConfigForRoute}
                                updatePageConfig={updatePageConfig}
                            />
                        )}

                        {/* === CREDENTIALS === */}
                        {activeTab === 'credentials' && (
                            <CredentialsPanel
                                claudeApiKey={claudeApiKey}
                                setClaudeApiKey={setClaudeApiKey}
                            />
                        )}

                        {/* === KNOWLEDGE BASE === */}
                        {activeTab === 'knowledge' && (
                            <KnowledgeBasePanel />
                        )}

                        {/* === PLUGINS === */}
                        {activeTab === 'plugins' && (
                            <PluginsPanel />
                        )}

                        {/* === CONTAINERS === */}
                        {activeTab === 'containers' && (
                            <div className="max-w-4xl mx-auto">
                                <GlassContainerSettings />
                            </div>
                        )}

                        {/* === ACCESSIBILITY SETTINGS === */}
                        {activeTab === 'accessibility' && (
                            <AccessibilityPanel />
                        )}

                        {/* === KEYBOARD SHORTCUTS === */}
                        {activeTab === 'keyboard' && (
                            <KeyboardShortcutsPanel />
                        )}

                        {/* === DATA MANAGEMENT === */}
                        {activeTab === 'data' && (
                            <DataManagementPanel />
                        )}

                        {/* === SYSTEM SETTINGS === */}
                        {activeTab === 'system' && (
                            <div className="max-w-3xl mx-auto">
                                <Section title="Environment" icon={<Monitor size={18} />}>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">Rate Limits</span>
                                                <span className="text-xs text-white/40">Tier: Session</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-mono text-[var(--glass-accent)]">50 req/15min</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">NLWeb Mode</span>
                                                <span className="text-xs text-white/40">Natural Language Web Access</span>
                                            </div>
                                            <select
                                                value={nlwebMode}
                                                onChange={(e) => setNLWebMode(e.target.value as 'standard' | 'secure')}
                                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                            >
                                                <option value="standard">Standard</option>
                                                <option value="secure">Secure (No External)</option>
                                            </select>
                                        </div>

                                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">Version</span>
                                                <span className="text-xs text-white/40">LiquidCrypto</span>
                                            </div>
                                            <span className="text-sm font-mono text-white/60">v2.0.0</span>
                                        </div>
                                    </div>
                                </Section>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

// ============================================
// Themes Panel
// ============================================

interface ThemesPanelProps {
    themes: { builtIn: any[]; custom: any[]; activeId: string | null };
    activeThemeId: string | null;
    applyTheme: (id: string) => void;
    createTheme: (name: string) => void;
    duplicateTheme: (id: string, name: string) => void;
    deleteTheme: (id: string) => void;
}

const ThemesPanel: React.FC<ThemesPanelProps> = ({
    themes,
    activeThemeId,
    applyTheme,
    createTheme,
    duplicateTheme,
    deleteTheme,
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newThemeName, setNewThemeName] = useState('');

    return (
        <div className="space-y-6">
            {/* Built-in Themes */}
            <Section title="Built-in Themes" icon={<Palette size={18} />}>
                <p className="text-sm text-white/50 mb-4">Curated themes optimized for light and dark modes</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {themes.builtIn.map((thm) => (
                        <ThemeCard
                            key={thm.id}
                            theme={thm}
                            isActive={activeThemeId === thm.id}
                            onSelect={() => applyTheme(thm.id)}
                            onDuplicate={() => duplicateTheme(thm.id, `${thm.name} Copy`)}
                        />
                    ))}
                </div>
            </Section>

            {/* Custom Themes */}
            <Section
                title="Custom Themes"
                icon={<Plus size={18} />}
                action={
                    isCreating ? (
                        <div className="flex items-center gap-2">
                            <input
                                autoFocus
                                type="text"
                                value={newThemeName}
                                onChange={(e) => setNewThemeName(e.target.value)}
                                placeholder="Theme name..."
                                className="w-32 px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 text-sm focus:outline-none focus:border-[var(--glass-accent)]"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newThemeName.trim()) {
                                        createTheme(newThemeName.trim());
                                        setNewThemeName('');
                                        setIsCreating(false);
                                    } else if (e.key === 'Escape') {
                                        setIsCreating(false);
                                        setNewThemeName('');
                                    }
                                }}
                            />
                            <button
                                onClick={() => {
                                    if (newThemeName.trim()) {
                                        createTheme(newThemeName.trim());
                                        setNewThemeName('');
                                        setIsCreating(false);
                                    }
                                }}
                                className="p-1.5 rounded-lg bg-[var(--glass-accent)] text-white"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                onClick={() => {
                                    setIsCreating(false);
                                    setNewThemeName('');
                                }}
                                className="p-1.5 rounded-lg bg-white/10 text-white/60"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--glass-accent)]/20 text-[var(--glass-accent)] text-sm font-medium hover:bg-[var(--glass-accent)]/30 transition-colors"
                        >
                            <Plus size={14} />
                            New
                        </button>
                    )
                }
            >
                {themes.custom.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {themes.custom.map((thm) => (
                            <ThemeCard
                                key={thm.id}
                                theme={thm}
                                isActive={activeThemeId === thm.id}
                                onSelect={() => applyTheme(thm.id)}
                                onDuplicate={() => duplicateTheme(thm.id, `${thm.name} Copy`)}
                                onDelete={() => deleteTheme(thm.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-white/40">
                        <Palette size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No custom themes yet</p>
                        <p className="text-xs">Create one from scratch or duplicate a built-in theme</p>
                    </div>
                )}
            </Section>
        </div>
    );
};

// ============================================
// Theme Card
// ============================================

interface ThemeCardProps {
    theme: any;
    isActive: boolean;
    onSelect: () => void;
    onDuplicate: () => void;
    onDelete?: () => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ theme, isActive, onSelect, onDuplicate, onDelete }) => {
    const bg = Backgrounds.find(b => b.id === theme.light?.background?.id || theme.dark?.background?.id);

    return (
        <div
            className={cn(
                "relative rounded-xl border-2 overflow-hidden transition-all cursor-pointer group",
                isActive
                    ? "border-[var(--glass-accent)] shadow-lg shadow-[var(--glass-accent)]/20"
                    : "border-white/10 hover:border-white/30"
            )}
        >
            {/* Preview */}
            <button onClick={onSelect} className="w-full">
                <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                    {bg?.type === 'image' && bg.src && (
                        <img src={bg.src} alt={bg.name} className="w-full h-full object-cover" />
                    )}
                    {bg?.type === 'element' && bg.component && (
                        <div className="w-full h-full overflow-hidden pointer-events-none">
                            <bg.component />
                        </div>
                    )}
                    {/* Accent color indicator */}
                    <div
                        className="absolute bottom-2 left-2 w-4 h-4 rounded-full border-2 border-white/50"
                        style={{ backgroundColor: theme.dark?.visual?.accentColor || theme.light?.visual?.accentColor || '#3b82f6' }}
                    />
                </div>
                <div className="p-2 bg-black/40">
                    <div className="text-xs font-medium truncate">{theme.name}</div>
                </div>
            </button>

            {/* Actions */}
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                    className="p-1 rounded bg-black/60 hover:bg-black/80 text-white/80"
                    title="Duplicate"
                >
                    <Copy size={12} />
                </button>
                {onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-1 rounded bg-red-500/60 hover:bg-red-500/80 text-white"
                        title="Delete"
                    >
                        <Trash2 size={12} />
                    </button>
                )}
            </div>

            {/* Active indicator */}
            {isActive && (
                <div className="absolute top-1 left-1 p-1 rounded-full bg-[var(--glass-accent)]">
                    <Check size={10} className="text-white" />
                </div>
            )}
        </div>
    );
};

// ============================================
// Backgrounds Panel
// ============================================

interface BackgroundsPanelProps {
    backgrounds: typeof Backgrounds;
    activeBackgroundId: string;
    setBackground: (id: string, preferredMode?: 'light' | 'dark') => void;
    filter: 'all' | 'element' | 'image' | 'video' | 'ai';
    setFilter: (filter: 'all' | 'element' | 'image' | 'video' | 'ai') => void;
}

const BackgroundsPanel: React.FC<BackgroundsPanelProps> = ({
    backgrounds,
    activeBackgroundId,
    setBackground,
    filter,
    setFilter,
}) => {
    const filterOptions: Array<{ id: 'all' | 'element' | 'image' | 'video'; label: string; icon: React.ElementType; count: number }> = [
        { id: 'all', label: 'All', icon: LayoutGrid, count: Backgrounds.length },
        { id: 'element', label: 'Dynamic', icon: Sparkles, count: Backgrounds.filter(b => b.type === 'element').length },
        { id: 'image', label: 'Images', icon: ImageIcon, count: Backgrounds.filter(b => b.type === 'image').length },
        { id: 'video', label: 'Videos', icon: Video, count: Backgrounds.filter(b => b.type === 'video').length },
    ];

    return (
        <div className="space-y-6">
            <Section title="Immersive Backgrounds" icon={<ImageIcon size={18} />}>
                {/* Filter Pills */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {filterOptions.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setFilter(opt.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                                filter === opt.id
                                    ? "bg-[var(--glass-accent)] text-white"
                                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <opt.icon size={14} />
                            {opt.label}
                            <span className="text-xs opacity-60">({opt.count})</span>
                        </button>
                    ))}
                    {/* AI Studio Button - Special styling */}
                    <button
                        onClick={() => setFilter('ai')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                            filter === 'ai'
                                ? "bg-gradient-to-r from-[var(--glass-accent)] to-purple-600 text-white shadow-lg shadow-[var(--glass-accent)]/25"
                                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        <Wand2 size={14} />
                        AI Studio
                    </button>
                </div>

                {/* AI Studio Content */}
                {filter === 'ai' ? (
                    <AIWallpaperGenerator onSelectBackground={(id, theme) => setBackground(id, theme)} />
                ) : (
                    /* Background Grid */
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {backgrounds.map((bg) => (
                            <button
                                key={bg.id}
                                onClick={() => setBackground(bg.id, bg.preferredTheme)}
                                className={cn(
                                    "relative aspect-video rounded-xl overflow-hidden border-2 transition-all group",
                                    activeBackgroundId === bg.id
                                        ? "border-[var(--glass-accent)] shadow-lg shadow-[var(--glass-accent)]/20 scale-105"
                                        : "border-transparent hover:border-white/30 hover:scale-102"
                                )}
                            >
                                {/* Background Preview */}
                                {bg.type === 'image' && (
                                    <img src={bg.src} className="w-full h-full object-cover" alt={bg.name} />
                                )}
                                {bg.type === 'video' && (
                                    <div className="w-full h-full relative">
                                        <img src={bg.thumbnail} className="w-full h-full object-cover" alt={bg.name} />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                <Video size={20} className="text-white" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {bg.type === 'element' && (
                                    <div className={cn("w-full h-full overflow-hidden", bg.preferredTheme === 'light' ? 'bg-white' : 'bg-black')}>
                                        {bg.component && <bg.component />}
                                    </div>
                                )}

                                {/* Name Label */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                    <span className="text-xs font-medium text-white truncate block">{bg.name}</span>
                                </div>

                                {/* Type Badge */}
                                {filter === 'all' && (
                                    <div className={cn(
                                        "absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm",
                                        bg.type === 'element' ? 'bg-purple-500/80 text-white' :
                                            bg.type === 'image' ? 'bg-blue-500/80 text-white' :
                                                'bg-red-500/80 text-white'
                                    )}>
                                        {bg.type === 'element' ? 'Dynamic' : bg.type === 'image' ? 'Image' : 'Video'}
                                    </div>
                                )}

                                {/* Active Indicator */}
                                {activeBackgroundId === bg.id && (
                                    <div className="absolute top-2 right-2 p-1 rounded-full bg-[var(--glass-accent)]">
                                        <Check size={12} className="text-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </Section>
        </div>
    );
};

// ============================================
// Glass Effects Panel
// ============================================

interface GlassEffectsPanelProps {
    glassIntensity: number;
    setGlassIntensity: (v: number) => void;
    glassBlur: number;
    setGlassBlur: (v: number) => void;
    glassSaturation: number;
    setGlassSaturation: (v: number) => void;
    radius: number;
    setRadius: (v: number) => void;
    outlineOpacity: number;
    setOutlineOpacity: (v: number) => void;
    shadowStrength: number;
    setShadowStrength: (v: number) => void;
}

const GlassEffectsPanel: React.FC<GlassEffectsPanelProps> = (props) => {
    return (
        <Section title="Glass Physics" icon={<Sparkles size={18} />}>
            <div className="space-y-6">
                {/* Live Preview */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 border border-white/10">
                    <div
                        className="p-4 rounded-xl transition-all"
                        style={{
                            backgroundColor: `rgba(255,255,255,${props.glassIntensity * 0.01})`,
                            backdropFilter: `blur(${props.glassBlur}px) saturate(${props.glassSaturation}%)`,
                            borderRadius: `${props.radius}px`,
                            boxShadow: `0 ${props.shadowStrength / 4}px ${props.shadowStrength}px rgba(0,0,0,0.2)`,
                            border: `1px solid rgba(255,255,255,${props.outlineOpacity / 100})`,
                        }}
                    >
                        <div className="text-sm font-medium mb-1">Live Preview</div>
                        <div className="text-xs text-white/60">Adjust the sliders to see changes in real-time</div>
                    </div>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                    <RangeControl label="Blur Strength" value={props.glassBlur} min={0} max={100} unit="%" onChange={props.setGlassBlur} />
                    <RangeControl label="Saturation" value={props.glassSaturation} min={100} max={200} unit="%" onChange={props.setGlassSaturation} />
                    <RangeControl label="Intensity" value={props.glassIntensity} min={0} max={100} unit="%" onChange={props.setGlassIntensity} />
                    <RangeControl label="Corner Radius" value={props.radius} min={0} max={48} unit="px" onChange={props.setRadius} />
                    <RangeControl label="Outline Opacity" value={props.outlineOpacity} min={0} max={100} unit="%" onChange={props.setOutlineOpacity} />
                    <RangeControl label="Shadow Strength" value={props.shadowStrength} min={0} max={100} unit="%" onChange={props.setShadowStrength} />
                </div>
            </div>
        </Section>
    );
};

// ============================================
// Customization Panel (NEW - from CustomizationSection)
// ============================================

interface CustomizationPanelProps {
    mode: 'light' | 'dark';
    glass: any;
    visual: any;
    density: 'compact' | 'comfortable';
    performanceMode: boolean;
    setGlassTintColor: (color: string | null) => void;
    setAccentColor: (color: string) => void;
    setGlassMaterial: (material: 'thin' | 'regular' | 'thick') => void;
    setSpecularEnabled: (enabled: boolean) => void;
    setNoiseOpacity: (opacity: number) => void;
    setTextVibrancy: (vibrancy: number) => void;
    setTextShadowEnabled: (enabled: boolean) => void;
    setOverlayEnabled: (enabled: boolean) => void;
    setOverlayIntensity: (intensity: number) => void;
    setDensity: (density: 'compact' | 'comfortable') => void;
    setBounceIntensity: (intensity: number) => void;
    setPulseIntensity: (intensity: number) => void;
    setScaleIntensity: (intensity: number) => void;
    setWiggleIntensity: (intensity: number) => void;
    setPerformanceMode: (mode: boolean) => void;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
    mode: _mode,
    glass,
    visual,
    density,
    performanceMode,
    setGlassTintColor,
    setAccentColor,
    setGlassMaterial,
    setSpecularEnabled,
    setNoiseOpacity,
    setTextVibrancy,
    setTextShadowEnabled,
    setOverlayEnabled,
    setOverlayIntensity,
    setDensity,
    setBounceIntensity,
    setPulseIntensity,
    setScaleIntensity,
    setWiggleIntensity,
    setPerformanceMode,
}) => {
    return (
        <div className="space-y-8">
            {/* Colors & Tinting */}
            <Section title="Colors & Tinting" icon={<Palette size={18} />}>
                <div className="space-y-6">
                    {/* Glass Tint */}
                    <div>
                        <h4 className="text-sm font-medium mb-2">Glass Tint</h4>
                        <p className="text-xs text-white/50 mb-4">Add a subtle color hue to glass surfaces</p>
                        <div className="flex gap-3 flex-wrap">
                            {[
                                { label: 'Neutral', value: null, color: '#888888' },
                                { label: 'Black', value: '#000000', color: '#000000' },
                                { label: 'Blue', value: '#3b82f6', color: '#3b82f6' },
                                { label: 'Purple', value: '#a855f7', color: '#a855f7' },
                                { label: 'Emerald', value: '#10b981', color: '#10b981' },
                                { label: 'Rose', value: '#f43f5e', color: '#f43f5e' },
                                { label: 'Amber', value: '#f59e0b', color: '#f59e0b' },
                            ].map((t) => (
                                <button
                                    key={t.label}
                                    onClick={() => setGlassTintColor(t.value)}
                                    className={cn(
                                        "w-10 h-10 rounded-xl border-2 transition-all hover:scale-110",
                                        glass.tintColor === t.value ? "border-white ring-2 ring-white/30" : "border-white/20"
                                    )}
                                    style={{ backgroundColor: t.color }}
                                    title={t.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Accent Color */}
                    <div className="pt-6 border-t border-white/10">
                        <h4 className="text-sm font-medium mb-2">Accent Color</h4>
                        <p className="text-xs text-white/50 mb-4">Primary color for buttons and interactive elements</p>
                        <div className="flex gap-3 flex-wrap">
                            {[
                                { label: 'Blue', value: '#007AFF' },
                                { label: 'Indigo', value: '#5856D6' },
                                { label: 'Purple', value: '#AF52DE' },
                                { label: 'Pink', value: '#FF2D55' },
                                { label: 'Red', value: '#FF3B30' },
                                { label: 'Orange', value: '#FF9500' },
                                { label: 'Green', value: '#34C759' },
                                { label: 'Teal', value: '#5AC8FA' },
                            ].map((c) => (
                                <button
                                    key={c.label}
                                    onClick={() => setAccentColor(c.value)}
                                    className={cn(
                                        "w-10 h-10 rounded-xl border-2 transition-all hover:scale-110",
                                        visual.accentColor === c.value ? "border-white ring-2 ring-white/30" : "border-white/20"
                                    )}
                                    style={{ backgroundColor: c.value }}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            {/* Typography & Readability */}
            <Section title="Typography & Readability" icon={<Type size={18} />}>
                <div className="space-y-6">
                    {/* Text Vibrancy with Preview */}
                    <div className="space-y-3">
                        <RangeControl
                            label="Text Vibrancy"
                            value={visual.textVibrancy ?? 50}
                            min={0}
                            max={100}
                            unit="%"
                            onChange={setTextVibrancy}
                        />
                        <div className="ml-36 p-4 rounded-xl bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-white/10">
                            <p
                                className="text-sm font-medium transition-all"
                                style={{
                                    filter: `brightness(${0.5 + (visual.textVibrancy ?? 50) / 100})`,
                                    textShadow: 'none'
                                }}
                            >
                                Preview: The quick brown fox jumps over the lazy dog.
                            </p>
                            <p className="text-xs text-white/40 mt-2">Vibrancy: {visual.textVibrancy ?? 50}%</p>
                        </div>
                    </div>

                    {/* Text Shadows Slider with Preview */}
                    <div className="space-y-3">
                        <RangeControl
                            label="Text Shadows"
                            value={visual.textShadowEnabled ? 100 : 0}
                            min={0}
                            max={100}
                            unit="%"
                            onChange={(val) => setTextShadowEnabled(val > 0)}
                        />
                        <div className="ml-36 p-4 rounded-xl bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-white/10 relative overflow-hidden">
                            {/* Busy background pattern */}
                            <div className="absolute inset-0 opacity-30">
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,#333_25%,transparent_25%,transparent_75%,#333_75%,#333),linear-gradient(45deg,#333_25%,transparent_25%,transparent_75%,#333_75%,#333)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]" />
                            </div>
                            <p
                                className="text-sm font-medium relative z-10 transition-all"
                                style={{
                                    textShadow: visual.textShadowEnabled
                                        ? '0 1px 2px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)'
                                        : 'none'
                                }}
                            >
                                Preview: Readable text on busy backgrounds.
                            </p>
                            <p className="text-xs text-white/40 mt-2 relative z-10">
                                Shadow: {visual.textShadowEnabled ? 'Enabled' : 'Disabled'}
                            </p>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Shapes & Spacing */}
            <Section title="Shapes & Spacing" icon={<Layout size={18} />}>
                <div className="space-y-6">
                    {/* Glass Material */}
                    <div>
                        <h4 className="text-sm font-medium mb-2">Glass Material</h4>
                        <p className="text-xs text-white/50 mb-4">Overall thickness preset for glass surfaces</p>
                        <div className="grid grid-cols-3 gap-3">
                            {(['thin', 'regular', 'thick'] as const).map((material) => (
                                <button
                                    key={material}
                                    onClick={() => setGlassMaterial(material)}
                                    className={cn(
                                        "p-4 rounded-xl border-2 transition-all text-sm font-medium capitalize",
                                        glass.material === material
                                            ? "border-[var(--glass-accent)] bg-[var(--glass-accent)]/10"
                                            : "border-white/10 hover:border-white/20 bg-white/5"
                                    )}
                                >
                                    {material}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Compact Mode */}
                    <ToggleRow
                        icon={<Minimize2 size={16} />}
                        title="Compact Mode"
                        description="Reduce padding and spacing for denser display"
                        enabled={density === 'compact'}
                        onToggle={(enabled) => setDensity(enabled ? 'compact' : 'comfortable')}
                    />
                </div>
            </Section>

            {/* Advanced Effects */}
            <Section title="Advanced Effects" icon={<Settings2 size={18} />}>
                <div className="space-y-6">
                    <ToggleRow
                        icon={<Lightbulb size={16} />}
                        title="Specular Highlights"
                        description="Simulate light reflections on glass edges"
                        enabled={glass.specularEnabled ?? true}
                        onToggle={setSpecularEnabled}
                    />
                    <div className="space-y-3">
                        <RangeControl
                            label="Noise / Grain"
                            value={glass.noiseOpacity ?? 3}
                            min={0}
                            max={100}
                            unit="%"
                            onChange={setNoiseOpacity}
                        />
                        {/* Noise Preview */}
                        <div className="ml-36 p-4 rounded-xl bg-gradient-to-br from-[var(--glass-accent)]/30 to-purple-600/30 border border-white/10 relative overflow-hidden">
                            {/* Noise overlay */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                                    opacity: (glass.noiseOpacity ?? 3) / 100,
                                    mixBlendMode: 'overlay',
                                }}
                            />
                            <p className="text-sm font-medium relative z-10">
                                Preview: Glass surface with noise texture
                            </p>
                            <p className="text-xs text-white/40 mt-2 relative z-10">
                                Noise: {glass.noiseOpacity ?? 3}%
                            </p>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                        <ToggleRow
                            icon={<Layers size={16} />}
                            title="Background Overlay"
                            description="Darken background for better panel contrast"
                            enabled={visual.overlayEnabled ?? false}
                            onToggle={setOverlayEnabled}
                        />
                        {visual.overlayEnabled && (
                            <div className="mt-4 ml-10">
                                <RangeControl
                                    label="Overlay Intensity"
                                    value={visual.overlayIntensity ?? 25}
                                    min={0}
                                    max={100}
                                    unit="%"
                                    onChange={setOverlayIntensity}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Section>

            {/* Motion & Animation */}
            <Section title="Motion & Animation" icon={<Move size={18} />}>
                <p className="text-xs text-white/50 mb-6">Control the intensity of animation effects. Set to 0 to disable.</p>
                <div className="space-y-4">
                    <AnimationRangeControl
                        label="Bounce"
                        value={visual.bounceIntensity ?? 50}
                        onChange={setBounceIntensity}
                        animationType="bounce"
                    />
                    <AnimationRangeControl
                        label="Pulse"
                        value={visual.pulseIntensity ?? 50}
                        onChange={setPulseIntensity}
                        animationType="pulse"
                    />
                    <AnimationRangeControl
                        label="Scale"
                        value={visual.scaleIntensity ?? 50}
                        onChange={setScaleIntensity}
                        animationType="scale"
                    />
                    <AnimationRangeControl
                        label="Wiggle"
                        value={visual.wiggleIntensity ?? 50}
                        onChange={setWiggleIntensity}
                        animationType="wiggle"
                    />
                </div>
            </Section>

            {/* Performance */}
            <Section title="Performance" icon={<Zap size={18} />}>
                <ToggleRow
                    icon={<Zap size={16} />}
                    title="Performance Mode"
                    description="Disable animations and heavy effects for smoother scrolling"
                    enabled={performanceMode}
                    onToggle={setPerformanceMode}
                />
            </Section>
        </div>
    );
};

// ============================================
// Agent Config Panel (COMPREHENSIVE)
// ============================================

interface PageConfig {
    systemPrompt?: string;
    knowledge?: string[];
}

interface RouteConfigItem {
    title: string;
    route: string;
    icon: React.ElementType;
    description: string;
}

const DEMO_ROUTES: RouteConfigItem[] = [
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

interface AgentConfigPanelProps {
    llmProvider: 'gemini' | 'claude' | 'proxy';
    setLLMProvider: (provider: 'gemini' | 'claude' | 'proxy') => void;

    contextStrategy: 'flat' | 'tree';
    setContextStrategy: (strategy: 'flat' | 'tree') => void;
    runtimeMode: 'demo' | 'production';
    setRuntimeMode: (mode: 'demo' | 'production') => void;
    nlwebMode: 'standard' | 'secure';
    setNLWebMode: (mode: 'standard' | 'secure') => void;
    securityBlacklist: string[];
    setSecurityBlacklist: (blacklist: string[]) => void;
    getConfigForRoute: (route: string) => PageConfig;
    updatePageConfig: (route: string, updates: Partial<PageConfig>) => void;
}

const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({
    llmProvider,
    setLLMProvider,
    contextStrategy,
    setContextStrategy,
    runtimeMode,
    setRuntimeMode,
    nlwebMode,
    setNLWebMode,
    securityBlacklist,
    setSecurityBlacklist,
    getConfigForRoute,
    updatePageConfig,
}) => {
    const [showGlobalSettings, setShowGlobalSettings] = useState(true);
    const [selectedRoute, setSelectedRoute] = useState(DEMO_ROUTES[0].route);
    const [systemPrompt, setSystemPrompt] = useState('');
    const [knowledge, setKnowledge] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    // Load config when route changes
    useEffect(() => {
        const config = getConfigForRoute(selectedRoute);
        setSystemPrompt(config.systemPrompt || '');
        setKnowledge(config.knowledge || []);
        setHasChanges(false);
    }, [selectedRoute, getConfigForRoute]);

    const handleSave = () => {
        updatePageConfig(selectedRoute, { systemPrompt, knowledge });
        setHasChanges(false);
    };

    const handleReset = () => {
        const config = getConfigForRoute(selectedRoute);
        setSystemPrompt(config.systemPrompt || '');
        setKnowledge(config.knowledge || []);
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
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20">
                    <Bot className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">Agent Configuration</h2>
                    <p className="text-xs text-white/50">Configure AI behavior and capabilities</p>
                </div>
            </div>

            {/* Global Settings Toggle */}
            <button
                onClick={() => setShowGlobalSettings(!showGlobalSettings)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Settings2 className="w-5 h-5 text-white/60" />
                    <span className="text-sm font-medium">Global Settings</span>
                </div>
                <ChevronDown className={cn("w-5 h-5 text-white/40 transition-transform", showGlobalSettings && "rotate-180")} />
            </button>

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
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400">
                                        <Server size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-white">Runtime Mode</div>
                                        <div className="text-xs text-white/50 mt-0.5">
                                            {runtimeMode === 'demo' ? 'Client-side API calls. Fast prototyping.' : 'Proxy via backend. Secure, scalable.'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex bg-black/20 p-1 rounded-xl">
                                    <button
                                        onClick={() => setRuntimeMode('demo')}
                                        className={cn(
                                            "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                                            runtimeMode === 'demo' ? "bg-violet-500 text-white shadow-lg" : "text-white/50 hover:text-white"
                                        )}
                                    >
                                        Demo (Client)
                                    </button>
                                    <button
                                        onClick={() => setRuntimeMode('production')}
                                        className={cn(
                                            "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                                            runtimeMode === 'production' ? "bg-violet-500 text-white shadow-lg" : "text-white/50 hover:text-white"
                                        )}
                                    >
                                        Production (Proxy)
                                    </button>
                                </div>
                            </div>

                            {/* Context Strategy */}
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                                        <Layers size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-white">Context Strategy</div>
                                        <div className="text-xs text-white/50 mt-0.5">
                                            {contextStrategy === 'flat' ? 'Sends ALL contexts to AI. Good for debugging.' : 'Prunes irrelevant contexts. More efficient.'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex bg-black/20 p-1 rounded-xl">
                                    <button
                                        onClick={() => setContextStrategy('flat')}
                                        className={cn(
                                            "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                                            contextStrategy === 'flat' ? "bg-blue-500 text-white shadow-lg" : "text-white/50 hover:text-white"
                                        )}
                                    >
                                        Flat (All)
                                    </button>
                                    <button
                                        onClick={() => setContextStrategy('tree')}
                                        className={cn(
                                            "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                                            contextStrategy === 'tree' ? "bg-blue-500 text-white shadow-lg" : "text-white/50 hover:text-white"
                                        )}
                                    >
                                        Tree (Smart)
                                    </button>
                                </div>
                            </div>

                            {/* Agent Pipeline */}
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                                        <Shield size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-white">Agent Pipeline</div>
                                        <div className="text-xs text-white/50 mt-0.5">
                                            {nlwebMode === 'standard' ? 'Direct LLM chat. Simple and fast.' : 'Guard Dog security + parallel processing.'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex bg-black/20 p-1 rounded-xl">
                                    <button
                                        onClick={() => setNLWebMode('standard')}
                                        className={cn(
                                            "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                                            nlwebMode === 'standard' ? "bg-sky-500 text-white shadow-lg" : "text-white/50 hover:text-white"
                                        )}
                                    >
                                        Standard
                                    </button>
                                    <button
                                        onClick={() => setNLWebMode('secure')}
                                        className={cn(
                                            "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                                            nlwebMode === 'secure' ? "bg-emerald-500 text-white shadow-lg" : "text-white/50 hover:text-white"
                                        )}
                                    >
                                        Secure NLWeb
                                    </button>
                                </div>
                            </div>

                            {/* LLM Provider */}
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                                        <Brain size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-white">LLM Provider</div>
                                        <div className="text-xs text-white/50 mt-0.5">
                                            {llmProvider === 'gemini' ? 'Google Gemini 2.0 Flash - Fast, multimodal.' :
                                                llmProvider === 'claude' ? 'Anthropic Claude - Excellent reasoning.' :
                                                    'Route through backend proxy - Production mode.'}
                                        </div>
                                    </div>
                                </div>
                                <select
                                    value={llmProvider}
                                    onChange={(e) => setLLMProvider(e.target.value as 'gemini' | 'claude' | 'proxy')}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                                >
                                    <option value="gemini">Gemini (Google)</option>
                                    <option value="claude">Claude (Anthropic)</option>
                                    <option value="proxy">Proxy (Backend)</option>
                                </select>
                            </div>
                        </div>

                        {/* Security Blacklist (when secure mode) */}
                        {nlwebMode === 'secure' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4"
                            >
                                <div className="p-4 rounded-2xl bg-white/5 border border-red-500/20 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
                                            <Lock size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold text-white">Security Blacklist</div>
                                            <div className="text-xs text-white/50 mt-0.5">
                                                Custom phrases to block. One per line. Supplements built-in filters.
                                            </div>
                                        </div>
                                    </div>
                                    <textarea
                                        value={securityBlacklist.join('\n')}
                                        onChange={(e) => setSecurityBlacklist(e.target.value.split('\n').filter(s => s.trim()))}
                                        placeholder="e.g., ignore safety rules&#10;credit card number&#10;my password is"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                    />
                                    <p className="text-xs text-white/40">
                                        {securityBlacklist.length} custom phrase{securityBlacklist.length !== 1 ? 's' : ''} added
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Per-Route Configuration */}
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                <div className="flex flex-col lg:flex-row min-h-[450px]">
                    {/* Route List Sidebar */}
                    <div className="w-full lg:w-64 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 p-4 bg-white/[0.02]">
                        <div className="flex items-center gap-2 mb-4 px-2">
                            <Sparkles size={14} className="text-[var(--glass-accent)]" />
                            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                                Page Configurations
                            </span>
                        </div>
                        <div className="space-y-1 max-h-[350px] overflow-y-auto custom-scrollbar">
                            {DEMO_ROUTES.map((route) => {
                                const RouteIcon = route.icon;
                                const isSelected = selectedRoute === route.route;
                                return (
                                    <motion.button
                                        key={route.route}
                                        onClick={() => setSelectedRoute(route.route)}
                                        className={cn(
                                            'w-full text-left p-3 rounded-xl transition-all border border-transparent',
                                            isSelected ? 'bg-[var(--glass-accent)]/15 border-[var(--glass-accent)]/30' : 'hover:bg-white/5'
                                        )}
                                        whileHover={{ x: 4 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                'p-1.5 rounded-lg',
                                                isSelected ? 'bg-[var(--glass-accent)]/20 text-[var(--glass-accent)]' : 'bg-white/5 text-white/40'
                                            )}>
                                                <RouteIcon size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={cn('text-xs font-medium truncate', isSelected ? 'text-white' : 'text-white/70')}>
                                                    {route.title}
                                                </div>
                                                <div className="text-[10px] text-white/40 truncate">{route.description}</div>
                                            </div>
                                            <ChevronRight size={12} className={cn('text-white/30 transition-transform', isSelected && 'text-[var(--glass-accent)] rotate-90')} />
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Config Panel */}
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                        {/* Panel Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                {selectedRouteConfig && (
                                    <div className="p-2 rounded-xl bg-[var(--glass-accent)]/10">
                                        <selectedRouteConfig.icon size={18} className="text-[var(--glass-accent)]" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-sm font-bold text-white">{selectedRouteConfig?.title || 'Configuration'}</h3>
                                    <p className="text-xs text-white/50">{selectedRouteConfig?.description}</p>
                                </div>
                            </div>
                            {hasChanges && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleReset}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:bg-white/10 transition-colors"
                                    >
                                        <RotateCcw size={12} />
                                        Reset
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--glass-accent)] text-white hover:opacity-90 transition-opacity"
                                    >
                                        <Save size={12} />
                                        Save
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* System Prompt */}
                        <div className="space-y-3 mb-6">
                            <div>
                                <label className="text-sm font-medium text-white">System Prompt</label>
                                <p className="text-xs text-white/50 mt-0.5">
                                    Instructions that define the AI's persona and behavior for this page.
                                </p>
                            </div>
                            <textarea
                                value={systemPrompt}
                                onChange={(e) => {
                                    setSystemPrompt(e.target.value);
                                    setHasChanges(true);
                                }}
                                placeholder="You are a helpful assistant..."
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                            />
                        </div>

                        {/* Knowledge Base */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <div>
                                    <label className="text-sm font-medium text-white">Knowledge Base</label>
                                    <p className="text-xs text-white/50">
                                        Specific facts or context the AI should know about this page.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={addKnowledgeItem}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white hover:bg-white/15 transition-colors"
                                    >
                                        <Plus size={12} />
                                        Add Item
                                    </button>
                                </div>
                            </div>

                            {/* Import Knowledge */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/20">
                                        <Upload size={16} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium">Import Knowledge</h4>
                                        <p className="text-xs text-white/50">Import from PDF, TXT, or Markdown files</p>
                                    </div>
                                </div>
                                <label className="px-4 py-2 rounded-lg bg-white/10 text-white/80 text-sm hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-2">
                                    <Upload className="w-4 h-4" />
                                    Import File
                                    <input
                                        type="file"
                                        accept=".pdf,.txt,.md,.markdown"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    const content = event.target?.result as string;
                                                    if (content) {
                                                        // Add the file content as a new knowledge item
                                                        addKnowledgeItem();
                                                        // The item gets added at the end, we need to update it
                                                        setTimeout(() => {
                                                            const newIndex = knowledge.length;
                                                            updateKnowledgeItem(newIndex, `[Imported from ${file.name}]\n\n${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}`);
                                                        }, 0);
                                                    }
                                                };
                                                reader.readAsText(file);
                                            }
                                            e.target.value = ''; // Reset input
                                        }}
                                    />
                                </label>
                            </div>

                            <div className="space-y-3">
                                {knowledge.length === 0 ? (
                                    <div className="text-center py-8 text-white/40 italic border border-dashed border-white/10 rounded-xl">
                                        <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        No custom knowledge added.
                                    </div>
                                ) : (
                                    knowledge.map((item, idx) => (
                                        <div key={idx} className="flex gap-2 items-start">
                                            <textarea
                                                value={item}
                                                onChange={(e) => updateKnowledgeItem(idx, e.target.value)}
                                                placeholder="e.g. The user prefers dark mode..."
                                                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white min-h-[70px] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                                            />
                                            <button
                                                onClick={() => removeKnowledgeItem(idx)}
                                                className="p-2 mt-1 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-lg transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// Knowledge Base Panel (NEW)
// ============================================

interface KnowledgeItem {
    id: string;
    title: string;
    content: string;
    type: 'fact' | 'context' | 'instruction' | 'schema';
    category: string;
    tags: string[];
    priority: 'low' | 'medium' | 'high';
    scope: 'global' | 'route';
    routes?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const MOCK_KNOWLEDGE: KnowledgeItem[] = [
    {
        id: 'k1',
        title: 'User Trading Style',
        content: 'The user prefers conservative trading strategies with a focus on long-term positions.',
        type: 'context',
        category: 'User Preferences',
        tags: ['trading', 'strategy'],
        priority: 'high',
        scope: 'global',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 'k2',
        title: 'Portfolio Rules',
        content: 'Never allocate more than 20% to a single asset. Maintain 10% in stablecoins.',
        type: 'instruction',
        category: 'Business Rules',
        tags: ['portfolio', 'allocation'],
        priority: 'high',
        scope: 'global',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

const KnowledgeBasePanel: React.FC = () => {
    const [knowledge, setKnowledge] = useState<KnowledgeItem[]>(MOCK_KNOWLEDGE);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'global' | 'route'>('all');
    // Editor state for future modal implementation
    const [_showEditor, setShowEditor] = useState(false);
    const [_editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);

    const filteredKnowledge = useMemo(() => {
        let result = knowledge;
        if (filter === 'global') result = result.filter(k => k.scope === 'global');
        if (filter === 'route') result = result.filter(k => k.scope === 'route');
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(k =>
                k.title.toLowerCase().includes(q) ||
                k.content.toLowerCase().includes(q) ||
                k.tags.some(t => t.toLowerCase().includes(q))
            );
        }
        return result.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }, [knowledge, filter, searchQuery]);

    const handleDelete = (id: string) => {
        setKnowledge(prev => prev.filter(k => k.id !== id));
    };

    const handleTogglePriority = (id: string) => {
        setKnowledge(prev => prev.map(k => {
            if (k.id !== id) return k;
            const next: Record<KnowledgeItem['priority'], KnowledgeItem['priority']> = { low: 'medium', medium: 'high', high: 'low' };
            return { ...k, priority: next[k.priority] };
        }));
    };

    const typeConfig = {
        fact: { color: 'text-blue-400', bg: 'bg-blue-500/20' },
        context: { color: 'text-purple-400', bg: 'bg-purple-500/20' },
        instruction: { color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
        schema: { color: 'text-amber-400', bg: 'bg-amber-500/20' },
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Section title="Knowledge Base" icon={<Book size={18} />} />
                <button
                    onClick={() => { setEditingItem(null); setShowEditor(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--glass-accent)] text-white text-sm font-medium hover:bg-[var(--glass-accent)]/80 transition-colors"
                >
                    <Plus size={16} />
                    Add Knowledge
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total', value: knowledge.length, color: 'text-white' },
                    { label: 'Global', value: knowledge.filter(k => k.scope === 'global').length, color: 'text-cyan-400' },
                    { label: 'High Priority', value: knowledge.filter(k => k.priority === 'high').length, color: 'text-amber-400' },
                ].map((stat) => (
                    <div key={stat.label} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className={cn('text-2xl font-bold', stat.color)}>{stat.value}</div>
                        <div className="text-xs text-white/50">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Search & Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search knowledge..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--glass-accent)]"
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'global', 'route'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize",
                                filter === f ? "bg-[var(--glass-accent)] text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Knowledge List */}
            <div className="space-y-3">
                {filteredKnowledge.length === 0 ? (
                    <div className="text-center py-12 text-white/40">
                        <Book size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No knowledge items found</p>
                    </div>
                ) : (
                    filteredKnowledge.map((item) => {
                        const config = typeConfig[item.type];
                        return (
                            <div key={item.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <h4 className="font-medium">{item.title}</h4>
                                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', config.bg, config.color)}>
                                                {item.type}
                                            </span>
                                            {item.scope === 'global' && (
                                                <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/20 text-cyan-400">
                                                    <Globe className="w-3 h-3 inline mr-1" />Global
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-white/60 line-clamp-2">{item.content}</p>
                                        <div className="flex gap-2 mt-2">
                                            {item.tags.map((tag) => (
                                                <span key={tag} className="px-2 py-0.5 rounded text-xs bg-white/10 text-white/50">
                                                    <Tag className="w-3 h-3 inline mr-1" />{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => handleTogglePriority(item.id)}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-amber-400 transition-colors"
                                        >
                                            {item.priority === 'high' ? (
                                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                            ) : (
                                                <StarOff className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => { setEditingItem(item); setShowEditor(true); }}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Import Section */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20">
                            <Upload className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-medium">Import Knowledge</h4>
                            <p className="text-xs text-white/50">Import from PDF, TXT, or Markdown files</p>
                        </div>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-white/10 text-white/80 text-sm hover:bg-white/20 transition-colors">
                        <Upload className="w-4 h-4 inline mr-2" />Import File
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================
// Plugins Panel (NEW)
// ============================================

interface Plugin {
    id: string;
    name: string;
    description: string;
    version: string;
    author: string;
    type: 'claude-plugin' | 'mcp-server';
    isInstalled: boolean;
    isVerified: boolean;
}

const MOCK_MCP_SERVERS: Plugin[] = [
    { id: 'mcp-filesystem', name: 'filesystem', description: 'File system operations', version: '1.0.0', author: 'modelcontextprotocol', type: 'mcp-server', isInstalled: false, isVerified: true },
    { id: 'mcp-github', name: 'github', description: 'GitHub API integration', version: '1.0.0', author: 'modelcontextprotocol', type: 'mcp-server', isInstalled: true, isVerified: true },
    { id: 'mcp-postgres', name: 'postgres', description: 'PostgreSQL database', version: '1.0.0', author: 'modelcontextprotocol', type: 'mcp-server', isInstalled: false, isVerified: true },
    { id: 'mcp-puppeteer', name: 'puppeteer', description: 'Browser automation', version: '1.0.0', author: 'modelcontextprotocol', type: 'mcp-server', isInstalled: false, isVerified: true },
];

const PluginsPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'claude' | 'mcp' | 'installed'>('mcp');
    const [plugins, setPlugins] = useState<Plugin[]>(MOCK_MCP_SERVERS);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPlugins = useMemo(() => {
        let result = plugins;
        if (activeTab === 'installed') result = result.filter(p => p.isInstalled);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
        }
        return result;
    }, [plugins, activeTab, searchQuery]);

    const toggleInstall = (id: string) => {
        setPlugins(prev => prev.map(p => p.id === id ? { ...p, isInstalled: !p.isInstalled } : p));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Section title="Plugins & Extensions" icon={<Puzzle size={18} />} />
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                    {[
                        { id: 'mcp', label: 'MCP Servers', icon: Server },
                        { id: 'claude', label: 'Claude Plugins', icon: Package },
                        { id: 'installed', label: 'Installed', icon: Check },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                activeTab === tab.id ? "bg-[var(--glass-accent)] text-white" : "text-white/60 hover:text-white"
                            )}
                        >
                            <tab.icon size={12} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search plugins..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--glass-accent)]"
                />
            </div>

            {/* Plugin Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlugins.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-white/40">
                        <Package size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{activeTab === 'installed' ? 'No plugins installed' : 'No plugins found'}</p>
                    </div>
                ) : (
                    filteredPlugins.map((plugin) => (
                        <div key={plugin.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center",
                                    plugin.type === 'mcp-server' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                                )}>
                                    {plugin.type === 'mcp-server' ? <Server size={20} /> : <Package size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-sm">{plugin.name}</h4>
                                        {plugin.isVerified && <ShieldCheck size={14} className="text-blue-400" />}
                                    </div>
                                    <p className="text-xs text-white/50 mt-1">{plugin.description}</p>
                                    <div className="text-xs text-white/30 mt-2">v{plugin.version} by {plugin.author}</div>
                                </div>
                                <button
                                    onClick={() => toggleInstall(plugin.id)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                        plugin.isInstalled
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : "bg-[var(--glass-accent)] text-white hover:bg-[var(--glass-accent)]/80"
                                    )}
                                >
                                    {plugin.isInstalled ? 'Installed' : 'Install'}
                                </button>
                            </div>
                            {plugin.isInstalled && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <div className="text-xs text-white/30 mb-1">Command:</div>
                                    <code className="block p-2 rounded bg-black/30 text-xs text-emerald-400 font-mono">
                                        npx -y @modelcontextprotocol/server-{plugin.name}
                                    </code>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// ============================================
// Accessibility Panel
// ============================================

const AccessibilityPanel: React.FC = () => {
    const [reduceMotion, setReduceMotion] = useState(false);
    const [animationSpeed, setAnimationSpeed] = useState(100);
    const [disableParallax, setDisableParallax] = useState(false);
    const [disableAutoplay, setDisableAutoplay] = useState(false);
    const [highContrast, setHighContrast] = useState(false);
    const [colorBlindMode, setColorBlindMode] = useState<'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'>('none');
    const [fontSize, setFontSize] = useState(100);
    const [lineHeight, setLineHeight] = useState(150);
    const [focusIndicator, setFocusIndicator] = useState<'default' | 'high-visibility' | 'outline-only'>('default');
    const [soundEffects, setSoundEffects] = useState(true);
    const [soundVolume, setSoundVolume] = useState(50);
    const [screenReaderHints, setScreenReaderHints] = useState(true);

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Motion */}
            <Section title="Motion & Animation" icon={<MonitorPlay size={18} />}>
                <div className="space-y-4">
                    <ToggleRow
                        icon={<Zap size={16} />}
                        title="Reduce Motion"
                        description="Minimize animations throughout the interface"
                        enabled={reduceMotion}
                        onToggle={setReduceMotion}
                    />
                    {!reduceMotion && (
                        <>
                            <div className="pl-10">
                                <RangeControl label="Animation Speed" value={animationSpeed} min={25} max={200} unit="%" onChange={setAnimationSpeed} />
                            </div>
                            <ToggleRow
                                icon={<MonitorPlay size={16} />}
                                title="Disable Parallax Effects"
                                description="Turn off depth-based movement effects"
                                enabled={disableParallax}
                                onToggle={setDisableParallax}
                            />
                            <ToggleRow
                                icon={<MonitorPlay size={16} />}
                                title="Disable Auto-play"
                                description="Stop videos and animations from playing automatically"
                                enabled={disableAutoplay}
                                onToggle={setDisableAutoplay}
                            />
                        </>
                    )}
                </div>
            </Section>

            {/* Vision */}
            <Section title="Vision" icon={<Eye size={18} />}>
                <div className="space-y-4">
                    <ToggleRow
                        icon={<Contrast size={16} />}
                        title="High Contrast"
                        description="Increase contrast for better visibility"
                        enabled={highContrast}
                        onToggle={setHighContrast}
                    />

                    {/* Color Blind Mode */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <h4 className="text-sm font-medium mb-2">Color Blind Mode</h4>
                        <p className="text-xs text-white/50 mb-4">Adjust colors for color vision deficiencies</p>
                        <div className="grid grid-cols-2 gap-2">
                            {([
                                { value: 'none', label: 'None', desc: 'Standard colors' },
                                { value: 'protanopia', label: 'Protanopia', desc: 'Red-blind' },
                                { value: 'deuteranopia', label: 'Deuteranopia', desc: 'Green-blind' },
                                { value: 'tritanopia', label: 'Tritanopia', desc: 'Blue-blind' },
                            ] as const).map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setColorBlindMode(option.value)}
                                    className={cn(
                                        "px-3 py-2 rounded-xl text-left transition-all",
                                        colorBlindMode === option.value
                                            ? "bg-[var(--glass-accent)] text-white"
                                            : "bg-white/5 text-white/60 hover:bg-white/10"
                                    )}
                                >
                                    <div className="text-sm font-medium">{option.label}</div>
                                    <div className="text-xs opacity-70">{option.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <RangeControl label="Font Size" value={fontSize} min={75} max={150} unit="%" onChange={setFontSize} />
                    <RangeControl label="Line Height" value={lineHeight} min={100} max={200} unit="%" onChange={setLineHeight} />

                    {/* Focus Indicator */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <h4 className="text-sm font-medium mb-2">Focus Indicator Style</h4>
                        <p className="text-xs text-white/50 mb-4">Customize how focused elements are highlighted</p>
                        <div className="flex gap-2">
                            {([
                                { value: 'default', label: 'Default' },
                                { value: 'high-visibility', label: 'High Visibility' },
                                { value: 'outline-only', label: 'Outline Only' },
                            ] as const).map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setFocusIndicator(option.value)}
                                    className={cn(
                                        "flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                                        focusIndicator === option.value
                                            ? "bg-[var(--glass-accent)] text-white"
                                            : "bg-white/5 text-white/60 hover:bg-white/10"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            {/* Audio */}
            <Section title="Audio & Feedback" icon={<Ear size={18} />}>
                <div className="space-y-4">
                    <ToggleRow
                        icon={soundEffects ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        title="Sound Effects"
                        description="Play sounds for notifications"
                        enabled={soundEffects}
                        onToggle={setSoundEffects}
                    />
                    {soundEffects && (
                        <div className="pl-10">
                            <RangeControl label="Volume" value={soundVolume} min={0} max={100} unit="%" onChange={setSoundVolume} />
                        </div>
                    )}
                    <ToggleRow
                        icon={<Info size={16} />}
                        title="Screen Reader Hints"
                        description="Add additional context for screen readers"
                        enabled={screenReaderHints}
                        onToggle={setScreenReaderHints}
                    />
                </div>
            </Section>
        </div>
    );
};

// ============================================
// Keyboard Shortcuts Panel
// ============================================

const SHORTCUTS = [
    {
        category: 'Navigation', items: [
            { action: 'Command Palette', keys: ['Cmd', 'K'], customizable: true, description: 'Quick access to all commands' },
            { action: 'Go to Dashboard', keys: ['G', 'D'], customizable: true },
            { action: 'Go to Settings', keys: ['G', 'S'], customizable: true },
            { action: 'Go to Agent Hub', keys: ['G', 'A'], customizable: true },
            { action: 'Toggle Sidebar', keys: ['Cmd', '\\'], customizable: true },
        ]
    },
    {
        category: 'Trading', items: [
            { action: 'New Trade', keys: ['N'], customizable: true },
            { action: 'Quick Buy', keys: ['Shift', 'B'], customizable: true },
            { action: 'Quick Sell', keys: ['Shift', 'S'], customizable: true },
            { action: 'Close All Positions', keys: ['Cmd', 'Shift', 'C'], customizable: true },
        ]
    },
    {
        category: 'Dashboard', items: [
            { action: 'Refresh Data', keys: ['R'], customizable: true },
            { action: 'Toggle Time Range', keys: ['T'], customizable: true },
            { action: 'Export Data', keys: ['Cmd', 'E'], customizable: true },
            { action: 'Toggle Chart Type', keys: ['C'], customizable: true },
        ]
    },
    {
        category: 'General', items: [
            { action: 'Search', keys: ['Cmd', 'F'], customizable: false },
            { action: 'Undo', keys: ['Cmd', 'Z'], customizable: false },
            { action: 'Redo', keys: ['Cmd', 'Shift', 'Z'], customizable: false },
            { action: 'Help', keys: ['?'], customizable: true },
            { action: 'Toggle Theme', keys: ['Cmd', 'Shift', 'T'], customizable: true },
        ]
    },
    {
        category: 'Editing', items: [
            { action: 'Save', keys: ['Cmd', 'S'], customizable: false },
            { action: 'Select All', keys: ['Cmd', 'A'], customizable: false },
            { action: 'Copy', keys: ['Cmd', 'C'], customizable: false },
            { action: 'Paste', keys: ['Cmd', 'V'], customizable: false },
        ]
    },
];

const CATEGORY_CONFIG: Record<string, { color: string; bgColor: string }> = {
    Navigation: { color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    Trading: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    Dashboard: { color: 'text-violet-400', bgColor: 'bg-violet-500/20' },
    General: { color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    Editing: { color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
};

const KeyboardShortcutsPanel: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Navigation', 'Trading', 'Dashboard', 'General', 'Editing']));
    const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
    const [editingKeys, setEditingKeys] = useState<string[]>([]);

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    // Listen for key presses when editing
    useEffect(() => {
        if (!editingShortcut) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            const keys: string[] = [];
            if (e.metaKey || e.ctrlKey) keys.push('Cmd');
            if (e.shiftKey) keys.push('Shift');
            if (e.altKey) keys.push('Alt');
            if (!['Meta', 'Control', 'Shift', 'Alt'].includes(e.key)) {
                keys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
            }
            if (keys.length > 0) setEditingKeys(keys);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editingShortcut]);

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Section title="Keyboard Shortcuts" icon={<Keyboard size={18} />} />
                <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors">
                        <RotateCcw size={14} />
                        Reset
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors">
                        <Download size={14} />
                        Export
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors">
                        <Upload size={14} />
                        Import
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shortcuts..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--glass-accent)]"
                />
            </div>

            {/* Shortcut Categories */}
            <div className="space-y-4">
                {SHORTCUTS.map((cat) => {
                    const isExpanded = expandedCategories.has(cat.category);
                    const config = CATEGORY_CONFIG[cat.category];
                    const filteredItems = searchQuery
                        ? cat.items.filter(item =>
                            item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.keys.join(' ').toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        : cat.items;

                    if (filteredItems.length === 0) return null;

                    return (
                        <div key={cat.category} className="rounded-xl border border-white/10 overflow-hidden">
                            <button
                                onClick={() => toggleCategory(cat.category)}
                                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/8 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={cn('px-3 py-1 rounded-lg text-sm font-medium', config.bgColor, config.color)}>
                                        {cat.category}
                                    </span>
                                    <span className="text-sm text-white/50">{filteredItems.length} shortcuts</span>
                                </div>
                                <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
                            </button>
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-2 space-y-1">
                                            {filteredItems.map((item) => {
                                                const isEditing = editingShortcut === item.action;
                                                return (
                                                    <div
                                                        key={item.action}
                                                        className={cn(
                                                            "flex items-center justify-between p-3 rounded-lg",
                                                            isEditing ? "bg-white/10 ring-2 ring-[var(--glass-accent)]" : "hover:bg-white/5"
                                                        )}
                                                    >
                                                        <div>
                                                            <span className="text-sm">{item.action}</span>
                                                            {item.description && (
                                                                <span className="text-xs text-white/40 ml-2">{item.description}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {isEditing ? (
                                                                <>
                                                                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-[var(--glass-accent)]/50">
                                                                        {editingKeys.length > 0 ? (
                                                                            editingKeys.map((key, i) => (
                                                                                <React.Fragment key={i}>
                                                                                    {i > 0 && <span className="text-white/30 mx-0.5">+</span>}
                                                                                    <kbd className="px-2 py-1 rounded bg-white/10 text-xs font-medium">
                                                                                        {key === 'Cmd' ? '⌘' : key}
                                                                                    </kbd>
                                                                                </React.Fragment>
                                                                            ))
                                                                        ) : (
                                                                            <span className="text-sm text-white/50">Press keys...</span>
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => { setEditingShortcut(null); setEditingKeys([]); }}
                                                                        className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400"
                                                                    >
                                                                        <Check size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setEditingShortcut(null); setEditingKeys([]); }}
                                                                        className="p-1.5 rounded-lg bg-red-500/20 text-red-400"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="flex items-center gap-1">
                                                                        {item.keys.map((key, i) => (
                                                                            <React.Fragment key={i}>
                                                                                {i > 0 && <span className="text-white/30 mx-0.5">+</span>}
                                                                                <kbd className="px-2 py-1 rounded bg-white/10 text-xs font-medium">
                                                                                    {key === 'Cmd' ? '⌘' : key}
                                                                                </kbd>
                                                                            </React.Fragment>
                                                                        ))}
                                                                    </div>
                                                                    {item.customizable && (
                                                                        <button
                                                                            onClick={() => setEditingShortcut(item.action)}
                                                                            className="p-1.5 rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                                                                        >
                                                                            <Edit3 size={14} />
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Tips */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-sm font-medium mb-3">Tips</h4>
                <ul className="space-y-2 text-sm text-white/60">
                    <li className="flex items-start gap-2"><span className="text-white">•</span>Click the edit button on customizable shortcuts to change the key binding</li>
                    <li className="flex items-start gap-2"><span className="text-white">•</span>Press your desired key combination while editing</li>
                    <li className="flex items-start gap-2"><span className="text-white">•</span>Gray shortcuts are system defaults and cannot be changed</li>
                </ul>
            </div>
        </div>
    );
};

// ============================================
// Data Management Panel
// ============================================

const DataManagementPanel: React.FC = () => {
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
    const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
    const [exportOptions, setExportOptions] = useState({
        theme: true,
        agent: true,
        preferences: true,
        trading: false,
    });
    const [showResetConfirm, setShowResetConfirm] = useState<'theme' | 'all' | 'factory' | null>(null);

    const handleExport = async () => {
        setExporting(true);
        await new Promise(r => setTimeout(r, 1500));
        setExporting(false);
    };

    const handleImport = async () => {
        setImporting(true);
        await new Promise(r => setTimeout(r, 1500));
        setImporting(false);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Storage Stats */}
            <Section title="Storage Usage" icon={<Database size={18} />}>
                <div className="flex items-center justify-between mb-4 text-xs text-white/50">
                    <span>Total: 251 KB</span>
                    <span className="flex items-center gap-1"><Clock size={12} />Last backup: 2 days ago</span>
                </div>
                <div className="space-y-4">
                    {[
                        { label: 'Theme Settings', size: '12 KB', pct: 5 },
                        { label: 'Agent Config', size: '45 KB', pct: 18 },
                        { label: 'Trading Data', size: '156 KB', pct: 62 },
                        { label: 'Cache', size: '38 KB', pct: 15 },
                    ].map((item) => (
                        <div key={item.label}>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm">{item.label}</span>
                                <span className="text-xs text-white/50">{item.size}</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.pct}%` }}
                                    transition={{ duration: 0.5 }}
                                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Export / Import */}
            <div className="grid grid-cols-2 gap-4">
                {/* Export */}
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                        <Download size={18} className="text-emerald-400" />
                        <span className="font-medium">Export</span>
                    </div>

                    {/* Format */}
                    <div className="mb-4">
                        <label className="text-xs text-white/50 mb-2 block">Format</label>
                        <div className="flex gap-2">
                            {(['json', 'csv'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setExportFormat(f)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                                        exportFormat === f ? "bg-[var(--glass-accent)] text-white" : "bg-white/5 text-white/60"
                                    )}
                                >
                                    {f === 'json' ? <FileJson size={14} /> : <FileText size={14} />}
                                    {f.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Options */}
                    <div className="mb-4">
                        <label className="text-xs text-white/50 mb-2 block">Data to Export</label>
                        <div className="space-y-2">
                            {[
                                { id: 'theme', label: 'Theme Settings', icon: Palette },
                                { id: 'agent', label: 'Agent Config', icon: Bot },
                                { id: 'preferences', label: 'Preferences', icon: Settings },
                                { id: 'trading', label: 'Trading Data', icon: BarChart3 },
                            ].map((opt) => (
                                <label key={opt.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={exportOptions[opt.id as keyof typeof exportOptions]}
                                        onChange={(e) => setExportOptions(prev => ({ ...prev, [opt.id]: e.target.checked }))}
                                        className="rounded border-white/20"
                                    />
                                    <opt.icon size={14} className="text-white/40" />
                                    <span className="text-sm">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {exporting ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                        {exporting ? 'Exporting...' : 'Export'}
                    </button>
                </div>

                {/* Import */}
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                        <Upload size={18} className="text-blue-400" />
                        <span className="font-medium">Import</span>
                    </div>

                    {/* Mode */}
                    <div className="mb-4">
                        <label className="text-xs text-white/50 mb-2 block">Import Mode</label>
                        <div className="flex gap-2">
                            {(['merge', 'replace'] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setImportMode(m)}
                                    className={cn(
                                        "flex-1 px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all",
                                        importMode === m ? "bg-[var(--glass-accent)] text-white" : "bg-white/5 text-white/60"
                                    )}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-white/40 mt-2">
                            {importMode === 'merge' ? 'Add new, update existing' : 'Replace all settings'}
                        </p>
                    </div>

                    {/* Drop Zone */}
                    <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-white/40 transition-colors mb-4">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-white/40" />
                        <p className="text-xs text-white/60">Drop file here or click to browse</p>
                    </div>

                    <button
                        onClick={handleImport}
                        disabled={importing}
                        className="w-full py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {importing ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                        {importing ? 'Importing...' : 'Import'}
                    </button>
                </div>
            </div>

            {/* Reset */}
            <Section title="Reset & Clear" icon={<Trash2 size={18} />}>
                <div className="space-y-3">
                    {[
                        { id: 'theme', label: 'Reset Theme', desc: 'Reset colors and glass effects', variant: 'warning' },
                        { id: 'all', label: 'Reset All Settings', desc: 'Reset preferences, keep data', variant: 'warning' },
                        { id: 'factory', label: 'Factory Reset', desc: 'Delete everything and start fresh', variant: 'danger' },
                    ].map((opt) => (
                        <div key={opt.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                            <div>
                                <div className="text-sm font-medium">{opt.label}</div>
                                <div className="text-xs text-white/50">{opt.desc}</div>
                            </div>
                            <button
                                onClick={() => setShowResetConfirm(opt.id as 'theme' | 'all' | 'factory')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                    opt.variant === 'danger'
                                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                        : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                )}
                            >
                                Reset
                            </button>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Reset Confirmation Dialog */}
            <AnimatePresence>
                {showResetConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowResetConfirm(null)}
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="relative w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 rounded-2xl bg-[#1a1a1a] border border-white/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={cn(
                                        'p-3 rounded-xl',
                                        showResetConfirm === 'factory' ? 'bg-red-500/20' : 'bg-amber-500/20'
                                    )}>
                                        {showResetConfirm === 'factory' ? (
                                            <ShieldAlert className="w-6 h-6 text-red-400" />
                                        ) : (
                                            <AlertTriangle className="w-6 h-6 text-amber-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            {showResetConfirm === 'factory' ? 'Factory Reset' :
                                                showResetConfirm === 'all' ? 'Reset All Settings' : 'Reset Theme'}
                                        </h3>
                                    </div>
                                </div>
                                <p className="text-sm text-white/60 mb-6">
                                    {showResetConfirm === 'factory'
                                        ? 'This will permanently delete ALL your data. This cannot be undone.'
                                        : showResetConfirm === 'all'
                                            ? 'This will reset all settings to defaults. Your data will be preserved.'
                                            : 'This will reset theme colors and glass effects to defaults.'}
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowResetConfirm(null)}
                                        className="px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => setShowResetConfirm(null)}
                                        className={cn(
                                            "px-4 py-2 rounded-lg font-medium transition-colors",
                                            showResetConfirm === 'factory'
                                                ? "bg-red-500 hover:bg-red-600 text-white"
                                                : "bg-amber-500 hover:bg-amber-600 text-white"
                                        )}
                                    >
                                        {showResetConfirm === 'factory' ? 'Delete Everything' : 'Reset'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ============================================
// Shared Components
// ============================================

interface SectionProps {
    title: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    children?: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, action, children }) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                {icon && <span className="text-white/40">{icon}</span>}
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">{title}</h3>
            </div>
            {action}
        </div>
        {children}
    </div>
);

interface RangeControlProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    onChange: (val: number) => void;
}

const RangeControl: React.FC<RangeControlProps> = ({ label, value, min, max, step = 1, unit = '', onChange }) => (
    <div className="flex items-center gap-4">
        <div className="w-36 text-sm font-medium text-white/80">{label}</div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="flex-1 accent-[var(--glass-accent)] h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
        />
        <div className="w-16 text-right text-xs font-mono text-white/60">
            {typeof value === 'number' && value < 1 && step < 1 ? value.toFixed(2) : value}{unit}
        </div>
    </div>
);

// Animation Range Control with Preview Button
interface AnimationRangeControlProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    animationType: 'bounce' | 'pulse' | 'scale' | 'wiggle';
}

const AnimationRangeControl: React.FC<AnimationRangeControlProps> = ({ label, value, onChange, animationType }) => {
    const [isPreviewActive, setIsPreviewActive] = useState(false);
    const previewRef = React.useRef<HTMLDivElement>(null);
    const animationRef = React.useRef<number | null>(null);

    const triggerPreview = () => {
        setIsPreviewActive(true);

        // Cancel any existing animation
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        const startTime = performance.now();
        const duration = 2500; // 2.5 seconds
        const intensity = value / 100;

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            if (elapsed >= duration) {
                setIsPreviewActive(false);
                if (previewRef.current) {
                    previewRef.current.style.transform = '';
                    previewRef.current.style.opacity = '';
                }
                return;
            }

            const progress = elapsed % 600; // Faster loop
            const phase = (progress / 600) * Math.PI * 2; // 0 to 2π

            if (previewRef.current) {
                switch (animationType) {
                    case 'bounce': {
                        const bounceHeight = 8 + intensity * 12;
                        const y = -Math.abs(Math.sin(phase)) * bounceHeight;
                        previewRef.current.style.transform = `translateY(${y}px)`;
                        break;
                    }
                    case 'pulse': {
                        const minOpacity = 0.4 + intensity * 0.2;
                        const scaleAmount = 1 + intensity * 0.15;
                        const pulseValue = (Math.sin(phase) + 1) / 2;
                        const opacity = minOpacity + (1 - minOpacity) * (1 - pulseValue);
                        const scale = 1 + (scaleAmount - 1) * pulseValue;
                        previewRef.current.style.opacity = String(opacity);
                        previewRef.current.style.transform = `scale(${scale})`;
                        break;
                    }
                    case 'scale': {
                        const maxScale = 1 + intensity * 0.5;
                        const scaleValue = (Math.sin(phase) + 1) / 2;
                        const scale = 1 + (maxScale - 1) * scaleValue;
                        previewRef.current.style.transform = `scale(${scale})`;
                        break;
                    }
                    case 'wiggle': {
                        const maxRotation = 5 + intensity * 15;
                        const rotation = Math.sin(phase * 2) * maxRotation;
                        previewRef.current.style.transform = `rotate(${rotation}deg)`;
                        break;
                    }
                }
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <div className="space-y-3">
            {/* Slider Row */}
            <div className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-white/80">
                    {label}
                </div>
                <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="flex-1 accent-[var(--glass-accent)] h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
                <div className="w-12 text-right text-xs font-mono text-white/60">
                    {value}%
                </div>
            </div>
            {/* Preview Row */}
            <div className="ml-32 flex items-center gap-3">
                <button
                    onClick={triggerPreview}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        isPreviewActive
                            ? "bg-[var(--glass-accent)] text-white"
                            : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                    )}
                >
                    <Play size={12} />
                    Preview
                </button>
                {/* Preview Element Container */}
                <div className="h-12 w-16 flex items-center justify-center rounded-lg bg-white/5 border border-white/10">
                    <div
                        ref={previewRef}
                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg"
                        style={{
                            opacity: isPreviewActive ? 1 : 0.5,
                        }}
                    />
                </div>
                <span className="text-xs text-white/40">
                    {isPreviewActive ? 'Playing...' : 'Click to preview'}
                </span>
            </div>
        </div>
    );
};

interface ToggleRowProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ icon, title, description, enabled, onToggle }) => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white/5 text-white/60">{icon}</div>
            <div>
                <div className="text-sm font-medium">{title}</div>
                <div className="text-xs text-white/50">{description}</div>
            </div>
        </div>
        <button
            onClick={() => onToggle(!enabled)}
            className={cn(
                "w-12 h-7 rounded-full transition-colors relative",
                enabled ? "bg-[var(--glass-accent)]" : "bg-white/20"
            )}
        >
            <div
                className={cn(
                    "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform",
                    enabled ? "translate-x-6" : "translate-x-1"
                )}
            />
        </button>
    </div>
);
interface CredentialsPanelProps {
    claudeApiKey: string;
    setClaudeApiKey: (key: string) => void;
}

interface Credential {
    id: string;
    name: string;
    type: 'email_imap' | 'odoo' | 'gmail_oauth' | 'gdrive_oauth' | 'gcalendar_oauth' | 'api_token';
    notes?: string;
    data?: any;
    status: 'connected' | 'disconnected' | 'error';
    lastUsed?: string;
}

const CredentialsPanel: React.FC<CredentialsPanelProps> = ({
    claudeApiKey,
    setClaudeApiKey
}) => {
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [credentials, setCredentials] = useState<Credential[]>(() => {
        const saved = localStorage.getItem('liquid_credentials');
        const initialCreds: Credential[] = saved ? JSON.parse(saved) : [
            { id: '1', name: 'Production API', type: 'api_token', status: 'connected', lastUsed: '2 mins ago' },
            { id: '2', name: 'Marketing Drive', type: 'gdrive_oauth', status: 'disconnected', lastUsed: '1 day ago' },
            { id: '3', name: 'Personal Mail', type: 'email_imap', status: 'connected', lastUsed: '1 hour ago' },
        ];

        // Inject Environment Variables if not present
        const exists = (id: string) => initialCreds.some(c => c.id === id);

        if (import.meta.env.VITE_ANTHROPIC_API_KEY && !exists('env-anthropic')) {
            initialCreds.push({
                id: 'env-anthropic',
                name: 'Environment: Anthropic',
                type: 'api_token',
                status: 'connected',
                lastUsed: 'System',
                notes: 'Loaded from .env VITE_ANTHROPIC_API_KEY',
                data: { tokenType: 'bearer', token: import.meta.env.VITE_ANTHROPIC_API_KEY }
            });
        }

        if (import.meta.env.VITE_GEMINI_API_KEY && !exists('env-gemini')) {
            initialCreds.push({
                id: 'env-gemini',
                name: 'Environment: Gemini',
                type: 'api_token',
                status: 'connected',
                lastUsed: 'System',
                notes: 'Loaded from .env VITE_GEMINI_API_KEY',
                data: { tokenType: 'bearer', token: import.meta.env.VITE_GEMINI_API_KEY }
            });
        }

        return initialCreds;
    });

    // Persistence
    useEffect(() => {
        localStorage.setItem('liquid_credentials', JSON.stringify(credentials));
    }, [credentials]);

    // Form State
    const [formData, setFormData] = useState<Partial<Credential>>({});

    const handleSave = () => {
        if (view === 'create' && formData.name && formData.type) {
            const newCred: Credential = {
                id: Math.random().toString(36).substring(7),
                name: formData.name,
                type: formData.type as any,
                notes: formData.notes,
                status: 'disconnected',
                lastUsed: 'Just now'
            };
            setCredentials([...credentials, newCred]);
        } else if (view === 'edit' && selectedId) {
            setCredentials(credentials.map(c => c.id === selectedId ? { ...c, ...formData } : c));
        }
        setView('list');
        setFormData({});
        setSelectedId(null);
    };

    const handleDelete = (id: string) => {
        setCredentials(credentials.filter(c => c.id !== id));
        if (selectedId === id) {
            setView('list');
            setSelectedId(null);
        }
    };

    const handleAuth = () => {
        // Real OAuth Flow
        // Use backend endpoint to initiate flow
        const authUrl = `http://localhost:3000/api/v1/auth/google?type=${formData.type}`;
        window.open(authUrl, '_blank', 'width=500,height=600');

        // Listen for success message from popup
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'OAUTH_SUCCESS' && event.data?.credentialType === formData.type) {
                setFormData({
                    ...formData,
                    status: 'connected',
                    lastUsed: 'Just now',
                    data: { ...formData.data, tokens: event.data.tokens } // Store tokens
                });
                window.removeEventListener('message', handleMessage);
            }
        };

        window.addEventListener('message', handleMessage);

        // Fallback for demo/mock if backend fails or no keys (Simulated for safety if backend 500s immediately)
        // But since user asked for "Not Mock", we rely on the backend.
        // If backend is missing keys, the popup will show the error.
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'email_imap': return Mail;
            case 'gmail_oauth': return Mail;
            case 'gdrive_oauth': return Database;
            case 'gcalendar_oauth': return Calendar;
            case 'api_token': return Key;
            case 'odoo': return Globe;
            default: return Key;
        }
    };

    const getLabelForType = (type: string) => {
        switch (type) {
            case 'email_imap': return 'Email (IMAP)';
            case 'gmail_oauth': return 'Gmail OAuth';
            case 'gdrive_oauth': return 'Google Drive OAuth';
            case 'gcalendar_oauth': return 'Google Calendar OAuth';
            case 'api_token': return 'API Token';
            case 'odoo': return 'Odoo';
            default: return type;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Main Header */}
            {view === 'list' && (
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Credentials</h2>
                        <p className="text-white/50">Manage your API keys, OAuth tokens, and external connections.</p>
                    </div>
                    <button
                        onClick={() => { setView('create'); setFormData({}); }}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--glass-accent)] text-white rounded-xl font-medium hover:brightness-110 transition-all shadow-lg shadow-[var(--glass-accent)]/20"
                    >
                        <Plus size={18} />
                        Add Credential
                    </button>
                </div>
            )}

            {/* Back Button */}
            {view !== 'list' && (
                <button
                    onClick={() => setView('list')}
                    className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
                >
                    <ChevronLeft size={18} />
                    Back to Credentials
                </button>
            )}

            {/* Content Area */}
            <div className="space-y-6">

                {/* === LIST VIEW === */}
                {view === 'list' && (
                    <>
                        {/* System Built-ins */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider ml-1">System</h3>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4 group hover:border-white/20 transition-all">
                                <div className="p-3 rounded-lg bg-orange-500/20 text-orange-400">
                                    <Key size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-white">Anthropic (Claude)</h4>
                                        <div className="flex items-center gap-2">
                                            {claudeApiKey ? (
                                                <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Active</span>
                                            ) : (
                                                <span className="text-xs font-medium text-white/40 bg-white/5 px-2 py-0.5 rounded-full">Not Configured</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            value={claudeApiKey}
                                            onChange={(e) => setClaudeApiKey(e.target.value)}
                                            placeholder="sk-ant-..."
                                            className="bg-transparent border-none p-0 text-sm text-white/60 focus:ring-0 w-full placeholder:text-white/20"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* User Credentials */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider ml-1">My Credentials</h3>
                            <div className="grid gap-3">
                                {credentials.map((cred) => {
                                    const Icon = getIconForType(cred.type);
                                    return (
                                        <div
                                            key={cred.id}
                                            onClick={() => { setSelectedId(cred.id); setFormData(cred); setView('edit'); }}
                                            className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all group"
                                        >
                                            <div className="p-3 rounded-lg bg-white/10 text-white/80 group-hover:bg-[var(--glass-accent)]/20 group-hover:text-[var(--glass-accent)] transition-colors">
                                                <Icon size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-white truncate">{cred.name}</h4>
                                                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/40 uppercase tracking-wide font-medium">
                                                        {getLabelForType(cred.type)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-white/40">
                                                    <span className={cn("w-1.5 h-1.5 rounded-full", cred.status === 'connected' ? "bg-green-500" : "bg-red-500")} />
                                                    <span className="capitalize">{cred.status}</span>
                                                    <span>•</span>
                                                    <span>Used {cred.lastUsed}</span>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-white/20 group-hover:text-white/60 transition-colors" />
                                        </div>
                                    );
                                })}

                                {credentials.length === 0 && (
                                    <div className="text-center py-12 rounded-xl border border-dashed border-white/10 bg-white/5">
                                        <Key size={32} className="mx-auto text-white/20 mb-3" />
                                        <p className="text-white/40">No credentials added yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* === CREATE / EDIT VIEW === */}
                {(view === 'create' || view === 'edit') && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Header Section */}
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-1">
                                {view === 'create' ? 'Add Credential' : 'Credential Details'}
                            </h3>
                            <p className="text-sm text-white/50 mb-6">
                                {view === 'create'
                                    ? 'Provide a name and select the type. You\'ll configure details in the next step.'
                                    : 'Update your credential information below.'}
                            </p>

                            <div className="grid gap-6 max-w-2xl">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Name <span className="text-red-400">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Production API Key"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)] placeholder:text-white/20"
                                    />
                                </div>

                                {view === 'create' ? (
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Type <span className="text-red-400">*</span></label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {[
                                                { id: 'api_token', label: 'API Token', icon: Key },
                                                { id: 'gdrive_oauth', label: 'Google Drive OAuth', icon: Database },
                                                { id: 'gcalendar_oauth', label: 'Google Calendar', icon: Calendar },
                                                { id: 'gmail_oauth', label: 'Gmail OAuth', icon: Mail },
                                                { id: 'email_imap', label: 'Email (IMAP)', icon: Mail },
                                                { id: 'odoo', label: 'Odoo', icon: Globe },
                                            ].map((type) => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => setFormData({ ...formData, type: type.id as any })}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                                        formData.type === type.id
                                                            ? "bg-[var(--glass-accent)]/20 border-[var(--glass-accent)] text-white"
                                                            : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                                                    )}
                                                >
                                                    <type.icon size={18} />
                                                    <span className="text-sm font-medium">{type.label}</span>
                                                    {formData.type === type.id && <Check size={16} className="ml-auto text-[var(--glass-accent)]" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    /* Type Display (Read-only in Edit) */
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Type</label>
                                        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-white/60">
                                            {getIconForType(formData.type || '') && React.createElement(getIconForType(formData.type || ''), { size: 18 })}
                                            <span className="text-sm font-medium">{getLabelForType(formData.type || '')}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Notes</label>
                                    <textarea
                                        value={formData.notes || ''}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Additional notes..."
                                        rows={3}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)] placeholder:text-white/20 resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Type Specific Config */}
                        {view === 'edit' && formData.type === 'api_token' && (
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                                <h3 className="text-lg font-semibold text-white">Token Configuration</h3>
                                <div className="grid gap-6 max-w-2xl">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-white/60 uppercase tracking-wide">Token Type <span className="text-red-400">*</span></label>
                                        <select
                                            value={formData.data?.tokenType || 'bearer'}
                                            onChange={(e) => setFormData({ ...formData, data: { ...formData.data, tokenType: e.target.value } })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                                        >
                                            <option value="bearer">Bearer Token</option>
                                            <option value="basic">Basic Auth</option>
                                            <option value="custom">Custom Header</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-white/60 uppercase tracking-wide">API Token <span className="text-red-400">*</span></label>
                                        <input
                                            type="password"
                                            value={formData.data?.token || ''}
                                            onChange={(e) => setFormData({ ...formData, data: { ...formData.data, token: e.target.value } })}
                                            placeholder="sk-..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)] font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {view === 'edit' && formData.type?.includes('oauth') && (
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                                <h3 className="text-lg font-semibold text-white">OAuth Authorization</h3>
                                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 bg-black/20 rounded-xl border border-white/5 border-dashed">
                                    <div className={cn(
                                        "p-4 rounded-full transition-colors",
                                        formData.status === 'connected' ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/60"
                                    )}>
                                        {formData.status === 'connected'
                                            ? <Check size={32} />
                                            : React.createElement(getIconForType(formData.type), { size: 32 })
                                        }
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">
                                            {formData.status === 'connected'
                                                ? `Connected to ${getLabelForType(formData.type)}`
                                                : `Grant access to ${getLabelForType(formData.type)}`
                                            }
                                        </p>
                                        <p className="text-sm text-white/40 mt-1">
                                            {formData.status === 'connected'
                                                ? 'Your account is successfully linked and ready to use.'
                                                : 'No authorization found. Click below to grant access.'
                                            }
                                        </p>
                                    </div>

                                    {formData.status !== 'connected' && (
                                        <button
                                            onClick={handleAuth}
                                            className="px-6 py-2 bg-[#00C853] hover:bg-[#00C853]/90 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            Grant Access
                                        </button>
                                    )}

                                    {formData.status === 'connected' && (
                                        <button
                                            onClick={() => setFormData({ ...formData, status: 'disconnected' })}
                                            className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-red-400 font-medium rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            Disconnect
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                            {view === 'edit' && (
                                <button
                                    onClick={() => handleDelete(selectedId!)}
                                    className="mr-auto px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            )}
                            <button
                                onClick={() => { setView('list'); setFormData({}); }}
                                className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!formData.name || (view === 'create' && !formData.type)}
                                className="px-6 py-2.5 rounded-xl bg-[var(--glass-accent)] text-white font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--glass-accent)]/20"
                            >
                                Save Credential
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
