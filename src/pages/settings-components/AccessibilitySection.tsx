import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Accessibility,
    Eye,
    Ear,
    MonitorPlay,
    Zap,
    Type,
    Contrast,
    Volume2,
    VolumeX,
    Sun,
    Palette,
    Info,
} from 'lucide-react';
import { GlassContainer, GlassButton, GlassToggle, GlassSlider } from '@/components';
import { cn } from '@/utils/cn';

// ============================================
// Types
// ============================================

interface AccessibilitySettings {
    // Motion
    reduceMotion: boolean;
    animationSpeed: number;
    disableParallax: boolean;
    disableAutoplay: boolean;

    // Vision
    highContrast: boolean;
    colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
    fontSize: number;
    lineHeight: number;
    focusIndicator: 'default' | 'high-visibility' | 'outline-only';

    // Audio
    soundEffects: boolean;
    soundVolume: number;
    screenReaderHints: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
    reduceMotion: false,
    animationSpeed: 100,
    disableParallax: false,
    disableAutoplay: false,
    highContrast: false,
    colorBlindMode: 'none',
    fontSize: 100,
    lineHeight: 150,
    focusIndicator: 'default',
    soundEffects: true,
    soundVolume: 50,
    screenReaderHints: true,
};

// ============================================
// Setting Row Component
// ============================================

interface SettingRowProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    hint?: string;
    children: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({
    icon,
    title,
    description,
    hint,
    children,
}) => (
    <div className="flex items-start justify-between py-4 border-b border-white/10 last:border-b-0">
        <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-white/5 text-secondary">
                {icon}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-primary">{title}</h4>
                    {hint && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">
                            Recommended
                        </span>
                    )}
                </div>
                <p className="text-xs text-secondary mt-0.5">{description}</p>
                {hint && (
                    <p className="text-xs text-tertiary mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {hint}
                    </p>
                )}
            </div>
        </div>
        <div className="ml-4">{children}</div>
    </div>
);

// ============================================
// Color Blind Mode Selector
// ============================================

interface ColorBlindSelectorProps {
    value: AccessibilitySettings['colorBlindMode'];
    onChange: (value: AccessibilitySettings['colorBlindMode']) => void;
}

const ColorBlindSelector: React.FC<ColorBlindSelectorProps> = ({ value, onChange }) => {
    const options: { value: AccessibilitySettings['colorBlindMode']; label: string; description: string }[] = [
        { value: 'none', label: 'None', description: 'Standard colors' },
        { value: 'protanopia', label: 'Protanopia', description: 'Red-blind' },
        { value: 'deuteranopia', label: 'Deuteranopia', description: 'Green-blind' },
        { value: 'tritanopia', label: 'Tritanopia', description: 'Blue-blind' },
    ];

    return (
        <div className="grid grid-cols-2 gap-2">
            {options.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={cn(
                        'px-3 py-2 rounded-xl text-left transition-all',
                        value === option.value
                            ? 'bg-primary text-white'
                            : 'bg-white/5 text-secondary hover:bg-white/10 hover:text-primary'
                    )}
                >
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs opacity-70">{option.description}</div>
                </button>
            ))}
        </div>
    );
};

// ============================================
// Focus Indicator Selector
// ============================================

interface FocusIndicatorSelectorProps {
    value: AccessibilitySettings['focusIndicator'];
    onChange: (value: AccessibilitySettings['focusIndicator']) => void;
}

const FocusIndicatorSelector: React.FC<FocusIndicatorSelectorProps> = ({ value, onChange }) => {
    const options: { value: AccessibilitySettings['focusIndicator']; label: string }[] = [
        { value: 'default', label: 'Default' },
        { value: 'high-visibility', label: 'High Visibility' },
        { value: 'outline-only', label: 'Outline Only' },
    ];

    return (
        <div className="flex gap-2">
            {options.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={cn(
                        'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                        value === option.value
                            ? 'bg-primary text-white'
                            : 'bg-white/5 text-secondary hover:bg-white/10 hover:text-primary'
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

// ============================================
// Main Component
// ============================================

export const AccessibilitySection: React.FC = () => {
    const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    // Check system preference for reduced motion
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const updateSetting = <K extends keyof AccessibilitySettings>(
        key: K,
        value: AccessibilitySettings[K]
    ) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20">
                    <Accessibility className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-primary">Accessibility</h3>
                    <p className="text-sm text-secondary">
                        Customize the interface to meet your needs
                    </p>
                </div>
            </div>

            {/* System Preferences Notice */}
            {prefersReducedMotion && !settings.reduceMotion && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
                >
                    <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <div>
                            <h4 className="text-sm font-medium text-amber-400">System Preference Detected</h4>
                            <p className="text-xs text-secondary mt-0.5">
                                Your system is set to reduce motion. Consider enabling this setting for a more comfortable experience.
                            </p>
                        </div>
                        <GlassButton
                            size="sm"
                            variant="secondary"
                            onClick={() => updateSetting('reduceMotion', true)}
                        >
                            Enable
                        </GlassButton>
                    </div>
                </motion.div>
            )}

            {/* Motion Section */}
            <GlassContainer className="p-6" border>
                <div className="flex items-center gap-2 mb-4">
                    <MonitorPlay className="w-5 h-5 text-violet-400" />
                    <h4 className="text-base font-semibold text-primary">Motion & Animation</h4>
                </div>

                <div className="space-y-1">
                    <SettingRow
                        icon={<Zap className="w-4 h-4" />}
                        title="Reduce Motion"
                        description="Minimize animations and transitions throughout the interface"
                        hint={prefersReducedMotion ? 'Matches your system preference' : undefined}
                    >
                        <GlassToggle
                            pressed={settings.reduceMotion}
                            onPressedChange={(pressed) => updateSetting('reduceMotion', pressed)}
                        />
                    </SettingRow>

                    {!settings.reduceMotion && (
                        <>
                            <SettingRow
                                icon={<MonitorPlay className="w-4 h-4" />}
                                title="Animation Speed"
                                description="Adjust the speed of all animations"
                            >
                                <div className="w-48">
                                    <GlassSlider
                                        value={settings.animationSpeed}
                                        onValueChange={(value) => updateSetting('animationSpeed', value)}
                                        min={25}
                                        max={200}
                                        step={25}
                                                                            />
                                </div>
                            </SettingRow>

                            <SettingRow
                                icon={<Sun className="w-4 h-4" />}
                                title="Disable Parallax Effects"
                                description="Turn off depth-based movement effects"
                            >
                                <GlassToggle
                                    pressed={settings.disableParallax}
                                    onPressedChange={(pressed) => updateSetting('disableParallax', pressed)}
                                />
                            </SettingRow>

                            <SettingRow
                                icon={<MonitorPlay className="w-4 h-4" />}
                                title="Disable Auto-play"
                                description="Stop videos and animations from playing automatically"
                            >
                                <GlassToggle
                                    pressed={settings.disableAutoplay}
                                    onPressedChange={(pressed) => updateSetting('disableAutoplay', pressed)}
                                />
                            </SettingRow>
                        </>
                    )}
                </div>
            </GlassContainer>

            {/* Vision Section */}
            <GlassContainer className="p-6" border>
                <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-5 h-5 text-blue-400" />
                    <h4 className="text-base font-semibold text-primary">Vision</h4>
                </div>

                <div className="space-y-1">
                    <SettingRow
                        icon={<Contrast className="w-4 h-4" />}
                        title="High Contrast Mode"
                        description="Increase contrast between elements for better visibility"
                    >
                        <GlassToggle
                            pressed={settings.highContrast}
                            onPressedChange={(pressed) => updateSetting('highContrast', pressed)}
                        />
                    </SettingRow>

                    <div className="py-4 border-b border-white/10">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-white/5 text-secondary">
                                <Palette className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-primary">Color Blind Mode</h4>
                                <p className="text-xs text-secondary mt-0.5">
                                    Adjust colors to accommodate color vision deficiencies
                                </p>
                            </div>
                        </div>
                        <ColorBlindSelector
                            value={settings.colorBlindMode}
                            onChange={(value) => updateSetting('colorBlindMode', value)}
                        />
                    </div>

                    <SettingRow
                        icon={<Type className="w-4 h-4" />}
                        title="Font Size"
                        description="Adjust the base font size throughout the interface"
                    >
                        <div className="w-48">
                            <GlassSlider
                                value={settings.fontSize}
                                onValueChange={(value) => updateSetting('fontSize', value)}
                                min={75}
                                max={150}
                                step={5}
                                                            />
                        </div>
                    </SettingRow>

                    <SettingRow
                        icon={<Type className="w-4 h-4" />}
                        title="Line Height"
                        description="Increase spacing between lines of text"
                    >
                        <div className="w-48">
                            <GlassSlider
                                value={settings.lineHeight}
                                onValueChange={(value) => updateSetting('lineHeight', value)}
                                min={100}
                                max={200}
                                step={10}
                                                            />
                        </div>
                    </SettingRow>

                    <div className="py-4">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-white/5 text-secondary">
                                <Eye className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-primary">Focus Indicator Style</h4>
                                <p className="text-xs text-secondary mt-0.5">
                                    Customize how focused elements are highlighted
                                </p>
                            </div>
                        </div>
                        <FocusIndicatorSelector
                            value={settings.focusIndicator}
                            onChange={(value) => updateSetting('focusIndicator', value)}
                        />
                    </div>
                </div>
            </GlassContainer>

            {/* Audio Section */}
            <GlassContainer className="p-6" border>
                <div className="flex items-center gap-2 mb-4">
                    <Ear className="w-5 h-5 text-amber-400" />
                    <h4 className="text-base font-semibold text-primary">Audio & Feedback</h4>
                </div>

                <div className="space-y-1">
                    <SettingRow
                        icon={settings.soundEffects ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        title="Sound Effects"
                        description="Play sounds for notifications and interactions"
                    >
                        <GlassToggle
                            pressed={settings.soundEffects}
                            onPressedChange={(pressed) => updateSetting('soundEffects', pressed)}
                        />
                    </SettingRow>

                    {settings.soundEffects && (
                        <SettingRow
                            icon={<Volume2 className="w-4 h-4" />}
                            title="Sound Volume"
                            description="Adjust the volume of sound effects"
                        >
                            <div className="w-48">
                                <GlassSlider
                                    value={settings.soundVolume}
                                    onValueChange={(value) => updateSetting('soundVolume', value)}
                                    min={0}
                                    max={100}
                                    step={10}
                                                                    />
                            </div>
                        </SettingRow>
                    )}

                    <SettingRow
                        icon={<Info className="w-4 h-4" />}
                        title="Screen Reader Hints"
                        description="Add additional context for screen readers"
                    >
                        <GlassToggle
                            pressed={settings.screenReaderHints}
                            onPressedChange={(pressed) => updateSetting('screenReaderHints', pressed)}
                        />
                    </SettingRow>
                </div>
            </GlassContainer>

            {/* Preview Section */}
            <GlassContainer className="p-6" border>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-cyan-400" />
                        <h4 className="text-base font-semibold text-primary">Preview</h4>
                    </div>
                    <GlassButton
                        size="sm"
                        variant="secondary"
                        onClick={() => setSettings(DEFAULT_SETTINGS)}
                    >
                        Reset to Defaults
                    </GlassButton>
                </div>

                <div
                    className={cn(
                        'p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10',
                        settings.highContrast && 'border-white/40 bg-white/15'
                    )}
                    style={{
                        fontSize: `${settings.fontSize}%`,
                        lineHeight: `${settings.lineHeight}%`,
                    }}
                >
                    <h5 className="text-lg font-semibold text-primary mb-2">
                        Sample Content Preview
                    </h5>
                    <p className="text-sm text-secondary mb-4">
                        This is how text will appear with your current accessibility settings.
                        The font size, line height, and contrast have been adjusted based on your preferences.
                    </p>
                    <div className="flex gap-3">
                        <button
                            className={cn(
                                'px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium',
                                settings.focusIndicator === 'high-visibility' && 'focus:ring-4 focus:ring-emerald-500/50',
                                settings.focusIndicator === 'outline-only' && 'focus:outline-2 focus:outline-offset-2 focus:outline-emerald-500'
                            )}
                        >
                            Success Button
                        </button>
                        <button
                            className={cn(
                                'px-4 py-2 rounded-lg bg-red-500 text-white font-medium',
                                settings.focusIndicator === 'high-visibility' && 'focus:ring-4 focus:ring-red-500/50',
                                settings.focusIndicator === 'outline-only' && 'focus:outline-2 focus:outline-offset-2 focus:outline-red-500'
                            )}
                        >
                            Danger Button
                        </button>
                    </div>
                </div>
            </GlassContainer>
        </div>
    );
};

export default AccessibilitySection;
