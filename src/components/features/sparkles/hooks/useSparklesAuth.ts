/**
 * useSparklesAuth - OAuth authentication hook for Sparkles Mail
 *
 * Handles Google OAuth flow, session restoration, and token refresh.
 * Now uses server-side Redis token storage for security.
 */

import { useEffect, useCallback, useState } from 'react';
import { useSparklesStore } from '@/stores/sparklesStore';
import { sparklesApi, transformBackendLabel, tokenApi } from '@/services/sparklesApi';

// =============================================================================
// Types
// =============================================================================

interface UseSparklesAuthReturn {
    isAuthenticated: boolean;
    isAuthenticating: boolean;
    error: string | null;
    initiateAuth: () => Promise<void>;
    handleCallback: (code: string, state?: string) => Promise<void>;
    logout: (accountId?: string) => Promise<void>;
    restoreSession: () => Promise<boolean>;
    checkServerSession: () => Promise<boolean>;
}

// Storage keys for account metadata (not credentials)
const ACCOUNT_METADATA_KEY = 'sparkles_account_metadata';

interface StoredAccountMetadata {
    accountId: string;
    email: string;
    name?: string;
    avatar?: string;
}

// =============================================================================
// Hook
// =============================================================================

export function useSparklesAuth(): UseSparklesAuthReturn {
    const {
        accounts,
        addAccount,
        removeAccount,
        setLabels,
        setSyncStatus,
    } = useSparklesStore();

    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAuthenticated = accounts.length > 0 && sparklesApi.hasSession();

    /**
     * Initiate OAuth flow - redirects to Google
     */
    const initiateAuth = useCallback(async () => {
        try {
            setIsAuthenticating(true);
            setError(null);

            const { url, state } = await sparklesApi.auth.getAuthUrl();

            // Store state for CSRF protection
            sessionStorage.setItem('sparkles_oauth_state', state);

            // Redirect to Google OAuth
            window.location.href = url;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to initiate authentication');
            setIsAuthenticating(false);
        }
    }, []);

    /**
     * Handle OAuth callback with code
     */
    const handleCallback = useCallback(async (code: string, state?: string) => {
        try {
            setIsAuthenticating(true);
            setError(null);

            // Verify state for CSRF protection
            const storedState = sessionStorage.getItem('sparkles_oauth_state');
            if (state && storedState && state !== storedState) {
                throw new Error('OAuth state mismatch - possible CSRF attack');
            }
            sessionStorage.removeItem('sparkles_oauth_state');

            // Exchange code for tokens (tokens are stored server-side automatically)
            const { profile } = await sparklesApi.auth.callback(code, state);

            // Generate account ID
            const accountId = `gmail_${profile.email.replace(/[@.]/g, '_')}`;

            // Store minimal account metadata for UI restoration
            const metadata: StoredAccountMetadata = {
                accountId,
                email: profile.email,
                name: profile.name,
                avatar: profile.avatar,
            };

            const existing = getStoredAccountMetadata();
            existing[accountId] = metadata;
            localStorage.setItem(ACCOUNT_METADATA_KEY, JSON.stringify(existing));

            // Add account to store (tokens are managed server-side)
            addAccount({
                id: accountId,
                email: profile.email,
                name: profile.name,
                avatar: profile.avatar,
                accessToken: '', // Tokens stored server-side
                refreshToken: '', // Tokens stored server-side
                expiresAt: Date.now() + 3600000, // Will be refreshed via API
                isEnabled: true,
                syncMode: 'inbox',
                color: generateAccountColor(accounts.length),
            });

            // Fetch labels
            const labels = await sparklesApi.profile.listLabels();
            setLabels(accountId, labels.map((l) => transformBackendLabel(l, accountId)));

            // Set sync status
            setSyncStatus(accountId, {
                accountId,
                status: 'idle',
                lastSyncAt: Date.now(),
            });

            setIsAuthenticating(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Authentication failed');
            setIsAuthenticating(false);
            throw err;
        }
    }, [accounts.length, addAccount, setLabels, setSyncStatus]);

    /**
     * Logout - remove account and clear session
     */
    const logout = useCallback(async (accountId?: string) => {
        try {
            // Revoke tokens on server
            await tokenApi.revoke();

            if (accountId) {
                removeAccount(accountId);
                const metadata = getStoredAccountMetadata();
                delete metadata[accountId];
                localStorage.setItem(ACCOUNT_METADATA_KEY, JSON.stringify(metadata));
            } else {
                // Remove all accounts
                accounts.forEach((a) => removeAccount(a.id));
                localStorage.removeItem(ACCOUNT_METADATA_KEY);
            }
        } catch (err) {
            console.error('Logout error:', err);
        }
    }, [accounts, removeAccount]);

    /**
     * Check if server session is still valid
     */
    const checkServerSession = useCallback(async (): Promise<boolean> => {
        try {
            return await tokenApi.checkSession();
        } catch {
            return false;
        }
    }, []);

    /**
     * Restore session from server-side storage
     */
    const restoreSession = useCallback(async (): Promise<boolean> => {
        // Check if we have a session ID stored
        if (!sparklesApi.hasSession()) {
            return false;
        }

        try {
            // Verify session is still valid on server
            const sessionInfo = await tokenApi.retrieve();

            if (!sessionInfo.isValid) {
                // Session expired, try to refresh
                try {
                    await sparklesApi.auth.refresh();
                } catch {
                    // Refresh failed, session is gone
                    sparklesApi.clearSession();
                    return false;
                }
            }

            // Session is valid, restore account from stored metadata
            const stored = getStoredAccountMetadata();
            const accountMetadata = Object.values(stored).find(
                (m) => m.email === sessionInfo.email
            );

            if (accountMetadata && !accounts.find((a) => a.email === sessionInfo.email)) {
                addAccount({
                    id: accountMetadata.accountId,
                    email: sessionInfo.email,
                    name: sessionInfo.name || accountMetadata.name,
                    avatar: sessionInfo.avatar || accountMetadata.avatar,
                    accessToken: '',
                    refreshToken: '',
                    expiresAt: sessionInfo.expiresAt,
                    isEnabled: true,
                    syncMode: 'inbox',
                    color: generateAccountColor(accounts.length),
                });

                // Fetch labels
                const labels = await sparklesApi.profile.listLabels();
                setLabels(
                    accountMetadata.accountId,
                    labels.map((l) => transformBackendLabel(l, accountMetadata.accountId))
                );
            }

            return true;
        } catch (err) {
            console.error('Session restoration failed:', err);
            return false;
        }
    }, [accounts, addAccount, setLabels]);

    /**
     * Check for OAuth callback on mount
     */
    useEffect(() => {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        if (code) {
            // Clear URL params
            window.history.replaceState({}, '', url.pathname);

            // Handle callback
            handleCallback(code, state || undefined).catch(console.error);
        } else {
            // Try to restore existing session
            restoreSession().catch(console.error);
        }
    }, [handleCallback, restoreSession]);

    return {
        isAuthenticated,
        isAuthenticating,
        error,
        initiateAuth,
        handleCallback,
        logout,
        restoreSession,
        checkServerSession,
    };
}

// =============================================================================
// Helpers
// =============================================================================

function getStoredAccountMetadata(): Record<string, StoredAccountMetadata> {
    try {
        const stored = localStorage.getItem(ACCOUNT_METADATA_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

const ACCOUNT_COLORS = [
    '#0A84FF', // Blue
    '#BF5AF2', // Purple
    '#30D158', // Green
    '#FF9F0A', // Orange
    '#FF453A', // Red
    '#64D2FF', // Cyan
    '#FFD60A', // Yellow
    '#AC8E68', // Brown
];

function generateAccountColor(index: number): string {
    return ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
}

export default useSparklesAuth;
