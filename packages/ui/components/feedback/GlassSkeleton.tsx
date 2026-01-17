import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';

interface GlassSkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
}

export const GlassSkeleton = ({ className, width, height }: GlassSkeletonProps) => {
    return (
        <GlassContainer
            material="thin"
            className={cn("overflow-hidden bg-glass-surface", className)}
            style={{ width, height }}
        >
            <motion.div
                initial={{ opacity: 0.3 }}
                animate={{ opacity: 0.7 }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                }}
                className="w-full h-full bg-glass-surface-hover"
            />
        </GlassContainer>
    );
};

GlassSkeleton.displayName = 'GlassSkeleton';
