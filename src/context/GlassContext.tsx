import React, { createContext, useEffect, useState } from 'react';

interface GlassContextType {
    reducedMotion: boolean;
    gpuTier: 'low' | 'medium' | 'high';
}

// Export context for use in hook file
export const GlassContext = createContext<GlassContextType>({
    reducedMotion: false,
    gpuTier: 'high',
});

export const GlassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [reducedMotion, setReducedMotion] = useState(false);
    const [gpuTier, setGpuTier] = useState<'low' | 'medium' | 'high'>('high');

    useEffect(() => {
        // 1. Detect Reduced Motion
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(mediaQuery.matches);

        const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handleMotionChange);

        // 2. Simple GPU Tier Detection (Heuristic based on concurrency/device memory)
        // Accurate GPU tier detection requires webgl, using simpler heuristic for now.
        const concurrency = navigator.hardwareConcurrency || 4;
        if (concurrency <= 4) {
            // Likely a mobile device or older laptop
            setGpuTier('medium');
        }

        return () => mediaQuery.removeEventListener('change', handleMotionChange);
    }, []);

    return (
        <GlassContext.Provider value={{ reducedMotion, gpuTier }}>
            {children}
        </GlassContext.Provider>
    );
};


