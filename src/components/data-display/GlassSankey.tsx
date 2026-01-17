import { motion } from 'framer-motion';
import { GlassContainer } from '../primitives/GlassContainer';
import { GlassCard } from './GlassCard';
import { cn } from '@/utils/cn';
import { ErrorBoundary } from '../feedback/ErrorBoundary';

interface SankeyNode {
    id: string;
    label: string;
    color?: string;
}

interface SankeyLink {
    source: string;
    target: string;
    value: number;
}

interface GlassSankeyProps {
    nodes: SankeyNode[];
    links: SankeyLink[];
    width?: number;
    height?: number;
    className?: string;
}

export const GlassSankey = ({
    nodes,
    links,
    width = 600,
    height = 400,
    className
}: GlassSankeyProps) => {

    // 1. Assign columns (Simple logic: Source nodes = Col 0, Target nodes = Col 1, etc.)
    // Only handling 2-3 columns for simplicity in this demo implementation
    interface SankeyNodeWithLayout extends SankeyNode {
        sourceLinks: SankeyLink[];
        targetLinks: SankeyLink[];
        value: number;
        col: number;
        row: number;
        x: number;
        y: number;
        width: number;
        height: number;
    }

    const nodeMap = new Map<string, SankeyNodeWithLayout>(nodes.map(n => [n.id, {
        ...n,
        sourceLinks: [],
        targetLinks: [],
        value: 0,
        col: 0,
        row: 0,
        x: 0,
        y: 0,
        width: 0,
        height: 0
    }]));

    // First pass: Calculate node values
    links.forEach(l => {
        const src = nodeMap.get(l.source);
        const tgt = nodeMap.get(l.target);
        if (src && tgt) {

            src.sourceLinks.push(l);

            tgt.targetLinks.push(l);

            src.value += l.value;

            tgt.value += l.value;

            if (tgt.col <= src.col) tgt.col = src.col + 1;
        }
    });

    // 2. Position Nodes
    const columns: any[][] = [];
    nodeMap.forEach(n => {
        if (!columns[n.col]) columns[n.col] = [];
        columns[n.col].push(n);
    });

    const nodeWidth = 20;
    const colSpacing = (width - nodeWidth) / (Math.max(1, columns.length - 1));
    const paddingY = 20;

    // Calculate node positions
    const renderNodes: any[] = [];

    columns.forEach((colNodes, colIndex) => {
        const x = colIndex * colSpacing;
        const totalColValue = colNodes.reduce((acc, n) => acc + n.value, 0);
        const totalSpacing = height - (paddingY * 2);

        let currentY = paddingY;

        colNodes.forEach(node => {
            const h = Math.max((node.value / totalColValue) * (totalSpacing * 0.8), 20); // Scale logic approx
            node.x = x;
            node.y = currentY;
            node.height = h;
            node.width = nodeWidth;
            renderNodes.push(node);

            currentY += h + 20; // 20px gap
        });
    });

    // 3. Render Links

    // ... (renderLinks map)
    const renderLinks = links.map((link, i) => {
        const src = nodeMap.get(link.source);
        const tgt = nodeMap.get(link.target);

        if (!src || !tgt) return null;

        // Naive vertical centering for link anchors
        const srcY = src.y + (src.height / 2);
        const tgtY = tgt.y + (tgt.height / 2);
        const strokeWidth = Math.max(link.value * 0.5, 2); // Approximate

        const p0 = { x: src.x + src.width, y: srcY };
        const p1 = { x: tgt.x, y: tgtY };

        // Control points for curvature
        const cp0 = { x: p0.x + (colSpacing * 0.5), y: p0.y };
        const cp1 = { x: p1.x - (colSpacing * 0.5), y: p1.y };

        const d = `M ${p0.x} ${p0.y} C ${cp0.x} ${cp0.y}, ${cp1.x} ${cp1.y}, ${p1.x} ${p1.y}`;

        return (
            <motion.path
                key={i}
                d={d}
                fill="none"
                stroke="white"
                strokeOpacity="0.1"
                strokeWidth={strokeWidth}
                className="transition-colors duration-300 hover:stroke-opacity-40 cursor-pointer"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: i * 0.1 }}
            >
                <title>{`${src.label} -> ${tgt.label}: ${link.value}`}</title>
            </motion.path>
        );
    });

    return (
        <ErrorBoundary
            fallback={
                <GlassContainer className={cn("p-4 flex items-center justify-center", className)} style={{ width, height }}>
                    <GlassCard className="p-4 text-center">
                        <p className="text-secondary">Unable to render Sankey chart</p>
                        <p className="text-xs text-tertiary mt-1">Check data format</p>
                    </GlassCard>
                </GlassContainer>
            }
        >
            <GlassContainer className={cn("p-4", className)} style={{ width, height }}>
                <svg width="100%" height="100%" className="overflow-visible">
                    {renderLinks}

                    {renderNodes.map(node => (
                        <g key={node.id}>
                            <motion.rect
                                x={node.x}
                                y={node.y}
                                width={node.width}
                                height={node.height}
                                fill={node.color || '#60a5fa'}
                                rx="4"
                                className="opacity-80 hover:opacity-100 cursor-pointer"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 0.8 }}
                                transition={{
                                    delay: node.col * 0.2,
                                    duration: 0.5
                                }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <title>{`${node.label}: ${node.value}`}</title>
                            </motion.rect>
                            {/* Label */}
                            <text
                                x={node.x + (node.col === 0 ? -5 : node.width + 5)}
                                y={node.y + node.height / 2}
                                dominantBaseline="middle"
                                textAnchor={node.col === 0 ? "end" : "start"}
                                className="fill-secondary text-[10px] pointer-events-none"
                            >
                                {node.label}
                            </text>
                        </g>
                    ))}
                </svg>
            </GlassContainer>
        </ErrorBoundary>
    );
};
