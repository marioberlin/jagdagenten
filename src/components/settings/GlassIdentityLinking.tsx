/**
 * Glass Identity Linking
 * 
 * Settings panel for linking accounts across messaging platforms.
 * Allows users to connect Telegram, Slack, Discord, WhatsApp, etc.
 */

import React, { useState, useEffect } from 'react';
import './GlassIdentityLinking.css';

// ============================================================================
// Types
// ============================================================================

interface LinkedPlatform {
    platform: string;
    platformUserId: string;
    platformUsername?: string;
    verified: boolean;
    linkedAt: string;
}

interface IdentityProfile {
    id: string;
    displayName?: string;
    email?: string;
    primaryPlatform?: string;
    linkedPlatforms: LinkedPlatform[];
}

interface PlatformInfo {
    id: string;
    name: string;
    icon: string;
    color: string;
    linkInstructions: string;
}

// ============================================================================
// Platform Definitions
// ============================================================================

const PLATFORMS: PlatformInfo[] = [
    {
        id: 'telegram',
        name: 'Telegram',
        icon: '📱',
        color: '#0088cc',
        linkInstructions: 'Send /link to @LiquidBot on Telegram',
    },
    {
        id: 'slack',
        name: 'Slack',
        icon: '💼',
        color: '#4A154B',
        linkInstructions: 'Run /liquid link in any Slack channel',
    },
    {
        id: 'discord',
        name: 'Discord',
        icon: '🎮',
        color: '#5865F2',
        linkInstructions: 'Run /link in any Discord server with LiquidBot',
    },
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: '💬',
        color: '#25D366',
        linkInstructions: 'Send "link" to the LiquidOS WhatsApp number',
    },
    {
        id: 'email',
        name: 'Email',
        icon: '📧',
        color: '#EA4335',
        linkInstructions: 'Send an email to link@liquidcrypto.ai',
    },
    {
        id: 'imessage',
        name: 'iMessage',
        icon: '🍎',
        color: '#007AFF',
        linkInstructions: 'Available on macOS only via Messages app',
    },
];

// ============================================================================
// Component
// ============================================================================

export const GlassIdentityLinking: React.FC = () => {
    const [identity, setIdentity] = useState<IdentityProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [linkingPlatform, setLinkingPlatform] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadIdentity();
    }, []);

    const loadIdentity = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/v1/identity/me');
            if (res.ok) {
                const data = await res.json();
                setIdentity(data.identity);
            } else if (res.status === 404) {
                // No identity yet, that's fine
                setIdentity(null);
            }
        } catch (err) {
            console.error('Failed to load identity:', err);
        } finally {
            setLoading(false);
        }
    };

    const startLinking = async (platformId: string) => {
        try {
            setLinkingPlatform(platformId);
            setError(null);

            const res = await fetch('/api/v1/identity/link-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetPlatform: platformId }),
            });

            if (res.ok) {
                const data = await res.json();
                setLinkToken(data.token);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to generate link token');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        }
    };

    const cancelLinking = () => {
        setLinkingPlatform(null);
        setLinkToken(null);
        setError(null);
    };

    const unlinkPlatform = async (platformId: string) => {
        if (!confirm(`Unlink ${platformId}? You'll need to re-link to use this platform.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/v1/identity/platforms/${platformId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                await loadIdentity();
            } else {
                setError('Failed to unlink platform');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        }
    };

    const getLinkedPlatform = (platformId: string): LinkedPlatform | undefined => {
        return identity?.linkedPlatforms.find(p => p.platform === platformId);
    };

    if (loading) {
        return (
            <div className="glass-identity-linking loading">
                <div className="spinner" />
                <p>Loading identity...</p>
            </div>
        );
    }

    return (
        <div className="glass-identity-linking">
            <div className="identity-header">
                <h2>🔗 Linked Accounts</h2>
                <p>
                    Connect your messaging accounts for a unified experience across platforms.
                    Link once, and your session, memory, and preferences follow you everywhere.
                </p>
            </div>

            {error && (
                <div className="identity-error">
                    <span>⚠️ {error}</span>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {identity && (
                <div className="identity-profile">
                    <div className="profile-avatar">
                        {identity.displayName?.charAt(0) || '👤'}
                    </div>
                    <div className="profile-info">
                        <h3>{identity.displayName || 'Anonymous'}</h3>
                        <p>{identity.linkedPlatforms.length} platform{identity.linkedPlatforms.length !== 1 ? 's' : ''} linked</p>
                    </div>
                </div>
            )}

            <div className="platforms-grid">
                {PLATFORMS.map(platform => {
                    const linked = getLinkedPlatform(platform.id);
                    const isLinking = linkingPlatform === platform.id;

                    return (
                        <div
                            key={platform.id}
                            className={`platform-card ${linked ? 'linked' : ''} ${isLinking ? 'linking' : ''}`}
                            style={{ '--platform-color': platform.color } as React.CSSProperties}
                        >
                            <div className="platform-icon">{platform.icon}</div>
                            <div className="platform-info">
                                <h4>{platform.name}</h4>
                                {linked ? (
                                    <p className="linked-as">
                                        {linked.platformUsername || linked.platformUserId}
                                        {linked.verified && <span className="verified">✓</span>}
                                    </p>
                                ) : (
                                    <p className="not-linked">Not connected</p>
                                )}
                            </div>

                            <div className="platform-actions">
                                {linked ? (
                                    <button
                                        className="unlink-btn"
                                        onClick={() => unlinkPlatform(platform.id)}
                                    >
                                        Unlink
                                    </button>
                                ) : isLinking ? (
                                    <button
                                        className="cancel-btn"
                                        onClick={cancelLinking}
                                    >
                                        Cancel
                                    </button>
                                ) : (
                                    <button
                                        className="link-btn"
                                        onClick={() => startLinking(platform.id)}
                                    >
                                        Link
                                    </button>
                                )}
                            </div>

                            {isLinking && linkToken && (
                                <div className="link-instructions">
                                    <p>{platform.linkInstructions}</p>
                                    <div className="link-token">
                                        <span>Your code:</span>
                                        <code>{linkToken}</code>
                                        <button
                                            className="copy-btn"
                                            onClick={() => navigator.clipboard.writeText(linkToken)}
                                        >
                                            📋
                                        </button>
                                    </div>
                                    <p className="expires">Expires in 10 minutes</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="identity-footer">
                <p>
                    💡 <strong>Tip:</strong> Once linked, you can message from any platform and
                    your AI assistant will remember your context and preferences.
                </p>
            </div>
        </div>
    );
};

export default GlassIdentityLinking;
