/**
 * Tests for useAdminStore - Enterprise Admin functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAdminStore } from '../useAdminStore';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useAdminStore', () => {
    beforeEach(() => {
        // Reset store state
        useAdminStore.setState({
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
        });
        mockFetch.mockClear();
    });

    describe('initial state', () => {
        it('should start with isGlobalAdmin false', () => {
            const state = useAdminStore.getState();
            expect(state.isGlobalAdmin).toBe(false);
        });

        it('should start with empty reviere', () => {
            const state = useAdminStore.getState();
            expect(state.reviere).toEqual([]);
        });

        it('should have no current revier selected', () => {
            const state = useAdminStore.getState();
            expect(state.currentRevier).toBeNull();
        });
    });

    describe('role templates', () => {
        it('should fetch role templates from API', async () => {
            const mockRoles = [
                { role: 'jagdpaechter', displayName: 'Jagdpächter', description: 'Admin', permissions: {} },
                { role: 'gast', displayName: 'Gast', description: 'Guest', permissions: {} },
            ];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ roles: mockRoles }),
            });

            const { fetchRoleTemplates } = useAdminStore.getState();
            await fetchRoleTemplates();

            const state = useAdminStore.getState();
            expect(state.roleTemplates.length).toBe(2);
        });

        it('should include role data from API response', async () => {
            const mockRoles = [
                { role: 'jagdpaechter', displayName: 'Jagdpächter', description: 'Admin', permissions: { admin: { all: true } } },
            ];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ roles: mockRoles }),
            });

            const { fetchRoleTemplates } = useAdminStore.getState();
            await fetchRoleTemplates();

            const state = useAdminStore.getState();
            const paechter = state.roleTemplates.find(r => r.role === 'jagdpaechter');
            expect(paechter).toBeDefined();
            expect(paechter?.displayName).toBe('Jagdpächter');
        });

        it('should handle empty role templates', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ roles: [] }),
            });

            const { fetchRoleTemplates } = useAdminStore.getState();
            await fetchRoleTemplates();

            const state = useAdminStore.getState();
            expect(state.roleTemplates).toEqual([]);
        });
    });

    describe('reviere management', () => {
        it('should set loading state when fetching reviere', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ reviere: [] }),
            });

            const { fetchReviere } = useAdminStore.getState();
            const fetchPromise = fetchReviere();

            // Should be loading immediately
            expect(useAdminStore.getState().reviereLoading).toBe(true);

            await fetchPromise;

            expect(useAdminStore.getState().reviereLoading).toBe(false);
        });

        it('should handle fetch error gracefully', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const { fetchReviere } = useAdminStore.getState();
            await fetchReviere();

            const state = useAdminStore.getState();
            expect(state.reviereLoading).toBe(false);
            // The store returns a German user-friendly error message
            expect(state.reviereError).toBeTruthy();
        });
    });

    describe('member management', () => {
        it('should set loading state when fetching members', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ members: [] }),
            });

            const { fetchMembers } = useAdminStore.getState();
            const fetchPromise = fetchMembers('test-revier-id');

            expect(useAdminStore.getState().membersLoading).toBe(true);

            await fetchPromise;

            expect(useAdminStore.getState().membersLoading).toBe(false);
        });
    });

    describe('invitation management', () => {
        it('should set loading state when fetching invitations', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ invitations: [] }),
            });

            const { fetchInvitations } = useAdminStore.getState();
            const fetchPromise = fetchInvitations('test-revier-id');

            expect(useAdminStore.getState().invitationsLoading).toBe(true);

            await fetchPromise;

            expect(useAdminStore.getState().invitationsLoading).toBe(false);
        });
    });
});
