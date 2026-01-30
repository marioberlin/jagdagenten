/**
 * HuntModeToggle
 *
 * Quick toggle button for Hunt Mode (night vision theme).
 * Shows in the cockpit header or menu bar.
 */

import { Moon, Sun } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';

export default function HuntModeToggle() {
    const huntModeEnabled = useSettingsStore((s) => s.huntModeEnabled);
    const setHuntMode = useSettingsStore((s) => s.setHuntMode);

    const toggle = () => {
        const newValue = !huntModeEnabled;
        setHuntMode(newValue);

        // Haptic feedback if available
        if ('vibrate' in navigator) {
            navigator.vibrate(newValue ? [50, 30, 50] : [30]);
        }
    };

    return (
        <button
            onClick={toggle}
            className={`
        flex items-center gap-2 px-3 py-2 rounded-xl
        transition-all duration-300 ease-out
        ${huntModeEnabled
                    ? 'bg-[#8B2500]/30 border border-[#8B2500]/50 text-[#FFB4A0]'
                    : 'bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-secondary)]'
                }
        hover:opacity-90
      `}
            title={huntModeEnabled ? 'Jagdmodus deaktivieren' : 'Jagdmodus aktivieren'}
        >
            {huntModeEnabled ? (
                <>
                    <Moon size={16} className="text-[#FFB4A0]" />
                    <span className="text-xs font-medium hidden sm:inline">Jagdmodus</span>
                </>
            ) : (
                <>
                    <Sun size={16} />
                    <span className="text-xs font-medium hidden sm:inline">Normal</span>
                </>
            )}
        </button>
    );
}
