/**
 * Media Storage Service
 * 
 * Production-grade storage for generated media with:
 * - PostgreSQL artifact storage (persistent metadata)
 * - Redis caching (fast lookups)
 * - Background job queue (async video generation)
 */

import { Pool } from 'pg';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
import type { WeatherCondition } from './types.js';

// ============================================================================
// Types
// ============================================================================

export interface MediaArtifact {
    id: string;
    cacheKey: string;
    destination: string;
    condition: WeatherCondition;
    type: 'image' | 'video';
    status: 'pending' | 'generating' | 'complete' | 'failed';
    filePath?: string;
    publicUrl?: string;
    prompt?: string;
    model?: string;
    error?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}

export interface JobInfo {
    id: string;
    type: 'image' | 'video';
    destination: string;
    condition: WeatherCondition;
    status: 'queued' | 'processing' | 'complete' | 'failed';
    progress?: number;
    error?: string;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}

// ============================================================================
// PostgreSQL Media Artifact Store
// ============================================================================

export class PostgresMediaStore {
    private pool: Pool | null = null;
    private initialized = false;
    private tableName = 'media_artifacts';

    async connect(connectionString: string): Promise<boolean> {
        try {
            this.pool = new Pool({
                connectionString,
                max: 10,
                idleTimeoutMillis: 30000
            });
            await this.pool.query('SELECT 1');
            await this.createTable();
            this.initialized = true;
            console.log('[MediaStore] PostgreSQL connected');
            return true;
        } catch (error) {
            console.warn('[MediaStore] PostgreSQL not available:', error);
            return false;
        }
    }

    private async createTable(): Promise<void> {
        if (!this.pool) return;

        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS ${this.tableName} (
                id VARCHAR(255) PRIMARY KEY,
                cache_key VARCHAR(255) UNIQUE NOT NULL,
                destination VARCHAR(100) NOT NULL,
                condition VARCHAR(50) NOT NULL,
                type VARCHAR(20) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                file_path VARCHAR(500),
                public_url VARCHAR(500),
                prompt TEXT,
                model VARCHAR(100),
                error TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                completed_at TIMESTAMPTZ
            )
        `);

        // Indexes for fast lookups
        await this.pool.query(`
            CREATE INDEX IF NOT EXISTS idx_${this.tableName}_cache_key
            ON ${this.tableName} (cache_key)
        `);
        await this.pool.query(`
            CREATE INDEX IF NOT EXISTS idx_${this.tableName}_status
            ON ${this.tableName} (status)
        `);
        await this.pool.query(`
            CREATE INDEX IF NOT EXISTS idx_${this.tableName}_dest_cond
            ON ${this.tableName} (destination, condition)
        `);
    }

    async get(cacheKey: string): Promise<MediaArtifact | null> {
        if (!this.pool) return null;

        const result = await this.pool.query(
            `SELECT * FROM ${this.tableName} WHERE cache_key = $1`,
            [cacheKey]
        );

        if (result.rows.length === 0) return null;
        return this.deserialize(result.rows[0]);
    }

    async getById(id: string): Promise<MediaArtifact | null> {
        if (!this.pool) return null;

        const result = await this.pool.query(
            `SELECT * FROM ${this.tableName} WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) return null;
        return this.deserialize(result.rows[0]);
    }

    async upsert(artifact: Partial<MediaArtifact> & { id: string; cacheKey: string }): Promise<void> {
        if (!this.pool) return;

        await this.pool.query(`
            INSERT INTO ${this.tableName} (
                id, cache_key, destination, condition, type, status,
                file_path, public_url, prompt, model, error, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (cache_key) DO UPDATE SET
                status = EXCLUDED.status,
                file_path = EXCLUDED.file_path,
                public_url = EXCLUDED.public_url,
                error = EXCLUDED.error,
                metadata = EXCLUDED.metadata,
                updated_at = NOW(),
                completed_at = CASE WHEN EXCLUDED.status = 'complete' THEN NOW() ELSE ${this.tableName}.completed_at END
        `, [
            artifact.id,
            artifact.cacheKey,
            artifact.destination || '',
            artifact.condition || 'night',
            artifact.type || 'image',
            artifact.status || 'pending',
            artifact.filePath || null,
            artifact.publicUrl || null,
            artifact.prompt || null,
            artifact.model || null,
            artifact.error || null,
            JSON.stringify(artifact.metadata || {})
        ]);
    }

    async updateStatus(cacheKey: string, status: MediaArtifact['status'], updates?: Partial<MediaArtifact>): Promise<void> {
        if (!this.pool) return;

        const fields = ['status = $2', 'updated_at = NOW()'];
        const values: unknown[] = [cacheKey, status];
        let paramIndex = 3;

        if (updates?.filePath) {
            fields.push(`file_path = $${paramIndex++}`);
            values.push(updates.filePath);
        }
        if (updates?.publicUrl) {
            fields.push(`public_url = $${paramIndex++}`);
            values.push(updates.publicUrl);
        }
        if (updates?.error) {
            fields.push(`error = $${paramIndex++}`);
            values.push(updates.error);
        }
        if (status === 'complete') {
            fields.push('completed_at = NOW()');
        }

        await this.pool.query(
            `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE cache_key = $1`,
            values
        );
    }

    async list(filter?: { type?: 'image' | 'video'; status?: string; limit?: number }): Promise<MediaArtifact[]> {
        if (!this.pool) return [];

        const conditions: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;

        if (filter?.type) {
            conditions.push(`type = $${paramIndex++}`);
            values.push(filter.type);
        }
        if (filter?.status) {
            conditions.push(`status = $${paramIndex++}`);
            values.push(filter.status);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const limit = filter?.limit || 100;
        values.push(limit);

        const result = await this.pool.query(
            `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex}`,
            values
        );

        return result.rows.map(row => this.deserialize(row));
    }

    private deserialize(row: Record<string, unknown>): MediaArtifact {
        return {
            id: row.id as string,
            cacheKey: row.cache_key as string,
            destination: row.destination as string,
            condition: row.condition as WeatherCondition,
            type: row.type as 'image' | 'video',
            status: row.status as MediaArtifact['status'],
            filePath: row.file_path as string | undefined,
            publicUrl: row.public_url as string | undefined,
            prompt: row.prompt as string | undefined,
            model: row.model as string | undefined,
            error: row.error as string | undefined,
            metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata as Record<string, unknown>,
            createdAt: new Date(row.created_at as string),
            updatedAt: new Date(row.updated_at as string),
            completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined
        };
    }

    async close(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
        }
    }
}

// ============================================================================
// Redis Media Cache
// ============================================================================

export class RedisMediaCache {
    private client: Redis | null = null;
    private prefix = 'media:';
    private ttl = 86400; // 24 hours

    async connect(url: string): Promise<boolean> {
        try {
            this.client = new Redis(url);
            await this.client.ping();
            console.log('[MediaCache] Redis connected');
            return true;
        } catch (error) {
            console.warn('[MediaCache] Redis not available:', error);
            return false;
        }
    }

    async get(cacheKey: string): Promise<MediaArtifact | null> {
        if (!this.client) return null;

        try {
            const data = await this.client.get(`${this.prefix}${cacheKey}`);
            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch {
            return null;
        }
    }

    async set(artifact: MediaArtifact): Promise<void> {
        if (!this.client) return;

        try {
            await this.client.setex(
                `${this.prefix}${artifact.cacheKey}`,
                this.ttl,
                JSON.stringify(artifact)
            );
        } catch (error) {
            console.error('[MediaCache] Set failed:', error);
        }
    }

    async delete(cacheKey: string): Promise<void> {
        if (!this.client) return;
        await this.client.del(`${this.prefix}${cacheKey}`);
    }

    async getJobStatus(jobId: string): Promise<JobInfo | null> {
        if (!this.client) return null;

        try {
            const data = await this.client.get(`job:${jobId}`);
            if (data) return JSON.parse(data);
            return null;
        } catch {
            return null;
        }
    }

    async setJobStatus(job: JobInfo): Promise<void> {
        if (!this.client) return;

        try {
            await this.client.setex(
                `job:${job.id}`,
                3600, // 1 hour
                JSON.stringify(job)
            );
        } catch (error) {
            console.error('[MediaCache] Job status set failed:', error);
        }
    }

    async close(): Promise<void> {
        if (this.client) {
            await this.client.quit();
        }
    }
}

// ============================================================================
// Background Job Queue
// ============================================================================

type JobHandler = (job: JobInfo) => Promise<void>;

export class MediaJobQueue extends EventEmitter {
    private queue: JobInfo[] = [];
    private processing = new Map<string, JobInfo>();
    private handlers: Map<string, JobHandler> = new Map();
    private maxConcurrent = 2; // Max concurrent video generations
    private isRunning = false;
    private cache: RedisMediaCache;

    constructor(cache: RedisMediaCache) {
        super();
        this.cache = cache;
    }

    registerHandler(type: 'image' | 'video', handler: JobHandler): void {
        this.handlers.set(type, handler);
    }

    async enqueue(job: Omit<JobInfo, 'status' | 'createdAt'>): Promise<string> {
        const fullJob: JobInfo = {
            ...job,
            status: 'queued',
            createdAt: new Date()
        };

        this.queue.push(fullJob);
        await this.cache.setJobStatus(fullJob);

        console.log(`[JobQueue] Enqueued ${job.type} job: ${job.id}`);
        this.emit('enqueued', fullJob);

        // Start processing if not already running
        this.processNext();

        return fullJob.id;
    }

    async getStatus(jobId: string): Promise<JobInfo | null> {
        // Check in-progress jobs
        const processing = this.processing.get(jobId);
        if (processing) return processing;

        // Check queue
        const queued = this.queue.find(j => j.id === jobId);
        if (queued) return queued;

        // Check cache (for completed jobs)
        return this.cache.getJobStatus(jobId);
    }

    private async processNext(): Promise<void> {
        // Don't process if already at max concurrent
        if (this.processing.size >= this.maxConcurrent) return;

        // Get next job
        const job = this.queue.shift();
        if (!job) return;

        // Mark as processing
        job.status = 'processing';
        job.startedAt = new Date();
        this.processing.set(job.id, job);
        await this.cache.setJobStatus(job);

        console.log(`[JobQueue] Processing ${job.type} job: ${job.id}`);
        this.emit('processing', job);

        // Get handler and execute
        const handler = this.handlers.get(job.type);
        if (!handler) {
            job.status = 'failed';
            job.error = `No handler for job type: ${job.type}`;
            this.processing.delete(job.id);
            await this.cache.setJobStatus(job);
            this.emit('failed', job);
            this.processNext();
            return;
        }

        try {
            await handler(job);
            job.status = 'complete';
            job.completedAt = new Date();
            console.log(`[JobQueue] Completed ${job.type} job: ${job.id}`);
        } catch (error) {
            job.status = 'failed';
            job.error = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[JobQueue] Failed ${job.type} job: ${job.id}`, error);
        }

        this.processing.delete(job.id);
        await this.cache.setJobStatus(job);
        this.emit(job.status, job);

        // Process next job
        this.processNext();
    }

    getQueueStatus(): { queued: number; processing: number } {
        return {
            queued: this.queue.length,
            processing: this.processing.size
        };
    }
}

// ============================================================================
// Unified Media Storage Manager
// ============================================================================

export class MediaStorageManager {
    public postgres: PostgresMediaStore;
    public redis: RedisMediaCache;
    public jobQueue: MediaJobQueue;

    private postgresEnabled = false;
    private redisEnabled = false;

    constructor() {
        this.postgres = new PostgresMediaStore();
        this.redis = new RedisMediaCache();
        this.jobQueue = new MediaJobQueue(this.redis);
    }

    async initialize(): Promise<void> {
        // Connect to PostgreSQL if available
        const dbUrl = process.env.DATABASE_URL;
        if (dbUrl) {
            this.postgresEnabled = await this.postgres.connect(dbUrl);
        }

        // Connect to Redis if available
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redisEnabled = await this.redis.connect(redisUrl);

        console.log('[MediaStorage] Initialized:', {
            postgres: this.postgresEnabled,
            redis: this.redisEnabled
        });
    }

    /**
     * Get artifact with multi-layer lookup:
     * 1. Redis cache (fastest)
     * 2. PostgreSQL (persistent)
     * 3. Return null (not found)
     */
    async get(cacheKey: string): Promise<MediaArtifact | null> {
        // L1: Redis cache
        if (this.redisEnabled) {
            const cached = await this.redis.get(cacheKey);
            if (cached) return cached;
        }

        // L2: PostgreSQL
        if (this.postgresEnabled) {
            const artifact = await this.postgres.get(cacheKey);
            if (artifact) {
                // Backfill cache
                if (this.redisEnabled) {
                    await this.redis.set(artifact);
                }
                return artifact;
            }
        }

        return null;
    }

    /**
     * Save artifact to both stores
     */
    async save(artifact: MediaArtifact): Promise<void> {
        // Save to PostgreSQL
        if (this.postgresEnabled) {
            await this.postgres.upsert(artifact);
        }

        // Save to Redis
        if (this.redisEnabled) {
            await this.redis.set(artifact);
        }
    }

    /**
     * Update artifact status
     */
    async updateStatus(cacheKey: string, status: MediaArtifact['status'], updates?: Partial<MediaArtifact>): Promise<void> {
        // Update PostgreSQL
        if (this.postgresEnabled) {
            await this.postgres.updateStatus(cacheKey, status, updates);
        }

        // Invalidate Redis cache
        if (this.redisEnabled) {
            await this.redis.delete(cacheKey);
        }
    }

    /**
     * List all artifacts
     */
    async list(filter?: { type?: 'image' | 'video'; status?: string; limit?: number }): Promise<MediaArtifact[]> {
        if (this.postgresEnabled) {
            return this.postgres.list(filter);
        }
        return [];
    }

    /**
     * Enqueue a generation job
     */
    async enqueueJob(job: Omit<JobInfo, 'status' | 'createdAt'>): Promise<string> {
        return this.jobQueue.enqueue(job);
    }

    /**
     * Get job status
     */
    async getJobStatus(jobId: string): Promise<JobInfo | null> {
        return this.jobQueue.getStatus(jobId);
    }

    /**
     * Register job handler
     */
    registerHandler(type: 'image' | 'video', handler: JobHandler): void {
        this.jobQueue.registerHandler(type, handler);
    }

    /**
     * Get storage status
     */
    getStatus(): { postgres: boolean; redis: boolean; queue: { queued: number; processing: number } } {
        return {
            postgres: this.postgresEnabled,
            redis: this.redisEnabled,
            queue: this.jobQueue.getQueueStatus()
        };
    }

    async close(): Promise<void> {
        await this.postgres.close();
        await this.redis.close();
    }
}

// Export singleton
export const mediaStorage = new MediaStorageManager();
