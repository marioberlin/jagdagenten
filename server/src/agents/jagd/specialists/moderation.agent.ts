/**
 * Moderation Agent Specialist Implementation
 */

import type { AgentContext, ToolEnvelope } from '../types.js';
import type { GeoScope } from '@jagdagenten/types-jagd';

export class ModerationAgent {
    async checkPost(
        contentType: 'text' | 'photo' | 'event',
        contentId: string,
        text: string,
        photos: string[],
        geoData: GeoScope,
        context: AgentContext
    ): Promise<ToolEnvelope<ModerationResult>> {
        const startTime = Date.now();

        const flags: ModerationFlag[] = [];

        // Check for precise geo in public content
        if (geoData.mode === 'precise') {
            flags.push({
                code: 'PRECISE_GEO_PUBLIC',
                severity: 'warning',
                message: 'Präzise Standortdaten sollten nicht öffentlich geteilt werden',
                suggestion: 'Verwenden Sie grobe Standortangabe (coarse_grid)',
                autoFix: 'apply_geo_blur',
            });
        }

        // Check for protected species mentions
        const protectedSpecies = ['Wolf', 'Luchs', 'Wildkatze', 'Biber'];
        for (const species of protectedSpecies) {
            if (text.toLowerCase().includes(species.toLowerCase())) {
                flags.push({
                    code: 'PROTECTED_SPECIES_MENTION',
                    severity: 'info',
                    message: `Erwähnung einer geschützten Art: ${species}`,
                    suggestion: 'Bitte stellen Sie sicher, dass keine illegalen Aktivitäten dokumentiert werden',
                    autoFix: null,
                });
            }
        }

        // Check for weapon trade indicators
        const tradeKeywords = ['verkaufe', 'zu verkaufen', 'suche', 'tausche', 'biete an'];
        const weaponKeywords = ['büchse', 'flinte', 'waffe', 'munition', 'zielfernrohr'];
        const hasTradeKeyword = tradeKeywords.some(k => text.toLowerCase().includes(k));
        const hasWeaponKeyword = weaponKeywords.some(k => text.toLowerCase().includes(k));

        if (hasTradeKeyword && hasWeaponKeyword) {
            flags.push({
                code: 'WEAPON_TRADE_SUSPECTED',
                severity: 'block',
                message: 'Waffenhandel ist auf dieser Plattform nicht erlaubt',
                suggestion: 'Nutzen Sie lizenzierte Händler oder offizielle Kanäle',
                autoFix: null,
            });
        }

        const result: ModerationResult = {
            id: `mod-${Date.now()}`,
            contentId,
            contentType,
            flags,
            decision: flags.some(f => f.severity === 'block') ? 'reject' :
                flags.some(f => f.severity === 'warning') ? 'require_edit' : 'approve',
            appealable: true,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            checkedAt: new Date().toISOString(),
        };

        return {
            status: 'ok',
            result,
            audit: {
                toolName: 'moderation.check_post',
                tier: 0,
                invokedAt: new Date().toISOString(),
                durationMs: Date.now() - startTime,
                userId: context.user.id,
                sessionId: context.session.id,
            },
        };
    }
}

interface ModerationFlag {
    code: string;
    severity: 'info' | 'warning' | 'block';
    message: string;
    suggestion: string;
    autoFix: string | null;
}

interface ModerationResult {
    id: string;
    contentId: string;
    contentType: string;
    flags: ModerationFlag[];
    decision: 'approve' | 'require_edit' | 'reject';
    appealable: boolean;
    expiresAt: string;
    checkedAt: string;
}

export default ModerationAgent;
