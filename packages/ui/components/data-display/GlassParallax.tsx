import React, { useRef, useEffect, useState, HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface ParallaxLayer {
    /** Content for this layer - can be text, images, or any React element */
    content: React.ReactNode;
    /** Parallax speed multiplier. 0 = fixed, 1 = normal scroll, >1 = faster, <1 = slower */
    speed?: number;
    /** Optional className for the layer */
    className?: string;
    /** Z-index for layer ordering */
    zIndex?: number;
    /** Offset from center (percentage) */
    offset?: { x?: number; y?: number };
}

export interface GlassParallaxProps extends HTMLAttributes<HTMLDivElement> {
    /** Array of layers to render with parallax effect */
    layers?: ParallaxLayer[];
    /** Simple text with parallax effect when layers aren't specified */
    text?: string;
    /** Simple image with parallax effect when layers aren't specified */
    imageSrc?: string;
    /** Image alt text */
    imageAlt?: string;
    /** Height of the parallax container */
    height?: string | number;
    /** Enable glass morphism overlay */
    enableGlass?: boolean;
    /** Parallax direction */
    direction?: 'vertical' | 'horizontal' | 'both';
    /** Intensity of the parallax effect (0-1) */
    intensity?: number;
}

export const GlassParallax = forwardRef<HTMLDivElement, GlassParallaxProps>(({
    layers,
    text,
    imageSrc,
    imageAlt = 'Parallax image',
    height = 400,
    enableGlass = true,
    direction = 'vertical',
    intensity = 0.5,
    className,
    children,
    ...props
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
            },
            { threshold: 0, rootMargin: '100px' }
        );

        observer.observe(container);

        const handleScroll = () => {
            if (!isInView) return;

            const rect = container.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Calculate scroll progress from -1 (above view) to 1 (below view)
            // 0 means perfectly centered in viewport
            const centerOffset = rect.top + rect.height / 2 - windowHeight / 2;
            const maxOffset = windowHeight / 2 + rect.height / 2;
            const progress = Math.max(-1, Math.min(1, centerOffset / maxOffset));

            setScrollProgress(progress);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial calculation

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isInView]);

    // Generate default layers if not provided
    const defaultLayers: ParallaxLayer[] = [];

    if (imageSrc) {
        defaultLayers.push({
            content: (
                <img
                    src={imageSrc}
                    alt={imageAlt}
                    className="w-full h-full object-cover"
                />
            ),
            speed: 0.3,
            zIndex: 0,
            className: 'absolute inset-0'
        });
    }

    if (text) {
        defaultLayers.push({
            content: (
                <h2 className="text-6xl md:text-8xl font-black text-center leading-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-[var(--glass-text-primary)] via-[var(--glass-text-secondary)] to-transparent">
                        {text}
                    </span>
                </h2>
            ),
            speed: 0.8,
            zIndex: 10,
            className: 'flex items-center justify-center'
        });
    }

    const effectiveLayers = layers || defaultLayers;

    const getTransform = (speed: number = 1) => {
        const movement = scrollProgress * 200 * intensity * (1 - speed);

        switch (direction) {
            case 'horizontal':
                return `translateX(${movement}px)`;
            case 'both':
                return `translate(${movement * 0.5}px, ${movement}px)`;
            case 'vertical':
            default:
                return `translateY(${movement}px)`;
        }
    };

    return (
        <div
            ref={(el) => {
                (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                if (typeof ref === 'function') ref(el);
                else if (ref) ref.current = el;
            }}
            className={cn(
                'relative overflow-hidden rounded-2xl',
                className
            )}
            style={{
                height: typeof height === 'number' ? `${height}px` : height,
            }}
            {...props}
        >
            {/* Parallax Layers */}
            {effectiveLayers.map((layer, index) => (
                <div
                    key={index}
                    className={cn(
                        'absolute inset-0 will-change-transform transition-transform duration-75 ease-out',
                        layer.className
                    )}
                    style={{
                        transform: getTransform(layer.speed),
                        zIndex: layer.zIndex ?? index,
                        ...(layer.offset && {
                            left: `${layer.offset.x ?? 0}%`,
                            top: `${layer.offset.y ?? 0}%`,
                        }),
                    }}
                >
                    {layer.content}
                </div>
            ))}

            {/* Glass Overlay */}
            {enableGlass && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'linear-gradient(to bottom, transparent 0%, var(--glass-bg-thin) 50%, var(--glass-bg-regular) 100%)',
                        zIndex: 50,
                    }}
                />
            )}

            {/* Children (additional content) */}
            {children && (
                <div className="absolute inset-0 z-[60] flex items-end justify-center p-8">
                    {children}
                </div>
            )}

            {/* Decorative glass border */}
            <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'var(--glass-highlight)',
                    zIndex: 100,
                }}
            />
        </div>
    );
});

GlassParallax.displayName = 'GlassParallax';

// Pre-built parallax text variants for easy use
export interface ParallaxTextImageProps extends Omit<GlassParallaxProps, 'layers'> {
    /** Main heading text */
    heading: string;
    /** Optional subheading */
    subheading?: string;
    /** Background image URL */
    backgroundImage?: string;
    /** Foreground decoration elements */
    decorations?: 'circles' | 'grid' | 'lines' | 'none';
    /** Color scheme for gradients */
    colorScheme?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'rainbow';
}

const colorSchemes = {
    blue: 'from-blue-400 via-cyan-400 to-blue-600',
    purple: 'from-purple-400 via-pink-400 to-purple-600',
    green: 'from-green-400 via-emerald-400 to-teal-600',
    orange: 'from-orange-400 via-amber-400 to-red-500',
    pink: 'from-pink-400 via-rose-400 to-fuchsia-600',
    rainbow: 'from-pink-400 via-purple-400 via-blue-400 via-cyan-400 via-green-400 to-yellow-400',
};

export const GlassParallaxTextImage = forwardRef<HTMLDivElement, ParallaxTextImageProps>(({
    heading,
    subheading,
    backgroundImage,
    decorations = 'circles',
    colorScheme = 'purple',
    height = 500,
    intensity = 0.6,
    ...props
}, ref) => {
    const gradientClass = colorSchemes[colorScheme];

    const layers: ParallaxLayer[] = [
        // Background image or gradient
        {
            content: backgroundImage ? (
                <img
                    src={backgroundImage}
                    alt=""
                    className="w-full h-full object-cover opacity-60"
                />
            ) : (
                <div className={cn(
                    "w-full h-full bg-gradient-to-br opacity-30",
                    gradientClass
                )} />
            ),
            speed: 0.2,
            zIndex: 0,
            className: 'absolute inset-0',
        },
        // Decorative elements
        ...(decorations === 'circles' ? [
            {
                content: (
                    <div className="w-full h-full relative">
                        <div className={cn(
                            "absolute w-96 h-96 rounded-full blur-3xl opacity-40 bg-gradient-to-r",
                            gradientClass
                        )} style={{ top: '-20%', left: '-10%' }} />
                        <div className={cn(
                            "absolute w-72 h-72 rounded-full blur-2xl opacity-30 bg-gradient-to-l",
                            gradientClass
                        )} style={{ bottom: '-10%', right: '-5%' }} />
                        <div className={cn(
                            "absolute w-48 h-48 rounded-full blur-xl opacity-50 bg-gradient-to-t",
                            gradientClass
                        )} style={{ top: '30%', right: '20%' }} />
                    </div>
                ),
                speed: 0.4,
                zIndex: 1,
                className: 'absolute inset-0',
            },
        ] : decorations === 'grid' ? [
            {
                content: (
                    <div
                        className="w-full h-full opacity-20"
                        style={{
                            backgroundImage: 'linear-gradient(var(--glass-border) 1px, transparent 1px), linear-gradient(90deg, var(--glass-border) 1px, transparent 1px)',
                            backgroundSize: '60px 60px',
                        }}
                    />
                ),
                speed: 0.3,
                zIndex: 1,
                className: 'absolute inset-0',
            },
        ] : decorations === 'lines' ? [
            {
                content: (
                    <div className="w-full h-full relative overflow-hidden">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className={cn("absolute h-px bg-gradient-to-r opacity-30", gradientClass)}
                                style={{
                                    width: '200%',
                                    top: `${20 + i * 15}%`,
                                    left: '-50%',
                                    transform: `rotate(${-15 + i * 5}deg)`,
                                }}
                            />
                        ))}
                    </div>
                ),
                speed: 0.5,
                zIndex: 1,
                className: 'absolute inset-0',
            },
        ] : []),
        // Main heading
        {
            content: (
                <div className="text-center px-8">
                    <h2 className={cn(
                        "text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight tracking-tight",
                        "bg-clip-text text-transparent bg-gradient-to-b",
                        "from-[var(--glass-text-primary)] to-[var(--glass-text-tertiary)]"
                    )}>
                        {heading}
                    </h2>
                    {subheading && (
                        <p className="mt-4 text-lg sm:text-xl text-secondary max-w-2xl mx-auto">
                            {subheading}
                        </p>
                    )}
                </div>
            ),
            speed: 0.85,
            zIndex: 10,
            className: 'flex items-center justify-center',
        },
    ];

    return (
        <GlassParallax
            ref={ref}
            layers={layers}
            height={height}
            intensity={intensity}
            enableGlass={true}
            {...props}
        />
    );
});

GlassParallaxTextImage.displayName = 'GlassParallaxTextImage';
