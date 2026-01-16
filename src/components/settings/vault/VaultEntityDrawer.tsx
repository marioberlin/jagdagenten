/**
 * Vault Entity Drawer
 * 
 * Slide-over drawer for viewing and editing entity details.
 * Uses tabs for Overview, Addresses, Contacts, Identifiers, Banking.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Building2, MapPin, Users, FileText, Wallet, Globe,
    Plus, Lock, Unlock, Clock,
} from 'lucide-react';
import { VaultOrganization, VaultAddress, VaultContact, AddressPurpose, ContactType } from '@/types/vaultTypes';
import { useVaultStore } from '@/stores/vaultStore';
import { VaultAddressCard } from './VaultAddressCard';
import { cn } from '@/utils/cn';

interface VaultEntityDrawerProps {
    entity: VaultOrganization;
    isOpen: boolean;
    onClose: () => void;
}

type TabId = 'overview' | 'addresses' | 'contacts' | 'identifiers' | 'banking';

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'identifiers', label: 'IDs', icon: FileText },
    { id: 'banking', label: 'Banking', icon: Wallet },
];

export const VaultEntityDrawer: React.FC<VaultEntityDrawerProps> = ({
    entity,
    isOpen,
    onClose,
}) => {
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const {
        addAddress,
        updateAddress,
        deleteAddress,
        addContact,
        deleteContact,
        lockedCompartments,
        unlockCompartment,
        lockCompartment,
        unlockExpiresAt,
        getRolesForEntity,
    } = useVaultStore();

    const roles = getRolesForEntity(entity.id);
    const isBankingLocked = lockedCompartments.banking;

    const handleAddAddress = (purpose: AddressPurpose) => {
        const newAddress: VaultAddress = {
            id: crypto.randomUUID(),
            purpose,
            streetAddress: '',
            addressLocality: '',
            postalCode: '',
            addressCountry: '',
        };
        addAddress(entity.id, newAddress);
    };

    const handleAddContact = (contactType: ContactType) => {
        const newContact: VaultContact = {
            id: crypto.randomUUID(),
            contactType,
        };
        addContact(entity.id, newContact);
    };

    // Calculate remaining unlock time
    const getRemainingTime = () => {
        if (!unlockExpiresAt) return null;
        const remaining = Math.max(0, unlockExpiresAt - Date.now());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-[var(--glass-accent)]/20">
                                        <Building2 size={20} className="text-[var(--glass-accent)]" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">{entity.name}</h2>
                                        {entity.legalName !== entity.name && (
                                            <p className="text-sm text-white/50">{entity.legalName}</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1 mt-4 p-1 rounded-xl bg-white/5">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center",
                                            activeTab === tab.id
                                                ? "bg-[var(--glass-accent)] text-white"
                                                : "text-white/50 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <tab.icon size={14} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-4 rounded-xl bg-white/5 text-center">
                                            <div className="text-2xl font-bold text-[var(--glass-accent)]">
                                                {entity.addresses.length}
                                            </div>
                                            <div className="text-xs text-white/50">Addresses</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 text-center">
                                            <div className="text-2xl font-bold text-[var(--glass-accent)]">
                                                {entity.contacts.length}
                                            </div>
                                            <div className="text-xs text-white/50">Contacts</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 text-center">
                                            <div className="text-2xl font-bold text-[var(--glass-accent)]">
                                                {roles.length}
                                            </div>
                                            <div className="text-xs text-white/50">Roles</div>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium text-white/70 uppercase tracking-wide">
                                            Details
                                        </h3>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                                                <span className="text-sm text-white/50">Legal Name</span>
                                                <span className="text-sm font-medium">{entity.legalName}</span>
                                            </div>

                                            {entity.vatID && (
                                                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                                                    <span className="text-sm text-white/50">VAT ID</span>
                                                    <span className="text-sm font-mono">{entity.vatID}</span>
                                                </div>
                                            )}

                                            {entity.taxID && (
                                                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                                                    <span className="text-sm text-white/50">Tax ID</span>
                                                    <span className="text-sm font-mono">•••••••••</span>
                                                </div>
                                            )}

                                            {entity.url && (
                                                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                                                    <span className="text-sm text-white/50">Website</span>
                                                    <a
                                                        href={entity.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-sm text-[var(--glass-accent)] hover:underline"
                                                    >
                                                        <Globe size={14} />
                                                        {new URL(entity.url).hostname}
                                                    </a>
                                                </div>
                                            )}

                                            {entity.region && (
                                                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                                                    <span className="text-sm text-white/50">Region</span>
                                                    <span className="text-sm font-medium">{entity.region}</span>
                                                </div>
                                            )}

                                            {entity.entityType && (
                                                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                                                    <span className="text-sm text-white/50">Entity Type</span>
                                                    <span className="text-sm font-medium capitalize">{entity.entityType}</span>
                                                </div>
                                            )}

                                            {entity.ownershipPercentage && (
                                                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                                                    <span className="text-sm text-white/50">Ownership</span>
                                                    <span className="text-sm font-medium">{entity.ownershipPercentage}%</span>
                                                </div>
                                            )}

                                            {entity.acquisitionDate && (
                                                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                                                    <span className="text-sm text-white/50">Acquired</span>
                                                    <span className="text-sm font-medium">
                                                        {new Date(entity.acquisitionDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Your Roles */}
                                    {roles.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-medium text-white/70 uppercase tracking-wide">
                                                Your Roles
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {roles.map((role) => (
                                                    <span
                                                        key={role.id}
                                                        className="px-3 py-1.5 rounded-lg bg-[var(--glass-accent)]/20 text-[var(--glass-accent)] text-sm font-medium"
                                                    >
                                                        {role.roleName}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Addresses Tab */}
                            {activeTab === 'addresses' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-white/70 uppercase tracking-wide">
                                            {entity.addresses.length} Address{entity.addresses.length !== 1 ? 'es' : ''}
                                        </h3>
                                        <button
                                            onClick={() => handleAddAddress('billing')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--glass-accent)]/20 text-[var(--glass-accent)] text-sm font-medium hover:bg-[var(--glass-accent)]/30"
                                        >
                                            <Plus size={14} />
                                            Add
                                        </button>
                                    </div>

                                    {entity.addresses.length === 0 ? (
                                        <div className="text-center py-12 text-white/40">
                                            <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No addresses yet</p>
                                            <p className="text-xs">Add a registered or billing address</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {entity.addresses.map((address) => (
                                                <VaultAddressCard
                                                    key={address.id}
                                                    address={address}
                                                    onUpdate={(updates) => updateAddress(entity.id, address.id, updates)}
                                                    onDelete={() => deleteAddress(entity.id, address.id)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Contacts Tab */}
                            {activeTab === 'contacts' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-white/70 uppercase tracking-wide">
                                            {entity.contacts.length} Contact{entity.contacts.length !== 1 ? 's' : ''}
                                        </h3>
                                        <button
                                            onClick={() => handleAddContact('billing')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--glass-accent)]/20 text-[var(--glass-accent)] text-sm font-medium hover:bg-[var(--glass-accent)]/30"
                                        >
                                            <Plus size={14} />
                                            Add
                                        </button>
                                    </div>

                                    {entity.contacts.length === 0 ? (
                                        <div className="text-center py-12 text-white/40">
                                            <Users size={32} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No contacts yet</p>
                                            <p className="text-xs">Add billing or legal contacts</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {entity.contacts.map((contact) => (
                                                <div
                                                    key={contact.id}
                                                    className="p-4 rounded-xl bg-white/5 border border-white/10"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-medium uppercase tracking-wide text-[var(--glass-accent)]">
                                                            {contact.contactType}
                                                        </span>
                                                        <button
                                                            onClick={() => deleteContact(entity.id, contact.id)}
                                                            className="p-1 rounded text-white/40 hover:text-red-400"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                    {contact.name && (
                                                        <p className="text-sm text-white mt-1">{contact.name}</p>
                                                    )}
                                                    {contact.email && (
                                                        <p className="text-sm text-white/70">{contact.email}</p>
                                                    )}
                                                    {contact.telephone && (
                                                        <p className="text-sm text-white/50">{contact.telephone}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Identifiers Tab */}
                            {activeTab === 'identifiers' && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-white/70 uppercase tracking-wide">
                                        {entity.identifiers.length} Identifier{entity.identifiers.length !== 1 ? 's' : ''}
                                    </h3>

                                    {entity.identifiers.length === 0 ? (
                                        <div className="text-center py-12 text-white/40">
                                            <FileText size={32} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No additional identifiers</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {entity.identifiers.map((id) => (
                                                <div
                                                    key={id.id}
                                                    className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10"
                                                >
                                                    <span className="text-sm text-white/50">{id.propertyID}</span>
                                                    <span className="text-sm font-mono">{id.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Banking Tab */}
                            {activeTab === 'banking' && (
                                <div className="space-y-4">
                                    {isBankingLocked ? (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                                <Lock size={28} className="text-yellow-400" />
                                            </div>
                                            <h3 className="text-lg font-medium text-white mb-2">Banking is Locked</h3>
                                            <p className="text-sm text-white/50 mb-6 max-w-xs mx-auto">
                                                Bank details are locked and require explicit approval to view.
                                            </p>
                                            <button
                                                onClick={() => unlockCompartment('banking')}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-400 font-medium mx-auto hover:bg-yellow-500/30 transition-colors"
                                            >
                                                <Unlock size={16} />
                                                Unlock to View
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                                <div className="flex items-center gap-2 text-green-400">
                                                    <Unlock size={16} />
                                                    <span className="text-sm font-medium">Unlocked</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {getRemainingTime() && (
                                                        <span className="flex items-center gap-1 text-sm text-white/50">
                                                            <Clock size={14} />
                                                            {getRemainingTime()}
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => lockCompartment('banking')}
                                                        className="px-3 py-1 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/20"
                                                    >
                                                        Lock Now
                                                    </button>
                                                </div>
                                            </div>

                                            {!entity.bankAccounts || entity.bankAccounts.length === 0 ? (
                                                <div className="text-center py-12 text-white/40">
                                                    <Wallet size={32} className="mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No bank accounts configured</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {entity.bankAccounts.map((account) => (
                                                        <div
                                                            key={account.id}
                                                            className="p-4 rounded-xl bg-white/5 border border-white/10"
                                                        >
                                                            <div className="text-sm text-white/50 mb-1">Account</div>
                                                            <div className="text-sm font-medium">{account.accountHolder}</div>
                                                            <div className="grid grid-cols-2 gap-4 mt-3">
                                                                <div>
                                                                    <div className="text-xs text-white/40">IBAN</div>
                                                                    <div className="text-sm font-mono">{account.iban}</div>
                                                                </div>
                                                                {account.bic && (
                                                                    <div>
                                                                        <div className="text-xs text-white/40">BIC</div>
                                                                        <div className="text-sm font-mono">{account.bic}</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {account.bankName && (
                                                                <div className="mt-2 text-sm text-white/50">{account.bankName}</div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
