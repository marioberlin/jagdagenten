import React, { useState } from 'react';
import { Layers, Type, Palette, BarChart3, Layout, Sparkles, Move, Check, X, Sun, Moon, Grid3X3, Eye } from 'lucide-react';
import { HIGTooltip } from '@/components';
import { useTheme } from '@/hooks/useTheme';

// Tab Bar Component
const TabBar = ({ activeTab, setActiveTab, tabs }: {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    tabs: Array<{ id: string; label: string; icon: React.ReactNode }>
}) => (
    <div className="relative">
        <div className="absolute inset-0 bg-glass-surface backdrop-blur-2xl rounded-2xl border border-[var(--glass-border)] shadow-lg" />
        <div className="relative flex gap-1 p-1.5 overflow-x-auto">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap
                        ${activeTab === tab.id
                            ? 'bg-glass-surface-elevated shadow-md text-accent'
                            : 'text-secondary hover:text-primary hover:bg-glass-surface-hover'}
                    `}
                >
                    {tab.icon}
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>
    </div>
);

// Liquid Glass Demo Component
const LiquidGlassDemo = () => {
    const { saturation } = useTheme();
    const [variant, setVariant] = useState('regular');
    const [isDark, setIsDark] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex gap-3">
                <button
                    onClick={() => setVariant('regular')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${variant === 'regular'
                        ? 'bg-accent text-white'
                        : 'bg-glass-surface text-secondary'
                        }`}
                >
                    Regular
                </button>
                <button
                    onClick={() => setVariant('clear')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${variant === 'clear'
                        ? 'bg-accent text-white'
                        : 'bg-glass-surface text-secondary'
                        }`}
                >
                    Clear
                </button>
                <button
                    onClick={() => setIsDark(!isDark)}
                    className="ml-auto p-2 rounded-xl bg-glass-surface text-secondary hover:text-primary"
                >
                    {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
            </div>

            <div className={`relative rounded-3xl overflow-hidden h-80 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                {/* Background gradient/image */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" />
                <img
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%238B5CF6'/%3E%3Cstop offset='50%25' style='stop-color:%23EC4899'/%3E%3Cstop offset='100%25' style='stop-color:%23F97316'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g1)' width='400' height='300'/%3E%3Ccircle cx='100' cy='80' r='60' fill='%23fff' opacity='0.2'/%3E%3Ccircle cx='300' cy='200' r='80' fill='%23fff' opacity='0.15'/%3E%3C/svg%3E"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Liquid Glass toolbar */}
                <div className="absolute top-4 left-4 right-4">
                    <div className={`
            ${variant === 'regular'
                            ? 'bg-white/60 dark:bg-black/40 backdrop-blur-xl'
                            : 'bg-white/30 dark:bg-black/20 backdrop-blur-lg'
                        }
            rounded-2xl p-3 flex items-center gap-3 border border-white/30 shadow-lg
          `}
                        style={{
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)'
                        }}>
                        <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            Liquid Glass Toolbar
                        </span>
                        <div className="ml-auto flex gap-2">
                            <div className={`w-8 h-8 rounded-xl ${variant === 'regular' ? 'bg-white/50' : 'bg-white/30'} flex items-center justify-center`}>
                                <Layout className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                            </div>
                            <div className={`w-8 h-8 rounded-xl ${variant === 'regular' ? 'bg-white/50' : 'bg-white/30'} flex items-center justify-center`}>
                                <Grid3X3 className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Liquid Glass tab bar */}
                <div className="absolute bottom-4 left-4 right-4">
                    <div className={`
            ${variant === 'regular'
                            ? 'bg-white/60 dark:bg-black/40 backdrop-blur-xl'
                            : 'bg-white/30 dark:bg-black/20 backdrop-blur-lg'
                        }
            rounded-2xl p-2 flex items-center justify-around border border-white/30 shadow-lg
          `}
                        style={{
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)'
                        }}>
                        {['Home', 'Search', 'Library', 'Profile'].map((item, i) => (
                            <div key={item} className="flex flex-col items-center gap-1 px-4 py-1">
                                <div className={`w-6 h-6 rounded-lg ${i === 0 ? 'text-accent' : isDark ? 'text-white/70' : 'text-gray-600'}`}>
                                    {i === 0 && <Layout className="w-6 h-6" />}
                                    {i === 1 && <Eye className="w-6 h-6" />}
                                    {i === 2 && <Layers className="w-6 h-6" />}
                                    {i === 3 && <div className="w-6 h-6 rounded-full bg-gray-400" />}
                                </div>
                                <span className={`text-xs ${i === 0 ? 'text-accent font-medium' : isDark ? 'text-white/70' : 'text-gray-600'}`}>
                                    {item}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-accent/10 rounded-2xl p-4">
                <h4 className="font-semibold text-primary mb-2">
                    {variant === 'regular' ? 'Regular Variant' : 'Clear Variant'}
                </h4>
                <p className="text-sm text-secondary mb-2">
                    {variant === 'regular'
                        ? 'Blurs (10-12px) and adjusts luminosity of background. Opacity: 0.3-0.5 (light) / 0.4-0.6 (dark). Use for text-heavy components like alerts, sidebars, and popovers.'
                        : 'Highly translucent (0.1-0.2 opacity) for prioritizing visibility of underlying content. Requires 35% dark dimming layer on bright backgrounds.'
                    }
                </p>
                <p className="text-xs text-accent font-mono">
                    background: {isDark ? 'rgba(0,0,0,var(--glass-opacity))' : 'rgba(255,255,255,var(--glass-opacity))'}
                </p>
                <p className="text-xs text-accent font-mono">
                    backdrop-filter: blur(var(--glass-blur-{variant})) saturate({(saturation / 100).toFixed(1)}x)
                </p>
                <p className="text-xs text-tertiary mt-2">
                    Apple Recommendation: blur(10px) saturate(180%)
                </p>
            </div>
        </div>
    );
};

// Material Thickness Demo - Updated with exact specs from Apple documentation
const MaterialThicknessDemo = () => {
    const materials = [
        { name: 'ultraThin', blurVar: 'var(--glass-blur-ultraThin)', desc: 'Apple spec: 2px • Maximum translucency' },
        { name: 'thin', blurVar: 'var(--glass-blur-thin)', desc: 'Apple spec: 6px • Light context blur' },
        { name: 'regular', blurVar: 'var(--glass-blur-regular)', desc: 'Apple spec: 10px • Default balance' },
        { name: 'thick', blurVar: 'var(--glass-blur-thick)', desc: 'Apple spec: 18px • High contrast' },
        { name: 'ultraThick', blurVar: 'var(--glass-blur-ultraThick)', desc: 'Apple spec: 28px • Maximum blur' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {materials.map(m => (
                    <div key={m.name} className="flex flex-col gap-2">
                        {/* Glass material demo - pure visual */}
                        <div
                            className="h-16 rounded-xl border border-[var(--glass-border)] shadow-sm flex items-center px-4 mb-3"
                            style={{
                                background: 'var(--glass-bg-regular)',
                                backdropFilter: m.blurVar,
                                WebkitBackdropFilter: m.blurVar
                            }}
                        >
                            <span className="font-mono text-sm">blur: {m.blurVar}</span>
                        </div>
                        {/* Text label below */}
                        <div className="text-center">
                            <code className="text-sm font-mono font-semibold text-primary">
                                {m.name}
                            </code>
                            <p className="text-xs text-secondary mt-0.5">{m.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Opacity Specs Table */}
            <div className="bg-glass-surface rounded-2xl p-4">
                <h4 className="font-semibold mb-3 text-primary">Opacity by Mode</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div className="text-center p-2 bg-glass-surface-elevated rounded-xl">
                        <p className="text-tertiary text-xs mb-1">Light Mode</p>
                        <p className="font-mono font-semibold text-primary">0.3 - 0.5</p>
                    </div>
                    <div className="text-center p-2 bg-glass-surface-elevated rounded-xl">
                        <p className="text-tertiary text-xs mb-1">Dark Mode</p>
                        <p className="font-mono font-semibold text-primary">0.4 - 0.6</p>
                    </div>
                    <div className="text-center p-2 bg-glass-surface-elevated rounded-xl">
                        <p className="text-tertiary text-xs mb-1">Clear Look</p>
                        <p className="font-mono font-semibold text-primary">0.1 - 0.2</p>
                    </div>
                    <div className="text-center p-2 bg-glass-surface-elevated rounded-xl">
                        <p className="text-tertiary text-xs mb-1">Borders</p>
                        <p className="font-mono font-semibold text-primary">0.1 - 0.2</p>
                    </div>
                    <div className="text-center p-2 bg-glass-surface-elevated rounded-xl">
                        <p className="text-tertiary text-xs mb-1">Shadows</p>
                        <p className="font-mono font-semibold text-primary">0.1 - 0.4</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Lucide Icons Demo (replaced SF Symbols)
const LucideIconsDemo = () => {
    const [renderMode, setRenderMode] = useState('monochrome');

    const icons = [
        { name: 'CloudSun', Icon: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 2v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="M20 12h2" /><path d="m19.07 4.93-1.41 1.41" /><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" /><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" /></svg> },
        { name: 'Bell', Icon: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg> },
        { name: 'Phone', Icon: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg> },
        { name: 'Music', Icon: (props: any) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg> },
    ];

    const getIconColor = (mode: string) => {
        switch (mode) {
            case 'monochrome': return 'text-blue-500';
            case 'hierarchical': return 'text-blue-500/80';
            case 'palette': return 'text-purple-500';
            case 'multicolor': return 'text-primary';
            default: return 'text-primary';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
                {['monochrome', 'hierarchical', 'palette', 'multicolor'].map(mode => (
                    <button
                        key={mode}
                        onClick={() => setRenderMode(mode)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${renderMode === mode
                            ? 'bg-accent text-white'
                            : 'bg-glass-surface text-secondary'
                            }`}
                    >
                        {mode}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {icons.map((icon) => (
                    <div key={icon.name} className="bg-glass-surface rounded-2xl p-6 flex flex-col items-center gap-3">
                        <icon.Icon
                            className={`w-12 h-12 ${getIconColor(renderMode)}`}
                            style={{ opacity: renderMode === 'hierarchical' ? 0.9 : 1 }}
                        />
                        <code className="text-xs font-mono text-tertiary text-center">
                            {icon.name}
                        </code>
                    </div>
                ))}
            </div>

            <div className="bg-glass-surface rounded-2xl p-4">
                <h4 className="font-semibold mb-2 text-primary">Rendering Mode: {renderMode}</h4>
                <p className="text-sm text-secondary">
                    {renderMode === 'monochrome' && 'Single color applied to all icon paths. Best for simple, consistent iconography.'}
                    {renderMode === 'hierarchical' && 'Different opacities of one color create visual depth and hierarchy.'}
                    {renderMode === 'palette' && 'Custom colors applied with full control over appearance.'}
                    {renderMode === 'multicolor' && 'Icons render with theme-aware colors. Adapts to light/dark mode.'}
                </p>
                <p className="text-xs text-tertiary mt-2">
                    Using lucide-react icons (260+ icons available)
                </p>
            </div>
        </div>
    );
};

// Typography Demo
const TypographyDemo = () => {
    const textStyles = [
        { name: 'Large Title', size: '34px', weight: '700', leading: '41px' },
        { name: 'Title 1', size: '28px', weight: '700', leading: '34px' },
        { name: 'Title 2', size: '22px', weight: '700', leading: '28px' },
        { name: 'Title 3', size: '20px', weight: '600', leading: '25px' },
        { name: 'Headline', size: '17px', weight: '600', leading: '22px' },
        { name: 'Body', size: '17px', weight: '400', leading: '22px' },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-glass-surface rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <h4 className="text-lg font-semibold text-primary">San Francisco Pro</h4>
                    <HIGTooltip topic="typography" side="right" />
                </div>
                <div className="space-y-4">
                    {textStyles.map(style => (
                        <div key={style.name} className="flex items-baseline gap-4 pb-3 border-b border-[var(--glass-border)]">
                            <span
                                style={{
                                    fontSize: style.size,
                                    fontWeight: style.weight,
                                    lineHeight: style.leading
                                }}
                                className="min-w-[200px] text-primary"
                            >
                                {style.name}
                            </span>
                            <span className="text-xs text-tertiary font-mono">
                                {style.size} / {style.weight}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-500/10 rounded-2xl p-4">
                    <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                        <Check className="w-5 h-5" /> Do
                    </h4>
                    <ul className="text-sm text-secondary space-y-2">
                        <li>• Use built-in text styles for consistency</li>
                        <li>• Support Dynamic Type for accessibility</li>
                        <li>• Maintain visual hierarchy at all sizes</li>
                        <li>• Use SF Pro for UI, New York for reading</li>
                    </ul>
                </div>
                <div className="bg-red-500/10 rounded-2xl p-4">
                    <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                        <X className="w-5 h-5" /> Don't
                    </h4>
                    <ul className="text-sm text-secondary space-y-2">
                        <li>• Mix too many typefaces</li>
                        <li>• Truncate text excessively at large sizes</li>
                        <li>• Use font sizes below 11pt</li>
                        <li>• Use regular weight on glass surfaces</li>
                    </ul>
                </div>
            </div>

            {/* Typography on Glass */}
            <div className="bg-purple-500/10 rounded-2xl p-4">
                <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-3">Typography on Glass Surfaces</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-secondary">
                    <div className="bg-glass-surface rounded-xl p-3">
                        <p className="font-medium mb-1 text-primary">Font Weight</p>
                        <p className="text-xs">Medium (500) not regular</p>
                    </div>
                    <div className="bg-glass-surface rounded-xl p-3">
                        <p className="font-medium mb-1 text-primary">Text Shadows</p>
                        <p className="text-xs">1-2px blur for definition</p>
                    </div>
                    <div className="bg-glass-surface rounded-xl p-3">
                        <p className="font-medium mb-1 text-primary">Line Height</p>
                        <p className="text-xs">Increase by 10-15%</p>
                    </div>
                    <div className="bg-glass-surface rounded-xl p-3">
                        <p className="font-medium mb-1 text-primary">Vibrancy</p>
                        <p className="text-xs">Primary → Secondary → Tertiary</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Color System Demo
const ColorSystemDemo = () => {
    const systemColors = [
        { name: 'Blue', light: '#007AFF', dark: '#0A84FF', semantic: 'Links, buttons, accents' },
        { name: 'Green', light: '#34C759', dark: '#30D158', semantic: 'Success, positive actions' },
        { name: 'Red', light: '#FF3B30', dark: '#FF453A', semantic: 'Errors, destructive actions' },
        { name: 'Orange', light: '#FF9500', dark: '#FF9F0A', semantic: 'Warnings, attention' },
        { name: 'Yellow', light: '#FFCC00', dark: '#FFD60A', semantic: 'Highlights, starred items' },
        { name: 'Teal', light: '#5AC8FA', dark: '#64D2FF', semantic: 'Water, health data' },
        { name: 'Purple', light: '#AF52DE', dark: '#BF5AF2', semantic: 'Creativity, podcasts' },
        { name: 'Pink', light: '#FF2D55', dark: '#FF375F', semantic: 'Love, music' },
    ];

    const [mode, setMode] = useState('light');

    return (
        <div className="space-y-6">
            <div className="flex gap-3">
                <button
                    onClick={() => setMode('light')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${mode === 'light' ? 'bg-accent text-white' : 'bg-glass-surface text-secondary'
                        }`}
                >
                    <Sun className="w-4 h-4" /> Light
                </button>
                <button
                    onClick={() => setMode('dark')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${mode === 'dark' ? 'bg-accent text-white' : 'bg-glass-surface text-secondary'
                        }`}
                >
                    <Moon className="w-4 h-4" /> Dark
                </button>
            </div>

            <div className={`rounded-2xl p-6 ${mode === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {systemColors.map(color => (
                        <div key={color.name} className="space-y-2">
                            <div
                                className="h-16 rounded-xl shadow-sm"
                                style={{ backgroundColor: mode === 'dark' ? color.dark : color.light }}
                            />
                            <p className={`text-sm font-medium ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {color.name}
                            </p>
                            <p className={`text-xs ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {color.semantic}
                            </p>
                            <code className={`text-xs font-mono ${mode === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                {mode === 'dark' ? color.dark : color.light}
                            </code>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-amber-500/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-amber-600 dark:text-amber-400">
                        Liquid Glass Color Tips
                    </h4>
                    <HIGTooltip topic="color" side="right" />
                </div>
                <ul className="text-sm text-secondary space-y-1">
                    <li>• By default, Liquid Glass takes color from content behind it</li>
                    <li>• Apply tint for emphasis (like primary action buttons)</li>
                    <li>• Use 35% opacity dimming layer behind clear Liquid Glass on bright backgrounds</li>
                    <li>• System adapts between light/dark based on underlying content</li>
                </ul>
            </div>
        </div>
    );
};

// Charts Demo
const ChartsDemo = () => {
    const barData = [65, 85, 45, 90, 70, 55, 80];
    const lineData = [30, 45, 35, 60, 55, 70, 65, 80, 75, 90];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="bg-glass-surface rounded-2xl p-6 shadow-sm">
                    <h4 className="text-lg font-semibold mb-1 text-primary">Weekly Activity</h4>
                    <p className="text-sm text-tertiary mb-4">Move minutes per day</p>
                    <div className="flex items-end gap-2 h-32">
                        {barData.map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                    className="w-full bg-gradient-to-t from-red-500 to-orange-400 rounded-lg transition-all duration-500"
                                    style={{ height: `${val}%` }}
                                />
                                <span className="text-xs text-tertiary">
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Line Chart */}
                <div className="bg-glass-surface rounded-2xl p-6 shadow-sm">
                    <h4 className="text-lg font-semibold mb-1 text-primary">Stock Performance</h4>
                    <p className="text-sm text-green-500 mb-4">+12.5% this month</p>
                    <svg viewBox="0 0 200 80" className="w-full h-32">
                        <defs>
                            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22C55E" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path
                            d={`M0,${80 - lineData[0] * 0.8} ${lineData.map((d, i) => `L${i * 22},${80 - d * 0.8}`).join(' ')} L198,80 L0,80 Z`}
                            fill="url(#lineGrad)"
                        />
                        <path
                            d={`M0,${80 - lineData[0] * 0.8} ${lineData.map((d, i) => `L${i * 22},${80 - d * 0.8}`).join(' ')}`}
                            fill="none"
                            stroke="#22C55E"
                            strokeWidth="2"
                        />
                    </svg>
                </div>
            </div>

            <div className="bg-glass-surface rounded-2xl p-4">
                <h4 className="font-semibold mb-3 text-primary">Chart Best Practices</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="font-medium text-accent mb-1">Design</p>
                        <ul className="text-secondary space-y-1">
                            <li>• Keep charts simple and focused</li>
                            <li>• Use familiar chart types (bar, line)</li>
                            <li>• Match size to functionality level</li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-medium text-accent mb-1">Accessibility</p>
                        <ul className="text-secondary space-y-1">
                            <li>• Provide accessibility labels</li>
                            <li>• Add descriptive text/headlines</li>
                            <li>• Don't rely solely on color</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Layout Principles
const LayoutDemo = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-glass-surface rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[var(--glass-border)]">
                    <h4 className="font-semibold text-primary">Visual Hierarchy</h4>
                </div>
                <div className="p-4 space-y-3">
                    <div className="bg-accent text-white p-4 rounded-xl">
                        Primary Content (Most Important)
                    </div>
                    <div className="bg-glass-surface-elevated p-3 rounded-xl text-sm text-secondary">
                        Secondary Content
                    </div>
                    <div className="bg-glass-surface p-2 rounded-lg text-xs text-tertiary">
                        Tertiary Information
                    </div>
                </div>
            </div>

            <div className="bg-glass-surface rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[var(--glass-border)]">
                    <h4 className="font-semibold text-primary">Control vs Content Layer</h4>
                </div>
                <div className="relative h-48 bg-gradient-to-br from-purple-400 to-pink-500 m-4 rounded-xl overflow-hidden">
                    <div className="absolute top-2 left-2 right-2 bg-white/50 backdrop-blur-xl rounded-xl p-2 text-xs text-center text-gray-800">
                        Liquid Glass Control Layer
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center text-white font-medium">
                        Content Layer
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 bg-white/50 backdrop-blur-xl rounded-xl p-2 text-xs flex justify-around text-gray-800">
                        <span>Tab 1</span>
                        <span className="text-blue-600 font-medium">Tab 2</span>
                        <span>Tab 3</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-glass-surface rounded-2xl p-6 shadow-sm">
            <h4 className="font-semibold mb-4 text-primary">Spacing & Safe Areas</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                    <div className="bg-accent/10 rounded-xl p-4 mb-2">
                        <div className="text-2xl font-bold text-accent">16pt</div>
                    </div>
                    <p className="text-secondary">Minimum tap target</p>
                </div>
                <div className="text-center">
                    <div className="bg-green-500/10 rounded-xl p-4 mb-2">
                        <div className="text-2xl font-bold text-green-500">44pt</div>
                    </div>
                    <p className="text-secondary">Recommended touch</p>
                </div>
                <div className="text-center">
                    <div className="bg-purple-500/10 rounded-xl p-4 mb-2">
                        <div className="text-2xl font-bold text-purple-500">60pt</div>
                    </div>
                    <p className="text-secondary">visionOS spacing</p>
                </div>
            </div>
        </div>
    </div>
);

// Motion & Animation
const MotionDemo = () => {
    const [playing, setPlaying] = useState<string | null>(null);

    const animations = [
        { id: 'bounce', name: 'Bounce', desc: 'Elastic scale up/down' },
        { id: 'pulse', name: 'Pulse', desc: 'Opacity variation over time' },
        { id: 'scale', name: 'Scale', desc: 'Increase/decrease size' },
        { id: 'wiggle', name: 'Wiggle', desc: 'Back and forth movement' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {animations.map(anim => (
                    <button
                        key={anim.id}
                        onClick={() => setPlaying(playing === anim.id ? null : anim.id)}
                        className="bg-glass-surface rounded-2xl p-6 shadow-sm text-center hover:shadow-md transition-shadow"
                    >
                        <div
                            className={`w-12 h-12 mx-auto mb-3 bg-accent rounded-xl flex items-center justify-center`}
                            style={{
                                animation: playing === anim.id ?
                                    anim.id === 'bounce' ? 'designGuideBounce 0.5s ease-in-out infinite' :
                                        anim.id === 'pulse' ? 'designGuidePulse 1s ease-in-out infinite' :
                                            anim.id === 'scale' ? 'designGuideScale 0.8s ease-in-out infinite' :
                                                anim.id === 'wiggle' ? 'designGuideWiggle 0.5s ease-in-out infinite' :
                                                    'none' : 'none'
                            }}
                        >
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <p className="font-medium text-sm text-primary">{anim.name}</p>
                        <p className="text-xs text-tertiary">{anim.desc}</p>
                    </button>
                ))}
            </div>

            <style>{`
        @keyframes designGuideBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes designGuidePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes designGuideScale {
          0%, 100% { transform: scale(0.9); }
          50% { transform: scale(1.1); }
        }
        @keyframes designGuideWiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
      `}</style>

            <div className="bg-amber-500/10 rounded-2xl p-4">
                <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-2">
                    Animation Timing Specifications
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="bg-glass-surface rounded-xl p-3">
                        <p className="text-xs text-tertiary mb-1">Default Easing</p>
                        <code className="text-xs font-mono text-primary">cubic-bezier(0.42, 0.0, 0.58, 1.0)</code>
                    </div>
                    <div className="bg-glass-surface rounded-xl p-3">
                        <p className="text-xs text-tertiary mb-1">State Changes</p>
                        <code className="text-xs font-mono text-primary">0.3 - 0.5 seconds</code>
                    </div>
                    <div className="bg-glass-surface rounded-xl p-3">
                        <p className="text-xs text-tertiary mb-1">Materialization</p>
                        <code className="text-xs font-mono text-primary">Spring animations</code>
                    </div>
                    <div className="bg-glass-surface rounded-xl p-3">
                        <p className="text-xs text-tertiary mb-1">Touch Response</p>
                        <code className="text-xs font-mono text-primary">Instant flex + light spread</code>
                    </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-amber-600 dark:text-amber-400">
                        Motion Guidelines
                    </h4>
                    <HIGTooltip topic="motion" side="right" />
                </div>
                <ul className="text-sm text-secondary space-y-1">
                    <li>• Add motion purposefully, not gratuitously</li>
                    <li>• Make motion optional (respect Reduce Motion setting)</li>
                    <li>• Keep feedback animations brief and precise</li>
                    <li>• Avoid fast-moving/blinking animations that may cause discomfort</li>
                    <li>• Let users cancel or skip animations</li>
                </ul>
            </div>
        </div>
    );
};

// Best Practices Section - Enhanced with PDF specifications
const BestPracticesSection = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-500/10 rounded-2xl p-5">
                <h4 className="font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                    <Check className="w-5 h-5" /> Liquid Glass Do's
                </h4>
                <ul className="text-sm text-secondary space-y-2">
                    <li>• Use for controls, navigation, and floating widgets</li>
                    <li>• Let system components adopt Liquid Glass automatically</li>
                    <li>• Use regular variant for text-heavy components</li>
                    <li>• Use clear variant over rich media backgrounds</li>
                    <li>• Apply vibrant colors for text on top of materials</li>
                    <li>• Add 35% dimming layer for clear variant on bright content</li>
                    <li>• Use GPU acceleration (transform: translateZ(0))</li>
                    <li>• Respect prefers-reduced-transparency preference</li>
                </ul>
            </div>

            <div className="bg-red-500/10 rounded-2xl p-5">
                <h4 className="font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                    <X className="w-5 h-5" /> Liquid Glass Don'ts
                </h4>
                <ul className="text-sm text-secondary space-y-2">
                    <li>• Don't use in the content layer</li>
                    <li>• Don't apply to scrollable content areas</li>
                    <li>• Don't stack multiple glass layers</li>
                    <li>• Don't use for text-heavy interfaces or data tables</li>
                    <li>• Don't overuse on multiple custom controls</li>
                    <li>• Don't use non-vibrant colors (low contrast)</li>
                    <li>• Don't overuse will-change (causes memory issues)</li>
                    <li>• Don't skip accessibility fallbacks</li>
                </ul>
            </div>
        </div>

        {/* HIG Compliance Alert */}
        <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/30">
            <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                ⚠️ HIG Compliance
            </h4>
            <p className="text-sm text-secondary">
                <strong>Legibility</strong> is the primary concern. When using Liquid Glass content backgrounds,
                you strictly follow the "Content Layer" rule: use opaque backgrounds for dense reading,
                and reserve glass for transient controls.
            </p>
        </div>

        <div className="bg-glass-surface rounded-2xl p-5 shadow-sm">
            <h4 className="font-semibold mb-4 text-primary">Web Implementation</h4>
            <div className="space-y-4">
                <div>
                    <h5 className="text-sm font-medium text-accent mb-2">Core CSS (with Apple's exact easing)</h5>
                    <pre className="bg-gray-900 text-gray-100 rounded-xl p-3 text-xs overflow-x-auto">
                        {`.liquid-glass-regular {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1),
    inset 0 1px 0 rgba(255,255,255,0.4);
  transition: all 0.4s cubic-bezier(0.42, 0.0, 0.58, 1.0);
}

.liquid-glass-clear {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px) saturate(180%);
}

/* Performance */
.glass-element {
  transform: translateZ(0);
  isolation: isolate;
}`}
                    </pre>
                </div>
                <div>
                    <h5 className="text-sm font-medium text-accent mb-2">Accessibility & Fallbacks</h5>
                    <pre className="bg-gray-900 text-gray-100 rounded-xl p-3 text-xs overflow-x-auto">
                        {`/* Fallback for unsupported browsers */
@supports not (backdrop-filter: blur(10px)) {
  .liquid-glass { background: rgba(255,255,255,0.85); }
}

/* Respect reduced transparency */
@media (prefers-reduced-transparency: reduce) {
  .liquid-glass {
    background: rgba(255,255,255,0.95);
    backdrop-filter: none;
  }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .glass-element { transition: none; }
}

/* Mobile: reduce blur for performance */
@media (max-width: 768px) {
  .liquid-glass { backdrop-filter: blur(5px); }
}`}
                    </pre>
                </div>
                <div>
                    <h5 className="text-sm font-medium text-accent mb-2">Typography on Glass</h5>
                    <ul className="text-sm text-secondary space-y-1">
                        <li>• <strong>Font weight:</strong> Use medium (500) instead of regular (400)</li>
                        <li>• <strong>Text shadows:</strong> 1-2px blur for definition</li>
                        <li>• <strong>Line height:</strong> Increase by 10-15% for readability</li>
                        <li>• <strong>Vibrancy:</strong> Primary, secondary, tertiary levels</li>
                        <li>• <strong>Contrast:</strong> 4.5:1 minimum (7:1 recommended)</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

// Main Component
export default function DesignGuide() {
    const [activeTab, setActiveTab] = useState('glass');

    const tabs = [
        { id: 'glass', label: 'Liquid Glass', icon: <Layers className="w-4 h-4" /> },
        { id: 'color', label: 'Color', icon: <Palette className="w-4 h-4" /> },
        { id: 'type', label: 'Typography', icon: <Type className="w-4 h-4" /> },
        { id: 'icons', label: 'SF Symbols', icon: <Sparkles className="w-4 h-4" /> },
        { id: 'charts', label: 'Charts', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'layout', label: 'Layout', icon: <Layout className="w-4 h-4" /> },
        { id: 'motion', label: 'Motion', icon: <Move className="w-4 h-4" /> },
        { id: 'best', label: 'Best Practices', icon: <Check className="w-4 h-4" /> },
    ];

    return (
        <div className="min-h-screen text-primary transition-colors duration-300 relative z-10">
            {/* Header */}
            <div className="sticky top-16 z-40 backdrop-blur-xl bg-glass-surface/80 border-b border-[var(--glass-border)]">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Apple Design Guidelines</h1>
                                <p className="text-sm text-secondary">Modern UI Patterns for Web Apps</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto -mx-4 px-4">
                        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {activeTab === 'glass' && (
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h2 className="text-2xl font-bold">Liquid Glass</h2>
                                <HIGTooltip topic="materials" side="right" />
                            </div>
                            <p className="text-secondary mb-6">
                                A dynamic material that forms a distinct functional layer for controls and navigation,
                                floating above content while maintaining legibility and creating visual depth.
                            </p>
                        </div>
                        <LiquidGlassDemo />
                        <div>
                            <h3 className="text-xl font-semibold mb-4">Standard Material Thicknesses</h3>
                            <MaterialThicknessDemo />
                        </div>
                    </div>
                )}

                {activeTab === 'color' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Color System</h2>
                            <p className="text-secondary mb-6">
                                Apple's dynamic system colors adapt automatically to light and dark modes,
                                ensuring consistent appearance and accessibility across all contexts.
                            </p>
                        </div>
                        <ColorSystemDemo />
                    </div>
                )}

                {activeTab === 'type' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Typography</h2>
                            <p className="text-secondary mb-6">
                                San Francisco and New York typeface families with Dynamic Type support
                                for legible, accessible text at any size.
                            </p>
                        </div>
                        <TypographyDemo />
                    </div>
                )}

                {activeTab === 'icons' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Lucide Icons</h2>
                            <p className="text-secondary mb-6">
                                260+ consistent, highly configurable SVG icons that integrate seamlessly
                                with any font in all weights and sizes.
                            </p>
                        </div>
                        <LucideIconsDemo />
                    </div>
                )}

                {activeTab === 'charts' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Charting Data</h2>
                            <p className="text-secondary mb-6">
                                Effective charts communicate information with clarity while maintaining
                                visual appeal and accessibility.
                            </p>
                        </div>
                        <ChartsDemo />
                    </div>
                )}

                {activeTab === 'layout' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Layout Principles</h2>
                            <p className="text-secondary mb-6">
                                Create visual hierarchies that guide users through content while
                                separating controls from content layers.
                            </p>
                        </div>
                        <LayoutDemo />
                    </div>
                )}

                {activeTab === 'motion' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Motion & Animation</h2>
                            <p className="text-secondary mb-6">
                                Purposeful animations that provide feedback, convey status, and enrich
                                the visual experience without overwhelming users.
                            </p>
                        </div>
                        <MotionDemo />
                    </div>
                )}

                {activeTab === 'best' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Best Practices</h2>
                            <p className="text-secondary mb-6">
                                Key guidelines and implementation tips for bringing Apple's design
                                language to web applications.
                            </p>
                        </div>
                        <BestPracticesSection />
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--glass-border)] mt-12">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <p className="text-sm text-tertiary text-center">
                        Based on Apple Human Interface Guidelines • For educational purposes
                    </p>
                </div>
            </div>
        </div>
    );
}
