/**
 * k-Anonymity Service
 *
 * Ensures aggregated data cannot be traced back to individuals by
 * requiring a minimum number of contributors before showing statistics.
 *
 * k-Anonymity means each data point must be indistinguishable from
 * at least k-1 other data points.
 *
 * Reference: EU GDPR recital 26 on anonymous information
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Minimum number of unique contributors required before showing aggregate data.
 * This is the "k" in k-anonymity.
 *
 * k=10 is a common conservative threshold that provides strong privacy
 * while still allowing useful aggregation in active areas.
 */
export const K_THRESHOLD = 10;

/**
 * Minimum number of data points required for trend calculations.
 * Higher than K_THRESHOLD to ensure statistical significance.
 */
export const TREND_MIN_DATAPOINTS = 20;

/**
 * Minimum time window for aggregation (in days)
 */
export const MIN_AGGREGATION_WINDOW_DAYS = 7;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AggregateData {
    gridCell: string;
    species: string;
    timeWindow: string;
    count: number;
    contributorCount: number;
    trendPercentage?: number;
}

export interface KAnonymityResult {
    isAnonymous: boolean;
    contributorCount: number;
    threshold: number;
    shortfall: number;
}

// ---------------------------------------------------------------------------
// k-Anonymity Checks
// ---------------------------------------------------------------------------

/**
 * Check if an aggregate meets the k-anonymity threshold
 *
 * @param contributorCount - Number of unique contributors
 * @param threshold - k threshold (default: K_THRESHOLD)
 * @returns Whether the aggregate is safe to publish
 */
export function meetsKAnonymity(
    contributorCount: number,
    threshold: number = K_THRESHOLD
): boolean {
    return contributorCount >= threshold;
}

/**
 * Check k-anonymity and return detailed result
 */
export function checkKAnonymity(
    contributorCount: number,
    threshold: number = K_THRESHOLD
): KAnonymityResult {
    return {
        isAnonymous: contributorCount >= threshold,
        contributorCount,
        threshold,
        shortfall: Math.max(0, threshold - contributorCount),
    };
}

/**
 * Filter aggregates to only include those meeting k-anonymity
 *
 * @param aggregates - Array of aggregate data
 * @param threshold - k threshold
 * @returns Filtered array with only k-anonymous aggregates
 */
export function filterKAnonymous<T extends { contributorCount: number }>(
    aggregates: T[],
    threshold: number = K_THRESHOLD
): T[] {
    return aggregates.filter(a => meetsKAnonymity(a.contributorCount, threshold));
}

/**
 * Apply k-anonymity to trend data
 * Ensures both current and previous period have enough contributors
 */
export function isKAnonymousTrend(
    currentContributors: number,
    previousContributors: number,
    threshold: number = K_THRESHOLD
): boolean {
    return (
        currentContributors >= threshold &&
        previousContributors >= threshold
    );
}

// ---------------------------------------------------------------------------
// Data Suppression
// ---------------------------------------------------------------------------

/**
 * Suppress small counts to prevent identification
 * Replaces exact counts with ranges when below threshold
 *
 * @param count - Actual count
 * @param contributorCount - Number of contributors
 * @returns Display-safe count string
 */
export function suppressSmallCount(
    count: number,
    contributorCount: number
): string {
    if (!meetsKAnonymity(contributorCount)) {
        return '<10'; // Suppress exact count
    }

    // Round to nearest 5 for additional privacy
    if (count < 20) {
        return '10-20';
    }

    return Math.round(count / 5) * 5 + '+';
}

/**
 * Suppress trend percentage if insufficient data
 */
export function suppressTrend(
    trendPercentage: number | undefined,
    currentContributors: number,
    previousContributors: number
): string | null {
    if (trendPercentage === undefined) return null;

    if (!isKAnonymousTrend(currentContributors, previousContributors)) {
        return null; // Don't show trend
    }

    // Round to nearest 5% for privacy
    const rounded = Math.round(trendPercentage / 5) * 5;
    return rounded >= 0 ? `+${rounded}%` : `${rounded}%`;
}

// ---------------------------------------------------------------------------
// Contributor Counting
// ---------------------------------------------------------------------------

/**
 * Count unique contributors from a list of user IDs
 * Uses a Set for deduplication
 */
export function countUniqueContributors(userIds: string[]): number {
    return new Set(userIds).size;
}

/**
 * Safely increment contributor count in an aggregate
 * Only counts each user once per aggregate
 */
export function incrementContributorCount(
    existingContributors: Set<string>,
    newUserId: string
): number {
    existingContributors.add(newUserId);
    return existingContributors.size;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate that an aggregation time window is long enough
 */
export function isValidAggregationWindow(
    startDate: Date,
    endDate: Date
): boolean {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= MIN_AGGREGATION_WINDOW_DAYS;
}

/**
 * Get ISO week string for a date (for weekly aggregation)
 * Format: "2026-W05"
 */
export function getISOWeek(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(
        ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
    return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export default {
    K_THRESHOLD,
    TREND_MIN_DATAPOINTS,
    MIN_AGGREGATION_WINDOW_DAYS,
    meetsKAnonymity,
    checkKAnonymity,
    filterKAnonymous,
    isKAnonymousTrend,
    suppressSmallCount,
    suppressTrend,
    countUniqueContributors,
    incrementContributorCount,
    isValidAggregationWindow,
    getISOWeek,
};
