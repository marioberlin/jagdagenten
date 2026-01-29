/**
 * Alexa App Store
 * 
 * Shared state for the Alexa+ app, allowing the layout to access
 * weather data for the title bar.
 */
import { create } from 'zustand';

interface AlexaAppState {
    temperature: number | null;
    condition: string | null;
    city: string;
    setWeather: (temp: number | null, condition: string | null, city: string) => void;
}

export const useAlexaAppStore = create<AlexaAppState>((set) => ({
    temperature: null,
    condition: null,
    city: 'Loading...',
    setWeather: (temperature, condition, city) => set({ temperature, condition, city }),
}));
