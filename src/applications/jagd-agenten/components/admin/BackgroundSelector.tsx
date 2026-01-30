/**
 * Background Selector Component
 *
 * Allows Jagdpächter to select a background image for their revier.
 * Part of the admin settings panel.
 */

import { Check, Image, Palette } from 'lucide-react';
import { useRevierSettingsStore } from '@/stores/useRevierSettingsStore';

export function BackgroundSelector() {
    const {
        settings,
        availableBackgrounds,
        setBackground,
        setDarkOverlay,
    } = useRevierSettingsStore();

    return (
        <div className="p-5 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] space-y-4">
            <div className="flex items-center gap-2">
                <Image className="w-5 h-5 text-green-400" />
                <h3 className="font-semibold text-lg">Hintergrundbild</h3>
            </div>

            <p className="text-sm text-[var(--text-secondary)]">
                Wählen Sie ein Hintergrundbild für Ihr Revier-Dashboard.
            </p>

            {/* Background Grid */}
            <div className="grid grid-cols-2 gap-3">
                {availableBackgrounds.map((bg) => (
                    <button
                        key={bg.id}
                        onClick={() => setBackground(bg.id)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all ${settings.backgroundId === bg.id
                            ? 'border-green-500 ring-2 ring-green-500/30'
                            : 'border-transparent hover:border-white/20'
                            }`}
                    >
                        <img
                            src={bg.path}
                            alt={bg.name}
                            className="w-full h-24 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                            <p className="text-sm font-medium text-white truncate">{bg.name}</p>
                            <p className="text-xs text-white/70 truncate">{bg.description}</p>
                        </div>
                        {settings.backgroundId === bg.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <div className="absolute top-2 left-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/50 text-white/80">
                                {bg.season === 'winter' && '❄️ Winter'}
                                {bg.season === 'autumn' && '🍂 Herbst'}
                                {bg.season === 'summer' && '☀️ Sommer'}
                                {bg.season === 'spring' && '🌸 Frühling'}
                                {bg.season === 'all' && '🌲 Ganzjährig'}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Dark Overlay Slider */}
            <div className="pt-4 border-t border-[var(--glass-border)]">
                <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-4 h-4 text-[var(--text-secondary)]" />
                    <span className="text-sm font-medium">Abdunkelung</span>
                    <span className="ml-auto text-sm text-[var(--text-secondary)]">
                        {settings.darkOverlayOpacity}%
                    </span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="80"
                    value={settings.darkOverlayOpacity}
                    onChange={(e) => setDarkOverlay(parseInt(e.target.value))}
                    className="w-full h-2 bg-[var(--glass-border)] rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Passt die Lesbarkeit des Textes über dem Hintergrund an.
                </p>
            </div>
        </div>
    );
}
