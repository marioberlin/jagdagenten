/**
 * Report Handler Service
 *
 * Handles content reports and moderation queue.
 */

import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContentReport {
    id: string;
    reporterId?: string;
    contentType: 'sighting' | 'story' | 'invite' | 'comment';
    contentId: string;
    reason: ReportReason;
    description?: string;
    status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
    reviewerId?: string;
    reviewedAt?: string;
    actionTaken?: ReportAction;
    actionNotes?: string;
    createdAt: string;
}

export type ReportReason =
    | 'location_exposed'
    | 'illegal_content'
    | 'defamation'
    | 'harassment'
    | 'spam'
    | 'protected_species'
    | 'misleading'
    | 'other';

export type ReportAction =
    | 'none'
    | 'warning_issued'
    | 'content_hidden'
    | 'content_deleted'
    | 'user_warned'
    | 'user_suspended';

export interface ReportStats {
    pending: number;
    reviewedToday: number;
    actionedToday: number;
    totalReports: number;
}

// ---------------------------------------------------------------------------
// In-Memory Store
// ---------------------------------------------------------------------------

const reportStore = new Map<string, ContentReport>();

// Auto-hide threshold (reports before auto-hiding content)
const AUTO_HIDE_THRESHOLD = 3;

// ---------------------------------------------------------------------------
// Report Management
// ---------------------------------------------------------------------------

/**
 * Create a new content report
 */
export function createReport(
    contentType: ContentReport['contentType'],
    contentId: string,
    reason: ReportReason,
    description?: string,
    reporterId?: string
): ContentReport {
    const report: ContentReport = {
        id: randomUUID(),
        reporterId,
        contentType,
        contentId,
        reason,
        description,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };

    reportStore.set(report.id, report);

    // Check if auto-hide threshold reached
    checkAutoHideThreshold(contentType, contentId);

    return report;
}

/**
 * Get report by ID
 */
export function getReport(reportId: string): ContentReport | undefined {
    return reportStore.get(reportId);
}

/**
 * Get all pending reports
 */
export function getPendingReports(): ContentReport[] {
    return Array.from(reportStore.values())
        .filter(r => r.status === 'pending')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get reports for specific content
 */
export function getReportsForContent(
    contentType: ContentReport['contentType'],
    contentId: string
): ContentReport[] {
    return Array.from(reportStore.values()).filter(
        r => r.contentType === contentType && r.contentId === contentId
    );
}

/**
 * Review a report
 */
export function reviewReport(
    reportId: string,
    reviewerId: string,
    action: ReportAction,
    notes?: string
): ContentReport | null {
    const report = reportStore.get(reportId);
    if (!report) return null;

    report.status = action === 'none' ? 'dismissed' : 'actioned';
    report.reviewerId = reviewerId;
    report.reviewedAt = new Date().toISOString();
    report.actionTaken = action;
    report.actionNotes = notes;

    reportStore.set(reportId, report);

    return report;
}

/**
 * Check if content should be auto-hidden based on report count
 */
function checkAutoHideThreshold(
    contentType: ContentReport['contentType'],
    contentId: string
): boolean {
    const reports = getReportsForContent(contentType, contentId);
    const pendingReports = reports.filter(r => r.status === 'pending');

    if (pendingReports.length >= AUTO_HIDE_THRESHOLD) {
        // In production, this would trigger content hiding
        console.log(`Auto-hide threshold reached for ${contentType}:${contentId}`);
        return true;
    }

    return false;
}

/**
 * Get report statistics
 */
export function getReportStats(): ReportStats {
    const reports = Array.from(reportStore.values());
    const today = new Date().toISOString().split('T')[0];

    return {
        pending: reports.filter(r => r.status === 'pending').length,
        reviewedToday: reports.filter(
            r => r.reviewedAt?.startsWith(today)
        ).length,
        actionedToday: reports.filter(
            r => r.reviewedAt?.startsWith(today) && r.status === 'actioned'
        ).length,
        totalReports: reports.length,
    };
}

/**
 * Get reason labels (for UI)
 */
export function getReasonLabels(): Record<ReportReason, string> {
    return {
        location_exposed: 'Standort zu genau',
        illegal_content: 'Illegaler Inhalt',
        defamation: 'Verleumdung',
        harassment: 'Belästigung',
        spam: 'Spam',
        protected_species: 'Geschützte Art (unbelegte Behauptung)',
        misleading: 'Irreführend',
        other: 'Sonstiges',
    };
}

/**
 * Get action labels (for UI)
 */
export function getActionLabels(): Record<ReportAction, string> {
    return {
        none: 'Keine Aktion',
        warning_issued: 'Warnung ausgesprochen',
        content_hidden: 'Inhalt versteckt',
        content_deleted: 'Inhalt gelöscht',
        user_warned: 'Benutzer verwarnt',
        user_suspended: 'Benutzer gesperrt',
    };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export default {
    createReport,
    getReport,
    getPendingReports,
    getReportsForContent,
    reviewReport,
    getReportStats,
    getReasonLabels,
    getActionLabels,
    AUTO_HIDE_THRESHOLD,
};
