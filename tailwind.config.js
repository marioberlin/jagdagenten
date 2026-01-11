/**
 * Tailwind CSS v4 Configuration
 * 
 * This configuration is minimal - most settings have moved to CSS using @theme.
 * See src/styles/tailwind.css for the full theme configuration.
 * 
 * v4 Features Used:
 * - CSS-first configuration via @theme directive
 * - Native CSS cascade layers
 * - Automatic content detection
 * - Smaller bundle size
 */

export default {
    // Content detection is automatic in v4, but we keep it explicit for compatibility
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    // Theme is now defined in CSS using @theme
    theme: {
        // Extend only what's not in CSS (plugins, special cases)
        extend: {},
    },
    plugins: [],
}
