import { motion } from 'framer-motion';
import {
    Play,
    Pause,
    Settings,
    Trash2,
    Zap,
    TestTube,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import { GlassContainer, GlassButton } from '@/components';
import type { Bot } from '@/types/trading';

interface BotCardProps {
    bot: Bot;
    onEdit: (id: number) => void;
    onToggleActive: (id: number, active: boolean) => void;
    onTrigger: (id: number) => void;
    onDelete: (id: number) => void;
}

export function BotCard({
    bot,
    onEdit,
    onToggleActive,
    onTrigger,
    onDelete,
}: BotCardProps) {
    const isBuy = bot.type === 'buy';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
            <GlassContainer className="p-4 h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${bot.active ? 'bg-green-400' : 'bg-gray-400'}`} />
                        <h3 className="font-semibold text-primary truncate">{bot.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        {bot.test_mode && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 flex items-center gap-1">
                                <TestTube className="w-3 h-3" />
                                Test
                            </span>
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                            {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {bot.type.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-tertiary">Symbols</span>
                        <span className="text-secondary truncate max-w-[150px]" title={bot.symbols}>
                            {bot.symbols}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-tertiary">Strategy</span>
                        <span className="text-secondary">{bot.strategy || 'Custom'}</span>
                    </div>
                    {bot.parameters?.max_open_positions && (
                        <div className="flex justify-between text-sm">
                            <span className="text-tertiary">Max Positions</span>
                            <span className="text-secondary">{bot.parameters.max_open_positions}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                    <GlassButton
                        variant="ghost"
                        onClick={() => onToggleActive(bot.bot_id, !bot.active)}
                        className="flex-1 text-xs"
                        title={bot.active ? 'Deactivate' : 'Activate'}
                    >
                        {bot.active ? (
                            <>
                                <Pause className="w-3 h-3 mr-1" />
                                Pause
                            </>
                        ) : (
                            <>
                                <Play className="w-3 h-3 mr-1" />
                                Start
                            </>
                        )}
                    </GlassButton>
                    <GlassButton
                        variant="ghost"
                        onClick={() => onTrigger(bot.bot_id)}
                        className="p-2"
                        title="Trigger Now"
                    >
                        <Zap className="w-4 h-4" />
                    </GlassButton>
                    <GlassButton
                        variant="ghost"
                        onClick={() => onEdit(bot.bot_id)}
                        className="p-2"
                        title="Edit"
                    >
                        <Settings className="w-4 h-4" />
                    </GlassButton>
                    <GlassButton
                        variant="ghost"
                        onClick={() => onDelete(bot.bot_id)}
                        className="p-2 text-red-400 hover:text-red-300"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </GlassButton>
                </div>
            </GlassContainer>
        </motion.div>
    );
}

export default BotCard;
