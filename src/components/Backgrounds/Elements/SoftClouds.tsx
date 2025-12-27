
export const SoftClouds = () => {
    return (
        <div className="absolute inset-0 bg-slate-50 overflow-hidden">
            <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-100/50 rounded-full blur-[80px]" />
            <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-purple-100/40 rounded-full blur-[60px]" />
            <div className="absolute bottom-[-10%] left-[30%] w-[70%] h-[70%] bg-white rounded-full blur-[50px] mix-blend-overlay" />
        </div>
    );
};
