import { useState } from 'react';
import { Image as ImageIcon, Sparkles, Plus, Video } from 'lucide-react';
import { Backgrounds } from '@/components/Backgrounds/BackgroundRegistry';
import type { WallpaperSectionProps } from './types';

export const WallpaperSection = ({
    activeBackgroundId,
    setActiveBackground
}: WallpaperSectionProps) => {
    const [activeTab, setActiveTab] = useState<'elements' | 'images' | 'videos'>('elements');

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
                <div className="flex gap-2 p-1 rounded-xl bg-glass-surface/50 w-fit">
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
                </div>
            </div>

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
                            <img src={bg.src} alt={bg.name} className="w-full h-full object-cover" />
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
    );
};
