/**
 * Venison API Routes
 *
 * Endpoints for venison tracking and food safety QR codes.
 * Features:
 * - Create venison records from harvests
 * - Generate printable labels
 * - Track cooling chain events
 */

import { Elysia, t } from 'elysia';
import { randomUUID } from 'crypto';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.http;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CoolingEvent {
    id: string;
    timestamp: string;
    type: 'harvest' | 'transport' | 'storage' | 'butcher' | 'sale';
    temperature?: number;
    location?: string;
    notes?: string;
}

interface VenisonRecord {
    id: string;
    harvestId: string;
    harvestDate: string;
    species: string;
    weight?: number;
    location?: string;
    revierName?: string;
    hunterName?: string;
    coolingChain: CoolingEvent[];
    createdAt: string;
    // Trichina sample tracking (EU Regulation 2015/1375)
    trichinaSample?: {
        required: boolean;        // Required for Schwarzwild, Dachs, etc.
        sampleTaken: boolean;
        sampleDate?: string;
        labName?: string;
        labSampleId?: string;
        result?: 'pending' | 'negative' | 'positive';
        resultDate?: string;
        certificateUrl?: string;
    };
}

// ---------------------------------------------------------------------------
// In-Memory Store (use PostgreSQL in production)
// ---------------------------------------------------------------------------

const venisonStore = new Map<string, VenisonRecord>();

// ---------------------------------------------------------------------------
// Label Generation
// ---------------------------------------------------------------------------

function generateLabelHTML(venison: VenisonRecord): string {
    const speciesLabels: Record<string, string> = {
        rotwild: 'Rotwild',
        rehwild: 'Rehwild',
        damwild: 'Damwild',
        schwarzwild: 'Schwarzwild',
    };

    const qrUrl = `${process.env.BASE_URL || 'https://jagd-agenten.app'}/venison/${venison.id}`;

    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Wildbret-Etikett ${venison.id.substring(0, 8)}</title>
    <style>
        @page { size: 80mm 50mm; margin: 0; }
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 8px;
            width: 80mm;
            height: 50mm;
            box-sizing: border-box;
        }
        .label {
            border: 1px solid #333;
            padding: 6px;
            height: 100%;
            box-sizing: border-box;
            display: flex;
            gap: 8px;
        }
        .qr {
            width: 35mm;
            height: 35mm;
            border: 1px solid #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            color: #666;
        }
        .info {
            flex: 1;
            font-size: 9px;
            line-height: 1.4;
        }
        .info h1 {
            font-size: 12px;
            margin: 0 0 4px 0;
            border-bottom: 1px solid #333;
            padding-bottom: 2px;
        }
        .info .row {
            display: flex;
            gap: 4px;
        }
        .info .label-text {
            font-weight: bold;
            width: 50px;
        }
        .footer {
            margin-top: auto;
            font-size: 7px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="label">
        <div class="qr">
            [QR CODE]<br>
            ${venison.id.substring(0, 8)}
        </div>
        <div class="info">
            <h1>WILDBRET</h1>
            <div class="row">
                <span class="label-text">Art:</span>
                <span>${speciesLabels[venison.species] || venison.species}</span>
            </div>
            <div class="row">
                <span class="label-text">Datum:</span>
                <span>${new Date(venison.harvestDate).toLocaleDateString('de-DE')}</span>
            </div>
            ${venison.weight ? `
            <div class="row">
                <span class="label-text">Gewicht:</span>
                <span>${venison.weight} kg</span>
            </div>
            ` : ''}
            ${venison.revierName ? `
            <div class="row">
                <span class="label-text">Revier:</span>
                <span>${venison.revierName}</span>
            </div>
            ` : ''}
            <div class="footer">
                Rückverfolgbar: ${qrUrl}
            </div>
        </div>
    </div>
</body>
</html>
    `;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function createVenisonRoutes() {
    return new Elysia({ prefix: '/api/v1/jagd/venison' })

        // Create venison record
        .post(
            '/create',
            async ({ body }) => {
                const id = randomUUID();
                const now = new Date().toISOString();

                const venison: VenisonRecord = {
                    id,
                    harvestId: body.harvestId,
                    harvestDate: body.harvestDate,
                    species: body.species,
                    weight: body.weight,
                    location: body.location,
                    revierName: body.revierName,
                    hunterName: body.hunterName,
                    coolingChain: [
                        {
                            id: randomUUID(),
                            timestamp: now,
                            type: 'harvest',
                            notes: 'Erlegung',
                        },
                    ],
                    createdAt: now,
                };

                venisonStore.set(id, venison);
                log.info({ venisonId: id, species: body.species }, 'Created venison record');

                return {
                    success: true,
                    venison,
                };
            },
            {
                body: t.Object({
                    harvestId: t.String(),
                    harvestDate: t.String(),
                    species: t.String(),
                    weight: t.Optional(t.Number()),
                    location: t.Optional(t.String()),
                    revierName: t.Optional(t.String()),
                    hunterName: t.Optional(t.String()),
                }),
            }
        )

        // Get venison record (QR code destination)
        .get('/:id', async ({ params, set }) => {
            const venison = venisonStore.get(params.id);

            if (!venison) {
                set.status = 404;
                return { error: 'Wildbret-Eintrag nicht gefunden' };
            }

            return {
                success: true,
                venison,
            };
        })

        // Get printable label
        .get('/:id/label', async ({ params, set }) => {
            const venison = venisonStore.get(params.id);

            if (!venison) {
                set.status = 404;
                return { error: 'Wildbret-Eintrag nicht gefunden' };
            }

            const html = generateLabelHTML(venison);
            set.headers['Content-Type'] = 'text/html';
            return html;
        })

        // Add cooling chain event
        .patch(
            '/:id/chain',
            async ({ params, body, set }) => {
                const venison = venisonStore.get(params.id);

                if (!venison) {
                    set.status = 404;
                    return { error: 'Wildbret-Eintrag nicht gefunden' };
                }

                const event: CoolingEvent = {
                    id: randomUUID(),
                    timestamp: new Date().toISOString(),
                    type: body.type,
                    temperature: body.temperature,
                    location: body.location,
                    notes: body.notes,
                };

                venison.coolingChain.push(event);
                venisonStore.set(params.id, venison);

                log.info({ venisonId: params.id, eventType: body.type }, 'Added cooling chain event');

                return {
                    success: true,
                    venison,
                };
            },
            {
                body: t.Object({
                    type: t.Union([
                        t.Literal('harvest'),
                        t.Literal('transport'),
                        t.Literal('storage'),
                        t.Literal('butcher'),
                        t.Literal('sale'),
                    ]),
                    temperature: t.Optional(t.Number()),
                    location: t.Optional(t.String()),
                    notes: t.Optional(t.String()),
                }),
            }
        )

        // List all venison records for a user
        .get('/list', async () => {
            const records = Array.from(venisonStore.values())
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            return {
                success: true,
                records,
                count: records.length,
            };
        });
}

export default createVenisonRoutes;
