import { useContext } from 'react';
import { GlassIntensityContext } from '../context/GlassIntensityContext';

/**
 * Hook to access glass intensity settings (intensity, overlay, tint, vibrancy)
 */
export const useGlassIntensity = () => {
    const context = useContext(GlassIntensityContext);
    if (context === undefined) {
        throw new Error('useGlassIntensity must be used within a GlassIntensityProvider');
    }
    return context;
};
