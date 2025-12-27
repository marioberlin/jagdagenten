
export const CyberCircuit = () => {
    return (
        <div className="absolute inset-0 bg-black overflow-hidden">
            <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, transparent 0%, #000 100%), repeating-linear-gradient(0deg, transparent 0px, transparent 29px, rgba(14, 165, 233, 0.1) 30px), repeating-linear-gradient(90deg, transparent 0px, transparent 29px, rgba(14, 165, 233, 0.1) 30px)`
            }} />
            <div className="absolute top-[20%] left-[20%] w-32 h-1 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-pulse" />
            <div className="absolute bottom-[30%] right-[40%] w-1 h-32 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
    );
};
