/**
 * Identity Linking Service
 * 
 * Manages cross-channel user identities for the messaging gateway.
 * Stores identities as LiquidMind 'context' resources with identity metadata.
 * 
 * Enables:
 * - Same user on Telegram + Discord + Slack shares context
 * - Session continuity across channels
 * - Unified conversation history
 */

import type { ChannelType, IdentityLink, GatewaySession } from './types';
import type { SessionStore } from './gateway';

// ============================================================================
// Identity Metadata (stored in LiquidMind context resource)
// ============================================================================

export interface IdentityMetadata {
    /** Unique canonical ID for this identity */
    canonicalId: string;

    /** Display name for this user */
    displayName?: string;

    /** Avatar URL */
    avatarUrl?: string;

    /** Email if known */
    email?: string;

    /** Linked platform identities */
    linkedPlatforms: Array<{
        channelType: ChannelType;
        platformId: string;
        platformHandle?: string;
        linkedAt: Date;
        verifiedAt?: Date;
    }>;

    /** Cross-platform preferences */
    preferences?: {
        defaultChannel?: ChannelType;
        thinkingLevel?: string;
        activationMode?: 'mention' | 'always' | 'never';
        timezone?: string;
    };

    /** Activity tracking */
    activity?: {
        firstSeen: Date;
        lastSeen: Date;
        totalMessages: number;
        channelBreakdown: Partial<Record<ChannelType, number>>;
    };
}

// ============================================================================
// Identity Store Interface
// ============================================================================

export interface IdentityStore {
    /** Get identity by canonical ID */
    get(canonicalId: string): Promise<IdentityLink | null>;

    /** Get identity by platform ID */
    getByPlatform(channelType: ChannelType, platformId: string): Promise<IdentityLink | null>;

    /** Create new identity */
    create(identity: IdentityLink): Promise<void>;

    /** Update identity */
    update(canonicalId: string, updates: Partial<IdentityLink>): Promise<void>;

    /** Link platform to existing identity */
    linkPlatform(canonicalId: string, channelType: ChannelType, platformId: string): Promise<void>;

    /** Unlink platform from identity */
    unlinkPlatform(canonicalId: string, channelType: ChannelType, platformId: string): Promise<void>;

    /** List all identities */
    list(): Promise<IdentityLink[]>;

    /** Delete identity */
    delete(canonicalId: string): Promise<void>;
}

// ============================================================================
// In-Memory Identity Store
// ============================================================================

export class InMemoryIdentityStore implements IdentityStore {
    private identities = new Map<string, IdentityLink>();
    private platformIndex = new Map<string, string>(); // "channelType:platformId" -> canonicalId

    async get(canonicalId: string): Promise<IdentityLink | null> {
        return this.identities.get(canonicalId) ?? null;
    }

    async getByPlatform(channelType: ChannelType, platformId: string): Promise<IdentityLink | null> {
        const key = `${channelType}:${platformId}`;
        const canonicalId = this.platformIndex.get(key);
        if (!canonicalId) return null;
        return this.identities.get(canonicalId) ?? null;
    }

    async create(identity: IdentityLink): Promise<void> {
        this.identities.set(identity.canonicalId, identity);
        for (const linked of identity.linkedIds) {
            const key = `${linked.channelType}:${linked.platformId}`;
            this.platformIndex.set(key, identity.canonicalId);
        }
    }

    async update(canonicalId: string, updates: Partial<IdentityLink>): Promise<void> {
        const existing = this.identities.get(canonicalId);
        if (!existing) return;

        const updated = { ...existing, ...updates };
        this.identities.set(canonicalId, updated);
    }

    async linkPlatform(canonicalId: string, channelType: ChannelType, platformId: string): Promise<void> {
        const identity = this.identities.get(canonicalId);
        if (!identity) return;

        // Check if already linked elsewhere
        const key = `${channelType}:${platformId}`;
        const existingCanonicalId = this.platformIndex.get(key);
        if (existingCanonicalId && existingCanonicalId !== canonicalId) {
            throw new Error(`Platform ${key} is already linked to identity ${existingCanonicalId}`);
        }

        // Add to linked IDs if not present
        const exists = identity.linkedIds.find(
            l => l.channelType === channelType && l.platformId === platformId
        );
        if (!exists) {
            identity.linkedIds.push({ channelType, platformId });
            this.platformIndex.set(key, canonicalId);
        }
    }

    async unlinkPlatform(canonicalId: string, channelType: ChannelType, platformId: string): Promise<void> {
        const identity = this.identities.get(canonicalId);
        if (!identity) return;

        identity.linkedIds = identity.linkedIds.filter(
            l => !(l.channelType === channelType && l.platformId === platformId)
        );

        const key = `${channelType}:${platformId}`;
        this.platformIndex.delete(key);
    }

    async list(): Promise<IdentityLink[]> {
        return Array.from(this.identities.values());
    }

    async delete(canonicalId: string): Promise<void> {
        const identity = this.identities.get(canonicalId);
        if (!identity) return;

        // Clean up index
        for (const linked of identity.linkedIds) {
            const key = `${linked.channelType}:${linked.platformId}`;
            this.platformIndex.delete(key);
        }

        this.identities.delete(canonicalId);
    }
}

// ============================================================================
// Identity Linking Service
// ============================================================================

export class IdentityLinkingService {
    private identityStore: IdentityStore;
    private sessionStore: SessionStore;

    constructor(identityStore?: IdentityStore, sessionStore?: SessionStore) {
        this.identityStore = identityStore ?? new InMemoryIdentityStore();
        this.sessionStore = sessionStore ?? {
            get: async () => null,
            set: async () => { },
            delete: async () => { },
            list: async () => [],
        };
    }

    // ============================================================================
    // Identity Resolution
    // ============================================================================

    /**
     * Resolve identity for a platform user
     * Returns canonical ID if linked, or creates temporary identity
     */
    async resolveIdentity(channelType: ChannelType, platformId: string): Promise<IdentityLink> {
        // Check if already linked
        const existing = await this.identityStore.getByPlatform(channelType, platformId);
        if (existing) return existing;

        // Create ephemeral identity (not persisted until explicitly linked)
        return {
            canonicalId: `ephemeral:${channelType}:${platformId}`,
            linkedIds: [{ channelType, platformId }],
        };
    }

    /**
     * Get or create a persistent identity (test-compatible)
     */
    async getOrCreateIdentity(
        platform: ChannelType,
        platformUserId: string,
        displayName?: string
    ): Promise<string> {
        const existing = await this.identityStore.getByPlatform(platform, platformUserId);
        if (existing) {
            return existing.canonicalId;
        }

        const identity = await this.createIdentity(displayName ?? platformUserId, {
            channelType: platform,
            platformId: platformUserId,
        });
        return identity.canonicalId;
    }

    /**
     * Find identity by platform
     */
    async findIdentity(platform: ChannelType, platformUserId: string): Promise<string | null> {
        const existing = await this.identityStore.getByPlatform(platform, platformUserId);
        return existing?.canonicalId ?? null;
    }

    /**
     * Get all linked platforms for an identity
     */
    async getLinkedPlatforms(canonicalId: string): Promise<Array<{ platform: ChannelType; platformUserId: string }>> {
        const identity = await this.identityStore.get(canonicalId);
        if (!identity) return [];

        return identity.linkedIds.map(l => ({
            platform: l.channelType,
            platformUserId: l.platformId,
        }));
    }

    /**
     * Check if two platform users are the same identity
     */
    async isSameIdentity(
        a: { channelType: ChannelType; platformId: string },
        b: { channelType: ChannelType; platformId: string }
    ): Promise<boolean> {
        const identityA = await this.identityStore.getByPlatform(a.channelType, a.platformId);
        const identityB = await this.identityStore.getByPlatform(b.channelType, b.platformId);

        if (!identityA || !identityB) return false;
        return identityA.canonicalId === identityB.canonicalId;
    }

    // ============================================================================
    // Identity Management
    // ============================================================================

    /**
     * Create a new persistent identity
     */
    async createIdentity(displayName: string, initialPlatform?: { channelType: ChannelType; platformId: string }): Promise<IdentityLink> {
        const canonicalId = `identity:${Date.now()}-${Math.random().toString(36).substring(7)}`;

        const identity: IdentityLink = {
            canonicalId,
            displayName,
            linkedIds: initialPlatform ? [initialPlatform] : [],
        };

        await this.identityStore.create(identity);
        return identity;
    }

    /**
     * Link a platform account to an identity (with object signature for test compatibility)
     */
    async linkPlatform(
        canonicalId: string,
        platformOrOptions: ChannelType | { platform: ChannelType; platformUserId: string; platformUsername?: string },
        platformId?: string
    ): Promise<void> {
        if (typeof platformOrOptions === 'object') {
            await this.identityStore.linkPlatform(
                canonicalId,
                platformOrOptions.platform,
                platformOrOptions.platformUserId
            );
        } else {
            await this.identityStore.linkPlatform(canonicalId, platformOrOptions, platformId!);
        }
    }

    /**
     * Unlink a platform account from an identity
     */
    async unlinkPlatform(
        canonicalId: string,
        channelType: ChannelType,
        platformId: string
    ): Promise<void> {
        await this.identityStore.unlinkPlatform(canonicalId, channelType, platformId);
    }

    /**
     * Merge two identities (combine their linked platforms)
     */
    async mergeIdentities(targetCanonicalId: string, sourceCanonicalId: string): Promise<IdentityLink | null> {
        const target = await this.identityStore.get(targetCanonicalId);
        const source = await this.identityStore.get(sourceCanonicalId);

        if (!target || !source) return null;

        // Move all source platforms to target
        for (const linked of source.linkedIds) {
            await this.identityStore.linkPlatform(
                targetCanonicalId,
                linked.channelType,
                linked.platformId
            );
        }

        // Delete source identity
        await this.identityStore.delete(sourceCanonicalId);

        return this.identityStore.get(targetCanonicalId);
    }

    // ============================================================================
    // Cross-Channel Session Access
    // ============================================================================

    /**
     * Get all sessions for an identity across all channels
     */
    async getSessionsForIdentity(canonicalId: string): Promise<GatewaySession[]> {
        const identity = await this.identityStore.get(canonicalId);
        if (!identity) return [];

        const sessions: GatewaySession[] = [];

        for (const linked of identity.linkedIds) {
            const channelSessions = await this.sessionStore.list({
                channelType: linked.channelType,
                userId: linked.platformId,
            });
            sessions.push(...channelSessions);
        }

        return sessions;
    }

    /**
     * Get the unified session key for an identity
     * This allows the same session to be shared across channels
     */
    getUnifiedSessionKey(canonicalId: string): string {
        return `identity:${canonicalId}`;
    }

    // ============================================================================
    // Import/Export
    // ============================================================================

    /**
     * Import identities from config format (e.g., gateway config)
     */
    async importFromConfig(config: Record<string, string[]>): Promise<number> {
        let imported = 0;

        for (const [displayName, platformStrings] of Object.entries(config)) {
            const linkedIds = platformStrings.map(ps => {
                const [channelType, platformId] = ps.split(':');
                return { channelType: channelType as ChannelType, platformId };
            });

            const identity: IdentityLink = {
                canonicalId: `config:${displayName.toLowerCase().replace(/\s+/g, '-')}`,
                displayName,
                linkedIds,
            };

            await this.identityStore.create(identity);
            imported++;
        }

        return imported;
    }

    /**
     * Export identities to config format
     */
    async exportToConfig(): Promise<Record<string, string[]>> {
        const identities = await this.identityStore.list();
        const config: Record<string, string[]> = {};

        for (const identity of identities) {
            const key = identity.displayName ?? identity.canonicalId;
            config[key] = identity.linkedIds.map(l => `${l.channelType}:${l.platformId}`);
        }

        return config;
    }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createIdentityLinkingService(
    identityStore?: IdentityStore,
    sessionStore?: SessionStore
): IdentityLinkingService {
    const store = identityStore ?? new InMemoryIdentityStore();
    const sessions = sessionStore ?? {
        get: async () => null,
        set: async () => { },
        delete: async () => { },
        list: async () => [],
    };

    return new IdentityLinkingService(store, sessions);
}

export default IdentityLinkingService;
