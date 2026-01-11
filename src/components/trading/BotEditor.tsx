import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
    ArrowLeft,
    Save,
    AlertTriangle,
    TestTube,
    Zap,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import {
    GlassContainer,
    GlassInput,
    GlassButton,
    GlassForm,
    GlassFormField,
    GlassFormItem,
    GlassFormLabel,
    GlassFormControl,
    GlassFormMessage
} from '@/components';
import { GlassButtonGroup } from '@/components/primitives/GlassButtonGroup';
import { GlassSortableList, GlassSortableItem } from '@/components/layout/GlassDragDrop';
import { LogicLayerCard } from './LogicLayerCard';
import { LogicLayerPalette } from './LogicLayerPalette';
import type { Bot, BotParameters, LogicLayer, BotLogicLayerMapping } from '../../types/trading';

interface BotEditorProps {
    bot?: Bot;
    availableLayers: LogicLayer[];
    assignedLayers: BotLogicLayerMapping[];
    onSave: (bot: Partial<Bot>, layers: BotLogicLayerMapping[]) => void;
    onCancel: () => void;
    saving?: boolean;
}

const defaultParameters: BotParameters = {
    position_size_usd: 100,
    max_open_positions: 5,
    stop_loss_percent: 5,
    risk_per_trade_percent: 1,
};

type BotFormData = {
    name: string;
    type: 'buy' | 'sell';
    symbols: string;
    blacklist: string;
    test_mode: boolean;
    active: boolean;
    webhook_enabled: boolean;
    parameters: BotParameters;
};

export function BotEditor({
    bot,
    availableLayers,
    assignedLayers: initialAssignedLayers,
    onSave,
    onCancel,
    saving = false,
}: BotEditorProps) {
    const isNew = !bot;

    // Form setup
    const form = useForm<BotFormData>({
        defaultValues: {
            name: bot?.name || '',
            type: bot?.type || 'buy',
            symbols: bot?.symbols || '',
            blacklist: bot?.blacklist || '',
            test_mode: bot?.test_mode ?? true,
            active: bot?.active ?? false,
            webhook_enabled: bot?.webhook_enabled ?? false,
            parameters: bot?.parameters || defaultParameters,
        },
        mode: 'onChange'
    });

    // Logic layers state (kept separate as it's complex UI state)
    const [assignedLayers, setAssignedLayers] = useState<BotLogicLayerMapping[]>(initialAssignedLayers);

    // UI state
    const [showWebhook, setShowWebhook] = useState(false);

    // Handle save
    function onSubmit(data: BotFormData) {
        const botData: Partial<Bot> = {
            ...data,
            blacklist: data.blacklist || undefined,
        };

        if (bot) {
            botData.bot_id = bot.bot_id;
        }

        onSave(botData, assignedLayers);
    }

    // Add logic layer
    function addLayer(layer: LogicLayer) {
        const newMapping: BotLogicLayerMapping = {
            bot_id: bot?.bot_id || 0,
            logic_layer_id: layer.id,
            execution_order: assignedLayers.length + 1,
            active: true,
            config: {},
        };
        setAssignedLayers(prev => [...prev, newMapping]);
    }

    // Remove logic layer
    function removeLayer(layerId: string) {
        setAssignedLayers(prev =>
            prev.filter(l => l.logic_layer_id !== layerId)
                .map((l, i) => ({ ...l, execution_order: i + 1 }))
        );
    }

    // Reorder logic layers
    function reorderLayers(newLayers: BotLogicLayerMapping[]) {
        setAssignedLayers(
            newLayers.map((l, i) => ({ ...l, execution_order: i + 1 }))
        );
    }

    // Get layer details by ID
    function getLayerById(id: string): LogicLayer | undefined {
        return availableLayers.find(l => l.id === id);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <GlassButton variant="ghost" onClick={onCancel}>
                    <ArrowLeft className="w-4 h-4" />
                </GlassButton>
                <div>
                    <h2 className="text-xl font-semibold text-primary">
                        {isNew ? 'Create New Bot' : `Edit ${bot?.name}`}
                    </h2>
                    <p className="text-sm text-secondary">
                        Configure your trading bot settings and logic layers
                    </p>
                </div>
            </div>

            <GlassForm {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <GlassContainer className="p-5">
                            <h3 className="text-lg font-semibold text-primary mb-4">Basic Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <GlassFormField
                                    control={form.control}
                                    name="name"
                                    rules={{ required: 'Bot name is required' }}
                                    render={({ field }) => (
                                        <GlassFormItem>
                                            <GlassFormLabel>Bot Name</GlassFormLabel>
                                            <GlassFormControl>
                                                <GlassInput placeholder="My Trading Bot" {...field} />
                                            </GlassFormControl>
                                            <GlassFormMessage />
                                        </GlassFormItem>
                                    )}
                                />

                                <GlassFormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <GlassFormItem>
                                            <GlassFormLabel>Bot Type</GlassFormLabel>
                                            <GlassFormControl>
                                                <GlassButtonGroup fullWidth>
                                                    <GlassButton
                                                        type="button"
                                                        variant={field.value === 'buy' ? 'primary' : 'ghost'}
                                                        onClick={() => field.onChange('buy')}
                                                    >
                                                        BUY
                                                    </GlassButton>
                                                    <GlassButton
                                                        type="button"
                                                        variant={field.value === 'sell' ? 'primary' : 'ghost'}
                                                        onClick={() => field.onChange('sell')}
                                                    >
                                                        SELL
                                                    </GlassButton>
                                                </GlassButtonGroup>
                                            </GlassFormControl>
                                            <GlassFormMessage />
                                        </GlassFormItem>
                                    )}
                                />
                            </div>

                            {/* Toggles */}
                            <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-white/10">
                                <GlassFormField
                                    control={form.control}
                                    name="test_mode"
                                    render={({ field }) => (
                                        <GlassFormItem className="flex flex-row items-center space-y-0 gap-2">
                                            <GlassFormControl>
                                                <input
                                                    type="checkbox"
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    className="w-4 h-4 rounded"
                                                />
                                            </GlassFormControl>
                                            <GlassFormLabel className="cursor-pointer flex items-center gap-2 font-normal">
                                                <TestTube className="w-4 h-4 text-amber-400" />
                                                Test Mode
                                            </GlassFormLabel>
                                        </GlassFormItem>
                                    )}
                                />

                                <GlassFormField
                                    control={form.control}
                                    name="active"
                                    render={({ field }) => (
                                        <GlassFormItem className="flex flex-row items-center space-y-0 gap-2">
                                            <GlassFormControl>
                                                <input
                                                    type="checkbox"
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    className="w-4 h-4 rounded"
                                                />
                                            </GlassFormControl>
                                            <GlassFormLabel className="cursor-pointer font-normal">
                                                Active
                                            </GlassFormLabel>
                                        </GlassFormItem>
                                    )}
                                />
                            </div>

                            {/* Test Mode Warning */}
                            {!form.watch('test_mode') && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center gap-2"
                                >
                                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                    <span className="text-sm text-red-400">
                                        <strong>Live Mode:</strong> This bot will trade with real funds. Ensure proper risk management.
                                    </span>
                                </motion.div>
                            )}
                        </GlassContainer>

                        {/* Symbols */}
                        <GlassContainer className="p-5">
                            <h3 className="text-lg font-semibold text-primary mb-4">Trading Pairs</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <GlassFormField
                                    control={form.control}
                                    name="symbols"
                                    rules={{ required: 'At least one symbol is required' }}
                                    render={({ field }) => (
                                        <GlassFormItem>
                                            <GlassFormLabel>Symbols</GlassFormLabel>
                                            <GlassFormControl>
                                                <GlassInput placeholder="BTCUSDT, ETHUSDT, *USDT" {...field} />
                                            </GlassFormControl>
                                            <p className="text-xs text-secondary mt-1">Comma-separated or use wildcards like *USDT</p>
                                            <GlassFormMessage />
                                        </GlassFormItem>
                                    )}
                                />

                                <GlassFormField
                                    control={form.control}
                                    name="blacklist"
                                    render={({ field }) => (
                                        <GlassFormItem>
                                            <GlassFormLabel>Blacklist</GlassFormLabel>
                                            <GlassFormControl>
                                                <GlassInput placeholder="global or BTCUSDT, ETHUSDT" {...field} />
                                            </GlassFormControl>
                                            <p className="text-xs text-secondary mt-1">Use 'global' for global blacklist</p>
                                            <GlassFormMessage />
                                        </GlassFormItem>
                                    )}
                                />
                            </div>
                        </GlassContainer>

                        {/* Logic Layers */}
                        <GlassContainer className="p-5">
                            <h3 className="text-lg font-semibold text-primary mb-4">
                                Logic Layers ({assignedLayers.length})
                            </h3>
                            <p className="text-sm text-secondary mb-4">
                                Drag to reorder execution priority. Layers execute top to bottom.
                            </p>

                            {assignedLayers.length === 0 ? (
                                <div className="text-center py-8 text-tertiary border-2 border-dashed border-white/10 rounded-lg">
                                    Add logic layers from the palette on the right
                                </div>
                            ) : (
                                <GlassSortableList
                                    items={assignedLayers}
                                    keyField="logic_layer_id"
                                    onReorder={reorderLayers}
                                    className="space-y-2"
                                    renderItem={(mapping) => {
                                        const layer = getLayerById(mapping.logic_layer_id);
                                        if (!layer) return null;

                                        return (
                                            <GlassSortableItem
                                                id={mapping.logic_layer_id}
                                                enableDragOnItem={false}
                                            >
                                                <LogicLayerCard
                                                    layer={layer}
                                                    isAssigned
                                                    showDragHandle
                                                    onRemove={() => removeLayer(mapping.logic_layer_id)}
                                                />
                                            </GlassSortableItem>
                                        );
                                    }}
                                />
                            )}
                        </GlassContainer>

                        {/* Risk Parameters */}
                        <GlassContainer className="p-5">
                            <h3 className="text-lg font-semibold text-primary mb-4">Risk Parameters</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <GlassFormField
                                    control={form.control}
                                    name="parameters.position_size_usd"
                                    render={({ field }) => (
                                        <GlassFormItem>
                                            <GlassFormLabel>Position Size (USD)</GlassFormLabel>
                                            <GlassFormControl>
                                                <GlassInput
                                                    type="number"
                                                    min={10}
                                                    step={10}
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
                                    name="parameters.max_open_positions"
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
                                            <GlassFormMessage />
                                        </GlassFormItem>
                                    )}
                                />
                                <GlassFormField
                                    control={form.control}
                                    name="parameters.stop_loss_percent"
                                    render={({ field }) => (
                                        <GlassFormItem>
                                            <GlassFormLabel>Stop Loss (%)</GlassFormLabel>
                                            <GlassFormControl>
                                                <GlassInput
                                                    type="number"
                                                    min={1}
                                                    max={50}
                                                    step={0.5}
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
                                    name="parameters.risk_per_trade_percent"
                                    render={({ field }) => (
                                        <GlassFormItem>
                                            <GlassFormLabel>Risk Per Trade (%)</GlassFormLabel>
                                            <GlassFormControl>
                                                <GlassInput
                                                    type="number"
                                                    min={0.1}
                                                    max={10}
                                                    step={0.1}
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

                        {/* Webhook (Collapsible) */}
                        <GlassContainer className="p-5">
                            <button
                                type="button"
                                onClick={() => setShowWebhook(!showWebhook)}
                                className="w-full flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-purple-400" />
                                    <h3 className="text-lg font-semibold text-primary">Webhook Configuration</h3>
                                </div>
                                {showWebhook ? (
                                    <ChevronUp className="w-4 h-4 text-secondary" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-secondary" />
                                )}
                            </button>

                            <AnimatePresence>
                                {showWebhook && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 pt-4 border-t border-white/10"
                                    >
                                        <GlassFormField
                                            control={form.control}
                                            name="webhook_enabled"
                                            render={({ field }) => (
                                                <GlassFormItem className="flex flex-row items-center space-y-0 gap-2 mb-4">
                                                    <GlassFormControl>
                                                        <input
                                                            type="checkbox"
                                                            checked={field.value}
                                                            onChange={field.onChange}
                                                            className="w-4 h-4 rounded"
                                                        />
                                                    </GlassFormControl>
                                                    <GlassFormLabel className="cursor-pointer font-normal">
                                                        Enable Webhooks
                                                    </GlassFormLabel>
                                                </GlassFormItem>
                                            )}
                                        />

                                        {form.watch('webhook_enabled') && (
                                            <p className="text-sm text-secondary">
                                                Webhook URL will be available after saving the bot.
                                            </p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </GlassContainer>
                    </div>

                    {/* Sidebar - Logic Layer Palette */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6">
                            <LogicLayerPalette
                                layers={availableLayers}
                                assignedLayerIds={assignedLayers.map(l => l.logic_layer_id)}
                                onAssign={addLayer}
                            />
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-4 mt-6 border-t border-white/10 lg:border-none lg:pt-0 lg:mt-6">
                            <GlassButtonGroup>
                                <GlassButton type="button" variant="ghost" onClick={onCancel}>
                                    Cancel
                                </GlassButton>
                                <GlassButton type="submit" disabled={saving}>
                                    <Save className="w-4 h-4 mr-2" />
                                    {saving ? 'Saving...' : isNew ? 'Create Bot' : 'Save Changes'}
                                </GlassButton>
                            </GlassButtonGroup>
                        </div>
                    </div>
                </form>
            </GlassForm>
        </div>
    );
}

export default BotEditor;
