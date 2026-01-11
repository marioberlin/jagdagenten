/**
 * Self-Healing System Types
 *
 * @see docs/IMPLEMENTATION_PLAN.md - Item 4.2 Self-Healing Production Loop
 */

/**
 * Error report from client or server
 */
export interface ErrorReport {
    /** Type of error */
    type: 'client_error' | 'server_error' | 'security_breach';
    /** Error message */
    message: string;
    /** Stack trace if available */
    stack?: string;
    /** Additional context */
    context: {
        /** Component that threw the error */
        componentName?: string;
        /** URL where error occurred */
        url?: string;
        /** User agent string */
        userAgent?: string;
        /** Request ID for correlation */
        requestId?: string;
        /** Error level (component, page, app) */
        level?: 'component' | 'page' | 'app';
        /** Number of times this error has occurred */
        errorCount?: number;
        /** Additional metadata */
        [key: string]: unknown;
    };
    /** When the error occurred */
    timestamp: string;
}

/**
 * Healing PRD story for Ralph loop
 */
export interface HealingStory {
    /** Story ID */
    id: string;
    /** Story title */
    title: string;
    /** Detailed description */
    description: string;
    /** Acceptance criteria */
    acceptanceCriteria: string[];
    /** Files likely to be affected */
    affectedFiles: string[];
    /** Estimated complexity (1-5) */
    complexity: number;
}

/**
 * Complete Healing PRD for automated fixes
 */
export interface HealingPRD {
    /** Unique PRD ID */
    id: string;
    /** PRD title */
    title: string;
    /** Summary of the issue */
    summary: string;
    /** Root cause analysis */
    rootCause: string;
    /** Individual stories to fix the issue */
    stories: HealingStory[];
    /** Original error hash */
    errorHash: string;
    /** Priority level */
    priority: 'critical' | 'high' | 'medium' | 'low';
    /** Creation timestamp */
    createdAt: string;
    /** PRD status */
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    /** Related error reports */
    relatedErrors: string[];
}

/**
 * Healing task in the queue
 */
export interface HealingTask {
    /** Unique task ID */
    id: string;
    /** Error report that triggered this task */
    errorReport: ErrorReport;
    /** Generated PRD (if analysis complete) */
    prd?: HealingPRD;
    /** Task status */
    status: 'queued' | 'analyzing' | 'prd_ready' | 'healing' | 'verifying' | 'completed' | 'failed';
    /** Number of healing attempts */
    attempts: number;
    /** Maximum retry attempts */
    maxAttempts: number;
    /** Last error during healing */
    lastError?: string;
    /** Created timestamp */
    createdAt: string;
    /** Updated timestamp */
    updatedAt: string;
    /** Branch name if PR created */
    healingBranch?: string;
    /** PR URL if created */
    pullRequestUrl?: string;
}

/**
 * Result from the healing loop
 */
export interface HealingResult {
    /** Whether healing succeeded */
    success: boolean;
    /** Git branch with fixes */
    branch?: string;
    /** Files that were modified */
    modifiedFiles?: string[];
    /** Error if healing failed */
    error?: string;
    /** Duration of healing in ms */
    duration: number;
}

/**
 * Deduplication entry for error tracking
 */
export interface ErrorDedupeEntry {
    /** Hash of the error */
    hash: string;
    /** Number of occurrences */
    count: number;
    /** First occurrence */
    firstSeen: string;
    /** Last occurrence */
    lastSeen: string;
    /** Whether healing is in progress */
    healingInProgress: boolean;
    /** Last healing attempt timestamp */
    lastHealingAttempt?: string;
}

/**
 * Self-healing queue status
 */
export interface HealingQueueStatus {
    /** Total tasks in queue */
    total: number;
    /** Tasks by status */
    byStatus: Record<HealingTask['status'], number>;
    /** Active healing tasks */
    activeHealing: number;
    /** Successfully healed count */
    successCount: number;
    /** Failed healing count */
    failedCount: number;
}

/**
 * AI analysis prompt context
 */
export interface AnalysisContext {
    /** Error report to analyze */
    error: ErrorReport;
    /** Recent similar errors */
    similarErrors?: ErrorReport[];
    /** Relevant code snippets */
    codeContext?: Array<{
        file: string;
        content: string;
        lineNumbers: [number, number];
    }>;
    /** Project structure hints */
    projectStructure?: string[];
}
