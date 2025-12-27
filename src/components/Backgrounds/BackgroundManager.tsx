import { useTheme } from '../../hooks/useTheme';
import { Backgrounds } from './BackgroundRegistry';

export const BackgroundManager = () => {
    const { activeBackgroundId, overlayEnabled, overlayIntensity, theme } = useTheme();

    const activeBackground = Backgrounds.find(bg => bg.id === activeBackgroundId) || Backgrounds[0];

    // Calculate overlay opacity based on intensity (0-100 -> 0-0.7 range for better visibility)
    const overlayOpacity = (overlayIntensity / 100) * 0.7;

    // Theme-aware overlay: dark scrim in dark mode, frosted glass in light mode
    const overlayStyle = theme === 'dark'
        ? { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }
        : {
            backgroundColor: `rgba(255, 255, 255, ${overlayOpacity})`,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
        };

    return (
        <>
            {/* Background Layer */}
            <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none transition-opacity duration-1000">
                {activeBackground.type === 'element' && activeBackground.component && (
                    <activeBackground.component />
                )}
                {activeBackground.type === 'image' && activeBackground.src && (
                    <img
                        src={activeBackground.src}
                        alt="Background"
                        className="w-full h-full object-cover animate-fade-in"
                    />
                )}
                {activeBackground.type === 'video' && activeBackground.videoUrl && (
                    <iframe
                        src={activeBackground.videoUrl}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        frameBorder="0"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        title="Video Background"
                        style={{
                            transform: 'scale(1.5)',
                            minWidth: '177.77vh',
                            minHeight: '56.25vw',
                        }}
                    />
                )}
                {/* Theme-aware overlay: dark scrim in dark mode, frosted glass in light mode */}
                {/* Inside background container to properly overlay the wallpaper content */}
                {overlayEnabled && (
                    <div
                        className="absolute inset-0 z-10 pointer-events-none transition-all duration-500"
                        style={overlayStyle}
                    />
                )}
            </div>
        </>
    );
};
