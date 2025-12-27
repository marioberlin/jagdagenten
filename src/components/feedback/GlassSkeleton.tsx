import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { useSpring, animated } from '@react-spring/web';

interface GlassSkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
}

export const GlassSkeleton = ({ className, width, height }: GlassSkeletonProps) => {
    const { opacity } = useSpring({
        from: { opacity: 0.3 },
        to: { opacity: 0.7 },
        loop: { reverse: true },
        config: { duration: 1000 },
    });

    return (
        <GlassContainer
            material="thin"
            className={cn("overflow-hidden bg-glass-surface", className)}
            style={{ width, height }}
        >
            <animated.div
                style={{ opacity }}
                className="w-full h-full bg-glass-surface-hover"
            />
        </GlassContainer>
    );
};

GlassSkeleton.displayName = 'GlassSkeleton';
