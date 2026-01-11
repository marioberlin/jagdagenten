import { useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, Check, X, Sliders, Edit, Copy } from 'lucide-react';
import { GlassContainer } from '@/components';
import { Backgrounds } from '@/components/Backgrounds/BackgroundRegistry';
import type { ThemesSectionProps } from './types';

export const ThemesSection = ({
    builtInThemes,
    customThemes,
    activeThemeId,
    applyTheme,
    createTheme,
    updateTheme,
    deleteTheme,
    copyTheme,
    onNavigateToCustomization
}: ThemesSectionProps) => {
    const [isCreating, setIsCreating] = useState(false);
    const [tempThemeName, setTempThemeName] = useState('');
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    return (
        <>
            {/* Section Header */}
            <div className="sticky top-0 z-30 mb-8 p-4 rounded-3xl bg-glass-bg-thick/95 backdrop-blur-2xl shadow-lg border border-[var(--glass-border)] transition-all duration-300 flex items-center justify-between group hover:border-accent/20">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight px-2 text-label-glass-primary">Theme Management</h2>
                    <p className="text-xs text-label-glass-secondary px-2 mt-1 uppercase tracking-wider font-medium">Select, create, and manage your themes</p>
                </div>
                <div className="text-right px-4 border-l border-white/10 hidden sm:block">
                    <div className="text-[10px] text-label-glass-secondary uppercase tracking-widest font-bold mb-0.5">Current Theme</div>
                    <div className="text-sm font-bold text-accent">{[...builtInThemes, ...customThemes].find(t => t.id === activeThemeId)?.name || 'Default'}</div>
                </div>
            </div>

            <div className="space-y-8">
                {/* Built-in Themes */}
                <GlassContainer className="p-6 rounded-2xl" border>
                    <h3 className="text-lg font-semibold text-label-glass-primary mb-4">Built-in Themes</h3>
                    <p className="text-sm text-label-glass-secondary mb-6">Curated themes that work in both light and dark modes</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {builtInThemes.map((thm) => (
                            <div
                                key={thm.id}
                                className={`relative p-4 rounded-xl border transition-all ${activeThemeId === thm.id
                                    ? 'border-accent bg-accent/10'
                                    : 'border-[var(--glass-border)] bg-glass-surface'
                                    }`}
                            >
                                {/* Background Preview */}
                                <div className="mb-3 rounded-lg overflow-hidden h-16 bg-glass-surface-hover relative">
                                    {(() => {
                                        const bg = Backgrounds.find(b => b.id === thm.light.background.id);
                                        if (bg?.type === 'image' && bg.src) {
                                            return (
                                                <img
                                                    src={bg.src}
                                                    alt={bg.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            );
                                        } else if (bg?.type === 'element' && bg.component) {
                                            const BgComponent = bg.component;
                                            return (
                                                <div className="w-full h-full overflow-hidden pointer-events-none">
                                                    <BgComponent />
                                                </div>
                                            );
                                        }
                                        return (
                                            <div className="w-full h-full bg-gradient-to-br from-glass-surface to-glass-surface-hover flex items-center justify-center">
                                                <ImageIcon size={20} className="text-label-glass-tertiary" />
                                            </div>
                                        );
                                    })()}
                                </div>
                                <button
                                    onClick={() => applyTheme(thm.id)}
                                    className="w-full text-left mb-2"
                                >
                                    <div className="text-sm font-semibold text-primary">{thm.name}</div>
                                </button>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => copyTheme(thm.id, `${thm.name} Copy`)}
                                        className="flex-1 px-2 py-1 rounded bg-glass-surface hover:bg-glass-surface-hover text-primary text-xs flex items-center justify-center gap-1 transition-colors"
                                        title="Duplicate theme"
                                    >
                                        <Copy size={12} />
                                    </button>
                                </div>
                                {activeThemeId === thm.id && (
                                    <div className="absolute top-2 right-2">
                                        <Check size={16} className="text-accent" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </GlassContainer>

                {/* Custom Themes */}
                {customThemes.length > 0 && (
                    <GlassContainer className="p-6 rounded-2xl" border>
                        <div className="flex items-center justify-between mb-4 h-8">
                            <h3 className="text-lg font-semibold text-label-glass-primary">My Custom Themes</h3>
                            {isCreating ? (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={tempThemeName}
                                        onChange={(e) => setTempThemeName(e.target.value)}
                                        placeholder="Theme Name..."
                                        className="w-32 px-2 py-1 rounded-md bg-glass-surface-active border border-accent/30 text-xs text-primary focus:outline-none focus:border-accent"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && tempThemeName.trim()) {
                                                createTheme(tempThemeName.trim());
                                                setTempThemeName('');
                                                setIsCreating(false);
                                            } else if (e.key === 'Escape') {
                                                setIsCreating(false);
                                                setTempThemeName('');
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            if (tempThemeName.trim()) {
                                                createTheme(tempThemeName.trim());
                                                setTempThemeName('');
                                                setIsCreating(false);
                                            }
                                        }}
                                        disabled={!tempThemeName.trim()}
                                        className="p-1.5 rounded-lg bg-accent hover:bg-accent/80 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Check size={14} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsCreating(false);
                                            setTempThemeName('');
                                        }}
                                        className="p-1.5 rounded-lg bg-glass-surface hover:bg-glass-surface-hover text-secondary transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="px-3 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium transition-colors flex items-center gap-1.5"
                                >
                                    <Plus size={14} />
                                    New Theme
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {customThemes.map((thm) => (
                                <div
                                    key={thm.id}
                                    className={`relative p-4 rounded-xl border transition-all ${activeThemeId === thm.id
                                        ? 'border-accent bg-accent/10'
                                        : 'border-white/10 bg-glass-surface'
                                        }`}
                                >
                                    {/* Background Preview */}
                                    <div className="mb-3 rounded-lg overflow-hidden h-16 bg-glass-surface-hover relative">
                                        {(() => {
                                            const bg = Backgrounds.find(b => b.id === thm.light.background.id);
                                            if (bg?.type === 'image' && bg.src) {
                                                return (
                                                    <img
                                                        src={bg.src}
                                                        alt={bg.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                );
                                            } else if (bg?.type === 'element' && bg.component) {
                                                const BgComponent = bg.component;
                                                return (
                                                    <div className="w-full h-full overflow-hidden pointer-events-none">
                                                        <BgComponent />
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div className="w-full h-full bg-gradient-to-br from-glass-surface to-glass-surface-hover flex items-center justify-center">
                                                    <ImageIcon size={20} className="text-label-glass-tertiary" />
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Theme Name / Rename Input */}
                                    {renamingId === thm.id ? (
                                        <div className="flex items-center gap-1 mb-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={renameValue}
                                                onChange={(e) => setRenameValue(e.target.value)}
                                                className="flex-1 w-full px-2 py-1 rounded bg-glass-surface-active border border-accent/30 text-xs text-primary focus:outline-none focus:border-accent"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && renameValue.trim()) {
                                                        updateTheme(thm.id, { name: renameValue.trim() });
                                                        setRenamingId(null);
                                                    } else if (e.key === 'Escape') {
                                                        setRenamingId(null);
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={() => {
                                                    if (renameValue.trim()) {
                                                        updateTheme(thm.id, { name: renameValue.trim() });
                                                        setRenamingId(null);
                                                    }
                                                }}
                                                className="p-1 rounded bg-accent/20 hover:bg-accent/30 text-accent"
                                            >
                                                <Check size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => applyTheme(thm.id)}
                                            className="w-full text-left mb-2"
                                        >
                                            <div className="text-sm font-semibold text-primary truncate" title={thm.name}>{thm.name}</div>
                                        </button>
                                    )}

                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => {
                                                setRenamingId(thm.id);
                                                setRenameValue(thm.name);
                                            }}
                                            className="flex-1 px-2 py-1 rounded bg-glass-surface hover:bg-glass-surface-hover text-primary text-xs flex items-center justify-center gap-1 transition-colors"
                                            title="Rename theme"
                                        >
                                            <Edit size={12} />
                                        </button>
                                        <button
                                            onClick={() => copyTheme(thm.id, `${thm.name} Copy`)}
                                            className="flex-1 px-2 py-1 rounded bg-glass-surface hover:bg-glass-surface-hover text-primary text-xs flex items-center justify-center gap-1 transition-colors"
                                            title="Duplicate theme"
                                        >
                                            <Copy size={12} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this theme?')) {
                                                    deleteTheme(thm.id);
                                                }
                                            }}
                                            className="flex-1 px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs flex items-center justify-center gap-1 transition-colors"
                                            title="Delete theme"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    {activeThemeId === thm.id && (
                                        <div className="absolute top-2 right-2">
                                            <Check size={16} className="text-accent" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </GlassContainer>
                )}

                {/* Navigation Hint */}
                <GlassContainer className="p-6 rounded-2xl bg-accent/5 border-accent/20" border>
                    <div className="flex items-start gap-3">
                        <Sliders size={20} className="text-accent mt-0.5" />
                        <div>
                            <h3 className="text-sm font-semibold text-label-glass-primary mb-1">Customize Appearance</h3>
                            <p className="text-sm text-label-glass-secondary">
                                Go to <button onClick={onNavigateToCustomization} className="text-accent hover:underline">Customization</button> to adjust wallpaper, glass effects, and other appearance settings.
                            </p>
                        </div>
                    </div>
                </GlassContainer>
            </div>
        </>
    );
};
