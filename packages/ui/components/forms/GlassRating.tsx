import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface GlassRatingProps {
    /**
     * Current rating value (0 to max)
     */
    value: number;

    /**
     * Maximum rating (default: 5)
     */
    max?: number;

    /**
     * Callback when rating changes
     */
    onChange?: (value: number) => void;

    /**
     * Whether the rating is read-only
     */
    readOnly?: boolean;

    /**
     * Size of the stars
     */
    size?: number;

    /**
     * Additional class names
     */
    className?: string;
}

export function GlassRating({
    value,
    max = 5,
    onChange,
    readOnly = false,
    size = 20,
    className
}: GlassRatingProps) {
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    const displayValue = hoverValue !== null ? hoverValue : value;

    return (
        <div
            className={cn("flex items-center gap-1", className)}
            onMouseLeave={() => !readOnly && setHoverValue(null)}
        >
            {Array.from({ length: max }).map((_, i) => {
                const starValue = i + 1;
                const isFilled = starValue <= displayValue;
                // const isHalf = !isFilled && starValue - 0.5 <= displayValue; 

                return (
                    <button
                        key={i}
                        type="button"
                        disabled={readOnly}
                        onClick={() => !readOnly && onChange?.(starValue)}
                        onMouseEnter={() => !readOnly && setHoverValue(starValue)}
                        className={cn(
                            "transition-all duration-200 focus:outline-none focus-visible:scale-110",
                            readOnly ? "cursor-default" : "cursor-pointer hover:scale-110",
                            isFilled ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" : "text-white/20"
                        )}
                    >
                        <Star
                            size={size}
                            fill={isFilled ? "currentColor" : "transparent"}
                            strokeWidth={isFilled ? 0 : 2}
                        />
                    </button>
                );
            })}
        </div>
    );
}

GlassRating.displayName = 'GlassRating';
