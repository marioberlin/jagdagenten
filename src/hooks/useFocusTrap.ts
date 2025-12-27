import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_ELEMENTS = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Custom hook for trapping focus within a container element.
 * Used for modals, sheets, and other dialog components for accessibility.
 * 
 * Features:
 * - Traps Tab/Shift+Tab within the container
 * - Closes on Escape key press
 * - Auto-focuses first focusable element
 * - Restores focus to previously focused element on close
 */
export function useFocusTrap(isActive: boolean, onEscape?: () => void) {
    const containerRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    const getFocusableElements = useCallback(() => {
        if (!containerRef.current) return [];
        return Array.from(
            containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS)
        ).filter(el => el.offsetParent !== null); // Filter hidden elements
    }, []);

    // Handle Tab key navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && onEscape) {
            e.preventDefault();
            onEscape();
            return;
        }

        if (e.key !== 'Tab') return;

        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Shift+Tab from first element -> wrap to last
        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        }
        // Tab from last element -> wrap to first
        else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }, [getFocusableElements, onEscape]);

    useEffect(() => {
        if (!isActive) return;

        // Store the previously focused element
        previousFocusRef.current = document.activeElement as HTMLElement;

        // Focus the first focusable element in the container
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
            // Small delay to ensure the modal is rendered
            requestAnimationFrame(() => {
                focusableElements[0].focus();
            });
        }

        // Add keydown listener
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);

            // Restore focus to the previously focused element
            if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
                previousFocusRef.current.focus();
            }
        };
    }, [isActive, handleKeyDown, getFocusableElements]);

    return containerRef;
}
