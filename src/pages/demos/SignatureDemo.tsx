import { useState } from 'react';
import { GlassContainer, GlassButton } from '@/components';
import { GlassCommandPalette } from '@/components/overlays/GlassCommandPalette';
import { GlassMorphCard } from '@/components/showcase/GlassMorphCard';
import { GlassFluidNav } from '@/components/showcase/GlassFluidNav';
import { Command } from 'lucide-react';

export const SignatureDemo = () => {
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);

    return (
        <div className="min-h-screen p-8 space-y-12 pb-32">
            <div className="max-w-4xl mx-auto space-y-2">
                <h1 className="text-4xl font-bold text-primary">Signature Components</h1>
                <p className="text-lg text-secondary">
                    Showcasing standard Framer Motion animations and "Hero" interactions.
                </p>
            </div>

            {/* Fluid Nav Section */}
            <section className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-semibold text-primary mb-6">1. Fluid Navigation</h2>
                <GlassContainer className="p-12 bg-black/20">
                    <GlassFluidNav />
                </GlassContainer>
            </section>

            {/* Morph Card Section */}
            <section className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-semibold text-primary mb-6">2. Morphing Cards (Layout ID)</h2>
                <GlassMorphCard />
            </section>

            {/* Command Palette Section */}
            <section className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-semibold text-primary mb-6">3. Command Palette (Polished)</h2>
                <GlassContainer className="p-12 flex flex-col items-center justify-center gap-6">
                    <p className="text-secondary text-center max-w-md">
                        Press <kbd className="bg-white/10 px-2 py-1 rounded mx-1 text-primary">⌘ K</kbd> or click the button below to open the polished command palette.
                    </p>
                    <GlassButton
                        variant="primary"
                        size="lg"
                        onClick={() => setIsPaletteOpen(true)}
                    >
                        <Command className="w-4 h-4 mr-2" />
                        Open Command Palette
                    </GlassButton>
                </GlassContainer>
            </section>

            <GlassCommandPalette
                isOpen={isPaletteOpen}
                onClose={() => setIsPaletteOpen(false)}
            />
        </div>
    );
};

export default SignatureDemo;
