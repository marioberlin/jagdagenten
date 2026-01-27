/**
 * A2A Video Job Worker
 *
 * Processes render jobs from the NATS queue.
 * Supports concurrent processing with resource limits.
 */

import type { RenderRequest, RenderJob, RenderStatus } from '../types.js';
import type { QueuedJob, JobProgress, QueueConfig } from './queue.js';
import {
  updateJobProgress,
  publishJobEvent,
} from './queue.js';

// Dynamic NATS import
let natsModule: typeof import('nats') | null = null;

async function getNats() {
  if (!natsModule) {
    natsModule = await import('nats');
  }
  return natsModule;
}

export interface WorkerConfig extends QueueConfig {
  workerId?: string;
  maxConcurrent?: number;
  pollInterval?: number; // milliseconds
  onJobStart?: (job: QueuedJob) => Promise<void>;
  onJobComplete?: (job: QueuedJob, result: RenderJob) => Promise<void>;
  onJobError?: (job: QueuedJob, error: Error) => Promise<void>;
}

export interface WorkerStats {
  workerId: string;
  startedAt: Date;
  jobsProcessed: number;
  jobsFailed: number;
  currentJobs: string[];
  lastJobAt?: Date;
}

type RenderProcessor = (request: RenderRequest, onProgress: (progress: number, frame?: number) => void) => Promise<RenderJob>;

/**
 * Create a job worker.
 */
export function createWorker(
  config: WorkerConfig,
  processRender: RenderProcessor
) {
  let natsConnection: import('nats').NatsConnection | null = null;
  let jetStreamClient: import('nats').JetStreamClient | null = null;
  let consumer: import('nats').Consumer | null = null;
  let isRunning = false;
  let processingJobs = new Map<string, QueuedJob>();

  const workerId = config.workerId || `worker-${crypto.randomUUID().slice(0, 8)}`;
  const maxConcurrent = config.maxConcurrent || 4;
  const maxRetries = config.maxRetries || 3;

  const stats: WorkerStats = {
    workerId,
    startedAt: new Date(),
    jobsProcessed: 0,
    jobsFailed: 0,
    currentJobs: [],
  };

  /**
   * Initialize worker connection.
   */
  async function start(): Promise<void> {
    const nats = await getNats();

    natsConnection = await nats.connect({
      servers: config.natsUrl,
      name: `a2a-video-worker-${workerId}`,
    });

    jetStreamClient = natsConnection.jetstream();

    // Get or create consumer
    const jsm = await natsConnection.jetstreamManager();

    const consumerConfig = {
      durable_name: `${config.consumerName || 'a2a-video-workers'}-${workerId}`,
      ack_policy: 'explicit' as const,
      ack_wait: config.ackWait || 300000000000, // 5 minutes in nanoseconds
      max_ack_pending: maxConcurrent,
      deliver_policy: 'all' as const,
      filter_subject: 'video.jobs.priority.>',
    };

    try {
      await jsm.consumers.add(config.streamName || 'A2A_VIDEO_JOBS', consumerConfig);
    } catch (e) {
      if (!(e as Error).message.includes('consumer already exists')) {
        throw e;
      }
    }

    consumer = await jetStreamClient.consumers.get(
      config.streamName || 'A2A_VIDEO_JOBS',
      consumerConfig.durable_name
    );

    isRunning = true;
    console.log(`[A2A Video Worker ${workerId}] Started`);

    // Start processing loop
    processLoop();
  }

  /**
   * Main processing loop.
   */
  async function processLoop(): Promise<void> {
    const nats = await getNats();
    const sc = nats.StringCodec();

    while (isRunning && consumer) {
      // Check if we can take more jobs
      if (processingJobs.size >= maxConcurrent) {
        await new Promise((resolve) => setTimeout(resolve, config.pollInterval || 1000));
        continue;
      }

      try {
        // Fetch next message
        const messages = await consumer.fetch({
          max_messages: 1,
          expires: 5000,
        });

        for await (const msg of messages) {
          if (!isRunning) break;

          try {
            const job = JSON.parse(sc.decode(msg.data)) as QueuedJob;

            // Check if already processing
            if (processingJobs.has(job.id)) {
              msg.nak();
              continue;
            }

            // Start processing
            processingJobs.set(job.id, job);
            stats.currentJobs.push(job.id);

            // Process in background
            processJob(job, msg).catch((e) => {
              console.error(`[A2A Video Worker ${workerId}] Unhandled error:`, e);
            });
          } catch (e) {
            console.error(`[A2A Video Worker ${workerId}] Failed to parse job:`, e);
            msg.term();
          }
        }
      } catch (e) {
        if ((e as Error).message !== 'timeout') {
          console.error(`[A2A Video Worker ${workerId}] Fetch error:`, e);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Process a single job.
   */
  async function processJob(
    job: QueuedJob,
    msg: import('nats').JsMsg
  ): Promise<void> {
    const startTime = Date.now();

    try {
      console.log(`[A2A Video Worker ${workerId}] Processing job ${job.id}`);

      // Notify start
      await publishJobEvent(job.id, 'started', { workerId });
      await config.onJobStart?.(job);

      // Update progress
      await updateJobProgress({
        jobId: job.id,
        status: 'rendering',
        progress: 0,
      });

      // Process render
      const result = await processRender(
        job.request,
        async (progress, frame) => {
          await updateJobProgress({
            jobId: job.id,
            status: 'rendering',
            progress,
            currentFrame: frame,
            totalFrames: job.request.durationInFrames,
          });
        }
      );

      // Job completed
      await updateJobProgress({
        jobId: job.id,
        status: 'completed',
        progress: 100,
      });

      await publishJobEvent(job.id, 'completed', {
        workerId,
        duration: Date.now() - startTime,
        outputUrl: result.outputUrl,
      });

      await config.onJobComplete?.(job, result);

      stats.jobsProcessed++;
      stats.lastJobAt = new Date();

      // Acknowledge message
      msg.ack();

      console.log(`[A2A Video Worker ${workerId}] Completed job ${job.id}`);
    } catch (error) {
      const err = error as Error;
      console.error(`[A2A Video Worker ${workerId}] Job ${job.id} failed:`, err);

      // Update job attempts
      job.attempts++;
      job.lastAttemptAt = new Date();
      job.error = err.message;

      // Update progress
      await updateJobProgress({
        jobId: job.id,
        status: 'failed',
        progress: 0,
        error: err.message,
      });

      // Check if should retry
      if (job.attempts < maxRetries) {
        console.log(`[A2A Video Worker ${workerId}] Retrying job ${job.id} (attempt ${job.attempts}/${maxRetries})`);
        msg.nak(config.retryDelay || 5000);
      } else {
        await publishJobEvent(job.id, 'failed', {
          workerId,
          error: err.message,
          attempts: job.attempts,
        });

        await config.onJobError?.(job, err);
        stats.jobsFailed++;

        // Terminate message (no more retries)
        msg.term();
      }
    } finally {
      processingJobs.delete(job.id);
      stats.currentJobs = stats.currentJobs.filter((id) => id !== job.id);
    }
  }

  /**
   * Stop the worker gracefully.
   */
  async function stop(): Promise<void> {
    console.log(`[A2A Video Worker ${workerId}] Stopping...`);
    isRunning = false;

    // Wait for current jobs to complete (with timeout)
    const timeout = 60000; // 1 minute
    const start = Date.now();

    while (processingJobs.size > 0 && Date.now() - start < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (processingJobs.size > 0) {
      console.warn(`[A2A Video Worker ${workerId}] Forcing stop with ${processingJobs.size} jobs in progress`);
    }

    if (natsConnection) {
      await natsConnection.drain();
      await natsConnection.close();
      natsConnection = null;
      jetStreamClient = null;
      consumer = null;
    }

    console.log(`[A2A Video Worker ${workerId}] Stopped`);
  }

  /**
   * Get worker statistics.
   */
  function getStats(): WorkerStats {
    return { ...stats };
  }

  /**
   * Check if worker is healthy.
   */
  function isHealthy(): boolean {
    return isRunning && natsConnection !== null;
  }

  return {
    start,
    stop,
    getStats,
    isHealthy,
    get workerId() {
      return workerId;
    },
    get isRunning() {
      return isRunning;
    },
    get currentJobCount() {
      return processingJobs.size;
    },
  };
}

/**
 * Create a worker pool.
 */
export function createWorkerPool(
  config: WorkerConfig,
  processRender: RenderProcessor,
  poolSize: number = 2
) {
  const workers: ReturnType<typeof createWorker>[] = [];

  return {
    /**
     * Start all workers.
     */
    async start(): Promise<void> {
      for (let i = 0; i < poolSize; i++) {
        const worker = createWorker(
          {
            ...config,
            workerId: `${config.workerId || 'pool'}-${i}`,
          },
          processRender
        );
        workers.push(worker);
        await worker.start();
      }
      console.log(`[A2A Video Worker Pool] Started ${poolSize} workers`);
    },

    /**
     * Stop all workers.
     */
    async stop(): Promise<void> {
      await Promise.all(workers.map((w) => w.stop()));
      workers.length = 0;
      console.log(`[A2A Video Worker Pool] All workers stopped`);
    },

    /**
     * Get pool statistics.
     */
    getStats() {
      return {
        poolSize,
        workers: workers.map((w) => w.getStats()),
        totalProcessed: workers.reduce((sum, w) => sum + w.getStats().jobsProcessed, 0),
        totalFailed: workers.reduce((sum, w) => sum + w.getStats().jobsFailed, 0),
        currentJobs: workers.reduce((sum, w) => sum + w.currentJobCount, 0),
      };
    },

    /**
     * Check if pool is healthy.
     */
    isHealthy(): boolean {
      return workers.every((w) => w.isHealthy());
    },
  };
}
