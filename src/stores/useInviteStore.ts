/**
 * Invite Store
 *
 * Zustand store for hunt invitations and public calls.
 */

import { create } from 'zustand';

// ============================================================================
// Types
// ============================================================================

export interface Invite {
  id: string;
  userId: string;
  inviteType: 'drueckjagd' | 'revierarbeit' | 'hundefuehrer' | 'begehung' | 'andere';
  title: string;
  description?: string;
  bundesland?: string;
  region?: string;
  eventDate?: string;
  eventTimeStart?: string;
  eventTimeEnd?: string;
  requiredRoles: string[];
  maxParticipants?: number;
  currentParticipants: number;
  rulesAcknowledgementRequired: boolean;
  emergencyContactsRequired: boolean;
  experienceRequired?: 'none' | 'basic' | 'experienced';
  status: 'draft' | 'open' | 'closed' | 'cancelled';
  createdAt: string;
  expiresAt?: string;
}

export interface Application {
  id: string;
  inviteId: string;
  userId: string;
  roleRequested?: string;
  message?: string;
  rulesAcknowledged: boolean;
  emergencyContact?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  responseMessage?: string;
  createdAt: string;
}

export interface InviteState {
  invites: Invite[];
  myInvites: Invite[];
  applications: Application[];
  loading: boolean;
  error: string | null;
}

export interface InviteActions {
  fetchInvites: (filters?: { type?: string; bundesland?: string }) => Promise<void>;
  fetchMyInvites: () => Promise<void>;
  createInvite: (invite: Partial<Invite> & { inviteType: string; title: string }) => Promise<void>;
  updateInvite: (id: string, updates: Partial<Invite>) => Promise<void>;
  closeInvite: (id: string) => Promise<void>;
  applyToInvite: (inviteId: string, application: { roleRequested?: string; message?: string; emergencyContact?: string }) => Promise<void>;
  respondToApplication: (appId: string, status: 'accepted' | 'rejected', message?: string) => Promise<void>;
  fetchApplications: (inviteId: string) => Promise<void>;
}

export type InviteStore = InviteState & InviteActions;

// ============================================================================
// Store
// ============================================================================

const API = '/api/v1/jagd/invites';

export const useInviteStore = create<InviteStore>((set) => ({
  invites: [],
  myInvites: [],
  applications: [],
  loading: false,
  error: null,

  fetchInvites: async (filters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.set('type', filters.type);
      if (filters?.bundesland) params.set('bundesland', filters.bundesland);
      const res = await fetch(`${API}?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ invites: data.invites ?? [], loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchMyInvites: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/mine`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ myInvites: data.invites ?? [], loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createInvite: async (invite) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invite),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({ myInvites: [data.invite, ...s.myInvites], loading: false }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateInvite: async (id, updates) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({
        myInvites: s.myInvites.map((i) => (i.id === id ? data.invite : i)),
        invites: s.invites.map((i) => (i.id === id ? data.invite : i)),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  closeInvite: async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({
        myInvites: s.myInvites.map((i) => (i.id === id ? data.invite : i)),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  applyToInvite: async (inviteId, application) => {
    try {
      const res = await fetch(`${API}/${inviteId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(application),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  respondToApplication: async (appId, status, message) => {
    try {
      const res = await fetch(`${API}/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, responseMessage: message }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set((s) => ({
        applications: s.applications.map((a) => (a.id === appId ? data.application : a)),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchApplications: async (inviteId) => {
    try {
      const res = await fetch(`${API}/${inviteId}/applications`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ applications: data.applications ?? [] });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
