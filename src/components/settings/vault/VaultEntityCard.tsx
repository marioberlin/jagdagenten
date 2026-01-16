/**
 * Vault Entity Card
 * 
 * Card component displaying an organization with completeness ring,
 * pin toggle, and quick info.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Pin, PinOff, ChevronRight, MapPin, Users } from 'lucide-react';
import { VaultOrganization, Region } from '@/types/vaultTypes';
import { cn } from '@/utils/cn';

interface VaultEntityCardProps {
    entity: VaultOrganization;
    isPinned: boolean;
    isActive: boolean;
    rolesCount: number;
    onSelect: () => void;
    onTogglePin: () => void;
}

// Region to accent hue mapping
const REGION_HUES: Record<Region, number> = {
    DACH: 210, // Blue
    Nordics: 180, // Cyan
    LATAM: 30, // Orange
    Asia: 280, // Purple
    UK: 350, // Red
    USA: 230, // Indigo
    Europe: 150, // Green
};

export const VaultEntityCard: React.FC<VaultEntityCardProps> = ({
    entity,
    isPinned,
    isActive,
    rolesCount,
    onSelect,
    onTogglePin,
}) => {
    const accentHue = entity.region ? REGION_HUES[entity.region] : 210;
    const completeness = entity.completeness ?? 0;

    // SVG circle parameters
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (completeness / 100) * circumference;

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative p-4 rounded-xl border transition-all cursor-pointer group",
                "bg-white/5 hover:bg-white/10",
                isActive
                    ? "border-[var(--glass-accent)] shadow-lg shadow-[var(--glass-accent)]/20"
                    : "border-white/10 hover:border-white/20"
            )}
            style={{
                borderLeftWidth: '3px',
                borderLeftColor: `hsl(${accentHue}, 60%, 50%)`,
            }}
            onClick={onSelect}
        >
            {/* Header */}
            <div className="flex items-start gap-3">
                {/* Icon with Completeness Ring */}
                <div className="relative flex-shrink-0">
                    <svg width="40" height="40" className="transform -rotate-90">
                        {/* Background circle */}
                        <circle
                            cx="20"
                            cy="20"
                            r={radius}
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="3"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="20"
                            cy="20"
                            r={radius}
                            fill="none"
                            stroke={`hsl(${accentHue}, 60%, 50%)`}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-500"
                        />
                    </svg>
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ color: `hsl(${accentHue}, 60%, 60%)` }}
                    >
                        <Building2 size={16} />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white truncate">
                            {entity.name}
                        </h3>
                        {entity.entityType === 'headquarters' && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--glass-accent)]/20 text-[var(--glass-accent)]">
                                HQ
                            </span>
                        )}
                        {entity.entityType === 'branch' && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-white/10 text-white/60">
                                Branch
                            </span>
                        )}
                    </div>

                    {entity.legalName !== entity.name && (
                        <p className="text-xs text-white/40 truncate mt-0.5">
                            {entity.legalName}
                        </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-white/50">
                        {entity.vatID && (
                            <span className="font-mono">{entity.vatID}</span>
                        )}
                        {entity.region && (
                            <span
                                className="px-1.5 py-0.5 rounded text-[10px]"
                                style={{
                                    backgroundColor: `hsla(${accentHue}, 40%, 50%, 0.15)`,
                                    color: `hsl(${accentHue}, 60%, 70%)`,
                                }}
                            >
                                {entity.region}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin();
                        }}
                        className={cn(
                            "p-1.5 rounded-lg transition-all",
                            isPinned
                                ? "bg-[var(--glass-accent)]/20 text-[var(--glass-accent)]"
                                : "opacity-0 group-hover:opacity-100 bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
                        )}
                        title={isPinned ? "Unpin" : "Pin"}
                    >
                        {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
                    </button>

                    <ChevronRight
                        size={14}
                        className="text-white/30 group-hover:text-white/60 transition-colors mt-auto"
                    />
                </div>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-xs text-white/40">
                <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {entity.addresses.length} address{entity.addresses.length !== 1 ? 'es' : ''}
                </span>
                {rolesCount > 0 && (
                    <span className="flex items-center gap-1">
                        <Users size={12} />
                        {rolesCount} role{rolesCount !== 1 ? 's' : ''}
                    </span>
                )}
                <span className="ml-auto font-medium" style={{ color: `hsl(${accentHue}, 60%, 60%)` }}>
                    {completeness}%
                </span>
            </div>
        </motion.div>
    );
};
