
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface GlassStatusProps {
    label?: string;
    status?: 'online' | 'offline' | 'busy' | 'away';
    color?: string; // override color if needed
    className?: string;
    pulse?: boolean;
}

export const GlassStatus = ({
    label = 'System Online',
    status = 'online',
    color,
    className,
    pulse = true
}: GlassStatusProps) => {

    const getStatusColor = () => {
        if (color) return color;
        switch (status) {
            case 'online': return 'bg-green-400';
            case 'offline': return 'bg-secondary';
            case 'busy': return 'bg-red-400';
            case 'away': return 'bg-yellow-400';
            default: return 'bg-green-400';
        }
    };

    const statusColor = getStatusColor();

    return (
        <GlassContainer className={cn("px-4 py-2 rounded-full !bg-glass-clear border-[var(--glass-border)] inline-flex", className)}>
            <span className="text-xs font-mono text-secondary uppercase tracking-widest flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", statusColor, pulse && "animate-pulse")} />
                {label}
            </span>
        </GlassContainer>
    );
};

GlassStatus.displayName = 'GlassStatus';
