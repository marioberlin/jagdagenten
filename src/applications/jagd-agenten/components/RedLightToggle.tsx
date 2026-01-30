/**
 * RedLightToggle
 * 
 * Toggle button for red light mode (night vision preservation).
 * Shows current state and can toggle manually or enable auto mode.
 */

import { useState } from 'react';
import { Moon, Sun, Eye } from 'lucide-react';
import { useRedLightMode } from '../hooks/useRedLightMode';

interface RedLightToggleProps {
    showSettings?: boolean;
    className?: string;
}

export function RedLightToggle({ showSettings = false, className = '' }: RedLightToggleProps) {
    const {
        isActive,
        isAutoActivate,
        sunTimes,
        toggle,
        setAutoActivate
    } = useRedLightMode();

    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className={`relative ${className}`}>
            {/* Main Toggle Button */}
            <button
                onClick={() => showSettings ? setShowMenu(!showMenu) : toggle()}
                className={`
          p-2 rounded-lg transition-colors flex items-center gap-2
          ${isActive
                        ? 'bg-red-900/30 text-red-400 border border-red-500/30'
                        : 'bg-[var(--glass-surface)] text-[var(--text-secondary)] border border-[var(--glass-border)]'
                    }
          hover:opacity-80
        `}
                title={isActive ? 'Rotlicht-Modus aktiv' : 'Rotlicht-Modus aktivieren'}
            >
                <Eye size={18} className={isActive ? 'text-red-400' : ''} />
                {showSettings && (
                    <span className="text-sm">
                        {isActive ? 'Rotlicht' : 'Normal'}
                    </span>
                )}
            </button>

            {/* Settings Dropdown */}
            {showSettings && showMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] shadow-lg z-50">
                    <div className="text-sm font-medium text-[var(--text-primary)] mb-3">
                        Rotlicht-Modus
                    </div>

                    {/* Manual Toggle */}
                    <button
                        onClick={() => { toggle(); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--glass-bg-primary)] transition-colors mb-2"
                    >
                        <Eye size={18} className={isActive ? 'text-red-400' : 'text-[var(--text-secondary)]'} />
                        <span className="text-sm text-[var(--text-primary)]">
                            {isActive ? 'Deaktivieren' : 'Aktivieren'}
                        </span>
                    </button>

                    {/* Auto Mode Toggle */}
                    <div className="flex items-center justify-between p-2 border-t border-[var(--glass-border)]">
                        <div className="flex items-center gap-2">
                            <Moon size={16} className="text-[var(--text-secondary)]" />
                            <span className="text-sm text-[var(--text-secondary)]">Auto bei Dämmerung</span>
                        </div>
                        <button
                            onClick={() => setAutoActivate(!isAutoActivate)}
                            className={`
                w-10 h-5 rounded-full transition-colors relative
                ${isAutoActivate ? 'bg-red-500' : 'bg-gray-600'}
              `}
                        >
                            <div
                                className={`
                  w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform
                  ${isAutoActivate ? 'translate-x-5' : 'translate-x-0.5'}
                `}
                            />
                        </button>
                    </div>

                    {/* Sun Times Info */}
                    {isAutoActivate && sunTimes && (
                        <div className="mt-2 pt-2 border-t border-[var(--glass-border)] text-xs text-[var(--text-tertiary)]">
                            <div className="flex items-center gap-2 mb-1">
                                <Sun size={12} />
                                <span>Dämmerung: {sunTimes.civilDusk.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Moon size={12} />
                                <span>Morgen: {sunTimes.civilDawn.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default RedLightToggle;
