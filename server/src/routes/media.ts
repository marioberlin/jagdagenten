/**
 * Media Routes
 * 
 * API endpoints for checking and triggering background media generation.
 * Features:
 * - Multi-layer lookup (Redis -> PostgreSQL -> Filesystem)
 * - Background job status tracking
 * - Generation triggering with async mode
 */
import { Elysia, t } from 'elysia';
import * as fs from 'fs/promises';
import * as path from 'path';

import {
    getCacheKey,
    type WeatherCondition,
    mediaStorage
} from '../agents/media-common/index.js';
import { handleImageGenRequest } from '../agents/media-imagegen.js';
import { handleVideoGenRequest } from '../agents/media-videogen.js';

const IMAGE_DIR = 'public/images/backgrounds';
const VIDEO_DIR = 'public/videos/backgrounds';

// Initialize storage when routes are loaded
let initialized = false;
async function ensureInitialized(): Promise<void> {
    if (!initialized) {
        await mediaStorage.initialize();
        initialized = true;
    }
}

interface MediaStatus {
    exists: boolean;
    type: 'image' | 'video';
    cacheKey: string;
    url?: string;
    path?: string;
    status?: string;
    source?: 'storage' | 'filesystem';
}

async function checkImageStatus(cacheKey: string): Promise<MediaStatus> {
    await ensureInitialized();

    // Check storage first
    const stored = await mediaStorage.get(cacheKey);
    if (stored && stored.type === 'image' && stored.status === 'complete') {
        return {
            exists: true,
            type: 'image',
            cacheKey,
            url: stored.publicUrl,
            path: stored.filePath,
            status: stored.status,
            source: 'storage'
        };
    }

    // Fallback to filesystem
    const filePath = path.join(IMAGE_DIR, `${cacheKey}.png`);
    try {
        await fs.access(filePath);
        return {
            exists: true,
            type: 'image',
            cacheKey,
            url: `/images/backgrounds/${cacheKey}.png`,
            path: filePath,
            source: 'filesystem'
        };
    } catch {
        return {
            exists: false,
            type: 'image',
            cacheKey,
            status: stored?.status
        };
    }
}

async function checkVideoStatus(cacheKey: string): Promise<MediaStatus> {
    await ensureInitialized();

    // Check storage first
    const stored = await mediaStorage.get(cacheKey);
    if (stored && stored.type === 'video') {
        if (stored.status === 'complete') {
            return {
                exists: true,
                type: 'video',
                cacheKey,
                url: stored.publicUrl,
                path: stored.filePath,
                status: stored.status,
                source: 'storage'
            };
        }
        // Return pending/generating status
        return {
            exists: false,
            type: 'video',
            cacheKey,
            status: stored.status,
            source: 'storage'
        };
    }

    // Fallback to filesystem
    const filePath = path.join(VIDEO_DIR, `${cacheKey}.mp4`);
    try {
        await fs.access(filePath);
        return {
            exists: true,
            type: 'video',
            cacheKey,
            url: `/videos/backgrounds/${cacheKey}.mp4`,
            path: filePath,
            source: 'filesystem'
        };
    } catch {
        return { exists: false, type: 'video', cacheKey };
    }
}

export const mediaRoutes = new Elysia({ prefix: '/api/media' })
    // Get storage status
    .get('/status', async () => {
        await ensureInitialized();
        return mediaStorage.getStatus();
    })

    // Check image status
    .get('/image/:destination/:condition', async ({ params }) => {
        const cacheKey = getCacheKey(params.destination, params.condition as WeatherCondition);
        return checkImageStatus(cacheKey);
    }, {
        params: t.Object({
            destination: t.String(),
            condition: t.String()
        })
    })

    // Check video status
    .get('/video/:destination/:condition', async ({ params }) => {
        const cacheKey = getCacheKey(params.destination, params.condition as WeatherCondition);
        return checkVideoStatus(cacheKey);
    }, {
        params: t.Object({
            destination: t.String(),
            condition: t.String()
        })
    })

    // Get background URL (video preferred, falls back to image)
    .get('/background/:destination/:condition', async ({ params }) => {
        await ensureInitialized();
        const cacheKey = getCacheKey(params.destination, params.condition as WeatherCondition);

        // Check video first (from storage or filesystem)
        const videoStatus = await checkVideoStatus(cacheKey);
        if (videoStatus.exists && videoStatus.url) {
            return {
                type: 'video',
                url: videoStatus.url,
                cacheKey,
                status: videoStatus.status,
                source: videoStatus.source
            };
        }

        // If video is generating, return that status
        if (videoStatus.status === 'generating' || videoStatus.status === 'pending') {
            return {
                type: 'pending',
                url: null,
                cacheKey,
                status: videoStatus.status,
                message: 'Video generation in progress'
            };
        }

        // Fall back to image
        const imageStatus = await checkImageStatus(cacheKey);
        if (imageStatus.exists && imageStatus.url) {
            return {
                type: 'image',
                url: imageStatus.url,
                cacheKey,
                status: imageStatus.status,
                source: imageStatus.source
            };
        }

        // Nothing exists
        return {
            type: 'none',
            url: null,
            cacheKey
        };
    }, {
        params: t.Object({
            destination: t.String(),
            condition: t.String()
        })
    })

    // Get job status
    .get('/job/:jobId', async ({ params }) => {
        await ensureInitialized();
        const job = await mediaStorage.getJobStatus(params.jobId);
        if (!job) {
            return { error: 'Job not found', jobId: params.jobId };
        }
        return job;
    }, {
        params: t.Object({
            jobId: t.String()
        })
    })

    // Trigger image generation
    .post('/generate/image', async ({ body }) => {
        const { destination, condition, force } = body as {
            destination: string;
            condition: WeatherCondition;
            force?: boolean;
        };

        try {
            const result = await handleImageGenRequest({
                message: {
                    parts: [{
                        text: JSON.stringify({
                            destination,
                            condition,
                            forceRegenerate: force || false
                        })
                    }]
                }
            });

            const artifact = result.artifacts?.[0];
            const data = artifact?.parts?.find((p: any) => p.type === 'data')?.data;

            return {
                success: data?.status === 'complete' || data?.status === 'cached',
                status: data?.status,
                url: data?.publicUrl,
                cacheKey: data?.cacheKey
            };
        } catch (error) {
            return {
                success: false,
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }, {
        body: t.Object({
            destination: t.String(),
            condition: t.String(),
            force: t.Optional(t.Boolean())
        })
    })

    // Trigger video generation
    .post('/generate/video', async ({ body }) => {
        const { destination, condition, force, async: asyncMode } = body as {
            destination: string;
            condition: WeatherCondition;
            force?: boolean;
            async?: boolean;
        };

        try {
            const result = await handleVideoGenRequest({
                message: {
                    parts: [{
                        text: JSON.stringify({
                            destination,
                            condition,
                            forceRegenerate: force || false,
                            async: asyncMode ?? true  // Default to async
                        })
                    }]
                }
            });

            const artifact = result.artifacts?.[0];
            const data = artifact?.parts?.find((p: any) => p.type === 'data')?.data;

            return {
                success: data?.status === 'complete' || data?.status === 'cached' || data?.status === 'queued',
                status: data?.status,
                url: data?.publicUrl,
                cacheKey: data?.cacheKey,
                jobId: data?.jobId
            };
        } catch (error) {
            return {
                success: false,
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }, {
        body: t.Object({
            destination: t.String(),
            condition: t.String(),
            force: t.Optional(t.Boolean()),
            async: t.Optional(t.Boolean())
        })
    })

    // Trigger full pipeline (image + video)
    .post('/generate/pipeline', async ({ body }) => {
        const { destination, condition, force = false } = body as {
            destination: string;
            condition: WeatherCondition;
            force?: boolean;
        };

        const cacheKey = getCacheKey(destination, condition);
        const results: { image?: any; video?: any } = {};

        try {
            // Step 1: Generate image
            const imageResult = await handleImageGenRequest({
                message: {
                    parts: [{
                        text: JSON.stringify({ destination, condition, forceRegenerate: force })
                    }]
                }
            });

            const imageData = imageResult.artifacts?.[0]?.parts?.find((p: any) => p.type === 'data')?.data;
            results.image = {
                success: imageData?.status === 'complete' || imageData?.status === 'cached',
                status: imageData?.status,
                url: imageData?.publicUrl
            };

            if (!results.image.success) {
                return {
                    success: false,
                    status: 'image_failed',
                    cacheKey,
                    results
                };
            }

            // Step 2: Queue video generation
            const videoResult = await handleVideoGenRequest({
                message: {
                    parts: [{
                        text: JSON.stringify({ destination, condition, forceRegenerate: force, async: true })
                    }]
                }
            });

            const videoData = videoResult.artifacts?.[0]?.parts?.find((p: any) => p.type === 'data')?.data;
            results.video = {
                success: videoData?.status === 'complete' || videoData?.status === 'cached' || videoData?.status === 'queued',
                status: videoData?.status,
                url: videoData?.publicUrl,
                jobId: videoData?.jobId
            };

            return {
                success: true,
                status: results.video.status,
                cacheKey,
                results
            };

        } catch (error) {
            return {
                success: false,
                status: 'error',
                cacheKey,
                error: error instanceof Error ? error.message : 'Unknown error',
                results
            };
        }
    }, {
        body: t.Object({
            destination: t.String(),
            condition: t.String(),
            force: t.Optional(t.Boolean())
        })
    })

    // List all generated backgrounds
    .get('/list', async () => {
        await ensureInitialized();

        // Get from storage if available
        const storageArtifacts = await mediaStorage.list({ limit: 200 });

        // Also scan filesystem
        const fsImages: string[] = [];
        const fsVideos: string[] = [];

        try {
            const imageFiles = await fs.readdir(IMAGE_DIR);
            for (const file of imageFiles) {
                if (file.endsWith('.png')) {
                    fsImages.push(file.replace('.png', ''));
                }
            }
        } catch {
            // Directory doesn't exist yet
        }

        try {
            const videoFiles = await fs.readdir(VIDEO_DIR);
            for (const file of videoFiles) {
                if (file.endsWith('.mp4')) {
                    fsVideos.push(file.replace('.mp4', ''));
                }
            }
        } catch {
            // Directory doesn't exist yet
        }

        // Merge storage and filesystem data
        const images = storageArtifacts
            .filter(a => a.type === 'image' && a.status === 'complete')
            .map(a => a.cacheKey);
        const videos = storageArtifacts
            .filter(a => a.type === 'video' && a.status === 'complete')
            .map(a => a.cacheKey);

        // Add filesystem items not in storage
        for (const img of fsImages) {
            if (!images.includes(img)) images.push(img);
        }
        for (const vid of fsVideos) {
            if (!videos.includes(vid)) videos.push(vid);
        }

        // Get pending jobs
        const pending = storageArtifacts
            .filter(a => a.status === 'pending' || a.status === 'generating')
            .map(a => ({ cacheKey: a.cacheKey, type: a.type, status: a.status }));

        return {
            images,
            videos,
            pending,
            summary: {
                imageCount: images.length,
                videoCount: videos.length,
                pendingCount: pending.length
            },
            storage: mediaStorage.getStatus()
        };
    });
