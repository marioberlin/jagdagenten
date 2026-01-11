export const runLegacyMigration = () => {
    if (typeof window === 'undefined') return;

    // Check if migration already happened
    if (localStorage.getItem('liquid-glass-store')) return;

    console.log('Migrating legacy theme settings to Zustand store...');

    try {
        // Read Legacy Keys
        const mode = localStorage.getItem('liquid-glass-theme') || 'dark';
        const bgId = localStorage.getItem('liquid-glass-bg') || 'mesh-gradient-1';
        const glassIntensity = parseInt(localStorage.getItem('liquid-glass-intensity') || '60');
        const glassMaterial = localStorage.getItem('liquid-glass-material') || 'regular';
        const radius = parseInt(localStorage.getItem('liquid-glass-radius') || '24');
        const density = localStorage.getItem('liquid-glass-density') || 'comfortable';

        // Construct partial state
        const migratedState = {
            state: {
                mode: mode === 'light' || mode === 'dark' ? mode : 'dark',
                activeBackgroundId: bgId,
                density: density,
                glass: {
                    intensity: glassIntensity,
                    material: glassMaterial,
                    // defaults for others
                    blurStrength: 60,
                    saturation: 110,
                    noiseOpacity: 5,
                    tintColor: null
                },
                visual: {
                    radius: radius,
                    // defaults
                    shadowStrength: 40,
                    outlineOpacity: 40,
                    specularEnabled: true,
                    textShadowEnabled: true,
                    textVibrancy: 50,
                    accentColor: '#3b82f6',
                    bounceIntensity: 50,
                    pulseIntensity: 50,
                    scaleIntensity: 50,
                    wiggleIntensity: 50
                },
                // defaults for others
                performance: { mode: false },
                themes: { custom: [], activeId: 'default-glass' }
            },
            version: 2
        };

        localStorage.setItem('liquid-glass-store', JSON.stringify(migratedState));
        console.log('Migration successful.');
    } catch (e) {
        console.error('Migration failed:', e);
    }
};
