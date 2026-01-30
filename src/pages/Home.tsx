/**
 * Home.tsx — Jagd-Agenten Home Page
 *
 * Renders the Daily Cockpit as the main home experience.
 * This is the first screen hunters see when opening the app.
 */

import DailyCockpit from '@/applications/jagd-agenten/components/DailyCockpit';
import { useRevierSettingsStore } from '@/stores/useRevierSettingsStore';

export const Home = () => {
    const { settings, getBackgroundUrl } = useRevierSettingsStore();
    const backgroundUrl = getBackgroundUrl();

    return (
        <div
            className="relative min-h-full w-full"
            style={{
                backgroundImage: `url(${backgroundUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            {/* Dark overlay for better text readability - opacity from settings */}
            <div
                className="absolute inset-0"
                style={{ backgroundColor: `rgba(0, 0, 0, ${settings.darkOverlayOpacity / 100})` }}
            />

            {/* Content with 5% horizontal margin */}
            <div
                className="relative z-10 py-6"
                style={{
                    marginLeft: '5%',
                    marginRight: '5%',
                }}
            >
                <DailyCockpit />
            </div>
        </div>
    );
};
