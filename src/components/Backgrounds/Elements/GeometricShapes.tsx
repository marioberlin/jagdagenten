
export const GeometricShapes = () => {
    return (
        <div className="absolute inset-0 bg-zinc-900 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 border-2 border-white/10 rounded-full animate-[spin_10s_linear_infinite]" />
            <div className="absolute top-1/2 left-1/2 w-96 h-96 border border-white/5 rotate-45 animate-[spin_15s_linear_infinite_reverse]" />
            <div className="absolute bottom-1/4 right-1/4 w-32 h-32 border-4 border-white/5 rounded-lg animate-bounce" />
        </div>
    );
};
