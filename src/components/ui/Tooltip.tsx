/**
 * Tooltip
 *
 * Reusable tooltip component for contextual help throughout the app.
 */

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TooltipProps {
    content: string;
    children: ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    showIcon?: boolean;
    maxWidth?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Tooltip({
    content,
    children,
    position = 'top',
    delay = 300,
    showIcon = false,
    maxWidth = 250,
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showTooltip = () => {
        timeoutRef.current = setTimeout(() => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setCoords(calculatePosition(rect, position));
            }
            setIsVisible(true);
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const positionStyles = getPositionStyles(position);

    return (
        <div
            ref={triggerRef}
            className="relative inline-flex items-center"
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onTouchStart={showTooltip}
            onTouchEnd={hideTooltip}
        >
            {children}

            {showIcon && (
                <HelpCircle
                    size={14}
                    className="ml-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-help"
                />
            )}

            {isVisible && (
                <div
                    className={`
                        fixed z-[9999] px-3 py-2 rounded-lg
                        bg-[var(--glass-surface)] border border-[var(--glass-border)]
                        shadow-lg backdrop-blur-md
                        text-sm text-[var(--text-primary)]
                        pointer-events-none
                        animate-in fade-in duration-150
                    `}
                    style={{
                        top: coords.y,
                        left: coords.x,
                        maxWidth: `${maxWidth}px`,
                        transform: positionStyles.transform,
                    }}
                >
                    {/* Arrow */}
                    <div
                        className={`
                            absolute w-2 h-2 bg-[var(--glass-surface)]
                            border-[var(--glass-border)]
                            ${positionStyles.arrow}
                        `}
                        style={{ transform: 'rotate(45deg)' }}
                    />

                    {content}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calculatePosition(rect: DOMRect, position: string): { x: number; y: number } {
    const margin = 8;

    switch (position) {
        case 'top':
            return {
                x: rect.left + rect.width / 2,
                y: rect.top - margin,
            };
        case 'bottom':
            return {
                x: rect.left + rect.width / 2,
                y: rect.bottom + margin,
            };
        case 'left':
            return {
                x: rect.left - margin,
                y: rect.top + rect.height / 2,
            };
        case 'right':
            return {
                x: rect.right + margin,
                y: rect.top + rect.height / 2,
            };
        default:
            return { x: rect.left, y: rect.top };
    }
}

function getPositionStyles(position: string): { transform: string; arrow: string } {
    switch (position) {
        case 'top':
            return {
                transform: 'translate(-50%, -100%)',
                arrow: 'left-1/2 -translate-x-1/2 -bottom-1 border-r border-b',
            };
        case 'bottom':
            return {
                transform: 'translate(-50%, 0)',
                arrow: 'left-1/2 -translate-x-1/2 -top-1 border-l border-t',
            };
        case 'left':
            return {
                transform: 'translate(-100%, -50%)',
                arrow: 'top-1/2 -translate-y-1/2 -right-1 border-t border-r',
            };
        case 'right':
            return {
                transform: 'translate(0, -50%)',
                arrow: 'top-1/2 -translate-y-1/2 -left-1 border-b border-l',
            };
        default:
            return { transform: '', arrow: '' };
    }
}

// ---------------------------------------------------------------------------
// Predefined Tooltips for Jagd-Agenten
// ---------------------------------------------------------------------------

export const JAGD_TOOLTIPS = {
    huntabilityScore: 'Jagdbarkeitswert (0-100) basierend auf Windstabilität, Niederschlag, Mondphase und Luftdruck',
    buechsenlicht: 'Gesetzliche Schießzeit basierend auf bürgerlicher Dämmerung',
    scentCone: 'Windbasierter Witterungskorridor — zeigt, wo Wild Sie wittern wird',
    bestWindows: 'Optimale Jagdzeiten basierend auf Wettervorhersage',
    expirationAlerts: 'Dokumentenablauf-Erinnerungen (30/14/7/1 Tage vorher)',
    coolingChain: 'EU-Lebensmittelsicherheit (VO 178/2002) — Rückverfolgbarkeit',
    emergencyBeacon: 'Bewegungserkennung + SMS an Notfallkontakte bei 30min Inaktivität',
    venisonPass: 'QR-Code für Wildbret-Rückverfolgbarkeit gemäß Tier-LMHV',
    standRecommendation: 'KI-basierte Empfehlung unter Berücksichtigung von Wind, Sichtungen und Frische',
    distanceRings: 'Entfernungsringe zur Schätzung der effektiven Schussdistanz',
    sessionTimer: 'Automatische Sitzzeit-Erfassung ab Jagdbeginn',
    redLightMode: 'Rotes Licht zur Erhaltung der Nachtsicht',
};

export default Tooltip;
