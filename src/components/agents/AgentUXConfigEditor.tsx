/**
 * Agent UX Configuration Editor
 *
 * A visual editor for customizing agent UX configurations.
 * Allows editing theme, input, contextual UI, and quick action settings.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Palette, Sparkles, Zap, Save,
    ChevronDown, ChevronUp, Plus, Trash2, GripVertical, Settings,
    Type, RefreshCw
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassWindow } from '@/components/containers/GlassWindow';
import {
    useAgentUXConfig,
    type AgentUXConfig,
    type ThemeConfig,
    type InputConfig,
    type ContextualUIConfig,
    type QuickAction,
    type SuggestionStrategy,
    DEFAULT_AGENT_UX_CONFIG,
} from '@/applications/agent-chat/ux';

// ============================================================================
// Types
// ============================================================================

interface AgentUXConfigEditorProps {
    agentId: string;
    agentName: string;
    agentColor?: string;
    position?: { x: number; y: number };
    onClose?: () => void;
    onSave?: (config: Partial<AgentUXConfig>) => void;
    isActive?: boolean;
    onFocus?: () => void;
}

type EditorSection = 'theme' | 'input' | 'contextual' | 'quickActions';

// ============================================================================
// Color Picker Component
// ============================================================================

const ColorPicker: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
}> = ({ label, value, onChange }) => {
    const presetColors = [
        '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
        '#10B981', '#06B6D4', '#3B82F6', '#F97316', '#FBBF24',
    ];

    return (
        <div className="space-y-2">
            <label className="text-xs text-white/60">{label}</label>
            <div className="flex items-center gap-2">
                <div
                    className="w-8 h-8 rounded-lg border border-white/20 cursor-pointer"
                    style={{ backgroundColor: value }}
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                />
            </div>
            <div className="flex flex-wrap gap-1">
                {presetColors.map((color) => (
                    <button
                        key={color}
                        onClick={() => onChange(color)}
                        className={cn(
                            'w-5 h-5 rounded-md border-2 transition-all',
                            value === color ? 'border-white scale-110' : 'border-transparent'
                        )}
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>
        </div>
    );
};

// ============================================================================
// Section Header Component
// ============================================================================

const SectionHeader: React.FC<{
    icon: React.ElementType;
    title: string;
    isOpen: boolean;
    onToggle: () => void;
}> = ({ icon: Icon, title, isOpen, onToggle }) => (
    <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
    >
        <div className="flex items-center gap-2">
            <Icon size={16} className="text-white/70" />
            <span className="text-sm font-medium text-white/90">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-white/50" /> : <ChevronDown size={16} className="text-white/50" />}
    </button>
);

// ============================================================================
// Theme Editor Section
// ============================================================================

const ThemeEditor: React.FC<{
    theme: ThemeConfig;
    onChange: (theme: ThemeConfig) => void;
}> = ({ theme, onChange }) => {
    const messageStyles: Array<{ value: ThemeConfig['messageStyle']; label: string }> = [
        { value: 'glass', label: 'Glass' },
        { value: 'solid', label: 'Solid' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'retro', label: 'Retro' },
    ];

    const avatarStyles: Array<{ value: ThemeConfig['avatarStyle']; label: string }> = [
        { value: 'rounded', label: 'Rounded' },
        { value: 'square', label: 'Square' },
        { value: 'circle', label: 'Circle' },
    ];

    return (
        <div className="space-y-4 p-3">
            <ColorPicker
                label="Accent Color"
                value={theme.accentColor || '#6366F1'}
                onChange={(accentColor) => onChange({ ...theme, accentColor })}
            />

            <ColorPicker
                label="Secondary Color"
                value={theme.secondaryColor || '#8B5CF6'}
                onChange={(secondaryColor) => onChange({ ...theme, secondaryColor })}
            />

            <div className="space-y-2">
                <label className="text-xs text-white/60">Message Style</label>
                <div className="flex gap-2">
                    {messageStyles.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => onChange({ ...theme, messageStyle: value })}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs transition-all',
                                theme.messageStyle === value
                                    ? 'bg-indigo-500/30 text-white border border-indigo-500/50'
                                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs text-white/60">Avatar Style</label>
                <div className="flex gap-2">
                    {avatarStyles.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => onChange({ ...theme, avatarStyle: value })}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs transition-all',
                                theme.avatarStyle === value
                                    ? 'bg-indigo-500/30 text-white border border-indigo-500/50'
                                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs text-white/60">Background Image</label>
                <input
                    type="text"
                    value={theme.backgroundImage || ''}
                    onChange={(e) => onChange({ ...theme, backgroundImage: e.target.value || null })}
                    placeholder="Enter image name (e.g., agent-id)"
                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />
            </div>

            <div className="flex items-center justify-between">
                <label className="text-xs text-white/60">Glass Effects</label>
                <button
                    onClick={() => onChange({ ...theme, glassEffects: !theme.glassEffects })}
                    className={cn(
                        'w-10 h-5 rounded-full transition-all',
                        theme.glassEffects ? 'bg-indigo-500' : 'bg-white/20'
                    )}
                >
                    <motion.div
                        className="w-4 h-4 bg-white rounded-full m-0.5"
                        animate={{ x: theme.glassEffects ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                </button>
            </div>
        </div>
    );
};

// ============================================================================
// Input Editor Section
// ============================================================================

const InputEditor: React.FC<{
    input: InputConfig;
    onChange: (input: InputConfig) => void;
}> = ({ input, onChange }) => {
    return (
        <div className="space-y-4 p-3">
            <div className="space-y-2">
                <label className="text-xs text-white/60">Placeholder Text</label>
                <input
                    type="text"
                    value={input.placeholder || ''}
                    onChange={(e) => onChange({ ...input, placeholder: e.target.value })}
                    placeholder="Type a message..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                    <label className="text-xs text-white/60">Voice</label>
                    <button
                        onClick={() => onChange({ ...input, voiceEnabled: !input.voiceEnabled })}
                        className={cn(
                            'w-8 h-4 rounded-full transition-all',
                            input.voiceEnabled ? 'bg-indigo-500' : 'bg-white/20'
                        )}
                    >
                        <motion.div
                            className="w-3 h-3 bg-white rounded-full m-0.5"
                            animate={{ x: input.voiceEnabled ? 16 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    </button>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                    <label className="text-xs text-white/60">Upload</label>
                    <button
                        onClick={() => onChange({ ...input, fileUpload: !input.fileUpload })}
                        className={cn(
                            'w-8 h-4 rounded-full transition-all',
                            input.fileUpload ? 'bg-indigo-500' : 'bg-white/20'
                        )}
                    >
                        <motion.div
                            className="w-3 h-3 bg-white rounded-full m-0.5"
                            animate={{ x: input.fileUpload ? 16 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    </button>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                    <label className="text-xs text-white/60">Multiline</label>
                    <button
                        onClick={() => onChange({ ...input, multiline: !input.multiline })}
                        className={cn(
                            'w-8 h-4 rounded-full transition-all',
                            input.multiline ? 'bg-indigo-500' : 'bg-white/20'
                        )}
                    >
                        <motion.div
                            className="w-3 h-3 bg-white rounded-full m-0.5"
                            animate={{ x: input.multiline ? 16 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    </button>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                    <label className="text-xs text-white/60">Char Count</label>
                    <button
                        onClick={() => onChange({ ...input, showCharCount: !input.showCharCount })}
                        className={cn(
                            'w-8 h-4 rounded-full transition-all',
                            input.showCharCount ? 'bg-indigo-500' : 'bg-white/20'
                        )}
                    >
                        <motion.div
                            className="w-3 h-3 bg-white rounded-full m-0.5"
                            animate={{ x: input.showCharCount ? 16 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// Contextual UI Editor Section
// ============================================================================

const ContextualUIEditor: React.FC<{
    contextualUI: ContextualUIConfig;
    onChange: (contextualUI: ContextualUIConfig) => void;
}> = ({ contextualUI, onChange }) => {
    const strategies: Array<{ value: SuggestionStrategy; label: string; description: string }> = [
        { value: 'semantic', label: 'Semantic', description: 'AI-powered smart suggestions' },
        { value: 'heuristic', label: 'Heuristic', description: 'Rule-based quick suggestions' },
        { value: 'agent-defined', label: 'Agent', description: 'Only show agent suggestions' },
        { value: 'none', label: 'None', description: 'Disable all suggestions' },
    ];

    const layouts: Array<{ value: ContextualUIConfig['suggestionLayout']; label: string }> = [
        { value: 'horizontal', label: 'Horizontal' },
        { value: 'vertical', label: 'Vertical' },
        { value: 'grid', label: 'Grid' },
    ];

    return (
        <div className="space-y-4 p-3">
            <div className="flex items-center justify-between">
                <label className="text-xs text-white/60">Enable Suggestions</label>
                <button
                    onClick={() => onChange({ ...contextualUI, suggestionsEnabled: !contextualUI.suggestionsEnabled })}
                    className={cn(
                        'w-10 h-5 rounded-full transition-all',
                        contextualUI.suggestionsEnabled ? 'bg-indigo-500' : 'bg-white/20'
                    )}
                >
                    <motion.div
                        className="w-4 h-4 bg-white rounded-full m-0.5"
                        animate={{ x: contextualUI.suggestionsEnabled ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                </button>
            </div>

            {contextualUI.suggestionsEnabled && (
                <>
                    <div className="space-y-2">
                        <label className="text-xs text-white/60">Suggestion Strategy</label>
                        <div className="grid grid-cols-2 gap-2">
                            {strategies.map(({ value, label, description }) => (
                                <button
                                    key={value}
                                    onClick={() => onChange({ ...contextualUI, suggestionStrategy: value })}
                                    className={cn(
                                        'p-2 rounded-lg text-left transition-all',
                                        contextualUI.suggestionStrategy === value
                                            ? 'bg-indigo-500/30 border border-indigo-500/50'
                                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                    )}
                                >
                                    <div className="text-xs font-medium text-white">{label}</div>
                                    <div className="text-[10px] text-white/50">{description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-white/60">Max Suggestions</label>
                        <input
                            type="range"
                            min="1"
                            max="6"
                            value={contextualUI.maxSuggestions || 4}
                            onChange={(e) => onChange({ ...contextualUI, maxSuggestions: parseInt(e.target.value) })}
                            className="w-full"
                        />
                        <div className="text-center text-xs text-white/50">{contextualUI.maxSuggestions || 4}</div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-white/60">Layout</label>
                        <div className="flex gap-2">
                            {layouts.map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => onChange({ ...contextualUI, suggestionLayout: value })}
                                    className={cn(
                                        'flex-1 px-3 py-1.5 rounded-lg text-xs transition-all',
                                        contextualUI.suggestionLayout === value
                                            ? 'bg-indigo-500/30 text-white border border-indigo-500/50'
                                            : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// ============================================================================
// Quick Actions Editor Section
// ============================================================================

const QuickActionsEditor: React.FC<{
    actions: QuickAction[];
    onChange: (actions: QuickAction[]) => void;
}> = ({ actions, onChange }) => {
    const addAction = () => {
        onChange([...actions, { label: 'New Action', value: '', icon: 'Sparkles' }]);
    };

    const updateAction = (index: number, updates: Partial<QuickAction>) => {
        const newActions = [...actions];
        newActions[index] = { ...newActions[index], ...updates };
        onChange(newActions);
    };

    const removeAction = (index: number) => {
        onChange(actions.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3 p-3">
            <AnimatePresence>
                {actions.map((action, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2"
                    >
                        <div className="flex items-center justify-between">
                            <GripVertical size={14} className="text-white/30" />
                            <button
                                onClick={() => removeAction(index)}
                                className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                value={action.label}
                                onChange={(e) => updateAction(index, { label: e.target.value })}
                                placeholder="Label"
                                className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
                            />
                            <input
                                type="text"
                                value={action.icon || ''}
                                onChange={(e) => updateAction(index, { icon: e.target.value })}
                                placeholder="Icon name"
                                className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
                            />
                        </div>

                        <input
                            type="text"
                            value={action.value}
                            onChange={(e) => updateAction(index, { value: e.target.value })}
                            placeholder="Message to send when clicked"
                            className="w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
                        />

                        <input
                            type="text"
                            value={action.description || ''}
                            onChange={(e) => updateAction(index, { description: e.target.value })}
                            placeholder="Description (tooltip)"
                            className="w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/70 focus:outline-none focus:border-white/30"
                        />
                    </motion.div>
                ))}
            </AnimatePresence>

            <button
                onClick={addAction}
                className="w-full py-2 rounded-lg border border-dashed border-white/20 text-xs text-white/50 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2"
            >
                <Plus size={14} />
                Add Quick Action
            </button>
        </div>
    );
};

// ============================================================================
// Main Component
// ============================================================================

export const AgentUXConfigEditor: React.FC<AgentUXConfigEditorProps> = ({
    agentId,
    agentName,
    agentColor: _agentColor = '#6366F1', // Reserved for future use
    position = { x: 300, y: 150 },
    onClose,
    onSave,
    isActive = true,
    onFocus,
}) => {
    const { config: loadedConfig, isLoading } = useAgentUXConfig(agentId);

    const [localConfig, setLocalConfig] = useState<Partial<AgentUXConfig>>({});
    const [openSections, setOpenSections] = useState<Set<EditorSection>>(new Set(['theme']));
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize local config from loaded config
    useEffect(() => {
        if (loadedConfig) {
            setLocalConfig({
                theme: loadedConfig.theme,
                input: loadedConfig.input,
                contextualUI: loadedConfig.contextualUI,
                quickActions: loadedConfig.quickActions,
            });
        }
    }, [loadedConfig]);

    const toggleSection = useCallback((section: EditorSection) => {
        setOpenSections(prev => {
            const next = new Set(prev);
            if (next.has(section)) {
                next.delete(section);
            } else {
                next.add(section);
            }
            return next;
        });
    }, []);

    const handleThemeChange = useCallback((theme: ThemeConfig) => {
        setLocalConfig(prev => ({ ...prev, theme }));
        setHasChanges(true);
    }, []);

    const handleInputChange = useCallback((input: InputConfig) => {
        setLocalConfig(prev => ({ ...prev, input }));
        setHasChanges(true);
    }, []);

    const handleContextualUIChange = useCallback((contextualUI: ContextualUIConfig) => {
        setLocalConfig(prev => ({ ...prev, contextualUI }));
        setHasChanges(true);
    }, []);

    const handleQuickActionsChange = useCallback((quickActions: QuickAction[]) => {
        setLocalConfig(prev => ({ ...prev, quickActions }));
        setHasChanges(true);
    }, []);

    const handleSave = useCallback(() => {
        onSave?.(localConfig);
        setHasChanges(false);
    }, [localConfig, onSave]);

    const handleReset = useCallback(() => {
        setLocalConfig({
            theme: DEFAULT_AGENT_UX_CONFIG.theme,
            input: DEFAULT_AGENT_UX_CONFIG.input,
            contextualUI: DEFAULT_AGENT_UX_CONFIG.contextualUI,
            quickActions: [],
        });
        setHasChanges(true);
    }, []);

    const headerTitle = (
        <div className="flex items-center gap-2">
            <Settings size={16} className="text-white/70" />
            <span className="text-sm font-medium text-white/90">
                Configure {agentName}
            </span>
        </div>
    );

    const headerRight = (
        <div className="flex items-center gap-2">
            {hasChanges && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={handleSave}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/30 hover:bg-indigo-500/50 text-xs text-white transition-colors"
                >
                    <Save size={12} />
                    Save
                </motion.button>
            )}
            <button
                onClick={handleReset}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                title="Reset to defaults"
            >
                <RefreshCw size={14} />
            </button>
        </div>
    );

    if (isLoading) {
        return (
            <GlassWindow
                id={`ux-config-editor-${agentId}`}
                title={headerTitle}
                initialPosition={position}
                initialSize={{ width: 400, height: 500 }}
                onClose={onClose}
                isActive={isActive}
                onFocus={onFocus}
            >
                <div className="flex items-center justify-center h-full">
                    <div className="text-white/50 text-sm">Loading configuration...</div>
                </div>
            </GlassWindow>
        );
    }

    return (
        <GlassWindow
            id={`ux-config-editor-${agentId}`}
            title={headerTitle}
            headerRight={headerRight}
            initialPosition={position}
            initialSize={{ width: 400, height: 600 }}
            onClose={onClose}
            isActive={isActive}
            onFocus={onFocus}
        >
            <div className="h-full overflow-y-auto custom-scrollbar -m-4 p-4 space-y-3">
                {/* Theme Section */}
                <div>
                    <SectionHeader
                        icon={Palette}
                        title="Theme"
                        isOpen={openSections.has('theme')}
                        onToggle={() => toggleSection('theme')}
                    />
                    <AnimatePresence>
                        {openSections.has('theme') && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <ThemeEditor
                                    theme={localConfig.theme || {}}
                                    onChange={handleThemeChange}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Section */}
                <div>
                    <SectionHeader
                        icon={Type}
                        title="Input Options"
                        isOpen={openSections.has('input')}
                        onToggle={() => toggleSection('input')}
                    />
                    <AnimatePresence>
                        {openSections.has('input') && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <InputEditor
                                    input={localConfig.input || {}}
                                    onChange={handleInputChange}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Contextual UI Section */}
                <div>
                    <SectionHeader
                        icon={Sparkles}
                        title="Contextual UI"
                        isOpen={openSections.has('contextual')}
                        onToggle={() => toggleSection('contextual')}
                    />
                    <AnimatePresence>
                        {openSections.has('contextual') && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <ContextualUIEditor
                                    contextualUI={localConfig.contextualUI || {}}
                                    onChange={handleContextualUIChange}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Quick Actions Section */}
                <div>
                    <SectionHeader
                        icon={Zap}
                        title="Quick Actions"
                        isOpen={openSections.has('quickActions')}
                        onToggle={() => toggleSection('quickActions')}
                    />
                    <AnimatePresence>
                        {openSections.has('quickActions') && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <QuickActionsEditor
                                    actions={localConfig.quickActions || []}
                                    onChange={handleQuickActionsChange}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </GlassWindow>
    );
};

export default AgentUXConfigEditor;
