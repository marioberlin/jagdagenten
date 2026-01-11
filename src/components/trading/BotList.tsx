import { Plus, Bot as BotIcon } from 'lucide-react';
import { GlassButton } from '@/components';
import { BotCard } from './BotCard';
import type { Bot } from '../../types/trading';

interface BotListProps {
    bots: Bot[];
    onCreateNew: () => void;
    onEdit: (id: number) => void;
    onToggleActive: (id: number, active: boolean) => void;
    onTrigger: (id: number) => void;
    onDelete: (id: number) => void;
}

export function BotList({
    bots,
    onCreateNew,
    onEdit,
    onToggleActive,
    onTrigger,
    onDelete,
}: BotListProps) {
    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-primary">Trading Bots</h2>
                    <p className="text-sm text-secondary">{bots.length} bot{bots.length !== 1 ? 's' : ''} configured</p>
                </div>
                <GlassButton onClick={onCreateNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Bot
                </GlassButton>
            </div>

            {/* Bot Grid */}
            {bots.length === 0 ? (
                <div className="text-center py-16">
                    <BotIcon className="w-16 h-16 mx-auto mb-4 text-tertiary opacity-50" />
                    <h3 className="text-lg font-medium text-primary mb-2">No bots configured</h3>
                    <p className="text-secondary mb-6">Create your first trading bot to get started</p>
                    <GlassButton onClick={onCreateNew}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Bot
                    </GlassButton>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bots.map(bot => (
                        <BotCard
                            key={bot.bot_id}
                            bot={bot}
                            onEdit={onEdit}
                            onToggleActive={onToggleActive}
                            onTrigger={onTrigger}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default BotList;
