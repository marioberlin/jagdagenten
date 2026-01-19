#!/usr/bin/env bun
/**
 * Pre-Generate Background Media
 * 
 * Generates background images and videos for specified cities and weather conditions.
 * Uses the ImageGen and VideoGen agents.
 * 
 * Usage:
 *   bun scripts/pre-generate-backgrounds.ts [--images-only] [--videos-only] [--dry-run]
 */

// Don't import handlers directly to ensure A2A task tracking via server
// import { handleImageGenRequest } from '../server/src/agents/media-imagegen';
// import { handleVideoGenRequest } from '../server/src/agents/media-videogen';
import type { WeatherCondition } from '../server/src/agents/media-common/types';

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Cities to pre-generate
const CITIES = ['berlin', 'london', 'tokyo', 'new-york', 'toronto', 'milan', 'paris', 'sydney', 'dubai', 'singapore'];

// Weather conditions to generate (4 distinct conditions)
const CONDITIONS: WeatherCondition[] = ['sunny', 'rainy', 'night', 'snowy'];

// Delay between API calls to avoid rate limiting
const DELAY_BETWEEN_IMAGES_MS = 2000;  // 2 seconds
const DELAY_BETWEEN_VIDEOS_MS = 5000;  // 5 seconds (videos take longer)

// ============================================================================
// Utilities
// ============================================================================

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`;
}

interface GenerationResult {
    city: string;
    condition: WeatherCondition;
    type: 'image' | 'video';
    success: boolean;
    cached: boolean;
    error?: string;
    duration?: number;
    taskId?: string;
}

// ============================================================================
// Generation Functions
// ============================================================================

async function callAgent(endpoint: string, city: string, condition: string): Promise<any> {
    const destination = city;
    // Context ID helps group these tasks in the Console
    const contextId = `pre-gen-${destination}-${condition}-${Date.now()}`;

    const body = {
        jsonrpc: '2.0',
        method: 'SendMessage',
        params: {
            message: {
                parts: [{ text: JSON.stringify({ destination, condition }) }],
                contextId
            },
            contextId
        },
        id: Date.now()
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const json = await response.json() as any;
    if (json.error) {
        throw new Error(json.error.message || JSON.stringify(json.error));
    }

    return json.result;
}

async function generateImage(city: string, condition: WeatherCondition, dryRun: boolean): Promise<GenerationResult> {
    const startTime = Date.now();

    if (dryRun) {
        console.log(`  [DRY RUN] Would generate image: ${city}-${condition}`);
        return { city, condition, type: 'image', success: true, cached: false };
    }

    try {
        const result = await callAgent('/agents/media-imagegen', city, condition);

        const duration = Date.now() - startTime;
        const artifact = result.artifacts?.[0];
        const data = artifact?.parts?.find((p: any) => p.type === 'data')?.data;
        const cached = data?.status === 'cached';
        const success = data?.status === 'complete' || data?.status === 'cached';

        return { city, condition, type: 'image', success, cached, duration };
    } catch (error) {
        return {
            city, condition, type: 'image', success: false, cached: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime
        };
    }
}

async function generateVideo(city: string, condition: WeatherCondition, dryRun: boolean): Promise<GenerationResult> {
    const startTime = Date.now();

    if (dryRun) {
        console.log(`  [DRY RUN] Would generate video: ${city}-${condition}`);
        return { city, condition, type: 'video', success: true, cached: false };
    }

    try {
        const result = await callAgent('/agents/media-videogen', city, condition);

        const duration = Date.now() - startTime;
        const artifact = result.artifacts?.[0];
        const data = artifact?.parts?.find((p: any) => p.type === 'data')?.data;
        const cached = data?.status === 'cached';
        const success = data?.status === 'complete' || data?.status === 'cached';

        return { city, condition, type: 'video', success, cached, duration };
    } catch (error) {
        return {
            city, condition, type: 'video', success: false, cached: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - startTime
        };
    }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const imagesOnly = args.includes('--images-only');
    const videosOnly = args.includes('--videos-only');

    // Skip the first argument as it's the script path
    if (args.includes('--help')) {
        console.log('Usage: bun scripts/pre-generate-backgrounds.ts [options]');
        console.log('Options:');
        console.log('  --dry-run      Simulate generation without calling APIs');
        console.log('  --images-only  Generate only background images');
        console.log('  --videos-only  Generate only background videos');
        return;
    }

    console.log('🌍 LiquidCrypto Media Pre-generation');
    console.log('====================================');
    console.log(`Target: ${BASE_URL}`);
    console.log(`Concurrency: 4 tasks`);
    if (dryRun) console.log('MODE: DRY RUN (No generation)');
    console.log('');

    // Build task queue
    type Task = () => Promise<GenerationResult>;
    const taskQueue: { name: string; fn: Task }[] = [];

    // 1. Queue Images
    if (!videosOnly) {
        console.log(`Planning ${CITIES.length * CONDITIONS.length} images...`);
        for (const city of CITIES) {
            for (const condition of CONDITIONS) {
                taskQueue.push({
                    name: `Image: ${city} (${condition})`,
                    fn: () => generateImage(city, condition, dryRun)
                });
            }
        }
    }

    // 2. Queue Videos
    if (!imagesOnly) {
        console.log(`Planning ${CITIES.length * CONDITIONS.length} videos...`);
        for (const city of CITIES) {
            for (const condition of CONDITIONS) {
                taskQueue.push({
                    name: `Video: ${city} (${condition})`,
                    fn: () => generateVideo(city, condition, dryRun)
                });
            }
        }
    }

    console.log(`\nStarting execution of ${taskQueue.length} tasks...`);
    console.log('----------------------------------------');

    const results: GenerationResult[] = [];
    const CONCURRENCY_LIMIT = 4;
    const activePromises: Promise<void>[] = [];

    // Process queue with concurrency limit
    while (taskQueue.length > 0 || activePromises.length > 0) {
        // Fill active slots
        while (taskQueue.length > 0 && activePromises.length < CONCURRENCY_LIMIT) {
            const task = taskQueue.shift()!;
            const taskPromise = (async () => {
                console.log(`[Start] ${task.name}`);
                try {
                    const result = await task.fn();
                    results.push(result);

                    // Log result immediately
                    const status = result.cached ? 'CACHED' : (result.success ? 'DONE' : 'FAIL');
                    const icon = result.success ? '✅' : '❌';
                    const dur = result.duration ? formatDuration(result.duration) : '';
                    console.log(`${icon} [${status}] ${result.city} ${result.condition} (${result.type}) ${dur}`);

                    if (result.error) {
                        console.error(`  Error: ${result.error}`);
                    }
                } catch (e) {
                    console.error(`❌ [CRASH] ${task.name}`, e);
                }
            })();

            // Add to active set and remove when done
            const p = taskPromise.then(() => {
                const idx = activePromises.indexOf(p);
                if (idx > -1) activePromises.splice(idx, 1);
            });
            activePromises.push(p);

            // Small stagger to avoid hammering connection at exact same ms
            await sleep(200);
        }

        // Wait for at least one to finish if queue is blocked or empty
        if (activePromises.length > 0) {
            await Promise.race(activePromises);
        } else if (taskQueue.length === 0) {
            break;
        }
    }

    // Report
    console.log('\n====================================');
    console.log('Execution Complete');
    console.log('====================================');

    const success = results.filter(r => r.success).length;
    const cached = results.filter(r => r.cached).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Total:   ${results.length}`);
    console.log(`Success: ${success}`);
    console.log(`Cached:  ${cached}`);
    console.log(`Failed:  ${failed}`);

    if (failed > 0) process.exit(1);
}

main().catch(console.error);
