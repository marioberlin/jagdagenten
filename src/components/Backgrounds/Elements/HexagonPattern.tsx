
export const HexagonPattern = () => {
    return (
        <div className="absolute inset-0 bg-slate-900 overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='40' viewBox='0 0 24 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40c5.523 0 10-4.477 10-10V10c0-5.523-4.477-10-10-10S-10 4.477-10 10v20c0 5.523 4.477 10 10 10z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                transform: 'scale(4)'
            }} />
            <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        </div>
    );
};
