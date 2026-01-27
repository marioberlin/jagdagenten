/**
 * A2A Video Jobs Module
 *
 * NATS-based job queue and workers for distributed render processing.
 */

export {
  initializeQueue,
  closeQueue,
  enqueueJob,
  updateJobProgress,
  publishJobEvent,
  getJob,
  cancelJob,
  subscribeToProgress,
  subscribeToJobEvents,
  getQueueStats,
  purgeOldJobs,
  createPriorityQueue,
  type QueueConfig,
  type QueuedJob,
  type JobProgress,
} from './queue.js';

export {
  createWorker,
  createWorkerPool,
  type WorkerConfig,
  type WorkerStats,
} from './worker.js';
