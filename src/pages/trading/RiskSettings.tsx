import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
    Shield,
    Target,
    AlertTriangle,
    Save,
    RotateCcw,
    DollarSign,
    BarChart3,
    Plus,
    X
} from 'lucide-react';
import {
    GlassContainer,
    GlassInput,
    GlassButton,
    GlassButtonGroup,
    GlassSelect,
    GlassForm,
    GlassFormField,
    GlassFormItem,
    GlassFormLabel,
    GlassFormControl,
    GlassFormMessage,
    GlassFormDescription
} from '@/components';
import { tradingService } from '../../services/trading';
import { TradingBreadcrumb } from '../../components/trading/TradingBreadcrumb';
import type { RiskSettings as RiskSettingsType } from '../../types/trading';

const defaultSettings: RiskSettingsType = {
    maxOpenPositions: 5,
    maxExposureUsd: 5000,
    maxPerAssetPercent: 25,
    maxPerAssetUsd: 1000,
    defaultStopLossPercent: 5,
    defaultStopLossType: 'fixed',
    defaultTakeProfitTargets: [
        { percent: 5, sellPercent: 50 },
        { percent: 10, sellPercent: 30 },
        { percent: 20, sellPercent: 20 },
    ],
};

export function RiskSettings() {
    const [saving, setSaving] = useState(false);
    const [originalSettings, setOriginalSettings] = useState<RiskSettingsType>(defaultSettings);

    const form = useForm<RiskSettingsType>({
        defaultValues: defaultSettings,
        mode: 'onChange'
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "defaultTakeProfitTargets"
    });

    // Check for changes
    const currentValues = form.watch();
    const hasChanges = JSON.stringify(currentValues) !== JSON.stringify(originalSettings);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        const response = await tradingService.getRiskSettings();
        if (response.data) {
            setOriginalSettings(response.data);
            form.reset(response.data);
        }
    }

    async function onSubmit(data: RiskSettingsType) {
        setSaving(true);
        const response = await tradingService.updateRiskSettings(data);
        if (response.success && response.data) {
            setOriginalSettings(response.data);
            form.reset(response.data);
        }
        setSaving(false);
    }

    function onReset() {
        form.reset(originalSettings);
    }

    const totalSellPercent = (form.watch('defaultTakeProfitTargets') || []).reduce((sum, t) => sum + (Number(t.sellPercent) || 0), 0);

    return (
        <div className="min-h-screen p-6 space-y-6">
            <TradingBreadcrumb />

            <GlassForm {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-primary">Risk Settings</h1>
                            <p className="text-secondary text-sm">Configure global risk management parameters</p>
                        </div>
                        <GlassButtonGroup variant="separated">
                            <GlassButton type="button" variant="secondary" onClick={onReset} disabled={!hasChanges}>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Reset
                            </GlassButton>
                            <GlassButton type="submit" disabled={!hasChanges || saving}>
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </GlassButton>
                        </GlassButtonGroup>
                    </div>

                    {/* Position Limits */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <GlassContainer className="p-5">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 rounded-lg bg-purple-500/20">
                                    <BarChart3 className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-primary">Position Limits</h2>
                                    <p className="text-sm text-secondary">Control maximum open positions</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <GlassFormField
                                    control={form.control}
                                    name="maxOpenPositions"
                                    render={({ field }) => (
                                        <GlassFormItem>
                                            <GlassFormLabel>Max Open Positions</GlassFormLabel>
                                            <GlassFormControl>
                                                <GlassInput
                                                    type="number"
                                                    min={1}
                                                    max={20}
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                />
                                            </GlassFormControl>
                                            <GlassFormDescription>Maximum concurrent positions across all bots (1-20)</GlassFormDescription>
                                            <GlassFormMessage />
                                        </GlassFormItem>
                                    )}
                                />
                            </div>
                        </GlassContainer>
                    </motion.div>

                    {/* Exposure Limits */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <GlassContainer className="p-5">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 rounded-lg bg-blue-500/20">
                                    <DollarSign className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-primary">Exposure Limits</h2>
                                    <p className="text-sm text-secondary">Cap total USD value at risk</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <GlassFormField
                                    control={form.control}
                                    name="maxExposureUsd"
                                    render={({ field }) => (
                                        <GlassFormItem>
                                            <GlassFormLabel>Max Total Exposure (USD)</GlassFormLabel>
                                            <GlassFormControl>
                                                <GlassInput
                                                    type="number"
                                                    step={100}
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                />
                                            </GlassFormControl>
                                            <GlassFormMessage />
                                        </GlassFormItem>
                                    )}
                                />
                                <GlassFormField
                                    control={form.control}
                                    name="maxPerAssetPercent"
                                    render={({ field }) => (
                                        <GlassFormItem>
                                            <GlassFormLabel>Max Per Asset (%)</GlassFormLabel>
                                            <GlassFormControl>
                                                <GlassInput
                                                    type="number"
                                                    min={1}
                                                    max={100}
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                />
                                            </GlassFormControl>
                                            <GlassFormMessage />
                                        </GlassFormItem>
                                    )}
                                />
                                <GlassFormField
                                    control={form.control}
                                    name="maxPerAssetUsd"
                                    render={({ field }) => (
                                        <GlassFormItem>
                                            <GlassFormLabel>Max Per Asset (USD)</GlassFormLabel>
                                            <GlassFormControl>
                                                <GlassInput
                                                    type="number"
                                                    step={50}
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                />
                                            </GlassFormControl>
                                            <GlassFormMessage />
                                        </GlassFormItem>
                                    )}
                                />
                            </div>
                        </GlassContainer>
                    </motion.div>

                    {/* Stop Loss */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <GlassContainer className="p-5">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 rounded-lg bg-red-500/20">
                                    <Shield className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-primary">Default Stop Loss</h2>
                                    <p className="text-sm text-secondary">Automatic position protection</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <GlassFormField
                                    control={form.control}
                                    name="defaultStopLossType"
                                    render={({ field }) => (
                                        <GlassFormItem>
                                            <GlassFormLabel>Stop Loss Type</GlassFormLabel>
                                            <GlassFormControl>
                                                <GlassSelect
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    options={[
                                                        { label: 'Fixed Percentage', value: 'fixed' },
                                                        { label: 'Trailing Stop', value: 'trailing' },
                                                        { label: 'ATR-Based', value: 'atr' },
                                                    ]}
                                                />
                                            </GlassFormControl>
                                            <GlassFormMessage />
                                        </GlassFormItem>
                                    )}
                                />

                                <GlassFormField
                                    control={form.control}
                                    name="defaultStopLossPercent"
                                    render={({ field }) => (
                                        <GlassFormItem>
                                            <GlassFormLabel>Stop Loss Percentage</GlassFormLabel>
                                            <GlassFormControl>
                                                <GlassInput
                                                    type="number"
                                                    step={0.5}
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                />
                                            </GlassFormControl>
                                            <GlassFormMessage />
                                        </GlassFormItem>
                                    )}
                                />
                            </div>
                        </GlassContainer>
                    </motion.div>

                    {/* Take Profit */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <GlassContainer className="p-5">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-500/20">
                                        <Target className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-primary">Default Take Profit Targets</h2>
                                        <p className="text-sm text-secondary">Tiered profit-taking levels</p>
                                    </div>
                                </div>
                                <GlassButton
                                    type="button"
                                    variant="secondary"
                                    onClick={() => append({ percent: 10, sellPercent: 0 })}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Target
                                </GlassButton>
                            </div>

                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex items-end gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                                        <span className="text-sm font-medium text-secondary w-20 pb-3">Target {index + 1}</span>

                                        <GlassFormField
                                            control={form.control}
                                            name={`defaultTakeProfitTargets.${index}.percent`}
                                            render={({ field }) => (
                                                <GlassFormItem className="flex-1">
                                                    <GlassFormLabel className="text-xs">At Profit %</GlassFormLabel>
                                                    <GlassFormControl>
                                                        <GlassInput
                                                            type="number"
                                                            min={1}
                                                            max={100}
                                                            {...field}
                                                            onChange={e => field.onChange(Number(e.target.value))}
                                                        />
                                                    </GlassFormControl>
                                                    <GlassFormMessage />
                                                </GlassFormItem>
                                            )}
                                        />

                                        <GlassFormField
                                            control={form.control}
                                            name={`defaultTakeProfitTargets.${index}.sellPercent`}
                                            render={({ field }) => (
                                                <GlassFormItem className="flex-1">
                                                    <GlassFormLabel className="text-xs">Sell %</GlassFormLabel>
                                                    <GlassFormControl>
                                                        <GlassInput
                                                            type="number"
                                                            min={1}
                                                            max={100}
                                                            {...field}
                                                            onChange={e => field.onChange(Number(e.target.value))}
                                                        />
                                                    </GlassFormControl>
                                                    <GlassFormMessage />
                                                </GlassFormItem>
                                            )}
                                        />

                                        {fields.length > 1 && (
                                            <GlassButton
                                                type="button"
                                                variant="ghost"
                                                onClick={() => remove(index)}
                                                className="text-red-400 hover:text-red-300 mb-0.5"
                                            >
                                                <X className="w-4 h-4" />
                                            </GlassButton>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Allocation Warning */}
                            {totalSellPercent !== 100 && (
                                <div className="mt-4 p-3 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                                    <span className="text-sm text-amber-400">
                                        Total sell percentage is {totalSellPercent}%. Should equal 100%.
                                    </span>
                                </div>
                            )}
                        </GlassContainer>
                    </motion.div>
                </form>
            </GlassForm>
        </div>
    );
}

export default RiskSettings;
