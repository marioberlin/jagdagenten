import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';

// Based on a popular "Magical Text" implementation concept
interface Sparkle {
    id: string;
    createdAt: number;
    color: string;
    size: number;
    style: {
        top: string;
        left: string;
        zIndex: number;
    };
}

const DEFAULT_COLOR = '#FFC700'; // Gold

const generateSparkle = (color: string): Sparkle => {
    return {
        id: String(Math.random()),
        createdAt: Date.now(),
        color,
        size: Math.random() < 0.5 ? 10 : 20, // varied sizes
        style: {
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            zIndex: 2,
        },
    };
};

const SparkleInstance = ({ color, size, style }: { color: string; size: number; style: React.CSSProperties }) => {
    return (
        <span className="absolute pointer-events-none animate-sparkle" style={style}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 160 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496 101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925 75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z"
                    fill={color}
                />
            </svg>
            <style>{`
                @keyframes sparkle-spin {
                    0% { transform: scale(0) rotate(0deg) translateZ(0); opacity: 0; }
                    50% { transform: scale(1) rotate(90deg) translateZ(0); opacity: 1; }
                    100% { transform: scale(0) rotate(180deg) translateZ(0); opacity: 0; }
                }
                .animate-sparkle {
                    animation: sparkle-spin 800ms linear forwards;
                    will-change: transform, opacity;
                }
            `}</style>
        </span>
    );
};

export const GlassSparkles = ({ children, color = DEFAULT_COLOR, className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { color?: string }) => {
    const [sparkles, setSparkles] = useState<Sparkle[]>([]);
    const prefersReducedMotion = useRef(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        prefersReducedMotion.current = mediaQuery.matches;
    }, []);

    const useRandomInterval = (callback: () => void, minDelay: number, maxDelay: number) => {
        const timeoutId = useRef<number | null>(null);
        const savedCallback = useRef(callback);

        useEffect(() => {
            savedCallback.current = callback;
        }, [callback]);

        useEffect(() => {
            if (prefersReducedMotion.current) return;
            const handleTick = () => {
                const nextTickAt = Math.random() * (maxDelay - minDelay) + minDelay;
                timeoutId.current = window.setTimeout(() => {
                    savedCallback.current();
                    handleTick();
                }, nextTickAt);
            };
            handleTick();
            return () => {
                if (timeoutId.current) window.clearTimeout(timeoutId.current);
            };
        }, [minDelay, maxDelay]);
    };

    useRandomInterval(
        () => {
            const now = Date.now();
            const sparkle = generateSparkle(color);
            const nextSparkles = sparkles.filter(sp => now - sp.createdAt < 750);
            nextSparkles.push(sparkle);
            setSparkles(nextSparkles);
        },
        50,
        450
    );

    return (
        <span className={cn("relative inline-block", className)} {...props}>
            {sparkles.map(sparkle => (
                <SparkleInstance
                    key={sparkle.id}
                    color={sparkle.color}
                    size={sparkle.size}
                    style={sparkle.style}
                />
            ))}
            <span className="relative z-10">{children}</span>
        </span>
    );
};

GlassSparkles.displayName = 'GlassSparkles';
