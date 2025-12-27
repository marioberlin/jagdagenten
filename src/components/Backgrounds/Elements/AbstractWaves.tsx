
export const AbstractWaves = () => {
    return (
        <div className="absolute inset-0 bg-neutral-900 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_2px,transparent_2px,transparent_20px)] animate-[pulse_8s_ease-in-out_infinite]" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 mix-blend-overlay" />
        </div>
    );
};
