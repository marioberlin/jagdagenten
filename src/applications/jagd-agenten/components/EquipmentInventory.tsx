/**
 * Equipment Inventory Component
 *
 * UI for managing hunting gear (weapons, optics, accessories).
 * Displays maintenance warnings and gear status.
 */

import React, { useEffect, useState } from 'react';
import {
    Crosshair,
    Eye,
    Package,
    Shirt,
    Wrench,
    Plus,
    Trash2,
    Settings,
    CheckCircle2,
    Clock,
} from 'lucide-react';
import { useQuartermasterStore, type GearItem } from '@/stores/useQuartermasterStore';

// ============================================================================
// Item Type Icons & Labels
// ============================================================================

const ITEM_TYPE_ICONS: Record<GearItem['itemType'], React.ReactNode> = {
    weapon: <Crosshair className="w-5 h-5 text-red-400" />,
    optic: <Eye className="w-5 h-5 text-blue-400" />,
    ammo: <Package className="w-5 h-5 text-yellow-400" />,
    clothing: <Shirt className="w-5 h-5 text-green-400" />,
    accessory: <Package className="w-5 h-5 text-purple-400" />,
    other: <Package className="w-5 h-5 text-gray-400" />,
};

const ITEM_TYPE_LABELS: Record<GearItem['itemType'], string> = {
    weapon: 'Waffe',
    optic: 'Optik',
    ammo: 'Munition',
    clothing: 'Bekleidung',
    accessory: 'Zubehör',
    other: 'Sonstiges',
};

const STATUS_CONFIG: Record<GearItem['status'], { label: string; color: string; icon: React.ReactNode }> = {
    ready: { label: 'Einsatzbereit', color: 'text-green-400 bg-green-500/10', icon: <CheckCircle2 className="w-4 h-4" /> },
    maintenance_due: { label: 'Wartung fällig', color: 'text-orange-400 bg-orange-500/10', icon: <Wrench className="w-4 h-4" /> },
    in_repair: { label: 'In Reparatur', color: 'text-yellow-400 bg-yellow-500/10', icon: <Clock className="w-4 h-4" /> },
    retired: { label: 'Ausgemustert', color: 'text-gray-400 bg-gray-500/10', icon: <Package className="w-4 h-4" /> },
};

// ============================================================================
// Gear Card
// ============================================================================

interface GearCardProps {
    item: GearItem;
    onDelete: (id: string) => void;
    onEdit?: (id: string) => void;
}

function GearCard({ item, onDelete, onEdit }: GearCardProps) {
    const status = STATUS_CONFIG[item.status];

    return (
        <div className="relative bg-[var(--glass-bg-regular)] backdrop-blur-md rounded-xl border border-[var(--glass-border)] p-4 hover:border-[var(--glass-surface-active)] transition-all group">
            {/* Status badge */}
            {item.status !== 'ready' && (
                <div className={`absolute -top-2 -right-2 rounded-full p-1.5 ${status.color.split(' ')[1]}`}>
                    {status.icon}
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {ITEM_TYPE_ICONS[item.itemType]}
                    <div>
                        <h3 className="font-medium text-[var(--text-primary)]">{item.name}</h3>
                        <p className="text-xs text-[var(--text-secondary)]">{ITEM_TYPE_LABELS[item.itemType]}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(item.id)}
                            className="p-1.5 rounded-lg hover:bg-[var(--glass-surface)]"
                        >
                            <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20"
                    >
                        <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                </div>
            </div>

            {/* Details */}
            <div className="space-y-1 text-sm">
                {item.caliber && (
                    <p className="text-[var(--text-secondary)]">
                        <span className="text-[var(--text-tertiary)]">Kaliber:</span> {item.caliber}
                    </p>
                )}
                {item.optic && (
                    <p className="text-[var(--text-secondary)]">
                        <span className="text-[var(--text-tertiary)]">Optik:</span> {item.optic}
                    </p>
                )}
            </div>

            {/* Status */}
            <div className={`flex items-center gap-2 mt-3 text-sm ${status.color.split(' ')[0]}`}>
                {status.icon}
                <span>{status.label}</span>
            </div>
        </div>
    );
}

// ============================================================================
// Add Gear Modal
// ============================================================================

interface AddGearModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (item: {
        name: string;
        itemType: GearItem['itemType'];
        caliber?: string;
        optic?: string;
        notes?: string;
    }) => void;
}

function AddGearModal({ isOpen, onClose, onSubmit }: AddGearModalProps) {
    const [name, setName] = useState('');
    const [itemType, setItemType] = useState<GearItem['itemType']>('weapon');
    const [caliber, setCaliber] = useState('');
    const [optic, setOptic] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            itemType,
            caliber: caliber || undefined,
            optic: optic || undefined,
        });
        setName('');
        setItemType('weapon');
        setCaliber('');
        setOptic('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[var(--glass-bg-thick)] backdrop-blur-xl rounded-2xl border border-[var(--glass-border)] p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Ausrüstung hinzufügen</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-1">Bezeichnung</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                            placeholder="z.B. Sauer 404"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-1">Typ</label>
                        <select
                            value={itemType}
                            onChange={(e) => setItemType(e.target.value as GearItem['itemType'])}
                            className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                        >
                            {Object.entries(ITEM_TYPE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {itemType === 'weapon' && (
                        <>
                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-1">Kaliber</label>
                                <input
                                    type="text"
                                    value={caliber}
                                    onChange={(e) => setCaliber(e.target.value)}
                                    className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                                    placeholder="z.B. .308 Win"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-[var(--text-secondary)] mb-1">Optik (optional)</label>
                                <input
                                    type="text"
                                    value={optic}
                                    onChange={(e) => setOptic(e.target.value)}
                                    className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                                    placeholder="z.B. Zeiss V8 2.8-20x56"
                                />
                            </div>
                        </>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-surface)] transition-all"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Hinzufügen
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function EquipmentInventory() {
    const { gear, gearLoading, gearError, fetchGear, addGear, deleteGear } = useQuartermasterStore();
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [filterType, setFilterType] = useState<GearItem['itemType'] | 'all'>('all');

    useEffect(() => {
        fetchGear();
    }, [fetchGear]);

    // Filter gear
    const filteredGear = filterType === 'all' ? gear : gear.filter((g) => g.itemType === filterType);

    // Count items needing attention
    const maintenanceCount = gear.filter((g) => g.status === 'maintenance_due' || g.status === 'in_repair').length;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Ausrüstung</h1>
                    <p className="text-sm text-[var(--text-secondary)]">Inventar und Wartungsstatus Ihrer Jagdausrüstung</p>
                </div>

                <button
                    onClick={() => setAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span>Ausrüstung hinzufügen</span>
                </button>
            </div>

            {/* Maintenance Alert */}
            {maintenanceCount > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                    <Wrench className="w-6 h-6 text-orange-400" />
                    <p className="text-orange-200">
                        <strong>{maintenanceCount}</strong> Ausrüstungsgegenstand{maintenanceCount > 1 ? 'e' : ''} benötigt{maintenanceCount > 1 ? 'en' : ''} Wartung
                    </p>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${filterType === 'all'
                        ? 'bg-[var(--glass-surface-active)] text-[var(--text-primary)]'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-surface)]'
                        }`}
                >
                    Alle ({gear.length})
                </button>
                {Object.entries(ITEM_TYPE_LABELS).map(([value, label]) => {
                    const count = gear.filter((g: GearItem) => g.itemType === value).length;
                    if (count === 0) return null;
                    return (
                        <button
                            key={value}
                            onClick={() => setFilterType(value as GearItem['itemType'])}
                            className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${filterType === value
                                ? 'bg-[var(--glass-surface-active)] text-[var(--text-primary)]'
                                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-surface)]'
                                }`}
                        >
                            {label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Error State */}
            {gearError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200">
                    Fehler beim Laden: {gearError}
                </div>
            )}

            {/* Loading State */}
            {gearLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
                </div>
            )}

            {/* Empty State */}
            {!gearLoading && filteredGear.length === 0 && (
                <div className="text-center py-12 text-[var(--text-tertiary)]">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Keine Ausrüstung gefunden</p>
                    <p className="text-sm mt-1">Fügen Sie Ihre Waffen, Optiken und Zubehör hinzu.</p>
                </div>
            )}

            {/* Gear Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGear.map((item: GearItem) => (
                    <GearCard key={item.id} item={item} onDelete={deleteGear} />
                ))}
            </div>

            {/* Add Modal */}
            <AddGearModal
                isOpen={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                onSubmit={addGear}
            />
        </div>
    );
}
