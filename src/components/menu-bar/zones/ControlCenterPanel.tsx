/**
 * ControlCenterPanel
 * 
 * Dropdown panel with quick settings accessed from the right zone.
 * Features:
 * - Theme toggle (Light/Dark/Auto)
 * - Focus mode toggle
 * - Dock visibility toggle
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor, Eye, EyeOff, Focus } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { useTheme } from '@/hooks/useTheme';

interface ControlCenterPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ControlCenterPanel: React.FC<ControlCenterPanelProps> = ({
    isOpen,
    onClose,
}) => {
    const { theme, toggleTheme } = useTheme();

    const themeOptions = [
        { id: 'light', label: 'Light', icon: Sun },
        { id: 'dark', label: 'Dark', icon: Moon },
        { id: 'auto', label: 'Auto', icon: Monitor },
    ] as const;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    data-menu-dropdown
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute top-full right-0 mt-1 z-50"
                >
                    <GlassContainer
                        material="regular"
                        className="w-64 p-3 shadow-xl rounded-xl"
                    >
                        {/* Theme Section */}
                        <div className="mb-3">
                            <div className="text-[11px] font-medium text-[var(--glass-text-tertiary)] uppercase tracking-wider mb-2">
                                Appearance
                            </div>
                            <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--glass-surface)]">
                                {themeOptions.map(opt => {
                                    const Icon = opt.icon;
                                    const isActive = theme === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md",
                                                "text-[12px] font-medium transition-all duration-150",
                                                isActive
                                                    ? "bg-[var(--color-accent)] text-white shadow-sm"
                                                    : "text-[var(--glass-text-secondary)] hover:bg-[var(--glass-surface-hover)]"
                                            )}
                                            onClick={() => {
                                                // Only toggle if switching to a different mode
                                                if ((opt.id === 'light' && theme === 'dark') ||
                                                    (opt.id === 'dark' && theme === 'light')) {
                                                    toggleTheme();
                                                }
                                            }}
                                        >
                                            <Icon size={12} />
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-[var(--glass-border)] my-2" />

                        {/* Focus Mode */}
                        <ControlToggleRow
                            icon={Focus}
                            label="Focus Mode"
                            description="Reduce distractions"
                            enabled={false}
                            onChange={() => { }}
                        />

                        {/* Dock Visibility */}
                        <ControlToggleRow
                            icon={Eye}
                            iconOff={EyeOff}
                            label="Show Dock"
                            description="Toggle with ⇧Space"
                            enabled={true}
                            onChange={() => { }}
                        />
                    </GlassContainer>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

interface ControlToggleRowProps {
    icon: React.ElementType;
    iconOff?: React.ElementType;
    label: string;
    description?: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}

const ControlToggleRow: React.FC<ControlToggleRowProps> = ({
    icon: Icon,
    iconOff: IconOff,
    label,
    description,
    enabled,
    onChange,
}) => {
    const DisplayIcon = enabled ? Icon : (IconOff || Icon);

    return (
        <button
            className={cn(
                "w-full flex items-center justify-between gap-3 p-2 rounded-lg",
                "transition-colors duration-75",
                "hover:bg-[var(--glass-surface-hover)]"
            )}
            onClick={() => onChange(!enabled)}
        >
            <div className="flex items-center gap-2.5">
                <div
                    className={cn(
                        "flex items-center justify-center w-7 h-7 rounded-lg",
                        enabled ? "bg-[var(--color-accent)]" : "bg-[var(--glass-surface)]"
                    )}
                >
                    <DisplayIcon
                        size={14}
                        className={enabled ? "text-white" : "text-[var(--glass-text-secondary)]"}
                    />
                </div>
                <div className="text-left">
                    <div className="text-[13px] font-medium text-[var(--glass-text-primary)]">
                        {label}
                    </div>
                    {description && (
                        <div className="text-[11px] text-[var(--glass-text-tertiary)]">
                            {description}
                        </div>
                    )}
                </div>
            </div>

            {/* Toggle Switch */}
            <div
                className={cn(
                    "w-8 h-5 rounded-full p-0.5 transition-colors duration-200",
                    enabled ? "bg-[var(--color-accent)]" : "bg-[var(--glass-surface-active)]"
                )}
            >
                <div
                    className={cn(
                        "w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                        enabled ? "translate-x-3" : "translate-x-0"
                    )}
                />
            </div>
        </button>
    );
};

ControlCenterPanel.displayName = 'ControlCenterPanel';
ControlToggleRow.displayName = 'ControlToggleRow';
