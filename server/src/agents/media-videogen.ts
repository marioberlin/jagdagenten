/**
 * Media VideoGen Agent
 * 
 * A2A agent that animates images into video loops using Veo 3.1 Fast.
 * Features:
 * - PostgreSQL artifact storage for persistence
 * - Redis caching for fast lookups
 * - Background job queue for async video generation
 * - Filesystem storage for actual video files
 */
import type { AgentCard, SendMessageParams } from '../a2a/types.js';
import { randomUUID } from 'crypto';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs/promises';
import * as path from 'path';

import {
    type WeatherCondition,
    type VideoArtifactMetadata,
    getCacheKey,
    generateMotionPrompt,
    generateNegativePrompt,
    getDestination
} from './media-common/index.js';
import { mediaStorage, type MediaArtifact, type JobInfo } from './media-common/storage.js';

// ============================================================================
// Configuration
// ============================================================================

const MODEL_NAME = 'veo-3.1-fast-generate-preview';
const IMAGE_DIR = 'public/images/backgrounds';
const OUTPUT_DIR = 'public/videos/backgrounds';
const POLL_INTERVAL_MS = 10000; // 10 seconds
const MAX_POLL_ATTEMPTS = 36; // 6 minutes max

// Initialize storage and register job handler
let storageInitialized = false;
async function ensureStorageInitialized(): Promise<void> {
    if (!storageInitialized) {
        await mediaStorage.initialize();

        // Register video generation job handler
        mediaStorage.registerHandler('video', async (job: JobInfo) => {
            await processVideoGeneration(job.destination, job.condition);
        });

        storageInitialized = true;
    }
}

// Initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn('[VideoGen] GEMINI_API_KEY not set');
        return null;
    }
    return new GoogleGenAI({ apiKey });
}

// ============================================================================
// Agent Card
// ============================================================================

export function getVideoGenAgentCard(baseUrl: string): AgentCard {
    return {
        name: 'Media VideoGen',
        description: 'Animates background images into seamless 8-second video loops using Veo 3.1 Fast. Creates atmospheric video backgrounds with ambient audio.',
        url: `${baseUrl}/agents/media-videogen`,
        provider: { name: 'LiquidCrypto', url: 'https://liquidcrypto.app' },
        version: '1.1.0',
        protocolVersion: '1.0',
        capabilities: {
            streaming: false,
            pushNotifications: true // Can notify when video is ready
        },
        authentication: null,
        skills: [
            {
                id: 'generate-background-video',
                name: 'Generate Background Video',
                description: 'Animate a background image into an 8-second looping video with ambient audio',
                inputModes: ['text', 'file'],
                outputModes: ['file', 'data'],
                tags: ['video', 'background', 'animation', 'veo']
            },
            {
                id: 'check-video-status',
                name: 'Check Video Status',
                description: 'Check the status of a video generation job',
                inputModes: ['text'],
                outputModes: ['data'],
                tags: ['status', 'job']
            }
        ]
    };
}

// ============================================================================
// Video Generation
// ============================================================================

async function ensureOutputDir(): Promise<void> {
    try {
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
    } catch {
        // Directory exists
    }
}

async function checkVideoExists(cacheKey: string): Promise<{ exists: boolean; path?: string; url?: string }> {
    const filePath = path.join(OUTPUT_DIR, `${cacheKey}.mp4`);
    try {
        await fs.access(filePath);
        return {
            exists: true,
            path: filePath,
            url: `/videos/backgrounds/${cacheKey}.mp4`
        };
    } catch {
        return { exists: false };
    }
}

async function getSourceImage(cacheKey: string): Promise<{ path: string; buffer: Buffer } | null> {
    const imagePath = path.join(IMAGE_DIR, `${cacheKey}.png`);
    try {
        const buffer = await fs.readFile(imagePath);
        return { path: imagePath, buffer };
    } catch {
        return null;
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

interface VideoGenerationResult {
    success: boolean;
    videoPath?: string;
    publicUrl?: string;
    error?: string;
}

async function generateVideo(
    imageBuffer: Buffer,
    motionPrompt: string,
    cacheKey: string
): Promise<VideoGenerationResult> {
    const client = getGeminiClient();
    if (!client) {
        return { success: false, error: 'Gemini API key not configured' };
    }

    console.log('[VideoGen] Starting video generation...');
    console.log('[VideoGen] Motion prompt:', motionPrompt.substring(0, 100) + '...');

    try {
        // Start async video generation
        // @ts-ignore - Veo API types may not be complete
        let operation = await client.models.generateVideos({
            model: MODEL_NAME,
            prompt: motionPrompt,
            image: {
                imageBytes: imageBuffer.toString('base64'),
                mimeType: 'image/png'
            },
            config: {
                aspectRatio: '16:9',
                resolution: '720p',
                durationSeconds: '8',
                negativePrompt: generateNegativePrompt()
            }
        });

        console.log('[VideoGen] Generation started, polling for completion...');

        // Poll until done
        let attempts = 0;
        while (!operation.done && attempts < MAX_POLL_ATTEMPTS) {
            await sleep(POLL_INTERVAL_MS);
            attempts++;
            console.log(`[VideoGen] Polling... (attempt ${attempts}/${MAX_POLL_ATTEMPTS})`);

            // @ts-ignore
            operation = await client.operations.getVideosOperation({ operation });
        }

        if (!operation.done) {
            return { success: false, error: 'Video generation timed out' };
        }

        // @ts-ignore
        if (operation.error) {
            // @ts-ignore
            return { success: false, error: `Generation failed: ${operation.error.message}` };
        }

        // Download the video
        // @ts-ignore
        const generatedVideos = operation.response?.generatedVideos;
        if (!generatedVideos || generatedVideos.length === 0) {
            return { success: false, error: 'No video in response' };
        }

        await ensureOutputDir();
        const videoPath = path.join(OUTPUT_DIR, `${cacheKey}.mp4`);

        // @ts-ignore
        await client.files.download({
            file: generatedVideos[0].video,
            downloadPath: videoPath
        });

        console.log(`[VideoGen] Video saved: ${videoPath}`);

        return {
            success: true,
            videoPath,
            publicUrl: `/videos/backgrounds/${cacheKey}.mp4`
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[VideoGen] Error:', error);
        return { success: false, error: errorMessage };
    }
}

/**
 * Process video generation (called by job queue)
 */
async function processVideoGeneration(destination: string, condition: WeatherCondition): Promise<void> {
    const dest = getDestination(destination);
    const cacheKey = getCacheKey(dest.slug, condition);
    const artifactId = `video-${cacheKey}`;

    console.log(`[VideoGen] Processing job: ${cacheKey}`);

    // Update status to generating
    await mediaStorage.updateStatus(cacheKey, 'generating');

    // Get source image
    const sourceImage = await getSourceImage(cacheKey);
    if (!sourceImage) {
        await mediaStorage.updateStatus(cacheKey, 'failed', {
            error: `Source image not found: ${cacheKey}.png`
        });
        throw new Error(`Source image not found: ${cacheKey}.png`);
    }

    // Generate video
    const motionPrompt = generateMotionPrompt(dest.slug, condition);
    const result = await generateVideo(sourceImage.buffer, motionPrompt, cacheKey);

    if (!result.success) {
        await mediaStorage.updateStatus(cacheKey, 'failed', { error: result.error });
        throw new Error(result.error);
    }

    // Update storage with completed artifact
    await mediaStorage.updateStatus(cacheKey, 'complete', {
        filePath: result.videoPath,
        publicUrl: result.publicUrl
    });

    console.log(`[VideoGen] Job completed: ${cacheKey}`);
}

// ============================================================================
// Request Handler
// ============================================================================

interface VideoGenRequest {
    destination: string;
    condition: WeatherCondition;
    forceRegenerate?: boolean;
    async?: boolean; // If true, queue job and return immediately
}

function parseRequest(params: SendMessageParams): VideoGenRequest {
    const message = params.message?.parts?.[0]?.text || '';

    try {
        const parsed = JSON.parse(message);
        return {
            destination: parsed.destination || 'Tokyo',
            condition: parsed.condition || 'night',
            forceRegenerate: parsed.forceRegenerate || false,
            async: parsed.async ?? true // Default to async
        };
    } catch {
        const destinationMatch = message.match(/(?:for|of|in)\s+([A-Za-z\s]+?)(?:\s+(?:with|in|during)|\.| ,|$)/i);
        const conditionMatch = message.match(/(?:sunny|cloudy|rainy|snowy|night|foggy)/i);

        return {
            destination: destinationMatch?.[1]?.trim() || 'Tokyo',
            condition: (conditionMatch?.[0]?.toLowerCase() as WeatherCondition) || 'night',
            forceRegenerate: message.toLowerCase().includes('regenerate') || message.toLowerCase().includes('force'),
            async: !message.toLowerCase().includes('sync') && !message.toLowerCase().includes('wait')
        };
    }
}

export async function handleVideoGenRequest(params: SendMessageParams): Promise<any> {
    await ensureStorageInitialized();

    const request = parseRequest(params);
    const { destination, condition, forceRegenerate, async: asyncMode } = request;

    const dest = getDestination(destination);
    const cacheKey = getCacheKey(dest.slug, condition);
    const artifactId = `video-${cacheKey}`;

    console.log(`[VideoGen] Request: ${dest.name} + ${condition} (key: ${cacheKey}, async: ${asyncMode})`);

    // Check storage first (Redis -> PostgreSQL -> Filesystem)
    if (!forceRegenerate) {
        // Check storage
        const storedArtifact = await mediaStorage.get(cacheKey);

        // If complete, return cached
        if (storedArtifact?.status === 'complete' && storedArtifact.publicUrl) {
            console.log(`[VideoGen] Storage hit: ${storedArtifact.publicUrl}`);
            return {
                contextId: params.contextId || 'videogen-context',
                artifacts: [{
                    artifactId,
                    name: `${dest.name} ${condition} Video`,
                    mimeType: 'video/mp4',
                    parts: [
                        { text: `Video cached: ${storedArtifact.publicUrl}` },
                        {
                            type: 'data',
                            data: {
                                status: 'cached',
                                source: 'storage',
                                ...storedArtifact
                            }
                        }
                    ]
                }]
            };
        }

        // If generating, return status
        if (storedArtifact?.status === 'generating' || storedArtifact?.status === 'pending') {
            console.log(`[VideoGen] Already generating: ${cacheKey}`);
            return {
                contextId: params.contextId || 'videogen-context',
                artifacts: [{
                    artifactId,
                    name: `${dest.name} ${condition} Video`,
                    parts: [
                        { text: `⏳ Video generation in progress...` },
                        {
                            type: 'data',
                            data: {
                                status: storedArtifact.status,
                                destination: dest.slug,
                                condition,
                                cacheKey
                            }
                        }
                    ]
                }]
            };
        }

        // Fallback: check filesystem
        const fileExists = await checkVideoExists(cacheKey);
        if (fileExists.exists) {
            console.log(`[VideoGen] File hit: ${fileExists.path}`);

            // Backfill storage
            const artifact: MediaArtifact = {
                id: artifactId,
                cacheKey,
                destination: dest.slug,
                condition,
                type: 'video',
                status: 'complete',
                filePath: fileExists.path,
                publicUrl: fileExists.url,
                model: MODEL_NAME,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await mediaStorage.save(artifact);

            return {
                contextId: params.contextId || 'videogen-context',
                artifacts: [{
                    artifactId,
                    name: `${dest.name} ${condition} Video`,
                    mimeType: 'video/mp4',
                    parts: [
                        { text: `Video exists: ${fileExists.url}` },
                        {
                            type: 'data',
                            data: {
                                status: 'cached',
                                source: 'filesystem',
                                destination: dest.slug,
                                condition,
                                filePath: fileExists.path,
                                publicUrl: fileExists.url,
                                cacheKey
                            }
                        }
                    ]
                }]
            };
        }
    }

    // Check for source image
    const sourceImage = await getSourceImage(cacheKey);
    if (!sourceImage) {
        return {
            contextId: params.contextId || 'videogen-context',
            artifacts: [{
                artifactId: `${artifactId}-error`,
                name: `${dest.name} ${condition} Video (Missing Image)`,
                parts: [
                    {
                        text: `❌ Source image not found. Generate the image first using the ImageGen agent.\n\nExpected: ${cacheKey}.png`
                    },
                    {
                        type: 'data',
                        data: {
                            status: 'error',
                            error: 'Source image not found',
                            requiredImage: `${cacheKey}.png`,
                            suggestion: 'Call media-imagegen first to generate the base image'
                        }
                    }
                ]
            }]
        };
    }

    // Create pending artifact
    const pendingArtifact: MediaArtifact = {
        id: artifactId,
        cacheKey,
        destination: dest.slug,
        condition,
        type: 'video',
        status: 'pending',
        model: MODEL_NAME,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    await mediaStorage.save(pendingArtifact);

    // Async mode: queue job and return immediately
    if (asyncMode) {
        const jobId = await mediaStorage.enqueueJob({
            id: `job-${cacheKey}-${Date.now()}`,
            type: 'video',
            destination: dest.slug,
            condition
        });

        console.log(`[VideoGen] Queued job: ${jobId}`);

        return {
            contextId: params.contextId || 'videogen-context',
            artifacts: [{
                artifactId,
                name: `${dest.name} ${condition} Video`,
                parts: [
                    { text: `🎬 Video generation queued!\n\nJob ID: ${jobId}\nEstimated time: 1-6 minutes\n\nCheck status at: GET /api/media/video/${dest.slug}/${condition}` },
                    {
                        type: 'data',
                        data: {
                            status: 'queued',
                            jobId,
                            destination: dest.slug,
                            condition,
                            cacheKey,
                            estimatedTimeSeconds: 60
                        }
                    }
                ]
            }]
        };
    }

    // Sync mode: generate and wait
    try {
        await processVideoGeneration(dest.slug, condition);

        const completedArtifact = await mediaStorage.get(cacheKey);

        const metadata: VideoArtifactMetadata = {
            destination: dest.slug,
            condition,
            imageArtifactId: `image-${cacheKey}`,
            motionPrompt: generateMotionPrompt(dest.slug, condition),
            filePath: completedArtifact?.filePath || '',
            publicUrl: completedArtifact?.publicUrl || '',
            status: 'complete',
            generatedAt: new Date().toISOString(),
            model: MODEL_NAME,
            durationSeconds: 8,
            resolution: '720p'
        };

        return {
            contextId: params.contextId || 'videogen-context',
            artifacts: [{
                artifactId,
                name: `${dest.name} ${condition} Video`,
                mimeType: 'video/mp4',
                parts: [
                    {
                        text: `🎬 Generated ${dest.name} video with ${condition} atmosphere!\n\nFile: ${completedArtifact?.publicUrl}\nDuration: 8 seconds\nResolution: 720p`
                    },
                    {
                        type: 'data',
                        data: {
                            status: 'complete',
                            ...metadata
                        }
                    }
                ],
                metadata
            }]
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[VideoGen] Error:`, error);

        return {
            contextId: params.contextId || 'videogen-context',
            artifacts: [{
                artifactId: `${artifactId}-error`,
                name: `${dest.name} ${condition} Video (Failed)`,
                parts: [
                    { text: `❌ Failed to generate video: ${errorMessage}` },
                    {
                        type: 'data',
                        data: {
                            status: 'failed',
                            destination: dest.slug,
                            condition,
                            error: errorMessage,
                            cacheKey
                        }
                    }
                ]
            }]
        };
    }
}
