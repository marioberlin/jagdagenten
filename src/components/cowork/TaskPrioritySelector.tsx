/**
 * TaskPrioritySelector
 *
 * Component for selecting and displaying task priority levels.
 * Features: Priority chips, drag-to-reorder hint, priority badges.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUp,
    ArrowDown,
    Minus,
    ChevronDown,
    Flame,
} from 'lucide-react';

export type PriorityLevel = 'critical' | 'high' | 'normal' | 'low';

interface PriorityConfig {
    level: PriorityLevel;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    numericValue: number;
}

const PRIORITY_CONFIGS: PriorityConfig[] = [
    {
        level: 'critical',
        label: 'Critical',
        description: 'Run immediately, pause others',
        icon: <Flame size={14} />,
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        numericValue: 1,
    },
    {
        level: 'high',
        label: 'High',
        description: 'Run before normal tasks',
        icon: <ArrowUp size={14} />,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/30',
        numericValue: 2,
    },
    {
        level: 'normal',
        label: 'Normal',
        description: 'Standard queue order',
        icon: <Minus size={14} />,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
        numericValue: 5,
    },
    {
        level: 'low',
        label: 'Low',
        description: 'Run when queue is empty',
        icon: <ArrowDown size={14} />,
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/20',
        borderColor: 'border-gray-500/30',
        numericValue: 10,
    },
];

interface TaskPrioritySelectorProps {
    value: PriorityLevel;
    onChange: (priority: PriorityLevel) => void;
    disabled?: boolean;
    compact?: boolean;
    showLabel?: boolean;
}

export const TaskPrioritySelector: React.FC<TaskPrioritySelectorProps> = ({
    value,
    onChange,
    disabled = false,
    compact = false,
    showLabel = true,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedConfig = PRIORITY_CONFIGS.find(p => p.level === value) || PRIORITY_CONFIGS[2];

    const handleSelect = useCallback((priority: PriorityLevel) => {
        onChange(priority);
        setIsOpen(false);
    }, [onChange]);

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg
                           border transition-all
                           ${selectedConfig.bgColor} ${selectedConfig.borderColor}
                           ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}
                           ${compact ? 'px-2 py-1' : ''}`}
                type="button"
            >
                <span className={selectedConfig.color}>{selectedConfig.icon}</span>
                {showLabel && (
                    <span className={`text-sm font-medium ${selectedConfig.color}`}>
                        {selectedConfig.label}
                    </span>
                )}
                {!compact && (
                    <ChevronDown
                        size={14}
                        className={`${selectedConfig.color} transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Menu */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 mt-2 z-20
                                      min-w-[200px] rounded-xl bg-[#1a1a2e]
                                      border border-white/10 shadow-xl overflow-hidden"
                        >
                            <div className="p-1">
                                {PRIORITY_CONFIGS.map((config) => (
                                    <button
                                        key={config.level}
                                        onClick={() => handleSelect(config.level)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg
                                                   transition-colors
                                                   ${value === config.level
                                                ? `${config.bgColor} ${config.borderColor} border`
                                                : 'hover:bg-white/5'
                                            }`}
                                        type="button"
                                    >
                                        <span className={config.color}>{config.icon}</span>
                                        <div className="flex-1 text-left">
                                            <div className={`text-sm font-medium ${config.color}`}>
                                                {config.label}
                                            </div>
                                            <div className="text-xs text-white/40">
                                                {config.description}
                                            </div>
                                        </div>
                                        {value === config.level && (
                                            <div className={`w-2 h-2 rounded-full ${config.bgColor.replace('/20', '')}`} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

/**
 * PriorityBadge - Compact priority indicator
 */
interface PriorityBadgeProps {
    priority: PriorityLevel | number;
    size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
    priority,
    size = 'sm',
}) => {
    // Convert numeric to level
    let level: PriorityLevel;
    if (typeof priority === 'number') {
        if (priority <= 1) level = 'critical';
        else if (priority <= 3) level = 'high';
        else if (priority <= 7) level = 'normal';
        else level = 'low';
    } else {
        level = priority;
    }

    const config = PRIORITY_CONFIGS.find(p => p.level === level) || PRIORITY_CONFIGS[2];

    return (
        <div
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                       ${config.bgColor} ${config.color}
                       ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}
            title={`${config.label} priority`}
        >
            {config.icon}
            {size === 'md' && <span className="font-medium">{config.label}</span>}
        </div>
    );
};

/**
 * QuickPriorityButtons - Inline priority adjustment buttons
 */
interface QuickPriorityButtonsProps {
    currentPriority: number;
    onIncrease: () => void;
    onDecrease: () => void;
    disabled?: boolean;
}

export const QuickPriorityButtons: React.FC<QuickPriorityButtonsProps> = ({
    currentPriority,
    onIncrease,
    onDecrease,
    disabled = false,
}) => {
    return (
        <div className="flex items-center gap-1">
            <button
                onClick={onIncrease}
                disabled={disabled || currentPriority <= 1}
                className="p-1 rounded hover:bg-white/10 disabled:opacity-30
                          disabled:cursor-not-allowed transition-colors"
                title="Increase priority (move up in queue)"
                type="button"
            >
                <ArrowUp size={14} className="text-white/60" />
            </button>
            <span className="text-xs text-white/40 w-4 text-center">
                {currentPriority}
            </span>
            <button
                onClick={onDecrease}
                disabled={disabled}
                className="p-1 rounded hover:bg-white/10 disabled:opacity-30
                          disabled:cursor-not-allowed transition-colors"
                title="Decrease priority (move down in queue)"
                type="button"
            >
                <ArrowDown size={14} className="text-white/60" />
            </button>
        </div>
    );
};

/**
 * Convert priority level to numeric value
 */
export function priorityToNumber(level: PriorityLevel): number {
    const config = PRIORITY_CONFIGS.find(p => p.level === level);
    return config?.numericValue ?? 5;
}

/**
 * Convert numeric priority to level
 */
export function numberToPriority(num: number): PriorityLevel {
    if (num <= 1) return 'critical';
    if (num <= 3) return 'high';
    if (num <= 7) return 'normal';
    return 'low';
}

export default TaskPrioritySelector;
