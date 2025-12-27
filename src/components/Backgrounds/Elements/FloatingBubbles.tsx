
export const FloatingBubbles = () => {
    return (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 overflow-hidden">
            {Array.from({ length: 15 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute bg-white/10 rounded-full blur-[2px] animate-[float_10s_ease-in-out_infinite]"
                    style={{
                        width: `${Math.random() * 100 + 50}px`,
                        height: `${Math.random() * 100 + 50}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDuration: `${Math.random() * 10 + 10}s`,
                        animationDelay: `${Math.random() * 5}s`
                    }}
                />
            ))}
        </div>
    );
};
