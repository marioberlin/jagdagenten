import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Trash2, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassCard, GlassButton, GlassInput, GlassBadge } from '@/components';

export type AlertCondition = 'above' | 'below' | 'crosses';
export type AlertStatus = 'active' | 'triggered' | 'expired';

export interface PriceAlert {
    id: string;
    symbol: string;
    condition: AlertCondition;
    targetPrice: number;
    currentPrice: number;
    status: AlertStatus;
    triggeredAt?: Date;
    createdAt: Date;
    soundEnabled: boolean;
}

export interface GlassAlertPanelProps {
    /** Alerts to display */
    alerts?: PriceAlert[];
    /** Alert trigger handler */
    onTrigger?: (alertId: string) => void;
    /** Alert delete handler */
    onDelete?: (alertId: string) => void;
    /** Alert toggle sound handler */
    onToggleSound?: (alertId: string) => void;
    /** Add new alert handler */
    onAdd?: (alert: Omit<PriceAlert, 'id' | 'status' | 'triggeredAt' | 'createdAt'>) => void;
    /** Custom className */
    className?: string;
}

/**
 * GlassAlertPanel - Price alerts management panel for trading dashboard
 */
export const GlassAlertPanel: React.FC<GlassAlertPanelProps> = ({
    alerts = [
        {
            id: '1',
            symbol: 'BTC',
            condition: 'above',
            targetPrice: 100000,
            currentPrice: 96234.50,
            status: 'active',
            createdAt: new Date(Date.now() - 86400000),
            soundEnabled: true,
        },
        {
            id: '2',
            symbol: 'ETH',
            condition: 'below',
            targetPrice: 3000,
            currentPrice: 3456.78,
            status: 'active',
            createdAt: new Date(Date.now() - 172800000),
            soundEnabled: true,
        },
        {
            id: '3',
            symbol: 'SOL',
            condition: 'crosses',
            targetPrice: 250,
            currentPrice: 234.56,
            status: 'triggered',
            triggeredAt: new Date(Date.now() - 3600000),
            createdAt: new Date(Date.now() - 604800000),
            soundEnabled: false,
        },
    ],
    onDelete,
    onToggleSound,
    onAdd,
    className,
}) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newAlert, setNewAlert] = useState({
        symbol: '',
        condition: 'above' as AlertCondition,
        targetPrice: '',
        soundEnabled: true,
    });

    const activeAlerts = alerts.filter((a) => a.status === 'active');

    const formatPrice = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const handleAddAlert = () => {
        if (!newAlert.symbol || !newAlert.targetPrice) return;

        onAdd?.({
            symbol: newAlert.symbol.toUpperCase(),
            condition: newAlert.condition,
            targetPrice: parseFloat(newAlert.targetPrice),
            currentPrice: parseFloat(newAlert.targetPrice) * 0.99, // Mock current price
            soundEnabled: newAlert.soundEnabled,
        });

        setNewAlert({ symbol: '', condition: 'above', targetPrice: '', soundEnabled: true });
        setShowAddForm(false);
    };

    const getConditionLabel = (condition: AlertCondition) => {
        switch (condition) {
            case 'above': return '↑ Price goes above';
            case 'below': return '↓ Price goes below';
            case 'crosses': return '↔ Price crosses';
        }
    };

    return (
        <GlassCard className={cn('h-full flex flex-col', className)}>
            <div className="px-4 py-3 border-b border-[var(--glass-border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="font-semibold">Price Alerts</span>
                    <GlassBadge variant="glass">{activeAlerts.length}</GlassBadge>
                </div>

                <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                </GlassButton>
            </div>

            {/* Add alert form */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 border-b border-[var(--glass-border)] space-y-3"
                    >
                        <div className="flex gap-2">
                            <GlassInput
                                placeholder="Symbol (e.g. BTC)"
                                value={newAlert.symbol}
                                onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value })}
                                className="w-24"
                            />
                            <select
                                value={newAlert.condition}
                                onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value as AlertCondition })}
                                className="px-3 py-2 rounded-lg bg-[var(--glass-surface-hover)] text-sm border-none outline-none"
                            >
                                <option value="above">↑ Above</option>
                                <option value="below">↓ Below</option>
                                <option value="crosses">↔ Crosses</option>
                            </select>
                            <GlassInput
                                type="number"
                                placeholder="Price"
                                value={newAlert.targetPrice}
                                onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                                className="flex-1"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                                <input
                                    type="checkbox"
                                    checked={newAlert.soundEnabled}
                                    onChange={(e) => setNewAlert({ ...newAlert, soundEnabled: e.target.checked })}
                                    className="rounded"
                                />
                                Play sound when triggered
                            </label>
                            <div className="flex gap-2">
                                <GlassButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAddForm(false)}
                                >
                                    Cancel
                                </GlassButton>
                                <GlassButton
                                    variant="primary"
                                    size="sm"
                                    onClick={handleAddAlert}
                                    disabled={!newAlert.symbol || !newAlert.targetPrice}
                                >
                                    Create Alert
                                </GlassButton>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Alerts list */}
            <div className="flex-1 overflow-auto">
                <AnimatePresence mode="popLayout">
                    {alerts.map((alert) => (
                        <motion.div
                            key={alert.id}
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className={cn(
                                'p-4 border-b border-[var(--glass-border)] hover:bg-[var(--glass-surface-hover)] transition-colors',
                                alert.status === 'triggered' && 'bg-[var(--glass-success)]/5'
                            )}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{alert.symbol}/USD</span>
                                    <GlassBadge
                                        variant={alert.status === 'active' ? 'glass' : 'default'}
                                        className={cn(
                                            alert.status === 'triggered' && 'bg-[var(--glass-success)] text-white'
                                        )}
                                    >
                                        {alert.status}
                                    </GlassBadge>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onToggleSound?.(alert.id)}
                                        className={cn(
                                            'p-1.5 rounded-lg transition-colors',
                                            alert.soundEnabled
                                                ? 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                                : 'text-[var(--text-muted)]/50'
                                        )}
                                    >
                                        {alert.soundEnabled ? (
                                            <Volume2 className="w-4 h-4" />
                                        ) : (
                                            <VolumeX className="w-4 h-4" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => onDelete?.(alert.id)}
                                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--glass-destructive)] hover:bg-[var(--glass-destructive)]/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="text-sm text-[var(--text-secondary)] mb-2">
                                {getConditionLabel(alert.condition)}{' '}
                                <span className="font-mono font-medium">{formatPrice(alert.targetPrice)}</span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[var(--text-muted)]">
                                    Current: {formatPrice(alert.currentPrice)}
                                </span>
                                {alert.status === 'triggered' ? (
                                    <span className="text-[var(--glass-success)]">
                                        Triggered {formatTime(alert.triggeredAt!)}
                                    </span>
                                ) : (
                                    <span className="text-[var(--text-muted)]">
                                        Created {formatTime(alert.createdAt)}
                                    </span>
                                )}
                            </div>

                            {/* Progress bar */}
                            <div className="mt-2 h-1 bg-[var(--glass-surface-hover)] rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: alert.status === 'triggered'
                                            ? '100%'
                                            : `${Math.min((alert.currentPrice / alert.targetPrice) * 100, 100)}%`
                                    }}
                                    className={cn(
                                        'h-full rounded-full transition-colors',
                                        alert.status === 'triggered'
                                            ? 'bg-[var(--glass-success)]'
                                            : alert.condition === 'above'
                                                ? alert.currentPrice >= alert.targetPrice
                                                    ? 'bg-[var(--glass-success)]'
                                                    : 'bg-[var(--glass-accent)]'
                                                : alert.currentPrice <= alert.targetPrice
                                                    ? 'bg-[var(--glass-success)]'
                                                    : 'bg-[var(--glass-accent)]'
                                    )}
                                />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {alerts.length === 0 && (
                    <div className="p-8 text-center text-[var(--text-muted)]">
                        No price alerts set
                    </div>
                )}
            </div>
        </GlassCard>
    );
};

export default GlassAlertPanel;
