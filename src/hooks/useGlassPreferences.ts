import { useContext } from 'react';
import { GlassContext } from '../context/GlassContext';

/**
 * Hook to access glass preferences (reduced motion, GPU tier)
 */
export const useGlassPreferences = () => useContext(GlassContext);
