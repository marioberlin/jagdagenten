/**
 * Bureaucracy Agent Specialist Implementation
 *
 * Handles Streckenliste exports, permits, and document generation.
 */

import type { AgentContext, ToolEnvelope } from '../types.js';

// ============================================================================
// Bureaucracy Agent
// ============================================================================

export class BureaucracyAgent {
    /**
     * Generate export pack for a region/authority.
     */
    async generateExportPack(
        region: string,
        period: string,
        sessionIds: string[],
        context: AgentContext
    ): Promise<ToolEnvelope<ExportPack>> {
        const startTime = Date.now();

        // Mock export pack
        const pack: ExportPack = {
            id: `export-${Date.now()}`,
            region,
            period,
            generatedAt: new Date().toISOString(),
            files: [
                { name: `Streckenliste_${region}_${period}.pdf`, type: 'application/pdf', size: 125430 },
                { name: `Streckenliste_${region}_${period}.csv`, type: 'text/csv', size: 4521 },
            ],
            summary: {
                totalHarvests: 12,
                speciesBreakdown: [
                    { species: 'Rehwild', count: 8 },
                    { species: 'Schwarzwild', count: 3 },
                    { species: 'Fuchs', count: 1 },
                ],
                missingFields: [],
            },
            portalHelper: {
                authority: this.getAuthorityForRegion(region),
                portalUrl: this.getPortalUrlForRegion(region),
                instructions: [
                    'PDF für Offline-Archiv speichern',
                    'CSV für Portal-Upload verwenden',
                    'Abschusszahlen vor Einreichung bestätigen',
                ],
            },
        };

        return {
            status: 'ok',
            result: pack,
            audit: {
                toolName: 'bureaucracy.generate_export_pack',
                tier: 1,
                invokedAt: new Date().toISOString(),
                durationMs: Date.now() - startTime,
                userId: context.user.id,
                sessionId: context.session.id,
            },
        };
    }

    /**
     * Create guest permit PDF.
     */
    async createGuestPermitPdf(
        guestName: string,
        validFrom: string,
        validTo: string,
        revierName: string,
        conditions: string,
        context: AgentContext
    ): Promise<ToolEnvelope<GuestPermit>> {
        const startTime = Date.now();

        const permit: GuestPermit = {
            id: `permit-${Date.now()}`,
            guestName,
            validFrom,
            validTo,
            revierName,
            conditions,
            issuedBy: context.user.displayName || 'Jagdpächter',
            issuedAt: new Date().toISOString(),
            pdfUrl: `/api/v1/jagd/permits/permit-${Date.now()}.pdf`,
            qrCode: `jagd://permit/${Date.now()}`,
        };

        return {
            status: 'ok',
            result: permit,
            audit: {
                toolName: 'bureaucracy.create_guest_permit_pdf',
                tier: 1,
                invokedAt: new Date().toISOString(),
                durationMs: Date.now() - startTime,
                userId: context.user.id,
                sessionId: context.session.id,
            },
        };
    }

    private getAuthorityForRegion(region: string): string {
        const authorities: Record<string, string> = {
            'DE-BY': 'Bayerisches Staatsministerium für Ernährung, Landwirtschaft und Forsten',
            'DE-NI': 'Niedersächsisches Ministerium für Ernährung, Landwirtschaft und Verbraucherschutz',
            'DE-NW': 'Ministerium für Umwelt, Landwirtschaft, Natur- und Verbraucherschutz NRW',
            'AT-W': 'Magistrat der Stadt Wien',
            'CH-ZH': 'Fischerei- und Jagdverwaltung Kanton Zürich',
        };
        return authorities[region] || 'Zuständige Jagdbehörde';
    }

    private getPortalUrlForRegion(region: string): string {
        const portals: Record<string, string> = {
            'DE-BY': 'https://wildtierportal.bayern.de',
            'DE-NI': 'https://jagd.niedersachsen.de',
        };
        return portals[region] || '';
    }
}

// ============================================================================
// Types
// ============================================================================

interface ExportPack {
    id: string;
    region: string;
    period: string;
    generatedAt: string;
    files: { name: string; type: string; size: number }[];
    summary: {
        totalHarvests: number;
        speciesBreakdown: { species: string; count: number }[];
        missingFields: string[];
    };
    portalHelper: {
        authority: string;
        portalUrl: string;
        instructions: string[];
    };
}

interface GuestPermit {
    id: string;
    guestName: string;
    validFrom: string;
    validTo: string;
    revierName: string;
    conditions: string;
    issuedBy: string;
    issuedAt: string;
    pdfUrl: string;
    qrCode: string;
}

export default BureaucracyAgent;
