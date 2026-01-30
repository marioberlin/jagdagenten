/**
 * Revier Admin Panel
 *
 * Per-revier administration view for managing members,
 * invitations, and revier settings.
 */

import React, { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    Mail,
    MoreVertical,
    Edit2,
    Trash2,
    Clock,
    Check,
    X,
    Send,
    Copy,
    Calendar,
} from 'lucide-react';
import { useAdminStore, type RevierMember, type RevierInvitation, type RevierRole } from '@/stores/useAdminStore';

// ============================================================================
// Role Badge Component
// ============================================================================

const ROLE_COLORS: Record<RevierRole, { bg: string; text: string }> = {
    jagdpaechter: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
    jagdaufseher: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    freund: { bg: 'bg-green-500/20', text: 'text-green-400' },
    gast: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
    behoerde: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    lieferant: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
    bauer: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
};

const ROLE_LABELS: Record<RevierRole, string> = {
    jagdpaechter: 'Jagdpächter',
    jagdaufseher: 'Jagdaufseher',
    freund: 'Freund',
    gast: 'Gast',
    behoerde: 'Behörde',
    lieferant: 'Lieferant',
    bauer: 'Bauer',
};

function RoleBadge({ role }: { role: RevierRole }) {
    const colors = ROLE_COLORS[role] || ROLE_COLORS.gast;
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
            {ROLE_LABELS[role] || role}
        </span>
    );
}

// ============================================================================
// Member Row Component
// ============================================================================

interface MemberRowProps {
    member: RevierMember;
    onEdit: () => void;
    onRemove: () => void;
    canManage: boolean;
}

function MemberRow({ member, onEdit, onRemove, canManage }: MemberRowProps) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-green-400 font-medium">
                    {member.userName?.charAt(0).toUpperCase() || 'U'}
                </span>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{member.userName || 'Unbekannt'}</span>
                    <RoleBadge role={member.role} />
                </div>
                {member.userEmail && (
                    <p className="text-sm text-[var(--text-secondary)] truncate">{member.userEmail}</p>
                )}
            </div>

            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Calendar className="w-4 h-4" />
                <span>{new Date(member.validFrom).toLocaleDateString('de-DE')}</span>
            </div>

            {member.validUntil && (
                <div className="flex items-center gap-1 text-sm text-amber-400">
                    <Clock className="w-4 h-4" />
                    <span>bis {new Date(member.validUntil).toLocaleDateString('de-DE')}</span>
                </div>
            )}

            {canManage && (
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 top-8 w-36 py-1 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] shadow-xl z-10">
                            <button
                                onClick={() => { setShowMenu(false); onEdit(); }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                            >
                                <Edit2 className="w-4 h-4" /> Bearbeiten
                            </button>
                            <button
                                onClick={() => { setShowMenu(false); onRemove(); }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-red-500/20 text-red-400 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Entfernen
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Invitation Row Component
// ============================================================================

interface InvitationRowProps {
    invitation: RevierInvitation;
    onCancel: () => void;
    onCopyLink: () => void;
}

function InvitationRow({ invitation, onCancel, onCopyLink }: InvitationRowProps) {
    const isExpired = new Date(invitation.expiresAt) < new Date();

    return (
        <div className={`flex items-center gap-4 p-3 rounded-lg ${isExpired ? 'opacity-50' : 'hover:bg-white/5'} transition-colors`}>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-400" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{invitation.name || invitation.email}</span>
                    <RoleBadge role={invitation.role} />
                    {isExpired && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">
                            Abgelaufen
                        </span>
                    )}
                </div>
                <p className="text-sm text-[var(--text-secondary)] truncate">{invitation.email}</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Clock className="w-4 h-4" />
                <span>Läuft ab: {new Date(invitation.expiresAt).toLocaleDateString('de-DE')}</span>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={onCopyLink}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    title="Link kopieren"
                >
                    <Copy className="w-4 h-4" />
                </button>
                <button
                    onClick={onCancel}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                    title="Einladung abbrechen"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// Invitation Modal
// ============================================================================

interface InvitationModalProps {
    isOpen: boolean;
    onClose: () => void;
    revierId: string;
}

function InvitationModal({ isOpen, onClose, revierId }: InvitationModalProps) {
    const { sendInvitation, roleTemplates, fetchRoleTemplates } = useAdminStore();

    const [form, setForm] = useState({
        email: '',
        name: '',
        role: 'freund' as RevierRole,
        message: '',
        validUntil: '',
    });
    const [inviteLink, setInviteLink] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && roleTemplates.length === 0) {
            fetchRoleTemplates();
        }
    }, [isOpen, roleTemplates.length, fetchRoleTemplates]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.role) return;

        const link = await sendInvitation(revierId, {
            email: form.email,
            name: form.name || undefined,
            role: form.role,
            message: form.message || undefined,
            validUntil: form.validUntil || undefined,
        });

        if (link) {
            setInviteLink(link);
        }
    };

    const handleCopyLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(`${window.location.origin}${inviteLink}`);
        }
    };

    const handleClose = () => {
        setForm({ email: '', name: '', role: 'freund', message: '', validUntil: '' });
        setInviteLink(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg p-6 rounded-2xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-green-400" />
                        Mitglied einladen
                    </h2>
                    <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {inviteLink ? (
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                            <div className="flex items-center gap-2 mb-2">
                                <Check className="w-5 h-5 text-green-400" />
                                <span className="font-medium text-green-400">Einladung gesendet!</span>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] mb-3">
                                Eine E-Mail wurde an {form.email} gesendet. Alternativ können Sie den Einladungslink teilen:
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={`${window.location.origin}${inviteLink}`}
                                    readOnly
                                    className="flex-1 px-3 py-2 rounded-lg bg-black/20 border border-[var(--glass-border)] text-sm"
                                />
                                <button
                                    onClick={handleCopyLink}
                                    className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-full px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors font-medium"
                        >
                            Fertig
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">E-Mail-Adresse *</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-black/20 border border-[var(--glass-border)] focus:border-green-500 outline-none"
                                placeholder="gast@beispiel.de"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-black/20 border border-[var(--glass-border)] focus:border-green-500 outline-none"
                                placeholder="Max Mustermann"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Rolle *</label>
                            <select
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value as RevierRole })}
                                className="w-full px-3 py-2 rounded-lg bg-black/20 border border-[var(--glass-border)] focus:border-green-500 outline-none"
                            >
                                {roleTemplates.map((rt) => (
                                    <option key={rt.role} value={rt.role}>
                                        {rt.displayName} — {rt.description}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {form.role === 'gast' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Gültig bis</label>
                                <input
                                    type="date"
                                    value={form.validUntil}
                                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-black/20 border border-[var(--glass-border)] focus:border-green-500 outline-none"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">Nachricht (optional)</label>
                            <textarea
                                value={form.message}
                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-black/20 border border-[var(--glass-border)] focus:border-green-500 outline-none resize-none"
                                rows={2}
                                placeholder="Herzlich willkommen in unserem Revier..."
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                Abbrechen
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                Einladen
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

interface RevierAdminPanelProps {
    revierId: string;
    revierName?: string;
}

export function RevierAdminPanel({ revierId, revierName }: RevierAdminPanelProps) {
    const {
        members,
        membersLoading,
        invitations,
        invitationsLoading,
        fetchMembers,
        fetchInvitations,
        fetchRoleTemplates,
        removeMember,
        cancelInvitation,
    } = useAdminStore();

    const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
    const [showInviteModal, setShowInviteModal] = useState(false);

    useEffect(() => {
        fetchMembers(revierId);
        fetchInvitations(revierId);
        fetchRoleTemplates();
    }, [revierId, fetchMembers, fetchInvitations, fetchRoleTemplates]);

    const pendingInvitations = invitations.filter((i) => !i.acceptedAt);

    // Check if current user can manage (simplified — in production check actual membership)
    const canManage = true;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="w-7 h-7 text-green-400" />
                        {revierName || 'Revier'} — Mitglieder
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        {members.length} Mitglieder, {pendingInvitations.length} offene Einladungen
                    </p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
                >
                    <UserPlus className="w-5 h-5" />
                    Einladen
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[var(--glass-border)]">
                <button
                    onClick={() => setActiveTab('members')}
                    className={`px-4 py-2 font-medium transition-colors relative ${activeTab === 'members'
                        ? 'text-green-400'
                        : 'text-[var(--text-secondary)] hover:text-white'
                        }`}
                >
                    Mitglieder ({members.length})
                    {activeTab === 'members' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('invitations')}
                    className={`px-4 py-2 font-medium transition-colors relative ${activeTab === 'invitations'
                        ? 'text-green-400'
                        : 'text-[var(--text-secondary)] hover:text-white'
                        }`}
                >
                    Einladungen ({pendingInvitations.length})
                    {activeTab === 'invitations' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400" />
                    )}
                </button>
            </div>

            {/* Content */}
            {activeTab === 'members' && (
                <div className="space-y-2">
                    {membersLoading ? (
                        <div className="text-center py-8 text-[var(--text-secondary)]">
                            Lade Mitglieder...
                        </div>
                    ) : members.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
                            <p className="text-[var(--text-secondary)]">Noch keine Mitglieder</p>
                        </div>
                    ) : (
                        members.map((member) => (
                            <MemberRow
                                key={member.id}
                                member={member}
                                onEdit={() => console.log('Edit member', member.id)}
                                onRemove={() => removeMember(revierId, member.userId)}
                                canManage={canManage}
                            />
                        ))
                    )}
                </div>
            )}

            {activeTab === 'invitations' && (
                <div className="space-y-2">
                    {invitationsLoading ? (
                        <div className="text-center py-8 text-[var(--text-secondary)]">
                            Lade Einladungen...
                        </div>
                    ) : pendingInvitations.length === 0 ? (
                        <div className="text-center py-8">
                            <Mail className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
                            <p className="text-[var(--text-secondary)]">Keine offenen Einladungen</p>
                        </div>
                    ) : (
                        pendingInvitations.map((invitation) => (
                            <InvitationRow
                                key={invitation.id}
                                invitation={invitation}
                                onCancel={() => cancelInvitation(revierId, invitation.id)}
                                onCopyLink={() => {
                                    navigator.clipboard.writeText(
                                        `${window.location.origin}/invitations/${invitation.token}/accept`
                                    );
                                }}
                            />
                        ))
                    )}
                </div>
            )}

            {/* Invite Modal */}
            <InvitationModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                revierId={revierId}
            />
        </div>
    );
}
