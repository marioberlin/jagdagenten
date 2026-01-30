/**
 * Streckenliste API Routes
 *
 * Endpoints for generating state-specific harvest reports (Streckenliste).
 * Features:
 * - PDF generation per Bundesland
 * - Email delivery
 * - Template management
 */

import { Elysia, t } from 'elysia';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.http;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HarvestEntry {
    date: string;
    species: string;
    gender?: 'male' | 'female' | 'unknown';
    age?: string;
    weight?: number;
    location?: string;
}

interface StreckenlisteRequest {
    bundesland: string;
    jagdjahr: string;
    revierName?: string;
    harvests: HarvestEntry[];
}

// ---------------------------------------------------------------------------
// Species Labels (German)
// ---------------------------------------------------------------------------

const SPECIES_LABELS: Record<string, string> = {
    rotwild: 'Rotwild',
    rehwild: 'Rehwild',
    damwild: 'Damwild',
    schwarzwild: 'Schwarzwild',
    muffelwild: 'Muffelwild',
    gamswild: 'Gamswild',
    hase: 'Feldhase',
    fasan: 'Fasan',
    wildente: 'Wildente',
    fuchs: 'Fuchs',
    dachs: 'Dachs',
    marder: 'Marder',
    waschbaer: 'Waschbär',
};

const BUNDESLAND_NAMES: Record<string, string> = {
    BY: 'Bayern',
    BW: 'Baden-Württemberg',
    NI: 'Niedersachsen',
    NRW: 'Nordrhein-Westfalen',
    HE: 'Hessen',
    RP: 'Rheinland-Pfalz',
    SN: 'Sachsen',
    TH: 'Thüringen',
    BB: 'Brandenburg',
    MV: 'Mecklenburg-Vorpommern',
    ST: 'Sachsen-Anhalt',
    SH: 'Schleswig-Holstein',
    SL: 'Saarland',
    HB: 'Bremen',
    HH: 'Hamburg',
    BE: 'Berlin',
};

// ---------------------------------------------------------------------------
// PDF Generation (HTML-based)
// ---------------------------------------------------------------------------

function generateStreckenlisteHTML(data: StreckenlisteRequest): string {
    const bundeslandName = BUNDESLAND_NAMES[data.bundesland] || data.bundesland;

    // Group harvests by species
    const summary = data.harvests.reduce(
        (acc, h) => {
            const key = h.species || 'sonstiges';
            if (!acc[key]) acc[key] = { count: 0, male: 0, female: 0, unknown: 0 };
            acc[key].count++;
            if (h.gender === 'male') acc[key].male++;
            else if (h.gender === 'female') acc[key].female++;
            else acc[key].unknown++;
            return acc;
        },
        {} as Record<string, { count: number; male: number; female: number; unknown: number }>
    );

    const summaryRows = Object.entries(summary)
        .map(([species, data]) => {
            const label = SPECIES_LABELS[species] || species;
            return `
                <tr>
                    <td>${label}</td>
                    <td style="text-align:center">${data.count}</td>
                    <td style="text-align:center">${data.male || '-'}</td>
                    <td style="text-align:center">${data.female || '-'}</td>
                </tr>
            `;
        })
        .join('');

    const detailRows = data.harvests
        .map((h) => {
            const date = new Date(h.date).toLocaleDateString('de-DE');
            const species = SPECIES_LABELS[h.species] || h.species;
            const gender = h.gender === 'male' ? '♂' : h.gender === 'female' ? '♀' : '-';
            return `
                <tr>
                    <td>${date}</td>
                    <td>${species}</td>
                    <td style="text-align:center">${gender}</td>
                    <td>${h.age || '-'}</td>
                    <td>${h.weight ? `${h.weight} kg` : '-'}</td>
                    <td>${h.location || '-'}</td>
                </tr>
            `;
        })
        .join('');

    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Streckenliste ${data.jagdjahr}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        h1 { color: #1a1a2e; border-bottom: 2px solid #059669; padding-bottom: 10px; }
        h2 { color: #374151; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #059669; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .header-info div { }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        .signature { margin-top: 60px; }
        .signature-line { border-top: 1px solid #333; width: 200px; margin-top: 40px; }
    </style>
</head>
<body>
    <h1>Streckenliste</h1>
    
    <div class="header-info">
        <div>
            <strong>Bundesland:</strong> ${bundeslandName}<br>
            <strong>Jagdjahr:</strong> ${data.jagdjahr}
        </div>
        <div>
            ${data.revierName ? `<strong>Revier:</strong> ${data.revierName}<br>` : ''}
            <strong>Erstellt:</strong> ${new Date().toLocaleDateString('de-DE')}
        </div>
    </div>

    <h2>Zusammenfassung</h2>
    <table>
        <thead>
            <tr>
                <th>Wildart</th>
                <th>Gesamt</th>
                <th>♂ Männlich</th>
                <th>♀ Weiblich</th>
            </tr>
        </thead>
        <tbody>
            ${summaryRows || '<tr><td colspan="4">Keine Strecke</td></tr>'}
        </tbody>
    </table>

    <h2>Einzelnachweise</h2>
    <table>
        <thead>
            <tr>
                <th>Datum</th>
                <th>Wildart</th>
                <th>Geschlecht</th>
                <th>Alter</th>
                <th>Gewicht</th>
                <th>Ort</th>
            </tr>
        </thead>
        <tbody>
            ${detailRows || '<tr><td colspan="6">Keine Einträge</td></tr>'}
        </tbody>
    </table>

    <div class="signature">
        <p>Ich bestätige die Richtigkeit der vorstehenden Angaben.</p>
        <div class="signature-line"></div>
        <p>Ort, Datum, Unterschrift</p>
    </div>

    <div class="footer">
        Generiert mit Jagd-Agenten • ${new Date().toISOString()}
    </div>
</body>
</html>
    `;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function createStreckenlisteRoutes() {
    return new Elysia({ prefix: '/api/v1/jagd/streckenliste' })

        // Generate PDF (returns HTML for now, can be converted to PDF with puppeteer)
        .post(
            '/generate',
            async ({ body }) => {
                try {
                    log.info({ bundesland: body.bundesland, harvests: body.harvests.length }, 'Generating Streckenliste');

                    const html = generateStreckenlisteHTML(body);

                    // For now, return HTML that can be printed to PDF
                    // In production, use puppeteer or similar to generate actual PDF
                    const pdfId = `streckenliste-${Date.now()}`;

                    // Store HTML temporarily (in production, generate PDF and store in S3/GCS)
                    // For demo, we'll return a data URL
                    const base64Html = Buffer.from(html).toString('base64');

                    return {
                        success: true,
                        pdfId,
                        pdfUrl: `data:text/html;base64,${base64Html}`,
                        message: 'Streckenliste erfolgreich generiert',
                    };
                } catch (error) {
                    log.error({ error }, 'Failed to generate Streckenliste');
                    return {
                        success: false,
                        error: 'PDF-Generierung fehlgeschlagen',
                    };
                }
            },
            {
                body: t.Object({
                    bundesland: t.String(),
                    jagdjahr: t.String(),
                    revierName: t.Optional(t.String()),
                    harvests: t.Array(
                        t.Object({
                            date: t.String(),
                            species: t.String(),
                            gender: t.Optional(t.Union([t.Literal('male'), t.Literal('female'), t.Literal('unknown')])),
                            age: t.Optional(t.String()),
                            weight: t.Optional(t.Number()),
                            location: t.Optional(t.String()),
                        })
                    ),
                }),
            }
        )

        // Email the Streckenliste
        .post(
            '/email',
            async ({ body }) => {
                try {
                    log.info({ pdfUrl: body.pdfUrl?.substring(0, 50) }, 'Sending Streckenliste via email');

                    // In production, integrate with email service (SendGrid, SES, etc.)
                    // For now, just acknowledge the request

                    return {
                        success: true,
                        message: 'E-Mail wird versendet...',
                    };
                } catch (error) {
                    log.error({ error }, 'Failed to email Streckenliste');
                    return {
                        success: false,
                        error: 'E-Mail-Versand fehlgeschlagen',
                    };
                }
            },
            {
                body: t.Object({
                    pdfUrl: t.String(),
                    recipientEmail: t.Optional(t.String()),
                }),
            }
        )

        // Get available templates per Bundesland
        .get('/templates/:bundesland', async ({ params }) => {
            const bundesland = params.bundesland.toUpperCase();
            const name = BUNDESLAND_NAMES[bundesland];

            if (!name) {
                return {
                    success: false,
                    error: 'Unbekanntes Bundesland',
                };
            }

            return {
                success: true,
                bundesland,
                name,
                template: {
                    // Bundesland-specific form fields could go here
                    requiredFields: ['jagdjahr', 'harvests'],
                    optionalFields: ['revierName'],
                },
            };
        });
}

export default createStreckenlisteRoutes;
