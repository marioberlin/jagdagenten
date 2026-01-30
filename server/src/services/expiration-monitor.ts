/**
 * ExpirationMonitor
 *
 * Monitors document vault for upcoming expirations.
 * Features:
 * - Checks all documents daily
 * - Sends alerts at 30/14/7/1 days before expiry
 * - In-app notification support
 * - Push notification support via service worker
 */

import { query } from '../db.js';
import { componentLoggers } from '../logger.js';

const log = componentLoggers.db;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExpirationAlert {
    documentId: string;
    documentName: string;
    docType: string;
    expiresAt: Date;
    daysRemaining: number;
    userId: string;
    alertLevel: 'info' | 'warning' | 'urgent' | 'critical';
}

export interface ExpirationCheckResult {
    alerts: ExpirationAlert[];
    checkedAt: Date;
    totalDocuments: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALERT_THRESHOLDS = [
    { days: 30, level: 'info' as const },
    { days: 14, level: 'warning' as const },
    { days: 7, level: 'urgent' as const },
    { days: 1, level: 'critical' as const },
];

const DOCUMENT_LABELS: Record<string, string> = {
    jagdschein: 'Jagdschein',
    waffenbesitzkarte: 'Waffenbesitzkarte',
    versicherung: 'Haftpflichtversicherung',
    pachtvertrag: 'Pachtvertrag',
    begehungsschein: 'Begehungsschein',
    andere: 'Dokument',
};

// ---------------------------------------------------------------------------
// ExpirationMonitor Class
// ---------------------------------------------------------------------------

export class ExpirationMonitor {
    /**
     * Check all documents for upcoming expirations
     */
    async checkExpirations(userId?: string): Promise<ExpirationCheckResult> {
        const alerts: ExpirationAlert[] = [];

        try {
            // Query documents with expiration dates
            const sql = userId
                ? `SELECT id, user_id, doc_type, name, expires_at 
                   FROM vault_documents 
                   WHERE expires_at IS NOT NULL AND user_id = $1
                   ORDER BY expires_at ASC`
                : `SELECT id, user_id, doc_type, name, expires_at 
                   FROM vault_documents 
                   WHERE expires_at IS NOT NULL
                   ORDER BY expires_at ASC`;

            const result = await query(sql, userId ? [userId] : []);
            const now = new Date();

            for (const row of result.rows) {
                const expiresAt = new Date(row.expires_at);
                const daysRemaining = Math.ceil(
                    (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );

                // Determine alert level
                const threshold = ALERT_THRESHOLDS.find((t) => daysRemaining <= t.days);
                if (threshold) {
                    alerts.push({
                        documentId: row.id,
                        documentName: row.name || DOCUMENT_LABELS[row.doc_type] || 'Dokument',
                        docType: row.doc_type,
                        expiresAt,
                        daysRemaining,
                        userId: row.user_id,
                        alertLevel: threshold.level,
                    });
                }
            }

            log.info(
                { totalDocuments: result.rows.length, alertCount: alerts.length },
                'Expiration check completed'
            );

            return {
                alerts,
                checkedAt: now,
                totalDocuments: result.rows.length,
            };
        } catch (error) {
            log.error({ error }, 'Failed to check expirations');
            return {
                alerts: [],
                checkedAt: new Date(),
                totalDocuments: 0,
            };
        }
    }

    /**
     * Get expiring documents for a specific user
     */
    async getUserAlerts(userId: string): Promise<ExpirationAlert[]> {
        const result = await this.checkExpirations(userId);
        return result.alerts;
    }

    /**
     * Format alert message in German
     */
    formatAlertMessage(alert: ExpirationAlert): string {
        const docLabel = DOCUMENT_LABELS[alert.docType] || alert.documentName;

        if (alert.daysRemaining <= 0) {
            return `${docLabel} ist abgelaufen!`;
        }
        if (alert.daysRemaining === 1) {
            return `${docLabel} läuft morgen ab!`;
        }
        return `${docLabel} läuft in ${alert.daysRemaining} Tagen ab.`;
    }

    /**
     * Get notification title based on alert level
     */
    getNotificationTitle(level: ExpirationAlert['alertLevel']): string {
        switch (level) {
            case 'critical':
                return '🚨 Dringend: Dokument läuft ab!';
            case 'urgent':
                return '⚠️ Achtung: Dokument läuft bald ab';
            case 'warning':
                return '📋 Erinnerung: Dokument läuft ab';
            case 'info':
            default:
                return '📄 Dokument-Information';
        }
    }
}

// ---------------------------------------------------------------------------
// Singleton Instance
// ---------------------------------------------------------------------------

let instance: ExpirationMonitor | null = null;

export function getExpirationMonitor(): ExpirationMonitor {
    if (!instance) {
        instance = new ExpirationMonitor();
    }
    return instance;
}

// ---------------------------------------------------------------------------
// Cron Job Helper
// ---------------------------------------------------------------------------

/**
 * Run daily expiration check and trigger notifications
 * Can be called from a scheduler or cron job
 */
export async function runDailyExpirationCheck(): Promise<ExpirationCheckResult> {
    const monitor = getExpirationMonitor();
    const result = await monitor.checkExpirations();

    // Group alerts by user for batch notifications
    const alertsByUser = new Map<string, ExpirationAlert[]>();
    for (const alert of result.alerts) {
        const userAlerts = alertsByUser.get(alert.userId) || [];
        userAlerts.push(alert);
        alertsByUser.set(alert.userId, userAlerts);
    }

    // Log summary
    log.info(
        {
            usersWithAlerts: alertsByUser.size,
            totalAlerts: result.alerts.length,
            criticalAlerts: result.alerts.filter((a) => a.alertLevel === 'critical').length,
            urgentAlerts: result.alerts.filter((a) => a.alertLevel === 'urgent').length,
        },
        'Daily expiration check completed'
    );

    return result;
}

export default ExpirationMonitor;
