import { useState, forwardRef } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassButton } from '../primitives/GlassButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface GlassCalendarProps {
    selected?: Date;
    onSelect?: (date: Date) => void;
    className?: string;
}

export const GlassCalendar = forwardRef<HTMLDivElement, GlassCalendarProps>(
    ({ selected, onSelect, className }, ref) => {
        const [currentDate, setCurrentDate] = useState(selected || new Date());

        const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
        const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
        const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

        const isToday = (day: number) => {
            const today = new Date();
            return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        };

        const isSelected = (day: number) => {
            if (!selected) return false;
            return day === selected.getDate() && month === selected.getMonth() && year === selected.getFullYear();
        };

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        return (
            <GlassContainer ref={ref} material="thick" enableLiquid={false} className={cn("p-5 w-[290px]", className)}>
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <GlassButton variant="ghost" size="sm" onClick={prevMonth} className="h-8 w-8 !p-0">
                        <ChevronLeft size={14} />
                    </GlassButton>
                    <span className="text-sm font-semibold">{monthNames[month]} {year}</span>
                    <GlassButton variant="ghost" size="sm" onClick={nextMonth} className="h-8 w-8 !p-0">
                        <ChevronRight size={14} />
                    </GlassButton>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-1.5 text-center text-xs mb-3">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <span key={d} className="text-secondary/60 font-medium py-1">{d}</span>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center">
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const selectedDay = isSelected(day);
                        const today = isToday(day);

                        return (
                            <button
                                key={day}
                                onClick={() => onSelect?.(new Date(year, month, day))}
                                className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center text-sm transition-all hover:bg-glass-surface-hover",
                                    selectedDay && "bg-primary text-background hover:bg-primary/90 shadow-lg scale-105",
                                    today && !selectedDay && "text-primary font-bold bg-glass-surface"
                                )}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </GlassContainer>
        );
    }
);

GlassCalendar.displayName = 'GlassCalendar';
