
export const VideoBackground = ({ videoUrl }: { videoUrl: string }) => {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <iframe
                src={videoUrl}
                className="absolute top-1/2, left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vh] pointer-events-none"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Video Background"
                style={{
                    minWidth: '100vw',
                    minHeight: '100vh',
                }}
            />
        </div>
    );
};
