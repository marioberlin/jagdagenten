/**
 * Migration Runner
 * 
 * Automatically runs pending SQL migrations on server startup.
 * Tracks applied migrations in a `_migrations` table.
 */

import { Pool } from 'pg';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

interface MigrationRecord {
    id: number;
    name: string;
    applied_at: Date;
}

export class MigrationRunner {
    private pool: Pool;
    private migrationsDir: string;

    constructor(connectionString: string, migrationsDir?: string) {
        this.pool = new Pool({ connectionString });
        this.migrationsDir = migrationsDir || join(import.meta.dir, '../sql');
    }

    /**
     * Ensure the migrations tracking table exists
     */
    private async ensureMigrationsTable(): Promise<void> {
        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
    }

    /**
     * Get list of already applied migrations
     */
    private async getAppliedMigrations(): Promise<Set<string>> {
        const result = await this.pool.query<MigrationRecord>(
            'SELECT name FROM _migrations ORDER BY id'
        );
        return new Set(result.rows.map(row => row.name));
    }

    /**
     * Get all migration files from the SQL directory
     */
    private getMigrationFiles(): string[] {
        try {
            const files = readdirSync(this.migrationsDir);
            return files
                .filter(f => f.endsWith('.sql') && /^\d{3}_/.test(f))
                .sort(); // Ensures numerical order: 001_, 002_, etc.
        } catch (error) {
            console.warn('[Migrations] Could not read migrations directory:', error);
            return [];
        }
    }

    /**
     * Run a single migration
     */
    private async runMigration(filename: string): Promise<void> {
        const filepath = join(this.migrationsDir, filename);
        const sql = readFileSync(filepath, 'utf-8');

        await this.pool.query('BEGIN');
        try {
            await this.pool.query(sql);
            await this.pool.query(
                'INSERT INTO _migrations (name) VALUES ($1)',
                [filename]
            );
            await this.pool.query('COMMIT');
            console.log(`[Migrations] ✅ Applied: ${filename}`);
        } catch (error) {
            await this.pool.query('ROLLBACK');
            throw error;
        }
    }

    /**
     * Run all pending migrations
     * Returns the count of migrations applied
     */
    async runPending(): Promise<number> {
        await this.ensureMigrationsTable();

        const applied = await this.getAppliedMigrations();
        const allFiles = this.getMigrationFiles();
        const pending = allFiles.filter(f => !applied.has(f));

        if (pending.length === 0) {
            console.log('[Migrations] ✅ All migrations up to date');
            return 0;
        }

        console.log(`[Migrations] Found ${pending.length} pending migrations`);

        for (const filename of pending) {
            await this.runMigration(filename);
        }

        console.log(`[Migrations] ✅ Applied ${pending.length} migrations`);
        return pending.length;
    }

    /**
     * Get status of all migrations
     */
    async getStatus(): Promise<{ applied: string[]; pending: string[] }> {
        await this.ensureMigrationsTable();

        const applied = await this.getAppliedMigrations();
        const allFiles = this.getMigrationFiles();
        const pending = allFiles.filter(f => !applied.has(f));

        return {
            applied: Array.from(applied),
            pending,
        };
    }

    /**
     * Close the database connection
     */
    async close(): Promise<void> {
        await this.pool.end();
    }
}

/**
 * Run migrations as a standalone script
 */
export async function runMigrations(connectionString?: string): Promise<void> {
    const connString = connectionString ||
        process.env.DATABASE_URL ||
        'postgresql://jagdagenten:jagdagenten_dev@localhost:5432/jagdagenten';

    const runner = new MigrationRunner(connString);

    try {
        await runner.runPending();
    } finally {
        await runner.close();
    }
}

// Allow running directly: bun run migrations.ts
if (import.meta.main) {
    runMigrations().catch(err => {
        console.error('[Migrations] ❌ Error:', err);
        process.exit(1);
    });
}
