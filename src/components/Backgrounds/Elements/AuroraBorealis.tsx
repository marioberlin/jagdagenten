
export const AuroraBorealis = () => {
    return (
        <div className="absolute inset-0 bg-black overflow-hidden">
            <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[150%] bg-gradient-to-b from-green-500/20 via-purple-500/20 to-transparent blur-[80px] animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-blue-900/40 via-transparent to-transparent opacity-50" />
        </div>
    );
};
