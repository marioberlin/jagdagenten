/**
 * Admin Store
 *
 * Zustand store for managing enterprise admin functionality:
 * global admin operations, reviere, members, and invitations.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export type RevierRole = 'jagdpaechter' | 'jagdaufseher' | 'freund' | 'gast' | 'behoerde' | 'lieferant' | 'bauer';

export interface Jagdrevier {
    id: string;
    name: string;
    description?: string;
    bundesland: string;
    sizeHectares?: number;
    geojson?: object;
    contactEmail?: string;
    contactPhone?: string;
    billingTier: 'free' | 'standard' | 'premium' | 'enterprise';
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    memberCount?: number;
}

export interface RevierMember {
    id: string;
    revierId: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    role: RevierRole;
    invitedBy?: string;
    validFrom: string;
    validUntil?: string;
    permissions: Record<string, Record<string, boolean>>;
    notes?: string;
    isActive: boolean;
    createdAt: string;
    roleDisplay?: string;
}

export interface RevierInvitation {
    id: string;
    revierId: string;
    email: string;
    name?: string;
    role: RevierRole;
    invitedBy: string;
    invitedByName?: string;
    token: string;
    message?: string;
    validFrom: string;
    validUntil?: string;
    expiresAt: string;
    acceptedAt?: string;
    createdAt: string;
}

export interface RoleTemplate {
    role: RevierRole;
    displayName: string;
    description: string;
    permissions: Record<string, Record<string, boolean>>;
}

export interface GlobalAdmin {
    id: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    grantedBy?: string;
    grantedAt: string;
    isActive: boolean;
}

export interface PlatformStats {
    totalReviere: number;
    activeReviere: number;
    totalMembers: number;
    globalAdmins: number;
    byBundesland: Record<string, number>;
    byTier: Record<string, number>;
}

interface AdminStore {
    // Global Admin State
    isGlobalAdmin: boolean;
    globalAdmins: GlobalAdmin[];
    platformStats: PlatformStats | null;

    // Reviere State
    reviere: Jagdrevier[];
    currentRevier: Jagdrevier | null;
    reviereLoading: boolean;
    reviereError: string | null;

    // Members State
    members: RevierMember[];
    membersLoading: boolean;

    // Invitations State
    invitations: RevierInvitation[];
    invitationsLoading: boolean;

    // Role Templates
    roleTemplates: RoleTemplate[];

    // My Memberships
    myMemberships: RevierMember[];

    // Actions
    checkGlobalAdmin: () => Promise<void>;
    fetchGlobalAdmins: () => Promise<void>;
    addGlobalAdmin: (userId: string, userName?: string, userEmail?: string) => Promise<void>;
    removeGlobalAdmin: (userId: string) => Promise<void>;

    fetchPlatformStats: () => Promise<void>;

    fetchReviere: (filters?: { bundesland?: string; active?: boolean }) => Promise<void>;
    fetchRevier: (revierId: string) => Promise<void>;
    createRevier: (revier: Partial<Jagdrevier>) => Promise<Jagdrevier | null>;
    updateRevier: (revierId: string, updates: Partial<Jagdrevier>) => Promise<void>;
    deleteRevier: (revierId: string) => Promise<void>;

    fetchMembers: (revierId: string) => Promise<void>;
    addMember: (revierId: string, member: Partial<RevierMember>) => Promise<void>;
    updateMember: (revierId: string, userId: string, updates: Partial<RevierMember>) => Promise<void>;
    removeMember: (revierId: string, userId: string) => Promise<void>;

    fetchInvitations: (revierId: string) => Promise<void>;
    sendInvitation: (revierId: string, invitation: { email: string; name?: string; role: RevierRole; message?: string; validUntil?: string }) => Promise<string | null>;
    cancelInvitation: (revierId: string, invitationId: string) => Promise<void>;
    acceptInvitation: (token: string, userId: string, userName?: string) => Promise<void>;

    fetchRoleTemplates: () => Promise<void>;
    fetchMyMemberships: () => Promise<void>;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useAdminStore = create<AdminStore>()((set, get) => ({
    // Initial State
    isGlobalAdmin: false,
    globalAdmins: [],
    platformStats: null,
    reviere: [],
    currentRevier: null,
    reviereLoading: false,
    reviereError: null,
    members: [],
    membersLoading: false,
    invitations: [],
    invitationsLoading: false,
    roleTemplates: [],
    myMemberships: [],

    // Global Admin Actions
    checkGlobalAdmin: async () => {
        try {
            const res = await fetch('/api/v1/admin/global-admins');
            const data = await res.json();
            // In production, check if current user is in the list
            set({ isGlobalAdmin: !data.error, globalAdmins: data.admins || [] });
        } catch {
            set({ isGlobalAdmin: false });
        }
    },

    fetchGlobalAdmins: async () => {
        try {
            const res = await fetch('/api/v1/admin/global-admins');
            const data = await res.json();
            set({ globalAdmins: data.admins || [] });
        } catch (error) {
            console.error('Failed to fetch global admins:', error);
        }
    },

    addGlobalAdmin: async (userId, userName, userEmail) => {
        try {
            const res = await fetch('/api/v1/admin/global-admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, userName, userEmail }),
            });
            const data = await res.json();
            if (data.admin) {
                set((state) => ({ globalAdmins: [...state.globalAdmins, data.admin] }));
            }
        } catch (error) {
            console.error('Failed to add global admin:', error);
        }
    },

    removeGlobalAdmin: async (userId) => {
        try {
            await fetch(`/api/v1/admin/global-admins/${userId}`, { method: 'DELETE' });
            set((state) => ({
                globalAdmins: state.globalAdmins.filter((ga) => ga.userId !== userId),
            }));
        } catch (error) {
            console.error('Failed to remove global admin:', error);
        }
    },

    fetchPlatformStats: async () => {
        try {
            const res = await fetch('/api/v1/admin/stats');
            const data = await res.json();
            set({ platformStats: data.stats || null });
        } catch (error) {
            console.error('Failed to fetch platform stats:', error);
        }
    },

    // Reviere Actions
    fetchReviere: async (filters) => {
        set({ reviereLoading: true, reviereError: null });
        try {
            const params = new URLSearchParams();
            if (filters?.bundesland) params.set('bundesland', filters.bundesland);
            if (filters?.active !== undefined) params.set('active', String(filters.active));

            const res = await fetch(`/api/v1/admin/reviere?${params.toString()}`);
            const data = await res.json();
            set({ reviere: data.reviere || [], reviereLoading: false });
        } catch (error) {
            set({ reviereError: 'Fehler beim Laden der Reviere', reviereLoading: false });
        }
    },

    fetchRevier: async (revierId) => {
        try {
            const res = await fetch(`/api/v1/admin/reviere/${revierId}`);
            const data = await res.json();
            set({ currentRevier: data.revier || null });
        } catch (error) {
            console.error('Failed to fetch revier:', error);
        }
    },

    createRevier: async (revier) => {
        try {
            const res = await fetch('/api/v1/admin/reviere', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(revier),
            });
            const data = await res.json();
            if (data.revier) {
                set((state) => ({ reviere: [...state.reviere, data.revier] }));
                return data.revier;
            }
            return null;
        } catch (error) {
            console.error('Failed to create revier:', error);
            return null;
        }
    },

    updateRevier: async (revierId, updates) => {
        try {
            const res = await fetch(`/api/v1/admin/reviere/${revierId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            const data = await res.json();
            if (data.revier) {
                set((state) => ({
                    reviere: state.reviere.map((r) => (r.id === revierId ? data.revier : r)),
                    currentRevier: state.currentRevier?.id === revierId ? data.revier : state.currentRevier,
                }));
            }
        } catch (error) {
            console.error('Failed to update revier:', error);
        }
    },

    deleteRevier: async (revierId) => {
        try {
            await fetch(`/api/v1/admin/reviere/${revierId}`, { method: 'DELETE' });
            set((state) => ({
                reviere: state.reviere.filter((r) => r.id !== revierId),
                currentRevier: state.currentRevier?.id === revierId ? null : state.currentRevier,
            }));
        } catch (error) {
            console.error('Failed to delete revier:', error);
        }
    },

    // Member Actions
    fetchMembers: async (revierId) => {
        set({ membersLoading: true });
        try {
            const res = await fetch(`/api/v1/reviere/${revierId}/members`);
            const data = await res.json();
            set({ members: data.members || [], membersLoading: false });
        } catch (error) {
            set({ membersLoading: false });
        }
    },

    addMember: async (revierId, member) => {
        try {
            const res = await fetch(`/api/v1/reviere/${revierId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(member),
            });
            const data = await res.json();
            if (data.member) {
                set((state) => ({ members: [...state.members, data.member] }));
            }
        } catch (error) {
            console.error('Failed to add member:', error);
        }
    },

    updateMember: async (revierId, userId, updates) => {
        try {
            const res = await fetch(`/api/v1/reviere/${revierId}/members/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            const data = await res.json();
            if (data.member) {
                set((state) => ({
                    members: state.members.map((m) => (m.userId === userId ? data.member : m)),
                }));
            }
        } catch (error) {
            console.error('Failed to update member:', error);
        }
    },

    removeMember: async (revierId, userId) => {
        try {
            await fetch(`/api/v1/reviere/${revierId}/members/${userId}`, { method: 'DELETE' });
            set((state) => ({
                members: state.members.filter((m) => m.userId !== userId),
            }));
        } catch (error) {
            console.error('Failed to remove member:', error);
        }
    },

    // Invitation Actions
    fetchInvitations: async (revierId) => {
        set({ invitationsLoading: true });
        try {
            const res = await fetch(`/api/v1/reviere/${revierId}/invitations`);
            const data = await res.json();
            set({ invitations: data.invitations || [], invitationsLoading: false });
        } catch (error) {
            set({ invitationsLoading: false });
        }
    },

    sendInvitation: async (revierId, invitation) => {
        try {
            const res = await fetch(`/api/v1/reviere/${revierId}/invitations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invitation),
            });
            const data = await res.json();
            if (data.invitation) {
                set((state) => ({ invitations: [...state.invitations, data.invitation] }));
                return data.inviteLink;
            }
            return null;
        } catch (error) {
            console.error('Failed to send invitation:', error);
            return null;
        }
    },

    cancelInvitation: async (revierId, invitationId) => {
        try {
            await fetch(`/api/v1/reviere/${revierId}/invitations/${invitationId}`, { method: 'DELETE' });
            set((state) => ({
                invitations: state.invitations.filter((i) => i.id !== invitationId),
            }));
        } catch (error) {
            console.error('Failed to cancel invitation:', error);
        }
    },

    acceptInvitation: async (token, userId, userName) => {
        try {
            await fetch(`/api/v1/reviere/invitations/${token}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, userName }),
            });
            // Refresh memberships
            get().fetchMyMemberships();
        } catch (error) {
            console.error('Failed to accept invitation:', error);
        }
    },

    // Role Templates
    fetchRoleTemplates: async () => {
        try {
            const res = await fetch('/api/v1/reviere/roles');
            const data = await res.json();
            set({ roleTemplates: data.roles || [] });
        } catch (error) {
            console.error('Failed to fetch role templates:', error);
        }
    },

    // My Memberships
    fetchMyMemberships: async () => {
        try {
            const res = await fetch('/api/v1/reviere/me');
            const data = await res.json();
            set({ myMemberships: data.memberships || [] });
        } catch (error) {
            console.error('Failed to fetch my memberships:', error);
        }
    },
}));
