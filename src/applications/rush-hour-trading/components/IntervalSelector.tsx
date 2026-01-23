import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';

interface IntervalOption {
    value: string;
    label: string;
    description: string;
}

interface IntervalSelectorProps {
    value: string;
    onChange: (interval: string) => void;
    className?: string;
}

// All available Binance intervals, organized by category
const INTERVALS: { category: string; options: IntervalOption[] }[] = [
    {
        category: 'Short-term',
        options: [
            { value: '1m', label: '1m', description: '1 Minute' },
            { value: '5m', label: '5m', description: '5 Minutes' },
            { value: '15m', label: '15m', description: '15 Minutes' },
            { value: '30m', label: '30m', description: '30 Minutes' },
        ]
    },
    {
        category: 'Medium-term',
        options: [
            { value: '1h', label: '1H', description: '1 Hour' },
            { value: '4h', label: '4H', description: '4 Hours' },
            { value: '6h', label: '6H', description: '6 Hours' },
            { value: '12h', label: '12H', description: '12 Hours' },
        ]
    },
    {
        category: 'Long-term',
        options: [
            { value: '1d', label: '1D', description: '1 Day' },
            { value: '1w', label: '1W', description: '1 Week' },
            { value: '1M', label: '1M', description: '1 Month' },
        ]
    }
];

// Flatten for easy lookup
const ALL_INTERVALS = INTERVALS.flatMap(g => g.options);

export const IntervalSelector: React.FC<IntervalSelectorProps> = ({
    value,
    onChange,
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentInterval = ALL_INTERVALS.find(i => i.value === value);
    const displayLabel = currentInterval?.label || value;

    const handleSelect = (interval: string) => {
        onChange(interval);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg",
                    "bg-glass-surface border border-glass-border",
                    "hover:bg-white/10 transition-colors",
                    "text-white font-mono text-sm",
                    isOpen && "ring-2 ring-primary/50"
                )}
            >
                <Clock className="w-3.5 h-3.5 text-secondary" />
                <span>{displayLabel}</span>
                <ChevronDown className={cn(
                    "w-3.5 h-3.5 text-secondary transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-glass-panel/95 backdrop-blur-xl rounded-xl border border-glass-border shadow-2xl z-50 overflow-hidden">
                    {INTERVALS.map((group, gi) => (
                        <div key={gi}>
                            <div className="px-3 py-1.5 text-[10px] text-white/40 uppercase tracking-wider font-medium bg-black/20">
                                {group.category}
                            </div>
                            {group.options.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 text-left",
                                        "hover:bg-white/5 transition-colors",
                                        value === opt.value && "bg-primary/10"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "font-mono font-medium",
                                            value === opt.value ? "text-primary" : "text-white"
                                        )}>
                                            {opt.label}
                                        </span>
                                        <span className="text-xs text-secondary">
                                            {opt.description}
                                        </span>
                                    </div>
                                    {value === opt.value && (
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

IntervalSelector.displayName = 'IntervalSelector';
