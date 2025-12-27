import { useState, useRef, useEffect, forwardRef } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { cn } from '@/utils/cn';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

interface GlassTimePickerProps {
    value?: string; // HH:MM format
    defaultValue?: string;
    onChange?: (value: string) => void;
    use24Hour?: boolean;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
}

export const GlassTimePicker = forwardRef<HTMLDivElement, GlassTimePickerProps>(({
    value: controlledValue,
    defaultValue = '12:00',
    onChange,
    use24Hour = false,
    disabled = false,
    className,
    placeholder = 'Select time',
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse initial value
    const parseTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return { hours: h || 12, minutes: m || 0 };
    };

    const [internalTime, setInternalTime] = useState(() => parseTime(defaultValue));
    const time = controlledValue !== undefined ? parseTime(controlledValue) : internalTime;
    const [period, setPeriod] = useState<'AM' | 'PM'>(() => {
        const h = parseTime(defaultValue).hours;
        return h >= 12 ? 'PM' : 'AM';
    });

    // Convert to display hours (12-hour format)
    const displayHours = use24Hour ? time.hours : (time.hours % 12 || 12);
    const displayPeriod = time.hours >= 12 ? 'PM' : 'AM';

    // Format for display
    const formatDisplay = () => {
        const h = displayHours.toString().padStart(2, '0');
        const m = time.minutes.toString().padStart(2, '0');
        if (use24Hour) {
            return `${h}:${m}`;
        }
        return `${h}:${m} ${displayPeriod}`;
    };

    // Format for value
    const formatValue = (hours: number, minutes: number) => {
        const h = hours.toString().padStart(2, '0');
        const m = minutes.toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    // Update time
    const updateTime = (hours: number, minutes: number) => {
        setInternalTime({ hours, minutes });
        onChange?.(formatValue(hours, minutes));
    };

    // Handle hour change
    const incrementHours = () => {
        const maxHours = use24Hour ? 23 : 12;
        let newHours = (displayHours % maxHours) + 1;
        if (!use24Hour) {
            newHours = newHours > 12 ? 1 : newHours;
            // Convert to 24h for storage
            if (period === 'PM' && newHours !== 12) {
                newHours += 12;
            } else if (period === 'AM' && newHours === 12) {
                newHours = 0;
            }
        }
        updateTime(newHours, time.minutes);
    };

    const decrementHours = () => {
        let newHours = displayHours - 1;
        if (newHours < (use24Hour ? 0 : 1)) {
            newHours = use24Hour ? 23 : 12;
        }
        if (!use24Hour) {
            // Convert to 24h for storage
            if (period === 'PM' && newHours !== 12) {
                newHours += 12;
            } else if (period === 'AM' && newHours === 12) {
                newHours = 0;
            }
        }
        updateTime(newHours, time.minutes);
    };

    // Handle minute change
    const incrementMinutes = () => {
        const newMinutes = (time.minutes + 1) % 60;
        updateTime(time.hours, newMinutes);
    };

    const decrementMinutes = () => {
        const newMinutes = time.minutes - 1;
        updateTime(time.hours, newMinutes < 0 ? 59 : newMinutes);
    };

    // Handle period toggle
    const togglePeriod = () => {
        const newPeriod = period === 'AM' ? 'PM' : 'AM';
        setPeriod(newPeriod);
        let newHours = time.hours;
        if (newPeriod === 'PM' && time.hours < 12) {
            newHours += 12;
        } else if (newPeriod === 'AM' && time.hours >= 12) {
            newHours -= 12;
        }
        updateTime(newHours, time.minutes);
    };

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

    return (
        <div ref={ref} className={cn("relative inline-block", className)}>
            {/* Trigger */}
            <GlassContainer
                as="button"
                type="button"
                material="thin"
                border
                interactive={!disabled}
                enableLiquid={false}
                className={cn(
                    "px-4 py-2.5 min-w-[160px] text-left",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <div className="flex items-center gap-3 w-full h-full">
                    <Clock size={18} className="text-secondary flex-shrink-0" />
                    <span className="flex-1 text-primary leading-none">
                        {formatDisplay() || placeholder}
                    </span>
                </div>
            </GlassContainer>

            {/* Dropdown */}
            {isOpen && (
                <GlassContainer
                    material="thick"
                    border
                    className="absolute top-full left-0 mt-2 p-4 z-50 min-w-[200px] shadow-xl"
                >
                    <div className="flex items-center justify-center gap-4">
                        {/* Hours */}
                        <div className="flex flex-col items-center gap-1">
                            <GlassButton
                                variant="ghost"
                                size="sm"
                                onClick={incrementHours}
                                className="p-1 h-8 w-8"
                            >
                                <ChevronUp size={16} />
                            </GlassButton>
                            <span className="text-2xl font-bold text-primary w-12 text-center tabular-nums">
                                {displayHours.toString().padStart(2, '0')}
                            </span>
                            <GlassButton
                                variant="ghost"
                                size="sm"
                                onClick={decrementHours}
                                className="p-1 h-8 w-8"
                            >
                                <ChevronDown size={16} />
                            </GlassButton>
                        </div>

                        <span className="text-2xl font-bold text-secondary">:</span>

                        {/* Minutes */}
                        <div className="flex flex-col items-center gap-1">
                            <GlassButton
                                variant="ghost"
                                size="sm"
                                onClick={incrementMinutes}
                                className="p-1 h-8 w-8"
                            >
                                <ChevronUp size={16} />
                            </GlassButton>
                            <span className="text-2xl font-bold text-primary w-12 text-center tabular-nums">
                                {time.minutes.toString().padStart(2, '0')}
                            </span>
                            <GlassButton
                                variant="ghost"
                                size="sm"
                                onClick={decrementMinutes}
                                className="p-1 h-8 w-8"
                            >
                                <ChevronDown size={16} />
                            </GlassButton>
                        </div>

                        {/* AM/PM Toggle */}
                        {!use24Hour && (
                            <div className="flex flex-col gap-1 ml-2">
                                <GlassButton
                                    variant={period === 'AM' ? 'primary' : 'ghost'}
                                    size="sm"
                                    onClick={() => period === 'PM' && togglePeriod()}
                                    className="px-3 py-1 text-xs"
                                >
                                    AM
                                </GlassButton>
                                <GlassButton
                                    variant={period === 'PM' ? 'primary' : 'ghost'}
                                    size="sm"
                                    onClick={() => period === 'AM' && togglePeriod()}
                                    className="px-3 py-1 text-xs"
                                >
                                    PM
                                </GlassButton>
                            </div>
                        )}
                    </div>

                    {/* Quick select */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                        {['09:00', '12:00', '15:00', '18:00'].map(preset => (
                            <GlassButton
                                key={preset}
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const { hours, minutes } = parseTime(preset);
                                    updateTime(hours, minutes);
                                    setPeriod(hours >= 12 ? 'PM' : 'AM');
                                }}
                                className="text-xs"
                            >
                                {use24Hour ? preset :
                                    `${(parseInt(preset) % 12 || 12)}:${preset.split(':')[1]} ${parseInt(preset) >= 12 ? 'PM' : 'AM'}`
                                }
                            </GlassButton>
                        ))}
                    </div>
                </GlassContainer>
            )}
        </div>
    );
});

GlassTimePicker.displayName = 'GlassTimePicker';
