/**
 * HolographicTicket
 * 
 * A premium boarding pass / ticket component with holographic effects.
 * Features:
 * - Holographic gradient shimmer on hover
 * - QR code generation for ticket reference
 * - Atmosphere-reactive accent colors
 * - Tear-off perforation line effect
 */
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { Plane, Train, Building2, Clock, MapPin, User, QrCode } from 'lucide-react';
import type { TicketData } from '../../services/a2a/NeonTokyoService';

interface HolographicTicketProps {
    ticket: TicketData;
    accentColor?: string;
    className?: string;
    onFlip?: () => void;
}

// Type icons
const TypeIcons = {
    flight: Plane,
    train: Train,
    hotel: Building2
};

/**
 * Generate a simple QR code pattern as SVG
 * This is a placeholder - in production, use the 'qrcode' library
 */
function SimpleQRPlaceholder({ data, size = 80 }: { data: string; size?: number }) {
    // Create a deterministic pattern based on the data string
    const cells = 9;
    const cellSize = size / cells;

    // Simple hash function to create pattern
    const hash = (str: string, x: number, y: number) => {
        const code = str.charCodeAt((x + y * cells) % str.length) || 0;
        return (code + x * 7 + y * 13) % 3 === 0;
    };

    const rects = [];
    for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
            // Always fill corners (position markers)
            const isCorner = (x < 3 && y < 3) || (x >= cells - 3 && y < 3) || (x < 3 && y >= cells - 3);
            const isCornerInner = (x === 1 && y === 1) || (x === cells - 2 && y === 1) || (x === 1 && y === cells - 2);

            if (isCorner || isCornerInner || hash(data, x, y)) {
                rects.push(
                    <rect
                        key={`${x}-${y}`}
                        x={x * cellSize}
                        y={y * cellSize}
                        width={cellSize - 1}
                        height={cellSize - 1}
                        fill="currentColor"
                        rx={1}
                    />
                );
            }
        }
    }

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="text-white/80">
            {rects}
        </svg>
    );
}

/**
 * Holographic shimmer effect overlay
 */
function HolographicOverlay({ isHovered }: { isHovered: boolean }) {
    return (
        <div
            className={cn(
                "absolute inset-0 pointer-events-none overflow-hidden rounded-xl transition-opacity duration-500",
                isHovered ? "opacity-100" : "opacity-0"
            )}
        >
            {/* Rainbow gradient shimmer */}
            <div
                className="absolute inset-0 animate-shimmer"
                style={{
                    background: `linear-gradient(
                        135deg,
                        transparent 20%,
                        rgba(255,0,150,0.1) 25%,
                        rgba(0,255,255,0.1) 30%,
                        rgba(255,255,0,0.1) 35%,
                        transparent 40%
                    )`,
                    backgroundSize: '300% 300%'
                }}
            />
            {/* Noise texture */}
            <div
                className="absolute inset-0 opacity-10 mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
                }}
            />
        </div>
    );
}

/**
 * Perforation line between main ticket and stub
 */
function PerforationLine() {
    return (
        <div className="relative h-8 flex items-center -mx-4 my-3">
            {/* Left notch */}
            <div className="absolute left-0 w-4 h-8 bg-glass-base rounded-r-full" />
            {/* Dashed line */}
            <div className="flex-1 border-t-2 border-dashed border-white/20 mx-4" />
            {/* Right notch */}
            <div className="absolute right-0 w-4 h-8 bg-glass-base rounded-l-full" />
        </div>
    );
}

export function HolographicTicket({
    ticket,
    accentColor = '#ec4899',
    className,
    onFlip
}: HolographicTicketProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const TypeIcon = TypeIcons[ticket.type] || Plane;

    const handleClick = () => {
        setIsFlipped(!isFlipped);
        onFlip?.();
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full max-w-md perspective-1000",
                className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Card container with flip animation */}
            <div
                className={cn(
                    "relative w-full transition-transform duration-700 transform-style-3d cursor-pointer",
                    isFlipped && "rotate-y-180"
                )}
                onClick={handleClick}
                style={{
                    transformStyle: 'preserve-3d'
                }}
            >
                {/* Front of ticket */}
                <div
                    className={cn(
                        "relative p-4 rounded-xl",
                        "bg-gradient-to-br from-white/10 to-white/5",
                        "border border-white/20",
                        "backdrop-blur-md",
                        "backface-hidden"
                    )}
                    style={{
                        boxShadow: isHovered
                            ? `0 0 30px ${accentColor}40, 0 10px 40px rgba(0,0,0,0.3)`
                            : '0 4px 20px rgba(0,0,0,0.2)'
                    }}
                >
                    <HolographicOverlay isHovered={isHovered} />

                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                            <div
                                className="p-2 rounded-lg"
                                style={{ backgroundColor: `${accentColor}30` }}
                            >
                                <TypeIcon size={20} style={{ color: accentColor }} />
                            </div>
                            <div>
                                <p className="text-xs text-white/50 uppercase tracking-wider">
                                    {ticket.type === 'flight' ? 'Boarding Pass' : ticket.type === 'train' ? 'Rail Ticket' : 'Reservation'}
                                </p>
                                <p className="text-sm font-semibold text-white">{ticket.carrier}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-white/50">Class</p>
                            <p className="text-sm font-semibold text-white">{ticket.class}</p>
                        </div>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        {/* Departure */}
                        <div className="flex-1">
                            <p className="text-2xl font-bold text-white">{ticket.departure.location}</p>
                            <div className="flex items-center gap-1 mt-1 text-white/60 text-sm">
                                <Clock size={12} />
                                <span>{ticket.departure.time}</span>
                            </div>
                            {ticket.departure.terminal && (
                                <p className="text-xs text-white/40 mt-0.5">Terminal {ticket.departure.terminal}</p>
                            )}
                        </div>

                        {/* Arrow */}
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1">
                                <div className="h-px w-8 bg-white/30" />
                                <TypeIcon size={16} className="text-white/50" />
                                <div className="h-px w-8 bg-white/30" />
                            </div>
                        </div>

                        {/* Arrival */}
                        <div className="flex-1 text-right">
                            <p className="text-2xl font-bold text-white">{ticket.arrival.location}</p>
                            <div className="flex items-center gap-1 mt-1 text-white/60 text-sm justify-end">
                                <Clock size={12} />
                                <span>{ticket.arrival.time}</span>
                            </div>
                        </div>
                    </div>

                    <PerforationLine />

                    {/* Footer / Stub */}
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <div className="flex items-center gap-1 text-white/50 text-xs mb-1">
                                <User size={12} />
                                <span>Passenger</span>
                            </div>
                            <p className="text-sm font-semibold text-white">{ticket.passenger}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-white/50 mb-1">Reference</p>
                            <p className="text-sm font-mono font-bold text-white tracking-wider">{ticket.reference}</p>
                        </div>
                        <div className="ml-4">
                            <SimpleQRPlaceholder data={ticket.reference} size={60} />
                        </div>
                    </div>

                    {/* Decorative corner accents */}
                    <div
                        className="absolute top-0 right-0 w-20 h-20 opacity-20"
                        style={{
                            background: `radial-gradient(circle at top right, ${accentColor} 0%, transparent 70%)`
                        }}
                    />
                </div>

                {/* Back of ticket (QR code focus) */}
                <div
                    className={cn(
                        "absolute inset-0 p-4 rounded-xl",
                        "bg-gradient-to-br from-white/10 to-white/5",
                        "border border-white/20",
                        "backdrop-blur-md",
                        "backface-hidden rotate-y-180",
                        "flex flex-col items-center justify-center"
                    )}
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                    }}
                >
                    <div className="text-center">
                        <SimpleQRPlaceholder data={ticket.reference} size={160} />
                        <p className="mt-4 text-sm text-white/70">Scan to verify</p>
                        <p className="text-lg font-mono font-bold text-white mt-2 tracking-widest">
                            {ticket.reference}
                        </p>
                        <p className="text-xs text-white/40 mt-4">Tap to flip back</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HolographicTicket;
