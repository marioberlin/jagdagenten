/**
 * A2A Video Runtime Server
 *
 * Standalone server entry point for video rendering container.
 */

// Import from the main video module (copied during build)
import { startVideoServer } from './video/index.js';

const port = parseInt(process.env.VIDEO_PORT || '8082', 10);

console.log('[Video Runtime] Starting server...');
console.log('[Video Runtime] Environment:');
console.log(`  - Port: ${port}`);
console.log(`  - Output dir: ${process.env.VIDEO_OUTPUT_DIR}`);
console.log(`  - Asset dir: ${process.env.VIDEO_ASSET_DIR}`);
console.log(`  - FFmpeg: ${process.env.FFMPEG_PATH}`);
console.log(`  - Max concurrent: ${process.env.VIDEO_MAX_CONCURRENT_RENDERS}`);

startVideoServer({
  config: {
    port,
    baseUrl: `http://localhost:${port}`,
    outputDir: process.env.VIDEO_OUTPUT_DIR || '/data/renders',
    assetDir: process.env.VIDEO_ASSET_DIR || '/data/assets',
    tempDir: process.env.VIDEO_TEMP_DIR || '/data/temp',
    ffmpegPath: process.env.FFMPEG_PATH || '/usr/bin/ffmpeg',
    ffprobePath: process.env.FFPROBE_PATH || '/usr/bin/ffprobe',
    maxConcurrentRenders: parseInt(process.env.VIDEO_MAX_CONCURRENT_RENDERS || '4', 10),
    defaultCodec: (process.env.VIDEO_DEFAULT_CODEC as 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores') || 'h264',
    defaultCrf: parseInt(process.env.VIDEO_DEFAULT_CRF || '18', 10),
    maxDuration: parseInt(process.env.VIDEO_MAX_DURATION || '3600', 10),
    hardwareAcceleration: process.env.VIDEO_HARDWARE_ACCELERATION === 'true',
    databaseUrl: process.env.DATABASE_URL || '',
    redisUrl: process.env.REDIS_URL || '',
    natsUrl: process.env.NATS_URL || '',
  },
  enableCors: true,
  enableLogging: process.env.VIDEO_LOG_LEVEL !== 'silent',
}).catch((error) => {
  console.error('[Video Runtime] Failed to start:', error);
  process.exit(1);
});
