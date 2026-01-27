/**
 * A2A Video Job Queue
 *
 * NATS-based job queue for distributed render processing.
 * Supports prioritization, retries, and progress tracking.
 */

import type { RenderRequest, RenderJob, RenderStatus } from '../types.js';

// Dynamic NATS import
let natsModule: typeof import('nats') | null = null;
let natsConnection: import('nats').NatsConnection | null = null;
let jetStreamManager: import('nats').JetStreamManager | null = null;
let jetStreamClient: import('nats').JetStreamClient | null = null;

async function getNats() {
  if (!natsModule) {
    natsModule = await import('nats');
  }
  return natsModule;
}

export interface QueueConfig {
  natsUrl: string;
  streamName?: string;
  consumerName?: string;
  maxRetries?: number;
  retryDelay?: number; // milliseconds
  ackWait?: number; // milliseconds
  maxConcurrent?: number;
}

export interface QueuedJob {
  id: string;
  request: RenderRequest;
  priority: number;
  createdAt: Date;
  attempts: number;
  lastAttemptAt?: Date;
  error?: string;
}

export interface JobProgress {
  jobId: string;
  status: RenderStatus;
  progress: number;
  currentFrame?: number;
  totalFrames?: number;
  estimatedTimeRemaining?: number;
  error?: string;
}

const DEFAULT_CONFIG: Partial<QueueConfig> = {
  streamName: 'A2A_VIDEO_JOBS',
  consumerName: 'a2a-video-workers',
  maxRetries: 3,
  retryDelay: 5000,
  ackWait: 300000, // 5 minutes
  maxConcurrent: 4,
};

// Subject names
const SUBJECTS = {
  jobs: 'video.jobs.>',
  newJob: 'video.jobs.new',
  priority: (p: number) => `video.jobs.priority.${p}`,
  progress: 'video.progress.>',
  jobProgress: (id: string) => `video.progress.${id}`,
  events: 'video.events.>',
  jobEvent: (id: string, event: string) => `video.events.${id}.${event}`,
};

/**
 * Initialize NATS connection and JetStream.
 */
export async function initializeQueue(config: QueueConfig): Promise<void> {
  const nats = await getNats();

  // Connect to NATS
  natsConnection = await nats.connect({
    servers: config.natsUrl,
    name: 'a2a-video-queue',
  });

  // Get JetStream manager
  jetStreamManager = await natsConnection.jetstreamManager();

  // Create or update stream
  const streamConfig = {
    name: config.streamName || DEFAULT_CONFIG.streamName!,
    subjects: [SUBJECTS.jobs, SUBJECTS.progress, SUBJECTS.events],
    retention: 'limits' as const,
    max_msgs: 100000,
    max_bytes: 1024 * 1024 * 1024, // 1GB
    max_age: 7 * 24 * 60 * 60 * 1e9, // 7 days in nanoseconds
    storage: 'file' as const,
    replicas: 1,
    allow_rollup_hdrs: true,
    deny_delete: false,
  };

  try {
    await jetStreamManager.streams.add(streamConfig);
  } catch (e) {
    // Stream might already exist, try to update
    if ((e as Error).message.includes('stream name already in use')) {
      await jetStreamManager.streams.update(config.streamName || DEFAULT_CONFIG.streamName!, streamConfig);
    } else {
      throw e;
    }
  }

  // Get JetStream client
  jetStreamClient = natsConnection.jetstream();

  console.log(`[A2A Video Queue] Connected to NATS at ${config.natsUrl}`);
}

/**
 * Close NATS connection.
 */
export async function closeQueue(): Promise<void> {
  if (natsConnection) {
    await natsConnection.drain();
    await natsConnection.close();
    natsConnection = null;
    jetStreamManager = null;
    jetStreamClient = null;
  }
}

/**
 * Enqueue a render job.
 */
export async function enqueueJob(
  request: RenderRequest,
  options: { priority?: number; delayMs?: number } = {}
): Promise<string> {
  if (!jetStreamClient) {
    throw new Error('Queue not initialized. Call initializeQueue() first.');
  }

  const nats = await getNats();
  const sc = nats.StringCodec();

  const job: QueuedJob = {
    id: request.id || crypto.randomUUID(),
    request,
    priority: options.priority ?? 5,
    createdAt: new Date(),
    attempts: 0,
  };

  // Encode job
  const payload = sc.encode(JSON.stringify(job));

  // Publish to appropriate subject
  const subject = SUBJECTS.priority(job.priority);

  const pubOpts: import('nats').JetStreamPublishOptions = {
    msgID: job.id,
  };

  if (options.delayMs) {
    // Schedule for future delivery
    pubOpts.headers = nats.headers();
    pubOpts.headers.append('Nats-Deliver-After', `${options.delayMs}ms`);
  }

  await jetStreamClient.publish(subject, payload, pubOpts);

  console.log(`[A2A Video Queue] Enqueued job ${job.id} with priority ${job.priority}`);

  return job.id;
}

/**
 * Update job progress.
 */
export async function updateJobProgress(progress: JobProgress): Promise<void> {
  if (!jetStreamClient) {
    throw new Error('Queue not initialized.');
  }

  const nats = await getNats();
  const sc = nats.StringCodec();

  const subject = SUBJECTS.jobProgress(progress.jobId);
  const payload = sc.encode(JSON.stringify(progress));

  await jetStreamClient.publish(subject, payload);
}

/**
 * Publish a job event.
 */
export async function publishJobEvent(
  jobId: string,
  event: 'started' | 'completed' | 'failed' | 'cancelled',
  data?: Record<string, unknown>
): Promise<void> {
  if (!jetStreamClient) {
    throw new Error('Queue not initialized.');
  }

  const nats = await getNats();
  const sc = nats.StringCodec();

  const subject = SUBJECTS.jobEvent(jobId, event);
  const payload = sc.encode(
    JSON.stringify({
      jobId,
      event,
      timestamp: new Date().toISOString(),
      ...data,
    })
  );

  await jetStreamClient.publish(subject, payload);
}

/**
 * Get job by ID from the stream.
 */
export async function getJob(jobId: string): Promise<QueuedJob | null> {
  if (!jetStreamManager || !jetStreamClient) {
    throw new Error('Queue not initialized.');
  }

  const nats = await getNats();
  const sc = nats.StringCodec();

  // Get the stream
  const stream = await jetStreamManager.streams.get(DEFAULT_CONFIG.streamName!);

  // Find message by ID
  try {
    const msg = await stream.getMessage({ last_by_subj: `video.jobs.priority.*.${jobId}` });
    if (msg) {
      return JSON.parse(sc.decode(msg.data)) as QueuedJob;
    }
  } catch {
    // Message not found
  }

  return null;
}

/**
 * Cancel a job.
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  await publishJobEvent(jobId, 'cancelled');
  return true;
}

/**
 * Subscribe to job progress updates.
 */
export async function subscribeToProgress(
  jobId: string,
  callback: (progress: JobProgress) => void
): Promise<() => void> {
  if (!natsConnection) {
    throw new Error('Queue not initialized.');
  }

  const nats = await getNats();
  const sc = nats.StringCodec();

  const subject = SUBJECTS.jobProgress(jobId);
  const sub = natsConnection.subscribe(subject);

  (async () => {
    for await (const msg of sub) {
      try {
        const progress = JSON.parse(sc.decode(msg.data)) as JobProgress;
        callback(progress);
      } catch (e) {
        console.error('[A2A Video Queue] Failed to parse progress:', e);
      }
    }
  })();

  return () => sub.unsubscribe();
}

/**
 * Subscribe to job events.
 */
export async function subscribeToJobEvents(
  jobId: string,
  callback: (event: { event: string; data: unknown }) => void
): Promise<() => void> {
  if (!natsConnection) {
    throw new Error('Queue not initialized.');
  }

  const nats = await getNats();
  const sc = nats.StringCodec();

  const subject = `video.events.${jobId}.>`;
  const sub = natsConnection.subscribe(subject);

  (async () => {
    for await (const msg of sub) {
      try {
        const data = JSON.parse(sc.decode(msg.data));
        callback({ event: msg.subject.split('.').pop() || 'unknown', data });
      } catch (e) {
        console.error('[A2A Video Queue] Failed to parse event:', e);
      }
    }
  })();

  return () => sub.unsubscribe();
}

/**
 * Get queue statistics.
 */
export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}> {
  if (!jetStreamManager) {
    throw new Error('Queue not initialized.');
  }

  const stream = await jetStreamManager.streams.get(DEFAULT_CONFIG.streamName!);
  const info = await stream.info();

  return {
    pending: info.state.messages,
    processing: 0, // Would need consumer info
    completed: 0, // Would need to track separately
    failed: 0, // Would need to track separately
  };
}

/**
 * Purge completed jobs older than specified age.
 */
export async function purgeOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
  if (!jetStreamManager) {
    throw new Error('Queue not initialized.');
  }

  const stream = await jetStreamManager.streams.get(DEFAULT_CONFIG.streamName!);

  // Purge messages older than maxAge
  const cutoff = Date.now() - maxAgeMs;
  const result = await stream.purge({
    filter: SUBJECTS.events,
    keep: 0,
  });

  return result.purged;
}

/**
 * Create a priority queue manager.
 */
export function createPriorityQueue(config: QueueConfig) {
  return {
    initialize: () => initializeQueue(config),
    close: closeQueue,
    enqueue: enqueueJob,
    cancel: cancelJob,
    getJob,
    updateProgress: updateJobProgress,
    publishEvent: publishJobEvent,
    subscribeToProgress,
    subscribeToJobEvents,
    getStats: getQueueStats,
    purgeOld: purgeOldJobs,
  };
}
