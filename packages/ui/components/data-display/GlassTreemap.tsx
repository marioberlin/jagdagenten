import { motion } from 'framer-motion';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';

interface TreemapData {
    name: string;
    value: number;
    children?: TreemapData[];
    color?: string;
}

interface GlassTreemapProps {
    data: TreemapData;
    colors?: string[];
    height?: number;
    className?: string;
}

export const GlassTreemap = ({
    data,
    colors = ['#60a5fa', '#34d399', '#f472b6', '#a78bfa', '#fbbf24'],
    height = 400,
    className
}: GlassTreemapProps) => {

    // Simple recursive renderer using flexbox approach for approximation
    // A proper Squarified algorithm is complex for a simple component, 
    // so we'll use a flex/grid split strategy.

    const renderNode = (node: TreemapData, depth: number, index: number, totalValue: number) => {
        const percent = (node.value / totalValue) * 100;
        // Don't render tiny nodes
        if (percent < 1) return null;

        const color = node.color || colors[index % colors.length];

        // Leaf node
        if (!node.children || node.children.length === 0) {
            return (
                <motion.div
                    key={`${depth}-${index}`}
                    className="relative border border-white/10 overflow-hidden group hover:brightness-110 cursor-pointer"
                    style={{
                        flex: `${node.value} 1 0%`,
                        backgroundColor: color + '40'
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 0.5,
                        delay: index * 0.05
                    }}
                    whileHover={{ scale: 1.02, zIndex: 10 }}
                >
                    <div className="absolute inset-0 p-2 flex flex-col justify-between">
                        <span className="text-[10px] md:text-xs font-bold text-white/90 truncate">{node.name}</span>
                        <span className="text-[9px] text-white/60">{node.value}</span>
                    </div>
                </motion.div>
            );
        }

        // Container node
        return (
            <div
                key={`${depth}-${index}`}
                className="flex flex-wrap content-start w-full h-full"
                style={{ flex: `${node.value} 1 0%` }}
            >
                {node.children.sort((a, b) => b.value - a.value).map((child, i) =>
                    renderNode(child, depth + 1, i + index, node.value)
                )}
            </div>
        );
    };

    return (
        <GlassContainer className={cn("overflow-hidden", className)} style={{ height }}>
            {/* ... (render root code) */}
            <div className="flex w-full h-full flex-wrap">
                {data.children?.sort((a, b) => b.value - a.value).map((child, i) =>
                    renderNode(child, 0, i, data.value)
                )}
            </div>
        </GlassContainer>
    );
};
