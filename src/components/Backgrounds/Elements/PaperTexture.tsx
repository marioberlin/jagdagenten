
export const PaperTexture = () => {
    return (
        <div className="absolute inset-0 bg-[#f8f8f6] overflow-hidden">
            {/* Noise SVG */}
            <svg className="absolute inset-0 opacity-20" width="100%" height="100%">
                <filter id="noiseFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                </filter>
                <rect width="100%" height="100%" filter="url(#noiseFilter)" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-50/30 to-transparent" />
        </div>
    );
};
