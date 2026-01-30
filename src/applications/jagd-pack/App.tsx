import { PackDashboard } from '../jagd-agenten/components/PackDashboard';

export default function PackApp() {
    return (
        <div
            className="relative h-full w-full overflow-hidden"
            style={{
                backgroundImage: 'url(/backgrounds/apps/pack.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Content */}
            <div className="relative h-full w-full overflow-auto">
                <PackDashboard />
            </div>
        </div>
    );
}
