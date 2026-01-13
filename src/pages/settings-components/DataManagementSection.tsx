import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database,
    Download,
    Upload,
    Trash2,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    FileJson,
    FileText,
    Palette,
    Bot,
    Settings,
    BarChart3,
    Clock,
    ShieldAlert,
} from 'lucide-react';
import { GlassContainer, GlassButton } from '@/components';
import { cn } from '@/utils/cn';

// ============================================
// Types
// ============================================

type ExportFormat = 'json' | 'csv';

interface ExportOption {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    data: string;
    selected: boolean;
}

// ============================================
// Confirmation Dialog Component
// ============================================

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmLabel: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    title,
    message,
    confirmLabel,
    confirmVariant = 'danger',
    onConfirm,
    onCancel,
}) => {
    const [confirming, setConfirming] = useState(false);

    const handleConfirm = async () => {
        setConfirming(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        onConfirm();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onCancel}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="relative w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <GlassContainer className="p-6" border>
                    <div className="flex items-center gap-3 mb-4">
                        <div className={cn(
                            'p-3 rounded-xl',
                            confirmVariant === 'danger' && 'bg-red-500/20',
                            confirmVariant === 'warning' && 'bg-amber-500/20',
                            confirmVariant === 'primary' && 'bg-primary/20'
                        )}>
                            {confirmVariant === 'danger' ? (
                                <ShieldAlert className="w-6 h-6 text-red-400" />
                            ) : (
                                <AlertTriangle className={cn(
                                    'w-6 h-6',
                                    confirmVariant === 'warning' ? 'text-amber-400' : 'text-primary'
                                )} />
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-primary">{title}</h3>
                        </div>
                    </div>

                    <p className="text-sm text-secondary mb-6">{message}</p>

                    <div className="flex justify-end gap-3">
                        <GlassButton variant="secondary" onClick={onCancel} disabled={confirming}>
                            Cancel
                        </GlassButton>
                        <GlassButton
                            variant={confirmVariant === 'danger' ? 'primary' : 'secondary'}
                            onClick={handleConfirm}
                            disabled={confirming}
                            className={cn(
                                confirmVariant === 'danger' && 'bg-red-500 hover:bg-red-600 text-white'
                            )}
                        >
                            {confirming ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : null}
                            {confirmLabel}
                        </GlassButton>
                    </div>
                </GlassContainer>
            </motion.div>
        </motion.div>
    );
};

// ============================================
// Export Section Component
// ============================================

const ExportSection: React.FC = () => {
    const [format, setFormat] = useState<ExportFormat>('json');
    const [exporting, setExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);
    const [options, setOptions] = useState<ExportOption[]>([
        { id: 'theme', label: 'Theme Settings', description: 'Colors, glass effects, typography', icon: <Palette className="w-4 h-4" />, data: 'theme', selected: true },
        { id: 'agent', label: 'Agent Configuration', description: 'System prompts, knowledge base', icon: <Bot className="w-4 h-4" />, data: 'agent', selected: true },
        { id: 'preferences', label: 'Preferences', description: 'Accessibility, keyboard shortcuts', icon: <Settings className="w-4 h-4" />, data: 'preferences', selected: true },
        { id: 'trading', label: 'Trading Data', description: 'Positions, history, bots', icon: <BarChart3 className="w-4 h-4" />, data: 'trading', selected: false },
    ]);

    const toggleOption = (id: string) => {
        setOptions(prev => prev.map(opt =>
            opt.id === id ? { ...opt, selected: !opt.selected } : opt
        ));
    };

    const handleExport = async () => {
        setExporting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setExporting(false);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
    };

    const selectedCount = options.filter(o => o.selected).length;

    return (
        <GlassContainer className="p-6" border>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-emerald-500/20">
                    <Download className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h4 className="text-base font-semibold text-primary">Export Settings</h4>
                    <p className="text-xs text-secondary">Save your configuration to a file</p>
                </div>
            </div>

            {/* Format Selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-secondary mb-2">Format</label>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFormat('json')}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                            format === 'json'
                                ? 'bg-primary text-white'
                                : 'bg-white/5 text-secondary hover:bg-white/10'
                        )}
                    >
                        <FileJson className="w-4 h-4" />
                        JSON
                    </button>
                    <button
                        onClick={() => setFormat('csv')}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                            format === 'csv'
                                ? 'bg-primary text-white'
                                : 'bg-white/5 text-secondary hover:bg-white/10'
                        )}
                    >
                        <FileText className="w-4 h-4" />
                        CSV
                    </button>
                </div>
            </div>

            {/* Options */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-secondary mb-2">
                    Data to Export ({selectedCount} selected)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {options.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => toggleOption(option.id)}
                            className={cn(
                                'flex items-start gap-3 p-3 rounded-xl text-left transition-all',
                                option.selected
                                    ? 'bg-primary/20 border-2 border-primary'
                                    : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                            )}
                        >
                            <div className={cn(
                                'p-2 rounded-lg',
                                option.selected ? 'bg-primary/30' : 'bg-white/10'
                            )}>
                                {option.icon}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-primary">{option.label}</div>
                                <div className="text-xs text-secondary">{option.description}</div>
                            </div>
                            {option.selected && (
                                <CheckCircle className="w-4 h-4 text-primary ml-auto" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Export Button */}
            <GlassButton
                variant="primary"
                onClick={handleExport}
                disabled={exporting || selectedCount === 0}
                className="w-full"
            >
                {exporting ? (
                    <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Exporting...
                    </>
                ) : exportSuccess ? (
                    <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Downloaded!
                    </>
                ) : (
                    <>
                        <Download className="w-4 h-4 mr-2" />
                        Export {format.toUpperCase()}
                    </>
                )}
            </GlassButton>
        </GlassContainer>
    );
};

// ============================================
// Import Section Component
// ============================================

const ImportSection: React.FC = () => {
    const [importing, setImporting] = useState(false);
    const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
    const [dragOver, setDragOver] = useState(false);

    const handleImport = async () => {
        setImporting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setImporting(false);
    };

    return (
        <GlassContainer className="p-6" border>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-blue-500/20">
                    <Upload className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h4 className="text-base font-semibold text-primary">Import Settings</h4>
                    <p className="text-xs text-secondary">Restore from a backup file</p>
                </div>
            </div>

            {/* Import Mode */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-secondary mb-2">Import Mode</label>
                <div className="flex gap-2">
                    <button
                        onClick={() => setImportMode('merge')}
                        className={cn(
                            'flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                            importMode === 'merge'
                                ? 'bg-primary text-white'
                                : 'bg-white/5 text-secondary hover:bg-white/10'
                        )}
                    >
                        Merge (Recommended)
                    </button>
                    <button
                        onClick={() => setImportMode('replace')}
                        className={cn(
                            'flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                            importMode === 'replace'
                                ? 'bg-primary text-white'
                                : 'bg-white/5 text-secondary hover:bg-white/10'
                        )}
                    >
                        Replace All
                    </button>
                </div>
                <p className="text-xs text-tertiary mt-2">
                    {importMode === 'merge'
                        ? 'New settings will be added, existing ones will be updated'
                        : 'All current settings will be overwritten'}
                </p>
            </div>

            {/* Drop Zone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleImport();
                }}
                className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center transition-all',
                    dragOver
                        ? 'border-primary bg-primary/10'
                        : 'border-white/20 hover:border-white/40'
                )}
            >
                <Upload className="w-8 h-8 mx-auto mb-3 text-secondary" />
                <p className="text-sm text-primary mb-1">Drop your settings file here</p>
                <p className="text-xs text-secondary mb-4">or</p>
                <GlassButton
                    variant="secondary"
                    onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json,.csv';
                        input.onchange = () => handleImport();
                        input.click();
                    }}
                    disabled={importing}
                >
                    {importing ? (
                        <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Importing...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4 mr-2" />
                            Browse Files
                        </>
                    )}
                </GlassButton>
            </div>
        </GlassContainer>
    );
};

// ============================================
// Reset Section Component
// ============================================

const ResetSection: React.FC = () => {
    const [showConfirm, setShowConfirm] = useState<'section' | 'all' | 'factory' | null>(null);

    const resetOptions = [
        { id: 'section', label: 'Reset Theme Only', description: 'Reset colors and glass effects to defaults', variant: 'warning' as const },
        { id: 'all', label: 'Reset All Settings', description: 'Reset all preferences but keep data', variant: 'warning' as const },
        { id: 'factory', label: 'Factory Reset', description: 'Delete all data and start fresh', variant: 'danger' as const },
    ];

    return (
        <>
            <GlassContainer className="p-6" border>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-red-500/20">
                        <Trash2 className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h4 className="text-base font-semibold text-primary">Reset & Clear Data</h4>
                        <p className="text-xs text-secondary">These actions cannot be undone</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {resetOptions.map((option) => (
                        <div
                            key={option.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                        >
                            <div>
                                <div className="text-sm font-medium text-primary">{option.label}</div>
                                <div className="text-xs text-secondary">{option.description}</div>
                            </div>
                            <GlassButton
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowConfirm(option.id as 'section' | 'all' | 'factory')}
                                className={cn(
                                    option.variant === 'danger' && 'text-red-400 hover:bg-red-500/20'
                                )}
                            >
                                Reset
                            </GlassButton>
                        </div>
                    ))}
                </div>
            </GlassContainer>

            <AnimatePresence>
                {showConfirm && (
                    <ConfirmDialog
                        title={
                            showConfirm === 'factory'
                                ? 'Factory Reset'
                                : showConfirm === 'all'
                                    ? 'Reset All Settings'
                                    : 'Reset Theme'
                        }
                        message={
                            showConfirm === 'factory'
                                ? 'This will permanently delete ALL your data including trading history, bot configurations, and settings. This action cannot be undone.'
                                : showConfirm === 'all'
                                    ? 'This will reset all settings to their default values. Your trading data will be preserved.'
                                    : 'This will reset theme colors and glass effects to their default values.'
                        }
                        confirmLabel={showConfirm === 'factory' ? 'Delete Everything' : 'Reset'}
                        confirmVariant={showConfirm === 'factory' ? 'danger' : 'warning'}
                        onConfirm={() => setShowConfirm(null)}
                        onCancel={() => setShowConfirm(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

// ============================================
// Storage Stats Component
// ============================================

const StorageStats: React.FC = () => {
    const storageData = [
        { label: 'Theme Settings', size: '12 KB', percentage: 5 },
        { label: 'Agent Configuration', size: '45 KB', percentage: 18 },
        { label: 'Trading Data', size: '156 KB', percentage: 62 },
        { label: 'Cache', size: '38 KB', percentage: 15 },
    ];

    const totalSize = '251 KB';

    return (
        <GlassContainer className="p-6" border>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-violet-500/20">
                        <Database className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h4 className="text-base font-semibold text-primary">Storage Usage</h4>
                        <p className="text-xs text-secondary">Total: {totalSize}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-secondary">
                    <Clock className="w-4 h-4" />
                    Last backup: 2 days ago
                </div>
            </div>

            <div className="space-y-4">
                {storageData.map((item) => (
                    <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-primary">{item.label}</span>
                            <span className="text-xs text-secondary">{item.size}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.percentage}%` }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </GlassContainer>
    );
};

// ============================================
// Main Component
// ============================================

export const DataManagementSection: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20">
                    <Database className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-primary">Data Management</h3>
                    <p className="text-sm text-secondary">
                        Export, import, and manage your settings
                    </p>
                </div>
            </div>

            {/* Storage Stats */}
            <StorageStats />

            {/* Export & Import Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ExportSection />
                <ImportSection />
            </div>

            {/* Reset Section */}
            <ResetSection />
        </div>
    );
};

export default DataManagementSection;
