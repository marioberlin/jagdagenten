
export const DigitalRain = () => {
    return (
        <div className="absolute inset-0 bg-black overflow-hidden font-mono">
            {Array.from({ length: 20 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute top-[-100%] text-green-500/30 text-xs animate-[drop_3s_linear_infinite]"
                    style={{
                        left: `${i * 5}%`,
                        animationDuration: `${Math.random() * 2 + 2}s`,
                        animationDelay: `${Math.random() * 2}s`
                    }}
                >
                    {Array.from({ length: 20 }).map((_, j) => (
                        <div key={j}>{Math.random() > 0.5 ? '1' : '0'}</div>
                    ))}
                </div>
            ))}
        </div>
    );
};
