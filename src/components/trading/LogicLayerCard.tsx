import { motion } from 'framer-motion';
import { Settings, X, Cpu } from 'lucide-react';
import { GlassContainer, GlassButton } from '@/components';
import { GlassDragHandle } from '@/components/layout/GlassDragDrop';
import type { LogicLayer } from '../../types/trading';

interface LogicLayerCardProps {
    layer: LogicLayer;
    isAssigned?: boolean;
    showDragHandle?: boolean;
    onAssign?: () => void;
    onRemove?: () => void;
    onConfigure?: () => void;
}

const categoryColors: Record<string, string> = {
    OSCILLATORS: 'bg-blue-500/20 text-blue-400',
    TREND: 'bg-purple-500/20 text-purple-400',
    VOLUME: 'bg-cyan-500/20 text-cyan-400',
    RISK_MANAGEMENT: 'bg-red-500/20 text-red-400',
    AI: 'bg-amber-500/20 text-amber-400',
    CUSTOM: 'bg-green-500/20 text-green-400',
};

export function LogicLayerCard({
    layer,
    isAssigned = false,
    showDragHandle = false,
    onAssign,
    onRemove,
    onConfigure,
}: LogicLayerCardProps) {
    const isAI = layer.tags?.includes('AI-Generated');
    const categoryColor = categoryColors[layer.category] || categoryColors.CUSTOM;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            layout
        >
            <GlassContainer className="p-3 flex items-center gap-3">
                {/* Drag Handle */}
                {showDragHandle && (
                    <GlassDragHandle className="flex-shrink-0" />
                )}

                {/* Layer Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary truncate">
                            {layer.name}
                        </span>
                        {isAI && (
                            <Cpu className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${categoryColor}`}>
                            {layer.category}
                        </span>
                        {layer.description && (
                            <span className="text-xs text-tertiary truncate">
                                {layer.description}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {onConfigure && (
                        <GlassButton
                            variant="ghost"
                            onClick={onConfigure}
                            className="p-1.5"
                            title="Configure"
                        >
                            <Settings className="w-4 h-4" />
                        </GlassButton>
                    )}
                    {!isAssigned && onAssign && (
                        <GlassButton
                            variant="secondary"
                            onClick={onAssign}
                            className="text-xs px-2 py-1"
                        >
                            Add
                        </GlassButton>
                    )}
                    {isAssigned && onRemove && (
                        <GlassButton
                            variant="ghost"
                            onClick={onRemove}
                            className="p-1.5 text-red-400 hover:text-red-300"
                            title="Remove"
                        >
                            <X className="w-4 h-4" />
                        </GlassButton>
                    )}
                </div>
            </GlassContainer>
        </motion.div>
    );
}

export default LogicLayerCard;
