/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    '-apple-system',
                    'BlinkMacSystemFont',
                    '"SF Pro Text"',
                    '"Segoe UI"',
                    'Roboto',
                    '"Helvetica Neue"',
                    'Arial',
                    'sans-serif',
                ],
            },
            letterSpacing: {
                tighter: '-0.05em',
                tight: '-0.025em',
                normal: '0em',
                wide: '0.025em',
            },
            /**
             * Backdrop Blur Values
             * 
             * INTENTIONAL DEVIATIONS FROM APPLE HIG SPEC:
             * Apple HIG recommends: thin=8px, regular=16px, thick=24px
             * We use higher values for enhanced visual effect on web:
             * - thin: 10px (vs 8px) - Slightly stronger for web rendering
             * - regular: 25px (vs 16px) - More pronounced glass effect
             * - thick: 50px (vs 24px) - Maximum frosted appearance
             * 
             * These values were tuned for cross-browser consistency and
             * to compensate for web's flatter color spaces vs native macOS.
             * 
             * For Apple-spec compliance, use GlassContainer's inline values:
             * thin=8px, regular=16px, thick=32px
             */
            backdropBlur: {
                xs: '2px',      // Ultra-thin: tooltips, subtle hints
                thin: '10px',   // Thin: secondary toolbars, popovers
                regular: '25px',// Regular: primary navigation, modals
                thick: '50px',  // Thick: sidebars, large panels
                ultra: '80px',  // Ultra: hero sections, full-screen overlays
            },
            colors: {
                // Semantic text colors
                label: {
                    primary: 'var(--label-primary)',
                    secondary: 'var(--label-secondary)',
                    tertiary: 'var(--label-tertiary)',
                    quaternary: 'var(--label-quaternary)',
                    // Luminance-aware glass tokens - adapt to background brightness
                    'glass-primary': 'var(--glass-text-primary)',
                    'glass-secondary': 'var(--glass-text-secondary)',
                    'glass-tertiary': 'var(--glass-text-tertiary)',
                },
                // Glass surface colors
                glass: {
                    'tint-light': 'rgba(255, 255, 255, 0.2)',
                    'tint-dark': 'rgba(20, 20, 20, 0.4)',
                    light: 'rgba(255, 255, 255, 0.4)',
                    dark: 'rgba(0, 0, 0, 0.5)',
                    clear: 'rgba(255, 255, 255, 0.15)',
                    border: 'var(--glass-border)',
                    surface: 'var(--glass-surface)',
                    'surface-hover': 'var(--glass-surface-hover)',
                    'surface-active': 'var(--glass-surface-active)',
                },
                // Semantic accent colors (Phase 2)
                accent: {
                    DEFAULT: 'var(--color-accent)',
                    muted: 'var(--color-accent-muted)',
                    hover: 'var(--color-accent-hover)',
                },
                destructive: {
                    DEFAULT: 'var(--color-destructive)',
                    muted: 'var(--color-destructive-muted)',
                },
                success: {
                    DEFAULT: 'var(--color-success)',
                    muted: 'var(--color-success-muted)',
                },
                warning: {
                    DEFAULT: 'var(--color-warning)',
                    muted: 'var(--color-warning-muted)',
                },
            },
            boxShadow: {
                'glass-edge': 'inset 0 0 0 1px rgba(255, 255, 255, 0.3), 0 4px 30px rgba(0, 0, 0, 0.1)',
                'glass-deep': 'inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 20px 40px rgba(0, 0, 0, 0.2)',
                // NEW: Inner highlight for glass depth
                'glass-highlight': 'var(--glass-highlight)',
            },
            transitionTimingFunction: {
                'glass': 'cubic-bezier(0.42, 0.0, 0.58, 1.0)',
            },
            transitionDuration: {
                'glass': '400ms',
            },
            // 4pt Grid Spacing System for consistent component proportions
            spacing: {
                '0.5': '2px',   // 0.5 * 4pt
                '1': '4px',     // 1 * 4pt
                '1.5': '6px',   // 1.5 * 4pt
                '2': '8px',     // 2 * 4pt
                '2.5': '10px',  // 2.5 * 4pt
                '3': '12px',    // 3 * 4pt
                '4': '16px',    // 4 * 4pt
                '5': '20px',    // 5 * 4pt
                '6': '24px',    // 6 * 4pt
                '7': '28px',    // 7 * 4pt
                '8': '32px',    // 8 * 4pt
                '9': '36px',    // 9 * 4pt
                '10': '40px',   // 10 * 4pt - Standard touch target
                '11': '44px',   // 11 * 4pt - iOS touch target
                '12': '48px',   // 12 * 4pt
                '14': '56px',   // 14 * 4pt
                '16': '64px',   // 16 * 4pt
                '20': '80px',   // 20 * 4pt
                '24': '96px',   // 24 * 4pt
                '28': '112px',  // 28 * 4pt
                '32': '128px',  // 32 * 4pt
            },
        },
    },
    plugins: [],
}
