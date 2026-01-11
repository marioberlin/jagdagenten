import { GlassContainer } from '@/components';
import { GlassButton } from '@/components';
import { GlassInput } from '@/components';
import { VibrantText } from '@/components';
import { GlassMetric } from '@/components';
import { SFSymbol } from '@/components/ui/SFSymbol';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useState } from 'react';

export const Home = () => {
    const [isPlaying, setIsPlaying] = useState(true);

    return (
        <div className="min-h-screen text-primary p-8 relative z-10 flex flex-col items-center justify-center transition-colors duration-500">

            <main className="max-w-6xl w-full mx-auto space-y-12 mt-20">
                {/* Hero Section */}
                <div className="text-center space-y-6">
                    <VibrantText
                        intensity="high"
                        className="text-7xl md:text-9xl font-bold tracking-tighter"
                        style={{ color: 'var(--hero-text)' }}
                    >
                        Liquid Glass UI Kit
                    </VibrantText>
                    <p className="text-xl md:text-2xl text-label-glass-secondary font-light max-w-2xl mx-auto">
                        A next-generation interface exploring the boundaries of <span className="text-label-glass-primary font-medium">blur</span>, <span className="text-label-glass-primary font-medium">depth</span>, and <span className="text-label-glass-primary font-medium">materiality</span>.
                    </p>

                    {/* Navigation Buttons */}
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-8">
                        <Link to="/showcase">
                            <GlassContainer
                                material="regular"
                                interactive
                                className="px-6 py-3 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <div className="flex flex-row items-center gap-2">
                                    <SFSymbol name="sparkles" size={18} />
                                    <span className="font-medium text-primary">Components</span>
                                </div>
                            </GlassContainer>
                        </Link>

                        <Link to="/sf-symbols">
                            <GlassContainer
                                material="regular"
                                interactive
                                className="px-6 py-3 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <div className="flex flex-row items-center gap-2">
                                    <SFSymbol name="magnifyingglass" size={18} />
                                    <span className="font-medium text-primary">SF Symbols</span>
                                </div>
                            </GlassContainer>
                        </Link>

                        <Link to="/settings">
                            <GlassContainer
                                material="regular"
                                interactive
                                className="px-6 py-3 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <div className="flex flex-row items-center gap-2">
                                    <SFSymbol name="paintbrush.fill" size={18} />
                                    <span className="font-medium text-primary">Customize</span>
                                </div>
                            </GlassContainer>
                        </Link>

                        <Link to="/design-guide">
                            <GlassContainer
                                material="regular"
                                interactive
                                className="px-6 py-3 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <div className="flex flex-row items-center gap-2">
                                    <SFSymbol name="book.fill" size={18} />
                                    <span className="font-medium text-primary">Design Guide</span>
                                </div>
                            </GlassContainer>
                        </Link>
                    </div>
                </div>

                {/* Metrics Row - Animated counters with sparklines */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                    <GlassMetric
                        title="Components"
                        value={85}
                        suffix="+"
                        trend={{ value: 12, isPositive: true, label: "new this month" }}
                        data={[40, 45, 42, 55, 60, 58, 70, 85]}
                    />
                    <GlassMetric
                        title="Design Tokens"
                        value={40}
                        suffix="+"
                        trend={{ value: 8, isPositive: true, label: "CSS variables" }}
                        data={[20, 22, 25, 28, 32, 35, 38, 40]}
                    />
                    <GlassMetric
                        title="Demo Pages"
                        value={15}
                        trend={{ value: 25, isPositive: true, label: "interactive demos" }}
                        data={[5, 6, 8, 9, 10, 12, 14, 15]}
                    />
                </div>

                {/* Showcase Grid - Materials */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                    <GlassContainer material="thin" interactive border className="h-64 flex flex-col justify-end p-6 rounded-3xl">
                        <span className="text-label-glass-tertiary text-xs uppercase tracking-widest font-bold mb-2">Material 01</span>
                        <h3 className="text-2xl font-semibold text-label-glass-primary mb-1">Thin</h3>
                        <p className="text-label-glass-secondary text-sm">Design Token: glass-thin</p>
                    </GlassContainer>

                    <GlassContainer material="regular" interactive border className="h-64 flex flex-col justify-end p-6 rounded-3xl">
                        <span className="text-label-glass-tertiary text-xs uppercase tracking-widest font-bold mb-2">Material 02</span>
                        <h3 className="text-2xl font-semibold text-label-glass-primary mb-1">Regular</h3>
                        <p className="text-label-glass-secondary text-sm">Design Token: glass-regular</p>
                    </GlassContainer>

                    <GlassContainer material="thick" interactive border className="h-64 flex flex-col justify-end p-6 rounded-3xl">
                        <span className="text-label-glass-tertiary text-xs uppercase tracking-widest font-bold mb-2">Material 03</span>
                        <h3 className="text-2xl font-semibold text-label-glass-primary mb-1">Thick</h3>
                        <p className="text-label-glass-secondary text-sm">Design Token: glass-thick</p>
                    </GlassContainer>
                </div>

                {/* Media & Data Visualization Row - Premium Showcase */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                    {/* Premium Music Player Widget */}
                    <GlassContainer className="p-6 rounded-3xl overflow-hidden relative" material="thick" border>
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-cyan-500/20" />
                        <div className="relative z-10">
                            <span className="text-xs font-bold uppercase tracking-widest text-label-glass-tertiary mb-3 block">Now Playing</span>

                            <div className="flex gap-5 items-center">


                                {/* Track Info */}
                                <div className="flex-1 min-w-0 flex flex-col items-center text-center">
                                    <h4 className="text-xl font-bold text-label-glass-primary truncate">Liquid Dreams</h4>
                                    <p className="text-sm text-label-glass-secondary mb-3">Glassmorphism Studio</p>

                                    {/* Animated Visualizer Bars */}
                                    <div className="flex gap-1 items-end h-6 justify-center">
                                        {[...Array(12)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-1.5 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full"
                                                style={{
                                                    height: `${20 + Math.random() * 80}%`,
                                                    animation: isPlaying ? `pulse ${0.3 + Math.random() * 0.5}s ease-in-out infinite alternate` : 'none',
                                                    opacity: isPlaying ? 1 : 0.4
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-5">
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-3/5 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full
                                                    transition-all duration-1000" />
                                </div>
                                <div className="flex justify-between text-xs text-label-glass-tertiary mt-2">
                                    <span>2:14</span>
                                    <span>3:45</span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-6 mt-4">
                                <button className="text-label-glass-secondary hover:text-label-glass-primary transition-colors duration-micro">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                                </button>
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center
                                               shadow-lg shadow-purple-500/30 transition-all duration-standard ease-spring hover:scale-110 active:scale-95"
                                >
                                    {isPlaying ? (
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                    ) : (
                                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    )}
                                </button>
                                <button className="text-label-glass-secondary hover:text-label-glass-primary transition-colors duration-micro">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                                </button>
                            </div>
                        </div>
                    </GlassContainer>

                    {/* Premium Animated Gauge */}
                    <GlassContainer className="p-6 rounded-3xl relative overflow-hidden" material="thick" border>
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />
                        <div className="relative z-10">
                            <span className="text-xs font-bold uppercase tracking-widest text-label-glass-tertiary mb-3 block">System Health</span>

                            {/* Custom Animated Ring Gauge */}
                            <div className="flex items-center justify-center py-4">
                                <div className="relative w-44 h-44">
                                    {/* Background Ring */}
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                        <circle
                                            cx="50" cy="50" r="42"
                                            fill="none"
                                            stroke="rgba(255,255,255,0.1)"
                                            strokeWidth="8"
                                        />
                                        {/* Animated Progress Ring with gradient */}
                                        <circle
                                            cx="50" cy="50" r="42"
                                            fill="none"
                                            stroke="url(#gaugeGradient)"
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray={`${92 * 2.64} 264`}
                                            className="transition-all duration-emphasis ease-spring"
                                            style={{
                                                filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.5))'
                                            }}
                                        />
                                        <defs>
                                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#06b6d4" />
                                                <stop offset="50%" stopColor="#8b5cf6" />
                                                <stop offset="100%" stopColor="#ec4899" />
                                            </linearGradient>
                                        </defs>
                                    </svg>

                                    {/* Center Content */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                            92
                                        </span>
                                        <span className="text-sm text-label-glass-secondary font-medium">Score</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                {[
                                    { label: 'Performance', value: '98%', color: 'from-cyan-400 to-cyan-500' },
                                    { label: 'Accessibility', value: '89%', color: 'from-purple-400 to-purple-500' },
                                    { label: 'Best Practices', value: '92%', color: 'from-pink-400 to-pink-500' }
                                ].map((stat, i) => (
                                    <div key={i} className="text-center">
                                        <div className={`text-lg font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                                            {stat.value}
                                        </div>
                                        <div className="text-xs text-label-glass-tertiary">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </GlassContainer>
                </div>

                {/* Interactive Components Demo */}
                <div className="mt-12 px-4">
                    <h2 className="text-2xl font-bold mb-6 text-primary">Interactive Components</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Buttons */}
                        <GlassContainer className="p-8 flex flex-col gap-10 items-start">
                            <h3 className="text-lg font-semibold text-primary mb-2">Glass Buttons</h3>
                            <div className="flex flex-wrap gap-4 items-center">
                                <GlassButton variant="primary">Primary</GlassButton>
                                <GlassButton variant="secondary">Secondary</GlassButton>
                                <GlassButton variant="ghost">Ghost</GlassButton>
                            </div>
                        </GlassContainer>

                        {/* Inputs */}
                        <GlassContainer className="p-8 flex flex-col gap-10 items-start">
                            <h3 className="text-lg font-semibold text-primary mb-2">Glass Inputs</h3>
                            <div className="w-full space-y-4">
                                <GlassInput placeholder="Default Input..." />
                                <GlassInput icon={<Search size={16} />} placeholder="Search..." />
                            </div>
                        </GlassContainer>
                    </div>
                </div>

            </main>
        </div>
    );
};

