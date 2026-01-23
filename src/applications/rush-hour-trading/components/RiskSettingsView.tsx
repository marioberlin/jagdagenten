/**
 * RiskSettings - Risk Management Configuration Component
 * 
 * Allows users to configure risk parameters including:
 * - Position limits per symbol
 * - Default stop-loss percentage
 * - Default take-profit percentage
 * - Daily loss limit
 * - Max open positions
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Shield,
    AlertTriangle,
    TrendingDown,
    TrendingUp,
    DollarSign,
    Save,
    RefreshCw,
    Info,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassContainer, GlassButton } from '@/components';

// Types
interface RiskSettings {
    maxPositionSize: number;         // Max % of portfolio per position
    defaultStopLoss: number;         // Default SL %
    defaultTakeProfit: number;       // Default TP %
    dailyLossLimit: number;          // Max daily loss % before stopping
    maxOpenPositions: number;        // Max concurrent positions
    useTrailingStop: boolean;        // Enable trailing stop-loss
    trailingStopDistance: number;    // Trailing stop distance %
}

interface RiskSettingsViewProps {
    className?: string;
}

const DEFAULT_SETTINGS: RiskSettings = {
    maxPositionSize: 10,
    defaultStopLoss: 5,
    defaultTakeProfit: 15,
    dailyLossLimit: 10,
    maxOpenPositions: 5,
    useTrailingStop: false,
    trailingStopDistance: 2,
};

/**
 * RiskSettingsView - Risk management configuration panel
 */
export const RiskSettingsView: React.FC<RiskSettingsViewProps> = ({
    className,
}) => {
    const [settings, setSettings] = useState<RiskSettings>(DEFAULT_SETTINGS);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [savedMessage, setSavedMessage] = useState<string | null>(null);

    // Load settings from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('riskSettings');
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch {
                // Use defaults if parse fails
            }
        }
    }, []);

    // Track changes
    useEffect(() => {
        const saved = localStorage.getItem('riskSettings');
        if (saved) {
            setHasChanges(JSON.stringify(settings) !== saved);
        } else {
            setHasChanges(JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS));
        }
    }, [settings]);

    // Update a setting
    const updateSetting = <K extends keyof RiskSettings>(
        key: K,
        value: RiskSettings[K]
    ) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setSavedMessage(null);
    };

    // Save settings
    const saveSettings = async () => {
        setIsSaving(true);

        // Simulate API call delay (would save to database in production)
        await new Promise(resolve => setTimeout(resolve, 500));

        localStorage.setItem('riskSettings', JSON.stringify(settings));
        setHasChanges(false);
        setSavedMessage('Settings saved successfully');
        setIsSaving(false);

        // Clear message after 3 seconds
        setTimeout(() => setSavedMessage(null), 3000);
    };

    // Reset to defaults
    const resetToDefaults = () => {
        setSettings(DEFAULT_SETTINGS);
        setSavedMessage(null);
    };

    // Setting card component
    const SettingCard: React.FC<{
        icon: React.ElementType;
        title: string;
        description: string;
        iconColor?: string;
        children: React.ReactNode;
    }> = ({ icon: Icon, title, description, iconColor = 'text-[var(--glass-accent)]', children }) => (
        <GlassContainer className="p-4" border>
            <div className="flex items-start gap-4">
                <div className={cn(
                    'p-2 rounded-lg',
                    'bg-[var(--glass-surface)]/50'
                )}>
                    <Icon className={cn('w-5 h-5', iconColor)} />
                </div>
                <div className="flex-1">
                    <h3 className="font-medium text-primary mb-1">{title}</h3>
                    <p className="text-xs text-tertiary mb-4">{description}</p>
                    {children}
                </div>
            </div>
        </GlassContainer>
    );

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                        <Shield className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-primary">Risk Management</h2>
                        <p className="text-xs text-tertiary">Configure your trading risk parameters</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {savedMessage && (
                        <motion.span
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-xs text-emerald-400"
                        >
                            {savedMessage}
                        </motion.span>
                    )}
                    <GlassButton
                        variant="ghost"
                        size="sm"
                        onClick={resetToDefaults}
                        disabled={isSaving}
                    >
                        <RefreshCw className="w-4 h-4" />
                    </GlassButton>
                    <GlassButton
                        variant="primary"
                        size="sm"
                        onClick={saveSettings}
                        disabled={!hasChanges || isSaving}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save'}
                    </GlassButton>
                </div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Position Size Limit */}
                <SettingCard
                    icon={DollarSign}
                    title="Max Position Size"
                    description="Maximum percentage of portfolio to allocate per position"
                >
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-secondary">Position limit</span>
                            <span className="font-mono text-primary">{settings.maxPositionSize}%</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={settings.maxPositionSize}
                            onChange={(e) => updateSetting('maxPositionSize', parseInt(e.target.value))}
                            className="w-full accent-[var(--glass-accent)]"
                        />
                        <div className="flex justify-between text-xs text-tertiary">
                            <span>Conservative (1%)</span>
                            <span>Aggressive (50%)</span>
                        </div>
                    </div>
                </SettingCard>

                {/* Stop Loss */}
                <SettingCard
                    icon={TrendingDown}
                    title="Default Stop-Loss"
                    description="Automatic sell trigger when price drops by this percentage"
                    iconColor="text-red-400"
                >
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-secondary">Stop-loss at</span>
                            <span className="font-mono text-red-400">-{settings.defaultStopLoss}%</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="25"
                            value={settings.defaultStopLoss}
                            onChange={(e) => updateSetting('defaultStopLoss', parseInt(e.target.value))}
                            className="w-full accent-red-400"
                        />
                        <div className="flex justify-between text-xs text-tertiary">
                            <span>Tight (1%)</span>
                            <span>Wide (25%)</span>
                        </div>
                    </div>
                </SettingCard>

                {/* Take Profit */}
                <SettingCard
                    icon={TrendingUp}
                    title="Default Take-Profit"
                    description="Automatic sell trigger when price rises by this percentage"
                    iconColor="text-emerald-400"
                >
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-secondary">Take-profit at</span>
                            <span className="font-mono text-emerald-400">+{settings.defaultTakeProfit}%</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="100"
                            value={settings.defaultTakeProfit}
                            onChange={(e) => updateSetting('defaultTakeProfit', parseInt(e.target.value))}
                            className="w-full accent-emerald-400"
                        />
                        <div className="flex justify-between text-xs text-tertiary">
                            <span>Quick (5%)</span>
                            <span>Long-term (100%)</span>
                        </div>
                    </div>
                </SettingCard>

                {/* Daily Loss Limit */}
                <SettingCard
                    icon={AlertTriangle}
                    title="Daily Loss Limit"
                    description="Stop all trading if daily losses exceed this threshold"
                    iconColor="text-amber-400"
                >
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-secondary">Max daily loss</span>
                            <span className="font-mono text-amber-400">-{settings.dailyLossLimit}%</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="25"
                            value={settings.dailyLossLimit}
                            onChange={(e) => updateSetting('dailyLossLimit', parseInt(e.target.value))}
                            className="w-full accent-amber-400"
                        />
                        <div className="flex justify-between text-xs text-tertiary">
                            <span>Strict (1%)</span>
                            <span>Lenient (25%)</span>
                        </div>
                    </div>
                </SettingCard>

                {/* Max Open Positions */}
                <SettingCard
                    icon={Shield}
                    title="Max Open Positions"
                    description="Maximum number of concurrent open positions"
                >
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            {[1, 3, 5, 10, 20].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => updateSetting('maxOpenPositions', num)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                                        settings.maxOpenPositions === num
                                            ? 'bg-[var(--glass-accent)] text-white'
                                            : 'bg-[var(--glass-surface)]/50 text-secondary hover:text-primary hover:bg-[var(--glass-surface-hover)]'
                                    )}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>
                </SettingCard>

                {/* Trailing Stop */}
                <SettingCard
                    icon={TrendingUp}
                    title="Trailing Stop-Loss"
                    description="Automatically adjust stop-loss as price moves in your favor"
                    iconColor="text-blue-400"
                >
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.useTrailingStop}
                                onChange={(e) => updateSetting('useTrailingStop', e.target.checked)}
                                className="w-4 h-4 rounded accent-[var(--glass-accent)]"
                            />
                            <span className="text-sm text-secondary">Enable trailing stop</span>
                        </label>

                        {settings.useTrailingStop && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-2 pt-2"
                            >
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-secondary">Trail distance</span>
                                    <span className="font-mono text-blue-400">{settings.trailingStopDistance}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="10"
                                    step="0.5"
                                    value={settings.trailingStopDistance}
                                    onChange={(e) => updateSetting('trailingStopDistance', parseFloat(e.target.value))}
                                    className="w-full accent-blue-400"
                                />
                            </motion.div>
                        )}
                    </div>
                </SettingCard>
            </div>

            {/* Info Banner */}
            <GlassContainer className="p-4 border-l-4 border-blue-400" border>
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="text-primary font-medium mb-1">About Risk Settings</p>
                        <p className="text-tertiary">
                            These settings help protect your portfolio by automatically managing trade risks.
                            Settings are saved locally and will apply to all new trades.
                            {' '}
                            <span className="text-amber-400">
                                Currently running on Binance Testnet - no real funds at risk.
                            </span>
                        </p>
                    </div>
                </div>
            </GlassContainer>
        </div>
    );
};

export default RiskSettingsView;
