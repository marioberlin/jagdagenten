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

import { handleImageGenRequest } from '../server/src/agents/media-imagegen';
import { handleVideoGenRequest } from '../server/src/agents/media-videogen';
import type { WeatherCondition } from '../server/src/agents/media-common/types';

// ============================================================================
// Configuration
// ============================================================================

// Cities to pre-generate (6 cities × 4 conditions = 24 combinations)
const CITIES = ['berlin', 'london', 'tokyo', 'new-york', 'toronto', 'milan'];

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
}

// ============================================================================
// Generation Functions
// ============================================================================

async function generateImage(city: string, condition: WeatherCondition, dryRun: boolean): Promise<GenerationResult> {
    const startTime = Date.now();

    if (dryRun) {
        console.log(`  [DRY RUN] Would generate image: ${city}-${condition}`);
        return { city, condition, type: 'image', success: true, cached: false };
    }

    try {
        const result = await handleImageGenRequest({
            message: {
                parts: [{ text: JSON.stringify({ destination: city, condition }) }]
            }
        });

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
        const result = await handleVideoGenRequest({
            message: {
                parts: [{ text: JSON.stringify({ destination: city, condition }) }]
            }
        });

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
// Main
// ============================================================================

async function main() {
    const args = process.argv.slice(2);
    const imagesOnly = args.includes('--images-only');
    const videosOnly = args.includes('--videos-only');
    const dryRun = args.includes('--dry-run');

    const generateImages = !videosOnly;
    const generateVideos = !imagesOnly;

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           Pre-Generate Background Media                       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log();
    console.log(`Cities: ${CITIES.join(', ')}`);
    console.log(`Conditions: ${CONDITIONS.join(', ')}`);
    console.log(`Total combinations: ${CITIES.length * CONDITIONS.length}`);
    console.log(`Generate images: ${generateImages ? '✓' : '✗'}`);
    console.log(`Generate videos: ${generateVideos ? '✓' : '✗'}`);
    console.log(`Dry run: ${dryRun ? 'YES' : 'NO'}`);
    console.log();

    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY environment variable not set!');
        console.log('   Set it in your .env file or export it:');
        console.log('   export GEMINI_API_KEY=your_key_here');
        process.exit(1);
    }

    const results: GenerationResult[] = [];
    const totalStart = Date.now();

    // Generate images first
    if (generateImages) {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(' Phase 1: Generating Images');
        console.log('═══════════════════════════════════════════════════════════════');

        for (const city of CITIES) {
            for (const condition of CONDITIONS) {
                console.log(`\n🖼️  ${city} + ${condition}...`);
                const result = await generateImage(city, condition, dryRun);
                results.push(result);

                if (result.cached) {
                    console.log(`   ✓ Cached (${formatDuration(result.duration || 0)})`);
                } else if (result.success) {
                    console.log(`   ✓ Generated (${formatDuration(result.duration || 0)})`);
                } else {
                    console.log(`   ✗ Failed: ${result.error}`);
                }

                if (!dryRun && !result.cached) {
                    await sleep(DELAY_BETWEEN_IMAGES_MS);
                }
            }
        }
    }

    // Generate videos (requires images to exist)
    if (generateVideos) {
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log(' Phase 2: Generating Videos');
        console.log('═══════════════════════════════════════════════════════════════');

        for (const city of CITIES) {
            for (const condition of CONDITIONS) {
                console.log(`\n🎬 ${city} + ${condition}...`);
                const result = await generateVideo(city, condition, dryRun);
                results.push(result);

                if (result.cached) {
                    console.log(`   ✓ Cached`);
                } else if (result.success) {
                    console.log(`   ✓ Generated (${formatDuration(result.duration || 0)})`);
                } else {
                    console.log(`   ✗ Failed: ${result.error}`);
                }

                if (!dryRun && !result.cached) {
                    await sleep(DELAY_BETWEEN_VIDEOS_MS);
                }
            }
        }
    }

    // Summary
    const totalDuration = Date.now() - totalStart;
    const imageResults = results.filter(r => r.type === 'image');
    const videoResults = results.filter(r => r.type === 'video');

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(' Summary');
    console.log('═══════════════════════════════════════════════════════════════');

    if (imageResults.length > 0) {
        const imageSuccess = imageResults.filter(r => r.success).length;
        const imageCached = imageResults.filter(r => r.cached).length;
        console.log(`\n🖼️  Images: ${imageSuccess}/${imageResults.length} successful (${imageCached} cached)`);
    }

    if (videoResults.length > 0) {
        const videoSuccess = videoResults.filter(r => r.success).length;
        const videoCached = videoResults.filter(r => r.cached).length;
        console.log(`🎬 Videos: ${videoSuccess}/${videoResults.length} successful (${videoCached} cached)`);
    }

    console.log(`\n⏱️  Total time: ${formatDuration(totalDuration)}`);

    // List failures
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
        console.log('\n❌ Failures:');
        for (const f of failures) {
            console.log(`   - ${f.city}-${f.condition} (${f.type}): ${f.error}`);
        }
    }

    console.log('\n✅ Done!');
}

main().catch(console.error);
