import { Moon, Sun, Minimize2, Image as ImageIcon, Sparkles, Video, Lightbulb, Info, Droplets, Contrast, Grip, Type, Zap } from 'lucide-react';
import { GlassContainer } from '@/components';
import { GlassSlider } from '@/components';
import { GlassSwitch } from '@/components';
import { Backgrounds } from '@/components/Backgrounds/BackgroundRegistry';
import type { CustomizationSectionProps } from './types';

export const CustomizationSection = ({
    theme,
    toggleTheme,
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
    setPerformanceMode
}: CustomizationSectionProps) => {
    // Apple HIG recommended values helper component
    const AppleHint = ({ text }: { text: string }) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-500/10 text-blue-500 dark:bg-blue-400/15 dark:text-blue-400 ml-2">
            <Info size={10} />
            Apple HIG: {text}
        </span>
    );

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
                {/* Mode-Specific Settings */}
                <GlassContainer className="p-6 rounded-2xl" border>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-label-glass-primary mb-2">Mode-Specific Settings</h3>
                        <p className="text-sm text-label-glass-secondary">Configure glass appearance differently for light and dark modes</p>
                    </div>

                    {/* Mode Tabs */}
                    <div className="flex bg-glass-surface p-1 rounded-xl backdrop-blur-md mb-6">
                        <button
                            onClick={() => {
                                setActiveModeTab('light');
                                if (theme !== 'light') toggleTheme();
                            }}
                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeModeTab === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-label-glass-secondary hover:text-label-glass-primary hover:bg-glass-surface-hover'}`}
                        >
                            <Sun size={16} />
                            Light Mode
                        </button>
                        <button
                            onClick={() => {
                                setActiveModeTab('dark');
                                if (theme !== 'dark') toggleTheme();
                            }}
                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeModeTab === 'dark' ? 'bg-gray-900 text-white shadow-sm' : 'text-label-glass-secondary hover:text-label-glass-primary hover:bg-glass-surface-hover'}`}
                        >
                            <Moon size={16} />
                            Dark Mode
                        </button>
                    </div>

                    {/* Mode-specific content */}
                    <div className={`space-y-6 p-4 rounded-xl transition-colors ${activeModeTab === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
                        {/* Glass Intensity */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className={`text-md font-semibold ${activeModeTab === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        Glass Intensity
                                        <AppleHint text={activeModeTab === 'dark' ? '45-55%' : '70-80%'} />
                                    </h4>
                                    <p className={`text-sm mt-1 ${activeModeTab === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Control blur and opacity</p>
                                </div>
                                <span className={`text-2xl font-bold tabular-nums ${activeModeTab === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {activeModeTab === 'light' ? localLightMode.glassIntensity : localDarkMode.glassIntensity}%
                                </span>
                            </div>
                            <GlassSlider
                                value={activeModeTab === 'light' ? localLightMode.glassIntensity : localDarkMode.glassIntensity}
                                onValueChange={(val) => {
                                    if (activeModeTab === 'light') {
                                        setLocalLightMode(prev => ({ ...prev, glassIntensity: val }));
                                    } else {
                                        setLocalDarkMode(prev => ({ ...prev, glassIntensity: val }));
                                    }
                                }}
                                min={0}
                                max={100}
                                step={1}
                            />
                        </div>

                        {/* Background Overlay */}
                        <div className={`pt-6 border-t ${activeModeTab === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className={`text-md font-semibold ${activeModeTab === 'dark' ? 'text-white' : 'text-gray-900'}`}>Background Overlay</h4>
                                    <p className={`text-sm mt-1 ${activeModeTab === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Add a subtle scrim layer</p>
                                </div>
                                <GlassSwitch
                                    checked={activeModeTab === 'light' ? localLightMode.overlayEnabled : localDarkMode.overlayEnabled}
                                    onCheckedChange={(checked) => {
                                        if (activeModeTab === 'light') {
                                            setLocalLightMode(prev => ({ ...prev, overlayEnabled: checked }));
                                        } else {
                                            setLocalDarkMode(prev => ({ ...prev, overlayEnabled: checked }));
                                        }
                                    }}
                                />
                            </div>
                            {(activeModeTab === 'light' ? localLightMode.overlayEnabled : localDarkMode.overlayEnabled) && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-sm font-medium ${activeModeTab === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Intensity</span>
                                        <span className={`text-sm font-bold ${activeModeTab === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {activeModeTab === 'light' ? localLightMode.overlayIntensity : localDarkMode.overlayIntensity}%
                                        </span>
                                    </div>
                                    <GlassSlider
                                        value={activeModeTab === 'light' ? localLightMode.overlayIntensity : localDarkMode.overlayIntensity}
                                        onValueChange={(val) => {
                                            if (activeModeTab === 'light') {
                                                setLocalLightMode(prev => ({ ...prev, overlayIntensity: val }));
                                            } else {
                                                setLocalDarkMode(prev => ({ ...prev, overlayIntensity: val }));
                                            }
                                        }}
                                        min={0}
                                        max={100}
                                        step={5}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Glass Tint Color */}
                        <div className={`pt-6 border-t ${activeModeTab === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                            <h4 className={`text-md font-semibold mb-2 ${activeModeTab === 'dark' ? 'text-white' : 'text-gray-900'}`}>Glass Tint Color</h4>
                            <p className={`text-sm mb-4 ${activeModeTab === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Add a subtle color tint</p>
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
                                    const currentTint = activeModeTab === 'light' ? localLightMode.glassTintColor : localDarkMode.glassTintColor;
                                    return (
                                        <button
                                            key={t.label}
                                            onClick={() => {
                                                if (activeModeTab === 'light') {
                                                    setLocalLightMode(prev => ({ ...prev, glassTintColor: t.value }));
                                                } else {
                                                    setLocalDarkMode(prev => ({ ...prev, glassTintColor: t.value }));
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
                        <div className={`pt-6 border-t ${activeModeTab === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                            <h4 className={`text-md font-semibold mb-2 ${activeModeTab === 'dark' ? 'text-white' : 'text-gray-900'}`}>Accent Color</h4>
                            <p className={`text-sm mb-4 ${activeModeTab === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Primary color for interactive elements</p>
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
                                    const currentAccent = activeModeTab === 'light' ? localLightMode.accentColor : localDarkMode.accentColor;
                                    return (
                                        <button
                                            key={c.label}
                                            onClick={() => {
                                                if (activeModeTab === 'light') {
                                                    setLocalLightMode(prev => ({ ...prev, accentColor: c.value }));
                                                } else {
                                                    setLocalDarkMode(prev => ({ ...prev, accentColor: c.value }));
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

                        {/* Text Vibrancy */}
                        <div className={`pt-6 border-t ${activeModeTab === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className={`text-md font-semibold ${activeModeTab === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        Text Vibrancy
                                        <AppleHint text="60-70%" />
                                    </h4>
                                    <p className={`text-sm mt-1 ${activeModeTab === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Adjust secondary text contrast</p>
                                </div>
                                <span className={`text-2xl font-bold tabular-nums ${activeModeTab === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {activeModeTab === 'light' ? (localLightMode.textVibrancy ?? 50) : (localDarkMode.textVibrancy ?? 50)}%
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-medium ${activeModeTab === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Muted</span>
                                <div className="flex-1">
                                    <GlassSlider
                                        value={activeModeTab === 'light' ? (localLightMode.textVibrancy ?? 50) : (localDarkMode.textVibrancy ?? 50)}
                                        onValueChange={(val) => {
                                            if (activeModeTab === 'light') {
                                                setLocalLightMode(prev => ({ ...prev, textVibrancy: val }));
                                            } else {
                                                setLocalDarkMode(prev => ({ ...prev, textVibrancy: val }));
                                            }
                                        }}
                                        min={0}
                                        max={100}
                                        step={5}
                                    />
                                </div>
                                <span className={`text-xs font-medium ${activeModeTab === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Vibrant</span>
                            </div>
                        </div>

                        {/* Glass Material */}
                        <div className={`pt-6 border-t ${activeModeTab === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                            <div className="mb-4">
                                <h4 className={`text-md font-semibold ${activeModeTab === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Glass Material
                                    <AppleHint text="regular (16px blur)" />
                                </h4>
                                <p className={`text-sm mt-1 ${activeModeTab === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Default glass thickness for this mode</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {(['thin', 'regular', 'thick'] as const).map((material) => {
                                    const currentMaterial = activeModeTab === 'light'
                                        ? (localLightMode.glassMaterial ?? 'regular')
                                        : (localDarkMode.glassMaterial ?? 'regular');
                                    const isSelected = currentMaterial === material;
                                    return (
                                        <button
                                            key={material}
                                            onClick={() => {
                                                if (activeModeTab === 'light') {
                                                    setLocalLightMode(prev => ({ ...prev, glassMaterial: material }));
                                                } else {
                                                    setLocalDarkMode(prev => ({ ...prev, glassMaterial: material }));
                                                }
                                            }}
                                            className={`p-4 rounded-xl border-2 transition-all ${isSelected
                                                ? 'border-white ring-2 ring-white/30'
                                                : activeModeTab === 'dark' ? 'border-white/20 hover:border-white/40' : 'border-gray-300 hover:border-gray-400'
                                                } ${activeModeTab === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}
                                        >
                                            <span className={`text-sm font-medium capitalize ${activeModeTab === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {material}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Outline Opacity */}
                        <div className={`pt-6 border-t ${activeModeTab === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className={`text-md font-semibold ${activeModeTab === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        Outline Opacity
                                        <AppleHint text={activeModeTab === 'dark' ? '8-18%' : '10-15%'} />
                                    </h4>
                                    <p className={`text-sm mt-1 ${activeModeTab === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Glass border visibility</p>
                                </div>
                                <span className={`text-2xl font-bold tabular-nums ${activeModeTab === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {activeModeTab === 'light' ? (localLightMode.outlineOpacity ?? 30) : (localDarkMode.outlineOpacity ?? 30)}%
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-medium ${activeModeTab === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Hidden</span>
                                <div className="flex-1">
                                    <GlassSlider
                                        value={activeModeTab === 'light' ? (localLightMode.outlineOpacity ?? 30) : (localDarkMode.outlineOpacity ?? 30)}
                                        onValueChange={(val) => {
                                            if (activeModeTab === 'light') {
                                                setLocalLightMode(prev => ({ ...prev, outlineOpacity: val }));
                                            } else {
                                                setLocalDarkMode(prev => ({ ...prev, outlineOpacity: val }));
                                            }
                                        }}
                                        min={0}
                                        max={100}
                                        step={5}
                                    />
                                </div>
                                <span className={`text-xs font-medium ${activeModeTab === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Visible</span>
                            </div>
                        </div>

                        {/* Wallpaper for this mode */}
                        <div className={`pt-6 border-t ${activeModeTab === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                            <h4 className={`text-md font-semibold mb-2 ${activeModeTab === 'dark' ? 'text-white' : 'text-gray-900'}`}>Wallpaper</h4>
                            <p className={`text-sm mb-4 ${activeModeTab === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Background for {activeModeTab} mode</p>

                            {/* Elements Row */}
                            <div className="mb-6">
                                <div className={`flex items-center gap-2 mb-3 ${activeModeTab === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Sparkles size={14} />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Elements</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {Backgrounds.filter(bg => bg.type === 'element').map((bg) => {
                                        const currentBgId = activeModeTab === 'light' ? localLightMode.backgroundId : localDarkMode.backgroundId;
                                        const isSelected = currentBgId === bg.id;
                                        const BgComponent = bg.component;
                                        return (
                                            <button
                                                key={bg.id}
                                                onClick={() => {
                                                    if (activeModeTab === 'light') {
                                                        setLocalLightMode(prev => ({ ...prev, backgroundId: bg.id }));
                                                    } else {
                                                        setLocalDarkMode(prev => ({ ...prev, backgroundId: bg.id }));
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
                                <div className={`flex items-center gap-2 mb-3 ${activeModeTab === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <ImageIcon size={14} />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Images</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {Backgrounds.filter(bg => bg.type === 'image').map((bg) => {
                                        const currentBgId = activeModeTab === 'light' ? localLightMode.backgroundId : localDarkMode.backgroundId;
                                        const isSelected = currentBgId === bg.id;
                                        return (
                                            <button
                                                key={bg.id}
                                                onClick={() => {
                                                    if (activeModeTab === 'light') {
                                                        setLocalLightMode(prev => ({ ...prev, backgroundId: bg.id }));
                                                    } else {
                                                        setLocalDarkMode(prev => ({ ...prev, backgroundId: bg.id }));
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
                                <div className={`flex items-center gap-2 mb-3 ${activeModeTab === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Video size={14} />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Videos</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {Backgrounds.filter(bg => bg.type === 'video').map((bg) => {
                                        const currentBgId = activeModeTab === 'light' ? localLightMode.backgroundId : localDarkMode.backgroundId;
                                        const isSelected = currentBgId === bg.id;
                                        return (
                                            <button
                                                key={bg.id}
                                                onClick={() => {
                                                    if (activeModeTab === 'light') {
                                                        setLocalLightMode(prev => ({ ...prev, backgroundId: bg.id }));
                                                    } else {
                                                        setLocalDarkMode(prev => ({ ...prev, backgroundId: bg.id }));
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
                </GlassContainer>

                {/* Corner Radius */}
                <GlassContainer className="p-6 rounded-2xl" border>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-label-glass-primary inline-flex items-center">
                                Corner Radius
                                <AppleHint text="12-24px" />
                            </h3>
                            <p className="text-sm text-label-glass-secondary mt-1">Adjust roundness</p>
                        </div>
                        <span className="text-2xl font-bold text-label-glass-primary tabular-nums">{glassRadius}px</span>
                    </div>
                    <GlassSlider
                        value={glassRadius}
                        onValueChange={setGlassRadius}
                        min={0}
                        max={48}
                        step={2}
                    />
                </GlassContainer>

                {/* Shadow Strength */}
                <GlassContainer className="p-6 rounded-2xl" border>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-label-glass-primary inline-flex items-center">
                                Shadow Strength
                                <AppleHint text={theme === 'dark' ? '25-35%' : '8-12%'} />
                            </h3>
                            <p className="text-sm text-label-glass-secondary mt-1">Control depth</p>
                        </div>
                        <span className="text-2xl font-bold text-label-glass-primary tabular-nums">{shadowStrength}%</span>
                    </div>
                    <GlassSlider
                        value={shadowStrength}
                        onValueChange={setShadowStrength}
                        min={0}
                        max={100}
                        step={5}
                    />
                </GlassContainer>

                {/* Specular Highlights Toggle */}
                <GlassContainer className="p-6 rounded-2xl" border>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-accent-muted">
                                <Lightbulb size={18} className="text-accent" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-label-glass-primary">Specular Highlights</h3>
                                <p className="text-sm text-label-glass-secondary mt-0.5">Simulated light reflections (HIG)</p>
                            </div>
                        </div>
                        <GlassSwitch
                            checked={specularEnabled}
                            onCheckedChange={setSpecularEnabled}
                        />
                    </div>
                </GlassContainer>

                {/* Text Shadow Toggle */}
                <GlassContainer className="p-6 rounded-2xl" border>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-accent-muted">
                                <Type size={18} className="text-accent" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-label-glass-primary">Text Shadows</h3>
                                <p className="text-sm text-label-glass-secondary mt-0.5">Improve legibility on glass (Accessibility)</p>
                            </div>
                        </div>
                        <GlassSwitch
                            checked={textShadowEnabled}
                            onCheckedChange={setTextShadowEnabled}
                        />
                    </div>
                </GlassContainer>

                {/* Performance Mode Toggle */}
                <GlassContainer className="p-6 rounded-2xl" border>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-accent-muted">
                                <Zap size={18} className="text-accent" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-label-glass-primary">Performance Mode</h3>
                                <p className="text-sm text-label-glass-secondary mt-0.5">Reduce visual effects for smoother experience</p>
                            </div>
                        </div>
                        <GlassSwitch
                            checked={performanceMode}
                            onCheckedChange={setPerformanceMode}
                        />
                    </div>
                </GlassContainer>

                {/* Density */}
                <GlassContainer className="p-6 rounded-2xl" border>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-accent-muted">
                                <Minimize2 size={18} className="text-accent" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-label-glass-primary">Compact Mode</h3>
                                <p className="text-sm text-label-glass-secondary mt-0.5">Reduce spacing for density</p>
                            </div>
                        </div>
                        <GlassSwitch
                            checked={density === 'compact'}
                            onCheckedChange={(checked) => setDensity(checked ? 'compact' : 'comfortable')}
                        />
                    </div>
                </GlassContainer>

                {/* Blur Strength */}
                <GlassContainer className="p-6 rounded-2xl" border>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-accent-muted">
                                <Droplets size={18} className="text-accent" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-label-glass-primary inline-flex items-center">
                                    Blur Strength
                                    <AppleHint text="16-24px" />
                                </h3>
                                <p className="text-sm text-label-glass-secondary mt-0.5">Controls the backdrop blur radius for glass depth</p>
                            </div>
                        </div>
                        <span className="text-2xl font-bold text-label-glass-primary tabular-nums">{blurStrength}%</span>
                    </div>
                    <GlassSlider
                        value={blurStrength}
                        onValueChange={setBlurStrength}
                        min={0}
                        max={100}
                        step={5}
                    />
                </GlassContainer>

                {/* Saturation Boost */}
                <GlassContainer className="p-6 rounded-2xl" border>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-accent-muted">
                                <Contrast size={18} className="text-accent" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-label-glass-primary inline-flex items-center">
                                    Saturation Boost
                                    <AppleHint text="110-130%" />
                                </h3>
                                <p className="text-sm text-label-glass-secondary mt-0.5">Adds vibrancy to colors behind glass surfaces</p>
                            </div>
                        </div>
                        <span className="text-2xl font-bold text-label-glass-primary tabular-nums">{saturation}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-label-glass-tertiary">Muted</span>
                        <div className="flex-1">
                            <GlassSlider
                                value={saturation}
                                onValueChange={setSaturation}
                                min={0}
                                max={200}
                                step={5}
                            />
                        </div>
                        <span className="text-xs font-medium text-label-glass-tertiary">Vibrant</span>
                    </div>
                </GlassContainer>

                {/* Noise/Grain */}
                <GlassContainer className="p-6 rounded-2xl" border>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-accent-muted">
                                <Grip size={18} className="text-accent" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-label-glass-primary inline-flex items-center">
                                    Noise / Grain
                                    <AppleHint text="2-5%" />
                                </h3>
                                <p className="text-sm text-label-glass-secondary mt-0.5">Adds subtle texture like real frosted glass</p>
                            </div>
                        </div>
                        <span className="text-2xl font-bold text-label-glass-primary tabular-nums">{noiseOpacity}%</span>
                    </div>
                    <GlassSlider
                        value={noiseOpacity}
                        onValueChange={setNoiseOpacity}
                        min={0}
                        max={100}
                        step={1}
                    />
                </GlassContainer>
            </div >
        </>
    );
};
