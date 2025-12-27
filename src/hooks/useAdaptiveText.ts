import { useContext } from 'react';
import { AdaptiveTextContext } from '../context/AdaptiveTextContext';

/**
 * Hook to access adaptive text settings
 */
export const useAdaptiveText = () => useContext(AdaptiveTextContext);

// Re-export types for convenience
export type { BackgroundType, ContrastLevel, MaterialThickness } from '../context/AdaptiveTextContext';
