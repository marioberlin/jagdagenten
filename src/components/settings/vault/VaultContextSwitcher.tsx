/**
 * VaultContextSwitcher - Entity Context Dropdown
 * 
 * A dropdown component for switching between vault entities.
 * Displays the active context and allows quick switching with
 * pinned entities shown prominently.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    User,
    Pin,
    Check,
    Search,
    X,
    Globe,
} from 'lucide-react';
import { useVaultStore } from '@/stores/vaultStore';
import { VaultOrganization, Region } from '@/types/vaultTypes';
import { cn } from '@/utils/cn';

interface VaultContextSwitcherProps {
    className?: string;
    compact?: boolean;
    onContextChange?: (entityId: string | null) => void;
}

const REGION_COLORS: Record<Region, string> = {
    'DACH': 'bg-blue-500',
    'Nordics': 'bg-cyan-500',
    'LATAM': 'bg-orange-500',
    'Asia': 'bg-purple-500',
    'UK': 'bg-red-500',
    'USA': 'bg-indigo-500',
    'Europe': 'bg-green-500',
};

export const VaultContextSwitcher: React.FC<VaultContextSwitcherProps> = ({
    className,
    compact = false,
    onContextChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const {
        entities,
        personal,
        activeEntityId,
        pinnedEntityIds,
        switchContext,
        togglePin,
    } = useVaultStore();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Focus search input when dropdown opens
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Get active entity
    const activeEntity = entities.find(e => e.id === activeEntityId);

    // Filter and group entities
    const filteredEntities = entities.filter(entity => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            entity.name.toLowerCase().includes(query) ||
            entity.legalName?.toLowerCase().includes(query) ||
            entity.region?.toLowerCase().includes(query)
        );
    });

    const pinnedEntities = filteredEntities.filter(e => pinnedEntityIds.includes(e.id));
    const unpinnedEntities = filteredEntities.filter(e => !pinnedEntityIds.includes(e.id));

    // Group by region
    const groupedByRegion = unpinnedEntities.reduce((acc, entity) => {
        const region = entity.region || 'Other';
        if (!acc[region]) acc[region] = [];
        acc[region].push(entity);
        return acc;
    }, {} as Record<string, VaultOrganization[]>);

    const handleSelect = (entityId: string | null) => {
        switchContext(entityId);
        onContextChange?.(entityId);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handlePinToggle = (e: React.MouseEvent, entityId: string) => {
        e.stopPropagation();
        togglePin(entityId);
    };

    return (
        <div ref={dropdownRef} className={cn("relative", className)}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
                    "bg-white/5 border border-white/10 hover:border-white/20",
                    "text-left min-w-[200px]",
                    compact && "min-w-0 px-2 py-1.5"
                )}
            >
                {activeEntity ? (
                    <>
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            activeEntity.region ? REGION_COLORS[activeEntity.region] : 'bg-gray-500'
                        )} />
                        <div className="flex-1 min-w-0">
                            <div className={cn("text-sm font-medium truncate", compact && "text-xs")}>
                                {activeEntity.name}
                            </div>
                            {!compact && activeEntity.entityType && (
                                <div className="text-[10px] text-white/40 capitalize">
                                    {activeEntity.entityType}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <Globe size={compact ? 14 : 16} className="text-white/40" />
                        <span className={cn("text-sm text-white/60", compact && "text-xs")}>
                            All Entities
                        </span>
                    </>
                )}
                <ChevronDown
                    size={compact ? 12 : 14}
                    className={cn(
                        "text-white/40 transition-transform",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-2 z-50 w-72"
                    >
                        <div className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                            {/* Search */}
                            <div className="p-2 border-b border-white/10">
                                <div className="relative">
                                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search entities..."
                                        className="w-full pl-8 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--glass-accent)]/50"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Options */}
                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                {/* All Entities Option */}
                                <button
                                    onClick={() => handleSelect(null)}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 transition-colors text-left",
                                        !activeEntityId && "bg-[var(--glass-accent)]/10"
                                    )}
                                >
                                    <Globe size={16} className="text-white/40" />
                                    <span className="text-sm">All Entities</span>
                                    {!activeEntityId && (
                                        <Check size={14} className="ml-auto text-[var(--glass-accent)]" />
                                    )}
                                </button>

                                {/* Personal Profile */}
                                {personal && (
                                    <div className="border-t border-white/5">
                                        <div className="px-3 py-1.5 text-[10px] font-medium text-white/30 uppercase tracking-wider">
                                            Personal
                                        </div>
                                        <div className="px-3 py-2.5 flex items-center gap-2 bg-white/5">
                                            <User size={16} className="text-white/40" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm truncate">{personal.name}</div>
                                                {personal.jobTitle && (
                                                    <div className="text-[10px] text-white/40">{personal.jobTitle}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Pinned Entities */}
                                {pinnedEntities.length > 0 && (
                                    <div className="border-t border-white/5">
                                        <div className="px-3 py-1.5 text-[10px] font-medium text-white/30 uppercase tracking-wider flex items-center gap-1">
                                            <Pin size={10} />
                                            Pinned
                                        </div>
                                        {pinnedEntities.map(entity => (
                                            <EntityOption
                                                key={entity.id}
                                                entity={entity}
                                                isActive={activeEntityId === entity.id}
                                                isPinned
                                                onSelect={() => handleSelect(entity.id)}
                                                onPinToggle={(e) => handlePinToggle(e, entity.id)}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Grouped by Region */}
                                {Object.entries(groupedByRegion).map(([region, regionEntities]) => (
                                    <div key={region} className="border-t border-white/5">
                                        <div className="px-3 py-1.5 text-[10px] font-medium text-white/30 uppercase tracking-wider flex items-center gap-1.5">
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                REGION_COLORS[region as Region] || 'bg-gray-500'
                                            )} />
                                            {region}
                                        </div>
                                        {regionEntities.map(entity => (
                                            <EntityOption
                                                key={entity.id}
                                                entity={entity}
                                                isActive={activeEntityId === entity.id}
                                                isPinned={false}
                                                onSelect={() => handleSelect(entity.id)}
                                                onPinToggle={(e) => handlePinToggle(e, entity.id)}
                                            />
                                        ))}
                                    </div>
                                ))}

                                {/* No Results */}
                                {filteredEntities.length === 0 && searchQuery && (
                                    <div className="px-3 py-6 text-center text-sm text-white/40">
                                        No entities match "{searchQuery}"
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Entity Option Component
interface EntityOptionProps {
    entity: VaultOrganization;
    isActive: boolean;
    isPinned: boolean;
    onSelect: () => void;
    onPinToggle: (e: React.MouseEvent) => void;
}

const EntityOption: React.FC<EntityOptionProps> = ({
    entity,
    isActive,
    isPinned,
    onSelect,
    onPinToggle,
}) => {
    return (
        <button
            onClick={onSelect}
            className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 transition-colors text-left group",
                isActive && "bg-[var(--glass-accent)]/10"
            )}
        >
            <div className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                entity.region ? REGION_COLORS[entity.region] : 'bg-gray-500'
            )} />
            <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{entity.name}</div>
                <div className="text-[10px] text-white/40 capitalize">
                    {entity.entityType}
                    {entity.legalName && entity.legalName !== entity.name && (
                        <> · {entity.legalName}</>
                    )}
                </div>
            </div>

            {/* Completeness indicator */}
            {entity.completeness !== undefined && (
                <div className="text-[10px] text-white/40">
                    {entity.completeness}%
                </div>
            )}

            {/* Pin button */}
            <button
                onClick={onPinToggle}
                className={cn(
                    "p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                    isPinned ? "text-[var(--glass-accent)]" : "text-white/30 hover:text-white/60"
                )}
            >
                <Pin size={12} className={cn(isPinned && "fill-current")} />
            </button>

            {/* Active check */}
            {isActive && (
                <Check size={14} className="text-[var(--glass-accent)] flex-shrink-0" />
            )}
        </button>
    );
};

VaultContextSwitcher.displayName = 'VaultContextSwitcher';
