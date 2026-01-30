import { GlobalAdminDashboard } from '../jagd-agenten/components/admin';

export default function VerwaltungApp() {
    return (
        <div
            className="relative h-full w-full overflow-hidden"
            style={{
                backgroundImage: 'url(/backgrounds/apps/verwaltung.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Content */}
            <div className="relative h-full w-full overflow-auto">
                <GlobalAdminDashboard />
            </div>
        </div>
    );
}
