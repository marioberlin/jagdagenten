/**
 * RightZone
 * 
 * Right portion of the menu bar containing:
 * - App-registered status icons
 * - Privacy indicators
 * - Agent status
 * - Theme mode toggle
 * - Control center button
 */
import React, { useState } from 'react';
import { Sun, Moon, Settings, Zap, AlertTriangle, Bell } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useMenuBar } from '@/context/MenuBarContext';
import { useTheme } from '@/hooks/useTheme';
import { ControlCenterPanel } from './ControlCenterPanel';

export const RightZone: React.FC = () => {
    const { state } = useMenuBar();
    const { theme, toggleTheme } = useTheme();
    const [controlCenterOpen, setControlCenterOpen] = useState(false);

    // Privacy indicator colors following Apple HIG
    const privacyColors = {
        microphone: 'var(--system-orange)',
        camera: 'var(--system-green)',
        audio: 'var(--system-purple)',
        location: 'var(--system-blue)',
    };

    // Check if any privacy indicator is active
    const activePrivacy = Object.entries(state.privacyIndicators)
        .filter(([, active]) => active)
        .map(([type]) => type as keyof typeof privacyColors);

    const handleThemeToggle = () => {
        toggleTheme();
    };

    return (
        <div className="flex items-center gap-1">
            {/* Privacy Indicators */}
            {activePrivacy.length > 0 && (
                <div className="flex items-center gap-0.5 mr-1">
                    {activePrivacy.map(type => (
                        <div
                            key={type}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: privacyColors[type] }}
                            title={`${type.charAt(0).toUpperCase() + type.slice(1)} in use`}
                        />
                    ))}
                </div>
            )}

            {/* App-registered Status Icons */}
            {state.statusIcons.map(iconDef => {
                const Icon = iconDef.icon;
                return (
                    <button
                        key={iconDef.id}
                        className={cn(
                            "flex items-center justify-center w-5 h-5 rounded-[4px]",
                            "transition-colors duration-75",
                            "hover:bg-[var(--glass-surface-hover)]"
                        )}
                        onClick={iconDef.onClick}
                        title={iconDef.tooltip}
                    >
                        <Icon
                            size={14}
                            style={{ color: iconDef.color || 'var(--glass-text-secondary)' }}
                        />
                    </button>
                );
            })}

            {/* Agent Status (always visible) */}
            <AgentStatusIcon />

            {/* Notification Badge */}
            <button
                className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-[4px]",
                    "transition-colors duration-75",
                    "hover:bg-[var(--glass-surface-hover)]"
                )}
                title="Notifications"
            >
                <Bell size={14} className="text-[var(--glass-text-secondary)]" />
            </button>

            {/* Theme Mode Toggle */}
            <button
                className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-[4px]",
                    "transition-colors duration-75",
                    "hover:bg-[var(--glass-surface-hover)]"
                )}
                onClick={handleThemeToggle}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {theme === 'dark' ? (
                    <Moon size={14} className="text-[var(--glass-text-secondary)]" />
                ) : (
                    <Sun size={14} className="text-[var(--glass-text-secondary)]" />
                )}
            </button>

            {/* Control Center */}
            <div className="relative">
                <button
                    className={cn(
                        "flex items-center justify-center w-5 h-5 rounded-[4px]",
                        "transition-colors duration-75",
                        controlCenterOpen && "bg-[var(--glass-surface-active)]",
                        !controlCenterOpen && "hover:bg-[var(--glass-surface-hover)]"
                    )}
                    onClick={() => setControlCenterOpen(!controlCenterOpen)}
                    title="Control Center"
                    aria-label="Control Center"
                    aria-expanded={controlCenterOpen}
                >
                    <Settings size={14} className="text-[var(--glass-text-secondary)]" />
                </button>
                <ControlCenterPanel
                    isOpen={controlCenterOpen}
                    onClose={() => setControlCenterOpen(false)}
                />
            </div>
        </div>
    );
};

/**
 * Agent Status Icon
 * Shows the current status of the A2A agent system
 */
const AgentStatusIcon: React.FC = () => {
    // TODO: Connect to actual A2A agent state
    const [status] = useState<'idle' | 'running' | 'error'>('idle');

    const statusConfig = {
        idle: {
            icon: Zap,
            color: 'var(--glass-text-tertiary)',
            tooltip: 'Agents: Idle',
        },
        running: {
            icon: Zap,
            color: 'var(--color-accent)',
            tooltip: 'Agents: Running',
        },
        error: {
            icon: AlertTriangle,
            color: 'var(--system-red)',
            tooltip: 'Agents: Error',
        },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <button
            className={cn(
                "flex items-center justify-center w-5 h-5 rounded-[4px]",
                "transition-colors duration-75",
                "hover:bg-[var(--glass-surface-hover)]",
                status === 'running' && "animate-pulse"
            )}
            title={config.tooltip}
        >
            <Icon size={14} style={{ color: config.color }} />
        </button>
    );
};

RightZone.displayName = 'RightZone';
AgentStatusIcon.displayName = 'AgentStatusIcon';
