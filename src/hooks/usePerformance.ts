import { useThemeStore } from '../stores/themeStore';
import { useShallow } from 'zustand/react/shallow';

export const usePerformance = () => {
    return useThemeStore(
        useShallow((state) => ({
            performanceMode: state.performance.mode,
            reducedMotion: state.performance.reducedMotion,
            gpuTier: state.performance.gpuTier,
            setPerformanceMode: state.setPerformanceMode,
        }))
    );
};
