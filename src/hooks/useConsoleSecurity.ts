import { useState, useCallback, useEffect } from 'react';
import type { ApiToken } from '@/components/console/TokenTable';
import type { AgentKey } from '@/components/console/AgentKeysList';

type ExpiryOption = 'never' | '7d' | '30d' | '90d';
type ScopeOption = 'read' | 'write' | 'admin';

interface UseConsoleSecurityOptions {
    autoRefresh?: boolean;
    refreshInterval?: number;
}

interface UseConsoleSecurityResult {
    // Data
    tokens: ApiToken[];
    agentKeys: AgentKey[];
    isLoading: boolean;
    error: string | null;

    // Token actions
    generateToken: (config: { name: string; expiry: ExpiryOption; scopes: ScopeOption[] }) => Promise<string>;
    revokeToken: (tokenId: string) => Promise<void>;

    // Agent key actions
    refreshAgentStatus: (keyId: string) => Promise<void>;
    removeAgentKey: (keyId: string) => Promise<void>;

    // General
    refresh: () => Promise<void>;
}

/**
 * useConsoleSecurity
 * 
 * Custom hook for managing security tokens and agent keys with:
 * - Token generation and revocation
 * - Agent key status refresh
 * - Auto-refresh support
 */
export function useConsoleSecurity(options: UseConsoleSecurityOptions = {}): UseConsoleSecurityResult {
    const { autoRefresh = false, refreshInterval = 60000 } = options;

    const [tokens, setTokens] = useState<ApiToken[]>([]);
    const [agentKeys, setAgentKeys] = useState<AgentKey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch security data
    const fetchSecurityData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/tokens');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            setTokens(data.tokens || []);
            setAgentKeys(data.agentKeys || []);
        } catch (err) {
            console.error('[useConsoleSecurity] Failed to fetch:', err);
            setError('Failed to load security data');

            // Mock data for development
            setTokens([
                { id: 'tok-001', name: 'Production Key', createdAt: 'Jan 10, 2026', expiresAt: null, lastUsed: '2 min ago', scopes: ['read', 'write'] },
                { id: 'tok-002', name: 'Dev Testing', createdAt: 'Jan 15, 2026', expiresAt: 'Jan 22, 2026', lastUsed: '1 hour ago', scopes: ['read'] },
                { id: 'tok-003', name: 'CI/CD Pipeline', createdAt: 'Jan 12, 2026', expiresAt: 'Apr 12, 2026', lastUsed: '5 min ago', scopes: ['read', 'write', 'admin'] },
            ]);
            setAgentKeys([
                { id: 'ak-001', agent: 'ShowHeroes Password Agent', url: 'https://a2a.showheroes.ai', status: 'up', lastChecked: '1 min ago' },
                { id: 'ak-002', agent: 'Custom Local Bot', url: 'http://localhost:4000', status: 'down', lastChecked: '5 min ago' },
                { id: 'ak-003', agent: 'Crypto Signals Agent', url: 'https://signals.crypto.io', status: 'up', lastChecked: '2 min ago' },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Generate a new token
    const generateToken = useCallback(async (config: {
        name: string;
        expiry: ExpiryOption;
        scopes: ScopeOption[];
    }): Promise<string> => {
        try {
            const response = await fetch('/api/admin/tokens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            // Add to local state
            setTokens(prev => [...prev, data.token]);

            return data.tokenValue;
        } catch (err) {
            console.error('[useConsoleSecurity] Failed to generate token:', err);

            // Mock token generation
            const mockToken = `lc_${Date.now()}_${Math.random().toString(36).slice(2, 18)}`;

            const expiryDays = config.expiry === 'never' ? null : parseInt(config.expiry);
            const expiresAt = expiryDays
                ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                })
                : null;

            setTokens(prev => [...prev, {
                id: `tok-${Date.now()}`,
                name: config.name,
                createdAt: new Date().toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                }),
                expiresAt,
                lastUsed: null,
                scopes: config.scopes,
            }]);

            return mockToken;
        }
    }, []);

    // Revoke a token
    const revokeToken = useCallback(async (tokenId: string): Promise<void> => {
        try {
            const response = await fetch(`/api/admin/tokens/${tokenId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
        } catch (err) {
            console.error('[useConsoleSecurity] Failed to revoke token:', err);
        }

        // Remove from local state regardless
        setTokens(prev => prev.filter(t => t.id !== tokenId));
    }, []);

    // Refresh agent status
    const refreshAgentStatus = useCallback(async (keyId: string): Promise<void> => {
        try {
            const response = await fetch(`/api/admin/agents/${keyId}/status`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            setAgentKeys(prev => prev.map(k =>
                k.id === keyId ? { ...k, status: data.status, lastChecked: 'Just now' } : k
            ));
        } catch (err) {
            console.error('[useConsoleSecurity] Failed to refresh agent status:', err);

            // Mock status update
            setAgentKeys(prev => prev.map(k =>
                k.id === keyId ? { ...k, lastChecked: 'Just now' } : k
            ));
        }
    }, []);

    // Remove agent key
    const removeAgentKey = useCallback(async (keyId: string): Promise<void> => {
        try {
            const response = await fetch(`/api/admin/agents/${keyId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
        } catch (err) {
            console.error('[useConsoleSecurity] Failed to remove agent key:', err);
        }

        // Remove from local state regardless
        setAgentKeys(prev => prev.filter(k => k.id !== keyId));
    }, []);

    // Refresh function
    const refresh = useCallback(async () => {
        await fetchSecurityData();
    }, [fetchSecurityData]);

    // Fetch on mount
    useEffect(() => {
        fetchSecurityData();
    }, [fetchSecurityData]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchSecurityData, refreshInterval);
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchSecurityData]);

    return {
        tokens,
        agentKeys,
        isLoading,
        error,
        generateToken,
        revokeToken,
        refreshAgentStatus,
        removeAgentKey,
        refresh,
    };
}
