
export const NeonGrid = () => {
    return (
        <div className="absolute inset-0 bg-black overflow-hidden perspective-[1000px]">
            <div className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [transform:rotateX(60deg)] animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>
    );
};
