import { useState, forwardRef } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { GlassPopover } from '../overlays/GlassPopover';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface GlassDatePickerProps {
    date?: Date;
    onSelect?: (date: Date) => void;
    className?: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const GlassDatePicker = forwardRef<HTMLDivElement, GlassDatePickerProps>(
    ({ date, onSelect, className }, ref) => {
        const [currDate, setCurrDate] = useState(date || new Date());
        const [viewDate, setViewDate] = useState(new Date(currDate));

        const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
        const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

        const changeMonth = (delta: number) => {
            const newDate = new Date(viewDate);
            newDate.setMonth(newDate.getMonth() + delta);
            setViewDate(newDate);
        };

        const handleDayClick = (day: number) => {
            const newDate = new Date(viewDate);
            newDate.setDate(day);
            setCurrDate(newDate);
            onSelect?.(newDate);
        };

        const renderCalendar = () => {
            const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
            const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
            const days = [];

            // Padding
            for (let i = 0; i < firstDay; i++) {
                days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
            }

            // Days
            for (let i = 1; i <= daysInMonth; i++) {
                const isSelected =
                    currDate.getDate() === i &&
                    currDate.getMonth() === viewDate.getMonth() &&
                    currDate.getFullYear() === viewDate.getFullYear();

                const isToday =
                    new Date().getDate() === i &&
                    new Date().getMonth() === viewDate.getMonth() &&
                    new Date().getFullYear() === viewDate.getFullYear();

                days.push(
                    <button
                        key={i}
                        onClick={() => handleDayClick(i)}
                        className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all relative hover:bg-glass-surface-hover",
                            isSelected ? "bg-accent text-primary shadow-lg shadow-accent/50" : "text-secondary",
                            !isSelected && isToday ? "text-accent font-bold" : ""
                        )}
                    >
                        {i}
                        {!isSelected && isToday && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-current" />}
                    </button>
                );
            }
            return days;
        };

        const PopoverContent = (
            <GlassContainer className="p-4 w-[280px]">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-glass-surface-hover rounded-full transition-colors"><ChevronLeft size={16} /></button>
                    <div className="font-semibold text-label-glass-primary">
                        {MONTHS[viewDate.getMonth()]} <span className="text-label-glass-secondary">{viewDate.getFullYear()}</span>
                    </div>
                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-glass-surface-hover rounded-full transition-colors"><ChevronRight size={16} /></button>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 mb-2 text-center">
                    {DAYS.map(d => <div key={d} className="text-xs font-medium text-label-glass-tertiary mb-1">{d}</div>)}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-y-1 place-items-center">
                    {renderCalendar()}
                </div>
            </GlassContainer>
        );

        return (
            <div ref={ref}>
                <GlassPopover content={PopoverContent}>
                    <GlassButton variant="outline" className={cn("min-w-[200px] justify-start text-left font-normal", !date && "text-muted-foreground", className)}>
                        <CalendarIcon size={16} className="mr-2 opacity-50" />
                        {currDate ? currDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : <span>Pick a date</span>}
                    </GlassButton>
                </GlassPopover>
            </div>
        );
    }
);

GlassDatePicker.displayName = 'GlassDatePicker';
