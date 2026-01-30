/**
 * Feed Agent Specialist Implementation
 */

import type { AgentContext, ToolEnvelope } from '../types.js';
import type { GeoScope } from '@jagdagenten/types-jagd';
import { PrivacyGuardian } from '../privacy-guardian.js';

export class FeedAgent {
    private privacyGuardian = new PrivacyGuardian();

    async publishPost(
        postType: 'sighting' | 'story' | 'invite',
        content: Record<string, unknown>,
        geo: GeoScope,
        publishScope: 'private' | 'friends' | 'public',
        context: AgentContext
    ): Promise<ToolEnvelope<FeedPost>> {
        const startTime = Date.now();

        // Apply privacy guardrails
        const targetMode = publishScope === 'public' ? 'public' : publishScope === 'friends' ? 'team' : 'private';
        const blurredGeo = this.privacyGuardian.applyGeoBlur(geo, targetMode);
        const redactedContent = this.privacyGuardian.redactWeaponSerials(content);

        // Tier 2 actions require confirmation
        if (publishScope !== 'private') {
            const post: FeedPost = {
                id: `post-${Date.now()}`,
                postType,
                content: redactedContent,
                geo: blurredGeo,
                publishScope,
                timeDelay: publishScope === 'public' ? 48 : 0,
                status: 'pending_confirmation',
                createdBy: context.user.id,
                createdAt: new Date().toISOString(),
            };

            return {
                status: 'needs_user_confirm',
                result: post,
                confirmToken: `confirm-${Date.now()}`,
                preview: {
                    scope: publishScope,
                    geoMode: blurredGeo.mode,
                    timeDelay: post.timeDelay,
                    message: publishScope === 'public'
                        ? `Wird öffentlich mit ${post.timeDelay}h Verzögerung und grober Standortangabe veröffentlicht`
                        : 'Wird mit Freunden geteilt',
                },
                audit: {
                    toolName: 'feed.publish_post',
                    tier: 2,
                    invokedAt: new Date().toISOString(),
                    durationMs: Date.now() - startTime,
                    userId: context.user.id,
                    sessionId: context.session.id,
                    guardrailsApplied: ['geo_blur', 'weapon_redaction'],
                },
            };
        }

        // Private posts don't need confirmation
        const post: FeedPost = {
            id: `post-${Date.now()}`,
            postType,
            content: redactedContent,
            geo,
            publishScope,
            timeDelay: 0,
            status: 'published',
            createdBy: context.user.id,
            createdAt: new Date().toISOString(),
        };

        return {
            status: 'ok',
            result: post,
            audit: {
                toolName: 'feed.publish_post',
                tier: 1,
                invokedAt: new Date().toISOString(),
                durationMs: Date.now() - startTime,
                userId: context.user.id,
                sessionId: context.session.id,
            },
        };
    }
}

interface FeedPost {
    id: string;
    postType: string;
    content: Record<string, unknown>;
    geo: GeoScope;
    publishScope: string;
    timeDelay: number;
    status: string;
    createdBy: string;
    createdAt: string;
}

export default FeedAgent;
