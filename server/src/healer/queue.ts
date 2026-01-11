/**
 * Healing Queue Management
 *
 * Manages the queue of healing tasks with persistence and deduplication.
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 4.2 Self-Healing Production Loop
 */

import { createHash } from 'crypto';
import { mkdir, readFile, writeFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import type {
    ErrorReport,
    HealingTask,
    HealingPRD,
    ErrorDedupeEntry,
    HealingQueueStatus
} from './types.js';
import { componentLoggers } from '../logger.js';

const healerLog = componentLoggers.http;

/**
 * Queue storage configuration
 */
interface QueueConfig {
    /** Path to queue storage file */
    storagePath: string;
    /** Path to deduplication index */
    dedupePath: string;
    /** Maximum tasks to keep in queue */
    maxQueueSize: number;
    /** Maximum healing attempts per task */
    maxAttempts: number;
    /** Deduplication window in milliseconds */
    dedupeWindowMs: number;
}

const DEFAULT_CONFIG: QueueConfig = {
    storagePath: join(process.cwd(), '.healing', 'queue.json'),
    dedupePath: join(process.cwd(), '.healing', 'dedupe.json'),
    maxQueueSize: 100,
    maxAttempts: 3,
    dedupeWindowMs: 24 * 60 * 60 * 1000 // 24 hours
};

/**
 * In-memory cache of the queue (synced to disk)
 */
let queueCache: HealingTask[] = [];
let dedupeCache: Map<string, ErrorDedupeEntry> = new Map();
let initialized = false;

/**
 * Initialize the healing queue
 */
export async function initQueue(config?: Partial<QueueConfig>): Promise<void> {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    // Ensure storage directory exists
    await mkdir(dirname(cfg.storagePath), { recursive: true });

    // Load existing queue
    try {
        await access(cfg.storagePath);
        const data = await readFile(cfg.storagePath, 'utf8');
        queueCache = JSON.parse(data);
    } catch (e) {
        queueCache = [];
    }

    // Load deduplication index
    try {
        await access(cfg.dedupePath);
        const data = await readFile(cfg.dedupePath, 'utf8');
        const entries: ErrorDedupeEntry[] = JSON.parse(data);
        dedupeCache = new Map(entries.map(e => [e.hash, e]));
    } catch (e) {
        dedupeCache = new Map();
    }

    initialized = true;
    healerLog.info({
        queueSize: queueCache.length,
        dedupeEntries: dedupeCache.size
    }, 'Healing queue initialized');
}

/**
 * Persist queue to disk
 */
async function persistQueue(config?: Partial<QueueConfig>): Promise<void> {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    await writeFile(cfg.storagePath, JSON.stringify(queueCache, null, 2));
    await writeFile(cfg.dedupePath, JSON.stringify(Array.from(dedupeCache.values()), null, 2));
}

/**
 * Generate hash for error deduplication
 */
export function hashError(error: ErrorReport): string {
    // Hash based on error message, component, and first few stack frames
    const stackPrefix = error.stack?.split('\n').slice(0, 5).join('\n') || '';
    const content = `${error.message}|${error.context.componentName || ''}|${stackPrefix}`;

    return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Check if error has been recently healed
 */
export async function isRecentlyHealed(
    errorHash: string,
    config?: Partial<QueueConfig>
): Promise<boolean> {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    if (!initialized) {
        await initQueue(cfg);
    }

    const entry = dedupeCache.get(errorHash);
    if (!entry) return false;

    const now = Date.now();
    const lastAttempt = entry.lastHealingAttempt
        ? new Date(entry.lastHealingAttempt).getTime()
        : 0;

    // If healing was attempted within the window, skip
    if (entry.healingInProgress || (now - lastAttempt < cfg.dedupeWindowMs)) {
        healerLog.debug({
            errorHash,
            healingInProgress: entry.healingInProgress,
            lastAttempt: entry.lastHealingAttempt
        }, 'Error recently healed, skipping');
        return true;
    }

    return false;
}

/**
 * Mark healing as started for an error
 */
export async function markHealingStarted(
    errorHash: string,
    config?: Partial<QueueConfig>
): Promise<void> {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    if (!initialized) {
        await initQueue(cfg);
    }

    const existing = dedupeCache.get(errorHash);
    const now = new Date().toISOString();

    if (existing) {
        existing.healingInProgress = true;
        existing.lastHealingAttempt = now;
        existing.lastSeen = now;
        existing.count++;
    } else {
        dedupeCache.set(errorHash, {
            hash: errorHash,
            count: 1,
            firstSeen: now,
            lastSeen: now,
            healingInProgress: true,
            lastHealingAttempt: now
        });
    }

    await persistQueue(cfg);
}

/**
 * Mark healing as completed for an error
 */
export async function markHealingCompleted(
    errorHash: string,
    success: boolean,
    config?: Partial<QueueConfig>
): Promise<void> {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    if (!initialized) {
        await initQueue(cfg);
    }

    const entry = dedupeCache.get(errorHash);
    if (entry) {
        entry.healingInProgress = false;
        if (!success) {
            // Clear last attempt so it can be retried after window
            entry.lastHealingAttempt = new Date().toISOString();
        }
    }

    await persistQueue(cfg);
}

/**
 * Add a healing task to the queue
 */
export async function enqueueHealingTask(
    error: ErrorReport,
    config?: Partial<QueueConfig>
): Promise<HealingTask | null> {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    if (!initialized) {
        await initQueue(cfg);
    }

    const errorHash = hashError(error);

    // Check deduplication
    if (await isRecentlyHealed(errorHash, cfg)) {
        return null;
    }

    // Check queue size limit
    if (queueCache.length >= cfg.maxQueueSize) {
        // Remove oldest completed/failed tasks
        const activeStatuses = ['queued', 'analyzing', 'prd_ready', 'healing', 'verifying'];
        const oldestRemovable = queueCache.findIndex(
            t => !activeStatuses.includes(t.status)
        );

        if (oldestRemovable >= 0) {
            queueCache.splice(oldestRemovable, 1);
        } else {
            healerLog.warn({ queueSize: queueCache.length }, 'Healing queue full, cannot add task');
            return null;
        }
    }

    const now = new Date().toISOString();
    const task: HealingTask = {
        id: `heal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        errorReport: error,
        status: 'queued',
        attempts: 0,
        maxAttempts: cfg.maxAttempts,
        createdAt: now,
        updatedAt: now
    };

    queueCache.push(task);
    await markHealingStarted(errorHash, cfg);
    await persistQueue(cfg);

    healerLog.info({
        taskId: task.id,
        errorHash,
        errorType: error.type,
        component: error.context.componentName
    }, 'Healing task enqueued');

    return task;
}

/**
 * Get next task to process
 */
export async function getNextTask(
    config?: Partial<QueueConfig>
): Promise<HealingTask | null> {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    if (!initialized) {
        await initQueue(cfg);
    }

    // Priority: queued > prd_ready (for retries)
    const next = queueCache.find(t =>
        t.status === 'queued' && t.attempts < t.maxAttempts
    ) || queueCache.find(t =>
        t.status === 'prd_ready' && t.attempts < t.maxAttempts
    );

    return next || null;
}

/**
 * Update task status
 */
export async function updateTaskStatus(
    taskId: string,
    status: HealingTask['status'],
    updates?: Partial<HealingTask>,
    config?: Partial<QueueConfig>
): Promise<boolean> {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    if (!initialized) {
        await initQueue(cfg);
    }

    const task = queueCache.find(t => t.id === taskId);
    if (!task) {
        return false;
    }

    task.status = status;
    task.updatedAt = new Date().toISOString();

    if (updates) {
        Object.assign(task, updates);
    }

    // Update healing attempt count
    if (status === 'healing') {
        task.attempts++;
    }

    // Mark deduplication entry as completed
    if (status === 'completed' || status === 'failed') {
        const errorHash = hashError(task.errorReport);
        await markHealingCompleted(errorHash, status === 'completed', cfg);
    }

    await persistQueue(cfg);

    healerLog.info({
        taskId,
        status,
        attempts: task.attempts
    }, 'Task status updated');

    return true;
}

/**
 * Get task by ID
 */
export function getTask(taskId: string): HealingTask | undefined {
    return queueCache.find(t => t.id === taskId);
}

/**
 * Set PRD for a task
 */
export async function setTaskPRD(
    taskId: string,
    prd: HealingPRD,
    config?: Partial<QueueConfig>
): Promise<boolean> {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    const task = queueCache.find(t => t.id === taskId);
    if (!task) {
        return false;
    }

    task.prd = prd;
    task.status = 'prd_ready';
    task.updatedAt = new Date().toISOString();

    await persistQueue(cfg);

    healerLog.info({
        taskId,
        prdId: prd.id,
        storiesCount: prd.stories.length
    }, 'PRD attached to task');

    return true;
}

/**
 * Get pending PRDs for processing
 */
export function getPendingPRDs(): HealingPRD[] {
    return queueCache
        .filter(t => t.status === 'prd_ready' && t.prd)
        .map(t => t.prd!);
}

/**
 * Get queue status
 */
export function getQueueStatus(): HealingQueueStatus {
    const byStatus: Record<HealingTask['status'], number> = {
        queued: 0,
        analyzing: 0,
        prd_ready: 0,
        healing: 0,
        verifying: 0,
        completed: 0,
        failed: 0
    };

    for (const task of queueCache) {
        byStatus[task.status]++;
    }

    return {
        total: queueCache.length,
        byStatus,
        activeHealing: byStatus.analyzing + byStatus.healing + byStatus.verifying,
        successCount: byStatus.completed,
        failedCount: byStatus.failed
    };
}

/**
 * Get all tasks (for debugging/admin)
 */
export function getAllTasks(): HealingTask[] {
    return [...queueCache];
}

/**
 * Clear completed tasks
 */
export async function clearCompletedTasks(
    config?: Partial<QueueConfig>
): Promise<number> {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    const before = queueCache.length;
    queueCache = queueCache.filter(t =>
        t.status !== 'completed' && t.status !== 'failed'
    );
    const removed = before - queueCache.length;

    await persistQueue(cfg);

    healerLog.info({ removed }, 'Cleared completed tasks');

    return removed;
}

/**
 * Get error statistics
 */
export function getErrorStats(): {
    totalErrors: number;
    uniqueErrors: number;
    mostFrequent: Array<{ hash: string; count: number; lastSeen: string }>;
} {
    const entries = Array.from(dedupeCache.values());

    return {
        totalErrors: entries.reduce((sum, e) => sum + e.count, 0),
        uniqueErrors: entries.length,
        mostFrequent: entries
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(e => ({ hash: e.hash, count: e.count, lastSeen: e.lastSeen }))
    };
}

export default {
    initQueue,
    hashError,
    isRecentlyHealed,
    markHealingStarted,
    markHealingCompleted,
    enqueueHealingTask,
    getNextTask,
    updateTaskStatus,
    getTask,
    setTaskPRD,
    getPendingPRDs,
    getQueueStatus,
    getAllTasks,
    clearCompletedTasks,
    getErrorStats
};
