import { useEffect } from 'react';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { SurfaceContainer } from '@/components/primitives/SurfaceContainer';
import { GlassPageHeader } from '@/components/layout/GlassPageHeader';
import { glassRegistry } from '@/styles/MaterialRegistry';
// import { GlassCard } from '@/components/data-display/GlassCard';

export const ExtensionDemo = () => {
    // Register custom materials on mount
    useEffect(() => {
        // Register a custom glass material
        glassRegistry.register('purple-haze', 'backdrop-blur-md bg-purple-500/20 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]');

        // Register a custom surface material
        glassRegistry.register('neon-blue', 'bg-slate-900 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]');
    }, []);

    return (
        <div className="min-h-screen pb-20">
            <GlassPageHeader
                title="Extension System Demo"
                subtitle="Verifying dynamic material registration via MaterialRegistry"
            />

            <main className="container mx-auto px-4 py-8 space-y-12 max-w-5xl">
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-primary">Custom Materials</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Custom Glass Material */}
                        <div className="space-y-4">
                            <h3 className="text-lg text-secondary">Custom Glass: "purple-haze"</h3>
                            <GlassContainer
                                material="purple-haze" // Using the custom string key
                                className="h-40 flex items-center justify-center p-6 text-center"
                                interactive
                            >
                                <p className="text-purple-200 font-bold text-xl">Purple Haze</p>
                            </GlassContainer>
                        </div>

                        {/* Custom Surface Material */}
                        <div className="space-y-4">
                            <h3 className="text-lg text-secondary">Custom Surface: "neon-blue"</h3>
                            <SurfaceContainer
                                material="neon-blue" // Using the custom string key
                                className="h-40 flex items-center justify-center p-6 text-center"
                                interactive
                            >
                                <p className="text-cyan-400 font-bold text-xl">Neon Blue Surface</p>
                            </SurfaceContainer>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-primary">Standard Materials (Regression Test)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <GlassContainer material="regular" className="h-32 flex items-center justify-center p-6 text-center">
                            <span className="text-lg font-medium text-primary">Standard Regular</span>
                        </GlassContainer>
                        <SurfaceContainer material="elevated" className="h-32 flex items-center justify-center p-6 text-center">
                            <span className="text-lg font-medium text-primary">Standard Elevated</span>
                        </SurfaceContainer>
                    </div>
                </section>
            </main>
        </div>
    );
};
