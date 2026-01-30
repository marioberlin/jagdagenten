/**
 * Trail Camera API Routes
 *
 * Endpoints for trail camera management and photo integration.
 * Features:
 * - Camera registration
 * - Photo management
 * - Webhook for SPYPOINT and other camera APIs
 */

import { Elysia, t } from 'elysia';
import { randomUUID } from 'crypto';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.http;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrailCamera {
    id: string;
    name: string;
    lat: number;
    lon: number;
    brand?: string;
    model?: string;
    lastActive?: string;
    batteryLevel?: number;
    photoCount: number;
    createdAt: string;
}

interface TrailPhoto {
    id: string;
    cameraId: string;
    cameraName: string;
    imageUrl: string;
    thumbnailUrl?: string;
    timestamp: string;
    temperature?: number;
    moonPhase?: string;
    speciesDetected?: string[];
    viewed: boolean;
    createdAt: string;
}

// ---------------------------------------------------------------------------
// In-Memory Store (use PostgreSQL in production)
// ---------------------------------------------------------------------------

const cameraStore = new Map<string, TrailCamera>();
const photoStore = new Map<string, TrailPhoto>();

// Seed demo data
function seedDemoData() {
    const demoCamera: TrailCamera = {
        id: 'cam-demo-1',
        name: 'Eiche Nord',
        lat: 51.234,
        lon: 10.456,
        brand: 'SPYPOINT',
        model: 'FLEX',
        lastActive: new Date().toISOString(),
        batteryLevel: 85,
        photoCount: 0,
        createdAt: new Date().toISOString(),
    };
    cameraStore.set(demoCamera.id, demoCamera);
}
seedDemoData();

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function createTrailCamRoutes() {
    return new Elysia({ prefix: '/api/v1/jagd/trailcam' })

        // List all cameras
        .get('/cameras', async () => {
            const cameras = Array.from(cameraStore.values())
                .map((cam) => ({
                    ...cam,
                    photoCount: Array.from(photoStore.values()).filter((p) => p.cameraId === cam.id).length,
                }))
                .sort((a, b) => new Date(b.lastActive || b.createdAt).getTime() - new Date(a.lastActive || a.createdAt).getTime());

            return {
                success: true,
                cameras,
                count: cameras.length,
            };
        })

        // Register new camera
        .post(
            '/cameras',
            async ({ body }) => {
                const id = randomUUID();
                const now = new Date().toISOString();

                const camera: TrailCamera = {
                    id,
                    name: body.name,
                    lat: body.lat,
                    lon: body.lon,
                    brand: body.brand,
                    model: body.model,
                    lastActive: now,
                    batteryLevel: 100,
                    photoCount: 0,
                    createdAt: now,
                };

                cameraStore.set(id, camera);
                log.info({ cameraId: id, name: body.name }, 'Registered trail camera');

                return {
                    success: true,
                    camera,
                };
            },
            {
                body: t.Object({
                    name: t.String(),
                    lat: t.Number(),
                    lon: t.Number(),
                    brand: t.Optional(t.String()),
                    model: t.Optional(t.String()),
                }),
            }
        )

        // Delete camera
        .delete('/cameras/:id', async ({ params, set }) => {
            if (!cameraStore.has(params.id)) {
                set.status = 404;
                return { error: 'Kamera nicht gefunden' };
            }

            cameraStore.delete(params.id);

            // Also delete all photos from this camera
            for (const [photoId, photo] of photoStore) {
                if (photo.cameraId === params.id) {
                    photoStore.delete(photoId);
                }
            }

            return { success: true };
        })

        // Get photos (paginated)
        .get('/photos', async ({ query }) => {
            const limit = parseInt(query.limit || '50');
            const offset = parseInt(query.offset || '0');
            const cameraId = query.cameraId;

            let photos = Array.from(photoStore.values())
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            if (cameraId) {
                photos = photos.filter((p) => p.cameraId === cameraId);
            }

            const total = photos.length;
            photos = photos.slice(offset, offset + limit);

            return {
                success: true,
                photos,
                total,
                limit,
                offset,
            };
        })

        // Upload photo manually
        .post(
            '/photos',
            async ({ body }) => {
                const camera = cameraStore.get(body.cameraId);
                if (!camera) {
                    return { success: false, error: 'Kamera nicht gefunden' };
                }

                const id = randomUUID();
                const now = new Date().toISOString();

                const photo: TrailPhoto = {
                    id,
                    cameraId: body.cameraId,
                    cameraName: camera.name,
                    imageUrl: body.imageUrl,
                    thumbnailUrl: body.thumbnailUrl,
                    timestamp: body.timestamp || now,
                    temperature: body.temperature,
                    speciesDetected: body.speciesDetected,
                    viewed: false,
                    createdAt: now,
                };

                photoStore.set(id, photo);

                // Update camera last active
                camera.lastActive = now;
                cameraStore.set(body.cameraId, camera);

                log.info({ photoId: id, cameraId: body.cameraId }, 'Added trail camera photo');

                return {
                    success: true,
                    photo,
                };
            },
            {
                body: t.Object({
                    cameraId: t.String(),
                    imageUrl: t.String(),
                    thumbnailUrl: t.Optional(t.String()),
                    timestamp: t.Optional(t.String()),
                    temperature: t.Optional(t.Number()),
                    speciesDetected: t.Optional(t.Array(t.String())),
                }),
            }
        )

        // Mark photo as viewed
        .post('/photos/:id/view', async ({ params, set }) => {
            const photo = photoStore.get(params.id);
            if (!photo) {
                set.status = 404;
                return { error: 'Foto nicht gefunden' };
            }

            photo.viewed = true;
            photoStore.set(params.id, photo);

            return { success: true };
        })

        // Delete photo
        .delete('/photos/:id', async ({ params, set }) => {
            if (!photoStore.has(params.id)) {
                set.status = 404;
                return { error: 'Foto nicht gefunden' };
            }

            photoStore.delete(params.id);
            return { success: true };
        })

        // Webhook for SPYPOINT cameras
        .post(
            '/webhook',
            async ({ body, set }) => {
                // SPYPOINT sends: camera serial, image URL, timestamp, temperature
                log.info({ webhook: 'spypoint', body }, 'Received trail camera webhook');

                // Find camera by serial/external ID (would need to store this mapping)
                const cameraSerial = body.camera_serial || body.deviceId;
                let camera: TrailCamera | undefined;

                for (const cam of cameraStore.values()) {
                    // In production, match by external serial number
                    if (cam.name.includes(cameraSerial)) {
                        camera = cam;
                        break;
                    }
                }

                if (!camera) {
                    log.warn({ serial: cameraSerial }, 'Unknown camera in webhook');
                    set.status = 404;
                    return { success: false, error: 'Camera not registered' };
                }

                const id = randomUUID();
                const now = new Date().toISOString();

                const photo: TrailPhoto = {
                    id,
                    cameraId: camera.id,
                    cameraName: camera.name,
                    imageUrl: body.image_url || body.imageUrl,
                    thumbnailUrl: body.thumbnail_url,
                    timestamp: body.timestamp || now,
                    temperature: body.temperature,
                    moonPhase: body.moon_phase,
                    speciesDetected: body.species || body.detected_species,
                    viewed: false,
                    createdAt: now,
                };

                photoStore.set(id, photo);
                camera.lastActive = now;
                if (body.battery_level) {
                    camera.batteryLevel = body.battery_level;
                }
                cameraStore.set(camera.id, camera);

                log.info({ photoId: id, cameraId: camera.id }, 'Processed webhook photo');

                return { success: true, photoId: id };
            },
            {
                body: t.Object({
                    camera_serial: t.Optional(t.String()),
                    deviceId: t.Optional(t.String()),
                    image_url: t.Optional(t.String()),
                    imageUrl: t.Optional(t.String()),
                    thumbnail_url: t.Optional(t.String()),
                    timestamp: t.Optional(t.String()),
                    temperature: t.Optional(t.Number()),
                    battery_level: t.Optional(t.Number()),
                    moon_phase: t.Optional(t.String()),
                    species: t.Optional(t.Array(t.String())),
                    detected_species: t.Optional(t.Array(t.String())),
                }),
            }
        );
}

export default createTrailCamRoutes;
