/**
 * Video Render Queue
 *
 * Connects the video NATS job queue with A2A task state management.
 * Handles job distribution, worker coordination, and state synchronization.
 */

import { EventEmitter } from 'events';
import type { CompositionState, RenderJobState } from './video-render.js';
import type { RenderOptions, A2AArtifact } from './video-render-pipeline.js';

// ============================================================================
// Types
// ============================================================================

export interface QueuedJob {
  jobId: string;
  taskId: string;
  compositionId: string;
  composition: CompositionState;
  options: RenderOptions;
  priority: number;
  createdAt: Date;
  startedAt?: Date;
  workerId?: string;
}

export interface WorkerStatus {
  workerId: string;
  status: 'idle' | 'busy' | 'offline';
  currentJobId?: string;
  lastHeartbeat: Date;
  capabilities: {
    maxResolution: number;
    gpuAcceleration: boolean;
    supportedCodecs: string[];
  };
}

export interface A2ATaskStateUpdate {
  taskId: string;
  state: 'submitted' | 'working' | 'input-required' | 'completed' | 'failed' | 'cancelled';
  message?: string;
  artifacts?: A2AArtifact[];
}

export type QueueEventType =
  | 'job:queued'
  | 'job:started'
  | 'job:progress'
  | 'job:completed'
  | 'job:failed'
  | 'job:cancelled'
  | 'worker:registered'
  | 'worker:heartbeat'
  | 'worker:offline';

// ============================================================================
// Video Render Queue
// ============================================================================

export class VideoRenderQueue extends EventEmitter {
  private jobs: Map<string, QueuedJob> = new Map();
  private workers: Map<string, WorkerStatus> = new Map();
  private jobQueue: string[] = []; // Ordered by priority
  private taskCallbacks: Map<string, (update: A2ATaskStateUpdate) => void> = new Map();

  // NATS subjects (would be used in production)
  static readonly SUBJECTS = {
    JOB_SUBMIT: 'a2a.video.job.submit',
    JOB_PROGRESS: 'a2a.video.job.progress',
    JOB_COMPLETE: 'a2a.video.job.complete',
    JOB_CANCEL: 'a2a.video.job.cancel',
    WORKER_REGISTER: 'a2a.video.worker.register',
    WORKER_HEARTBEAT: 'a2a.video.worker.heartbeat',
    TASK_STATE: 'a2a.video.task.state',
  } as const;

  constructor() {
    super();
    this.startWorkerMonitor();
  }

  /**
   * Submit a render job to the queue.
   */
  async submitJob(
    taskId: string,
    composition: CompositionState,
    options: RenderOptions,
    priority: number = 5,
    onStateUpdate?: (update: A2ATaskStateUpdate) => void
  ): Promise<QueuedJob> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const job: QueuedJob = {
      jobId,
      taskId,
      compositionId: composition.id,
      composition,
      options,
      priority,
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job);

    // Register callback for task state updates
    if (onStateUpdate) {
      this.taskCallbacks.set(taskId, onStateUpdate);
    }

    // Insert into priority queue
    this.insertByPriority(jobId, priority);

    // Emit A2A task state update
    this.emitTaskState(taskId, 'submitted', 'Job queued for rendering');

    // Emit queue event
    this.emit('job:queued', job);

    // Try to assign to an available worker
    this.tryAssignJob();

    return job;
  }

  /**
   * Cancel a job.
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    // Remove from queue if still pending
    const queueIndex = this.jobQueue.indexOf(jobId);
    if (queueIndex >= 0) {
      this.jobQueue.splice(queueIndex, 1);
    }

    // Emit cancellation
    this.emit('job:cancelled', job);
    this.emitTaskState(job.taskId, 'cancelled', 'Job cancelled');

    // In production, would publish to NATS to notify worker
    // await this.nats.publish(SUBJECTS.JOB_CANCEL, { jobId });

    return true;
  }

  /**
   * Get job status.
   */
  getJob(jobId: string): QueuedJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get queue status.
   */
  getQueueStatus(): {
    pending: number;
    active: number;
    workers: number;
    idleWorkers: number;
  } {
    const activeJobs = Array.from(this.jobs.values()).filter(j => j.startedAt && !this.isJobComplete(j));
    const idleWorkers = Array.from(this.workers.values()).filter(w => w.status === 'idle');

    return {
      pending: this.jobQueue.length,
      active: activeJobs.length,
      workers: this.workers.size,
      idleWorkers: idleWorkers.length,
    };
  }

  // ==========================================================================
  // Worker Management
  // ==========================================================================

  /**
   * Register a worker.
   */
  registerWorker(workerId: string, capabilities: WorkerStatus['capabilities']): void {
    this.workers.set(workerId, {
      workerId,
      status: 'idle',
      lastHeartbeat: new Date(),
      capabilities,
    });

    this.emit('worker:registered', { workerId, capabilities });
    this.tryAssignJob();
  }

  /**
   * Handle worker heartbeat.
   */
  handleHeartbeat(workerId: string, currentJobId?: string): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    worker.lastHeartbeat = new Date();
    worker.currentJobId = currentJobId;
    worker.status = currentJobId ? 'busy' : 'idle';

    this.emit('worker:heartbeat', { workerId, currentJobId });
  }

  /**
   * Handle job progress from worker.
   */
  handleJobProgress(
    jobId: string,
    progress: number,
    currentFrame: number,
    status: 'rendering' | 'encoding',
    previewFrame?: string
  ): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const progressUpdate: A2AArtifact = {
      artifactId: `progress-${jobId}`,
      name: 'Render Progress',
      parts: [{
        type: 'data',
        data: {
          jobId,
          status,
          progress,
          currentFrame,
          totalFrames: job.composition.durationInFrames,
          previewFrame,
        },
      }],
      append: true,
      lastChunk: false,
    };

    this.emit('job:progress', { job, progress, currentFrame });
    this.emitTaskState(job.taskId, 'working', `Rendering: ${Math.round(progress * 100)}%`, [progressUpdate]);
  }

  /**
   * Handle job completion from worker.
   */
  handleJobComplete(
    jobId: string,
    outputUri: string,
    duration: number,
    fileSize: number
  ): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    // Free the worker
    if (job.workerId) {
      const worker = this.workers.get(job.workerId);
      if (worker) {
        worker.status = 'idle';
        worker.currentJobId = undefined;
      }
    }

    // Create output artifact
    const outputArtifact: A2AArtifact = {
      artifactId: `output-${jobId}`,
      name: 'Rendered Video',
      parts: [{
        type: 'file',
        file: {
          name: `output.${job.options.format}`,
          mimeType: this.getMimeType(job.options.format),
          uri: outputUri,
        },
      }],
    };

    this.emit('job:completed', { job, outputUri, duration, fileSize });
    this.emitTaskState(job.taskId, 'completed', 'Render complete', [outputArtifact]);

    // Try to assign next job
    this.tryAssignJob();
  }

  /**
   * Handle job failure from worker.
   */
  handleJobFailed(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    // Free the worker
    if (job.workerId) {
      const worker = this.workers.get(job.workerId);
      if (worker) {
        worker.status = 'idle';
        worker.currentJobId = undefined;
      }
    }

    this.emit('job:failed', { job, error });
    this.emitTaskState(job.taskId, 'failed', error);

    // Try to assign next job
    this.tryAssignJob();
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private insertByPriority(jobId: string, priority: number): void {
    // Higher priority = earlier in queue
    const job = this.jobs.get(jobId);
    if (!job) return;

    let insertIndex = this.jobQueue.length;
    for (let i = 0; i < this.jobQueue.length; i++) {
      const otherJob = this.jobs.get(this.jobQueue[i]);
      if (otherJob && priority > otherJob.priority) {
        insertIndex = i;
        break;
      }
    }

    this.jobQueue.splice(insertIndex, 0, jobId);
  }

  private tryAssignJob(): void {
    if (this.jobQueue.length === 0) return;

    // Find an idle worker
    const idleWorker = Array.from(this.workers.values()).find(w => w.status === 'idle');
    if (!idleWorker) return;

    // Get next job from queue
    const jobId = this.jobQueue.shift();
    if (!jobId) return;

    const job = this.jobs.get(jobId);
    if (!job) return;

    // Assign to worker
    job.startedAt = new Date();
    job.workerId = idleWorker.workerId;
    idleWorker.status = 'busy';
    idleWorker.currentJobId = jobId;

    // In production, would publish to NATS
    // await this.nats.publish(SUBJECTS.JOB_SUBMIT, { workerId: idleWorker.workerId, job });

    this.emit('job:started', { job, workerId: idleWorker.workerId });
    this.emitTaskState(job.taskId, 'working', 'Render started');

    // Simulate worker processing (for development)
    this.simulateWorkerProcessing(job, idleWorker.workerId);
  }

  private async simulateWorkerProcessing(job: QueuedJob, workerId: string): Promise<void> {
    const totalFrames = job.composition.durationInFrames;

    for (let frame = 0; frame < totalFrames; frame += 10) {
      await this.delay(100);

      const progress = (frame + 1) / totalFrames;
      const status = progress > 0.9 ? 'encoding' : 'rendering';

      this.handleJobProgress(job.jobId, progress, frame, status as 'rendering' | 'encoding');
    }

    // Complete
    await this.delay(200);
    this.handleJobComplete(
      job.jobId,
      `liquid://renders/${job.jobId}/output.${job.options.format}`,
      job.composition.durationInFrames / job.composition.fps,
      1024 * 1024 * 10 // 10MB placeholder
    );
  }

  private startWorkerMonitor(): void {
    // Check for offline workers every 30 seconds
    setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 1 minute

      for (const [workerId, worker] of this.workers) {
        if (now - worker.lastHeartbeat.getTime() > timeout) {
          worker.status = 'offline';
          this.emit('worker:offline', { workerId });

          // Requeue any jobs assigned to this worker
          if (worker.currentJobId) {
            const job = this.jobs.get(worker.currentJobId);
            if (job) {
              job.workerId = undefined;
              job.startedAt = undefined;
              this.insertByPriority(job.jobId, job.priority);
            }
          }
        }
      }
    }, 30000);

    // Register a simulated worker for development
    this.registerWorker('sim-worker-1', {
      maxResolution: 2160,
      gpuAcceleration: false,
      supportedCodecs: ['h264', 'vp9'],
    });
  }

  private emitTaskState(
    taskId: string,
    state: A2ATaskStateUpdate['state'],
    message?: string,
    artifacts?: A2AArtifact[]
  ): void {
    const update: A2ATaskStateUpdate = {
      taskId,
      state,
      message,
      artifacts,
    };

    // Call registered callback
    const callback = this.taskCallbacks.get(taskId);
    if (callback) {
      callback(update);
    }

    // Emit event for other listeners
    this.emit('task:state', update);
  }

  private isJobComplete(job: QueuedJob): boolean {
    // Check if job has completed by looking at task state
    // In production, this would check the actual job state
    return false;
  }

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      gif: 'image/gif',
      mov: 'video/quicktime',
      'png-sequence': 'application/zip',
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let queueInstance: VideoRenderQueue | null = null;

export function getVideoRenderQueue(): VideoRenderQueue {
  if (!queueInstance) {
    queueInstance = new VideoRenderQueue();
  }
  return queueInstance;
}
