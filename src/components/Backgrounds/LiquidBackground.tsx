

export const LiquidBackground = () => {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-black pointer-events-none">
            {/* Abstract Liquid Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/30 blur-[100px] animate-pulse" />
            <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-purple-600/30 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[40%] rounded-full bg-cyan-600/20 blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />

            {/* SVG Filter for Liquid Distortion (Optional, applied via CSS if needed, 
          but usually large blurs + gradients are enough for the background "light" source) */}
        </div>
    );
};

LiquidBackground.displayName = 'LiquidBackground';
