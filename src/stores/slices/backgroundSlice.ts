import { StateCreator } from 'zustand';
import { ThemeStore, ThemeActions } from '../types';

export const createBackgroundSlice: StateCreator<
    ThemeStore & ThemeActions,
    [['zustand/immer', never]],
    [],
    Pick<ThemeStore, 'activeBackgroundId' | 'backgroundLuminance'> &
    Pick<ThemeActions, 'setBackground'>
> = (set) => ({
    activeBackgroundId: 'mesh-gradient-1',
    backgroundLuminance: 'dark', // Default assumption

    setBackground: (id, preferredMode) => set((state) => {
        state.activeBackgroundId = id;
        if (preferredMode) {
            state.backgroundLuminance = preferredMode === 'light' ? 'light' : 'dark';
        }
    }),
});
