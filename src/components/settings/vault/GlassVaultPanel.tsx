/**
 * Glass Vault Panel
 * 
 * Main vault settings panel with sub-tabs for Entities, Personal, Roles, Autofill, Security, Audit.
 * Integrates into GlassSettingsApp as the "Vault" tab.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
    Building2, User, Users, Wand2, Shield, ClipboardList,
    Search, Pin, Clock, Globe, Trash2, Lock, Unlock,
    AlertTriangle, Download,
} from 'lucide-react';
import { useVaultStore } from '@/stores/vaultStore';
import { VaultEntityCard } from './VaultEntityCard';
import { VaultEntityDrawer } from './VaultEntityDrawer';
import { VaultAgentBar } from './VaultAgentBar';
import { VaultContextSwitcher } from './VaultContextSwitcher';
import { cn } from '@/utils/cn';

// ============================================================================
// Sub-tab Configuration
// ============================================================================

type VaultSubTab = 'entities' | 'personal' | 'roles' | 'autofill' | 'security' | 'audit';

const subTabs: { id: VaultSubTab; label: string; icon: React.ElementType }[] = [
    { id: 'entities', label: 'Entities', icon: Building2 },
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'roles', label: 'Roles', icon: Users },
    { id: 'autofill', label: 'Autofill', icon: Wand2 },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'audit', label: 'Audit', icon: ClipboardList },
];

// ============================================================================
// Filter Types
// ============================================================================

type EntityFilter = 'all' | 'pinned' | 'my-roles' | 'hq' | 'subsidiaries' | 'branches';

// ============================================================================
// Main Component
// ============================================================================

export const GlassVaultPanel: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState<VaultSubTab>('entities');
    const [searchQuery, setSearchQuery] = useState('');
    const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

    const {
        personal,
        entities,
        roles,
        pinnedEntityIds,
        domainDefaults,
        auditLog,
        lockedCompartments,
        togglePin,
        importFromJsonLd,
        exportToJsonLd,
        revokeDomainDefault,
        getRolesForEntity,
    } = useVaultStore();

    // Load initial data from JSON-LD file
    useEffect(() => {
        if (entities.length === 0) {
            // Try to load from the data file
            fetch('/src/data/showheroes-vault.jsonld')
                .then((res) => res.json())
                .then((data) => {
                    importFromJsonLd(data);
                })
                .catch(() => {
                    console.log('No vault data file found, starting empty');
                });
        }
    }, []);

    // Filter entities
    const filteredEntities = useMemo(() => {
        let result = [...entities];

        // Apply filter
        switch (entityFilter) {
            case 'pinned':
                result = result.filter((e) => pinnedEntityIds.includes(e.id));
                break;
            case 'my-roles':
                result = result.filter((e) => roles.some((r) => r.entityId === e.id));
                break;
            case 'hq':
                result = result.filter((e) => e.entityType === 'headquarters');
                break;
            case 'subsidiaries':
                result = result.filter((e) => e.entityType === 'subsidiary');
                break;
            case 'branches':
                result = result.filter((e) => e.entityType === 'branch');
                break;
        }

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (e) =>
                    e.name.toLowerCase().includes(query) ||
                    e.legalName.toLowerCase().includes(query) ||
                    e.vatID?.toLowerCase().includes(query) ||
                    e.region?.toLowerCase().includes(query)
            );
        }

        // Sort: HQ first, then by name
        result.sort((a, b) => {
            if (a.entityType === 'headquarters' && b.entityType !== 'headquarters') return -1;
            if (b.entityType === 'headquarters' && a.entityType !== 'headquarters') return 1;
            return a.name.localeCompare(b.name);
        });

        return result;
    }, [entities, entityFilter, searchQuery, pinnedEntityIds, roles]);

    // Selected entity
    const selectedEntity = selectedEntityId
        ? entities.find((e) => e.id === selectedEntityId)
        : null;

    // Stats
    const stats = useMemo(() => ({
        total: entities.length,
        pinned: pinnedEntityIds.length,
        withRoles: entities.filter((e) => roles.some((r) => r.entityId === e.id)).length,
        hq: entities.filter((e) => e.entityType === 'headquarters').length,
        subsidiaries: entities.filter((e) => e.entityType === 'subsidiary').length,
        branches: entities.filter((e) => e.entityType === 'branch').length,
    }), [entities, pinnedEntityIds, roles]);

    return (
        <div className="space-y-6">
            {/* Sub-tab Navigation */}
            <div className="flex gap-2 p-1 rounded-xl bg-white/5 w-fit">
                {subTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
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

            {/* ====================== ENTITIES TAB ====================== */}
            {activeSubTab === 'entities' && (
                <div className="space-y-6">
                    {/* Agent Bar */}
                    <VaultAgentBar className="max-w-2xl" />

                    {/* Header with Context Switcher, Search, and Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Context Switcher */}
                        <VaultContextSwitcher />

                        {/* Search */}
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search entities..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[var(--glass-accent)]"
                            />
                        </div>

                        {/* Filter Chips */}
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { id: 'all' as const, label: 'All', count: stats.total },
                                { id: 'pinned' as const, label: 'Pinned', count: stats.pinned, icon: Pin },
                                { id: 'my-roles' as const, label: 'My Roles', count: stats.withRoles, icon: Users },
                            ].map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setEntityFilter(filter.id)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                        entityFilter === filter.id
                                            ? "bg-[var(--glass-accent)]/20 text-[var(--glass-accent)] border border-[var(--glass-accent)]/30"
                                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-transparent"
                                    )}
                                >
                                    {filter.icon && <filter.icon size={12} />}
                                    {filter.label}
                                    <span className="opacity-60">({filter.count})</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Type Filter Row */}
                    <div className="flex gap-2">
                        {[
                            { id: 'hq' as const, label: 'HQ', count: stats.hq },
                            { id: 'subsidiaries' as const, label: 'Subsidiaries', count: stats.subsidiaries },
                            { id: 'branches' as const, label: 'Branches', count: stats.branches },
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setEntityFilter(entityFilter === filter.id ? 'all' : filter.id)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                    entityFilter === filter.id
                                        ? "bg-white/10 text-white"
                                        : "text-white/40 hover:text-white/60"
                                )}
                            >
                                {filter.label} ({filter.count})
                            </button>
                        ))}
                    </div>

                    {/* Entity Grid */}
                    {filteredEntities.length === 0 ? (
                        <div className="text-center py-16 text-white/40">
                            <Building2 size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium mb-2">No entities found</p>
                            <p className="text-sm">
                                {searchQuery
                                    ? 'Try a different search term'
                                    : 'Add your first company entity to get started'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredEntities.map((entity) => (
                                <VaultEntityCard
                                    key={entity.id}
                                    entity={entity}
                                    isPinned={pinnedEntityIds.includes(entity.id)}
                                    isActive={selectedEntityId === entity.id}
                                    rolesCount={getRolesForEntity(entity.id).length}
                                    onSelect={() => setSelectedEntityId(entity.id)}
                                    onTogglePin={() => togglePin(entity.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ====================== PERSONAL TAB ====================== */}
            {activeSubTab === 'personal' && (
                <div className="max-w-2xl space-y-6">
                    {personal ? (
                        <>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-full bg-[var(--glass-accent)]/20 flex items-center justify-center">
                                        <User size={28} className="text-[var(--glass-accent)]" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold">{personal.name}</h2>
                                        {personal.jobTitle && (
                                            <p className="text-sm text-white/50">{personal.jobTitle}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {personal.email && (
                                        <div className="flex justify-between p-3 rounded-lg bg-white/5">
                                            <span className="text-sm text-white/50">Email</span>
                                            <span className="text-sm">{personal.email}</span>
                                        </div>
                                    )}
                                    {personal.telephone && (
                                        <div className="flex justify-between p-3 rounded-lg bg-white/5">
                                            <span className="text-sm text-white/50">Phone</span>
                                            <span className="text-sm">{personal.telephone}</span>
                                        </div>
                                    )}
                                    {personal.address && (
                                        <div className="p-3 rounded-lg bg-white/5">
                                            <span className="text-sm text-white/50 block mb-1">Address</span>
                                            <span className="text-sm">
                                                {personal.address.streetAddress}<br />
                                                {personal.address.postalCode} {personal.address.addressLocality}<br />
                                                {personal.address.addressCountry}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16 text-white/40">
                            <User size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium mb-2">No personal profile</p>
                            <p className="text-sm">Import vault data to load your profile</p>
                        </div>
                    )}
                </div>
            )}

            {/* ====================== ROLES TAB ====================== */}
            {activeSubTab === 'roles' && (
                <div className="space-y-6">
                    <h3 className="text-sm font-medium text-white/70 uppercase tracking-wide">
                        Your Roles Across Entities ({roles.length})
                    </h3>

                    {roles.length === 0 ? (
                        <div className="text-center py-16 text-white/40">
                            <Users size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium mb-2">No roles defined</p>
                            <p className="text-sm">Import vault data to load your roles</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {roles.map((role) => {
                                const entity = entities.find((e) => e.id === role.entityId);
                                return (
                                    <div
                                        key={role.id}
                                        className="p-4 rounded-xl bg-white/5 border border-white/10"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">{entity?.name || 'Unknown Entity'}</span>
                                            <span className="px-2 py-1 rounded-lg bg-[var(--glass-accent)]/20 text-[var(--glass-accent)] text-xs font-medium">
                                                {role.roleName}
                                            </span>
                                        </div>
                                        {role.authorityFlags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {role.authorityFlags.map((flag) => (
                                                    <span
                                                        key={flag}
                                                        className="px-2 py-0.5 rounded bg-white/5 text-xs text-white/50"
                                                    >
                                                        Can approve: {flag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ====================== AUTOFILL TAB ====================== */}
            {activeSubTab === 'autofill' && (
                <div className="space-y-6">
                    <h3 className="text-sm font-medium text-white/70 uppercase tracking-wide">
                        Domain Defaults ({domainDefaults.length})
                    </h3>

                    {domainDefaults.length === 0 ? (
                        <div className="text-center py-16 text-white/40">
                            <Globe size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium mb-2">No domain defaults</p>
                            <p className="text-sm">Remembered autofill preferences will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {domainDefaults.map((dd) => {
                                const entity = entities.find((e) => e.id === dd.entityId);
                                return (
                                    <div
                                        key={dd.domain}
                                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                                    >
                                        <div>
                                            <div className="text-sm font-medium">{dd.domain}</div>
                                            <div className="text-xs text-white/50">
                                                {entity?.name || 'Unknown'} · {dd.addressPurpose || 'Default'}
                                            </div>
                                            <div className="text-xs text-white/30 mt-1">
                                                Remembered {new Date(dd.rememberedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => revokeDomainDefault(dd.domain)}
                                            className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ====================== SECURITY TAB ====================== */}
            {activeSubTab === 'security' && (
                <div className="space-y-6">
                    <h3 className="text-sm font-medium text-white/70 uppercase tracking-wide">
                        Locked Compartments
                    </h3>

                    <div className="space-y-3">
                        {/* Banking */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-3">
                                {lockedCompartments.banking ? (
                                    <Lock size={20} className="text-yellow-400" />
                                ) : (
                                    <Unlock size={20} className="text-green-400" />
                                )}
                                <div>
                                    <div className="text-sm font-medium">Banking</div>
                                    <div className="text-xs text-white/50">Bank accounts and IBAN details</div>
                                </div>
                            </div>
                            <span className={cn(
                                "px-2 py-1 rounded text-xs font-medium",
                                lockedCompartments.banking
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-green-500/20 text-green-400"
                            )}>
                                {lockedCompartments.banking ? 'Locked' : 'Unlocked'}
                            </span>
                        </div>

                        {/* Documents */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-3">
                                {lockedCompartments.documents ? (
                                    <Lock size={20} className="text-yellow-400" />
                                ) : (
                                    <Unlock size={20} className="text-green-400" />
                                )}
                                <div>
                                    <div className="text-sm font-medium">Documents</div>
                                    <div className="text-xs text-white/50">Contracts and legal documents</div>
                                </div>
                            </div>
                            <span className={cn(
                                "px-2 py-1 rounded text-xs font-medium",
                                lockedCompartments.documents
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-green-500/20 text-green-400"
                            )}>
                                {lockedCompartments.documents ? 'Locked' : 'Unlocked'}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0" />
                            <div>
                                <div className="text-sm font-medium text-yellow-400">Important</div>
                                <div className="text-xs text-white/60 mt-1">
                                    Locked compartments require explicit approval before sharing. Banking data is never auto-filled.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ====================== AUDIT TAB ====================== */}
            {activeSubTab === 'audit' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-white/70 uppercase tracking-wide">
                            Audit Log ({auditLog.length})
                        </h3>
                        <button
                            onClick={() => {
                                const data = exportToJsonLd();
                                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'vault-export.jsonld';
                                a.click();
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs hover:bg-white/10"
                        >
                            <Download size={14} />
                            Export
                        </button>
                    </div>

                    {auditLog.length === 0 ? (
                        <div className="text-center py-16 text-white/40">
                            <ClipboardList size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium mb-2">No audit events</p>
                            <p className="text-sm">Activity log will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {auditLog.slice(0, 50).map((entry) => (
                                <div
                                    key={entry.id}
                                    className="flex items-start gap-3 p-3 rounded-xl bg-white/5"
                                >
                                    <Clock size={14} className="text-white/30 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-white/70">
                                                {entry.eventType.toUpperCase()}
                                            </span>
                                            {entry.entityLabel && (
                                                <span className="text-xs text-white/50">{entry.entityLabel}</span>
                                            )}
                                            {entry.domain && (
                                                <span className="text-xs text-[var(--glass-accent)]">{entry.domain}</span>
                                            )}
                                        </div>
                                        {entry.details && (
                                            <p className="text-xs text-white/40 truncate">{entry.details}</p>
                                        )}
                                    </div>
                                    <span className="text-xs text-white/30">
                                        {new Date(entry.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Entity Drawer */}
            {selectedEntity && (
                <VaultEntityDrawer
                    entity={selectedEntity}
                    isOpen={!!selectedEntityId}
                    onClose={() => setSelectedEntityId(null)}
                />
            )}
        </div>
    );
};
