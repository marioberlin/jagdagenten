import { GlassContainer } from '@/components';
import { GlassButton } from '@/components';
import { GlassInput } from '@/components';
import { VibrantText } from '@/components';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

export const Home = () => {
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

                    <div className="flex items-center justify-center gap-4 pt-8">
                        <Link to="/showcase">
                            <GlassContainer material="prominent" interactive className="px-8 py-4 rounded-full font-medium active:scale-95 transition-transform duration-200">
                                View Design System
                            </GlassContainer>
                        </Link>
                        <Link to="/sf-symbols">
                            <GlassContainer material="regular" interactive className="px-8 py-4 rounded-full font-medium active:scale-95 transition-transform duration-200">
                                SF Symbols Browser
                            </GlassContainer>
                        </Link>
                        <Link to="/settings">
                            <GlassContainer material="thin" interactive className="px-8 py-4 rounded-full font-medium active:scale-95 transition-transform duration-200">
                                Customize Theme
                            </GlassContainer>
                        </Link>
                    </div>
                </div>

                {/* Showcase Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                    {/* Ultra Thin Material */}
                    <GlassContainer material="thin" interactive border className="h-64 flex flex-col justify-end p-6 rounded-3xl">
                        <span className="text-label-glass-tertiary text-xs uppercase tracking-widest font-bold mb-2">Material 01</span>
                        <h3 className="text-2xl font-semibold text-label-glass-primary mb-1">Thin</h3>
                        <p className="text-label-glass-secondary text-sm">Design Token: glass-thin</p>
                    </GlassContainer>


                    {/* Regular Material */}
                    <GlassContainer material="regular" interactive border className="h-64 flex flex-col justify-end p-6 rounded-3xl">
                        <span className="text-label-glass-tertiary text-xs uppercase tracking-widest font-bold mb-2">Material 03</span>
                        <h3 className="text-2xl font-semibold text-label-glass-primary mb-1">Regular</h3>
                        <p className="text-label-glass-secondary text-sm">Design Token: glass-regular</p>
                    </GlassContainer>

                    {/* Thick Material */}
                    <GlassContainer material="thick" interactive border className="h-64 flex flex-col justify-end p-6 rounded-3xl">
                        <span className="text-label-glass-tertiary text-xs uppercase tracking-widest font-bold mb-2">Material 04</span>
                        <h3 className="text-2xl font-semibold text-label-glass-primary mb-1">Thick</h3>
                        <p className="text-label-glass-secondary text-sm">Design Token: glass-thick</p>
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
