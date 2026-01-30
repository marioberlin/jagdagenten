import ScoutView from '../jagd-agenten/components/ScoutView';

export default function ScoutApp() {
    return (
        <div
            className="relative h-full w-full overflow-hidden"
            style={{
                backgroundImage: 'url(/backgrounds/apps/scout.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Content */}
            <div className="relative h-full w-full overflow-auto">
                <ScoutView />
            </div>
        </div>
    );
}
