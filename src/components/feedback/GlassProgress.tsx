import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { TRANSITIONS } from '@/styles/animations';

interface GlassProgressProps {
    value: number;
    max?: number;
    className?: string;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    color?: 'default' | 'blue' | 'green' | 'purple';
}

const sizeMap = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
};

const colorMap = {
    default: 'from-white/60 to-white/40',
    blue: 'from-blue-400/80 to-blue-500/60',
    green: 'from-emerald-400/80 to-emerald-500/60',
    purple: 'from-purple-400/80 to-purple-500/60',
};

export const GlassProgress = ({
    value,
    max = 100,
    className,
    showLabel = false,
    size = 'md',
    color = 'default'
}: GlassProgressProps) => {
    const clampedValue = Math.min(Math.max(value, 0), max);
    const percentage = (clampedValue / max) * 100;

    return (
        <div className={cn("w-full space-y-2", className)}>
            {showLabel && (
                <div className="flex justify-between text-xs font-medium text-secondary">
                    <span>Progress</span>
                    <span className="tabular-nums">{Math.round(percentage)}%</span>
                </div>
            )}

            {/* Track */}
            <div className={cn(
                "w-full rounded-full overflow-hidden",
                "bg-glass-surface border border-[var(--glass-border)]",
                "shadow-inner shadow-black/20",
                sizeMap[size]
            )}>
                {/* Fill */}
                <motion.div
                    className={cn(
                        "h-full rounded-full",
                        "bg-gradient-to-r",
                        colorMap[color],
                        "shadow-sm"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={TRANSITIONS.springSlow}
                />
            </div>
        </div>
    );
};

GlassProgress.displayName = 'GlassProgress';
