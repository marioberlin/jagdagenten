import { GlassTooltip } from './GlassTooltip';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/utils/cn';


export type HIGTopic = 'materials' | 'typography' | 'color' | 'motion' | 'general';

const higQuotes: Record<HIGTopic, string> = {
    materials: "HIG: Don't use Liquid Glass in the content layer. Use it for controls and navigation to maintain legibility.",
    typography: "HIG: Legibility is paramount. Ideally, support Dynamic Type and avoid thin weights on glass surfaces.",
    color: "HIG: Use color consistently. Avoid using the same color to mean different things (e.g. status vs action).",
    motion: "HIG: Make motion optional. Gratuitous animation can distract people or cause discomfort.",
    general: "HIG: Follow Apple Human Interface Guidelines for a consistent, familiar user experience.",
};

interface HIGTooltipProps {
    topic: HIGTopic;
    className?: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
}

export const HIGTooltip = ({ topic, className, side = 'top' }: HIGTooltipProps) => {
    return (
        <GlassTooltip
            content={
                <div className="max-w-[250px] whitespace-normal">
                    <span className="font-semibold text-amber-500 block mb-1">Apple HIG Tip</span>
                    {higQuotes[topic]}
                </div>
            }
            side={side}
            className={className}
        >
            <button
                className={cn(
                    "inline-flex items-center justify-center p-1.5 rounded-full transition-all",
                    "text-amber-500/70 hover:text-amber-500 hover:bg-amber-500/10",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                )}
                aria-label={`Show HIG tip for ${topic}`}
            >
                <Lightbulb size={16} />
            </button>
        </GlassTooltip>
    );
};
