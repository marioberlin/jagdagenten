/**
 * Self-Healing Production Loop
 *
 * Main entry point for the self-healing system.
 *
 * Flow:
 * Client Error → Audit API → Error Analyzer → PRD Generation → Healing Queue → Fix
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 4.2 Self-Healing Production Loop
 */

import type {
    ErrorReport,
    HealingPRD,
    HealingTask,
    HealingResult,
    HealingQueueStatus
} from './types.js';
import {
    initQueue,
    enqueueHealingTask,
    getNextTask,
    updateTaskStatus,
    setTaskPRD,
    getQueueStatus,
    getAllTasks,
    clearCompletedTasks,
    getErrorStats,
    hashError
} from './queue.js';
import { analyzeError, validatePRD, enrichErrorContext } from './analyzer.js';
import { buildPRDescriptionPrompt, buildCommitMessagePrompt } from './prompts.js';
import { componentLoggers } from '../logger.js';

const healerLog = componentLoggers.http;

// Re-export types
export type {
    ErrorReport,
    HealingPRD,
    HealingTask,
    HealingResult,
    HealingQueueStatus
};

// Re-export utilities
export {
    hashError,
    getQueueStatus,
    getAllTasks,
    getErrorStats
};

/**
 * AI provider function type
 */
type AIProvider = (messages: Array<{ role: string; content: string }>) => Promise<string>;

/**
 * Healer configuration
 */
interface HealerConfig {
    /** AI provider for analysis */
    aiProvider?: AIProvider;
    /** Enable automatic healing */
    autoHeal: boolean;
    /** Processing interval in ms */
    processingInterval: number;
    /** Maximum concurrent healing tasks */
    maxConcurrent: number;
    /** Notification callback */
    onNotify?: (event: string, data: unknown) => void;
}

const DEFAULT_CONFIG: HealerConfig = {
    autoHeal: false,
    processingInterval: 60000, // 1 minute
    maxConcurrent: 1
};

let config: HealerConfig = { ...DEFAULT_CONFIG };
let processingInterval: NodeJS.Timeout | null = null;
let isProcessing = false;

/**
 * Initialize the self-healing system
 */
export async function initHealer(userConfig?: Partial<HealerConfig>): Promise<void> {
    config = { ...DEFAULT_CONFIG, ...userConfig };

    await initQueue();

    healerLog.info({
        autoHeal: config.autoHeal,
        processingInterval: config.processingInterval
    }, 'Self-healing system initialized');

    if (config.autoHeal) {
        startAutoHealing();
    }
}

/**
 * Submit an error for healing
 *
 * @param error - Error report to heal
 * @returns Healing task or null if deduplicated
 */
export async function submitError(
    error: ErrorReport
): Promise<HealingTask | null> {
    healerLog.info({
        errorType: error.type,
        component: error.context.componentName,
        message: error.message.slice(0, 100)
    }, 'Error submitted for healing');

    // Enqueue the task
    const task = await enqueueHealingTask(error);

    if (!task) {
        healerLog.info({
            errorHash: hashError(error)
        }, 'Error deduplicated or queue full');
        return null;
    }

    // Notify if configured
    config.onNotify?.('error_submitted', {
        taskId: task.id,
        error: error.message
    });

    // If auto-heal is enabled, trigger immediate processing
    if (config.autoHeal) {
        processNextTask().catch(err => {
            healerLog.error({ error: err.message }, 'Auto-heal processing failed');
        });
    }

    return task;
}

/**
 * Process the next task in the queue
 */
export async function processNextTask(): Promise<HealingResult | null> {
    if (isProcessing) {
        return null;
    }

    const task = await getNextTask();
    if (!task) {
        return null;
    }

    isProcessing = true;
    const startTime = Date.now();

    try {
        healerLog.info({ taskId: task.id }, 'Processing healing task');

        // Update status to analyzing
        await updateTaskStatus(task.id, 'analyzing');

        // Analyze error and generate PRD
        const prd = await analyzeError(task.errorReport, {
            aiProvider: config.aiProvider,
            mockMode: !config.aiProvider
        });

        if (!prd) {
            await updateTaskStatus(task.id, 'failed', {
                lastError: 'Failed to generate PRD'
            });
            return {
                success: false,
                error: 'Failed to generate PRD',
                duration: Date.now() - startTime
            };
        }

        // Validate PRD
        const validation = validatePRD(prd);
        if (!validation.valid) {
            await updateTaskStatus(task.id, 'failed', {
                lastError: `Invalid PRD: ${validation.issues.join(', ')}`
            });
            return {
                success: false,
                error: `Invalid PRD: ${validation.issues.join(', ')}`,
                duration: Date.now() - startTime
            };
        }

        // Attach PRD to task
        await setTaskPRD(task.id, prd);

        healerLog.info({
            taskId: task.id,
            prdId: prd.id,
            stories: prd.stories.length
        }, 'PRD generated and ready for healing');

        // Notify
        config.onNotify?.('prd_ready', {
            taskId: task.id,
            prd
        });

        // In auto mode, continue to healing
        // For now, we just generate the PRD - actual code fixes would require
        // more infrastructure (git integration, CI/CD, etc.)
        await updateTaskStatus(task.id, 'prd_ready');

        return {
            success: true,
            duration: Date.now() - startTime
        };

    } catch (error) {
        healerLog.error({
            taskId: task.id,
            error: (error as Error).message
        }, 'Healing task failed');

        await updateTaskStatus(task.id, 'failed', {
            lastError: (error as Error).message
        });

        return {
            success: false,
            error: (error as Error).message,
            duration: Date.now() - startTime
        };
    } finally {
        isProcessing = false;
    }
}

/**
 * Start automatic healing loop
 */
export function startAutoHealing(): void {
    if (processingInterval) {
        return;
    }

    healerLog.info({ interval: config.processingInterval }, 'Starting auto-healing loop');

    processingInterval = setInterval(async () => {
        const status = getQueueStatus();

        if (status.byStatus.queued > 0 || status.byStatus.prd_ready > 0) {
            healerLog.debug({
                queued: status.byStatus.queued,
                ready: status.byStatus.prd_ready
            }, 'Processing healing queue');

            await processNextTask();
        }
    }, config.processingInterval);
}

/**
 * Stop automatic healing loop
 */
export function stopAutoHealing(): void {
    if (processingInterval) {
        clearInterval(processingInterval);
        processingInterval = null;
        healerLog.info('Auto-healing loop stopped');
    }
}

/**
 * Process all pending tasks (for manual triggering)
 */
export async function processAllPending(): Promise<HealingResult[]> {
    const results: HealingResult[] = [];

    let task = await getNextTask();
    while (task) {
        const result = await processNextTask();
        if (result) {
            results.push(result);
        }
        task = await getNextTask();
    }

    healerLog.info({
        processed: results.length,
        success: results.filter(r => r.success).length
    }, 'Processed all pending tasks');

    return results;
}

/**
 * Get healing status summary
 */
export function getHealingStatus(): {
    queue: HealingQueueStatus;
    errors: ReturnType<typeof getErrorStats>;
    autoHealEnabled: boolean;
    isProcessing: boolean;
} {
    return {
        queue: getQueueStatus(),
        errors: getErrorStats(),
        autoHealEnabled: config.autoHeal && processingInterval !== null,
        isProcessing
    };
}

/**
 * Clear completed and failed tasks
 */
export async function clearCompleted(): Promise<number> {
    return clearCompletedTasks();
}

/**
 * Shutdown the healer gracefully
 */
export async function shutdownHealer(): Promise<void> {
    stopAutoHealing();

    // Wait for any in-progress task to complete
    let waitCount = 0;
    while (isProcessing && waitCount < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        waitCount++;
    }

    healerLog.info('Self-healing system shutdown complete');
}

// Default export
export default {
    initHealer,
    submitError,
    processNextTask,
    processAllPending,
    startAutoHealing,
    stopAutoHealing,
    getHealingStatus,
    clearCompleted,
    shutdownHealer,
    hashError,
    getQueueStatus,
    getAllTasks,
    getErrorStats
};
