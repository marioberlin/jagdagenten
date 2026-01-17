import { useState } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { User } from 'lucide-react';

interface GlassAvatarProps {
    src?: string;
    alt?: string;
    fallback?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export const GlassAvatar = ({ src, alt, fallback, size = 'md', className }: GlassAvatarProps) => {
    const [hasError, setHasError] = useState(false);

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-16 h-16 text-base',
        xl: 'w-24 h-24 text-xl',
    };

    return (
        <GlassContainer
            material="regular"
            enableLiquid={false} // Clean edges for avatar circle
            className={cn(
                "relative flex shrink-0 overflow-hidden rounded-full !p-0 box-content border-2 border-[var(--glass-border)]",
                sizeClasses[size],
                className
            )}
        >
            {src && !hasError ? (
                <img
                    src={src}
                    alt={alt}
                    className="aspect-square h-full w-full object-cover"
                    onError={() => setHasError(true)}
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-glass-surface font-bold text-primary">
                    {fallback ? fallback : <User className="opacity-50" />}
                </div>
            )}
        </GlassContainer>
    );
};

GlassAvatar.displayName = 'GlassAvatar';
