import JournalView from '../jagd-agenten/components/JournalView';

export default function JournalApp() {
    return (
        <div
            className="relative h-full w-full overflow-hidden"
            style={{
                backgroundImage: 'url(/backgrounds/apps/journal.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Content */}
            <div className="relative h-full w-full overflow-auto">
                <JournalView />
            </div>
        </div>
    );
}
