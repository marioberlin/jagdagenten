/**
 * AnimatedMeshGradient - Premium animated mesh gradient background
 * Features smooth floating orbs with varying speeds and colors
 */
export const MeshGradient = () => {
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Primary orbs - slow floating */}
            <div
                className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-60"
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    top: '10%',
                    left: '15%',
                    animation: 'meshFloat1 20s ease-in-out infinite',
                }}
            />
            <div
                className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-50"
                style={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    top: '50%',
                    right: '10%',
                    animation: 'meshFloat2 25s ease-in-out infinite',
                }}
            />
            <div
                className="absolute w-[700px] h-[700px] rounded-full blur-[140px] opacity-40"
                style={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    bottom: '0%',
                    left: '30%',
                    animation: 'meshFloat3 30s ease-in-out infinite',
                }}
            />

            {/* Secondary accent orbs - faster, smaller */}
            <div
                className="absolute w-[300px] h-[300px] rounded-full blur-[80px] opacity-30"
                style={{
                    background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                    top: '30%',
                    right: '30%',
                    animation: 'meshFloat4 15s ease-in-out infinite',
                }}
            />
            <div
                className="absolute w-[250px] h-[250px] rounded-full blur-[60px] opacity-25"
                style={{
                    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                    bottom: '20%',
                    left: '10%',
                    animation: 'meshFloat5 18s ease-in-out infinite',
                }}
            />

            {/* Keyframes injected via style tag */}
            <style>{`
                @keyframes meshFloat1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(50px, -30px) scale(1.05); }
                    50% { transform: translate(20px, 40px) scale(0.95); }
                    75% { transform: translate(-30px, 20px) scale(1.02); }
                }
                @keyframes meshFloat2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-40px, 30px) scale(1.08); }
                    66% { transform: translate(30px, -20px) scale(0.92); }
                }
                @keyframes meshFloat3 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    20% { transform: translate(30px, -40px) scale(1.03); }
                    40% { transform: translate(-20px, 20px) scale(0.97); }
                    60% { transform: translate(40px, 10px) scale(1.05); }
                    80% { transform: translate(-30px, -20px) scale(0.98); }
                }
                @keyframes meshFloat4 {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-60px, 40px); }
                }
                @keyframes meshFloat5 {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(50px, -50px); }
                }
            `}</style>

            {/* Subtle noise overlay for texture */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />
        </div>
    );
};
