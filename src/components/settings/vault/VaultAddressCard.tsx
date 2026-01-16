/**
 * Vault Address Card
 * 
 * Card component for displaying and editing an address.
 */

import React, { useState } from 'react';
import { MapPin, Edit2, Trash2, Check, X, Star } from 'lucide-react';
import { VaultAddress, AddressPurpose } from '@/types/vaultTypes';
import { cn } from '@/utils/cn';

interface VaultAddressCardProps {
    address: VaultAddress;
    onUpdate: (updates: Partial<VaultAddress>) => void;
    onDelete: () => void;
    onSetDefault?: () => void;
}

const PURPOSE_LABELS: Record<AddressPurpose, { label: string; color: string }> = {
    registered: { label: 'Registered', color: 'text-blue-400' },
    billing: { label: 'Billing', color: 'text-green-400' },
    operational: { label: 'Operational', color: 'text-yellow-400' },
    shipping: { label: 'Shipping', color: 'text-purple-400' },
};

export const VaultAddressCard: React.FC<VaultAddressCardProps> = ({
    address,
    onUpdate,
    onDelete,
    onSetDefault,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(address);

    const handleSave = () => {
        onUpdate(editData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditData(address);
        setIsEditing(false);
    };

    const purposeMeta = PURPOSE_LABELS[address.purpose];

    if (isEditing) {
        return (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-xs font-medium uppercase tracking-wide", purposeMeta.color)}>
                        {purposeMeta.label} Address
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={handleSave}
                            className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        >
                            <Check size={14} />
                        </button>
                        <button
                            onClick={handleCancel}
                            className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                <input
                    type="text"
                    value={editData.streetAddress}
                    onChange={(e) => setEditData({ ...editData, streetAddress: e.target.value })}
                    placeholder="Street address"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm focus:outline-none focus:border-[var(--glass-accent)]"
                />

                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="text"
                        value={editData.postalCode}
                        onChange={(e) => setEditData({ ...editData, postalCode: e.target.value })}
                        placeholder="Postal code"
                        className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm focus:outline-none focus:border-[var(--glass-accent)]"
                    />
                    <input
                        type="text"
                        value={editData.addressLocality}
                        onChange={(e) => setEditData({ ...editData, addressLocality: e.target.value })}
                        placeholder="City"
                        className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm focus:outline-none focus:border-[var(--glass-accent)]"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="text"
                        value={editData.addressRegion || ''}
                        onChange={(e) => setEditData({ ...editData, addressRegion: e.target.value })}
                        placeholder="Region/State"
                        className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm focus:outline-none focus:border-[var(--glass-accent)]"
                    />
                    <input
                        type="text"
                        value={editData.addressCountry}
                        onChange={(e) => setEditData({ ...editData, addressCountry: e.target.value })}
                        placeholder="Country"
                        className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm focus:outline-none focus:border-[var(--glass-accent)]"
                    />
                </div>

                <select
                    value={editData.purpose}
                    onChange={(e) => setEditData({ ...editData, purpose: e.target.value as AddressPurpose })}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm focus:outline-none focus:border-[var(--glass-accent)]"
                >
                    <option value="registered">Registered Address</option>
                    <option value="billing">Billing Address</option>
                    <option value="operational">Operational Address</option>
                    <option value="shipping">Shipping Address</option>
                </select>
            </div>
        );
    }

    return (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 group hover:bg-white/[0.07] transition-colors">
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/5">
                    <MapPin size={16} className={purposeMeta.color} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-xs font-medium uppercase tracking-wide", purposeMeta.color)}>
                            {purposeMeta.label}
                        </span>
                        {address.isDefault && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-500/20 text-yellow-400">
                                <Star size={10} />
                                Default
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-white">{address.streetAddress}</p>
                    <p className="text-sm text-white/70">
                        {address.postalCode} {address.addressLocality}
                        {address.addressRegion && `, ${address.addressRegion}`}
                    </p>
                    <p className="text-sm text-white/50">{address.addressCountry}</p>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onSetDefault && !address.isDefault && (
                        <button
                            onClick={onSetDefault}
                            className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-yellow-400 hover:bg-yellow-500/10"
                            title="Set as default"
                        >
                            <Star size={14} />
                        </button>
                    )}
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
                        title="Edit"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
