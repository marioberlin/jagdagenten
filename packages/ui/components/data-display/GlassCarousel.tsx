import { useRef } from 'react';
import { GlassButton } from '../primitives/GlassButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface GlassCarouselProps {
    items: React.ReactNode[];
    className?: string;
}

export const GlassCarousel = ({ items, className }: GlassCarouselProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const width = scrollRef.current.clientWidth;
        scrollRef.current.scrollBy({ left: direction === 'left' ? -width : width, behavior: 'smooth' });
    };

    return (
        <div className={cn("relative group", className)}>
            {/* Scroll Container */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-4 px-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {items.map((item, index) => (
                    <div key={index} className="flex-none w-full md:w-1/2 lg:w-1/3 snap-center">
                        {item}
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="absolute top-1/2 -translate-y-1/2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <GlassButton variant="ghost" size="sm" onClick={() => scroll('left')} className="rounded-full !p-2 h-10 w-10 bg-black/20 hover:bg-black/40 backdrop-blur-md">
                    <ChevronLeft size={20} />
                </GlassButton>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <GlassButton variant="ghost" size="sm" onClick={() => scroll('right')} className="rounded-full !p-2 h-10 w-10 bg-black/20 hover:bg-black/40 backdrop-blur-md">
                    <ChevronRight size={20} />
                </GlassButton>
            </div>
        </div>
    );
};

GlassCarousel.displayName = 'GlassCarousel';
