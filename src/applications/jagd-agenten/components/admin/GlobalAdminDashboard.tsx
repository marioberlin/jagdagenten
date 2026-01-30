/**
 * Global Admin Dashboard
 *
 * Platform-level administration view for managing all Jagdreviere,
 * global administrators, and platform statistics.
 */

import React, { useState, useEffect } from 'react';
import {
    Shield,
    MapPin,
    Plus,
    Users,
    Building,
    Activity,
    TrendingUp,
    Search,
    Filter,
    MoreVertical,
    Edit2,
    Trash2,
    UserPlus,
    BarChart3,
    X,
    Settings,
} from 'lucide-react';
import { useAdminStore, type Jagdrevier } from '@/stores/useAdminStore';
import { BackgroundSelector } from './BackgroundSelector';

// ============================================================================
// Bundesland Options
// ============================================================================

const BUNDESLAENDER = [
    'Baden-Württemberg',
    'Bayern',
    'Berlin',
    'Brandenburg',
    'Bremen',
    'Hamburg',
    'Hessen',
    'Mecklenburg-Vorpommern',
    'Niedersachsen',
    'Nordrhein-Westfalen',
    'Rheinland-Pfalz',
    'Saarland',
    'Sachsen',
    'Sachsen-Anhalt',
    'Schleswig-Holstein',
    'Thüringen',
];

// ============================================================================
// Components
// ============================================================================

interface RevierCardProps {
    revier: Jagdrevier;
    onEdit: () => void;
    onDelete: () => void;
    onAssignAdmin: () => void;
    onViewStats: () => void;
}

function RevierCard({ revier, onEdit, onDelete, onAssignAdmin, onViewStats }: RevierCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    const tierColors: Record<string, string> = {
        free: 'bg-gray-500',
        standard: 'bg-blue-500',
        premium: 'bg-amber-500',
        enterprise: 'bg-purple-500',
    };

    return (
        <div className="p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] relative">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold">{revier.name}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">{revier.bundesland}</p>
                    </div>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 top-8 w-40 py-1 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] shadow-xl z-10">
                            <button
                                onClick={() => { setShowMenu(false); onEdit(); }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                            >
                                <Edit2 className="w-4 h-4" /> Bearbeiten
                            </button>
                            <button
                                onClick={() => { setShowMenu(false); onAssignAdmin(); }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                            >
                                <UserPlus className="w-4 h-4" /> Pächter zuweisen
                            </button>
                            <button
                                onClick={() => { setShowMenu(false); onViewStats(); }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                            >
                                <BarChart3 className="w-4 h-4" /> Statistiken
                            </button>
                            <hr className="my-1 border-[var(--glass-border)]" />
                            <button
                                onClick={() => { setShowMenu(false); onDelete(); }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-red-500/20 text-red-400 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Deaktivieren
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {revier.description && (
                <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                    {revier.description}
                </p>
            )}

            <div className="flex items-center gap-4 text-sm">
                {revier.sizeHectares && (
                    <div className="flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-[var(--text-secondary)]" />
                        <span>{revier.sizeHectares} ha</span>
                    </div>
                )}
                <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[var(--text-secondary)]" />
                    <span>{revier.memberCount || 0} Mitglieder</span>
                </div>
                <span className={`ml-auto px-2 py-0.5 rounded-full text-xs text-white ${tierColors[revier.billingTier]}`}>
                    {revier.billingTier}
                </span>
            </div>

            {!revier.isActive && (
                <div className="mt-3 px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs text-center">
                    Deaktiviert
                </div>
            )}
        </div>
    );
}

interface CreateRevierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (revier: Partial<Jagdrevier>) => void;
}

function CreateRevierModal({ isOpen, onClose, onCreate }: CreateRevierModalProps) {
    const [form, setForm] = useState({
        name: '',
        description: '',
        bundesland: '',
        sizeHectares: '',
        contactEmail: '',
        contactPhone: '',
        billingTier: 'standard' as const,
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.bundesland) return;

        onCreate({
            ...form,
            sizeHectares: form.sizeHectares ? parseFloat(form.sizeHectares) : undefined,
        });
        setForm({ name: '', description: '', bundesland: '', sizeHectares: '', contactEmail: '', contactPhone: '', billingTier: 'standard' });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg p-6 rounded-2xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">Neues Revier erstellen</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black/20 border border-[var(--glass-border)] focus:border-green-500 outline-none"
                            placeholder="z.B. Revier Waldau"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Bundesland *</label>
                        <select
                            value={form.bundesland}
                            onChange={(e) => setForm({ ...form, bundesland: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black/20 border border-[var(--glass-border)] focus:border-green-500 outline-none"
                            required
                        >
                            <option value="">Bitte wählen...</option>
                            {BUNDESLAENDER.map((bl) => (
                                <option key={bl} value={bl}>{bl}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Beschreibung</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black/20 border border-[var(--glass-border)] focus:border-green-500 outline-none resize-none"
                            rows={2}
                            placeholder="Kurze Beschreibung des Reviers..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Größe (ha)</label>
                            <input
                                type="number"
                                value={form.sizeHectares}
                                onChange={(e) => setForm({ ...form, sizeHectares: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-black/20 border border-[var(--glass-border)] focus:border-green-500 outline-none"
                                placeholder="z.B. 850"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Tarif</label>
                            <select
                                value={form.billingTier}
                                onChange={(e) => setForm({ ...form, billingTier: e.target.value as any })}
                                className="w-full px-3 py-2 rounded-lg bg-black/20 border border-[var(--glass-border)] focus:border-green-500 outline-none"
                            >
                                <option value="free">Free</option>
                                <option value="standard">Standard</option>
                                <option value="premium">Premium</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">E-Mail</label>
                            <input
                                type="email"
                                value={form.contactEmail}
                                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-black/20 border border-[var(--glass-border)] focus:border-green-500 outline-none"
                                placeholder="kontakt@revier.de"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Telefon</label>
                            <input
                                type="tel"
                                value={form.contactPhone}
                                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-black/20 border border-[var(--glass-border)] focus:border-green-500 outline-none"
                                placeholder="+49 170 1234567"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors font-medium"
                        >
                            Erstellen
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

export function GlobalAdminDashboard() {
    const {
        isGlobalAdmin,
        platformStats,
        reviere,
        reviereLoading,
        checkGlobalAdmin,
        fetchPlatformStats,
        fetchReviere,
        createRevier,
        deleteRevier,
    } = useAdminStore();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBundesland, setFilterBundesland] = useState('');

    useEffect(() => {
        checkGlobalAdmin();
        fetchPlatformStats();
        fetchReviere();
    }, [checkGlobalAdmin, fetchPlatformStats, fetchReviere]);

    // Filter reviere
    const filteredReviere = reviere.filter((r) => {
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.bundesland.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBundesland = !filterBundesland || r.bundesland === filterBundesland;
        return matchesSearch && matchesBundesland;
    });

    if (!isGlobalAdmin) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 rounded-2xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-red-400" />
                    <h2 className="text-lg font-bold mb-2">Zugriff verweigert</h2>
                    <p className="text-[var(--text-secondary)]">
                        Diese Seite ist nur für Plattform-Administratoren zugänglich.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="w-7 h-7 text-green-400" />
                        Plattform-Administration
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        Verwaltung aller Jagdreviere und Benutzer
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Neues Revier
                </button>
            </div>

            {/* Stats Cards */}
            {platformStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{platformStats.totalReviere}</p>
                                <p className="text-sm text-[var(--text-secondary)]">Reviere</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{platformStats.activeReviere}</p>
                                <p className="text-sm text-[var(--text-secondary)]">Aktiv</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <Users className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{platformStats.totalMembers}</p>
                                <p className="text-sm text-[var(--text-secondary)]">Mitglieder</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{platformStats.globalAdmins}</p>
                                <p className="text-sm text-[var(--text-secondary)]">Admins</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search & Filter */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] focus:border-green-500 outline-none"
                        placeholder="Reviere suchen..."
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <select
                        value={filterBundesland}
                        onChange={(e) => setFilterBundesland(e.target.value)}
                        className="pl-9 pr-8 py-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] focus:border-green-500 outline-none appearance-none cursor-pointer"
                    >
                        <option value="">Alle Bundesländer</option>
                        {BUNDESLAENDER.map((bl) => (
                            <option key={bl} value={bl}>{bl}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Reviere Grid */}
            {reviereLoading ? (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                    Lade Reviere...
                </div>
            ) : filteredReviere.length === 0 ? (
                <div className="text-center py-12">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
                    <p className="text-[var(--text-secondary)]">
                        {searchQuery || filterBundesland
                            ? 'Keine Reviere gefunden'
                            : 'Noch keine Reviere vorhanden'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredReviere.map((revier) => (
                        <RevierCard
                            key={revier.id}
                            revier={revier}
                            onEdit={() => console.log('Edit', revier.id)}
                            onDelete={() => deleteRevier(revier.id)}
                            onAssignAdmin={() => console.log('Assign admin', revier.id)}
                            onViewStats={() => console.log('View stats', revier.id)}
                        />
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <CreateRevierModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={createRevier}
            />

            {/* Settings Section */}
            <div className="pt-6 border-t border-[var(--glass-border)]">
                <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
                    <h2 className="text-lg font-semibold">Revier-Einstellungen</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BackgroundSelector />
                </div>
            </div>
        </div>
    );
}
