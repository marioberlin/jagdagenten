/**
 * GlassContainerSettings
 *
 * Beautiful settings panel for configuring LiquidContainer deployment.
 * Follows the design patterns from GlassSettingsApp.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Server, Cloud, Cpu, HardDrive, Network, Shield, Key, Activity,
    Plus, Trash2, Check, X, ChevronDown, ChevronRight,
    RefreshCw, Download, Upload,
    Globe, Lock, Eye, EyeOff, Box, Layers,
    ExternalLink, Info, Star, Terminal,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import {
    useContainerStore,
    PROVIDER_PRESETS,
    formatBytes,
    formatDuration,
    generateEndpointId,
    type RemoteEndpoint,
    type CloudProvider,
    type PlacementType,
    type SecretsBackend,
} from '@/stores/containerStore';

// ============================================================================
// Sub-components (Reusable UI Elements)
// ============================================================================

interface SectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    action?: React.ReactNode;
    description?: string;
    collapsed?: boolean;
    onToggle?: () => void;
}

const Section: React.FC<SectionProps> = ({
    title,
    icon,
    children,
    action,
    description,
    collapsed,
    onToggle,
}) => (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
        <button
            onClick={onToggle}
            className={cn(
                "w-full flex items-center gap-3 p-4",
                onToggle && "hover:bg-white/[0.02] cursor-pointer"
            )}
        >
            <div className="p-2 rounded-xl bg-[var(--glass-accent)]/20 text-[var(--glass-accent)]">
                {icon}
            </div>
            <div className="flex-1 text-left">
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                {description && (
                    <p className="text-xs text-white/50 mt-0.5">{description}</p>
                )}
            </div>
            {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
            {onToggle && (
                <ChevronDown
                    size={16}
                    className={cn(
                        "text-white/40 transition-transform",
                        collapsed && "-rotate-90"
                    )}
                />
            )}
        </button>
        {!collapsed && <div className="px-4 pb-4 pt-2">{children}</div>}
    </div>
);

interface RangeControlProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    onChange: (value: number) => void;
    formatValue?: (value: number) => string;
}

const RangeControl: React.FC<RangeControlProps> = ({
    label,
    value,
    min,
    max,
    step = 1,
    unit = '',
    onChange,
    formatValue,
}) => (
    <div className="flex items-center gap-4">
        <label className="w-36 text-sm text-white/70 shrink-0">{label}</label>
        <input
            type="range"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 accent-[var(--glass-accent)]"
        />
        <span className="w-24 text-right text-sm font-mono text-white/60">
            {formatValue ? formatValue(value) : `${value}${unit}`}
        </span>
    </div>
);

interface ToggleRowProps {
    icon: React.ReactNode;
    title: string;
    description?: string;
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
    icon,
    title,
    description,
    enabled,
    onToggle,
}) => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="p-2 rounded-lg bg-white/5 text-white/60">{icon}</div>
        <div className="flex-1">
            <div className="text-sm font-medium text-white">{title}</div>
            {description && (
                <div className="text-xs text-white/40">{description}</div>
            )}
        </div>
        <button
            onClick={() => onToggle(!enabled)}
            className={cn(
                "relative w-12 h-6 rounded-full transition-colors",
                enabled ? "bg-[var(--glass-accent)]" : "bg-white/20"
            )}
        >
            <motion.div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                animate={{ left: enabled ? 28 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
        </button>
    </div>
);

interface SelectRowProps {
    label: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
    description?: string;
}

const SelectRow: React.FC<SelectRowProps> = ({
    label,
    value,
    options,
    onChange,
    description,
}) => (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="flex-1">
            <div className="text-sm font-medium text-white">{label}</div>
            {description && (
                <div className="text-xs text-white/40">{description}</div>
            )}
        </div>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    </div>
);

interface InputRowProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'password' | 'number';
    description?: string;
    icon?: React.ReactNode;
}

const InputRow: React.FC<InputRowProps> = ({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    description,
    icon,
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center gap-2">
                {icon && <div className="text-white/40">{icon}</div>}
                <div className="flex-1">
                    <div className="text-sm font-medium text-white">{label}</div>
                    {description && (
                        <div className="text-xs text-white/40">{description}</div>
                    )}
                </div>
            </div>
            <div className="relative">
                <input
                    type={isPassword && !showPassword ? 'password' : 'text'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// Provider Card
// ============================================================================

interface ProviderCardProps {
    provider: typeof PROVIDER_PRESETS[0];
    selected: boolean;
    onSelect: () => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({
    provider,
    selected,
    onSelect,
}) => (
    <button
        onClick={onSelect}
        className={cn(
            "relative p-4 rounded-xl border-2 transition-all text-left group",
            selected
                ? "border-[var(--glass-accent)] bg-[var(--glass-accent)]/10"
                : "border-white/10 hover:border-white/20 bg-white/[0.02]"
        )}
    >
        {provider.recommended && (
            <div className="absolute -top-2 -right-2 p-1 rounded-full bg-amber-500">
                <Star size={12} className="text-white" />
            </div>
        )}
        <div className="flex items-start gap-3">
            <div className={cn(
                "p-2 rounded-xl",
                selected ? "bg-[var(--glass-accent)]/30" : "bg-white/10"
            )}>
                <Cloud size={18} className={selected ? "text-[var(--glass-accent)]" : "text-white/60"} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm">{provider.name}</div>
                <div className="text-xs text-white/50 mt-0.5 line-clamp-2">
                    {provider.description}
                </div>
                <div className="text-xs text-[var(--glass-accent)] mt-2 font-mono">
                    {provider.pricing}
                </div>
            </div>
        </div>
        {selected && (
            <div className="absolute top-2 left-2 p-1 rounded-full bg-[var(--glass-accent)]">
                <Check size={10} className="text-white" />
            </div>
        )}
    </button>
);

// ============================================================================
// Endpoint Card
// ============================================================================

interface EndpointCardProps {
    endpoint: RemoteEndpoint;
    onUpdate: (updates: Partial<RemoteEndpoint>) => void;
    onDelete: () => void;
    onToggle: () => void;
}

const EndpointCard: React.FC<EndpointCardProps> = ({
    endpoint,
    onUpdate,
    onDelete,
    onToggle,
}) => {
    const [expanded, setExpanded] = useState(false);
    const provider = PROVIDER_PRESETS.find((p) => p.id === endpoint.provider);

    const healthColor = {
        healthy: 'text-emerald-400',
        unhealthy: 'text-red-400',
        unknown: 'text-white/40',
    }[endpoint.healthStatus || 'unknown'];

    const healthBg = {
        healthy: 'bg-emerald-500/20',
        unhealthy: 'bg-red-500/20',
        unknown: 'bg-white/10',
    }[endpoint.healthStatus || 'unknown'];

    return (
        <div className={cn(
            "rounded-xl border transition-all overflow-hidden",
            endpoint.enabled
                ? "border-white/20 bg-white/[0.03]"
                : "border-white/10 bg-white/[0.01] opacity-60"
        )}>
            {/* Header */}
            <div className="flex items-center gap-3 p-4">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <ChevronRight
                        size={16}
                        className={cn(
                            "text-white/60 transition-transform",
                            expanded && "rotate-90"
                        )}
                    />
                </button>

                <div className={cn("p-2 rounded-xl", healthBg)}>
                    <Server size={16} className={healthColor} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-sm truncate">
                            {endpoint.name}
                        </span>
                        {provider && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/60">
                                {provider.name}
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-white/40 font-mono truncate mt-0.5">
                        {endpoint.url}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggle}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            endpoint.enabled
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-white/10 text-white/40"
                        )}
                    >
                        {endpoint.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-white/10"
                    >
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/50 block mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={endpoint.name}
                                        onChange={(e) => onUpdate({ name: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/50 block mb-1">URL</label>
                                    <input
                                        type="text"
                                        value={endpoint.url}
                                        onChange={(e) => onUpdate({ url: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/50 block mb-1">
                                        Max Containers
                                    </label>
                                    <input
                                        type="number"
                                        value={endpoint.maxContainers}
                                        onChange={(e) =>
                                            onUpdate({ maxContainers: Number(e.target.value) })
                                        }
                                        min={1}
                                        max={100}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/50 block mb-1">
                                        Weight (Priority)
                                    </label>
                                    <input
                                        type="number"
                                        value={endpoint.weight}
                                        onChange={(e) =>
                                            onUpdate({ weight: Number(e.target.value) })
                                        }
                                        min={0}
                                        max={100}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                                    />
                                </div>
                            </div>

                            {(endpoint.provider === 'bare-metal' ||
                                endpoint.provider === 'hetzner' ||
                                endpoint.provider === 'digitalocean') && (
                                <div>
                                    <label className="text-xs text-white/50 block mb-1">
                                        SSH Private Key (optional)
                                    </label>
                                    <textarea
                                        value={endpoint.sshKey || ''}
                                        onChange={(e) => onUpdate({ sshKey: e.target.value })}
                                        placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono h-20 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                                    />
                                </div>
                            )}

                            <ToggleRow
                                icon={<Lock size={14} />}
                                title="TLS Enabled"
                                description="Encrypt connections to this endpoint"
                                enabled={endpoint.tlsEnabled || false}
                                onToggle={(enabled) => onUpdate({ tlsEnabled: enabled })}
                            />

                            {/* Labels */}
                            <div>
                                <label className="text-xs text-white/50 block mb-2">
                                    Labels (for affinity rules)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(endpoint.labels).map(([key, val]) => (
                                        <span
                                            key={key}
                                            className="px-2 py-1 rounded-lg bg-white/10 text-xs font-mono"
                                        >
                                            {key}={val}
                                            <button
                                                onClick={() => {
                                                    const newLabels = { ...endpoint.labels };
                                                    delete newLabels[key];
                                                    onUpdate({ labels: newLabels });
                                                }}
                                                className="ml-2 text-white/40 hover:text-red-400"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const key = prompt('Label key:');
                                            const val = prompt('Label value:');
                                            if (key && val) {
                                                onUpdate({
                                                    labels: { ...endpoint.labels, [key]: val },
                                                });
                                            }
                                        }}
                                        className="px-2 py-1 rounded-lg bg-white/5 text-xs text-white/40 hover:text-white hover:bg-white/10"
                                    >
                                        <Plus size={12} className="inline mr-1" />
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ============================================================================
// Add Endpoint Modal
// ============================================================================

interface AddEndpointModalProps {
    onAdd: (endpoint: RemoteEndpoint) => void;
    onClose: () => void;
}

const AddEndpointModal: React.FC<AddEndpointModalProps> = ({ onAdd, onClose }) => {
    const [selectedProvider, setSelectedProvider] = useState<CloudProvider>('hetzner');
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [maxContainers, setMaxContainers] = useState(10);
    const [weight, setWeight] = useState(1);

    const provider = PROVIDER_PRESETS.find((p) => p.id === selectedProvider);

    // Update default URL when provider changes
    React.useEffect(() => {
        if (provider) {
            setUrl(provider.defaultUrl);
        }
    }, [provider]);

    const handleAdd = () => {
        if (!name.trim() || !url.trim()) return;

        onAdd({
            id: generateEndpointId(),
            name: name.trim(),
            url: url.trim(),
            provider: selectedProvider,
            maxContainers,
            weight,
            labels: {},
            enabled: true,
        });
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-lg font-bold text-white">Add Remote Endpoint</h2>
                        <p className="text-xs text-white/50 mt-1">
                            Connect to a cloud provider or bare metal server
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <X size={18} className="text-white/60" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Provider Selection */}
                    <div>
                        <h3 className="text-sm font-semibold text-white mb-3">
                            Select Provider
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {PROVIDER_PRESETS.map((p) => (
                                <ProviderCard
                                    key={p.id}
                                    provider={p}
                                    selected={selectedProvider === p.id}
                                    onSelect={() => setSelectedProvider(p.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Provider Features */}
                    {provider && (
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                            <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                                Features
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {provider.features.map((feature) => (
                                    <span
                                        key={feature}
                                        className="px-2 py-1 rounded-lg bg-[var(--glass-accent)]/10 text-[var(--glass-accent)] text-xs"
                                    >
                                        {feature}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Configuration */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-white/50 block mb-1">
                                    Endpoint Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., hetzner-eu-1"
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 block mb-1">
                                    Connection URL *
                                </label>
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder={provider?.defaultUrl || 'tcp://'}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-white/50 block mb-1">
                                    Max Containers
                                </label>
                                <input
                                    type="number"
                                    value={maxContainers}
                                    onChange={(e) => setMaxContainers(Number(e.target.value))}
                                    min={1}
                                    max={100}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 block mb-1">
                                    Weight (Priority)
                                </label>
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(Number(e.target.value))}
                                    min={0}
                                    max={100}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Setup Instructions */}
                    {provider && provider.id !== 'custom' && (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <div className="flex items-start gap-3">
                                <Info size={16} className="text-amber-400 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-amber-400">
                                        Setup Required
                                    </h4>
                                    <p className="text-xs text-white/60 mt-1">
                                        Run the setup script on your server before connecting:
                                    </p>
                                    <code className="block mt-2 p-2 rounded-lg bg-black/40 text-xs font-mono text-white/80 overflow-x-auto">
                                        ssh root@your-server {'<'} scripts/setup-remote-host.sh
                                    </code>
                                    <a
                                        href="/docs/CONTAINER_DEPLOYMENT_GUIDE.md"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 mt-2 text-xs text-[var(--glass-accent)] hover:underline"
                                    >
                                        View deployment guide
                                        <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!name.trim() || !url.trim()}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            name.trim() && url.trim()
                                ? "bg-[var(--glass-accent)] text-white hover:bg-[var(--glass-accent)]/80"
                                : "bg-white/10 text-white/40 cursor-not-allowed"
                        )}
                    >
                        <Plus size={14} className="inline mr-1" />
                        Add Endpoint
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ============================================================================
// Main Component
// ============================================================================

export const GlassContainerSettings: React.FC = () => {
    const {
        config,
        setPlacementType,
        setLocalWeight,
        setPoolSetting,
        setResourceLimit,
        setNetworkMode,
        setAllowedHosts,
        setEnableOutbound,
        setSecretsBackend,
        setSecretsConfig,
        addEndpoint,
        updateEndpoint,
        removeEndpoint,
        toggleEndpoint,
        setTelemetryEnabled,
        setTelemetryConfig,
        importConfig,
        resetToDefaults,
        exportConfig,
    } = useContainerStore();

    const [showAddEndpoint, setShowAddEndpoint] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState<
        'placement' | 'pool' | 'resources' | 'network' | 'secrets' | 'telemetry'
    >('placement');

    // Calculate total capacity
    const totalCapacity = useMemo(() => {
        const localCapacity =
            config.placement.type !== 'remote' ? config.pool.maxTotal : 0;
        const remoteCapacity = config.endpoints
            .filter((ep) => ep.enabled)
            .reduce((sum, ep) => sum + ep.maxContainers, 0);
        return localCapacity + remoteCapacity;
    }, [config]);

    const handleExport = () => {
        const json = JSON.stringify(exportConfig(), null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'liquid-container-config.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            try {
                const text = await file.text();
                const imported = JSON.parse(text);
                importConfig(imported);
            } catch (err) {
                console.error('Failed to import config:', err);
            }
        };
        input.click();
    };

    return (
        <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                        <Box className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Container Runtime</h2>
                        <p className="text-xs text-white/50">
                            Configure LiquidContainer deployment settings
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleImport}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors"
                    >
                        <Upload size={14} />
                        Import
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors"
                    >
                        <Download size={14} />
                        Export
                    </button>
                    <button
                        onClick={resetToDefaults}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
                    >
                        <RefreshCw size={14} />
                        Reset
                    </button>
                </div>
            </div>

            {/* Capacity Overview */}
            <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Box size={14} className="text-cyan-400" />
                        <span className="text-xs text-white/50">Total Capacity</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{totalCapacity}</div>
                    <div className="text-xs text-white/40">containers</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Server size={14} className="text-purple-400" />
                        <span className="text-xs text-white/50">Endpoints</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {config.endpoints.filter((ep) => ep.enabled).length}
                    </div>
                    <div className="text-xs text-white/40">
                        of {config.endpoints.length} active
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Cpu size={14} className="text-emerald-400" />
                        <span className="text-xs text-white/50">Resources</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {formatBytes(config.resources.memory)}
                    </div>
                    <div className="text-xs text-white/40">
                        {Math.round(config.resources.cpuQuota * 100)}% CPU
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Layers size={14} className="text-amber-400" />
                        <span className="text-xs text-white/50">Placement</span>
                    </div>
                    <div className="text-2xl font-bold text-white capitalize">
                        {config.placement.type}
                    </div>
                    <div className="text-xs text-white/40">
                        {config.placement.type === 'hybrid'
                            ? `${Math.round(config.placement.localWeight * 100)}% local`
                            : 'mode'}
                    </div>
                </div>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex gap-2 p-1 rounded-xl bg-white/5 w-fit">
                {[
                    { id: 'placement', label: 'Placement', icon: Globe },
                    { id: 'pool', label: 'Pool', icon: Layers },
                    { id: 'resources', label: 'Resources', icon: Cpu },
                    { id: 'network', label: 'Network', icon: Network },
                    { id: 'secrets', label: 'Secrets', icon: Key },
                    { id: 'telemetry', label: 'Telemetry', icon: Activity },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeSubTab === tab.id
                                ? "bg-[var(--glass-accent)] text-white"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeSubTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                >
                    {/* === PLACEMENT === */}
                    {activeSubTab === 'placement' && (
                        <>
                            <Section
                                title="Placement Strategy"
                                icon={<Globe size={18} />}
                                description="Choose where containers are deployed"
                            >
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    {[
                                        {
                                            id: 'local',
                                            label: 'Local Only',
                                            desc: 'Run on this machine',
                                            icon: HardDrive,
                                        },
                                        {
                                            id: 'remote',
                                            label: 'Remote Only',
                                            desc: 'Use remote endpoints',
                                            icon: Cloud,
                                        },
                                        {
                                            id: 'hybrid',
                                            label: 'Hybrid',
                                            desc: 'Balance local & remote',
                                            icon: Layers,
                                        },
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() =>
                                                setPlacementType(opt.id as PlacementType)
                                            }
                                            className={cn(
                                                "p-4 rounded-xl border-2 transition-all text-left",
                                                config.placement.type === opt.id
                                                    ? "border-[var(--glass-accent)] bg-[var(--glass-accent)]/10"
                                                    : "border-white/10 hover:border-white/20 bg-white/[0.02]"
                                            )}
                                        >
                                            <opt.icon
                                                size={20}
                                                className={
                                                    config.placement.type === opt.id
                                                        ? "text-[var(--glass-accent)]"
                                                        : "text-white/40"
                                                }
                                            />
                                            <div className="mt-2 font-medium text-white text-sm">
                                                {opt.label}
                                            </div>
                                            <div className="text-xs text-white/50">{opt.desc}</div>
                                        </button>
                                    ))}
                                </div>

                                {config.placement.type === 'hybrid' && (
                                    <RangeControl
                                        label="Local Weight"
                                        value={Math.round(config.placement.localWeight * 100)}
                                        min={0}
                                        max={100}
                                        unit="%"
                                        onChange={(v) => setLocalWeight(v / 100)}
                                    />
                                )}
                            </Section>

                            {/* Remote Endpoints */}
                            {config.placement.type !== 'local' && (
                                <Section
                                    title="Remote Endpoints"
                                    icon={<Server size={18} />}
                                    description="Manage your remote container hosts"
                                    action={
                                        <button
                                            onClick={() => setShowAddEndpoint(true)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--glass-accent)]/20 text-[var(--glass-accent)] text-sm font-medium hover:bg-[var(--glass-accent)]/30 transition-colors"
                                        >
                                            <Plus size={14} />
                                            Add
                                        </button>
                                    }
                                >
                                    {config.endpoints.length > 0 ? (
                                        <div className="space-y-3">
                                            {config.endpoints.map((endpoint) => (
                                                <EndpointCard
                                                    key={endpoint.id}
                                                    endpoint={endpoint}
                                                    onUpdate={(updates) =>
                                                        updateEndpoint(endpoint.id, updates)
                                                    }
                                                    onDelete={() => removeEndpoint(endpoint.id)}
                                                    onToggle={() => toggleEndpoint(endpoint.id)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-white/40">
                                            <Server size={32} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No remote endpoints configured</p>
                                            <p className="text-xs">
                                                Add a cloud provider or bare metal server
                                            </p>
                                        </div>
                                    )}
                                </Section>
                            )}
                        </>
                    )}

                    {/* === POOL === */}
                    {activeSubTab === 'pool' && (
                        <Section
                            title="Pool Configuration"
                            icon={<Layers size={18} />}
                            description="Manage container pool settings"
                        >
                            <div className="space-y-6">
                                <InputRow
                                    label="Container Image"
                                    value={config.pool.image}
                                    onChange={(v) => setPoolSetting('image', v)}
                                    placeholder="ghcr.io/liquidcrypto/liquid-container:latest"
                                    icon={<Box size={14} />}
                                    description="Docker image for agent containers"
                                />

                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <RangeControl
                                        label="Min Idle"
                                        value={config.pool.minIdle}
                                        min={0}
                                        max={20}
                                        onChange={(v) => setPoolSetting('minIdle', v)}
                                    />
                                    <RangeControl
                                        label="Max Total"
                                        value={config.pool.maxTotal}
                                        min={1}
                                        max={100}
                                        onChange={(v) => setPoolSetting('maxTotal', v)}
                                    />
                                    <RangeControl
                                        label="Idle Timeout"
                                        value={config.pool.idleTimeout}
                                        min={60000}
                                        max={3600000}
                                        step={60000}
                                        formatValue={formatDuration}
                                        onChange={(v) => setPoolSetting('idleTimeout', v)}
                                    />
                                    <RangeControl
                                        label="Acquire Timeout"
                                        value={config.pool.acquireTimeout}
                                        min={1000}
                                        max={30000}
                                        step={1000}
                                        formatValue={formatDuration}
                                        onChange={(v) => setPoolSetting('acquireTimeout', v)}
                                    />
                                    <RangeControl
                                        label="Health Check Interval"
                                        value={config.pool.healthCheckInterval}
                                        min={10000}
                                        max={300000}
                                        step={10000}
                                        formatValue={formatDuration}
                                        onChange={(v) => setPoolSetting('healthCheckInterval', v)}
                                    />
                                </div>
                            </div>
                        </Section>
                    )}

                    {/* === RESOURCES === */}
                    {activeSubTab === 'resources' && (
                        <Section
                            title="Resource Limits"
                            icon={<Cpu size={18} />}
                            description="Set container resource constraints"
                        >
                            <div className="space-y-4">
                                <RangeControl
                                    label="Memory"
                                    value={config.resources.memory}
                                    min={134217728} // 128 MB
                                    max={4294967296} // 4 GB
                                    step={134217728} // 128 MB steps
                                    formatValue={formatBytes}
                                    onChange={(v) => setResourceLimit('memory', v)}
                                />
                                <RangeControl
                                    label="CPU Quota"
                                    value={Math.round(config.resources.cpuQuota * 100)}
                                    min={10}
                                    max={400}
                                    step={10}
                                    unit="%"
                                    onChange={(v) => setResourceLimit('cpuQuota', v / 100)}
                                />
                                <RangeControl
                                    label="PIDs Limit"
                                    value={config.resources.pidsLimit}
                                    min={10}
                                    max={1000}
                                    step={10}
                                    onChange={(v) => setResourceLimit('pidsLimit', v)}
                                />
                                <RangeControl
                                    label="Max Execution Time"
                                    value={config.resources.maxExecutionTime}
                                    min={10000}
                                    max={600000}
                                    step={10000}
                                    formatValue={formatDuration}
                                    onChange={(v) => setResourceLimit('maxExecutionTime', v)}
                                />
                            </div>

                            {/* Presets */}
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <h4 className="text-sm font-medium text-white/60 mb-3">
                                    Quick Presets
                                </h4>
                                <div className="flex gap-2 flex-wrap">
                                    {[
                                        {
                                            label: 'Minimal',
                                            memory: 268435456,
                                            cpu: 0.25,
                                            pids: 50,
                                            time: 30000,
                                        },
                                        {
                                            label: 'Standard',
                                            memory: 536870912,
                                            cpu: 0.5,
                                            pids: 100,
                                            time: 60000,
                                        },
                                        {
                                            label: 'Performance',
                                            memory: 1073741824,
                                            cpu: 1.0,
                                            pids: 200,
                                            time: 120000,
                                        },
                                        {
                                            label: 'Heavy',
                                            memory: 2147483648,
                                            cpu: 2.0,
                                            pids: 500,
                                            time: 300000,
                                        },
                                    ].map((preset) => (
                                        <button
                                            key={preset.label}
                                            onClick={() => {
                                                setResourceLimit('memory', preset.memory);
                                                setResourceLimit('cpuQuota', preset.cpu);
                                                setResourceLimit('pidsLimit', preset.pids);
                                                setResourceLimit('maxExecutionTime', preset.time);
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white transition-colors"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Section>
                    )}

                    {/* === NETWORK === */}
                    {activeSubTab === 'network' && (
                        <Section
                            title="Network Configuration"
                            icon={<Network size={18} />}
                            description="Control container network access"
                        >
                            <div className="space-y-4">
                                <SelectRow
                                    label="Network Mode"
                                    value={config.network.mode}
                                    onChange={(v) =>
                                        setNetworkMode(v as 'none' | 'bridge' | 'host')
                                    }
                                    options={[
                                        { value: 'none', label: 'None (Isolated)' },
                                        { value: 'bridge', label: 'Bridge (Default)' },
                                        { value: 'host', label: 'Host (Unrestricted)' },
                                    ]}
                                    description="Container network isolation level"
                                />

                                <ToggleRow
                                    icon={<Globe size={14} />}
                                    title="Enable Outbound"
                                    description="Allow containers to make external requests"
                                    enabled={config.network.enableOutbound}
                                    onToggle={setEnableOutbound}
                                />

                                {config.network.enableOutbound && (
                                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                        <label className="text-xs text-white/50 block mb-2">
                                            Allowed Hosts (one per line)
                                        </label>
                                        <textarea
                                            value={config.network.allowedHosts.join('\n')}
                                            onChange={(e) =>
                                                setAllowedHosts(
                                                    e.target.value.split('\n').filter((h) => h.trim())
                                                )
                                            }
                                            placeholder="api.example.com&#10;*.trusted-domain.com"
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--glass-accent)]"
                                        />
                                        <p className="text-xs text-white/40 mt-2">
                                            {config.network.allowedHosts.length} host
                                            {config.network.allowedHosts.length !== 1 ? 's' : ''}{' '}
                                            configured. Use * for wildcards.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Section>
                    )}

                    {/* === SECRETS === */}
                    {activeSubTab === 'secrets' && (
                        <Section
                            title="Secrets Management"
                            icon={<Key size={18} />}
                            description="Configure secrets injection"
                        >
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        {
                                            id: 'env',
                                            label: 'Environment',
                                            desc: 'From env vars',
                                            icon: Terminal,
                                        },
                                        {
                                            id: 'vault',
                                            label: 'HashiCorp Vault',
                                            desc: 'KV secrets engine',
                                            icon: Shield,
                                        },
                                        {
                                            id: 'aws',
                                            label: 'AWS Secrets',
                                            desc: 'Secrets Manager',
                                            icon: Cloud,
                                        },
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() =>
                                                setSecretsBackend(opt.id as SecretsBackend)
                                            }
                                            className={cn(
                                                "p-4 rounded-xl border-2 transition-all text-left",
                                                config.secrets.backend === opt.id
                                                    ? "border-[var(--glass-accent)] bg-[var(--glass-accent)]/10"
                                                    : "border-white/10 hover:border-white/20 bg-white/[0.02]"
                                            )}
                                        >
                                            <opt.icon
                                                size={20}
                                                className={
                                                    config.secrets.backend === opt.id
                                                        ? "text-[var(--glass-accent)]"
                                                        : "text-white/40"
                                                }
                                            />
                                            <div className="mt-2 font-medium text-white text-sm">
                                                {opt.label}
                                            </div>
                                            <div className="text-xs text-white/50">{opt.desc}</div>
                                        </button>
                                    ))}
                                </div>

                                {/* Backend-specific config */}
                                <AnimatePresence mode="wait">
                                    {config.secrets.backend === 'env' && (
                                        <motion.div
                                            key="env"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                        >
                                            <InputRow
                                                label="Environment Prefix"
                                                value={config.secrets.envPrefix}
                                                onChange={(v) => setSecretsConfig({ envPrefix: v })}
                                                placeholder="LIQUID_SECRET_"
                                                description="Prefix for secret environment variables"
                                            />
                                        </motion.div>
                                    )}

                                    {config.secrets.backend === 'vault' && (
                                        <motion.div
                                            key="vault"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-4"
                                        >
                                            <InputRow
                                                label="Vault Address"
                                                value={config.secrets.vaultAddress || ''}
                                                onChange={(v) =>
                                                    setSecretsConfig({ vaultAddress: v })
                                                }
                                                placeholder="https://vault.example.com:8200"
                                                description="HashiCorp Vault server URL"
                                            />
                                            <InputRow
                                                label="Secret Path"
                                                value={config.secrets.vaultPath || ''}
                                                onChange={(v) => setSecretsConfig({ vaultPath: v })}
                                                placeholder="secret/data/liquid-container"
                                                description="KV v2 secret path"
                                            />
                                        </motion.div>
                                    )}

                                    {config.secrets.backend === 'aws' && (
                                        <motion.div
                                            key="aws"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-4"
                                        >
                                            <SelectRow
                                                label="AWS Region"
                                                value={config.secrets.awsRegion || 'us-east-1'}
                                                onChange={(v) => setSecretsConfig({ awsRegion: v })}
                                                options={[
                                                    { value: 'us-east-1', label: 'US East (N. Virginia)' },
                                                    { value: 'us-west-2', label: 'US West (Oregon)' },
                                                    { value: 'eu-west-1', label: 'EU (Ireland)' },
                                                    { value: 'eu-central-1', label: 'EU (Frankfurt)' },
                                                    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
                                                ]}
                                                description="AWS Secrets Manager region"
                                            />
                                            <InputRow
                                                label="Secret Prefix"
                                                value={config.secrets.awsSecretPrefix || ''}
                                                onChange={(v) =>
                                                    setSecretsConfig({ awsSecretPrefix: v })
                                                }
                                                placeholder="liquid-container/"
                                                description="Prefix for secret names"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </Section>
                    )}

                    {/* === TELEMETRY === */}
                    {activeSubTab === 'telemetry' && (
                        <Section
                            title="Telemetry & Observability"
                            icon={<Activity size={18} />}
                            description="Configure metrics and tracing"
                        >
                            <div className="space-y-4">
                                <ToggleRow
                                    icon={<Activity size={14} />}
                                    title="Enable Telemetry"
                                    description="Send metrics and traces to OpenTelemetry collector"
                                    enabled={config.telemetry.enabled}
                                    onToggle={setTelemetryEnabled}
                                />

                                {config.telemetry.enabled && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4"
                                    >
                                        <InputRow
                                            label="OTLP Endpoint"
                                            value={config.telemetry.endpoint || ''}
                                            onChange={(v) =>
                                                setTelemetryConfig({ endpoint: v })
                                            }
                                            placeholder="http://localhost:4318"
                                            description="OpenTelemetry collector endpoint"
                                        />
                                        <InputRow
                                            label="Service Name"
                                            value={config.telemetry.serviceName}
                                            onChange={(v) =>
                                                setTelemetryConfig({ serviceName: v })
                                            }
                                            placeholder="liquid-container"
                                            description="Service name for traces"
                                        />
                                    </motion.div>
                                )}
                            </div>
                        </Section>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Add Endpoint Modal */}
            <AnimatePresence>
                {showAddEndpoint && (
                    <AddEndpointModal
                        onAdd={addEndpoint}
                        onClose={() => setShowAddEndpoint(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default GlassContainerSettings;
