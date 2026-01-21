/**
 * useICloudAuth Hook
 * 
 * Handles iCloud authentication operations:
 * - Login with credentials
 * - 2FA verification
 * - Session restoration
 * - Logout
 */

import { useCallback, useEffect } from 'react';
import { useICloudStore } from '../stores/icloudStore';

const API_BASE = '/api/v1/icloud';

interface LoginCredentials {
    username: string;
    password: string;
}

export function useICloudAuth() {
    const {
        authStatus,
        sessionId,
        account,
        error,
        isDemoMode,
        setAuthStatus,
        setSession,
        setError,
        setDemoMode,
        logout: resetStore,
    } = useICloudStore();

    /**
     * Login with Apple ID credentials
     */
    const login = useCallback(async (credentials: LoginCredentials) => {
        setAuthStatus('connecting');
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (response.status === 202 && data.requires2FA) {
                // 2FA required
                setSession(data.sessionId, null, []);
                setAuthStatus('requires_2fa');
                return { success: false, requires2FA: true };
            }

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Success
            setSession(data.sessionId, data.account, data.services);
            return { success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setError(message);
            setAuthStatus('error');
            return { success: false, error: message };
        }
    }, [setAuthStatus, setSession, setError]);

    /**
     * Verify 2FA code
     */
    const verify2FA = useCallback(async (code: string) => {
        if (!sessionId) {
            setError('No active session');
            return { success: false, error: 'No active session' };
        }

        setAuthStatus('connecting');

        try {
            const response = await fetch(`${API_BASE}/auth/verify-2fa`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-ICloud-Session-Id': sessionId,
                },
                body: JSON.stringify({ code }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            setSession(sessionId, data.account, data.services);
            return { success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Verification failed';
            setError(message);
            setAuthStatus('requires_2fa'); // Stay on 2FA screen
            return { success: false, error: message };
        }
    }, [sessionId, setAuthStatus, setSession, setError]);

    /**
     * Check session status on mount
     */
    const checkSession = useCallback(async () => {
        if (!sessionId) return;

        try {
            const response = await fetch(`${API_BASE}/auth/status`, {
                headers: {
                    'X-ICloud-Session-Id': sessionId,
                },
            });

            const data = await response.json();

            if (data.authenticated) {
                setSession(sessionId, data.account, data.services);
            } else {
                // Session expired
                resetStore();
            }
        } catch {
            // Network error - don't reset, might be offline
            console.warn('Failed to check iCloud session');
        }
    }, [sessionId, setSession, resetStore]);

    /**
     * Logout
     */
    const logout = useCallback(async () => {
        if (sessionId) {
            try {
                await fetch(`${API_BASE}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'X-ICloud-Session-Id': sessionId,
                    },
                });
            } catch {
                // Ignore errors during logout
            }
        }

        resetStore();
    }, [sessionId, resetStore]);

    /**
     * Enter demo mode (for showcasing without real credentials)
     */
    const enterDemoMode = useCallback(() => {
        setDemoMode(true);
        setSession('demo-session', {
            username: 'demo@icloud.com',
            firstName: 'Demo',
            lastName: 'User',
        }, ['contacts', 'calendar', 'mail', 'drive', 'notes', 'reminders', 'photos', 'findmy']);
    }, [setDemoMode, setSession]);

    /**
     * Exit demo mode
     */
    const exitDemoMode = useCallback(() => {
        resetStore();
    }, [resetStore]);

    // Check session on mount if we have a stored sessionId
    useEffect(() => {
        if (sessionId && authStatus === 'disconnected' && !isDemoMode) {
            checkSession();
        }
    }, [sessionId, authStatus, isDemoMode, checkSession]);

    return {
        // State
        authStatus,
        isAuthenticated: authStatus === 'authenticated',
        isConnecting: authStatus === 'connecting',
        requires2FA: authStatus === 'requires_2fa',
        account,
        error,
        isDemoMode,
        sessionId,

        // Actions
        login,
        verify2FA,
        logout,
        checkSession,
        enterDemoMode,
        exitDemoMode,
    };
}
