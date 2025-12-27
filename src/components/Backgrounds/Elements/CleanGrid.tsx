
export const CleanGrid = () => {
    return (
        <div className="absolute inset-0 bg-white overflow-hidden">
            <div className="absolute inset-0"
                style={{
                    backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/50" />
        </div>
    );
};
