import React, { useState, useRef, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { GlassContainer } from '../primitives/GlassContainer';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SelectOption {
    label: string;
    value: string;
}

export interface GlassSelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
    options: SelectOption[];
    placeholder?: string;
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
}

export const GlassSelect = React.forwardRef<HTMLDivElement, GlassSelectProps>(
    ({ options, placeholder = "Select option", defaultValue, value: controlledValue, onValueChange, className, disabled, ...props }, ref) => {
        const [isOpen, setIsOpen] = useState(false);
        const [internalValue, setInternalValue] = useState(defaultValue);
        const containerRef = useRef<HTMLDivElement>(null);

        const selectedValue = controlledValue !== undefined ? controlledValue : internalValue;
        const selectedLabel = options.find(opt => opt.value === selectedValue)?.label || placeholder;

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        const { height, opacity } = useSpring({
            height: isOpen ? Math.min(options.length * 40 + 12, 300) : 0,
            opacity: isOpen ? 1 : 0,
            config: { tension: 350, friction: 30 }
        });

        const handleSelect = (value: string) => {
            if (disabled) return;
            setInternalValue(value);
            onValueChange?.(value);
            setIsOpen(false);
        };

        const handleToggle = () => {
            if (disabled) return;
            setIsOpen(!isOpen);
        };

        return (
            <div
                ref={(node: HTMLDivElement | null) => {
                    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
                    if (typeof ref === 'function') ref(node);
                    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
                }}
                className={cn("relative w-full", disabled && "opacity-50 pointer-events-none", className)}
                {...props}
            >
                {/* Trigger */}
                <GlassContainer
                    interactive
                    material="regular"
                    className={cn(
                        "px-4 h-11 cursor-pointer rounded-xl border border-[var(--glass-border)] hover:border-[var(--glass-border)] transition-colors",
                        isOpen && "border-[var(--glass-border)] !bg-glass-surface-hover"
                    )}
                    onClick={handleToggle}
                >
                    <div className="flex items-center justify-between w-full h-full">
                        <span className={cn("text-sm font-medium", selectedValue ? "text-primary" : "text-secondary")}>
                            {selectedLabel}
                        </span>
                        <ChevronDown size={14} className={cn("text-secondary transition-transform", isOpen && "rotate-180")} />
                    </div>
                </GlassContainer>

                {/* Dropdown Menu */}
                <div className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden rounded-xl">
                    <animated.div style={{ height, opacity }} className="overflow-hidden">
                        <GlassContainer material="thick" className="p-1.5 h-full overflow-y-auto custom-scrollbar !rounded-none">
                            {options.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={cn(
                                        "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer hover:bg-glass-surface-hover transition-colors group",
                                        selectedValue === option.value && "bg-glass-surface"
                                    )}
                                >
                                    <span className={cn(
                                        "font-medium transition-colors",
                                        selectedValue === option.value ? "text-primary" : "text-secondary group-hover:text-primary"
                                    )}>
                                        {option.label}
                                    </span>
                                    {selectedValue === option.value && (
                                        <Check size={14} className="text-accent" />
                                    )}
                                </div>
                            ))}
                        </GlassContainer>
                    </animated.div>
                </div>
            </div>
        );
    }
);

GlassSelect.displayName = 'GlassSelect';
