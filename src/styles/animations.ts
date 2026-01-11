import { Transition, Variants } from 'framer-motion';

/**
 * Glass UI Animation Tokens
 * Standardized easing curves and durations for the design system.
 */

// Easing Curves
export const EASINGS = {
    easeOutQuart: [0.165, 0.84, 0.44, 1],
    easeOutExpo: [0.19, 1, 0.22, 1],
    easeInOutCubic: [0.645, 0.045, 0.355, 1],
    elastic: [0.34, 1.56, 0.64, 1],
} as const;

// Transition Presets
export const TRANSITIONS: Record<string, Transition> = {
    // Standard spring for UI elements (buttons, inputs)
    spring: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
    },
    // Bouncy spring for playful elements or attention-grabbers
    springBouncy: {
        type: 'spring',
        stiffness: 400,
        damping: 15,
    },
    // Slow, stiff spring for large layout changes
    springSlow: {
        type: 'spring',
        stiffness: 200,
        damping: 40,
    },
    // Precise spring for small interactions (hover, tap)
    springFast: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
    },
    // Smooth ease-out for enter/exit animations
    easeOut: {
        duration: 0.2,
        ease: EASINGS.easeOutQuart,
    },
};

// Animation Variants
export const VARIANTS: Record<string, Variants> = {
    // Fade In
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: TRANSITIONS.easeOut },
        exit: { opacity: 0, transition: { duration: 0.15 } },
    },
    // Scale In (Modals, Popovers)
    scaleIn: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1, transition: TRANSITIONS.spring },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
    },
    // Slide Up (Bottom Sheets, Notifications)
    slideUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: TRANSITIONS.spring },
        exit: { opacity: 0, y: 20, transition: { duration: 0.15 } },
    },
    // Slide Down
    slideDown: {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0, transition: TRANSITIONS.spring },
        exit: { opacity: 0, y: -20, transition: { duration: 0.15 } },
    },
    // Container Stagger (for lists)
    staggerContainer: {
        animate: {
            transition: {
                staggerChildren: 0.05,
            },
        },
    },
    // Item for Stagger
    staggerItem: {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0, transition: TRANSITIONS.easeOut },
    },
};
