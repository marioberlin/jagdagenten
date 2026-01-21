import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

/**
 * Healer Watcher
 * 
 * Monitors the healing_queue.json file and automatically triggers
 * the healer script when new items are detected.
 * 
 * Usage: bun scripts/healer-watch.ts
 */

const projectRoot = process.cwd();
const QUEUE_PATH = path.join(projectRoot, 'healing_queue.json');
const DEBOUNCE_MS = 2000; // Wait 2s after last change before triggering

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let isProcessing = false;

function log(message: string) {
    const timestamp = new Date().toISOString();
    console.log(`[Healer-Watch ${timestamp}] ${message}`);
}

function getQueueLength(): number {
    try {
        if (!fs.existsSync(QUEUE_PATH)) return 0;
        const content = fs.readFileSync(QUEUE_PATH, 'utf8');
        const queue = JSON.parse(content);
        return Array.isArray(queue) ? queue.length : 0;
    } catch {
        return 0;
    }
}

async function runHealer(): Promise<boolean> {
    return new Promise((resolve) => {
        log('Running healer script...');
        const child = spawn('bun', ['scripts/healer.ts'], {
            cwd: projectRoot,
            stdio: 'inherit',
        });

        child.on('close', (code) => {
            if (code === 0) {
                log('Healer script completed successfully');
                resolve(true);
            } else {
                log(`Healer script exited with code ${code}`);
                resolve(false);
            }
        });

        child.on('error', (err) => {
            log(`Healer script error: ${err.message}`);
            resolve(false);
        });
    });
}

async function runRalphStatus(): Promise<void> {
    return new Promise((resolve) => {
        log('Checking Ralph status...');
        const child = spawn('bun', ['scripts/ralph_runner.ts', 'status'], {
            cwd: projectRoot,
            stdio: 'inherit',
        });

        child.on('close', () => resolve());
        child.on('error', () => resolve());
    });
}

async function processQueue() {
    if (isProcessing) {
        log('Already processing, skipping...');
        return;
    }

    const queueLength = getQueueLength();
    if (queueLength === 0) {
        log('Queue is empty, nothing to process.');
        return;
    }

    isProcessing = true;
    log(`Queue has ${queueLength} item(s), starting heal cycle...`);

    try {
        const healerSuccess = await runHealer();
        if (healerSuccess) {
            await runRalphStatus();
            log('');
            log('============================================');
            log('PRD generated! To start the Ralph loop, run:');
            log('  bun scripts/ralph_runner.ts next');
            log('============================================');
            log('');
        }
    } finally {
        isProcessing = false;
    }
}

function onQueueChange() {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
        debounceTimer = null;
        processQueue();
    }, DEBOUNCE_MS);
}

// Main
log('Starting Healer Watcher...');
log(`Monitoring: ${QUEUE_PATH}`);

// Ensure queue file exists
if (!fs.existsSync(QUEUE_PATH)) {
    fs.writeFileSync(QUEUE_PATH, '[]');
    log('Created empty healing_queue.json');
}

// Check for existing items on startup
const initialLength = getQueueLength();
if (initialLength > 0) {
    log(`Found ${initialLength} existing item(s) in queue`);
    processQueue();
}

// Watch for changes
fs.watch(QUEUE_PATH, (eventType) => {
    if (eventType === 'change') {
        log('Queue file changed, debouncing...');
        onQueueChange();
    }
});

log('Watcher active. Press Ctrl+C to stop.');

// Keep process alive
process.on('SIGINT', () => {
    log('Shutting down watcher...');
    process.exit(0);
});
