import { useContext } from 'react';
import { AppearanceContext } from '../context/AppearanceContext';

/**
 * Hook to access appearance settings (density, radius, shadow, material, outline)
 */
export const useAppearance = () => {
    const context = useContext(AppearanceContext);
    if (context === undefined) {
        throw new Error('useAppearance must be used within an AppearanceProvider');
    }
    return context;
};
