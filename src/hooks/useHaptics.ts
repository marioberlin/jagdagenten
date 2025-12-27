/**
 * useHaptics - Web Vibration API wrapper for tactile feedback
 * 
 * Provides haptic feedback patterns for mobile devices.
 * Falls back gracefully on devices/browsers that don't support vibration.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate
 */

type HapticPattern = 'impact' | 'success' | 'error' | 'selection';

// Vibration patterns in milliseconds
// Format: [vibrate, pause, vibrate, pause, ...]
const patterns: Record<HapticPattern, number | number[]> = {
    impact: 10,           // Light tap
    success: 100,         // Longer confirmation pulse
    error: [50, 100, 50], // Double pulse for error
    selection: 5,         // Very light for selection changes
};

export function useHaptics() {
    const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

    const trigger = (pattern: HapticPattern = 'impact') => {
        if (!isSupported) return false;

        try {
            return navigator.vibrate(patterns[pattern]);
        } catch {
            return false;
        }
    };

    const cancel = () => {
        if (!isSupported) return;
        navigator.vibrate(0);
    };

    return {
        isSupported,
        trigger,
        cancel,
        // Convenience methods
        impact: () => trigger('impact'),
        success: () => trigger('success'),
        error: () => trigger('error'),
        selection: () => trigger('selection'),
    };
}

export default useHaptics;
