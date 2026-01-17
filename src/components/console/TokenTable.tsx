import { motion } from 'framer-motion';
import { Trash2, Key, AlertCircle } from 'lucide-react';
import { GlassChip } from '@/components/primitives/GlassChip';
import { GlassSkeleton } from '@/components/feedback/GlassSkeleton';

export interface ApiToken {
    id: string;
    name: string;
    createdAt: string;
    expiresAt: string | null;
    lastUsed: string | null;
    scopes: string[];
}

interface TokenTableProps {
    tokens: ApiToken[];
    onRevoke?: (tokenId: string) => void;
    isLoading?: boolean;
}

// Skeleton row for loading state
function SkeletonRow() {
    return (
        <tr className="border-b border-white/5">
            <td className="px-4 py-3"><GlassSkeleton width={100} height={16} className="rounded" /></td>
            <td className="px-4 py-3"><GlassSkeleton width={80} height={16} className="rounded" /></td>
            <td className="px-4 py-3"><GlassSkeleton width={80} height={16} className="rounded" /></td>
            <td className="px-4 py-3"><GlassSkeleton width={60} height={16} className="rounded" /></td>
            <td className="px-4 py-3"><GlassSkeleton width={80} height={20} className="rounded-full" /></td>
            <td className="px-4 py-3 text-right"><GlassSkeleton width={24} height={24} className="rounded ml-auto" /></td>
        </tr>
    );
}

/**
 * TokenTable
 * 
 * Table component for displaying API tokens with:
 * - Token metadata (name, created, expires, last used)
 * - Scope badges
 * - Revoke action
 * - Skeleton loading state
 */
export function TokenTable({ tokens, onRevoke, isLoading = false }: TokenTableProps) {
    if (isLoading) {
        return (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Name</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Created</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Expires</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Last Used</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Scopes</th>
                            <th className="text-right px-4 py-3 text-xs font-medium text-white/60 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}
                    </tbody>
                </table>
            </div>
        );
    }

    if (tokens.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-white/40">
                <Key className="w-8 h-8 mb-2 opacity-50" />
                <p>No API tokens generated yet</p>
            </div>
        );
    }

    // Check for expiring tokens (within 7 days)
    const isExpiringSoon = (expiresAt: string | null): boolean => {
        if (!expiresAt) return false;
        const expiryDate = new Date(expiresAt);
        const now = new Date();
        const daysUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    };

    const isExpired = (expiresAt: string | null): boolean => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Name</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Created</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Expires</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Last Used</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/60 uppercase">Scopes</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-white/60 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {tokens.map((token, idx) => {
                        const expired = isExpired(token.expiresAt);
                        const expiring = isExpiringSoon(token.expiresAt);

                        return (
                            <motion.tr
                                key={token.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="hover:bg-white/5"
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-white">{token.name}</span>
                                        {expired && (
                                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                                                Expired
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-white/60">{token.createdAt}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm text-white/60">
                                            {token.expiresAt || 'Never'}
                                        </span>
                                        {expiring && (
                                            <AlertCircle size={14} className="text-yellow-400" />
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-white/60">
                                    {token.lastUsed || 'Never'}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-1">
                                        {token.scopes.map(scope => (
                                            <GlassChip
                                                key={scope}
                                                size="sm"
                                                variant={scope === 'admin' ? 'warning' : 'default'}
                                            >
                                                {scope}
                                            </GlassChip>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {onRevoke && (
                                        <button
                                            onClick={() => onRevoke(token.id)}
                                            className="p-1.5 rounded hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                                            title="Revoke Token"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </td>
                            </motion.tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
