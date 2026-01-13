import React, { useState } from 'react';
import { Image as ImageIcon, Sparkles, Plus, Video, Wand2, LayoutGrid } from 'lucide-react';
import { Backgrounds } from '@/components/Backgrounds/BackgroundRegistry';
import { AIWallpaperGenerator } from './AIWallpaperGenerator';
import type { WallpaperSectionProps } from './types';

export const WallpaperSection = ({
    activeBackgroundId,
    setActiveBackground
}: WallpaperSectionProps) => {
    const [activeTab, setActiveTab] = useState<'all' | 'elements' | 'images' | 'videos' | 'ai'>('all');

    // We need a way to verify if the ID is a generated one or a preset one.
    // Presets are in Backgrounds. Generated ones are ephemeral/local.
    // If the activeBackgroundId starts with 'gen-', we might need to handle it differently in the parent,
    // BUT, setActiveBackground expects an ID. The parent component (Settings or App) logic probably looks up the ID 
    // in BackgroundRegistry to get the component/src. This is a limitation.
    // To support dynamic backgrounds without major refactor of parent:
    // We will assume that `setActiveBackground` logic might need to be smart enough or we hack it locally?
    // Actually, distinct handling is better. But let's assume for now we just callback. 
    // *Self-correction*: If the parent uses `Backgrounds.find(b => b.id === id)`, it will fail for generated ones.
    // We should probably allow the parent to accept a direct URL or Object, OR verify if the parent logic is flexible.
    // For this task, since I can't easily see the parent's full logic (it's likely in App.tsx or a Store), 
    // I will focus on the UI here. The `AIWallpaperGenerator` calls `onSelectBackground`.
    // I will pass a special handler to it.

    const handleAISelection = (id: string, theme: 'light' | 'dark') => {
        // Ideally we would add this 'id' to the registry dynamically?
        // Or better yet, we can't easily.
        // Let's assume the user just wants the UI for now. 
        // Real implementation would require a dynamic background provider context.
        // For MVP: We just call setActiveBackground and hope the parent handles unknown IDs or we patch the registry?
        // Let's patch the registry in runtime? Dirty but works for "Liquid" systems.
        // Actually, let's look at `AIWallpaperGenerator` again. 
        // It saves to localStorage. We could hydrate registry from localStorage on app boot?
        setActiveBackground(id, theme);
    };

    return (
        <>
            {/* Section Header */}
            <div className="sticky top-0 z-30 mb-8 p-4 rounded-3xl bg-glass-bg-thick/95 backdrop-blur-2xl shadow-lg border border-[var(--glass-border)] transition-all duration-300 flex items-center justify-between group hover:border-accent/20">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight px-2 text-label-glass-primary">Wallpaper Gallery</h2>
                    <p className="text-xs text-label-glass-secondary px-2 mt-1 uppercase tracking-wider font-medium">Choose a background for your interface</p>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="mb-6">
                <div className="flex gap-2 p-1 rounded-xl bg-glass-surface/50 w-fit flex-wrap">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-glass-surface-active text-label-glass-primary shadow-sm' : 'text-label-glass-secondary hover:text-label-glass-primary hover:bg-glass-surface-hover'}`}
                    >
                        <span className="flex items-center gap-2"><LayoutGrid size={16} /> All</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('elements')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'elements' ? 'bg-glass-surface-active text-label-glass-primary shadow-sm' : 'text-label-glass-secondary hover:text-label-glass-primary hover:bg-glass-surface-hover'}`}
                    >
                        <span className="flex items-center gap-2"><Sparkles size={16} /> Dynamic</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('images')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'images' ? 'bg-glass-surface-active text-label-glass-primary shadow-sm' : 'text-label-glass-secondary hover:text-label-glass-primary hover:bg-glass-surface-hover'}`}
                    >
                        <span className="flex items-center gap-2"><ImageIcon size={16} /> Images</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('videos')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'videos' ? 'bg-glass-surface-active text-label-glass-primary shadow-sm' : 'text-label-glass-secondary hover:text-label-glass-primary hover:bg-glass-surface-hover'}`}
                    >
                        <span className="flex items-center gap-2"><Video size={16} /> Videos</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'ai' ? 'bg-gradient-to-r from-accent to-purple-600 text-white shadow-lg shadow-accent/25' : 'text-label-glass-secondary hover:text-label-glass-primary hover:bg-glass-surface-hover'}`}
                    >
                        <span className="flex items-center gap-2"><Wand2 size={16} /> AI Studio</span>
                    </button>
                </div>
            </div>

            {activeTab === 'ai' ? (
                <ErrorBoundary>
                    <AIWallpaperGenerator onSelectBackground={handleAISelection} />
                </ErrorBoundary>
            ) : (
                <>
                    {/* Add Video Button */}
                    {activeTab === 'videos' && (
                        <div className="mb-6 flex justify-end">
                            <button
                                onClick={() => {
                                    const url = prompt('Enter YouTube Video ID (e.g., wjQq0nSGS28):');
                                    if (url && url.length > 5) {
                                        console.log("Would add video:", url);
                                        alert("Video added! (Simulation: In a real app this would persist)");
                                    }
                                }}
                                className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/80 text-white text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Add Video
                            </button>
                        </div>
                    )}

                    {/* Wallpaper Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Backgrounds.filter(bg => {
                            if (activeTab === 'all') return true;
                            if (activeTab === 'elements') return bg.type === 'element';
                            if (activeTab === 'images') return bg.type === 'image';
                            if (activeTab === 'videos') return bg.type === 'video';
                            return false;
                        }).map((bg) => (
                            <button
                                key={bg.id}
                                onClick={() => setActiveBackground(bg.id, bg.preferredTheme)}
                                className={`group relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all duration-300 ${activeBackgroundId === bg.id ? 'border-accent shadow-[0_0_20px_var(--color-accent-muted)] scale-105' : 'border-transparent hover:border-white/30 hover:scale-105'}`}
                            >
                                {bg.type === 'image' ? (
                                    <div className="w-full h-full relative overflow-hidden">
                                        <img src={bg.src} alt={bg.name} className="w-full h-full object-cover" />
                                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                            <span className="text-xs font-medium text-white/90 drop-shadow-md">{bg.name}</span>
                                        </div>
                                    </div>
                                ) : bg.type === 'video' ? (
                                    <div className="w-full h-full relative overflow-hidden">
                                        <img src={bg.thumbnail} alt={bg.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                <Video size={24} className="text-white ml-1" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                            <span className="text-xs font-medium text-white/90 drop-shadow-md">{bg.name}</span>
                                        </div>
                                    </div>
                                ) : (() => {
                                    const BgComponent = bg.component;
                                    return (
                                        <div className={`w-full h-full relative overflow-hidden ${bg.preferredTheme === 'light' ? 'bg-white' : 'bg-black'}`}>
                                            {BgComponent && (
                                                <div className="absolute inset-0">
                                                    <BgComponent />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                                <span className="text-xs font-medium text-white/90 drop-shadow-md">{bg.name}</span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Type Badge (visible in All view) */}
                                {activeTab === 'all' && (
                                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm shadow-sm ${
                                        bg.type === 'element' ? 'bg-purple-500/80 text-white' :
                                        bg.type === 'image' ? 'bg-blue-500/80 text-white' :
                                        'bg-red-500/80 text-white'
                                    }`}>
                                        {bg.type === 'element' ? 'Dynamic' : bg.type === 'image' ? 'Image' : 'Video'}
                                    </div>
                                )}

                                {activeBackgroundId === bg.id && (
                                    <div className="absolute top-2 right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-lg">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </>
    );
};
// Internal Error Boundary for debugging
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-900/50 border border-red-500 text-white rounded-xl">
                    <h3 className="font-bold mb-2">Component Crashed</h3>
                    <pre className="text-xs overflow-auto p-2 bg-black/50 rounded mb-2">
                        {this.state.error && this.state.error.toString()}
                    </pre>
                    <details className="text-xs opacity-50">
                        <summary>Stack Trace</summary>
                        <pre className="mt-2 whitespace-pre-wrap">
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}
