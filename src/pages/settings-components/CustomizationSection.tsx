import { Moon, Sun, Minimize2, Image as ImageIcon, Sparkles, Video, Lightbulb, Info, Grip, Type, Zap, Layers, Palette, Layout, Settings2, Move } from 'lucide-react';
import { GlassContainer } from '@/components';
import { GlassSlider } from '@/components';
import { GlassSwitch } from '@/components';
import { HIGTooltip } from '@/components';
import { Backgrounds } from '@/components/Backgrounds/BackgroundRegistry';
import type { CustomizationSectionProps } from './types';

// Section header component for category grouping
const SectionHeader = ({ title, description, icon: Icon }: { title: string; description: string; icon: React.ElementType }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent-muted">
            <Icon size={18} className="text-accent" />
        </div>
        <div>
            <h3 className="text-lg font-semibold text-label-glass-primary">{title}</h3>
            <p className="text-sm text-label-glass-secondary">{description}</p>
        </div>
    </div>
);

export const CustomizationSection = ({
    theme,
    // toggleTheme is available but not currently used in this component
    toggleTheme: _toggleTheme,
    builtInThemes,
    customThemes,
    activeThemeId,
    glassRadius,
    setGlassRadius,
    shadowStrength,
    setShadowStrength,
    density,
    setDensity,
    localLightMode,
    setLocalLightMode,
    localDarkMode,
    setLocalDarkMode,
    activeModeTab,
    setActiveModeTab,
    specularEnabled,
    setSpecularEnabled,
    blurStrength,
    setBlurStrength,
    saturation,
    setSaturation,
    noiseOpacity,
    setNoiseOpacity,
    textShadowEnabled,
    setTextShadowEnabled,
    performanceMode,
    setPerformanceMode,
    bounceIntensity,
    setBounceIntensity,
    pulseIntensity,
    setPulseIntensity,
    scaleIntensity,
    setScaleIntensity,
    wiggleIntensity,
    setWiggleIntensity
}: CustomizationSectionProps) => {
    // Apple HIG recommended values helper component
    const AppleHint = ({ text }: { text: string }) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-500/10 text-blue-500 dark:bg-blue-400/15 dark:text-blue-400 ml-2">
            <Info size={10} />
            Apple HIG: {text}
        </span>
    );

    // Helper for mode-specific text colors
    const textPrimary = activeModeTab === 'dark' ? 'text-white' : 'text-gray-900';
    const textSecondary = activeModeTab === 'dark' ? 'text-gray-400' : 'text-gray-500';
    const borderColor = activeModeTab === 'dark' ? 'border-white/10' : 'border-gray-200';

    return (
        <>
            {/* Section Header */}
            <div className="sticky top-0 z-30 mb-8 p-4 rounded-3xl bg-glass-bg-thick/95 backdrop-blur-2xl shadow-lg border border-[var(--glass-border)] transition-all duration-300 flex items-center justify-between group hover:border-accent/20">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight px-2 text-label-glass-primary">Customization</h2>
                    <p className="text-xs text-label-glass-secondary px-2 mt-1 uppercase tracking-wider font-medium">Edit appearance settings for the active theme</p>
                </div>
                <div className="text-right px-4 border-l border-white/10 hidden sm:block">
                    <div className="text-[10px] text-label-glass-secondary uppercase tracking-widest font-bold mb-0.5">Current Theme</div>
                    <div className="text-sm font-bold text-accent">{[...builtInThemes, ...customThemes].find(t => t.id === activeThemeId)?.name || 'Default'}</div>
                </div>
            </div>

            <div className="space-y-8">
                {/* ============================================
                    1. APPEARANCE MODE (Light/Dark tabs)
                   ============================================ */}
                <GlassContainer className="p-6 rounded-2xl" border>
                    <SectionHeader
                        icon={Sun}
                        title="Appearance Mode"
                        description="Switch between light and dark interface themes"
                    />

                    {/* Mode Tabs */}
                    <div className="flex bg-glass-surface p-1 rounded-xl backdrop-blur-md">
                        <button
                            onClick={() => setActiveModeTab('light')}
                            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeModeTab === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-label-glass-secondary hover:text-label-glass-primary hover:bg-glass-surface-hover'}`}
                        >
                            <Sun size={16} />
                            Light Mode
                        </button>
                        <button
                            onClick={() => setActiveModeTab('dark')}
                            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeModeTab === 'dark' ? 'bg-gray-900 text-white shadow-sm' : 'text-label-glass-secondary hover:text-label-glass-primary hover:bg-glass-surface-hover'}`}
                        >
                            <Moon size={16} />
                            Dark Mode
                        </button>
                    </div>
                </GlassContainer>

                {/* Mode-specific container for following sections */}
                <div className={`space-y-6 p-6 rounded-2xl transition-colors border ${activeModeTab === 'dark' ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'}`}>

                    {/* ============================================
                        2. GLASS EFFECTS
                       ============================================ */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Layers size={16} className={textSecondary} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Glass Effects</span>
                        </div>

                        {/* Glass Intensity */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className={`text-md font-semibold ${textPrimary}`}>
                                        Glass Intensity
                                        <AppleHint text={activeModeTab === 'dark' ? '45-55%' : '70-80%'} />
                                    </h4>
                                    <p className={`text-sm mt-1 ${textSecondary}`}>How opaque or translucent the glass panels appear. Higher values make panels more solid.</p>
                                </div>
                                <span className={`text-2xl font-bold tabular-nums ${textPrimary}`}>
                                    {activeModeTab === 'light' ? (localLightMode.glass.intensity ?? 50) : (localDarkMode.glass.intensity ?? 50)}%
                                </span>
                            </div>
                            <GlassSlider
                                value={activeModeTab === 'light' ? (localLightMode.glass.intensity ?? 50) : (localDarkMode.glass.intensity ?? 50)}
                                onValueChange={(val) => {
                                    if (activeModeTab === 'light') {
                                        setLocalLightMode(prev => ({ ...prev, glass: { ...prev.glass, intensity: val } }));
                                    } else {
                                        setLocalDarkMode(prev => ({ ...prev, glass: { ...prev.glass, intensity: val } }));
                                    }
                                }}
                                min={0}
                                max={100}
                                step={1}
                            />
                        </div>

                        {/* Blur Strength */}
                        <div className={`pt-6 border-t ${borderColor} mb-6`}>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className={`text-md font-semibold inline-flex items-center ${textPrimary}`}>
                                        Blur Strength
                                        <AppleHint text="16-24px" />
                                    </h4>
                                    <p className={`text-sm mt-1 ${textSecondary}`}>How much the background is blurred behind glass. Higher values create a softer, dreamier look.</p>
                                </div>
                                <span className={`text-2xl font-bold tabular-nums ${textPrimary}`}>{blurStrength}%</span>
                            </div>
                            <GlassSlider
                                value={blurStrength}
                                onValueChange={setBlurStrength}
                                min={0}
                                max={100}
                                step={5}
                            />
                        </div>

                        {/* Outline Opacity */}
                        <div className={`pt-6 border-t ${borderColor}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className={`text-md font-semibold ${textPrimary}`}>
                                        Border Visibility
                                        <AppleHint text={activeModeTab === 'dark' ? '15-25%' : '20-35%'} />
                                    </h4>
                                    <p className={`text-sm mt-1 ${textSecondary}`}>Visibility of borders around glass panels. Increase for better visibility in light mode.</p>
                                </div>
                                <span className={`text-2xl font-bold tabular-nums ${textPrimary}`}>
                                    {activeModeTab === 'light' ? (localLightMode.visual.outlineOpacity ?? 30) : (localDarkMode.visual.outlineOpacity ?? 30)}%
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-medium ${textSecondary}`}>Hidden</span>
                                <div className="flex-1">
                                    <GlassSlider
                                        value={activeModeTab === 'light' ? (localLightMode.visual.outlineOpacity ?? 30) : (localDarkMode.visual.outlineOpacity ?? 30)}
                                        onValueChange={(val) => {
                                            if (activeModeTab === 'light') {
                                                setLocalLightMode(prev => ({ ...prev, visual: { ...prev.visual, outlineOpacity: val } }));
                                            } else {
                                                setLocalDarkMode(prev => ({ ...prev, visual: { ...prev.visual, outlineOpacity: val } }));
                                            }
                                        }}
                                        min={0}
                                        max={100}
                                        step={5}
                                    />
                                </div>
                                <span className={`text-xs font-medium ${textSecondary}`}>Visible</span>
                            </div>
                        </div>
                    </div>

                    {/* ============================================
                        3. COLORS & TINTING
                       ============================================ */}
                    <div className={`pt-8 border-t-2 ${borderColor}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <Palette size={16} className={textSecondary} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Colors & Tinting</span>
                        </div>

                        {/* Glass Tint Color */}
                        <div className="mb-6">
                            <h4 className={`text-md font-semibold mb-2 ${textPrimary}`}>Glass Tint</h4>
                            <p className={`text-sm mb-4 ${textSecondary}`}>Add a subtle color hue to all glass surfaces for a branded or themed look.</p>
                            <div className="flex gap-3 justify-between">
                                {[
                                    { label: 'Neutral', value: null, color: '#888888' },
                                    { label: 'Black', value: '#000000', color: '#000000' },
                                    { label: 'Blue', value: '#3b82f6', color: '#3b82f6' },
                                    { label: 'Purple', value: '#a855f7', color: '#a855f7' },
                                    { label: 'Emerald', value: '#10b981', color: '#10b981' },
                                    { label: 'Rose', value: '#f43f5e', color: '#f43f5e' },
                                    { label: 'Amber', value: '#f59e0b', color: '#f59e0b' },
                                ].map((t) => {
                                    const currentTint = activeModeTab === 'light' ? localLightMode.glass.tintColor : localDarkMode.glass.tintColor;
                                    return (
                                        <button
                                            key={t.label}
                                            onClick={() => {
                                                if (activeModeTab === 'light') {
                                                    setLocalLightMode(prev => ({ ...prev, glass: { ...prev.glass, tintColor: t.value } }));
                                                } else {
                                                    setLocalDarkMode(prev => ({ ...prev, glass: { ...prev.glass, tintColor: t.value } }));
                                                }
                                            }}
                                            className={`flex-1 aspect-square rounded-xl border-2 transition-all hover:scale-110 ${currentTint === t.value ? 'border-accent ring-2 ring-accent/20' : activeModeTab === 'dark' ? 'border-white/20' : 'border-gray-300'}`}
                                            style={{ backgroundColor: t.color }}
                                            title={t.label}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Accent Color */}
                        <div className={`pt-6 border-t ${borderColor} mb-6`}>
                            <h4 className={`text-md font-semibold mb-2 ${textPrimary}`}>Accent Color</h4>
                            <p className={`text-sm mb-4 ${textSecondary}`}>The primary brand color used for buttons, links, toggles, and interactive elements.</p>
                            <div className="flex gap-3 justify-between">
                                {[
                                    { label: 'Blue', value: '#007AFF' },
                                    { label: 'Indigo', value: '#5856D6' },
                                    { label: 'Purple', value: '#AF52DE' },
                                    { label: 'Pink', value: '#FF2D55' },
                                    { label: 'Red', value: '#FF3B30' },
                                    { label: 'Orange', value: '#FF9500' },
                                    { label: 'Green', value: '#34C759' },
                                    { label: 'Teal', value: '#5AC8FA' },
                                ].map((c) => {
                                    const currentAccent = activeModeTab === 'light' ? localLightMode.visual.accentColor : localDarkMode.visual.accentColor;
                                    return (
                                        <button
                                            key={c.label}
                                            onClick={() => {
                                                if (activeModeTab === 'light') {
                                                    setLocalLightMode(prev => ({ ...prev, visual: { ...prev.visual, accentColor: c.value } }));
                                                } else {
                                                    setLocalDarkMode(prev => ({ ...prev, visual: { ...prev.visual, accentColor: c.value } }));
                                                }
                                            }}
                                            className={`flex-1 aspect-square rounded-xl border-2 transition-all hover:scale-110 ${currentAccent === c.value ? 'border-white ring-2 ring-white/30 scale-110' : activeModeTab === 'dark' ? 'border-white/20' : 'border-gray-300'}`}
                                            style={{ backgroundColor: c.value }}
                                            title={c.label}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Saturation Boost */}
                        <div className={`pt-6 border-t ${borderColor}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className={`text-md font-semibold inline-flex items-center ${textPrimary}`}>
                                        Saturation Boost
                                        <AppleHint text="110-130%" />
                                    </h4>
                                    <p className={`text-sm mt-1 ${textSecondary}`}>Enhance or mute the vibrancy of colors visible through glass surfaces.</p>
                                </div>
                                <span className={`text-2xl font-bold tabular-nums ${textPrimary}`}>{saturation}%</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-medium ${textSecondary}`}>Muted</span>
                                <div className="flex-1">
                                    <GlassSlider
                                        value={saturation}
                                        onValueChange={setSaturation}
                                        min={0}
                                        max={200}
                                        step={5}
                                    />
                                </div>
                                <span className={`text-xs font-medium ${textSecondary}`}>Vibrant</span>
                            </div>
                        </div>
                    </div>

                    {/* ============================================
                        4. TYPOGRAPHY & READABILITY
                       ============================================ */}
                    <div className={`pt-8 border-t-2 ${borderColor}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <Type size={16} className={textSecondary} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Typography & Readability</span>
                        </div>

                        {/* Text Vibrancy */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className={`text-md font-semibold ${textPrimary}`}>
                                        Text Vibrancy
                                        <AppleHint text="60-70%" />
                                    </h4>
                                    <p className={`text-sm mt-1 ${textSecondary}`}>Adjust contrast of secondary text. Higher values make text bolder and more legible.</p>
                                </div>
                                <span className={`text-2xl font-bold tabular-nums ${textPrimary}`}>
                                    {activeModeTab === 'light' ? (localLightMode.visual.textVibrancy ?? 50) : (localDarkMode.visual.textVibrancy ?? 50)}%
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-medium ${textSecondary}`}>Muted</span>
                                <div className="flex-1">
                                    <GlassSlider
                                        value={activeModeTab === 'light' ? (localLightMode.visual.textVibrancy ?? 50) : (localDarkMode.visual.textVibrancy ?? 50)}
                                        onValueChange={(val) => {
                                            if (activeModeTab === 'light') {
                                                setLocalLightMode(prev => ({ ...prev, visual: { ...prev.visual, textVibrancy: val } }));
                                            } else {
                                                setLocalDarkMode(prev => ({ ...prev, visual: { ...prev.visual, textVibrancy: val } }));
                                            }
                                        }}
                                        min={0}
                                        max={100}
                                        step={5}
                                    />
                                </div>
                                <span className={`text-xs font-medium ${textSecondary}`}>Vibrant</span>
                            </div>
                        </div>

                        {/* Text Shadows Toggle */}
                        <div className={`pt-6 border-t ${borderColor} flex items-center justify-between`}>
                            <div>
                                <h4 className={`text-md font-semibold ${textPrimary}`}>Text Shadows</h4>
                                <p className={`text-sm mt-1 ${textSecondary}`}>Add subtle shadows behind text to improve readability on busy or light backgrounds.</p>
                            </div>
                            <GlassSwitch
                                checked={textShadowEnabled}
                                onCheckedChange={setTextShadowEnabled}
                            />
                        </div>
                    </div>

                    {/* ============================================
                        5. SHAPES & SPACING (Global settings)
                       ============================================ */}
                    <div className={`pt-8 border-t-2 ${borderColor}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <Layout size={16} className={textSecondary} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Shapes & Spacing</span>
                        </div>

                        {/* Corner Radius */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className={`text-md font-semibold inline-flex items-center ${textPrimary}`}>
                                        Corner Radius
                                        <AppleHint text="12-24px" />
                                    </h4>
                                    <p className={`text-sm mt-1 ${textSecondary}`}>How rounded the corners of glass panels are. 0 = sharp squares, max = pill shapes.</p>
                                </div>
                                <span className={`text-2xl font-bold tabular-nums ${textPrimary}`}>{glassRadius}px</span>
                            </div>
                            <GlassSlider
                                value={glassRadius}
                                onValueChange={setGlassRadius}
                                min={0}
                                max={48}
                                step={2}
                            />
                        </div>

                        {/* Shadow Strength */}
                        <div className={`pt-6 border-t ${borderColor} mb-6`}>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className={`text-md font-semibold inline-flex items-center ${textPrimary}`}>
                                        Shadow Strength
                                        <AppleHint text={theme === 'dark' ? '25-35%' : '8-12%'} />
                                    </h4>
                                    <p className={`text-sm mt-1 ${textSecondary}`}>Depth effect under glass panels. Higher values create a more pronounced 3D appearance.</p>
                                </div>
                                <span className={`text-2xl font-bold tabular-nums ${textPrimary}`}>{shadowStrength}%</span>
                            </div>
                            <GlassSlider
                                value={shadowStrength}
                                onValueChange={setShadowStrength}
                                min={0}
                                max={100}
                                step={5}
                            />
                        </div>

                        {/* Glass Material */}
                        <div className={`pt-6 border-t ${borderColor} mb-6`}>
                            <div className="mb-3">
                                <h4 className={`text-md font-semibold ${textPrimary}`}>
                                    Glass Material
                                    <AppleHint text="regular (16px blur)" />
                                </h4>
                                <p className={`text-sm mt-1 ${textSecondary}`}>Overall thickness preset: thin (subtle), regular (balanced), thick (bold and prominent).</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {(['thin', 'regular', 'thick'] as const).map((material) => {
                                    const currentMaterial = activeModeTab === 'light'
                                        ? (localLightMode.glass.material ?? 'regular')
                                        : (localDarkMode.glass.material ?? 'regular');
                                    const isSelected = currentMaterial === material;
                                    return (
                                        <button
                                            key={material}
                                            onClick={() => {
                                                if (activeModeTab === 'light') {
                                                    setLocalLightMode(prev => ({ ...prev, glass: { ...prev.glass, material: material } }));
                                                } else {
                                                    setLocalDarkMode(prev => ({ ...prev, glass: { ...prev.glass, material: material } }));
                                                }
                                            }}
                                            className={`p-4 rounded-xl border-2 transition-all ${isSelected
                                                ? 'border-accent ring-2 ring-accent/30'
                                                : activeModeTab === 'dark' ? 'border-white/20 hover:border-white/40' : 'border-gray-300 hover:border-gray-400'
                                                } ${activeModeTab === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}
                                        >
                                            <span className={`text-sm font-medium capitalize ${textPrimary}`}>
                                                {material}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Compact Mode */}
                        <div className={`pt-6 border-t ${borderColor} flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-accent-muted">
                                    <Minimize2 size={18} className="text-accent" />
                                </div>
                                <div>
                                    <h4 className={`text-md font-semibold ${textPrimary}`}>Compact Mode</h4>
                                    <p className={`text-sm mt-0.5 ${textSecondary}`}>Reduce padding and spacing for denser information display on smaller screens.</p>
                                </div>
                            </div>
                            <GlassSwitch
                                checked={density === 'compact'}
                                onCheckedChange={(checked) => setDensity(checked ? 'compact' : 'comfortable')}
                            />
                        </div>
                    </div>

                    {/* ============================================
                        6. ADVANCED EFFECTS
                       ============================================ */}
                    <div className={`pt-8 border-t-2 ${borderColor}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <Settings2 size={16} className={textSecondary} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Advanced Effects</span>
                        </div>

                        {/* Specular Highlights */}
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-accent-muted">
                                    <Lightbulb size={18} className="text-accent" />
                                </div>
                                <div>
                                    <h4 className={`text-md font-semibold ${textPrimary}`}>Specular Highlights</h4>
                                    <p className={`text-sm mt-0.5 ${textSecondary}`}>Simulate light reflections on glass edges for a realistic 3D look (Apple HIG).</p>
                                </div>
                            </div>
                            <GlassSwitch
                                checked={specularEnabled}
                                onCheckedChange={setSpecularEnabled}
                            />
                        </div>

                        {/* Noise / Grain */}
                        <div className={`pt-6 border-t ${borderColor} mb-6`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-accent-muted">
                                        <Grip size={18} className="text-accent" />
                                    </div>
                                    <div>
                                        <h4 className={`text-md font-semibold inline-flex items-center ${textPrimary}`}>
                                            Noise / Grain
                                            <AppleHint text="2-5%" />
                                        </h4>
                                        <p className={`text-sm mt-0.5 ${textSecondary}`}>Add film-like texture to glass for a frosted, organic feel like real glass.</p>
                                    </div>
                                </div>
                                <span className={`text-2xl font-bold tabular-nums ${textPrimary}`}>{noiseOpacity}%</span>
                            </div>
                            <GlassSlider
                                value={noiseOpacity}
                                onValueChange={setNoiseOpacity}
                                min={0}
                                max={100}
                                step={1}
                            />
                        </div>

                        {/* Background Overlay */}
                        <div className={`pt-6 border-t ${borderColor}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className={`text-md font-semibold ${textPrimary}`}>Background Overlay</h4>
                                    <p className={`text-sm mt-1 ${textSecondary}`}>Darken the background slightly to improve panel contrast and reduce eye strain.</p>
                                </div>
                                <GlassSwitch
                                    checked={activeModeTab === 'light' ? (localLightMode.overlay.enabled ?? false) : (localDarkMode.overlay.enabled ?? false)}
                                    onCheckedChange={(checked) => {
                                        if (activeModeTab === 'light') {
                                            setLocalLightMode(prev => ({ ...prev, overlay: { ...prev.overlay, enabled: checked } }));
                                        } else {
                                            setLocalDarkMode(prev => ({ ...prev, overlay: { ...prev.overlay, enabled: checked } }));
                                        }
                                    }}
                                />
                            </div>
                            {(activeModeTab === 'light' ? localLightMode.overlay.enabled : localDarkMode.overlay.enabled) && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-sm font-medium ${textSecondary}`}>Intensity</span>
                                        <span className={`text-sm font-bold ${textPrimary}`}>
                                            {activeModeTab === 'light' ? (localLightMode.overlay.intensity ?? 0) : (localDarkMode.overlay.intensity ?? 0)}%
                                        </span>
                                    </div>
                                    <GlassSlider
                                        value={activeModeTab === 'light' ? (localLightMode.overlay.intensity ?? 0) : (localDarkMode.overlay.intensity ?? 0)}
                                        onValueChange={(val) => {
                                            if (activeModeTab === 'light') {
                                                setLocalLightMode(prev => ({ ...prev, overlay: { ...prev.overlay, intensity: val } }));
                                            } else {
                                                setLocalDarkMode(prev => ({ ...prev, overlay: { ...prev.overlay, intensity: val } }));
                                            }
                                        }}
                                        min={0}
                                        max={100}
                                        step={5}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ============================================
                        7. MOTION & ANIMATION
                       ============================================ */}
                    <div className={`pt-8 border-t-2 ${borderColor}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <Move size={16} className={textSecondary} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Motion & Animation</span>
                            <HIGTooltip topic="motion" side="top" />
                        </div>
                        <p className={`text-sm mb-6 ${textSecondary}`}>
                            Control the intensity of animation effects. Set to 0 to disable an effect completely.
                        </p>

                        {/* Bounce Effect */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="p-2 rounded-lg bg-accent-muted transition-transform"
                                        style={{
                                            animation: bounceIntensity > 0
                                                ? `bounce-preview 0.6s ease-in-out infinite`
                                                : 'none'
                                        }}
                                    >
                                        <Sparkles size={18} className="text-accent" />
                                    </div>
                                    <div>
                                        <h4 className={`text-md font-semibold ${textPrimary}`}>Bounce</h4>
                                        <p className={`text-sm mt-0.5 ${textSecondary}`}>Elastic scale up/down effect for interactive elements.</p>
                                    </div>
                                </div>
                                <span className={`text-2xl font-bold tabular-nums ${textPrimary}`}>
                                    {bounceIntensity === 0 ? 'Off' : `${bounceIntensity}%`}
                                </span>
                            </div>
                            <GlassSlider
                                value={bounceIntensity}
                                onValueChange={setBounceIntensity}
                                min={0}
                                max={100}
                                step={5}
                            />
                        </div>

                        {/* Pulse Effect */}
                        <div className={`pt-6 border-t ${borderColor} mb-6`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="p-2 rounded-lg bg-accent-muted"
                                        style={{
                                            animation: pulseIntensity > 0
                                                ? `pulse-preview 1.5s ease-in-out infinite`
                                                : 'none'
                                        }}
                                    >
                                        <Sparkles size={18} className="text-accent" />
                                    </div>
                                    <div>
                                        <h4 className={`text-md font-semibold ${textPrimary}`}>Pulse</h4>
                                        <p className={`text-sm mt-0.5 ${textSecondary}`}>Opacity variation over time for subtle breathing effect.</p>
                                    </div>
                                </div>
                                <span className={`text-2xl font-bold tabular-nums ${textPrimary}`}>
                                    {pulseIntensity === 0 ? 'Off' : `${pulseIntensity}%`}
                                </span>
                            </div>
                            <GlassSlider
                                value={pulseIntensity}
                                onValueChange={setPulseIntensity}
                                min={0}
                                max={100}
                                step={5}
                            />
                        </div>

                        {/* Scale Effect */}
                        <div className={`pt-6 border-t ${borderColor} mb-6`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="p-2 rounded-lg bg-accent-muted transition-transform"
                                        style={{
                                            animation: scaleIntensity > 0
                                                ? `scale-preview 1s ease-in-out infinite`
                                                : 'none'
                                        }}
                                    >
                                        <Sparkles size={18} className="text-accent" />
                                    </div>
                                    <div>
                                        <h4 className={`text-md font-semibold ${textPrimary}`}>Scale</h4>
                                        <p className={`text-sm mt-0.5 ${textSecondary}`}>Increase/decrease size for hover and focus states.</p>
                                    </div>
                                </div>
                                <span className={`text-2xl font-bold tabular-nums ${textPrimary}`}>
                                    {scaleIntensity === 0 ? 'Off' : `${scaleIntensity}%`}
                                </span>
                            </div>
                            <GlassSlider
                                value={scaleIntensity}
                                onValueChange={setScaleIntensity}
                                min={0}
                                max={100}
                                step={5}
                            />
                        </div>

                        {/* Wiggle Effect */}
                        <div className={`pt-6 border-t ${borderColor}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="p-2 rounded-lg bg-accent-muted"
                                        style={{
                                            animation: wiggleIntensity > 0
                                                ? `wiggle-preview 0.5s ease-in-out infinite`
                                                : 'none'
                                        }}
                                    >
                                        <Sparkles size={18} className="text-accent" />
                                    </div>
                                    <div>
                                        <h4 className={`text-md font-semibold ${textPrimary}`}>Wiggle</h4>
                                        <p className={`text-sm mt-0.5 ${textSecondary}`}>Back and forth rotational movement for attention-grabbing UI.</p>
                                    </div>
                                </div>
                                <span className={`text-2xl font-bold tabular-nums ${textPrimary}`}>
                                    {wiggleIntensity === 0 ? 'Off' : `${wiggleIntensity}%`}
                                </span>
                            </div>
                            <GlassSlider
                                value={wiggleIntensity}
                                onValueChange={setWiggleIntensity}
                                min={0}
                                max={100}
                                step={5}
                            />
                        </div>
                    </div>

                    {/* ============================================
                        8. PERFORMANCE
                       ============================================ */}
                    <div className={`pt-8 border-t-2 ${borderColor}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <Zap size={16} className={textSecondary} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Performance</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-accent-muted">
                                    <Zap size={18} className="text-accent" />
                                </div>
                                <div>
                                    <h4 className={`text-md font-semibold ${textPrimary}`}>Performance Mode</h4>
                                    <p className={`text-sm mt-0.5 ${textSecondary}`}>Disable animations and heavy effects for smoother scrolling on older devices.</p>
                                </div>
                            </div>
                            <GlassSwitch
                                checked={performanceMode}
                                onCheckedChange={setPerformanceMode}
                            />
                        </div>
                    </div>

                    {/* ============================================
                        8. WALLPAPERS (At bottom - takes most space)
                       ============================================ */}
                    <div className={`pt-8 border-t-2 ${borderColor}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <ImageIcon size={16} className={textSecondary} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>Wallpaper</span>
                        </div>
                        <p className={`text-sm mb-6 ${textSecondary}`}>Select the background image, video, or animated element for {activeModeTab} mode.</p>

                        {/* Elements Row */}
                        <div className="mb-6">
                            <div className={`flex items-center gap-2 mb-3 ${textSecondary}`}>
                                <Sparkles size={14} />
                                <span className="text-xs font-semibold uppercase tracking-wider">Animated Elements</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {Backgrounds.filter(bg => bg.type === 'element').map((bg) => {
                                    const currentBgId = activeModeTab === 'light' ? localLightMode.background.id : localDarkMode.background.id;
                                    const isSelected = currentBgId === bg.id;
                                    const BgComponent = bg.component;
                                    return (
                                        <button
                                            key={bg.id}
                                            onClick={() => {
                                                if (activeModeTab === 'light') {
                                                    setLocalLightMode(prev => ({ ...prev, background: { ...prev.background, id: bg.id } }));
                                                } else {
                                                    setLocalDarkMode(prev => ({ ...prev, background: { ...prev.background, id: bg.id } }));
                                                }
                                            }}
                                            className={`relative aspect-[2/1] rounded-lg overflow-hidden border-2 transition-all ${isSelected
                                                ? 'border-accent ring-2 ring-accent/20'
                                                : activeModeTab === 'dark' ? 'border-white/20 opacity-70 hover:opacity-100' : 'border-gray-300 opacity-70 hover:opacity-100'
                                                }`}
                                            title={bg.name}
                                        >
                                            <div className={`w-full h-full relative overflow-hidden ${bg.preferredTheme === 'light' ? 'bg-white' : 'bg-black'}`}>
                                                {BgComponent && (
                                                    <div className="absolute inset-0">
                                                        <BgComponent />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                                                    <span className="text-[10px] font-medium text-white/90 drop-shadow-md line-clamp-1">{bg.name}</span>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow-lg">
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Images Row */}
                        <div className="mb-6">
                            <div className={`flex items-center gap-2 mb-3 ${textSecondary}`}>
                                <ImageIcon size={14} />
                                <span className="text-xs font-semibold uppercase tracking-wider">Static Images</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {Backgrounds.filter(bg => bg.type === 'image').map((bg) => {
                                    const currentBgId = activeModeTab === 'light' ? localLightMode.background.id : localDarkMode.background.id;
                                    const isSelected = currentBgId === bg.id;
                                    return (
                                        <button
                                            key={bg.id}
                                            onClick={() => {
                                                if (activeModeTab === 'light') {
                                                    setLocalLightMode(prev => ({ ...prev, background: { ...prev.background, id: bg.id } }));
                                                } else {
                                                    setLocalDarkMode(prev => ({ ...prev, background: { ...prev.background, id: bg.id } }));
                                                }
                                            }}
                                            className={`relative aspect-[2/1] rounded-lg overflow-hidden border-2 transition-all ${isSelected
                                                ? 'border-accent ring-2 ring-accent/20'
                                                : activeModeTab === 'dark' ? 'border-white/20 opacity-70 hover:opacity-100' : 'border-gray-300 opacity-70 hover:opacity-100'
                                                }`}
                                            title={bg.name}
                                        >
                                            <img src={bg.src} alt={bg.name} className="w-full h-full object-cover" />
                                            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                                                <span className="text-[10px] font-medium text-white/90 drop-shadow-md line-clamp-1">{bg.name}</span>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow-lg">
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Videos Row */}
                        <div>
                            <div className={`flex items-center gap-2 mb-3 ${textSecondary}`}>
                                <Video size={14} />
                                <span className="text-xs font-semibold uppercase tracking-wider">Video Backgrounds</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {Backgrounds.filter(bg => bg.type === 'video').map((bg) => {
                                    const currentBgId = activeModeTab === 'light' ? localLightMode.background.id : localDarkMode.background.id;
                                    const isSelected = currentBgId === bg.id;
                                    return (
                                        <button
                                            key={bg.id}
                                            onClick={() => {
                                                if (activeModeTab === 'light') {
                                                    setLocalLightMode(prev => ({ ...prev, background: { ...prev.background, id: bg.id } }));
                                                } else {
                                                    setLocalDarkMode(prev => ({ ...prev, background: { ...prev.background, id: bg.id } }));
                                                }
                                            }}
                                            className={`relative aspect-[2/1] rounded-lg overflow-hidden border-2 transition-all ${isSelected
                                                ? 'border-accent ring-2 ring-accent/20'
                                                : activeModeTab === 'dark' ? 'border-white/20 opacity-70 hover:opacity-100' : 'border-gray-300 opacity-70 hover:opacity-100'
                                                }`}
                                            title={bg.name}
                                        >
                                            <img src={bg.thumbnail} alt={bg.name} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                    <Video size={16} className="text-white ml-0.5" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                                                <span className="text-[10px] font-medium text-white/90 drop-shadow-md line-clamp-1">{bg.name}</span>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow-lg">
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
