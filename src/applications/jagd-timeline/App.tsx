import HuntTimeline from '../jagd-agenten/components/HuntTimeline';

export default function TimelineApp() {
    return (
        <div
            className="relative h-full w-full overflow-hidden"
            style={{
                backgroundImage: 'url(/backgrounds/apps/timeline.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Content */}
            <div className="relative h-full w-full overflow-auto">
                <HuntTimeline />
            </div>
        </div>
    );
}
