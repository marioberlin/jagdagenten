/**
 * Media ImageGen Agent
 * 
 * A2A agent that generates iconic destination images using Gemini 3 Pro Image.
 * Features:
 * - PostgreSQL artifact storage for persistence
 * - Redis caching for fast lookups
 * - Filesystem storage for actual image files
 */
import type { AgentCard, SendMessageParams } from '../a2a/types.js';
import { randomUUID } from 'crypto';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs/promises';
import * as path from 'path';

import {
    type WeatherCondition,
    type ImageArtifactMetadata,
    getCacheKey,
    generateImagePrompt,
    getDestination
} from './media-common/index.js';
import { mediaStorage, type MediaArtifact } from './media-common/storage.js';

// ============================================================================
// Configuration
// ============================================================================

const MODEL_NAME = 'gemini-3-pro-image-preview';
const OUTPUT_DIR = 'public/images/backgrounds';

// Initialize storage on module load
let storageInitialized = false;
async function ensureStorageInitialized(): Promise<void> {
    if (!storageInitialized) {
        await mediaStorage.initialize();
        storageInitialized = true;
    }
}

// Initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn('[ImageGen] GEMINI_API_KEY not set');
        return null;
    }
    return new GoogleGenAI({ apiKey });
}

// ============================================================================
// Agent Card
// ============================================================================

export function getImageGenAgentCard(baseUrl: string): AgentCard {
    return {
        name: 'Media ImageGen',
        description: 'Generates iconic destination background images using Gemini 3 Pro Image. Creates high-fidelity cityscape images based on destination and weather condition.',
        url: `${baseUrl}/agents/media-imagegen`,
        provider: { name: 'LiquidCrypto', url: 'https://liquidcrypto.app' },
        version: '1.1.0',
        protocolVersion: '1.0',
        capabilities: {
            streaming: false,
            pushNotifications: false
        },
        authentication: null,
        skills: [
            {
                id: 'generate-background-image',
                name: 'Generate Background Image',
                description: 'Create an iconic cityscape image for a destination with specific weather condition',
                inputModes: ['text'],
                outputModes: ['file', 'data'],
                tags: ['image', 'background', 'destination', 'weather']
            },
            {
                id: 'check-image-exists',
                name: 'Check Image Exists',
                description: 'Check if a background image already exists for destination + condition',
                inputModes: ['text'],
                outputModes: ['data'],
                tags: ['cache', 'check']
            }
        ]
    };
}

// ============================================================================
// Image Generation
// ============================================================================

async function generateImage(prompt: string): Promise<Buffer> {
    const client = getGeminiClient();
    if (!client) {
        throw new Error('Gemini API key not configured');
    }

    console.log('[ImageGen] Generating image with prompt:', prompt.substring(0, 100) + '...');

    const response = await client.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
            responseModalities: ['Image'],
            // @ts-ignore - imageConfig may not be in types yet
            imageConfig: {
                aspectRatio: '16:9',
                imageSize: '2K'
            }
        }
    });

    // Extract image data from response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
        throw new Error('No image generated - empty response');
    }

    const parts = candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
        throw new Error('No image data in response');
    }

    for (const part of parts) {
        // @ts-ignore - inlineData structure
        if (part.inlineData) {
            // @ts-ignore
            const base64Data = part.inlineData.data;
            return Buffer.from(base64Data, 'base64');
        }
    }

    throw new Error('No inline image data found in response');
}

async function ensureOutputDir(): Promise<void> {
    try {
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
    } catch (err) {
        // Directory exists, that's fine
    }
}

async function checkFileExists(cacheKey: string): Promise<{ exists: boolean; path?: string; url?: string }> {
    const filePath = path.join(OUTPUT_DIR, `${cacheKey}.png`);
    try {
        await fs.access(filePath);
        return {
            exists: true,
            path: filePath,
            url: `/images/backgrounds/${cacheKey}.png`
        };
    } catch {
        return { exists: false };
    }
}

// ============================================================================
// Request Handler
// ============================================================================

interface ImageGenRequest {
    destination: string;
    condition: WeatherCondition;
    forceRegenerate?: boolean;
}

function parseRequest(params: SendMessageParams): ImageGenRequest {
    const message = params.message?.parts?.[0]?.text || '';

    // Try to parse JSON format
    try {
        const parsed = JSON.parse(message);
        return {
            destination: parsed.destination || 'Tokyo',
            condition: parsed.condition || 'night',
            forceRegenerate: parsed.forceRegenerate || false
        };
    } catch {
        // Parse natural language
        const destinationMatch = message.match(/(?:for|of|in)\s+([A-Za-z\s]+?)(?:\s+(?:with|in|during)|\.| ,|$)/i);
        const conditionMatch = message.match(/(?:sunny|cloudy|rainy|snowy|night|foggy)/i);

        return {
            destination: destinationMatch?.[1]?.trim() || 'Tokyo',
            condition: (conditionMatch?.[0]?.toLowerCase() as WeatherCondition) || 'night',
            forceRegenerate: message.toLowerCase().includes('regenerate') || message.toLowerCase().includes('force')
        };
    }
}

export async function handleImageGenRequest(params: SendMessageParams): Promise<any> {
    await ensureStorageInitialized();

    const request = parseRequest(params);
    const { destination, condition, forceRegenerate } = request;

    const dest = getDestination(destination);
    const cacheKey = getCacheKey(dest.slug, condition);
    const artifactId = `image-${cacheKey}`;

    console.log(`[ImageGen] Request: ${dest.name} + ${condition} (key: ${cacheKey})`);

    // Check storage first (Redis -> PostgreSQL -> Filesystem)
    if (!forceRegenerate) {
        // Check Redis/PostgreSQL
        const storedArtifact = await mediaStorage.get(cacheKey);
        if (storedArtifact && storedArtifact.status === 'complete' && storedArtifact.publicUrl) {
            console.log(`[ImageGen] Storage hit: ${storedArtifact.publicUrl}`);
            return {
                contextId: params.contextId || 'imagegen-context',
                artifacts: [{
                    artifactId,
                    name: `${dest.name} ${condition} Background`,
                    mimeType: 'image/png',
                    parts: [
                        { text: `Image cached: ${storedArtifact.publicUrl}` },
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

        // Fallback: check filesystem
        const fileExists = await checkFileExists(cacheKey);
        if (fileExists.exists) {
            console.log(`[ImageGen] File hit: ${fileExists.path}`);

            // Backfill storage
            const artifact: MediaArtifact = {
                id: artifactId,
                cacheKey,
                destination: dest.slug,
                condition,
                type: 'image',
                status: 'complete',
                filePath: fileExists.path,
                publicUrl: fileExists.url,
                model: MODEL_NAME,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await mediaStorage.save(artifact);

            return {
                contextId: params.contextId || 'imagegen-context',
                artifacts: [{
                    artifactId,
                    name: `${dest.name} ${condition} Background`,
                    mimeType: 'image/png',
                    parts: [
                        { text: `Image exists: ${fileExists.url}` },
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

    // Create pending artifact
    const pendingArtifact: MediaArtifact = {
        id: artifactId,
        cacheKey,
        destination: dest.slug,
        condition,
        type: 'image',
        status: 'generating',
        model: MODEL_NAME,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    await mediaStorage.save(pendingArtifact);

    // Generate new image
    try {
        await ensureOutputDir();

        const prompt = generateImagePrompt(dest.slug, condition);
        const imageBuffer = await generateImage(prompt);

        // Save to filesystem
        const filePath = path.join(OUTPUT_DIR, `${cacheKey}.png`);
        await fs.writeFile(filePath, imageBuffer);

        const publicUrl = `/images/backgrounds/${cacheKey}.png`;
        console.log(`[ImageGen] Generated: ${filePath} (${imageBuffer.length} bytes)`);

        // Update storage with completed artifact
        const completedArtifact: MediaArtifact = {
            ...pendingArtifact,
            status: 'complete',
            filePath,
            publicUrl,
            prompt,
            updatedAt: new Date(),
            completedAt: new Date()
        };
        await mediaStorage.save(completedArtifact);

        const metadata: ImageArtifactMetadata = {
            destination: dest.slug,
            condition,
            prompt,
            filePath,
            publicUrl,
            generatedAt: new Date().toISOString(),
            model: MODEL_NAME
        };

        return {
            contextId: params.contextId || 'imagegen-context',
            artifacts: [{
                artifactId,
                name: `${dest.name} ${condition} Background`,
                mimeType: 'image/png',
                parts: [
                    { text: `✨ Generated ${dest.name} background with ${condition} weather!\n\nFile: ${publicUrl}` },
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
        console.error(`[ImageGen] Error:`, error);

        // Update storage with failed status
        await mediaStorage.updateStatus(cacheKey, 'failed', { error: errorMessage });

        return {
            contextId: params.contextId || 'imagegen-context',
            artifacts: [{
                artifactId: `${artifactId}-error`,
                name: `${dest.name} ${condition} Background (Failed)`,
                parts: [
                    { text: `❌ Failed to generate image: ${errorMessage}` },
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
