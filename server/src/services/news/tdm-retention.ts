/**
 * TDM Retention Cleanup Service
 *
 * Automates deletion of news/TDM content per UrhG §44b and EU DSM Article 4:
 * - Delete copies when no longer necessary
 * - Respect opt-out signals
 * - Maintain audit trail
 */

import { db } from '../../db/index.js';

// ============================================================================
// Configuration
// ============================================================================

export interface RetentionPolicy {
    /** Max days to retain raw article content */
    maxContentRetentionDays: number;
    /** Max days to retain metadata only */
    maxMetadataRetentionDays: number;
    /** Max days to retain derived embeddings */
    maxEmbeddingRetentionDays: number;
    /** Grace period after opt-out before deletion */
    optOutGracePeriodHours: number;
}

const DEFAULT_POLICY: RetentionPolicy = {
    maxContentRetentionDays: 30,     // Raw content deleted after 30 days
    maxMetadataRetentionDays: 365,   // Metadata kept for 1 year
    maxEmbeddingRetentionDays: 90,   // Embeddings deleted after 90 days
    optOutGracePeriodHours: 24,      // 24h grace after opt-out detected
};

// ============================================================================
// Cleanup Results
// ============================================================================

export interface CleanupResult {
    timestamp: string;
    contentDeleted: number;
    embeddingsDeleted: number;
    metadataDeleted: number;
    optOutsProcessed: number;
    errors: string[];
}

// ============================================================================
// TDM Retention Service
// ============================================================================

export class TDMRetentionService {
    private policy: RetentionPolicy;

    constructor(policy: Partial<RetentionPolicy> = {}) {
        this.policy = { ...DEFAULT_POLICY, ...policy };
    }

    /**
     * Run full cleanup cycle
     */
    async runCleanup(): Promise<CleanupResult> {
        const result: CleanupResult = {
            timestamp: new Date().toISOString(),
            contentDeleted: 0,
            embeddingsDeleted: 0,
            metadataDeleted: 0,
            optOutsProcessed: 0,
            errors: [],
        };

        try {
            // 1. Process opt-outs first (highest priority)
            result.optOutsProcessed = await this.processOptOuts();

            // 2. Delete expired raw content
            result.contentDeleted = await this.deleteExpiredContent();

            // 3. Delete expired embeddings
            result.embeddingsDeleted = await this.deleteExpiredEmbeddings();

            // 4. Delete expired metadata
            result.metadataDeleted = await this.deleteExpiredMetadata();

            // 5. Log cleanup run
            await this.logCleanupRun(result);

        } catch (error) {
            result.errors.push(error instanceof Error ? error.message : String(error));
        }

        return result;
    }

    /**
     * Process sources that have opted out of TDM
     */
    private async processOptOuts(): Promise<number> {
        const graceDate = new Date();
        graceDate.setHours(graceDate.getHours() - this.policy.optOutGracePeriodHours);

        // Find articles from opted-out sources past grace period
        const optedOut = await db.query(`
            SELECT na.id, na.source_id, ns.name as source_name
            FROM news_articles na
            JOIN news_sources ns ON na.source_id = ns.id
            WHERE ns.tdm_opt_out = true
              AND ns.opt_out_detected_at < $1
              AND na.content_deleted_at IS NULL
        `, [graceDate.toISOString()]);

        if (optedOut.rows.length === 0) return 0;

        // Delete content from opted-out sources
        const ids = optedOut.rows.map(r => r.id);
        await db.query(`
            UPDATE news_articles
            SET 
                raw_content = NULL,
                content_hash = NULL,
                embeddings = NULL,
                content_deleted_at = NOW(),
                deletion_reason = 'TDM opt-out',
                updated_at = NOW()
            WHERE id = ANY($1)
        `, [ids]);

        return ids.length;
    }

    /**
     * Delete raw content past retention period
     */
    private async deleteExpiredContent(): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.policy.maxContentRetentionDays);

        const result = await db.query(`
            UPDATE news_articles
            SET 
                raw_content = NULL,
                content_hash = NULL,
                content_deleted_at = NOW(),
                deletion_reason = 'Retention policy',
                updated_at = NOW()
            WHERE raw_content IS NOT NULL
              AND created_at < $1
              AND content_deleted_at IS NULL
        `, [cutoffDate.toISOString()]);

        return result.rowCount || 0;
    }

    /**
     * Delete embeddings past retention period
     */
    private async deleteExpiredEmbeddings(): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.policy.maxEmbeddingRetentionDays);

        const result = await db.query(`
            UPDATE news_articles
            SET 
                embeddings = NULL,
                updated_at = NOW()
            WHERE embeddings IS NOT NULL
              AND created_at < $1
        `, [cutoffDate.toISOString()]);

        return result.rowCount || 0;
    }

    /**
     * Delete full metadata past retention period
     */
    private async deleteExpiredMetadata(): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.policy.maxMetadataRetentionDays);

        const result = await db.query(`
            DELETE FROM news_articles
            WHERE created_at < $1
        `, [cutoffDate.toISOString()]);

        return result.rowCount || 0;
    }

    /**
     * Log cleanup run for audit trail
     */
    private async logCleanupRun(result: CleanupResult): Promise<void> {
        await db.query(`
            INSERT INTO tdm_cleanup_log (
                run_at,
                content_deleted,
                embeddings_deleted,
                metadata_deleted,
                opt_outs_processed,
                errors,
                policy_snapshot
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            result.timestamp,
            result.contentDeleted,
            result.embeddingsDeleted,
            result.metadataDeleted,
            result.optOutsProcessed,
            JSON.stringify(result.errors),
            JSON.stringify(this.policy),
        ]);
    }

    /**
     * Check if a source has opted out of TDM
     */
    async checkSourceOptOut(sourceUrl: string): Promise<boolean> {
        // Check robots.txt for TDM opt-out
        try {
            const robotsUrl = new URL('/robots.txt', sourceUrl).toString();
            const response = await fetch(robotsUrl, {
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) return false;

            const robotsTxt = await response.text();

            // Check for common TDM opt-out patterns
            const optOutPatterns = [
                /User-agent:\s*\*[\s\S]*?Disallow:\s*\/\s*$/mi,
                /User-agent:\s*TDMRep/i,
                /User-agent:\s*CCBot/i,
                /X-Robots-Tag:\s*noai/i,
                /X-Robots-Tag:\s*noimageai/i,
            ];

            return optOutPatterns.some(pattern => pattern.test(robotsTxt));
        } catch {
            return false;
        }
    }

    /**
     * Mark a source as opted out
     */
    async markSourceOptOut(sourceId: string): Promise<void> {
        await db.query(`
            UPDATE news_sources
            SET 
                tdm_opt_out = true,
                opt_out_detected_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
        `, [sourceId]);
    }

    /**
     * Get cleanup statistics
     */
    async getStats(): Promise<{
        totalArticles: number;
        withContent: number;
        withEmbeddings: number;
        optedOutSources: number;
        lastCleanup: string | null;
    }> {
        const stats = await db.query(`
            SELECT 
                COUNT(*) as total_articles,
                COUNT(raw_content) as with_content,
                COUNT(embeddings) as with_embeddings,
                (SELECT COUNT(*) FROM news_sources WHERE tdm_opt_out = true) as opted_out_sources,
                (SELECT MAX(run_at) FROM tdm_cleanup_log) as last_cleanup
            FROM news_articles
        `);

        const row = stats.rows[0];
        return {
            totalArticles: parseInt(row.total_articles) || 0,
            withContent: parseInt(row.with_content) || 0,
            withEmbeddings: parseInt(row.with_embeddings) || 0,
            optedOutSources: parseInt(row.opted_out_sources) || 0,
            lastCleanup: row.last_cleanup,
        };
    }
}

// ============================================================================
// Scheduled Cleanup Job
// ============================================================================

/**
 * Run scheduled cleanup (call from cron or scheduler)
 */
export async function runScheduledCleanup(): Promise<CleanupResult> {
    const service = new TDMRetentionService();
    const result = await service.runCleanup();

    console.log(`[TDM Cleanup] ${result.timestamp}`);
    console.log(`  Content deleted: ${result.contentDeleted}`);
    console.log(`  Embeddings deleted: ${result.embeddingsDeleted}`);
    console.log(`  Metadata deleted: ${result.metadataDeleted}`);
    console.log(`  Opt-outs processed: ${result.optOutsProcessed}`);

    if (result.errors.length > 0) {
        console.error(`  Errors: ${result.errors.join(', ')}`);
    }

    return result;
}

// Export singleton
export const tdmRetentionService = new TDMRetentionService();
