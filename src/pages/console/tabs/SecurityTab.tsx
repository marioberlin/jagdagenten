import { useState, useCallback } from 'react';
import { Key, Plus } from 'lucide-react';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { GlassButton } from '@/components/primitives/GlassButton';
import { TokenTable, TokenGenerator, AgentKeysList } from '@/components/console';
import { useConsoleSecurity } from '@/hooks/useConsoleSecurity';
import { useToast } from '@/components/feedback/GlassToast';

/**
 * SecurityTab
 * 
 * Manage API tokens and agent authentication with:
 * - Token table with generation modal
 * - Connected remote agents list
 * - Toast notifications for all actions
 */
export function SecurityTab() {
    const [showTokenModal, setShowTokenModal] = useState(false);
    const { toast } = useToast();

    const {
        tokens,
        agentKeys,
        isLoading,
        error,
        generateToken,
        revokeToken,
        refreshAgentStatus,
        removeAgentKey,
    } = useConsoleSecurity();

    const handleGenerateToken = useCallback(async (config: {
        name: string;
        expiry: 'never' | '7d' | '30d' | '90d';
        scopes: ('read' | 'write' | 'admin')[];
    }): Promise<string> => {
        try {
            const token = await generateToken(config);
            toast('Token generated successfully', 'success');
            return token;
        } catch {
            toast('Failed to generate token', 'error');
            throw new Error('Failed to generate token');
        }
    }, [generateToken, toast]);

    const handleRevokeToken = useCallback(async (tokenId: string) => {
        try {
            await revokeToken(tokenId);
            toast('Token revoked', 'success');
        } catch {
            toast('Failed to revoke token', 'error');
        }
    }, [revokeToken, toast]);

    const handleRefreshStatus = useCallback(async (keyId: string) => {
        try {
            await refreshAgentStatus(keyId);
            toast('Agent status updated', 'info');
        } catch {
            toast('Failed to refresh agent status', 'error');
        }
    }, [refreshAgentStatus, toast]);

    const handleRemoveAgent = useCallback(async (keyId: string) => {
        try {
            await removeAgentKey(keyId);
            toast('Agent removed', 'success');
        } catch {
            toast('Failed to remove agent', 'error');
        }
    }, [removeAgentKey, toast]);

    const handleVisitAgent = (keyId: string) => {
        const agent = agentKeys.find(k => k.id === keyId);
        if (agent) {
            window.open(agent.url, '_blank');
        }
    };

    // Show error toast
    if (error) {
        toast(error, 'error');
    }

    return (
        <div className="space-y-6">
            {/* API Tokens Section */}
            <GlassContainer className="p-6" border>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            <Key className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">API Tokens</h3>
                            <p className="text-sm text-white/60">Manage authentication tokens for A2A access</p>
                        </div>
                    </div>
                    <GlassButton onClick={() => setShowTokenModal(true)}>
                        <Plus size={16} />
                        Generate Token
                    </GlassButton>
                </div>

                <TokenTable
                    tokens={tokens}
                    onRevoke={handleRevokeToken}
                    isLoading={isLoading}
                />
            </GlassContainer>

            {/* Connected Remote Agents Section */}
            <AgentKeysList
                agentKeys={agentKeys}
                onRefresh={handleRefreshStatus}
                onVisit={handleVisitAgent}
                onRemove={handleRemoveAgent}
                isLoading={isLoading}
            />

            {/* Token Generation Modal */}
            <TokenGenerator
                isOpen={showTokenModal}
                onClose={() => setShowTokenModal(false)}
                onGenerate={handleGenerateToken}
            />
        </div>
    );
}
