


/**
 * The LiquidFilter component renders a hidden SVG containing the feDisplacementMap
 * definitions used by the CSS filter property for the "Liquid Glass" effect.
 *
 * It generates a noise texture (turbulence) and sets up the displacement map
 * that allows us to warp elements optically.
 */
export const LiquidFilter = () => {
    return (
        <svg
            style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
            aria-hidden="true"
        >
            <defs>
                {/* 
                  Base filter for standard liquid glass.
                  Uses turbulence to create a noise map.
                  scale=30 defines the "strength" of the distortion (refraction index).
                */}
                <filter id="liquid-glass-normal">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.05"
                        numOctaves="2"
                        result="noise"
                    />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="noise"
                        scale="20" // Refraction strength
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />
                </filter>

                {/* Stronger filter for hover logic if needed, or controlled via CSS variable scaling */}
                <filter id="liquid-glass-heavy">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.02" // Larger waves
                        numOctaves="3"
                        result="noise"
                    />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="noise"
                        scale="40"
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />
                </filter>
            </defs>
        </svg>
    );
};
