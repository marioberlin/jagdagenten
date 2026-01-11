import { StateCreator } from 'zustand';
import { ThemeStore, ThemeActions } from '../types';

export const createPerformanceSlice: StateCreator<
    ThemeStore & ThemeActions,
    [['zustand/immer', never]],
    [],
    Pick<ThemeStore, 'performance'> &
    Pick<ThemeActions, 'setPerformanceMode'>
> = (set) => ({
    performance: {
        mode: false,
        reducedMotion: false, // Updated by listener in main store
        reducedTransparency: false,
        gpuTier: 'high', // Optimistic default
    },

    setPerformanceMode: (enabled) => set((state) => {
        state.performance.mode = enabled;
    }),
});
