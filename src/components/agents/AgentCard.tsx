import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Star, Verified, Zap, Lock, ExternalLink } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { CuratedAgent } from '@/services/agents/registry';
import { getCategoryInfo } from '@/services/agents/registry';

interface AgentCardProps {
    agent: CuratedAgent;
    onClick?: () => void;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * AgentCard
 *
 * A beautiful 3D card for displaying A2A agents in the Hub.
 * Features perspective hover effects, glassmorphism, and smooth animations.
 */
export const AgentCard: React.FC<AgentCardProps> = ({
    agent,
    onClick,
    size = 'md',
    className
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Mouse position for 3D effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Spring physics for smooth motion
    const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

    const categoryInfo = getCategoryInfo(agent.category);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
        setIsHovered(false);
    };

    const sizeClasses = {
        sm: 'w-[180px] p-4',
        md: 'w-[240px] p-5',
        lg: 'w-[300px] p-6',
    };

    const iconSizes = {
        sm: 'text-3xl',
        md: 'text-4xl',
        lg: 'text-5xl',
    };

    return (
        <motion.div
            ref={cardRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                'relative cursor-pointer rounded-2xl overflow-hidden',
                'bg-gradient-to-br from-white/10 to-white/5',
                'backdrop-blur-2xl border border-white/10',
                'transition-all duration-300',
                isHovered && 'border-white/20 shadow-2xl',
                sizeClasses[size],
                className
            )}
        >
            {/* Gradient glow effect on hover */}
            <motion.div
                className="absolute inset-0 opacity-0 pointer-events-none"
                animate={{ opacity: isHovered ? 0.15 : 0 }}
                style={{
                    background: `radial-gradient(circle at 50% 50%, ${agent.color || categoryInfo?.color || '#6366F1'}, transparent 70%)`,
                }}
            />

            {/* Shine effect on hover */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                    background: isHovered
                        ? 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 55%, transparent 60%)'
                        : 'none',
                    backgroundPosition: isHovered ? '200% 0' : '0% 0',
                }}
                transition={{ duration: 0.6 }}
            />

            {/* Content */}
            <div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>
                {/* Header: Icon + Badges */}
                <div className="flex items-start justify-between mb-4">
                    <motion.div
                        className={cn(
                            'flex items-center justify-center rounded-xl',
                            'bg-gradient-to-br from-white/10 to-white/5',
                            'border border-white/10',
                            size === 'sm' ? 'w-12 h-12' : size === 'md' ? 'w-14 h-14' : 'w-16 h-16'
                        )}
                        animate={{ scale: isHovered ? 1.1 : 1 }}
                        style={{
                            boxShadow: isHovered ? `0 8px 32px ${agent.color || '#6366F1'}40` : 'none'
                        }}
                    >
                        <span className={iconSizes[size]}>{agent.icon}</span>
                    </motion.div>

                    <div className="flex items-center gap-1">
                        {agent.verified && (
                            <div className="p-1 rounded-full bg-blue-500/20" title="Verified Agent">
                                <Verified size={14} className="text-blue-400" />
                            </div>
                        )}
                        {agent.capabilities.streaming && (
                            <div className="p-1 rounded-full bg-green-500/20" title="Streaming Support">
                                <Zap size={14} className="text-green-400" />
                            </div>
                        )}
                        {agent.authentication !== 'none' && (
                            <div className="p-1 rounded-full bg-yellow-500/20" title={`Auth: ${agent.authentication}`}>
                                <Lock size={14} className="text-yellow-400" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Name */}
                <h3 className={cn(
                    'font-semibold text-white mb-1 line-clamp-1',
                    size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
                )}>
                    {agent.name}
                </h3>

                {/* Provider */}
                <p className="text-xs text-white/40 mb-2 line-clamp-1">
                    by {agent.provider.name}
                </p>

                {/* Short Description */}
                <p className={cn(
                    'text-white/60 line-clamp-2 mb-3',
                    size === 'sm' ? 'text-xs' : 'text-sm'
                )}>
                    {agent.shortDescription}
                </p>

                {/* Rating & Category */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-sm text-white/80 font-medium">{agent.rating}</span>
                        <span className="text-xs text-white/40">({agent.reviewCount.toLocaleString()})</span>
                    </div>

                    <div
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                        style={{
                            backgroundColor: `${categoryInfo?.color || '#6366F1'}20`,
                            color: categoryInfo?.color || '#6366F1',
                        }}
                    >
                        <span>{categoryInfo?.icon}</span>
                        <span>{categoryInfo?.name}</span>
                    </div>
                </div>
            </div>

            {/* Hover CTA */}
            <motion.div
                className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
            >
                <button
                    className={cn(
                        'w-full py-2 rounded-lg font-medium text-sm',
                        'bg-white/10 hover:bg-white/20 text-white',
                        'border border-white/10 hover:border-white/20',
                        'flex items-center justify-center gap-2 transition-all'
                    )}
                >
                    <span>Connect</span>
                    <ExternalLink size={14} />
                </button>
            </motion.div>
        </motion.div>
    );
};

/**
 * AgentCardCompact - Smaller horizontal variant for lists
 */
export const AgentCardCompact: React.FC<AgentCardProps> = ({
    agent,
    onClick,
    className
}) => {
    const categoryInfo = getCategoryInfo(agent.category);

    return (
        <motion.div
            onClick={onClick}
            whileHover={{ scale: 1.01, x: 4 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
                'flex items-center gap-4 p-4 rounded-xl cursor-pointer',
                'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10',
                'transition-all duration-200',
                className
            )}
        >
            {/* Icon */}
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${agent.color || categoryInfo?.color}20` }}
            >
                {agent.icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white truncate">{agent.name}</h4>
                    {agent.verified && <Verified size={14} className="text-blue-400 flex-shrink-0" />}
                </div>
                <p className="text-sm text-white/50 truncate">{agent.shortDescription}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 text-sm text-white/60">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span>{agent.rating}</span>
            </div>
        </motion.div>
    );
};

export default AgentCard;
