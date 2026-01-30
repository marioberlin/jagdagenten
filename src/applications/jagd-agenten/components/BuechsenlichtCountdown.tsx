/**
 * BuechsenlichtCountdown
 * 
 * Real-time countdown timer showing time until legal shooting light begins/ends.
 * Uses civil twilight times from the conditions data.
 */

import { useState, useEffect, useMemo } from 'react';
import { Sunrise, Sunset, Timer } from 'lucide-react';

interface TwilightWindow {
    civilDawn: string;  // HH:MM format
    sunrise: string;
    sunset: string;
    civilDusk: string;  // HH:MM format
}

interface BuechsenlichtCountdownProps {
    twilight: TwilightWindow | null;
    className?: string;
}

/**
 * Parse HH:MM time string to today's Date object
 */
function parseTimeToday(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    now.setHours(hours, minutes, 0, 0);
    return now;
}

/**
 * Format duration in seconds to HH:MM:SS or MM:SS
 */
function formatDuration(seconds: number): string {
    if (seconds < 0) return '00:00';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

type ShootingPhase =
    | 'before_dawn'      // Before civil dawn - no shooting
    | 'morning_light'    // Civil dawn to sunrise - shooting allowed
    | 'day'              // Full daylight - shooting allowed
    | 'evening_light'    // Sunset to civil dusk - shooting allowed
    | 'night';           // After civil dusk - no shooting

interface PhaseInfo {
    phase: ShootingPhase;
    canShoot: boolean;
    label: string;
    sublabel: string;
    countdownTo: Date | null;
    icon: typeof Sunrise;
    color: string;
}

function getPhaseInfo(now: Date, twilight: TwilightWindow): PhaseInfo {
    const civilDawn = parseTimeToday(twilight.civilDawn);
    const sunrise = parseTimeToday(twilight.sunrise);
    const sunset = parseTimeToday(twilight.sunset);
    const civilDusk = parseTimeToday(twilight.civilDusk);

    if (now < civilDawn) {
        return {
            phase: 'before_dawn',
            canShoot: false,
            label: 'Büchsenlicht beginnt',
            sublabel: `um ${twilight.civilDawn}`,
            countdownTo: civilDawn,
            icon: Sunrise,
            color: 'var(--status-warning, #f59e0b)',
        };
    }

    if (now < sunrise) {
        return {
            phase: 'morning_light',
            canShoot: true,
            label: 'Büchsenlicht aktiv',
            sublabel: 'Morgendämmerung',
            countdownTo: sunrise,
            icon: Sunrise,
            color: 'var(--glass-accent, #22c55e)',
        };
    }

    if (now < sunset) {
        return {
            phase: 'day',
            canShoot: true,
            label: 'Büchsenlicht aktiv',
            sublabel: 'Tageslicht',
            countdownTo: sunset,
            icon: Sunset,
            color: 'var(--glass-accent, #22c55e)',
        };
    }

    if (now < civilDusk) {
        return {
            phase: 'evening_light',
            canShoot: true,
            label: 'Büchsenlicht aktiv',
            sublabel: 'Abenddämmerung',
            countdownTo: civilDusk,
            icon: Sunset,
            color: 'var(--glass-accent, #22c55e)',
        };
    }

    // After civil dusk - calculate tomorrow's dawn
    const tomorrowDawn = new Date(civilDawn);
    tomorrowDawn.setDate(tomorrowDawn.getDate() + 1);

    return {
        phase: 'night',
        canShoot: false,
        label: 'Nächstes Büchsenlicht',
        sublabel: `morgen ${twilight.civilDawn}`,
        countdownTo: tomorrowDawn,
        icon: Timer,
        color: 'var(--status-error, #ef4444)',
    };
}

export function BuechsenlichtCountdown({ twilight, className = '' }: BuechsenlichtCountdownProps) {
    const [now, setNow] = useState(() => new Date());

    // Update every second
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const phaseInfo = useMemo(() => {
        if (!twilight) return null;
        return getPhaseInfo(now, twilight);
    }, [now, twilight]);

    if (!twilight || !phaseInfo) {
        return (
            <div className={`p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] ${className}`}>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Timer size={20} />
                    <span className="text-sm">Lade Büchsenlicht...</span>
                </div>
            </div>
        );
    }

    const { canShoot, label, sublabel, countdownTo, icon: Icon, color } = phaseInfo;

    // Calculate countdown
    const secondsRemaining = countdownTo
        ? Math.max(0, Math.floor((countdownTo.getTime() - now.getTime()) / 1000))
        : 0;

    return (
        <div
            className={`p-5 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] ${className}`}
            style={{ borderColor: canShoot ? color : undefined }}
        >
            <div className="flex items-center gap-2 mb-3">
                <Icon size={18} style={{ color }} />
                <h3 className="font-semibold text-sm text-[var(--text-secondary)] uppercase tracking-wide">
                    Büchsenlicht
                </h3>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span
                        className="text-lg font-bold"
                        style={{ color }}
                    >
                        {label}
                    </span>
                    <span className="text-sm text-[var(--text-secondary)]">
                        {sublabel}
                    </span>
                </div>

                <div className="text-right">
                    <div
                        className="text-3xl font-mono font-bold tabular-nums"
                        style={{ color }}
                    >
                        {formatDuration(secondsRemaining)}
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">
                        {canShoot ? 'verbleibend' : 'bis Start'}
                    </span>
                </div>
            </div>

            {/* Status indicator */}
            <div
                className="mt-3 px-3 py-1.5 rounded-lg text-center text-sm font-medium"
                style={{
                    backgroundColor: `${color}20`,
                    color: color,
                }}
            >
                {canShoot ? '✓ Schießen erlaubt' : '✗ Schießen nicht erlaubt'}
            </div>
        </div>
    );
}

export default BuechsenlichtCountdown;
