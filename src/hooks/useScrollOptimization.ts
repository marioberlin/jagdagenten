import { useState, useEffect } from 'react';

/**
 * useScrollOptimization Hook
 * 
 * Detects when the user is actively scrolling and returns a boolean state.
 * This allows heavy components (like liquid glass filters) to temporarily
 * disable themselves or switch to a cheaper rendering mode to maintain 60FPS.
 * 
 * @param timeout - Duration (ms) to keep "isScrolling" true after scroll stops.
 * @returns boolean - true if scrolling, false if idle.
 */
export const useScrollOptimization = (timeout = 250) => {
    const [isScrolling, setIsScrolling] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;

        const handleScroll = () => {
            // Immediately set scrolling state
            setIsScrolling(true);

            // Clear any existing timer to debounce the reset
            clearTimeout(timer);

            // Set a timer to reset state after scrolling stops
            timer = setTimeout(() => {
                setIsScrolling(false);
            }, timeout);
        };

        // Attach listener to window (or specific element if needed later)
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Cleanup
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timer);
        };
    }, [timeout]);

    return isScrolling;
};
